import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildBpsOfficialPanel,BPS_PANEL_META} from "../js/sli-bps-official-panel.mjs";
import {panelFixedEffects,panelStability,detectPanelColumns} from "../js/sli-econometrics.mjs";
const src=JSON.parse(readFileSync(new URL("../data/sli-bps-regional-intelligence.json",import.meta.url),"utf8"));
const preview=JSON.parse(readFileSync(new URL("../data/sli-research-province-preview.json",import.meta.url),"utf8"));
test("Official BPS source and exact year vintage are verified before constructing model inputs",()=>{
 const p=buildBpsOfficialPanel(src);
 assert.equal(p.publication.url,src.sources.pdrb.url);
 assert.equal(p.publication.url,BPS_PANEL_META.url);
 assert.equal(p.entity_count,34);
 assert.equal(p.n,136);
 assert.deepEqual(p.growth_years,[2022,2023,2024,2025]);
 assert.deepEqual(p.year_counts,{"2022":34,"2023":34,"2024":34,"2025":34});
 assert.equal(p.excluded_provinces.length,4);
 assert.deepEqual(p.excluded_provinces.map(x=>x.province).sort(),["Papua Barat Daya","Papua Pegunungan","Papua Selatan","Papua Tengah"].sort());
 assert.ok(p.rows.every(r=>r.year>=2022&&r.year<=2025));
 assert.ok(p.rows.every(r=>Number.isFinite(r.pmtb_share_lag1_pct)&&Number.isFinite(r.real_grdp_growth_pct)));
 assert.equal(new Set(p.rows.map(r=>r.province+"|"+r.year)).size,136);
 assert.equal(detectPanelColumns(p.rows).recommendedEntity,"province");
 assert.equal(detectPanelColumns(p.rows).recommendedTime,"year");
});
test("Unbalanced 38-province panel preserves legitimate gaps rather than inventing new Papua back-series",()=>{
 const p=buildBpsOfficialPanel(src,{balanced:false});
 assert.equal(p.n,144);
 assert.equal(p.entity_count,38);
 assert.deepEqual(p.year_counts,{"2022":34,"2023":34,"2024":38,"2025":38});
 for(const name of ["Papua Barat Daya","Papua Selatan","Papua Tengah","Papua Pegunungan"])
  assert.deepEqual(p.rows.filter(r=>r.province===name).map(r=>r.year),[2024,2025]);
});
test("2025 published BPS GRDP constant-price growth matches existing verified SLI province preview",()=>{
 const p=buildBpsOfficialPanel(src,{balanced:false});
 let maxDiff=0;
 for(const r of p.rows.filter(z=>z.year===2025)){
  const prior=preview.provinces.find(z=>z.name===r.province);
  assert.ok(prior,"province naming provenance must be stable");
  maxDiff=Math.max(maxDiff,Math.abs(r.real_grdp_growth_pct-prior.growth_real_2025_pct));
 }
 assert.ok(maxDiff<.005,"published derived real GRDP growth must agree with SLI 2025 BPS snapshot after rounding");
});
test("Official source BPS panel supports real exploratory entity/year FE, but never causal effect claim",()=>{
 const p=buildBpsOfficialPanel(src);
 const fit=panelFixedEffects(p.rows,["pmtb_share_lag1_pct"],"real_grdp_growth_pct","province","year",true);
 assert.equal(fit.unit_count,34);assert.equal(fit.time_count,4);assert.equal(fit.rows_used,136);
 assert.equal(fit.coefficients.length,1);
 assert.ok(Number.isFinite(fit.coefficients[0].estimate));
 assert.ok(Number.isFinite(fit.coefficients[0].std_error_hc1));
 assert.match(fit.limitations,/no causality/);
 const robust=panelStability(p.rows,["pmtb_share_lag1_pct"],"real_grdp_growth_pct","province","year",true);
 assert.equal(robust.leave_one_entity_out.exhaustive,false);
 assert.equal(robust.leave_one_entity_out.tested,25);
 assert.equal(robust.leave_one_year_out.tested,4);
 assert.match(robust.limitations,/do not infer causal/);
});
test("Fail closed on conflicting BPS publication or province coverage",()=>{
 assert.throws(()=>buildBpsOfficialPanel({...src,grdp_years:[2020,2021,2022,2023,2024]}),/vintage/);
 assert.throws(()=>buildBpsOfficialPanel({...src,provinces:src.provinces.slice(1)}),/exactly 38/);
 assert.throws(()=>buildBpsOfficialPanel({...src,sources:{pdrb:{url:"https://evil.example"}}}),/Unexpected BPS/);
});
