/* No third-party DOM packages: smoke-test the SLI legal reader's real source script. */
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const code=fs.readFileSync(new URL("../js/sli-regulatory-explorer.js",import.meta.url),"utf8");
const law=JSON.parse(fs.readFileSync(new URL("../data/sli-policy-regulatory-graph-2026.json",import.meta.url),"utf8"));
const monitor=JSON.parse(fs.readFileSync(new URL("../data/regulatory-monitor.json",import.meta.url),"utf8"));
test("Reader boots on current SLI data, searches Paris, filters regional laws and opens history",async()=>{
 const elems=new Map(),tabMap=new Map();
 const blank=id=>({
  id, value:id==="sort"?"priority":id==="query"?"":"all",hidden:false,textContent:"",innerHTML:"",handlers:{},options:[],
  addEventListener(t,cb){this.handlers[t]=cb},
  appendChild(x){this.options.push(x)},
  querySelectorAll(){return[]},
  classList:{toggle(){}},setAttribute(){},scrollIntoView(){},
  click(){this.handlers.click?.({target:this})}
 });
 const get=id=>{if(!elems.has(id))elems.set(id,blank(id));return elems.get(id)};
 for(const name of ["all","changes","regional","alerts"]){const tab=blank("tab-"+name);tab.dataset={tab:name};tabMap.set(name,tab);}
 const document={
  getElementById:get,
  createElement:tag=>blank("new-"+tag),
  querySelectorAll:s=>s==="[data-tab]"?[...tabMap.values()]:[],
  addEventListener(t,cb){if(t==="DOMContentLoaded")this.init=cb}
 };
 let visited=0;
 const context={
  document,
  window:{location:{href:"https://example.test/policy-regulatory-intelligence.html"},matchMedia:()=>({matches:false}),print(){}},
  history:{replaceState(){}},navigator:{},
  URL,Blob,console,
  fetch:async url=>{visited++;return {ok:true,json:async()=>url.includes("regulatory-monitor.json")?monitor:law}}
 };
 vm.runInNewContext(code,context,{timeout:5000});
 assert.equal(typeof document.init,"function","DOMContentLoaded listener missing");
 await document.init();
 assert.match(get("resultCount").textContent,/dokumen ditemukan/);
 assert.match(get("lawResults").innerHTML,/PP|UU|Perpres/);
 assert.match(get("detailBody").innerHTML,/Riwayat perubahan/);
 assert.equal(get("totalLaws").textContent,law.nodes.length);
 get("query").value="UU 16/2016";get("query").handlers.input({target:get("query")});
 assert.match(get("lawResults").innerHTML,/UU 16\/2016/,"Paris law must be searchable by exact reference");
 get("query").value="";get("query").handlers.input({target:get("query")});
 tabMap.get("regional").click();
 assert.match(get("lawResults").innerHTML,/Perda|Pergub|Perbup|Perwali/);
 tabMap.get("changes").click();
 assert.ok(Number.parseInt(get("resultCount").textContent)>0);
 assert.ok(visited>=1);
});
