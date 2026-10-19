import {METHODS,getMethod,parseCsv,toRows,describe,evaluate,recommendExecutableMethod,METHOD_FORMULAS} from "./sli-analytical-core.mjs?v=20261020-methods1";
import {multivariateOLS,panelFixedEffects,sensitivityOLS,detectPanelColumns,panelStability} from "./sli-econometrics.mjs?v=20261018-econ12";
import {scatterPlot,investorMarkdown,downloadMarkdown} from "./sli-econometrics-report.mjs?v=20261018-econ12";
import {buildBpsOfficialPanel,BPS_PANEL_META} from "./sli-bps-official-panel.mjs?v=20261018-bps3";
import {auditOfficialProvincialData} from "./sli-provincial-data-integrity.mjs?v=20261018-audit1";
import {structuralEconomyEvidence} from "./sli-structural-economy.mjs?v=20261018-struct1";
const $=id=>document.getElementById(id);
const box=document.createElement("section");
box.id="raAnalyticalWorkbench";box.className="sli-ra-method-workbench";
box.setAttribute("aria-label","SLI methodology and investor data workbench");
box.innerHTML=`<div class="ra-wb-header"><div><span class="ra-wb-kicker">SLI · ANALYTICAL WORKBENCH</span><h2>Research Methods & Data Lab</h2><p data-wb-i18n="intro">Pilih pendekatan analitis, lalu gabungkan dataset CSV/JSON milik Anda dengan hasil riset SLI. Perhitungan awal berjalan lokal di browser.</p></div><span class="ra-wb-marker">49 METODE</span></div>
<div class="ra-wb-grid"><label>Metodologi / Method<select id="raMethod" aria-label="Select quantitative or qualitative methodology"><option value="auto">Auto · AI chooses the suitable method</option></select></label>
<label>Dataset pengguna / Your data<input id="raDataFile" type="file" accept=".csv,.json,text/csv,application/json" aria-label="Upload CSV or JSON dataset"></label></div>
<p id="raDatasetStatus" class="ra-wb-dataset-status" role="status" aria-live="polite">Belum ada dataset aktif. Gunakan data BPS atau unggah CSV/JSON.</p>\n<p id="raMethodInfo" class="ra-wb-detail" role="status">Auto memilih metode sesuai data; tidak mengklaim model yang tidak dijalankan.</p><details id="raMethodCard" class="ra-wb-detail"><summary>Rumus, sumber & batasan / Method statement</summary><p id="raMethodFormula"></p><p id="raMethodRequirements"></p><a id="raMethodFormulaSource" target="_blank" rel="noopener noreferrer" hidden>Rujukan metode ↗</a></details>
<div class="ra-wb-grid ra-wb-variables" id="raVariables" hidden><label>Predictor / X<select id="raPredictor"></select></label><label>Outcome / Y<select id="raOutcome"></select></label></div>
<div class="ra-wb-buttons"><button type="button" id="raRunMethod">Hitung di Browser / Run Local Model</button><button type="button" id="raClearData">Hapus Data / Clear</button></div>
<div class="ra-wb-output" id="raModelResult" role="status" aria-live="polite">Belum ada dataset. CSV/JSON maksimum 1 MB dan 3.000 observasi; XLSX bisa diekspor dahulu sebagai CSV.</div>
<label class="ra-wb-consent"><input type="checkbox" id="raDataConsent"> <span>Saya setuju <strong>ringkasan dan hasil hitung</strong> dataset dikirim ke layanan AI privat ketika saya menekan “Riset dengan AI”. Data mentah tetap lokal. Jangan unggah rahasia dagang atau data pribadi.</span></label>
<p class="ra-wb-footnote">Data yang diunggah bukan sumber SLI terverifikasi. Model statistik lokal bersifat eksploratif; p-value, hubungan sebab-akibat, multiplier ekonomi dan hasil peramalan memerlukan desain riset serta validasi khusus.</p>`;
const evidenceOptions=document.createElement("section");
evidenceOptions.id="raOfficialBpsSource";evidenceOptions.className="ra-wb-official-source";
evidenceOptions.innerHTML='<div><strong>Official Data Lab · BPS 2021–2025</strong><p>Gunakan panel provinsi 2022–2025 yang dihitung dari publikasi resmi PDRB BPS. Baseline validasi wilayah: 32 provinsi × 4 tahun (128 observasi). Papua dan Papua Barat lama tidak dimodelkan karena pemekaran 2023; empat provinsi Papua baru belum punya seri historis 2021–2022 yang sebanding. X bawaan: porsi PMTB tahun sebelumnya, Y: pertumbuhan PDRB riil.</p></div><div class="ra-wb-official-actions"><button type="button" id="raLoadOfficialBps">Gunakan panel BPS tersaring · 32 provinsi</button><a href="https://www.bps.go.id/id/publication/2026/04/30/f01b7d753185ea2e879d321f/produk-domestik-regional-bruto-provinsi-provinsi-di-indonesia-menurut-pengeluaran-2021-2025.html" target="_blank" rel="noopener noreferrer">Baca sumber BPS ↗</a></div><small>Tidak termasuk rasio Gini 2026 atau data PLN 2024 sebagai seri tahunan. Nilai 2024 direvisi, 2025 sementara. Hanya analisis eksploratif; izin penggunaan ulang tabel komersial perlu diperiksa.</small>';
box.prepend(evidenceOptions);
const quality=document.createElement("section");
quality.id="raOfficialDataQA";quality.className="ra-wb-quality";quality.hidden=true;
evidenceOptions.insertAdjacentElement("afterend",quality);
const structuralSection=document.createElement("section");
structuralSection.id="raStructuralEconomy";structuralSection.className="ra-wb-structural-economy";structuralSection.hidden=true;
quality.insertAdjacentElement("afterend",structuralSection);
const anchor=$("raOwnerPanel");
const lab=document.createElement("details");lab.className="sli-ra-advanced-lab";lab.id="raAdvancedLab";
const label=document.createElement("summary");
label.textContent="Laboratorium metode & ekonometrika · Opsional bagi analis";
lab.append(label,box);
anchor?.parentNode?.insertBefore(lab,anchor);

const method=$("raMethod"),datafile=$("raDataFile"),x=$("raPredictor"),y=$("raOutcome"),detail=$("raMethodInfo"),result=$("raModelResult"),varGroup=$("raVariables"),consent=$("raDataConsent");
let data=null,model=null,filename="",last=null,officialBps=null,structuralLens=null;
function renderOfficialQuality(audit){
 quality.replaceChildren();quality.hidden=false;
 const h=document.createElement("h3");h.textContent="SLI Data Quality & Source Readiness";quality.append(h);
 const summary=document.createElement("p");
 summary.textContent="Audit: "+(audit.status==="passed_with_caveats"?"LULUS DENGAN CATATAN":"TERBLOKIR")+
  " · "+audit.panel.entities+" provinsi, "+audit.panel.n+" observasi (2022–2025)"+
  " · Pemeriksaan pertumbuhan BPS 2025: "+audit.crosscheck.sample_size+" pasangan, selisih terbesar "+
  audit.crosscheck.max_abs_diff_pp+" poin persentase.";
 quality.append(summary);
 const explain=document.createElement("p");explain.className="ra-wb-quality-caution";
 explain.textContent="32 provinsi dengan cakupan administratif sebanding. Dua provinsi induk Papua dan empat provinsi baru tidak termasuk. Tahun 2024 direvisi, 2025 sementara. Listrik PLN 2024, Gini 2026 dan IKP BPS 2022–2024 tidak otomatis dimasukkan sebagai panel listrik/ketimpangan.";
 quality.append(explain);
 if(audit.errors.length){
  const err=document.createElement("p");err.className="ra-wb-quality-error";
  err.textContent="Data diblokir: "+audit.errors.join("; ");quality.append(err);return;
 }
 const controls=document.createElement("div");controls.className="ra-wb-quality-controls";
 const add=document.createElement("button");add.type="button";add.id="raAddHouseholdLag";
 add.textContent="Uji prediktor X2: konsumsi rumah tangga lag-1";
 add.addEventListener("click",()=>{
  if(!officialBps||method.value!=="panel_fe"||x.value!=="pmtb_share_lag1_pct"||y.value!=="real_grdp_growth_pct")return;
  const option=[...extra.options].find(o=>o.value==="household_share_lag1_pct");
  if(!option||option.disabled)return;
  option.selected=true;consent.checked=false;last=null;desc();$("raRunMethod").click();
 });
 controls.append(add);
 const note=document.createElement("small");note.textContent="Konsumsi RT dan PMTB adalah komponen PDRB; uji X2 hanya eksploratif. Periksa kolinearitas, komposisi dan endogenitas.";controls.append(note);quality.append(controls);
 const details=document.createElement("details");details.className="ra-wb-quality-details";
 const heading=document.createElement("summary");heading.textContent="Lihat 10 indikator resmi: siap panel, konteks, atau belum tersedia di SLI";details.append(heading);
 const scroller=document.createElement("div");scroller.className="ra-wb-table-scroller";
 const table=document.createElement("table");const row=document.createElement("tr");
 for(const label of ["Indikator","Periode","Kelayakan di SLI","Sumber"]){const th=document.createElement("th");th.textContent=label;row.append(th)}table.append(row);
 const status={panel_ready:"Siap untuk panel",context_only:"Konteks, bukan X otomatis",no_year_panel:"Snapshot, bukan panel",geography_mismatch:"Wilayah tidak sebanding",source_not_ingested:"Belum diimpor/divalidasi"};
 for(const item of audit.sources){
  const tr=document.createElement("tr");
  for(const val of [item.label,item.years,status[item.readiness]||item.readiness]){
   const td=document.createElement("td");td.textContent=val;tr.append(td);
  }
  const td=document.createElement("td");
  if(item.source){const a=document.createElement("a");a.href=item.source;a.target="_blank";a.rel="noopener noreferrer";a.textContent=item.publisher+" ↗";td.append(a)}
  else td.textContent="Belum ada sumber tervalidasi di SLI";
  tr.append(td);table.append(tr);
 }scroller.append(table);details.append(scroller);quality.append(details);
}

