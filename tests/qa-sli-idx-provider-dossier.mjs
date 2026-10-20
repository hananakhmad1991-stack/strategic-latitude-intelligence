import {test} from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const data=JSON.parse(read("data/sli-idx-issuer-universe.json"));
function provider(lang="id"){
 const w={},d={documentElement:{lang},createElement:tag=>({tagName:tag,append(){},replaceChildren(){}})};
 vm.runInNewContext(read("js/sli-idx-tradingview.js"),{window:w,document:d,URL,JSON,Map,Set,console});
 return w.SLIIDXTradingView;
}
function issuer(){
 const w={},d={addEventListener(){},documentElement:{lang:"id"}};
 vm.runInNewContext(read("js/sli-issuer.js"),{window:w,document:d,URL,URLSearchParams,JSON,console});
 return w.SLIIssuerRoute;
}
test("Sector watchlist is restricted to SLI IDX issuers while general heatmap is not sector restricted",()=>{
 const ui=provider();
 const source=data.records.filter(x=>["energy","minerals","coal","food","technology","infrastructure","transport","manufacturing"].includes(x.sector));
 const config=ui.watchlistConfig(source,"all");
 assert.equal(config.tabs.length,8);
 const sourceTickers=new Set(source.map(x=>x.ticker));
 for(const tab of config.tabs){
  assert.ok(tab.symbols.length>0&&tab.symbols.length<=9);
  for(const {s} of tab.symbols){assert.match(s,/^IDX:[A-Z0-9]{4}$/);assert.ok(sourceTickers.has(s.slice(4)))}
 }
 const food=ui.watchlistConfig(source,"food",6);
 assert.equal(food.tabs.length,1);assert.equal(food.tabs[0].title,"Pangan");
 assert.ok(food.tabs[0].symbols.length>=5&&food.tabs[0].symbols.length<=6);
 for(const row of food.tabs[0].symbols)assert.ok(source.find(x=>x.ticker===row.s.slice(4)&&x.sector==="food"));
 const minerals=ui.watchlistConfig(source,"minerals",6);
 assert.equal(minerals.tabs.length,1);assert.equal(minerals.tabs[0].title,"Mineral");
 const allIds=new Set(minerals.tabs[0].symbols.map(x=>x.s));
 assert.ok(allIds.has("IDX:ANTM"));
 const general=ui.heatmapConfig();
 assert.equal(general.dataSource,"IDX");
 assert.equal(general.blockSize,"market_cap_basic");
 assert.equal(general.blockColor,"change");
 assert.equal(general.grouping,"sector");
 assert.equal(ui.scriptUrl,"https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js");
 assert.equal(ui.heatmapScriptUrl,"https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js");
 assert.equal(ui.issuerRoute,"https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/sli-issuer.html");
 const code=read("js/sli-idx-tradingview.js");
 assert.match(code,/function mountCompact\(/);
 assert.match(code,/function mountHeatmap\(/);
 assert.doesNotMatch(code,/Math\.random|samplePercentage|guessMarketCap/);
});
test("Sector-only ticker buttons lead to a specific SLI company dossier instead of general Entity directory",()=>{
 const route=issuer();
 const s=read("js/sli-idx-sector-watchlist.js"),html=read("sli-issuer.html"),code=read("js/sli-issuer.js");
 const extract=u=>route.tickerFrom(new URL(u,"https://hananakhmad1991-stack.github.io/"));
 for(const ticker of ["ANTM","TLKM","PTBA","INDF","GOTO","AMMN"]){
  assert.equal(extract("https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/sli-issuer.html?ticker="+ticker),ticker);
  assert.equal(extract("https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/sli-issuer.html?tvwidgetsymbol=IDX%3A"+ticker),ticker);
  assert.ok(data.records.find(x=>x.ticker===ticker));
 }
 assert.equal(extract("https://sli.example/sli-issuer.html?tvwidgetsymbol=NASDAQ%3AAAPL"),null);
 assert.equal(extract("https://sli.example/sli-issuer.html?ticker=INVALID"),null);
 assert.match(s,/const tickerUrl=t=>"\\.\/sli-issuer\\.html\\?ticker="/);
 assert.match(html,/id="sliIssuerDossier"/);
 assert.match(code,/sli-idx-issuer-universe\\.json/);
 assert.match(code,/sli-corporate-group-registry\\.json/);
 assert.match(code,/data\\.source_url/);
 assert.match(code,/embed-widget-symbol-overview\\.js/);
 assert.match(code,/Research AI/);
 assert.doesNotMatch(code,/Math\\.random|fakePrice|syntheticMarketCap/);
});
