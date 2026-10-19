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
 assert.match(worker,/import \{policyLegalEvidence\}/);
 assert.match(worker,/legalEvidence=legalQuestion\?selectResearchEvidence/);
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
test("modified source modules pass the JavaScript parser",()=>{
 for(const path of ["js/sli-policy-assistant.js","js/sli-research-assistant.js","js/sli-regulatory-explorer.js","research-api/src/policy-corpus.mjs","research-api/src/owner-test-worker.mjs"]){
  const p=spawnSync(process.execPath,["--check",new URL("../"+path,import.meta.url).pathname],{encoding:"utf8"});
  assert.equal(p.status,0,path+": "+p.stderr);
 }
});
