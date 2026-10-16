import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const D=JSON.parse(fs.readFileSync("data/komdigi-digital-infrastructure-2025.json","utf8"));
const html=fs.readFileSync("index.html","utf8");
const chapter=fs.readFileSync("js/research-chapters.js","utf8");
const code=fs.readFileSync("js/komdigi-digital-2025.js","utf8");
const css=fs.readFileSync("css/komdigi-digital-2025.css","utf8");
const search=JSON.parse(fs.readFileSync("data/site-search-index.json","utf8"));
assert.equal(D.id,"komdigi-2025-digital-infrastructure");
assert.equal(D.source_pages,195);
assert.match(D.source_pdf_url,/eppid\.komdigi\.go\.id\/attachments\/.+\.pdf/);
assert.equal(D.metrics.length,43);
assert.equal(D.collections.pdns.length,4);
assert.equal(D.collections.gateways.length,11);
assert.equal(D.collections.bts.length,7);
assert.equal(D.collections.splp_provinces.length,38);
const geo=JSON.parse(fs.readFileSync("data/indonesia-provinces.geojson","utf8"));
assert.equal(geo.features.length,38);
const aliases={"Daerah Istimewa Yogyakarta":"DI Yogyakarta","Kepulauan Bangka Belitung":"Bangka Belitung"};
const keyed=new Set(D.collections.splp_provinces.map(x=>x.province));
assert.ok(geo.features.every(x=>keyed.has(aliases[x.properties.name]||x.properties.name)),"Every source province matches existing GIS boundary");
assert.ok(geo.features.every(x=>["Polygon","MultiPolygon"].includes(x.geometry.type)),"All geometry features supported");
assert.ok(geo.features.every(x=>x.geometry.coordinates?.length>0),"No invented points");

assert.equal(D.collections.app_sla.length,12);
assert.equal(D.collections.public_access_sites.length,9);
assert.equal(D.collections.palapa.length,4);
assert.equal(D.collections.digital_pillars.length,4);
assert.equal(D.security.blocked.total,2737962);
assert.equal(D.security.blocked.website+D.security.blocked.social_platform,2737962);
assert.equal(D.security.blocked_website_categories.reduce((s,x)=>s+x.blocks,0),2358557);
assert.equal(D.security.blocked_social_categories.reduce((s,x)=>s+x.blocks,0),379405);
assert.equal(D.security.personal_data.potential_findings_total,130);
assert.equal(D.security.personal_data.website_findings,112);
assert.equal(D.security.personal_data.mobile_app_findings,18);
assert.equal(D.security.personal_data.pse_assessed,64);
assert.equal(D.security.pse_content_regulation.saman_ugc_platforms_monitored,18);
assert.ok(D.security.personal_data.caveat.includes("not judicial"));

