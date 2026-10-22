/* Full Owner Worker handler acceptance against the actual runtime entrypoint.
 * No live API credentials, paid calls or unverifiable regulatory claims.
 */
import test from "node:test";
import assert from "node:assert/strict";
// Wrangler bundles JSON imports; Node needs the equivalent esbuild fixture bundle.
// CI pins esbuild and builds this from the unchanged Worker source before running.
const worker=(await import("file:///tmp/sli-owner-handler-acceptance.bundle.mjs")).default;
import {makeResearchReport} from "../js/sli-report-content.mjs";
import {printableResearchHtml} from "../js/sli-report-pdf.mjs";
import {docxBytes} from "../js/sli-report-docx.mjs";

const origin="https://hananakhmad1991-stack.github.io";
const endpoint="https://sli-research-owner-test.hananakhmad1991.workers.dev/v1/owner-research";
const ownerToken="offline_owner_acceptance_test_only_"+("q".repeat(52));
const fixtureEnv=()=>({
  WEB_ORIGIN:origin,STAGING_ONLY:"true",
  OPENAI_API_KEY:"offline-model-fixture-no-real-key",RESEARCH_MODEL:"gpt-5.4-mini",
  OWNER_TEST_TOKEN:ownerToken,
  AI_LIMITER:{limit:async()=>({success:true})},
  WORLD_BANK_ENABLED:"false",TAVILY_ENABLED:"false",
  SLI_UNIFIED_RESEARCH_ENABLED:"false",SLI_PRIMARY_CLAIM_PROBE_ENABLED:"false"
});
const payload=question=>({question,mode:"executive_summary",language:"id",history:[],methodology:"auto"});
const request=(question,{token=ownerToken,from=origin,body=payload(question)}={})=>
  new Request(endpoint,{method:"POST",headers:{
    Origin:from,"Content-Type":"application/json","x-sli-owner-test-token":token
  },body:JSON.stringify(body)});
async function answer(req,env=fixtureEnv()){
  const res=await worker.fetch(req,env);
  return {status:res.status,json:await res.json()};
}
function documentFor(question,data){
  return makeResearchReport({question,answer:data.answer,sources:data.sources||[],
    charts:data.charts||[],language:"id",mode:"executive_summary",
    title:"SLI Owner Acceptance · Pasal",generatedAt:"2026-10-22T00:00:00Z"});
}
function assertDraftExports(question,data){
  const report=documentFor(question,data);
  const html=printableResearchHtml(report);
  const word=docxBytes(report);
  assert.match(html,/<!doctype html>/i);
  assert.match(html,/A4/);
  assert.match(html,/DRAF BERBANTUAN AI/);
  assert.match(html,/Sumber dan Referensi/);
  assert.ok(!html.includes("<script>"));
  assert.ok(word.length>3000);
  assert.equal(word[0],0x50);assert.equal(word[1],0x4b);
  assert.equal(report.refs.ready_for_publication,false);
  return {report,html,word};
}

test("Real Worker handler enforces origin, owner token, and staging-only secrets",async()=>{
  const invalid=await answer(request("Jelaskan Pasal 99 UU 7/2021",{from:"https://evil.example"}));
  assert.equal(invalid.status,403);
  assert.equal(invalid.json.error,"origin_denied");
  const unauth=await answer(request("Jelaskan Pasal 99 UU 7/2021",{token:"invalid"}));
  assert.equal(unauth.status,401);
  assert.equal(unauth.json.error,"owner_authentication_required");
  const disabled=fixtureEnv();disabled.STAGING_ONLY="false";
  const fail=await answer(request("Jelaskan Pasal 99 UU 7/2021"),disabled);
  assert.equal(fail.status,503);
  assert.equal(fail.json.error,"staging_unavailable");
});

