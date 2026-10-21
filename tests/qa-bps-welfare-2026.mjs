import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const from=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const data=JSON.parse(from("data/sli-bps-welfare-2026.json"));
const national=Object.fromEntries(data.national_series.map(s=>[s.id,s]));
const indonesia=data.provinces.find(x=>x.name==="Indonesia");
const met=Object.fromEntries(data.provincial_metrics.map(m=>[m.id,m]));
test("BPS source primary and official publication timestamp",()=>{
 assert.equal(data.schema,"sli-bps-welfare-2026-v1");
 assert.match(data.source.source_url,/^https:\/\/www\.bps\.go\.id\/id\/publication\/2026\/10\/05\//);
 assert.equal(data.source.survey,"Susenas Kor Maret 2026");
 assert.equal(data.source.sample_households,356000);
 assert.equal(data.source.provinces,38);
 assert.equal(data.source.surveyed_regencies_municipalities,514);
 assert.ok(data.quality.commercial_reuse.includes("permission"));
});
test("23 national series preserve their original denominator, years and missing data",()=>{
 assert.deepEqual(data.years,[2022,2023,2024,2025,2026]);
 assert.equal(data.national_series.length,23);
 assert.equal(new Set(data.national_series.map(s=>s.id)).size,23);
 for(const s of data.national_series){
  assert.equal(s.values.length,5,s.id);
  assert.ok(s.values.every(v=>v===null||(typeof v==="number"&&v>=0&&v<=100)),s.id);
  assert.ok([41,42,43].includes(s.pdf_page));
  assert.equal(s.source_url,data.source.source_url);
 }
 assert.deepEqual(national.e_money.values,[null,null,null,33.04,40.98]);
 assert.equal(national.health_insurance.values[4],79.68);
 assert.equal(national.electric_lighting.values[4],99.59);
 assert.equal(national.food_assistance.values[4],15.08);
});
test("38 non-overlapping provinces, national row, and nine correctly typed indicator vectors",()=>{
 assert.equal(data.provincial_metrics.length,9);
 assert.equal(data.provinces.length,39);
 assert.equal(new Set(data.provinces.map(x=>x.name)).size,39);
 assert.equal(data.provinces.filter(x=>x.name==="Indonesia").length,1);
 assert.equal(met.internet_5_plus.table,"7.4");
 assert.equal(met.no_electricity_lighting.table,"6.28");
 assert.equal(met.lpg_citygas_biogas_cooking.table,"6.31");
 assert.match(met.lpg_citygas_biogas_cooking.denominator,/gabungan/);
 for(const [i,m] of data.provincial_metrics.entries())assert.equal(m.index,i,m.id);
 for(const p of data.provinces){
  assert.equal(p.values.length,9,p.name);
  assert.ok(p.values.every(v=>v===null||(typeof v==="number"&&v>=0&&v<=100)),p.name);
 }
});
test("BPS crosschecks: 2026 national healthcare, digital payment, electricity and BPNT",()=>{
 assert.equal(indonesia.values[met.uninsured.index],20.32);
 assert.equal(indonesia.values[met.birth_certificate_0_17.index],94.64);
 assert.equal(indonesia.values[met.piped_drinking_water.index],9.02);
 assert.equal(indonesia.values[met.e_money_households.index],40.98);
 assert.equal(indonesia.values[met.no_electricity_lighting.index],0.41);
 assert.equal(indonesia.values[met.internet_5_plus.index],82.63);
 assert.equal(indonesia.values[met.bpnt_sembako.index],15.08);
 assert.equal(Number((100-national.health_insurance.values[4]).toFixed(2)),20.32);
 assert.equal(Number((100-national.electric_lighting.values[4]).toFixed(2)),0.41);
 assert.equal(data.provinces.find(p=>p.name==="Papua Pegunungan").values[met.internet_5_plus.index],13.03);
});
test("HTML visual controls and public source/Research AI entry point",()=>{
 const html=from("sli-welfare-2026.html");
 for(const id of ["welfareMap","rankBars","provinceRows","trendSvg","sourceBps","copyQuestion","csvButton","status","sortMode"]){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(html,/sli-research-ai\.html/);
 assert.match(from("js/sli-navigation.js"),/sli-welfare-2026\.html/);
 assert.match(from("sli-sector-data-library.html"),/sli-welfare-2026\.html/);
});
test("Research AI has evidence-only source integration without training claims",()=>{
 const worker=from("research-api/src/owner-test-worker.mjs");
 const corpus=from("research-api/src/welfare-corpus.mjs");
 assert.match(worker,/nationalWelfareEvidence\(\)/);
 assert.match(worker,/provincialWelfareEvidence\(\)/);
 assert.match(corpus,/source_url:source/);
 assert.match(corpus,/NA/);
 assert.match(corpus,/not a claim of causal/i);
});
