import fs from 'node:fs';
const {SLI_MEMBERSHIP_STAGING_D1_ID:d1,SLI_MEMBERSHIP_STAGING_BUCKET:bucket,
 SLI_SUPABASE_STAGING_URL:supabase,SLI_MEMBERSHIP_STAGING_ORIGIN:origin}=process.env;
if(!/^[0-9a-f-]{36}$/i.test(d1||''))throw Error('Missing/invalid staging D1 UUID');
if(!/^[a-z0-9][a-z0-9_-]{2,62}$/.test(bucket||''))throw Error('Missing/invalid staging R2 bucket');
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabase||''))throw Error('Missing/invalid staging Supabase project URL');
if(!/^https:\/\/[a-z0-9.-]+$/.test(origin||''))throw Error('Missing/invalid trusted https staging Origin');
const config={
 name:'sli-membership-integration-stage',main:'src/index.js',compatibility_date:'2026-10-24',workers_dev:true,
 vars:{WEB_ORIGIN:origin,SUPABASE_URL:supabase,ENVIRONMENT:'staging',BILLING_STAGING_ENABLED:'false'},
 d1_databases:[{binding:'DB',database_name:'sli-memberships-staging',database_id:d1,migrations_dir:'migrations'}],
 r2_buckets:[{binding:'PREMIUM_BUCKET',bucket_name:bucket}],
 ratelimits:[{name:'SESSION_LIMITER',namespace_id:'15061',simple:{limit:5,period:60}}]
};
fs.writeFileSync('wrangler.integration-stage.json',JSON.stringify(config,null,2),{mode:0o600});
console.log('Validated staging configuration generated; billing remains disabled.');
