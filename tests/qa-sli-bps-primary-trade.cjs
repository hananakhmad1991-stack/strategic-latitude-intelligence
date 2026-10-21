#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict"),vm=require("node:vm");
const read=p=>fs.readFileSync(p,"utf8"),production=JSON.parse(read("data/bps-hs-partner-matrix.json"));
assert.equal(production.status,"awaiting_primary_extract");
assert.equal(production.verified_cells,0);
assert.deepEqual(production.observations,[],"No fabricated official partner-HS values");
class El{
 constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.events={};this.isConnected=true;this.textContent="";this.style={};this.value="";}
 append(...n){this.children.push(...n)}
 replaceChildren(...n){this.children=[...n]}
 setAttribute(k,v){this.attributes[k]=String(v)}
 addEventListener(k,fn){this.events[k]=fn}
}
const all=n=>[n,...n.children.flatMap(all)];
const document={createElement:tag=>new El(tag),createElementNS:(_,tag)=>new El(tag),
 addEventListener() {},getElementById() {return null}};
const w={SLIi18n:{language:"en"}};
vm.runInNewContext(read("js/sli-sector-trade-sankey.js"),{document,window:w,fetch:async()=>({ok:false}),Number,Math,Map,Set,URL,console});
const api=w.SLISectorTradeSankey;
assert.throws(()=>api.validateBPS(production),/not approved/);
const sig="a".repeat(64);
const row={direction:"exports",period:"2025",hs_code:"0901",hs_level:4,hs_version:"HS2022",
 partner_country:"Japan",value_usd:12000,net_weight_kg:42,value_basis:"FOB",
 source_url:"https://www.bps.go.id/id/exim",source_locator:"2025 table one, HS0901, Japan row"};
const fixture={schema:"sli-bps-hs-partner-matrix-v1",status:"verified",review_status:"primary_cell_review_attested",
 primary_query_url:"https://www.bps.go.id/id/exim",verified_cells:2,source_csv_sha256:sig,
 review:{approved_cell_count:2,reviewed_by:"QA reviewer",source_csv_sha256:sig},
 observations:[row,{...row,partner_country:"South Korea",value_usd:34567}]};
assert.equal(api.validateBPS(fixture),fixture);
for(const [prop,value] of [["partner_country","ASEAN"],["hs_code","901"],["value_usd",-500],["source_url","https://bps.go.id.bad-site.invalid/data"],["value_basis","CIF"]]){
 const obj=JSON.parse(JSON.stringify(fixture));obj.observations[0][prop]=value;
 assert.throws(()=>api.validateBPS(obj),/Inconsistent primary BPS observation/);
}
for(const override of [{verified_cells:3},{status:"awaiting_primary_extract"},{review:{approved_cell_count:2,reviewed_by:"QA reviewer",source_csv_sha256:"0".repeat(64)}}]){
 const obj={...fixture,...override};assert.throws(()=>api.validateBPS(obj),/not approved/);
}
const mount=new El("div");
api.renderBPS(mount,fixture);
let elements=all(mount);
assert.equal(elements.filter(x=>x.tagName==="svg").length,1,"Approved official BPS matrix builds one Sankey");
assert.equal(elements.filter(x=>x.tagName==="path").length,4,"Only actual two reviewed cells, two hops each");
assert.ok(elements.some(x=>x.textContent==="Japan"));
assert.ok(elements.some(x=>x.textContent.includes("HS 4")));
assert.ok(elements.some(x=>x.textContent.includes("2025")));
const dashboard=read("js/commodity-trade-flow.js");
assert.ok(dashboard.includes("state.bps.status==="+'"verified"'));
assert.ok(dashboard.includes("data/bps-hs-partner-matrix.json"));
assert.ok(dashboard.includes("if(state.lens==="+'"bps"'+")"));
assert.ok(!read("data/bps-hs-partner-matrix.json").includes('"value_usd": 12000'),"QA fixture must not leak into real data");
console.log("PASS BPS official zero-record pending gate, reviewed exact cells, no country/HS inference, UI Sankey");
