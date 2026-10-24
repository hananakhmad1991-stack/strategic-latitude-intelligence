import {PLANS,effectivePlan} from './access.mjs';
const encode=new TextEncoder();
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export async function hashSession(token){
 return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encode.encode(token))));
}
export async function issueSession(userId,db){
 const row=await db.prepare('SELECT plan,status,access_until FROM subscriptions WHERE user_id=?').bind(userId).first();
 const plan=effectivePlan(row);
 // Prune obsolete rows so trial expiry/plan downgrades cannot preserve extra active sessions.
 await db.prepare("UPDATE member_sessions SET revoked_at=datetime('now') WHERE user_id=? AND revoked_at IS NULL AND expires_at<=datetime('now')").bind(userId).run();
 const data=new Uint8Array(32);crypto.getRandomValues(data);
 const token=hex(data),hash=await hashSession(token);
 const now=new Date(),expires=new Date(now.getTime()+30*24*3600*1000);
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
 if(!/^[0-9a-f]{64}$/.test(token||''))return false;
 const hash=await hashSession(token);
 const s=await db.prepare("SELECT session_hash FROM member_sessions WHERE session_hash=? AND user_id=? AND revoked_at IS NULL AND expires_at>datetime('now')").bind(hash,userId).first();
 if(!s)return false;
 // Downgrades must immediately enforce the reduced cap, prioritizing older registered sessions.
 const row=await db.prepare('SELECT plan,status,access_until FROM subscriptions WHERE user_id=?').bind(userId).first();
 const limit=PLANS[effectivePlan(row)].sessions;
 const position=await db.prepare("SELECT COUNT(*) AS n FROM member_sessions WHERE user_id=? AND revoked_at IS NULL AND expires_at>datetime('now') AND (created_at<? OR (created_at=? AND session_hash<=?))").bind(userId,new Date(0).toISOString(),'',hash).first();
 // Accurate order check in a separate query (SQLite stable creation order + hash tie-break).
 const rank=await db.prepare("SELECT COUNT(*) AS n FROM member_sessions WHERE user_id=? AND revoked_at IS NULL AND expires_at>datetime('now') AND (created_at<(SELECT created_at FROM member_sessions WHERE session_hash=?) OR (created_at=(SELECT created_at FROM member_sessions WHERE session_hash=?) AND session_hash<=?))").bind(userId,hash,hash,hash).first();
 void position;
 return Number(rank?.n||0)<=limit;
}
export async function revokeSession(userId,token,db){
 if(!/^[0-9a-f]{64}$/.test(token||''))return false;
 const hash=await hashSession(token);
 await db.prepare("UPDATE member_sessions SET revoked_at=datetime('now') WHERE session_hash=? AND user_id=?").bind(hash,userId).run();
 return true;
}
