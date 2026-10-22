import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const kkp=readFileSync(new URL("../.github/workflows/sli-kkp-live-source-acceptance.yml",import.meta.url),"utf8");
const owner=readFileSync(new URL("../.github/workflows/sli-owner-kkp-authenticated-smoke.yml",import.meta.url),"utf8");
test("KKP workflow has explicit informed export consent and no paid model trigger",()=>{
 assert.match(kkp,/authorize_kkp_form_submission:/);
 assert.match(kkp,/environment: sli-kkp-data-acquisition/);
 assert.doesNotMatch(kkp,/authorize_paid_owner_test|authorized-owner-smoke|SLI_OWNER_TEST_TOKEN|SLI_PAID_OWNER_TEST_OPT_IN/);
 assert.doesNotMatch(kkp,/run: node scripts\/probe_sli_owner_worker_live\.mjs/);
});
test("KKP public QA does not submit an empty official questionnaire",()=>{
 assert.match(kkp,/run: node scripts\/probe_kkp_questionnaire_controls\.mjs/);
 assert.doesNotMatch(kkp,/run: node scripts\/probe_kkp_public_download\.mjs/);
});
test("Owner AI paid smoke is separate, opt-in and gated by protected staging secret",()=>{
 assert.match(owner,/workflow_dispatch:/);
 assert.match(owner,/authorize_paid_owner_test:/);
 assert.match(owner,/default: false/);
 assert.match(owner,/environment: sli-owner-staging/);
 assert.match(owner,/SLI_OWNER_TEST_TOKEN: \$\{\{ secrets\.SLI_OWNER_TEST_TOKEN \}\}/);
 assert.match(owner,/SLI_REQUIRE_OWNER_POSITIVE: 'true'/);
 assert.doesNotMatch(owner,/KKP_CONTACT_NAME|authorize_kkp_form_submission|export_kkp_hatchery_authorized/);
});
