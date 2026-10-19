#!/usr/bin/env node
/* Scheduled zero-API-cost offline evaluation.
 * No real user/client prompts, no model API calls, no self-training or production edits.
 * Reports failures as review candidates, not automatically accepted code changes.
 */
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {selectDashboardEvidence} from "../research-api/src/dashboard-corpus.mjs";
import {auditResearchClaims} from "../research-api/src/claim-evidence-audit.mjs";
import {METHODS} from "../js/sli-analytical-core.mjs";
import {recommendInvestorMethod} from "../js/sli-investor-chat.mjs";

const read=path=>JSON.parse(readFileSync(new URL("../"+path,import.meta.url),"utf8"));
const evidence=read("data/sli-research-unified-index.json");
const fixture=read("tests/fixtures/sli-agent-offline-regression.json");
const methodCases=read("tests/fixtures/sli-agent-eval-cases.json").cases.filter(x=>x.category==="method");
const output=[];
const run=(id,group,pass,detail)=>output.push({id,group,passed:!!pass,detail:String(detail||"").slice(0,200)});
if(evidence?.schema!=="sli-unified-research-index-v1")throw Error("Invalid evidence index schema");
if(evidence?.coverage?.datasets_indexed<50)throw Error("Public index coverage collapsed");
for(const c of fixture.retrieval){
 const rows=selectDashboardEvidence(evidence,c.query,10);
 run(c.id,"retrieval",rows.some(x=>x.dataset===c.dataset),
   "Expected "+c.dataset+"; returned "+rows.map(x=>x.dataset).join(", "));
}
const demo=[
 {id:"sli_primary_test",title:"Operator release",source_url:"https://example.org/report",text:"Operator reported 120 MW planned 2025",period:"2025"},
 {id:"sli_tavily_test",title:"Unverified web snippet",source_url:"https://example.org/story",text:"Unverified 2026 commissioning claim",source_type:"live_web_discovery"}
];
for(const c of fixture.claims){
 const a=auditResearchClaims(c.answer,demo),found=a.items.some(x=>x.issues.includes(c.expect_issue));
 run(c.id,"claim_review",found&&a.primary_claims_automatically_verified===0,
   "Expected "+c.expect_issue+"; found "+a.items.flatMap(x=>x.issues).join(", "));
}
for(const c of methodCases){
 const selected=recommendInvestorMethod(c.prompt);
 const meta=METHODS.find(m=>m.id===c.expected);
 const ok=selected.id===c.expected && (c.expected==="auto"||!!meta) &&
  (!c.expected_status||meta?.status===c.expected_status);
 run(c.id,"method_router",ok,"expected "+c.expected+"; returned "+selected.id+
    "; declared status "+(meta?.status||"n/a"));
}
const passed=output.filter(x=>x.passed).length;
const result={schema:"sli-agent-offline-review-v1",scope:"Static evidence retrieval, method routing and citation-triage benchmarks only; no LLM answers or live publisher fact-check",
 index_records:evidence.coverage.rows,indexed_datasets:evidence.coverage.datasets_indexed,
 total:output.length,passed,failed:output.length-passed,
 no_production_mutation:true,model_fine_tuning_performed:false,cases:output};
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/sli-research-agent-eval.json",JSON.stringify(result,null,2)+"\n");
console.log("SLI offline agent quality:",passed+"/"+output.length,"pass; datasets indexed",result.indexed_datasets);
for(const x of output.filter(x=>!x.passed))console.log("REVIEW:",x.id,x.detail);
if(passed!==output.length)process.exitCode=1;
