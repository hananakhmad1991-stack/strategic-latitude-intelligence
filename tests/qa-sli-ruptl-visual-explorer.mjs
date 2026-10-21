import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const plan=JSON.parse(read("data/sli-ruptl-primary-pdf-2025-2034.json"));
const coverage=JSON.parse(read("data/sli-ruptl-provincial-source-projects-2025.json"));
const additional=JSON.parse(read("data/sli-ruptl-expanded-22-annex-source-rows.json"));
const geo=JSON.parse(read("data/sli-indonesia-province-38.geojson"));
const code=read("js/sli-ruptl-visual-explorer.js");
test("RUPTL charts use exact approved national numbers and plan-vs-actual distinction",()=>{
 const official=plan.official_decree_totals;
 assert.equal(official.new_capacity_and_storage_mw,69512);
 assert.equal(official.renewables_and_new_energy_mw+official.energy_storage_mw+official.fossil_generation_mw,69512);
 assert.equal(plan.ared_capacity_additions.years.length,10);
 assert.equal(plan.ared_capacity_additions.technologies.length,20);
 assert.equal(plan.ared_capacity_additions.annual_total_mw.reduce((a,b)=>a+b,0),69512);
 assert.equal(plan.ared_capacity_additions.quality_audit.discrepancy_technology_totals_vs_grand_mw,2);
 assert.match(code,/plan\.ared_capacity_additions\.annual_total_mw/);
 assert.match(code,/plan\.ared_capacity_additions\.technologies/);
 assert.match(code,/official\.renewables_and_new_energy_mw/);
 assert.match(code,/official\.energy_storage_mw/);
 assert.match(code,/official\.fossil_generation_mw/);
 assert.match(code,/sourceCount/);
 assert.match(code,/source\.sha256!==coverage\.source\.sha256/);
 assert.doesNotMatch(code,/eval\(|innerHTML|cdn\.|mapbox/);
});
test("38 province boundaries crosswalk to 34 RUPTL source geographies without multiplying group totals",()=>{
 assert.equal(geo.type,"FeatureCollection");
 assert.equal(geo.features.length,38);
 assert.equal(new Set(geo.features.map(x=>x.properties.PROVINSI)).size,38);
 const index=coverage.geographic_appendix_coverage.subsections;
 const names=new Map(index.map(x=>[x.geographic_heading,x.annex_id]));
 const mapping=p=>{
  if(["Papua","Papua Tengah","Papua Selatan","Papua Pegunungan"].includes(p))return "C.9";
  if(["Papua Barat","Papua Barat Daya"].includes(p))return "C.10";
  if(p==="Kepulauan Riau")return "A.4";
  if(p==="Daerah Istimewa Yogyakarta")p="DI Yogyakarta";
  return names.get(p);
 };
 const assigned=geo.features.map(x=>mapping(x.properties.PROVINSI));
 assert.ok(assigned.every(Boolean));
 assert.equal(new Set(assigned).size,34);
 assert.equal(assigned.filter(x=>x==="C.9").length,4);
 assert.equal(assigned.filter(x=>x==="C.10").length,2);
 assert.equal(assigned.filter(x=>x==="A.4").length,1);
 assert.match(code,/gabungan empat provinsi Papua|empat provinsi Papua/);
 assert.match(code,/tidak mencakup Batam/);
 assert.match(code,/groupOf\(province\)/);
 assert.match(code,/sli:ruptl-region-focus/);
 assert.match(code,/sli:ruptl-region-selected/);
});
test("Visual layers keep 92 approved source samples distinct from 970 raw unapproved grid candidates",()=>{
 const n=plan.individual_project_source_records.records.length+coverage.source_rows.length+additional.rows.length;
 assert.equal(n,92);
 assert.equal(coverage.geographic_appendix_coverage.all_annex_source_grid_scan.raw_numbered_grid_row_candidates,970);
 assert.equal(coverage.geographic_appendix_coverage.all_annex_source_grid_scan.approved_project_records_from_this_scan,0);
 assert.match(code,/machine_candidate_numbered_grid_rows/);
 assert.match(code,/sourceCount\.get\(id\)/);
 assert.match(code,/mode==="samples"/);
 assert.match(code,/kandidat grid mentah/);
 assert.match(code,/bukan geolokasi|Peta bukan geolokasi aset/);
});
test("Primary RUPTL sector pages promote visual explorer above PDF catalog and preserve accessible source",()=>{
 for(const path of ["pln-ruptl-energy-investment.html","pln-ruptl-2025-2034-source-intelligence.html"]){
  const html=read(path);
  assert.match(html,/data-sli-ruptl-visual/);
  assert.match(html,/sli-ruptl-visual-explorer\.css/);
  assert.match(html,/sli-ruptl-visual-explorer\.js/);
  assert.ok(html.indexOf("ruptl-visual-explorer")<html.indexOf("ruplt-provincial-project-review"));
  assert.ok(html.indexOf("data-sli-ruptl-visual")<html.indexOf("data-sli-ruptl-provincial"));
 }
 const registry=read("js/sli-ruptl-provincial-evidence.js");
 assert.match(registry,/sli:ruptl-region-focus/);
 assert.match(registry,/sli:ruptl-region-selected/);
 assert.match(registry,/regions\.value=sample\.appendix_geography/);
 assert.match(read("data/sli-indonesia-province-38-ATTRIBUTION.txt"),/CC BY 4.0/);
});