function renderStructuralEconomy(lens){
 structuralSection.replaceChildren();structuralSection.hidden=false;
 const head=document.createElement("h3");head.textContent="SLI Structural Economy Lab · Maluku Utara";structuralSection.append(head);
 if(!lens){
  const text=document.createElement("p");text.textContent="Sumber struktur industri belum dapat diverifikasi/dimuat. Baseline regresi BPS tetap dapat dipakai, tetapi analisis sektoral tidak tersedia. Jangan menganggap data industri sudah lengkap.";
  structuralSection.append(text);return;
 }
 const banner=document.createElement("p");banner.className="ra-wb-structural-gate";
 banner.textContent="STATUS: ANALISIS DESKRIPTIF · Panel manufaktur historis belum siap untuk regresi. Jangan menyamakan pertumbuhan industri dengan kontribusi industri terhadap PDRB.";
 structuralSection.append(banner);
 const metrics=document.createElement("div");metrics.className="ra-wb-structural-metrics";
 for(const [title,val,note] of [
  ["Pertumbuhan Maluku Utara 2025",lens.latest.malut_real_grdp_growth_pct+"%","PDRB riil · data BPS"],
  ["Median 32 provinsi 2025",lens.latest.province_median_real_growth_pct+"%","Median tidak tertimbang"],
  ["Pertumbuhan industri pengolahan",lens.latest.manufacturing_real_growth_pct+"%","Laju sektor 2025 · BUKAN pangsa industri"],
  ["Pertumbuhan ekspor barang dan jasa",lens.latest.export_goods_services_growth_pct+"%","Laju komponen pengeluaran 2025"]
 ]){
  const item=document.createElement("div");item.className="ra-wb-structural-metric";
  const titleEl=document.createElement("span");titleEl.textContent=title;
  const valueEl=document.createElement("strong");valueEl.textContent=val;
  const noteEl=document.createElement("small");noteEl.textContent=note;
  item.append(titleEl,valueEl,noteEl);metrics.append(item);
 }
 structuralSection.append(metrics);
 const h=document.createElement("h4");h.textContent="Pembanding pertumbuhan riil 2022–2025";structuralSection.append(h);
 const tableScroll=document.createElement("div");tableScroll.className="ra-wb-table-scroller";
 const table=document.createElement("table");
 const row=document.createElement("tr");
 for(const head of ["Tahun","Maluku Utara (%)","Median 32 provinsi (%)","Selisih (pp)","Peringkat pertumbuhan"]){
  const th=document.createElement("th");th.textContent=head;row.append(th);
 }table.append(row);
 for(const r of lens.yearSeries){
  const tr=document.createElement("tr");
  for(const v of [r.year,r.malut_real_grdp_growth_pct,r.province_median_real_growth_pct,r.malut_minus_median_pp,r.rank_descending+" / 32"]){
   const td=document.createElement("td");td.textContent=String(v);tr.append(td);
  }
  table.append(tr);
 }tableScroll.append(table);structuralSection.append(tableScroll);
 const synthesis=document.createElement("div");synthesis.className="ra-wb-structural-synthesis";
 for(const sentence of lens.synthesis){const p=document.createElement("p");p.textContent=sentence;synthesis.append(p)}
 structuralSection.append(synthesis);
 const sources=document.createElement("div");sources.className="ra-wb-structural-source-links";
 const link=document.createElement("a");link.href=lens.latest.source;link.target="_blank";link.rel="noopener noreferrer";
 link.textContent="BPS Maluku Utara · Rilis pertumbuhan 2025 ↗";sources.append(link);structuralSection.append(sources);
 const facilities=document.createElement("details");facilities.className="ra-wb-structural-details";
 const summary=document.createElement("summary");summary.textContent="Contoh fasilitas hilirisasi dalam dossier SLI ("+lens.facilityExamples.length+" referensi, bukan jumlah seluruh pabrik)";facilities.append(summary);
 if(lens.facilityExamples.length){
  const ul=document.createElement("ul");
  for(const f of lens.facilityExamples){
   const li=document.createElement("li");
   const src=document.createElement("a");src.href=f.source;src.target="_blank";src.rel="noopener noreferrer";src.textContent=f.name;li.append(src);
   const t=document.createElement("span");t.textContent=" · "+f.operator+" · "+f.stage+" · Bukti "+f.evidence_date;li.append(t);ul.append(li);
  }facilities.append(ul);
 }
 const facilityWarning=document.createElement("p");facilityWarning.textContent=lens.facility_disclosure;facilities.append(facilityWarning);
 structuralSection.append(facilities);
 const pending=document.createElement("details");pending.className="ra-wb-structural-details";
 const ph=document.createElement("summary");ph.textContent="Sumber historis/struktur industri yang menunggu digitalisasi dan rekonsiliasi ("+lens.historic_sources.length+")";pending.append(ph);
 const ul=document.createElement("ul");
 for(const source of lens.historic_sources){
  const li=document.createElement("li");
  const link=document.createElement("a");link.href=source.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent=source.id+" · "+source.years[0]+"–"+source.years.at(-1);li.append(link);
  li.append(document.createTextNode(" — "+(source.status==="numeric_ingested_sli"?"Tersedia sebagai input resmi SLI":"Angka belum dimasukkan/diuji dalam SLI")));
  ul.append(li);
 }pending.append(ul);
 const warning=document.createElement("p");warning.textContent=lens.research_gate.reason;pending.append(warning);
 structuralSection.append(pending);
 const sourceNote=document.createElement("small");sourceNote.textContent="BPS 2025 dari rilis Februari 2026; data sektoral terbit kemudian dan dapat mengalami revisi. Perlu pemeriksaan konsistensi antaredisi sebelum membuat panel industri 2020–2025.";
 structuralSection.append(sourceNote);
}

function updateDatasetStatus(){
 const el=$("raDatasetStatus");if(!el)return;
 if(officialBps&&data){
  el.dataset.source="bps";
  el.textContent="DATA AKTIF · BPS 2021–2025 · "+officialBps.entity_count+" provinsi × 4 tahun · "+data.length+
   " observasi turunan. Sumber internal SLI sudah dimuat; kolom upload hanya untuk file milik pengguna. Papua/Papua Barat dikeluarkan karena perubahan wilayah administratif.";
 }else if(data){
  el.dataset.source="upload";
  el.textContent="DATA AKTIF · Upload pengguna · "+(filename||"dataset")+" · "+data.length+
   " observasi. Sumber belum diverifikasi oleh SLI.";
 }else if(model){
  el.dataset.source="model";
  el.textContent="MODEL INPUT AKTIF · "+(filename||"parameter pengguna")+". Hasil belum dihitung.";
 }else{
  el.dataset.source="empty";
  el.textContent="Belum ada dataset aktif. Klik Gunakan data resmi BPS atau unggah CSV/JSON.";
 }
}

const advanced=document.createElement("section");
advanced.className="ra-wb-advanced";advanced.id="raAdvancedControls";advanced.hidden=true;
advanced.innerHTML='<div id="raExtraGroup"><label for="raExtraPredictors">Prediktor tambahan / Additional predictors (X2–X5)</label><select multiple size="4" id="raExtraPredictors" aria-label="Additional regression explanatory variables"></select><small>Tekan Ctrl / Cmd untuk memilih lebih dari satu di daftar ini. Model satu prediktor tetap bisa dijalankan. Maksimal 5 X total.</small><p id="raActivePredictors" class="ra-wb-active-predictors" role="status" aria-live="polite"></p></div><div id="raPanelGroup" hidden><label>Panel province / entity<select id="raPanelEntity"></select></label><label>Time / year column<select id="raPanelTime"></select></label><label class="ra-wb-panel-check"><input type="checkbox" id="raYearFE"> Include common year fixed effects</label><small>Panel needs ≥8 entities and ≥3 years per dataset, with repeated entity-year observations. A 38-province, single-year snapshot is NOT valid panel data.</small></div>';
varGroup.insertAdjacentElement("afterend",advanced);
const extra=$("raExtraPredictors"),entity=$("raPanelEntity"),time=$("raPanelTime"),yearFE=$("raYearFE"),panelGroup=$("raPanelGroup"),extraGroup=$("raExtraGroup");

