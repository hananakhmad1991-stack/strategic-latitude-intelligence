#!/usr/bin/env node
/**
 * Read-only Cloudflare Access deployment preflight.
 * Deliberately fails closed when app/CORS policy cannot be independently proven.
 * Requires CF_ACCOUNT_ID, CF_API_TOKEN, SLI_ACCESS_AUD, SLI_API_HOSTNAME,
 * SLI_ACCESS_ISSUER, SLI_D1_DATABASE_ID in the executing environment.
 */
const ORIGIN="https://hananakhmad1991-stack.github.io";
const REQUIRED=["CF_ACCOUNT_ID","CF_API_TOKEN","SLI_ACCESS_AUD","SLI_API_HOSTNAME","SLI_ACCESS_ISSUER","SLI_D1_DATABASE_ID"];
const die=(message)=>{throw Error(message)};
const domain=x=>typeof x==="string"&&/^[a-z0-9](?:[a-z0-9.-]{1,251}[a-z0-9])$/.test(x)&&x.includes(".")&&!x.includes("..");
export function validateConfig(e){
 const absent=REQUIRED.filter(k=>!e[k]);if(absent.length)die("Missing configuration: "+absent.join(", "));
 if(!/^[a-f0-9-]{32,36}$/i.test(e.SLI_D1_DATABASE_ID))die("D1 database ID invalid");
 if(!domain(e.SLI_API_HOSTNAME)||e.SLI_API_HOSTNAME.endsWith(".workers.dev"))die("Dedicated protected custom hostname required");
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(e.SLI_ACCESS_ISSUER))die("Access team issuer invalid");
 if(e.SLI_API_HOSTNAME==="hananakhmad1991-stack.github.io")die("Cannot mount private Worker on static GitHub Pages origin");
 if(!/^[A-Za-z0-9_-]{8,128}$/.test(e.SLI_ACCESS_AUD))die("Invalid Access application AUD format");
 return true;
}
function appMatches(app,e){
 if(!app||app.aud!==e.SLI_ACCESS_AUD||app.type!=="self_hosted")return false;
 const domains=[app.domain,...(app.destinations||[]).map(d=>d?.uri)].filter(Boolean);
 const exact=domains.some(d=>String(d).replace(/^https:\/\//,"").replace(/\/$/,"")===e.SLI_API_HOSTNAME);
 if(!exact)return false;
 // Do not accept a public path exception, which could expose /api/ routes.
 if((app.destinations||[]).some(d=>(d?.overrides||[]).some(o=>o.behavior==="public")))return false;
 return true;
}
function corsMatches(app){
 const c=app?.cors_headers;
 if(!c||c.allow_all_origins===true)return false;
 const origins=c.allowed_origins||[];
 const methods=c.allowed_methods||[];
 const headers=c.allowed_headers||[];
 const checkHeaders=headers.some(x=>typeof x==="string"?x.toLowerCase()==="content-type":String(x?.name||x?.header||"").toLowerCase()==="content-type");
 const bypass=c.bypass_options_requests===true||c.bypass_options===true;
 return origins.length===1&&origins[0]===ORIGIN&&
  c.allow_credentials===true&&["GET","PUT","POST","DELETE"].every(x=>methods.includes(x))&&
  (checkHeaders||c.allow_all_headers===true)&&
  (bypass||methods.includes("OPTIONS"));
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
 const apps=await api("/access/apps?per_page=100",e,fetcher);
 if(!Array.isArray(apps))die("Access application list unreadable");
 const app=apps.find(x=>appMatches(x,e));
 if(!app)die("No EXACT matching self-hosted Access application; create protection first");
 if(!corsMatches(app))die("Access CORS needs exact Pages origin, credentials and OPTIONS behavior. See docs.");
 const policies=await api("/access/apps/"+app.id+"/policies?per_page=100",e,fetcher);
 if(!Array.isArray(policies)||!policies.some(x=>x.decision==="allow"))die("Access policy has no Allow rule");
 if(policies.some(x=>x.decision==="bypass"||x.decision==="non_identity"))die("Access bypass/non-identity policy not allowed");
 const d1=await api("/d1/database/"+e.SLI_D1_DATABASE_ID,e,fetcher);
 if(!d1||d1.uuid!==e.SLI_D1_DATABASE_ID)die("D1 database ID not confirmed by Cloudflare");
 return {access_app_id:app.id,hostname:e.SLI_API_HOSTNAME,database_verified:true,cors_origin:ORIGIN};
}
if(process.argv[1]?.endsWith("cloudflare-activation-preflight.mjs")){
 preflight(process.env).then(r=>{console.log("SLI Cloudflare deployment preflight PASSED");console.log(JSON.stringify(r))})
 .catch(e=>{console.error("SLI Cloudflare deployment preflight BLOCKED: "+e.message);process.exitCode=1});
}
