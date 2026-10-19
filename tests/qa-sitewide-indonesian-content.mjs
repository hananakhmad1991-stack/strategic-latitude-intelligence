/* No external libraries: source-controlled Indonesian editorial copy and all 37 page bootstraps. */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
const repo=path.resolve(".");
const code=fs.readFileSync("js/i18n-dictionary.js","utf8");
const language=fs.readFileSync("js/i18n.js","utf8");
const browser={window:{},document:{readyState:"loading",addEventListener(){},documentElement:{lang:"en"},querySelectorAll(){return []}},localStorage:{getItem:()=> "id",setItem(){}},CustomEvent:class{constructor(type){this.type=type}},NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4}};
vm.runInNewContext(code,browser,{timeout:5000});
vm.runInNewContext(language,browser,{timeout:5000});
const dictionary=browser.window.SLI_TRANSLATIONS_ID;
const runtime=browser.window.SLIi18n;
const key=a=>dictionary.has(a)&&dictionary.get(a)!==a;
const essentials=[
 ["Indonesia intelligence.","Intelijen Indonesia."],
 ["For better decisions.","Untuk keputusan yang lebih tepat."],
 ["Explore by sector","Jelajahi menurut sektor"],
 ["Research AI is in owner-only testing. Search is a navigational index; it does not create live statistics.","Research AI masih dalam tahap uji terbatas pemilik. Pencarian berfungsi sebagai indeks navigasi, bukan penghasil statistik waktu nyata."],
 ["One province, one evidence-linked dossier: economic growth, capital formation, expenditure inequality, electricity access, industrial facilities, sector-linked projects and transparent economic sensitivity. Every data point retains its original reference period and scope.","Satu provinsi, satu profil berbasis bukti: pertumbuhan ekonomi, pembentukan modal, ketimpangan pengeluaran, akses listrik, fasilitas industri, proyek sektoral, serta sensitivitas ekonomi yang transparan. Setiap angka mempertahankan periode dan cakupan sumber aslinya."],
 ["Climate & Environmental Risk Intelligence","Intelijen Risiko Iklim dan Lingkungan"],
 ["Macroeconomic Intelligence","Intelijen Makroekonomi"],
 ["Policy & Regulatory Intelligence","Intelijen Kebijakan dan Regulasi"],
 ["Indonesia Data Center Electricity Demand 2026–2035","Kebutuhan Listrik Pusat Data Indonesia 2026–2035"],
 ["AI Infrastructure & Digital Connectivity","Infrastruktur AI dan Konektivitas Digital"],
 ["Regulatory mind map · interlinked instruments","Peta pikiran regulasi · peraturan yang saling terkait"],
 ["Investor & Scenario Intelligence Labs","Laboratorium Intelijen Investor dan Skenario"],
 ["PLN Regional Grid & Distribution Infrastructure","Jaringan Regional dan Infrastruktur Distribusi PLN"],
 ["RUPTL PLN 2025–2034 — Source Intelligence","RUPTL PLN 2025–2034 — Intelijen Sumber"]
];
test("Read-only sitewide editorial dictionary covers homepage and strategic research prose",()=>{
 assert.ok(dictionary.size>=1000,"Coverage must not shrink or revert to menu-only translation");
 for(const [en,id] of essentials){
  assert.ok(key(en),"Missing approved ID translation: "+en);
  assert.equal(runtime.translate(en,"id"),id,"ID rendering must use the complete editorial copy");
  assert.equal(runtime.translate(en,"en"),en,"Switching back must retain English source copy");
 }
 assert.equal(runtime.translate("   For better decisions. ","id"),"   Untuk keputusan yang lebih tepat. ","Whitespace variants must work");
 assert.equal(runtime.translate("✦  AI Infrastructure","id"),"✦  Infrastruktur AI","Decorated dynamic labels must translate");
});
test("All published SLI pages initialize the same up-to-date EN/ID engine",()=>{
 const pages=fs.readdirSync(repo).filter(p=>p.endsWith(".html"));
 assert.ok(pages.length>=37,"Sitewide navigation should cover every page, not a partial subset");
 for(const p of pages){
  const page=fs.readFileSync(p,"utf8");
  assert.match(page,/sli-navigation\.js\?v=20261019-id-audit8/,"Stale language bootstrap: "+p);
  assert.match(page,/localStorage\.getItem\('sli-ui-language'\)/,"Persisted locale must be read before paint: "+p);
 }
 const nav=fs.readFileSync("js/sli-navigation.js","utf8");
 assert.match(nav,/i18n-dictionary\.js\?v=20261019-id-audit8/);
 assert.match(nav,/i18n\.js\?v=20261019-id-audit8/);
 const index=fs.readFileSync("index.html","utf8");
 assert.match(index,/i18n-dictionary\.js\?v=20261019-id-audit8/);
 assert.match(index,/i18n\.js\?v=20261019-id-audit8/);
 assert.match(index,/function homePortal\(\)/);
});
test("Runtime can identify untranslated content for the next editorial pass",()=>{
 assert.equal(runtime.language,"id");
 assert.equal(typeof runtime.coverage,"function");
 assert.equal(typeof runtime.registerTranslations,"function");
 assert.match(language,/MutationObserver/,"Reactive text processing needed after async data loads");
 assert.match(language,/sli:pagechange/,"SPA transitions must schedule a fresh pass");
 assert.match(language,/window\.addEventListener\?\.\("load"/,"Async page loading must schedule a fresh pass");
 const old=runtime.dictionarySize;
 runtime.registerTranslations({"Cohort measured as planned capacity only":"Kelompok proyek hanya diukur sebagai kapasitas rencana"});
 assert.equal(runtime.dictionarySize,old+1);
 assert.equal(runtime.translate("Cohort measured as planned capacity only","id"),"Kelompok proyek hanya diukur sebagai kapasitas rencana");
});
test("English publisher titles and unapproved factual copy are not silently machine rewritten",()=>{
 assert.equal(runtime.translate("Stanford Artificial Intelligence Index Report 2026","id"),"Stanford Artificial Intelligence Index Report 2026");
 assert.equal(runtime.translate("Global cloud region launch date, to be officially confirmed","id"),"Global cloud region launch date, to be officially confirmed");
 const source=fs.readFileSync("js/i18n.js","utf8");
 assert.match(source,/\[data-sli-no-translate\]/);
 assert.match(source,/\.bio-news/);
});
test("Homepage portal has zero unreviewed English headings and descriptions in ID mode",()=>{
 const html=fs.readFileSync("index.html","utf8");
 const start=html.indexOf("function homePortal(){return \x60".replace("\\x60","\x60"));
 const end=html.indexOf("function overview(){return \x60".replace("\\x60","\x60"));
 assert.ok(start>=0&&end>start,"Homepage portal must be a separately testable interface");
 const portal=html.slice(start,end);
 const values=[...portal.matchAll(/>([^<>]{3,1000})</g)].map(x=>x[1].replace(/&amp;/g,"&").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim())
 .filter(t=>/[a-z]{3}/i.test(t)&&!/^\s*https?:/.test(t));
 const normalize=s=>s.replace(/\s+/g," ").trim();
 const accepted=new Set([...dictionary.keys()].map(normalize));
 const missing=values.filter(t=>!accepted.has(normalize(t)));
 assert.deepEqual(missing,[],"Homepage ID still contains nonlocalized copy: "+JSON.stringify(missing));
});
test("Find candidate untranslated page prose as transparent QA review queue",()=>{
 const pages=fs.readdirSync(repo).filter(p=>p.endsWith(".html")),rows=[];
 for(const p of pages){
  let html=fs.readFileSync(p,"utf8").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<!--[\s\S]*?-->/g," ");
  const visible=[...html.matchAll(/>([^<>]{20,520})</g)].map(x=>x[1].replace(/&amp;/g,"&").replace(/&nbsp;/g," ").replace(/&quot;/g,'"').replace(/\s+/g," ").trim()).filter(t=>/[\p{L}]{3}/u.test(t));
  const candidate=visible.filter(t=>/\b(the|this|from|should|available|source|requires|select|verified|policy|figure|published|comparison|dashboard|investment|indicator)\b/i.test(t)&&!dictionary.has(t)&&!/^https?:|^\S+@\S+/.test(t));
  rows.push({page:p,candidates:candidate.length,examples:candidate.slice(0,2)});
 }
 const remaining=rows.reduce((sum,x)=>sum+x.candidates,0);
 console.log("SLI ID prose review queue (possible English / source text): "+remaining+" candidates across "+pages.length+" pages");
 console.log(JSON.stringify(rows.filter(x=>x.candidates>0).sort((a,b)=>b.candidates-a.candidates).slice(0,12)));
 fs.writeFileSync("sli-i18n-screening.json",JSON.stringify({
  version:"2026-10-19",languages:["en","id"],scope:"Static HTML candidate audit; includes official/source text and EN-only fallback content",pages:rows.length,
  candidateCount:remaining,rows:rows.filter(x=>x.candidates>0).sort((a,b)=>b.candidates-a.candidates)
 },null,2)+"\n","utf8");
 assert.ok(remaining<=390,"New English copy exceeds reviewed screening budget; audit translations or adjust baseline with documented review");
 // Legacy content intentionally remains on the review queue; do not fake a
 // "100% translated" result or turn source titles into unaudited translations.
 assert.equal(rows.length,pages.length);
});
