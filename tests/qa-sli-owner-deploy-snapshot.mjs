import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflow=fs.readFileSync(new URL("../.github/workflows/sli-owner-worker-deploy.yml",import.meta.url),"utf8");

test("Owner deploy requires deliberate dispatch, not pull request",()=>{
  assert.match(workflow,/if: \$\{\{ github\.event_name == 'workflow_dispatch' && inputs\.action == 'deploy-owner-staging' \}\}/);
  assert.match(workflow,/environment: sli-owner-staging/);
});

test("A stale committed index is never deployed; the vetted same-run source snapshot is used",()=>{
  assert.match(workflow,/python scripts\/build_research_unified_index\.py\n\s+python scripts\/audit_sli_research_index\.py/);
  assert.match(workflow,/sha256sum data\/sli-research-unified-index\.json > artifacts\/sli-owner-index\.sha256/);
  assert.match(workflow,/printf '%s\\n' "\$GITHUB_SHA" > artifacts\/sli-owner-source-sha\.txt/);
  assert.match(workflow,/name: sli-owner-validated-index-\$\{\{ github\.run_id \}\}/);
  assert.match(workflow,/actions\/download-artifact@v4/);
  assert.match(workflow,/test "\$\(cat artifacts\/sli-owner-source-sha\.txt\)" = "\$GITHUB_SHA"/);
  assert.match(workflow,/sha256sum --check artifacts\/sli-owner-index\.sha256/);
  assert.match(workflow,/python scripts\/build_research_unified_index\.py --check/);
  const verify=workflow.indexOf("- name: Verify pinned source, index integrity, and deterministic audit before deploy");
  const deploy=workflow.indexOf("- name: Deploy owner-only Worker");
  assert.ok(verify>=0&&deploy>verify,"Snapshot must be verified BEFORE Cloudflare deploy");
  assert.doesNotMatch(workflow,/Refusing deployment: committed public Research AI index is not synchronized/);
});

test("No customer deployment, no live secrets in artifact and no unverified public publication",()=>{
  assert.match(workflow,/name: sli-owner-validated-index-\$\{\{ github\.run_id \}\}/);
  assert.match(workflow,/artifacts\/sli-owner-index\.sha256/);
  assert.match(workflow,/artifacts\/sli-owner-source-sha\.txt/);
  assert.match(workflow,/path: \|\n\s+data\/sli-research-unified-index\.json/);
  assert.match(workflow,/wrangler\.owner-test\.toml\.example/);
  assert.doesNotMatch(workflow,/wrangler\.pro\.toml/);
  const artifactSection=workflow.split("- name: Seal validated source-commit index for explicit Owner staging")[1]
    ?.split("- name: Summarize owner-readiness limits")[0];
  assert.ok(artifactSection);
  assert.doesNotMatch(artifactSection,/OWNER_TEST_TOKEN|OPENAI_API_KEY|CLOUDFLARE_API_TOKEN/);
});
