/* PLN outage source audit: NEVER turn a multi-province UID observation into an invented province statistic. */
import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const db=JSON.parse(read("data/pln-saidi-saifi-2023-2025.json"));
test("Official source granularity and all history years are preserved",()=>{
 assert.equal(db.records.length,23);
 assert.equal(db.provinces.length,38);
 assert.equal(new Set(db.provinces.map(p=>p.name)).size,38);
 assert.deepEqual(Object.keys(db.national),["2023","2024","2025"]);
 for(const y of ["2023","2024","2025"]){
  assert.match(db.sources[y],/^https:\/\/web\.pln\.co\.id\/statics\/uploads\/\d{4}\/\d{2}\/.+\.pdf$/);
  assert.ok(db.national[y].saidi>0&&db.national[y].saifi>0);
  for(const u of db.records){
   assert.ok(Number.isFinite(u.values[y].saidi)&&u.values[y].saidi>=0,u.unit+" SAIDI "+y);
   assert.ok(Number.isFinite(u.values[y].saifi)&&u.values[y].saifi>=0,u.unit+" SAIFI "+y);
  }
 }
});
test("Cross-year records preserve official reported national and selected unit figures",()=>{
 assert.deepEqual(db.national,{"2023":{saidi:5.64,saifi:4.27},"2024":{saidi:5.34,saifi:3.23},"2025":{saidi:8.48,saifi:3.23}});
 const units=new Map(db.records.map(u=>[u.id,u]));
 assert.deepEqual(units.get("aceh").values["2025"],{saidi:212.47,saifi:9.46});
 assert.deepEqual(units.get("jabar").values["2025"],{saidi:3.9,saifi:3.3});
 assert.deepEqual(units.get("batam").values["2024"],{saidi:2.17,saifi:2.45});
 assert.deepEqual(units.get("lampung").values["2024"],{saidi:27.75,saifi:6.33});
 assert.deepEqual(units.get("jakarta").values["2023"],{saidi:0.5,saifi:0.71});
});
test("38-province locator does not invent standalone shared-UID observations",()=>{
 const units=new Map(db.records.map(u=>[u.id,u]));
 const pro=new Map(db.provinces.map(p=>[p.name,p]));
 for(const p of db.provinces)for(const id of p.reporting_unit_ids)assert.ok(units.has(id),"Missing unit "+id);
 assert.deepEqual(pro.get("Kepulauan Riau").reporting_unit_ids,["riau_kepri","batam"]);
 assert.equal(pro.get("Kepulauan Riau").granularity,"multiple_overlapping_pln_service_units");
 assert.equal(pro.get("Jambi").granularity,"multi_province_unit_proxy");
 assert.deepEqual(pro.get("Jambi").reporting_unit_ids,["sumsel_jambi_bengkulu"]);
 for(const p of ["Papua Selatan","Papua Tengah","Papua Pegunungan","Papua Barat Daya"]){
  assert.deepEqual(pro.get(p).reporting_unit_ids,[]);
  assert.equal(pro.get(p).granularity,"province_data_not_separately_available");
 }
 const group=units.get("sumsel_jambi_bengkulu");
 assert.equal(group.provinces.length,3);
 assert.equal(group.scope,"multi_province_pln_unit");
 assert.ok(db.quality_notes.some(t=>t.includes("must NOT be copied")));
});
test("Three SLI destinations use the same canonical dataset & consistent explorer module",()=>{
 const s=read("js/pln-saidi-saifi.js");
 assert.doesNotThrow(()=>new Script(s));
 assert.match(s,/window\.SLIVisualExport/);
 assert.match(s,/\.register\(bars,/);
 assert.match(s,/\.register\(svg,/);
 assert.match(s,/data-sli-reliability-root/);
 assert.match(s,/dataset\.loaded/);
 for(const [path,id] of [["index.html","energyReliabilityRoot"],["pln-electricity-statistics.html","plnReliabilityRoot"],["provincial-intelligence.html","provincialReliabilityRoot"]]){
  const html=read(path);
  assert.ok(html.includes(id),path+" mount");
  assert.ok(html.includes("pln-saidi-saifi.js"),path+" script");
  assert.ok(html.includes("pln-saidi-saifi.css"),path+" styles");
 }
 assert.match(read("index.html"),/initSLIReliability/);
 assert.ok(read("css/pln-saidi-saifi.css").includes(".rel-inspector"));
});
