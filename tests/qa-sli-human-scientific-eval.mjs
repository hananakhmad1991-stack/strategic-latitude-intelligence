import {test} from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {evaluateHumanReviewedAnswers} from "../scripts/score_sli_human_scientific_eval.mjs";

const answer="Hypothetical project planned 120 MW in 2027 [1]. It is operational now [1].";
const sha=createHash("sha256").update(answer).digest("hex");
const primary=[{source_url:"https://www.esdm.go.id/document.pdf",document_sha256:"b".repeat(64),page:2}];
const fixture={schema:"sli-human-adjudicated-research-eval-v1",cases:[{
 case_id:"synthetic_planned_vs_operational",model_origin:"synthetic_fixture",
 model_answer:answer,answer_sha256:sha,
 reviewer:{id:"synthetic_test_only",date:"2026-10-20",status:"human_read_original"},
 claims:[
 {claim_id:"C1",claim_text:"planned 120 MW",verdict:"supported_by_primary_source",
  citation_assessment:"correct_direct_citation",primary_evidence:primary},
 {claim_id:"C2",claim_text:"operational now",verdict:"contradicted_by_primary_source",
  citation_assessment:"incorrect_or_unrelated_citation",primary_evidence:primary},
 {claim_id:"C3",claim_text:"no CAPEX evidence",verdict:"insufficient_primary_evidence",
  citation_assessment:"missing_citation",primary_evidence:primary}
 ]}]};

test("synthetic gold demonstrates review distribution but no claimed real-model accuracy",()=>{
 const r=evaluateHumanReviewedAnswers(fixture);
 assert.equal(r.cases,1);
 assert.equal(r.synthetic.adjudicated_sampled_claims,3);
 assert.equal(r.synthetic.supported,1);
 assert.equal(r.synthetic.contradicted,1);
 assert.equal(r.synthetic.insufficient,1);
 assert.equal(r.synthetic.citation_mismatch_or_missing,2);
 assert.equal(r.actual_llm_evaluated,false);
 assert.equal(r.factual_accuracy_generalization,null);
 assert.equal(r.release_gate,"human_scientific_review_required");
});
test("model answer changes without SHA update are rejected, protecting provenance",()=>{
 const f=structuredClone(fixture);
 f.cases[0].model_answer+=" modified";
 assert.throws(()=>evaluateHumanReviewedAnswers(f),/SHA-256/);
});
test("unanchored human labels are rejected and cannot quietly be treated as approved",()=>{
 const f=structuredClone(fixture);
 f.cases[0].claims[0].primary_evidence=[];
 assert.throws(()=>evaluateHumanReviewedAnswers(f),/primary sources/);
});
test("saved real model answers are counted separately, not mixed with synthetic",()=>{
 const f=structuredClone(fixture);
 f.cases[0].model_origin="saved_real_model_output";
 const r=evaluateHumanReviewedAnswers(f);
 assert.equal(r.synthetic.adjudicated_sampled_claims,0);
 assert.equal(r.real_model_outputs.adjudicated_sampled_claims,3);
 assert.equal(r.actual_llm_evaluated,true);
 assert.equal(r.factual_accuracy_generalization,null);
});
