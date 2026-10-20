import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assessResolvedFixes,compareRetainedLessons,discoverMergedFixes,loadLessons} from "../scripts/sli-agent-resolved-learning.mjs";

test("Resolved DERGUBA fixes retain traceable merged PRs and executable regression names",()=>{
 const registry=loadLessons(),r=assessResolvedFixes(registry);
 assert.equal(r.pass,true,JSON.stringify(r.failures));
 assert.equal(r.total,4);
 assert.equal(r.traced_merged_prs,2);
 assert.deepEqual(registry.lessons.map(x=>x.pr_number).filter((x,i,a)=>a.indexOf(x)===i),[70,73]);
 assert.ok(r.regression_files.includes("tests/qa-sli-legal-source-limited.mjs"));
 assert.equal(r.model_weights_changed,false);
 assert.equal(r.original_facts_auto_promoted,false);
});
test("A removed regression, duplicated lesson, or unsafe path fails closed",()=>{
 const existing=loadLessons(),lesson=existing.lessons[0];
 const missing={...existing,lessons:[{...lesson,test_title:"Nonexistent official evidence proof must never appear"}]};
 assert.ok(assessResolvedFixes(missing).failures.includes("missing_named_regression:"+lesson.id));
 const duplicated={...existing,lessons:[lesson,lesson]};
 assert.ok(assessResolvedFixes(duplicated).failures.includes("invalid_or_duplicate_id:"+lesson.id));
 const unsafe={...existing,lessons:[{...lesson,test_file:"../../secret.txt"}]};
 assert.ok(assessResolvedFixes(unsafe).failures.includes("unsafe_test_path:"+lesson.id));
});
test("Merged bugfix discovery produces human-review candidates, not automatic learned facts",()=>{
 const prs=[
  {number:70,title:"DERGUBA: prevent orphan sections when requested Pasal lacks reviewed primary evidence",mergedAt:"2026-10-20T11:11:25Z",url:"https://github.com/hananakhmad1991-stack/strategic-latitude-intelligence/pull/70"},
  {number:73,title:"DERGUBA legal QA: canonical full-name law references and protect export gates",mergedAt:"2026-10-20T12:00:00Z",url:"https://github.com/hananakhmad1991-stack/strategic-latitude-intelligence/pull/73"},
  {number:80,title:"fix: avoid repeated partial citation exports",mergedAt:"2026-10-20T12:05:00Z",url:"https://github.com/hananakhmad1991-stack/strategic-latitude-intelligence/pull/80"},
  {number:81,title:"Feature: historical bibliography",mergedAt:"2026-10-20T12:06:00Z",url:"https://github.com/hananakhmad1991-stack/strategic-latitude-intelligence/pull/81"},
  {number:82,title:"fix: old past scenario",mergedAt:"2026-08-20T12:06:00Z",url:"https://github.com/hananakhmad1991-stack/strategic-latitude-intelligence/pull/82"},
  {number:83,title:"fix: unsafe URL",mergedAt:"2026-10-20T12:06:00Z",url:"http://evil.invalid/pull/83"}
 ];
 const report=discoverMergedFixes(prs,loadLessons(),{now:new Date("2026-10-20T13:00:00Z"),days:7});
 assert.deepEqual(report.candidates.map(x=>x.pr_number),[80]);
 assert.equal(report.no_automatic_memory_promotion,true);
 assert.equal(report.no_model_training,true);
 const count=report.candidates.length;
 assert.equal(discoverMergedFixes(prs,loadLessons(),{now:new Date("2026-10-20T13:00:00Z"),days:7}).candidates.length,count);
});
test("Learning registry never holds full user prompts or secret-based training policy",()=>{
 const fixture=JSON.parse(readFileSync(new URL("./fixtures/sli-agent-resolved-lessons.json",import.meta.url),"utf8"));
 assert.match(fixture.update_policy,/Never ingest raw client prompts/);
 assert.ok(fixture.lessons.every(l=>!Object.hasOwn(l,"user_prompt")&&!Object.hasOwn(l,"model_answer")&&!Object.hasOwn(l,"token")));
});

test("Earlier resolved lessons cannot be silently erased or rewritten in a new PR",()=>{
 const before=loadLessons(),after={...before,lessons:before.lessons.slice(1)};
 assert.match(compareRetainedLessons(before,after).failures[0],/removed_resolved_lesson/);
 const changed={...before,lessons:before.lessons.map((x,i)=>i===0?{...x,preventive_rule:"Suppress all errors without tests"}:x)};
 assert.match(compareRetainedLessons(before,changed).failures[0],/changed_resolved_lesson/);
 assert.equal(compareRetainedLessons(before,{...before,lessons:[...before.lessons,{...before.lessons[0],id:"another-regression-case-accepted"}]}).pass,true);
});
