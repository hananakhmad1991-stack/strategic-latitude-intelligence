import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluate,summarize,markdown} from "../scripts/sli-agent-self-eval.mjs";

test("automated AI self-audit can score all current public regression cases",()=>{
 const r=evaluate();
 assert.equal(r.schema,"sli-agent-improvement-scorecard-v1");
 assert.equal(r.evaluation_mode,"deterministic_offline_public_only_no_paid_model_calls");
 assert.ok(r.cases>=20);
 assert.equal(r.critical_failures,0,JSON.stringify(r.checks.filter(x=>x.status==="fail")));
 assert.ok(r.score_pct>=95,JSON.stringify(r.checks.filter(x=>x.status==="fail")));
 assert.equal(r.status,"passing_with_existing_source_warnings");
 assert.ok(r.proposed_actions.some(x=>x.id==="live_owner_model_eval_pending"));
 assert.match(r.human_gate,/reviewed PR/);
 assert.match(r.score_interpretation,/NOT AI answer accuracy/);
});
test("deterministic runner never double counts repeated evaluation",()=>{
 const first=evaluate(),second=evaluate();
 assert.equal(first.cases,second.cases);
 assert.deepEqual(first.checks.map(x=>[x.id,x.status]),second.checks.map(x=>[x.id,x.status]));
 assert.equal(new Set(first.checks.map(x=>x.id)).size,first.cases);
});
test("one critical failure blocks release instead of laundering it through a pass-rate",()=>{
 const s=summarize([{id:"one",status:"pass",domain:"research",critical:false},
  {id:"two",status:"fail",domain:"security",critical:true}]);
 assert.equal(s.critical_failures,1);
 assert.equal(s.release_regression,true);
 assert.equal(s.score_pct,50);
});
test("human feedback must be curated and source warnings are not disguised as model errors",()=>{
 const fixture=JSON.parse(readFileSync(new URL("./fixtures/sli-agent-eval-cases.json",import.meta.url),"utf8"));
 assert.match(fixture.update_policy,/reviewed pull requests/i);
 assert.match(fixture.update_policy,/never automatically add raw user prompts/i);
 const report=evaluate(),text=markdown(report);
 assert.match(text,/Human feedback becomes new regression cases only after review/);
 assert.ok(report.source_alerts.every(x=>x.area==="operations"));
 assert.ok(report.checks.some(x=>x.id==="news_attribution_integrity"));
});
