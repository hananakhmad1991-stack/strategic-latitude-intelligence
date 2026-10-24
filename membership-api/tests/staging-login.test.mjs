import test from 'node:test';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import worker from '../src/index.js';
import {stagingLoginPage} from '../src/staging-login.mjs';
const base='https://sli-membership-infra-stage.hananakhmad1991.workers.dev';
const stage={ENVIRONMENT:'staging',STAGING_LOGIN_UI_ENABLED:'true',SUPABASE_URL:'https://staging-qa.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_abcdefghijklmno',WEB_ORIGIN:'https://hananakhmad1991-stack.github.io'};
test('staging page only rendered with dedicated staging mode + public key',()=>{
 const html=stagingLoginPage(stage);
 assert.ok(html.includes('Membership Acceptance Console'));
 assert.ok(html.includes('sb_publishable_abcdefghijklmno'));
 assert.ok(!html.includes('service_role'));
 assert.equal(stagingLoginPage({...stage,ENVIRONMENT:'production'}),null);
 assert.equal(stagingLoginPage({...stage,STAGING_LOGIN_UI_ENABLED:'false'}),null);
 assert.equal(stagingLoginPage({...stage,SUPABASE_PUBLISHABLE_KEY:'secret-key'}),null);
 const script=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(script,'staging client logic is present');
 new Script(script[1],{filename:'staging-login-inline.js'});
});
test('staging browser route has restrictive CSP, and production route is hidden',async()=>{
 const req=new Request(base+'/staging-login');
 const yes=await worker.fetch(req,stage);
 assert.equal(yes.status,200);
 assert.match(yes.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 assert.equal(yes.headers.get('cache-control'),'no-store');
 assert.equal((await worker.fetch(req,{...stage,ENVIRONMENT:'production'})).status,404);
});
test('staging Worker own origin allowed only for staging console, untrusted origin denied',async()=>{
 const path=base+'/v1/me';
 const own=await worker.fetch(new Request(path,{headers:{Origin:base}}),stage);
 assert.equal(own.status,503,'without DB must fail closed, not origin error');
 const malicious=await worker.fetch(new Request(path,{headers:{Origin:'https://malicious.example'}}),stage);
 assert.equal(malicious.status,403);
 const production=await worker.fetch(new Request(path,{headers:{Origin:base}}),{...stage,ENVIRONMENT:'production'});
 assert.equal(production.status,403);
});
