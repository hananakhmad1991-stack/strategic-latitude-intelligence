import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const d=JSON.parse(read("data/sli-ruptl-provincial-source-projects-2025.json"));
const e=JSON.parse(read("data/sli-ruptl-project-progress-primary-evidence.json"));
const old=JSON.parse(read("data/sli-ruptl-primary-pdf-2025-2034.json"));
test("RUPTL sample has 34 official geographic subsections and 35 nonduplicate new source rows",()=>{
 assert.equal(d.schema,"sli-ruptl-provincial-source-projects-2025-v1");
 assert.equal(d.source.sha256,"1308ee580c7c1642fe7817e000c87cb2dc87053e1fcef90606dcc1da396fd002");
 assert.equal(d.geographic_appendix_coverage.subsections.length,34);
 assert.equal(new Set(d.geographic_appendix_coverage.subsections.map(x=>x.annex_id)).size,34);
 assert.equal(d.record_count,35);assert.equal(d.source_rows.length,35);
 assert.equal(new Set(d.source_rows.map(x=>x.id)).size,35);
 assert.equal(old.individual_project_source_records.records.length,13);
 assert.equal(d.source_rows.length+old.individual_project_source_records.records.length,48);
 assert.equal(new Set(d.source_rows.map(x=>x.annex_id)).size,9);
 for(const x of d.source_rows){
  assert.ok(d.geographic_appendix_coverage.subsections.some(y=>y.annex_id===x.annex_id));
  assert.match(x.planned_cod_ared,/^20(2[5-9]|3[0-4])$/);
  assert.ok(/^([ABC])\d+\.\d+$/.test(x.table));
  assert.ok(x.pdf_page>=600&&x.pdf_page<=1253);
  assert.ok(x.source_project_label.length>0&&x.capacity_as_printed.length>0);
  assert.ok(x.capacity_mw===null||(Number.isFinite(x.capacity_mw)&&x.capacity_mw>0));
  assert.equal(x.operational_status_2026,null);
  assert.equal(x.verified_actual_cod,null);
  assert.equal(x.verified_realized_capacity_mw,null);
  assert.equal(x.verified_realization_source_url,null);
 }
 const composite=d.source_rows.find(x=>x.source_project_label==="Muara Tawar Add-on Blok 4");
 assert.equal(composite.capacity_as_printed,"250*");assert.equal(composite.capacity_mw,null);
 const lombok=d.source_rows.find(x=>x.source_project_label==="Lombok (FTP2)");
 assert.equal(lombok.capacity_as_printed,"2x50");assert.equal(lombok.capacity_mw,null);
 assert.ok(d.geographic_appendix_coverage.subsections.find(x=>x.annex_id==="C.9").geographic_heading.includes("gabungan"));
});
test("Primary-source developments separate 3 facility evidence findings and only two directly dated COD cases",()=>{
 assert.equal(e.schema,"sli-ruptl-project-official-progress-evidence-v1");
 assert.equal(e.approved_attribution_count,4);
 assert.equal(e.group_distinct_confirmed_facility_count,3);
 assert.equal(e.observations.length,4);
 const byName=Object.fromEntries(e.observations.map(x=>[x.source_project_label,x]));
 for(const name of ["Jawa-9","Jawa-10"]){
  const x=byName[name];
  assert.equal(x.facility_group,"PLTU Jawa 9 & 10");
  assert.equal(x.verified_facility_complex_cod,"2025-05-02");
  assert.equal(x.individually_attributed_actual_cod,null);
  assert.equal(x.capacity_per_source,1000);
  assert.equal(x.capacity_source_unit,"MW");
  assert.ok(x.source_url.startsWith("https://www.irt.co.id/"));
 }
 const bali=byName["Bali Timur"];
 assert.equal(bali.source_event_date,"2025-06-17");
 assert.equal(bali.individually_attributed_actual_cod,"2025-06-17");
 assert.equal(bali.capacity_source_unit,"MWp");
 assert.ok(bali.source_url.startsWith("https://medcopower.co.id/"));
 assert.equal(d.source_rows.find(x=>x.id===bali.project_sample_id).capacity_as_printed,"25");
 const merangin=byName["Merangin"];
 assert.equal(merangin.reporting_period,"2025-H1");
 assert.equal(merangin.source_event_date,null);
 assert.equal(merangin.capacity_per_source,492);
 assert.equal(merangin.capacity_source_unit,"MW");
 assert.equal(merangin.planned_capacity_mw,350);
 assert.equal(merangin.individually_attributed_actual_cod,null);
 assert.equal(merangin.capacity_comparability_to_ruptl,"blocked_pending_capacity_definition_and_asset_mapping_review");
 assert.ok(merangin.source_url.includes("esdm.go.id"));
 assert.equal(d.source_rows.find(x=>x.id===merangin.project_sample_id).capacity_as_printed,"350");
 const grid=e.related_not_plant_cod[0];
 assert.equal(grid.never_promote_to_power_plant_operational_status,true);
 assert.match(grid.source_event_type,/transmission/);
});
test("Source-backed plan versus evidence UI never interprets unverified as zero and can export exact citations",()=>{
 const js=read("js/sli-ruptl-provincial-evidence.js");
 assert.match(js,/evidenceMap\.get/);
 assert.match(js,/individually_attributed_actual_cod/);
 assert.match(js,/source_url/);
 assert.match(js,/SLIVisualExport\.register/);
 assert.match(js,/nil|belum|Belum|tidak tersedia/i);
 assert.doesNotMatch(js,/innerHTML/);
 for(const path of ["pln-ruptl-energy-investment.html","pln-ruptl-2025-2034-source-intelligence.html","sli-sector-data-library.html"]){
  const html=read(path);
  assert.match(html,/data-sli-ruptl-provincial/);
  assert.match(html,/sli-ruptl-provincial-evidence\.js/);
  assert.match(html,/sli-ruptl-provincial-evidence\.css/);
  assert.equal((html.match(/data-sli-ruptl-provincial/g)||[]).length,1);
 }
 const climate=JSON.parse(read("data/sli-climate-environment.json"));
 assert.equal(climate.indicators.length,20);
 assert.ok(climate.indicators.every(x=>x.observed_value===null));
});
