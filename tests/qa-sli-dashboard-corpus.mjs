import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {selectDashboardEvidence,fetchDashboardEvidence} from "../research-api/src/dashboard-corpus.mjs";

const rows=[
 {id:"dashboard_ccs123",dataset:"energy-governance-ccs.json",title:"Tangguh UCC carbon capture",text:"DASHBOARD SNAPSHOT CCS FID and platform fabrication, not CO2 injection",source_url:"https://www.bp.com/press",publisher:"bp",period:"2025-07-30",verification_status:"source_link_record_not_independently_checked"},
 {id:"dashboard_ai123",dataset:"sector-evidence-catalog.json",title:"Digital Edge CGK AI data center",text:"DASHBOARD SNAPSHOT 500 MW planned, not commissioned",source_url:"https://digitaledgedc.com/release",publisher:"Operator",period:"2026-06-08"},
 {id:"dashboard_macro123",dataset:"sli-macro-indonesia-2026.json",title:"Indonesia inflation",text:"DASHBOARD SNAPSHOT CPI 2025 inflation",source_url:"https://www.bps.go.id/press",publisher:"BPS",period:"2025"},
 {id:"dashboard_bad1",dataset:"energy-governance-ccs.json",title:"CCS secret",text:"hidden",source_url:"javascript:alert(1)"},
];
const payload={schema:"sli-unified-research-index-v1",records:rows,coverage:{rows:rows.length,datasets_indexed:3}};
test("only topic-relevant fixed public source-linked documents are returned",()=>{
 const ccs=selectDashboardEvidence(payload,"Bagaimana perkembangan CCS Tangguh 2026?");
 assert.ok(ccs.some(d=>d.title.includes("Tangguh")));
 assert.ok(ccs.every(d=>d.source_url.startsWith("https://")));
 assert.ok(!ccs.some(d=>d.title.includes("Digital Edge")));
 const ai=selectDashboardEvidence(payload,"Digital Edge AI data center Indonesia 2026");
 assert.ok(ai.some(d=>d.title.includes("Digital Edge")));
 assert.ok(!ai.some(d=>d.title.includes("inflation")));
 const macro=selectDashboardEvidence(payload,"inflation Indonesia");
 assert.ok(macro.some(d=>d.title.includes("inflation")));
});
test("index is fetched only from a constant origin without leaking the user's prompt",async()=>{
 const calls=[];
 const fetcher=async(url,options)=>{
  calls.push({url,options});
  return {ok:true,headers:{get:()=>null},json:async()=>payload};
 };
 const res=await fetchDashboardEvidence("CCS Tangguh client investigation",{fetcher});
 assert.equal(res.status,"matched");
 assert.ok(res.documents.length>0);
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,"https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/data/sli-research-unified-index.json");
 assert.ok(!JSON.stringify(calls).includes("client investigation"));
 assert.equal(calls[0].options.method,"GET");
});
test("invalid index, large response, and network failures degrade to existing SLI evidence",async()=>{
 const failed=await fetchDashboardEvidence("CCS project",{fetcher:async()=>{throw Error("offline")}});
 assert.equal(failed.status,"unavailable");assert.deepEqual(failed.documents,[]);
 const bad=await fetchDashboardEvidence("CCS project",{fetcher:async()=>({ok:true,headers:{get:()=>null},json:async()=>({schema:"wrong",records:rows})})});
 assert.equal(bad.status,"invalid_schema");
 const large=await fetchDashboardEvidence("CCS project",{fetcher:async()=>({ok:true,headers:{get:()=>1400000},json:async()=>payload})});
 assert.equal(large.status,"too_large");
});
test("scheduled evidence builder has pinned stage baseline and no AI self-modification",()=>{
 const src=readFileSync(new URL("../scripts/build_research_unified_index.py",import.meta.url),"utf8");
 const wf=readFileSync(new URL("../.github/workflows/sli-unified-research-sync.yml",import.meta.url),"utf8");
 const worker=readFileSync(new URL("../research-api/src/owner-test-worker.mjs",import.meta.url),"utf8");
 assert.match(src,/PROJECT_STATUS_CHANGE_PENDING_PRIMARY_REVIEW/);
 assert.match(src,/auto_promote":False/);
 assert.match(src,/--bootstrap-stage-baseline/);
 assert.match(wf,/schedule:/);
 assert.match(wf,/python scripts\/audit_sli_research_index.py/);
 assert.match(wf,/gh','issue','create/);
 assert.doesNotMatch(wf,/bootstrap-stage-baseline/);
 assert.doesNotMatch(wf,/OPENAI_API_KEY/);
 assert.match(worker,/fetchDashboardEvidence/);
 assert.match(worker,/dashboard_evidence:/);
 assert.match(worker,/UNIFIED SLI DASHBOARD SOURCE INDEX/);
});

test("Food research filters to source-dated Pusdatin records, preserving evidence class",()=>{
 const payload={records:[
  {id:"dashboard_foodtrade",title:"Pertanian trade data May 2026",dataset:"food-agriculture-2026.json",text:"Pusdatin pangan rice harga",source_url:"https://satudata.pertanian.go.id/data",period:"2026-04",publisher:"Pusdatin"},
  {id:"dashboard_mineraltrade",title:"Nickel production",dataset:"usgs-indonesia-minerals-2026.json",text:"mineral report",source_url:"https://www.usgs.gov/data",period:"2025",publisher:"USGS"}]};
 const matched=selectDashboardEvidence(payload,"Analisis perdagangan pangan dan pertanian Indonesia");
 assert.equal(matched.length,1);
 assert.equal(matched[0].dataset,"food-agriculture-2026.json");
 assert.equal(matched[0].source_type,"public_dashboard_source_record_not_claim_verified");
});

test("BPS 2025/2026 Research AI table references never become numeric or licensed claims",()=>{
 const payload={records:[{id:"dashboard_bpshorti1",title:"BPS · Perusahaan hortikultura menurut provinsi 2026",dataset:"sli-bps-agri-horti-2026-source-register.json",text:"DASHBOARD SNAPSHOT table 3.1 metadata_only_rights_pending_no_numeric_claim",source_url:"https://searchengine.web.bps.go.id/search?q=hortikultura",period:"2026",publisher:"BPS"}]};
 const matched=selectDashboardEvidence(payload,"Berapa perusahaan hortikultura BPS per provinsi 2026?");
 assert.equal(matched.length,1);
 assert.equal(matched[0].numeric_claim_permitted,false);
 assert.match(matched[0].text,/SOURCE TABLE LOCATOR ONLY/);
 assert.match(matched[0].text,/do not extract, quote, compute, aggregate or infer numeric figures/);
 assert.equal(matched[0].publication_rights_status,"BPS_written_commercial_reproduction_permission_missing");
});

test("Indonesian pembenihan intent retrieves KKP source-linked hatchery evidence; no invented dataset rows",()=>{
 const index=JSON.parse(readFileSync(new URL("../data/sli-research-unified-index.json",import.meta.url),"utf8"));
 const chosen=selectDashboardEvidence(index,"Apa data pembenihan ikan Indonesia menurut provinsi tahun 2024?");
 assert.ok(chosen.some(d=>d.dataset==="sli-kkp-hatchery-province-cards-2024.json"),"KKP hatchery source should be retrievable");
 assert.ok(chosen.every(d=>d.source_url.startsWith("https://")));
 const source=chosen.find(d=>d.dataset==="sli-kkp-hatchery-province-cards-2024.json");
 assert.ok(/719750|33 visible province|hatchery/i.test(source.text),"Evidence must retain source gap context or hatchery scope");
 assert.equal(source.source_type,"public_dashboard_source_record_not_claim_verified");
});
