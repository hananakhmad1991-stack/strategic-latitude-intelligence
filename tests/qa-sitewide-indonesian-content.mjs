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
test("Substantive ID prose retains critical source, period and investment qualifications",()=>{
 const cases=[
  ["Regulatory pipeline ≠ enacted policy","Rancangan regulasi ≠ kebijakan yang telah berlaku"],
  ["2024 observations do not become 2026 measurements after a dashboard refresh","Pengamatan 2024 tidak berubah menjadi pengukuran 2026 ketika dashboard diperbarui"],
  ["Size comparison only, NOT GRDP impact","Hanya perbandingan besaran, BUKAN dampak pada PDRB"],
  ["A successful workflow does not certify that the underlying source changed","Workflow yang berhasil bukan bukti bahwa sumber data telah berubah"],
  ["No multiplier results will appear until a coefficient and its source are supplied. The system does not verify user-entered multipliers automatically.","Hasil pengganda tidak akan ditampilkan sampai pengguna memasukkan koefisien beserta sumbernya. Sistem tidak memverifikasi koefisien yang dimasukkan secara otomatis."],
  ["For solar, module nameplate DC peak (MWp) differs from inverter/AC output and energy yield.","Untuk PLTS, kapasitas puncak DC modul (MWp) berbeda dari keluaran inverter/AC dan energi yang dihasilkan."],
  ["The year/month the phenomenon was measured","Tahun/bulan saat fenomena diukur"]
 ];
 for(const [english,indonesian] of cases){
  assert.equal(runtime.translate(english,"id"),indonesian,"Source-qualified Indonesian interpretation changed: "+english);
  assert.equal(runtime.translate(english,"en"),english);
 }
});

test("All published SLI pages initialize the same up-to-date EN/ID engine",()=>{
 const pages=fs.readdirSync(repo).filter(p=>p.endsWith(".html")&&p!=="sli-user-intelligence-qa.html");
 assert.ok(pages.length>=37,"Sitewide navigation should cover every page, not a partial subset");
 for(const p of pages){
  const page=fs.readFileSync(p,"utf8");
  assert.match(page,/sli-navigation\.js\?v=20261019-id-audit9/,"Stale language bootstrap: "+p);
  assert.match(page,/localStorage\.getItem\('sli-ui-language'\)/,"Persisted locale must be read before paint: "+p);
 }
 const nav=fs.readFileSync("js/sli-navigation.js","utf8");
 assert.match(nav,/i18n-dictionary\.js\?v=20261019-id-audit9/);
 assert.match(nav,/i18n\.js\?v=20261019-id-audit9/);
 const index=fs.readFileSync("index.html","utf8");
 assert.match(index,/i18n-dictionary\.js\?v=20261019-id-audit9/);
 assert.match(index,/i18n\.js\?v=20261019-id-audit9/);
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
 const pages=fs.readdirSync(repo).filter(p=>p.endsWith(".html")&&p!=="sli-user-intelligence-qa.html"),rows=[];
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
 assert.ok(remaining<=345,"New English/source-text candidates exceed the post-review budget (310 at 2026-10-20); inspect source headings, do not fake coverage");
  for(const [page,ceiling] of [["sli-user-guide.html",35],["sli-glossary-methodology.html",30]]){
    const found=rows.find(x=>x.page===page);
    assert.ok(found&&found.candidates<=ceiling,"Priority bilingual guide/glossary content regressed: "+page);
  }
 // Legacy content intentionally remains on the review queue; do not fake a
 // "100% translated" result or turn source titles into unaudited translations.
 assert.equal(rows.length,pages.length);
});

test("Curated Indonesian reader guidance preserves source dates and noncausality",()=>{
 const entries=[
  ["A practical guide to navigating Indonesia's strategic economy—from an executive big picture to verifiable provincial, sectoral and project evidence.","Panduan praktis menelusuri ekonomi strategis Indonesia, dari gambaran umum eksekutif hingga bukti provinsi, sektor, dan proyek yang dapat diverifikasi."],
  ["The dashboard shows an empty chart or missing data","Dashboard menampilkan grafik kosong atau data yang tidak tersedia"],
  ["Data measured in 2024 does not become 2026 output because the file was updated or rechecked in 2026. Show statistical period, issuer release, extraction or monitoring timestamp separately.","Data yang diukur pada 2024 tidak berubah menjadi hasil 2026 hanya karena berkas diperbarui atau diperiksa ulang pada 2026. Tampilkan periode statistik, tanggal publikasi, ekstraksi, dan waktu pemantauan secara terpisah."],
  ["Missing/unknown values must remain empty, not zero. A stale page or inaccessible publisher cannot be treated as evidence of no change. Modelled projections require published assumptions and are not government outcomes.","Nilai yang hilang atau tidak diketahui harus tetap kosong, bukan nol. Halaman kedaluwarsa atau sumber penerbit yang tidak dapat diakses bukan bukti bahwa tidak ada perubahan. Proyeksi model memerlukan asumsi yang dinyatakan dan bukan hasil resmi pemerintah."]
 ];
 for(const [en,id] of entries){
  assert.equal(runtime.translate(en,"id"),id,"Reader translation must be reviewed, not machine rewritten");
  assert.equal(runtime.translate(en,"en"),en);
 }
});

// Human-curated, UI-only sector labels. Publisher report titles and evidence remain unchanged.
test("Reviewed EN/ID cross-module navigation and data-availability labels",()=>{
 const cases=[["Main dashboard ↗","Dasbor utama ↗"],["Energy intelligence ↗","Intelijen energi ↗"],["Investment tracker ↗","Pelacak investasi ↗"],["Provincial investment engine ↗","Analisis investasi provinsi ↗"],["Province industry & energy dossier ↗","Profil industri dan energi provinsi ↗"],["PLN statistics source registry","Daftar sumber statistik PLN"],["AI regional grid map","Peta jaringan listrik regional untuk AI"],["Verified Location Map","Peta lokasi terverifikasi"],["Actual regional available reserve for DCs","Cadangan daya regional aktual yang tersedia untuk pusat data"],["Checking verified asset locations…","Memeriksa lokasi aset terverifikasi…"],["Facility Coordinates & Spatial Assessment Readiness","Kesiapan koordinat fasilitas dan penilaian spasial"],["Geospatial AI Investment Intelligence","Intelijen investasi AI geospasial"],["Verified AI Investment Geomap | SLI","Peta investasi AI terverifikasi | SLI"],["RUPTL planned investment","Investasi yang direncanakan dalam RUPTL"],["Environmental data readiness & source register ↗","Kesiapan data lingkungan dan daftar sumber ↗"]];
 for(const [en,id] of cases){
  assert.equal(runtime.translate(en,"id"),id,"Missing approved Indonesian label: "+en);
  assert.equal(runtime.translate(en,"en"),en,"English UI source label changed: "+en);
 }
 assert.equal(runtime.translate("Stanford Artificial Intelligence Index Report 2026","id"),"Stanford Artificial Intelligence Index Report 2026");
});
