import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const d=JSON.parse(read("data/sli-worldbank-ai-2025-digitized-figure-panels.json"));
test("Four original World Bank 4.x figure panels have exact PDF citations, method and unit",()=>{
 assert.equal(d.schema,"sli-worldbank-ai-foundations-2025-digitized-figure-panels-v1");
 assert.match(d.source.official_url,/documents1\.worldbank\.org/);
 assert.equal(d.source.independent_primary_study_validation,false);
 assert.equal(d.figures.length,5);
 assert.deepEqual(d.figures.slice(0,4).map(f=>f.figure_number+f.figure_panel),["4.2a","4.2b","4.3c","4.3d"]);
 assert.deepEqual(d.figures.slice(0,4).map(f=>f.pdf_page),[83,83,85,85]);
 for(const f of d.figures.slice(0,4)){
  assert.equal(f.unit,"%");
  assert.equal(f.geography.includes("not Indonesia-only"),true);
  assert.equal(f.values.every(v=>Number.isFinite(v.value)&&v.value>=0&&v.value<=100&&v.label_en&&v.label_id),true);
  assert.match(f.caution_en,/not|NOT|2022|2024/i);
  assert.ok(f.source_credit&&f.source_chart_basis);
 }
});
test("World Bank Figure 4.2 panels a and b distinguish startups and cumulative VC investment, rounding disclosed",()=>{
 const a=d.figures.find(x=>x.figure_panel==="a");
 const b=d.figures.find(x=>x.figure_panel==="b");
 assert.equal(a.period,"2024");
 assert.deepEqual(a.values.map(x=>x.value),[40,21,17,9,6,5,2,1]);
 assert.equal(a.values.reduce((n,x)=>n+x.value,0),101);
 assert.match(a.caution_en,/rounding/);
 assert.equal(b.period,"2014–2023");
 assert.deepEqual(b.values.map(x=>x.value),[56,17,15,6,3,2]);
 assert.equal(b.values.reduce((n,x)=>n+x.value,0),99);
 assert.match(b.caution_en,/rounding/);
});
test("World Bank Figure 4.3 panels c/d preserve 2024 open datasets and 2022 video languages",()=>{
 const a=d.figures.find(x=>x.figure_panel==="c");
 const b=d.figures.find(x=>x.figure_panel==="d");
 assert.equal(a.period,"2024");
 assert.equal(b.period,"2022");
 assert.deepEqual(a.values.map(x=>x.value),[56.3,30,5.1,3.4,2.8,2.4]);
 assert.deepEqual(b.values.map(x=>x.value),[51.6,21.4,7.6,6.7,5,4.5,3.2]);
 assert.ok(Math.abs(a.values.reduce((n,r)=>n+r.value,0)-100)<0.00001);
 assert.ok(Math.abs(b.values.reduce((n,r)=>n+r.value,0)-100)<0.00001);
 assert.equal(a.values.find(x=>x.label_en==="English").value,56.3);
 assert.equal(b.values.find(x=>x.label_en==="English").value,21.4);
});
test("World Bank charts are dynamically integrated into existing AI and Library views with source-specific numeric exports",()=>{
 const js=read("js/sli-digitized-ai-figures.js");
 assert.match(js,/WB_PATH/);
 assert.match(js,/Promise\.allSettled/);
 assert.match(js,/d\.figures\.push\(/);
 assert.match(js,/f\.source_url\|\|d\.source\.official_url/);
 assert.match(js,/f\.period\|\|f\.year/);
 assert.match(js,/kind:"verified-provider"/);
 assert.doesNotMatch(js,/innerHTML/);
 const audit=JSON.parse(read("data/sli-ai-figure-source-audit.json"));
 assert.equal(audit.already_digitized_numeric_source_figures,10);
 assert.equal(audit.reviewed_numeric_chart_panels,10);
 assert.equal(audit.distinct_digitized_figure_numbers,8);
 assert.equal(audit.text_figure_label_total,409);
 for(const page of ["ai-intelligence-hub.html","sli-sector-data-library.html"]){
  assert.match(read(page),/sli-digitized-ai-figures\.js/);
 }
});

test("World Bank original 2.2 has all 36 printed orbital satellites counts from PDF page 50",()=>{
 const f=d.figures.find(x=>x.figure_number==="2.2");
 assert.equal(f.pdf_page,50);
 assert.equal(f.chart_type,"multi-series-line");
 assert.equal(f.unit,"satellites");
 assert.equal(f.values.length,9);
 assert.equal(f.series.length,4);
 assert.deepEqual(f.values.map(r=>r.year),[2015,2016,2017,2018,2019,2020,2021,2022,2023]);
 assert.deepEqual(f.values.map(r=>r.LEO),[96,96,136,176,254,1093,2367,4222,4944]);
 assert.deepEqual(f.values.map(r=>r.GEO),[239,256,278,292,308,315,326,337,344]);
 assert.deepEqual(f.values.map(r=>r.MEO),[12,12,12,16,20,20,20,20,20]);
 assert.deepEqual(f.values.map(r=>r.Elliptical),[3,3,3,3,3,3,3,3,3]);
 assert.match(f.caution_en,/not 2026 active fleet/);
 const js=read("js/sli-digitized-ai-figures.js");
 assert.match(js,/function multiLine\(f\)/);
 assert.match(js,/f\.chart_type==="multi-series-line"/);
 assert.match(js,/f\.series\.map\(x=>r\[x.key\]\)/);
 assert.match(js,/kind:"verified-provider"/);
});
