// Verified INTERNAL adapter events only. Direct payment-provider callbacks need their own adapter.
import {effectivePlan} from './access.mjs';
const enc=new TextEncoder();
const timingSafe=(a,b)=>a.length===b.length&&a.reduce((v,x,i)=>v|(x^b[i]),0)===0;
const iso=x=>typeof x==='string'&&!Number.isNaN(Date.parse(x))&&new Date(x).toISOString()===x;
export async function verifyBillingSignature(body,timestamp,signature,secret,now=Date.now()){
 const seconds=Number(timestamp);
 if(!/^[0-9]{10}$/.test(timestamp||'')||!Number.isSafeInteger(seconds)||Math.abs(now/1000-seconds)>300||typeof secret!=='string'||secret.length<32||!/^[a-f0-9]{64}$/.test(signature||''))return false;
 const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const actual=new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(timestamp+'.'+body)));
 return timingSafe(actual,new Uint8Array(signature.match(/../g).map(x=>parseInt(x,16))));
}
export async function processBillingEvent(raw,db,now=Date.now()){
 const e=JSON.parse(raw);
 const actions=['subscription.activated','subscription.renewed','subscription.canceled','subscription.expired','subscription.refunded','subscription.chargeback'];
 if(!e||!/^[-A-Za-z0-9_]{8,120}$/.test(e.event_id||'')||
 !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(e.user_id||'')||
 !actions.includes(e.type)||!['pro','intelligence_pro'].includes(e.plan)||
 !iso(e.event_at)||!iso(e.access_until)||Math.abs(Date.parse(e.event_at)-now)>90*86400000||
 !/^[A-Za-z0-9_-]{2,40}$/.test(e.provider||'')||
 !/^[-A-Za-z0-9_]{6,180}$/.test(e.provider_reference||'')||
 e.currency!=='IDR')throw Error('invalid_billing_event');
 const activate=['subscription.activated','subscription.renewed'].includes(e.type);
 if(activate&&(e.payment_status!=='settled'||e.amount_idr!==(e.plan==='pro'?249000:749000)||Date.parse(e.access_until)<=now))throw Error('unverified_payment');
 const existing=await db.prepare('SELECT event_id FROM billing_event_audit WHERE provider=? AND event_id=?').bind(e.provider,e.event_id).first();
 if(existing)return {ok:true,duplicate:true};
 const status=activate?'active':'canceled';
 const until=activate?e.access_until:'1970-01-01T00:00:00.000Z';
 try{
  await db.batch([
   db.prepare('INSERT INTO billing_event_audit(provider,event_id,event_type,event_at) VALUES(?,?,?,?)').bind(e.provider,e.event_id,e.type,e.event_at),
   db.prepare(`INSERT INTO subscriptions(user_id,plan,status,access_until,provider,provider_reference,updated_at,last_event_at)
    VALUES(?,?,?,?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET
      plan=excluded.plan,status=excluded.status,access_until=excluded.access_until,
      provider=excluded.provider,provider_reference=excluded.provider_reference,
      updated_at=excluded.updated_at,last_event_at=excluded.last_event_at
    WHERE subscriptions.last_event_at IS NULL OR excluded.last_event_at>subscriptions.last_event_at`)
    .bind(e.user_id,e.plan,status,until,e.provider,e.provider_reference,new Date(now).toISOString(),e.event_at)
  ]);
 }catch(err){
  // Atomic D1 batch prevents duplicate event from modifying entitlements twice.
  if(/UNIQUE constraint failed: billing_event_audit/i.test(String(err)))return {ok:true,duplicate:true};
  throw err;
 }
 const record=await db.prepare('SELECT plan,status,access_until FROM subscriptions WHERE user_id=?').bind(e.user_id).first();
 return {ok:true,duplicate:false,plan:effectivePlan(record)};
}
