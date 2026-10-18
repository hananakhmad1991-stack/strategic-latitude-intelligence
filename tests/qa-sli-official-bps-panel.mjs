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
 assert.equal(p.entity_count,32);
 assert.equal(p.n,128);
 assert.deepEqual(p.growth_years,[2022,2023,2024,2025]);
 assert.deepEqual(p.year_counts,{"2022":32,"2023":32,"2024":32,"2025":32});
 assert.equal(p.excluded_provinces.length,6);
 assert.ok(p.excluded_provinces.some(x=>x.province==="Papua"&&/boundary break/.test(x.reason)));
 assert.ok(p.excluded_provinces.some(x=>x.province==="Papua Barat"&&/boundary break/.test(x.reason)));
 assert.doesNotMatch(JSON.stringify(p.rows),/"province":"Papua( Barat)?"/);
 assert.match(p.comparability_warning,/NOT economic contraction/);
 assert.equal(p.publication.admin_boundary_sources.length,2);

 assert.deepEqual(p.excluded_provinces.map(x=>x.province).sort(),["Papua","Papua Barat","Papua Barat Daya","Papua Pegunungan","Papua Selatan","Papua Tengah"].sort());
 assert.ok(p.rows.every(r=>r.year>=2022&&r.year<=2025));
 assert.ok(p.rows.every(r=>Number.isFinite(r.pmtb_share_lag1_pct)&&Number.isFinite(r.real_grdp_growth_pct)));
 assert.equal(new Set(p.rows.map(r=>r.province+"|"+r.year)).size,128);
 assert.equal(detectPanelColumns(p.rows).recommendedEntity,"province");
 assert.equal(detectPanelColumns(p.rows).recommendedTime,"year");
});
test("Unbalanced geographically screened 36-province panel preserves legitimate gaps and boundary changes",()=>{
 const p=buildBpsOfficialPanel(src,{balanced:false});
 assert.equal(p.n,136);
 assert.equal(p.entity_count,36);
 assert.deepEqual(p.year_counts,{"2022":32,"2023":32,"2024":36,"2025":36});
 for(const name of ["Papua","Papua Barat"])
  assert.equal(p.rows.filter(r=>r.province===name).length,0,"Never mix old-boundary Papua values in official regression");
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
 assert.equal(p.rows.filter(r=>r.year===2025).length,36);
});
test("Official source BPS panel supports real exploratory entity/year FE, but never causal effect claim",()=>{
 const p=buildBpsOfficialPanel(src);
 const fit=panelFixedEffects(p.rows,["pmtb_share_lag1_pct"],"real_grdp_growth_pct","province","year",true);
 assert.equal(fit.unit_count,32);assert.equal(fit.time_count,4);assert.equal(fit.rows_used,128);
 assert.equal(fit.coefficients.length,1);
 assert.ok(Number.isFinite(fit.coefficients[0].estimate));
 assert.ok(Number.isFinite(fit.coefficients[0].std_error_hc1));
 assert.ok(Math.abs(fit.coefficients[0].estimate-(-0.068438))<.0001,
  "Audited 32-province beta must match independent two-way demeaned calculation; reject old boundary-corrupted +0.122396 estimate");
 assert.ok(fit.residual_diagnostics.flagged.every(z=>z.name&&z.entity&&/^20\d\d$/.test(z.year)),
  "Influential panel cases must include province and year, not an unlabeled row index");
 assert.match(fit.residual_diagnostics.note,/within-transformed regression design/);
 assert.ok(fit.coefficients[0].ci95_low<0&&fit.coefficients[0].ci95_high>0,
  "Uncertain association must not be advertised as statistically distinct from zero");
 const growth2023=p.rows.filter(r=>r.year===2023).map(r=>r.real_grdp_growth_pct);
 const mean2023=growth2023.reduce((a,b)=>a+b,0)/growth2023.length;
 assert.ok(Math.abs(mean2023-5.4780957)<.0001,
  "2023 mean growth must not contain spurious Papua/Papua Barat territorial contractions");
 assert.ok(growth2023.every(v=>v>-50),
  "No 2023 -71.34% Papua administrative break may reach official-growth regression");
 assert.match(fit.limitations,/no causality/);
 const robust=panelStability(p.rows,["pmtb_share_lag1_pct"],"real_grdp_growth_pct","province","year",true);
 assert.equal(robust.leave_one_entity_out.exhaustive,true);
 assert.equal(robust.leave_one_entity_out.tested,32);
 assert.equal(robust.leave_one_entity_out.successful,32);
 assert.equal(robust.all_refits_complete,true);
 assert.equal(robust.leave_one_year_out.successful,4);
 assert.equal(robust.leave_one_year_out.tested,4);
 assert.match(robust.limitations,/do not infer causal/);
});
test("Fail closed on conflicting BPS publication or province coverage",()=>{
 assert.throws(()=>buildBpsOfficialPanel({...src,grdp_years:[2020,2021,2022,2023,2024]}),/vintage/);
 assert.throws(()=>buildBpsOfficialPanel({...src,provinces:src.provinces.slice(1)}),/exactly 38/);
 assert.throws(()=>buildBpsOfficialPanel({...src,sources:{pdrb:{url:"https://evil.example"}}}),/Unexpected BPS/);
});

test("BPS 32×4 multivariable model checks ALL 32 LOEO and all 4 LOYO with sign-risk metadata",()=>{
 const p=buildBpsOfficialPanel(src,{balanced:true});
 const fit=panelFixedEffects(p.rows,["pmtb_share_lag1_pct","household_share_lag1_pct"],"real_grdp_growth_pct","province","year",true);
 const risk=panelStability(p.rows,["pmtb_share_lag1_pct","household_share_lag1_pct"],"real_grdp_growth_pct","province","year",true);
 assert.equal(fit.coefficients.length,2);
 assert.equal(risk.leave_one_entity_out.tested,32);
 assert.equal(risk.leave_one_entity_out.successful,32);
 assert.equal(risk.leave_one_entity_out.exhaustive,true);
 assert.equal(risk.leave_one_year_out.tested,4);
 assert.equal(risk.leave_one_year_out.successful,4);
 assert.equal(risk.all_refits_complete,true);
 assert.equal(risk.decision_readiness,"not_robust_for_investment_inference");
 assert.equal(risk.sign_unstable,true);
 assert.ok(risk.leave_one_year_out.metrics.some(m=>m.sign_reversals>=1));
 assert.ok(risk.leave_one_entity_out.metrics.every(m=>Number.isFinite(m.max_absolute_shift)&&m.max_absolute_shift>=0));
 assert.ok(risk.leave_one_entity_out.metrics.some(m=>m.relative_change_near_zero_denominator));
 assert.match(risk.screening,/near-zero baseline|reverses a coefficient sign/);
});
