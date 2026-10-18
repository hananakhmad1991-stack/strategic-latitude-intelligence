import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {nationalEnergyEvidence,energyCorpusAudit} from "../research-api/src/energy-corpus.mjs";
import {selectResearchEvidence,evidenceSector,modelRequest,validateAssistantPayload} from "../research-api/src/assistant-core.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("National energy security prompt retrieves actual SLI oil, gas, fuel, fiscal, coal, renewables and RUPTL",()=>{
 const corpus=nationalEnergyEvidence(),audit=energyCorpusAudit();
 assert.ok(audit.count>=20,"Must include a rich curated energy corpus, not 2 unrelated market prices");
 assert.equal(audit.count,audit.unique_ids,"No duplicate RAG source IDs");
 assert.ok(corpus.every(x=>x.access==="pro"&&x.source_url.startsWith("https://")&&x.text.length>60));
 const docs=selectResearchEvidence(corpus,"Beri analisis konkret ketahanan energi Indonesia terbaru",[],"pro",12);
 assert.equal(docs.length,12);
 for(const id of [
  "sli_energy_oil_production","sli_energy_gas_production","sli_energy_fuel_quota_pertalite",
  "sli_energy_subsidy_compensation_2026","sli_energy_coal_production","sli_energy_coal_dmo",
  "sli_energy_nre_policy","sli_energy_rupTL"
 ])assert.ok(docs.some(d=>d.id===id),"Crucial national dimension missing: "+id);
 assert.ok(docs.some(d=>/581/.test(d.text)),"Real 2025 oil output must be present");
 assert.ok(docs.some(d=>/376\.8/.test(d.text)),"Subsidy PLUS compensation is required");
 assert.ok(docs.some(d=>/15\.75/.test(d.text)),"EBT actual should be retrievable");
 assert.equal(evidenceSector(docs[0]),"oil_gas");
 const ids=new Set(docs.map(d=>d.id));assert.equal(ids.size,docs.length);
 const payload=validateAssistantPayload({question:"Buat analisis ketahanan energi Indonesia yang konkret dan bersumber",history:[],language:"id",mode:"deep_research",methodology:"auto"});
 assert.ok(payload);
 const request=modelRequest(payload,docs,"test-model");
 assert.match(request.instructions,/First state the most important numeric official indicators/);
 assert.match(request.instructions,/do not present them as confirmed real-time news/);
 assert.match(JSON.stringify(request.input),/581|6789|376\.8/);
});
test("Followup is scoped to previous topic for source retrieval, without substituting an unrelated province",()=>{
 const previous="Jelaskan ketahanan energi Indonesia berdasarkan produksi minyak, gas, EBT, fiskal dan RUPTL";
 const corpus=nationalEnergyEvidence();
 const docs=selectResearchEvidence(corpus,"Koreksi jawaban tadi dengan bukti yang konkret",[{role:"user",content:previous},{role:"assistant",content:"Analisis sebelumnya terlalu umum."}],"pro",12);
 assert.ok(docs.some(d=>d.id==="sli_energy_coal_production"));
 assert.ok(docs.some(d=>d.id==="sli_energy_oil_production"));
 const scoped=selectResearchEvidence(corpus,"Apa perbedaan Brent dan WTI?",[],"pro",10);
 assert.ok(!scoped.some(d=>d.id.startsWith("province_grdp")));
});
test("UI shows one readable column and real correction and followup form, preserving recent chat history",()=>{
 const page=read("sli-research-ai.html"),js=read("js/sli-research-assistant.js"),css=read("css/sli-research-assistant.css");
 assert.match(page,/id="raFollowupForm"/);
 assert.match(page,/id="raFollowupPrompt"/);
 assert.match(page,/data-followup="correct"/);
 assert.match(page,/data-followup="detail"/);
 assert.match(page,/<details id="raSourcesPanel"/);
 assert.match(js,/raFollowupForm"\)\.addEventListener/);
 assert.match(js,/raFollowupPrompt"\)\.value/);
 assert.match(js,/history:state\.history\.slice\(-8\)/);
 assert.match(js,/Perdalam laporan terakhir dengan angka resmi SLI/);
 assert.match(css,/grid-template-columns:none!important/);
 assert.match(css,/columns:auto!important/);
 assert.match(css,/\.sli-ra-followup-form textarea/);
 const worker=read("research-api/src/owner-test-worker.mjs");
 assert.match(worker,/nationalEnergyEvidence/);
 assert.match(worker,/owner_staging_source_dated_energy_corpus/);
 assert.doesNotMatch(page,/sk-[A-Za-z0-9_-]{20,}/);
});
