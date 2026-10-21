import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const db=JSON.parse(read("data/sli-cross-sector-official-leadership-2026.json"));
const nodes=id=>db.agencies[id].nodes;
const office=(agency,id)=>nodes(agency).find(n=>n.id===id);
test("SLI shares one curated agency roster across all five specialist sectors",()=>{
 assert.equal(db.schema,"sli-cross-sector-official-leadership-v1");
 assert.equal(db.as_of,"2026-10-21");
 assert.deepEqual(Object.keys(db.sectors).sort(),["ai","energy","food","investment","minerals"]);
 assert.equal(db.sectors.energy.agencies.includes("esdm"),true);
 assert.equal(db.sectors.minerals.agencies.includes("esdm"),true);
 assert.equal(db.sectors.ai.agencies.includes("esdm"),true);
 assert.ok(db.sectors.food.agencies.includes("kementan"));
 assert.ok(db.sectors.investment.agencies.includes("bkpm"));
 assert.ok(Object.values(db.agencies).reduce((s,x)=>s+x.nodes.length,0)>=55);
 for(const [agency,group] of Object.entries(db.agencies)){
  assert.ok(group.source.startsWith("https://"),agency);
  assert.equal(group.nodes.filter(x=>x.tier==="minister").length,1,agency);
  const ids=group.nodes.map(x=>x.id);assert.equal(new Set(ids).size,ids.length,"duplicate office "+agency);
  for(const x of group.nodes){
   assert.ok(x.source.startsWith("https://")&&x.checked_on&&x.mandate_id&&x.mandate_en,agency+":"+x.id);
   if(x.parent)assert.ok(ids.includes(x.parent),"missing ministry parent "+x.id);
   if(x.person===null)assert.equal(x.verification,"unverified_officeholder");
   if(x.person)assert.ok(!/^(Minister of|Jabatan|TBA|Unknown)/.test(x.person));
  }
 }
 assert.equal(db.agencies.komdigi.nodes.filter(n=>n.verification.includes("2025")).length,5,"Older sources must show uncertainty");
});
test("October 2026 minister and deputy changes override dated obsolete rosters",()=>{
 assert.equal(office("kementan","w").person,"Muhammad Saleh Mustafa");
 assert.notEqual(office("kementan","w").person,"Sudaryono");
 assert.equal(office("kementan","ig").person,"Irham Waroihan");
 assert.equal(office("kemenperin","m").person,"Muhammad Sarmuji");
 assert.equal(office("kemenperin","w").person,"Faisol Riza");
 assert.equal(office("esdm","w").person,"Yuliot");
 assert.equal(office("esdm","sg").person,"Ahmad Erani Yustika");
 assert.equal(office("esdm","ig").person,"Yudhiawan");
 assert.equal(office("esdm","gatrik").verification,"acting_appointment");
 assert.equal(office("komdigi","w1").person,"Angga Raka Prabowo");
 assert.equal(office("komdigi","w2").person,"Nezar Patria");
 assert.equal(office("bkpm","w").person,"Todotua Pasaribu");
 assert.equal(office("bkpm","plan").person,"Ichsan Zulkarnaen");
 assert.equal(office("bkpm","coop").person,null,"No obsolete confirmed BKPM cooperation deputy");
});
test("Existing authoritative hierarchies share refreshed ministry units without conflating ministries and SOEs",()=>{
 const food=JSON.parse(read("data/food-governance-hierarchy.json"));
 const x=food.nodes.find(n=>n.id==="wamentan-2026");
 assert.equal(x.parent,"kementan");assert.equal(x.person,"Muhammad Saleh Mustafa");
 assert.equal(food.nodes.find(n=>n.id==="bgn").person,"Sudaryono");
 assert.equal(food.nodes.find(n=>n.id==="itjen-kementan").person,"Irham Waroihan");
 const inst=JSON.parse(read("data/sector-command-hierarchy.json"));
 for(const id of ["ai","minerals"])assert.equal(inst.sectors[id].nodes.find(n=>n.id==="esdm-wamen").person,"Yuliot");
 for(const id of ["komdigi-wamen1","komdigi-wamen2","komdigi-irjen","komdigi-sekjen"])assert.ok(inst.sectors.ai.nodes.some(n=>n.id===id&&n.parent==="komdigi"));
 assert.equal(inst.sectors.minerals.nodes.find(n=>n.id==="kemenperin-wamen").person,"Faisol Riza");
 const energy=JSON.parse(read("data/energy-governance-ccs.json"));
 assert.ok(energy.governance.layers.flatMap(l=>l.actors).some(n=>n.name.includes("Wakil Menteri ESDM")&&n.person_name==="Yuliot"));
 assert.ok(read("js/energy-hierarchy-adapter.js").includes("Inspektorat Jenderal ESDM"));
});
test("Interactive top-down leadership is integrated with existing sector maps, without a redundant new top-level category",()=>{
 const js=read("js/sli-sector-leadership.js");
 for(const id of ["#fa-hierarchy","#energyGovernanceRoot","#ai-command-hierarchy","#minerals-command-hierarchy","#sliSourceInvestmentRoot","#sliAiInfrastructureHierarchy"])assert.ok(js.includes(id),id);
 assert.ok(js.includes("validateSLISectorLeadership"));
 const fakeDoc={readyState:"loading",addEventListener(){}};
 const fakeWin={};vm.runInNewContext(js,{window:fakeWin,document:fakeDoc,console});
 const result=fakeWin.validateSLISectorLeadership(db);
 assert.equal(result.pass,true,JSON.stringify(result.issues));
 const invalid=structuredClone(db);invalid.agencies.esdm.nodes.find(x=>x.id==="w").source="https://example.com";
 assert.ok(fakeWin.validateSLISectorLeadership(invalid).pass,"Domain source format is checked, not falsely treated as audited allowlist");
 for(const p of ["index.html","food-agriculture-intelligence.html","ai-intelligence-hub.html"]){
  const html=read(p);
  assert.match(html,/css\/sli-sector-leadership.css/);
  assert.match(html,/js\/sli-sector-leadership.js/);
 }
 const nav=read("js/sli-navigation.js");assert.ok(!nav.includes("['Leadership Registry'"),"No extra menu category");
});
