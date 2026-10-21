import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../",import.meta.url),read=p=>readFileSync(new URL(p,root),"utf8");
const db=JSON.parse(read("data/pusdatin-agriculture-september-2026.json"));
test("official September 2026 publication is a separate immutable revision",()=>{
 assert.equal(db.publication.released,"2026-09-23");assert.equal(db.publication.trade_until,"2026-07");assert.equal(db.publication.other_indicators_until,"2026-08");assert.equal(db.publication.pdf_pages,89);
 assert.match(db.publication.pdf,/satudata\.pertanian\.go\.id\/assets\/docs\/publikasi\//);
 const june=JSON.parse(read("data/food-agriculture-2026.json"));assert.equal(june.publication.release,"2026-06");assert.equal(june.publication.trade_data_until,"2026-04");
});
test("all 63 publisher tables are present exactly once, preserving PDF numbering and unreviewed flags",()=>{
 assert.equal(db.tables.length,63);assert.deepEqual(db.tables.map(x=>x.number),Array.from({length:63},(_,i)=>i+1));
 assert.ok(db.tables.every(x=>x.text_rows.includes("Tabel "+x.number+".")&&x.source_url?.includes("#page="+x.pdfPage)));
 assert.equal(db.tables.find(x=>x.number===38).pdfPage,59);
 assert.equal(db.tables.find(x=>x.number===49).pdfPage,72);
 assert.equal(db.tables.find(x=>x.number===63).pdfPage,88);
 assert.ok(db.tables.every(x=>x.extraction==="source_text_not_all_semantically_validated"));
});
test("90 source trade records reconcile and latest national totals match published values",()=>{
 assert.equal(db.trade_rows.length,90);
 assert.equal(db.month_keys_trade.length,10);
 for(const x of db.trade_rows){assert.ok(db.tables[x.table-1].number===x.table);assert.equal(Object.keys(x.values).length,10);assert.ok(Object.values(x.values).every(Number.isFinite));}
 const row=(s,m)=>db.trade_rows.find(x=>x.scope===s&&x.metric===m&&x.unit==="ribu USD"&&x.sector==="Pertanian Total");
 for(const scope of ["total","fresh","processed"]){const a=row(scope,"ekspor"),b=row(scope,"impor"),c=row(scope,"neraca");for(const period of db.month_keys_trade){assert.ok(Math.abs(a.values[period]-b.values[period]-c.values[period])<=3,scope+" "+period);}}
 assert.equal(row("total","ekspor").values["2026-01/07"],26092007);
 assert.equal(row("total","impor").values["2026-01/07"],14233393);
 assert.equal(row("total","neraca").values["2026-01/07"],11858614);
 assert.equal(row("fresh","neraca").values["2026-01/07"],-4093933);
 assert.equal(row("processed","neraca").values["2026-01/07"],15952547);
});
test("38-province and 34-market series are complete; blanks do not become zero",()=>{
 assert.equal(db.regional_series.length,19);
 for(const x of db.regional_series){const n=x.table<=43?38:34;assert.equal(x.extracted,n,"Table "+x.table);assert.equal(x.rows.length,n);assert.equal(new Set(x.rows.map(r=>r.rank)).size,n);
   for(const r of x.rows){assert.equal(Object.keys(r.values).length,9);assert.ok(Object.values(r.values).every(v=>v===null||Number.isFinite(v)));}}
 assert.equal(db.regional_series.reduce((n,x)=>n+x.rows.length,0),678);
 assert.equal(db.regional_series.find(x=>x.table===38).rows[0].values["2026-08"],128.06);
 assert.ok(db.regional_series.some(t=>t.rows.some(r=>Object.values(r.values).includes(null))));
});
test("September UI is integrated into Food sector, with accessible map and archived June preserved",()=>{
 const html=read("food-agriculture-intelligence.html"),js=read("js/pusdatin-agriculture-september-2026.js");
 assert.match(html,/href="#fa-september"/);assert.match(html,/pusdatin-agriculture-september-2026\.js/);
 assert.match(html,/pusdatin-agriculture-september-2026\.css/);
 assert.match(html,/Arsip pembanding: Pusdatin Juni 2026/);
 for(const id of ["fa-september","sepKpi","sepBars","sepMap","sepGeoRanking","sepTableList","sepTableInspect"])assert.ok(js.includes(id));
 assert.match(js,/sli-indonesia-province-38\.geojson/);
 assert.match(js,/source_text_not_all_semantically_validated|validasi semantik/);
});
