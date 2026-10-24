// STAGING ONLY: verify remote D1 session policy and private R2 with disposable QA records.
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
const cfg=JSON.parse(readFileSync('wrangler.bootstrap-stage.json','utf8'));
const dbName='sli-memberships-stage-20261024',bucketName='sli-membership-private-stage-20261024';
const host='https://sli-membership-infra-stage.hananakhmad1991.workers.dev';
if(cfg.name!=='sli-membership-infra-stage'||cfg.d1_databases?.[0]?.database_name!==dbName||
cfg.vars?.ENVIRONMENT!=='staging'||cfg.vars?.BILLING_STAGING_ENABLED!=='false')
 throw Error('Acceptance runs ONLY on billing-disabled Membership staging');
if(!process.env.CLOUDFLARE_API_TOKEN||!process.env.CLOUDFLARE_ACCOUNT_ID)
 throw Error('Missing Cloudflare staging token');
const uid=randomUUID(),q=s=>"'"+s.replaceAll("'","''")+"'",future=new Date(Date.now()+86400000*3).toISOString();
const hash=()=>randomBytes(32).toString('hex'),h=[hash(),hash(),hash(),hash()];
const tmp=mkdtempSync(join(tmpdir(),'sli-membership-qa-'));
let seeded=false,obj=null,uploaded=false,passed=0;
function cf(args,expectError){
 const p=spawnSync('npx',['--yes','wrangler@4',...args],{encoding:'utf8',timeout:120000,maxBuffer:2e6});
 if(p.error)throw p.error;
 const log=(p.stdout||'')+'\n'+(p.stderr||'');
 if(expectError){
  if(p.status===0||!log.includes(expectError))throw Error('Expected rejection '+expectError+' but received: '+log.slice(-600));
  passed++;return null;
 }
 if(p.status!==0)throw Error('Cloudflare command failed: '+log.slice(-800));
 if(args.includes('--json')){
  const arr=JSON.parse(p.stdout);
  if(!Array.isArray(arr)||arr.some(x=>!x.success))throw Error('D1 command reported failure');
  return arr;
 }
 return log;
}
const sql=(s,expected)=>cf(['d1','execute','DB','--remote','--json','--yes','--config','wrangler.bootstrap-stage.json','--command',s],expected);
const rows=s=>sql(s).flatMap(x=>x.results||[]);
function check(x,label){if(!x)throw Error('FAIL: '+label);passed++;console.log('PASS '+label)}
const insert=i=>'INSERT INTO member_sessions(session_hash,user_id,created_at,last_seen_at,expires_at) VALUES('+q(h[i])+','+q(uid)+','+q('2026-10-24T00:00:00.000Z')+','+q('2026-10-24T00:00:00.000Z')+','+q(future)+')';
try{
 sql('INSERT INTO subscriptions(user_id,plan,status,access_until) VALUES('+q(uid)+", 'pro', 'active',"+q(future)+')');
 seeded=true;
 sql(insert(0));
 sql(insert(1),'session_limit_reached');
 check(rows('SELECT COUNT(*) AS n FROM member_sessions WHERE user_id='+q(uid))[0]?.n===1,'Professional 1-session SQL trigger');
 sql("UPDATE subscriptions SET plan='intelligence_pro' WHERE user_id="+q(uid));
 sql(insert(1));sql(insert(2));
 sql(insert(3),'session_limit_reached');
 check(rows('SELECT COUNT(*) AS n FROM member_sessions WHERE user_id='+q(uid))[0]?.n===3,'Intelligence Pro 3-session SQL trigger');
 sql("UPDATE subscriptions SET plan='pro' WHERE user_id="+q(uid));
 const rankQuery='SELECT COUNT(*) AS n FROM member_sessions s WHERE s.user_id='+q(uid)+" AND s.revoked_at IS NULL AND strftime('%s',s.expires_at)>strftime('%s','now') AND (SELECT COUNT(*) FROM member_sessions t WHERE t.user_id=s.user_id AND t.revoked_at IS NULL AND strftime('%s',t.expires_at)>strftime('%s','now') AND (t.created_at<s.created_at OR (t.created_at=s.created_at AND t.session_hash<=s.session_hash)))<=1";
 check(rows(rankQuery)[0]?.n===1,'Downgrade immediately allows only 1 ranked session');
 sql('UPDATE member_sessions SET revoked_at='+q(new Date().toISOString())+' WHERE user_id='+q(uid)+' AND session_hash='+q(h[0]));
 check(rows('SELECT COUNT(*) AS n FROM member_sessions WHERE user_id='+q(uid)+' AND revoked_at IS NOT NULL')[0]?.n===1,'Session revocation persists');
 const eid='qa_'+uid;
 const event="INSERT INTO billing_event_audit(provider,event_id,event_type,event_at) VALUES('staging-qa',"+q(eid)+",'subscription.activated',"+q(new Date().toISOString())+')';
 sql(event);sql(event,'UNIQUE constraint failed');
 check(rows('SELECT COUNT(*) AS n FROM billing_event_audit WHERE event_id='+q(eid))[0]?.n===1,'D1 rejects billing event replay');
 const call=(path,opt={})=>fetch(host+path,{signal:AbortSignal.timeout(20000),redirect:'error',...opt});
 const [health,anon,asset,billing,origin]=await Promise.all([
 call('/healthz'),call('/v1/me'),call('/v1/protected/province-research'),
 call('/v1/billing/internal-event',{method:'POST',body:'{}'}),call('/v1/me',{headers:{Origin:'https://malicious.example'}})]);
 check(health.status===200,'Staging live healthy');
 check(anon.status===401,'Anonymous /v1/me denied');
 check(asset.status===401,'Protected R2 download requires a signed JWT');
 check(billing.status===503,'Staging billing remains disabled');
 check(origin.status===403,'Foreign Origin rejected');
 if(cfg.r2_buckets?.find(x=>x.binding==='PREMIUM_BUCKET')?.bucket_name!==bucketName)
  throw Error('Private R2 Worker binding missing');
 obj='_qa/membership/'+uid+'.json';
 const payload=JSON.stringify({type:'synthetic-acceptance',id:uid}),input=join(tmp,'in.json'),output=join(tmp,'out.json');
 writeFileSync(input,payload,{mode:0o600});
 cf(['r2','object','put',bucketName+'/'+obj,'--file',input]);uploaded=true;
 cf(['r2','object','get',bucketName+'/'+obj,'--file',output]);
 check(createHash('sha256').update(readFileSync(output)).digest('hex')===
 createHash('sha256').update(payload).digest('hex'),'Private R2 upload/download SHA256 matches');
 console.log('STAGING ACCEPTANCE PASS, checks='+passed);
}finally{
 if(uploaded){
  try{cf(['r2','object','delete',bucketName+'/'+obj]);console.log('Temporary R2 object removed')}
  catch(e){console.error('R2 QA cleanup failure: '+e.message);process.exitCode=1}
 }
 if(seeded){
  for(const statement of [
   'DELETE FROM member_sessions WHERE user_id='+q(uid),
   'DELETE FROM subscriptions WHERE user_id='+q(uid),
   "DELETE FROM billing_event_audit WHERE provider='staging-qa' AND event_id="+q('qa_'+uid)]){
   try{sql(statement)}catch(e){console.error('D1 QA cleanup failure: '+e.message);process.exitCode=1}
  }
  try{check(rows('SELECT (SELECT COUNT(*) FROM subscriptions WHERE user_id='+q(uid)+')+(SELECT COUNT(*) FROM member_sessions WHERE user_id='+q(uid)+')+(SELECT COUNT(*) FROM billing_event_audit WHERE event_id='+q('qa_'+uid)+') AS n')[0]?.n===0,'Synthetic D1 records fully removed')}
  catch(e){console.error('D1 cleanup verification failed: '+e.message);process.exitCode=1}
 }
 rmSync(tmp,{recursive:true,force:true});
}
