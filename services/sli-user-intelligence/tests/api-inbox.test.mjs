import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import worker, {handleRequest,processEvents,runCron} from "../src/index.mjs";
class FakeD1{
 constructor(){this.profiles=new Map;this.inbox=new Map;this.state=new Map;this.processed=new Map}
 prepare(sql){
  const db=this;
  return {
   async first(){return (await db.exec(sql,[])).first||null},
   async all(){return {results:(await db.exec(sql,[])).results||[]}},
   async run(){return {meta:{changes:(await db.exec(sql,[])).changes||0}}},
   bind(...args){
   const cmd={sql,args,
    async first(){return (await db.exec(sql,args)).first||null},
    async all(){return {results:(await db.exec(sql,args)).results||[]}},
    async run(){return {meta:{changes:(await db.exec(sql,args)).changes||0}}}};
   return cmd;
  }};
 }
 async batch(stmts){for(const s of stmts)await this.exec(s.sql,s.args);return []}
 async exec(q,a){
  if(q.startsWith("SELECT preferences_json")){const p=this.profiles.get(a[0]);return {first:p||null}}
  if(q.startsWith("INSERT INTO user_profiles")){
   const p=this.profiles.get(a[0]);this.profiles.set(a[0],{user_id:a[0],preferences_json:a[1],created_at:p?.created_at||a[2],updated_at:a[3]});return {changes:1}
  }
  if(q.startsWith("SELECT id,event_id"))return {results:[...this.inbox.values()].filter(x=>x.user_id===a[0]).sort((x,y)=>y.created_at.localeCompare(x.created_at)).slice(a[2],a[2]+a[1])};
  if(q.startsWith("SELECT COUNT(*) AS n FROM notification_inbox"))return {first:{n:[...this.inbox.values()].filter(x=>x.user_id===a[0]&&!x.read_at).length}};
  if(q.startsWith("UPDATE notification_inbox")){const n=this.inbox.get(a[1]);if(n?.user_id===a[2])n.read_at=a[0];return {changes:1}}
  if(q.startsWith("DELETE FROM notification_inbox")){for(const [k,x]of this.inbox)if(x.user_id===a[0])this.inbox.delete(k);return {changes:1}}
  if(q.startsWith("DELETE FROM user_profiles")){this.profiles.delete(a[0]);return {changes:1}}
  if(q.startsWith("SELECT value FROM service_state")){
   const key=q.includes("'cron_monitor'")?"cron_monitor":"first_activated_at";
   return {first:this.state.has(key)?{value:this.state.get(key)}:null};
  }
  if(q.startsWith("INSERT OR IGNORE INTO service_state")){if(!this.state.has("first_activated_at"))this.state.set("first_activated_at",a[0]);return {changes:1}}
  if(q.startsWith("INSERT INTO service_state(key,value) VALUES('cron_monitor',?)")){
   this.state.set("cron_monitor",a[0]);return {changes:1};
  }
  if(q.startsWith("SELECT event_id FROM processed_events"))return {results:[...this.processed.keys()].map(event_id=>({event_id}))};
  if(q.startsWith("SELECT user_id,preferences_json FROM user_profiles"))return {results:[...this.profiles.values()].slice(0,a[0])};
  if(q.startsWith("INSERT OR IGNORE INTO notification_inbox")){
   const [id,user_id,event_id,title,event_kind,relevance,source_url,detected_at,created_at]=a;
   if(![...this.inbox.values()].some(x=>x.user_id===user_id&&x.event_id===event_id))
    this.inbox.set(id,{id,user_id,event_id,title,event_kind,relevance,source_url,detected_at,created_at,read_at:null});
   return {changes:1};
  }
  if(q.startsWith("INSERT OR IGNORE INTO processed_events")){this.processed.set(a[0],a[1]);return {changes:1}}
  throw Error("Unmocked SQL: "+q);
 }
}
const db=new FakeD1();
const env={DB:db,CF_ALLOWED_ORIGIN:"https://hananakhmad1991-stack.github.io"};
const origin=env.CF_ALLOWED_ORIGIN;
const identify=async req=>({id:req.headers.get("X-Test-User")||"alice"});
function req(method,path,user="alice",body=null,originHeader=origin){
 const headers={"X-Test-User":user};
 if(originHeader!==null)headers.Origin=originHeader;
 if(body!==null)headers["Content-Type"]="application/json";
 return new Request("https://api.sli.example"+path,{method,headers,body:body===null?undefined:JSON.stringify(body)});
}
const query=async r=>{const response=await handleRequest(r,env,identify);return {status:response.status,json:await response.json()}};
const corsPreflight=await handleRequest(req("OPTIONS","/api/preferences","visitor",null,origin),env,identify);
assert.equal(corsPreflight.status,204);
assert.equal(corsPreflight.headers.get("Access-Control-Allow-Origin"),origin);
assert.equal(corsPreflight.headers.get("Access-Control-Allow-Credentials"),"true");
assert.ok(corsPreflight.headers.get("Access-Control-Allow-Headers").includes("Content-Type"));
const corsRejected=await handleRequest(req("OPTIONS","/api/preferences","visitor",null,"https://evil.example"),env,identify);
assert.equal(corsRejected.status,403);
assert.equal(corsRejected.headers.get("Access-Control-Allow-Origin"),null);
assert.equal((await query(req("GET","/api/me"))).json.enrolled,false);
assert.equal((await query(req("PUT","/api/preferences","alice",{tickers:["ANTM"],sectors:[],kinds:["news","project"],include_sector:false,in_app:true}))).status,200);
assert.equal((await query(req("PUT","/api/preferences","bob",{tickers:["PGEO"],sectors:[],kinds:["news"],include_sector:false,in_app:true}))).status,200);
assert.deepEqual((await query(req("GET","/api/preferences","alice"))).json.preferences.tickers,["ANTM"]);
assert.equal((await query(req("PUT","/api/preferences","alice",{tickers:["INCO"],bad:true}))).status,400);
assert.equal((await query(req("PUT","/api/preferences","alice",{tickers:["INCO"]},"https://evil.example"))).status,403);
assert.equal((await query(req("PUT","/api/preferences","alice",{tickers:["INCO"]},null))).status,403);
assert.equal((await handleRequest(req("GET","/api/me"),{CF_ALLOWED_ORIGIN:origin},identify)).status,503);
// Regression: Cloudflare passes ExecutionContext as the third argument to
// the public Worker fetch() handler. It must NOT be used as an identity callback.
const noJwtEnv={...env,CF_ACCESS_ISSUER:"https://sli-testing.cloudflareaccess.com",
 CF_ACCESS_AUD:"sli-app-aud"};