const STATUS={local:"Executable locally in the browser",design:"Research design / feasibility guidance only — estimator not yet implemented"};
const groups=[...new Set(METHODS.map(m=>m.group))];
for(const group of groups){
 const opt=document.createElement("optgroup");opt.label=group;
 METHODS.filter(m=>m.group===group).forEach(m=>{const o=document.createElement("option");o.value=m.id;o.textContent=m.name+(m.status==="local"?" · local":" · design");opt.append(o)});
 method.append(opt);
}
function desc(){
 const m=getMethod(method.value);
 detail.textContent=m?`${m.name} — ${STATUS[m.status]}. Input: ${m.requires}.`:"Auto: hanya metode yang kompatibel dan punya estimator bisa dihitung; tidak ada hasil karangan.";
 const formula=m?METHOD_FORMULAS[m.id]:null;
 $("raMethodFormula").textContent=formula?.formula||(m?"Estimator belum tersedia: desain metodologi saja.":"Pilih metode untuk melihat persamaan.");
 $("raMethodRequirements").textContent=m?"Syarat: "+m.requires+". Status: "+STATUS[m.status]+".":"Otomatis hanya jika data dan mesin tersedia.";
 const source=$("raMethodFormulaSource");source.hidden=!formula?.source;
 if(formula?.source)source.href=formula.source;else source.removeAttribute("href");
 const numeric=data?describe(data).filter(v=>v.n>=3).map(v=>v.column):[];
 varGroup.hidden=!(data&&["pearson","ols","multivariate_ols","panel_fe"].includes(method.value)&&numeric.length>=2);
 advanced.hidden=!(data&&["multivariate_ols","panel_fe"].includes(method.value));
 panelGroup.hidden=method.value!=="panel_fe";
 extraGroup.hidden=!["multivariate_ols","panel_fe"].includes(method.value);
 if(method.value==="panel_fe"&&data&&!Object.keys(data[0]).some(k=>/^(year|tahun|period|periode)$/i.test(k)))
 detail.textContent+=" Data ini belum memiliki kolom tahun; gunakan panel multi-tahun agar fixed effects dapat dihitung.";
 if(data&&!varGroup.hidden){
  detail.textContent+=" · Model pilihan: Y = "+(y.value||"belum dipilih")+"; X = "+(x.value||"belum dipilih")+".";
  if(/(?:grdp|pdrb|gdp).*growth|growth.*(?:grdp|pdrb|gdp)/i.test(x.value)&&/pmtb/i.test(y.value))
   detail.textContent+=" PERHATIAN: arah ini menempatkan pertumbuhan sebagai X. Untuk PMTB → pertumbuhan, balik X dan Y.";
 }
 if(officialBps&&data&&["panel_fe","multivariate_ols"].includes(method.value))
  detail.textContent+=" · PANEL TERSARING BPS 2021–2025: 32 wilayah stabil; Papua/Papua Barat dikeluarkan dari regresi karena pemekaran 2023. PMTB lag-1 bukan identifikasi kausal. Angka 2024 revisi/2025 sementara.";
 if(data&&method.value==="panel_fe"){
  if(!entity.value)detail.textContent+=" · Panel tidak siap: dataset tidak memiliki sedikitnya 8 identitas wilayah/perusahaan yang berulang di sejumlah tahun. Gunakan kolom province/entity dengan nilai kategori berulang.";
  if(!time.value)detail.textContent+=" · Panel tidak siap: kolom tahun (YYYY) tidak ditemukan.";
  if(entity.value&&time.value)detail.textContent+=" · Unit panel terdeteksi: "+entity.value+"; waktu: "+time.value+". Jangan gunakan indikator listrik/pertumbuhan sebagai identitas unit.";
 }
 // Keep the extra-predictor picker limited to eligible numeric columns.
 // Do not display year, dependent Y or the already-selected primary X as disabled options.
 const previousSelected=new Set([...extra.selectedOptions].map(o=>o.value));
 const excluded=new Set([x.value,y.value,entity.value,time.value]);
 const candidates=numeric.filter(name=>!excluded.has(name)&&!/^(year|tahun|time|period|periode)$/i.test(name));
 if([...extra.options].map(o=>o.value).join("|")!==candidates.join("|")){
  extra.replaceChildren();
  for(const name of candidates){
   const option=document.createElement("option");option.value=name;option.textContent=name;
   option.selected=previousSelected.has(name);extra.append(option);
  }
 }
 const currentExtras=[...extra.selectedOptions].map(o=>o.value);
 const active=$("raActivePredictors");
 if(active)active.textContent="Model saat ini: Y = "+(y.value||"—")+"; "+(x.value?"X1 = "+x.value:"X1 belum dipilih")+
  (currentExtras.length?"; "+currentExtras.map((v,i)=>"X"+(i+2)+" = "+v).join("; "):"; belum ada X2–X5.")+
  " Total prediktor: "+(x.value?currentExtras.length+1:0)+".";


}
function error(message){result.textContent=message;result.dataset.state="error";last=null}
function show(message){result.textContent=message;result.dataset.state="ready"}
function fillVariables(){
 const numeric=data?describe(data).filter(v=>v.n>=3).map(v=>v.column):[];
 for(const select of [x,y]){select.replaceChildren();for(const name of numeric){const opt=document.createElement("option");opt.value=name;opt.textContent=name;select.append(opt)}}
 // Suggest an economic research direction, not a claim of causal identification.
 // Numeric CSV year fields are legitimate time IDs but should not become the default Y.
 const grdpGrowth=numeric.find(v=>/(?:grdp|pdrb|gdp).*growth|growth.*(?:grdp|pdrb|gdp)|pertumbuhan[_-]?(?:ekonomi|pdrb)/i.test(v));
 const capitalShare=numeric.find(v=>/pmtb|gross[_-]?fixed[_-]?capital/i.test(v));
 const nonYear=numeric.filter(v=>!/^(year|tahun|time|period|periode)$/i.test(v));
 if(grdpGrowth&&capitalShare&&grdpGrowth!==capitalShare){x.value=capitalShare;y.value=grdpGrowth;}
 else if(nonYear.length>=2){x.value=nonYear[0];y.value=nonYear[1]}
 else if(numeric.length>1)y.value=numeric[1];
 for(const select of [extra,entity,time])select.replaceChildren();
 const cols=Object.keys(data?.[0]||{});
 // Extra-predictor candidates are populated by desc() after Y, X and entity/time are resolved.
 const detected=detectPanelColumns(data);
 const idLang=document.documentElement.lang!=="en";
 for(const [sel,columns,missingText] of [
  [entity,detected.entities,idLang?"Tidak ada identitas entitas berulang":"No repeated entity identifier detected"],
  [time,detected.times,idLang?"Tidak ada kolom tahun valid":"No valid annual year field detected"]
 ]){
  if(!columns.length){const opt=document.createElement("option");opt.value="";opt.disabled=true;opt.textContent=missingText;sel.append(opt);sel.value="";}
  else for(const key of columns){const opt=document.createElement("option");opt.value=key;opt.textContent=key;sel.append(opt)}
 }
 entity.value=detected.recommendedEntity||"";
 time.value=detected.recommendedTime||"";
 desc();
}
$("raLoadOfficialBps").addEventListener("click",async()=>{
 const button=$("raLoadOfficialBps");
 button.disabled=true;button.textContent="Memeriksa metadata BPS dan menyiapkan panel…";
 try{
  const [sourceResponse,previewResponse]=await Promise.all([
   fetch("./data/sli-bps-regional-intelligence.json",{cache:"no-store"}),
   fetch("./data/sli-research-province-preview.json",{cache:"no-store"})
  ]);
  if(!sourceResponse.ok||!previewResponse.ok)throw Error("Gagal memuat BPS corpus dan cross-check provinsi 2025; blokir model sampai sumber lengkap.");
  const [source,preview]=await Promise.all([sourceResponse.json(),previewResponse.json()]);
  const audit=auditOfficialProvincialData(source,preview);
  renderOfficialQuality(audit);
  if(audit.errors.length)throw Error("Audit BPS gagal: "+audit.errors.join("; "));
  const p=buildBpsOfficialPanel(source,{balanced:true});
  let structure=null;
  try{
   const [catalogueResponse,smelterResponse]=await Promise.all([
    fetch("./data/sli-structural-industry-source-register.json",{cache:"no-store"}),
    fetch("./data/strategic-map-smelter-2026.json",{cache:"no-store"})
   ]);
   if(!catalogueResponse.ok||!smelterResponse.ok)throw Error("Missing sector provenance or smelter dossier");
   const [catalogue,smelterRegistry]=await Promise.all([catalogueResponse.json(),smelterResponse.json()]);
   structure=structuralEconomyEvidence(p,catalogue,smelterRegistry);
  }catch(e){console.warn("SLI structural evidence unavailable; model inputs unchanged:",String(e.message||e).slice(0,150))}
  structuralLens=structure;renderStructuralEconomy(structure);
  data=p.rows;officialBps=p;model=null;last=null;filename="BPS_2021-2025_PANEL_TURUNAN";consent.checked=false;
  datafile.value="";
  fillVariables();
  method.value="panel_fe";x.value="pmtb_share_lag1_pct";y.value="real_grdp_growth_pct";
  yearFE.checked=true;
  for(const opt of extra.options)opt.selected=false;
  desc();
  show("Sumber terverifikasi sebagai publikasi BPS yang tercatat dalam SLI. "+p.n+" observasi turunan dari "+
   p.entity_count+" provinsi (2022–2025). X = PMTB share lag-1; Y = pertumbuhan PDRB riil. "+
   "Model belum dihitung: tekan Hitung di Browser. Enam wilayah Papua dikecualikan dari panel seimbang (dua wilayah induk berubah batas 2023, empat provinsi baru tanpa back-series).");
  result.dataset.origin="official_bps_derived";
  result.dataset.state="ready";
  updateDatasetStatus();
 }catch(err){
  data=null;officialBps=null;model=null;last=null;structuralLens=null;
  structuralSection.hidden=true;structuralSection.replaceChildren();
  error("Data BPS tidak siap: "+String(err.message||err).slice(0,220)+". Tidak ada observasi yang diimputasi.");
  updateDatasetStatus();
 }finally{button.disabled=false;button.textContent="Gunakan panel BPS tersaring · 32 provinsi"}
});

