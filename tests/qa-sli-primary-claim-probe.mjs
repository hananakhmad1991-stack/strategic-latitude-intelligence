import {test} from "node:test";
import assert from "node:assert/strict";
import {isPrimaryPublisherUrl,probeCitedPrimaryPages} from "../research-api/src/primary-claim-probe.mjs";
const docs=[
 {id:"policy_primary",source_url:"https://www.esdm.go.id/id/media-center/berita-2026",title:"Official"},
 {id:"news",source_url:"https://www.reuters.com/world/sample",title:"Media"},
 {id:"unsafe",source_url:"https://127.0.0.1/private",title:"Unsafe"},
 {id:"gov",source_url:"https://www.bps.go.id/pressrelease/2026/",title:"Statistical release"}
];
const review={items:[
 {claim:"Reported capacity was 120 MW in 2026 [1].",citations:[1]},
 {claim:"Measured index increased to 3.28 percent in 2026 [4].",citations:[4]},
 {claim:"Alleged market movement [2].",citations:[2]}
]};
test("publisher URL probe is strictly HTTPS allowlisted and excludes media, localhost and redirects",()=>{
 for(const url of ["https://127.0.0.1/private","https://www.reuters.com/a",
  "https://www.esdm.go.id.attacker.example/","http://www.esdm.go.id/page",
  "https://user:pass@www.bps.go.id/"])assert.equal(isPrimaryPublisherUrl(url),false,url);
 assert.equal(isPrimaryPublisherUrl("https://www.esdm.go.id/id/berita"),true);
});
test("two bounded official HTML pages only; never claim verified if numbers appear",async()=>{
 const calls=[];
 const fetcher=async(url,init)=>{calls.push({url,init});return {ok:true,status:200,
   headers:{get:(k)=>k==="content-type"?"text/html":null},
   text:async()=>"<html><body>Official observation reports 120 MW and 3.28 percent in 2026</body></html>"}};
 const r=await probeCitedPrimaryPages(review,docs,{fetcher});
 assert.equal(r.status,"completed_bounded_checks");assert.equal(r.checked,2);
 assert.equal(calls.length,2);
 assert.ok(calls.every(x=>x.init.redirect==="manual"));
 assert.ok(calls.every(x=>!x.url.includes("reuters")&&!x.url.includes("127.0.0.1")));
 assert.match(r.review_scope,/not_verification/);
 assert.ok(r.results.every(x=>!/verified|certified/.test(x.status)));
});
test("PDF, non-HTML, redirect and unreachable page safely remain pending",async()=>{
 const one={items:[{claim:"Reported capacity 120 MW in 2026.",citations:[1]}]};
 const bad=await probeCitedPrimaryPages(one,docs,{fetcher:async()=>({ok:true,status:200,headers:{get:()=> "application/pdf"}})});
 assert.equal(bad.results[0].status,"pdf_requires_document_review");
 const red=await probeCitedPrimaryPages(one,docs,{fetcher:async()=>({ok:false,status:302})});
 assert.equal(red.results[0].status,"publisher_unavailable_or_redirect");
 const failure=await probeCitedPrimaryPages(one,docs,{fetcher:async()=>{throw Error("timeout")}});
 assert.equal(failure.results[0].status,"publisher_fetch_failed_or_timed_out");
});
test("disabled probe sends no requests and retains transparent review scope",async()=>{
 let count=0;
 const o=await probeCitedPrimaryPages(review,docs,{enabled:false,fetcher:async()=>{count++;throw Error("should not run")}});
 assert.equal(count,0);assert.equal(o.checked,0);assert.match(o.review_scope,/not_verification/);
});
