import {PLANS,effectivePlan,canAccess} from './access.mjs';
import {issueSession,verifySession,revokeSession,revokeAllSessions} from './sessions.mjs';
import {verifyBillingSignature,processBillingEvent} from './billing.mjs';
/*
 * SLI membership API · Cloudflare Worker reference implementation.
 * Fail closed: no checkout, no signup endpoint, no client-granted entitlements.
 * Requires Supabase Auth asymmetric signing keys (ES256 or RS256), D1 and private R2.
 * Do not deploy before configuring identity provider, secrets, domains and privacy terms.
 */
const JSON_HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"private, no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","vary":"Origin, Authorization, X-SLI-Session"};
const RESOURCES=Object.freeze({
 "province-research":{tier:"pro",key:"pro/province-research.json",type:"application/json; charset=utf-8"},
 "scenario-workbook":{tier:"pro",key:"pro/scenario-workbook.csv",type:"text/csv; charset=utf-8"},
 "institutional-brief":{tier:"enterprise",key:"enterprise/institutional-brief.json",type:"application/json; charset=utf-8"}
});
const RANK={open:0,pro:1,enterprise:2};
const fail=(status,code,origin)=>new Response(JSON.stringify({error:code}),{status,headers:headers(origin)});
function headers(origin){return {...JSON_HEADERS,...(origin?{"access-control-allow-origin":origin}:{})}}
function canonicalOrigin(input){
 try{const u=new URL(input);if(u.protocol!=="https:"||u.username||u.password||u.pathname!=="/"||u.search||u.hash)return null;return u.origin}catch{return null}
}
function parseTokenSection(part){
 if(!/^[A-Za-z0-9_-]{1,12000}$/.test(part))throw Error("malformed token");
 const binary=atob(part.replace(/-/g,"+").replace(/_/g,"/"));
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
function decodeJSON(part){return JSON.parse(new TextDecoder().decode(parseTokenSection(part)))}
export async function verifyUserToken(token,env,networkFetch=fetch){
 if(!token||token.length>10000)throw Error("token absent");
 const parts=token.split(".");if(parts.length!==3)throw Error("token parts");
 const header=decodeJSON(parts[0]),payload=decodeJSON(parts[1]);
 if(!["RS256","ES256"].includes(header.alg)||typeof header.kid!=="string"||header.kid.length>256)throw Error("algorithm");
 const base=canonicalOrigin(env.SUPABASE_URL);
 if(!base||!base.endsWith(".supabase.co"))throw Error("identity not configured");
 const issuer=base+"/auth/v1";
 const now=Math.floor(Date.now()/1000);
 if(payload.iss!==issuer||payload.role!=="authenticated"||
   !(payload.aud==="authenticated"||(Array.isArray(payload.aud)&&payload.aud.includes("authenticated")))||
   !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.sub||"")||
   !Number.isFinite(payload.exp)||now>=payload.exp||
   !Number.isFinite(payload.iat)||payload.iat>now+30||
   (payload.nbf!==undefined&&(!Number.isFinite(payload.nbf)||payload.nbf>now+30)))throw Error("claims");
 const res=await networkFetch(issuer+"/.well-known/jwks.json",{headers:{accept:"application/json"},cache:"no-store"});
 if(!res.ok)throw Error("jwks unavailable");
 const body=await res.json();
 const jwk=Array.isArray(body.keys)?body.keys.find(k=>k.kid===header.kid&&(k.alg===undefined||k.alg===header.alg)):null;
 if(!jwk||jwk.kty!==(header.alg==="ES256"?"EC":"RSA"))throw Error("key missing");
 if(header.alg==="ES256"&&jwk.crv!=="P-256")throw Error("wrong curve");
 const algorithm=header.alg==="ES256"?{name:"ECDSA",namedCurve:"P-256"}:{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"};
 const publicKey=await crypto.subtle.importKey("jwk",jwk,algorithm,false,["verify"]);
 const validation=header.alg==="ES256"?{name:"ECDSA",hash:"SHA-256"}:"RSASSA-PKCS1-v1_5";
 const signed=new TextEncoder().encode(parts[0]+"."+parts[1]);
 const verified=await crypto.subtle.verify(validation,publicKey,parseTokenSection(parts[2]),signed);
 if(!verified)throw Error("signature");
 return payload.sub;
}
async function getEntitlement(userId,db){
 const rec=await db.prepare('SELECT plan,status,access_until FROM subscriptions WHERE user_id=? LIMIT 1').bind(userId).first();
 const plan=effectivePlan(rec);
 return {plan,status:plan==='open'?'free':rec.status,access_until:plan==='open'?null:rec.access_until,session_limit:PLANS[plan].sessions};
}
async function readBodyLimited(req,max=16384){
 const reader=req.body?.getReader();
 if(!reader)return '';
 const chunks=[];let size=0;
 try{
  for(;;){const {value,done}=await reader.read();if(done)break;
   size+=value.byteLength;if(size>max)throw Error('request_too_large');chunks.push(value)}
 }catch(e){try{await reader.cancel()}catch{}throw e}
 finally{try{reader.releaseLock()}catch{}}
 const out=new Uint8Array(size);let offset=0;
 for(const c of chunks){out.set(c,offset);offset+=c.length}
 return new TextDecoder('utf-8',{fatal:true}).decode(out);
}
const json=(status,body,origin)=>new Response(JSON.stringify(body),{status,headers:headers(origin)});
export default {
 async fetch(request,env){
  const url=new URL(request.url),configured=canonicalOrigin(env?.WEB_ORIGIN),incoming=request.headers.get('origin');
  if(incoming&&(!configured||incoming!==configured))return fail(403,'origin_denied');
  const origin=incoming===configured?configured:null;
  if(request.method==='OPTIONS'){
   if(!origin)return fail(403,'origin_denied');
   return new Response(null,{status:204,headers:{...headers(origin),
    'access-control-allow-methods':'GET, POST, DELETE, OPTIONS',
    'access-control-allow-headers':'authorization, content-type, x-sli-session, x-sli-confirm-replace',
    'access-control-max-age':'300'}});
  }
  if(url.pathname==='/healthz'&&request.method==='GET')
    return json(200,{service:'sli-membership-api',state:'prelaunch',billing:'disabled_by_default'},origin);
  // Internal adapter messages are deliberately disabled in production. Never accept browser events.
  if(url.pathname==='/v1/billing/internal-event'){
   if(request.method!=='POST')return fail(405,'method_not_allowed');
   if(incoming)return fail(403,'browser_origin_denied');
   if(env?.ENVIRONMENT!=='staging'||env?.BILLING_STAGING_ENABLED!=='true'||
      !env?.BILLING_WEBHOOK_SECRET||!env?.DB)return fail(503,'billing_disabled');
   const ct=request.headers.get('content-type')||'';
   if(!/^application\/json(?:;|$)/i.test(ct))return fail(415,'json_required');
   let raw;try{raw=await readBodyLimited(request)}catch{return fail(413,'body_too_large')}
   const signature=request.headers.get('x-sli-signature');
   const timestamp=request.headers.get('x-sli-timestamp');
   if(!await verifyBillingSignature(raw,timestamp,signature,env.BILLING_WEBHOOK_SECRET))
     return fail(401,'invalid_billing_signature');
   try{return json(200,await processBillingEvent(raw,env.DB))}
   catch(e){return fail(String(e).includes('invalid_billing')||String(e).includes('unverified_payment')?422:503,'billing_event_rejected')}
  }
  const allowed=['/v1/me','/v1/sessions','/v1/sessions/replace','/v1/sessions/current',
    '/v1/protected/province-research','/v1/protected/scenario-workbook','/v1/protected/institutional-brief'];
  if(!allowed.includes(url.pathname))return fail(404,'not_found',origin);
  if(!configured||!env?.DB||!env?.SUPABASE_URL)return fail(503,'membership_not_configured',origin);
  const match=(request.headers.get('authorization')||'').match(/^Bearer ([A-Za-z0-9_.-]{50,10000})$/);
  if(!match)return fail(401,'authentication_required',origin);
  let userId;try{userId=await verifyUserToken(match[1],env)}catch{return fail(401,'invalid_token',origin)}
  if(url.pathname==='/v1/sessions'||url.pathname==='/v1/sessions/replace'){
   if(request.method!=='POST')return fail(405,'method_not_allowed',origin);
   if(!env.SESSION_LIMITER)return fail(503,'session_rate_limiter_missing',origin);
   let limited;try{limited=await env.SESSION_LIMITER.limit({key:'member:'+userId})}
   catch{return fail(503,'session_rate_limiter_unavailable',origin)}
   if(!limited?.success)return fail(429,'session_rate_limited',origin);
   if(url.pathname==='/v1/sessions/replace'){
    if(request.headers.get('x-sli-confirm-replace')!=='replace')
      return fail(400,'explicit_replacement_confirmation_required',origin);
    try{await revokeAllSessions(userId,env.DB)}
    catch{return fail(503,'session_update_failed',origin)}
   }
   try{
    const issued=await issueSession(userId,env.DB);
    return issued.error?json(409,issued,origin):json(201,issued,origin);
   }catch{return fail(503,'session_unavailable',origin)}
  }
  if(url.pathname==='/v1/sessions/current'){
   if(request.method!=='DELETE')return fail(405,'method_not_allowed',origin);
   try{
    const revoked=await revokeSession(userId,request.headers.get('x-sli-session'),env.DB);
    return revoked?json(200,{revoked:true},origin):fail(404,'session_not_found',origin);
   }catch{return fail(503,'session_unavailable',origin)}
  }
  if(request.method!=='GET')return fail(405,'method_not_allowed',origin);
  let membership;
  try{membership=await getEntitlement(userId,env.DB)}
  catch{return fail(503,'entitlement_unavailable',origin)}
  if(url.pathname==='/v1/me')return json(200,membership,origin);
  // Protected storage and downloads REQUIRE BOTH signed JWT and revocable server session.
  let valid;
  try{valid=await verifySession(userId,request.headers.get('x-sli-session'),env.DB)}
  catch{return fail(503,'session_unavailable',origin)}
  if(!valid)return fail(401,'session_required',origin);
  const name=url.pathname.split('/').pop(),resource=RESOURCES[name];
  if(!canAccess(membership.plan,resource.tier==='enterprise'?'team':'provincial'))
    return fail(403,'upgrade_required',origin);
  if(!env.PREMIUM_BUCKET)return fail(503,'private_storage_not_configured',origin);
  try{
   const blob=await env.PREMIUM_BUCKET.get(resource.key);
   if(!blob)return fail(404,'resource_not_published',origin);
   const extension=resource.type.startsWith('text/csv')?'.csv':'.json';
   return new Response(blob.body,{status:200,headers:{...headers(origin),
    'content-type':resource.type,'content-disposition':'attachment; filename="'+name+extension+'"'}});
  }catch{return fail(503,'premium_storage_unavailable',origin)}
 }
};
