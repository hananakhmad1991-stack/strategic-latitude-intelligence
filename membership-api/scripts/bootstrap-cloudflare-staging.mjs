// Provision only the fixed, empty SLI staging resources. Never touches production.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const d1Name='sli-memberships-stage-20261024';
const bucketName='sli-membership-private-stage-20261024';
const origin='https://hananakhmad1991-stack.github.io';
if(!process.env.CLOUDFLARE_ACCOUNT_ID||!process.env.CLOUDFLARE_API_TOKEN)throw Error('Cloudflare deploy credentials unavailable');
function wrangler(args,{allowFailure=false}={}){
 const p=spawnSync('npx',['--yes','wrangler@4',...args],{encoding:'utf8',timeout:120000,env:process.env,maxBuffer:2_000_000});
 if(p.error)throw p.error;
 if(p.status!==0&&!allowFailure)throw Error('Wrangler '+args.slice(0,3).join(' ')+' failed (code '+p.status+'): '+(p.stderr||p.stdout).slice(-900));
 return {ok:p.status===0,text:p.stdout,err:p.stderr};
}
const getD1=()=>{
 const data=JSON.parse(wrangler(['d1','list','--json']).text);
 const list=Array.isArray(data)?data:data.result;
 if(!Array.isArray(list))throw Error('Unexpected Cloudflare D1 list format');
 return list.find(x=>x.name===d1Name);
};
let d1=getD1();
if(!d1){console.log('Creating isolated empty D1 staging resource.');wrangler(['d1','create',d1Name]);d1=getD1();}
const uuid=d1?.uuid||d1?.id;
if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(uuid||''))throw Error('Created staging D1 but could not confirm its UUID');
console.log('Verified staging D1: '+d1Name);
let info=wrangler(['r2','bucket','info',bucketName,'--json'],{allowFailure:true});
if(!info.ok){
 console.log('Attempting creation of private R2 staging bucket.');
 const created=wrangler(['r2','bucket','create',bucketName],{allowFailure:true});
 if(!created.ok){
  if(/\b10042\b/.test(created.err+' '+created.text)){
   console.log('R2_NOT_ENABLED: Cloudflare account has not enabled R2. Continuing isolated D1 migration WITHOUT R2 binding; customer storage remains disabled.');
   info={ok:false};
  }else throw Error('Unable to create private R2 bucket: '+(created.err||created.text).slice(-800));
 }else info=wrangler(['r2','bucket','info',bucketName,'--json']);
}
let r2Enabled=false;
if(info.ok){
 const r2=JSON.parse(info.text);
 if(r2?.name!==bucketName&&r2?.bucket?.name!==bucketName)throw Error('R2 resource identity could not be verified');
 if(r2?.dev_url_enabled===true||r2?.publicAccess===true||r2?.devUrlEnabled===true)throw Error('R2 bucket unexpectedly public');
 r2Enabled=true;
 console.log('Verified private-by-default R2 staging bucket: '+bucketName);
}
const config={
 name:'sli-membership-infra-stage',main:'src/index.js',compatibility_date:'2026-10-24',workers_dev:true,
 vars:{WEB_ORIGIN:origin,ENVIRONMENT:'staging',BILLING_STAGING_ENABLED:'false'},
 d1_databases:[{binding:'DB',database_name:d1Name,database_id:uuid,migrations_dir:'migrations'}],
 ...(r2Enabled?{r2_buckets:[{binding:'PREMIUM_BUCKET',bucket_name:bucketName}]}:{}),
 ratelimits:[{name:'SESSION_LIMITER',namespace_id:'15062',simple:{limit:5,period:60}}]
};
fs.writeFileSync('wrangler.bootstrap-stage.json',JSON.stringify(config,null,2),{mode:0o600});
console.log('Staging Worker config generated with no identity URL, merchant credentials or customer data. R2 enabled: '+r2Enabled);
