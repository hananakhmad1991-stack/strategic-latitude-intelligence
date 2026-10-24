import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto,randomUUID} from 'node:crypto';
import handler from '../../research-api/src/index.js';
globalThis.crypto ??= webcrypto;
const uid=randomUUID(),origin='https://hananakhmad1991-stack.github.io';
const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
test('Paid Research AI rejects plan-only token without active member session, including Intelligence Pro',async()=>{
 const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const pub={...(await crypto.subtle.exportKey('jwk',keys.publicKey)),kid:'local-key',alg:'RS256'};
 const now=Math.floor(Date.now()/1000);
 const raw=enc({alg:'RS256',kid:'local-key'})+'.'+enc({iss:'https://test-project.supabase.co/auth/v1',sub:uid,role:'authenticated',aud:'authenticated',iat:now-10,exp:now+600});
 const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(raw));
 const bearer=raw+'.'+Buffer.from(signature).toString('base64url');
 const before=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({keys:[pub]}));
 try{
  let plan='intelligence_pro';
  const db={prepare(sql){
   return {bind(){return {async first(){return {plan,status:'active',access_until:'2099-01-01T00:00:00.000Z'}}}}};
  }};
  const env={WEB_ORIGIN:origin,SUPABASE_URL:'https://test-project.supabase.co',DB:db,
   RESEARCH_BUCKET:{get:async()=>{throw Error('should not read corpus')}},
   OPENAI_API_KEY:'mock-not-used',RESEARCH_MODEL:'not-used',AI_LIMITER:{limit:async()=>({success:false})}};
  const req=()=>new Request('https://research-stage.example/v1/research',{method:'POST',
   headers:{origin,authorization:'Bearer '+bearer,'content-type':'application/json'},
   body:JSON.stringify({question:'Protected dataset details'})});
  let result=await handler.fetch(req(),env);
  assert.equal(result.status,401);assert.equal((await result.json()).error,'active_session_required');
  plan='pro';result=await handler.fetch(req(),env);
  assert.equal(result.status,401);
  plan='open';result=await handler.fetch(req(),env);
  assert.equal(result.status,403);
 }finally{globalThis.fetch=before}
});
