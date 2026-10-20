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

test("Expanded legal register includes 2026 amendments, partial repeals, and distinct financial rules",()=>{
 const nodes=new Map(law.nodes.map(n=>[n.id,n]));
 assert.ok(law.nodes.length>=127);
 assert.equal(nodes.get("uu4p2sk").status,"amended");
 assert.equal(nodes.get("permendag31pmse").status,"repealed");
 assert.equal(nodes.get("uu4p2sk2026").sector,"finance");
 assert.ok(law.edges.some(x=>x.from==="uu4p2sk"&&x.to==="uu4p2sk2026"&&x.type==="amended_by"));
 assert.ok(law.edges.some(x=>x.from==="perpres66bapanas"&&x.to==="perpres83bgn"&&x.type==="partially_repealed_by"));
 assert.match(code,/Keuangan & pasar modal/);
 assert.match(code,/finance:n=>n.sector==="finance"/);
 for(const id of ["pp71pste","perpres39onedata","perpres125cpp","pp12daerah","perpres55minerba"]){
  assert.match(nodes.get(id).source,/^https:\/\/peraturan\.bpk\.go\.id\/Details\//);
 }
});

test("Regional legal provenance and legacy RTRW are reviewable without fake OJK enactment",()=>{
 const nodes=new Map(law.nodes.map(n=>[n.id,n]));
 assert.ok(law.nodes.length>=153);
 assert.ok(law.edges.length>=198);
 assert.equal(nodes.get("perda_magelang_rtrwold2011").status,"repealed");
 assert.equal(nodes.get("pojk51sustain2017").status,"check_current");
 assert.match(nodes.get("pojk51sustain2017").note,/RANCANGAN/);
 for(const id of ["pres82iiv2022","pres47cyber2023","bssn5iiv2025","perda_diy_pangan2026","perda_jateng_rtrw2024","perda_lampung_rtrw2023","perda_ntb_invest2024","kepmen88papuabaratdaya2026"]) {
  assert.match(nodes.get(id).source,/^https:\/\//);
  assert.equal(nodes.get(id).source_checked_at,"2026-10-20");
 }
 assert.ok(law.edges.some(x=>x.from==="perda_magelang_rtrw2024"&&x.to==="perda_magelang_rtrwold2011"&&x.type==="supersedes_noncurrent_record"));
});

test("Bengkulu PDRD and HKPD fiscal change histories remain distinct",()=>{
 const n=new Map(law.nodes.map(x=>[x.id,x]));
 assert.equal(n.get("pp10pdrdold2021").status,"repealed");
 assert.equal(n.get("pp35hkpd2023").status,"check_current");
 assert.equal(n.get("perda_bengkulu_pdrd2023").status,"amended");
 assert.equal(n.get("perda_bengkulu_pdrd2026").status,"amending_instrument");
 assert.ok(law.edges.some(x=>x.from==="pp35hkpd2023"&&x.to==="pp10pdrdold2021"&&x.type==="repeals"));
 assert.ok(law.edges.some(x=>x.from==="perda_bengkulu_pdrd2023"&&x.to==="perda_bengkulu_pdrd2026"&&x.type==="amended_by"));
});
