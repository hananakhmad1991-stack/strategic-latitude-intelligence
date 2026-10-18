import {test} from "node:test";
import assert from "node:assert/strict";
import {bridgeEvidence,vetOsintRecord} from "../research-api/src/evidence-bridge.mjs";
import {modelRequest,validateAssistantPayload} from "../research-api/src/assistant-core.mjs";
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

test("actual Research AI model request carries cited cross-sector links, not fabricated correlations",()=>{
 const evidence=[
  {id:"grid",title:"Jawa Tengah PLN electricity grid",topic:"electricity",text:"Installed grid evidence dated 2025.",source_url:"https://example.org/grid",geo:"Jawa Tengah",period:"2025",source_date:"2026-01-01",publisher:"PLN"},
  {id:"inequality",title:"Jawa Tengah Gini inequality",topic:"regional",text:"Expenditure-based Gini dated 2026.",source_url:"https://example.org/gini",geo:"Jawa Tengah",period:"2026",source_date:"2026-04-01",publisher:"BPS"}
 ];
 const payload=validateAssistantPayload({question:"Analisis investasi data center dan ketimpangan di Jawa Tengah",mode:"deep_research",history:[]});
 const req=modelRequest(payload,evidence,"test-model");
 const input=JSON.parse(req.input[0].content[0].text);
 assert.ok(input.cross_sector_evidence_links.length>=2);
 assert.ok(input.cross_sector_evidence_links.some(x=>x.id==="grid"&&x.citation==="[1]"));
 assert.ok(input.cross_sector_evidence_links.some(x=>x.id==="inequality"&&x.citation==="[2]"));
 assert.match(req.instructions,/NOT demonstrated correlations/);
});
