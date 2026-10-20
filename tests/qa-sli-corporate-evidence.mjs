import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const evidence=JSON.parse(read("data/sli-corporate-evidence-relationships.json"));
const ownership=JSON.parse(read("data/investment-ownership.json"));
const projects=JSON.parse(read("data/sli-project-registry.json"));
const proj=new Map(projects.records.map(p=>[p.id,p]));
test("Shareholder evidence is sourced, dated and disjoint from project participants",()=>{
 assert.equal(evidence.schema,"sli-corporate-evidence-relationships-v1");
 assert.equal(evidence.ownership_profiles.length,ownership.entities.length);
 assert.ok(evidence.ownership_profiles.length>=18);
 assert.ok(evidence.project_participations.length>=35);
 for(const p of evidence.ownership_profiles){
  const raw=ownership.entities.find(x=>x.id===p.id);assert.ok(raw,p.id);
  assert.equal(p.name,raw.entity);assert.equal(p.reference_date,raw.ownership_as_of);
  assert.equal(p.shareholders.length,(raw.direct_shareholders||[]).length);
  assert.ok(p.source_urls.length>0&&p.source_urls.every(x=>x.startsWith("https://")));
  for(const sh of p.shareholders){
   const source=(raw.direct_shareholders||[]).find(x=>x.name===sh.name);
   assert.ok(source,p.name+" "+sh.name);
   assert.equal(sh.reported_pct,source.pct);
   assert.equal(sh.basis,"direct_shareholding_reported_not_ultimate_beneficial_ownership");
   if(/^public|treasury|^other|^all other/i.test(sh.name))assert.equal(sh.holder_kind,"aggregate_not_entity");
  }
 }
 for(const p of evidence.project_participations){
  const raw=proj.get(p.project_id);assert.ok(raw,p.project_id);
  assert.equal(p.project_name,raw.name);
  assert.equal(p.source_url,raw.source_url);
  assert.equal(p.source_date,raw.evidence_date);
  assert.equal(p.project_role_note,raw.investor);
  assert.equal(p.relationship,"reported_project_participant_not_equity_shareholder");
  assert.match(p.source_url,/^https:\/\//);
 }
 assert.match(evidence.policy,/NOT equity/);
});
test("Entity Intelligence presents distinct direct equity tables and project partner context",()=>{
 const page=read("sli-entities.html"),js=read("js/sli-corporate-evidence-ui.js");
 for(const key of ["sliCorporateEvidence","sliEvidenceType","sliEvidenceSearch","sliEvidenceList","sliEvidenceDetail","sliEvidenceStat"])assert.match(page,new RegExp('id="'+key+'"'));
 assert.match(page,/js\/sli-corporate-evidence-ui\.js/);
 assert.match(page,/css\/sli-corporate-evidence\.css/);
 assert.match(js,/shareholder\.holder_kind==="aggregate_not_entity"/);
 assert.match(js,/Reported project participation — not equity/);
 assert.match(js,/p\.reference_date/);
 assert.match(js,/source_url/);
 assert.doesNotMatch(js,/\.innerHTML\s*=/);
 assert.doesNotThrow(()=>new Function(js));
});
