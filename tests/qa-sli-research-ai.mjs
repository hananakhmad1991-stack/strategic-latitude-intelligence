import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {rankEvidence,validateResearchQuestion,extractModelText,citationsValid} from "../research-api/src/core.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const corpus=JSON.parse(read("data/sli-research-evidence-preview.json"));
test("Research AI published page is a sourced, honest, bilingual Open preview",()=>{
 const h=read("sli-research-evidence-preview.html"),index=read("index.html"),nav=read("js/sli-navigation.js");
 assert.match(h,/SLI Research AI/);
 assert.match(h,/BUKAN AI generatif/);
 assert.match(h,/private backend|backend privat/);
 assert.match(h,/raQuestion/);assert.match(h,/raSources/);
 assert.ok(index.includes("sli-research-ai.html"));
 assert.ok(nav.includes("research:['Research AI"));
 for(const name of ["sli-live-data.js","sli-shared-appendix.js","sli-navigation.js","sli-research-ai.js"]){
  assert.equal(h.split(name).length-1,1,"Exactly one script: "+name);
 }
 assert.equal((h.match(/<article\b/g)||[]).length,(h.match(/<\/article>/g)||[]).length);
});
test("Open corpus only exposes limited source citations and never private Pro materials",()=>{
 assert.equal(corpus.access,"open_preview");
 assert.equal(corpus.generation_mode,"deterministic_source_grounded_analytical_synthesis_no_live_llm");
 assert.ok(corpus.documents.length>=18&&corpus.documents.length<=35);
 const ids=corpus.documents.map(x=>x.id);
 assert.equal(new Set(ids).size,ids.length);
 assert.ok(corpus.documents.every(x=>x.access==="open_preview"&&/^https:\/\//.test(x.source_url)&&x.source_date&&x.period&&x.text));
 assert.ok(corpus.documents.filter(x=>x.topic==="regional").length<=5,"No complete 38-province dataset in preview");
 const m=JSON.parse(read("data/sli-membership-plans.json"));
 assert.match(m.research_ai.open_status,/not_generative/);
 assert.match(m.research_ai.pro_status,/planned/);
 assert.equal(m.checkout_enabled,false);
 assert.equal(m.policy.single_device_limit_is_live,false);
});
test("Future RAG core rejects weak queries, ranks only private entitled records and enforces citations",()=>{
 assert.equal(validateResearchQuestion("abc"),null);
 assert.equal(validateResearchQuestion("what changed in the energy sector?"),"what changed in the energy sector?");
 assert.equal(validateResearchQuestion("x".repeat(501)),null);
 const items=[
  {id:"p1",title:"Data center West Java",text:"Planned 120 MW capacity; this is not operating power",source_url:"https://example.org",period:"2026",source_date:"2026-10-17",publisher:"Publisher",topic:"ai",geo:"West Java",access:"pro"},
  {id:"e1",title:"Institutional brief",text:"Data center West Java enterprise report",source_url:"https://example.org",period:"2026",source_date:"2026-10-17",publisher:"Publisher",topic:"ai",geo:"West Java",access:"enterprise"},
  {id:"public",title:"Data center",text:"example",source_url:"https://example.org",access:"open_preview"}
 ];
 const pro=rankEvidence(items.filter(d=>d.access==="pro"),"West Java data center");
 assert.equal(pro.length,1);assert.equal(pro[0].id,"p1");
 const all=rankEvidence(items,"West Java data center");
 assert.equal(all.length,2,"Open preview is never read from private R2");
 assert.equal(citationsValid("Capacity [1], compare [2]",all),true);
 assert.equal(citationsValid("No supported footnote",all),false);
 assert.equal(citationsValid("Unsupported [99]",all),false);
 assert.equal(extractModelText({output:[{type:"message",content:[{type:"output_text",text:"Grounded answer [1]"}]}]}),"Grounded answer [1]");
});
test("Future private backend never embeds API keys, does not activate publicly and checks JWT/plan/quota",()=>{
 const worker=read("research-api/src/index.js");
 assert.match(worker,/verifyUserToken/);assert.match(worker,/get\("pro\/research-evidence.json"\)/);
 assert.match(worker,/OPENAI_API_KEY/);assert.match(worker,/AI_LIMITER\.limit/);
 assert.match(worker,/plan==="open"/);assert.match(worker,/store:false/);
 assert.match(worker,/citationsValid/);
 const h=read("sli-research-evidence-preview.html"),js=read("js/sli-research-ai.js");
 assert.ok(!/api\.openai\.com|OPENAI_API_KEY|sk-[A-Za-z0-9]{20}/.test(h+js),"Public code must have no model credentials/endpoints");
});
