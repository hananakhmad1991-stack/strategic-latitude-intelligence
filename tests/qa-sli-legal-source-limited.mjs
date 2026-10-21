import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {missingLegalArticleBrief} from "../research-api/src/legal-source-limited.mjs";
import {auditLegalArticleCitations} from "../research-api/src/legal-citation-audit.mjs";
import {legalProvisionEvidence} from "../research-api/src/legal-provisions.mjs";
import {makeResearchReport} from "../js/sli-report-content.mjs";
import {printableResearchHtml} from "../js/sli-report-pdf.mjs";
import {docxBytes} from "../js/sli-report-docx.mjs";

const metadata={
 id:"policy_law_uu7hpp",title:"UU 7/2021 · Harmonisasi Peraturan Perpajakan (HPP)",
 publisher:"Pemerintah Republik Indonesia",
 source_url:"https://peraturan.bpk.go.id/Details/185162/uu-no-7-tahun-2021",
 source_date:"2026-10-20",period:"2026 SLI index; not a consolidated statute"
};
const reviewed={
 id:"primary_uu7hpp_pasal1",
 source_url:"https://peraturan.bpk.go.id/Download/178620/UU%20Nomor%207%20Tahun%202021.pdf",
 provision_anchor:{instrument_ref:"UU 7/2021",article:"Pasal 1"}
};
const answer=(q,documents=[metadata],reviewedArticles=[reviewed])=>missingLegalArticleBrief({
 question:q,articleEvidence:reviewedArticles,policyEvidence:documents,language:"id"
});
test("Nonexistent Pasal 99 of original UU 7/2021 returns publisher-anchored structural absence without fake legal claims",()=>{
 const r=answer("Jelaskan Pasal 99 UU 7/2021. Jika pasalnya tidak tersedia, jangan mengarang.");
 assert.equal(r.source_limited,true);
 assert.equal(r.model_called,false);
 assert.equal(r.article_text_verified,false);
 assert.equal(r.sources.length,1);
 assert.equal(r.sources[0].source_type,"official_original_statute_structure_only");
 assert.equal(r.sources[0].source_url,"https://pajak.go.id/index.php/id/peraturan/harmonisasi-peraturan-perpajakan");
 assert.equal(auditLegalArticleCitations(r.answer,r.sources).pass,true);
 assert.match(r.answer,/^## Keberadaan pasal: Pasal 99 UU 7\/2021/m);
 assert.match(r.answer,/pasal utama bernomor 1 sampai 19/);
 assert.match(r.answer,/tidak terdapat sebagai pasal utama/i);
 assert.match(r.answer,/tidak menyusun isi atau kewajiban hukum/i);
 assert.doesNotMatch(r.answer,/Pasal 99 .*mengatur|Pasal 99 .*mewajibkan/i);
 assert.doesNotMatch(r.answer,/\n\n(?:##[^\n]+\n\n)?(?:\*|•|-\s*)?\n/);
 assert.equal((r.answer.match(/^## /gm)||[]).length,3);
});
test("Only exactly one requested law and article triggers the deterministic guard",()=>{
 assert.equal(answer("Pasal 1 UU 7/2021"),null,"Known reviewed article must go to normal model");
 assert.equal(answer("Apa isi UU 7/2021"),null,"Broad question must not be treated as a specific missing Pasal");
 assert.equal(answer("Jelaskan Pasal 99 tanpa nama UU"),null,"Bare article numbers are ambiguous");
 assert.equal(answer("UU 7/2021 Pasal 99 dan Pasal 1"),null,"Multi-article query requires separate analysis");
 assert.equal(answer("UU 7/2021 Pasal 99 dan PP 28/2025"),null,"Multi-law question requires separate analysis");
 assert.ok(answer("UU No. 7 Tahun 2021 Pasal 99")?.source_limited);
});
test("No matching law index cannot be converted into a fabricated legal citation",()=>{
 const r=answer("Jelaskan Pasal 99 UU 7/2021",[{...metadata,id:"policy_law_pp28",title:"PP 28/2025 · Licensing"}],[]);
 assert.equal(r.sources.length,1);
 assert.match(r.answer,/\[1\]/);
 assert.equal(r.sources[0].source_type,"official_original_statute_structure_only");
 assert.equal(r.model_called,false);
});
test("Source-limited legal export explicitly distinguishes law metadata from a reviewed Pasal source",()=>{
 const r=answer("Jelaskan Pasal 99 UU 7/2021");
 const doc=makeResearchReport({question:"Jelaskan Pasal 99 UU 7/2021",mode:"deep_research",
  answer:r.answer,sources:r.sources,language:"id",generatedAt:"2026-10-20T00:00:00Z",
  title:"Status Korpus SLI untuk Pasal 99 UU 7/2021"});
 assert.equal(doc.report_scope,"focused_legal_article");
 assert.equal(doc.refs.cited_unique,1);
 assert.equal(doc.refs.metadata_only_legal_index,0);
 assert.equal(doc.refs.structure_only_legal_source,1);
 assert.equal(doc.refs.metadata_complete_candidates,0);
 assert.equal(doc.refs.meets_preliminary_minimum,false);
 assert.equal(doc.refs.ready_for_publication,false);
 assert.match(doc.refs.warning,/struktur naskah UU/);
 assert.match(doc.refs.warning,/bukan teks pasal yang diminta/);
 const print=printableResearchHtml(doc);
 assert.match(print,/Sumber dan Referensi/);
 assert.match(print,/struktur naskah UU/);
 assert.match(print,/DRAF BERBANTUAN AI/);
 assert.match(print,/UU 7\/2021/);
 assert.doesNotMatch(print,/belum bisa memberi:/i);
 assert.doesNotMatch(print,/target minimum 1/);
 const word=docxBytes(doc);
 assert.ok(word.byteLength>3000);
});
test("Worker source excludes speculative model run for single missing Pasal and owner deploy workflow validates safeguard",()=>{
 const worker=fs.readFileSync(new URL("../research-api/src/owner-test-worker.mjs",import.meta.url),"utf8");
 const action=fs.readFileSync(new URL("../.github/workflows/sli-owner-worker-deploy.yml",import.meta.url),"utf8");
 assert.match(worker,/missingLegalArticleBrief/);
 const bypass=worker.indexOf('if(absentArticle){');
 assert.ok(bypass>=0&&bypass<worker.indexOf("const params=modelRequest("));
 assert.match(worker,/model_route:"not_invoked_missing_legal_article"/);
 assert.match(worker,/article_text_verified:false/);
 assert.match(action,/qa-sli-legal-source-limited\.mjs/);
});

test("Full formal names, abbreviations, and duplicated same-law mentions resolve to one Pasal identity",()=>{
 const formal={...metadata,title:"Undang-Undang Nomor 7 Tahun 2021 · Harmonisasi Peraturan Perpajakan"};
 const r=answer("Jelaskan Pasal 99 Undang-Undang Nomor 7 Tahun 2021", [formal], []);
 assert.equal(r.request.law_ref,"UU 7/2021");
 assert.equal(r.sources.length,1,"formal legal index should match the canonical identity");
 assert.equal(r.sources[0].source_type,"official_original_statute_structure_only");
 assert.equal(r.model_called,false);
 assert.equal(auditLegalArticleCitations(r.answer,[]).pass,true);
 const repeated=answer("Jelaskan Pasal 99 UU 7/2021 (Undang-Undang Nomor 7 Tahun 2021)",[formal],[]);
 assert.equal(repeated.request.law_ref,"UU 7/2021");
 assert.equal(repeated.sources.length,1);
 const pp=answer("Jelaskan Pasal 99 Peraturan Pemerintah Nomor 28 Tahun 2025",[],[]);
 assert.equal(pp.request.law_ref,"PP 28/2025");
 assert.equal(pp.sources.length,0);
 const perpres=answer("Jelaskan Article 99 Peraturan Presiden Nomor 110 Tahun 2025",[],[]);
 assert.equal(perpres.request.law_ref,"Perpres 110/2025");
});
test("Structural check only covers verified article range of original UU HPP",()=>{
 const unknown=answer("Jelaskan Pasal 11 UU 7/2021",[],[]);
 assert.equal(unknown?.review_scope,"indexed_law_metadata_only_no_reviewed_article");
 assert.equal(unknown?.sources.length,0);
 const absent=answer("Jelaskan Pasal 20 UU 7/2021",[],[]);
 assert.equal(absent?.article_existence,"not_in_original_promulgated_instrument");
 assert.equal(absent?.model_called,false);
 const different=answer("Jelaskan Pasal 99 PP 28/2025",[],[]);
 assert.equal(different?.article_existence,undefined);
 const ambiguous=answer("Jelaskan Pasal 19A UU 7/2021",[],[]);
 assert.equal(ambiguous?.article_existence,undefined);
});
test("Existing reviewed Pasal is not accidentally withheld when user spells out full law name",()=>{
 const question="Jelaskan Pasal 1 Undang-Undang Nomor 16 Tahun 2016";
 const records=legalProvisionEvidence(question,3);
 assert.ok(records.some(s=>s.provision_anchor?.instrument_ref==="UU 16/2016"&&s.provision_anchor?.article==="Pasal 1"),
  "reviewed Pasal 1 must be retrieved with full formal law name");
 const guarded=missingLegalArticleBrief({question,articleEvidence:records,policyEvidence:[]});
 assert.equal(guarded,null,"matched reviewed Pasal must proceed through normal cited-answer audit");
});
test("Formal law name source-limited report has substantive text after every heading and never counts index-only metadata",()=>{
 const q="Apa isi Pasal 99 Undang-Undang Nomor 7 Tahun 2021?";
 const r=answer(q,[{...metadata,title:"Undang-Undang Nomor 7 Tahun 2021 · HPP"}],[]);
 const doc=makeResearchReport({question:q,answer:r.answer,sources:r.sources,language:"id"});
 assert.equal(doc.report_scope,"focused_legal_article");
 assert.equal(doc.refs.required_minimum,1);
 assert.equal(doc.refs.metadata_complete_candidates,0);
 assert.equal(doc.refs.metadata_only_legal_index,0);
 assert.equal(doc.refs.structure_only_legal_source,1);
 assert.equal(doc.refs.ready_for_publication,false);
 for(let i=0;i<doc.body.length;i++){
  if(!/^h[1-3]$/.test(doc.body[i].type))continue;
  const next=doc.body[i+1];
  assert.equal(next?.type,"p","No orphan heading after report parsing");
  assert.ok(next?.text?.length>50,"Each legal heading needs a meaningful supporting paragraph");
 }
 const html=printableResearchHtml(doc);
 assert.match(html,/struktur naskah UU/);
 assert.match(html,/DRAF BERBANTUAN AI/);
 assert.doesNotMatch(html,/target minimum 1/);
 assert.ok(docxBytes(doc).byteLength>3000);
});
