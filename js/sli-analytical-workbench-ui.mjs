import {METHODS,getMethod,parseCsv,toRows,describe,evaluate} from "./sli-analytical-core.mjs";
const $=id=>document.getElementById(id);
const box=document.createElement("section");
box.id="raAnalyticalWorkbench";box.className="sli-ra-method-workbench";
box.setAttribute("aria-label","SLI methodology and investor data workbench");
box.innerHTML=`<div class="ra-wb-header"><div><span class="ra-wb-kicker">SLI · ANALYTICAL WORKBENCH</span><h2>Research Methods & Data Lab</h2><p data-wb-i18n="intro">Pilih pendekatan analitis, lalu gabungkan dataset CSV/JSON milik Anda dengan hasil riset SLI. Perhitungan awal berjalan lokal di browser.</p></div><span class="ra-wb-marker">48 METODE</span></div>
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
 varGroup.hidden=!(data&&["pearson","ols"].includes(method.value)&&numeric.length>=2);
}
function error(message){result.textContent=message;result.dataset.state="error";last=null}
function show(message){result.textContent=message;result.dataset.state="ready"}
function fillVariables(){
 const numeric=data?describe(data).filter(v=>v.n>=3).map(v=>v.column):[];
 for(const select of [x,y]){select.replaceChildren();for(const name of numeric){const opt=document.createElement("option");opt.value=name;opt.textContent=name;select.append(opt)}}
 if(numeric.includes("pmtb_share_2025_pct")&&numeric.includes("real_grdp_growth_2025_pct")){x.value="pmtb_share_2025_pct";y.value="real_grdp_growth_2025_pct";}
 else if(numeric.length>1)y.value=numeric[1];
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
$("raRunMethod").addEventListener("click",()=>{
 const selected=method.value;
 if(selected==="auto"){error("Choose a specific executable method to calculate locally; Auto helps formulate the AI research plan.");return}
 if(getMethod(selected)?.status!=="local"){error("Method available in design library only. SLI AI can discuss identification, assumptions and data requirements, but this estimator is not executed.");return}
 try{
  if(!data&&!model)throw Error("Upload a compatible CSV/JSON dataset before running a model");
  const output=evaluate({method:selected,rows:data,x:x.value,y:y.value,model});
  last=output;consent.checked=false;result.dataset.state="ready";
  renderCalculation(output);
 }catch(e){error("Model could not run: "+String(e.message).slice(0,200))}
});
$("raClearData").addEventListener("click",()=>{data=null;model=null;filename="";last=null;datafile.value="";consent.checked=false;varGroup.hidden=true;show("Dataset cleared. Nothing was stored in the browser.");desc()});
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
  const safeResult=last?{...last}:null;
  if(safeResult?.trajectory)safeResult.trajectory=[safeResult.trajectory[0],safeResult.trajectory.at(-1)];
  if(safeResult?.columns)safeResult.columns=safeResult.columns.slice(0,8);
  const summary={origin:"user_uploaded_unverified",file_name:filename,rows:data?.length||0,columns:cols,computed:safeResult,scope:"User-provided observational sample, never independently verified by SLI",consent:true};
  const encoded=JSON.stringify(summary);
  if(encoded.length>4400)throw Error("Derived data summary exceeds private AI context limit");
  addon.user_analysis=summary;
  return addon;
 },
 hasUserData(){return !!data||!!model}
});
