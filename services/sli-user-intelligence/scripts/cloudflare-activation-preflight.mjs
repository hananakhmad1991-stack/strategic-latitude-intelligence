#!/usr/bin/env node
/**
 * Read-only Cloudflare Access deployment preflight.
 * Deliberately fails closed when app/CORS policy cannot be independently proven.
 * Requires CF_ACCOUNT_ID, CF_API_TOKEN, SLI_ACCESS_AUD, SLI_API_HOSTNAME,
 * SLI_ACCESS_ISSUER, SLI_D1_DATABASE_ID and SLI_ACCESS_ALLOWED_GROUP_ID.
 */
const ORIGIN="https://hananakhmad1991-stack.github.io";
const REQUIRED=["CF_ACCOUNT_ID","CF_API_TOKEN","SLI_ACCESS_AUD","SLI_API_HOSTNAME","SLI_ACCESS_ISSUER","SLI_D1_DATABASE_ID","SLI_ACCESS_ALLOWED_GROUP_ID"];
const die=(message)=>{throw Error(message)};
const domain=x=>typeof x==="string"&&/^[a-z0-9](?:[a-z0-9.-]{1,251}[a-z0-9])$/.test(x)&&x.includes(".")&&!x.includes("..");
export const isProtectedWorkersDevHost=hostname=>/^sli-user-intelligence\.[a-z0-9-]+\.workers\.dev$/.test(String(hostname||""));
export function validateConfig(e){
 const absent=REQUIRED.filter(k=>!e[k]);if(absent.length)die("Missing configuration: "+absent.join(", "));
 if(!/^[a-f0-9-]{32,36}$/i.test(e.SLI_D1_DATABASE_ID))die("D1 database ID invalid");
 if(!domain(e.SLI_API_HOSTNAME))die("Valid, dedicated protected hostname required");
 if(e.SLI_API_HOSTNAME.endsWith(".workers.dev")&&!isProtectedWorkersDevHost(e.SLI_API_HOSTNAME))
  die("workers.dev pilot must target EXACT sli-user-intelligence.<account-subdomain>.workers.dev");
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(e.SLI_ACCESS_ISSUER))die("Access team issuer invalid");
 if(e.SLI_API_HOSTNAME==="hananakhmad1991-stack.github.io")die("Cannot mount private Worker on static GitHub Pages origin");
 if(!/^[A-Za-z0-9_-]{8,128}$/.test(e.SLI_ACCESS_AUD))die("Invalid Access application AUD format");
 if(!/^[A-Za-z0-9_-]{8,128}$/.test(e.SLI_ACCESS_ALLOWED_GROUP_ID))die("Invalid authorized Access group ID");
 return true;
}
function appMatches(app,e,verifiedWorkerId=null){
 if(!app||app.aud!==e.SLI_ACCESS_AUD||app.type!=="self_hosted")return false;
 const domains=[app.domain,...(app.destinations||[]).map(d=>d?.uri)].filter(Boolean);
 const exact=domains.some(d=>String(d).replace(/^https:\/\//,"").replace(/\/$/,"")===e.SLI_API_HOSTNAME);
 const workerProtected=Boolean(verifiedWorkerId)&&
  (app.destinations||[]).some(d=>d?.type==="worker"&&d.worker_id===verifiedWorkerId);
 if(!exact&&!workerProtected)return false;
 // Do not accept a public path exception, which could expose /api/ routes.
 if((app.destinations||[]).some(d=>(d?.overrides||[]).some(o=>o.behavior==="public")))return false;
 return true;
}
// Access supports two safe preflight modes. In the first, Access itself answers
// OPTIONS with exact origin/credentials headers. In the second, Access bypasses
// authentication ONLY for OPTIONS and the Worker validates Origin itself; all
// actual API requests remain protected by Access and RS256 JWT verification.
export function accessCorsMode(app){
 const c=app?.cors_headers;
 if(app?.options_preflight_bypass===true){
  // Cloudflare declares CORS response headers mutually exclusive with bypass.
  // Do not accept ambiguous app configuration that could mask an exposure.
  if(c && (c.allow_all_origins||c.allow_all_methods||c.allow_all_headers||
   c.allow_credentials||(c.allowed_origins||[]).length||
   (c.allowed_methods||[]).length||(c.allowed_headers||[]).length))
   die("Access CORS conflicts with OPTIONS bypass; choose only one preflight mode");
  return "worker_origin_options";
 }
 if(!c)die("Access CORS not configured: set strict CORS response headers OR enable Bypass OPTIONS requests to origin");
 const origins=c.allowed_origins||[],methods=c.allowed_methods||[],headers=c.allowed_headers||[];
 const hasContentType=headers.some(x=>typeof x==="string"
  ?x.toLowerCase()==="content-type":String(x?.name||x?.header||"").toLowerCase()==="content-type");
 const missing=[];
 if(c.allow_all_origins===true||origins.length!==1||origins[0]!==ORIGIN)
  missing.push("exact allowed origin "+ORIGIN);
 if(c.allow_credentials!==true)missing.push("allow credentials");
 if(!["GET","PUT","POST","DELETE","OPTIONS"].every(x=>methods.includes(x)))
  missing.push("GET, PUT, POST, DELETE, OPTIONS methods");
 if(!hasContentType&&c.allow_all_headers!==true)missing.push("Content-Type header");
 if(missing.length)die("Access CORS incomplete: "+missing.join("; ")+
  ". Configure Additional settings > CORS or enable Bypass OPTIONS requests to origin.");
 return "access_response_options";
}
async function api(endpoint,e,fetcher){
 const r=await fetcher("https://api.cloudflare.com/client/v4/accounts/"+e.CF_ACCOUNT_ID+endpoint,{
  headers:{Authorization:"Bearer "+e.CF_API_TOKEN,Accept:"application/json"},
  redirect:"error",signal:AbortSignal.timeout(10000)});
 if(!r.ok)die("Cloudflare API HTTP "+r.status+" at "+endpoint+" (check token scopes)");
 const j=await r.json();
 if(j.success!==true)die("Cloudflare API returned unsuccessful response at "+endpoint);
 return j.result;
}
export async function preflight(e,fetcher=fetch){
 validateConfig(e);
 // Domainless pilots are only allowed on the current account's own Workers subdomain.
 // Never trust a user-entered third-party workers.dev hostname.
 if(isProtectedWorkersDevHost(e.SLI_API_HOSTNAME)){
  const subdomain=await api("/workers/subdomain",e,fetcher);
  const expected="sli-user-intelligence."+String(subdomain?.subdomain||"")+".workers.dev";
  if(e.SLI_API_HOSTNAME!==expected)die("workers.dev hostname does not match this Cloudflare account");
 }
 const apps=await api("/access/apps?per_page=100",e,fetcher);
 if(!Array.isArray(apps))die("Access application list unreadable");
 // Hostname Access applications carry a domain/URI. Worker-level applications
 // instead carry a type="worker" destination with an immutable worker_id.
 // Verify that ID against this account's exact named Worker; never trust a
 // preview_worker or an unrelated worker_id as production protection.
 let app=apps.find(x=>appMatches(x,e));
 if(!app&&isProtectedWorkersDevHost(e.SLI_API_HOSTNAME)){
  const scripts=await api("/workers/scripts-search?name=sli-user-intelligence&per_page=100",e,fetcher);
  if(!Array.isArray(scripts))die("Worker scripts search unreadable");
  const script=scripts.find(x=>x.script_name==="sli-user-intelligence"&&
   x.environment_is_default!==false&&/^[0-9a-f]{32}$/i.test(x.id||""));
  if(!script)die("Exact Worker script ID not verified in this Cloudflare account");
  app=apps.find(x=>appMatches(x,e,script.id));
 }
 if(!app)die("No EXACT matching self-hosted Access application; create protection first");
 const corsMode=accessCorsMode(app);
 const policies=await api("/access/apps/"+app.id+"/policies?per_page=100",e,fetcher);
 if(!Array.isArray(policies))die("Access policy list unreadable");
 if(policies.some(x=>x.decision==="bypass"||x.decision==="non_identity"))die("Access bypass/non-identity policy not allowed");
 const allowPolicies=policies.filter(x=>x.decision==="allow");
 if(!allowPolicies.length)die("Access policy has no Allow rule");
 if(allowPolicies.some(x=>!Array.isArray(x.include)||x.include.length!==1||
  x.include[0]?.group?.id!==e.SLI_ACCESS_ALLOWED_GROUP_ID))
  die("Every Access Allow policy must include only the configured authorized group");
 const d1=await api("/d1/database/"+e.SLI_D1_DATABASE_ID,e,fetcher);
 if(!d1||d1.uuid!==e.SLI_D1_DATABASE_ID)die("D1 database ID not confirmed by Cloudflare");
 return {access_app_id:app.id,hostname:e.SLI_API_HOSTNAME,
  mode:isProtectedWorkersDevHost(e.SLI_API_HOSTNAME)?"workers_dev_pilot":"custom_domain",
  database_verified:true,cors_origin:ORIGIN,cors_mode:corsMode};
}
if(process.argv[1]?.endsWith("cloudflare-activation-preflight.mjs")){
 preflight(process.env).then(r=>{console.log("SLI Cloudflare deployment preflight PASSED");console.log(JSON.stringify(r))})
 .catch(e=>{console.error("SLI Cloudflare deployment preflight BLOCKED: "+e.message);process.exitCode=1});
}
