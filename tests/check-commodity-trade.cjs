#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const rootDir=path.resolve(__dirname,".."),data=JSON.parse(fs.readFileSync(path.join(rootDir,"data/commodity-trade-flows.json"),"utf8"));
assert.equal(data.latest_bps.period,"2026-01_to_2026-08");
assert.equal(data.bilateral.period,"2025");
assert.equal(data.latest_bps.exports_total_musd,193643.2);
assert.equal(data.latest_bps.imports_total_musd,186392.1);
assert.equal(Math.round((data.latest_bps.exports_oil_gas_musd-data.latest_bps.imports_oil_gas_musd)*10)/10,-21288.5);
assert.equal(data.bilateral.products.length,7,"Seven published HS product groups, including cross-border electricity");
for(const p of data.bilateral.products){
 assert.ok(/^\d{2,6}$/.test(p.hs),"HS code "+p.id);
 for(const d of ["exports","imports"]){
  const x=p[d];assert.ok(x.world_musd===null||Number.isFinite(x.world_musd));
  const s=x.partners.reduce((v,r)=>{assert.ok(r.country&&Number.isFinite(r.musd)&&r.musd>=0);return v+r.musd},0);
  assert.ok(x.world_musd===null||s<=x.world_musd+.03,"World total must reconcile "+p.id+" "+d);
  if(x.world_musd===null)assert.equal(x.partners.length,0,"Unknown flows must never present partner values");
  if(x.source_url)assert.match(x.source_url,/^https:\/\//,"Sources HTTPS");
 }
}
assert.ok(data.bilateral.products.find(x=>x.id==="coal").exports.world_musd>24000);
assert.ok(data.bilateral.products.find(x=>x.id==="coal").imports.world_musd>3300);
class Node {
 constructor(tag){this.tagName=tag;this.className="";this.textContent="";this.children=[];this.events={};this.attributes={};this.value="";this.style={};}
 append(...items){this.children.push(...items)}
 replaceChildren(...items){this.children=[...items]}
 setAttribute(k,v){this.attributes[k]=String(v)}
 addEventListener(k,cb){this.events[k]=cb}
}
const mount=new Node("div"),listeners={};
const doc={createElement:t=>new Node(t),createElementNS:(_n,t)=>new Node(t),getElementById:id=>id==="sliTradeRoot"?mount:null,addEventListener:(n,cb)=>listeners[n]=cb};
const ctx={window:{SLIi18n:{language:"en"}},document:doc,fetch:async()=>({ok:true,json:async()=>data}),Intl,Number,Math,Map,Set,Promise,console};
vm.runInNewContext(fs.readFileSync(path.join(rootDir,"js/commodity-trade-flow.js"),"utf8"),ctx,{filename:"commodity-trade-flow.js"});
const all=n=>n instanceof Node?[n,...n.children.flatMap(all)]:[];
(async()=>{
 await ctx.window.initSLITradeFlow();
 let nodes=all(mount),svg=nodes.find(x=>x.tagName==="svg"&&x.attributes.class==="tf-sankey");
 assert.ok(svg,"Export Sankey should show by default");
 assert.ok(nodes.some(x=>x.textContent.includes("24.48")||x.textContent.includes("24,48")),"Coal exports must be displayed");
 assert.ok(nodes.some(x=>x.textContent.includes("21.17")||x.textContent.includes("21,17")),"Coal trade balance must display");
 assert.ok(nodes.some(x=>x.textContent==="India"),"India appears in 2025 coal destinations");
 let selects=nodes.filter(x=>x.tagName==="select");
 assert.equal(selects.length,4,"Sector, commodity, direction and partner limit controls");
 selects[2].value="imports";selects[2].events.change();
 nodes=all(mount);assert.ok(nodes.some(x=>x.textContent==="Australia"),"Import Sankey should show Australian coal");
 assert.ok(nodes.some(x=>x.textContent==="Russia"),"Import Sankey should show Russian coal");
 selects=nodes.filter(x=>x.tagName==="select");
 selects[0].value="migas";selects[0].events.change();
 nodes=all(mount);assert.ok(nodes.some(x=>x.textContent==="Nigeria"),"Oil imports from Nigeria appear");
 selects=nodes.filter(x=>x.tagName==="select");
 selects[1].value="lng";selects[1].events.change();
 nodes=all(mount);assert.ok(nodes.some(x=>x.textContent.includes("No source-verified figures")),"Missing LNG import partner data stays unavailable");
 ctx.window.SLIi18n.language="id";listeners["sli:languagechange"]();
 nodes=all(mount);assert.ok(nodes.some(x=>x.textContent.includes("Perdagangan Komoditas Indonesia")),"Bilingual view");
 const sources=nodes.filter(x=>x.tagName==="a");assert.ok(sources.length>0&&sources.every(x=>!x.href||x.href.startsWith("https://")),"Sources should be safe");
 console.log("PASS 2025 country commodity Sankey, 2026 BPS dated macro, all seven HS baskets, trade balances, reversed direction, source safety, bilingual render");
})().catch(e=>{console.error(e);process.exitCode=1});
