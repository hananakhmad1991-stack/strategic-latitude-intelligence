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