test("Pasal 99 absent in original UU 7/2021: real handler makes zero model calls and exports are labeled limited",async()=>{
  const oldFetch=globalThis.fetch;let networkCalls=0;
  globalThis.fetch=async()=>{networkCalls++;throw Error("Network should not be called for deterministically absent article")};
  try{
    const q="Jelaskan Pasal 99 UU 7/2021 dan status keberadaannya";
    const {status,json}=await answer(request(q));
    assert.equal(status,200,JSON.stringify(json));
    assert.equal(networkCalls,0);
    assert.equal(json.model_route,"not_invoked_missing_legal_article");
    assert.equal(json.response_basis,"deterministic_missing_article_not_model_generated");
    assert.equal(json.quality_audit.legal_article_gate.source_limited,true);
    assert.equal(json.quality_audit.legal_article_gate.article_text_verified,false);
    assert.match(json.answer,/tidak terdapat sebagai pasal utama/i);
    assert.equal(json.sources.length,1);
    assert.equal(json.sources[0].source_type,"official_original_statute_structure_only");
    assert.match(json.sources[0].source_url,/^https:\/\/pajak\.go\.id\//);
    assert.doesNotMatch(json.answer,/Pasal 99 .*mewajibkan|Pasal 99 .*mengatur/i);
    const {report,html}=assertDraftExports(q,json);
    assert.equal(report.refs.structure_only_legal_source,1);
    assert.equal(report.refs.metadata_complete_candidates,0);
    assert.match(html,/bukan teks pasal yang diminta/);
  }finally{globalThis.fetch=oldFetch}
});

test("Pasal 11 in-range but unreviewed: no invented nonexistence and no paid model invocation",async()=>{
  const q="Jelaskan Pasal 11 UU 7/2021 berdasarkan teks pasalnya";
  const oldFetch=globalThis.fetch;let networkCalls=0;
  globalThis.fetch=async()=>{networkCalls++;throw Error("Source-limited article must not trigger network")};
  try{
    const {status,json}=await answer(request(q));
    assert.equal(status,200,JSON.stringify(json));
    assert.equal(networkCalls,0);
    assert.equal(json.model_route,"not_invoked_missing_legal_article");
    assert.match(json.answer,/belum memiliki teks atau ringkasan tingkat pasal/i);
    assert.doesNotMatch(json.answer,/tidak terdapat sebagai pasal utama/i);
    assert.ok((json.sources||[]).every(s=>s.source_type!=="reviewed_primary_article_paraphrase"));
    const {report}=assertDraftExports(q,json);
    assert.equal(report.refs.ready_for_publication,false);
  }finally{globalThis.fetch=oldFetch}
});

test("Reviewed Pasal 1 UU 16/2016 uses actual Worker model path and preserves correct bounded primary citation",async()=>{
  const q="Jelaskan Pasal 1 UU 16/2016 tentang Persetujuan Paris";
  const oldFetch=globalThis.fetch;let providerCalls=0;
  globalThis.fetch=async(url,options)=>{
    assert.equal(String(url),"https://api.openai.com/v1/responses");
    assert.equal(options.method,"POST");
    const modelRequest=JSON.parse(options.body);
    assert.equal(modelRequest.store,false);
    providerCalls++;
    return Response.json({status:"completed",output:[{type:"message",role:"assistant",content:[
      {type:"output_text",text:"## Ringkasan Ketentuan\n\nPasal 1 UU 16/2016 mengesahkan Persetujuan Paris berdasarkan ringkasan pasal yang ditelaah [1].\n\n## Implikasi Terbatas\n\nKetentuan ratifikasi tidak otomatis membuktikan kewajiban teknis proyek energi tertentu [1].\n\n## Catatan Verifikasi Hukum\n\nNaskah yang ditelaah belum membuktikan status konsolidasi atau seluruh peraturan pelaksana [1]."}]}]});
  };
  try{
    const {status,json}=await answer(request(q));
    assert.equal(status,200,JSON.stringify(json));
    assert.equal(providerCalls,1);
    assert.ok(json.sources.length>0);
    assert.equal(json.sources[0].source_type,"reviewed_primary_article_paraphrase");
    assert.ok(json.sources[0].source_url.includes(".pdf"));
    assert.equal(json.quality_audit.legal_article_gate.pass,true);
    assert.equal(json.model_route,"direct_openai");
    assertDraftExports(q,json);
  }finally{globalThis.fetch=oldFetch}
});

test("Focused Aceh BPS Owner prompt and handler validate one source and fail closed",async()=>{
 const question="Menurut BPS Statistik Kesejahteraan Rakyat 2026 (Susenas Maret), berapa persentase rumah tangga Aceh dengan sumber utama air minum leding (Tabel 6.23), dan bagaimana SE, RSE, interval kepercayaan 95% dari tabel sampling error 9.88?";
 const good="Menurut BPS Susenas Maret 2026, estimasi rumah tangga Aceh yang menggunakan sumber utama air minum leding tercatat 7,49% (Tabel 6.23, PDF halaman 215) [1]. SE 0,33 poin persentase, RSE 4,38%, dan interval kepercayaan 95% sebesar 6,84–8,13% (Tabel 9.88, PDF halaman 434) [1]. Ini adalah perkiraan survei, bukan kepastian; sumber air minum leding tidak otomatis berarti air minum aman.";
 const env=fixtureEnv(),oldFetch=globalThis.fetch;
 let answerText=good,modelCalls=0;
 globalThis.fetch=async (url,options)=>{
  if(String(url)!=="https://api.openai.com/v1/responses")return Response.json({}, {status:404});
  modelCalls++;
  const params=JSON.parse(options.body);
  assert.equal(params.store,false);
  assert.ok(params.instructions.length<2100,"Do not inherit huge generic research prompt");
  assert.match(params.instructions,/7,49%/);
  assert.doesNotMatch(params.instructions,/600–900 words/);
  const evidence=JSON.parse(params.input[0].content[0].text).source_evidence;
  assert.equal(evidence.length,1);
  assert.equal(evidence[0].citation,"[1]");
  return Response.json({status:"completed",output:[{type:"message",role:"assistant",content:[{type:"output_text",text:answerText}]}]});
 };
 try{
  const valid=await answer(request(question),env);
  assert.equal(valid.status,200,JSON.stringify(valid.json));
  assert.equal(valid.json.sources.length,1);
  assert.equal(valid.json.sources[0].id,"bps_welfare_province_aceh");
  answerText=good.replace("RSE 4,38%","RSE 4,83%");
  const rejected=await answer(request(question),env);
  assert.equal(rejected.status,502,JSON.stringify(rejected.json));
  assert.equal(rejected.json.error,"focused_bps_statistical_answer_not_verified");
  assert.ok(rejected.json.issues.includes("RSE_absent_or_numeric_mismatch"));
  assert.equal(rejected.json.answer,undefined,"Rejected answer must never be exposed");
  assert.equal(modelCalls,2,"One mocked model request per handler call, no retries");
 }finally{globalThis.fetch=oldFetch}
});
