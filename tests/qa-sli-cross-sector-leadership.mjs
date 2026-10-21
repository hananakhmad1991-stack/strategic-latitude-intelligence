import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const db=JSON.parse(read("data/sli-cross-sector-official-leadership-2026.json"));
const nodes=id=>db.agencies[id].nodes;
const office=(agency,id)=>nodes(agency).find(n=>n.id===id);
test("SLI shares one curated agency roster across all relevant specialist sectors",()=>{
 assert.equal(db.schema,"sli-cross-sector-official-leadership-v2");
 assert.equal(db.as_of,"2026-10-21");
 assert.deepEqual(Object.keys(db.sectors).sort(),["ai","energy","entities","environment","food","geo","investment","macro","minerals","policy","provincial"]);
 assert.equal(db.sectors.energy.agencies.includes("esdm"),true);
 assert.equal(db.sectors.minerals.agencies.includes("esdm"),true);
 assert.equal(db.sectors.ai.agencies.includes("esdm"),true);
 assert.ok(db.sectors.food.agencies.includes("kementan"));
 assert.ok(db.sectors.investment.agencies.includes("bkpm"));
 assert.ok(Object.values(db.agencies).reduce((s,x)=>s+x.nodes.length,0)>=55);
 for(const [agency,group] of Object.entries(db.agencies)){
  assert.ok(group.source.startsWith("https://"),agency);
  assert.equal(group.nodes.filter(x=>["minister","head"].includes(x.tier)).length,1,agency);
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

test("2026 official Bappenas, Kemendag, BPS, BI and BMKG leadership has source-proven provenance",()=>{
 assert.equal(office("bappenas","w").person,"Febrian Alphyanto Ruddyard");
 assert.equal(office("bappenas","sek").person,"Teni Widuriyanti");
 assert.equal(office("bappenas","dir-marine").person,"Mohamad Rahmat Mulianda");
 assert.equal(office("kemendag","w").person,"Dyah Roro Esti Widya Putri");
 assert.equal(office("kemendag","it").person,null,"Do not invent trade inspector currently unverified");
 assert.equal(office("kemenkeu","m").person,"Suahasil Nazara");
 assert.equal(office("kemenkeu","w").person,"Juda Agung");
 assert.equal(office("bps","m").person,"Amalia Adininggar Widyasanti");
 assert.equal(office("bps","sek").person,"Zulkipli");
 assert.equal(office("bi","m").person,"Destry Damayanti","BI Governor changed in September 2026");
 assert.equal(office("bi","w").person,"Aida S. Budiman");
 assert.equal(office("bi","dg4").person,"Solikin M. Juhro");
 assert.equal(db.agencies.bi.institutional_class,"independent-central-bank");
 assert.equal(office("bmkg","m").person,"Teuku Faisal Fathani");
 assert.equal(office("bmkg","sek").person,"Guswanto");
 const namespaces=Object.values(db.agencies);
 assert.ok(namespaces.reduce((a,v)=>a+v.nodes.length,0)>120,"Cross-sector coverage too shallow");
});
test("All new standalone sector dashboards reuse one canonical named roster",()=>{
 const sections={
 "indonesia-macroeconomic-intelligence.html":"macro",
 "policy-regulatory-intelligence.html":"policy",
 "geopolitical-impact-assessment.html":"geo",
 "climate-environment.html":"environment",
 "sli-entities.html":"entities",
 "provincial-intelligence.html":"provincial"
 };
 const js=read("js/sli-sector-leadership.js");
 assert.ok(js.includes('document.querySelectorAll("[data-sli-ministry-sector]")'));
 for(const [page,sector] of Object.entries(sections)){
  const html=read(page);
  assert.ok(html.includes('data-sli-ministry-sector="'+sector+'"'),page);
  assert.match(html,/css\/sli-sector-leadership\.css/,page);
  assert.match(html,/js\/sli-sector-leadership\.js/,page);
  assert.ok(db.sectors[sector].agencies.length>=2,sector);
 }
 assert.ok(!read("marine-fisheries-intelligence.html").includes('data-sli-ministry-sector="marine"'),"Keep original native KKP hierarchy, no duplicate");
 const bad=structuredClone(db);bad.sectors.policy.agencies=["does-not-exist"];
 const mock={};vm.runInNewContext(js,{window:mock,document:{readyState:"loading",addEventListener(){}},console});
 assert.equal(mock.validateSLISectorLeadership(bad).pass,false);
 const wrong=structuredClone(db);wrong.agencies.bi.nodes.find(x=>x.id==="m").tier="minister";
 assert.equal(mock.validateSLISectorLeadership(wrong).pass,false,"Independent institution cannot be relabeled as minister");
});

test("All participating SLI families map 16 agencies and retain legally distinct chains",()=>{
 const sectors=["energy","minerals","food","ai","investment","macro","geo","policy","environment","entities","provincial"];
 for(const id of sectors)assert.ok(db.sectors[id]?.agencies?.length>=1,id);
 assert.equal(Object.keys(db.agencies).length,16);
 assert.ok(Object.values(db.agencies).reduce((a,s)=>a+s.nodes.length,0)>=160);
 assert.ok(Object.values(db.agencies).reduce((a,s)=>a+s.nodes.filter(n=>n.person).length,0)>=100);
 for(const key of ["kemlu","kemhan","kemendagri","klh"])assert.ok(db.agencies[key],key);
 for(const key of ["kemlu","kemhan","kemendagri"])assert.ok(db.sectors.geo.agencies.includes(key),key);
 for(const key of ["klh","bmkg","bnpb"])assert.ok(db.sectors.environment.agencies.includes(key),key);
 assert.equal(office("kemlu","m").person,"Arrmanatha Christiawan Nasir");
 assert.equal(office("kemhan","w1").person,"Yusuf Jauhari");
 assert.equal(office("kemhan","w2").person,"Richard T.H. Tampubolon");
 assert.equal(office("kemhan","dg-str").person,"Bagus Suryadi Tayo");
 assert.equal(office("kemenkeu","w2").person,"Luky Alfirman");
 assert.equal(office("kemenkeu","w3").person,"Nurkholisoh Ibnu Aman");
 assert.equal(db.agencies.bi.institutional_class,"independent-central-bank");
 assert.equal(db.agencies.kemhan.institutional_class,"line-ministry");
 const sourceJs=read("js/sli-sector-leadership.js"), win={};
 vm.runInNewContext(sourceJs,{window:win,document:{readyState:"loading",addEventListener(){}},console});
 const check=win.validateSLISectorLeadership(db);
 assert.equal(check.pass,true,JSON.stringify(check.issues));
 const old=structuredClone(db);old.schema="sli-cross-sector-official-leadership-v1";
 assert.equal(win.validateSLISectorLeadership(old).pass,false,"Older data must not replace new roster");
 const dupe=structuredClone(db);dupe.agencies.kemhan.nodes.push({...dupe.agencies.kemhan.nodes[0]});
 assert.equal(win.validateSLISectorLeadership(dupe).pass,false,"Duplicate office IDs must fail QA");
});

test("Official 2026 source evidence fills Diaz, two agriculture deputies and finance/trade vacancies",()=>{
 assert.equal(office("klh","w").person,"Diaz Faisal Malik Hendropriyono");
 assert.equal(office("klh","w").office_id,"Wakil Menteri LH / Wakil Kepala BPLH");
 assert.equal(office("kementan","w").person,"Muhammad Saleh Mustafa");
 assert.equal(office("kementan","w2").person,"Alim Setiawan Slamet");
 assert.equal(nodes("kementan").filter(x=>x.tier==="deputy").length,2);
 assert.equal(office("kemendag","it").person,"Helmy Santika");
 assert.equal(office("kemenkeu","sek").person,"Robert Leonard Marbun");
 assert.equal(office("kemenkeu","it").person,"Awan Nurmawan Nuh");
 assert.equal(office("kemenkeu","pajak").person,"Bimo Wijayanto");
 assert.equal(office("kemenkeu","perbend").person,"Astera Primanto Bhakti");
 assert.equal(office("kemenperin","ig").person,"Mohammad Rum");
 assert.equal(office("kemenperin","ketahanan").person,"Tri Supondy");
 assert.equal(office("kementan","livestock").person,"Agung Suganda");
 assert.equal(office("kementan","extension").person,"Idha Widi Arsanti");
 assert.equal(office("kementan","plant").verification,"acting_appointment");
 assert.equal(office("kemenkeu","fiskal").verification,"acting_appointment");
 const native=JSON.parse(read("data/food-governance-hierarchy.json"));
 assert.equal(native.nodes.find(x=>x.id==="wamentan-alim-2026").person,"Alim Setiawan Slamet");
 assert.equal(native.nodes.find(x=>x.id==="kementan-ditjen-pkh").person,"Agung Suganda");
 assert.equal(native.nodes.find(x=>x.id==="kementan-bppsdmp").person,"Idha Widi Arsanti");
 assert.ok(Object.values(db.agencies).every(a=>a.icon?.kind==="official-site-favicon"&&a.icon.src.startsWith("https://www.google.com/s2/favicons?domain=")));
 const script=read("js/sli-sector-leadership.js");
 assert.ok(script.includes("agencyIcon"));
 assert.ok(script.includes("not a certified institutional logo"));
 assert.ok(Object.values(db.agencies).reduce((n,a)=>n+a.nodes.filter(x=>x.person).length,0)>=120);
});
