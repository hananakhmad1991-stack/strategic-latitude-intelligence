import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Sitewide quality audit guards JSON, provenance, province identities, staging access and local assets",()=>{
 const script=read("scripts/audit-sli-content-quality.mjs");
 assert.match(script,/readdirSync\(resolve\(root,"data"\)\)/);
 assert.match(script,/source_date/);
 assert.match(script,/evidence missing provenance/i);
 assert.match(script,/38 provinces/);
 assert.match(script,/api_enabled!==false/);
 assert.match(script,/missing local asset/);
});
test("Sitewide and Research AI continuous integration include quality checks",()=>{
 assert.match(read(".github/workflows/sli-sitewide-functional-qa.yml"),/audit-sli-content-quality\.mjs/);
 assert.match(read(".github/workflows/sli-research-ai-qa.yml"),/qa-sli-content-quality\.mjs/);
});
test("Research AI labels staging scope and cited versus selected evidence",()=>{
 const s=read("js/sli-research-assistant.js"),h=read("sli-research-ai.html");
 for(const t of ["SUMBER SLI TERKURASI","OWNER TEST ·","Dikutip dalam laporan","Sumber grafik","Konteks terpilih; belum dikutip"])
  assert.ok(s.includes(t));
 assert.match(h,/Sumber terpilih/);
});
