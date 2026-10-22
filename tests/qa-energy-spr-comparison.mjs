import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const data=JSON.parse(readFileSync(new URL("../data/energy-spr-comparison-2026.json",import.meta.url),"utf8"));
const page=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const script=readFileSync(new URL("../js/energy-spr-comparison.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../css/energy-spr-comparison.css",import.meta.url),"utf8");

test("dataset includes exactly 25 unique countries: 24 IEA importers and Indonesia",()=>{
 assert.equal(data.countries.length,25);
 assert.equal(new Set(data.countries.map(c=>c.code)).size,25);
 assert.equal(data.countries.filter(c=>c.group==="iea_net_imports").length,24);
 assert.equal(data.countries.filter(c=>c.code==="ID").length,1);
});
test("distinct denominator and legal obligation are never conflated",()=>{
 const indo=data.countries.find(c=>c.code==="ID");
 assert.equal(indo.group,"indonesia_operational");
 assert.match(indo.denominator,/domestic/i);
 assert.equal(indo.days,20.76);
 assert.match(data.iea_standard.denominator,/net oil imports/i);
 assert.match(data.iea_standard.applies_to,/IEA member/i);
 assert.match(data.iea_standard.indonesia_member_type,/Association/);
 assert.match(data.important_methodology,/NOT ranked/i);
});
test("CPE targets are not fabricated actual strategic reserves",()=>{
 assert.equal(data.indonesia.energy_buffer_stock_days_realised,null);
 assert.equal(data.indonesia.national_strategic_oil_stock_days_realised,null);
 assert.equal(data.indonesia.iea_equivalent_net_import_cover_days,null);
 const cpe=data.indonesia.strategic_buffer_cpe_targets;
 assert.equal(cpe.gasoline_million_barrels,9.64);
 assert.equal(cpe.lpg_thousand_metric_tonnes,525.78);
 assert.equal(cpe.crude_million_barrels,10.17);
 assert.equal(cpe.completion_horizon_year,2035);
 assert.match(cpe.legal_status,/not_proof/);
});
test("IEA visual-chart approximations carry explicit uncertainty",()=>{
 const members=data.countries.filter(c=>c.group==="iea_net_imports");
 assert.equal(members.filter(c=>c.value_status==="graphical_approximation").length,23);
 assert.equal(members.find(c=>c.code==="NZ").value_status,"reported_exact_in_ieefa_text");
 assert.equal(data.cross_country_chart.iea_importer_average_days,141);
 assert.equal(data.iea_standard.days,90);
 for(const x of data.countries){
  assert.ok(x.days>0&&Number.isFinite(x.days));
  assert.ok(x.as_of);
  assert.ok(x.source_id);
 }
});
test("2025 Indonesia operational status vs 2026 statement is date-labelled",()=>{
 assert.equal(data.indonesia.operational_fuel_days_2024,22.25);
 assert.equal(data.indonesia.operational_lpg_days_2025,14.50);
 assert.equal(data.indonesia.official_fuel_statement_2026_03_days,23);
 assert.equal(data.indonesia.official_fuel_statement_date,"2026-03-04");
 assert.equal(data.indonesia.reported_storage_capacity_ceiling_days_2026_03,25);
});
test("new Energy section is wired to the existing dashboard and supports source export",()=>{
 assert.match(page,/id="energySPRRoot"/);
 assert.match(page,/energy-spr-comparison\.js/);
 assert.match(page,/energy-spr-comparison\.css/);
 assert.match(page,/window\.initSLIEnergySPR\?\.\(\)/);
 assert.match(script,/download\(d\)/);
 assert.match(script,/data\.countries\.length!==25/);
 assert.match(script,/sli:languagechange/);
 assert.match(css,/#energySPRRoot/);
});
