// This endpoint accepts only events signed by an INTERNAL trusted billing adapter.
// NOT a direct Midtrans/Xendit signature implementation. Do not expose until merchant onboarding.
import {effectivePlan} from './access.mjs';
const enc=new TextEncoder();
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const timingSafe=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
export async function verifyBillingSignature(body,timestamp,signature,secret,now=Date.now()){
 const seconds=Number(timestamp);
 if(!Number.isSafeInteger(seconds)||Math.abs(now/1000-seconds)>300||!secret||!/^[a-f0-9]{64}$/.test(signature||''))return false;
 const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const actual=new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(timestamp+'.'+body)));
 return timingSafe(actual,new Uint8Array(signature.match(/../g).map(x=>parseInt(x,16))));
}
export async function processBillingEvent(raw,db){
 const e=JSON.parse(raw);
 if(!e||!/^[-A-Za-z0-9_]{8,120}$/.test(e.event_id||'')||
 !/^[0-9a-f-]{36}$/i.test(e.user_id||'')||
 !['subscription.activated','subscription.renewed','subscription.canceled','subscription.expired'].includes(e.type)||
 !['pro','intelligence_pro','enterprise'].includes(e.plan)||
 !Number.isFinite(Date.parse(e.access_until))||
 !/^[A-Za-z0-9_-]{1,40}$/.test(e.provider||''))throw Error('invalid_billing_event');
 // A single D1 batch is transactional: duplicate receipt rejects both mutations.
 // Cancellation disables access immediately; refunds/chargebacks should emit subscription.expired.
 const status=['subscription.canceled','subscription.expired'].includes(e.type)?'canceled':'active';
 const until=status==='canceled'?new Date(0).toISOString():e.access_until;
 await db.batch([
  db.prepare('INSERT INTO billing_event_audit(provider,event_id,event_type) VALUES(?,?,?)').bind(e.provider,e.event_id,e.type),
  db.prepare('INSERT INTO subscriptions(user_id,plan,status,access_until,provider,provider_reference,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET plan=excluded.plan,status=excluded.status,access_until=excluded.access_until,provider=excluded.provider,provider_reference=excluded.provider_reference,updated_at=excluded.updated_at')
   .bind(e.user_id,e.plan,status,until,e.provider,e.provider_reference||null,new Date().toISOString())
 ]);
 return {ok:true,plan:effectivePlan({plan:e.plan,status,access_until:until})};
}
