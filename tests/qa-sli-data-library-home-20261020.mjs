import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));
test("Homepage displays a discoverable Data Library panel above national KPIs",()=>{
 const s=read("index.html");
 const pos=s.indexOf('id="sliPortalDataLibrary"'),kpi=s.indexOf('class="sli-portal-indicators"'),hero=s.indexOf('class="sli-portal-hero"');
 assert.ok(hero>=0&&pos>hero&&kpi>pos,"Home data library must be immediately after hero and before national KPIs");
 assert.ok(s.includes('href="./sli-sector-data-library.html" data-id="Perpustakaan Data"'));
 assert.ok(s.includes("sli-portal-data-library-cta"));
 assert.ok(s.includes("sli-portal-sector-library"));
 assert.ok(s.includes("@media(max-width:740px){.sli-portal-data-library"));
 for(const id of ["security","governance","socio","minerals","environment","power"])
  assert.ok(s.includes('sli-sector-data-library.html#'+id),id);
});
test("RUPTL 109-reservoir and 24-year AMI source reuse is exact",()=>{
 const solar=json("data/ruplt-2025-2034-floating-solar-potential.json");
 const e=json("data/pln-ruptl-uploaded-excerpt-2025-2034.json");
 const script=read("js/sli-sector-data-library.js");
 assert.equal(solar.rows.length,109);
 assert.equal(e.ami.series.length,24);
 assert.ok(solar.printed_total_mw>13000);
 for(const x of e.ami.series){
  assert.ok(Number.isFinite(x.annual_installation_target),String(x.year));
  assert.ok(Number.isFinite(x.cumulative_installation_target),String(x.year));
 }
 assert.match(script,/x\.annual_installation_target/);
 assert.match(script,/x\.cumulative_installation_target/);
 assert.match(script,/potensi/i);
 assert.match(read("sli-sector-data-library.html"),/bukan proyek PLTS yang sudah beroperasi/);
});
test("Stanford and World Bank 2025–26 chart facts carry source, pages, geography, scope, and unit",()=>{
 const d=json("data/sli-ai-stanford-worldbank-foundations-2025-2026.json");
 assert.equal(d.indicators.length,15);
 assert.equal(d.indicators.filter(x=>x.source==="stanford").length,9);
 assert.equal(d.indicators.filter(x=>x.source==="worldbank").length,6);
 assert.equal(d.indicators.find(x=>x.id==="stanford_us_ai_private_investment_2025").value,285.9);
 assert.equal(d.indicators.find(x=>x.id==="stanford_ai_power_q42025").value,29.6);
 assert.equal(d.indicators.find(x=>x.id==="wb_lmic_usage_april2025").value,4.7);
 assert.equal(d.sources.worldbank.license,"CC BY 3.0 IGO; verify any third-party component rights.");
 assert.ok(d.indicators.every(x=>x.pdf_page>0&&x.geography&&x.unit&&x.methodology));
 assert.ok(d.indicators.every(x=>x.source_scope!=="indonesia_national"));
 assert.match(d.indonesia_specificity,/no 2025 country percentage/i);
});
test("AI topic dashboard displays recovered source-page report evidence",()=>{
 const s=read("ai-intelligence-hub.html");
 assert.match(s,/id="ai-foundations-evidence"/);
 assert.match(s,/sli-ai-report-evidence\.js/);
 assert.match(s,/sli-sector-data-library\.html#ai-reports/);
 const js=read("js/sli-ai-report-evidence.js");
 assert.match(js,/source\.publisher/);
 assert.match(js,/x\.pdf_page/);
 assert.match(js,/x\.geography/);
 assert.doesNotMatch(js,/innerHTML/);
});
test("BNPB 2025 publisher data is not invented before XLSX validation",()=>{
 const d=json("data/sli-bnpb-provincial-2025.json");
 assert.equal(d.records.length,0);
 const src=read("sli-sector-data-library.html");
 assert.match(src,/df39e8c3-117e-40fa-b518-ff1037743955/);
 assert.match(src,/belum ada angka bukan berarti nihil bencana/);
 const script=read("js/sli-sector-data-library.js");
 assert.match(script,/Menunggu ingesti/);
 assert.match(read("climate-environment.html"),/id="bnpb2025Availability"/);
});
test("Inventory truthfully distinguishes ready from partial and published target pages",()=>{
 const d=json("data/sli-user-dataset-recovery-inventory.json");
 for(const key of ["pln_ruptl","ai_index","worldbank_ai","bnpb_disasters"]){
  const x=d.datasets.find(z=>z.id===key);assert.ok(x&&x.status&&x.detail_dashboard,x?.id);
 }
 for(const id of ["ai_index","worldbank_ai"])
  assert.equal(d.datasets.find(x=>x.id===id).public_dataset,"data/sli-ai-stanford-worldbank-foundations-2025-2026.json");
 assert.equal(d.datasets.find(x=>x.id==="bnpb_disasters").status,"pending_numeric_ingestion");
 assert.equal(d.datasets.find(x=>x.id==="bnpb_disasters").source_discovery_status,"official_xlsx_found_download_and_numeric_validation_pending");
});
