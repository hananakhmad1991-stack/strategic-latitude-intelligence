/* Reproducible, owner-only claim/evidence audit ledger.
 * SHA-256 detects changes to report/evidence snapshots; it is NOT a signature,
 * evidence archive, factual certification or editorial approval.
 */
const MAX_TRACE = 4;
const HIGH_RISK = new Set(["commercial_operation","realized_investment","law_status","investment_decision","construction"]);
const clean = (v,limit=180)=>String(v??"").trim().slice(0,limit);
function publicUrl(value){
 try{
  const u=new URL(String(value||""));
  if(u.protocol!=="https:"||u.username||u.password||u.port||!u.hostname.includes(".")||
   /^(?:localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)/i.test(u.hostname))return null;
  // Never export possible query-string credentials or tracking tokens.
  u.search="";u.hash="";
  return u.href;
 }catch{return null}
}
async function sha256(value){
 const bytes=new TextEncoder().encode(JSON.stringify(value));
 const hash=await crypto.subtle.digest("SHA-256",bytes);
 return [...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,"0")).join("");
}
function sourceType(d){
 if(d?.source_type)return clean(d.source_type,100);
 const id=String(d?.id||"");
 if(id.startsWith("sli_tavily_"))return "live_web_discovery";
 if(id.startsWith("dashboard_"))return "public_dashboard_source_record_not_claim_verified";
 if(id.startsWith("sli_news_")||id.startsWith("sli_feed_"))return "secondary_news";
 return "source_type_unspecified";
}
export async function buildClaimEvidenceLedger(answer,evidence,review,primaryProbe){
 const docs=Array.isArray(evidence)?evidence:[];
 const rows=Array.isArray(review?.items)?review.items:[];
 const sourceSnapshot=docs.map((d,i)=>({
  citation:i+1,id:String(d?.id||""),title:String(d?.title||""),
  url:String(d?.source_url||""),source_type:sourceType(d),
  period:String(d?.period||""),source_date:String(d?.source_date||""),
  publisher:String(d?.publisher||""),text:String(d?.text||"")
 }));
 const answerDigest=await sha256({answer:String(answer||"")});
 const evidenceDigest=await sha256({sources:sourceSnapshot});
 const reportDigest=await sha256({schema:"sli-claim-evidence-ledger-v1",
  answer_sha256:answerDigest,evidence_sha256:evidenceDigest,
  sampled_claims:rows.map(r=>({claim:r.claim,citations:r.citations,issues:r.issues}))});
 const probes=Array.isArray(primaryProbe?.results)?primaryProbe.results:[];
 const claims=rows.map((r,i)=>{
  const citations=[...new Set((Array.isArray(r.citations)?r.citations:[])
   .filter(n=>Number.isInteger(n)&&n>=1&&n<=docs.length))].slice(0,MAX_TRACE);
  const sources=citations.map(number=>{
   const d=docs[number-1];
   const pageCheck=probes.find(p=>p.citation===number&&p.claim===r.claim);
   return {
    citation:number,source_id:clean(d?.id,120),title:clean(d?.title,200),
    original_url:publicUrl(d?.source_url),source_type:sourceType(d),
    period:clean(d?.period,100),source_date:clean(d?.source_date,60),
    publisher:clean(d?.publisher,120),
    publisher_page_check:pageCheck?.status||"not_checked_for_this_claim"
   };
  });
  const issues=Array.isArray(r.issues)?r.issues.map(x=>clean(x,100)):[];
  const needsPrimary=!sources.some(s=>s.publisher_page_check==="publisher_page_numbers_present");
  return {
   claim_id:"C"+String(i+1).padStart(3,"0"),claim:clean(r.claim,300),
   category:clean(r.category,60),citation_scope:clean(r.citation_scope,32),
   missing_numbers:Array.isArray(r.missing_numbers)?r.missing_numbers.map(x=>clean(x,80)):[],
   issues,source_traces:sources,
   risk_tier:HIGH_RISK.has(r.category)?"high":"normal",
   review_status:"requires_human_source_and_editorial_review",
   independent_claim_validation:false,
   additional_source_review_needed:needsPrimary||issues.length>0
  };
 });
 const total=Math.max(0,Number(review?.assessed_claims)||0);
 return {
  schema:"sli-claim-evidence-ledger-v1",review_scope:"machine_triage_sample_not_factual_verification",
  report_sha256:reportDigest,answer_sha256:answerDigest,evidence_snapshot_sha256:evidenceDigest,
  hash_scope:"Answer, supplied source excerpts/metadata and sampled review rows. SHA-256 is change detection, not independent validation.",
  total_candidate_claims:total,sampled_claims:claims.length,
  not_sampled_candidates:Math.max(0,total-claims.length),
  claims,ready_for_external_use:false,
  approval_status:"not_editorially_approved",
  limitations:[
   "Only a risk-ranked capped claim sample is included. Unsampled or undetected claims have not been audited.",
   "Publisher-page numeric presence does not prove source-to-claim entailment; PDFs are not parsed.",
   "No signed evidence archive, independent cross-source fact check or human approval exists in this ledger."
  ]
 };
}
