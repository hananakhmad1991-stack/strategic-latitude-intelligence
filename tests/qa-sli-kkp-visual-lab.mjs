import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateMarineVisualInputs,indexSeries,districtFlows,layoutDistrictSankey,yearMatrix,historicalHeatCells} from "../js/sli-kkp-visual-lab.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const prov=JSON.parse(read("data/sli-kkp-hatchery-province-cards-2024.json"));
const detail=JSON.parse(read("data/sli-kkp-portal-screened-2024.json"));
const hist=JSON.parse(read("data/sli-kkp-regional-historical-2019-2024.json"));
test("Source-certified 33-province choropleth and 10-row KKP flow gate fails closed on unsupported data",()=>{
 const status=validateMarineVisualInputs(prov,detail,hist);assert.equal(status.pass,true,JSON.stringify(status.problems));
 const d=structuredClone(prov);d.rows[0].volume_ribu_ekor=0;
 assert.equal(validateMarineVisualInputs(d,detail,hist).pass,false);
 const bad=structuredClone(detail);bad.seed_district_top_rows.selected_count=1387;
 assert.equal(validateMarineVisualInputs(prov,bad,hist).pass,false);
});
test("Actual 10 KKP district/commodity observations alone constitute Sankey nodes/links",()=>{
 const flows=districtFlows(detail),layout=layoutDistrictSankey(detail);
 assert.equal(flows.records.length,10);assert.equal(layout.paths.length,20);
 assert.equal(layout.nodes.length,3);
 assert.equal(layout.nodes[0].length,new Set(flows.records.map(x=>x.province)).size);
 assert.equal(layout.nodes[1].length,new Set(flows.records.map(x=>x.province+" / "+x.district)).size);
 assert.equal(layout.nodes[2].length,new Set(flows.records.map(x=>x.species)).size);
 assert.equal(layout.total,flows.total);
 assert.ok(Math.abs(flows.records.reduce((s,x)=>s+x.share_of_displayed_subset,0)-1)<1e-12);
 for(let c=0;c<3;c++){
  const sum=layout.nodes[c].reduce((s,x)=>s+x.total,0);
  assert.equal(sum,layout.total);
  assert.ok(layout.nodes[c].every(n=>n.height>0&&n.y+n.height<=layout.H+0.5));
  assert.ok(layout.nodes[c].every(n=>Math.abs(n.inOffset-(c===0?0:n.height))<1e-6));
  assert.ok(layout.nodes[c].every(n=>Math.abs(n.outOffset-(c===2?0:n.height))<1e-6));
 }
});
test("National trend indices share a baseline but DO NOT aggregate incommensurable units",()=>{
 const idx=indexSeries(hist);
 assert.equal(idx.length,2);
 assert.deepEqual(idx.map(x=>x.values[0]),[100,100]);
 assert.ok(idx.every(x=>x.values.every(y=>Number.isFinite(y))));
 assert.equal(idx[0].unit,"2019=100");
 const map=yearMatrix(hist.series.find(x=>x.id==="seaweed"));
 assert.equal(map.find(x=>x.province==="Aceh").years.every(y=>y.value===null),true);
 assert.equal(map.find(x=>x.province==="Papua").years.length,6);
});
test("KKP visual lab page provides browser controls, source disclosures and responsive vector views",()=>{
 const html=read("marine-fisheries-intelligence.html");
 const js=read("js/sli-kkp-visual-lab.mjs");
 for(const id of ["marine-visual-lab","mfVizHatcheryMap","mfVizHatcheryCoverage","mfVizNationalIndex","mfVizHatcherySankey","mfVizSankeySelected","mfVizSankeySummary"]){
  assert.equal(html.split('id="'+id+'"').length-1,1,id);
 }
 assert.match(html,/bukan BIG/);
 assert.match(html,/10 baris sumber/);
 assert.match(html,/1\.387 baris/);
 assert.match(js,/sliLocalOnly:true/);
 assert.match(js,/SLIProvinceMap.render/);
 assert.match(js,/source_rows_displayed/);
});

test("Six-year province heatmap preserves true missing cells and only computes YoY with valid adjacent denominators",()=>{
 const weed=hist.series.find(s=>s.id==="seaweed");
 const vals=historicalHeatCells(weed,"value");
 const yoys=historicalHeatCells(weed,"yoy");
 assert.equal(vals.find(x=>x.province==="Aceh").cells.every(x=>x.value===null),true);
 assert.equal(yoys.find(x=>x.province==="Aceh").cells.every(x=>x.value===null),true);
 assert.equal(yoys.every(r=>r.cells[0].value===null),true);
 assert.equal(vals.find(x=>x.province==="Sulawesi Selatan").cells[0].value,3405848.35);
 assert.equal(yoys.find(x=>x.province==="Sulawesi Selatan").cells[1].value!==null,true);
 assert.equal(yoys.find(x=>x.province==="Bengkulu").cells[1].value,null);
 assert.throws(()=>historicalHeatCells(weed,"unsupported"));
 const html=read("marine-fisheries-intelligence.html");
 for(const id of ["mfVizHeatSeries","mfVizHeatMode","mfVizHeatSearch","mfVizHeatGrid","mfVizHeatCSV","mfVizHeatStatus","mfVizHeatSource"])
 assert.equal(html.split('id="'+id+'"').length-1,1,id);
});
