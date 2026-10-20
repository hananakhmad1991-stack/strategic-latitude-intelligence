import {test} from "node:test";
import assert from "node:assert/strict";
import {screenClaimAgainstPdfPages} from "../research-api/src/pdf-page-screen.mjs";
const fixture={schema:"sli-official-pdf-pages-v1",
 source_url:"https://www.esdm.go.id/assets/report.pdf",document_sha256:"a".repeat(64),
 pages:[
 {page:1,text_sha256:"1".repeat(64),text_excerpt:"The front matter is an introduction.",text_truncated:false},
 {page:2,text_sha256:"2".repeat(64),text_excerpt:"The refinery has a planned capacity of 120 MW for 2027, and no commissioning date has been confirmed.",text_truncated:false},
 {page:3,text_sha256:"3".repeat(64),text_excerpt:"Capital spending estimates for other assets are still under review.",text_truncated:false}
 ]};
test("locates literal matching page, but does not certify an unsupported operational claim",()=>{
 const r=screenClaimAgainstPdfPages("The refinery started commercial operations at 120 MW in 2027.",fixture);
 assert.equal(r.status,"page_candidates_screened_not_verified");
 assert.equal(r.verified,false);
 assert.equal(r.candidates[0].page,2);
 assert.equal(r.candidates[0].visual_review_required,true);
 assert.match(r.note,/do not prove/);
});
test("flags numeric quantities absent from nominated PDF page text",()=>{
 const r=screenClaimAgainstPdfPages("The refinery constructed 999 MW in 2027.",fixture);
 assert.ok(r.candidates.some(p=>p.missing_numbers.includes("999 MW")));
 assert.equal(r.verified,false);
});
test("rejects tampered manifest shape, invalid page and nonofficial URL",()=>{
 assert.equal(screenClaimAgainstPdfPages("x",{...fixture,source_url:"https://publisher.example/report.pdf"}).status,"invalid_or_unreviewed_manifest");
 assert.equal(screenClaimAgainstPdfPages("x",{...fixture,pages:[{...fixture.pages[0],page:0}]}).status,"invalid_or_unreviewed_manifest");
 assert.equal(screenClaimAgainstPdfPages("x",{...fixture,document_sha256:"BAD"}).status,"invalid_or_unreviewed_manifest");
});
