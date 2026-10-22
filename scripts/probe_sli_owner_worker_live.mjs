/* SLI Owner Worker live negative-auth acceptance, optional positive model test.
 * NEVER log tokens, response payload text, user data, private URLs, or model output.
 * Positive request only when explicitly opted in through repository Environment secrets.
 */
import fs from "node:fs";
import path from "node:path";
const config=JSON.parse(fs.readFileSync(new URL("../data/sli-research-assistant-config.json",import.meta.url),"utf8"));
const endpoint=config?.owner_test?.endpoint,origin="https://hananakhmad1991-stack.github.io";
const report={schema:"sli-owner-worker-live-acceptance-v1",checked_at_utc:new Date().toISOString(),
 endpoint:typeof endpoint==="string"&&endpoint.startsWith("https://")?new URL(endpoint).origin:"not_configured",
 scope:"owner_only_staging",negative_auth_status:"not_checked",positive_auth_status:"not_checked",model_answer_fact_check:"not_claimed",owner_secrets_logged:false};
const call=async (options)=>{
 const control=new AbortController(),timer=setTimeout(()=>control.abort(),55000);
 try{return await fetch(endpoint,{...options,signal:control.signal,redirect:"error"});}finally{clearTimeout(timer)}
};
const headers={"Origin":origin,"content-type":"application/json"};
const body=JSON.stringify({question:"Jelaskan keterbatasan data perikanan KKP 2024 dibanding tahun 2026 dengan sitasi sumber serta perbedaan target dan realisasi.",mode:"executive_summary",language:"id",history:[],methodology:"auto"});
try{
 if(!config?.owner_test?.enabled||!endpoint?.startsWith("https://")||new URL(endpoint).pathname!=="/v1/owner-research")throw Error("invalid_owner_test_config");
 const response=await call({method:"POST",headers,body});
 report.negative_http=response.status;
 const result=await response.json().catch(()=>({}));
 // 401 proves token requirement. HTTP 403/503/200 are not acceptable owner-auth gate passes.
 report.negative_auth_status=response.status===401&&result?.error==="owner_authentication_required"?"passed_unauth_401":"failed_or_unavailable";
 if(report.negative_auth_status!=="passed_unauth_401")throw Error("unexpected_unauth_status_"+response.status);
 // A second wrong random-looking token proves a 64-character guessed token
 // does not bypass the Owner gate. Never send a real or generated credential.
 const invalid=await call({method:"POST",headers:{...headers,"x-sli-owner-test-token":"0".repeat(64)},body});
 const rejected=await invalid.json().catch(()=>({}));
 report.invalid_token_http=invalid.status;
 report.invalid_token_status=invalid.status===401&&rejected.error==="owner_authentication_required"?"passed_wrong_token_401":"failed_wrong_token_gate";
 if(report.invalid_token_status!=="passed_wrong_token_401")throw Error("unexpected_invalid_token_status_"+invalid.status);
 const token=process.env.SLI_OWNER_TEST_TOKEN;
 if(token&&process.env.SLI_PAID_OWNER_TEST_OPT_IN==="true"){
  if(token.length<48)throw Error("secret_length_invalid");
  const verified=await call({method:"POST",headers:{...headers,"x-sli-owner-test-token":token},body});
  report.positive_http=verified.status;
  const v=await verified.json().catch(()=>({}));
  report.positive_auth_status=verified.ok&&v?.mode==="generative_rag"&&typeof v.answer==="string"&&v.answer.length>=160&&Array.isArray(v.sources)?
   "passed_model_response_structure":"failed_model_or_sources";
  const numberedCitations=/\\[[1-9][0-9]*\\]/.test(v.answer)||/\\[\\*\\*[1-9][0-9]*\\*\\*\\]/.test(v.answer);
  const officialSources=(v.sources||[]).filter(x=>String(x?.source_url||x?.url||"").startsWith("https://portaldata.kkp.go.id/")).length;
  report.numbered_citations_present=numberedCitations;
  report.official_kkp_sources_count=officialSources;
  report.research_basis=String(v?.evidence_status||"").slice(0,110);
  report.model_answer_fact_check="structural_only_primary_numeric_facts_require_manual_validation";
  report.source_count=Array.isArray(v.sources)?v.sources.length:null;
  if(report.positive_auth_status!=="passed_model_response_structure")throw Error("authenticated_response_failed_"+verified.status);
 }else{report.positive_auth_status="not_checked_missing_secret_or_explicit_paid_opt_in";}
}catch(e){report.error=String(e?.message||e).slice(0,200)}
const out="artifacts/sli-owner-worker-live-acceptance.json";fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+"\n");
console.log("OWNER LIVE ACCEPTANCE SUMMARY",JSON.stringify(report));
if(process.env.SLI_REQUIRE_OWNER_NEGATIVE==="true"&&report.negative_auth_status!=="passed_unauth_401")process.exitCode=1;
if(process.env.SLI_REQUIRE_OWNER_POSITIVE==="true"&&report.positive_auth_status!=="passed_model_response_structure")process.exitCode=1;
