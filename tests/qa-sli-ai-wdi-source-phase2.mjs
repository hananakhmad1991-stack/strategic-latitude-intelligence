import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const data=p=>JSON.parse(read(p));
const w=data("data/sli-environment-worldbank-wdi-indonesia.json");
const ai=data("data/sli-ai-stanford-worldbank-foundations-2025-2026.json");
test("World Bank WDI has only real dated Indonesian national series, no fake CO2",()=>{
 assert.equal(w.schema,"sli-indonesia-environment-worldbank-wdi-v1");
 assert.equal(w.indicators.length,3);
 assert.equal(w.observations.length,71);
 assert.deepEqual(w.source_audit.missing_indicator_codes,["EN.ATM.CO2E.PC"]);
 assert.equal(w.geography,"Indonesia (IDN)");
 for(const x of w.indicators){
  const rows=w.observations.filter(y=>y.indicator_code===x.indicator_code);
  assert.ok(rows.length>=20);
  assert.ok(rows.every(y=>Number.isInteger(y.year)&&y.year<=2026&&Number.isFinite(y.value)));
  assert.ok(rows.some(y=>y.year===x.latest_year&&y.value===x.latest_value));
  assert.ok(x.api_url.startsWith("https://api.worldbank.org/v2/country/IDN/indicator/"));
 }
 assert.ok(Math.abs(w.indicators.find(x=>x.indicator_code==="AG.LND.FRST.ZS").latest_value-50.6696830671111)<1e-9);
 assert.ok(Math.abs(w.indicators.find(x=>x.indicator_code==="EN.ATM.PM25.MC.M3").latest_value-20.8444642120249)<1e-9);
 assert.equal(w.indicators.find(x=>x.indicator_code==="EG.FEC.RNEW.ZS").latest_year,2021);
});
test("WDI national context does not silently overwrite 20 missing local environmental measurements",()=>{
 const e=data("data/sli-climate-environment.json");
 assert.equal(e.indicators.length,20);
 assert.ok(e.indicators.every(x=>x.observed_value===null));
 assert.equal(e.contextual_national_series.indicators.length,3);
 assert.match(e.indicators.find(x=>x.id==="CE-011").definition_warning,/NOT.*forest-cover change/);
 assert.equal(e.indicators.find(x=>x.id==="CE-009").related_historical_national_series,"EN.ATM.PM25.MC.M3");
});
test("WDI interactive source data appears in Climate and SLI Data Library, retaining years",()=>{
 const script=read("js/sli-environment-wdi.js");
 for(const id of ["dataLibraryWDIRoot","climateEnvironmentWDIRoot"]){
  const page=read(id==="dataLibraryWDIRoot"?"sli-sector-data-library.html":"climate-environment.html");
  assert.ok(page.includes('id="'+id+'"'));
  assert.ok(page.includes("sli-environment-wdi.js"));
 }
 assert.match(script,/data\/sli-environment-worldbank-wdi-indonesia\.json/);
 assert.match(script,/r\.year/);
 assert.match(script,/m\.latest_year/);
 assert.match(script,/data\.worldbank\.org\/indicator/);
 assert.doesNotMatch(script,/innerHTML/);
});
test("PDF summary stats preserve source pages, upper bounds and geographic comparability",()=>{
 assert.equal(ai.indicators.length,62);
 assert.equal(new Set(ai.indicators.map(x=>x.id)).size,62);
 assert.equal(ai.indicators.filter(x=>x.source==="stanford").length,16);
 assert.equal(ai.indicators.filter(x=>x.source==="worldbank").length,46);
 assert.ok(ai.indicators.every(x=>x.pdf_page>0&&x.unit&&x.geography&&x.source_scope));
 const partial=ai.indicators.filter(x=>x.comparator==="<");
 assert.equal(partial.length,4);
 assert.ok(partial.every(x=>x.pdf_page===16||x.pdf_page===17));
 assert.equal(ai.source_audit.numeric_records,62);
 assert.match(read("sli-sector-data-library.html"),/62 indikator numerik/);
 assert.ok(read("ai-intelligence-hub.html").includes('id="sliAiReportCategory"'));
});

test("RUPTL fallback only trusts the two official hosts and signals incomplete sources",()=>{
 const script=read("scripts/audit-ruptl-official-full-pdf.py");
 const workflow=read(".github/workflows/sli-primary-source-candidate-recovery.yml");
 assert.match(script,/gatrik\\.esdm\\.go\\.id\\/assets\\/uploads\\/download_index\\/files\\/b967d-/);
 assert.match(script,/www\\.pln\\.co\\.id\\/webapi\\/media\\/file/);
 assert.match(script,/attempted_official_sources/);
 assert.match(script,/source_transfer_incomplete_no_project_annex_verified/);
 assert.match(script,/if not is_complete:/);
 assert.match(workflow,/GITHUB_STEP_SUMMARY/);
 assert.doesNotMatch(workflow,/continue-on-error: true/);
});