datafile.addEventListener("change",async()=>{
 data=null;model=null;last=null;filename="";officialBps=null;structuralLens=null;consent.checked=false;
 quality.hidden=true;quality.replaceChildren();structuralSection.hidden=true;structuralSection.replaceChildren();
 const file=datafile.files?.[0];if(!file){show("No dataset loaded");updateDatasetStatus();return}
 if(file.size>1048576){error("File exceeds 1 MB client-side limit");updateDatasetStatus();return}
 try{
  const text=await file.text(),type=file.name.toLowerCase();filename=file.name.replace(/[^a-zA-Z0-9._ -]/g,"").slice(0,90);
  if(type.endsWith(".csv"))data=parseCsv(text);
  else if(type.endsWith(".json")){
   const raw=JSON.parse(text);
   if(Array.isArray(raw))data=toRows(raw);
   else if(raw&&typeof raw==="object"&&Array.isArray(raw.rows))data=toRows(raw.rows);
   else if(raw&&typeof raw==="object"&&(Array.isArray(raw.pairwise)||Object.hasOwn(raw,"initial_stock")||
    (Array.isArray(raw.alternatives)&&Array.isArray(raw.criteria)&&Array.isArray(raw.matrix))||
    ["regionalIndustry","regionalTotal","nationalIndustry","nationalTotal"].every(k=>Object.hasOwn(raw,k))||
    ["regionalIndustryBase","regionalIndustryEnd","nationalIndustryBase","nationalIndustryEnd","nationalTotalBase","nationalTotalEnd"].every(k=>Object.hasOwn(raw,k))))model=raw;
   else throw Error("JSON needs rows or AHP, TOPSIS, LQ, Shift-share or Stock-flow parameters");
  }else throw Error("Only CSV and JSON are accepted. Export Excel (.xlsx) as CSV first.");
  if(data){fillVariables();show(`Local dataset ready: ${data.length} rows × ${Object.keys(data[0]).length} columns. Choose a method and run calculations; data stays in browser unless you opt in.`)}
  else{desc();show("Model terstruktur siap. Pilih AHP, TOPSIS, LQ, Shift-share atau Stock-flow lalu hitung.")}
  updateDatasetStatus();
 }catch(e){data=null;model=null;error("Cannot read dataset: "+String(e.message).slice(0,200));updateDatasetStatus()}
});
method.addEventListener("change",()=>{last=null;consent.checked=false;desc();});
for(const select of [x,y,entity,time,extra])select.addEventListener("change",()=>{last=null;consent.checked=false;desc()});
function renderCalculation(output){
 const id=document.documentElement.lang!=="en";
 const num=v=>typeof v==="number"&&Number.isFinite(v)?new Intl.NumberFormat(id?"id-ID":"en-GB",{maximumFractionDigits:4}).format(v):String(v??"—");
 const paragraph=(parent,text)=>{const p=document.createElement("p");p.textContent=text;parent.append(p);return p};
 result.replaceChildren();
 const step=document.createElement("span");step.className="ra-wb-step";
 step.textContent=id?"LANGKAH 2 · HASIL PENGOLAHAN DATA LOKAL":"STEP 2 · LOCAL DATA ANALYSIS";
 result.append(step);
 const title=document.createElement("strong");title.textContent=(id?"Hasil model: ":"Model result: ")+(
  {descriptive:id?"Statistik deskriptif":"Descriptive statistics",pearson:id?"Korelasi Pearson":"Pearson correlation",ols:id?"Regresi OLS sederhana":"Simple OLS regression",ahp:"AHP",stock_flow:"Stock–Flow"}[output.method]||output.method);
 result.append(title);
 if(output.method==="descriptive"){
  paragraph(result,id?`Berhasil memproses ${output.rows} observasi. Tabel berikut memperlihatkan distribusi tiap indikator, bukan hubungan sebab-akibat atau prediksi.`:`Processed ${output.rows} observations. The table summarises each variable, not causal effects or forecasts.`);
 }else if(output.method==="pearson"){
  paragraph(result,id?`Korelasi Pearson ${output.x} terhadap ${output.y}: r = ${num(output.r)} dari ${output.n} pasangan observasi. Korelasi tidak membuktikan sebab-akibat.`:`Pearson correlation between ${output.x} and ${output.y}: r = ${num(output.r)}, based on ${output.n} complete pairs. Correlation does not establish causality.`);
 }else if(output.method==="ols"){
  paragraph(result,id?`Regresi: ${output.y} = ${num(output.intercept)} + (${num(output.slope)} × ${output.x}); R² = ${num(output.r_squared)}; n = ${output.n}. Ini hubungan linear pada sampel, bukan pengaruh kausal investasi.`:`Sample fitted equation: ${output.y} = ${num(output.intercept)} + (${num(output.slope)} × ${output.x}); R² = ${num(output.r_squared)}; n = ${output.n}. This is not a causal estimate.`);
 }else if(output.method==="ahp"){
  paragraph(result,id?`Bobot kriteria dihitung dari penilaian berpasangan. Consistency Ratio = ${num(output.consistency_ratio)}; ${output.acceptable?"konsistensi berada dalam ambang konvensional.":"konsistensi perlu diperiksa kembali."} Bobot bersifat subjektif, bukan pengukuran dampak ekonomi.`:`Weights reflect pairwise judgments. Consistency Ratio = ${num(output.consistency_ratio)}; ${output.acceptable?"within the conventional consistency threshold.":"judgment consistency needs review."} Weights are subjective.`);
 }else if(output.method==="stock_flow"){
  paragraph(result,id?`Skenario simulasi: stok bergerak dari ${num(output.initial_stock)} ke ${num(output.final_stock)} dalam ${output.periods} periode. Arus masuk dan laju keluar bersifat tetap; hasil bukan proyeksi terkalibrasi.`:`Illustrative stock simulation: ${num(output.initial_stock)} to ${num(output.final_stock)} across ${output.periods} periods. These fixed-parameter results are not calibrated forecasts.`);
 }
 if(output.method==="descriptive"){
  const scroll=document.createElement("div");scroll.className="ra-wb-table-scroller";
  const table=document.createElement("table");
  const tr=document.createElement("tr");
  (id?["Indikator","N","Kosong","Rata-rata","Median","SD","Min","Maks"]:["Variable","N","Missing","Mean","Median","SD","Min","Max"]).forEach(h=>{const th=document.createElement("th");th.textContent=h;tr.append(th)});table.append(tr);
  output.columns.filter(c=>c.n>0).slice(0,20).forEach(c=>{const row=document.createElement("tr");[c.column,c.n,c.missing,c.mean,c.median,c.sd,c.min,c.max].forEach(v=>{const td=document.createElement("td");td.textContent=num(v);row.append(td)});table.append(row)});
  scroll.append(table);result.append(scroll);
 }else if(output.method==="ahp"){
  const scroll=document.createElement("div");scroll.className="ra-wb-table-scroller";
  const table=document.createElement("table");
  const head=document.createElement("tr");for(const v of [id?"Kriteria":"Criterion",id?"Bobot":"Weight"]){const th=document.createElement("th");th.textContent=v;head.append(th)}table.append(head);
  for(const c of [...output.criteria].sort((a,b)=>b.weight-a.weight)){const row=document.createElement("tr"),n=document.createElement("td"),w=document.createElement("td");n.textContent=c.name;w.textContent=(c.weight*100).toFixed(2)+"%";row.append(n,w);table.append(row)}
  scroll.append(table);result.append(scroll);
 }else if(output.method==="stock_flow"){
  const values=output.trajectory.map(v=>v.stock),lo=Math.min(...values),hi=Math.max(...values),spread=hi-lo||1;
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("viewBox","0 0 440 130");svg.setAttribute("role","img");
  svg.setAttribute("aria-label","Simulated stock trajectory over time");svg.style.width="100%";
  const line=document.createElementNS("http://www.w3.org/2000/svg","polyline");
  line.setAttribute("points",values.map((v,i)=>`${20+(i/(values.length-1))*400},${110-((v-lo)/spread)*90}`).join(" "));
  line.setAttribute("fill","none");line.setAttribute("stroke","#235f9d");line.setAttribute("stroke-width","3");svg.append(line);result.append(svg);
 }
 const context=document.createElement("section");context.className="ra-wb-analysis";
 const contextHeading=document.createElement("strong");
 contextHeading.textContent=id?"Interpretasi untuk investor":"Investor interpretation";context.append(contextHeading);
 if(output.method==="descriptive"){
  const growth=output.columns.find(c=>c.column==="real_grdp_growth_2025_pct");
  const pmtb=output.columns.find(c=>c.column==="pmtb_share_2025_pct");
  const gini=output.columns.find(c=>c.column==="gini_expenditure_mar2026");
  if(growth&&pmtb){
   paragraph(context,id?
    `Pertumbuhan PDRB riil dalam dataset rata-rata ${num(growth.mean)}% dengan median ${num(growth.median)}%; rentangnya ${num(growth.min)}% hingga ${num(growth.max)}%, yang menandakan variasi wilayah sangat lebar. Porsi PMTB rata-rata ${num(pmtb.mean)}%, namun PMTB sebagai komponen PDRB bukan nilai realisasi investasi BKPM.`:
    `Observed mean real GRDP growth is ${num(growth.mean)}% (median ${num(growth.median)}%), ranging from ${num(growth.min)}% to ${num(growth.max)}%; provincial growth is highly heterogeneous. Mean PMTB expenditure share is ${num(pmtb.mean)}%, not the same measure as BKPM realised investment.`);
   paragraph(context,id?
    `Dataset ini dapat diteruskan ke regresi untuk menguji asosiasi PMTB dan pertumbuhan, tetapi pengaruh observasi ekstrem harus diperiksa sebelum kesimpulan investasi dibuat.`:
    `A simple regression may test observed PMTB-growth association, but extreme observations and model identification must be assessed before investment conclusions.`);
  }else paragraph(context,id?"Bandingkan satuan, sebaran, median, dan data hilang sebelum memilih model. Angka deskriptif belum membuktikan pengaruh suatu variabel.":"Review units, distributions, median and missingness before choosing an estimator.");
  if(gini)paragraph(context,id?"Rasio Gini Maret 2026 dibandingkan dengan indikator ekonomi 2025; perbedaan periode harus dinyatakan dan tidak boleh disebut bukti dampak investasi.":"Gini (March 2026) and GRDP (2025) use different reference periods; this does not establish the effect of investment.");
 }else if(output.method==="ols"){
  const r2=output.r_squared;
  paragraph(context,id?
   `R² sebesar ${num(r2)} berarti sekitar ${num(r2*100)}% variasi Y pada sampel dijelaskan oleh spesifikasi linear satu prediktor. Kemampuan menjelaskan sampel tidak sama dengan ketepatan peramalan atau hubungan kausal.`:
   `R² = ${num(r2)} accounts for about ${num(r2*100)}% of sample Y variance in this one-predictor fit. It is neither an out-of-sample forecast nor proof of causation.`);
  if(data&&output.y==="real_grdp_growth_2025_pct"){
   const filtered=data.filter(r=>{const v=Number(r[output.y]);return Number.isFinite(v)&&v>=-15&&v<=15});
   if(filtered.length>=8&&filtered.length<data.length){
    try{const check=evaluate({method:"ols",rows:filtered,x:output.x,y:output.y});
     paragraph(context,id?
       `Uji sensitivitas dengan observasi pertumbuhan di luar -15% hingga 15% dikeluarkan sementara: R² menjadi ${num(check.r_squared)} (n=${check.n}). Ambang ini hanya ilustrasi; observasi ekstrem tidak semestinya dihapus tanpa alasan metodologis.`:
       `Exploratory sensitivity test excluding growth outside -15% to 15%: R² becomes ${num(check.r_squared)} (n=${check.n}). The threshold is illustrative; do not exclude extreme values without methodological justification.`);
    }catch{ /* no misleading fallback if model fails */ }
   }
  }
  paragraph(context,id?"Analisis keputusan investasi membutuhkan variabel kontrol, pendekatan panel/time series yang sesuai, diagnosa residual, serta identifikasi faktor kausal.":"Investment appraisal needs controls, an appropriate panel/time-series design, diagnostics and credible causal identification.");
 }else if(output.method==="pearson"){
  paragraph(context,id?
   `Nilai absolut r sebesar ${num(Math.abs(output.r))} mengukur kedekatan linear dalam data berpasangan. Korelasi dapat dipengaruhi outlier dan pola tren, sehingga sebaiknya dibandingkan dengan plot sebar dan regresi robust.`:
   `The absolute correlation ${num(Math.abs(output.r))} measures linear association, subject to outliers and trends; consider scatterplots and robust checks.`);
 }else if(output.method==="ahp")paragraph(context,id?"Periksa perubahan urutan alternatif saat bobot diubah dan validitas penilaian tiap kriteria sebelum menggunakannya untuk investasi.":"Check weight sensitivity and underlying evidence before ranking investment alternatives.");
 else if(output.method==="stock_flow")paragraph(context,id?"Bandingkan skenario arus masuk, tingkat keluaran, kapasitas dan asumsi awal. Model ini belum mencakup feedback dan kalibrasi empiris.":"Stress-test inflows, outflows and capacities. This model has no calibrated feedback loops.");
 result.append(context);
 if(output.method==="descriptive"&&data&&["pmtb_share_2025_pct","real_grdp_growth_2025_pct"].every(v=>Object.hasOwn(data[0]||{},v))){
  const follow=document.createElement("div");follow.className="ra-wb-next";
  const btn=document.createElement("button");btn.type="button";
  btn.textContent=id?"Lanjut: jalankan regresi PMTB → Pertumbuhan":"Next: run PMTB → Growth regression";
  btn.addEventListener("click",()=>{
   method.value="ols";desc();x.value="pmtb_share_2025_pct";y.value="real_grdp_growth_2025_pct";
   $("raRunMethod").click();
  });
  follow.append(btn);result.append(follow);
 }
 const note=document.createElement("small");note.textContent=output.limitation||"Review source assumptions and uncertainty before any investment decision.";result.append(note);
}

