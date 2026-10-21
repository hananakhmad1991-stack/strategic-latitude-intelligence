#!/usr/bin/env node
"use strict";
/* BPS national, no-pay six-product pilot: metadata is never a made-up HS × country value. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const read=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const pilot=read("data/bps-primary-trade-pilot-2025.json");
const primary=read("data/bps-hs-partner-matrix.json");
assert.equal(pilot.schema,"sli-bps-primary-trade-pilot-v1");
assert.equal(pilot.geographic_scope,"Indonesia (national only)");
assert.equal(pilot.reference_period,"2025");
assert.equal(pilot.no_purchase_authorized,true);
assert.equal(pilot.no_synthetic_allocations,true);
assert.equal(pilot.pilot.length,6);
assert.deepEqual([...new Set(pilot.pilot.map(x=>x.sector))].sort(),["food","marine","minerals"]);
assert.deepEqual(pilot.pilot.map(x=>x.hs_code).sort(),["030617","0901","1006","1511","2604","2701"]);
assert.ok(pilot.pilot.every(x=>x.status==="awaiting_bps_joint_cells"&&x.hs_level===x.hs_code.length));
assert.ok(pilot.pilot.every(x=>x.hs_version==="HS2022"&&x.query_directions.includes("exports")&&x.query_directions.includes("imports")));
assert.ok(pilot.candidate_source_leads.every(x=>x.status==="source_lead_only"&&x.geography!=="Indonesia"),"Never treat provincial source leads as national records");
assert.ok(!pilot.pilot.some(x=>Object.keys(x).some(k=>/value_usd|observations|estimated_flow/i.test(k))),"No fabricated 2025 HS-country values");
if(primary.status!=="verified")assert.equal(primary.verified_cells,0);
assert.match(pilot.annual_export_publication,/bps\.go\.id/);
assert.match(pilot.annual_import_publication,/bps\.go\.id/);
console.log("PASS: Six distinct source-query targets across 3 sectors; national-only primary pilot; zero inferred observations.");
