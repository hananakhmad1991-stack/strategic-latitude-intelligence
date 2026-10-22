import {test} from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const json=path=>JSON.parse(read(path));
const source=read("js/sli-decision-terminal.js");
function api(){
 const window={},document={readyState:"loading",addEventListener(){}};
 const context={window,document,URL,URLSearchParams,Map,Set,Intl,Number,Promise,console};
 vm.runInNewContext(source,context,{filename:"sli-decision-terminal.js"});
 return window.SLIDecisionTerminal;
}
test("SLI Decision Terminal is a first-class, bilingual, source-linked dashboard with no delegated exchange trading",()=>{
 const html=read("sli-decision-terminal.html");
 const css=read("css/sli-decision-terminal.css");
 const nav=read("js/sli-navigation.js");
 const index=read("index.html");
 assert.match(html,/SLI chrome prepaint/);
 for(const asset of ["sli-navigation.js?v=20261019-id-audit9","sli-navigation.css?v=20261018-menu-flash2","js/sli-live-data.js","js/sli-shared-appendix.js","js/sli-decision-terminal.js","css/sli-decision-terminal.css"])assert.ok(html.includes(asset),asset);
 for(const name of ["sliTerminalRoot","sliTerminalRole","sliTerminalSector","sliTerminalSearch","sliTerminalStats","sliTerminalEntityList","sliTerminalNews","sliTerminalPolicy","sliTerminalActions"])
  assert.equal((html.match(new RegExp('id="'+name+'"','g'))||[]).length,1,"Unique interactive terminal mount "+name);
 for(const role of ["investor","research","policy"])assert.match(html,new RegExp('<option value="'+role+'">'));
 for(const sector of ["energy","minerals","coal","food","technology","infrastructure","transport","manufacturing"])
  assert.match(html,new RegExp('<option value="'+sector+'">'));
 assert.match(css,/\[data-workspace="investor"\]/);
 assert.match(css,/\[data-workspace="research"\]/);
 assert.match(css,/\[data-workspace="policy"\]/);
 assert.match(css,/@media\(max-width:740px\)/);
 assert.match(nav,/terminal:\['SLI Decision Terminal/);
 assert.match(nav,/sli-decision-terminal\.html/);
 assert.match(index,/href="\.\/sli-decision-terminal\.html"/);
 assert.doesNotMatch(source,/\bsubmitOrder\b|placeTrade|executeTrade|B-PIPE|Bloomberg Data API|Math\.random/);
});
test("Terminal inherits IDX universe membership, ticker dossier links and bounded local watchlist",()=>{
 const {filterIssuers,parseWatch,corpURL,sectorNames}=api();
 const issuers=json("data/sli-idx-issuer-universe.json").records;
 const rows=filterIssuers(issuers,{sector:"minerals",q:"ANTM",watch:new Set(["ANTM"])});
 assert.equal(rows.length,1);
 assert.equal(rows[0].ticker,"ANTM");
 assert.equal(corpURL("ANTM"),"./sli-issuer.html?ticker=ANTM");
 for(const sector of ["food","energy","minerals","coal","manufacturing"]){
  const expected=issuers.filter(x=>x.sector===sector&&x.exchange==="IDX").length;
  assert.equal(filterIssuers(issuers,{sector,q:"",watch:new Set()}).length,expected,
   "Terminal count must track validated issuer registry rather than a frozen 2026 seed");
 }
 const keep=parseWatch(["ANTM","ANTM","NOT_A_TICKER","HACK","PTBA","TLKM","RM999"],issuers);
 assert.equal(keep.size,3);assert.ok(keep.has("ANTM")&&keep.has("PTBA")&&keep.has("TLKM"));
 assert.equal(Object.keys(sectorNames).length,8);
 assert.match(source,/localStorage\.setItem\(WATCH/);
 assert.match(source,/LIMIT_WATCH=30/);
 assert.doesNotMatch(source,/subscription|payment provider/i);
});
test("Attribution and cross-source filters remain distinct from verification and causal claims",()=>{
 const a=api();
 const news=json("data/sli-secondary-news-index.json").articles;
 const laws=json("data/sli-policy-regulatory-graph-2026.json").nodes;
 assert.ok(news.length>=30);
 assert.ok(laws.length>=20);
 const foodNews=a.newsFor(news,{sector:"food",q:"",selected:"",issuer:null});
 assert.ok(foodNews.length>0);
 assert.ok(foodNews.every(row=>row.sector==="food"));
 assert.ok(foodNews[0].published_at_utc>=foodNews.at(-1).published_at_utc);
 const regulations=a.policyFor(laws,{sector:"food",q:"",selected:""});
 assert.ok(regulations.some(x=>x.sector==="food"),"Food regulatory lineage not available");
 const min=a.policyFor(laws,{sector:"minerals",q:"",selected:""});
 assert.ok(min.some(x=>x.sector==="minerba"),"Official Minerba policy records must map to SLI minerals workspace");
 assert.match(source,/publisher_attributed_news_report/);
 assert.match(source,/not independently corroborated/);
 assert.match(source,/require verification at JDIH/);
 assert.match(source,/do not prove/);
 assert.match(source,/sli-research-ai\.html/);
 assert.match(source,/sli-sector-news\.html/);
});
