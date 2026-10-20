import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const d=JSON.parse(read("data/sli-ruptl-esdm-2025-2034-period-plan.json"));
test("Official ESDM two-period RUPTL planned GW figures and source are internally consistent",()=>{
 assert.equal(d.schema,"sli-ruptl-2025-2034-esdm-period-plan-v1");
 assert.equal(d.unit,"GW");
 assert.deepEqual(d.time_windows,["2025–2030","2031–2034"]);
 assert.ok(d.source_url.startsWith("https://gatrik.esdm.go.id/assets/uploads/download_index/files/"));
 assert.equal(d.project_records_verified_from_this_source,0);
 assert.equal(d.project_annex_status,"not_accessible_full_verified_copy");
 const look=type=>d.groups.find(x=>x.type===type).values;
 assert.deepEqual(look("new_renewable_capacity"),[16.7,25.8]);
 assert.deepEqual(look("new_nonrenewable_capacity"),[14,2.7]);
 assert.deepEqual(look("new_storage_capacity"),[3.5,6.8]);
 assert.deepEqual(look("total_planned_additions"),[34.2,35.3]);
 assert.ok(Math.abs(look("total_planned_additions").reduce((a,b)=>a+b,0)-69.5)<1e-9);
 assert.deepEqual(d.technologies.find(x=>x.technology==="hydro").values,[4,7.7]);
 assert.deepEqual(d.technologies.find(x=>x.technology==="solar").values,[7.6,9.5]);
 assert.deepEqual(d.technologies.find(x=>x.technology==="nuclear").values,[null,0.5]);
 assert.match(d.meaning,/not realized/i);
});
test("RUPTL official plan data not presented as confirmed project annex and exports source values",()=>{
 for(const page of ["pln-ruptl-2025-2034-source-intelligence.html","sli-sector-data-library.html"]){
  const h=read(page);
  assert.match(h,/data-sli-ruptl-period-plan/);
  assert.match(h,/sli-ruptl-esdm-period-plan\.js/);
  assert.match(h,/sli-ruptl-esdm-period-plan\.css/);
 }
 const js=read("js/sli-ruptl-esdm-period-plan.js");
 assert.match(js,/project_records_verified_from_this_source!==0/);
 assert.match(js,/SLIVisualExport\.register/);
 assert.match(js,/kind:"verified-provider"/);
 assert.doesNotMatch(js,/innerHTML/);
});
