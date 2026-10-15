/* Oil & gas legal-policy registry integrity: no duplicates, verified dates, no obsolete HGBT scheme,
   proper upstream/downstream split and explicit Oil & Gas UI routing. */
"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict");
const d=JSON.parse(fs.readFileSync("data/energy-governance-ccs.json","utf8"));
const script=fs.readFileSync("js/energy-governance-ccs.js","utf8");
const page=fs.readFileSync("index.html","utf8");
const css=fs.readFileSync("css/energy-governance-ccs.css","utf8");
new Function(script);
const policy=d.policies;
const records=policy.items.filter(x=>x.sector==="Oil & Gas");
assert(records.length>=12,"Incomplete oil-and-gas regulation roster");
assert(records.some(x=>x.instrument.includes("UU No. 22/2001")),"Basic amended Migas Act missing");
for(const token of ["PP No. 35/2004","PP No. 36/2004","Perpres No. 9/2013","Permen ESDM No. 13/2024",
 "Perpres No. 26/2026","Permen ESDM No. 15/2022","Perpres No. 6/2019","Peraturan BPH Migas No. 1/2026","Kepmen ESDM No. 246.K/MG.04/MEM.M/2026"]){
 assert(records.some(x=>x.instrument.includes(token)), "Missing legal instrument "+token);
}
assert(!records.some(x=>x.instrument.startsWith("Permen ESDM No. 8/2020")),
 "Repealed 8/2020 HGBT regulation should not be classified as enacted");
assert.equal(records.filter(x=>x.instrument==="Perpres No. 26/2026").length,1,
 "2026 oil/fuel/LPG procurement decree duplicated");
assert(records.some(x=>x.subsector==="Upstream"),"Upstream section missing");
assert(records.some(x=>x.subsector==="Downstream & fuel"),"Downstream section missing");
assert(records.some(x=>x.subsector==="Gas pricing & networks"),"Gas tariffs and networks missing");
assert(records.some(x=>x.subsector==="Foundation"),"Oil and gas legal framework missing");
assert(records.every(x=>x.status==="Enacted"),"Unverified oil-and-gas legal records masquerading as in force");
assert(records.every(x=>["title","title_id","effect","effect_id","date","source","instrument","subsector"].every(k=>x[k]&&typeof x[k]==="string")),"Missing source or bilingual summary");
assert(records.every(x=>x.source.startsWith("https://")),"Unattributed oil and gas regulatory content");
assert(records.every(x=>x.date>="2001-01-01"&&x.date<="2026-10-15"&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)),"Missing law publication date");
assert.equal(new Set(policy.items.map(x=>x.instrument)).size,policy.items.length,"Duplicate instruments in full register");
assert(script.includes('sector.value="Oil & Gas"'),"No quick policy sector shortcut");
assert(script.includes('segment.value==="all"'),"No oil gas subtopic dropdown");
assert(script.includes('x.title_id')&&script.includes('x.effect_id'),"Oil/gas entries not bilingual");
assert(script.includes('migas|hulu|hilir|SKK|BPH|LPG|HGBT'),"Live policy scan ignores oil/gas sources");
assert(css.includes("#energyPolicyRoot .gov-quick"),"Filter styles missing");
assert(page.includes('id="energyPolicyRoot"'),"Policy mount missing");
console.log("Oil & Gas policy integration passes: "+records.length+" verified source-dated rows; all legal regimes and bilingual filters present.");
