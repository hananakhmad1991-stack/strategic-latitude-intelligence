import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const read=p=>fs.readFileSync(p,"utf8");
const doc=JSON.parse(read("data/skkmigas-annual-2025.json"));
const catalog=JSON.parse(read("data/skkmigas-2025-figure-catalog.json"));
const html=read("index.html"),script=read("js/skkmigas-annual-2025.js"),style=read("css/skkmigas-annual-2025.css");
assert.equal(doc.id,"sli-skkmigas-annual-2025");
assert.equal(doc.files.pages,202);
assert.equal(doc.edition,"Annual Report 2025 (English)");
assert.ok(doc.scope_note.includes("SAME"));
assert.equal(doc.metrics.length,30);
assert.equal(doc.series.length,27);
assert.equal(doc.gas_allocation.length,10);
assert.equal(doc.onstream_2025.length,16);
assert.equal(new Set(doc.onstream_2025.map(x=>x.name)).size,16);
for(const p of doc.onstream_2025){
 assert.ok(p.name&&p.operator&&p.pdf_page>=67&&p.pdf_page<=86);
 assert.equal(p.coordinates,null,"Do not invent raw GIS coordinates for printed site text");
 assert.equal(p.verified_2026_status,null,"2025 onstream DOES NOT verify 2026 operating status");
}
assert.equal(doc.onstream_source_aggregate.projects_reported,16);
assert.equal(doc.onstream_source_aggregate.capex_usd_million,704.6);
const metrics=new Map(doc.metrics.map(x=>[x.id,x]));
function metric(id,value,unit){const m=metrics.get(id);assert.ok(m,id);assert.equal(m.value,value,id);assert.equal(m.unit,unit,id)}
metric("oil_lifting",606.2,"thousand BOPD");
metric("gas_lifting",5425,"MMSCFD");
metric("oil_prod_2025",606.1,"thousand BOPD");
metric("gas_prod_2025",6753,"MMSCFD");
metric("invest_2025",14.91,"USD billion");
metric("state_rev_2025",10.96,"USD billion");
metric("cost_2025",8.44,"USD billion");
metric("gross_rev_2025",29.18,"USD billion");
metric("domestic_gas",3882.93,"BBTUD");
metric("export_gas",1718.27,"BBTUD");
metric("reserves_oil",3.07,"billion barrels");
metric("reserves_gas",45.76,"TCF");
for(const id of ["oil_lifting","gas_lifting","development_wells","workover","well_service"]){
 const m=metrics.get(id);assert.ok(m.target?.value>0,id+" must have plan and 2025 actual separated");
}
for(const m of doc.metrics){
 assert.ok(m.category&&m.unit&&m.pdf_page>=14&&m.pdf_page<=198,"Invalid sourced KPI "+m.id);
 assert.ok(!isNaN(m.value)&&m.value>=0,"Invalid KPI value "+m.id);
}
const time=new Map(doc.series.map(x=>[x.id,x]));
assert.equal(time.size,27);
assert.deepEqual(time.get("oil_gas_investment").values,[12.06,10.52,11.01,12.10,13.27,14.43,14.91]);
assert.deepEqual(time.get("state_share").values,[14.32,8.74,13.89,18.01,14.09,12.76,10.96]);
assert.deepEqual(time.get("lng_export").years,[2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025]);
assert.equal(time.get("lng_domestic").values.at(-1),276.06);
assert.equal(time.get("lpg_total").values.at(-1),680181);
assert.equal(time.get("oil_production").values.at(-1),606.1);
assert.equal(time.get("gas_production").values.at(-1),6753);
assert.equal(time.get("domestic_gas").values.at(-1),3882.93);
assert.equal(time.get("export_gas").values.at(-1),1718.27);
assert.equal(time.get("lpg_jadestone").values[0],null,"Dash is not a source-reported zero");
assert.equal(time.get("lpg_bontang").values[1],null,"Dash is not a source-reported zero");
for(const s of doc.series){
 assert.equal(s.years.length,s.values.length,"Time index mismatch "+s.id);
 assert.ok(s.years.every((y,i)=>i===0||y-s.years[i-1]===1),"Continuous dates "+s.id);
 assert.ok(s.values.every(v=>v===null||typeof v==="number"&&Number.isFinite(v)),"invalid numeric series "+s.id);
 assert.ok(s.source_pdf_page>=25&&s.source_pdf_page<=198,"invalid source page "+s.id);
}
assert.ok(Math.abs(doc.gas_allocation.reduce((a,b)=>a+b.value,0)-5601.20)<0.011);
assert.ok(Math.abs(doc.gas_allocation.filter(x=>x.scope==="Domestic").reduce((a,b)=>a+b.value,0)-3882.93)<.021,"Domestic allocation must match published rounded 3,882.93 BBTUD");
const digitized=JSON.parse(read("data/skkmigas-2025-digitized-exhibits.json"));
const pod=JSON.parse(read("data/skkmigas-2025-pod-approvals.json"));
assert.equal(digitized.series.length,24);
assert.equal(digitized.categories.length,17);
assert.equal(digitized.source_sha256,"48994ab291337f3089945e89f5ddbc6716b009e17defcb55b36628b83b21c301");
assert.equal(digitized.series.reduce((a,x)=>a+x.values.length,0),185);
for(const x of digitized.series){
 assert.ok(x.source_pdf_page>=38&&x.source_pdf_page<=188,"Unreferenced SKK graph "+x.id);
 assert.equal(x.values.length,x.years.length,"Misaligned source years "+x.id);
 assert.ok(x.values.every(v=>v===null||Number.isFinite(v)));
}
const find=id=>digitized.series.find(x=>x.id===id);
assert.equal(find("rrr_2013").values[6],354);
assert.equal(find("civd_registered").values.at(-1),30096);
assert.equal(find("civd_spda").values.at(-1),39918);
assert.equal(find("development_actual").values.at(-1),940);
assert.equal(find("workover_actual_annual").values.at(-1),1008);
assert.equal(find("wellservice_actual").values.at(-1),42002);
assert.equal(find("pse_count").values.at(-1),24);
assert.equal(find("ca_total").values.at(-1),165);
const lpo=digitized.categories.find(x=>x.id==="oil_lpo_equipment");
assert.equal(lpo.records.find(x=>x.name==="Pipeline").value,3545);
const equipmentGas=digitized.categories.find(x=>x.id==="gas_lpo_equipment");
assert.equal(equipmentGas.records.find(x=>x.name==="Heat exchanger").value,70.6);
const govt=digitized.categories.find(x=>x.id==="state_assets_2025");
assert.equal(govt.records.reduce((a,x)=>a+x.value,0),743497553962874);
const contractGas=digitized.categories.find(x=>x.id==="gas_contract_vs_actual");
assert.equal(contractGas.records.length,10);
assert.equal(contractGas.records.find(x=>x.name==="Industry").realization,1403.44);
assert.equal(contractGas.records.find(x=>x.name==="Industry").plan,1636.2);
const receivers=digitized.categories.find(x=>x.id==="lng_domestic_receivers");
assert.equal(receivers.records.length,8);
assert.equal(receivers.records.reduce((s,x)=>s+x.value,0).toFixed(2),"84.61");
assert.equal(receivers.records.find(x=>x.name==="Nusantara Regas").tangguh_cargo,37.47);
assert.equal(digitized.categories.find(x=>x.id==="facility_disruption_frequency").records.find(x=>x.name==="Electrical").value,196);
assert.equal(digitized.categories.find(x=>x.id==="oil_lpo_other_2025").records.length,12);
assert.equal(digitized.categories.find(x=>x.id==="gas_lpo_other_2025").records.find(x=>x.name==="Jun").value,22);
const natuna=digitized.categories.find(x=>x.id==="natuna_gsai_monthly");
assert.equal(natuna.records.length,12);
assert.equal(natuna.records.find(x=>x.name==="Jul").value,167);
const swap=digitized.categories.find(x=>x.id==="natuna_dsa_monthly");
assert.equal(swap.records[0].value,null,"Original Jan DSA unreported, not zero");
assert.equal(swap.records.at(-1).value,23);
const natunaTotal=digitized.categories.find(x=>x.id==="natuna_combined_monthly");
assert.equal(natunaTotal.records.at(-1).value,195);
const lng2=digitized.categories.find(x=>x.id==="lng_bontang_tangguh_2024_2025");
assert.equal(lng2.records.find(x=>x.name==="Tangguh 2025").value,582.12);


