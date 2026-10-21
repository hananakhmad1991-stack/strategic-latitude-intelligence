import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync,existsSync} from "node:fs";
import {join} from "node:path";

const root=new URL("../",import.meta.url).pathname;
const read=p=>readFileSync(join(root,p),"utf8");
const pages=readdirSync(root).filter(p=>p.endsWith(".html")&&p!=="sli-user-intelligence-qa.html").sort();
const clean=ref=>ref.split(/[?#]/)[0].replace(/^\.\//,"");

test("All published HTML routes have resolvable local assets and valid inline JavaScript",()=>{
 assert.ok(pages.length>=39,"Unexpected loss of published SLI dashboards");
 let localCount=0,scriptCount=0;
 for(const file of pages){
  const html=read(file);
  assert.match(html,/SLI chrome prepaint/,"Prepaint missing: "+file);
  assert.match(html,/js\/sli-navigation\.js\?v=/,"Shared navigation missing: "+file);
  for(const m of html.matchAll(/(?:src|href)\s*=\s*["']([^"'#]+)["']/gi)){
   const uri=m[1],local=clean(uri);
   if(!local||/^(?:https?:|mailto:|tel:|data:|\/\/|javascript:|about:)/i.test(uri)||uri.includes("$"+"{"))continue;
   assert.ok(!local.startsWith("/")&&!local.includes(".."),file+": unsafe route "+uri);
   assert.ok(existsSync(join(root,local)),file+": broken local route "+uri);
   localCount++;
  }
  for(const script of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)){
   if(!script[1].trim())continue;
   assert.doesNotThrow(()=>new Function(script[1]),file+": invalid inline script");
   scriptCount++;
  }
 }
 assert.ok(localCount>=450,"Too few local routes checked");
 assert.ok(scriptCount>=60,"Too few inline scripts checked");
});

test("Private owner-account QA remains noindex and isolated from public dashboard navigation",()=>{
 const qa=read("sli-user-intelligence-qa.html");
 assert.match(qa,/name="robots" content="noindex, nofollow"/);
 assert.match(qa,/Content-Security-Policy/);
 assert.match(qa,/default-src 'none'/);
 assert.doesNotMatch(qa,/js\/sli-navigation\.js/);
 assert.doesNotMatch(qa,/js\/sli-secondary-evidence\.js/);
});

test("Search index source records and specialist deep links stay real",()=>{
 const registry=JSON.parse(read("data/site-search-index.json"));
 assert.equal(registry.schema,"sli-search-1");
 assert.ok(registry.entries.length>=1400);
 assert.equal(new Set(registry.entries.map(r=>r.id)).size,registry.entries.length);
 const pagesSet=new Set(registry.pages.map(p=>p.id));
 for(const entry of registry.entries){
  assert.ok(pagesSet.has(entry.page),"Invalid search scope: "+entry.id);
  if(entry.path){
   assert.match(entry.path,/^[a-z0-9-]+\.html$/);
   assert.ok(existsSync(join(root,entry.path)),"Missing search destination: "+entry.path);
  }
  if(entry.source){
   assert.match(entry.source,/^data\/[a-z0-9-]+\.json$/);
   assert.ok(existsSync(join(root,entry.source)),"Missing search source: "+entry.source);
  }
  if(entry.anchor)assert.match(entry.anchor,/^[a-z0-9-]+$/i);
 }
 const pairs=[
  ["food-agriculture-intelligence.html","food"],
  ["policy-regulatory-intelligence.html","policy"],
  ["ai-intelligence-hub.html","ai"],
  ["sli-research-ai.html","methodology"]
 ];
 for(const [path,page] of pairs)assert.ok(registry.entries.some(e=>e.path===path&&e.page===page),"Unindexed specialist route: "+path);
});

test("Dashboard transitions reject obsolete chapter work",()=>{
 const html=read("index.html"),search=read("js/site-search.js");
 assert.match(html,/document\.getElementById\('sliResearchRoot'\)!==chapterRoot\)return/);
 assert.match(html,/window\.addEventListener\('pageshow',event=>/);
 assert.match(search,/requested\+\+;pendingTarget=null/);
 assert.match(search,/if\(pendingTarget&&document\.getElementById\("content"\)\?\.contains/);
 assert.match(search,/if\(jumped&&\(!item\.komdigi_tab\|\|appliedTab\)/);
});
