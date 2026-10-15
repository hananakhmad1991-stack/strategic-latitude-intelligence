/* Regression tests: editorial navigation order, JS parse, unique data anchors and risk-wording hygiene.
 * Node standard library only. Does not claim to test deployment from GitHub Pages. */
"use strict";
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const index=fs.readFileSync("index.html","utf8");
const governance=fs.readFileSync("js/energy-governance-ccs.js","utf8");
const assessment=fs.readFileSync("js/daily-energy-assessment.js","utf8");
const emitter=fs.readFileSync("scripts/daily_energy_assessment.py","utf8");
const data=JSON.parse(fs.readFileSync("data/daily-energy-assessment.json","utf8"));
const orig=JSON.parse(fs.readFileSync("data/energy-infrastructure-security.json","utf8"));
const policy=JSON.parse(fs.readFileSync("data/energy-governance-ccs.json","utf8"));
for(const source of [governance,assessment,fs.readFileSync("js/i18n.js","utf8"),
 fs.readFileSync("js/energy-ev.js","utf8"),fs.readFileSync("js/energy-biofuels.js","utf8")])new Function(source);
const script=index.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
assert(script,"Expected main inline dashboard script");
new Function(script[1]);
const start=script[1].indexOf("function energyMonitor(){return `");
const next=script[1].indexOf("\nfunction tracker(page)",start);
assert(start>=0&&next>start,"Energy Security template missing");
const functionSource=script[1].slice(start,next).trim();
const html=new Function(functionSource+"\nreturn energyMonitor();")();
assert.equal(typeof html,"string");
const voidTags=new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
const stack=[];
const markup=/<\/?([a-z][a-z0-9-]*)(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
for(const match of html.matchAll(markup)){
 const tag=match[1].toLowerCase(),closing=match[0][1]==="/";
 if(voidTags.has(tag)||match[0].endsWith("/>"))continue;
 if(!closing){stack.push(tag);continue}
 assert(stack.length>0,"Unexpected closing HTML tag: "+tag);
 assert.equal(stack.pop(),tag,"HTML tag nesting mismatch");
}
assert.equal(stack.length,0,"Unclosed structural HTML elements");

const order=["es-governance","es-scorecard","es-supply","es-economics","es-transition","es-monitoring","es-evidence","es-assessment"];
const positions=order.map(id=>html.indexOf('id="'+id+'"'));
assert(positions.every(x=>x>=0));assert(positions.every((x,i)=>i===0||x>positions[i-1]),"Invalid strategic-to-technical section order");
const mounts=[
 "energyGovernanceRoot","energyPolicyRoot","energyCCSRoot","energyEventsRoot","energyInfrastructureRoot",
 "energyFundamentalsRoot","energyFiscalRoot","energyPriceSection","energyBiofuelsRoot","energyEVRoot",
 "energyRUEDRoot","energyTransitionRoot","domesticRadarRoot","geoEvents","geoTopic","geoSearch",
 "energyChart","energyMetric","energyStyle","energyFrom","energyReset","energyCsv",
 "energyOverallAssessment"
];
for(const id of mounts){const count=html.split('id="'+id+'"').length-1;assert.equal(count,1,"Mount id missing/duplicated: "+id)}
assert(html.indexOf('id="energyOverallAssessment"')>html.indexOf('id="energyEventsRoot"'));
assert(!html.includes('<h2>Strategic implications for Indonesia</h2>'),"Redundant analysis section survives");
assert(!html.includes('<h2>Priority monitoring questions</h2>'),"Redundant monitoring questions survive");
assert.equal((html.match(/<h3>HIP Biodiesel<\/h3>/g)||[]).length,0,"Duplicate standalone biodiesel price card");
assert.equal((html.match(/<h3>HIP Bioethanol<\/h3>/g)||[]).length,0,"Duplicate standalone bioethanol price card");
assert(html.includes('class="es-archive es-sources"'),"Source archive must be collapsible");
assert(html.includes('class="es-archive"'),"Historical incidents should be collapsible");
assert(governance.includes('policies(policyRoot,d.policies)')&&governance.includes('ccs(ccsRoot,d.ccs)'),"CCS and policy still crowded into governance block");
assert(assessment.includes('oa-evidence')&&assessment.includes('idBody'),"Assessment article and on-demand evidence missing");
assert(assessment.includes('sli:languagechange'),"Bilingual assessment rerender unavailable");
assert(!data.points.some(p=>JSON.stringify(p).includes("Rp10,/litre")),"Malformed monetary value shown in current daily snapshot");
assert(!emitter.includes('f"{number:,.{places}f}".rstrip("0")'),"Daily generator could mangle whole numbers again");
assert(orig.refinery?.units.length>=6 && policy.governance?.layers?.length>=5,"Data source unexpectedly absent");
assert(fs.existsSync("css/energy-information-architecture.css"));
assert(index.includes('css/energy-information-architecture.css'));
console.log("SLI editorial hierarchy passes: 8 ordered stages; "+mounts.length+" unique active roots; narrative, source register, risk hygiene and script parsing checked.");