assert.equal(pod.records.length,45);
assert.equal(pod.records.reduce((a,x)=>a+x.estimated_combined_mmboe,0).toFixed(2),"643.42");
assert.equal(pod.listed_table_sum_mmboe,643.42);
assert.equal(pod.reported_narrative_reserve_addition_mmboe,655.73);
assert.equal(pod.unreconciled_difference_mmboe,12.31);
assert.equal(pod.records[9].field,pod.records[24].field,"Source duplicates 10 and 25 must remain flagged");
for(const r of pod.records){assert.match(r.approval_date,/^2025-\d\d-\d\d$/);assert.ok(r.operator&&r.field);assert.ok(r.source_pdf_page===52||r.source_pdf_page===53)}
assert.equal(catalog.entries.length,101);
assert.equal(catalog.digitization_review.numerically_verified,31);
assert.equal(catalog.digitization_review.source_only,50);
assert.equal(catalog.digitization_review.structured_source_tables,5);
assert.equal(catalog.digitization_review.partially_digitized,1);
const exploration=JSON.parse(read("data/skkmigas-2025-exploration-registers.json"));
assert.equal(exploration.pse_structures.length,24);
assert.equal(exploration.discovery_well_identifiers.length,15);
assert.equal(exploration.reported_successful_completed_wells,14);
assert.ok(exploration.discovery_well_identifiers.every(x=>x.coordinates===null),"No fabricated 2025 exploration well GPS");
assert.equal(exploration.pse_structures[13].structure,exploration.pse_structures[14].structure,"PSE duplicate retained as original");
assert.equal(catalog.report_pages,202);
assert.equal(new Set(catalog.entries.map(x=>x.kind+x.number+x.pdf_page)).size,101);
assert.equal(catalog.entries.filter(x=>x.kind==="map").length,5);
for(const x of catalog.entries){assert.ok(x.title&&x.number&&x.pdf_page>=14&&x.pdf_page<=198);assert.ok(["source-catalog-only","normalized-or-kpi","digitized_verified","structured_table_verified","partially_digitized"].includes(x.status))}
assert.ok(html.includes('id="skkMigas2025EnergyRoot"'));
assert.ok(html.includes('id="skkMigas2025InvestmentRoot"'));
assert.ok(html.includes("initSLISKKAnnual2025?.('skkMigas2025EnergyRoot','energy')"));
assert.ok(html.includes("initSLISKKAnnual2025('skkMigas2025InvestmentRoot','investment')"));
assert.match(html,/js\/skkmigas-annual-2025\.js\?v=/);
assert.match(html,/js\/skkmigas-2025-extension\.js\?v=/);
assert.ok(html.indexOf('js/skkmigas-2025-extension.js')<html.indexOf('js/skkmigas-annual-2025.js'),'Extra module should be preloaded');
assert.match(script,/initSLISKKExtra2025\?\.\(panel,extra\)/);
assert.match(html,/css\/skkmigas-annual-2025\.css\?v=/);
assert.ok(script.includes('renderGas(block,d)')||script.includes('renderGas(panel,d)'));
assert.match(script,/renderProjectDossiers\(panel,d\)/);
assert.match(script,/renderCatalog\(panel,d,c\)/);
assert.match(script,/renderDigitizedExhibits\(panel,exhibits\)/);
assert.match(script,/renderPOD2025\(panel,pod\)/);
assert.match(script,/renderExplorationRegisters\(panel,exregister\)/);
assert.match(script,/annual report supplies printed work-area maps/i);
assert.ok(style.includes(".sm25-report"));
const ctx={window:{},document:{},console};vm.runInNewContext(script,ctx,{filename:"skkmigas-annual-2025.js"});
assert.equal(typeof ctx.window.initSLISKKAnnual2025,"function");
console.log("PASS: SKK Migas 2025 202-page bilingual report, 30 non-additive KPIs, 27 original historical series, 10-sector BBTUD Sankey, 16 onstream project dossiers, 24 extra numeric series, 45 approved POD rows, 101 indexed figures and Oil & Gas + Investment mounts.");
