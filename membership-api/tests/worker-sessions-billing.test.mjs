import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto,randomUUID} from 'node:crypto';
import worker from '../src/index.js';
import {verifyBillingSignature,processBillingEvent} from '../src/billing.mjs';
globalThis.crypto ??=webcrypto;
const origin='https://hananakhmad1991-stack.github.io';
const user=randomUUID();
function dbMock(plan='pro'){
 const state={plan,status:'active',access_until:'2099-01-01T00:00:00.000Z',sessions:[],receipts:new Map(),last_event_at:null,provider:null};
 return {state,prepare(sql){
  return {bind(...values){
   const execute=()=>{
    if(sql.includes('SELECT 1 AS allowed'))return state.sessions.some(s=>s.hash===values[0]&&s.uid===values[1]&&!s.revoked)?{allowed:1}:null;
    if(sql.includes('FROM subscriptions WHERE user_id='))return {plan:state.plan,status:state.status,access_until:state.access_until};
    if(sql.includes('FROM billing_event_audit'))return state.receipts.has(values.join(':'))?{event_id:values[1]}:null;
    throw new Error('Unhandled DB first '+sql);
   };
   return {async first(){return execute()},async run(){
    if(sql.startsWith('INSERT INTO member_sessions')){
     const limit=state.plan==='intelligence_pro'&&state.status==='active'?3:1;
     if(state.sessions.filter(s=>!s.revoked).length>=limit)throw Error('session_limit_reached');
     state.sessions.push({hash:values[0],uid:values[1],revoked:false});
     return {meta:{changes:1}};
    }
    if(sql.startsWith('UPDATE member_sessions')){
     let count=0;for(const s of state.sessions)if(!s.revoked&&s.hash===values[1]&&s.uid===values[2]){s.revoked=true;count++}
     if(sql.includes('WHERE user_id=? AND revoked_at IS NULL')){
       for(const s of state.sessions)if(s.uid===values[1])s.revoked=true;
     }
     return {meta:{changes:count}};
    }
    throw Error('Unhandled DB run '+sql);
   },_sql:sql,_args:values};
  }};
 },async batch(statements){
  const snapshot=JSON.stringify({plan:state.plan,status:state.status,access_until:state.access_until,last_event_at:state.last_event_at,provider:state.provider});
  for(const s of statements){
   if(s._sql.startsWith('INSERT INTO billing_event_audit')){
    const [p,id]=s._args,k=p+':'+id;
    if(state.receipts.has(k))throw Error('UNIQUE constraint failed: billing_event_audit.provider');
    state.receipts.set(k,true);
   } else if(s._sql.includes('INSERT INTO subscriptions')){
    const [u,p,status,until,provider,ref,updated,eventTime]=s._args;
    assert.equal(u,user);
    if(state.last_event_at===null||eventTime>state.last_event_at){
     Object.assign(state,{plan:p,status,access_until:until,provider,last_event_at:eventTime});
    }
   }else throw Error('Unhandled batch SQL');
  }
  void snapshot;
 }}
}
const enc=x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url');
async function signedJWT(){
 const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk={...(await crypto.subtle.exportKey('jwk',keys.publicKey)),kid:'mock',alg:'RS256'};
 const now=Math.floor(Date.now()/1000),payload={iss:'https://test-project.supabase.co/auth/v1',sub:user,aud:'authenticated',role:'authenticated',iat:now-5,exp:now+3600};
 const data=enc({alg:'RS256',kid:'mock'})+'.'+enc(payload);
 const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(data));
 return {jwt:data+'.'+Buffer.from(signature).toString('base64url'),jwk};
}
test('verified login, 1 session, explicit replacement, and JWT+session protected download',async()=>{
 const {jwt,jwk}=await signedJWT(),previous=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({keys:[jwk]}));
 try{
  const DB=dbMock('pro'),env={DB,WEB_ORIGIN:origin,SUPABASE_URL:'https://test-project.supabase.co',
   SESSION_LIMITER:{limit:async()=>({success:true})},PREMIUM_BUCKET:{get:async()=>({body:new Blob(['licensed private file'])})}};
  const req=(path,method='GET',session=null,extra={})=>new Request('https://example.workers.dev'+path,{method,
   headers:{origin,authorization:'Bearer '+jwt,...(session?{'x-sli-session':session}:{}),...extra}});
  assert.equal((await worker.fetch(req('/v1/protected/province-research'),env)).status,401);
  const login=await worker.fetch(req('/v1/sessions','POST'),env);
  assert.equal(login.status,201);const token=(await login.json()).session_token;assert.match(token,/^[0-9a-f]{64}$/);
  assert.equal((await worker.fetch(req('/v1/sessions','POST'),env)).status,409);
  assert.equal((await worker.fetch(req('/v1/protected/province-research','GET',token),env)).status,200);
  assert.equal((await worker.fetch(req('/v1/sessions/replace','POST',null),env)).status,400);
  const replacement=await worker.fetch(req('/v1/sessions/replace','POST',null,{'x-sli-confirm-replace':'replace'}),env);
  assert.equal(replacement.status,201);
  const newToken=(await replacement.json()).session_token;
  assert.equal((await worker.fetch(req('/v1/protected/province-research','GET',token),env)).status,401);
  assert.equal((await worker.fetch(req('/v1/protected/province-research','GET',newToken),env)).status,200);
  assert.equal((await worker.fetch(req('/v1/sessions/current','DELETE',newToken),env)).status,200);
  assert.equal((await worker.fetch(req('/v1/protected/province-research','GET',newToken),env)).status,401);
 }finally{globalThis.fetch=previous}
});
test('signed internal billing adapter: activate, upgrade, duplicate, stale event and chargeback',async()=>{
 const db=dbMock('pro'),key='b'.repeat(48),timestamp=String(Math.floor(Date.now()/1000));
 const hmac=async body=>{
  const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return Buffer.from(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(timestamp+'.'+body))).toString('hex');
 };
 const now=Date.now(),eventAt=new Date(now-30000).toISOString();
 const make=(id,type,plan,date,more={})=>JSON.stringify({event_id:id,type,user_id:user,plan,event_at:date,access_until:'2099-01-01T00:00:00.000Z',provider:'staging_adapter',provider_reference:'order_abcde123',currency:'IDR',payment_status:'settled',amount_idr:plan==='pro'?249000:749000,...more});
 const initial=make('event_initial_01','subscription.activated','pro',eventAt);
 assert.equal(await verifyBillingSignature(initial,timestamp,await hmac(initial),key),true);
 assert.equal(await verifyBillingSignature(initial,timestamp,'0'.repeat(64),key),false);
 assert.equal((await processBillingEvent(initial,db,now)).plan,'pro');
 assert.equal((await processBillingEvent(initial,db,now)).duplicate,true);
 const upgrade=make('event_upgrade_02','subscription.renewed','intelligence_pro',new Date(now-10000).toISOString());
 assert.equal((await processBillingEvent(upgrade,db,now)).plan,'intelligence_pro');
 const stale=make('event_old_03','subscription.canceled','pro',new Date(now-20000).toISOString());
 assert.equal((await processBillingEvent(stale,db,now)).plan,'intelligence_pro');
 const refund=make('event_refund_04','subscription.chargeback','intelligence_pro',new Date(now).toISOString());
 assert.equal((await processBillingEvent(refund,db,now)).plan,'open');
 await assert.rejects(()=>processBillingEvent(make('event_invalid_05','subscription.activated','pro',new Date(now).toISOString(),{amount_idr:100}),db,now),/unverified_payment/);
});
