#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const energy=JSON.parse(read("data/energy-governance-ccs.json"));
const register=JSON.parse(read("data/sector-command-hierarchy.json"));
const adapter=read("js/energy-hierarchy-adapter.js");
const hierarchy=read("js/sector-command-hierarchy.js");
const chapters=read("js/research-chapters.js");
for(const [path,src] of [["Energy adapter",adapter],["Hierarchy core",hierarchy],["Research chapter",chapters]])assert.doesNotThrow(()=>new vm.Script(src),path+" must parse");
const window={};
vm.runInNewContext(adapter,{window,console},{filename:"energy-hierarchy-adapter.js"});
const built=window.buildSLIEnergyHierarchy(energy.governance,energy.as_of);
const nodes=built.sectors.energy.nodes;
const find=s=>nodes.find(a=>a.title.includes(s));
const parent=a=>nodes.find(n=>n.id===a.parent);
const advisor=find("Penasihat Khusus Presiden"),menko=find("Kemenko Hilirisasi"),
 esdm=find("Kementerian ESDM / Minister"),den=find("Sekretariat Jenderal DEN"),
 home=find("Kementerian Dalam Negeri"),pemda=find("Provincial governors"),
 bpbum=find("BP BUMN"),batam=find("BP Batam");
for(const [name,a] of Object.entries({advisor,menko,esdm,den,home,pemda,bpbum,batam}))
 assert.ok(a&&a.source.startsWith("https://"),name+" must be source-backed");
assert.equal(advisor.person,"Purnomo Yusgiantoro");
assert.equal(advisor.relation,"advisory");
assert.equal(parent(advisor).id,parent(menko).id);
assert.equal(menko.person,"Bahlil Lahadalia");
assert.equal(menko.relation,"coordination");
assert.equal(parent(den).id,esdm.id);
assert.equal(den.relation,"administrative");
assert.equal(den.person,"Dadan Kusdiana");
assert.match(den.role,/functionally accountable to DEN/i);
assert.equal(parent(pemda).id,home.id);
assert.equal(pemda.relation,"local-government");
assert.equal(parent(batam).id,bpbum.id);
assert.equal(batam.relation,"zone-interface");
assert.match(batam.role,/NOT a BP BUMN/i);
assert.match(hierarchy,/priority\(a\)-priority\(b\)/,"Presidential adviser must be first, Menko second");
assert.match(hierarchy,/Coordinating Ministry for Downstreaming/i);
assert.match(hierarchy,/bpbum-ai/,"AI zone interface should be expanded");
assert.match(chapters,/if\(which==="ai"\)explorer\.open=true/,"AI organigram must be visible by default");
const ai=register.sectors.ai,byId=new Map(ai.nodes.map(a=>[a.id,a]));
assert.ok(ai.nodes.length>=30);
const walk=id=>{const chain=new Set();let current=byId.get(id);while(current){assert.ok(!chain.has(current.id),"Cycle at "+id);chain.add(current.id);if(current.parent)assert.ok(byId.has(current.parent),"Missing parent of "+current.id);current=byId.get(current.parent)}};
ai.nodes.forEach(a=>walk(a.id));
for(const [child,reference,relationship] of [
 ["den-ai","esdm","administrative"],["pemda-digital-ai","kemendagri-ai","local-government"],
 ["bpbatam-ai","bpbum-ai","zone-interface"],["gatrik-ai","esdm","reporting"]]){
 assert.equal(byId.get(child)?.parent,reference);
 assert.equal(byId.get(child)?.relation,relationship);
}
assert.match(byId.get("bpbatam-ai").role,/not a BP BUMN/i);
for(const p of ["ai-infrastructure.html","ai-intelligence-hub.html"]){
 const html=read(p);
 assert.match(html,/id="sliAiInfrastructureHierarchy"/);
 assert.match(html,/sector-command-hierarchy\.js\?v=/);
 assert.match(html,/sector-command-hierarchy\.css\?v=/);
 assert.match(html,/initSLICommandHierarchy\("ai",host\)/);
}
const homepage=read("index.html");
assert.match(homepage,/energy-hierarchy-adapter\.js\?v=20261019-structure3/);
assert.match(homepage,/research-chapters\.js\?v=20261019-structure3/);
console.log("PASS: presidential advice L1, Menko Bahlil L1, DEN/regions/Batam contextual L2, 30 AI institutions, visible navigable AI hierarchy.");
