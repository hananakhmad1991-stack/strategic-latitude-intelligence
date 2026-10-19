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
