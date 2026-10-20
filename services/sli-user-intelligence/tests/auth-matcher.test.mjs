import assert from "node:assert/strict";
import {webcrypto,createPublicKey} from "node:crypto";
import {requireIdentity,HttpError} from "../src/auth.mjs";
import {validatePreferences,eligible,validateEvent} from "../src/matcher.mjs";
const b64=(x)=>Buffer.from(typeof x==="string"?x:JSON.stringify(x)).toString("base64url");
const issuer="https://sli-testing.cloudflareaccess.com",aud="sli-app-aud";
const env={CF_ACCESS_ISSUER:issuer,CF_ACCESS_AUD:aud};
const key=await webcrypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
const jwk=await webcrypto.subtle.exportKey("jwk",key.publicKey);jwk.kid="test-key";
const certFetch=async u=>{
 assert.equal(u,issuer+"/cdn-cgi/access/certs");
 return new Response(JSON.stringify({keys:[jwk]}),{status:200});
};
async function token(payload){
 const head=b64({alg:"RS256",typ:"JWT",kid:"test-key"}),body=b64(payload);
 const signature=await webcrypto.subtle.sign("RSASSA-PKCS1-v1_5",key.privateKey,new TextEncoder().encode(head+"."+body));
 return head+"."+body+"."+Buffer.from(signature).toString("base64url");
}
const now=Math.floor(Date.now()/1000),claims={iss:issuer,aud:[aud],sub:"user-123",iat:now,exp:now+3600};
const jwt=await token(claims),request=x=>new Request("https://api.example.test/api/me",{headers:{"Cf-Access-Jwt-Assertion":x}});
const who=await requireIdentity(request(jwt),env,certFetch);
assert.match(who.id,/^[0-9a-f]{64}$/);
assert.equal((await requireIdentity(request(jwt),env,certFetch)).id,who.id);
for(const bad of [
 await token({...claims,aud:["not-target"]}),
 await token({...claims,exp:now-60}),
 jwt.replace(/\.[a-zA-Z0-9_-]+$/,".bad")
]){
 await assert.rejects(requireIdentity(request(bad),env,certFetch),e=>e instanceof HttpError&&e.status===401);
}
await assert.rejects(requireIdentity(new Request("https://api.example.test/api/me"),env,certFetch),e=>e.status===401);
await assert.rejects(requireIdentity(request(jwt),{CF_ACCESS_ISSUER:"",CF_ACCESS_AUD:aud},certFetch),e=>e.status===503);
assert.deepEqual(validatePreferences({tickers:["ANTM","ANTM"],sectors:["minerals"],kinds:["news"],include_sector:false,in_app:true}).tickers,["ANTM"]);
assert.throws(()=>validatePreferences({tickers:["not ticker"]}),e=>e.status===400);
assert.throws(()=>validatePreferences({tickers:[],secret:"x"}),e=>e.status===400);
const event={id:"sli-catalyst-111111111111111111",kind:"news_indexed",title:"ANTM investment",sector:"minerals",detected_at_utc:"2026-10-20T05:00:00Z",source_url:"https://setneg.go.id/test",ticker_links:[{ticker:"ANTM",basis:"explicit_headline_identity"}]};
assert.equal(validateEvent(event),true);
assert.equal(eligible(event,validatePreferences({tickers:["ANTM"]})),"direct");
assert.equal(eligible(event,validatePreferences({tickers:["INCO"]})),null);
assert.equal(eligible(event,validatePreferences({tickers:["INCO"],sectors:["minerals"],include_sector:true})),"sector");
assert.equal(eligible(event,validatePreferences({tickers:["ANTM"],in_app:false})),null);
assert.equal(validateEvent({...event,source_url:"javascript:alert(1)"}),false);
console.log("Cloudflare Access signature/claims, preference validation and strict catalyst matching PASSED");
