import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const js=read("js/sli-policy-chapter-insights.js"),view=read("js/research-chapters.js"),index=read("index.html"),styles=read("css/sli-policy-chapter-insights.css");
const legal=JSON.parse(read("data/sli-policy-regulatory-graph-2026.json"));
const evaluations=JSON.parse(read("data/sli-public-policy-evaluation-2026.json"));
const ria=JSON.parse(read("data/sli-sector-regulatory-ria-deepdives.json"));
test("All Policy chapters 01–05 have data-led panels and safe first-party integration",()=>{
 for(const id of ["01","02","03","04","05"])assert.ok(js.includes('area("'+id+'"'),"Missing data-led chapter "+id);
 assert.match(view,/window\.initSLIPolicyInsights\(\)/);
 assert.match(index,/js\/sli-policy-chapter-insights\.js/);
 assert.match(index,/css\/sli-policy-chapter-insights\.css/);
 assert.match(styles,/sli-policy-insight-grid/);
 assert.match(styles,/sli-policy-recommendations/);
 assert.match(js,/collapseGenericBaselines\(\)/);
 assert.match(styles,/sli-policy-baseline-details/);
});
test("Policy analytical evidence exists for every chapter, with linked legal sources",()=>{
 const legalIDs=["uu2minerba","pp40","pp28","uu27pdp","pres112","pres110carbon","kepmen188","pp5old","pp79old"];
 for(const id of legalIDs){
  const n=legal.nodes.find(x=>x.id===id);
  assert.ok(n?.source?.startsWith("https://"),"Missing authoritative watchlist "+id);
  assert.ok(n.ref&&n.status&&n.label);
 }
 for(const id of ["minerba","oilgas","power_dc","electricity_grid","renewables","carbon"]){
  const record=legal.cases.find(x=>x.id===id);
  assert.ok(record?.issues?.some(i=>i.reason&&i.mitigation),id);
 }
 assert.ok(evaluations.profiles.length>=9);
 assert.ok(evaluations.profiles.every(x=>x.finding&&x.priority_actions?.length));
 const targets=evaluations.profiles.flatMap(p=>p.indicators||[]).filter(x=>Number.isFinite(x.target)&&x.unit);
 assert.ok(targets.length>=4);
 assert.ok(targets.some(x=>x.target===69512&&x.actual===null));
 for(const id of ["electricity_grid","power_dc","minerba","oilgas","carbon","wto_trade"]){
  assert.ok(ria.cases[id]?.policy_options?.length>=3,id);
 }
});
test("No invented measured risk, causal result or numeric observation; graceful failure retained",()=>{
 assert.match(js,/Actual.*Not verified|Not verified/);
 assert.match(js,/not estimate probability of loss|does not estimate probability|not incident counts|not financial-loss probabilities/i);
 assert.match(js,/existing source-linked chapter baselines remain available/i);
 assert.ok(!js.includes("innerHTML"));
 assert.ok(!/sk-(?:proj-)?[A-Za-z0-9_-]{25,}/.test(js));
});
