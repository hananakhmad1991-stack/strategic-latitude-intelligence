import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const d=JSON.parse(read("data/sli-ruptl-primary-pdf-2025-2034.json"));
test("RUPTL original 1253-page PDF pinned digest and official decree 69,512 MW",()=>{
 assert.equal(d.source.original_pdf_pages,1253);
 assert.equal(d.source.sha256,"1308ee580c7c1642fe7817e000c87cb2dc87053e1fcef90606dcc1da396fd002");
 assert.equal(d.official_decree_totals.pdf_page,5);
 assert.equal(d.official_decree_totals.new_capacity_and_storage_mw,69512);
 assert.equal(42569+10256+16687,69512);
 assert.equal(d.ared_capacity_additions.table,"5.81");
 assert.deepEqual(d.ared_capacity_additions.pdf_pages,[333,334]);
 assert.deepEqual(d.ared_capacity_additions.years,[2025,2026,2027,2028,2029,2030,2031,2032,2033,2034]);
});
test("Source-printed national ARED totals remain exact rather than repaired silently",()=>{
 const a=d.ared_capacity_additions;
 assert.deepEqual(a.annual_total_mw,[5325,4016,7015,5855,5553,6447,9524,9140,12165,4472]);
 assert.equal(a.annual_total_mw.reduce((sum,x)=>sum+x,0),69512);
 assert.equal(a.printed_grand_total_mw,69512);
 assert.equal(a.technologies.length,20);
 assert.equal(a.quality_audit.source_printed_technology_grand_sum_mw,69514);
 assert.equal(a.quality_audit.discrepancy_technology_totals_vs_grand_mw,2);
 assert.deepEqual(a.quality_audit.per_technology_printed_vs_sum_discrepancies.map(x=>x.technology),["PLTBg","PLTB","BESS"]);
 assert.equal(a.technologies.find(x=>x.technology==="PLTN").annual_mw[7],250);
 assert.equal(a.technologies.find(x=>x.technology==="PLTS").printed_total_mw,13432);
 assert.equal(a.technologies.find(x=>x.technology==="BESS").printed_total_mw,6013);
 assert.equal(a.technologies.find(x=>x.technology==="PLTBg").annual_mw[0],null);
});
test("Emission projections preserve original tables and BAU vs RE Base distinction",()=>{
 const e=d.emissions_projection;
 assert.equal(e.unit,"million tCO2");
 assert.deepEqual(e.scenarios.find(x=>x.name==="RE Base").annual_total,[309,316,330,336,340,354,354,367,373,374]);
 assert.deepEqual(e.scenarios.find(x=>x.name==="ARED").annual_total,[299,308,321,329,335,348,346,360,363,362]);
 assert.match(e.footnote,/BAU/);
 assert.deepEqual(d.rebase_capacity_additions.annual_total_mw,[5325,3085,5967,5028,4625,5230,6061,5892,7040,4510]);
});
test("Project sample preserves exact planned COD and 2025 stage, never infers operating status",()=>{
 const items=d.individual_project_source_records.records;
 assert.equal(items.length,13);
 for(const p of items){
  assert.ok(["607","818","962"].includes(String(p.pdf_page)));
  assert.ok(["A1.11","B1.10","C1.15"].includes(p.table));
  assert.match(p.cod_ared,/^20(2[5-9]|3[0-4])$/);
  assert.equal(p.actual_commissioning_verified,false);
  assert.equal(p.actual_2026_status_verified,false);
 }
 const sunter=items.find(x=>x.project_name==="Sunter");
 assert.equal(sunter.capacity_mw,35);
 assert.equal(sunter.status_in_ruplt_2025,"Pendanaan");
 assert.equal(sunter.cod_ared,"2028");
 assert.equal(items.find(x=>x.project_name==="Talaud").capacity_mw,null);
 assert.equal(items.find(x=>x.project_name==="Talaud").capacity_as_printed,"2x3");
 assert.equal(items.filter(x=>x.project_name==="Minahasa").length,2);
 assert.ok(items.some(x=>x.project_name==="Langsa"&&x.status_in_ruplt_2025==="PPA"));
});
test("RUPTL visualizations integrated without adding redundant navigation categories",()=>{
 const js=read("js/sli-ruptl-primary-pdf.js");
 assert.match(js,/data-sli-ruptl-primary/);
 assert.match(js,/SLIVisualExport/);
 assert.match(js,/svgChart/);
 assert.match(js,/renderProjects/);
 assert.match(js,/source.source_url/);
 assert.doesNotMatch(js,/innerHTML/);
 for(const page of ["pln-ruptl-energy-investment.html","pln-ruptl-2025-2034-source-intelligence.html","sli-sector-data-library.html"]){
  const html=read(page);
  assert.match(html,/data-sli-ruptl-primary/);
  assert.match(html,/sli-ruptl-primary-pdf\.js/);
  assert.match(html,/sli-ruptl-primary-pdf\.css/);
  assert.equal((html.match(/data-sli-ruptl-primary/g)||[]).length,1);
 }
});
