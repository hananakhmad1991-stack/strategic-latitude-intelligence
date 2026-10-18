import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const read=f=>readFileSync(new URL("../"+f,import.meta.url),"utf8");
const chapter=JSON.parse(read("data/sli-geopolitical-chapter.json"));
const official=JSON.parse(read("data/sli-indonesia-original-intelligence.json"));
const news=JSON.parse(read("data/sli-secondary-news-index.json"));

test("Six original geopolitical analyses, citations, bilingual methods and bounded conclusions",()=>{
 assert.equal(chapter.schema_version,"sli-geopolitical-chapter-v1");
 assert.equal(chapter.themes.length,6);
 assert.equal(new Set(chapter.themes.map(x=>x.id)).size,6);
 assert.ok(chapter.assessments.length>=7);
 const metricIds=new Set(official.metrics.map(x=>x.id));
 for(const x of chapter.themes){
  for(const field of ["title","thesis","mechanism","indonesia","counter","watch","id_title","id_mechanism","id_indonesia","id_counter","id_watch"])
   assert.ok(typeof x[field]==="string"&&x[field].length>=15,x.id+" "+field);
  assert.ok(x.mechanism.length>=250&&x.indonesia.length>=250,x.id+" lacks substantive risk path");
  assert.ok(x.evidence.length>0&&x.evidence.every(k=>metricIds.has(k)),x.id+" has invalid official numeric indicator references");
  assert.ok(x.search.length>=4,"Topic monitoring lacks retrieval anchors: "+x.id);
  assert.ok(x.links.every(l=>l.url.startsWith("./")),"Unexpected cross-link in "+x.id);
 }
 assert.equal(chapter.scenarios.length,3);
 assert.ok(chapter.scenarios.every(s=>s.narrative.length>=120&&s.id_narrative.length>=100));
 assert.ok(official.partners.length>=5);
 assert.ok(official.partners.every(x=>x.period==="2025 full year"&&x.source_url.startsWith("https://")));
});
test("Homepage card routes to actual geopolitical SPA chapter, with dedicated sidebar and cross-navigation",()=>{
 const html=read("index.html"),nav=read("js/sli-navigation.js");
 assert.ok(html.includes('<a href="#geopolitics" class="sli-portal-sector"') && html.includes('<strong>Geopolitical Intelligence</strong>'));
 assert.ok(html.includes('<a href="#policy" class="sli-portal-sector"') && html.includes('<strong>Policy &amp; Regulation</strong>'));
 assert.match(html,/data-page="geopolitics"/);
 assert.match(html,/data-link="geopolitics"/);
 assert.match(html,/geopolitics:\["Geopolitical Intelligence"/);
 assert.match(html,/page==='geopolitics'\?'<div id="sliGeoChapterRoot"/);
 assert.match(html,/window\.initSLIGeopoliticsChapter\(\)/);
 assert.match(html,/js\/sli-geopolitics-chapter\.js/);
 assert.match(html,/css\/sli-geopolitics-chapter\.css/);
 assert.match(nav,/geopolitics:\['Geopolitical Intelligence'/);
 assert.match(nav,/index\.html#geopolitics/);
 assert.match(html,/Geopolitical Intelligence Chapter/);
});
test("Real DOM-like rendering produces detailed geopolitics, clickable themes, source-dated chart and attributed news",async()=>{
 const root=new Element("div");root.id="sliGeoChapterRoot";
 const document={
  createElement:t=>new Element(t),
  getElementById:id=>id==="sliGeoChapterRoot"?root:null,
  addEventListener:()=>{},
 };
 const window={SLIi18n:{language:"en"}};
 const urls={
  "./data/sli-geopolitical-chapter.json":chapter,
  "./data/sli-indonesia-original-intelligence.json":official,
  "./data/sli-secondary-news-index.json":{
   schema_version:"sli-secondary-news-index-v1",updated_at_utc:"2026-10-18T12:58:30Z",
   articles:[
    {title:"Two ships damaged near Hormuz after projectile strikes — Reuters",publisher:"Reuters",sector:"energy",url:"https://www.reuters.com/world/middle-east/example",published_at_utc:"2026-10-17T08:00:00Z",evidence_level:"publisher_attributed_news_report"},
    {title:"CGTN reports expansion of artificial intelligence data centers in China",publisher:"CGTN",sector:"ai",url:"https://news.cgtn.com/news/example",published_at_utc:"2026-10-17T09:00:00Z",evidence_level:"publisher_attributed_news_report"}
   ]
  }
 };
 const fetch=async uri=>({ok:!!urls[uri],json:async()=>urls[uri]});
 runInNewContext(read("js/sli-geopolitics-chapter.js"),{window,document,fetch,URL,Intl,Date,Promise}, {filename:"sli-geopolitics-chapter.js"});
 await window.initSLIGeopoliticsChapter();
 const all=flatten(root),texts=all.map(x=>x.textContent||"");
 assert.ok(texts.includes("Geopolitical Intelligence"));
 assert.ok(texts.includes("Strait of Hormuz and trade-route disruptions"));
 assert.ok(texts.some(t=>t.includes("US$146.3bn")));
 assert.ok(texts.some(t=>t.includes("US$67.04bn")),"Bilateral partner chart was not rendered");
 assert.ok(texts.some(t=>t.includes("Two ships damaged near Hormuz")),"News record was not displayed");
 assert.ok(texts.some(t=>t.includes("CGTN reports expansion")),"AI coverage was not eligible");
 const topics=all.filter(x=>x.className.startsWith("geo-intel-topic")&&x.tag==="button");
 assert.equal(topics.length,6);
 topics[3].listeners.get("click")?.();
 assert.ok(flatten(root).some(x=>x.textContent==="AI chips, cloud sovereignty and data-center competition"));
 // Switching locale keeps the same source data but renders the original Bahasa narratives.
 window.SLIi18n.language="id";
 await window.initSLIGeopoliticsChapter();
 assert.ok(flatten(root).some(x=>x.textContent==="Intelijen Geopolitik"));
 assert.ok(flatten(root).some(x=>x.textContent==="Selat Hormuz dan gangguan rute perdagangan"));
});
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.id="";this.className="";this.textContent="";this.style={};this.listeners=new Map();this.attrs={};this.isConnected=true;this.value=""}
 append(...items){this.children.push(...items)}
 replaceChildren(...items){this.children=[...items]}
 setAttribute(k,v){this.attrs[k]=v}
 addEventListener(k,fn){this.listeners.set(k,fn)}
 getAttribute(k){return this.attrs[k]}
}
function flatten(n){
 return [n,...(n.children||[]).flatMap(v=>v&&typeof v==="object"?flatten(v):[])];
}

test("1950–present geopolitical events, source-dated commodity plots, and monitoring integration",()=>{
 const events=JSON.parse(read("data/sli-geopolitical-events.json"));
 const prices=JSON.parse(read("data/sli-geopolitical-commodity-prices.json"));
 const html=read("index.html"),chapterJs=read("js/sli-geopolitics-chapter.js"),graph=read("js/sli-geopolitical-timeline.js");
 assert.ok(events.events.length>=15);
 assert.equal(events.events[0].date.slice(0,4),"1950");
 assert.ok(events.events.every(x=>x.source_url.startsWith("https://")&&x.record_status==="historical_source_attributed"));
 assert.match(html,/sli-geopolitical-timeline\.js/);
 assert.match(html,/sli-geopolitical-timeline\.css/);
 assert.match(chapterJs,/id="sliGeoTimelineRoot"/);
 assert.match(chapterJs,/initSLIGeopoliticalTimeline/);
 assert.match(graph,/function pearson\(/);
 assert.match(graph,/publisher_publication_date/);
 assert.match(graph,/until reviewed|tidak otomatis|excluded from statistical event indicators/i);
 assert.equal(JSON.parse(read("data/sli-geopolitical-chapter.json")).assessments.length,8);
 assert.ok(Array.isArray(prices.observations));
 if(prices.observations.length){
  assert.ok(prices.observations.length>=780);
  assert.ok(prices.observations[0].month.startsWith("1960"));
  assert.ok(prices.series_coverage.wti.first.startsWith("1982"));
  assert.ok(prices.series_coverage.coal_australia);
  assert.ok(prices.observations.every(o=>Number.isFinite(o.brent)&&o.brent>0));
 }
});

test("1950 historical axis and safe multi-benchmark computation",()=>{
 const graph=read("js/sli-geopolitical-timeline.js");
 const win={SLIi18n:{language:"en"}},doc={};
 runInNewContext(graph,{window:win,document:doc,URL,Intl,Date,Math,Number,Set,Map,Promise,console},{filename:"sli-geopolitical-timeline.js"});
 const tools=win.SLIGeoTimelineCompute;
 assert.ok(tools);
 const prices=JSON.parse(read("data/sli-geopolitical-commodity-prices.json"));
 const events=JSON.parse(read("data/sli-geopolitical-events.json")).events;
 assert.ok(events[0].date.startsWith("1950"));
 assert.equal(prices.observations[0].month,"1960-01");
 assert.ok(prices.series_coverage.wti.first.startsWith("1982"));
 for(const key of ["brent","wti","dubai","coal_australia","gas_europe","lng_japan","nickel","copper","tin","aluminum","gold","silver"]){
  assert.ok(prices.series_coverage[key]?.count>300,key+" data coverage missing");
  const series=tools.seriesFrom(prices.observations,key,1950);
  assert.equal(series[0].month,prices.series_coverage[key].first,key+" improperly backfilled");
  assert.ok(series.every(p=>p.value>0&&p.month>="1960-01"),key+" includes invalid or pre-1960 observations");
 }
 assert.equal(tools.returns([{month:"2020-01",value:100},{month:"2020-03",value:150}]).length,0,"Do not infer changes across missing February");
 assert.equal(tools.returns([{month:"2020-01",value:100},{month:"2020-02",value:110}]).length,1);
 const wti=tools.seriesFrom(prices.observations,"wti",1950);
 const desc=tools.eventStats(wti,events);
 assert.ok(desc.monthly.length>300);
 assert.ok(desc.r===null||(desc.r>=-1&&desc.r<=1));
 assert.match(graph,/common|first common observed month/);
 assert.match(graph,/group==="cross"/);
 assert.match(graph,/Different physical units detected/);
 assert.match(graph,/Maximum five lines per chart/);
 assert.match(graph,/year\*12/);
 assert.match(graph,/tx\("From year","Mulai tahun"\)/);
 assert.match(graph,/1950,1960,1970/);
});
