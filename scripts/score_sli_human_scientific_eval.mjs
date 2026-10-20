#!/usr/bin/env node
/* Summarize independently HUMAN-ADJUDICATED claim evidence against model output.
 * No paid model calls and no artificial "model accuracy" based on static fixtures.
 * The reviewer must read publisher originals, including any cited PDF pages.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";

const SHA=/^[a-f0-9]{64}$/;
const OFFICIAL_PDF_HOSTS=new Set(["esdm.go.id","www.esdm.go.id","bps.go.id","www.bps.go.id",
 "bi.go.id","www.bi.go.id","pln.co.id","www.pln.co.id","web.pln.co.id",
 "kemenkeu.go.id","www.kemenkeu.go.id","iea.org","www.iea.org","worldbank.org","www.worldbank.org"]);
const VERDICTS=new Set(["supported_by_primary_source","contradicted_by_primary_source",
  "insufficient_primary_evidence"]);
const CITATIONS=new Set(["correct_direct_citation","incorrect_or_unrelated_citation",
  "missing_citation","needs_reviewer_review"]);
const digest=s=>createHash("sha256").update(s).digest("hex");
const isValidDate=s=>/^\d{4}-\d\d-\d\d$/.test(String(s||""))&&!Number.isNaN(Date.parse(s+"T00:00:00Z"));
function fail(message){throw Error("Invalid human-adjudicated scientific evaluation: "+message)}

export function evaluateHumanReviewedAnswers(data){
 if(data?.schema!=="sli-human-adjudicated-research-eval-v1"||!Array.isArray(data.cases)||!data.cases.length||
    data.cases.length>25)fail("expected 1-25 cases");
 const all=[],ids=new Set();
 for(const c of data.cases){
  if(typeof c.case_id!=="string"||!c.case_id||ids.has(c.case_id))fail("case IDs must be unique");
  ids.add(c.case_id);
  if(typeof c.model_answer!=="string"||!c.model_answer.trim()||c.model_answer.length>50000)fail("model answer required, max 50000 chars");
  if(!SHA.test(String(c.answer_sha256||""))||digest(c.model_answer)!==c.answer_sha256)
   fail(c.case_id+": answer SHA-256 does not match saved model output");
  if(c.model_origin!=="synthetic_fixture"&&c.model_origin!=="saved_real_model_output")
   fail(c.case_id+": model origin required");
  if(!c.reviewer?.id||!isValidDate(c.reviewer.date)||c.reviewer.status!=="human_read_original")
   fail(c.case_id+": human reviewer identity/date/original reading declaration required");
  if(!Array.isArray(c.claims)||!c.claims.length||c.claims.length>120)
   fail(c.case_id+": expected reviewed claim sample");
  const claimIds=new Set();
  for(const item of c.claims){
   if(!item.claim_id||claimIds.has(item.claim_id)||!item.claim_text)
    fail(c.case_id+": unique claim ID and text required");
   claimIds.add(item.claim_id);
   if(!VERDICTS.has(item.verdict)||!CITATIONS.has(item.citation_assessment))
    fail(c.case_id+": unsupported verdict or citation assessment");
   if(!Array.isArray(item.primary_evidence)||!item.primary_evidence.length||item.primary_evidence.length>5)
    fail(c.case_id+": reviewer must anchor each label to primary sources");
   for(const p of item.primary_evidence){
    if(!SHA.test(String(p.document_sha256||""))||!Number.isInteger(p.page)||p.page<1||
      !/^https:\/\/\S+/.test(String(p.source_url||"")))
     fail(c.case_id+": source URL, PDF byte SHA-256 and 1-based physical page required");
    const u=new URL(p.source_url);
    if(u.username||u.password||u.search||u.hash||u.port||u.protocol!=="https:"||
      !OFFICIAL_PDF_HOSTS.has(u.hostname)||!u.pathname.toLowerCase().endsWith(".pdf"))
     fail(c.case_id+": unclean or nonofficial primary PDF URL");
   }
   all.push({
    case_id:c.case_id,claim_id:String(item.claim_id),verdict:item.verdict,
    citation_assessment:item.citation_assessment,origin:c.model_origin,
    sources:item.primary_evidence.length,
   });
  }
 }
 const counted=(field,value,items=all)=>items.filter(x=>x[field]===value).length;
 const real=all.filter(x=>x.origin==="saved_real_model_output");
 const synthetic=all.filter(x=>x.origin==="synthetic_fixture");
 const summarise=rows=>({
  adjudicated_sampled_claims:rows.length,
  supported:counted("verdict","supported_by_primary_source",rows),
  contradicted:counted("verdict","contradicted_by_primary_source",rows),
  insufficient:counted("verdict","insufficient_primary_evidence",rows),
  citation_mismatch_or_missing:rows.filter(x=>
   ["incorrect_or_unrelated_citation","missing_citation"].includes(x.citation_assessment)).length,
  citations_pending_reviewer_check:counted("citation_assessment","needs_reviewer_review",rows),
  // This ratio is descriptive ONLY for manually selected reviewed claims, not general LLM accuracy.
  supported_fraction_in_reviewed_sample:rows.length?
   Number((counted("verdict","supported_by_primary_source",rows)/rows.length).toFixed(4)):null,
 });
 return {
  schema:"sli-scientific-human-eval-summary-v1",
  scope:"manual_source_and_claim_adjudication_on_capped_saved_output_samples_not_population_accuracy",
  cases:data.cases.length,
  synthetic:summarise(synthetic),real_model_outputs:summarise(real),
  actual_llm_evaluated:real.length>0,
  release_gate:"human_scientific_review_required",
  factual_accuracy_generalization:null,
  warnings:[
   "Reviewer labels are externally supplied: this script checks consistency, not whether human source reading was independent or correct.",
   "No automatic semantic entailment: page-text matching, citations, and numeric agreement do not establish truth.",
   "Selected claim-level counts are not a statistically representative or blinded evaluation of model accuracy.",
   "Synthetic fixture scores only validate evaluation code. Real model outputs and reviewer-approved primary PDFs are required.",
  ],
 };
}

const here=fileURLToPath(import.meta.url);
if(process.argv[1]&&resolve(process.argv[1])===here){
 const args=process.argv.slice(2),input=args[args.indexOf("--input")+1],output=args[args.indexOf("--output")+1];
 if(!input||!output||!args.includes("--input")||!args.includes("--output"))
  fail("usage: node scripts/score_sli_human_scientific_eval.mjs --input REVIEW.json --output LOCAL_SUMMARY.json");
 const data=JSON.parse(readFileSync(input,"utf8"));
 const result=evaluateHumanReviewedAnswers(data);
 mkdirSync(dirname(output),{recursive:true});
 writeFileSync(output,JSON.stringify(result,null,2)+"\n");
 console.log("Scientific human-review summary: ",JSON.stringify({
  real_reviewed_claims:result.real_model_outputs.adjudicated_sampled_claims,
  synthetic_reviewed_claims:result.synthetic.adjudicated_sampled_claims,
  live_llm_evaluated:result.actual_llm_evaluated,
  general_accuracy:result.factual_accuracy_generalization}));
}
