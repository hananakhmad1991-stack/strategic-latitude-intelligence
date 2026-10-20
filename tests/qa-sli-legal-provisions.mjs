import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

import {auditLegalArticleCitations} from "../research-api/src/legal-citation-audit.mjs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");
const registry=JSON.parse(read("data/sli-verified-legal-provisions.json"));
const graph=JSON.parse(read("data/sli-policy-regulatory-graph-2026.json"));
const pending=JSON.parse(read("data/sli-legal-review-queue.json"));
test("The 25-instrument target cannot mark four source-limited drafts as reviewed Pasal",()=>{
 assert.equal(pending.schema,"sli-legal-article-review-queue-v1");
 assert.equal(pending.goal_instruments,25);
 assert.equal(pending.reviewed_instruments,25);
 assert.equal(pending.pending_instruments,0);
 assert.equal(pending.items.length,0);
 assert.equal(pending.completed_initial_article_reviews.length,4);
 assert.match(pending.next_review_phase,/consolidation/);
 const reviewed=new Set(registry.items.map(x=>x.law_node_id));
 for(const item of pending.items){
  assert.ok(!reviewed.has(item.id),"A pending law must not silently appear as reviewed");
  assert.equal(item.current_status_certified,false);
  assert.match(item.source_url,/^https:\/\//);
  assert.match(item.status,/^pending_/);
  assert.ok(item.issue.length>45);
 }
});

/* Node 22 requires JSON import attributes; Workers/esbuild imports these local
   registry files directly. Evaluate the unchanged provision logic under Node
   with only its two JSON import declarations replaced by current fixture data. */
const originalSource=read("research-api/src/legal-provisions.mjs");
assert.match(originalSource,/import verified from/);
assert.match(originalSource,/import graph from/);
const browserNeutral=originalSource
 .replace(/import verified from "\.\.\/\.\.\/data\/sli-verified-legal-provisions\.json"(?:\s+with\s+\{[^}]+\})?;/,'const verified='+JSON.stringify(registry)+';')
 .replace(/import graph from "\.\.\/\.\.\/data\/sli-policy-regulatory-graph-2026\.json"(?:\s+with\s+\{[^}]+\})?;/,'const graph='+JSON.stringify(graph)+';');
const {legalProvisionEvidence,validateProvisionRegistry}=await import("data:text/javascript;charset=utf-8,"+encodeURIComponent(browserNeutral));

