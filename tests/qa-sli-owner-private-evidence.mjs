import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {draftOwnerClaimAudit,saveOwnerPrivateEvidence,ownerReviewMarkdown} from "../scripts/sli-owner-private-evidence.mjs";

const url="https://peraturan.go.id/files/uu16-2016bt.pdf";
const source={
 id:"sli_uu16_paris_pasal1",title:"UU 16/2016, Pasal 1 — reviewed original paraphrase",
 publisher:"Peraturan.go.id / Lembaran Negara RI",source_date:"2026-10-19",
 source_url:url,source_type:"reviewed_primary_article_paraphrase",
 provision_anchor:{instrument_ref:"UU 16/2016",article:"Pasal 1"}
};
const question="Jelaskan Pasal 1 UU 16/2016 tentang Persetujuan Paris";
const goodAnswer="## Ringkasan\n\nPasal 1 UU 16/2016 mengesahkan Persetujuan Paris atas UNFCCC, berdasarkan naskah yang diterbitkan [1].\n\n## Batasan\n\nPengesahan tidak secara otomatis menerbitkan izin untuk setiap proyek energi [1].";
test("Per-sentence review never certifies semantic truth even for matching PDF reference",()=>{
 const a=draftOwnerClaimAudit({question,answer:goodAnswer,sources:[source]});
 assert.equal(a.verdict,"DRAFT_NOT_CERTIFIED");
 assert.equal(a.source_verification_status,"HUMAN_REVIEW_REQUIRED");
 assert.equal(a.full_sentence_semantic_verification,false);
 assert.ok(a.claim_count>=2);
 assert.ok(a.claims.every(x=>x.status==="HUMAN_PRIMARY_SOURCE_REVIEW_REQUIRED"));
 assert.ok(a.claims.every(x=>x.primary_match_numbers.includes(1)));
 assert.ok(a.claims.every(x=>x.original_pdf_review==="PENDING_HUMAN_CHECK"));
 assert.match(ownerReviewMarkdown(a),/Open original official PDF/);
});
test("Flag unsupported citation, uncited sentence, different Pasal and current consolidated claims",()=>{
 const a=draftOwnerClaimAudit({question,answer:
   "Pasal 1 UU 16/2016 mengesahkan Paris [99].\n\n"+
   "Pasal 2 UU 16/2016 sudah berlaku saat ini tanpa perubahan.\n\n"+
   "Pasal 1 UU 16/2016 mengesahkan perjanjian [1].",sources:[source]});
 assert.ok(a.claims.some(x=>x.risk_flags.includes("citation_index_out_of_range")));
 assert.ok(a.claims.some(x=>x.risk_flags.includes("citation_missing_in_sentence")));
 assert.ok(a.claims.some(x=>x.risk_flags.includes("mentions_different_unreviewed_article")));
 assert.ok(a.claims.some(x=>x.risk_flags.includes("current_operative_law_requires_separate_check")));
});
test("Local capture saves actual answer and source pointers, but NEVER secrets or false approval",()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),"sli-owner-private-audit-fixture-"));
 const fakeSecret="super_secret_token_must_never_be_persisted_123456";
 try{
  const x=saveOwnerPrivateEvidence({question,response:{
    answer:goodAnswer,sources:[source],charts:[],OWNER_TEST_TOKEN:fakeSecret,
    OPENAI_API_KEY:fakeSecret,headers:{authorization:fakeSecret}
   },outputBase:parent,renderPdf:false});
  assert.ok(x.directory.startsWith(parent+path.sep));
  assert.equal(x.pdf.created,false);
  const names=fs.readdirSync(x.directory).sort();
  for(const name of ["report.html","report.docx","answer.txt","claim-review.json","claim-review.md","manifest.json"])
    assert.ok(names.includes(name),name);
  const manifest=JSON.parse(fs.readFileSync(path.join(x.directory,"manifest.json"),"utf8"));
  const review=JSON.parse(fs.readFileSync(path.join(x.directory,"claim-review.json"),"utf8"));
  assert.equal(manifest.owner_token_saved,false);
  assert.equal(manifest.report_ready_for_publication,false);
  assert.ok(manifest.answer_sha256.length===64);
  assert.equal(review.verdict,"DRAFT_NOT_CERTIFIED");
  assert.equal(review.claim_count,x.claims);
  assert.equal(fs.readFileSync(path.join(x.directory,"answer.txt"),"utf8"),goodAnswer+"\n");
  assert.ok(fs.readFileSync(path.join(x.directory,"report.html"),"utf8").includes("DRAF BERBANTUAN AI"));
  assert.ok(fs.readFileSync(path.join(x.directory,"report.docx")).length>2500);
  for(const filename of names.filter(x=>x!== "report.docx")){
    const file=fs.readFileSync(path.join(x.directory,filename),"utf8");
    assert.ok(!file.includes(fakeSecret),filename);
  }
 }finally{fs.rmSync(parent,{recursive:true,force:true})}
});
test("No generated private evidence is allowed inside repository",()=>{
 const target=path.join(process.cwd(),"_secret_owner_temp_test");
 assert.throws(()=>saveOwnerPrivateEvidence({question,response:{answer:goodAnswer,sources:[source]},outputBase:target,renderPdf:false}),
   /outside_repo/);
 assert.equal(fs.existsSync(target),false);
});
test("Live smoke requires explicit paid opt-in before private capture",()=>{
 const script=new URL("../scripts/qa-owner-staging-live.mjs",import.meta.url);
 const r=spawnSync(process.execPath,[script.pathname,"--save-private-report"],{
   env:{...process.env,SLI_OWNER_TEST_TOKEN:""},
   encoding:"utf8",timeout:10000
 });
 assert.equal(r.status,2);
 assert.match(r.stderr,/requires explicit --include-paid-model/);
});
