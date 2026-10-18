import {METHODS,getMethod,parseCsv,toRows,describe,evaluate} from "./sli-analytical-core.mjs?v=20261018-econ3";
import {multivariateOLS,panelFixedEffects,sensitivityOLS,detectPanelColumns} from "./sli-econometrics.mjs?v=20261018-econ4";
import {scatterPlot,investorMarkdown,downloadMarkdown} from "./sli-econometrics-report.mjs?v=20261018-econ3";
const $=id=>document.getElementById(id);
const box=document.createElement("section");
box.id="raAnalyticalWorkbench";box.className="sli-ra-method-workbench";
box.setAttribute("aria-label","SLI methodology and investor data workbench");
box.innerHTML=`<div class="ra-wb-header"><div><span class="ra-wb-kicker">SLI · ANALYTICAL WORKBENCH</span><h2>Research Methods & Data Lab</h2><p data-wb-i18n="intro">Pilih pendekatan analitis, lalu gabungkan dataset CSV/JSON milik Anda dengan hasil riset SLI. Perhitungan awal berjalan lokal di browser.</p></div><span class="ra-wb-marker">49 METODE</span></div>
<div class="ra-wb-grid"><label>Metodologi / Method<select id="raMethod" aria-label="Select quantitative or qualitative methodology"><option value="auto">Auto · AI chooses the suitable method</option></select></label>
<label>Dataset pengguna / Your data<input id="raDataFile" type="file" accept=".csv,.json,text/csv,application/json" aria-label="Upload CSV or JSON dataset"></label></div>
<p id="raMethodInfo" class="ra-wb-detail" role="status">Auto: SLI memilih metodologi berdasar pertanyaan dan kelayakan data; bukan mengklaim semua metode sudah dijalankan.</p>
<div class="ra-wb-grid ra-wb-variables" id="raVariables" hidden><label>Predictor / X<select id="raPredictor"></select></label><label>Outcome / Y<select id="raOutcome"></select></label></div>
<div class="ra-wb-buttons"><button type="button" id="raRunMethod">Hitung di Browser / Run Local Model</button><button type="button" id="raClearData">Hapus Data / Clear</button></div>
<div class="ra-wb-output" id="raModelResult" role="status" aria-live="polite">Belum ada dataset. CSV/JSON maksimum 1 MB dan 3.000 observasi; XLSX bisa diekspor dahulu sebagai CSV.</div>
<label class="ra-wb-consent"><input type="checkbox" id="raDataConsent"> <span>Saya setuju <strong>ringkasan dan hasil hitung</strong> dataset dikirim ke layanan AI privat ketika saya menekan “Riset dengan AI”. Data mentah tetap lokal. Jangan unggah rahasia dagang atau data pribadi.</span></label>
<p class="ra-wb-footnote">Data yang diunggah bukan sumber SLI terverifikasi. Model statistik lokal bersifat eksploratif; p-value, hubungan sebab-akibat, multiplier ekonomi dan hasil peramalan memerlukan desain riset serta validasi khusus.</p>`;
const anchor=$("raOwnerPanel");anchor?.parentNode?.insertBefore(box,anchor);
const method=$("raMethod"),datafile=$("raDataFile"),x=$("raPredictor"),y=$("raOutcome"),detail=$("raMethodInfo"),result=$("raModelResult"),varGroup=$("raVariables"),consent=$("raDataConsent");
let data=null,model=null,filename="",last=null;
const advanced=document.createElement("section");
advanced.className="ra-wb-advanced";advanced.id="raAdvancedControls";advanced.hidden=true;
advanced.innerHTML='<div id="raExtraGroup"><label for="raExtraPredictors">Additional predictors (Ctrl / Cmd + click for multiple)</label><select multiple size="4" id="raExtraPredictors" aria-label="Additional regression explanatory variables"></select><small>Max 5 independent variables in total. Leave blank for one-predictor robust OLS.</small></div><div id="raPanelGroup" hidden><label>Panel province / entity<select id="raPanelEntity"></select></label><label>Time / year column<select id="raPanelTime"></select></label><label class="ra-wb-panel-check"><input type="checkbox" id="raYearFE"> Include common year fixed effects</label><small>Panel needs ≥8 entities and ≥3 years per dataset, with repeated entity-year observations. A 38-province, single-year snapshot is NOT valid panel data.</small></div>';
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
 detail.textContent=m?`${m.name} — ${STATUS[m.status]}. Input: ${m.requires}.`:
 "Auto method selection: AI can propose a method but must check data suitability, assumptions and estimator availability. No model output is fabricated.";
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
 if(data&&method.value==="panel_fe"){
  if(!entity.value)detail.textContent+=" · Panel tidak siap: dataset tidak memiliki sedikitnya 8 identitas wilayah/perusahaan yang berulang di sejumlah tahun. Gunakan kolom province/entity dengan nilai kategori berulang.";
  if(!time.value)detail.textContent+=" · Panel tidak siap: kolom tahun (YYYY) tidak ditemukan.";
  if(entity.value&&time.value)detail.textContent+=" · Unit panel terdeteksi: "+entity.value+"; waktu: "+time.value+". Jangan gunakan indikator listrik/pertumbuhan sebagai identitas unit.";
 }
 for(const option of extra.options){
  const shouldDisable=[x.value,y.value,entity.value,time.value].includes(option.value)||/^(year|tahun|time|period|periode)$/i.test(option.value);
  option.disabled=shouldDisable;
  if(shouldDisable)option.selected=false;
 }


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
 for(const key of numeric){const opt=document.createElement("option");opt.value=key;opt.textContent=key;extra.append(opt)}
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
datafile.addEventListener("change",async()=>{
 data=null;model=null;last=null;filename="";consent.checked=false;
 const file=datafile.files?.[0];if(!file){show("No dataset loaded");return}
 if(file.size>1048576){error("File exceeds 1 MB client-side limit");return}
 try{
  const text=await file.text(),type=file.name.toLowerCase();filename=file.name.replace(/[^a-zA-Z0-9._ -]/g,"").slice(0,90);
  if(type.endsWith(".csv"))data=parseCsv(text);
  else if(type.endsWith(".json")){
   const raw=JSON.parse(text);
   if(Array.isArray(raw))data=toRows(raw);
   else if(raw&&typeof raw==="object"&&Array.isArray(raw.rows))data=toRows(raw.rows);
   else if(raw&&typeof raw==="object"&&(Array.isArray(raw.pairwise)||Object.hasOwn(raw,"initial_stock")))model=raw;
   else throw Error("JSON must contain rows, AHP pairwise criteria or stock-flow parameters");
  }else throw Error("Only CSV and JSON are accepted. Export Excel (.xlsx) as CSV first.");
  if(data){fillVariables();show(`Local dataset ready: ${data.length} rows × ${Object.keys(data[0]).length} columns. Choose a method and run calculations; data stays in browser unless you opt in.`)}
  else{desc();show("Structured model loaded locally. Select AHP or Stock-flow and run calculations.")}
 }catch(e){data=null;model=null;error("Cannot read dataset: "+String(e.message).slice(0,200))}
});
method.addEventListener("change",()=>{last=null;consent.checked=false;desc();});
for(const select of [x,y,entity,time])select.addEventListener("change",()=>{last=null;consent.checked=false;desc()});
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