// Cloudflare itself vouches for the Worker-level Access context. Even a
// client-supplied identity header or forged JWT must not substitute for it.
const runtimeContext={access:{
 aud:noJwtEnv.CF_ACCESS_AUD,
 async getIdentity(){return {user_uuid:"7335d417-61da-459d-899c-0a01c76a2f94",email:"alice@example.org",
  service_token_status:false}}
}};
const runtimeOK=await worker.fetch(req("GET","/api/me","attacker"),noJwtEnv,runtimeContext);
assert.equal(runtimeOK.status,200,"Native Worker Access context must allow valid user");
const runtimeBody=await runtimeOK.json();
assert.equal(runtimeBody.identity_provider,"cloudflare_access");
assert.equal(runtimeBody.enrolled,false);
assert.ok(!JSON.stringify(runtimeBody).includes("alice@example.org"),"Do not expose email in API");
const nativeUserHash=await webcrypto.subtle.digest("SHA-256",new TextEncoder().encode(
 noJwtEnv.CF_ACCESS_ISSUER+"|"+noJwtEnv.CF_ACCESS_AUD+"|7335d417-61da-459d-899c-0a01c76a2f94"));
assert.match(Buffer.from(nativeUserHash).toString("hex"),/^[0-9a-f]{64}$/);
for(const context of [
 {access:{...runtimeContext.access,aud:"another-application"}},
 {access:{...runtimeContext.access,async getIdentity(){return {email:"alice@example.org"}}}},
 {access:{...runtimeContext.access,async getIdentity(){return {user_uuid:"7335d417-61da-459d-899c-0a01c76a2f94",service_token_status:true}}}},
 {access:{aud:noJwtEnv.CF_ACCESS_AUD,async getIdentity(){throw new Error("network failed")}}}
]){
 const result=await worker.fetch(req("GET","/api/me","attacker"),noJwtEnv,context);
 assert.ok([403,503].includes(result.status),"Fail closed if Access identity missing or invalid");
}
const spoofed=new Request("https://api.sli.example/api/me",{
 headers:{"Cf-Access-Jwt-Assertion":"attacker.unsigned.payload","Cf-Access-Authenticated-User-Email":"alice@example.org"}});
