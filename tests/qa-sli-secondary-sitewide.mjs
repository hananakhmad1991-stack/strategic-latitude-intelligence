import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {runInNewContext} from "node:vm";
const root=new URL("../",import.meta.url);
const read=p=>readFileSync(new URL(p,root),"utf8");

test("every standalone and primary dashboard gets central secondary-news mounting through shared navigation",()=>{
 const pages=readdirSync(root).filter(x=>x.endsWith(".html"));
 assert.ok(pages.length>=36);
 const nav=read("js/sli-navigation.js"),css=read("css/sli-navigation.css");
 assert.match(nav,/mountSecondaryEvidence/);
 assert.match(nav,/sli-secondary-evidence\.js/);
 assert.match(css,/\.sli-secondary-universal/);
 for(const page of pages){
  const body=read(page);
  assert.ok(body.includes("js/sli-navigation.js"),page+" missing global navigation / secondary evidence mount");
  assert.ok(body.includes("css/sli-navigation.css"),page+" missing global evidence panel styling");
 }
});
test("secondary evidence UI is passive until opened, uses safe attributed records and works across sector routes",()=>{
 const window={addEventListener(){},SLIi18n:{language:"id"}};
 const document={readyState:"loading",documentElement:{lang:"id"},addEventListener(){}};
 const location={pathname:"/strategic-latitude-intelligence/index.html",hash:"#ai"};
 runInNewContext(read("js/sli-secondary-evidence.js"),{window,document,location,URL,Date,Intl}, {filename:"sli-secondary-evidence.js"});
 const w=window.SLISecondaryEvidence;
 assert.equal(w?.installed,true);
 assert.equal(w.scopeFor("/strategic-latitude-intelligence/index.html","#minerals"),"minerals");
 assert.equal(w.scopeFor("/strategic-latitude-intelligence/index.html","#energy"),"energy");
 assert.equal(w.scopeFor("/strategic-latitude-intelligence/index.html","#investment"),"regional");
 assert.equal(w.scopeFor("/strategic-latitude-intelligence/ai-infrastructure.html"),"ai");
 assert.equal(w.scopeFor("/strategic-latitude-intelligence/climate-environment.html"),"energy");
 assert.equal(w.scopeFor("/strategic-latitude-intelligence/provincial-intelligence.html"),"regional");
 const d={articles:[
  {title:"China AI data center capacity and investment",publisher:"CGTN",sector:"ai",geo:"Asia",topic:"GPU",published_at_utc:"2026-10-18T07:00:00Z"},
  {title:"Indonesia smelter downstream investment",publisher:"ANTARA",sector:"minerals",geo:"Indonesia",topic:"nickel",published_at_utc:"2026-10-18T06:00:00Z"},
  {title:"Oil exports and Hormuz sea route",publisher:"Reuters",sector:"energy",geo:"Asia",topic:"geopolitics",published_at_utc:"2026-10-18T08:00:00Z"}
 ]};
 assert.equal(w.rowsFor(d,{sector:"ai"})[0].publisher,"CGTN");
 assert.equal(w.rowsFor(d,{sector:"all",term:"Reuters"})[0].title,"Oil exports and Hormuz sea route");
 assert.equal(w.rowsFor(d,{sector:"minerals"})[0].publisher,"ANTARA");
 const script=read("js/sli-secondary-evidence.js");
 assert.match(script,/textContent=String/);
 assert.match(script,/el\('a'/);
 assert.match(script,/cache:'no-store'/);
 assert.match(script,/not independently checked article text/);
});
test("all 14 source feeds are archived as secondary observations; no event is silently marked verified",()=>{
 const doc=JSON.parse(read("data/sli-secondary-news-index.json"));
 assert.equal(doc.schema_version,"sli-secondary-news-index-v1");
 for(const key of ["domestic-energy","geopolitical-energy","climate-official-alerts","research-signal-radar","investment-news","ai-monitoring","regulatory-monitor"])
  assert.ok(doc.source_snapshots.includes(key),"monitoring source omitted: "+key);
 assert.ok(doc.count>=400,"Expected latest indexed SLI media corpus");
 assert.equal(doc.count,doc.articles.length);
 assert.ok(doc.articles.every(a=>["publisher_attributed_news_report","official_metadata_change_candidate"].includes(a.evidence_level)));
 assert.ok(doc.articles.every(a=>a.article_body_checked===false),"RSS publication not independently inspected");
});