function addEconometricAppendix(fit,sensitivity=null,stability=null){
 const appendHeading=(label)=>{const h=document.createElement("h3");h.className="ra-wb-subhead";h.textContent=label;result.append(h)};
 const text=(tag,val)=>{const el=document.createElement(tag);el.textContent=val;result.append(el);return el};
 const visual=scatterPlot(fit,sensitivity?.reduced||null);
 if(visual){
  appendHeading(fit.predictors.length===1?"Scatter plot · "+(fit.observations?.length||"n")+" observasi / observed vs fitted":"Model diagnostic · observed vs predicted");
  const wrap=document.createElement("div");wrap.className="ra-wb-plot";wrap.append(visual);result.append(wrap);
  text("small",fit.predictors.length===1?"Biru: OLS semua observasi · jingga putus-putus: sensitivitas tanpa pertumbuhan ekstrem · merah: observasi berpengaruh (Cook D atau residual). Hover titik untuk identitas provinsi.":"Biru: data / identitas OLS · merah: observasi berpengaruh. Arah sumbu memperlihatkan observasi vs nilai prediksi.");
 }
 const d=fit.residual_diagnostics;
 const flagged=(d?.flagged||[]).map(o=>o.name||fit.observations?.[o.index-1]?.name||("Baris "+o.index));
 text("p","Observasi yang terindikasi berpengaruh ("+(flagged.length||0)+"): "+(flagged.join(", ")||"tidak ada pada ambang diagnosis sederhana")+". "+(fit.method==="panel_fe"?"Diagnostik Cook dihitung pada desain transformasi fixed effects dan bersifat pemeriksaan awal, bukan ukuran leverage FE lengkap. ":"")+"Penanda membutuhkan pemeriksaan data, bukan penghapusan otomatis.");
 if(sensitivity?.reduced)text("p","Perbandingan ilustratif: R² keseluruhan "+fit.r_squared+" (n="+fit.n+"), sensitivitas "+sensitivity.reduced.r_squared+" (n="+sensitivity.reduced.n+"). Tidak membuktikan sebab-akibat.");
 const controls=document.createElement("div");controls.className="ra-wb-next";
 const button=document.createElement("button");button.type="button";button.textContent="Unduh Investor Analytical Report (.md)";
 button.addEventListener("click",()=>downloadMarkdown(investorMarkdown(fit,filename,sensitivity,stability,officialBps?.publication||null,structuralLens)));
 controls.append(button);
 const notice=document.createElement("small");notice.textContent="Report berisi hasil nyata, batasan identifikasi, pemeriksaan data, temuan dan rekomendasi due diligence. Tidak menyertakan data mentah.";
 controls.append(notice);result.append(controls);
}
function renderPanelStability(stability){
 const id=document.documentElement.lang!=="en";
 const section=document.createElement("section");section.className="ra-wb-stability";
 const heading=document.createElement("h3");heading.textContent=id?"Uji kestabilan koefisien · Panel FE":"Coefficient stability · Panel FE";section.append(heading);
 if(stability.error){const p=document.createElement("p");p.textContent=stability.error;section.append(p);result.append(section);return}
 const subtitle=document.createElement("p");
 subtitle.textContent=id?"SLI menghitung ulang model saat satu entitas atau satu tahun dikeluarkan secara bergantian. Hasil membandingkan perubahan koefisien; ini bukan pembuktian sebab-akibat.":"The same estimator is refitted after excluding one entity/year at a time. These are diagnostic comparisons, not causal evidence.";
 section.append(subtitle);
 if(stability.decision_readiness==="not_robust_for_investment_inference"){
  const warning=document.createElement("p");warning.className="ra-wb-robustness-warning";warning.setAttribute("role","status");
  warning.textContent="HASIL TIDAK STABIL — Jangan menyimpulkan dampak atau arah hubungan ekonomi untuk keputusan investasi berdasarkan spesifikasi ini. Bandingkan perubahan tanda, interval kepercayaan, serta ketergantungan pada tahun/provinsi.";
  section.append(warning);
 }
 const showTable=(title,part)=>{
  const h=document.createElement("h4");h.textContent=title;section.append(h);
  if(!part?.available){const p=document.createElement("p");p.textContent=part?.note||"Uji tidak tersedia";section.append(p);return}
  const info=document.createElement("p");info.className="ra-wb-stability-meta";
  info.textContent="Re-estimations: "+part.successful+"/"+part.total_candidates+" · "+(part.exhaustive?"Semua entitas/periode diuji":"Sebagian entitas/periode diuji")+" · Failed: "+part.failures.length;
  section.append(info);
  const scroll=document.createElement("div");scroll.className="ra-wb-table-scroller";
  const table=document.createElement("table");
  const tr=document.createElement("tr");
  for(const head of ["X / Variabel","Baseline β","Min β","Max β","Maks |Δβ|","Maks Δ (%)","Ganti tanda","Paling berpengaruh","Status"]){const th=document.createElement("th");th.textContent=head;tr.append(th)}
  table.append(tr);
  for(const m of part.metrics||[]){
   const vals=[m.name,m.baseline,m.min,m.max,m.max_absolute_shift??"n/a",
    m.max_relative_shift_pct===null?"n/a":m.max_relative_shift_pct,
    m.sign_reversals??"n/a",m.most_influential_exclusion||"—",
    m.sign_reversals>0?"Perubahan tanda":m.sensitivity==="high"?"Sensitif":m.sensitivity==="moderate"?"Perlu perhatian":"Relatif stabil"];
   const r=document.createElement("tr");
   vals.forEach((value,i)=>{const td=document.createElement("td");td.textContent=String(value??"—");if(i===8&&["Sensitif","Perubahan tanda"].includes(value))td.className="ra-wb-stability-flag";r.append(td)});
   table.append(r);
  }scroll.append(table);section.append(scroll);
  if((part.metrics||[]).some(m=>m.relative_change_near_zero_denominator)){
   const denominatorNote=document.createElement("p");denominatorNote.className="ra-wb-stability-meta";
   denominatorNote.textContent="Catatan: persen perubahan terhadap koefisien awal mendekati nol dapat terlihat sangat besar. Bandingkan kolom Maks |Δβ| (perubahan absolut) dan jumlah pergantian tanda.";
   section.append(denominatorNote);
  }
  if(part.failures.length){const fail=document.createElement("small");fail.textContent="Some refits could not be estimated: "+part.failures.map(x=>x.excluded+": "+x.reason).slice(0,3).join(" · ");section.append(fail)}
 };
 showTable(id?"Keluarkan satu entitas (LOEO)":"Leave-one-entity-out",stability.leave_one_entity_out);
 showTable(id?"Keluarkan satu tahun (LOYO)":"Leave-one-year-out",stability.leave_one_year_out);
 const showRefitDetails=(title,part,open)=>{
  if(!part?.refits?.length)return;
  const details=document.createElement("details");details.className="ra-wb-refit-details";details.open=open;
  const summary=document.createElement("summary");summary.textContent=title+" ("+part.refits.length+" estimasi)";details.append(summary);
  const note=document.createElement("p");note.textContent=id?
   "Satu baris = model yang dihitung ulang setelah unit/tahun tersebut dikeluarkan. Δβ = koefisien baru dikurangi baseline; pergantian tanda ditandai. Pengujian ini bukan estimasi dampak ekonomi.":
   "Each row is a refit excluding the stated entity/year. Δβ = refitted coefficient minus baseline. Sign changes are marked; this does not estimate causal effects.";
  details.append(note);
  const scroll=document.createElement("div");scroll.className="ra-wb-table-scroller";
  const table=document.createElement("table"),head=document.createElement("tr");
  const isYear=title.includes("tahun")||title.includes("year");
  const names=["Yang dikeluarkan",...stability.baseline_predictors.flatMap(n=>[n+" β",n+" Δβ",n+" tanda"])];
  for(const label of names){const th=document.createElement("th");th.textContent=label;head.append(th)}table.append(head);
  const refs=[...part.refits].sort((u,v)=>isYear?String(u.excluded).localeCompare(String(v.excluded)):
   Number(v.coefficients.some(x=>x.sign_changed))-Number(u.coefficients.some(x=>x.sign_changed))||String(u.excluded).localeCompare(String(v.excluded)));
  for(const entry of refs){
   const tr=document.createElement("tr");
   if(entry.coefficients.some(c=>c.sign_changed))tr.className="ra-wb-refit-sign-flip";
   const first=document.createElement("td");first.textContent=entry.excluded;tr.append(first);
   for(const c of entry.coefficients){
    const cells=[c.estimate,c.absolute_shift,c.sign_changed?"Berubah":"Tetap"];
    for(let i=0;i<cells.length;i++){
     const td=document.createElement("td");td.textContent=String(cells[i]);
     if(i===2&&c.sign_changed)td.className="ra-wb-stability-flag";
     tr.append(td);
    }
   }
   table.append(tr);
  }
  scroll.append(table);details.append(scroll);section.append(details);
 };
 showRefitDetails(id?"Detail setiap tahun yang dikeluarkan":"Every omitted year",stability.leave_one_year_out,true);
 showRefitDetails(id?"Detail setiap provinsi yang dikeluarkan":"Every omitted entity",stability.leave_one_entity_out,false);
 if(stability.baseline_year_count<=4){
  const note=document.createElement("p");note.className="ra-wb-short-panel-warning";
  note.textContent=id?
   "PERHATIAN: baseline hanya "+stability.baseline_year_count+" tahun. Uji LOYO menyisakan 3 periode dan mengestimasi ulang efek tetap tahun; koefisien dapat berubah besar akibat sampel sangat pendek. Gunakan seri lebih panjang sebelum membuat kesimpulan untuk investor.":
   "CAUTION: only "+stability.baseline_year_count+" baseline years. Removing one year leaves 3 periods; fixed effects are re-estimated on this short sample. Longer consistent series are needed for investor inference.";
  section.append(note);
 }
 if(officialBps&&stability.baseline_entity_count===32){
  const context=document.createElement("p");context.className="ra-wb-stability-evidence";
  const names=new Set((stability.leave_one_entity_out?.metrics||[]).map(m=>m.most_influential_exclusion));
  const critical2025=(stability.leave_one_year_out?.metrics||[]).some(m=>m.most_influential_exclusion==="2025");
  context.textContent=(names.has("Maluku Utara")?
   "KONTEKS RESMI: Maluku Utara tumbuh 34,17% selama 2025 menurut BPS, dipimpin pertumbuhan industri pengolahan 62,64%. Observasi ini harus diuji secara sektoral, bukan otomatis dihapus sebagai error. ":"")+
   (critical2025?"Tahun 2025 (angka PDRB sementara) berpengaruh pada koefisien. Empat tahun observasi terlalu pendek untuk kesimpulan investasi yang stabil. ":"")+
   "Panel ini mengukur asosiasi ekonomi, bukan dampak hilirisasi nikel atau multiplier investasi.";
  section.append(context);
  if(names.has("Maluku Utara")){
   const cite=document.createElement("a");cite.href="https://malut.bps.go.id/id/pressrelease/2026/02/05/843/ekonomi-maluku-utara-triwulan-iv-2025-tumbuh-29-81-persen-y-on-y-.html";
   cite.target="_blank";cite.rel="noopener noreferrer";cite.textContent="BPS Maluku Utara · Pertumbuhan 2025 ↗";section.append(cite);
  }
 }

 const other=stability.alternative_time_specification;
 const h=document.createElement("h4");h.textContent=id?"Perbandingan spesifikasi efek waktu":"Alternative time fixed-effects specification";section.append(h);
 if(other?.available){
  const tag=document.createElement("p");tag.textContent="Spesifikasi alternatif: "+(other.specification==="entity_only_FE"?"Hanya unit fixed effects":"Unit + year fixed effects");
  section.append(tag);
  const scroll=document.createElement("div");scroll.className="ra-wb-table-scroller";
  const table=document.createElement("table");const tr=document.createElement("tr");
  for(const name of ["Variabel","Baseline β","Alternatif β","Δ (%)"]){const th=document.createElement("th");th.textContent=name;tr.append(th)}
  table.append(tr);
  other.coefficients.forEach(c=>{
   const tr=document.createElement("tr");
   [c.name,c.baseline,c.alternative,c.relative_change_pct??"n/a"].forEach(z=>{const td=document.createElement("td");td.textContent=String(z);tr.append(td)});
   table.append(tr);
  });scroll.append(table);section.append(scroll);
 }else{const p=document.createElement("p");p.textContent=other?.reason||"Spesifikasi alternatif belum tersedia.";section.append(p)}
 const interpretation=document.createElement("p");interpretation.className="ra-wb-stability-summary";
 interpretation.textContent="Assessment: "+stability.screening+
  (officialBps?" Analisis menggunakan input statistik terbitan BPS yang diolah SLI, dengan komparabilitas wilayah disaring; validitas mekanisme ekonomi, endogenitas, dan kausalitas tetap belum terbukti.":" Analisis didasarkan pada data unggahan yang belum diverifikasi oleh SLI; mekanisme ekonomi, endogenitas dan kausalitas belum terbukti.");
 section.append(interpretation);result.append(section);
}

