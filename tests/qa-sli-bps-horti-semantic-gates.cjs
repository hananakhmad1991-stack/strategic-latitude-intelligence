#!/usr/bin/env node
"use strict";
// BPS 2026 horticulture: semantic metadata only. NO extracted numeric series, business contacts or PDF row copies.
const fs=require("node:fs"),assert=require("node:assert/strict");
const reg=JSON.parse(fs.readFileSync("data/sli-bps-agri-horti-2026-source-register.json","utf8"));
const sem=reg.horticulture_semantic_stage;
const hort=reg.tables.filter(t=>t.document_id==="horti2026"),agri=reg.tables.filter(t=>t.document_id==="agri2025");
assert.equal(hort.length,35);
assert.equal(agri.length,47);
assert.equal(sem.source_sha256,reg.documents.find(x=>x.id==="horti2026").source_sha256);
assert.equal(sem.profiles_classified,35);
assert.equal(sem.table_headings_checked_via_native_text,35);
assert.equal(sem.publication_ready_tables,0);
assert.equal(sem.all_individual_cells_visually_validated,false);
assert.equal(sem.written_bps_commercial_permission_on_file,false);
assert.equal(reg.coverage.all_verified_numeric_cells_public,0);
assert.equal(reg.coverage.public_full_table_numeric_series,0);
assert.equal(reg.coverage.bps_written_commercial_permission_on_file,false);
assert.ok(agri.every(t=>!Object.hasOwn(t,"semantic_profile")));
const expected=new Map([
 ["3.1","2022–2026"],["3.2","2025"],["3.3","2026"],["3.4","2026"],["3.5","2026"],["3.6","2026"],
 ["3.7","2025"],["3.8","2025"],["3.9","2025"],["3.10","2024"],["3.11","2024"],["3.12","2025"],
 ["3.13","2025"],["3.14","2025"],["3.15","2025"],["3.16","2025"],["3.17","2025"],["3.18","2025"],
 ["3.19","2025"],["3.20","2025"],["6.1","2022–2026"],["6.2","2026"],["6.3","2026"],
 ["6.4","2025"],["6.5","2025"],["6.6","2025"],["6.7","2025"],["6.8","2025"],
 ["6.9","2025"],["6.10","2025"],["6.11","2025"],["6.12","2025"],["6.13","2025"],
 ["6.14","2025"],["6.15","2025"]
]);
assert.equal(expected.size,35);
const holds={"3.2":"contents_vs_printed_year","3.10":"contents_vs_printed_year","3.11":"contents_vs_printed_year","6.14":"heading_vs_chapter_population","6.1":"printed_national_vs_province_subtotal","6.2":"printed_national_vs_province_subtotal"};
let provinces=0,commodities=0,meanRows=0;
for(const t of hort){
 const s=t.semantic_profile;
 assert.ok(s,"Missing semantic profile: "+t.id);
 assert.equal(s.printed_period,expected.get(t.id));
 assert.equal(s.publication_authorized,false);
 assert.equal(s.rights_gate,"written_BPS_permission_not_on_file");
 assert.equal(s.specific_hold_reason,holds[t.id]||null);
 assert.equal(s.numeric_cell_validation,"pending_full_cell_by_cell_source_image_review");
 assert.match(s.heading_audit,/native_text_heading_read_not_all_cells_visual_checked/);
 assert.match(s.missing_policy,/never_automatically_zero_or_residual/);
 assert.ok(["province_year","province_legal_form","province_crop_group","province_business_attribute","province_establishment_status","province_capital_status","province_worker_status","province_worker_sex_status","province_business_status","province","commodity_activity","commodity"].includes(s.observation_grain));
 assert.ok(!("value" in s)&&!("raw_rows" in s)&&!("extracted_cells" in s)&&!("observations" in s));
 assert.ok(s.candidate_visualization && s.unit && s.measure_type);
 if(s.observation_grain.startsWith("province")){provinces++;assert.equal(s.province_coverage_policy,"do_not_assume_38_numeric_rows_or_impute_absent_provinces")}
 else {commodities++;assert.equal(s.province_coverage_policy,null);assert.ok(!s.candidate_visualization.includes("province_map"))}
 if(s.measure_type.startsWith("average")||s.measure_type==="total_and_average_land_area"){
  meanRows++;assert.equal(s.aggregation_policy,"do_not_sum_averages_or_mix_units");
 }
 if(s.measure_type==="nonexclusive_business_attribute_count")assert.equal(s.aggregation_policy,"nonexclusive_attributes_do_not_sum_as_partition");
}
assert.equal(provinces+commodities,35);
assert.equal(sem.table_specific_holds.length,6);
assert.deepEqual([...sem.table_specific_holds].sort(),Object.keys(holds).sort());
assert.equal(hort.find(t=>t.id==="6.1").arithmetic_review_flag!=null,true);
assert.equal(hort.find(t=>t.id==="6.2").arithmetic_review_flag!=null,true);
assert.equal(reg.private_numeric_extraction_qa.watermark_separation_validation.independent_native_text_cells_matched,86);
assert.equal(reg.private_numeric_extraction_qa.national_column_sum_difference_detected.find(x=>x.table_id==="6.1").difference_in_units,1);
assert.equal(reg.private_numeric_extraction_qa.national_column_sum_difference_detected.find(x=>x.table_id==="6.2").difference_in_units,14);
assert.ok(!reg.private_numeric_extraction_qa.derived_metrics_and_maps_publication_allowed);
const ui=fs.readFileSync("js/sli-bps-agri-horti-source-panel.js","utf8");
assert.match(ui,/semantic_profile/);
assert.match(ui,/Belum boleh diterbitkan/);
assert.match(ui,/Selisih subtotal pada publikasi asli/);
console.log("PASS: 35 horticulture table semantics, 6 hard holds, no inferred dash/zero, zero public numeric release; "+provinces+" province-grain and "+commodities+" commodity-grain profiles, "+meanRows+" mean/mixed-unit tables");
