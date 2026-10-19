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
 }
 assert.match(bridge,/legalProvisionEvidence/);
 assert.match(worker,/import \{legalProvisionEvidence\}/);
 assert.match(worker,/ARTICLE CITATIONS/);
 assert.match(worker,/\.\.\.articleEvidence,\.\.\.legalEvidence/);
});
test("unsupported article citations fail closed in owner-only legal model output", async()=>{
 const {auditLegalArticleCitations}=await import("../research-api/src/legal-citation-audit.mjs");
 const source={source_url:"https://peraturan.go.id/files/uu16-2016bt.pdf",provision_anchor:{article:"Pasal 1"}};
 assert.equal(auditLegalArticleCitations("Pasal 1 mengesahkan perjanjian [1].",[source]).pass,true);
 assert.equal(auditLegalArticleCitations("Pasal 9 mensyaratkan izin [1].",[source]).pass,false);
 assert.equal(auditLegalArticleCitations("Article 3 of the law [1].",[source]).pass,false);
 assert.equal(auditLegalArticleCitations("Perlu verifikasi naskah resmi dan ketentuan peralihan.",[source]).pass,true);
 assert.match(worker,/unsupported_article_citation/);
});
test("modified source modules pass the JavaScript parser",()=>{
 for(const path of ["js/sli-policy-assistant.js","js/sli-research-assistant.js","js/sli-regulatory-explorer.js","js/sli-policy-coverage.js","research-api/src/legal-provisions.mjs","research-api/src/legal-citation-audit.mjs","research-api/src/policy-corpus.mjs","research-api/src/owner-test-worker.mjs"]){
  const p=spawnSync(process.execPath,["--check",new URL("../"+path,import.meta.url).pathname],{encoding:"utf8"});
  assert.equal(p.status,0,path+": "+p.stderr);
 }
});
