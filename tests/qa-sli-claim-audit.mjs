import {test} from "node:test";
import assert from "node:assert/strict";
import {auditResearchClaims} from "../research-api/src/claim-evidence-audit.mjs";
const evidence=[
 {id:"sli_primary_01",title:"Official operator status",text:"The official operator said first steel cutting of platform in July 2025. Capacity 120 MW planned, not commissioned.",source_url:"https://example.com/operator"},
 {id:"dashboard_123",title:"Source-linked dashboard snapshot",text:"A dated investment dashboard reports 2026 planned 240 MW.",source_url:"https://example.com/dashboard",source_type:"public_dashboard_source_record_not_claim_verified"},
 {id:"sli_tavily_1",title:"Search preview",text:"Media snippet alleges commissioning 2026 but not corroborated.",source_url:"https://example.com/search",source_type:"live_web_discovery"}
];
test("claim audit explicitly never certifies accuracy or article content",()=>{
 const result=auditResearchClaims("The platform fabrication started in July 2025 [1]. Construction does not prove operational injection [1].",evidence);
 assert.match(result.scope,/not_claim_fact_check/);
 assert.equal(result.primary_claims_automatically_verified,0);
 assert.ok(result.assessed_claims>0);
 assert.ok(result.items.every(x=>x.review_status==="pending_primary_document_and_editorial_review"));
});
test("claim audit catches unsupported quantitative values tied to citation excerpt",()=>{
 const res=auditResearchClaims("The commissioned facility operated at 999 GW in 2026 [1].",evidence);
 assert.equal(res.items.length,1);
 assert.ok(res.items[0].missing_numbers.some(x=>x.includes("999")));
 assert.ok(res.items[0].issues.includes("numbers_absent_from_cited_excerpts"));
 assert.equal(res.items[0].category,"commercial_operation");
});
test("headline/snippet citations remain unverified and uncited factual assertions flagged",()=>{
 const answer="The facility reported commercial operation at 10 GW in 2026 [3].\nThe project has completed construction in 2026.";
 const r=auditResearchClaims(answer,evidence);
 assert.ok(r.items.some(x=>x.issues.includes("original_primary_document_not_established")));
 assert.ok(r.items.some(x=>x.issues.includes("no_local_citation")));
 assert.equal(r.primary_claims_automatically_verified,0);
});
test("review cannot read original docs, is bounded and has no external side effects",()=>{
 let text="";
 for(let i=0;i<80;i++)text+="Constructed capacity "+(100+i)+" MW in 2026 [2].\n";
 const r=auditResearchClaims(text,evidence,{maxItems:8});
 assert.ok(r.shown_claims<=8);
 assert.ok(r.assessed_claims>=8);
 assert.ok(r.limitations.some(x=>/NOT independently fetched/.test(x)));
});
