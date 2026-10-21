#!/usr/bin/env node
/**
 * SLI Owner Research AI blind human-evaluation summary (PRIVATE RESULTS ONLY).
 * Does not call models or sources, does not train or fact-certify answers.
 * Never commit response manifests containing user/client data to a public repository.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const sha=x=>createHash("sha256").update(String(x),"utf8").digest("hex");
const HEX=/^[a-f0-9]{64}$/i;
const VERDICTS=new Set(["supported_by_primary_source","contradicted_by_primary_source","insufficient_primary_evidence"]);
const CITATIONS=new Set(["correct_direct_citation","incorrect_or_unrelated_citation","missing_citation","needs_reviewer_review"]);
const STATUSES=new Set(["completed","failed","blocked"]);
const iso=x=>typeof x==="string"&&/^\d{4}-\d\d-\d\dT/.test(x)&&Number.isFinite(Date.parse(x));
const n=x=>typeof x==="number"&&Number.isFinite(x)&&x>=0;
function officialLink(v){
 try{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password&&
  !!u.hostname.includes(".")&& !u.hostname.endsWith(".local")&&
  !/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/i.test(u.hostname);}catch{return false;}
}
const quantile=(sorted,q)=>sorted.length?sorted[Math.max(0,Math.ceil(sorted.length*q)-1)]:null;
function validatePlan(plan){
 if(plan?.schema!=="sli-owner-research-live-30-v1"||plan.cases?.length!==30)throw Error("Requires exact 30-case owner acceptance plan");
 const ids=plan.cases.map(x=>x.id);
 if(new Set(ids).size!==30||plan.cases.some(x=>!x.prompt||!Array.isArray(x.checks)||!x.checks.length))throw Error("Invalid plan IDs or checks");
 return plan.cases;
}
export function scoreLiveResearchBatch(plan,batch,{fixtureMode=false}={}){
 const prompts=validatePlan(plan);
 if(batch?.schema!=="sli-research-live-adjudicated-batch-v1"||!Array.isArray(batch.results))throw Error("Invalid batch schema");
 if(!fixtureMode&&batch.mode!=="saved_real_model_output")throw Error("Only saved real model outputs can support live acceptance reporting");
 if(batch.results.length!==30)throw Error("Exact 30 test-case receipts required, including blocked/failed attempts");
 const planIds=new Set(prompts.map(x=>x.id)),seen=new Set();
 const results={total:30,completed:0,failed:0,blocked:0,model_outputs_reviewed:0,
  material_claims:0,paired_claims:0,unresolved_claims:0,
  supported_claims:0,contradicted_claims:0,insufficient_claims:0,
  missing_citation_claims:0,incorrect_citation_claims:0,pending_citation_claims:0,
  review_disagreements:0,verified_source_traces:0,reported_cost_sum_usd:0,
  cost_missing_receipts:0,latencies:[],models:new Set(),corpora:new Set()};
 for(const item of batch.results){
  if(!planIds.has(item.case_id)||seen.has(item.case_id))throw Error("Unknown or duplicate case ID");
  seen.add(item.case_id);
  const spec=prompts.find(x=>x.id===item.case_id);
  if(item.prompt_sha256!==sha(spec.prompt))throw Error("Prompt digest mismatch: "+item.case_id);
  if(!STATUSES.has(item.status)||!iso(item.at_utc)||!n(item.latency_ms))throw Error("Invalid run receipt");
  if(item.status==="failed"||item.status==="blocked"){
   results[item.status]++;continue;
  }
  if(!fixtureMode&&item.model_origin!=="saved_real_model_output")throw Error("Synthetic output is not live evidence");
  if(!item.model||!HEX.test(item.source_index_sha256||"")||typeof item.answer!=="string"||
    !item.answer.trim()||sha(item.answer)!==item.answer_sha256)throw Error("Missing/unmatched saved model answer");
  results.completed++;results.models.add(item.model);results.corpora.add(item.source_index_sha256);
  results.latencies.push(item.latency_ms);
  if(n(item.cost_usd))results.reported_cost_sum_usd+=item.cost_usd;
  else results.cost_missing_receipts++;
  if(!Array.isArray(item.claims))throw Error("Saved answer requires adjudicated claims array");
  if(item.claims.length===0){results.unresolved_claims++;continue;}
  let complete=true;
  for(const claim of item.claims){
   if(!claim.claim_id||!claim.claim_text||!Array.isArray(claim.reviews))throw Error("Invalid material claim");
   results.material_claims++;
   const reviewers=new Set(claim.reviews.map(x=>x.reviewer_id));
   if(reviewers.size<2||claim.reviews.length!==2||
     claim.reviews.some(r=>!r.reviewer_id||!VERDICTS.has(r.verdict)||!CITATIONS.has(r.citation_assessment))) {
     complete=false;results.unresolved_claims++;continue;
   }
   const [a,b]=claim.reviews;
   if(a.verdict!==b.verdict||a.citation_assessment!==b.citation_assessment){
     results.review_disagreements++;results.unresolved_claims++;complete=false;continue;
   }
   if(a.verdict==="supported_by_primary_source"){
    const sources=claim.primary_evidence||[];
    const valid=Array.isArray(sources)&&sources.some(s=>{
     if(!officialLink(s.source_url))return false;
     if(/\.pdf($|\?)/i.test(s.source_url)){
      return HEX.test(s.document_sha256||"")&&Number.isInteger(s.page)&&s.page>0;
     }
     return !!s.source_date&&iso(s.checked_at_utc);
    });
    if(!valid){results.unresolved_claims++;complete=false;continue;}
    results.verified_source_traces++;
   }
   results.paired_claims++;
   if(a.verdict==="supported_by_primary_source")results.supported_claims++;
   if(a.verdict==="contradicted_by_primary_source")results.contradicted_claims++;
   if(a.verdict==="insufficient_primary_evidence")results.insufficient_claims++;
   if(a.citation_assessment==="missing_citation")results.missing_citation_claims++;
   if(a.citation_assessment==="incorrect_or_unrelated_citation")results.incorrect_citation_claims++;
   if(a.citation_assessment==="needs_reviewer_review")results.pending_citation_claims++;
  }
  if(complete)results.model_outputs_reviewed++;
 }
 if(seen.size!==30)throw Error("All planned cases must be accounted for");
 const latencies=results.latencies.sort((a,b)=>a-b);
 const fullyReviewed=results.completed===30&&results.model_outputs_reviewed===30&&
   results.material_claims>0&&results.unresolved_claims===0&&results.review_disagreements===0;
 const output={
  schema:"sli-owner-live-acceptance-summary-v1",
  assessment_scope:fixtureMode?"synthetic_schema_regression_only":"saved_real_answer_and_human_adjudication_metadata",
  run_receipts:results.total,completed:results.completed,failed:results.failed,blocked:results.blocked,
  model_outputs_paired_reviewed:results.model_outputs_reviewed,
  claims_total:results.material_claims,claims_paired_agreed:results.paired_claims,
  claims_supported:results.supported_claims,claims_contradicted:results.contradicted_claims,
  claims_insufficient:results.insufficient_claims,claims_unresolved:results.unresolved_claims,
  missing_citation:results.missing_citation_claims,incorrect_citation:results.incorrect_citation_claims,
  pending_citation:results.pending_citation_claims,review_disagreements:results.review_disagreements,
  primary_traces_with_metadata:results.verified_source_traces,
  cost_usd_sum_for_reported_receipts:Number(results.reported_cost_sum_usd.toFixed(6)),
  cost_receipts_missing:results.cost_missing_receipts,
  p95_latency_ms:quantile(latencies,0.95),
  models:[...results.models].sort(),source_index_versions:[...results.corpora].sort(),
  ready_for_analyst_acceptance_review:!fixtureMode&&fullyReviewed,
  scientifically_certified:false,commercial_launch_approved:false,
  limitations:[
   "Reviewer labels and evidence metadata are not independent proof of reviewer accuracy or source authenticity.",
   "Only real saved model outputs and original source pages independently read by humans can ground scientific conclusions.",
   "Contradictions, insufficient evidence, citation mismatches, disagreements and unavailable cost receipts remain visible.",
   "No model, external API or browser was invoked by this scorer; private reports must never be uploaded to the public repository."
  ]
 };
 return output;
}
function main(){
 const read=path=>JSON.parse(readFileSync(path,"utf8"));
 const arg=prefix=>{const a=process.argv.find(x=>x.startsWith(prefix));return a?.slice(prefix.length)};
 const input=arg("--input="),out=arg("--out=");
 if(!input||!out)throw Error("Usage: node scripts/score_sli_research_live30.mjs --input=/private/batch.json --out=/private/summary.json");
 const plan=read(resolve(ROOT,"tests/fixtures/sli-research-live-30-prompts.json"));
 const summary=scoreLiveResearchBatch(plan,read(resolve(input)));
 mkdirSync(dirname(resolve(out)),{recursive:true});
 writeFileSync(resolve(out),JSON.stringify(summary,null,2)+"\n",{mode:0o600});
 console.log("Receipts",summary.run_receipts,"Completed",summary.completed,"Paired reviews",summary.claims_paired_agreed,
   "Contradicted",summary.claims_contradicted,"Unresolved",summary.claims_unresolved);
 console.log("Scientific certification and commercial launch never granted by scorer.");
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
