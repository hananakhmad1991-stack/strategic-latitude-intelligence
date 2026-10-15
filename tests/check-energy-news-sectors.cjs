/* No-dependency sector-filter UI and archived feed QA for domestic/geopolitical radar. */
"use strict";
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const index=fs.readFileSync("index.html","utf8");
const domestic=fs.readFileSync("data/domestic-energy.json","utf8");
const geopolitical=fs.readFileSync("data/geopolitical-energy.json","utf8");
const helper=fs.readFileSync("js/energy-news-sectors.js","utf8");
const domeJS=fs.readFileSync("js/energy-transition-domestic.js","utf8");
const styles=fs.readFileSync("css/energy-news-sectors.css","utf8");
new Function(helper);new Function(domeJS);
const D=JSON.parse(domestic),G=JSON.parse(geopolitical);
assert(index.includes('js/energy-news-sectors.js')&&index.includes('css/energy-news-sectors.css'),"Sector styling/helper not loaded");
assert(index.indexOf('js/energy-news-sectors.js')<index.indexOf('js/energy-transition-domestic.js'),"News helper must load before domestic renderer");
assert(index.includes('id="geoSectorFilters"')&&index.includes('sectors.makeControls(sectorRoot,entries,"geopolitical"'),"Geopolitical sector panel not connected");
assert(domeJS.includes('sectors.makeControls(sectorContainer,data.reports,"domestic"'),"Domestic sector panel not connected");
assert(domeJS.includes('sectors.matches(x,selectedSector,"domestic")'),"Domestic sector filter does not affect report list");
assert(index.includes('sectors.matches(e,selectedSector,"geopolitical")'),"Geopolitical sector filter does not affect report list");
assert(styles.includes(".sli-sector-tab")&&styles.includes(".sli-sector-badge"),"Sector filter style missing");
assert(D.reports.length>0&&G.events.length>0,"Source-dated historical snapshots missing");
assert(D.sector_taxonomy_version===G.sector_taxonomy_version,"Mismatched classification version");
for(const [feed,key] of [[D,"reports"],[G,"events"]]){
 assert(!Number.isNaN(Date.parse(feed.checked_at_utc)),"Dated feed timestamp missing");
 for(const item of feed[key]){
  assert(Array.isArray(item.sector_tags)&&item.sector_tags.includes(item.sector),"Each lead needs valid sector metadata");
  assert(item.url?.startsWith("https://")&&item.title&&item.publisher,"Original attributable headline must remain intact");
 }
}
class El{
 constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.listeners={};this.dataset={};this.className="";this.textContent="";
  this.classList={toggle:(className,active)=>{const set=new Set(this.className.split(" ").filter(Boolean));if(active)set.add(className);else set.delete(className);this.className=[...set].join(" ")}};
 }
 append(...children){this.children.push(...children)}
 replaceChildren(...children){this.children=[...children]}
 setAttribute(key,value){this.attributes[key]=value}
 addEventListener(key,callback){this.listeners[key]=callback}
 click(){this.listeners.click?.()}
}
const env={document:{createElement:tag=>new El(tag)},window:{SLIi18n:{language:"en"}}};
vm.runInNewContext(helper,env);
const api=env.window.SLIEnergyNews;
assert(api&&api.SECTORS.length===6,"Six news-sector filter categories needed");
for(const [key,topic,scope,expected] of [
 ["title","coal_dmo","domestic","coal"],
 ["title","oil_gas_upstream","domestic","oil_gas"],
 ["title","nre_solar_wind","domestic","nre"],
 ["Solar PV trade restrictions","Global solar PV and wind supply chains","geopolitical","nre"],
 ["Thermal coal export decline","Global coal and energy policy","geopolitical","coal"],
 ["SKK Migas lifting results","policy","domestic","oil_gas"]
])assert(api.sectorsOf({title:key,topic_id:scope==="domestic"?topic:"",topic:scope==="geopolitical"?topic:""},scope).includes(expected),"Legacy sector mapping failed "+topic);
assert(api.sectorsOf({title:"Unrelated political news",topic_id:"policy"},"domestic")[0]==="cross_cutting","Unrelated stories must not be forced into energy commodity");
assert(api.sectorsOf({title:"Biodiesel mandate",topic_id:"biofuels"},"domestic").includes("nre"),"Biofuel should be classified as renewable");
const dCounts=api.counts(D.reports,"domestic"),gCounts=api.counts(G.events,"geopolitical");
for(const tag of ["oil_gas","coal","nre","electricity","cross_cutting"]){
 assert.equal(dCounts[tag],D.sector_counts[tag],"Incorrect domestic sector count "+tag);
 assert.equal(gCounts[tag],G.sector_counts[tag],"Incorrect global sector count "+tag);
}
let selected="";
const mount=new El("div");
api.makeControls(mount,G.events,"geopolitical",value=>{selected=value});
const bar=mount.children[0];
assert(bar.children.length===6,"All six visible filter chips expected");
const nre=bar.children.find(x=>x.dataset.sector==="nre");
assert(nre,"NRE filter must exist even when zero leads");
nre.click();assert(selected==="nre"&&nre.attributes["aria-pressed"]==="true","Empty NRE sector tab must be clickable");
assert(gCounts.nre===0,"Historical scan currently must not be fabricated with NRE stories");
const badges=api.badges({title:"Bioethanol E10 mandate",topic_id:"biofuels"},"domestic");
assert(badges.children.some(x=>x.textContent.includes("NRE")),"Multi-sector badge missing");
env.window.SLIi18n.language="id";
assert(api.label("coal")==="Batubara"&&api.label("nre")==="EBT / Terbarukan","Indonesian sector labels incorrect");
console.log("SLI sector UI QA passed: domestic "+D.reports.length+" and geopolitical "+G.events.length+" attributed leads, 6 common filter categories, NRE empty truth preserved.");
