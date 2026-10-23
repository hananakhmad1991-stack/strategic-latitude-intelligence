import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const code=readFileSync(new URL('../research-api/src/expert-crm-worker.mjs',import.meta.url),'utf8');
const schema=readFileSync(new URL('../research-api/migrations/0001_expert_crm.sql',import.meta.url),'utf8');
for(const [name,ok] of [
 ['Access JWT signature verification',code.includes("crypto.subtle.verify")],
 ['Access issuer and audience checks',code.includes("payload.aud.includes(env.CF_ACCESS_AUD)")],
 ['Owner email restriction',code.includes("env.OWNER_EMAIL")],
 ['D1 fail-closed',code.includes("env.EXPERT_CRM_ENABLED!=='true'")],
 ['Origin check for writes',code.includes("origin_denied")],
 ['No unreviewed Confirmed transition',code.includes("confirmation_requires_separate_verified_workflow")],
 ['Confirmed DB check',schema.includes("stage <> 'Confirmed' OR (identity_reviewed=1 AND consent_verified=1)")],
 ['Event audit table',schema.includes('expert_stage_events')]
]){assert.ok(ok,name);console.log('PASS '+name)}
console.log('Static assertions only. Not a deployment or live authentication test.');