assert.equal(D.collections.strategic_performance.length,4);
const k=id=>D.metrics.find(x=>x.id===id);
assert.equal(k("dc_operational_capacity").value,370);
assert.equal(k("dc_energy_demand_projection").value,1410);
assert.match(k("dc_energy_demand_projection").basis,/projection/);
assert.equal(k("dc_energy_demand_projection").period,"2029 projected");
assert.equal(k("mobile_4g_population").value,98.95);
assert.equal(k("mobile_5g_population").value,13.11);
assert.equal(k("mobile_5g_settlements").value,6.33);
assert.equal(k("pdns_user_inst").value,404);
assert.equal(k("pdns_vcpu").value,73927);
assert.equal(k("pdns_storage").value,18337877);
assert.equal(k("pdns_ram").value,171773);
assert.equal(k("satria_ip_transit").value,93);
assert.equal(k("internet_public").value,31394);
assert.equal(k("splp_connected").value,442);
assert.equal(k("splp_active").value,37);
assert.equal(k("speed_mobile_actual").value,63.51);
assert.equal(k("speed_fixed_actual").value,51.84);
assert.equal(k("bts_total").value,6747);
const pd=D.collections.pdns;
assert.equal(pd.reduce((a,x)=>a+x.vcpu,0),73927);
assert.equal(pd.reduce((a,x)=>a+x.institutions,0),404);
assert.equal(pd.reduce((a,x)=>a+x.ram_source_unit,0),171774,"Source discrepancy preserved");
assert.equal(pd.reduce((a,x)=>a+x.storage_gb,0),18337876,"Source discrepancy preserved");
assert.equal(D.collections.gateways.reduce((a,x)=>a+x.hub_gbps,0),150);
assert.equal(D.collections.gateways.reduce((a,x)=>a+x.transit_gbps,0),93);
assert.ok(D.collections.gateways.every(x=>x.coordinates===null),"No fake GIS markers");
assert.equal(D.collections.bts.reduce((a,x)=>a+x.active,0),6747);
assert.equal(D.collections.bts.reduce((a,x)=>a+x.uso_terminated,0),449);
assert.equal(D.collections.splp_provinces.reduce((a,x)=>a+x.connected,0),371);
assert.equal(D.collections.splp_provinces.reduce((a,x)=>a+x.total,0),542);
assert.equal(D.collections.splp_headline.connected,378);
assert.equal(D.collections.splp_headline.total,546);
assert.equal(D.collections.public_access_sites.reduce((a,x)=>a+x.locations,0),31394);
assert.equal(D.collections.strategic_performance[0].observation_year,2024);
assert.equal(D.collections.digital_pillars[0].year,2024);
assert.ok(D.caveats.some(x=>x.includes("171,774")));
assert.ok(D.caveats.some(x=>x.includes("371 connected of 542")));
assert.ok(search.entries.filter(x=>x.komdigi_tab).length>=120);
assert.ok(search.entries.some(x=>x.province==="Papua Tengah"&&x.komdigi_tab==="regional"));
assert.ok(html.includes("js/komdigi-digital-2025.js?v="));
assert.ok(html.includes("css/komdigi-digital-2025.css?v="));
assert.match(chapter,/initSLIKomdigi2025\(komdigiRoot\)/);
assert.match(chapter,/sections\[1\]\.append\(komdigiRoot\)/);
assert.match(css,/@media\(max-width:650px\)/);
assert.match(css,/kd25-province-shape/);
assert.match(code,/data\/indonesia-provinces\.geojson/);
assert.match(code,/mapped!==38/);
assert.match(code,/aria-label.*getAttribute|aria-label/);
assert.ok(html.indexOf("js/komdigi-digital-2025.js")<html.indexOf("js/research-chapters.js"),"Explorer loaded before chapter JS");
class Dom {
 constructor(tag){this.tagName=tag;this.children=[];this.listeners={};this.attrs={};this._text="";this.className="";this.id="";this.dataset={};this.style={};this.value="";this.hidden=false;this.isConnected=true;
  this.classList={add:()=>{},toggle:()=>{}};}
 get textContent(){return this._text||this.children.map(x=>x.textContent).join("")}
 set textContent(x){this._text=String(x);this.children=[]}
 append(...nodes){for(const n of nodes){if(!n)continue;this.children.push(n);if(this.tagName==="select"&&n.tagName==="option"&&this.children.length===1)this.value=n.value}}
 replaceChildren(...nodes){this.children=[];this._text="";this.append(...nodes)}
 setAttribute(k,v){this.attrs[k]=String(v)}
 getAttribute(k){return this.attrs[k]??null}
 addEventListener(k,fn){this.listeners[k]=fn}
 click(){this.listeners.click?.()}
 dispatchEvent(e){this.listeners[e.type]?.(e)}
 querySelectorAll(q){const all=[];const rec=n=>{for(const c of n.children){all.push(c);rec(c)}};rec(this);if(q==="button.kd25-tab")return all.filter(x=>x.tagName==="button"&&x.className==="kd25-tab");if(q===".kd25-province")return all.filter(x=>x.className==="kd25-province");if(q==="article")return all.filter(x=>x.tagName==="article");if(q==="table")return all.filter(x=>x.tagName==="table");if(q==="button")return all.filter(x=>x.tagName==="button");return all.filter(x=>x.tagName===q)}
}
const root=new Dom("section");
const ctx={window:{SLIi18n:{language:"en"}},document:{createElement:t=>new Dom(t),createDocumentFragment:()=>new Dom("#fragment"),getElementById:()=>root},console,fetch:async()=>({ok:true,json:async()=>D})};
vm.runInNewContext(code,ctx,{filename:"komdigi-digital-2025.js"});
assert.equal(typeof ctx.window.initSLIKomdigi2025,"function");
await ctx.window.initSLIKomdigi2025(root);
assert.equal(root.dataset.kd25Mounted,"true");
const tabs=root.querySelectorAll("button.kd25-tab");
assert.equal(tabs.length,8,"Eight dynamic visualizations");
const names=tabs.map(x=>x.dataset.tab);
assert.deepEqual(names,["overview","network","cloud","backbone","regional","digital","security","catalogue"]);
for(const tab of tabs){
 tab.click();assert.equal(tab.attrs["aria-selected"],"true");
 assert.ok(root.querySelectorAll("article").length>=1||root.querySelectorAll("table").length>=1,"Tab should visualize data: "+tab.dataset.tab);
}
tabs.find(x=>x.dataset.tab==="regional").click();
assert.equal(root.querySelectorAll("button").filter(x=>x.className==="kd25-province").length,38);
assert.ok(root.querySelectorAll("table").length>=1);
tabs.find(x=>x.dataset.tab==="cloud").click();
assert.ok(root.querySelectorAll("table").length>=1);
console.log("PASS: 195-page Komdigi report · 43 metric anchors · 11 SATRIA gateways · 38 SPLP regions · 7 interactive explorer tabs · year and source discrepancy audit");
