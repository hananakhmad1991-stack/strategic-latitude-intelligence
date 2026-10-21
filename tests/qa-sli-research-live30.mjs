import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {scoreLiveResearchBatch} from "../scripts/score_sli_research_live30.mjs";

const plan=JSON.parse(readFileSync(new URL("./fixtures/sli-research-live-30-prompts.json",import.meta.url),"utf8"));
const hash=x=>createHash("sha256").update(x).digest("hex");
function receipts(){
 return {schema:"sli-research-live-adjudicated-batch-v1",mode:"synthetic_fixture",
  results:plan.cases.map(item=>{
   const answer="Synthetic answer for regression only "+item.id;
   return {case_id:item.id,prompt_sha256:hash(item.prompt),at_utc:"2026-10-21T16:00:00Z",
    status:"completed",latency_ms:1200,model:"fixture-not-real",source_index_sha256:"a".repeat(64),
    answer,answer_sha256:hash(answer),model_origin:"synthetic_fixture",cost_usd:0.01,
    claims:[{claim_id:"C001",claim_text:"Synthetic claim for checker only",
     primary_evidence:[{source_url:"https://www.esdm.go.id/original.pdf",page:1,document_sha256:"b".repeat(64)}],
     reviews:[
      {reviewer_id:"synthetic-a",verdict:"supported_by_primary_source",citation_assessment:"correct_direct_citation"},
      {reviewer_id:"synthetic-b",verdict:"supported_by_primary_source",citation_assessment:"correct_direct_citation"}]
    }]};
  })};
}
test("exactly 30 cross-sector public prompts with explicit review expectations",()=>{
 assert.equal(plan.cases.length,30);
 assert.equal(new Set(plan.cases.map(x=>x.id)).size,30);
 assert.equal(new Set(plan.cases.map(x=>x.sector)).size,6);
 assert.ok(plan.cases.every(x=>x.model_answer===null&&x.ground_truth_status==="not_yet_human_adjudicated"));
});
test("synthetic perfect 30/30 is never certified as live accuracy or launch readiness",()=>{
 const s=scoreLiveResearchBatch(plan,receipts(),{fixtureMode:true});
 assert.equal(s.completed,30);assert.equal(s.claims_paired_agreed,30);
 assert.equal(s.ready_for_analyst_acceptance_review,false);
 assert.equal(s.scientifically_certified,false);
 assert.equal(s.commercial_launch_approved,false);
 assert.equal(s.p95_latency_ms,1200);
});
test("real-batch mode rejects synthetic outputs",()=>{
 const r=receipts();r.mode="saved_real_model_output";
 assert.throws(()=>scoreLiveResearchBatch(plan,r),/Synthetic output/);
});
test("one blocked provider attempt remains visible and prevents full reviewed acceptance",()=>{
 const r=receipts();
 r.results[0]={case_id:r.results[0].case_id,prompt_sha256:r.results[0].prompt_sha256,
  status:"blocked",at_utc:"2026-10-21T16:00:00Z",latency_ms:0};
 const s=scoreLiveResearchBatch(plan,r,{fixtureMode:true});
 assert.equal(s.completed,29);assert.equal(s.blocked,1);
 assert.equal(s.ready_for_analyst_acceptance_review,false);
});
test("duplicate, missing, or altered test prompts fail closed",()=>{
 const a=receipts();a.results.pop();
 assert.throws(()=>scoreLiveResearchBatch(plan,a,{fixtureMode:true}),/Exact 30/);
 const b=receipts();b.results[0].case_id=b.results[1].case_id;
 b.results[0].prompt_sha256=b.results[1].prompt_sha256;
 assert.throws(()=>scoreLiveResearchBatch(plan,b,{fixtureMode:true}),/duplicate/);
 const c=receipts();c.results[0].prompt_sha256="a".repeat(64);
 assert.throws(()=>scoreLiveResearchBatch(plan,c,{fixtureMode:true}),/Prompt digest/);
});
test("false document hash and mismatched review cannot silently count as supported",()=>{
 const r=receipts();
 r.results[0].claims[0].primary_evidence[0].document_sha256="";
 r.results[1].claims[0].reviews[1].verdict="contradicted_by_primary_source";
 const s=scoreLiveResearchBatch(plan,r,{fixtureMode:true});
 assert.equal(s.claims_unresolved,2);
 assert.equal(s.review_disagreements,1);
 assert.equal(s.claims_paired_agreed,28);
});
test("result receipts cannot use a changed saved answer",()=>{
 const r=receipts();r.results[3].answer="edited answer";
 assert.throws(()=>scoreLiveResearchBatch(plan,r,{fixtureMode:true}),/unmatched saved model answer/);
});
