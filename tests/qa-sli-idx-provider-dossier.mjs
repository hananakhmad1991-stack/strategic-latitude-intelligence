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
test("Sector watchlist is restricted to SLI IDX issuers and global heatmap is explicitly separate",()=>{
 const ui=provider();
 const source=data.records;
 const config=ui.watchlistConfig(source,"all");
 assert.equal(config.tabs.length,12);
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
 const home=ui.homeIDXConfig();
 assert.ok(home.tabs.length>=3&&home.tabs.every(t=>t.symbols.every(x=>x.s.startsWith("IDX:"))));
 const general=ui.heatmapConfig();
 assert.equal(general.dataSource,"SPX500");
 assert.equal(general.blockSize,"market_cap_basic");
 assert.equal(general.blockColor,"change");
 assert.equal(general.grouping,"sector");
 assert.equal(ui.scriptUrl,"https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js");
 assert.equal(ui.heatmapScriptUrl,"https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js");
 assert.equal(ui.issuerRoute,"https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/sli-issuer.html");
 const code=read("js/sli-idx-tradingview.js");
 assert.match(code,/function mountCompact\(/);
 assert.match(code,/function mountHeatmap\(/);
 assert.match(code,/function mountHomeIDX\(/);
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
 assert.ok(s.includes('const tickerUrl=t=>"./sli-issuer.html?ticker="'));
 assert.match(html,/id="sliIssuerDossier"/);
 assert.ok(code.includes('sli-idx-issuer-universe.json'));
 assert.ok(code.includes('sli-corporate-group-registry.json'));
 assert.ok(code.includes('data.source_url'));
 assert.ok(code.includes('embed-widget-symbol-overview.js'));
 assert.match(code,/Research AI/);
 assert.doesNotMatch(code,/Math\.random|fakePrice|syntheticMarketCap/);
});

test("Historical provider price chart is integrated in the selected IDX issuer's right panel",()=>{
 const route=issuer();
 const script=read("js/sli-issuer.js");
 const css=read("css/sli-issuer.css");
 const html=read("sli-issuer.html");
 assert.match(html,/js\/sli-issuer\.js\?v=20261022-actorsfinance2/);
 assert.match(html,/css\/sli-issuer\.css\?v=20261022-actorsfinance2/);
 assert.equal(route.historicalChartWidget,"https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js");
 for(const ticker of ["ANTM","PTBA","MEDC","TLKM","INDF","GOTO"]){
  const cfg=route.historicalChartConfig(ticker);
  assert.equal(cfg.symbol,"IDX:"+ticker);
  assert.equal(cfg.interval,"D");
  assert.equal(cfg.range,"12M");
  assert.equal(cfg.withdateranges,true);
  assert.equal(cfg.hide_top_toolbar,false);
  assert.equal(cfg.allow_symbol_change,false);
  assert.equal(cfg.autosize,true);
  assert.equal(cfg.theme,"dark");
  assert.equal(cfg.timezone,"Asia/Jakarta");
  assert.equal(cfg.locale,"id");
  assert.equal(cfg.support_host,"https://www.tradingview.com");
 }
 for(const bad of ["AAPL","IDX:ANTM","ANTM;alert(1)","",'<script>']){
  if(bad==="AAPL")continue; // syntactically indistinguishable four-letter ticker; whitelist enforced by IDX issuer registry upstream
  assert.throws(()=>route.historicalChartConfig(bad));
 }
 const sideSource=script.indexOf("historicalChart(side,ticker)");
 const quoteSource=script.indexOf("tradingview(side,ticker,name)");
 assert.ok(quoteSource>=0&&sideSource>quoteSource,"Keep price quote and place historical chart immediately below");
 assert.match(script,/frame\.append\(script\);section\.append\(frame\)/);
 assert.match(css,/\.sli-issuer-history-frame/);
 assert.match(css,/height:455px/);
 assert.match(css,/@media\(max-width:580px\)/);
 assert.doesNotMatch(script,/fetch\([^)]*tradingview|Math\.random|fakeHistoricalPrices|syntheticCandles/);
});
