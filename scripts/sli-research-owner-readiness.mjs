#!/usr/bin/env node
/**
 * Offline owner-staging readiness guard. No network, API keys, model calls or deployments.
 * This checks whether the local configuration, source index and last automation snapshot
 * are suitable for an owner-only smoke test. It CANNOT approve research facts or paid release.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const SOURCE_KIND="public_dashboard_source_record_not_claim_verified";
const SOURCE_STATUSES=new Set([
 "source_link_record_not_independently_checked",
 "project_stage_change_pending_review"
]);
const unique=values=>[...new Set(values)];
function safeHttps(value,requiredPath){
 try{
  const u=new URL(value);
  if(u.protocol!=="https:"||!u.hostname.includes(".")||u.username||u.password||
    (requiredPath&&(u.search||u.hash))||u.port||u.hostname==="localhost"||u.hostname.endsWith(".local")||
    /^(?:127|10|192\.168|169\.254)\./.test(u.hostname))return false;
  return !requiredPath||u.pathname===requiredPath;
 }catch{return false}
}
function nonEmpty(v){return typeof v==="string"&&v.trim().length>0}
function timestamp(raw){
 if(typeof raw!=="string"||!raw.trim())return null;
 const t=Date.parse(raw);
 return Number.isFinite(t)?t:null;
}
export function assessOwnerResearchReadiness({config,index,automation,now=new Date()}){
 const blockers=[],warnings=[];
 const fail=(code)=>blockers.push(code),warn=(code)=>warnings.push(code);
 if(!config||typeof config!=="object"){
  fail("research_config_missing");
 }else{
  if(config.api_enabled!==false||config.login_enabled!==false||
     config.generation_status!=="not_connected"||config.api_endpoint!==null)
   fail("paid_public_generation_must_remain_disabled");
  const owner=config.owner_test;
  if(owner?.enabled!==true||owner?.scope!=="owner_only_staging_with_public_curated_SLI_evidence")
   fail("owner_test_scope_not_confirmed");
  if(!safeHttps(owner?.endpoint,"/v1/owner-research"))
   fail("owner_test_endpoint_invalid");
  if(!nonEmpty(owner?.auth)||!owner.auth.includes("private_server_side"))
   fail("owner_auth_policy_not_declared");
 }
 let count=0;
 if(!index||index.schema!=="sli-unified-research-index-v1"||
    !Array.isArray(index.records)||!index.coverage){
  fail("research_index_missing_or_invalid");
 }else{
  count=index.records.length;
  const c=index.coverage;
  if(count===0||c.rows!==count||!Number.isInteger(c.datasets_indexed)||
     !Number.isInteger(c.datasets_scanned)||c.datasets_indexed<1||
     c.datasets_scanned<c.datasets_indexed)
   fail("research_index_coverage_inconsistent");
  const ids=new Set();
  let invalid=0;
  for(const r of index.records){
   if(!nonEmpty(r.id)||ids.has(r.id)||!nonEmpty(r.title)||!nonEmpty(r.text)||
      !nonEmpty(r.dataset)||!nonEmpty(r.publisher)||!safeHttps(r.source_url)||
      r.source_type!==SOURCE_KIND||!SOURCE_STATUSES.has(r.verification_status)||
      !r.text.includes("DASHBOARD SNAPSHOT")) invalid++;
   if(nonEmpty(r.id))ids.add(r.id);
  }
  if(invalid>0)fail("source_index_records_fail_provenance_screen");
  if(count>0&&c.datasets_indexed>0&&c.datasets_indexed/c.datasets_scanned<0.5)
   warn("research_dataset_coverage_below_half_of_scanned");
 }
 const summary=automation?.summary;
 let health="unknown";
 if(!automation||!summary||!["complete","complete_with_api_warnings"].includes(automation.audit_state)){
  warn("automation_health_not_recently_audited");
 }else{
  const at=timestamp(automation.generated_at_utc);
  const nowMs=now instanceof Date?now.getTime():new Date(now).getTime();
  const age=at===null?Infinity:(nowMs-at)/(60*60*1000);
  if(!Number.isFinite(age)||age< -0.25||age>48)warn("automation_health_snapshot_stale_or_invalid");
  const failures=Number(summary.workflow_failures_latest||0);
  const broken=Number(summary.overdue_or_broken_datasets||0);
  const errors=Number(summary.workflow_status_api_errors||0);
  if(!Number.isInteger(failures)||failures<0||
     !Number.isInteger(broken)||broken<0||
     !Number.isInteger(errors)||errors<0)warn("automation_health_counters_invalid");
  if(Array.isArray(automation.workflows)){
   const observed=automation.workflows.filter(w=>w?.last_run?.conclusion==="failure").length;
   if(failures<observed)warn("workflow_failure_counter_underreported");
   if(Number.isInteger(summary.workflows)&&automation.workflows.length!==summary.workflows)
    warn("workflow_inventory_count_inconsistent");
  }
  if(Array.isArray(automation.datasets)){
   const brokenStatuses=new Set(["overdue","workflow_failure","invalid_dataset"]);
   const observed=automation.datasets.filter(d=>brokenStatuses.has(d?.status)).length;
   if(broken<observed)warn("dataset_failure_counter_underreported");
   if(Number.isInteger(summary.datasets)&&automation.datasets.length!==summary.datasets)
    warn("dataset_inventory_count_inconsistent");
  }
  if(failures>0)warn("upstream_workflow_failures_outstanding");
  if(broken>0)warn("dataset_refresh_failures_outstanding");
  if(errors>0||automation.audit_state==="complete_with_api_warnings")
   warn("workflow_status_incomplete");
  health=warnings.some(x=>x.startsWith("automation_")||x.startsWith("upstream_")||
    x.startsWith("dataset_")||x.startsWith("workflow_status_"))?"degraded":"reported_healthy";
 }
 const errors=unique(blockers),notices=unique(warnings);
 return {
  schema:"sli-owner-research-readiness-v1",
  scope:"offline_code_and_metadata_only_not_live_model_test",
  owner_staging_code_gate_pass:errors.length===0,
  owner_staging_live_smoke_pass:false,
  commercial_release_ready:false,
  primary_source_claim_entailment_verified:false,
  independent_real_model_evaluation_pass:false,
  source_index_record_count:count,
  source_index_datasets_indexed:index?.coverage?.datasets_indexed||0,
  automation_reported_health:health,
  automation_reported_failures:summary?.workflow_failures_latest??null,
  automation_reported_broken_datasets:summary?.overdue_or_broken_datasets??null,
  blockers:errors,warnings:notices,
  required_manual_checks:[
   "Deploy owner Worker through protected manual workflow only after QA and approval",
   "Run authenticated current-commit owner-only Research AI prompts; save timestamped outputs",
   "Independently review material claims against original primary pages",
   "Inspect DOCX and PDF renders plus security, quota, latency and cost",
   "Do not enable public Pro/Enterprise without multi-tenant and scientific release gates"
  ]
 };
}
function main(){
 const read=path=>JSON.parse(readFileSync(resolve(ROOT,path),"utf8"));
 const report=assessOwnerResearchReadiness({
  config:read("data/sli-research-assistant-config.json"),
  index:read("data/sli-research-unified-index.json"),
  automation:read("data/sli-automation-health.json")
 });
 const arg=process.argv.find(a=>a.startsWith("--out="));
 const out=resolve(process.cwd(),arg?arg.slice(6):"artifacts/sli-owner-research-readiness.json");
 mkdirSync(dirname(out),{recursive:true});
 writeFileSync(out,JSON.stringify(report,null,2)+"\n");
 console.log("Owner staging code gate:",report.owner_staging_code_gate_pass?"PASS":"BLOCKED");
 console.log("Index records:",report.source_index_record_count,
  "Indexed datasets:",report.source_index_datasets_indexed,
  "Automation:",report.automation_reported_health);
 console.log("Blockers:",report.blockers.join(", ")||"none",
  "Warnings:",report.warnings.join(", ")||"none");
 console.log("Live smoke and paid release are never approved by this offline check.");
 if(!report.owner_staging_code_gate_pass)process.exitCode=1;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
