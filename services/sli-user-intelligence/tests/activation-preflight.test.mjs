import assert from "node:assert/strict";
import {mkdtemp,cp,readFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {preflight,validateConfig} from "../scripts/cloudflare-activation-preflight.mjs";
import {render} from "../scripts/render-wrangler-config.mjs";
const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,"..");
const env={CF_ACCOUNT_ID:"a".repeat(32),CF_API_TOKEN:"fixture-token-do-not-use",
 SLI_ACCESS_AUD:"abcXYZ0123456789aud",SLI_API_HOSTNAME:"private.sli.example.com",
 SLI_ACCESS_ISSUER:"https://example.cloudflareaccess.com",
 SLI_D1_DATABASE_ID:"11111111-1111-4111-8111-111111111111",
 SLI_ACCESS_ALLOWED_GROUP_ID:"authorized-pilot-group"};
const allowPolicy={decision:"allow",include:[{group:{id:env.SLI_ACCESS_ALLOWED_GROUP_ID}}]};
const app={id:"app-id",aud:env.SLI_ACCESS_AUD,type:"self_hosted",
 domain:env.SLI_API_HOSTNAME,destinations:[],
 cors_headers:{allow_all_origins:false,allowed_origins:["https://hananakhmad1991-stack.github.io"],
  allow_credentials:true,allowed_methods:["GET","PUT","POST","DELETE","OPTIONS"],
  allowed_headers:["Content-Type"]}};
const api=async (url)=>{
 let result=[];
 if(url.includes("/access/apps/app-id/policies"))result=[allowPolicy];
 else if(url.includes("/access/apps?"))result=[app];
 else if(url.includes("/d1/database/"))result={uuid:env.SLI_D1_DATABASE_ID};
 else throw Error("Unexpected endpoint "+url);
 return new Response(JSON.stringify({success:true,result}),{status:200});
};
const policiesAPI=policies=>async url=>{
 let result=[];
 if(url.includes("/access/apps/app-id/policies"))result=policies;
 else if(url.includes("/access/apps?"))result=[app];
 else if(url.includes("/d1/database/"))result={uuid:env.SLI_D1_DATABASE_ID};
 else throw Error("Unexpected endpoint "+url);
 return new Response(JSON.stringify({success:true,result}),{status:200});
};
assert.equal(validateConfig(env),true);
const verified=await preflight(env,api);
assert.equal(verified.hostname,env.SLI_API_HOSTNAME);
await assert.rejects(preflight({...env,SLI_ACCESS_ALLOWED_GROUP_ID:""},api),/Missing configuration/);
await assert.rejects(preflight(env,policiesAPI([{decision:"allow",include:[{everyone:{}}]}])),
 /Every Access Allow policy must include only the configured authorized group/);
await assert.rejects(preflight(env,policiesAPI([{decision:"allow",include:[{group:{id:"another-pilot-group"}}]}])),
 /Every Access Allow policy must include only the configured authorized group/);
await assert.rejects(preflight(env,policiesAPI([allowPolicy,{decision:"allow",include:[{everyone:{}}]}])),
 /Every Access Allow policy must include only the configured authorized group/);
const refute=async(override,overrideApi=api)=>{
 await assert.rejects(preflight({...env,...override},overrideApi));
};
await refute({SLI_API_HOSTNAME:"unprotected.example.workers.dev"});
const pilotEnv={...env,SLI_API_HOSTNAME:"sli-user-intelligence.test-account.workers.dev"};
const pilotApp={...app,domain:pilotEnv.SLI_API_HOSTNAME};
const pilotAPI=async (url)=>{
 let result=[];
 if(url.includes("/workers/subdomain"))result={subdomain:"test-account"};
 else if(url.includes("/access/apps/app-id/policies"))result=[allowPolicy];
 else if(url.includes("/access/apps?"))result=[pilotApp];
 else if(url.includes("/d1/database/"))result={uuid:env.SLI_D1_DATABASE_ID};
 else throw Error("Unexpected Cloudflare API "+url);
 return new Response(JSON.stringify({success:true,result}),{status:200});
};
const pilotVerified=await preflight(pilotEnv,pilotAPI);
assert.equal(pilotVerified.mode,"workers_dev_pilot");
assert.equal(pilotVerified.hostname,pilotEnv.SLI_API_HOSTNAME);
// Worker-level Access applications use destination.worker_id, not a hostname URI.
// The worker_id must be validated against this account's immutable Worker script ID.

