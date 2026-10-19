import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=name=>JSON.parse(readFileSync(new URL("../data/"+name,import.meta.url),"utf8"));
const news=read("sli-secondary-news-index.json");
const projects=read("sli-project-registry.json");
const health=read("sli-automation-health.json");
test("news is an attributed secondary report or official-change lead, never an automatic primary-source fact",()=>{
 assert.equal(news.count,news.articles.length);
 assert.equal(new Set(news.articles.map(x=>x.id)).size,news.count);
 const allowed=new Set(["publisher_attributed_news_report","official_metadata_change_candidate"]);
 for(const item of news.articles){
  assert.ok(item.id&&item.title&&item.publisher&&/^https:\/\//.test(item.url),"source link required");
  assert.ok(allowed.has(item.evidence_level),"only bounded evidence tiers allowed: "+item.id);
  if(item.claim_corroborated===true)assert.ok(item.article_body_checked===true&&/^https:\/\//.test(item.reviewed_source_url||""),"corroboration needs inspected original article and verified source link");
  if(item.link_kind==="aggregator")assert.notEqual(item.article_body_checked,true,"aggregator headline is not inspected publisher article");
 }
});
test("project pipeline keeps investments, implementation stage, dates and primary sources distinct",()=>{
 assert.ok(projects.records.length>0);
 assert.equal(new Set(projects.records.map(x=>x.id)).size,projects.records.length);
 for(const r of projects.records){
  assert.ok(r.id&&r.name&&r.stage&&r.amount_basis&&r.evidence_date&&/^https:\/\//.test(r.source_url),"project provenance required: "+r.id);
  if(r.reported_amount!==null)assert.ok(typeof r.reported_amount==="number"&&Number.isFinite(r.reported_amount)&&r.reported_amount>=0&&r.currency);
  if(r.actual_capex!==null){assert.ok(Number.isFinite(r.actual_capex)&&r.actual_capex>=0);
   assert.ok(r.actual_capex_basis&&/^https:\/\//.test(r.actual_capex_source_url||""),"verified realised capex needs distinct financial evidence");}
 }
});
test("automation publishes data failures as attention instead of claiming all sources current",()=>{
 const s=health.summary;
 assert.equal(health.datasets.length,s.datasets);
 assert.equal(health.workflows.length,s.workflows);
 const problems=(s.overdue_or_broken_datasets||0)+(s.workflow_failures_latest||0);
 if(problems)assert.ok(health.attention.length>0,"failed update must be disclosed");
 const page=readFileSync(new URL("../js/sli-automation-health-dashboard.js",import.meta.url),"utf8");
 assert.match(page,/workflow_failure/);assert.match(page,/data\.attention/);
});
