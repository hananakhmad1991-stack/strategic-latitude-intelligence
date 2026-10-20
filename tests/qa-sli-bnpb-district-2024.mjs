import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const data=JSON.parse(read("data/sli-bnpb-district-2024.json"));
test("Official BNPB district 2024 has 450 original coded rows and real source totals",()=>{
 assert.equal(data.schema,"sli-bnpb-district-2024-types-v1");
 assert.equal(data.year,2024);
 assert.equal(data.ckan_resource_id,"a4daec53-1119-43ef-b05e-00ec3a4c42a4");
 assert.equal(data.records.length,450);
 assert.equal(new Set(data.records.map(r=>r.admin_code)).size,450);
 assert.match(data.coverage_warning,/omitted districts/);
 assert.equal(data.records.find(r=>r.admin_code==="1101").flood_events,5);
 for(const [k,val] of Object.entries(data.reviewed_source_totals)){
  assert.equal(data.records.reduce((sum,r)=>sum+r[k],0),val,k);
 }
 assert.deepEqual(data.reviewed_source_totals,{flood_events:1428,wildfire_events:973,landslide_events:207,drought_events:89});
 for(const row of data.records){
  assert.ok(row.district&&row.admin_code);
  for(const metric of ["flood_events","wildfire_events","landslide_events","drought_events"])
   assert.ok(row[metric]===null||(Number.isInteger(row[metric])&&row[metric]>=0));
 }
});
test("Same district-year source maps only to compatible environmental history; damage losses remain null",()=>{
 const e=JSON.parse(read("data/sli-climate-environment.json"));
 assert.equal(e.indicators.length,20);
 assert.ok(e.indicators.every(x=>x.observed_value===null));
 for(const id of ["CE-002","CE-008","CE-006"]){
  const item=e.indicators.find(x=>x.id===id);
  assert.equal(item.related_2024_bnpb_district_dataset,"data/sli-bnpb-district-2024.json");
  assert.equal(item.historical_coverage_year,2024);
 }
 assert.match(e.indicators.find(x=>x.id==="CE-006").data_boundary_warning,/do NOT measure burnt area/);
 assert.equal(e.historical_district_sources[0].observed_records,450);
});
test("District evidence is accessible in climate sector and existing SLI library with exact-data export",()=>{
 const js=read("js/sli-bnpb-district-2024.js");
 for(const page of ["climate-environment.html","sli-sector-data-library.html"]){
  const h=read(page);
  assert.match(h,/data-sli-bnpb-district/);
  assert.match(h,/sli-bnpb-district-2024\.js/);
  assert.match(h,/sli-bnpb-district-2024\.css/);
 }
 assert.match(js,/registerExporter/);
 assert.match(js,/SLIVisualExport/);
 assert.match(js,/getMeta:/);
 assert.match(js,/filtered\.map/);
 assert.match(js,/r\.admin_code\.includes\(term\)/);
 assert.match(js,/aria-live/);
 assert.doesNotMatch(js,/innerHTML/);
});
