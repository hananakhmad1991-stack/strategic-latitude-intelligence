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

test("Reviewed Indonesian reading of RUPTL, provincial investment and regional grid source warnings",()=>{
 const cases=[["Document coverage:","Cakupan dokumen:"],["not the annex tables","bukan tabel dalam lampirannya"],["Source-data issues","Catatan masalah data sumber"],["2045 — show flagged source series","2045 — tampilkan deret sumber yang ditandai"],["Download AMI source table CSV","Unduh tabel sumber AMI (CSV)"],["Source contradiction:","Ketidaksesuaian dalam sumber:"],["01 · Demand confirmation is the gating factor","01 · Konfirmasi permintaan menjadi prasyarat utama"],["Source: PDF pp.46, 53.","Sumber: PDF hlm. 46 dan 53."],["Source: PDF pp.89–90.","Sumber: PDF hlm. 89–90."],["03 · Grid investment can precede peak-load bottlenecks","03 · Investasi jaringan dapat mendahului hambatan beban puncak"],["05 · BESS investment needs duration and location","05 · Investasi BESS memerlukan data durasi dan lokasi"],["The 2034 EBT target of 34.3% concerns electricity generation mix. The 42.569 GW EBT buildout is installed-capacity planning; neither proves renewable power actually contracted or delivered hourly to a data center.","Target EBT 34,3% pada 2034 adalah target bauran pembangkitan listrik. Penambahan EBT 42,569 GW merupakan rencana kapasitas terpasang; keduanya tidak membuktikan bahwa listrik terbarukan telah dikontrakkan atau dipasok tiap jam ke suatu pusat data."],["PLN regional firm available MW, substation headroom, N-1 redundancy and connection queue are not verified here. Grid Stress Index stays","Kapasitas MW regional PLN yang benar-benar dapat dipasok, sisa kapasitas gardu induk, redundansi N-1, dan antrean sambungan belum diverifikasi. Indeks Tekanan Jaringan tetap"],["rather than assigning invented severity grades. Incremental demands are research scenarios, not the sum of overlapping project announcements.","alih-alih memberikan tingkat keparahan yang tidak didukung bukti. Tambahan kebutuhan daya merupakan skenario riset, bukan hasil penjumlahan pengumuman proyek yang mungkin tumpang tindih."],["Export regional scenarios","Ekspor skenario regional"],["Verified regional grid headroom","Cadangan kapasitas jaringan regional yang terverifikasi"],["Verified local grid reserve","Cadangan kapasitas jaringan lokal terverifikasi"],["RUPTL 2025–2034 national generation and transmission development must not be attributed to these specific industrial clusters without verified regional project tables and in-service schedules.","Rencana pengembangan pembangkit dan transmisi nasional RUPTL 2025–2034 tidak boleh langsung dianggap sebagai pembangunan untuk klaster industri tertentu tanpa tabel proyek regional serta jadwal mulai operasi yang terverifikasi."],["Grid planning exposure table","Tabel paparan perencanaan jaringan listrik"],["* Static nominal expenditure accounting effect expressed as a percent of baseline GRDP, not a projected real-growth change. † Records with named provincial attribution only; multi-site announcements may appear in several provinces, and cannot be summed. ‡ Gini is a socioeconomic context indicator and not part of the investment fit score.","* Dampak akuntansi statis pengeluaran nominal dalam persentase PDRB acuan, bukan proyeksi perubahan pertumbuhan riil. † Hanya catatan yang menyebut atribusi provinsi; pengumuman proyek multilokasi dapat muncul di beberapa provinsi dan tidak boleh dijumlahkan. ‡ Gini adalah indikator konteks sosial ekonomi, bukan komponen skor kesesuaian investasi."],["Compare BPS 2025 real GRDP growth with March 2026 expenditure Gini across the same provinces. Different observation periods; this is descriptive, not a causal analysis.","Bandingkan pertumbuhan PDRB riil BPS 2025 dengan Gini pengeluaran Maret 2026 pada provinsi yang sama. Periode pengamatan berbeda; perbandingan ini bersifat deskriptif, bukan analisis kausal."],["Not an average of province Gini","Bukan rata-rata nilai Gini provinsi"],["Valid province observations","Pengamatan provinsi yang valid"],["Source observation","Periode pengamatan sumber"],["Separate from GRDP year","Berbeda dari tahun acuan PDRB"],["No missing-value interpolation","Tanpa interpolasi nilai yang hilang"],["What the engine measures","Apa yang diukur sistem ini"],["A user-weighted relative combination of four observed 2025 provincial indicators. Percentile values are computed among provinces with available values, with ties handled equally. The mechanical stress equals −(household expenditure × shock + PMTB × shock) / nominal GRDP.","Kombinasi relatif empat indikator provinsi 2025 yang teramati, sesuai bobot pengguna. Persentil dihitung di antara provinsi yang datanya tersedia, dengan nilai sama diperlakukan setara. Tekanan mekanis dihitung sebagai −(pengeluaran rumah tangga × guncangan + PMTB × guncangan) / PDRB nominal."],["BPS Gini coefficients measure inequality of expenditure, not income, wealth or purchasing power. March 2026 Gini is used only to describe socioeconomic context alongside 2025 economic observations. It is never used to change the score or stress calculation.","Koefisien Gini BPS mengukur ketimpangan pengeluaran, bukan pendapatan, kekayaan, atau daya beli. Gini Maret 2026 hanya digunakan sebagai konteks sosial ekonomi bersama pengamatan ekonomi 2025 dan tidak mengubah skor ataupun penghitungan tekanan."],["No investment return, solvency/default probability, land cost, permit readiness, grid headroom, clean-power availability, crime-based investment risk, political-actor ranking, or claim that project announcements are realized investment.","Tidak mengukur imbal hasil investasi, peluang gagal bayar, harga tanah, kesiapan perizinan, kapasitas tersedia jaringan listrik, ketersediaan listrik bersih, risiko investasi berbasis kriminalitas, peringkat aktor politik, ataupun menganggap pengumuman proyek sebagai realisasi investasi."],["How to use it","Cara menggunakan analisis ini"],["Shortlist provinces, inspect observed bottlenecks and registered project milestones, then validate sector-specific infrastructure, legal requirements, company filings and energy readiness in the other SLI dashboards. Scores should not be used without examining underlying values.","Pilih sejumlah provinsi kandidat, periksa hambatan teramati dan tahapan proyek yang tercatat, lalu verifikasi infrastruktur sektoral, persyaratan hukum, laporan perusahaan, dan kesiapan energi pada dashboard SLI terkait. Skor tidak boleh digunakan tanpa memeriksa nilai dasarnya."],["Official full-PDF audit · 20 October 2026:","Audit PDF resmi lengkap · 20 Oktober 2026:"],["The complete 1,253-page official RUPTL PDF passed file-integrity and page-count verification; 42 annex-section headings are indexed.","PDF resmi RUPTL lengkap setebal 1.253 halaman lolos verifikasi integritas berkas dan jumlah halaman; 42 judul bagian lampiran telah diindeks."],["The heading-only index does not validate individual project records.","Indeks yang hanya memuat judul bagian ini tidak memverifikasi catatan proyek individual."],["The separate 100-page research excerpt remains limited to the decree and early chapters. Province-specific MW, project sites, investment, COD and operational status require verification against the original annex rows before publication.","Cuplikan riset 100 halaman yang terpisah masih terbatas pada keputusan persetujuan dan bab awal. Kapasitas MW, lokasi proyek, nilai investasi, jadwal operasi komersial (COD), serta status operasional per provinsi harus diperiksa terhadap baris lampiran asli sebelum dipublikasikan."],["Open the verified official annex page index ↗","Buka indeks halaman lampiran resmi terverifikasi ↗"],["Official Gatrik RUPTL PDF ↗","PDF RUPTL resmi Gatrik ↗"],["Official full-document audit:","Audit dokumen resmi lengkap:"],["Inspect full RUPTL annex index ↗","Periksa indeks lengkap lampiran RUPTL ↗"],["Open official annex index ↗","Buka indeks lampiran resmi ↗"],["Full RUPTL source cross-check:","Pemeriksaan silang sumber RUPTL lengkap:"],["Open verified official annex index ↗","Buka indeks lampiran resmi terverifikasi ↗"],["Updated source context · 20 October 2026:","Pembaruan konteks sumber · 20 Oktober 2026:"],["This screen still digitizes only the historical 100-page researcher excerpt. The separate 1,253-page official PDF passed file integrity checks, and 42 annex headings are now indexed, but individual project rows and local grid headroom are not validated.","Layar ini masih mendigitalisasi cuplikan historis 100 halaman yang disediakan peneliti. PDF resmi lengkap yang terpisah setebal 1.253 halaman telah lolos pemeriksaan integritas, dengan 42 judul bagian lampiran terindeks. Namun, baris proyek individual dan kapasitas daya lokal yang tersedia belum tervalidasi."],["The 1,253-page official PDF passed integrity verification and its 42 annex headings are indexed. This does not confirm project-level grid nodes, firm available MW, N-1 security, substation connection queues or COD.","PDF resmi 1.253 halaman lolos verifikasi integritas dan 42 judul lampirannya telah diindeks. Hal ini tidak mengonfirmasi simpul jaringan tingkat proyek, kapasitas MW yang pasti tersedia, keandalan N-1, antrean sambungan gardu, ataupun jadwal COD."]];
 for(const [english,indonesian] of cases){
  assert.equal(runtime.translate(english,"id"),indonesian,"Indonesian analysis or evidence caveat missing: "+english.slice(0,80));
  // The English runtime intentionally expands Indonesian energy acronyms (EBT → NRE) without changing metrics or provenance.
  const expectedEn=english.replace(/\bEBT\b/g,"NRE");
  assert.equal(runtime.translate(english,"en"),expectedEn,"English interface or approved glossary deviated: "+english.slice(0,80));
 }
 assert.equal(runtime.translate("Stanford Artificial Intelligence Index Report 2026","id"),"Stanford Artificial Intelligence Index Report 2026");
});