assert.equal((await preflight(env,api)).cors_mode,"access_response_options");
const bypassApp={...app,cors_headers:undefined,options_preflight_bypass:true};
const bypassAPI=async url=>{
 const result=url.includes("/access/apps?")?[bypassApp]:
  url.includes("/access/apps/app-id/policies")?[allowPolicy]:
  url.includes("/d1/database/")?{uuid:env.SLI_D1_DATABASE_ID}:null;
 return new Response(JSON.stringify({success:true,result}),{status:200});
};
assert.equal((await preflight(env,bypassAPI)).cors_mode,"worker_origin_options");
await assert.rejects(preflight(env,async url=>{
 const result=url.includes("/access/apps?")?[{...app,options_preflight_bypass:true}]:
  url.includes("/access/apps/app-id/policies")?[allowPolicy]:
  url.includes("/d1/database/")?{uuid:env.SLI_D1_DATABASE_ID}:null;
 return new Response(JSON.stringify({success:true,result}),{status:200});
}),/conflicts with OPTIONS bypass/);
await assert.rejects(preflight(env,async url=>{
 const result=url.includes("/access/apps?")?[{...app,cors_headers:undefined}]:
  url.includes("/access/apps/app-id/policies")?[allowPolicy]:
  url.includes("/d1/database/")?{uuid:env.SLI_D1_DATABASE_ID}:null;
 return new Response(JSON.stringify({success:true,result}),{status:200});
}),/Access CORS not configured/);
await assert.rejects(preflight(env,async url=>{
 const result=url.includes("/access/apps?")?[{...app,cors_headers:{
  ...app.cors_headers,allowed_methods:["GET","PUT"]}}]:
  url.includes("/access/apps/app-id/policies")?[allowPolicy]:
  url.includes("/d1/database/")?{uuid:env.SLI_D1_DATABASE_ID}:null;
 return new Response(JSON.stringify({success:true,result}),{status:200});
}),/GET, PUT, POST, DELETE, OPTIONS methods/);

const workerId="a".repeat(32);
const workerOnlyApp={...pilotApp,domain:undefined,
 destinations:[{type:"worker",worker_id:workerId}]};
const workerAPI=async (url,chosenApp=workerOnlyApp)=>{
 let result=[];
 if(url.includes("/workers/subdomain"))result={subdomain:"test-account"};
 else if(url.includes("/workers/scripts-search?"))result=[
  {id:workerId,script_name:"sli-user-intelligence",environment_is_default:true}];
 else if(url.includes("/access/apps/app-id/policies"))result=[allowPolicy];
 else if(url.includes("/access/apps?"))result=[chosenApp];
 else if(url.includes("/d1/database/"))result={uuid:env.SLI_D1_DATABASE_ID};
 else throw Error("Unexpected Cloudflare API "+url);
 return new Response(JSON.stringify({success:true,result}),{status:200});
};
assert.equal((await preflight(pilotEnv,url=>workerAPI(url))).mode,"workers_dev_pilot");
await assert.rejects(preflight(pilotEnv,url=>workerAPI(url,{
 ...workerOnlyApp,destinations:[{type:"preview_worker",worker_id:workerId}]})),
 /Access application/,"Preview-only Worker Access cannot authorize production");
await assert.rejects(preflight(pilotEnv,url=>workerAPI(url,{
 ...workerOnlyApp,destinations:[{type:"worker",worker_id:"b".repeat(32)}]})),
 /Access application/,"Unrelated Worker destination must not authorize production");