function renderEconometricResult(fit,stability=null){
 const id=document.documentElement.lang!=="en";
 result.replaceChildren();
 const subtitle=document.createElement("strong");
 subtitle.textContent=fit.method==="panel_fe"?"Panel Fixed Effects · "+(fit.two_way_fe?"unit + year":"unit"):
 "Multiple OLS · HC1 robust standard errors";
 result.append(subtitle);
 const specification=document.createElement("p");
 specification.className="ra-wb-specification";
 specification.textContent=(id?"Model yang dihitung: Y (variabel terikat) = ":"Estimated model: Y (dependent) = ")+fit.outcome+
  "; X (prediktor) = "+fit.predictors.join(", ")+
  (fit.method==="panel_fe"?" · Efek tetap: unit"+(fit.two_way_fe?" + tahun":""):"");
 result.append(specification);
 if(officialBps&&fit.method==="panel_fe"&&fit.predictors.includes("pmtb_share_pct")){
  const warning=document.createElement("section");warning.className="ra-wb-spec-warning";warning.setAttribute("role","status");
  const text=document.createElement("p");
  text.textContent="PERHATIAN SPESIFIKASI: Model ini memakai pmtb_share_pct (PMTB tahun berjalan), bukan pmtb_share_lag1_pct (PMTB tahun sebelumnya). Koefisien dan uji sensitivitas tidak boleh dibandingkan langsung dengan baseline lag-1. PMTB tahun berjalan juga lebih rentan terhadap simultanitas dengan pertumbuhan pada tahun yang sama.";
  warning.append(text);
  const correct=document.createElement("button");correct.type="button";correct.className="ra-wb-restore-lag";
  correct.textContent="Gunakan baseline PMTB lag-1 dan hitung ulang";
  correct.addEventListener("click",()=>{
   if(!officialBps||method.value!=="panel_fe")return;
   const lag="pmtb_share_lag1_pct";
   if(![...x.options].some(o=>o.value===lag))return;
   x.value=lag;
   for(const o of extra.options)if(o.value==="pmtb_share_pct")o.selected=false;
   last=null;consent.checked=false;desc();$("raRunMethod").click();
   if(typeof result.scrollIntoView==="function")result.scrollIntoView({block:"start",behavior:"smooth"});
  });
  warning.append(correct);result.append(warning);
 }
 if(officialBps&&fit.method==="panel_fe"){
  const prov=document.createElement("section");prov.className="ra-wb-bps-provenance";
  const h=document.createElement("strong");h.textContent="DATA RESMI BPS · PERHITUNGAN TURUNAN SLI · BUKAN ESTIMASI RESMI BPS";prov.append(h);
  const p=document.createElement("p");
  p.textContent="Sumber: PDRB Provinsi Menurut Pengeluaran 2021–2025 (terbit 30 April 2026). "+
   "Panel "+officialBps.entity_count+" provinsi × 4 tahun (2022–2025); "+
   "pertumbuhan = perubahan PDRB ADHK 2010; pmtb_share_lag1_pct = PMTB tahun t−1 / PDRB ADHB tahun t−1 × 100; pmtb_share_pct = PMTB tahun t / PDRB ADHB tahun t × 100. Lihat variabel pada spesifikasi yang benar-benar dihitung. "+
   "Papua dan Papua Barat dikeluarkan karena cakupan wilayah berubah pada 2023, sehingga penurunan PDRB akibat pemekaran tidak menjadi pertumbuhan ekonomi palsu. Empat provinsi Papua baru juga dikecualikan karena tidak ada seri 2021–2022. "+
   "PDRB 2024 berstatus revisi dan 2025 sementara. Hubungan statistik tidak membuktikan dampak kausal investasi.";
  prov.append(p);
  const link=document.createElement("a");link.href=officialBps.publication.url;link.textContent="Sumber primer BPS ↗";link.target="_blank";link.rel="noopener noreferrer";prov.append(link);
  const audit=document.createElement("a");
  audit.href="https://papuabarat.bps.go.id/id/publication/2024/04/04/038627aa90c2a310aaf907c6/gross-regional-domestic-product-of-papua-barat-province-by-industry-20192023.html";
  audit.target="_blank";audit.rel="noopener noreferrer";
  audit.textContent="BPS: perubahan wilayah Papua Barat 2023 ↗";
  audit.style.marginLeft="12px";prov.append(audit);
  result.append(prov);
 }
 if(/(?:synthet|sintet|demo|simulation|simulasi)/i.test(filename)){
  const sourceNotice=document.createElement("p");sourceNotice.className="ra-wb-synthetic-warning";
  sourceNotice.textContent=id?"DATA SIMULASI: angka pada dataset ini hanya untuk menguji fungsi SLI. Koefisien dan p-value tidak boleh dipakai sebagai bukti keadaan ekonomi atau rekomendasi investasi aktual.":"SYNTHETIC SAMPLE: these figures test software functionality only. Coefficients and p-values do not establish real economic conditions.";
  result.append(sourceNotice);
 }
 if(/(?:grdp|pdrb|gdp).*growth|growth.*(?:grdp|pdrb|gdp)/i.test(fit.predictors[0])&&/pmtb/i.test(fit.outcome)){
  const warning=document.createElement("div");warning.className="ra-wb-orientation-warning";warning.setAttribute("role","alert");
  const explanation=document.createElement("p");
  explanation.textContent=id?"Perhatian: pertumbuhan PDRB menjadi X dan PMTB menjadi Y. Model ini BUKAN PMTB → pertumbuhan. Jika tujuan riset adalah menjelaskan pertumbuhan, balik arah model lalu hitung ulang.":"Warning: GRDP growth is the predictor and PMTB is the outcome. This is NOT PMTB → growth. Reverse X/Y to test the intended economic question.";
  warning.append(explanation);
  const switchButton=document.createElement("button");
  switchButton.type="button";switchButton.className="ra-wb-correct-orientation";
  switchButton.textContent=id?"Balik X/Y dan hitung ulang":"Reverse X/Y and rerun";
  switchButton.setAttribute("aria-label",id?"Balik arah regresi PMTB terhadap pertumbuhan dan hitung ulang":"Reverse PMTB and growth model direction and rerun");
  switchButton.addEventListener("click",()=>{
   // Require the current selection to match the result being corrected, so a stale warning
   // cannot silently overwrite a researcher's more recent variable choices.
   if(x.value!==fit.predictors[0]||y.value!==fit.outcome){
    const msg=document.createElement("small");msg.textContent=id?"Pilihan variabel sudah berubah. Periksa X/Y dan klik Hitung di Browser.":"Variable selection has changed. Check X/Y and run the model.";
    warning.append(msg);return;
   }
   if(![...x.options].some(o=>o.value===fit.outcome)||![...y.options].some(o=>o.value===fit.predictors[0]))return;
   x.value=fit.outcome;
   y.value=fit.predictors[0];
   // Additional predictors remain intact; only the first X and dependent Y swap.
   last=null;consent.checked=false;desc();
   $("raRunMethod").click();
   if(typeof result.scrollIntoView==="function")result.scrollIntoView({block:"start",behavior:"smooth"});
  });
  warning.append(switchButton);
  result.append(warning);
 }
 const p=document.createElement("p");p.textContent=fit.method==="panel_fe"?
  "Panel yang digunakan: "+fit.unit_count+" entitas × "+fit.time_count+" periode, "+fit.rows_used+" observasi (complete cases); uncertainty menggunakan cluster-robust per entitas.":
  "Model regresi dengan "+fit.predictors.length+" prediktor dan "+fit.rows_used+" observasi lengkap; R² = "+fit.r_squared+".";
 result.append(p);
 if(fit.method==="panel_fe"&&fit.predictors.length===1){
  const electricOption=[...extra.options].find(o=>!o.disabled&&/electricity.*access|electric.*access|rasio.*elektrifikasi|electrification/i.test(o.value));
  if(electricOption&&electricOption.value!==fit.outcome){
   const n=document.createElement("section");n.className="ra-wb-model-extension";
   const info=document.createElement("p");
   info.textContent=id?
    "Model ini baru memakai satu variabel penjelas (X1: "+fit.predictors[0]+"). Akses listrik belum dikontrol. Bandingkan dengan model X1 + akses listrik agar perubahan koefisien dan ketidakpastian terlihat.":
    "This model has one predictor (X1: "+fit.predictors[0]+"). Electricity access is not controlled for. Compare with the two-predictor specification.";
   n.append(info);
   const button=document.createElement("button");button.type="button";button.className="ra-wb-add-predictor";
   button.textContent=id?"Tambahkan akses listrik sebagai X2 dan hitung ulang":"Add electricity access as X2 and rerun";
   button.addEventListener("click",()=>{
    if(!data||!["panel_fe","multivariate_ols"].includes(method.value)||x.value!==fit.predictors[0]||y.value!==fit.outcome){
     const text=document.createElement("small");text.textContent=id?"Konfigurasi telah berubah; periksa variabel X/Y sebelum menghitung lagi.":"Model changed. Check X/Y before rerunning.";n.append(text);return;
    }
    const choice=[...extra.options].find(o=>o.value===electricOption.value&&!o.disabled);
    if(!choice)return;
    choice.selected=true;
    last=null;consent.checked=false;desc();
    $("raRunMethod").click();
    if(typeof result.scrollIntoView==="function")result.scrollIntoView({block:"start",behavior:"smooth"});
   });
   n.append(button);result.append(n);
  }
 }
 const scroller=document.createElement("div");scroller.className="ra-wb-table-scroller";
 const table=document.createElement("table");
 const header=document.createElement("tr");
 for(const label of ["Parameter","Koefisien","Std. error","CI 95% bawah","CI 95% atas","p (approx.)"]){const th=document.createElement("th");th.textContent=label;header.append(th)}
 table.append(header);
 const terms=fit.method==="panel_fe"?fit.coefficients:fit.coefficient_terms;
 for(const c of terms){
  const tr=document.createElement("tr");
  for(const [index,v] of [c.name,c.estimate,c.std_error_hc1,c.ci95_low,c.ci95_high,c.p_value_approx].entries()){
   const td=document.createElement("td");
   td.textContent=index===5&&v===0?"<0,000001":String(v??"—");
   tr.append(td);
  }
  table.append(tr);
 }
 scroller.append(table);result.append(scroller);
 const inferenceNote=document.createElement("small");
 inferenceNote.textContent="p (approx.) adalah estimasi statistik; nilai yang dibulatkan menjadi 0 ditulis <0,000001, bukan probabilitas nol. Interval dan p-value bergantung pada asumsi model.";
 result.append(inferenceNote);
 const analysis=document.createElement("section");analysis.className="ra-wb-analysis";
 const heading=document.createElement("strong");heading.textContent=id?"Interpretasi untuk investor":"Investor interpretation";analysis.append(heading);
 const body=document.createElement("p");
 body.textContent=fit.method==="panel_fe"?
 "Koefisien memperlihatkan hubungan perubahan variabel di dalam unit yang sama dari tahun ke tahun, setelah mengendalikan karakteristik unit yang konstan. Cluster-robust standard errors memperhitungkan korelasi dalam kelompok, tetapi tidak menjamin identifikasi kausal maupun mengoreksi seluruh guncangan waktu.":
 "Koefisien dengan standard error HC1 dan interval kepercayaan 95% mengukur asosiasi bersyarat pada prediktor yang dipilih. Periksa korelasi antarprediktor, outlier, potensi endogenitas dan perbedaan satuan sebelum menggunakannya untuk penilaian investasi.";
 analysis.append(body);
 const estimates=fit.method==="panel_fe"?fit.coefficients:fit.coefficient_terms.filter(t=>t.name!=="Intercept");
 for(const coeff of estimates){
  const lower=coeff.ci95_low,upper=coeff.ci95_high;
  const association=coeff.estimate>0?"positif":coeff.estimate<0?"negatif":"mendekati nol";
  const crossing=lower<=0&&upper>=0;
  const coefficientDetail=document.createElement("p");coefficientDetail.className="ra-wb-coefficient-interpretation";
  const unitHint=/_pct$/i.test(fit.outcome)&&/_pct$/i.test(coeff.name)?
   "Untuk kenaikan 1 poin persentase pada X, taksiran perubahan Y adalah "+coeff.estimate+" poin persentase, dengan variabel lainnya tetap. ":
   "Perubahan satu unit X berasosiasi dengan perubahan Y sebesar "+coeff.estimate+" unit, dengan variabel lainnya tetap. ";
  coefficientDetail.textContent=coeff.name+": hubungan "+association+" (β="+coeff.estimate+
   "; interval kepercayaan 95% ["+lower+", "+upper+"]). "+unitHint+
   (crossing?"Interval mencakup nol; arah hubungan masih tidak pasti dalam model ini.":"Interval tidak mencakup nol, tetapi bukan bukti kausal.")+
   " Seluruh angka merujuk pada data unggahan, bukan verifikasi SLI.";
  analysis.append(coefficientDetail);
 }
 if(fit.method==="panel_fe"&&fit.unit_count<30){
  const smallSample=document.createElement("p");smallSample.className="ra-wb-small-sample";
  smallSample.textContent="Keterbatasan inferensi: hanya "+fit.unit_count+" klaster entitas. Standard error dan interval kepercayaan cluster-robust dengan jumlah klaster kecil merupakan aproksimasi; gunakan bootstrap/robustness tambahan sebelum membuat keputusan.";
  analysis.append(smallSample);
 }
 const caveat=document.createElement("p");caveat.textContent=fit.limitations;analysis.append(caveat);result.append(analysis);
 if(fit.method==="panel_fe"&&stability)renderPanelStability(stability);
 addEconometricAppendix(fit,null,stability);
}

