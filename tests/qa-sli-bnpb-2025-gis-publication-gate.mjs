import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("BNPB GIS 2025 geographic coverage cannot be promoted while statistical definitions disagree",()=>{
 const d=JSON.parse(read("data/sli-bnpb-gis-2025-methodology-gate.json"));
 assert.equal(d.schema,"sli-bnpb-2025-gis-vs-provincial-definition-review-v1");
 assert.equal(d.valid_district_code_rows,506);
 assert.equal(d.unmapped_blank_district_code_features,8);
 assert.equal(d.candidate_features,514);
 assert.equal(d.not_approved_for_district_2025_event_publication,true);
 assert.equal(d.not_approved_for_2024_2025_trend,true);
 assert.equal(d.status,"blocked_pending_aggregation_method_review");
 assert.ok(d.discrepancy.flood_events.ratio>4);
 assert.ok(d.discrepancy.extreme_weather_events.ratio>6);
 assert.ok(d.discrepancy.landslide_events.ratio>11);
 for(const x of Object.values(d.discrepancy))assert.equal(x.definitions_reconciled,false);
});
test("Blocked 2025 GIS source only informs audit panel; does not replace verified 2024 data",()=>{
 for(const page of ["climate-environment.html","sli-sector-data-library.html"]){
  const h=read(page);
  assert.match(h,/data-sli-bnpb-2025-gis-gate/);
  assert.match(h,/sli-bnpb-gis-2025-gate\.js/);
  assert.match(h,/data-sli-bnpb-district/);
 }
 const js=read("js/sli-bnpb-gis-2025-gate.js");
 assert.match(js,/not_approved_for_district_2025_event_publication/);
 assert.match(js,/blocked_pending_aggregation_method_review/);
 assert.doesNotMatch(js,/innerHTML/);
 const historic=JSON.parse(read("data/sli-bnpb-district-2024.json"));
 assert.equal(historic.year,2024);
 assert.equal(historic.district_count,450);
 const c=JSON.parse(read("data/sli-climate-environment.json"));
 assert.equal(c.indicators.length,20);
 assert.ok(c.indicators.every(x=>x.observed_value===null));
});
