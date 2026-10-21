import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const read=path=>JSON.parse(readFileSync(new URL("../"+path,import.meta.url),"utf8"));
const pdf=read("data/pusdatin-september-pdf-independent-audit.json");
const sem=read("data/pusdatin-agriculture-september-2026-semantic.json");
const source=read("data/pusdatin-agriculture-september-2026.json");
const canon=n=>n==null?"x":String(Math.round(n*100));
const label=s=>s.toLowerCase().trim().replace(/\s+/g," ");
const fnv32=s=>{let h=2166136261;for(const b of Buffer.from(s,"utf8"))h=Math.imul(h^b,16777619)>>>0;return h;};
test("independent PDF evidence is dated, source-identified and explicitly partial",()=>{
 assert.equal(pdf.pdf_sha256.length,64);assert.equal(pdf.source_pdf_page_count,89);
 assert.equal(pdf.verified_table_count,22);assert.equal(pdf.remaining_table_count,41);
 assert.equal(pdf.verified_rows,774);assert.equal(pdf.verified_numeric_cells,8514);
 assert.equal(sem.table_series.length,63);assert.equal(source.tables.length,63);
 assert.equal(source.publication.edition,pdf.edition);
});
test("8,514 independent PDF glyph-position numeric cells match semantic structured observations",()=>{
 let rows=0;
 for(const [id,evidence] of Object.entries(pdf.independent_table_fingerprints)){
  const number=Number(id),t=sem.table_series.find(x=>x.table===number),src=source.tables.find(x=>x.number===number);
  assert.ok(t&&src,"Missing audited table "+id);assert.equal(t.page,evidence.page);
  const localities=number>=49&&number<=59?t.rows.filter(x=>/^\d+\s+/.test(x.label)):t.rows;
  assert.equal(localities.length,evidence.count,"PDF row count "+id);
  const normalized=localities.map(r=>label(r.label)+"|"+[...t.periods.map(k=>r.values[k]),...t.extra_periods.map(k=>r.extra[k])].map(canon).join(",")).join("\n");
  assert.equal(fnv32(normalized),evidence.hash32,"PDF-independent cell-by-cell mismatch table "+id);
  rows+=localities.length;
 }
 assert.equal(rows,pdf.verified_rows);
});
test("all 2,163 parsed records reconcile exactly against saved original PDF transcript; do not mislabel this full visual validation",()=>{
 let total=0;
 for(const t of sem.table_series){
  const lines=source.tables.find(x=>x.number===t.table).text_rows.split("\n").map(s=>s.trim().replace(/\s+/g," "));
  for(const r of t.rows){
   const tokens=[...t.periods.map(k=>r.values[k]),...t.extra_periods.map(k=>r.extra[k])];
   const matches=lines.filter(x=>x.startsWith(r.label.replace(/\s+/g," ").slice(0,45)+" "));
   assert.ok(matches.some(line=>{
    const nums=line.split(" ").slice(-tokens.length);
    return nums.length===tokens.length&&nums.every((raw,i)=>{
     const num=raw==="-"||raw==="—"?null:Number(raw.replace(/\./g,"").replace(",","."));
     return Object.is(num,tokens[i]);
    });
   }),"Source transcript mismatch: Tabel "+t.table+" "+r.label);
   total++;
  }
 }
 assert.equal(total,2163);
});
