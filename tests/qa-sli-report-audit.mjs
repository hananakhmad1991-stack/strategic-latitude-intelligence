import {test} from "node:test";import assert from "node:assert/strict";import {auditReport} from "../research-api/src/report-audit.mjs";
test("reject invalid source markers and province omission",()=>{const a=auditReport("## Findings\nJawa Barat [3].\n## Conclusion\nFurther research required.",[{id:"a"}],{expectedGeography:["Jawa Tengah"],minWords:4});assert.equal(a.pass,false);assert.deepEqual(a.invalidCitations,[3]);assert.deepEqual(a.missingGeographies,["Jawa Tengah"]);});
test("accept structure when explicit source and geography are present",()=>{const a=auditReport("## Penilaian\nJawa Tengah: indikator bersumber [1].\n## Keterbatasan\nTemuan belum membuktikan kausalitas.",[{id:"a"}],{expectedGeography:["Jawa Tengah"],minWords:8});assert.equal(a.pass,true);});

test("long completed source-grounded report with strategic conclusion is structurally complete",()=>{
 const text="## Temuan dan dasar data\n"+("Nikel Indonesia memiliki berbagai risiko operasional; angka dan asumsi perlu pemeriksaan sumber [1].\n".repeat(100))+"\n## Kesimpulan dan Rekomendasi Strategis\n1. Audit realisasi proyek dan sumber energi sebelum berinvestasi [1].";
 const audit=auditReport(text,[{id:"mineral-1"}],{minWords:300,requireConclusion:true});
 assert.equal(audit.pass,true);assert.ok(audit.words>500);assert.equal(audit.hasConclusion,true);
 assert.equal(audit.review_scope,"structural_only_not_factual_verification");
});
test("report ending with unfilled section heading is flagged rather than labelled verified",()=>{
 const text="## Data dasar\nSumber terkurasi [1].\n## Skenario\nSkenario dasar [1].\n## Kesimpulan dan Rekomendasi";
 const audit=auditReport(text,[{id:"a"}],{minWords:10,requireConclusion:true});
 assert.equal(audit.pass,false);assert.ok(audit.issues.includes("possibly_truncated_ending"));
});
test("deep research missing conclusion is flagged without inventing a missing answer",()=>{
 const text="## Latar\nSumber [1] untuk konteks.\n## Risiko\nTetap harus diverifikasi [1].";
 const audit=auditReport(text,[{id:"a"}],{minWords:8,requireConclusion:true});
 assert.equal(audit.pass,false);assert.ok(audit.issues.includes("conclusion_heading_missing"));
});
test("no-corpus academic research design does not falsely require numbered citations",()=>{
 const text="## Rancangan\nJelaskan observasi yang perlu dikumpulkan.\n## Langkah Penelitian\nLakukan pemeriksaan asumsi dan tinjauan pustaka.";
 const audit=auditReport(text,[],{minWords:10,requireConclusion:true});
 assert.equal(audit.pass,true);
});
