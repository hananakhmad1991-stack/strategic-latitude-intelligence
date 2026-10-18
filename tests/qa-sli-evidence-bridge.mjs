import {test} from "node:test";
import assert from "node:assert/strict";
import {bridgeEvidence,vetOsintRecord} from "../research-api/src/evidence-bridge.mjs";
test("cross-sector investment question links electricity and inequality without unrelated sources",()=>{
 const docs=[
  {id:"a",topic:"electricity",title:"Grid power in Jawa Tengah",text:"PLN supply",source_url:"https://example.org/a"},
  {id:"b",topic:"regional",title:"Gini inequality in Jawa Tengah",text:"BPS",source_url:"https://example.org/b"},
  {id:"c",topic:"football",title:"Unrelated sports",text:"irrelevant",source_url:"https://example.org/c"}
 ];
 const x=bridgeEvidence("Prospek investasi data center Jawa Tengah dan ketimpangan",docs);
 assert.ok(x.some(y=>y.id==="a"));assert.ok(x.some(y=>y.id==="b"));assert.ok(!x.some(y=>y.id==="c"));
});
test("OSINT intake remains unverified; reject forged/invalid links and dates",()=>{
 const item={title:"Electricity announcement",publisher:"Official",published_at:"2026-10-01T00:00:00Z",url:"https://example.org/release"};
 assert.equal(vetOsintRecord(item).verification,"external_claim_unverified_pending_primary_source");
 assert.equal(vetOsintRecord({...item,url:"http://example.org"}),null);
 assert.equal(vetOsintRecord({...item,url:"https://localhost/private"}),null);
 assert.equal(vetOsintRecord({...item,published_at:"not-a-date"}),null);
});
