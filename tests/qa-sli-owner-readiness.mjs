import test from "node:test";
import assert from "node:assert/strict";
import {assessOwnerResearchReadiness as check} from "../scripts/sli-research-owner-readiness.mjs";

const date="2026-10-21T12:00:00Z";
function fixture(){
 return {
  now:new Date("2026-10-21T13:00:00Z"),
  config:{
   generation_status:"not_connected",api_enabled:false,login_enabled:false,api_endpoint:null,
   owner_test:{enabled:true,
    scope:"owner_only_staging_with_public_curated_SLI_evidence",
    endpoint:"https://research.example.org/v1/owner-research",
    auth:"private_server_side_random_token_48_or_more_characters"}
  },
  index:{
   schema:"sli-unified-research-index-v1",
   coverage:{rows:1,datasets_scanned:1,datasets_indexed:1},
   records:[{id:"dashboard_a",title:"Official report",dataset:"energy-report.json",
    publisher:"ESDM",text:"DASHBOARD SNAPSHOT; tentative planning, not verified.",
    source_url:"https://www.esdm.go.id/report",
    source_type:"public_dashboard_source_record_not_claim_verified",
    verification_status:"source_link_record_not_independently_checked"}]
  },
  automation:{
   audit_state:"complete",generated_at_utc:date,
   summary:{workflow_failures_latest:0,overdue_or_broken_datasets:0,workflow_status_api_errors:0}
  }
 };
}
test("safe local fixture permits staging code review, never live/commercial approval",()=>{
 const r=check(fixture());
 assert.equal(r.owner_staging_code_gate_pass,true);
 assert.equal(r.owner_staging_live_smoke_pass,false);
 assert.equal(r.commercial_release_ready,false);
 assert.equal(r.independent_real_model_evaluation_pass,false);
 assert.equal(r.primary_source_claim_entailment_verified,false);
 assert.equal(r.automation_reported_health,"reported_healthy");
});
test("public generative enablement blocks owner-only staging gate",()=>{
 const f=fixture();f.config.api_enabled=true;f.config.login_enabled=true;
 assert.ok(check(f).blockers.includes("paid_public_generation_must_remain_disabled"));
});
test("broken or unsafe owner endpoint blocks staging gate",()=>{
 const f=fixture();f.config.owner_test.endpoint="http://127.0.0.1/v1/owner-research";
 assert.ok(check(f).blockers.includes("owner_test_endpoint_invalid"));
 f.config.owner_test.endpoint="https://example.org/v1/owner-research?token=secret";
 assert.ok(check(f).blockers.includes("owner_test_endpoint_invalid"));
});
test("unapproved record kind cannot pass provenance screening",()=>{
 const f=fixture();f.index.records[0].source_type="verified_primary_claim";
 assert.ok(check(f).blockers.includes("source_index_records_fail_provenance_screen"));
});
test("unsupported source URL and duplicate IDs block staging",()=>{
 const f=fixture();f.index.records[0].source_url="http://example.org/data";
 assert.ok(check(f).blockers.includes("source_index_records_fail_provenance_screen"));
 const g=fixture();g.index.records.push({...g.index.records[0]});
 g.index.coverage.rows=2;
 assert.ok(check(g).blockers.includes("source_index_records_fail_provenance_screen"));
});
test("missing records or coverage mismatch block readiness",()=>{
 const f=fixture();f.index.records=[];f.index.coverage.rows=0;
 assert.ok(check(f).blockers.includes("research_index_coverage_inconsistent"));
});
test("upstream workflow and refresh errors are visible, not a fabricated green report",()=>{
 const f=fixture();f.automation.summary.workflow_failures_latest=1;
 f.automation.summary.overdue_or_broken_datasets=2;
 const r=check(f);
 assert.equal(r.owner_staging_code_gate_pass,true);
 assert.equal(r.automation_reported_health,"degraded");
 assert.ok(r.warnings.includes("upstream_workflow_failures_outstanding"));
 assert.ok(r.warnings.includes("dataset_refresh_failures_outstanding"));
 assert.equal(r.commercial_release_ready,false);
});
test("stale or absent automation audits never look healthy",()=>{
 const f=fixture();f.now=new Date("2026-10-30T00:00:00Z");
 let r=check(f);
 assert.equal(r.automation_reported_health,"degraded");
 assert.ok(r.warnings.includes("automation_health_snapshot_stale_or_invalid"));
 f.automation=null;
 r=check(f);
 assert.equal(r.automation_reported_health,"unknown");
 assert.ok(r.warnings.includes("automation_health_not_recently_audited"));
});
test("audit failures cannot be masked by stale positive counters",()=>{
 const f=fixture();f.automation.audit_state="awaiting_first_run";
 const r=check(f);
 assert.equal(r.automation_reported_health,"unknown");
 assert.equal(r.commercial_release_ready,false);
});

test("health reconciliation identifies failures hidden by summary counters",()=>{
 const f=fixture();
 f.automation.summary.workflows=1;
 f.automation.workflows=[{id:"scheduled.yml",last_run:{conclusion:"failure"}}];
 f.automation.summary.datasets=1;
 f.automation.datasets=[{id:"data/input.json",status:"workflow_failure"}];
 const r=check(f);
 assert.equal(r.automation_reported_health,"degraded");
 assert.ok(r.warnings.includes("workflow_failure_counter_underreported"));
 assert.ok(r.warnings.includes("dataset_failure_counter_underreported"));
 assert.equal(r.commercial_release_ready,false);
});
test("source record can use official publisher URL query without enabling owner endpoint query",()=>{
 const f=fixture();
 f.index.records[0].source_url="https://data.bps.go.id/report?series=2025";
 const r=check(f);
 assert.equal(r.owner_staging_code_gate_pass,true);
 assert.ok(!r.blockers.includes("source_index_records_fail_provenance_screen"));
});
