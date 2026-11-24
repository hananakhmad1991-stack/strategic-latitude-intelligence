import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Prelaunch catalog has exactly three honest product tiers, no active payment",()=>{
 const p=JSON.parse(read("data/sli-membership-plans.json"));
 assert.deepEqual(p.tiers.map(x=>x.id),["open","pro","enterprise"]);
 assert.equal(p.checkout_enabled,false);
 assert.equal(p.publication_status,"prelaunch");
 assert.equal(p.account.registration_enabled,false);
 assert.equal(p.account.login_enabled,false);
 assert.equal(p.account.payment_provider,"not_selected");
 assert.equal(p.tiers[0].pricing_status,"free");
 for(const tier of p.tiers){assert.equal(tier.monthly_price,null);assert.equal(tier.annual_price,null);assert.ok(tier.features.length>=4)}
});
test("Public access pages have no subscription pricing or checkout",()=>{
 const nav=read("js/sli-navigation.js"),index=read("index.html"),membership=read("sli-membership.html");
 assert.ok(!nav.includes("text('Pricing','Harga')"));
 assert.ok(!nav.includes("link('membership')"));
 assert.ok(!index.includes("SLI Membership Open Pro Enterprise"));
 assert.match(membership,/Open access to Strategic Latitude Intelligence/);
 assert.match(membership,/Akses terbuka/);
 assert.match(membership,/owner-only access retain existing restrictions/);
 for(const file of ["sli-membership.html","sli-business-info.html","sli-products.html"]){
 const html=read(file);
 assert.doesNotMatch(html,/Rp\s*(?:249|749)[.,]000|IDR\s*(?:249|749)[.,]000|stripe\.com\/checkout|midtrans\.com\/checkout/i);
 }
 assert.doesNotThrow(()=>new Function(nav));
});
test("Worker never trusts browser tier claims or exposes unverified payment route",()=>{
 const worker=read("membership-api/src/index.js");
 assert.ok(worker.includes("verifyUserToken"));
 assert.ok(worker.includes("getEntitlement"));
 assert.ok(worker.includes("crypto.subtle.verify"));
 assert.ok(worker.includes("access_until"));
 assert.ok(worker.includes("PREMIUM_BUCKET.get"));
 assert.ok(!worker.includes('"/v1/checkout"'));
 assert.ok(!worker.includes("clientProvidedPlan"));
});

test("Target tier policy is deliberately preview-limited and single-device is not falsely active",()=>{
 const p=JSON.parse(read("data/sli-membership-plans.json"));
 assert.equal(p.entitlement_activation_status,"planned_not_enforced_on_public_github_pages");
 assert.equal(p.policy.single_device_limit_is_live,false);
 assert.equal(p.access_design.device_policy.status,"design_only_not_enforced");
 assert.equal(p.tiers[0].active_devices_per_user,1);
 assert.equal(p.tiers[1].active_devices_per_user,1);
 assert.equal(p.open_preview_limits.news_monitoring.includes("five"),true);
 assert.match(p.open_preview_limits.strategic_map,/limited|Selected/i);
 assert.match(p.tiers[1].features.join(" "),/38-province/);
 assert.match(p.tiers[2].features.join(" "),/Weekly sector-specific monitoring/);
 assert.equal(p.tiers[2].delivery.weekly_sector_report,"weekly_when_explicitly_included_in_signed_contract");
 const html=read("sli-membership.html");
 assert.match(html,/without subscriptions/);
});
