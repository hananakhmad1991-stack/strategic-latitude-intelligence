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
 assert.ok(html.includes('signup?redirect_to='),'signup uses explicit callback target');
 assert.ok(html.includes('history.replaceState'),'implicit access token fragment immediately removed from browser URL');
 assert.ok(html.includes('finishConfirmation()'),'email confirmation return handler exists');
 assert.ok(html.includes('/auth/v1/logout?scope=global'),'staging console supports global signout to revoke exposed refresh sessions');
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

test('realistic callback fragment is removed before reading protected entitlement',async()=>{
 const html=stagingLoginPage(stage);
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 const actions={};
 const elements=new Map();
 for(const id of ['email','password','signup','login','me','session','replace','resource','logout','output']){
  elements.set(id,{value:id==='email'?'qa@example.org':id==='password'?'password-123':'',textContent:'',disabled:false,
   addEventListener:(event,callback)=>{actions[id+':'+event]=callback}});
 }
 const calls=[];
 const location={origin:base,pathname:'/staging-login',search:'',hash:'#access_token=example-test-only&token_type=bearer&refresh_token=should-never-log'};
 const history={replaceState:(_state,_title,path)=>{calls.push('scrub '+path);location.hash='';}};
 const fetch=async(url,init={})=>{
  calls.push('fetch '+url);
  if(url==='/v1/me')return {ok:true,status:200,json:async()=>({plan:'open'})};
  if(String(url).includes('/auth/v1/signup'))return {ok:true,status:200,json:async()=>({id:'test'})};
  throw Error('Unexpected test fetch '+url);
 };
 const {runInNewContext}=await import('node:vm');
 runInNewContext(script,{document:{getElementById:id=>elements.get(id)},
  location,history,fetch,URLSearchParams,JSON,Error,confirm:()=>true,console});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls[0],'scrub /staging-login','fragment cleared before any network access');
 assert.equal(location.hash,'');
 assert.ok(calls.includes('fetch /v1/me'),'callback access token checks account entitlement');
 await actions['signup:click']();
 const signupUrl=calls.find(x=>x.includes('/auth/v1/signup'));
 assert.ok(signupUrl,'signup request occurred');
 const target=new URL(signupUrl.slice(6));
 assert.equal(target.searchParams.get('redirect_to'),base+'/staging-login');
 assert.ok(!elements.get('output').textContent.includes('example-test-only'),'JWT never rendered to HTML');
});
