import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../",import.meta.url),read=p=>readFileSync(new URL(p,root),"utf8");
const semantic=JSON.parse(read("data/pusdatin-agriculture-september-2026-semantic.json"));
const raw=JSON.parse(read("data/pusdatin-agriculture-september-2026.json"));
const table=n=>semantic.table_series.find(x=>x.table===n);
test("September semantic extraction covers all official tables without replacing June archive",()=>{
 assert.equal(semantic.table_count,63);assert.equal(semantic.table_series.length,63);
 assert.deepEqual(semantic.table_series.map(x=>x.table),Array.from({length:63},(_,i)=>i+1));
 assert.equal(semantic.parsed_numeric_row_count,2163);
 assert.equal(semantic.table_series.reduce((x,t)=>x+t.rows.length,0),2163);
 assert.equal(raw.publication.edition,"2026-09");assert.equal(raw.publication.pdf_pages,89);
 assert.equal(JSON.parse(read("data/food-agriculture-2026.json")).publication.release,"2026-06");
 assert.ok(semantic.table_series.every(t=>t.rows.length>0&&t.page===raw.tables[t.table-1].pdfPage));
});
test("numeric matrices respect publisher's period keys, source row IDs and missing values",()=>{
 for(const t of semantic.table_series){
  assert.ok(t.parse_status&&t.periods.length>=8);
  for(const r of t.rows){
   assert.ok(/^t\d+-r\d+$/.test(r.row_id));
   assert.ok(r.label&&r.unit);
   assert.deepEqual(Object.keys(r.values),t.periods);
   assert.deepEqual(Object.keys(r.extra),t.extra_periods);
   assert.ok(Object.values(r.values).every(v=>v===null||Number.isFinite(v)));
   assert.ok(Object.values(r.extra).every(v=>v===null||Number.isFinite(v)));
  }
  assert.equal(new Set(t.rows.map(r=>r.row_id)).size,t.rows.length);
 }
 assert.equal(table(63).rows.length,3);
 assert.equal(table(62).rows.length,39);
 assert.ok(semantic.table_series.some(t=>t.rows.some(r=>Object.values(r.values).includes(null))));
});
test("trade volume/monetary units are not interchanged; source periods are preserved",()=>{
 for(let n=4;n<=27;n++)assert.equal(table(n).unit,n%2===0?"ton":"ribu USD");
 for(const n of [1,2,3])assert.equal(table(n).unit,"mixed volume ton / value ribu USD");
 assert.equal(table(28).unit,"index 2022=100");
 assert.equal(table(29).unit,"percent");
 assert.equal(table(38).unit,"index 2018=100");
 assert.equal(table(60).unit,"Rp/kg");
 assert.equal(table(61).unit,"ton");
 assert.equal(table(63).unit,"IDR/USD");
 assert.equal(table(28).periods[1],"2025-average");
 assert.equal(table(29).extra_periods[0],"2026-YTD-pct");
});
test("source-backed example values: national NTP, Kramat Jati, international and FX",()=>{
 const n=table(30).rows.find(x=>/Nilai Tukar Petani$/.test(x.label));assert.ok(n);
 assert.equal(n.values["2026-08"],129.19);
 const kol=table(60).rows.find(x=>/^1\s+Kol$/.test(x.label));assert.equal(kol.values["2026-08"],5881);
 const stock=table(61).rows.find(x=>/^1\s+Kol$/.test(x.label));assert.equal(stock.values["2026-08"],2778);
 const cocoa=table(62).rows.find(x=>x.label.includes("Kakao"));assert.equal(cocoa.values["2026-08"],5.95);
 const middle=table(63).rows.find(x=>x.label==="Kurs Tengah");assert.equal(middle.values["2026-08"],17849);
});
test("full numeric explorer is embedded in food dashboard and exposes CSV, national and supply insights",()=>{
 const page=read("food-agriculture-intelligence.html");
 const js=read("js/pusdatin-september-semantic.js");
 for(const x of ["pusdatin-september-semantic.js","pusdatin-september-semantic.css","pusdatin-agriculture-september-2026.js"])assert.ok(page.includes(x));
 for(const x of ["sepsemTableChoice","sepsemMarketSelect","sepsemFarmerTable","sepsemWorldTable","sepsemRow"])assert.ok(js.includes(x));
 assert.match(js,/application\/|text\/csv/);
 assert.match(js,/URL\.createObjectURL/);
 assert.match(js,/source\.publication\.pdf/);
 assert.match(js,/data\.parsed_numeric_row_count!==2163/);
});