assert.equal((await worker.fetch(spoofed,noJwtEnv,{waitUntil(){}})).status,401,
 "Spoofed Access headers may never bypass missing runtime Access identity");

const runtimeResponse=await worker.fetch(req("GET","/api/me"),noJwtEnv,{waitUntil(){}});
assert.equal(runtimeResponse.status,401,"Worker fetch entrypoint must reject missing JWT, never respond 500");
assert.equal((await runtimeResponse.json()).error,"Cloudflare Access login required");

const baseline=await processEvents(env,async()=>new Response(JSON.stringify({schema_version:"sli-catalyst-history-v2",events:[]})));
assert.equal(baseline.initialized,true);
const after=new Date(Date.now()+5000).toISOString();
const event={id:"sli-catalyst-111111111111111111",kind:"news_indexed",title:"ANTM announces project",detected_at_utc:after,
 sector:"minerals",source_url:"https://news.example/article",ticker_links:[{ticker:"ANTM",basis:"explicit_headline_identity"}]};
const feed=async()=>new Response(JSON.stringify({schema_version:"sli-catalyst-history-v2",events:[event]}));
const sent=await processEvents(env,feed);
assert.equal(sent.delivered,1);
assert.equal(db.inbox.size,1);
assert.equal((await processEvents(env,feed)).delivered,0,"rerun cannot duplicate notifications");
const alice=await query(req("GET","/api/inbox","alice"));
const bob=await query(req("GET","/api/inbox","bob"));
assert.equal(alice.json.unread,1);assert.equal(bob.json.unread,0);
const id=alice.json.items[0].id;
assert.equal((await query(req("POST","/api/inbox/read","bob",{ids:[id]}))).status,200);
assert.equal((await query(req("GET","/api/inbox","alice"))).json.unread,1,"other user cannot read another inbox");
assert.equal((await query(req("POST","/api/inbox/read","alice",{ids:[id]}))).status,200);
assert.equal((await query(req("GET","/api/inbox","alice"))).json.unread,0);
assert.equal((await query(req("DELETE","/api/me","alice"))).json.deleted,true);
assert.equal(db.profiles.has("alice"),false);
assert.equal(db.inbox.size,0);
// Observability is private, read-only, and never confuses a cron error with 0 deliveries.
assert.equal((await query(req("GET","/api/health"))).json.scheduler.status,"not_observed");
await runCron(env,async()=>({initialized:false,processed:2,delivered:1}));
const healthy=(await query(req("GET","/api/health"))).json.scheduler;
assert.equal(healthy.status,"ok");assert.equal(healthy.last_processed,2);
assert.equal(healthy.last_delivered,1);assert.equal(healthy.consecutive_failures,0);
await assert.rejects(runCron(env,async()=>{throw Error("SLI history request unavailable")}),/unavailable/);
const failed=(await query(req("GET","/api/health"))).json.scheduler;
assert.equal(failed.status,"error");assert.equal(failed.error_code,"source_transport");
assert.equal(failed.last_processed,2);assert.equal(failed.last_delivered,1);
assert.equal(failed.consecutive_failures,1);
assert.equal(failed.last_success_at,healthy.last_success_at);
await runCron(env,async()=>({initialized:false,processed:0,delivered:0}));
const recovered=(await query(req("GET","/api/health"))).json.scheduler;
assert.equal(recovered.status,"ok");assert.equal(recovered.error_code,null);
assert.equal(recovered.consecutive_failures,0);
assert.equal(recovered.last_delivered,0);
assert.equal((await worker.fetch(req("GET","/api/health"),noJwtEnv,{waitUntil(){}})).status,401,
 "Unauthenticated callers may not see backend health");
console.log("D1 backend API QA passed: ownership, origin, opt-in delivery, dedupe, read isolation, account erasure and cron diagnostics");
