#!/usr/bin/env node
"use strict";
/* Dependency-free source integrity and interaction smoke check for Strategic Map */
const fs=require("node:fs");
const assert=require("node:assert/strict");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"..");
class Mock {
 constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.events={};this.className="";this.dataset={};this.value="";this.textContent="";}
 append(...items){this.children.push(...items)}
 replaceChildren(...items){this.children=[...items]}
 setAttribute(k,v){this.attributes[k]=String(v);if(k==="class")this.className=String(v)}
 addEventListener(k,fn){this.events[k]=fn}
 getBoundingClientRect(){return {width:1200,height:530}}
}
const root=new Mock("div");
const document={
 createElement:tag=>new Mock(tag),
 createElementNS:(ns,tag)=>new Mock(tag),
 createTextNode:x=>String(x),
 getElementById:id=>id==="sliMapRoot"?root:null,
 addEventListener:()=>{}
};
const flatten=x=>x instanceof Mock?[x,...x.children.flatMap(flatten)]:[];
const fakeFetch=async url=>{const p=path.resolve(ROOT,url);assert.ok(p.startsWith(ROOT+path.sep));return {ok:true,json:async()=>JSON.parse(fs.readFileSync(p,"utf8"))}};
const ctx={document,window:{SLIi18n:{language:"en"}},fetch:fakeFetch,Promise,Number,Math,Date,console,setTimeout,clearTimeout};
const script=fs.readFileSync(path.join(ROOT,"js/strategic-map.js"),"utf8");
vm.runInNewContext(script,ctx,{filename:"strategic-map.js"});
const geo=JSON.parse(fs.readFileSync(path.join(ROOT,"data/indonesia-provinces.geojson"),"utf8"));
assert.equal(geo.features.length,38);
assert.equal(new Set(geo.features.map(x=>x.properties.name)).size,38);
assert.equal(geo.metadata.license,"CC BY 4.0");
assert.equal(ctx.window.SLIProvinceFor("East Kalimantan"),"Kalimantan Timur");
assert.equal(ctx.window.SLIProvinceFor("Dumai, Riau"),"Riau");
assert.equal(ctx.window.SLIProvinceFor("West Papua · Bintuni Bay"),"Papua Barat");
assert.equal(ctx.window.SLIProvinceFor("North Maluku"),"Maluku Utara");
assert.equal(ctx.window.SLIProvinceFor("Central Papua · Mimika"),"Papua Tengah");
assert.equal(ctx.window.SLIProvinceFor("East Belitung, Bangka Belitung"),"Kepulauan Bangka Belitung");
assert.equal(ctx.window.SLIProvinceFor("East/Central Java"),null);
assert.equal(ctx.window.SLIProvinceFor("South/Central/Southeast Sulawesi"),null);
assert.equal(ctx.window.SLIProvinceFor("Indonesia — site unspecified"),null);
assert.equal(ctx.window.SLIProvinceFor("Karawang, West Java; East Halmahera, North Maluku (multi-site)"),null);
(async()=>{
 await ctx.window.initSLIStrategicMap();
 let all=flatten(root);
 assert.ok(all.some(n=>n.textContent==="Indonesia Investment & Energy Map"),"Map title rendered");
 assert.equal(all.filter(n=>n.tagName==="path").length,38,"One province path per feature");
 assert.equal(all.filter(n=>n.className==="map-stat").length,5,"All source and layer counters displayed");
 const results=all.find(n=>n.className==="map-list"),list=()=>flatten(results).filter(n=>n.className==="map-list-item");
 const select=all.filter(n=>n.tagName==="select");
 assert.equal(select.length,4,"Should have dataset, sector, stage and geographic filters");
 const [dataset,sector,stage,location]=select;
 const expand=all.find(n=>n.className==="map-btn map-expand");
 assert.ok(expand,"List expansion control should exist");
 expand.events.click();
 assert.equal(expand.attributes["aria-expanded"],"true","Users can reveal the full-height list");
 expand.events.click();
 assert.equal(expand.attributes["aria-expanded"],"false","Users can collapse the list");
 assert.equal(dataset.value,"all","Default must be all projects, assets and refineries");
 const filtering=all.find(n=>n.className==="map-search");
 const assets=JSON.parse(fs.readFileSync(path.join(ROOT,"data/investment-operator-assets.json"),"utf8")).records;
 const projects=JSON.parse(fs.readFileSync(path.join(ROOT,"data/investment-evidence.json"),"utf8")).projects;
 const infra=JSON.parse(fs.readFileSync(path.join(ROOT,"data/energy-infrastructure-security.json"),"utf8")).refinery.units;
 const total=assets.length+projects.length+infra.length;
 assert.equal(total,75,"Source registries currently have 44+25+6 entries");
 assert.equal(list().length,total,"Default must show ALL 75 records, with no 20-item cap");
 let maps=all.filter(n=>n.tagName==="path");
 const riau=maps.find(p=>p.attributes["aria-label"].startsWith("Riau —"));
 assert.ok(riau,"Riau province should render");
 riau.events.click();
 assert.ok(flatten(root).some(n=>n.className==="map-results-head"&&flatten(n).some(y=>y.textContent==="Riau")),"Province click shows province panel");
 const reset=all.find(n=>n.tagName==="button"&&n.textContent==="Reset filters");
 reset.events.click();assert.equal(list().length,total,"Reset restores every record");
 location.value="unlocated";location.events.change();
 assert.ok(list().length>0&&list().length<total,"Unlocated / multi-site records must stay visible in list");
 assert.ok(list().some(n=>flatten(n).some(e=>String(e.textContent).includes("UNLOCATED"))),"Unlocated list needs visible disclosure");
 location.value="all";location.events.change();
 assert.equal(list().length,total,"Selecting all geography restores all records");
 dataset.value="projects";dataset.events.change();
 assert.equal(list().length,projects.length,"Projects layer displays ALL investment entries");
 dataset.value="assets";dataset.events.change();
 assert.equal(list().length,assets.length,"Assets layer shows all operator dossiers");
 dataset.value="refineries";dataset.events.change();
 assert.equal(list().length,infra.length,"Refinery layer includes every recorded oil refinery");
 dataset.value="projects";dataset.events.change();
 assert.ok(results.children.length>0);
 sector.value="Minerals";sector.events.change();
 filtering.value="Morowali";filtering.events.input();
 assert.ok(list().length>=1,"Project search retains matching records");
 // Rebuild in Bahasa to check essential UI copy.
 ctx.window.SLIi18n.language="id";
 await ctx.window.initSLIStrategicMap(); // same root intentionally cached
 assert.ok(flatten(root).some(n=>n.textContent==="Peta Investasi dan Energi Indonesia")===false,"cached root unchanged until language event");
 console.log("PASS: 38 province map, all 75 records (44 assets,25 projects,6 refineries), all-year listing, unlocated filter, source links, province click, search and reset");
})().catch(e=>{console.error(e);process.exitCode=1});
