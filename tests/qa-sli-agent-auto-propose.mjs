import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validatedCandidates,selectCandidate,planPatch} from "../scripts/sli-agent-auto-propose.mjs";
import {inferMethod, getMethod} from "../js/sli-analytical-core.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const copy=()=>JSON.parse(read("tests/fixtures/sli-reviewed-autonomous-candidates.json"));
test("curated improvement backlog includes bounded, nonconfidential, method-status-accurate cases",()=>{
 const out=validatedCandidates();
 assert.ok(out.length>=3);
 assert.ok(out.every(c=>getMethod(c.method).status===c.expected_status));
 assert.equal(out[0].phrase,"regresi linear berganda");
});
test("agent selects an actual intent regression but refuses to override other explicit methods",()=>{
 const chosen=selectCandidate();
 // After approval/merge a case can be resolved; support both reviewed states.
 if(chosen){
  assert.equal(inferMethod(chosen.prompt),"auto");
  const plan=planPatch();
  assert.equal(plan.status,"patch_ready");
  assert.equal(plan.files.length,2);
  assert.ok(plan.output.routes.includes(JSON.stringify(chosen.phrase)));
  assert.ok(plan.output.fixture.includes('"id": "auto_'+chosen.id+'"'));
  assert.match(plan.guard,/human merge required/);
 }else assert.equal(planPatch().status,"no_safe_candidate");
});
test("agent refuses untrusted mutations, invalid method status and unreviewed queue fields",()=>{
 const seed=copy();
 const mutations=[
  {phrase:'bad"); process.exit(0);//'},
  {method:"unknown-method"},
  {expected_status:"local",method:"did"},
  {category:"arbitrary_file_write"},
  {id:"unsafe/../workflow"},
  {prompt:"some data from customer source"}
 ];
 for(const mut of mutations){
  const q={...seed,candidates:[{...seed.candidates[0],...mut}]};
  assert.throws(()=>validatedCandidates(q),/SLI auto-proposer guard/);
 }
});
test("patch generator does not overwrite newer production code or duplicate synonyms",()=>{
 const src=read("js/sli-method-aliases.mjs");
 const selected=selectCandidate();
 if(!selected)return;
 const queue=copy();
 assert.throws(()=>planPatch({queue,routes:"// changed by unknown actor",fixture:JSON.parse(read("tests/fixtures/sli-agent-eval-cases.json"))}),/manual review required/);
 assert.throws(()=>planPatch({queue,routes:src+JSON.stringify(selected.phrase),fixture:JSON.parse(read("tests/fixtures/sli-agent-eval-cases.json"))}),/duplicate alias/);
});
test("production synonym module is a finite rule list, never unrestricted self-modifying code",()=>{
 const src=read("js/sli-method-aliases.mjs");
 assert.match(src,/CURATED_METHOD_SYNONYMS=Object\.freeze/);
 assert.match(src,/export function inferCuratedMethod/);
 const core=read("js/sli-analytical-core.mjs");
 assert.match(core,/inferCuratedMethod\(q\)/);
});

test("autonomous upgrade CI only proposes draft PRs; no auto-merge or production writes",()=>{
 const workflow=read(".github/workflows/sli-agent-autonomous-proposals.yml");
 const prQa=read(".github/workflows/sli-agent-proposed-change-qa.yml");
 assert.match(workflow,/gh pr create.+--draft/);
 assert.match(workflow,/github\.ref == 'refs\/heads\/main'/);
 assert.match(workflow,/expected.*file change|unexpected file change/);
 assert.doesNotMatch(workflow,/gh pr merge|git push origin HEAD:main|wrangler deploy|OPENAI_API_KEY/);
 assert.match(prQa,/pull_request:/);
 assert.match(prQa,/Refuse unintended code or evidence changes/);
 assert.match(prQa,/contents: read/);
 assert.doesNotMatch(prQa,/pull-requests: write|contents: write/);
});
