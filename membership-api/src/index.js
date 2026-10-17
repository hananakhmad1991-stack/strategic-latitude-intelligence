/*
 * SLI membership API · Cloudflare Worker reference implementation.
 * Fail closed: no checkout, no signup endpoint, no client-granted entitlements.
 * Requires Supabase Auth asymmetric signing keys (ES256 or RS256), D1 and private R2.
 * Do not deploy before configuring identity provider, secrets, domains and privacy terms.
 */
const JSON_HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"private, no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","vary":"Origin, Authorization"};
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
 const rec=await db.prepare("SELECT plan, status, access_until FROM subscriptions WHERE user_id = ? LIMIT 1").bind(userId).first();
 if(!rec||!["pro","enterprise"].includes(rec.plan)||!["active","trialing"].includes(rec.status))return {plan:"open",status:"free"};
 const until=Date.parse(rec.access_until||"");
 if(!Number.isFinite(until)||until<=Date.now())return {plan:"open",status:"free"};
 return {plan:rec.plan,status:rec.status,access_until:rec.access_until};
}
export default {
 async fetch(request,env){
  const url=new URL(request.url),configured=canonicalOrigin(env.WEB_ORIGIN);
  const incoming=request.headers.get("origin");
  // Bearer auth, never cookies. Reject foreign browser origins; no wildcard CORS.
  if(incoming&&(!configured||incoming!==configured))return fail(403,"origin_denied");
  const origin=incoming===configured?configured:null;
  if(request.method==="OPTIONS"){
   if(!origin)return fail(403,"origin_denied");
   return new Response(null,{status:204,headers:{...headers(origin),"access-control-allow-methods":"GET, OPTIONS","access-control-allow-headers":"authorization, content-type","access-control-max-age":"3600"}});
  }
  if(request.method!=="GET")return fail(405,"method_not_allowed",origin);
  if(url.pathname==="/healthz")return new Response(JSON.stringify({service:"sli-membership-api",state:"prelaunch"}),{headers:headers(origin)});
  if(!["/v1/me","/v1/protected/province-research","/v1/protected/scenario-workbook","/v1/protected/institutional-brief"].includes(url.pathname))
   return fail(404,"not_found",origin);
  // Zero privileged data on GitHub Pages. Private resources are only served by bound R2.
  if(!configured||!env.DB||!env.PREMIUM_BUCKET||!env.SUPABASE_URL)return fail(503,"membership_not_configured",origin);
  const match=(request.headers.get("authorization")||"").match(/^Bearer ([A-Za-z0-9_.-]+)$/);
  if(!match)return fail(401,"authentication_required",origin);
  let userId;try{userId=await verifyUserToken(match[1],env)}catch{return fail(401,"invalid_token",origin)}
  let membership;try{membership=await getEntitlement(userId,env.DB)}catch{return fail(503,"entitlement_unavailable",origin)}
  if(url.pathname==="/v1/me")return new Response(JSON.stringify({plan:membership.plan,status:membership.status,access_until:membership.access_until||null}),{headers:headers(origin)});
  const name=url.pathname.split("/").pop(),resource=RESOURCES[name];
  if(RANK[membership.plan]<RANK[resource.tier])return fail(403,"upgrade_required",origin);
  try{
   const blob=await env.PREMIUM_BUCKET.get(resource.key);
   if(!blob)return fail(404,"resource_not_published",origin);
   return new Response(blob.body,{status:200,headers:{...headers(origin),"content-type":resource.type,"content-disposition":"attachment; filename=\""+name+(resource.type.startsWith("text/csv")?".csv":".json")+"\""}});
  }catch{return fail(503,"premium_storage_unavailable",origin)}
 }
};
