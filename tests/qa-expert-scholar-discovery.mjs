import test from "node:test";
import assert from "node:assert/strict";
import {discoverScholarlyExperts,lookupDoiMetadata} from "../research-api/src/expert-scholar-discovery.mjs";
test("does not call external APIs without feature opt-in",async()=>{
 assert.equal((await discoverScholarlyExperts("energy security")).status,"disabled");
 assert.equal((await lookupDoiMetadata("10.1234/example")).status,"disabled");
});
test("scholarly discovery marks candidates uncontacted",async()=>{
 const fetcher=async()=>({ok:true,json:async()=>({results:[{title:"Energy Security",doi:"https://doi.org/10.1234/example",publication_year:2025,authorships:[{author:{id:"https://openalex.org/A1234",display_name:"Scholar A"},institutions:[{display_name:"University",country_code:"ID"}]}]}]})});
 const r=await discoverScholarlyExperts("energy security",{enabled:true,fetcher});
 assert.equal(r.status,"discovery_only");assert.equal(r.candidates[0].status,"uncontacted_public_candidate");
 assert.equal(r.candidates[0].works[0].year,2025);
});
test("Crossref DOI metadata is descriptive, not fact-check",async()=>{
 const r=await lookupDoiMetadata("10.1234/example",{enabled:true,fetcher:async()=>({ok:true,json:async()=>({message:{DOI:"10.1234/example",title:["Paper"],publisher:"Publisher",published:{"date-parts":[[2025]]}}})})});
 assert.equal(r.status,"metadata_found");assert.match(r.provenance,/not independent/);
});
test("rejects malformed DOI",async()=>assert.equal((await lookupDoiMetadata("javascript:alert(1)",{enabled:true})).status,"invalid_doi"));
