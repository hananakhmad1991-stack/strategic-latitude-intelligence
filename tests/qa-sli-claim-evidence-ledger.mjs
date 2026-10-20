import {test} from "node:test";
import assert from "node:assert/strict";
import {buildClaimEvidenceLedger} from "../research-api/src/claim-evidence-ledger.mjs";
const docs=[
 {id:"official1",title:"Publisher release",source_url:"https://www.esdm.go.id/berita?campaign=public",
  text:"FID was announced 2024, not commercial operation.",period:"2024",source_date:"2024-11-21"},
 {id:"sli_tavily_1",title:"Discovery",source_url:"https://www.example.com/report",
  source_type:"live_web_discovery",text:"Unreviewed 2026 lead"},
];
const review={assessed_claims:5,items:[
 {claim:"Project reached FID in 2024.",category:"investment_decision",citations:[1],
  citation_scope:"direct",issues:["primary_page_claim_entailment_not_checked"],missing_numbers:[]},
 {claim:"The facility operated in 2026.",category:"commercial_operation",citations:[2],
  citation_scope:"direct",issues:["discovery_or_dashboard_snapshot_citation"],missing_numbers:["2026"]},
 {claim:"The facility completed construction in 2026.",category:"construction",citations:[],
  citation_scope:"none",issues:["no_local_citation"],missing_numbers:[]}
]};
test("ledger supplies scoped evidence without certifying claims",async()=>{
 const l=await buildClaimEvidenceLedger("Some answer",docs,review);
 assert.equal(l.schema,"sli-claim-evidence-ledger-v1");
 assert.equal(l.total_candidate_claims,5);
 assert.equal(l.sampled_claims,3);
 assert.equal(l.not_sampled_candidates,2);
 assert.equal(l.approval_status,"not_editorially_approved");
 assert.ok(l.claims.every(x=>!x.independent_claim_validation&&x.review_status.includes("human")));
 assert.equal(l.claims[0].source_traces[0].source_id,"official1");
 assert.equal(l.claims[0].source_traces[0].original_url,"https://www.esdm.go.id/berita");
 assert.equal(l.claims[2].source_traces.length,0);
 assert.equal(l.claims[1].source_traces[0].source_type,"live_web_discovery");
});
test("snapshot hashes stable and change if report, source or claim-review changes",async()=>{
 const a=await buildClaimEvidenceLedger("Answer A",docs,review);
 const b=await buildClaimEvidenceLedger("Answer A",docs,review);
 assert.equal(a.report_sha256,b.report_sha256);
 assert.match(a.report_sha256,/^[0-9a-f]{64}$/);
 const c=await buildClaimEvidenceLedger("Answer B",docs,review);
 assert.notEqual(a.report_sha256,c.report_sha256);
 const d=await buildClaimEvidenceLedger("Answer A",[{...docs[0],text:"Revised evidence"},docs[1]],review);
 assert.notEqual(a.evidence_snapshot_sha256,d.evidence_snapshot_sha256);
 assert.notEqual(a.report_sha256,d.report_sha256);
 const e=await buildClaimEvidenceLedger("Answer A",docs,{...review,items:[{...review.items[0],issues:["new_problem"]}]});
 assert.notEqual(a.report_sha256,e.report_sha256);
});
test("publisher read is linked only to same claim, not every use of same citation",async()=>{
 const r={assessed_claims:2,items:[
  review.items[0],{...review.items[0],claim:"Another project milestone for same source."}]};
 const p={results:[{citation:1,claim:"Project reached FID in 2024.",status:"publisher_page_numbers_present"}]};
 const l=await buildClaimEvidenceLedger("A",docs,r,p);
 assert.equal(l.claims[0].source_traces[0].publisher_page_check,"publisher_page_numbers_present");
 assert.equal(l.claims[1].source_traces[0].publisher_page_check,"not_checked_for_this_claim");
 assert.equal(l.claims[0].independent_claim_validation,false);
});
test("non-public or malformed URLs are not supplied as source links",async()=>{
 const sources=[{id:"unsafe",source_url:"http://example.com/test",title:"Unsafe",text:"x"}];
 const r={assessed_claims:1,items:[{claim:"A claim",citations:[1],issues:[]}]};
 const l=await buildClaimEvidenceLedger("A",sources,r);
 assert.equal(l.claims[0].source_traces[0].original_url,null);
 assert.equal(l.ready_for_external_use,false);
});