await assert.rejects(preflight(pilotEnv,url=>workerAPI(url,{
 ...workerOnlyApp,destinations:[{type:"worker",worker_id:workerId,
  overrides:[{behavior:"public",path_pattern:"/api/*"}]}]})),
 /Access application/,"Public API path overrides must be rejected");
await assert.rejects(preflight(pilotEnv,async url=>{
 let response=await workerAPI(url);
 if(url.includes("/workers/scripts-search?")){
  response=new Response(JSON.stringify({success:true,result:[
   {id:workerId,script_name:"sli-research-owner-test",environment_is_default:true}
  ]}),{status:200});
 }
 return response;
}),/Worker script ID/,"Worker ID must be proven for exact script name");

await assert.rejects(preflight({...pilotEnv,SLI_API_HOSTNAME:"sli-user-intelligence.other-account.workers.dev"},pilotAPI),
 /does not match this Cloudflare account/);
await assert.rejects(preflight(pilotEnv,async url=>{
 const value=url.includes("/access/apps?")?[]:url.includes("/workers/subdomain")?{subdomain:"test-account"}:
  url.includes("/workers/scripts-search?")?[{id:workerId,script_name:"sli-user-intelligence",environment_is_default:true}]:null;
 return new Response(JSON.stringify({success:true,result:value}),{status:200});
}),/Access application/);

await refute({CF_API_TOKEN:""});
await refute({SLI_D1_DATABASE_ID:"abc"});
await assert.rejects(preflight(env,async u=>{
 const result=u.includes("/access/apps?")?[{...app,cors_headers:{...app.cors_headers,allow_all_origins:true}}]:
 u.includes("/policies")?[allowPolicy]:{uuid:env.SLI_D1_DATABASE_ID};
 return new Response(JSON.stringify({success:true,result}));
}),/CORS/);
await assert.rejects(preflight(env,async u=>{
 const result=u.includes("/access/apps?")?[{...app,destinations:[{uri:env.SLI_API_HOSTNAME,overrides:[{behavior:"public",path_pattern:"/api/"}]}]}]:
 u.includes("/policies")?[allowPolicy]:{uuid:env.SLI_D1_DATABASE_ID};
 return new Response(JSON.stringify({success:true,result}));
}),/Access application/);
await assert.rejects(preflight(env,async u=>{
 const result=u.includes("/access/apps?")?[app]:
 u.includes("/policies")?[allowPolicy,{decision:"bypass"}]:{uuid:env.SLI_D1_DATABASE_ID};
 return new Response(JSON.stringify({success:true,result}));
}),/bypass/);
const tmp=await mkdtemp(path.join(tmpdir(),"sli-access-config-"));
try{
 await cp(path.join(ROOT,"wrangler.toml"),path.join(tmp,"wrangler.toml"));
 const outfile=await render(tmp,env);
 const s=await readFile(outfile,"utf8");
 assert.match(s,/workers_dev = false/);
 assert.match(s,/preview_urls = false/);
 assert.match(s,/custom_domain = true/);
 assert.ok(s.includes('pattern = "'+env.SLI_API_HOSTNAME+'"'));
 assert.ok(s.includes(env.SLI_D1_DATABASE_ID));
 assert.ok(s.includes("CF_ACCESS_ISSUER"));
 assert.ok(!s.includes(env.CF_API_TOKEN),"API bearer token must never enter Wrangler config");
 assert.ok(!s.includes("REPLACE_WITH_REAL_D1_DATABASE_ID"));

 const pilotFile=await render(tmp,pilotEnv);
 const pilot=await readFile(pilotFile,"utf8");
 assert.match(pilot,/workers_dev = true/);
 assert.match(pilot,/preview_urls = false/);
 assert.ok(!pilot.includes("[[routes]]"),"workers.dev pilot must not create custom-domain routes");
 assert.ok(!pilot.includes("custom_domain = true"));
 assert.ok(!pilot.includes(env.CF_API_TOKEN));
 assert.ok(pilot.includes("CF_ACCESS_AUD"));
}finally{await rm(tmp,{recursive:true,force:true})}
console.log("Cloudflare activation preflight and safe ephemeral config QA passed");