$("raRunMethod").addEventListener("click",()=>{
 let selected=method.value;
 if(selected==="auto"){
  const question=document.getElementById("raPrompt")?.value||"";
  const resolved=recommendExecutableMethod(question,{rows:data,model});
  if(resolved.status!=="local"){error(resolved.method==="auto"?
   "Belum ada metode executable yang cocok. Unggah dataset CSV/JSON atau isi instruksi riset.":getMethod(resolved.method)?.name+" belum memiliki estimator yang dapat dijalankan; tidak ada hasil yang dibuat-buat.");return}
  selected=resolved.method;method.value=selected;desc();
 }
 if(getMethod(selected)?.status!=="local"){error("Method available in design library only. SLI AI can discuss identification, assumptions and data requirements, but this estimator is not executed.");return}
 try{
  if(!data&&!model)throw Error("Upload a compatible CSV/JSON dataset before running a model");
  if(selected==="multivariate_ols"||selected==="panel_fe"){
   if(!data)throw Error("Multivariable econometrics requires a CSV/JSON table, not standalone AHP parameters");
   const extras=[...extra.selectedOptions].map(o=>o.value).filter(v=>v!==x.value&&v!==y.value).slice(0,4);
   const xs=[x.value,...extras];
   if(selected==="panel_fe"&&!entity.value)throw Error("Pilih identitas panel yang berulang seperti province. Kolom angka seperti electricity_access_pct bukan penanda entitas. Pastikan tiap province memiliki data beberapa tahun.");
   if(selected==="panel_fe"&&!time.value)throw Error("Panel FE needs an actual time/year column. Upload multi-year province-year data; this single-year cross section is not valid panel.");
   const output=selected==="panel_fe"?panelFixedEffects(data,xs,y.value,entity.value,time.value,yearFE.checked):multivariateOLS(data,xs,y.value);
   let robustness=null;
   if(selected==="panel_fe"){
    try{robustness=panelStability(data,xs,y.value,entity.value,time.value,yearFE.checked)}
    catch(e){robustness={error:"Robustness check unavailable: "+String(e.message||e).slice(0,150)}}
   }
   last=output;consent.checked=false;result.dataset.state="ready";
   renderEconometricResult(output,robustness);
  }else{
   const output=evaluate({method:selected,rows:data,x:x.value,y:y.value,model});
   last=output;consent.checked=false;result.dataset.state="ready";
   renderCalculation(output);
   if(selected==="ols"&&data?.length>=16){
    try{
     const enhanced=multivariateOLS(data,[x.value],y.value);
     last=enhanced;
     const sensitivity=y.value==="real_grdp_growth_2025_pct"?sensitivityOLS(data,x.value,y.value):null;
     addEconometricAppendix(enhanced,sensitivity);
    }catch(e){const note=document.createElement("small");note.textContent="Additional inference diagnostics unavailable: "+e.message;result.append(note)}
   }
  }
 }catch(e){error("Model could not run: "+String(e.message).slice(0,200))}
});
$("raClearData").addEventListener("click",()=>{data=null;model=null;filename="";last=null;officialBps=null;structuralLens=null;datafile.value="";consent.checked=false;structuralSection.hidden=true;structuralSection.replaceChildren();varGroup.hidden=true;advanced.hidden=true;quality.hidden=true;quality.replaceChildren();show("Dataset cleared. Nothing was stored in the browser.");desc();updateDatasetStatus()});
function language(){
 const id=document.documentElement.lang!=="en";
 const p=box.querySelector("[data-wb-i18n=intro]");
 if(p)p.textContent=id?"Pilih pendekatan analitis, unggah data sendiri, dan padukan ringkasan analitisnya dengan bukti SLI.":"Select a research methodology, upload your data, and combine its analytical summary with SLI evidence.";
}
document.querySelectorAll("[data-ra-lang]").forEach(b=>b.addEventListener("click",language));
language();desc();updateDatasetStatus();
window.SLIAnalyticalWorkbench=Object.freeze({
 getRequestAddon(){
  const m=getMethod(method.value);
  const addon={methodology:m?.id||"auto"};
  if(!consent.checked||(!last&&!data))return addon;
  const cols=data?describe(data).filter(c=>c.n>0).slice(0,8):[];
  let safeResult=last?{...last}:null;
  if(safeResult?.trajectory)safeResult.trajectory=[safeResult.trajectory[0],safeResult.trajectory.at(-1)];
  if(safeResult?.columns)safeResult.columns=safeResult.columns.slice(0,8);
  if(safeResult?.ranking)safeResult.ranking=safeResult.ranking.slice(0,6).map(r=>({rank:r.rank,name:r.name,score:r.score}));
  if(safeResult&&["multivariate_ols","panel_fe"].includes(safeResult.method)){
   const info=safeResult;
   safeResult={method:info.method,outcome:info.outcome,predictors:info.predictors,rows_used:info.rows_used,
    rows_excluded:info.rows_excluded,r_squared:info.r_squared??info.within_r_squared,
    se_type:info.se_type,residual_sd:info.residual_sd,rmse:info.rmse,
    ...(info.method==="panel_fe"?{unit_count:info.unit_count,time_count:info.time_count,two_way_fe:info.two_way_fe}:{ }),
    coefficient_terms:(info.coefficient_terms||info.coefficients||[]).slice(0,7).map(t=>({
     name:String(t.name||"").slice(0,65),estimate:t.estimate,std_error_hc1:t.std_error_hc1,ci95_low:t.ci95_low,ci95_high:t.ci95_high,p_value_approx:t.p_value_approx
    })),
    influential_count:info.residual_diagnostics?.flagged_count||0,
    limitations:"User-computed exploratory model; source and inference assumptions remain unverified"};
  }
  const summary={origin:"user_uploaded_unverified",file_name:filename,rows:data?.length||0,columns:cols.slice(0,5),computed:safeResult,scope:"User-reported statistical summary, not independently verified by SLI",consent:true};
  const encoded=JSON.stringify(summary);
  if(encoded.length>4400)throw Error("Derived data summary exceeds private AI context limit");
  addon.user_analysis=summary;
  return addon;
 },
 hasUserData(){return !!data||!!model}
});
