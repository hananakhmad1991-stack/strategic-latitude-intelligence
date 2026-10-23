/* Private Expert CRM Worker — STAGING. Requires Cloudflare Access JWT validation + D1 binding.
   Do not deploy without Access app policy and correct CF_ACCESS_AUD/TEAM_DOMAIN. */
const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const idOk=x=>typeof x==='string'&&/^https:\/\/openalex\.org\/A\d{1,20}$/.test(x);
const short=(s,n=200)=>typeof s==='string'?s.trim().slice(0,n):'';
const b64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
async function owner(req,env){
 const jwt=req.headers.get('cf-access-jwt-assertion');
 if(!jwt||!env.CF_ACCESS_AUD||!env.CF_ACCESS_TEAM_DOMAIN||!env.OWNER_EMAIL)return null;
 const parts=jwt.split('.');if(parts.length!==3)return null;
 let head,payload;try{head=JSON.parse(new TextDecoder().decode(b64(parts[0])));payload=JSON.parse(new TextDecoder().decode(b64(parts[1])))}catch{return null}
 if(head.alg!=='RS256'||typeof head.kid!=='string')return null;
 const team=short(env.CF_ACCESS_TEAM_DOMAIN,250);
 if(!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(team))return null;
 const issuer='https://'+team;
 const now=Math.floor(Date.now()/1000);
 if(payload.iss!==issuer||!Array.isArray(payload.aud)||!payload.aud.includes(env.CF_ACCESS_AUD)||!Number.isInteger(payload.exp)||payload.exp<=now||!Number.isInteger(payload.iat)||payload.iat>now+60||!payload.sub)return null;
 if(String(payload.email||'').toLowerCase()!==env.OWNER_EMAIL.trim().toLowerCase())return null;
 const resp=await fetch(issuer+'/cdn-cgi/access/certs',{cf:{cacheTtl:300,cacheEverything:true}});
 if(!resp.ok)return null;
 const data=await resp.json();const key=(data.keys||[]).find(x=>x.kid===head.kid&&x.kty==='RSA');
 if(!key)return null;
 try{const cryptoKey=await crypto.subtle.importKey('jwk',key,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);return (await crypto.subtle.verify('RSASSA-PKCS1-v1_5',cryptoKey,b64(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))?payload.sub:null}catch{return null}
}
async function body(req){const raw=await req.text();if(raw.length>5000)throw Error('too_large');return JSON.parse(raw)}
export default {async fetch(req,env){
 try{
  const url=new URL(req.url);
  if(url.pathname!=='/api/expert-crm')return json(404,{error:'not_found'});
  if(!env.EXPERT_DB||env.EXPERT_CRM_ENABLED!=='true')return json(503,{error:'crm_not_configured'});
  const actor=await owner(req,env);if(!actor)return json(401,{error:'owner_access_required'});
  if(!['GET','POST','PATCH'].includes(req.method))return json(405,{error:'method_not_allowed'});
  if(req.method!=='GET'){
   if(req.headers.get('origin')!==env.WEB_ORIGIN)return json(403,{error:'origin_denied'});
   if(!/^application\/json(?:;|$)/i.test(req.headers.get('content-type')||''))return json(415,{error:'json_required'});
  }
  if(req.method==='GET'){
   const rows=await env.EXPERT_DB.prepare('SELECT openalex_id,display_name,institution,works_count,cited_by_count,stage,identity_reviewed,consent_verified,updated_at FROM expert_candidates ORDER BY updated_at DESC LIMIT 100').all();
   return json(200,{candidates:rows.results||[]});
  }
  const data=await body(req);
  if(!idOk(data.openalex_id))return json(422,{error:'invalid_openalex_id'});
  if(req.method==='POST'){
   const name=short(data.display_name,160),institution=short(data.institution,180);
   if(name.length<2)return json(422,{error:'invalid_name'});
   // Never downgrade an already reviewed record on rediscovery.
   await env.EXPERT_DB.prepare("INSERT INTO expert_candidates(openalex_id,display_name,institution) VALUES(?,?,?) ON CONFLICT(openalex_id) DO UPDATE SET display_name=excluded.display_name,institution=excluded.institution,updated_at=datetime('now')").bind(data.openalex_id,name,institution).run();
   return json(200,{saved:true,openalex_id:data.openalex_id});
  }
  const next=data.stage,reason=short(data.reason,400);
  if(!['Discovered','Screening','Contacted'].includes(next))return json(422,{error:'confirmation_requires_separate_verified_workflow'});
  const current=await env.EXPERT_DB.prepare('SELECT stage FROM expert_candidates WHERE openalex_id=?').bind(data.openalex_id).first();
  if(!current)return json(404,{error:'candidate_not_found'});
  if(current.stage==='Confirmed')return json(409,{error:'confirmed_record_locked'});
  if(current.stage===next)return json(200,{saved:true,unchanged:true});
  const results=await env.EXPERT_DB.batch([
   env.EXPERT_DB.prepare("UPDATE expert_candidates SET stage=?,updated_at=datetime('now') WHERE openalex_id=? AND stage=?").bind(next,data.openalex_id,current.stage),
   env.EXPERT_DB.prepare('INSERT INTO expert_stage_events(openalex_id,actor_subject,from_stage,to_stage,reason) VALUES(?,?,?,?,?)').bind(data.openalex_id,actor,current.stage,next,reason)
  ]);
  return json(200,{saved:true,stage:next});
 }catch{return json(500,{error:'crm_request_failed'})}
}};
