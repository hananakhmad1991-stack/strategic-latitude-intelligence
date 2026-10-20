import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const d=JSON.parse(read("data/sli-stanford-2026-digitized-figures.json"));
const metrics=JSON.parse(read("data/sli-ai-stanford-worldbank-foundations-2025-2026.json"));
test("Five original Stanford figures have verifiable page, unit, status and source",()=>{
 assert.equal(d.figures.length,5);
 assert.match(d.source.official_url,/hai\.stanford\.edu/);
 assert.equal(d.source.independent_primary_study_validation,false);
 for(const f of d.figures){
  assert.ok([30,31,33,39].includes(f.pdf_page));
  assert.ok(f.source_credit&&f.figure_number&&f.caution_id&&f.statistical_status);
 }
 assert.equal(metrics.figure_catalog_status.verified_numeric_figure_series_count,9);
});
test("Figure 1.2.4 follows original printed quarterly power estimates, not electricity consumption",()=>{
 const f=d.figures.find(x=>x.figure_number==="1.2.4");
 assert.equal(f.values.length,16);
 assert.equal(f.values[0].period,"2022Q1");
 assert.equal(f.values[0].value_gw,0.15);
 assert.equal(f.values.at(-1).period,"2025Q4");
 assert.equal(f.values.at(-1).value_gw,29.56);
 assert.ok(f.values.every(x=>x.value_gw>0));
 assert.match(f.statistical_status,/modelled/);
 assert.match(f.caution_en,/not measured electricity/);
});
test("Figure 1.3.2 has precisely 15 printed facility counts, no Indonesian count invented",()=>{
 const f=d.figures.find(x=>x.figure_number==="1.3.2");
 assert.equal(f.values.length,15);
 assert.equal(f.values.find(x=>x.country==="United States").count,5427);
 assert.equal(f.values.find(x=>x.country==="Germany").count,529);
 assert.equal(f.values.find(x=>x.country==="China").count,449);
 assert.equal(f.values.some(x=>x.country==="Indonesia"),false);
 assert.equal(f.values.every(x=>Number.isInteger(x.count)&&x.count>0),true);
});
test("Digitized figures displayed in both AI topic and sector data library with accessible tables",()=>{
 for(const p of ["ai-intelligence-hub.html","sli-sector-data-library.html"]){
  const html=read(p);
  assert.match(html,/data-sli-ai-figures/);
  assert.match(html,/sli-digitized-ai-figures\.js/);
  assert.match(html,/sli-digitized-ai-figures\.css/);
 }
 const js=read("js/sli-digitized-ai-figures.js");
 assert.match(js,/createElementNS/);
 assert.match(js,/tabindex/);
 assert.match(js,/SLIVisualExport\.register\(svgNode/);
 assert.match(js,/sli:exportready/);
 assert.match(js,/kind:"verified-provider"/);
 assert.match(js,/sourceUrl:f.source_url\|\|d.source.official_url/);
 assert.match(js,/document\.createElement\("table"\)|el\("table"\)/);
 assert.doesNotMatch(js,/innerHTML|Math\.random/);
});

test("Source PDF figure-candidate audit does not claim unreviewed charts are numerical series",()=>{
 const d=JSON.parse(read("data/sli-ai-figure-source-audit.json"));
 assert.equal(d.publisher_reports.length,2);
 assert.equal(d.text_figure_label_total,409);
 assert.equal(d.publisher_reports[0].pdf_pages,425);
 assert.equal(d.publisher_reports[1].pdf_pages,136);
 assert.equal(d.already_digitized_numeric_source_figures,10);
 assert.equal(d.no_automatic_numeric_publication,true);
 assert.match(d.review_limits,/not unique verified chart series/);
 const script=read("js/sli-ai-figure-audit-status.js");
 assert.match(script,/Bukan /);
 assert.doesNotMatch(script,/innerHTML/);
 for(const p of ["ai-intelligence-hub.html","sli-sector-data-library.html"]){
  assert.match(read(p),/data-sli-ai-figure-audit/);
  assert.match(read(p),/sli-ai-figure-audit-status.js/);
 }
});

test("Three newly checked Stanford label-only figure series preserve units, PDF pages and modelled caveats",()=>{
 const accelerator=d.figures.find(x=>x.figure_number==="1.2.2");
 assert.equal(accelerator.pdf_page,30);
 assert.equal(accelerator.values.length,8);
 assert.equal(accelerator.values.find(x=>x.label_en==="A100").value,84);
 assert.match(accelerator.caution_en,/Cumulative/);
 const energy=d.figures.find(x=>x.figure_number==="1.4.7");
 assert.equal(energy.pdf_page,39);
 assert.equal(energy.unit,"Wh");
 assert.deepEqual(energy.values.map(x=>x.value),[0.30,0.42,1.21,1.79,3.37,9.71,10.00]);
 assert.match(energy.caution_en,/not observed Indonesian/);
 const water=d.figures.find(x=>x.figure_number==="1.4.8");
 assert.equal(water.unit,"kL");
 assert.equal(water.pdf_page,39);
 assert.deepEqual(water.values.map(x=>x.value),[1,2500,1250000,1314000,1334991,1579680]);
 assert.match(water.caution_en,/not additive/);
 const js=read("js/sli-digitized-ai-figures.js");
 assert.match(js,/function barDatum/);
 assert.match(js,/r.count===undefined\?r.value:r.count/);
});
