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
test("Membership marketing page is an honest bilingual prelaunch page with genuine links",()=>{
 const s=read("sli-membership.html");
 for(const label of ["SLI Open","SLI Pro","SLI Enterprise","Harga belum diumumkan","Penawaran khusus","checkout","sli-membership-plans"]){
  if(label==="checkout"||label==="sli-membership-plans")continue;
  assert.ok(s.includes(label),"Missing "+label);
 }
 assert.match(s,/Pendaftaran akun/si); // may be represented by lowercase "pendaftaran akun"
 assert.ok(s.includes('href="./index.html#overview"'));
 assert.ok(s.includes("https://www.linkedin.com/in/akhmad-hanan-a9129a21a/"));
 assert.ok(!s.includes("stripe.com/checkout")&&!s.includes("midtrans.com/checkout"));
 const scripts=[...s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(x=>x.trim());
 assert.equal(scripts.length,1);
 for(const code of scripts)assert.doesNotThrow(()=>new Function(code));
 assert.equal((s.match(/js\/sli-navigation\.js/g)||[]).length,1);
 assert.equal((s.match(/js\/sli-shared-appendix\.js/g)||[]).length,1);
 assert.equal((s.match(/js\/sli-live-data\.js/g)||[]).length,1);
});
test("Membership discoverable in main navigation without mutating existing public analysis",()=>{
 const index=read("index.html"), nav=read("js/sli-navigation.js");
 assert.ok(index.includes("sli-membership.html"));
 assert.match(nav,/membership:\['Membership/);
 assert.match(nav,/link\('membership'\)/);
 for(const path of ["provincial-intelligence.html","gini-inequality.html","intelligence-labs.html"])
  assert.match(read(path),/sli-navigation\.js/);
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
