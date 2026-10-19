import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const glossary=JSON.parse(read("data/sli-unified-glossary.json"));
test("One bilingual canonical glossary captures electricity reliability scope without duplicate terms",()=>{
 const names=glossary.items.map(x=>x.term.toLocaleLowerCase().trim());
 assert.equal(names.length,new Set(names).size);
 for(const term of ["SAIDI / SAIFI","SAIDI","SAIFI","PLN service unit (UID / UIW)","Shared-region reliability proxy","Grid reliability vs electrification"]){
  const r=glossary.items.find(x=>x.term===term);assert.ok(r,term);
  assert.ok(r.en.length>50&&r.id.length>45,term+" needs EN and ID definition");
  assert.ok(r.note_en&&r.note_id,term+" needs EN and ID notes");
 }
 assert.ok(glossary.source_specific_resources.some(x=>x.path==="data/pln-saidi-saifi-2023-2025.json"));
});
test("Guide provides complete Indonesian user path and keeps one dynamic module directory",()=>{
 const s=read("sli-user-guide.html");
 assert.equal((s.match(/id="sliGuideCatalog"/g)||[]).length,1);
 assert.match(s,/id="sliGuideIndonesianCopy"/);
 for(const v of ["Cara Menggunakan SLI","SAIDI","SAIFI","Glosarium","pembaruan","data-sli-no-translate"]){
  assert.ok(s.toLowerCase().includes(v.toLowerCase()),"guide missing "+v);
 }
 assert.match(s,/html\[lang='id'\] #sliGuideIndonesianCopy/);
});
test("Glossary displays Indonesian methodology and canonical interactive dictionary",()=>{
 const s=read("sli-glossary-methodology.html");
 assert.match(s,/id="glossaryIndonesianMethods"/);
 assert.match(s,/id="sliGlossaryMain"/);
 assert.match(s,/Glosarium dan Metodologi Terpadu/);
 assert.match(s,/pln-electricity-statistics\.html/);
 assert.ok(!s.includes("all 312 unique term records"),"hardcoded obsolete count");
});
test("Global UI locale retains EN/ID control and runs after asynchronously loaded dictionary",()=>{
 const nav=read("js/sli-navigation.js"),core=read("js/i18n.js"),dict=read("js/i18n-dictionary.js");
 assert.doesNotThrow(()=>new Script(nav));
 assert.doesNotThrow(()=>new Script(core));
 assert.doesNotThrow(()=>new Script(dict));
 assert.match(nav,/bootstrapSLIUniversalLanguage/);
 assert.match(nav,/i18n-dictionary\.js/);
 assert.match(nav,/i18n\.js/);
 assert.match(nav,/window\.SLIi18n\.setLanguage\(code\)/);
 assert.match(core,/initial:true/);
 for(const t of ["Electricity Reliability | SAIDI & SAIFI","Official source","Search all terms"]){
  assert.ok(dict.includes(t),t);
 }
});
test("Official new-edition discovery is not confused with verified numeric ingestion",()=>{
 const cat=JSON.parse(read("data/sli-publication-source-catalog.json"));
 const policy=JSON.parse(read("data/sli-automation-policy.json"));
 const pln=cat.sources.find(x=>x.id==="pln_statistics");
 assert.ok(pln.datasets.includes("data/pln-saidi-saifi-2023-2025.json"));
 assert.equal(policy.overrides["data/pln-saidi-saifi-2023-2025.json"].mode,"curated_snapshot");
 assert.match(policy.operational_review.documentation,/glossary|bilingual/i);
});
