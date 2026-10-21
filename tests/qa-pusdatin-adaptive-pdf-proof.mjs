import assert from "node:assert/strict";
import {test} from "node:test";
import fs from "node:fs";
import {createHash} from "node:crypto";
const read=path=>JSON.parse(fs.readFileSync(new URL("../"+path,import.meta.url),"utf8"));
const proof=read("data/pusdatin-september-adaptive-pdf-proof.json");
const sem=read("data/pusdatin-agriculture-september-2026-semantic.json");
const source=read("data/pusdatin-agriculture-september-2026.json");
const legacy=read("data/pusdatin-september-pdf-independent-audit.json");
const layout=read("data/pusdatin-september-layout-audit-2026.json");
const fnv=s=>{let h=2166136261;for(const b of Buffer.from(s,"utf8"))h=Math.imul(h^b,16777619)>>>0;return h};
const canonical=n=>n==null?"x":String(Math.round(n*100));
test("Adaptive ORIGINAL PDF proof covers all 63 numerical matrices, 2,163 semantic rows and all null cells",()=>{
 assert.equal(proof.source_original_pdf_sha256,legacy.pdf_sha256);
 assert.equal(proof.original_pdf_pages,89);
 assert.equal(proof.numeric_matrix_tables_matched,63);
 assert.equal(proof.pdf_coordinate_only_tables,59);
 assert.equal(proof.native_text_fallback_tables,4);
 assert.equal(proof.native_text_fallback_rows,5);
 assert.equal(proof.stronger_independent_source_row_label_tables,22);
 assert.equal(proof.remaining_full_manual_visual_label_check_tables,41);
 assert.equal(layout.layout_exceptions,30,"Preserve first-pass exception history");
 assert.equal(proof.pdf_table_evidence.length,63);
 let rows=0,cells=0,numbers=0,missing=0;
 for(const p of proof.pdf_table_evidence){
  const t=sem.table_series.find(t=>t.table===p.table);
  assert.ok(t,"PDF evidence table "+p.table);
  assert.equal(p.pdf_page,source.tables.find(s=>s.number===p.table).pdfPage);
  assert.equal(t.rows.length,p.pdf_numeric_rows,"Publisher PDF row coverage T"+p.table);
  const signatures=t.rows.map(r=>{
   const values=[...t.periods.map(k=>r.values[k]),...t.extra_periods.map(k=>r.extra[k])];
   rows++;cells+=values.length;
   for(const v of values)v==null?missing++:numbers++;
   return fnv(values.map(canonical).join(","));
  });
  const sum=fnv(signatures.sort((a,b)=>a-b).join("|"));
  assert.equal(sum,p.pdf_multiset_fnv32,"Independent original PDF numeric sequence mismatch T"+p.table);
  assert.equal(sum,p.semantic_multiset_fnv32,"Semantic numeric provenance ledger mismatch T"+p.table);
  assert.ok(p.pdf_row_baseline_tolerance_pt<=0.8);
  assert.ok(p.numeric_match);
 }
 assert.equal(rows,proof.semantic_rows_reconciled);
 assert.equal(cells,proof.semantic_cell_positions_reconciled);
 assert.equal(numbers,proof.observed_number_cells);
 assert.equal(missing,proof.source_missing_cells);
 assert.equal(rows,2163);assert.equal(cells,24941);
});
test("Five native PDF fallback rows preserve source values and strong SHA-256 fingerprints, not fabricated missing rows",()=>{
 assert.equal(proof.pdf_fallback_rows.length,5);
 const observed=[];
 for(const entry of proof.pdf_fallback_rows){
  const t=sem.table_series.find(x=>x.table===entry.table);
  const canonicalRows=t.rows.map(r=>[...t.periods.map(k=>r.values[k]),...t.extra_periods.map(k=>r.extra[k])].map(canonical));
  assert.ok(canonicalRows.some(v=>v.join(",")===entry.values.join(",")),"Fallback source row not in structured PDF transcription T"+entry.table);
  assert.equal(createHash("sha256").update(entry.values.join(",")).digest("hex"),entry.sha256);
  assert.ok(entry.label.length>2);observed.push(entry.table);
 }
 assert.deepEqual([...new Set(observed)],[4,6,20,21]);
});
test("Numeric-matrix reconciliation is never falsely promoted to human visual row-label certification",()=>{
 assert.equal(proof.audit_status,"numeric_matrix_reconciled_not_complete_visual_row_label_signoff");
 assert.match(proof.limitations.join(" "),/not establish.*correct row label/i);
 assert.ok(proof.stronger_independent_source_row_label_tables<proof.numeric_matrix_tables_matched);
});
