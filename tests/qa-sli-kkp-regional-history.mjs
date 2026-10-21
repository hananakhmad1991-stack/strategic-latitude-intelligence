import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateKKPHistory,rowsForYear,provinceHistory} from "../js/sli-marine-regional-history.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const data=JSON.parse(read("data/sli-kkp-regional-historical-2019-2024.json"));
const base=JSON.parse(read("data/sli-kkp-portal-screened-2024.json"));
test("Official KKP historical province observations reconcile all 12 national annual totals",()=>{
 const p=validateKKPHistory(data,base);
 assert.equal(p.pass,true,JSON.stringify(p.issues));assert.equal(p.observations,354);
 const f=data.series.find(x=>x.id==="marine_fishers"),w=data.series.find(x=>x.id==="seaweed");
 assert.deepEqual(f.year_coverage.map(x=>x.reported_provinces),[34,34,34,34,34,37]);
 assert.deepEqual(w.year_coverage.map(x=>x.reported_provinces),[26,24,24,23,24,26]);
 assert.deepEqual(f.year_coverage.map(x=>x.rounding_gap),[0,0,0,0,0,0]);
 assert.ok(w.year_coverage.every(x=>Math.abs(x.rounding_gap)<=.03));
 assert.equal(rowsForYear(f,2024).length,37);
 assert.equal(rowsForYear(w,2024).length,26);
 assert.equal(rowsForYear(w,2023).length,24);
 assert.equal(rowsForYear(w,2021)[0].province,"Sulawesi Selatan");
});
test("Source-era provincial splits and blanks must not be backcast or turned into zero",()=>{
 const f=data.series.find(x=>x.id==="marine_fishers"),w=data.series.find(x=>x.id==="seaweed");
 assert.equal(provinceHistory(f,"Papua Barat Daya").find(x=>x.year===2023).value,null);
 assert.equal(provinceHistory(f,"Papua Barat Daya").find(x=>x.year===2024).value,12075);
 assert.equal(provinceHistory(w,"Aceh").every(x=>x.value===null),true);
 assert.equal(provinceHistory(w,"Bengkulu")[0].value,60);
 assert.equal(provinceHistory(w,"Bengkulu")[1].value,null);
 assert.equal(rowsForYear(w,2024).some(x=>x.province==="Aceh"),false);
 assert.ok(data.methodology.maps.includes("NOT an official BIG"));
 const mutated=structuredClone(data);mutated.series[0].rows[0].values[3]=0;
 assert.equal(validateKKPHistory(mutated,base).pass,false);
 const modified=structuredClone(data);modified.series[1].rows[1].values[5]=null;
 assert.equal(validateKKPHistory(modified,base).pass,false);
});
test("Marine 2019–2024 atlas has interactive year, metric, map, trend, cited CSV and explicit geometry rights",()=>{
 const html=read("marine-fisheries-intelligence.html"),js=read("js/sli-marine-regional-history.mjs");
 for(const id of ["mfHistoryMap","mfHistoryMetric","mfHistoryYear","mfHistoryReset","mfHistoryCSV","mfHistoryRows","mfHistoryTrend","mfHistorySummary","mfHistorySelected","mfHistorySource"])
  assert.equal(html.split('id="'+id+'"').length-1,1,id);
 assert.match(html,/js\/sli-province-map.js/);
 assert.match(html,/js\/sli-marine-regional-history.mjs/);
 assert.match(html,/geometri WPP/);
 assert.match(html,/bukan batas wilayah resmi BIG/);
 assert.match(js,/sliLocalOnly:true/);
 assert.match(js,/SLIProvinceMap.render/);
 assert.match(js,/onSelect:onChoose/);
 assert.equal(data.series.every(x=>x.source_url.startsWith("https://portaldata.kkp.go.id/")),true);
});
