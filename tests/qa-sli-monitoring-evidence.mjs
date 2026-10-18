import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeMonitoringEvidence,fetchMonitoringEvidence} from "../research-api/src/monitoring-evidence.mjs";
import {selectResearchEvidence} from "../research-api/src/assistant-core.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const make=(publisher,title,sector="energy",n=1)=>({
 id:"sli_feed_"+String(n).padStart(25,"a"),
 title,publisher,url:"https://news.google.com/rss/articles/ABC"+n+"?oc=5",
 published_at_utc:"2026-10-18T10:00:00Z",date_type:"publisher_publication_date",
 sector,topic:"geopolitical news",geo:"Indonesia and global context",
 monitor_source:"investment-news",link_kind:"aggregator",
 evidence_level:"publisher_attributed_news_report",article_body_checked:false
});
test("Reuters and CGTN are admitted without preapproval but never promoted to checked primary facts",()=>{
 const doc={schema_version:"sli-secondary-news-index-v1",articles:[
  make("Reuters","Reuters reports closure of Hormuz oil tanker shipping lane","energy",1),
  make("CGTN","CGTN reports expanded Chinese AI data center cooperation with Indonesia","ai",2)
 ]};
 const all=normalizeMonitoringEvidence(doc,Date.parse("2026-10-18T13:00:00Z"));
 assert.equal(all.length,2);
 assert.match(all[0].text,/reported in a news headline/);
 assert.match(all[0].text,/not article-body or independent event verification/);
 assert.equal(all[1].publisher,"CGTN");
 const matches=selectResearchEvidence(all,"Reuters reports closure of Hormuz oil tanker shipping lane",[],"pro",4);
 assert.equal(matches[0]?.publisher,"Reuters");
 const ai=selectResearchEvidence(all,"Chinese AI data center cooperation",[],"pro",4);
 assert.equal(ai[0]?.publisher,"CGTN");
});
test("source index is not a remote arbitrary URL fetch and malformed records fail closed",async()=>{
 const raw=make("Reuters","Reuters reports closure of Hormuz oil tanker shipping lane","energy",3);
 const data={schema_version:"sli-secondary-news-index-v1",articles:[raw,{...raw,id:"sli_feed_"+("b".repeat(25)),url:"http://example.org/bad"},{...raw,id:"sli_feed_"+("c".repeat(25)),url:"https://127.0.0.1/private"}]};
 const fetcher=async url=>{
  assert.match(url,/strategic-latitude-intelligence\/data\/sli-secondary-news-index\.json$/);
  return {ok:true,headers:{get:()=>null},text:async()=>JSON.stringify(data)};
 };
 const oldNow=Date.now;
 try{
  Date.now=()=>Date.parse("2026-10-18T13:00:00Z");
  const result=await fetchMonitoringEvidence(fetcher);
  assert.equal(result.registered_count,1);
  assert.equal(result.documents[0].verification_status,"publisher_attributed");
 }finally{Date.now=oldNow}
});
test("a legal-document metadata change is not declared enacted legislation",()=>{
 const row={...make("EU Official Journal","Regulation publication page listing has changed","regional",4),
 evidence_level:"official_metadata_change_candidate"};
 const [record]=normalizeMonitoringEvidence({schema_version:"sli-secondary-news-index-v1",articles:[row]},Date.parse("2026-10-18T13:00:00Z"));
 assert.match(record.text,/NOT evidence that a regulation was enacted/);
});
test("on-disk index covers all 11 snapshots, preserves many records and states scope honestly",()=>{
 const index=JSON.parse(read("data/sli-secondary-news-index.json"));
 assert.equal(index.schema_version,"sli-secondary-news-index-v1");
 assert.equal(index.source_snapshots.length,11);
 assert.ok(index.count>=300);
 assert.ok(index.articles.every(r=>r.evidence_level!=="claim_verified"));
 const worker=read("research-api/src/owner-test-worker.mjs");
 assert.match(worker,/fetchMonitoringEvidence/);
 assert.match(worker,/attributed_secondary_sources/);
 assert.match(worker,/Reuters, CGTN, ANTARA/);
});
