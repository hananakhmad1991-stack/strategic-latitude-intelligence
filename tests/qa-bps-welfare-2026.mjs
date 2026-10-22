import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const from=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const data=JSON.parse(from("data/sli-bps-welfare-2026.json"));
const national=Object.fromEntries(data.national_series.map(s=>[s.id,s]));
const indonesia=data.provinces.find(x=>x.name==="Indonesia");
const met=Object.fromEntries(data.provincial_metrics.map(m=>[m.id,m]));
test("BPS source primary and official publication timestamp",()=>{
 assert.equal(data.schema,"sli-bps-welfare-2026-v1");
 assert.match(data.source.source_url,/^https:\/\/www\.bps\.go\.id\/id\/publication\/2026\/10\/05\//);
 assert.equal(data.source.survey,"Susenas Kor Maret 2026");
 assert.equal(data.source.sample_households,356000);
 assert.equal(data.source.provinces,38);
 assert.equal(data.source.surveyed_regencies_municipalities,514);
 assert.ok(data.quality.commercial_reuse.includes("permission"));
});
test("23 national series preserve their original denominator, years and missing data",()=>{
 assert.deepEqual(data.years,[2022,2023,2024,2025,2026]);
 assert.equal(data.national_series.length,23);
 assert.equal(new Set(data.national_series.map(s=>s.id)).size,23);
 for(const s of data.national_series){
  assert.equal(s.values.length,5,s.id);
  assert.ok(s.values.every(v=>v===null||(typeof v==="number"&&v>=0&&v<=100)),s.id);
  assert.ok([41,42,43].includes(s.pdf_page));
  assert.equal(s.source_url,data.source.source_url);
 }
 assert.deepEqual(national.e_money.values,[null,null,null,33.04,40.98]);
 assert.equal(national.health_insurance.values[4],79.68);
 assert.equal(national.electric_lighting.values[4],99.59);
 assert.equal(national.food_assistance.values[4],15.08);
});
test("38 non-overlapping provinces, national row, and nine correctly typed indicator vectors",()=>{
 assert.equal(data.provincial_metrics.length,9);
 assert.equal(data.provinces.length,39);
 assert.equal(new Set(data.provinces.map(x=>x.name)).size,39);
 assert.equal(data.provinces.filter(x=>x.name==="Indonesia").length,1);
 assert.equal(met.internet_5_plus.table,"7.4");
 assert.equal(met.no_electricity_lighting.table,"6.28");
 assert.equal(met.lpg_citygas_biogas_cooking.table,"6.31");
 assert.match(met.lpg_citygas_biogas_cooking.denominator,/gabungan/);
 for(const [i,m] of data.provincial_metrics.entries())assert.equal(m.index,i,m.id);
 for(const p of data.provinces){
  assert.equal(p.values.length,9,p.name);
  assert.ok(p.values.every(v=>v===null||(typeof v==="number"&&v>=0&&v<=100)),p.name);
 }
});
test("BPS crosschecks: 2026 national healthcare, digital payment, electricity and BPNT",()=>{
 assert.equal(indonesia.values[met.uninsured.index],20.32);
 assert.equal(indonesia.values[met.birth_certificate_0_17.index],94.64);
 assert.equal(indonesia.values[met.piped_drinking_water.index],9.02);
 assert.equal(indonesia.values[met.e_money_households.index],40.98);
 assert.equal(indonesia.values[met.no_electricity_lighting.index],0.41);
 assert.equal(indonesia.values[met.internet_5_plus.index],82.63);
 assert.equal(indonesia.values[met.bpnt_sembako.index],15.08);
 assert.equal(Number((100-national.health_insurance.values[4]).toFixed(2)),20.32);
 assert.equal(Number((100-national.electric_lighting.values[4]).toFixed(2)),0.41);
 assert.equal(data.provinces.find(p=>p.name==="Papua Pegunungan").values[met.internet_5_plus.index],13.03);
});
test("HTML visual controls and public source/Research AI entry point",()=>{
 const html=from("sli-welfare-2026.html");
 for(const id of ["welfareMap","rankBars","provinceRows","trendSvg","sourceBps","copyQuestion","csvButton","status","sortMode"]){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(html,/sli-research-ai\.html/);
 assert.match(from("js/sli-navigation.js"),/sli-welfare-2026\.html/);
 assert.match(from("sli-sector-data-library.html"),/sli-welfare-2026\.html/);
});
test("Research AI has evidence-only source integration without training claims",()=>{
 const worker=from("research-api/src/owner-test-worker.mjs");
 const corpus=from("research-api/src/welfare-corpus.mjs");
 assert.match(worker,/nationalWelfareEvidence\(\)/);
 assert.match(worker,/provincialWelfareEvidence\(\)/);
 assert.match(corpus,/source_url:source/);
 assert.match(corpus,/NA/);
 assert.match(corpus,/not a claim of causal/i);
});


test("original five Chapter IX crosswalks keep their verified precision baseline",()=>{
 const matrix=data.sampling_error_2026;
 assert.equal(matrix.schema,"sli-bps-welfare-march-2026-six-indicator-rse-v2");
 assert.equal(matrix.matched_provincial_estimates,216);
 assert.equal(matrix.matched_unavailable,18);
 assert.equal(matrix.nonmatched,0);
 const expected={
  uninsured:["9.28",316],
  no_electricity_lighting:["9.97",451],
  lpg_citygas_biogas_cooking:["9.100",456],
  bpnt_sembako:["9.126",513],
  e_money_households:["9.133",523]
 };
 for(const key of Object.keys(expected))assert.ok(matrix.metrics[key],key+" should remain matched");
 assert.equal(Object.keys(matrix.metrics).length,6);
 let standard=0,caution=0,unreliable=0,unknown=0,validCI=0;
 for(const [id,[table,page]] of Object.entries(expected)){
  const row=matrix.metrics[id];assert.equal(row.sampling_table,table);assert.equal(row.pdf_page,page);
  for(const key of ["relative_standard_error_pct","confidence_interval_low_pct","confidence_interval_high_pct"]) assert.equal(row[key].length,39);
  for(let i=0;i<39;i++){
   const rse=row.relative_standard_error_pct[i],lo=row.confidence_interval_low_pct[i],hi=row.confidence_interval_high_pct[i];
   const point=data.provinces[i].values[met[id].index];
   assert.ok(rse===null||(Number.isFinite(rse)&&rse>=0));
   if(rse===null)unknown++;else if(rse>50)unreliable++;else if(rse>25)caution++;else standard++;
   if(lo!==null||hi!==null){
    assert.ok((Number.isFinite(lo)||lo==="~0")&&Number.isFinite(hi),"Partial CI: "+id+" "+data.provinces[i].name);
    assert.ok((lo==="~0"?0:lo)<=hi,"Reversed CI: "+id+" "+data.provinces[i].name);
    assert.ok(Number.isFinite(point),"Published interval attached to NA: "+id+" "+data.provinces[i].name);
    assert.ok(point+0.015>=(lo==="~0"?0:lo)&&point-0.015<=hi,"CI not enclosing point: "+id+" "+data.provinces[i].name);
    validCI++;
   }
  }
 }
 assert.equal(standard,168);
 assert.equal(caution,12);
 assert.equal(unreliable,14);
 assert.equal(unknown,1);
 assert.equal(standard+caution+unreliable+unknown,195);
 assert.ok(validCI>=175);
 const index=38;
 assert.equal(matrix.metrics.uninsured.relative_standard_error_pct[index],0.55);
 assert.equal(matrix.metrics.no_electricity_lighting.relative_standard_error_pct[index],2.22);
 assert.deepEqual([matrix.metrics.e_money_households.confidence_interval_low_pct[index],matrix.metrics.e_money_households.confidence_interval_high_pct[index]],[40.7,41.26]);
 const ai=from("research-api/src/welfare-corpus.mjs");
 const js=from("js/sli-bps-welfare-2026.js");
 const html=from("sli-welfare-2026.html");
 assert.match(ai,/function precisionFor/);
 assert.match(ai,/RSE tabel/);
 assert.match(js,/RSE >50% dikeluarkan dari peringkat/);
 assert.match(js,/samplePrecision\(data,metric,p.name\).status!=="unreliable"/);
 assert.match(html,/<th>CI 95% \(%\)<\/th>/);
 assert.match(html,/Ekspor 9 indikator provinsi/);
 assert.match(html,/<th>SE \(p\.p\.\)<\/th>/);
});


test("new drinking-water crosswalk agrees with primary source, flags precision and avoids invented district data",()=>{
 const m=data.sampling_error_2026.metrics.piped_drinking_water;
 assert.equal(m.sampling_table,"9.88");
 assert.equal(m.pdf_page,434);
 assert.equal(m.source_main_table,"6.23");
 assert.equal(m.source_main_pdf_page,215);
 for(const k of ["standard_error_pp","relative_standard_error_pct","confidence_interval_low_pct","confidence_interval_high_pct"])assert.equal(m[k].length,39,k);
 assert.equal(m.relative_standard_error_pct[38],0.82);
 assert.equal(m.standard_error_pp[38],0.07);
 assert.equal(m.confidence_interval_low_pct[38],8.87);
 assert.equal(m.confidence_interval_high_pct[38],9.16);
 assert.equal(data.provinces[38].values[met.piped_drinking_water.index],9.02);
 let numeric=0,notReported=0,standard=0,caution=0,unreliable=0;
 for(const [i,p] of data.provinces.entries()){
  const value=p.values[met.piped_drinking_water.index];
  const se=m.standard_error_pp[i],rse=m.relative_standard_error_pct[i],low=m.confidence_interval_low_pct[i],high=m.confidence_interval_high_pct[i];
  assert.ok(rse!==null&&rse>=0);
  if(rse>50)unreliable++;else if(rse>25)caution++;else standard++;
  if(value===null){notReported++;assert.equal(se,null);assert.equal(low,null);assert.equal(high,null)}
  else{numeric++;assert.ok(low<=value+.02&&value-.02<=high,p.name);assert.ok(se>=0,p.name)}
 }
 assert.deepEqual([numeric,notReported,standard,caution,unreliable],[36,3,34,2,3]);
 assert.equal(data.sampling_error_2026.matched_provincial_estimates,216);
 assert.equal(data.sampling_error_2026.matched_unavailable,18);
 assert.equal(data.quality.sampling_error_metric_count,6);
 assert.equal(data.provincial_metrics.length,9);
 assert.match(data.sampling_error_2026.cautions,/three unmatched welfare indicators/);
});
test("Full appendix index is structural internal review metadata, not 24,921 public observations",()=>{
 const a=data.sampling_error_2026.internal_full_appendix;
 assert.equal(a.tables,133);
 assert.equal(a.parsed_panels,253);
 assert.equal(a.geographies,39);
 assert.equal(a.rse_group_categories,639);
 assert.equal(a.extracted_rse_estimate_candidates,24921);
 assert.equal(a.raw_field_candidates,124605);
 assert.equal(a.rse_group_categories*a.geographies,a.extracted_rse_estimate_candidates);
 assert.equal(a.source_pdf_sha256,data.source.pdf_source_sha256);
 assert.match(a.rights,/INTERNAL/);
 assert.match(a.status,/NOT complete/);
 assert.equal(data.sampling_error_2026.nonmatched,0);
 for(const m of Object.values(data.sampling_error_2026.metrics))assert.equal(m.standard_error_pp.length,39);
 const browser=from("js/sli-bps-welfare-2026.js");
 const ai=from("research-api/src/welfare-corpus.mjs");
 assert.match(browser,/SE \(\?p\.p\.|q\.se/);
 assert.match(ai,/standard_error_pp/);
 assert.match(from("sli-welfare-2026.html"),/24\.921 kandidat/);
});

test("BPS sampling error second-engine reconciliation remains an unverified source-text audit",()=>{
 const q=JSON.parse(from("data/sli-bps-welfare-2026-reconciliation.json"));
 assert.equal(q.comparisons.sampled_panels,31);
 assert.equal(q.comparisons.region_rows_compared,1209);
 assert.equal(q.comparisons.exact_full_token_arrays,875);
 assert.equal(q.comparisons.equal_numeric_different_missing_or_footnotes,26);
 assert.equal(q.comparisons.secondary_parser_rows_with_numeric_omissions,308);
 assert.equal(q.comparisons.secondary_parser_numeric_tokens_omitted,354);
 assert.equal(q.comparisons.non_subsequence_numeric_disagreements,0);
 assert.equal(q.comparisons.numeric_value_substitutions_on_shared_tokens,0);
 assert.equal(q.comparisons.exact_full_token_arrays+
  q.comparisons.equal_numeric_different_missing_or_footnotes+
  q.comparisons.secondary_parser_rows_with_numeric_omissions,q.comparisons.region_rows_compared);
 assert.equal(data.quality.cross_engine_reconciliation.per_cell_visual_audit_complete,false);
 assert.equal(data.quality.cross_engine_reconciliation.omitted_secondary_numeric_tokens,354);
 assert.match(from("sli-welfare-2026.html"),/308 baris dengan 354 token/);
});


test("BPS chapter II percent-closure audit is aggregate-only and excludes NA imputation",()=>{
 const a=JSON.parse(from("data/sli-bps-welfare-2026-demography-closure-qa.json"));
 assert.equal(a.tables.length,19);
 assert.equal(a.audit.groups_tested,1755);
 assert.equal(a.audit.complete_numeric_groups,1305);
 assert.equal(a.audit.incomplete_category_groups,435);
 assert.equal(a.audit.missing_total_groups,15);
 assert.equal(a.audit.complete_group_closure_outliers,0);
 assert.equal(a.audit.rounded_total_outliers,0);
 assert.equal(a.audit.tolerance_percentage_points,0.06);
 assert.equal(a.privacy.public_metadata_only,true);
 assert.equal(a.privacy.raw_39_region_rows_not_published,true);
 assert.equal(a.audit.complete_numeric_groups+a.audit.incomplete_category_groups+a.audit.missing_total_groups,a.audit.groups_tested);
 assert.equal(a.tables.reduce((n,r)=>n+r.groups,0),a.audit.groups_tested);
 assert.ok(!a.group_widths["2.17"],"Non-exhaustive table cannot be auto-closed");
 assert.match(from("scripts/sli-bps-owner-live-smoke.mjs"),/SLI_OWNER_SMOKE_TOKEN/);
 assert.match(from(".github/workflows/sli-bps-owner-live-smoke.yml"),/workflow_dispatch/);
 assert.match(from(".github/workflows/sli-bps-owner-live-smoke.yml"),/environment: sli-owner-staging/);
});


test("253-panel 2026 RSE cross-engine triage is complete while image-cell QA remains unresolved",()=>{
 const d=JSON.parse(from("data/sli-bps-welfare-2026-reconciliation.json"));
 const q=d.full_253_panel_check;
 assert.equal(q.scanned_sampling_error_tables,133);
 assert.equal(q.sampled_panels,253);
 assert.equal(q.region_rows_compared,9867);
 assert.equal(q.exact_full_token_arrays,6992);
 assert.equal(q.equal_numeric_different_missing_or_footnotes,257);
 assert.equal(q.secondary_parser_rows_with_numeric_omissions,2617);
 assert.equal(q.secondary_parser_numeric_tokens_omitted,2969);
 assert.equal(q.raw_non_subsequence_numeric_differences,1);
 assert.equal(q.exact_full_token_arrays+q.equal_numeric_different_missing_or_footnotes+
  q.secondary_parser_rows_with_numeric_omissions+q.raw_non_subsequence_numeric_differences,9867);
 assert.equal(q.manual_adjudication.length,1);
 assert.equal(q.manual_adjudication[0].pdf_page,384);
 assert.equal(q.manual_adjudication[0].printed_estimate_pct,89.05);
 assert.equal(q.remaining_non_subsequence_without_visual_adjudication,0);
 assert.equal(q.raw_candidate_rows_public,false);
 assert.equal(q.zero_independently_verified_complete_table_images,true);
 assert.match(q.interpretation,/not a visual audit/);
 assert.equal(data.quality.cross_engine_reconciliation.full_253_panel_check.sampled_panels,253);
 assert.match(from("sli-welfare-2026.html"),/9\.867 baris/);
 assert.match(from("scripts/audit_bps_welfare_secondary_reader.py"),/--all-panels/);
});

