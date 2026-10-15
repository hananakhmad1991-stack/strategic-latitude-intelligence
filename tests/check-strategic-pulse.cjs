#!/usr/bin/env node
"use strict";
// Headless smoke test for SLI Strategic Pulse without npm or external network.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const rootDir=path.resolve(__dirname,"..");
class Element {
  constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.events={};this.attributes={};this.className="";this.textContent="";this.href="";}
  append(...nodes){this.children.push(...nodes)}
  replaceChildren(...nodes){this.children=[...nodes]}
  setAttribute(key,value){this.attributes[key]=String(value)}
  addEventListener(key,cb){this.events[key]=cb}
}
const target=new Element("main");
const document={
 createElement:t=>new Element(t),
 createTextNode:t=>String(t),
 getElementById:id=>id==="sliPulse"?target:null,
 addEventListener:()=>{},
 querySelector:()=>null
};
const fakeFetch=async (file)=>{
 const p=path.join(rootDir,file);
 if(!p.startsWith(rootDir+path.sep))throw Error("Unsafe fetch path");
 const json=JSON.parse(fs.readFileSync(p,"utf8"));
 return {ok:true,json:async()=>json};
};
const ctx={document,window:{SLIi18n:{language:"en"}},fetch:fakeFetch,AbortController,Intl,Date,Number,Promise,setTimeout,clearTimeout,console};
vm.runInNewContext(fs.readFileSync(path.join(rootDir,"js/strategic-pulse.js"),"utf8"),ctx,{filename:"strategic-pulse.js"});
const all=(el)=>el instanceof Element?[el,...el.children.flatMap(all)]:[];
(async()=>{
 await ctx.window.initSLIPulse();
 assert.equal(target.children.length,1,"Strategic Pulse should render one shell");
 const els=all(target);
 const cards=els.filter(x=>x.className==="sp-kpi");
 assert.ok(cards.length>=5,"Expected at least five source-dated KPI cards, got "+cards.length);
 const panels=els.filter(x=>x.className==="sp-panel");
 assert.equal(panels.length,2,"Expected editorial brief and monitoring panels");
 const stamps=els.filter(x=>x.className.startsWith("sp-stamp"));
 assert.equal(stamps.length,cards.length,"Each KPI must show its vintage badge");
 const urls=els.filter(x=>x.tagName==="a");
 assert.ok(urls.length>=cards.length,"Every metric should link to source");
 assert.ok(urls.every(x=>x.href.startsWith("https://")&&x.rel==="noopener noreferrer"),"Source links must use HTTPS and safe rel");
 const filters=els.filter(x=>x.className==="sp-filter");
 assert.equal(filters.length,4,"All, energy, investment and geopolitics filters");
 const signalList=els.find(x=>x.className==="sp-signals");
 assert.ok(signalList&&signalList.children.length>0,"Should display sourced headline leads");
 filters.find(x=>x.dataset.type==="investment").events.click();
 assert.equal(filters.find(x=>x.dataset.type==="investment").attributes["aria-pressed"],"true");
 assert.ok(signalList.children.length>0,"Investment tab should be populated from curated feed");
 const rendered=els.map(x=>x.textContent).join(" ");
 assert.ok(rendered.includes("Indonesia Strategic Pulse"));
 assert.ok(rendered.includes("Biodiesel"));
 assert.ok(rendered.includes("not confirmed")||rendered.includes("NOT verified"),"Headline caveat should be present");
 ctx.window.SLIi18n.language="id";
 await ctx.window.initSLIPulse(true);
 const translated=all(target).map(x=>x.textContent).join(" ");
 assert.ok(translated.includes("Realisasi PMA")&&translated.includes("Sinyal pemantauan"),"Indonesian view should localize key headings");
 console.log("PASS: pulse data, source-stamped cards, editorial context, filters, safe links, bilingual render");
})().catch(e=>{console.error(e);process.exitCode=1});
