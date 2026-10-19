/* SLI Continuous AI Improvement: deterministic, PUBLIC, zero-network scorecard.
 * No paid LLM calls, no model-weight learning, no production deployments or data overwrites.
 * Passing checks show selected implementation invariants, NOT factual AI accuracy.
 */
import {readFileSync,writeFileSync,mkdirSync,appendFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {METHODS,getMethod,inferMethod,METHOD_FORMULAS,evaluate as executeMethod} from "../js/sli-analytical-core.mjs";
import {findProvinces,validateProfiles} from "../js/sli-research-analysis.mjs";
import {auditReport} from "../research-api/src/report-audit.mjs";

const root=fileURLToPath(new URL("../",import.meta.url));
const load=p=>JSON.parse(readFileSync(resolve(root,p),"utf8"));
const checked=(value,message)=>{if(!value)throw new Error(message);};
const safeMessage=e=>String(e?.message||e).slice(0,240).replace(/[\r\n]+/g," ");
const methodCases=load("tests/fixtures/sli-agent-eval-cases.json");
const profiles=load("data/sli-research-province-preview.json");
const projectData=load("data/sli-project-registry.json");
const news=load("data/sli-secondary-news-index.json");
const dataHealth=load("data/sli-automation-health.json");
const membership=load("data/sli-membership-plans.json");
const config=load("data/sli-research-assistant-config.json");
const tests=[];

function check(id,domain,critical,fn){
 try{const description=fn();tests.push({id,domain,critical,status:"pass",note:description||"Invariant verified"});}
 catch(e){tests.push({id,domain,critical,status:"fail",note:safeMessage(e)});}
}
export function summarize(results){
 const domains={};
 for(const t of results){
  const d=domains[t.domain]??={passed:0,failed:0,total:0};
  d.total++;if(t.status==="pass")d.passed++;else d.failed++;
 }
 const criticalFailures=results.filter(t=>t.status==="fail"&&t.critical);
 const failures=results.filter(t=>t.status==="fail");
 return {domains,cases:results.length,passed:results.length-failures.length,failed:failures.length,
  score_pct:results.length?Math.round((results.length-failures.length)*10000/results.length)/100:null,
  critical_failures:criticalFailures.length,release_regression:criticalFailures.length>0};
}
export function evaluate(){
 const fixture=methodCases.cases||[];
 check("seed_cases_present","learning",true,()=>{
  checked(methodCases.schema_version==="sli-agent-eval-cases-v1"&&fixture.length>=10,"missing versioned evaluation cases");
  checked(fixture.every(x=>x.id&&x.category&&typeof x.prompt==="string"),"invalid evaluation case");
  checked(new Set(fixture.map(x=>x.id)).size===fixture.length,"duplicate evaluation ID");
  return fixture.length+" public/synthetic seed regression prompts";
 });
 check("catalog_truth","methodology",true,()=>{
  checked(METHODS.length===49,"catalog size changed from 49 without review");
  const runnable=METHODS.filter(m=>m.status==="local");
  checked(runnable.length>=10,"runnable method coverage regressed below 10");
  checked(METHODS.every(m=>["local","design"].includes(m.status)),"unknown methodology status");
  checked(runnable.every(m=>METHOD_FORMULAS[m.id]?.formula&&/^https:\/\//.test(METHOD_FORMULAS[m.id].source)),"runnable model missing formula citation");
  return runnable.length+" declared runnable estimators; remaining designs are not executed";
 });
 for(const c of fixture.filter(c=>c.category==="method"))check(c.id,"methodology",true,()=>{
  const actual=inferMethod(c.prompt);
  checked(actual===c.expected,"expected method "+c.expected+", received "+actual);
  if(c.expected_status)checked(getMethod(actual)?.status===c.expected_status,"design-only method is falsely executable");
  return "expected method selected";
 });
 check("method_did_blocks_fabrication","methodology",true,()=>{
  let rejected=false;try{executeMethod({method:"did",rows:[]})}catch(e){rejected=/not executable/.test(String(e.message))}
  checked(rejected,"DiD design-only model executed an unsupported estimator");
 });
 check("method_lq_reference","methodology",true,()=>{
  const r=executeMethod({method:"lq",model:{regionalIndustry:200,regionalTotal:1000,nationalIndustry:1000,nationalTotal:10000}});
  checked(Math.abs(r.value-2)<1e-12&&r.causal===false,"LQ benchmark/reference result incorrect");
 });
 check("method_shiftshare_reconciliation","methodology",true,()=>{
  const r=executeMethod({method:"shift_share",model:{regionalIndustryBase:100,regionalIndustryEnd:125,nationalIndustryBase:1000,nationalIndustryEnd:1200,nationalTotalBase:10000,nationalTotalEnd:11000}});
  checked(Math.abs(r.explainedChange-r.observedChange)<1e-10,"shift-share identities fail to reconcile");
 });
 check("method_topsis_bounded","methodology",true,()=>{
  const model={alternatives:["A","B","C"],criteria:[{name:"Grid",weight:.6,type:"benefit"},{name:"Cost",weight:.4,type:"cost"}],matrix:[[90,120],[80,70],[50,150]]};
  const r=executeMethod({method:"topsis",model});
  checked(r.ranking.length===3&&r.ranking.every(x=>x.score>=0&&x.score<=1),"TOPSIS ranking is invalid");
  let rejected=false;try{executeMethod({method:"topsis",model:{...model,matrix:[[90,120],[80,null],[50,150]]}})}catch{rejected=true}
  checked(rejected,"TOPSIS silently accepted missing numeric observation");
 });
 check("all_province_profiles","geography",true,()=>{
  checked(validateProfiles(profiles),"expected 38 uniquely named valid province profiles");
  for(const p of profiles.provinces)checked(findProvinces(p.name,profiles.provinces).map(x=>x.name).join(",")===p.name,"province identity leak: "+p.name);
  return "38 provinces resolve exactly";
 });
 for(const c of fixture.filter(c=>c.category==="geography"))check(c.id,"geography",true,()=>{
  const actual=findProvinces(c.prompt,profiles.provinces).map(x=>x.name);
  checked(JSON.stringify(actual)===JSON.stringify(c.expected),"region selection differs: "+JSON.stringify(actual));
 });
 check("report_audit_negative","research",true,()=>{
  const bad=auditReport("# Ringkasan\nJawaban tanpa bukti.\n## Kesimpulan",[{id:"source"}],{expectedGeography:["Jawa Tengah"],minWords:40,requireConclusion:true});
  checked(!bad.pass&&bad.issues.includes("missing_citations")&&bad.issues.includes("possibly_truncated_ending"),"invalid report falsely passes structural audit");
  checked(bad.review_scope==="structural_only_not_factual_verification","claim-level fact checking wrongly implied");
 });
 check("news_attribution_integrity","data",true,()=>{
  checked(news.count===news.articles.length&&news.articles.length>50,"news source inventory invalid");
  checked(new Set(news.articles.map(x=>x.id)).size===news.articles.length,"duplicated news IDs");
  const allowed=new Set(["publisher_attributed_news_report","official_metadata_change_candidate"]);
  for(const x of news.articles){
   checked(allowed.has(x.evidence_level),"unrecognised news status");
   checked(x.publisher&&x.url?.startsWith("https://"),"news item lacks attributable link");
   checked(!(x.link_kind==="aggregator"&&x.article_body_checked===true),"RSS discovery mislabelled as article-body review");
   checked(x.claim_corroborated!==true||x.article_body_checked===true,"unreviewed headline claims corroboration");
  }
  return news.count+" attributed news leads; not independently verified assertions";
 });
 check("project_stage_provenance","data",true,()=>{
  checked(projectData.records.length>=20,"project registry unexpectedly empty");
  for(const p of projectData.records){
   checked(p.id&&p.name&&p.stage&&p.evidence_date&&p.source_url?.startsWith("https://"),"project missing provenance");
   checked(p.actual_capex==null||Boolean(p.actual_capex_basis&&p.actual_capex_source_url),"realized capex lacks distinct evidence");
  }
  return projectData.records.length+" projects retain staged evidence";
 });
 check("automation_health_visible","operations",true,()=>{
  checked(dataHealth.summary.datasets===dataHealth.datasets.length,"automation dataset inventory inconsistent");
  checked(dataHealth.summary.workflows===dataHealth.workflows.length,"workflow inventory inconsistent");
  const failed=(dataHealth.summary.overdue_or_broken_datasets||0)+(dataHealth.summary.workflow_failures_latest||0);
  checked(failed===0||dataHealth.attention.length>0,"failing upstream workflow hidden");
  return "source failures are surfaced instead of silently overwritten";
 });
 check("premium_access_not_faked","security",true,()=>{
  checked(membership.account&&membership.policy,"membership security policy absent");
  if(config.api_enabled){checked(config.login_enabled&&config.generation_status==="enabled"&&config.api_endpoint?.startsWith("https://"),"unsafe public generative API config");}
  if(membership.account.premium_api==="not_deployed")checked(membership.checkout_enabled!==true,"checkout turned on without secure subscriber API");
  checked(!JSON.stringify(config).includes("sk-proj-"),"provider credential in public configuration");
  return "public config does not bypass subscriber controls";
 });
 check("research_ui_method_atlas","ux",false,()=>{
  const ui=readFileSync(resolve(root,"js/sli-analytical-workbench-ui.mjs"),"utf8");
  const atlas=readFileSync(resolve(root,"sli-methodology-models.html"),"utf8");
  checked(ui.includes("sli-methodology-models.html")&&atlas.includes("methodSearch"),"methodology atlas or link missing");
  return "interactive formula atlas is linked from analysis workbench";
 });
 const stats=summarize(tests);
 const needsAttention=(dataHealth.attention||[]).slice(0,8).map(x=>({area:"operations",issue:x.id,status:x.status,
   recommendation:"Review publisher/ingestion failure. Preserve last verified snapshot until validated; no auto replacement."}));
 const proposed=[
  ...tests.filter(t=>t.status==="fail").map(x=>({priority:x.critical?"P0":"P2",area:x.domain,id:x.id,
   proposal:"Create a reviewed regression fix. Reproduce test failure; compare baseline and rerun all affected QA."})),
  ...needsAttention.map(x=>({priority:"P1",area:x.area,id:x.issue,proposal:x.recommendation})),
  {priority:"P2",area:"methodology",id:"design_only_methods",proposal:"Develop remaining methods incrementally with reference equations, known-answer fixtures, input validation and human methodological review."},
  {priority:"P1",area:"research",id:"live_owner_model_eval_pending",proposal:"Human reviewer must grade a consented sample of owner-staging reports for factual entailment, geography, cost and complete final sections. This offline run did not call OpenAI."},
  {priority:"P1",area:"commercial",id:"subscriber_security_pending",proposal:"Do not enable Pro checkout before server-side auth, entitlements, licensing, quota, revocation and security QA are proven."}
 ];
 return {schema:"sli-agent-improvement-scorecard-v1",generated_at_utc:new Date().toISOString(),
  evaluation_mode:"deterministic_offline_public_only_no_paid_model_calls",benchmark_review:methodCases.human_review_status,
  score_interpretation:"Regression-check pass ratio, NOT AI answer accuracy, human satisfaction or actual source truth",
  ...stats,status:stats.release_regression?"regression_detected":needsAttention.length?"passing_with_existing_source_warnings":"offline_checks_pass",
  checks:tests,source_alerts:needsAttention,proposed_actions:proposed.slice(0,30),
  human_gate:"All code/prompt/model upgrades and evidence promotions require reviewed PR, QA and operator approval. No self-deploy, paid API call, private data ingestion or silent baseline update."};
}
export function markdown(report){
 const out=["## SLI Agent Continuous Evaluation","> Offline implementation regression checks only — **not** model fact-checking, automatic fine-tuning, or commercial release certification.","",
  "Score: **"+report.passed+"/"+report.cases+"** ("+report.score_pct+"%); critical failures: **"+report.critical_failures+"**. Status: **"+report.status+"**.","",
  "| Domain | Pass | Total |","|---|---:|---:|"];
 for(const [key,val] of Object.entries(report.domains))out.push("| "+key+" | "+val.passed+" | "+val.total+" |");
 out.push("","### Failures / highest-priority actions");
 const failed=report.checks.filter(x=>x.status==="fail");
 if(!failed.length)out.push("- No failing offline regression cases.");
 for(const x of failed)out.push("- "+x.id+" ("+x.domain+"): "+x.note);
 for(const x of report.source_alerts)out.push("- Upstream data warning: "+x.issue+" — "+x.status);
 out.push("","### Safeguards","- No OpenAI/Tavily charge and no autonomous code writes, source overrides or deployments.","- Human feedback becomes new regression cases only after review.","- Original publisher claim-to-source correctness and real generative output still need human/owner-staging evaluation.");
 return out.join("\n")+"\n";
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=evaluate();
 const outPath=process.argv.find(x=>x.startsWith("--out="))?.slice(6);
 if(outPath){const full=resolve(process.cwd(),outPath);mkdirSync(dirname(full),{recursive:true});writeFileSync(full,JSON.stringify(report,null,2)+"\n");}
 if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,markdown(report));
 process.stdout.write("SLI agent checks: "+report.passed+"/"+report.cases+"; critical failures="+report.critical_failures+"; status="+report.status+"\n");
 if(report.release_regression)process.exitCode=1;
}
