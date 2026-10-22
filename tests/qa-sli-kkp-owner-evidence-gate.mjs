import {test} from "node:test";
import assert from "node:assert/strict";
import {assessOwnerKKPEvidence} from "../scripts/kkp-owner-evidence-gate.mjs";
const answer="Pertanyaan ini memerlukan pembedaan data pembenihan tahun 2024 dari kondisi tahun 2026. Data pembenihan yang tersedia tidak dapat diperlakukan sebagai angka tahun 2026. Tabel sumber perlu dicek kembali sebelum dipakai untuk klaim nasional. [1]";
const base={mode:"generative_rag",answer,sources:[{source_url:"https://portaldata.kkp.go.id/datainsight/produksi-ikan-pembenihan"}]};
test("A structural, indexed citation to official KKP passes; facts still need manual audit",()=>{
 const a=assessOwnerKKPEvidence(base);
 assert.equal(a.passed,true);
 assert.equal(a.officialCitedPositionsCount,1);
});
test("Rejects no citations, missing official citation and citation outside source list",()=>{
 assert.equal(assessOwnerKKPEvidence({...base,answer:answer.replace("[1]","")}).passed,false);
 assert.equal(assessOwnerKKPEvidence({...base,answer:answer.replace("[1]","[2]")}).passed,false);
 assert.equal(assessOwnerKKPEvidence({...base,sources:[{url:"https://example.org/table"}]}).passed,false);
 assert.equal(assessOwnerKKPEvidence({...base,answer:answer.replace("[1]","[1] [9]")}).passed,false);
});
test("Do not accept lookalike KKP domains or unnumbered citations",()=>{
 assert.equal(assessOwnerKKPEvidence({...base,sources:[{url:"https://portaldata.kkp.go.id.evil.org/"}]}).passed,false);
 assert.equal(assessOwnerKKPEvidence({...base,answer:answer.replace("[1]","(Source: KKP)")}).passed,false);
});
test("Recognizes bold numbering and requires the KKP source itself to be cited",()=>{
 assert.equal(assessOwnerKKPEvidence({...base,answer:answer.replace("[1]","[**1**]")}).passed,true);
 const v={...base,answer:answer.replace("[1]","[2]"),sources:[base.sources[0],{url:"https://example.org/report"}]};
 assert.equal(assessOwnerKKPEvidence(v).passed,false);
});
