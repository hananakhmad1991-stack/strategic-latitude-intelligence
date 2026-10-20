import {test} from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const data=JSON.parse(read("data/sli-idx-issuer-universe.json"));
function provider(lang="id"){
 const w={},d={documentElement:{lang},createElement:(tag)=>({tagName:tag,append(){},replaceChildren(){}})};
 vm.runInNewContext(read("js/sli-idx-tradingview.js"),{window:w,document:d,URL,JSON,Map,Set,console});
 return w.SLIIDXTradingView;
}
function issuer(){
 const w={},d={addEventListener(){},documentElement:{lang:"id"}};
 vm.runInNewContext(read("js/sli-issuer.js"),{window:w,document:d,URL,URLSearchParams,JSON,console});
 return w.SLIIssuerRoute;
}
test("SLI homepage renders provider-owned actual IDX market watchlist before ticker map without fictitious prices",()=>{
 const home=read("index.html"),heat=read("js/sli-idx-heatmap.js"),css=read("css/sli-idx-heatmap.css");
 assert.match(home,/js\/sli-idx-tradingview\.js/);
 assert.ok(home.indexOf('js/sli-idx-tradingview.js')<home.indexOf('js/sli-idx-heatmap.js'));
 assert.match(heat,/SLIIDXTradingView\?\.mount/);
 assert.match(heat,/sliIDXTradingViewWatchlist/);
 assert.match(heat,/sli-issuer\.html\?ticker=/);
 assert.match(heat,/Open dossier/);
 assert.doesNotMatch(heat,/EOD N\/A|EOD T\/A/);
 assert.match(css,/\.sli-idx-provider-container/);
 assert.match(css,/\.sli-idx-tile\.no-quote/);
});
test("All live TradingView watchlist symbols are IDX only and drawn from the same 178 curated source tickers",()=>{
 const ui=provider(),source=data.records.filter(x=>["energy","minerals","coal","food","technology","infrastructure","transport","manufacturing"].includes(x.sector));
 const config=ui.watchlistConfig(source,"all");
 assert.equal(config.tabs.length,8);
 const sourceTickers=new Set(source.map(x=>x.ticker));
 for(const tab of config.tabs){
  assert.ok(tab.symbols.length>0&&tab.symbols.length<=9);
  for(const {s,d} of tab.symbols){
   assert.ok(s.startsWith("IDX:"),"Foreign exchange code in curated IDX watchlist: "+s);
   assert.ok(sourceTickers.has(s.slice(4)),"Ticker not present in reviewed source: "+s);
   assert.ok(!/NASDAQ|NYSE|SPX500|SP500/.test(s));
  }
 }
 assert.equal(config.showChart,false);
 assert.equal(config.largeChartUrl,"https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/sli-issuer.html");
 assert.equal(ui.scriptUrl,"https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js");
 assert.ok(config.plotLineColorGrowing!==config.plotLineColorFalling);
 const single=ui.watchlistConfig(source,"food");
 assert.deepEqual(single.tabs.map(x=>x.title),["Pangan"]);
 for(const x of single.tabs[0].symbols)assert.ok(data.records.find(v=>v.ticker===x.s.slice(4)&&v.sector==="food"));
});
test("Provider-embedded IDX ticker links route to an actual named ticker dossier, not generic Entities",()=>{
 const path=issuer(),html=read("sli-issuer.html"),code=read("js/sli-issuer.js");
 const query=u=>{const x=new URL(u,"https://hananakhmad1991-stack.github.io");return path.tickerFrom(x)};
 for(const symbol of ["ANTM","TLKM","PTBA","INDF","GOTO","AMMN"]){
  assert.equal(query("https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/sli-issuer.html?ticker="+symbol),symbol);
  assert.equal(query("https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/sli-issuer.html?tvwidgetsymbol=IDX%3A"+symbol),symbol);
  assert.ok(data.records.some(x=>x.ticker===symbol),"Ticker must exist in SLI issuer universe");
 }
 assert.equal(query("https://sli.example/sli-issuer.html?tvwidgetsymbol=NASDAQ%3AAAPL"),null);
 assert.equal(query("https://sli.example/sli-issuer.html?ticker=INVALID"),null);
 assert.match(html,/id="sliIssuerDossier"/);
 assert.match(code,/sli-idx-issuer-universe\.json/);
 assert.match(code,/sli-corporate-group-registry\.json/);
 assert.match(code,/data\.source_url/);
 assert.match(code,/tradingview-widget-container/);
 assert.match(code,/embed-widget-symbol-overview\.js/);
 assert.match(code,/Research AI/);
 assert.match(code,/source_attributed|Source.*registr|katalog kurasi/i);
 assert.doesNotMatch(code,/Math\.random|fakePrice|syntheticMarketCap/);
});
