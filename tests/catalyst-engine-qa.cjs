/* SLI Catalyst Engine provenance regression tests · node tests/catalyst-engine-qa.cjs */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const load=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const js=fs.readFileSync(path.join(root,"js/sli-catalyst-engine.js"),"utf8");
const env={window:{},document:{readyState:"loading",addEventListener(){}},URL,URLSearchParams,console,Intl,Date};
vm.runInNewContext(js,env,{filename:"js/sli-catalyst-engine.js"});
const api=env.window.SLICatalystEngine;
assert.ok(api&&typeof api.detectChanges==="function");
const orig={
 news:{updated_at_utc:"2026-10-20T05:00:00Z",articles:[{id:"old",title:"Old news",url:"https://publisher.example/old",published_at_utc:"2026-10-20T03:00:00Z",sector:"energy"}]},
 projects:{as_of:"2026-10-20",records:[{id:"p1",name:"Mine",stage:"Under construction",source_url:"https://gov.example/p1",evidence_date:"2026-10-19"}]},
 laws:{updated_at:"2026-10-20",nodes:[{id:"l1",ref:"UU 1",status:"enacted",kind:"legislation",source:"https://peraturan.go.id/one"}]}
};
assert.equal(api.detectChanges(null,orig).length,0,"first scan never fabricates historical changes");
const past=api.snapshotOf(orig);
const same=api.detectChanges(past,orig);
assert.equal(same.length,0,"unchanged source data emits no new signals");
const updated={
 news:{updated_at_utc:"2026-10-20T07:00:00Z",articles:[
  orig.news.articles[0],
  {id:"new",title:"Nickel plant inaugurated",url:"https://publisher.example/new",published_at_utc:"2026-10-20T06:00:00Z",sector:"minerals"},
  {id:"oldnews",title:"Historical clipping",url:"https://publisher.example/stale",published_at_utc:"2025-01-01T00:00:00Z",sector:"minerals"},
  {id:"unsafe",title:"Script URL",url:"javascript:alert(1)",published_at_utc:"2026-10-20T06:00:00Z",sector:"minerals"}
 ]},
 projects:{as_of:"2026-10-20",records:[
  {...orig.projects.records[0],stage:"Operational"},
  {id:"p2",name:"New project record",stage:"Announced",source_url:"https://gov.example/two",evidence_date:"2026-10-20"}
 ]},
 laws:{updated_at:"2026-10-20",nodes:[
  {...orig.laws.nodes[0],status:"amended"},
  {id:"l2",ref:"PP 2",status:"enacted",kind:"legislation",source:"https://peraturan.go.id/two"}
 ]}
};
const events=api.detectChanges(past,updated);
assert.equal(events.length,5,"one indexed news, two project and two law index events");
assert.equal(events.filter(e=>e.type==="news").length,1,"stale and unsafe news links excluded");
assert.ok(events.some(e=>e.type==="project-update"&&e.previousValue==="Under construction"&&e.nextValue==="Operational"));
assert.ok(events.some(e=>e.type==="law-update"&&e.previousValue==="enacted"&&e.nextValue==="amended"));
assert.ok(events.every(e=>e.id&&!e.id.includes("unsafe")),"event IDs grounded");
const union=api.baselineMerge(past,{news:updated.news});
assert.equal(union.projects.p1.stage,"Under construction","failed project source must retain prior baseline");
assert.equal(union.laws.l1.status,"enacted","failed law source must retain prior baseline");
assert.ok(union.newsIds.includes("new"),"successful news feed baseline advances");
assert.equal(api.exactTicker("ANTM target", "ANTM"),true);
assert.equal(api.exactTicker("XANTMZ unrelated", "ANTM"),false);
assert.equal(api.exactTicker("ANTM gains", "INCO"),false);
assert.equal(api.nameMention("Aneka Tambang starts new plant",{name:"Aneka Tambang"}),true);
const ctx={issuer:{ticker:"ANTM",name:"Aneka Tambang",sector:"minerals"},projects:[{project:{id:"p1",name:"Integrated EV battery ecosystem"}}]};
assert.equal(api.relevance({type:"news",title:"ANTM plans investment",sector:"minerals"},ctx).level,"named");
assert.equal(api.relevance({type:"news",title:"Integrated EV battery ecosystem ceremony",sector:"minerals"},ctx).level,"project");
assert.equal(api.relevance({type:"news",title:"Nickel market update",sector:"minerals"},ctx).level,"sector");
assert.equal(api.relevance({type:"project-update",projectId:"p1",sector:"minerals"},ctx).level,"project");
assert.equal(api.relevance({type:"project-update",projectId:"unrelated",sector:"minerals"},ctx).level,"sector");
assert.equal(api.relevance({type:"law-update",lawId:"l1",sector:"minerals"},ctx).level,"sector");
assert.equal(api.section("minerba","minerals"),true,"mineral rules map to mining sector");
assert.equal(api.section("food","minerals"),false,"unrelated sectors must not match");
const record=api.materialize(events.find(x=>x.type==="project-update"),updated);
assert.equal(record.stage,"Operational","registered stage is presented as a record value");
assert.ok(record.verified===false,"index delta never automatically claims independently verified");
assert.ok(api.researchPrompt(record,ctx).includes("Jangan menyimpulkan"),"DERGUBA handoff includes falsification limits");
const registry={
 issuers:load("data/sli-idx-issuer-universe.json"),
 participation:load("data/sli-corporate-evidence-relationships.json"),
 projects:load("data/sli-project-registry.json"),
 laws:load("data/sli-policy-regulatory-graph-2026.json"),
 news:load("data/sli-secondary-news-index.json")
};
const company=vm.runInNewContext(
 fs.readFileSync(path.join(root,"js/sli-company-monitor.js"),"utf8")+";window.SLICompanyMonitor",
 {window:{},document:{readyState:"loading",addEventListener(){}},URL,console}
);
env.window.SLICompanyMonitor=company;
registry.groups=load("data/sli-corporate-group-registry.json");
const linked=api.buildContext(registry,"ANTM");
assert.ok(linked&&linked.issuer.ticker==="ANTM");
assert.ok(linked.projects.some(x=>x.project.id==="sli-project-001"),"direct documentary project join");
assert.equal(api.buildContext(registry,"XXXX"),null,"unknown ticker cannot invent an entity");
assert.ok(registry.news.articles.length>10&&registry.laws.nodes.length>10);
for(const p of ["sli-decision-terminal.html","sli-issuer.html"]){
 const html=fs.readFileSync(path.join(root,p),"utf8");
 assert.ok(html.includes('id="sliCatalystEngine"'),p+" must mount engine");
 assert.ok(html.includes("js/sli-catalyst-engine.js"),p+" must load engine");
 assert.ok(html.includes("css/sli-catalyst-engine.css"),p+" must load responsive styles");
}
console.log("SLI Catalyst QA passed: source deltas, strict relevance, source safety, live fixture joins, cross-page mounts");
