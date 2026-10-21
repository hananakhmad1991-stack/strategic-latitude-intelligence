import assert from "node:assert/strict";
import {test} from "node:test";
import fs from "node:fs";
import {buildFoodEvidence,FOOD_COMMODITIES} from "../js/sli-food-impact-engine.mjs";
const file=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");
const j=path=>JSON.parse(file(path));
const source=j("data/pusdatin-agriculture-september-2026.json"),sem=j("data/pusdatin-agriculture-september-2026-semantic.json");
const audit=j("data/pusdatin-september-pdf-independent-audit.json"),layout=j("data/pusdatin-september-layout-audit-2026.json"),leads=j("data/sli-food-impact-source-leads-september-2026.json");
const fnv=s=>{let h=2166136261;for(const byte of Buffer.from(s,"utf8"))h=Math.imul(h^byte,16777619)>>>0;return h};
test("The other 41 source tables have independent PDF row geometry audit, with 11 more numeric grids matched and 30 explicit exceptions",()=>{
 assert.equal(layout.reviewed_table_count,63);assert.equal(layout.pdf_pages,89);
 assert.equal(layout.numeric_matrix_matched,33);assert.equal(layout.additional_numeric_matrix_matches,11);
 assert.equal(layout.layout_exceptions,30);
 assert.equal(layout.prior_independent_label_row_audit_count,22);
 const full=layout.tables.filter(x=>x.status==="numeric_matrix_matched");
 assert.deepEqual(full.filter(x=>![36,37,38,39,40,41,42,43,49,50,51,52,53,54,55,56,57,58,59,60,61,62].includes(x.table)).map(x=>x.table),[10,11,12,13,14,15,35,44,45,46,48]);
 for(const row of layout.tables){
  const t=sem.table_series.find(x=>x.table===row.table);assert.equal(row.semantic_rows,t.rows.length);
  const codes=t.rows.map(r=>fnv([...t.periods.map(p=>r.values[p]),...t.extra_periods.map(p=>r.extra[p])].map(v=>v==null?"x":String(Math.round(v*100))).join(",")));
  const hash=fnv(codes.sort((a,b)=>a-b).join("|"));
  assert.equal(hash,row.semantic_numeric_multiset_fnv32,"Misstated numeric source hash T"+row.table);
  if(row.status==="numeric_matrix_matched")assert.equal(hash,row.independent_numeric_multiset_fnv32);
  else assert.ok(hash!==row.independent_numeric_multiset_fnv32||row.independent_pdf_numeric_lines!==t.rows.length);
 }
 assert.equal(layout.tables.length,63);assert.equal(sem.parsed_numeric_row_count,2163);
});
test("Food evidence uses only the 22 stronger original PDF reviewed tables, without imputing national price gaps or firm impacts",()=>{
 const result=buildFoodEvidence(sem,source,audit,{commodity:54,province:"Aceh"});
 assert.equal(result.commodity,"Cabai rawit merah");
 assert.equal(result.national.value,66393);assert.equal(result.region.price,null);
 assert.equal(result.region.price_observed,false);assert.equal(result.region.ntp_observed,true);
 assert.equal(result.region.ntp,128.06);
 assert.equal(result.national.monthly_change_pct,14.29);
 assert.equal(result.food_security.signal,"large_monthly_change");
 assert.equal(result.potential_drivers.causal_confirmation,false);
 assert.equal(result.sector_exposure.listed_companies.length,0);
 assert.equal(result.sector_exposure.connection,"thematic_exposure_hypothesis_not_verified_corporate_impact");
 assert.equal(result.controls.price_province_coverage,34);assert.equal(result.controls.ntp_province_coverage,38);
 assert.match(result.national.source_url,/\.pdf#page=77$/);
});
test("National commodity averages and provincial NTP are dated, measured, with no fake market/live price",()=>{
 assert.equal(FOOD_COMMODITIES.length,11);
 for(const c of FOOD_COMMODITIES){
  const report=buildFoodEvidence(sem,source,audit,{commodity:c.table,province:"Jawa Barat"});
  assert.equal(report.publication_status,"historical_snapshot_not_live");
  const tab=sem.table_series.find(x=>x.table===c.table),national=tab.rows.at(-1);
  assert.equal(report.national.value,national.values["2026-08"]);
  assert.equal(report.national.previous,national.values["2026-07"]);
  assert.equal(report.observation_period,"2026-08");
  assert.equal(report.region.ntp_unit,"index 2018=100");
  assert.ok(report.national.source_url.includes("#page="));
 }
 assert.throws(()=>buildFoodEvidence(sem,source,audit,{commodity:47}),/not in verified set/);
});
test("Twenty-two Research AI source records have original source links and forbid fabricated causal/company claims",()=>{
 assert.equal(leads.record_count,22);assert.equal(leads.records.length,22);
 assert.equal(leads.records.filter(r=>r.province).length,8);
 for(const r of leads.records){
  assert.ok(r.source_url.startsWith("https://satudata.pertanian.go.id/"));
  assert.equal(r.period,"2026-08");assert.equal(r.source_date,"2026-09-23");
  assert.equal(r.topic,"food");assert.ok(Number.isFinite(r.value));assert.ok(r.name.length>14);
  assert.ok(r.status.startsWith("historical_"));
  assert.equal(r.verification_class,"pdf_independent_row_numeric");
 }
 assert.equal(new Set(leads.records.map(r=>r.name)).size,22);
});
test("All three SLI pages share a single impact module; no dead IDX watchlist path",()=>{
 for(const page of ["food-agriculture-intelligence.html","sli-research-ai.html","sli-research-evidence-preview.html"]){
  assert.match(file(page),/sli-food-impact-panel\.mjs/);
  assert.match(file(page),/sli-food-impact-panel\.css/);
 }
 assert.match(file("js/sli-food-impact-panel.mjs"),/index\.html#sliHomeIDXSectors/);
 assert.doesNotMatch(file("js/sli-food-impact-panel.mjs"),/sli-idx-sector-watchlist\.html/);
});
