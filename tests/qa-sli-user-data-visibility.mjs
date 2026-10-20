import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));
const safety=json("data/sli-bps-public-safety.json"),regional=json("data/sli-bps-regional-intelligence.json");
const gini=json("data/sli-bps-gini-2026.json"),climate=json("data/sli-climate-environment.json");
const macro=json("data/sli-macro-indonesia-2026.json"),power=json("data/pln-saidi-saifi-2023-2025.json");
const iea=json("data/iea-critical-minerals-2026-full-scenarios.json");
const inventory=json("data/sli-user-dataset-recovery-inventory.json");
const page=read("sli-sector-data-library.html"),client=read("js/sli-sector-data-library.js");
test("Crime is traceable and Polda jurisdictions never confused with Susenas province sample",()=>{
 assert.equal(safety.national.police_cases[0],584991);
 assert.equal(safety.national.police_cases[1],561993);
 assert.equal(safety.provinces.length,38);
 assert.ok(safety.police_districts.length>=30);
 assert.equal(safety.national.victim_prevalence_pct[1],0.73);
 assert.match(client,/securityView/);
 assert.match(client,/police_districts/);
 assert.match(page,/Polda.*bukan.*provinsi/);
});
test("BPS politics, 38-region socioeconomic and Gini have separate independent periods",()=>{
 assert.equal(regional.provinces.length,38);
 assert.equal(gini.provinces.length,38);
 assert.equal(regional.idi.length,4);
 assert.equal(regional.idi.at(-1).national,79.81);
 assert.equal(gini.national.combined,0.368);
 assert.ok(macro.metrics.some(x=>x.id==="poverty_rate"&&x.period==="2026-03"));
 assert.match(page,/IDI.*IKP/);
 assert.match(page,/PMTB.*bukan.*BKPM/);
});
test("Uploaded complete IEA 2026 model restored, source-attributed and not confused with 2026 observations",()=>{
 assert.equal(iea.edition,"IEA Critical Minerals Dataset, July 2026");
 assert.equal(iea.license,"CC BY 4.0");
 assert.equal(iea.source,"https://www.iea.org/data-and-statistics/data-product/critical-minerals-dataset");
 assert.equal(Object.keys(iea.demand).length,9);
 assert.equal(iea.supply.length,108);
 assert.equal(iea.columns.demand.length,16);
 assert.equal(iea.columns.supply.length,4);
 assert.ok(iea.demand.total_demand.some(x=>x.h==="Nickel"));
 for(const entries of Object.values(iea.demand)){
  for(const row of entries)assert.equal(row.v.length,iea.columns.demand.length);
 }
 for(const row of iea.supply)assert.equal(row.v.length,iea.columns.supply.length);
 assert.match(page,/IEA.*CC BY 4\.0/);
 assert.match(page,/bukan<\/strong> volume produksi aktual Indonesia 2026/);
 assert.match(client,/IEA Critical Minerals Dataset, July 2026/);
});
test("Pending environmental numeric indicators never shown as zeros or verified readings",()=>{
 assert.equal(climate.indicators.length,20);
 assert.ok(climate.indicators.every(x=>x.observed_value===null));
 assert.match(client,/Belum diimpor/);
 assert.match(client,/Number\.isFinite\(x\.observed_value\)/);
 assert.match(page,/bukan angka observasi/);
});
test("PLN SAIDI/SAIFI grouped by reporting regions, not fictitious province statistics",()=>{
 assert.ok(power.national["2023"]&&power.national["2024"]&&power.national["2025"]);
 assert.equal(power.national["2025"].saidi,8.48);
 assert.match(client,/outside_java/);
 assert.match(page,/Unit pelayanan PLN tertentu melayani lebih dari satu provinsi/);
});
test("User source inventory separates ready data from source-only/pending archives",()=>{
 assert.equal(inventory.schema,"sli-user-provided-data-visibility-recovery-v1");
 assert.ok(inventory.datasets.length>=12);
 const ids=new Set(inventory.datasets.map(x=>x.id));
 assert.equal(ids.size,inventory.datasets.length);
 for(const id of ["bps_crime","bps_politics","bps_grdp","iea_full","environment","ai_index","worldbank_ai","pln_ruptl"])
  assert.ok(ids.has(id),id);
 assert.ok(inventory.datasets.some(x=>x.status==="pending_numeric_ingestion"));
 assert.ok(inventory.datasets.some(x=>x.status==="full_user_normalized_upload_restored_to_repository"));
 assert.equal(inventory.no_automatic_factual_promotion,true);
 assert.match(page,/id="inventoryTable"/);
});
test("Each sector route links to data library and user-supplied Research AI can reach it",()=>{
 const sectorPages=["index.html","sli-research-ai.html","geopolitical-impact-assessment.html",
 "climate-environment.html","indonesia-macroeconomic-intelligence.html","provincial-intelligence.html"];
 for(const p of sectorPages)assert.match(read(p),/sli-sector-data-library\.html/,p);
 const nav=read("js/sli-navigation.js");
 assert.match(nav,/datahub:\['SLI Data Library/);
 for(const id of ["security","governance","socio","minerals","environment","power","inventory"]){
  assert.match(page,new RegExp('id="'+id+'"'));
 }
 assert.match(page,/sli-sector-data-library\.js/);
});
test("All source-loaded numeric data is used with dynamic fetch, no public private keys",()=>{
 assert.match(client,/fetch\(path,\{cache:"no-cache"\}\)/);
 assert.match(client,/replaceChildren/);
 assert.doesNotMatch(page+client,/OPENAI_API_KEY|SLI_OWNER_TEST_TOKEN|Authorization: Bearer/);
 const ids=["sli-bps-public-safety","sli-bps-regional-intelligence","iea-critical-minerals-2026-full-scenarios",
  "sli-climate-environment","pln-saidi-saifi-2023-2025"];
 for(const id of ids)assert.ok(client.includes(id));
});
