import {PLANS,effectivePlan} from './access.mjs';
const enc=new TextEncoder();
const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
const tokenPattern=/^[a-f0-9]{64}$/;
export async function hashSession(token){
 if(!tokenPattern.test(token||''))throw Error('invalid_session_format');
 return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(token))));
}
export async function issueSession(userId,db){
 const row=await db.prepare('SELECT plan,status,access_until FROM subscriptions WHERE user_id=?').bind(userId).first();
 const plan=effectivePlan(row);
 const now=new Date(),expires=new Date(now.getTime()+30*24*3600*1000);
 const random=new Uint8Array(32);crypto.getRandomValues(random);
 const token=hex(random),hash=await hashSession(token);
 try{
  await db.prepare('INSERT INTO member_sessions(session_hash,user_id,created_at,last_seen_at,expires_at) VALUES(?,?,?,?,?)')
   .bind(hash,userId,now.toISOString(),now.toISOString(),expires.toISOString()).run();
 }catch(e){
  if(String(e).includes('session_limit_reached'))return {error:'session_limit_reached',limit:PLANS[plan].sessions};
  throw e;
 }
 return {session_token:token,expires_at:expires.toISOString(),plan,limit:PLANS[plan].sessions};
}
export async function verifySession(userId,token,db){
 if(!tokenPattern.test(token||''))return false;
 const hash=await hashSession(token);
 // Rank check makes plan downgrades effective without trusting the browser.
 const s=await db.prepare(`SELECT 1 AS allowed FROM member_sessions s
  WHERE s.session_hash=? AND s.user_id=? AND s.revoked_at IS NULL
  AND strftime('%s',s.expires_at)>strftime('%s','now')
  AND (SELECT COUNT(*) FROM member_sessions t WHERE t.user_id=s.user_id AND t.revoked_at IS NULL
   AND strftime('%s',t.expires_at)>strftime('%s','now')
   AND (t.created_at<s.created_at OR (t.created_at=s.created_at AND t.session_hash<=s.session_hash)))
   <= CASE COALESCE((SELECT plan FROM subscriptions WHERE user_id=? AND status IN ('active','trialing')
      AND strftime('%s',access_until)>strftime('%s','now')),'open')
      WHEN 'intelligence_pro' THEN 3 ELSE 1 END
  LIMIT 1`).bind(hash,userId,userId).first();
 return Boolean(s);
}
export async function revokeSession(userId,token,db){
 if(!tokenPattern.test(token||''))return false;
 const hash=await hashSession(token);
 const result=await db.prepare("UPDATE member_sessions SET revoked_at=? WHERE session_hash=? AND user_id=? AND revoked_at IS NULL")
  .bind(new Date().toISOString(),hash,userId).run();
 return Number(result?.meta?.changes||0)>0;
}
export async function revokeAllSessions(userId,db){
 await db.prepare("UPDATE member_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL")
  .bind(new Date().toISOString(),userId).run();
}
