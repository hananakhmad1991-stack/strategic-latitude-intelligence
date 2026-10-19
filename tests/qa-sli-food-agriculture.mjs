import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../",import.meta.url);
const read=p=>readFileSync(new URL(p,root),"utf8");
const data=JSON.parse(read("data/food-agriculture-2026.json"));
const find=(scope,sector)=>data.trade.find(r=>r.scope===scope&&r.sector===sector);
test("food is a new source-dated sector, never a synthetic live quote",()=>{
 assert.equal(data.schema,"sli-food-2026-launch-v1");
 assert.equal(data.publication.release,"2026-06");
 assert.equal(data.publication.trade_data_until,"2026-04");
 assert.equal(data.publication.price_ntp_data_until,"2026-05");
 assert.match(data.publication.pdf,/satudata\.pertanian\.go\.id\/assets\/docs\/publikasi\//);
 assert.equal(data.quality.monthly_auto_updates,false);
});
test("food trade totals preserve original thousands USD and raw/processed differences",()=>{
 assert.equal(data.trade.length,15);
 assert.equal(data.tradeMonthly.length,60,"3 coverage scopes × 5 sectors × 4 months");
 assert.equal(new Set(data.tradeMonthly.map(r=>r.period)).size,4);
 assert.ok(data.tradeMonthly.every(r=>Math.abs(r.export-r.import-r.balance)<=2));
 for(const scope of ["Segar + olahan","Segar","Olahan"]){
  const total=find(scope,"Pertanian Total");
  assert.ok(total&&total.unit==="ribu USD");
  for(const item of data.trade.filter(z=>z.scope===scope)){
   assert.equal(item.unit,"ribu USD");
   assert.ok(Number.isFinite(item.export)&&Number.isFinite(item.import)&&Number.isFinite(item.balance));
   assert.ok(Math.abs(item.export-item.import-item.balance)<=2,"published rounded trade components must reconcile within 2 thousand US$: "+item.sector);
  }
 }
 assert.equal(find("Segar + olahan","Pertanian Total").balance,6271208);
 assert.equal(find("Segar","Pertanian Total").balance,-2651598);
 assert.equal(find("Olahan","Pertanian Total").balance,8922806);
});
test("province farmer indices cover 38 BPS places with consistent numeric arrays",()=>{
 assert.equal(data.provinces.length,38);
 assert.equal(new Set(data.provinces).size,38);
 for(const k of ["april","may","ntup"]){
  assert.equal(data.ntp[k].length,38);
  assert.ok(data.ntp[k].every(v=>Number.isFinite(v)&&v>50&&v<300));
 }
 assert.equal(data.ntp.may[3],207.41);
 assert.equal(data.ntp.may[37],93.93);
 assert.equal(data.ntp.unit,"indeks 2018=100");
});
test("national index comparison preserves source calendar periods and all original subsectors",()=>{
 const v=data.nationalFarmerIndices;
 assert.equal(v.series.length,6);
 assert.deepEqual(v.periods,["2025-05","2026-01","2026-02","2026-03","2026-04","2026-05"]);
 for(const r of v.series){
  assert.equal(r.ntp.length,6);assert.equal(r.ntup.length,6);
  assert.ok(r.ntp.every(x=>Number.isFinite(x)&&x>0));
  assert.ok(r.ntup.every(x=>Number.isFinite(x)&&x>0));
  assert.ok(data.tables.find(t=>t.number===r.table).structured);
 }
 assert.equal(v.series[0].ntp[5],127.73);
 assert.equal(v.series[3].ntp[5],140.58);
});
test("all eleven 34-place commodity price series distinguish true missing values from zero",()=>{
 assert.equal(data.prices.places.length,34);
 assert.equal(data.prices.items.length,11);
 assert.ok(data.prices.items.some(x=>x.table===49));
 assert.ok(data.prices.items.some(x=>x.values.includes(null)));
 for(const item of data.prices.items){
  assert.equal(item.values.length,34);
  assert.equal(item.period,"2026-05");
  assert.ok(item.values.every(v=>v===null||(Number.isFinite(v)&&v>0&&v<400000)));
 }
});
test("all original table IDs preserve source anomaly and page links, without invented complete numeric coverage",()=>{
 assert.equal(data.tables.length,63);
 assert.equal(data.tables[0].number,1);
 assert.equal(data.tables.at(-1).number,64);
 assert.ok(!data.tables.some(r=>r.number===63));
 assert.equal(data.tables.find(r=>r.number===38).pdfPage,57);
 assert.equal(data.tables.find(r=>r.number===49).pdfPage,70);
 assert.equal(data.tables.find(r=>r.number===64).pdfPage,87);
 assert.ok(data.tables.some(r=>!r.structured));
});
test("food UX follows existing Energy/SLI architecture with genuine interactive data inspectors",()=>{
 const page=read("food-agriculture-intelligence.html");
 const js=read("js/food-agriculture-intelligence.js");
 const css=read("css/food-agriculture-intelligence.css");
 const nav=read("js/sli-navigation.js"),home=read("index.html");
 for(const id of ["fa-overview","fa-trade","fa-farmers","fa-prices","fa-governance","fa-analysis","fa-sources"])assert.ok(page.includes('id="'+id+'"'));
 for(const id of ["faTradeScope","faTradeMonth","faNationalGroup","faNationalMetric","faFarmerProvince","faCommodity","faPricePlace","faOrgGraph","faSourceSearch"])assert.ok(page.includes('id="'+id+'"'));
 assert.match(page,/sli-live-data\.js/);
 assert.match(page,/sli-navigation\.js\?v=20261019-id-audit9/);
 assert.match(page,/localStorage\.getItem\('sli-ui-language'\)/);
 assert.match(js,/SLIVisualExport.*register/);
 assert.match(js,/aria-pressed/);
 assert.match(js,/MutationObserver/);
 assert.match(js,/government|kementan|kemenkopangan/i);
 assert.match(css,/fa-kpis/);
 assert.match(nav,/food-agriculture-intelligence\.html/);
 assert.match(home,/food-agriculture-intelligence\.html/);
 assert.doesNotMatch(page,/ONCLICK\s*=/i);
});
