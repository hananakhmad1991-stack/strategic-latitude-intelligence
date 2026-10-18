import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {auditOfficialProvincialData,OFFICIAL_INDICATORS,buildBpsPressFreedomContext} from "../js/sli-provincial-data-integrity.mjs";
import {buildBpsOfficialPanel} from "../js/sli-bps-official-panel.mjs";
const raw=JSON.parse(readFileSync(new URL("../data/sli-bps-regional-intelligence.json",import.meta.url),"utf8"));
const preview=JSON.parse(readFileSync(new URL("../data/sli-research-province-preview.json",import.meta.url),"utf8"));
test("BPS official panel receives fail-closed source coverage, independent growth reconciliation and provincial exclusions",()=>{
 const audit=auditOfficialProvincialData(raw,preview);
 assert.equal(audit.status,"passed_with_caveats",JSON.stringify(audit.errors));
 assert.equal(audit.errors.length,0);
 assert.equal(audit.panel.entities,32);
 assert.equal(audit.panel.n,128);
 assert.equal(audit.crosscheck.sample_size,32);
 assert.ok(audit.crosscheck.max_abs_diff_pp<.005);
 assert.equal(audit.panel.excluded.length,6);
 assert.ok(audit.warnings.some(w=>/Papua/.test(w)));
 assert.equal(audit.source_coverage.grdp_current.availability_by_year[2021],34);
 assert.equal(audit.source_coverage.grdp_current.availability_by_year[2025],38);
 assert.ok(audit.review_queue.extreme_growth.every(x=>!/^(Papua|Papua Barat)$/.test(x.province)));
});
test("Derived BPS household share lag is transparent, numerically source-aligned, and never confused with BKPM",()=>{
 const panel=buildBpsOfficialPanel(raw,{balanced:true});
 assert.equal(panel.rows.length,128);
 for(const row of panel.rows){
  const src=raw.provinces.find(p=>p.name===row.province),i=raw.grdp_years.indexOf(row.year);
  const expected=100*src.household_current[i-1]/src.grdp_current[i-1];
  assert.ok(Math.abs(expected-row.household_share_lag1_pct)<.000001);
 }
 assert.ok(OFFICIAL_INDICATORS.find(x=>x.id==="pmtb_lag").rule.includes("bukan BKPM"));
});
test("Real BPS/Dewan Pers press freedom annual context has only audited 2022–2024, never fabricated 2025",()=>{
 const report=buildBpsPressFreedomContext(raw);
 assert.equal(report.n,96);
 assert.deepEqual(report.year_counts,{"2022":32,"2023":32,"2024":32});
 assert.equal(report.missing_2025,true);
 assert.ok(report.rows.every(x=>x.press_freedom_ikp>=0&&x.press_freedom_ikp<=100&&x.year<=2024));
 const audit=auditOfficialProvincialData(raw,preview);
 assert.equal(audit.governance_context.rows,96);
 assert.equal(audit.governance_context.status,"context_only");
});
test("Source readiness prevents fake panel controls from Gini 2026 and 2024 PLN operating regions",()=>{
 const ready=OFFICIAL_INDICATORS.filter(x=>x.readiness==="panel_ready");
 assert.deepEqual(ready.map(x=>x.id),["growth","pmtb_lag","household_lag"]);
 assert.equal(OFFICIAL_INDICATORS.find(x=>x.id==="gini").readiness,"no_year_panel");
 assert.equal(OFFICIAL_INDICATORS.find(x=>x.id==="grid_assets").readiness,"geography_mismatch");
 assert.equal(OFFICIAL_INDICATORS.find(x=>x.id==="press_freedom").readiness,"context_only");
 assert.equal(OFFICIAL_INDICATORS.find(x=>x.id==="employment").readiness,"source_not_ingested");
 assert.equal(OFFICIAL_INDICATORS.find(x=>x.id==="education").readiness,"source_not_ingested");
 assert.equal(OFFICIAL_INDICATORS.find(x=>x.id==="bkpm").readiness,"source_not_ingested");
 assert.ok(OFFICIAL_INDICATORS.every(x=>x.source===null||x.source.startsWith("https://")));
});
test("Audit reports missing provenance and does not approve unverified input",()=>{
 const bad=JSON.parse(JSON.stringify(preview));
 bad.provinces.find(x=>x.name==="Jawa Barat").growth_real_2025_pct=101;
 const audit=auditOfficialProvincialData(raw,bad);
 assert.equal(audit.status,"blocked");
 assert.ok(audit.errors.some(x=>/Jawa Barat/.test(x)));
});
