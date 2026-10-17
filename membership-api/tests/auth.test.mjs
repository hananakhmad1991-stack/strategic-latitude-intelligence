import {test} from "node:test";
import assert from "node:assert/strict";
import {webcrypto,randomUUID} from "node:crypto";
import worker from "../src/index.js";
globalThis.crypto ??= webcrypto;
const origin="https://hananakhmad1991-stack.github.io";
const uid=randomUUID(),url="https://membership.example.workers.dev";
const enc=x=>Buffer.from(typeof x==="string"?x:JSON.stringify(x)).toString("base64url");
function request(path,{method="GET",bearer=null,site=origin}={}){
 const headers={};if(site!==null)headers.origin=site;if(bearer)headers.authorization="Bearer "+bearer;
 return new Request(url+path,{method,headers});
}
function mockDB(record){
 return {prepare(sql){assert.match(sql,/WHERE user_id = \?/);return {bind(id){assert.equal(id,uid);return {async first(){return record}}}}}};
}
function environment(rec=null){
 return {WEB_ORIGIN:origin,SUPABASE_URL:"https://test-project.supabase.co",DB:mockDB(rec),PREMIUM_BUCKET:{
  async get(key){if(key==="pro/province-research.json")return{body:new Blob(['{"test":"private"}'])};return null}
 }};
}
async function makeJWT(priv,claims){
 const header={alg:"RS256",typ:"JWT",kid:"test-key"};
 const data=enc(header)+"."+enc(claims);
 const sig=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",priv,new TextEncoder().encode(data));
 return data+"."+Buffer.from(sig).toString("base64url");
}
test("Membership API denies unauthenticated, missing configuration, forged claims and expired subscriptions",async()=>{
 const before=globalThis.fetch;
 try{
  const keys=await crypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
  const pub={...(await crypto.subtle.exportKey("jwk",keys.publicKey)),kid:"test-key",alg:"RS256",use:"sig"};
  globalThis.fetch=async path=>{assert.match(String(path),/\/auth\/v1\/\.well-known\/jwks\.json$/);return new Response(JSON.stringify({keys:[pub]}),{status:200,headers:{"content-type":"application/json"}})};
  const now=Math.floor(Date.now()/1000),claims={iss:"https://test-project.supabase.co/auth/v1",sub:uid,aud:"authenticated",role:"authenticated",iat:now-60,exp:now+3600,plan:"enterprise"};
  const valid=await makeJWT(keys.privateKey,claims);
  const health=await worker.fetch(request("/healthz"),{});
  assert.equal(health.status,200);assert.equal((await health.json()).state,"prelaunch");
  assert.equal((await worker.fetch(request("/v1/me",{bearer:valid}),{})).status,503);
  assert.equal((await worker.fetch(request("/v1/me"),environment())).status,401);
  assert.equal((await worker.fetch(request("/v1/me",{bearer:valid,site:"https://attacker.example"}),environment())).status,403);
  const forged=valid.slice(0,-4)+"abcd";
  assert.equal((await worker.fetch(request("/v1/me",{bearer:forged}),environment())).status,401);
  const expired=await makeJWT(keys.privateKey,{...claims,exp:now-1});
  assert.equal((await worker.fetch(request("/v1/me",{bearer:expired}),environment())).status,401);
  let response=await worker.fetch(request("/v1/me",{bearer:valid}),environment());
  assert.equal(response.status,200);
  assert.equal((await response.json()).plan,"open","Client plan=enterprise MUST NOT grant anything");
  assert.match(response.headers.get("cache-control"),/no-store/);
  assert.equal(response.headers.get("access-control-allow-origin"),origin);
  assert.equal((await worker.fetch(request("/v1/protected/province-research",{bearer:valid}),environment())).status,403);
  const pro={plan:"pro",status:"active",access_until:"2099-01-01T00:00:00Z"};
  assert.equal((await (await worker.fetch(request("/v1/me",{bearer:valid}),environment(pro))).json()).plan,"pro");
  response=await worker.fetch(request("/v1/protected/province-research",{bearer:valid}),environment(pro));
  assert.equal(response.status,200);assert.match(await response.text(),/"private"/);
  assert.match(response.headers.get("content-disposition"),/attachment/);
  assert.equal((await worker.fetch(request("/v1/protected/institutional-brief",{bearer:valid}),environment(pro))).status,403);
  assert.equal((await (await worker.fetch(request("/v1/me",{bearer:valid}),environment({...pro,access_until:"2025-01-01T00:00:00Z"}))).json()).plan,"open");
  assert.equal((await (await worker.fetch(request("/v1/me",{bearer:valid}),environment({...pro,status:"past_due"}))).json()).plan,"open");
  assert.equal((await worker.fetch(request("/v1/checkout",{bearer:valid}),environment(pro))).status,404);
  assert.equal((await worker.fetch(request("/v1/me",{method:"POST",bearer:valid}),environment(pro))).status,405);
  const opt=await worker.fetch(request("/v1/me",{method:"OPTIONS"}),environment());
  assert.equal(opt.status,204);assert.equal(opt.headers.get("access-control-allow-origin"),origin);
 }finally{globalThis.fetch=before}
});
