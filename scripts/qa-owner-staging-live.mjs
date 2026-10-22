#!/usr/bin/env node
/* Owner-controlled LIVE staging smoke test.
 * Never commit, display, upload, or persist OWNER_TEST_TOKEN or provider API keys.
 * Default: deterministic cases ONLY (no paid model). Optional --include-paid-model
 * performs one actual reviewed-Pasal completion from the existing staging Worker.
 */
import {readFileSync} from "node:fs";
import {makeResearchReport} from "../js/sli-report-content.mjs";
import {docxBytes} from "../js/sli-report-docx.mjs";
import {printableResearchHtml} from "../js/sli-report-pdf.mjs";

const config=JSON.parse(readFileSync(new URL("../data/sli-research-assistant-config.json",import.meta.url),"utf8"));
const endpoint=config?.owner_test?.endpoint;
const origin="https://hananakhmad1991-stack.github.io";
const includePaid=process.argv.includes("--include-paid-model");
const token=process.env.SLI_OWNER_TEST_TOKEN||"";
if(!/^https:\/\/sli-research-owner-test\.hananakhmad1991\.workers\.dev\/v1\/owner-research$/.test(endpoint||"")){
 console.error("FAIL: Owner staging endpoint is not the approved fixed Cloudflare address.");process.exit(2);
}
if(token.length<48||token.length>256){
 console.error("Missing SLI_OWNER_TEST_TOKEN in local process environment. Do NOT send it to chat, source control, or GitHub Actions.");process.exit(2);
}
const record=[];
const now=()=>new Date().toISOString();
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const payload=question=>({question,mode:"executive_summary",language:"id",history:[],methodology:"auto"});
async function post(question,{auth=true,from=origin}={}){
 const headers={"origin":from,"content-type":"application/json"};
 if(auth)headers["x-sli-owner-test-token"]=token;
 try{
  const response=await fetch(endpoint,{method:"POST",headers,body:JSON.stringify(payload(question)),signal:AbortSignal.timeout(45000)});
  const body=await response.json().catch(()=>({}));
  return {http:response.status,body};
 }catch(e){return {http:0,body:{error:e?.name==="TimeoutError"?"timeout":"network_unreachable"}}}
}
function log(name,pass,details={}){
 const item={test:name,pass,at:now(),...details};
 record.push(item);
 console.log((pass?"PASS ":"FAIL ")+name+(details.http?" · HTTP "+details.http:""));
}
function exportSmoke(question,body){
 if(!body||typeof body.answer!=="string")return false;
 const report=makeResearchReport({question,answer:body.answer,sources:body.sources||[],charts:body.charts||[],
  language:"id",mode:"executive_summary",title:"SLI Owner Staging Legal Acceptance"});
 const html=printableResearchHtml(report),word=docxBytes(report);
 // These are locally constructed artifacts, not proof of visual browser render.
 return word.byteLength>3000&&word[0]===80&&word[1]===75&&
  html.includes("@page {size:A4")&&html.includes("DRAF BERBANTUAN AI")&&
  report.refs.ready_for_publication===false;
}
async function main(){
 // No token in bad-Origin/unauthenticated tests: the server must fail before model invocation.
 const wrongOrigin=await post("Jelaskan Pasal 99 UU 7/2021",{auth:false,from:"https://untrusted.example"});
 log("Bad Origin denied",wrongOrigin.http===403&&wrongOrigin.body.error==="origin_denied",{http:wrongOrigin.http});
 const denied=await post("Jelaskan Pasal 99 UU 7/2021",{auth:false});
 log("Unauthenticated access denied",denied.http===401&&denied.body.error==="owner_authentication_required",{http:denied.http});
 const absentQ="Jelaskan Pasal 99 UU 7/2021. Apakah terdapat pada pasal utama UU asli?";
 const absent=await post(absentQ);
 const absentPass=absent.http===200&&
  absent.body.model_route==="not_invoked_missing_legal_article"&&
  absent.body.response_basis==="deterministic_missing_article_not_model_generated"&&
  absent.body.quality_audit?.legal_article_gate?.article_text_verified===false&&
  absent.body.sources?.some(s=>s.source_type==="official_original_statute_structure_only")&&
  /tidak terdapat sebagai pasal utama/i.test(absent.body.answer||"");
 log("Nonexistent Pasal 99 rejected without model",!!absentPass,{http:absent.http,
   error:absentPass?undefined:absent.body.error||"unexpected_law_response"});
 if(absentPass)log("Pasal 99 export HTML / Word draft",exportSmoke(absentQ,absent.body));
 const unreviewedQ="Jelaskan Pasal 11 UU 7/2021 berdasarkan teks pasalnya";
 const unreviewed=await post(unreviewedQ);
 const unreviewedPass=unreviewed.http===200&&
  unreviewed.body.model_route==="not_invoked_missing_legal_article"&&
  /belum memiliki teks atau ringkasan tingkat pasal/i.test(unreviewed.body.answer||"")&&
  !/tidak terdapat sebagai pasal utama/i.test(unreviewed.body.answer||"");
 log("Pasal 11 unreviewed distinguished from nonexistence",!!unreviewedPass,
  {http:unreviewed.http,error:unreviewedPass?undefined:unreviewed.body.error||"unexpected_unreviewed_response"});
 if(unreviewedPass)log("Pasal 11 export HTML / Word draft",exportSmoke(unreviewedQ,unreviewed.body));
 if(includePaid){
  // Worker has a two-per-minute Owner rate limit; never hammer it.
  console.log("Paid model test explicitly enabled. Observing the Worker rate limit before request.");
  await wait(65000);
  const q="Jelaskan Pasal 1 UU 16/2016 mengenai pengesahan Persetujuan Paris";
  const reviewed=await post(q);
  const anchor=(reviewed.body.sources||[]).find(s=>s.source_type==="reviewed_primary_article_paraphrase"&&
    /\.pdf(?:$|[?#])/i.test(s.source_url||""));
  const citationNumbers=[...String(reviewed.body.answer||"").matchAll(/\[(\d{1,3})\]/g)].map(x=>Number(x[1]));
  const reviewedPass=reviewed.http===200&&!!anchor&&reviewed.body.quality_audit?.legal_article_gate?.pass===true&&
    reviewed.body.model_route!=="not_invoked_missing_legal_article"&&
    citationNumbers.some(n=>reviewed.body.sources?.[n-1]?.id===anchor.id);
  log("LIVE reviewed Pasal 1 model completion with correct primary citation",!!reviewedPass,
    {http:reviewed.http,error:reviewedPass?undefined:reviewed.body.error||"reviewed_article_citation_failed"});
  if(reviewedPass)log("Pasal 1 export HTML / Word draft",exportSmoke(q,reviewed.body));
 }
 const ok=record.every(item=>item.pass);
 const summary={schema:"sli-owner-staging-live-acceptance-v1",as_of:now(),owner_endpoint_checked:endpoint,
  auth_token_printed:false,paid_live_model_test_requested:includePaid,
  test_count:record.length,passed:record.filter(x=>x.pass).length,
  result:ok?"PASS":"FAIL",results:record,
  boundaries:["Actual PDF browser rendering NOT validated by this CLI",
   "Current consolidated legal status NOT certified","Public paid launch NOT authorized by this test"]};
 console.log(JSON.stringify(summary,null,2));
 process.exitCode=ok?0:1;
}
await main();