test("RUPTL official header-only index is distinct from sampled source project evidence",()=>{
 const extra=[["The heading-only index does not validate individual project records.","Indeks yang hanya memuat judul bagian ini tidak memverifikasi catatan proyek individual."],["Separately, SLI now publishes a sampled register of original-PDF project rows with selected operator-sourced progress observations, not a national project census.","Secara terpisah, SLI kini menerbitkan register sampel baris proyek dari PDF asli, dilengkapi sejumlah pengamatan kemajuan bersumber dari operator; register ini bukan sensus proyek nasional."],["Source project labels, independent operating evidence, firm available grid MW, N-1 security and COD are different evidence fields and must not be conflated.","Nama proyek dalam sumber, bukti operasi independen, daya jaringan dalam MW yang benar-benar tersedia, keandalan N-1, dan tanggal operasi komersial (COD) adalah jenis bukti yang berbeda dan tidak boleh disamakan."],["Open verified official annex index ↗","Buka indeks lampiran resmi yang terverifikasi ↗"],["Review sampled project evidence ↗","Tinjau bukti proyek sampel ↗"],["A separate sampled PDF project-row register and selected operator status observations are available, but neither constitutes a complete province-level realized-investment census.","Register sampel baris proyek PDF dan sejumlah observasi status dari operator tersedia, tetapi keduanya bukan pencacahan lengkap realisasi investasi menurut provinsi."],["Local grid-headroom, connection queues and PLN Statistics 2025 still require independent validation.","Sisa kapasitas jaringan lokal, antrean sambungan, dan Statistik PLN 2025 masih memerlukan validasi independen."]];
 for(const [en,id] of extra)assert.equal(runtime.translate(en,"id"),id);
 const source=fs.readFileSync("pln-ruptl-2025-2034-source-intelligence.html","utf8");
 assert.match(source,/heading-only index does not validate individual project records/);
 assert.match(source,/sampled register of original-PDF project rows/);
 assert.match(source,/id="ruplt-provincial-project-review"/);
});
