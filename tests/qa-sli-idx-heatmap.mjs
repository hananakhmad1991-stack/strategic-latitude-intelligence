import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const universe=JSON.parse(read("data/sli-idx-issuer-universe.json"));
const snapshot=JSON.parse(read("data/sli-idx-market-snapshot.json"));
function module(){
 const window={},document={addEventListener(){},documentElement:{lang:"id"}};
 vm.runInNewContext(read("js/sli-idx-heatmap.js"),{window,document,URL,Map,Set,Intl,Number,console},{filename:"sli-idx-heatmap.js"});
 return window.SLIIDXHeatmap;
}
test("SLI homepage embeds a native IDX heatmap with searchable strategic sectors and existing entity dossiers",()=>{
 const html=read("index.html"),css=read("css/sli-idx-heatmap.css"),code=read("js/sli-idx-heatmap.js"),entity=read("js/sli-entities.js");
 assert.match(html,/id="sliHomeIDXHeatmap"/);
 assert.match(html,/js\/sli-idx-heatmap\.js/);
 assert.match(html,/css\/sli-idx-heatmap\.css/);
 assert.match(html,/initSLIHomeIDXHeatmap\(\)/);
 assert.ok(html.indexOf('id="sliHomeIDXHeatmap"')<html.indexOf('id="sliPortalSectors"'));
 assert.match(code,/sli-idx-issuer-universe\.json/);
 assert.match(code,/sli-idx-market-snapshot\.json/);
 assert.match(code,/sliIDXGroupFilter/);
 assert.match(code,/data\.sector|\.sector===activeSector/);
 assert.match(code,/company:idx:/);
 assert.match(code,/sli-entities\.html\?ticker=/);
 assert.match(entity,/a\.issuerRecord\?\.ticker===requestedTicker/);
 assert.match(css,/\.sli-idx-tiles/);
 assert.match(css,/\.sli-idx-tile\.has-quote\.positive/);
 assert.match(css,/\.sli-idx-tile\.has-quote\.negative/);
 assert.match(css,/\.sli-idx-tile\.no-quote/);
 assert.doesNotMatch(code,/Math\.random|fakeQuote|fakeChange|sampleReturn/);
 assert.doesNotMatch(code,/dataSource:\s*["']SPX500/);
});
test("Strategic sector heatmap inherits real BEI candidate tickers, without claiming official IHSG membership",()=>{
 const m=module(),list=m.uniqueSorted(universe.records);
 assert.ok(list.length>=145,"Expected strategically relevant IDX issuer candidates");
 const tickers=new Set(list.map(x=>x.ticker));
 for(const t of ["ANTM","PTBA","TLKM","INDF","ICBP","MEDC","GOTO","AMMN"])assert.ok(tickers.has(t),"Missing IDX ticker "+t);
 for(const v of list)assert.ok(["energy","minerals","coal","food","technology","infrastructure","transport","manufacturing"].includes(v.sector));
 assert.equal(tickers.size,list.length);
 assert.equal(m.tickerURL("ANTM"),"./sli-entities.html?ticker=ANTM#company%3Aidx%3AANTM");
 assert.ok(universe.records.every(x=>x.market_cap===null),"Do not infer capitalization from the IDX seed");
});
test("Market colors and market-cap weighting remain neutral while no redistributable quote license exists",()=>{
 const m=module(),issuers=m.uniqueSorted(universe.records);
 assert.equal(snapshot.schema,"sli-idx-market-snapshot-v1");
 assert.equal(snapshot.market,"IDX");
 assert.equal(snapshot.redistribution_permitted,false);
 assert.equal(snapshot.license_status,"not_connected");
 assert.deepEqual(snapshot.quotes,[]);
 const parsed=m.parseMarket(snapshot,issuers);
 assert.equal(parsed.quotes.size,0);
 assert.equal(parsed.status.active,false);
 const unauthorized={...snapshot,redistribution_permitted:false,license_status:"redistribution_approved",
  provider:"Market Partner",provider_url:"https://licensed.example/source",snapshot_date:"2026-10-19",
  quotes:[{ticker:"ANTM",close_idr:2200,previous_close_idr:2000,change_pct:10,market_cap_idr:100000000000,observed_date:"2026-10-19",source_url:"https://licensed.example/ANTM"}]};
 assert.equal(m.parseMarket(unauthorized,issuers).quotes.size,0,"Never publish unauthorized quotes");
});
test("Licensed dated source gating computes actual close-to-close performance, rejects inconsistent and unknown prices",()=>{
 const m=module(),issuers=m.uniqueSorted(universe.records);
 const license={...snapshot,provider:"Approved EOD Vendor",provider_url:"https://source.example.com/idx",
 license_status:"redistribution_approved",redistribution_permitted:true,snapshot_date:"2026-10-19",status:"delayed_eod",
 quotes:[
 {ticker:"ANTM",close_idr:1100,previous_close_idr:1000,change_pct:10,market_cap_idr:100000000000,
 observed_date:"2026-10-19",source_url:"https://source.example.com/ANTM"},
 {ticker:"PTBA",close_idr:1200,previous_close_idr:1000,change_pct:9,market_cap_idr:120000000000,
 observed_date:"2026-10-19",source_url:"https://source.example.com/PTBA"},
 {ticker:"TLKM",close_idr:700,previous_close_idr:800,change_pct:-12.5,market_cap_idr:null,
 observed_date:"2026-10-19",source_url:"http://insecure.example/TLKM"},
 {ticker:"FAKE",close_idr:1,previous_close_idr:1,change_pct:0,market_cap_idr:100,
 observed_date:"2026-10-19",source_url:"https://source.example.com/FAKE"}
 ]};
 const parsed=m.parseMarket(license,issuers);
 assert.equal(parsed.quotes.size,1);
 assert.equal(parsed.status.active,true);
 assert.ok(Math.abs(parsed.quotes.get("ANTM").change-10)<1e-9);
 assert.equal(parsed.quotes.get("ANTM").date,"2026-10-19");
 assert.equal(parsed.quotes.get("ANTM").marketCap,100000000000);
 assert.ok(!parsed.quotes.has("PTBA")&&!parsed.quotes.has("TLKM")&&!parsed.quotes.has("FAKE"));
});