test("Verified legal corpus has bounded original-PDF passage anchors across twenty-one distinct laws",()=>{
 const v=validateProvisionRegistry();
 assert.equal(v.entries,30);
 assert.equal(v.laws,25);
 assert.equal(v.full_corpus,false);
 assert.equal(v.all_status_uncertified,true);
 assert.equal(new Set(registry.items.map(r=>r.law_node_id+"|"+r.article)).size,30);
 const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
 for(const x of registry.items){
  assert.equal(x.source_type,"official_promulgated_pdf");
  assert.equal(x.excerpt_kind,"reviewed_paraphrase_not_verbatim");
  assert.equal(x.current_status_certified,false);
  assert.match(x.source_url,/^https:\/\/(?:www\.)?peraturan\.go\.id\/|^https:\/\/peraturan\.bpk\.go\.id\/Download\/|^https:\/\/jdih\.tanjungpinangkota\.go\.id\/data_file\/|^https:\/\/jdih\.(?:pkp|kemenkoinfra)\.go\.id\//);
  assert.ok(nodes.has(x.law_node_id));
  assert.ok(x.legal_effect_limit&&x.page_reference);
 }
});
test("Legal retrieval is keyed by correct law and Pasal; ambiguous bare articles fail closed",()=>{
 const a=legalProvisionEvidence("Pasal 46 UU 27/2022 tentang pelindungan data pribadi",3);
 assert.equal(a.length,1);
 assert.equal(a[0].provision_anchor.law_node_id,"uu27pdp");
 assert.equal(a[0].provision_anchor.article,"Pasal 46");
 const b=legalProvisionEvidence("PP 71/2019 Pasal 20 publik atau privat?",5);
 assert.equal(b.length,1);
 assert.equal(b[0].provision_anchor.law_node_id,"pp71pste");
 assert.equal(b[0].provision_anchor.article,"Pasal 20");
 assert.equal(legalProvisionEvidence("Pasal 20",4).length,0);
 assert.equal(legalProvisionEvidence("Pasal 99 UU 27/2022",4).length,0);
 assert.equal(legalProvisionEvidence("Pasal 46 UU 23/2014",4).length,0);
});
test("Regional food energy investment and Paris questions retrieve their own lawful anchors",()=>{
 const q=[
 ["Apa Pasal 9 UU 23/2014 tentang pembagian urusan pemerintahan?","uu23local"],
 ["Pasal 25 UU 25/2007 perizinan penanaman modal","uu25investment"],
 ["Apa arti Pasal 12 UU 18/2012 bagi pangan lokal?","uu18food2012"],
 ["Apa tujuan ketahanan energi dalam UU 30/2007 Pasal 3?","uu30energy"],
 ["Jelaskan UU 16/2016 tentang Paris Agreement","uu16paris"]
 ];
 for(const [ask,law] of q){
  const results=legalProvisionEvidence(ask,4);
  assert.ok(results.length>0,ask);
  assert.ok(results.every(x=>x.provision_anchor.law_node_id===law),ask);
  assert.ok(results.every(x=>/NOT PRIMARY VERBATIM TEXT/.test(x.text)),ask);
 }
 const multi=legalProvisionEvidence("UU 27/2022 dan PP 71/2019 tentang pusat data",6);
 assert.ok(multi.some(x=>x.provision_anchor.law_node_id==="uu27pdp"));
 assert.ok(multi.some(x=>x.provision_anchor.law_node_id==="pp71pste"));
});
test("Legal-article citation validator forbids borrowing a Pasal from a different law",()=>{
 const a=legalProvisionEvidence("Pasal 21 PP 71/2019",3);
 assert.equal(auditLegalArticleCitations("Pasal 21 PP 71/2019 membahas lingkup privat [1].",a).pass,true);
 assert.equal(auditLegalArticleCitations("Pasal 21 UU 27/2022 membahas lingkup privat [1].",a).pass,false);
 assert.equal(auditLegalArticleCitations("Pasal 20 PP 71/2019 membahas lingkup publik [1].",a).pass,false);
 assert.equal(auditLegalArticleCitations("Pasal 21 ayat (3) PP 71/2019 [1].",a).pass,false);
});
test("Public legal reader has real article search and does not substitute index metadata for PDF",async()=>{
 const html=read("policy-regulatory-intelligence.html");
 assert.match(html,/id="policyVerifiedProvisions"/);
 assert.match(html,/id="policyProvisionQuery"/);
 assert.match(html,/sli-legal-provisions\.js/);
 assert.match(html,/sli-legal-provisions\.css/);
 const elements=new Map();
 class Element{
  constructor(tag="div"){this.tagName=tag;this.children=[];this.value="";this.textContent="";this.attrs={};this.handlers={};this.href="";}
  append(...items){this.children.push(...items)}
  replaceChildren(...items){this.children=items}
  addEventListener(k,cb){this.handlers[k]=cb}
  setAttribute(k,v){this.attrs[k]=v}
 }
 const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id)};
 const document={getElementById:get,createElement:tag=>new Element(tag),addEventListener(k,cb){if(k==="DOMContentLoaded")this.start=cb}};
 const context={document,fetch:async()=>({ok:true,json:async()=>registry}),URL,console};
 vm.runInNewContext(read("js/sli-legal-provisions.js"),context);
 await document.start();
 for(let i=0;i<12;i++)await Promise.resolve();
 assert.equal(get("policyProvisionCount").textContent,30);
 assert.equal(get("policyProvisionList").children.length,30);
 get("policyProvisionLaw").value="pp71pste";
 get("policyProvisionLaw").handlers.change();
 assert.equal(get("policyProvisionList").children.length,2);
 get("policyProvisionQuery").value="pengawasan";
 get("policyProvisionQuery").handlers.input();
 assert.equal(get("policyProvisionList").children.length,1);
 const links=get("policyProvisionList").children[0].children.at(-1).children;
 assert.equal(links[0].rel,"noopener noreferrer");
 assert.match(links[0].href,/\.pdf$/);
 assert.match(links[1].href,/law=pp71pste/);
});

test("Expanded legal retrieval separates Perpres, PP, UU with same Pasal number",()=>{
 const p=legalProvisionEvidence("Perpres 110/2025 Pasal 2 tentang nilai ekonomi karbon",4);
 assert.equal(p.length,1);
 assert.equal(p[0].provision_anchor.law_node_id,"pres110carbon");
 const q=legalProvisionEvidence("PP 40/2025 Pasal 2 kebijakan energi",4);
 assert.equal(q.length,1);
 assert.equal(q[0].provision_anchor.law_node_id,"pp40");
 assert.equal(legalProvisionEvidence("Perpres 110/2025 Pasal 99",4).length,0);
 const withoutSpecific=legalProvisionEvidence("Pasal 2 tentang energi",5);
 assert.equal(withoutSpecific.length,0,"Ambiguous article without law should never ground current obligations");
});

test("All four formerly pending original Pasal are instrument-specific and avoid assertions of current amended law",()=>{
 for (const [ref,law,article] of [
  ["PP 28/2025 Pasal 4","pp28","Pasal 4"],
  ["PP 22/2021 Pasal 1","pp22env","Pasal 1"],
  ["PP 21/2021 Pasal 2","pp21spatial","Pasal 2"],
  ["UU 7/2021 Pasal 1","uu7hpp","Pasal 1"]
 ]){
  const hits=legalProvisionEvidence(ref,4);
  assert.equal(hits.length,1,ref);
  assert.equal(hits[0].provision_anchor.law_node_id,law,ref);
  assert.equal(hits[0].provision_anchor.article,article,ref);
  assert.match(hits[0].text,/NOT PRIMARY VERBATIM TEXT OR CURRENT CONSOLIDATED LAW/);
  assert.match(hits[0].text,/Current legal status NOT CERTIFIED/);
 }
 assert.equal(legalProvisionEvidence("Pasal 4",4).length,0);
 assert.equal(legalProvisionEvidence("UU 7/2021 Pasal 99",4).length,0);
 assert.ok(pending.completed_initial_article_reviews.every(x=>x.review_status.includes("not_current_status_certified")));
});
