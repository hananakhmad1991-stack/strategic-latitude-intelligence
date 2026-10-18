#!/usr/bin/env node
/* SLI structural prelaunch audit for all JSON datasets and published app assets.
 * Tests are necessary but do NOT prove data freshness, licensing or fact accuracy.
 */
import {readFileSync,readdirSync,existsSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../",import.meta.url));
const read=p=>readFileSync(resolve(root,p),"utf8");
const fail=[],warn=[],parsed={};
const dataFiles=readdirSync(resolve(root,"data")).filter(n=>n.endsWith(".json")).sort();
for(const name of dataFiles){
 try{
  const raw=read("data/"+name),obj=JSON.parse(raw);
  if(!obj||typeof obj!=="object")fail.push(name+": unexpected root type");
  if(/sk-(?:proj-)?[A-Za-z0-9_-]{25,}/.test(raw))fail.push(name+": potential API credential");
  parsed[name]=obj;
 }catch(e){fail.push(name+": invalid JSON: "+e.message)}
}
if(dataFiles.length<70)fail.push("Required sitewide data corpus is unexpectedly small");
const ev=parsed["sli-research-evidence-preview.json"];
if(!Array.isArray(ev?.documents)||ev.documents.length<18)fail.push("Research AI evidence preview missing");
else{
 const seen=new Set();
 for(const doc of ev.documents){
  if(!doc||!doc.id||seen.has(doc.id))fail.push("AI evidence missing/duplicate ID "+doc?.id);
  seen.add(doc.id);
  if(!/^https:\/\//.test(doc.source_url||"")||!doc.publisher||!doc.period||!doc.source_date||!doc.topic||!doc.geo)
   fail.push("AI evidence missing provenance "+doc.id);
  if(doc.metric && (!Number.isFinite(doc.metric.value)||!doc.metric.unit||!doc.metric.period))
   fail.push("AI chart metric missing value, unit or period "+doc.id);
 }
}
const regional=parsed["sli-research-province-preview.json"];
if(regional?.provinces?.length!==38)fail.push("Research AI province preview must have 38 provinces");
else{
 if(new Set(regional.provinces.map(p=>p.name)).size!==38)fail.push("Duplicated province names");
 for(const p of regional.provinces){
  for(const k of ["growth_real_2025_pct","pmtb_share_2025_pct","gini_expenditure_2026_03"]){
   if(p[k]!=null&&!Number.isFinite(p[k]))fail.push("Non-numeric "+k+" for "+p.name);
  }
  if(p.gini_expenditure_2026_03!=null&&(p.gini_expenditure_2026_03<0||p.gini_expenditure_2026_03>1))
   fail.push("Out-of-range Gini for "+p.name);
 }
}
const cfg=parsed["sli-research-assistant-config.json"];
if(!cfg||cfg.api_enabled!==false||cfg.login_enabled!==false)fail.push("Pro/Enterprise must not be prematurely enabled");
if(cfg?.owner_test?.enabled&&!/^https:\/\/[^/\s]+\/v1\/owner-research$/.test(cfg.owner_test.endpoint||""))
 fail.push("Owner Test endpoint invalid");
const critical=["index.html","sli-research-ai.html","sli-user-guide.html","sli-glossary-methodology.html",
 "js/sli-research-assistant.js","js/sli-research-visuals.js","research-api/src/owner-test-worker.mjs"];
for(const filename of critical)if(!existsSync(resolve(root,filename)))fail.push("Critical page/asset missing: "+filename);
let missingAssetCount=0;
const htmlPages=readdirSync(root).filter(p=>p.endsWith(".html"));
for(const page of htmlPages){
 const html=read(page);
 for(const m of html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"[^>]*>/gi)){
  const part=m[1].split(/[?#]/)[0];
  if(!/^\.?\/?[A-Za-z0-9_-].*\.(?:js|css)$/i.test(part)||/^(?:https?:)?\/\//.test(part))continue;
  if(!existsSync(resolve(root,part.replace(/^\.\//,"")))){missingAssetCount++;warn.push(page+": missing local asset "+part)}
 }
}
const summary={json_files:dataFiles.length,html_pages:htmlPages.length,ai_evidence:ev?.documents?.length??0,
 provinces:regional?.provinces?.length??0,critical_failures:fail.length,asset_warnings:missingAssetCount,
 caveat:"Structural audit only; source accuracy, currency, attribution and licenses need editorial checks."};
console.log("SLI content audit:",JSON.stringify(summary));
for(const s of warn.slice(0,15))console.warn("WARN",s);
for(const s of fail)console.error("FAIL",s);
if(fail.length)process.exitCode=1;
