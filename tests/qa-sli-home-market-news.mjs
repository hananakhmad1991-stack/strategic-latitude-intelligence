import {test} from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const source=read("js/sli-market-news-home.js");
const html=read("index.html");
const css=read("css/sli-market-news-home.css");

test("Home-only IHSG has provider-owned quote, chart, licence caveat, responsive layout and no fabricated quote API",()=>{
 for(const fragment of ['id="sliHomeIHSG"','id="sliHomeIssuerNews"',"initSLIHomeMarketNews",'sli-market-news-home.css','sli-market-news-home.js'])assert.ok(html.includes(fragment),fragment);
 for(const fragment of ['IDX:COMPOSITE|1D','embed-widget-symbol-overview.js','embed-widget-timeline.js','around 10 minutes','300000','sli-secondary-news-index.json','sli-issuer-news.json'])assert.ok(source.includes(fragment),fragment);
 assert.match(css,/@media\(max-width:550px\)/);
 assert.doesNotMatch(source,/Math\.random\(\)|fakePrice|syntheticMarket|scrapeTradingView|fetch\("https:\/\/.*tradingview/);
});

test("Rendering IHSG chart and the attributed ticker news feed works without scraping the provider iframe",async()=>{
 const nodes=new Map();
 class Node {
  constructor(tag){this.tagName=tag;this.children=[];this.isConnected=true;this._text="";this.attrs={}}
  set id(v){this._id=v;nodes.set(v,this)}get id(){return this._id}
  set textContent(v){this._text=String(v);this.children=[]}
  get textContent(){return this._text+this.children.map(x=>x.textContent||"").join("")}
  append(...xs){this.children.push(...xs)}
  replaceChildren(...xs){this.children=xs;this._text=""}
  setAttribute(k,v){this.attrs[k]=v}
  addEventListener(){}
  querySelector(tag){for(const c of this.children){if(c.tagName===tag)return c;const found=c.querySelector?.(tag);if(found)return found}return null}
 }
 const ihsg=new Node("section");ihsg.id="sliHomeIHSG";
 const news=new Node("section");news.id="sliHomeIssuerNews";
 const doc={documentElement:{lang:"id"},createElement:tag=>new Node(tag),
   getElementById:id=>nodes.get(id)||null,addEventListener(){}};
 const issuers={schema:"sli-idx-issuer-universe-v1",records:[
  {ticker:"ANTM",name:"Aneka Tambang",sector:"minerals",exchange:"IDX"},
  {ticker:"TLKM",name:"Telkom Indonesia",sector:"technology",exchange:"IDX"}
 ]};
 const headline={schema:"sli-issuer-news-v1",updated_at_utc:"2026-10-21T06:30:00Z",articles:[
  {title:"ANTM membangun smelter",url:"https://news.google.com/rss/articles/123",publisher:"ANTARA",tickers:["ANTM"],published_at_utc:"2026-10-21T05:30:00Z"}
 ]};
 const fallback={updated_at_utc:"2026-10-21T06:20:00Z",articles:[]};
 const getData=url=>url.includes("issuer-universe")?issuers:url.includes("issuer-news")?headline:fallback;
 const w={};
 const context={window:w,document:doc,URL,Date,JSON,Map,Set,RegExp,
  location:{href:"https://sli.example/index.html"},
  console,setInterval:()=>1,fetch:async url=>({ok:true,json:async()=>getData(url)})};
 vm.runInNewContext(source,context);
 assert.equal(typeof w.initSLIHomeMarketNews,"function");
 w.initSLIHomeMarketNews();
 await new Promise(r=>setTimeout(r,25));
 const chartScript=nodes.get("sliHomeIHSGChart").querySelector("script");
 assert.ok(chartScript);
 assert.equal(chartScript.src,"https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js");
 const config=JSON.parse(chartScript.textContent);
 assert.equal(config.symbols[0][1],"IDX:COMPOSITE|1D");
 assert.ok(config.dateRanges.length>=4);
 assert.match(ihsg.textContent,/10 menit/);
 assert.ok(nodes.get("sliHomeIssuerArticles").textContent.includes("ANTM membangun smelter"));
 assert.ok(nodes.get("sliHomeIssuerArticles").textContent.includes("ANTM"));
 assert.ok(nodes.get("sliHomeIssuerProvider").querySelector("script"));
 assert.match(nodes.get("sliHomeIssuerStatus").textContent,/berita|Berita/i);
});
