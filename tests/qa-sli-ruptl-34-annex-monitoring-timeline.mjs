import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const a=JSON.parse(read("data/sli-ruptl-provincial-source-projects-2025.json"));
const d=JSON.parse(read("data/sli-ruptl-project-progress-primary-evidence.json"));
test("All original 34 geographic annex project table headings cite PDF page and exact table ID",()=>{
 assert.equal(a.geographic_appendix_coverage.subsections.length,34);
 assert.equal(a.geographic_appendix_coverage.original_project_table_headings_located,34);
 assert.equal(a.source.sha256,"1308ee580c7c1642fe7817e000c87cb2dc87053e1fcef90606dcc1da396fd002");
 const lookup={};
 for(const x of a.geographic_appendix_coverage.subsections){
  assert.equal(x.project_table_audit_status,"original_source_heading_located_full_row_review_pending");
  assert.match(x.project_table_number,/^[ABC]\d+\.\d+$/);
  assert.equal(x.project_table_number.split(".")[0],x.annex_id.replace(".",""));
  assert.ok(x.project_table_pdf_page>x.pdf_page);
  assert.ok(x.project_table_pdf_page<=1253);
  assert.equal(x.source_cell_reviewed_only_for_published_sample,true);
  assert.ok(!lookup[x.annex_id]);lookup[x.annex_id]=x;
 }
 assert.equal(lookup["A.4"].project_table_pdf_page,650);
 assert.equal(lookup["B.3"].project_table_number,"B3.10");
 assert.equal(lookup["C.4"].project_table_pdf_page,1016);
 assert.equal(lookup["C.12"].project_table_number,"C12.11");
 assert.equal(Object.keys(lookup).length,34);
 assert.equal(a.record_count,35);
});
test("Full-annex scanner outputs only unreviewed source table grids with no new project statuses",()=>{
 const py=read("scripts/review-ruptl-all-34-project-grids.py");
 assert.match(py,/source_sha256|official_digest/);
 assert.match(py,/actual!=official_digest/);
 assert.match(py,/len\(sections\)!=34/);
 assert.match(py,/project_table_pdf_page/);
 assert.match(py,/pdf_page/);
 assert.match(py,/original_grid_cells/);
 assert.match(py,/machine_extracted_original_cells_not_project_validated/);
 assert.match(py,/"approved_new_project_records":0/);
 assert.doesNotMatch(py,/git push|git commit/);
 const workflow=read(".github/workflows/sli-ruptl-full-34-review.yml");
 assert.match(workflow,/retention-days: 30/);
 assert.match(workflow,/contents: read/);
 assert.match(workflow,/approved_new_project_records/);
});
test("Source-event timeline deduplicates combined Java plant, preserves exact dates and nulls",()=>{
 const ui=read("js/sli-ruptl-progress-event-timeline.js");
 assert.match(ui,/const cod=new Map/);
 assert.match(ui,/x\.facility_group\+"\|"\+x\.source_event_date/);
 assert.match(ui,/no|bukan|tidak/i);
 assert.match(ui,/sli:exportready/);
 assert.match(ui,/sourceUrl:/);
 assert.doesNotMatch(ui,/innerHTML/);
 assert.equal(d.observations.length,4);
 assert.equal(d.observations.filter(x=>x.facility_group==="PLTU Jawa 9 & 10").length,2);
 assert.equal(d.related_not_plant_cod[0].never_promote_to_power_plant_operational_status,true);
 assert.equal(d.observations.find(x=>x.source_project_label==="Merangin").source_event_date,null);
 for(const path of ["pln-ruptl-energy-investment.html","pln-ruptl-2025-2034-source-intelligence.html","sli-sector-data-library.html"]){
  const h=read(path);
  assert.match(h,/data-sli-ruptl-official-timeline/);
  assert.match(h,/sli-ruptl-progress-event-timeline\.js/);
  assert.match(h,/sli-ruptl-progress-event-timeline\.css/);
  assert.equal((h.match(/data-sli-ruptl-official-timeline/g)||[]).length,1);
 }
 const provincial=read("js/sli-ruptl-provincial-evidence.js");
 assert.match(provincial,/project_table_pdf_page/);
 assert.match(provincial,/project_table_number/);
});
test("Scheduled PLN ESDM operator candidate discovery is explicitly read-only",()=>{
 const py=read("scripts/scan-ruptl-official-project-news-candidates.py");
 const yml=read(".github/workflows/sli-ruptl-project-news-review.yml");
 assert.match(py,/www\.pln\.co\.id\/news\/press-release/);
 assert.match(py,/www\.esdm\.go\.id/);
 assert.match(py,/medcopower\.co\.id/);
 assert.match(py,/www\.irt\.co\.id/);
 assert.match(py,/original_event_date":None/);
 assert.match(py,/actual_COD":None/);
 assert.match(py,/observed_capacity":None/);
 assert.match(py,/auto_published_project_status_changes":0/);
 assert.match(yml,/schedule:/);
 assert.match(yml,/contents: read/);
 assert.match(yml,/auto_published_project_status_changes/);
 const env=JSON.parse(read("data/sli-climate-environment.json"));
 assert.equal(env.indicators.length,20);
 assert.ok(env.indicators.every(x=>x.observed_value===null));
});
