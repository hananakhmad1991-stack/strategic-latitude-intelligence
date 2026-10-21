import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const script=await readFile(fileURLToPath(new URL("../../../js/sli-user-intelligence-client.js",import.meta.url)),"utf8");
const config=JSON.parse(await readFile(fileURLToPath(new URL("../../../config/sli-user-intelligence.json",import.meta.url)),"utf8"));
const HOST="https://sli-user-intelligence.hananakhmad1991.workers.dev";
assert.equal(config.enabled,true,"Restricted Chrome pilot must be explicitly enabled");
assert.equal(config.api_base,HOST+"/");
assert.equal(config.login_url,HOST+"/api/me");

class Element {
 constructor(tag){this.tagName=tag;this.children=[];this.listeners=new Map;this.textContent="";this.value="";this.disabled=false;}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=[...nodes];}
 addEventListener(type,callback){this.listeners.set(type,callback);}
}
async function boot(localList,remoteList){
 const storage=new Map([["sli-terminal-watchlist-v1",JSON.stringify(localList)]]);
 const root=new Element("section");
 const calls=[];const confirmations=[];let answer=false;
 const state={enrolled:true,preferences:{tickers:[...remoteList],sectors:[],kinds:["news","project","regulation"],include_sector:false,in_app:true}};
 const response=(data)=>({ok:true,status:200,headers:{get:()=> "application/json"},async json(){return structuredClone(data)}});
 const mockFetch=async(url,options={})=>{
  if(url==="./config/sli-user-intelligence.json")return {ok:true,async json(){return config}};
  assert.ok(url.startsWith(HOST+"/api/"),"API must target exact protected host");
  assert.equal(options.credentials,"include","Every API call needs Cloudflare Access cookie");
  calls.push({url,method:options.method||"GET",body:options.body||null});
  if(url.endsWith("/api/me"))return response({...state,identity_provider:"cloudflare_access"});
  if(url.endsWith("/api/preferences")){
   if(options.method==="PUT"){
    state.preferences=JSON.parse(options.body);state.enrolled=true;
    return response(state);
   }
   return response(state);
  }
  if(url.includes("/api/inbox"))return response({items:[],unread:0});
  throw Error("unexpected URL "+url);
 };
 const dom={documentElement:{lang:"id"},readyState:"complete",
  createElement:tag=>new Element(tag),
  getElementById:id=>id==="sliUserIntelligence"?root:null,
  addEventListener(){}};
 const env={document:dom,window:{confirm:q=>{confirmations.push(q);return answer}},
  fetch:mockFetch,
  URL,localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,val)=>storage.set(key,String(val))},
  console};
 vm.runInNewContext(script,env,{filename:"sli-user-intelligence-client.js"});
 await new Promise(resolve=>setTimeout(resolve,0));
 function findButton(phrase){
  const flatten=x=>[x,...x.children.flatMap(y=>y instanceof Element?flatten(y):[])];
  const b=flatten(root).find(x=>x.tagName==="button"&&x.textContent.includes(phrase));
  assert.ok(b,"Missing pilot button "+phrase);
  return b;
 }
 async function click(phrase){
  const btn=findButton(phrase);
  await btn.listeners.get("click")();
 }
 return {calls,confirmations,state,storage,root,click,setConfirmation:x=>{answer=x}};
}
// First opening must not retrieve private data or write remote preferences.
const a=await boot([],["ANTM","BYAN"]);
assert.equal(a.calls.length,0,"No automatic requests or synchronization on page open");
await a.click("Periksa akun");
assert.equal(a.calls.filter(x=>x.method==="PUT").length,0);
assert.equal(a.root.children.some(x=>x.textContent?.includes("ANTM, BYAN")),true,
 "Read-only account check should preview saved cloud ticker names");
await a.click("Ganti watchlist akun");
assert.equal(a.calls.filter(x=>x.method==="PUT").length,0,
 "Empty browser watchlist must never erase existing cloud tickers");
a.setConfirmation(true);
await a.click("Ganti watchlist browser");
assert.deepEqual(JSON.parse(a.storage.get("sli-terminal-watchlist-v1")),["ANTM","BYAN"],
 "Explicit account-to-browser restore must preserve both existing cloud tickers");
assert.equal(a.calls.filter(x=>x.method==="PUT").length,0,
 "Account-to-browser restore must be local-only");
// Preview then reject replace-account confirmation: no write.
const b=await boot(["PGEO"],["ANTM","BYAN"]);
await b.click("Ganti watchlist akun");
assert.equal(b.confirmations.length,1);
assert.equal(b.calls.filter(x=>x.method==="PUT").length,0);
assert.deepEqual(b.state.preferences.tickers,["ANTM","BYAN"]);
// Explicit confirm allows only own account preference replacement.
b.setConfirmation(true);
await b.click("Ganti watchlist akun");
assert.deepEqual(b.state.preferences.tickers,["PGEO"]);
assert.equal(b.calls.filter(x=>x.method==="PUT").length,1);
// Already-matching watchlist never writes redundantly.
const c=await boot(["PGEO"],["PGEO"]);
await c.click("Ganti watchlist akun");
assert.equal(c.calls.filter(x=>x.method==="PUT").length,0);
assert.equal(c.confirmations.length,0);
console.log("SLI restricted pilot client QA passed: no auto-sync, read-only preview, empty overwrite blocked, confirmed writes only, local restore");
