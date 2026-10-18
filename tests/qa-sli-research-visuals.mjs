import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {classifyResearchSector,requestedProvinces,selectResearchEvidence,modelRequest} from "../research-api/src/assistant-core.mjs";
import {buildResearchCharts} from "../research-api/src/chart-data.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const preview=JSON.parse(read("data/sli-research-evidence-preview.json"));
const provinces=JSON.parse(read("data/sli-research-province-preview.json"));
const docs=preview.documents.map(d=>({
 id:d.id,title:d.title,text:d.text_en||d.text,source_url:d.source_url,
 source_date:d.source_date,period:d.period,publisher:d.publisher,topic:d.topic,geo:d.geo,access:"pro",
 chart_project:/^(project-|aiproject-)/.test(d.id)?{id:d.id.replace(/^project-/,""),stage:((d.text_en||d.text).match(/Reported stage:\s*([^.]+)(?:\.|$)/i)||[])[1]||""}:null
}));
test("Specific minerals research excludes fossil gas, crude benchmarks and PSEL",()=>{
 const candidates=[...docs,{id:"p-sampah",title:"PSEL Bogor waste-to-energy",text:"investment renewable energy",topic:"Energy project investment",geo:"Jawa Barat",source_url:"https://example.org",access:"pro"}];
 const q="Susun Risk & Opportunity Assessment mineral kritis nikel tembaga hilirisasi smelter baterai, termasuk risiko energi ESG dan geopolitik";
 const result=selectResearchEvidence(candidates,q,[],"pro",10);
 assert.equal(classifyResearchSector(q).primary,"minerals");
 assert.ok(result.length>=2);
 assert.ok(result.every(x=>x.topic==="minerals"));
 assert.ok(!result.some(x=>/brent|henry|psel/i.test(x.title)));
});
test("Strict geographic detection handles adjacent provinces and deliberate AI cross-sector requests",()=>{
 assert.deepEqual(requestedProvinces("Bandingkan Jawa Tengah Jawa Barat"),["Jawa Tengah","Jawa Barat"]);
 const intent=classifyResearchSector("Bandingkan Jawa Tengah Jawa Barat PDRB PMTB Gini dan data center AI");
 assert.equal(intent.primary,"regional");
 assert.ok(intent.secondary.includes("ai"));
});
test("Cited province graphs use identical units and measurement period",()=>{
 const names=["Jawa Tengah","Jawa Barat"];
 const subset=provinces.provinces.filter(p=>names.includes(p.name));
 assert.equal(subset.length,2);
 const records=subset.map(p=>({
  id:"province_gini_"+p.name_en.replace(/\s+/g,"_"),title:p.name+" regional Gini",
  topic:"regional inequality gini",text:"Expenditure Gini for "+p.name,geo:p.name_en,
  period:"2026-03",source_date:"2026-08-05",source_url:provinces.sources.gini.url,access:"pro",
  chart_measures:[{series:"gini_expenditure",label:"Expenditure Gini",category:p.name,value:p.gini_expenditure_2026_03,unit:"coefficient 0-1",period:"2026-03"}]
 }));
 const selected=selectResearchEvidence(records,"Bandingkan Jawa Tengah Jawa Barat Gini",[],"pro",10);
 const graphs=buildResearchCharts(selected,"id");
 assert.equal(selected.length,2);
 assert.equal(graphs.length,1);
 assert.equal(graphs[0].points.length,2);
 assert.equal(graphs[0].period,"2026-03");
 assert.deepEqual(graphs[0].points.map(p=>p.source),[1,2]);
});
test("Project charts deduplicate evidence; empty or incompatible data never becomes a chart",()=>{
 const mineral=selectResearchEvidence(docs,"risiko smelter mineral kritis nikel tembaga baterai Indonesia",[],"pro",10);
 const charts=buildResearchCharts(mineral);
 assert.ok(charts.length>=1);
 assert.match(charts[0].title,/Tahapan proyek/);
 assert.equal(charts[0].points.reduce((n,p)=>n+p.value,0),new Set(mineral.filter(x=>x.chart_project?.stage).map(x=>x.chart_project.id)).size);
 const mixed=[
  {chart_measures:[{series:"crude",label:"Crude",category:"Brent",value:100,unit:"USD/bbl",period:"2026-10-14"}]},
  {chart_measures:[{series:"crude",label:"Crude",category:"WTI",value:99,unit:"USD/MMBtu",period:"2026-10-15"}]}
 ];
 assert.deepEqual(buildResearchCharts(mixed),[]);
 assert.deepEqual(buildResearchCharts([]),[]);
});
test("Report instructions require strategic recommendation pointers and client renders source-linked visuals safely",()=>{
 const q={question:"Bandingkan dua proyek nikel Indonesia berdasarkan bukti",mode:"risk_opportunity",language:"id",history:[]};
 const request=modelRequest(q,docs.slice(0,2),"gpt-5.4-mini");
 assert.match(request.instructions,/Kesimpulan dan Rekomendasi Strategis/);
 assert.match(request.instructions,/actionable numbered pointers/);
 const client=read("js/sli-research-assistant.js"),visuals=read("js/sli-research-visuals.js"),page=read("sli-research-ai.html");
 assert.match(client,/renderCharts/);
 assert.match(page,/sli-research-visuals\.js/);
 assert.match(visuals,/source_refs/);
 assert.match(visuals,/renderMarkdown/);
 assert.ok(!visuals.includes(".innerHTML"));
 assert.ok(!/sk-[A-Za-z0-9_-]{20,}/.test(visuals+client));
});
