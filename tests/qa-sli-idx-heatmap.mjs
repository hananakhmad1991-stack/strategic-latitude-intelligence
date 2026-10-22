import {test} from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const issuer=JSON.parse(read("data/sli-idx-issuer-universe.json"));
const snapshot=JSON.parse(read("data/sli-idx-market-snapshot.json"));
function load(filename){
 const window={};
 const document={documentElement:{lang:"id"},addEventListener(){}};
 vm.runInNewContext(read(filename),{window,document,URL,URLSearchParams,Intl,Map,Set,Number,Promise,console});
 return window;
}
test("IDX-first market overview and selected-sector watchlist are separate homepage regions",()=>{
 const html=read("index.html");
 for(const path of ["js/sli-idx-heatmap.js","js/sli-idx-tradingview.js","js/sli-idx-sector-watchlist.js",
  "css/sli-idx-heatmap.css","css/sli-idx-sector-watchlist.css"])assert.ok(html.includes(path),path);
 assert.match(html,/id="sliHomeIDXHeatmap"/);
 assert.match(html,/id="sliHomeIDXSectors"/);
 assert.ok(html.indexOf('id="sliHomeIDXHeatmap"')<html.indexOf('id="sliHomeIDXSectors"'));
 assert.ok(html.indexOf('id="sliHomeIDXSectors"')<html.indexOf('id="sliPortalSectors"'));
 assert.match(html,/initSLIHomeIDXHeatmap\(\)/);
 assert.match(html,/initSLIHomeIDXSectors\(\)/);
 assert.ok(html.indexOf('js/sli-idx-tradingview.js')<html.indexOf('js/sli-idx-sector-watchlist.js'));
});
test("IDX is the explicit default and S&P 500 is only an opt-in global heatmap",()=>{
 const code=read("js/sli-idx-heatmap.js"),provider=read("js/sli-idx-tradingview.js");
 const heat=load("js/sli-idx-heatmap.js").SLIIDXHeatmap;
 const widget=load("js/sli-idx-tradingview.js").SLIIDXTradingView;
 assert.equal(heat.mode,"provider-idx-first-overview");
 assert.equal(heat.market,"IDX");
 assert.equal(heat.getSelection(),"idx");
 assert.match(code,/mountHomeIDX\(frame\)/);
 assert.match(code,/mountHeatmap\(frame\)/);
 assert.match(code,/selection="idx"/);
 assert.doesNotMatch(code,/sli-idx-issuer-universe\.json|sliIDXGroupFilter|sli-idx-tiles/);
 const idx=widget.homeIDXConfig();
 assert.equal(idx.width,"100%");
 assert.equal(idx.height,"100%");
 assert.ok(idx.tabs.length>=3);
 assert.ok(idx.tabs.every(t=>t.symbols.length>0&&t.symbols.every(s=>/^IDX:[A-Z0-9]+$/.test(s.s))));
 assert.ok(idx.tabs[0].symbols.some(s=>s.s==="IDX:COMPOSITE"));
 assert.ok(idx.tabs[0].symbols.some(s=>s.s==="IDX:BBCA"));
 const global=widget.heatmapConfig();
 assert.equal(global.dataSource,"SPX500");
 assert.equal(global.grouping,"sector");
 assert.equal(global.blockSize,"market_cap_basic");
 assert.equal(global.blockColor,"change");
 assert.equal(widget.heatmapScriptUrl,"https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js");
 assert.doesNotMatch(provider,/dataSource:"IDX"|fetch\(.*prices|Math\.random|fakeChange/);
 const css=read("css/sli-idx-heatmap.css");
 assert.match(css,/sli-idx-home-market-frame/);
 assert.match(css,/height:560px;min-height:560px/);
 assert.match(code,/aria-pressed/);
});
test("Internal SLI sector watchlist shows all twelve curated strategic sectors and links directly to a named dossier",()=>{
 const api=load("js/sli-idx-sector-watchlist.js").SLIIDXSectors;
 assert.equal(api.sectorKeys.length,12);
 const selected=issuer.records.filter(x=>api.sectorKeys.includes(x.sector)&&x.exchange==="IDX");
 assert.equal(selected.length,260);
 assert.equal(new Set(selected.map(x=>x.ticker)).size,260);
 for(const [sector,n]of [["energy",17],["minerals",18],["coal",21],["food",36],["technology",24],
 ["infrastructure",19],["transport",16],["manufacturing",27],["finance",33],["property",19],["healthcare",15],["retail",15]])assert.equal(api.activeIssuerList(issuer.records,sector).length,n);
 assert.equal(api.tickerUrl("ANTM"),"./sli-issuer.html?ticker=ANTM");
 for(const ticker of ["ANTM","PTBA","TLKM","INDF","ICBP","MEDC","GOTO","AMMN"]){
  assert.ok(selected.some(x=>x.ticker===ticker),"Missing SLI issuer ticker "+ticker);
 }
 const code=read("js/sli-idx-sector-watchlist.js");
 assert.match(code,/activeIssuerList\(candidates,sector\)/);
 assert.match(code,/SLIIDXTradingView|PROVIDER\?\.mountCompact/);
 assert.match(code,/sli-issuer\.html\?ticker=/);
 assert.match(code,/role","group"|setAttribute\("role","group"\)/);
 assert.doesNotMatch(code,/Math\.random|randomPrice|fakeChange|marketCap\s*=\s*[1-9]/);
});
test("Unlicensed SLI market quotes remain explicitly unavailable; provider bears its own colors and prices",()=>{
 assert.equal(snapshot.schema,"sli-idx-market-snapshot-v1");
 assert.equal(snapshot.redistribution_permitted,false);
 assert.equal(snapshot.license_status,"not_connected");
 assert.deepEqual(snapshot.quotes,[]);
 const js=read("js/sli-idx-sector-watchlist.js");
 assert.match(js,/TradingView/);
 assert.match(js,/terpisahkan|dipisahkan|dipisahkan/);
 assert.match(js,/tidak disalin|bukan disalin|bukan disalin menjadi/);
 assert.ok(issuer.records.every(x=>x.market_cap===null),"No invented market caps in seed");
});
