import test from 'node:test';
import assert from 'node:assert/strict';
import {PLANS,effectivePlan,canAccess} from '../src/access.mjs';
import {hashSession} from '../src/sessions.mjs';
import {verifyBillingSignature} from '../src/billing.mjs';
test('plan session limits and subscription expiry fail closed',()=>{
 assert.equal(PLANS.open.sessions,1);
 assert.equal(PLANS.pro.sessions,1);
 assert.equal(PLANS.intelligence_pro.sessions,3);
 assert.equal(effectivePlan({plan:'intelligence_pro',status:'past_due',access_until:'2099-01-01'}),'open');
 assert.equal(effectivePlan({plan:'intelligence_pro',status:'active',access_until:'2020-01-01'}),'open');
 assert.equal(canAccess('open','download'),false);
 assert.equal(canAccess('pro','download'),true);
 assert.equal(canAccess('pro','alerts'),false);
 assert.equal(canAccess('intelligence_pro','alerts'),true);
});
test('hashed session has no raw bearer secret',async()=>{
 const hash=await hashSession('0123456789abcdef'.repeat(4));
 assert.match(hash,/^[a-f0-9]{64}$/);
 assert.ok(!hash.includes('0123456789abcdef'.repeat(4)));
});
test('billing signature rejects missing, forged and stale callbacks',async()=>{
 assert.equal(await verifyBillingSignature('{}','1','0'.repeat(64),'secret',1_800_000_000_000),false);
 assert.equal(await verifyBillingSignature('{}','1800000000','0'.repeat(64),'secret',1_800_000_000_000),false);
});
