import fs from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";
const code=fs.readFileSync("js/research-signal-radar.js","utf8");
const doc=fs.readFileSync("index.html","utf8");
assert.ok(doc.includes("js/research-signal-radar.js?"),"Radar JS must be mounted");
assert.ok(doc.includes("css/research-signal-radar.css?"),"Radar CSS must be mounted");
assert.ok(fs.readFileSync("js/research-chapters.js","utf8").includes("initSLIResearchRadar(which,sections[5])"),"Monitoring stage must mount radar");
const window={SLIi18n:{language:"en"}};
vm.runInNewContext(code,{window,Date,Intl});
const {classifyFreshness,normalized}=window.SLIResearchRadarHelpers;
assert.ok(classifyFreshness({generated_at_utc:null}).level==="empty");
assert.ok(classifyFreshness({generated_at_utc:new Date().toISOString()}).level==="fresh");
assert.ok(classifyFreshness({generated_at_utc:new Date().toISOString(),status:"upstream_unavailable_last_good_preserved"}).level==="late");
const today=new Date().toISOString();
const rows=[
 {sector:"minerals",scope:"geopolitical",title:"Indonesia nickel tariff",publisher:"Reuters",published_at_utc:today,url:"https://example.com/a"},
 {sector:"ai",scope:"geopolitical",title:"Indonesia GPU controls",publisher:"Reuters",published_at_utc:today,url:"https://example.com/b"},
 {sector:"minerals",scope:"domestic",title:"Indonesia nikel smelter",publisher:"Antara",published_at_utc:today,url:"https://example.com/c"},
 {sector:"minerals",scope:"geopolitical",title:"Unsafe link",publisher:"Unknown",published_at_utc:today,url:"javascript:alert(1)"},
];
assert.equal(normalized(rows,"minerals","geopolitical").length,1);
assert.equal(normalized(rows,"ai","geopolitical").length,1);
assert.equal(normalized(rows,"minerals","domestic").length,1);
const radar=JSON.parse(fs.readFileSync("data/research-signal-radar.json","utf8"));
assert.equal(radar.schema_version,1);
for(const sector of ["minerals","ai"])for(const scope of ["geopolitical","domestic"]){
 assert.ok(Array.isArray(radar.groups[sector][scope]),"Missing radar lane "+sector+"/"+scope);
 assert.ok(radar.groups[sector][scope].every(x=>x.sector===sector&&x.scope===scope),"Cross-category item leaked");
}
console.log("PASS: both research radar mounts, frontend filtering, URL safety and publisher timestamps");
