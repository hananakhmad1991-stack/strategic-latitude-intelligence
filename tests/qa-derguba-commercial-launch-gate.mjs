import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {evaluateDergubaLaunch} from "../scripts/check-derguba-commercial-launch.mjs";

const load=p=>JSON.parse(fs.readFileSync(new URL("../"+p,import.meta.url),"utf8"));
const register=load("data/derguba-commercial-launch-gates.json");
const config=load("data/sli-research-assistant-config.json");
test("Owner staging passes safety gate while PUBLIC paid launch is explicitly BLOCKED",()=>{
 const s=evaluateDergubaLaunch(register,config);
 assert.equal(s.safety_gate_pass,true);
 assert.equal(s.approved,false);
 assert.equal(s.release_status,"NOT_APPROVED");
 assert.equal(s.configuration.customer_api_enabled,false);
 assert.equal(s.configuration.customer_login_enabled,false);
 assert.equal(s.missing_gate_evidence.length,7);
});
test("Customer API and customer login may not switch on before evidence and signoff",()=>{
 for(const c of [{...config,api_enabled:true},{...config,login_enabled:true}]){
   const x=evaluateDergubaLaunch(register,c);
   assert.equal(x.safety_gate_pass,false);
   assert.match(x.warning,/CRITICAL/);
 }
});
test("A checkbox VERIFIED without dated, named HTTPS evidence does not count",()=>{
 const fake=structuredClone(register);
 for(const gate of fake.gates){gate.status="VERIFIED";gate.evidence=[]}
 fake.sign_off="APPROVED";fake.public_release_approved=true;
 const x=evaluateDergubaLaunch(fake,{...config,api_enabled:true,login_enabled:true});
 assert.equal(x.safety_gate_pass,false);
 assert.equal(x.approved,false);
});
test("Official data rights list distinguishes website BPS permission and SSO restrictions",()=>{
 const x=fs.readFileSync(new URL("../docs/derguba-commercial-readiness.md",import.meta.url),"utf8");
 assert.match(x,/BPS's own website terms/);
 assert.match(x,/commercial as well as non-commercial/);
 assert.match(x,/SSO PST/);
 assert.match(x,/https:\/\/www\.bps\.go\.id\/id\/term-of-use/);
 assert.match(x,/https:\/\/pse\.komdigi\.go\.id/);
 assert.match(x,/https:\/\/www\.bi\.go\.id/);
});
