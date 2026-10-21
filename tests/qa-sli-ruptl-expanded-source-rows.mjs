import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const d=JSON.parse(read("data/sli-ruptl-expanded-22-annex-source-rows.json"));
const a=JSON.parse(read("data/sli-ruptl-provincial-source-projects-2025.json"));
const o=JSON.parse(read("data/sli-ruptl-primary-pdf-2025-2034.json"));
test("New RUPTL original table rows extend 48 source samples to 92 and all 34 geographic annexes",()=>{
 assert.equal(d.schema,"sli-ruptl-source-row-expanded-annex-sample-v1");
 assert.equal(d.new_source_row_count,44);
 assert.equal(d.rows.length,44);
 assert.equal(d.new_subannex_sample_coverage,22);
 assert.equal(o.individual_project_source_records.records.length,13);
 assert.equal(a.source_rows.length,35);
 assert.equal(d.rows.length+a.source_rows.length+o.individual_project_source_records.records.length,92);
 assert.equal(a.geographic_appendix_coverage.subsections.length,34);
 const coverage=new Set([...d.rows.map(x=>x.annex_id),...a.source_rows.map(x=>x.annex_id)]);
 coverage.add("A.1");coverage.add("B.1");coverage.add("C.1");
 assert.equal(coverage.size,34);
 assert.equal(d.source_sha256,a.source.sha256);
 assert.ok(new Set(d.rows.map(x=>x.id)).size===44);
 for(const x of d.rows){
  const target=a.geographic_appendix_coverage.subsections.find(y=>y.annex_id===x.annex_id);
  assert.ok(target,"missing "+x.annex_id);
  assert.equal(x.pdf_page,target.project_table_pdf_page);
  assert.equal(x.table,target.project_table_number);
  assert.ok(Number.isInteger(x.original_source_row_no)&&x.original_source_row_no>0);
  assert.ok(x.capacity_as_printed.length>0);
  assert.match(x.planned_cod_ared||"none",/^20(2[5-9]|3[0-4])$/);
  assert.equal(x.actual_cod_date,null);
  assert.equal(x.actual_2026_status,null);
  assert.equal(x.realized_capacity_mw,null);
  assert.equal(x.source_event_primary_url ?? x.actual_evidence_source,null);
 }
 assert.equal(d.auto_approved_operating_status_count,0);
 const ambon=d.rows.find(x=>x.source_project_label==="Ambon 2");
 assert.equal(ambon.capacity_as_printed,"2x25");
 assert.equal(ambon.capacity_value_mw_if_plain_and_unambiguous,null);
 assert.ok(d.rows.some(x=>x.source_project_label==="Selayar"&&x.table==="C4.16"));
});
test("RUPTL quality register flags duplicate identity, mixed unit, source column and quota geography",()=>{
 assert.equal(d.source_quality_flag_registry.length,9);
 assert.equal(new Set(d.source_quality_flag_registry.map(x=>x.id)).size,9);
 for(const f of d.source_quality_flag_registry){
  assert.ok(f.table&&f.pdf_page&&f.example&&f.review_needed);
  assert.ok(f.pdf_page>=600&&f.pdf_page<=1253);
 }
 const flags=new Map(d.source_quality_flag_registry.map(x=>[x.id,x]));
 assert.equal(flags.get("DUP-A8").pdf_page,697);
 assert.equal(flags.get("UNIT-C4").pdf_page,1016);
 assert.equal(flags.get("LAYOUT-B6").pdf_page,913);
 assert.equal(flags.get("GEO-B5").pdf_page,901);
 assert.equal(d.source_quality_gate_summary.released_2026_operational_status,0);
});
test("Full-source proof requires exact original project/technology/capacity/stage/year cells",()=>{
 const py=read("scripts/verify-ruptl-expanded-original-source-rows.py");
 assert.match(py,/actual!=official_digest|digest!=data\["source_sha256"\]/);
 assert.match(py,/match_label/);
 assert.match(py,/match_cap/);
 assert.match(py,/match_kind/);
 assert.match(py,/match_years/);
 assert.match(py,/match_status/);
 assert.match(py,/match_owner/);
 assert.match(py,/len\(numbered\)!=1/);
 assert.match(py,/auto_approved_actual_cod":0/);
 const workflow=read(".github/workflows/sli-ruptl-44-source-row-proof.yml");
 assert.match(workflow,/contents: read/);
 assert.match(workflow,/retention-days: 30/);
 assert.match(workflow,/checked_source_row_count/);
});
test("Province dashboard distinguishes quota/program rows, zero-less unknown realization and correct source pages",()=>{
 const js=read("js/sli-ruptl-provincial-evidence.js");
 assert.match(js,/const newRows=expansion.rows.map/);
 assert.match(js,/all.length!==92/);
 assert.match(js,/new Set\(all.map\(x=>x.annex_id\)\).size!==34/);
 assert.match(js,/programKind/);
 assert.match(js,/Kuota \/ program/);
 assert.match(js,/Belum ada bukti spesifik/);
 assert.match(js,/sli:exportready/);
 assert.match(js,/evidenceMap\.get/);
 assert.doesNotMatch(js,/innerHTML/);
 for(const html of ["pln-ruptl-energy-investment.html","pln-ruptl-2025-2034-source-intelligence.html","sli-sector-data-library.html"]){
  assert.match(read(html),/sli-ruptl-provincial-evidence\.js/);
 }
 const climate=JSON.parse(read("data/sli-climate-environment.json"));
 assert.equal(climate.indicators.length,20);
 assert.ok(climate.indicators.every(x=>x.observed_value===null));
});
