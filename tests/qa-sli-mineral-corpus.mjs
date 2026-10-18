import {test} from "node:test";import assert from "node:assert/strict";import {nationalMineralEvidence} from "../research-api/src/mineral-corpus.mjs";
test("existing 2026 USGS reserve and 2025 ESDM evidence is available to AI",()=>{
 const docs=nationalMineralEvidence();assert.ok(docs.length>=5);
 const nickel=docs.find(d=>d.id==="sli_mineral_nickel_reserves_2026");
 assert.ok(nickel);assert.match(nickel.text,/62000000 t Ni/);
 assert.ok(docs.some(d=>d.id==="sli_mineral_esdm_supply_index"&&d.text.includes("86.4")));
 assert.ok(docs.every(d=>d.source_url.startsWith("https://")&&d.geo==="Indonesia"));
});
