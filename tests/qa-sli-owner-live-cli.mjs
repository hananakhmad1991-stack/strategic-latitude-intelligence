import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawnSync} from "node:child_process";

const path=new URL("../scripts/qa-owner-staging-live.mjs",import.meta.url);
const source=fs.readFileSync(path,"utf8");

test("Owner live smoke refuses to run without locally supplied secret",()=>{
  const result=spawnSync(process.execPath,[path.pathname],{
    env:{...process.env,SLI_OWNER_TEST_TOKEN:""},
    encoding:"utf8",timeout:10000
  });
  assert.equal(result.status,2);
  assert.match(result.stderr,/Missing SLI_OWNER_TEST_TOKEN/);
  assert.ok(!result.stdout.includes("PASS"));
});

test("Owner live smoke uses fixed allowlisted host, never prints or persists token",()=>{
  assert.match(source,/sli-research-owner-test\\.hananakhmad1991\\.workers\\.dev/);
  assert.match(source,/process\.env\.SLI_OWNER_TEST_TOKEN/);
  assert.match(source,/!\/\^https:/);
  assert.doesNotMatch(source,/console\.(?:log|error)\(token\)/);
  assert.doesNotMatch(source,/writeFileSync|localStorage|sessionStorage|GITHUB_OUTPUT|GITHUB_STEP_SUMMARY/);
  assert.match(source,/auth_token_printed:false/);
  assert.match(source,/--include-paid-model/);
  assert.match(source,/await wait\(65000\)/);
});
