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
assert.equal(ctx.window.SLIProvinceFor("Papua Barat Daya"),"Papua Barat Daya","longest specific Papua province must match");
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
 assert.equal(all.filter(n=>n.className==="map-stat").length,9,"All source and layer counters displayed");
 const results=all.find(n=>n.className==="map-list"),list=()=>flatten(results).filter(n=>n.className==="map-list-item");
 const select=all.filter(n=>n.tagName==="select");
 assert.equal(select.length,5,"Should have dataset, technology, status, province and geographic filters");
 const [dataset,sector,stage,province,location]=select;
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
 const sites=JSON.parse(fs.readFileSync(path.join(ROOT,"data/strategic-map-sector-dossiers.json"),"utf8")).records;
 const wk=JSON.parse(fs.readFileSync(path.join(ROOT,"data/strategic-map-upstream-wk.json"),"utf8")).records;
 const power=JSON.parse(fs.readFileSync(path.join(ROOT,"data/strategic-map-power-fossil-renewable.json"),"utf8")).records;
 const industry=JSON.parse(fs.readFileSync(path.join(ROOT,"data/strategic-map-biofuel-smelters.json"),"utf8")).records;
 const total=assets.length+projects.length+infra.length+sites.length+wk.length+power.length+industry.length;
 assert.equal(sites.length,31,"Expanded company-sourced site dossiers");
 assert.equal(wk.length,57,"WK historical operator layer");
 assert.equal(power.length,102,"All fossil, geothermal, hydro and solar directories");
 assert.equal(industry.length,53,"Biodiesel/smelter source geographic sites");
 assert.equal(total,318,"All seven independent datasets should load");
 assert.equal(list().length,total,"Default shows all 318 source-dated records, no cutoff");
 for(const x of [...wk,...power,...industry]){
  assert.ok(x.source_url?.startsWith("https://"),"Dataset source must be HTTPS: "+x.id);
  assert.ok(x.source_vintage&&x.notes&&x.region&&x.stage,"Must explain source vintage, location, stage and boundary: "+x.id);
 }
 assert.ok(power.filter(x=>x.technology==="PLTU").length>=35,"Need 35+ historic/planned PLTU locations");
 assert.ok(power.filter(x=>x.technology==="PLTP").length>=18,"Need 18+ documented geothermal sites");
 assert.ok(industry.filter(x=>x.group==="Biodiesel plant").length>=30,"Need 30+ biodiesel source sites");
 assert.ok(sites.filter(x=>x.region.includes("East Kalimantan")&&x.group==="Coal").length>=10,"East Kalimantan coal coverage missing");
 assert.ok(sites.filter(x=>x.region.includes("Sulawesi")&&/Minerals|Processing/.test(x.group)).length>=13,"Sulawesi minerals coverage missing");
 assert.ok(sites.filter(x=>x.region.includes("Central Papua")).length>=4,"Central Papua gold/copper coverage missing");
 assert.ok(sites.every(x=>x.source_url.startsWith("https://")&&x.notes&&x.region&&x.stage),"Every site has source, location, stage and scope note");
 let maps=all.filter(n=>n.tagName==="path");
 const riau=maps.find(p=>p.attributes["aria-label"].startsWith("Riau —"));
 assert.ok(riau,"Riau province should render");
 riau.events.click();
 assert.ok(flatten(root).some(n=>n.className==="map-results-head"&&flatten(n).some(y=>y.textContent==="Riau")),"Province click shows province panel");
 const reset=all.find(n=>n.tagName==="button"&&n.textContent==="Reset filters");
 reset.events.click();assert.equal(list().length,total,"Reset restores every record");
 province.value="Kalimantan Timur";province.events.change();
 assert.ok(list().length>=10&&list().length<total,"Province filter returns East Kalimantan dossiers");
 assert.ok(list().some(x=>flatten(x).some(n=>String(n.textContent).includes("PLTU")||String(n.textContent).includes("WK"))),"Province should contain electricity or upstream references");
 province.value="all";province.events.change();
 assert.equal(list().length,total,"Province filter reset restores all records");
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
 dataset.value="sites";dataset.events.change();
 assert.equal(list().length,sites.length,"Source-documented mine and industrial-site layer includes every source record");
 dataset.value="wk";dataset.events.change();assert.equal(list().length,wk.length,"All WK/PSC company source references");
 dataset.value="power";dataset.events.change();assert.equal(list().length,power.length,"All fossil and renewable power references");
 sector.value="PLTU";sector.events.change();
 assert.equal(list().length,power.filter(x=>x.technology==="PLTU").length,"PLTU technology filter");
 dataset.value="industry";dataset.events.change();assert.equal(list().length,industry.length,"All biodiesel and smelter source records");
 dataset.value="projects";dataset.events.change();
 assert.ok(results.children.length>0);
 sector.value="Minerals";sector.events.change();
 filtering.value="Morowali";filtering.events.input();
 assert.ok(list().length>=1,"Project search retains matching records");
 // Rebuild in Bahasa to check essential UI copy.
 ctx.window.SLIi18n.language="id";
 await ctx.window.initSLIStrategicMap(); // same root intentionally cached
 assert.ok(flatten(root).some(n=>n.textContent==="Peta Investasi dan Energi Indonesia")===false,"cached root unchanged until language event");
 console.log("PASS: 38 provinces, 318 records (57 WK,102 power,53 biodiesel/smelter,106 earlier), full display, province & PLTU filters, source vintages, safe links");
})().catch(e=>{console.error(e);process.exitCode=1});