function addEconometricAppendix(fit,sensitivity=null){
 const appendHeading=(label)=>{const h=document.createElement("h3");h.className="ra-wb-subhead";h.textContent=label;result.append(h)};
 const text=(tag,val)=>{const el=document.createElement(tag);el.textContent=val;result.append(el);return el};
 const visual=scatterPlot(fit,sensitivity?.reduced||null);
 if(visual){
  appendHeading(fit.predictors.length===1?"Scatter plot · 38 provinsi / observed vs fitted":"Model diagnostic · observed vs predicted");
  const wrap=document.createElement("div");wrap.className="ra-wb-plot";wrap.append(visual);result.append(wrap);
  text("small",fit.predictors.length===1?"Biru: OLS semua observasi · jingga putus-putus: sensitivitas tanpa pertumbuhan ekstrem · merah: observasi berpengaruh (Cook D atau residual). Hover titik untuk identitas provinsi.":"Biru: data / identitas OLS · merah: observasi berpengaruh. Arah sumbu memperlihatkan observasi vs nilai prediksi.");
 }
 const d=fit.residual_diagnostics;
 const flagged=(d?.flagged||[]).map(o=>fit.observations?.[o.index-1]?.name||("Baris "+o.index));
 text("p","Observasi berpengaruh ("+(flagged.length||0)+"): "+(flagged.join(", ")||"tidak ada pada ambang diagnosis sederhana")+". Penanda ini membutuhkan pemeriksaan data, bukan penghapusan otomatis.");
 if(sensitivity?.reduced)text("p","Perbandingan ilustratif: R² keseluruhan "+fit.r_squared+" (n="+fit.n+"), sensitivitas "+sensitivity.reduced.r_squared+" (n="+sensitivity.reduced.n+"). Tidak membuktikan sebab-akibat.");
 const controls=document.createElement("div");controls.className="ra-wb-next";
 const button=document.createElement("button");button.type="button";button.textContent="Unduh Investor Analytical Report (.md)";
 button.addEventListener("click",()=>downloadMarkdown(investorMarkdown(fit,filename,sensitivity)));
 controls.append(button);
 const notice=document.createElement("small");notice.textContent="Report berisi hasil nyata, batasan identifikasi, pemeriksaan data, temuan dan rekomendasi due diligence. Tidak menyertakan data mentah.";
 controls.append(notice);result.append(controls);
}
function renderEconometricResult(fit){
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
 const caveat=document.createElement("p");caveat.textContent=fit.limitations;analysis.append(caveat);result.append(analysis);
 addEconometricAppendix(fit);
}

$("raRunMethod").addEventListener("click",()=>{
 const selected=method.value;
 if(selected==="auto"){error("Choose a specific executable method to calculate locally; Auto helps formulate the AI research plan.");return}
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
   last=output;consent.checked=false;result.dataset.state="ready";
   renderEconometricResult(output);
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
$("raClearData").addEventListener("click",()=>{data=null;model=null;filename="";last=null;datafile.value="";consent.checked=false;varGroup.hidden=true;advanced.hidden=true;show("Dataset cleared. Nothing was stored in the browser.");desc()});
function language(){
 const id=document.documentElement.lang!=="en";
 const p=box.querySelector("[data-wb-i18n=intro]");
 if(p)p.textContent=id?"Pilih pendekatan analitis, unggah data sendiri, dan padukan ringkasan analitisnya dengan bukti SLI.":"Select a research methodology, upload your data, and combine its analytical summary with SLI evidence.";
}
document.querySelectorAll("[data-ra-lang]").forEach(b=>b.addEventListener("click",language));
language();desc();
window.SLIAnalyticalWorkbench=Object.freeze({
 getRequestAddon(){
  const m=getMethod(method.value);
  const addon={methodology:m?.id||"auto"};
  if(!consent.checked||(!last&&!data))return addon;
  const cols=data?describe(data).filter(c=>c.n>0).slice(0,8):[];
  let safeResult=last?{...last}:null;
  if(safeResult?.trajectory)safeResult.trajectory=[safeResult.trajectory[0],safeResult.trajectory.at(-1)];
  if(safeResult?.columns)safeResult.columns=safeResult.columns.slice(0,8);
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
