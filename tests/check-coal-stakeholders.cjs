/* Coal institutional map QA — official production vs GDP vs whole-Minerba PNBP,
   BUMN/BUMS boundary, 6 source-dated actor groups and accessible interactive filters. */
"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict");
const d=JSON.parse(fs.readFileSync("data/energy-coal-stakeholders.json","utf8"));
const script=fs.readFileSync("js/energy-coal-stakeholders.js","utf8");
const css=fs.readFileSync("css/energy-coal-stakeholders.css","utf8");
const page=fs.readFileSync("index.html","utf8");
new Function(script);
assert(d.as_of==="2026-10-15","Unreviewed research snapshot date");
assert(d.groups.length===6&&d.items.length>=40,"Incomplete coal stakeholder mapping");
assert.equal(new Set(d.groups.map(g=>g.id)).size,6,"Duplicate group");
assert.equal(new Set(d.items.map(i=>i.name)).size,d.items.length,"Duplicate coal actors");
assert(d.items.every(x=>d.groups.some(g=>g.id===x.group)),"Unknown actor category");
assert(d.items.every(x=>x.name&&x.id_name&&x.lead&&x.summary_en&&x.summary_id&&x.role&&/^https:\/\//.test(x.source)&&/^\d{4}-\d{2}-\d{2}$/.test(x.as_of)),"Missing dated bilingual or sourced profile");
for(const g of ["authority","licensing","state","private","market","oversight"]){
 assert(d.items.some(i=>i.group===g),"Coal decision chain missing: "+g);
}
for(const name of ["Directorate General of Minerals & Coal","MIND ID — Indonesian mining SOE holding","PT Bukit Asam Tbk (PTBA)",
 "PT PLN Energi Primer Indonesia (PLN EPI)","PT Adaro Andalan Indonesia Tbk","PT Bumi Resources Tbk",
 "PT Kaltim Prima Coal (KPC)","PT Arutmin Indonesia","PT Bayan Resources Tbk",
 "PT Indo Tambangraya Megah Tbk (ITM)","PT Kideco Jaya Agung","BPS — coal & lignite GDP statistics"]){
 assert(d.items.some(x=>x.name===name),"Missing critical coal actor: "+name);
}
assert(d.items.find(x=>x.name==="PT Bukit Asam Tbk (PTBA)").group==="state","MIND ID/PTBA must map under BUMN");
assert(d.items.find(x=>x.name==="PT Adaro Andalan Indonesia Tbk").group==="private","Indonesian private miner must not be Danantara SOE");
assert(d.items.find(x=>x.name==="Directorate General of Minerals & Coal").lead.includes("Tri Winarno"),"Minerba official name missing");
assert(d.items.find(x=>x.name==="National Energy Council Secretariat (DEN)").lead.includes("Dadan Kusdiana"),"DEN leadership not current");
assert(d.indicators.length===4,"2025 GDP and 3 other indicators expected");
const indicators=Object.fromEntries(d.indicators.map(x=>[x.id,x]));
assert(indicators.gdp.scope==="coal+lignite GDP"&&indicators.gdp.value_en==="Rp 827.36 tn","Must distinguish BPS 2025 direct GDP");
assert(indicators.production.value_en==="817.48 Mt","Incorrect 2025 official production");
assert(indicators.dmo.value_en==="246.88 Mt","Incorrect 2025 coal DMO");
assert(indicators.pnbp.scope==="minerals + coal government PNBP"&&indicators.pnbp.note_en.includes("not coal-only"),"False coal-only PNBP claim");
assert(d.indicators.every(i=>i.vintage==="2025"&&/^https:\/\//.test(i.source)),"Indicator requires distinct published year/source");
assert(d.notes_en.some(x=>x.includes("different populations")),"Mixed economic figures must be explained");
assert(d.issues.length>=6&&d.issues.every(x=>x.route.every(g=>d.groups.some(z=>z.id===g))),"Invalid coal issue route");
for(const issue of ["rkab","dmo","revenue","price","logistics","transition"])
 assert(d.issues.some(x=>x.id===issue),"Missing focused coal issue: "+issue);
assert(page.includes('id="energyCoalStakeholdersRoot"'),"Standalone coal visual mount missing");
assert(page.includes('href="#energyCoalStakeholdersRoot"'),"Coal institutional navigation link missing");
assert(/initSLICoalStakeholders(?:\?\.)?\(\)/.test(page),"Coal module not initialized");
assert(page.includes('js/energy-coal-stakeholders.js')&&page.includes('css/energy-coal-stakeholders.css'),"Coal UI assets not linked");
assert(page.indexOf('id="energyOilGasStakeholdersRoot"')<page.indexOf('id="energyCoalStakeholdersRoot"')&&page.indexOf('id="energyCoalStakeholdersRoot"')<page.indexOf('id="energyPolicyRoot"'),"Coal visual ordering wrong");
assert(script.includes('document.addEventListener("sli:languagechange"'),"Coal EN/ID refresh missing");
assert(script.includes('data-sli-no-translate')&&script.includes('textContent=String'),"Unsafe/double-translated dynamic content");
assert(css.includes("#energyCoalStakeholdersRoot")&&css.includes(".coal-kpis"),"Coal UI styling not loaded");
console.log("Coal stakeholder intelligence PASS: "+d.items.length+" actors, "+d.groups.length+" categories, "+d.issues.length+" issue pathways and separated sourced economic indicators.");
