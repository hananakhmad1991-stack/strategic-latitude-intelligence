import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {nationalEnergyEvidence,energyCorpusAudit} from "../research-api/src/energy-corpus.mjs";
import {selectResearchEvidence,evidenceSector,modelRequest,validateAssistantPayload} from "../research-api/src/assistant-core.mjs";
import {selectEnergyHeadlineLeads,fetchEnergyMonitoring,monitoringPromptContext} from "../research-api/src/monitoring-context.mjs";
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
 assert.equal(docs[0].id,"sli_energy_official_security_index_2025");
 assert.ok(docs.some(d=>evidenceSector(d)==="oil_gas"));
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
 assert.match(worker,/owner_staging_source_dated_corpus/);
 assert.doesNotMatch(page,/sk-[A-Za-z0-9_-]{20,}/);
});

test("Energy headline monitoring labels discovery only, verifies age and never promotes RSS to official ESDM evidence",async()=>{
 const now=Date.parse("2026-10-18T08:00:00Z");
 const doc={assessment_date_wib:"2026-10-18",generated_at_utc:"2026-10-18T07:00:00Z",
  points:[{id:"oil-gas",recent_news_leads:[
   {title:"Dated energy headline — NOT a fact",publisher:"Example",url:"https://news.google.com/rss/articles/TEST",published_at_utc:"2026-10-18T07:20:00Z"},
   {title:"Ancient energy headline",publisher:"Example",url:"https://news.google.com/rss/articles/TEST2",published_at_utc:"2026-09-01T07:20:00Z"}
  ]}]};
 const signals=selectEnergyHeadlineLeads(doc,now);
 assert.equal(signals.length,1);
 assert.match(signals[0].evidence_status,/UNVERIFIED/);
 assert.equal(selectEnergyHeadlineLeads(doc,Date.parse("2026-10-30T07:20:00Z")).length,0);
 // Actual snapshot network is hardcoded to the public SLI dashboard (not user-controlled).
 const fake=async url=>({ok:true,headers:{get:()=>null},text:async()=>JSON.stringify(doc)});
 const response=await fetchEnergyMonitoring(fake);
 assert.equal(response.status,"source_dated_public_monitoring");
 assert.match(monitoringPromptContext({signals}),/UNVERIFIED DISCOVERY ONLY/);
 const bad=await fetchEnergyMonitoring(async()=>({ok:false}));
 assert.equal(bad.status,"monitoring_unavailable");
 assert.deepEqual(bad.signals,[]);
 const worker=read("research-api/src/owner-test-worker.mjs");
 assert.match(worker,/monitoringPromptContext/);
 assert.match(worker,/monitoring_signals/);
 assert.match(read("sli-research-ai.html"),/raMonitoringSignals/);
 assert.match(read("js/sli-research-assistant.js"),/renderMonitoringSignals/);
});


test("Commissioned report enforces research design, method execution honesty, academic integrity and readable conclusions",()=>{
 const payload=validateAssistantPayload({question:"Evaluasi investasi hilirisasi nikel di Sulawesi Tengah, hitung multiplier dan jelaskan dampak risiko energi",history:[],language:"id",mode:"deep_research",methodology:"auto"});
 assert.ok(payload);
 const request=modelRequest(payload,[], "test-model");
 const rules=request.instructions;
 for(const required of [
  /research commission/i,
  /professional research REPORT/,
  /methodological audit/i,
  /independently executed calculation/i,
  /peer-reviewed methodology/i,
  /do not invent books, authors, papers, DOIs/i,
  /geography.*chronology.*sample denominators/i,
  /Leontief inversion/,
  /NO MATCHING SLI EVIDENCE/
 ])assert.match(rules,required);
 assert.equal(request.store,false);
 assert.match(JSON.stringify(request.input),/Sulawesi Tengah/);
});

test("Official energy-security index and 4A components are mandatory national evidence, with APA 7 reporting",()=>{
 const corpus=nationalEnergyEvidence();
 const index=corpus.find(d=>d.id==="sli_energy_official_security_index_2025");
 assert.ok(index,"SLI already publishes official IKE and it must reach the AI corpus");
 assert.match(index.text,/7\.04\/10/);
 for(const pillar of ["availability","accessibility","affordability","acceptability"])
  assert.ok(corpus.some(d=>d.id==="sli_energy_ike_4a_"+pillar));
 const picked=selectResearchEvidence(corpus,"Analisis ketahanan energi Indonesia dan indeks ketahanan energi nasional",[],"pro",12);
 assert.ok(picked.some(d=>d.id===index.id));
 const payload=validateAssistantPayload({question:"Analisis ketahanan energi Indonesia nasional",history:[],mode:"deep_research"});
 const req=modelRequest(payload,picked,"test-model");
 assert.match(req.instructions,/APA 7/);
 assert.match(JSON.stringify(req.input),/7\.04\/10/);
});

test("APA reference panel, model statement and gated news monitoring in owner UI",()=>{
 const html=read("sli-research-ai.html"),client=read("js/sli-research-assistant.js");
 assert.match(html,/raModelStatementBody/);
 assert.match(html,/Referensi penelitian \(APA 7\)/);
 assert.match(client,/function apaEntry/);
 assert.match(client,/function renderModelStatement/);
 assert.match(client,/sources\.slice\(0,40\)/);
 assert.match(client,/evidence_status==="publisher_page_matched"/);
 assert.match(client,/reportBody\(text,state\.language\)/);
});

test("Complete research narratives are not truncated and APA references remain legible",()=>{
 const visual=read("js/sli-research-visuals.js"),ui=read("js/sli-research-assistant.js"),css=read("css/sli-research-assistant.css");
 assert.doesNotMatch(visual,/slice\(0,24000\)/);
 assert.match(ui,/never truncate substantive conclusions/);
 assert.match(css,/#raConversation #raSourcesList \.sli-ra-source-card>a/);
 assert.match(css,/text-overflow:clip/);
 const question=validateAssistantPayload({question:"Analisis risiko impor energi Indonesia secara mendalam",mode:"deep_research",history:[]});
 const request=modelRequest(question,nationalEnergyEvidence().slice(0,3),"test-model");
 assert.match(request.instructions,/general reader/);
 assert.match(request.instructions,/opinion-column style/);
});

test("Main AI report contains no duplicated bibliography; APA lives only in reference UI",()=>{
 const payload=validateAssistantPayload({question:"Analisis ketahanan energi Indonesia secara komprehensif",mode:"deep_research",history:[]});
 const req=modelRequest(payload,nationalEnergyEvidence().slice(0,4),"test-model");
 assert.match(req.instructions,/Do not generate a bibliography/);
 assert.match(req.instructions,/clickable APA 7 reference panel/);
 assert.match(read("js/sli-research-assistant.js"),/function apaEntry/);
});
