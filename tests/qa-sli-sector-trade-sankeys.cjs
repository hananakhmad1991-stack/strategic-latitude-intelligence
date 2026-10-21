#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const read=p=>fs.readFileSync(p,"utf8"),food=JSON.parse(read("data/food-agriculture-2026.json")),
marine=JSON.parse(read("data/sli-marine-fisheries-trade-2025.json"));
assert.equal(marine.schema,"sli-marine-fisheries-trade-2025-v1");
assert.match(marine.source_url,/^https:\/\/www\.kkp\.go\.id\//);
assert.equal(marine.period,"2025-01/2025-12");
assert.equal(marine.views.length,2);
class El{
 constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.events={};this.style={};this.isConnected=true;this.value="";this.textContent="";}
 append(...x){this.children.push(...x)}
 replaceChildren(...x){this.children=[...x]}
 setAttribute(k,v){this.attributes[k]=String(v)}
 addEventListener(k,v){this.events[k]=v}
}
const root=new El("div"),listeners={};
const document={createElement:t=>new El(t),createElementNS:(ns,t)=>new El(t),
 getElementById:id=>id==="sliTradeRoot"?root:null,
 addEventListener:(event,cb)=>{listeners[event]=cb}};
const fixtures={"./data/food-agriculture-2026.json":food,
 "./data/sli-marine-fisheries-trade-2025.json":marine,
 "data/commodity-trade-flows.json":JSON.parse(read("data/commodity-trade-flows.json"))};
const window={SLIi18n:{language:"en"}},ctx={document,window,
 fetch:async url=>({ok:!!fixtures[url],json:async()=>fixtures[url]}),
 Intl,Number,Math,Map,Set,Promise,console,URLSearchParams};
vm.runInNewContext(read("js/sli-sector-trade-sankey.js"),ctx,{filename:"sli-sector-trade-sankey.js"});
const api=window.SLISectorTradeSankey;
assert.equal(api.validateFood(food).length,8);
assert.equal(api.validateMarine(marine),marine);
const ex=api.foodFlows(food,"exports"),imp=api.foodFlows(food,"imports");
assert.equal(ex.length,8);assert.equal(imp.length,8);
const total=a=>a.reduce((s,e)=>s+e.value,0);
assert.ok(Math.abs(total(ex)-14463.544)<.005);
assert.ok(Math.abs(total(imp)-8192.336)<.005);
assert.equal(new Set(ex.map(x=>x.tag)).size,8);
for(const v of marine.views){
 const sum=v.items.reduce((s,x)=>s+x.value_musd,0);
 assert.ok(sum<6270);
 assert.equal(v.items.length,5);
}
const all=n=>[n,...n.children.flatMap(all)];
(async()=>{
 await api.render(root,"food");
 let els=all(root);
 let svgs=els.filter(x=>x.tagName==="svg");
 assert.equal(svgs.length,1);
 assert.equal(els.filter(x=>x.tagName==="path").length,16,"Two links per observed agriculture cell");
 assert.ok(els.some(x=>x.textContent.includes("14.46")),"Source form total 2026 exports visible");
 let select=els.find(x=>x.tagName==="select");
 select.value="imports";select.events.change();
 els=all(root);assert.ok(els.some(x=>x.textContent.includes("8.19")),"Source observed import form total visible");
 await api.render(root,"marine");
 els=all(root);svgs=els.filter(x=>x.tagName==="svg");
 assert.equal(svgs.length,1);
 assert.equal(els.filter(x=>x.tagName==="path").length,5,"KKP partner-only marginal, not an invented cross-matrix");
 assert.ok(els.some(x=>x.textContent==="United States"));
 assert.ok(els.some(x=>x.textContent.includes("5.28")),"Five reported destination groups value");
 select=els.find(x=>x.tagName==="select");select.value="commodities";select.events.change();
 els=all(root);assert.equal(els.filter(x=>x.tagName==="path").length,5,"KKP product-only marginal");
 assert.ok(els.some(x=>x.textContent==="Seaweed"));
 assert.ok(els.some(x=>x.textContent.includes("4.62")),"Five reported commodity values");
 const source=read("js/commodity-trade-flow.js"),html=read("index.html");
 assert.match(source,/state\.lens==="food"\|\|state\.lens==="marine"/);
 assert.match(source,/state\.lens==="energy"/);
 assert.match(source,/HEESI 2025 already contains/);
 assert.ok(source.indexOf("window.SLISectorTradeSankey.render")>=0);
 assert.ok(html.includes("js/sli-sector-trade-sankey.js"));
 assert.ok(read("food-agriculture-intelligence.html").includes("index.html?trade=food#trade"));
 assert.ok(read("marine-fisheries-intelligence.html").includes("index.html?trade=marine#trade"));
 assert.doesNotMatch(read("js/sli-sector-trade-sankey.js"),/x\.country.*x\.product|partner.*commodity.*target/);
 console.log("PASS source-linked food 2026, KKP 2025 independent marginal Sankeys, and sector navigation");
})().catch(e=>{console.error(e);process.exitCode=1});
