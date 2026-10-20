import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const src=JSON.parse(read("data/sli-bnpb-provincial-2025.json"));
const geo=JSON.parse(read("data/indonesia-provinces.geojson"));
const bps=JSON.parse(read("data/sli-bps-regional-intelligence.json"));
const gini=JSON.parse(read("data/sli-bps-gini-2026.json"));
const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/^daerah istimewa yogyakarta$/,"di yogyakarta").replace(/^sumatera /,"sumatra ");
const ui=read("js/sli-provincial-nexus-ui.js"),page=read("provincial-intelligence.html"),lib=read("sli-sector-data-library.html"),libJs=read("js/sli-sector-data-library.js");

test("BNPB disaster observations match all 38 BPS and GeoJSON administrative provinces exactly",()=>{
 assert.equal(src.records.length,38);
 assert.equal(src.disaster_types.length,9);
 assert.equal(new Set(src.records.map(r=>r.admin_code)).size,38);
 const bn=new Set(src.records.map(x=>normalize(x.province)));
 assert.equal(bn.size,38);
 for(const list of [bps.provinces,gini.provinces,geo.features.map(f=>({name:f.properties.name}))]){
  assert.equal(list.length,38);
  for(const row of list)assert.ok(bn.has(normalize(row.name)),row.name);
 }
 for(const row of src.records){
  for(const metric of src.disaster_types){
   assert.ok(Number.isInteger(row[metric])&&row[metric]>=0,row.province+" "+metric);
  }
 }
});

test("All 9 BNPB national totals are preserved; 8 match, earthquake 29 provincial vs 28 national",()=>{
 let matched=0;
 for(const metric of src.disaster_types){
  const actual=src.records.reduce((sum,p)=>sum+p[metric],0);
  assert.equal(actual,src.recomputed_provincial_totals[metric]);
  if(actual===src.published_national_totals[metric])matched++;
 }
 assert.equal(matched,8);
 assert.equal(src.quality_checks.national_totals_match,8);
 assert.deepEqual(src.quality_checks.national_aggregate_discrepancies,
  [{indicator:"earthquakes",provincial_sum:29,source_national:28,difference:1}]);
 assert.equal(src.source_ckan_resource_id,"df39e8c3-117e-40fa-b518-ff1037743955");
});

test("Province dossier gets measured hazard cards without turning raw counts into risk scoring",()=>{
 for(const key of ["provinceFloods","provinceWildfires","provinceExtremeWeather","provinceLandslides","provinceDisasterContext","provincialDisasterEvidence"])
  assert.ok(page.includes('id="'+key+'"'),key);
 for(const id of ["floods","wildfires","extreme_weather","landslides"])
  assert.ok(page.includes('value="'+id+'"'),id);
 assert.match(ui,/id:'bnpb',path:'data\/sli-bnpb-provincial-2025\.json'/);
 assert.match(ui,/const hazard=bnpbProvince\(p\.name\)/);
 assert.match(ui,/renderBnpbProvince\(\);renderProvinceMap\(\)/);
 assert.match(ui,/Object\.hasOwn\(HAZARD_LABELS,metric\)/);
 assert.match(ui,/Number\.isInteger\(hazard\?\.floods\)\?hazard\.floods:null/);
 assert.match(ui,/bukan skor risiko/);
 assert.doesNotMatch(ui,/correlations\(datasets\.bnpb\)/);
});

test("Library lets users filter incident data and deep link into provincial dossier",()=>{
 for(const id of ["disasterProvince","disasterProvinceDossier","disasterIntegrityNotice"])
  assert.ok(lib.includes('id="'+id+'"'),id);
 assert.match(libJs,/new URLSearchParams\(window\.location\.search\)\.get\("province"\)/);
 assert.match(libJs,/encodeURIComponent\(province\)/);
 assert.match(libJs,/"\.\/provincial-intelligence\.html"/);
 assert.match(page,/BNPB 2025/);
 assert.match(lib,/Registri 20 indikator lingkungan lainnya/);
});
