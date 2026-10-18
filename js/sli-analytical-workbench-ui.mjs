import {METHODS,getMethod,parseCsv,toRows,describe,evaluate} from "./sli-analytical-core.mjs";
const $=id=>document.getElementById(id);
const box=document.createElement("section");
box.id="raAnalyticalWorkbench";box.className="sli-ra-method-workbench";
box.setAttribute("aria-label","SLI methodology and investor data workbench");
box.innerHTML=`<div class="ra-wb-header"><div><span class="ra-wb-kicker">SLI · ANALYTICAL WORKBENCH</span><h2>Research Methods & Data Lab</h2><p data-wb-i18n="intro">Pilih pendekatan analitis, lalu gabungkan dataset CSV/JSON milik Anda dengan hasil riset SLI. Perhitungan awal berjalan lokal di browser.</p></div><span class="ra-wb-marker">47 METODE</span></div>
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
 if(numeric.length>1)y.value=numeric[1];desc();
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
$("raRunMethod").addEventListener("click",()=>{
 const selected=method.value;
 if(selected==="auto"){error("Choose a specific executable method to calculate locally; Auto helps formulate the AI research plan.");return}
 if(getMethod(selected)?.status!=="local"){error("Method available in design library only. SLI AI can discuss identification, assumptions and data requirements, but this estimator is not executed.");return}
 try{
  if(!data&&!model)throw Error("Upload a compatible CSV/JSON dataset before running a model");
  const output=evaluate({method:selected,rows:data,x:x.value,y:y.value,model});
  last=output;consent.checked=false;result.dataset.state="ready";
  const out=JSON.stringify(output,null,2);
  result.textContent=(out.length>5400?out.slice(0,5400)+"\n… (display truncated; full result remains in memory)":out);
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
