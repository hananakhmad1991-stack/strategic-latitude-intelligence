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
 appendChild(item){this.children.push(item);return item}
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

test("Multi-commodity atlas actually renders three independent charts with selectable benchmarks",async()=>{
 const root=new Element("div");root.id="sliGeoTimelineRoot";
 const doc={
  createElement:t=>new Element(t),
  createElementNS:(_ns,t)=>new Element(t),
  getElementById:id=>id==="sliGeoTimelineRoot"?root:null
 };
 const events=JSON.parse(read("data/sli-geopolitical-events.json"));
 const prices=JSON.parse(read("data/sli-geopolitical-commodity-prices.json"));
 const fetch=async url=>({ok:true,json:async()=>{
  if(url.endsWith("sli-geopolitical-events.json"))return events;
  if(url.endsWith("sli-geopolitical-commodity-prices.json"))return prices;
  return {articles:[]};
 }});
 const win={SLIi18n:{language:"id"}};
 runInNewContext(read("js/sli-geopolitical-timeline.js"),{window:win,document:doc,fetch,URL,Intl,Date,Math,Number,Set,Map,Promise,console},{filename:"sli-geopolitical-timeline.js"});
 await win.initSLIGeopoliticalTimeline();
 const all=flatten(root);
 const labels=all.map(x=>String(x.textContent||""));
 for(const name of ["Komoditas energi","Komoditas mineral dan logam","Perbandingan lintas komoditas","1950","Minyak WTI","Nikel"]){
  assert.ok(labels.some(x=>x.includes(name)),"Missing chart control or historical year: "+name);
 }
 assert.equal(all.filter(x=>x.className==="sli-geo-timeline-panel").length,4);
 assert.equal(all.filter(x=>x.className==="sli-geo-timeline-plot").length,3);
 assert.ok(all.filter(x=>x.tag==="svg").length>=6,"Three graph/scatter pairs must render");
 assert.ok(labels.some(x=>x.includes("basis")), "Index baseline should be disclosed");
 const selectors=all.filter(x=>x.tag==="select");
 assert.ok(selectors.length>=5);
 const year=selectors[0];
 year.value="1990";year.listeners.get("change")?.();
 assert.ok(flatten(root).some(x=>(x.textContent||"").includes("1990")));
 // Switching to Single drops the other selections in the energy panel.
 const energyMode=selectors[2];energyMode.value="single";energyMode.listeners.get("change")?.();
 const plot=flatten(root).find(x=>x.className==="sli-geo-timeline-legend");
 assert.ok(plot&&plot.children.length===1,"Single should display exactly one series");
});

test("Clicking a gold event synchronizes all three charts and opens sourced bilingual lessons with prices",async()=>{
 const root=new Element("div");root.id="sliGeoTimelineRoot";
 const doc={createElement:t=>new Element(t),createElementNS:(_ns,t)=>new Element(t),getElementById:id=>id==="sliGeoTimelineRoot"?root:null};
 const events=JSON.parse(read("data/sli-geopolitical-events.json"));
 const prices=JSON.parse(read("data/sli-geopolitical-commodity-prices.json"));
 const fetch=async uri=>({ok:true,json:async()=>{
  if(uri.endsWith("sli-geopolitical-events.json"))return events;
  if(uri.endsWith("sli-geopolitical-commodity-prices.json"))return prices;
  return {articles:[]};
 }});
 const win={SLIi18n:{language:"id"}};
 runInNewContext(read("js/sli-geopolitical-timeline.js"),{window:win,document:doc,fetch,URL,Intl,Date,Math,Number,Set,Map,Promise,console});
 await win.initSLIGeopoliticalTimeline();
 let nodes=flatten(root);
 const marker=nodes.find(x=>x.tag==="g"&&x.attrs["data-event-date"]==="2022-02-24");
 assert.ok(marker,"Event dot must have an interactive SVG hit target");
 assert.equal(marker.attrs.role,"button");
 assert.equal(marker.attrs.tabindex,"0");
 assert.ok(marker.listeners.has("click")&&marker.listeners.has("keydown"));
 assert.ok(nodes.some(x=>x.tag==="circle"&&x.attrs.r==="19"),"Marker must have a generous transparent hit area");
 marker.listeners.get("click")();
 nodes=flatten(root);
 assert.equal(nodes.filter(x=>x.tag==="g"&&x.attrs["data-event-date"]==="2022-02-24"&&x.attrs["aria-pressed"]==="true").length,3);
 const insights=nodes.filter(x=>(x.className||"").includes("sli-geo-event-insight"));
 assert.equal(insights.length,3,"Every chart's note must switch to this event lesson");
 assert.ok(nodes.some(x=>String(x.textContent||"").includes("Rusia memulai invasi skala penuh")));
 assert.ok(nodes.some(x=>String(x.textContent||"").includes("Bulan kejadian MoM")));
 assert.ok(nodes.some(x=>String(x.textContent||"").includes("Pelajaran yang bisa diambil")));
 assert.ok(nodes.some(x=>String(x.textContent||"").includes("Peristiwa terpilih: ")));
 const next=nodes.find(x=>x.className==="sli-geo-event-nav-next");
 assert.ok(next&&!next.disabled);
 next.listeners.get("click")();
 nodes=flatten(root);
 assert.ok(nodes.some(x=>x.tag==="g"&&x.attrs["data-event-date"]==="2023-07-17"&&x.attrs["aria-pressed"]==="true"),"Next jumps to chronological event");
 const reset=nodes.find(x=>x.className==="sli-geo-event-nav-reset");
 reset.listeners.get("click")();
 nodes=flatten(root);
 assert.equal(nodes.filter(x=>(x.className||"").includes("sli-geo-event-insight")).length,0,"Reset restores general analysis");
 assert.equal(nodes.filter(x=>(x.className||"").includes("sli-geo-timeline-interpretation")).length,3);
 // Keyboard interaction and events predating price data retain accurate missing-observation labels.
 const first=nodes.find(x=>x.tag==="g"&&x.attrs["data-event-date"]==="1950-06-25");
 assert.ok(first);
 first.listeners.get("keydown")({key:"Enter",preventDefault(){}});
 nodes=flatten(root);
 assert.ok(nodes.some(x=>String(x.textContent||"").includes("Belum ada observasi acuan pada 1950-06")));
 assert.equal(nodes.filter(x=>x.tag==="g"&&x.attrs["data-event-date"]==="1950-06-25"&&x.attrs["aria-pressed"]==="true").length,3);
 for(const event of events.events)for(const k of ["chronology","id_chronology","market_context","id_market_context","lesson","id_lesson"]){
  assert.ok(typeof event[k]==="string"&&event[k].length>=35,event.date+" missing "+k);
 }
});
