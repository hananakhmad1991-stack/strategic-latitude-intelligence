import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const d=JSON.parse(read("data/sli-ruptl-full-official-annex-index.json"));
test("1,253-page authentic official RUPTL Gatrik source and checksum never imply project-level verification",()=>{
 assert.equal(d.schema,"sli-ruptl-2025-2034-full-official-annex-index-v1");
 assert.equal(d.source_pdf_total_pages,1253);
 assert.equal(d.source_size_bytes,51789874);
 assert.equal(d.source_sha256,"1308ee580c7c1642fe7817e000c87cb2dc87053e1fcef90606dcc1da396fd002");
 assert.match(d.source_url,/gatrik\.esdm\.go\.id\/gatrik\/gatrik-api\/storage\/migrasi/);
 assert.equal(d.verified_individual_project_records,0);
 assert.equal(d.appendix_heading_count,42);
 assert.equal(d.headings.length,42);
 assert.deepEqual(d.annex_first_page_by_group,{A:600,B:811,C:951,D:1190,E:1202});
 const labels=new Set(d.headings.map(x=>x.heading));
 assert.equal(labels.size,42);
 assert.ok(d.headings.every(x=>x.pdf_page>=600&&x.pdf_page<=1253&&x.status==="source_detected_annex_header_not_project_record"));
 assert.match(d.index_limits,/zero approved individual project records/);
});
test("Annex source index available from RUPTL sector and library; renderer links exact pages with exports",()=>{
 for(const page of ["pln-ruptl-2025-2034-source-intelligence.html","sli-sector-data-library.html"]){
  const html=read(page);
  assert.match(html,/data-sli-ruptl-annex-index/);
  assert.match(html,/sli-ruptl-annex-index\.js/);
  assert.match(html,/sli-ruptl-annex-index\.css/);
 }
 const script=read("js/sli-ruptl-annex-index.js");
 assert.match(script,/verified_individual_project_records!==0/);
 assert.match(script,/#page=/);
 assert.match(script,/SLIVisualExport\.register/);
 assert.match(script,/source_audit_run/);
 assert.doesNotMatch(script,/innerHTML/);
});

test("RUPTL sector, investor, PLN stats and AI grid pages distinguish available full PDF from unverified project rows",()=>{
 for(const page of ["pln-ruptl-2025-2034-source-intelligence.html","pln-ruptl-energy-investment.html","pln-electricity-statistics.html","ruplt-investor-digitization.html","ai-regional-grid-opportunities.html"]){
  const html=read(page);
  assert.match(html,/1,253.page|1,253-page|1,253 PDF pages|1,253-page/,"Must disclose full official RUPTL PDF status: "+page);
  assert.match(html,/42 annex|42 annex-section/,"Must report bounded official annex header count: "+page);
  assert.match(html,/not validat|unverified|pending verification|not confirm|zero individual|neither constitutes a complete province-level realized-investment census/i,"Must not promote headings into verified individual projects: "+page);
  assert.match(html,/pln-ruptl-2025-2034-source-intelligence\.html#ruptl-full-annex-source-index|id="ruptl-full-annex-source-index"/,"Link to verified annex index missing: "+page);
 }
 const investor=read("pln-ruptl-energy-investment.html"),primary=read("pln-ruptl-2025-2034-source-intelligence.html");
 assert.doesNotMatch(investor,/The complete ~52 MB RUPTL PDF and ~76 MB PLN Statistics 2025 file could not be downloaded/);
 assert.doesNotMatch(primary,/The official full-PDF URL returned a truncated approximately 16 MB file/);
 assert.doesNotMatch(primary,/still unavailable for page-level verification/);
 assert.match(primary,/The heading-only index does not validate individual project records/);
 assert.match(primary,/Review sampled project evidence/);
 assert.match(primary,/id="ruplt-provincial-project-review"/);
 assert.match(primary,/gatrik\.esdm\.go\.id/);
});
