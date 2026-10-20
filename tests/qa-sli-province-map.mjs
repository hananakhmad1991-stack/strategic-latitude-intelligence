import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const geo=JSON.parse(read("data/indonesia-provinces.geojson"));
const bps=JSON.parse(read("data/sli-bps-regional-intelligence.json"));
const gini=JSON.parse(read("data/sli-bps-gini-2026.json"));
const src=read("js/sli-province-map.js");

function mount(){
 class Node {
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.listeners={};this.dataset={};this.style={};this.isConnected=true;this.textContent="";this.className="";}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=[...nodes];}
  setAttribute(k,v){this.attrs[k]=String(v);if(k==="class")this.className=String(v);}
  addEventListener(type,fn){this.listeners[type]=fn;}
 }
 const host=new Node("div");
 const document={documentElement:{lang:"id"},createElement:t=>new Node(t),createElementNS:(_ns,t)=>new Node(t),createTextNode:s=>({textContent:String(s)})};
 const fetch=async()=>({ok:true,json:async()=>geo});
 const window={};
 vm.runInNewContext(src,{document,window,fetch,console,Intl},{filename:"sli-province-map.js"});
 return {host,api:window.SLIProvinceMap};
}
const walk=n=>[n,...(n.children||[]).flatMap(walk)];

test("GeoJSON matches all 38 actual BPS and Gini provinces without fuzzy guesses",()=>{
 const {api}=mount();
 assert.equal(geo.features.length,38);
 for(const dataset of [bps,gini]){
  assert.equal(dataset.provinces.length,38);
  const names=new Set(dataset.provinces.map(p=>api.normalize(p.name)));
  for(const feature of geo.features)assert.ok(names.has(api.normalize(feature.properties.name)),feature.properties.name);
 }
 assert.equal(api.normalize("Daerah Istimewa Yogyakarta"),api.normalize("DI Yogyakarta"));
 assert.equal(api.normalize("Sumatera Utara"),api.normalize("Sumatra Utara"));
 assert.notEqual(api.normalize("Papua"),api.normalize("Papua Barat"));
});
test("Province map renders 38 selectable geometries, source context, and missing values",async()=>{
 const {host,api}=mount(),chosen=[];
 const records=[{name:"Sumatra Utara",value:102.3},{name:"Jawa Barat",value:67.4},{name:"DI Yogyakarta",value:null}];
 const result=await api.render(host,{records,selected:"Jawa Barat",period:"2025",source:"BPS",unit:"%",onSelect:name=>chosen.push(name)});
 assert.equal(result,true);
 const items=walk(host),paths=items.filter(x=>x.tagName==="path");
 assert.equal(paths.length,38);
 assert.equal(paths.filter(x=>x.attrs["aria-pressed"]==="true").length,1);
 assert.equal(paths.filter(x=>x.className.includes("unavailable")).length,36);
 const sumatra=paths.find(x=>x.attrs["aria-label"]?.startsWith("Sumatera Utara:"));
 assert.ok(sumatra&&!sumatra.className.includes("unavailable"),"Different publisher spellings retain values");
 sumatra.listeners.click();
 assert.equal(chosen[0],"Sumatera Utara");
 const yogyakarta=paths.find(x=>x.attrs["aria-label"]?.startsWith("Daerah Istimewa Yogyakarta:"));
 assert.ok(yogyakarta&&yogyakarta.className.includes("unavailable"));
 assert.ok(items.some(x=>String(x.textContent).includes("2 / 38")));
 assert.ok(items.some(x=>String(x.textContent).includes("BPS")));
});
test("Provincial pages connect map to original source dashboards, not generic Power BI panels",()=>{
 const analytics=read("sli-interactive-analytics.html"),giniHtml=read("gini-inequality.html"),nexus=read("provincial-intelligence.html"),opportunity=read("provincial-opportunity-engine.html");
 for(const html of [analytics,giniHtml,nexus,opportunity]){
  assert.match(html,/js\/sli-province-map\.js/);
  assert.match(html,/css\/sli-province-map\.css/);
 }
 assert.match(read("js/sli-interactive-analytics.js"),/SLIProvinceMap\.render/);
 assert.match(read("js/sli-bps-gini-explorer.js"),/SLIProvinceMap\.render/);
 assert.match(read("js/sli-provincial-nexus-ui.js"),/SLIProvinceMap\.render/);
 assert.match(opportunity,/SLIProvinceMap\.render/);
 const exportJS=read("js/sli-visual-export.js");
 assert.doesNotMatch(exportJS,/document\.addEventListener\('click',openVisualInsight\)/);
 assert.doesNotMatch(exportJS,/sli-visual-insight-split/);
 assert.match(exportJS,/SLIVisualFormats\.save/);
});
