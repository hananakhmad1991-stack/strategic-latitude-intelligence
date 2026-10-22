/* One-shot, owner-authenticated BPS evidence acceptance smoke.
 * NEVER prints, stores, uploads or copies the owner test token or model answer.
 * One API call max, no retry and no model calls in --self-test mode.
 */
import assert from "node:assert/strict";
const ORIGIN="https://hananakhmad1991-stack.github.io";
const ENDPOINT="https://sli-research-owner-test.hananakhmad1991.workers.dev/v1/owner-research";
const QUESTION="Menurut BPS Statistik Kesejahteraan Rakyat 2026 (Susenas Maret), berapa persentase rumah tangga Aceh dengan sumber utama air minum leding (Tabel 6.23), dan bagaimana SE, RSE, interval kepercayaan 95% dari tabel sampling error 9.88? Bedakan estimasi survey dan kepastian statistik, sertakan sitasi sumber BPS dan nomor halaman PDF. Jangan mengarang nilai yang tidak tersedia.";

export function evaluateBpsOwnerReply(status,reply){
 const issues=[];
 if(status!==200)issues.push("unexpected_status_"+status);
 if(reply?.mode!=="generative_rag")issues.push("not_generative_research");
 const answer=String(reply?.answer||"");
 const sources=Array.isArray(reply?.sources)?reply.sources:[];
 const bps=sources.filter(x=>typeof x?.source_url==="string"
  &&/^https:\/\/www\.bps\.go\.id\/id\/publication\/2026\/10\/05\/7e415878a8af3678e51f3e0a\//.test(x.source_url)
  &&(/^bps_welfare_province_/.test(String(x.id))||/BPS|Susenas/i.test(String(x.title))));
 const aceh=bps.filter(x=>/aceh/i.test(String(x.title)+" "+String(x.geo)+" "+String(x.id)));
 if(!bps.length)issues.push("missing_primary_BPS_publication_source");
 if(!aceh.length)issues.push("missing_Aceh_province_source");
 if(!/\bRSE\b/i.test(answer))issues.push("answer_missing_RSE");
 if(!/\bSE\b/i.test(answer))issues.push("answer_missing_standard_error");
 if(!/95\s*%/.test(answer))issues.push("answer_missing_95pct_interval");
 if(!/9[.,]88/.test(answer))issues.push("answer_missing_sampling_table_9_88");
 if(!/6[.,]23/.test(answer))issues.push("answer_missing_base_table_6_23");
 if(!/(?:\[[1-9][0-9]*\]|https:\/\/www\.bps\.go\.id)/.test(answer))issues.push("answer_without_visible_citation");
 if(!reply?.quality_audit||typeof reply.quality_audit!=="object")issues.push("missing_answer_quality_audit");
 if(/methodology_design_only_no_verified_sli_evidence/.test(String(reply?.evidence_status)))issues.push("model_answer_without_evidence");
 return {pass:issues.length===0,issues,source_count:sources.length,bps_source_count:bps.length,aceh_source_count:aceh.length,answer_length:answer.length};
}
export async function liveSmoke(env=process.env){
 const token=env.SLI_OWNER_SMOKE_TOKEN;
 if(typeof token!=="string"||token.length<48)throw Error("Missing private SLI_OWNER_SMOKE_TOKEN (48+ characters). No model request made.");
 const url=new URL(env.SLI_OWNER_SMOKE_ENDPOINT||ENDPOINT);
 if(url.origin!==new URL(ENDPOINT).origin||url.pathname!=="/v1/owner-research"||url.protocol!=="https:")throw Error("Unapproved owner endpoint. No model request made.");
 const body={question:QUESTION,mode:"executive_summary",language:"id",history:[],methodology:"auto"};
 const res=await fetch(url,{method:"POST",headers:{"Origin":ORIGIN,"Content-Type":"application/json","x-sli-owner-test-token":token},
   body:JSON.stringify(body),redirect:"error",signal:AbortSignal.timeout(40000)});
 const data=await res.json().catch(()=>({}));
 const result=evaluateBpsOwnerReply(res.status,data);
 console.log(JSON.stringify({test:"BPS Owner Test live reference and uncertainty",...result},null,2));
 if(!result.pass)process.exitCode=1;
 return result;
}
function selfTest(){
 const valid={mode:"generative_rag",
  answer:"BPS Susenas Tabel 6.23: estimasi air leding Aceh. SE dan RSE tercantum di tabel 9.88; CI 95% [1].",
  sources:[{id:"bps_welfare_province_aceh",geo:"Aceh",title:"BPS Susenas 2026 Provinsi Aceh",
   source_url:"https://www.bps.go.id/id/publication/2026/10/05/7e415878a8af3678e51f3e0a/statistik-kesejahteraan-rakyat-2026.html"}],
  quality_audit:{status:"source_limited"},evidence_status:"owner_staging_source_dated_corpus"};
 assert.equal(evaluateBpsOwnerReply(200,valid).pass,true);
 assert.equal(evaluateBpsOwnerReply(200,{...valid,sources:[]}).pass,false);
 assert.equal(evaluateBpsOwnerReply(200,{...valid,answer:"Tidak ada angka."}).pass,false);
 assert.equal(evaluateBpsOwnerReply(401,{error:"owner_authentication_required"}).pass,false);
 console.log("BPS owner authentication and citation smoke validator self-tests PASS (no network/model usage).");
}
if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href){
 if(process.argv.includes("--self-test"))selfTest();
 else liveSmoke().catch(error=>{console.error("Owner BPS smoke failed:",error.message);process.exitCode=1});
}
