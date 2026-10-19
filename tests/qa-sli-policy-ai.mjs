/* Tests for the staged Policy evidence assistant and legal RAG boundary.
 * Run with: node --test tests/qa-sli-policy-ai.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
const file=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const graph=JSON.parse(file("data/sli-policy-regulatory-graph-2026.json"));
const html=file("policy-regulatory-intelligence.html");
const front=file("js/sli-policy-assistant.js");
const handoff=file("js/sli-research-assistant.js");
const worker=file("research-api/src/owner-test-worker.mjs");
const policyBridge=file("research-api/src/policy-corpus.mjs");
test("public legal graph is coherent, sourced, and not falsely exhaustive",()=>{
 assert.ok(graph.nodes.length>=70);
 assert.equal(new Set(graph.nodes.map(n=>n.id)).size,graph.nodes.length);
 const ids=new Set(graph.nodes.map(n=>n.id));
 for(const edge of graph.edges){assert.ok(ids.has(edge.from)&&ids.has(edge.to),JSON.stringify(edge));}
 for(const n of graph.nodes.filter(n=>n.kind!=="tier_marker")){
  assert.match(n.source,/^https:\/\//);
  assert.ok(n.status);
 }
 assert.match(graph.methodology.exhaustiveness,/NOT every Indonesian legal instrument/i);
 assert.ok(ids.has("uu16paris"),"Paris Agreement implementing statute indexed");
 assert.ok(ids.has("uu23local"),"Local Government Law indexed");
 assert.ok(graph.edges.some(e=>e.from==="uu23local"||e.to==="uu23local"),"local government law has relations");
 assert.ok(graph.edges.some(e=>e.from==="uu16paris"||e.to==="uu16paris"),"Paris Law has legal context");
});
test("ask policy panel is visible, valid, and source-first",()=>{
 for(const id of ["paForm","paAsk","paAskButton","paReady","paSummary","paEvidenceSection","paEvidence","paOpenResearch"]){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(html,/sli-policy-assistant\.js/);
 assert.match(html,/sli-policy-assistant\.css/);
 assert.match(front,/source\s+link|Sumber resmi|Sumber/i);
 assert.match(front,/deterministic_legal_evidence_preview/);
 assert.match(front,/generation_requires_authenticated_backend:true/);
 assert.match(front,/not.*legal|bukan.*analisis hukum/i);
 assert.doesNotMatch(front,/OPENAI_API_KEY|Bearer\s+sk-/);
});
test("owner RAG holds legal-index boundaries and never auto-enables customer access",()=>{
 assert.match(worker,/import \{policyLegalEvidence,selectPolicyEvidence\}/);
 assert.match(worker,/legalEvidence=legalQuestion\?selectPolicyEvidence/);
 assert.match(policyBridge,/export function selectPolicyEvidence/);
 assert.match(worker,/LEGAL EVIDENCE BOUNDARY/);
 assert.match(worker,/OWNER_TEST_TOKEN/);
 assert.match(policyBridge,/full official statute has NOT been provided/i);
 assert.match(policyBridge,/No confirmed amendment\/repeal link/);
 assert.match(policyBridge,/enacted.*NOT proof/i);
 assert.match(handoff,/sessionStorage\.removeItem\("sli-policy-research-handoff"\)/);
 assert.match(handoff,/Never auto-submit a legal question/);
 const config=JSON.parse(file("data/sli-research-assistant-config.json"));
 assert.equal(config.api_enabled,false,"subscriber service remains disabled");
 assert.equal(config.login_enabled,false,"subscriber service remains disabled");
});
test("JDIH completeness dashboard reports gaps across exactly 38 provinces",()=>{
 const coverage=JSON.parse(file("data/sli-policy-source-coverage.json"));
 assert.equal(coverage.provinces.length,38);
 assert.equal(new Set(coverage.provinces.map(p=>p.name)).size,38);
 assert.ok(coverage.provinces.some(p=>p.source_url===null),"incomplete source discovery must be disclosed");
 assert.ok(coverage.provinces.filter(p=>p.source_url).every(p=>/^https:\/\//.test(p.source_url)));
 assert.match(coverage.metadata_policy,/never counted as no law/i);
 assert.match(html,/id="policyCoverageDashboard"/);
 assert.match(html,/js\/sli-policy-coverage\.js/);
 const coverageClient=file("js/sli-policy-coverage.js");
 assert.match(coverageClient,/coverage_schema/);
 assert.match(coverageClient,/portal.*belum|Perlu penelusuran/i);
});
test("primary article reference pilot preserves law-to-article and source provenance",()=>{
 const articleDb=JSON.parse(file("data/sli-verified-legal-provisions.json"));
 const bridge=file("research-api/src/legal-provisions.mjs");
 const ids=new Set(graph.nodes.map(n=>n.id));
 assert.equal(articleDb.schema,"sli-legal-provisions-v1");
 assert.ok(articleDb.items.length>=2);
 for(const provision of articleDb.items){
  assert.ok(ids.has(provision.law_node_id));
  assert.match(provision.source_url,/^https:\/\//);
  assert.match(provision.article,/^Pasal\s+[0-9]+/);
  assert.equal(provision.current_status_certified,false);
  assert.equal(provision.excerpt_kind,"reviewed_paraphrase_not_verbatim");
  assert.ok(provision.page_reference);
  assert.match(provision.instrument_ref,/^UU\s+\d+\/\d{4}$/);
 }
 assert.match(bridge,/legalProvisionEvidence/);
 assert.match(worker,/import \{legalProvisionEvidence\}/);
 assert.match(worker,/ARTICLE CITATIONS/);
 assert.match(worker,/\.\.\.articleEvidence,\.\.\.legalEvidence/);
});
test("unsupported article citations fail closed in owner-only legal model output", async()=>{
 const {auditLegalArticleCitations,recoverUnsupportedLegalAnswer}=await import("../research-api/src/legal-citation-audit.mjs");
 const source={source_url:"https://peraturan.go.id/files/uu16-2016bt.pdf",provision_anchor:{article:"Pasal 1",instrument_ref:"UU 16/2016"}};
 assert.equal(auditLegalArticleCitations("Pasal 1 UU 16/2016 mengesahkan perjanjian [1].",[source]).pass,true);
 assert.equal(auditLegalArticleCitations("Pasal 9 UU 16/2016 mensyaratkan izin [1].",[source]).pass,false);
 assert.equal(auditLegalArticleCitations("Article 3 UU 16/2016 [1].",[source]).pass,false);
 assert.equal(auditLegalArticleCitations("Pasal 1 UU 23/2014 [1].",[source]).pass,false);
 assert.equal(auditLegalArticleCitations("Pasal 1 mengesahkan perjanjian [1].",[source]).pass,true);
 assert.equal(auditLegalArticleCitations("Perlu verifikasi naskah resmi dan ketentuan peralihan.",[source]).pass,true);
 assert.equal(auditLegalArticleCitations("Pasal 1 mengesahkan persetujuan [1].",[source]).pass,true);
 assert.equal(auditLegalArticleCitations("Pasal 1 UU Nomor 16 Tahun 2016 [1].",[source]).pass,true);
 assert.equal(auditLegalArticleCitations("Pasal 1 UU No. 23 Tahun 2014 [1].",[source]).pass,false);
 assert.equal(auditLegalArticleCitations("Pasal 1 ayat (2) UU 16/2016 [1].",[source]).pass,false);
 assert.equal(auditLegalArticleCitations("### 2) Isi Pasal 1: Makna pengesahan", [source]).pass,true,"Headings alone should not be interpreted as statutory claims");
 const recovery=recoverUnsupportedLegalAnswer("Pasal 9 UU 16/2016 membutuhkan bukti lain [1].",[source]);
 assert.equal(recovery.recovered,true);
 assert.equal(recovery.source_limited,true);
 assert.equal(recovery.audit.pass,true);
 assert.match(recovery.answer,/pemeriksaan sumber hukum/i);
 assert.doesNotMatch(recovery.answer,/Pasal 9/);
 const orphan=recoverUnsupportedLegalAnswer("### Pasal 1\n\nPasal 1 UU 16/2016 mengesahkan Persetujuan Paris sebagai dasar ratifikasi perjanjian internasional dan naskah terjemahannya dilampirkan dalam peraturan tersebut [1].\n\n### Klaim Pasal 9\n\nPasal 9 tidak didukung [1].",[source]);
 assert.equal(orphan.audit.pass,true);
 assert.doesNotMatch(orphan.answer,/### Klaim Pasal 9/);
 assert.match(orphan.answer,/### Pasal 1/);
 assert.match(worker,/recoverUnsupportedLegalAnswer/);
});
test("focused statute AI excludes irrelevant monitoring evidence and charts",()=>{
 assert.match(worker,/const focusedArticleReading=legalQuestion/);
 assert.match(worker,/focusedArticleReading\?\[\]:selectResearchEvidence/);
 assert.match(worker,/focusedArticleReading\?\[\]:selectMonitoringNewsEvidence/);
 assert.match(worker,/charts:focusedArticleReading\?\[\]:/);
 assert.match(worker,/secondary_news_index_count:focusedArticleReading\?0:/);
});
test("legal research references preserve original law year and readable source panel",()=>{
 const client=file("js/sli-research-assistant.js");
 const css=file("css/sli-research-brand.css");
 const start=client.indexOf("function apaEntry(s){");
 const end=client.indexOf("\nfunction reportBody",start);
 assert.ok(start>=0&&end>start);
 const format=new Function("return "+client.slice(start,end))();
 const entry=format({title:"UU 16/2016, Pasal 1 — penjelasan terbatas tingkat pasal",publisher:"Lembaran Negara RI",source_type:"reviewed_primary_article_paraphrase",source_date:"2026-10-19",source_url:"https://peraturan.go.id/files/uu16-2016bt.pdf"});
 assert.match(entry,/\(2016\)/);
 assert.doesNotMatch(entry,/\(2026\)/);
 assert.match(entry,/UU 16\/2016, Pasal 1/);
 const begin=client.indexOf("function reportBody(answer){"),finish=client.indexOf("\nfunction renderModelStatement",begin);
 assert.ok(begin>=0&&finish>begin);
 const cleanReport=new Function("return "+client.slice(begin,finish))();
 const clean=cleanReport("### Ringkasan\n\nAnalisis Pasal 1 [1].\n\n### Sumber / Evidence Panel\n\n- [1] tautan sumber\n\n### Batas verifikasi hukum\n\nPerlu pemeriksaan resmi.");
 assert.doesNotMatch(clean,/Sumber \/ Evidence Panel|tautan sumber/);
 assert.match(clean,/Batas verifikasi hukum/);
 assert.match(css,/Research sources: dark Navy/);
 assert.match(css,/#raSourcesPanel>h3/);
});
test("research conversation presents readable disclosures without unrelated sector cards",()=>{
 const html=file("sli-research-ai.html");
 const client=file("js/sli-research-assistant.js");
 const css=file("css/sli-research-brand.css");
 assert.doesNotMatch(html,/<script[^>]+src="\.\/js\/sli-contextual-briefs\.mjs/);
 assert.match(html,/<details id="raModelStatement"[^>]*hidden/);
 assert.match(html,/data-id="Catatan metode/);
 assert.match(client,/if\(!statement&&!legalAudit\?\.recovered\)/);
 assert.match(css,/#raFollowupPanel textarea/);
 assert.match(css,/#raConversation #raModelStatementBody/);
 assert.match(html,/20261019-legal-cohesion1/);
});
test("modified source modules pass the JavaScript parser",()=>{
 for(const path of ["js/sli-policy-assistant.js","js/sli-research-assistant.js","js/sli-regulatory-explorer.js","js/sli-policy-coverage.js","research-api/src/legal-provisions.mjs","research-api/src/legal-citation-audit.mjs","research-api/src/policy-corpus.mjs","research-api/src/owner-test-worker.mjs"]){
  const p=spawnSync(process.execPath,["--check",new URL("../"+path,import.meta.url).pathname],{encoding:"utf8"});
  assert.equal(p.status,0,path+": "+p.stderr);
 }
});
