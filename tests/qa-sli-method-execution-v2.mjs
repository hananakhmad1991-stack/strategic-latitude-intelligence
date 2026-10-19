import {test} from "node:test";
import assert from "node:assert/strict";
import {METHODS,inferMethod,recommendExecutableMethod,getMethod,METHOD_FORMULAS,evaluate} from "../js/sli-analytical-core.mjs";
import {topsis} from "../js/sli-decision-methods.mjs";
const topology={
 alternatives:["Province A","Province B","Province C"],
 criteria:[{name:"Grid readiness",weight:0.6,type:"benefit"},{name:"Setup cost",weight:0.4,type:"cost"}],
 matrix:[[90,120],[80,70],[50,150]]
};
test("49 catalog methods have truthful execution status and runnable sourced formula cards",()=>{
 assert.equal(METHODS.length,49);
 assert.equal(METHODS.filter(m=>m.status==="local").length,10);
 for(const m of METHODS.filter(m=>m.status==="local")){assert.ok(METHOD_FORMULAS[m.id]?.formula);assert.ok(METHOD_FORMULAS[m.id]?.source.startsWith("https://"))}
 assert.equal(getMethod("did").status,"design");assert.equal(getMethod("monte_carlo").status,"design");
});
test("auto intent recognizes word-boundary methods (not backslash literals) and refuses design-only execution",()=>{
 for(const [q,m] of [["olah AHP penelitian","ahp"],["Use DiD for this intervention","did"],["Jalankan OLS","ols"],["Bandingkan shift-share output","shift_share"],["Tentukan indeks LQ","lq"],["Hitung TOPSIS","topsis"]]){
  assert.equal(inferMethod(q),m,q);
 }
 const rows=[{a:2,b:5},{a:3,b:8}];
 assert.deepEqual(recommendExecutableMethod("Coba DiD", {rows}),{method:"did",status:"design",reason:"user_requested"});
 assert.equal(recommendExecutableMethod("Jelaskan pola data",{rows}).method,"descriptive");
 assert.equal(recommendExecutableMethod("Jelaskan pola data",{}).status,"unavailable");
 assert.equal(recommendExecutableMethod("Tentukan ranking",{model:topology}).method,"topsis");
});
test("TOPSIS executes classic weighted normalized decision matrix, not unverified investment forecast",()=>{
 const r=topsis(topology);
 assert.equal(r.method,"topsis");assert.equal(r.ranking.length,3);
 assert.equal(new Set(r.ranking.map(v=>v.name)).size,3);
 assert.ok(r.ranking.every(v=>v.score>=0&&v.score<=1));
 assert.equal(r.ranking[2].name,"Province C");
 assert.deepEqual(evaluate({method:"topsis",model:topology}).ranking,r.ranking);
});
test("TOPSIS rejects missing/invalid weights, singular matrices, and duplicate alternatives",()=>{
 assert.throws(()=>topsis({...topology,criteria:[{...topology.criteria[0],weight:0.8},topology.criteria[1]]}),/sum to 1/);
 assert.throws(()=>topsis({...topology,matrix:[[90,120],[80,null],[50,150]]}),/finite numeric/);
 assert.throws(()=>topsis({...topology,alternatives:["A","A","B"]}),/uniquely named/);
 assert.throws(()=>topsis({...topology,matrix:[[1,1],[1,1],[1,1]]}),/cannot be ranked/);
});
test("Existing regional engines execute from explicit dimensions, reject missing and incompatible totals",()=>{
 const lq=evaluate({method:"lq",model:{regionalIndustry:200,regionalTotal:1000,nationalIndustry:1000,nationalTotal:10000}});
 assert.equal(lq.value,2);assert.equal(lq.causal,false);
 const ss=evaluate({method:"shift_share",model:{regionalIndustryBase:100,regionalIndustryEnd:125,nationalIndustryBase:1000,nationalIndustryEnd:1200,nationalTotalBase:10000,nationalTotalEnd:11000}});
 assert.ok(Math.abs(ss.nationalEffect+ss.industryMixEffect+ss.regionalCompetitiveEffect-ss.observedChange)<1e-10);
 assert.throws(()=>evaluate({method:"lq",model:{regionalIndustry:5}}),RangeError);
 assert.throws(()=>evaluate({method:"did",rows:[]}),/not executable/);
});
test("Workbench actually wires auto method selection, sources and per-method output views",async()=>{
 const {readFileSync}=await import("node:fs");
 const html=readFileSync(new URL("../sli-research-ai.html",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../js/sli-analytical-workbench-ui.mjs",import.meta.url),"utf8");
 assert.match(ui,/recommendExecutableMethod\(question,\{rows:data,model\}\)/);
 assert.match(ui,/raMethodCard/);assert.match(ui,/raMethodFormulaSource/);
 assert.match(ui,/output\.method==="topsis"/);
 assert.match(ui,/output\.method==="lq"/);
 assert.match(ui,/output\.method==="shift_share"/);
 assert.match(html,/sli-analytical-workbench-ui\.mjs/);
});
