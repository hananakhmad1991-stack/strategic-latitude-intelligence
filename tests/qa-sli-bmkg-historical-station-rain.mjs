import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const data=JSON.parse(read("data/sli-bmkg-cengkareng-historical-rainfall.json"));
test("Original BMKG station 46 daily rainfall aggregates contain quality and missingness safeguards",()=>{
 assert.equal(data.schema,"sli-bmkg-saca-historical-station-rainfall-v1");
 assert.equal(data.station.id,46);
 assert.equal(data.original_station_file,"RR_STAID000046.txt");
 assert.equal(data.last_actual_quality_valid_observation_date,"2020-03-30");
 assert.equal(data.archive_nominal_last_date,"2022-11-30");
 assert.equal(data.quality_flag_valid,"0");
 assert.equal(data.quality_flag_suspect,"1");
 assert.equal(data.source_missing_code,-9999);
 assert.equal(data.annual_observations.length,15);
 assert.deepEqual(data.annual_observations.map(x=>x.year),Array.from({length:15},(_,i)=>2000+i));
 for(const row of data.annual_observations){
  assert.ok(Number.isFinite(row.source_observed_rainfall_mm)&&row.source_observed_rainfall_mm>=0);
  assert.equal(row.calendar_days-row.valid_observation_days,row.missing_or_suspect_days);
  assert.equal(row.complete_year,row.missing_or_suspect_days===0);
  assert.ok(row.valid_observation_days>=350);
 }
 assert.equal(data.annual_observations.filter(x=>x.complete_year).length,4);
 assert.equal(data.annual_observations.find(x=>x.year===2000).source_observed_rainfall_mm,1364.6);
 assert.equal(data.annual_observations.find(x=>x.year===2004).source_observed_rainfall_mm,1589.3);
 assert.equal(data.annual_observations.find(x=>x.year===2010).source_observed_rainfall_mm,2280.5);
 assert.match(data.source_limits,/Q=1 suspect numerical values excluded/);
});
test("BMKG station history stays inside climate module and existing data library; CE-003 anomaly still null",()=>{
 for(const p of ["climate-environment.html","sli-sector-data-library.html"]){
  const html=read(p);
  assert.match(html,/data-sli-bmkg-rainfall-history/);
  assert.match(html,/sli-bmkg-historical-rainfall\.js/);
  assert.match(html,/sli-bmkg-historical-rainfall\.css/);
 }
 const d=JSON.parse(read("data/sli-climate-environment.json"));
 const anomaly=d.indicators.find(x=>x.id==="CE-003");
 assert.equal(anomaly.observed_value,null);
 assert.equal(anomaly.related_historical_station_rainfall,"data/sli-bmkg-cengkareng-historical-rainfall.json");
 assert.match(anomaly.original_drought_anomaly_value_status,/unavailable/);
 const ui=read("js/sli-bmkg-historical-rainfall.js");
 assert.match(ui,/source_observed_rainfall_mm/);
 assert.match(ui,/window\.SLIVisualExport\.register/);
 assert.match(ui,/missing_or_suspect_days/);
 assert.doesNotMatch(ui,/innerHTML/);
});
