import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const d=JSON.parse(read("data/sli-ruptl-970-raw-grid-candidates-review.json"));
const geographical=JSON.parse(read("data/sli-ruptl-provincial-source-projects-2025.json"));
const explorer=read("js/sli-ruptl-raw-grid-explorer.js");
test("All 970 source grid candidates are digitalized and tied to their original PDF page",()=>{
 assert.equal(d.schema,"sli-ruptl-all34-original-grid-raw-review-catalog-v1");
 assert.equal(d.total_annexes,34);
 assert.equal(d.total_raw_grid_candidates,970);
 assert.equal(d.sections.length,34);
 assert.equal(d.source_pdf_sha256,geographical.source.sha256);
 const expected=geographical.geographic_appendix_coverage.subsections;
 const ids=new Set(),rows=d.sections.flatMap(s=>{
   const original=expected.find(a=>a.annex_id===s.annex_id);
   assert.ok(original,"Unknown geographic annex: "+s.annex_id);
   assert.equal(s.table,original.project_table_number);
   assert.equal(s.pdf_page,original.project_table_pdf_page);
   assert.equal(s.raw_candidate_count,original.machine_candidate_numbered_grid_rows);
   assert.equal(s.rows.length,s.raw_candidate_count);
   return s.rows;
 });
 assert.equal(rows.length,970);
 rows.forEach(r=>{
   assert.equal(r.raw_cells[0],r.original_row_no,"Raw row number differs from printed source cell");
   assert.ok(r.page>=600&&r.page<=1253);
   assert.ok(r.table.length>2);
   assert.ok(!ids.has(r.source_key));
   ids.add(r.source_key);
   assert.ok(Array.isArray(r.raw_cells)&&r.raw_cells.length>=2);
 });
 assert.equal(ids.size,970);
 assert.equal(new Set(d.sections.map(s=>s.annex_id)).size,34);
});
test("Grid candidate ledger has no invented assets, capacity MW, investor, COD or current status",()=>{
 assert.equal(d.approved_as_distinct_project_records,0);
 assert.equal(d.actual_project_cod_confirmed_from_this_dataset,0);
 assert.match(d.review_status,/not_editor_verified/);
 assert.match(d.methodology,/NOT for MW, investment, operating, or unit COD totals/);
 const cells=d.sections.flatMap(s=>s.rows);
 assert.ok(cells.some(r=>r.raw_cells.some(v=>String(v).includes("98 ,"))),"Original PDF parser's malformed numeric cell must remain observable, not auto-fixed");
 for(const r of cells){
   for(const k of ["capacity_mw","total_mw","actual_cod","actual_2026_status","verified_operating","longitude","latitude","unique_project_id","asset_id"])
    assert.equal(Object.prototype.hasOwnProperty.call(r,k),false,"Prohibited inferred field: "+k);
 }
 assert.match(explorer,/original_grid_cells|raw_cells/);
 assert.match(explorer,/970/);
 assert.match(explorer,/sli:ruptl-region-focus/);
 assert.match(explorer,/sli:ruptl-region-selected/);
 assert.doesNotMatch(explorer,/innerHTML|eval\(/);
});
test("RUPTL pages expose raw catalogue as optional detail under map, not another dominant PDF panel",()=>{
 for(const p of ["pln-ruptl-energy-investment.html","pln-ruptl-2025-2034-source-intelligence.html"]){
  const html=read(p);
  assert.match(html,/data-sli-ruptl-raw-grid/);
  assert.match(html,/js\/sli-ruptl-raw-grid-explorer\.js/);
  assert.match(html,/css\/sli-ruptl-raw-grid-explorer\.css/);
  assert.ok(html.indexOf("data-sli-ruptl-visual")<html.indexOf("data-sli-ruptl-raw-grid"));
 }
});
