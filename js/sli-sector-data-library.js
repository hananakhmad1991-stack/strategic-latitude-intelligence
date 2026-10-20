/* SLI historical/source-linked evidence library.
 * Reads existing public SLI data JSON and the recovered IEA 2026 CC BY 4.0 model.
 * NEVER turns missing observations into zero, Polda into provinces, scenarios into observations,
 * or official-source directories into live environmental readings.
 */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const num=(x,d=2)=>x===null||x===undefined||x===""||!Number.isFinite(Number(x))
 ?"—":Number(x).toLocaleString("id-ID",{maximumFractionDigits:d});
const plain=(x)=>String(x??"");
const table=(id,headers,rows,{empty="Tidak ada data yang terverifikasi di sumber terpilih."}={})=>{
 const host=$(id);if(!host)return;
 host.replaceChildren();
 if(!rows.length){const p=document.createElement("p");p.className="empty";p.textContent=empty;host.append(p);return}
 const t=document.createElement("table"),head=document.createElement("thead"),hr=document.createElement("tr");
 for(const label of headers){const th=document.createElement("th");th.scope="col";th.textContent=plain(label);hr.append(th)}
 head.append(hr);t.append(head);
 const body=document.createElement("tbody");
 for(const row of rows){
  const tr=document.createElement("tr");
  for(const [i,value] of row.entries()){
   const node=document.createElement(i===0?"th":"td");if(i===0)node.scope="row";
   node.textContent=value===null||value===undefined?"—":plain(value);tr.append(node);
  }
  body.append(tr);
 }
 t.append(body);host.append(t);
};
const metrics=(id,items)=>{
 const root=$(id);if(!root)return;root.replaceChildren();
 for(const [label,value,detail] of items){
  const card=document.createElement("div");card.className="metric";
  const title=document.createElement("small");title.textContent=label;
  const n=document.createElement("strong");n.textContent=value;
  const foot=document.createElement("span");foot.textContent=detail;
  card.append(title,n,foot);root.append(card);
 }
};
const allowedUrl=u=>{try{const url=new URL(u);return url.protocol==="https:"&&!url.username&&!url.password&&url.hostname.includes(".")?url.href:null}catch{return null}};
const links=(id,sources)=>{
 const host=$(id);host.replaceChildren();
 for(const s of sources){
  const url=allowedUrl(s.url);if(!url)continue;
  const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";
  a.textContent=(s.agency||s.publisher||"Sumber resmi")+" · "+(s.topic||s.title||"Portal")+" ↗";
  host.append(a);
 }
};
const at=(arr,index)=>Array.isArray(arr)?arr[index]:null;
function security(d){
 if(!d||!d.national)return;
 const n=d.national;
 metrics("securityKpis",[
  ["Kejahatan tercatat 2024",num(at(n.police_cases,1),0),"Peristiwa pada register Polri · bukan korban survei"],
  ["Risiko tercatat 2024",num(at(n.police_rate_100k,1),0),"Kasus per 100.000 penduduk · Polri"],
  ["Korban kejahatan 2024",num(at(n.victim_prevalence_pct,1))+"%","Persentase penduduk · Susenas"],
  ["Korban melapor 2024",num(at(n.victim_reporting_pct,1))+"%","Dari korban survei · Susenas"],
  ["Desa dengan konflik massal 2024",num(at(n.villages_with_mass_conflict,1),0),"Jumlah desa/kelurahan · Podes"],
  ["Merasa khawatir malam 2024",num(n.night_worried_pct_2024)+"%","Survei keamanan lingkungan"]
 ]);
 const render=()=>{
  if($("securityView").value==="polda"){
   table("securityTable",["Yurisdiksi Polda","Kasus 2023","Kasus 2024","per 100 ribu 2023","per 100 ribu 2024"],
    (d.police_districts||[]).map(x=>[x.jurisdiction,num(at(x.recorded_cases,0),0),num(at(x.recorded_cases,1),0),
     num(at(x.recorded_rate_100k,0),0),num(at(x.recorded_rate_100k,1),0)]));
  }else{
   table("securityTable",["Provinsi","Korban 2023 (%)","Korban 2024 (%)","Melapor 2024 (%)","Desa konflik 2024","Khawatir malam 2024 (%)"],
   (d.provinces||[]).map(x=>[x.name,num(at(x.victim_prevalence_pct,0)),num(at(x.victim_prevalence_pct,1)),
    num(at(x.victim_reported_to_police_pct,1)),num(at(x.village_mass_conflict_count,1),0),num(x.worried_night_pct)]));
  }
 };
 $("securityView").addEventListener("change",render);render();
}
function governance(d){
 if(!d)return;
 const idi=d.idi||[];
 metrics("idiSeries",idi.map(x=>["IDI nasional "+x.year,num(x.national),"Indeks Demokrasi Indonesia · tahun observasi "+x.year]));
 const last=(d.press_years||[]).length-1;
 table("governanceTable",["Provinsi","IKP "+(d.press_years?.[Math.max(0,last-1)]||2023),
 "IKP "+(d.press_years?.[last]||2024),"DPT Pemilihan 2024"],
 (d.provinces||[]).map(x=>[x.name,num(at(x.press_freedom,Math.max(0,last-1))),
  num(at(x.press_freedom,last)),num(at(x.dpt_2024,2),0)]));
}
function socioeconomic(d,g,macro){
 if(!d||!g)return;
 const gini=new Map((g.provinces||[]).map(x=>[normal(x.name),x.combined]));
 const grdpIndex=(d.grdp_years||[]).indexOf(2025);
 const gp=macro?.metrics||[],poverty=gp.find(x=>x.id==="poverty_rate"),jobs=gp.find(x=>x.id==="unemployment_rate");
 metrics("socioKpis",[
  ["Rasio Gini nasional",num(g.national?.combined,3),"Maret 2026 · ketimpangan pengeluaran"],
  ["Tingkat kemiskinan",poverty?.value===null?"—":num(poverty?.value)+"%",poverty?.period||"Belum tersedia"],
  ["Pengangguran terbuka",jobs?.value===null?"—":num(jobs?.value)+"%",jobs?.period||"Belum tersedia"],
  ["Cakupan PDRB",num(d.provinces?.length,0)+" provinsi","2021–2025 · 2025 sementara"]
 ]);
 const render=()=>{
  const query=$("socioQuery").value.trim().toLowerCase();
  const rows=(d.provinces||[]).filter(x=>x.name.toLowerCase().includes(query)).map(x=>[
   x.name,num(at(x.grdp_current,grdpIndex)),num(at(x.grdp_constant,grdpIndex)),
   num(at(x.pmtb_current,grdpIndex)),num(gini.get(normal(x.name)),3)
  ]);
  table("socioTable",["Provinsi","PDRB ADHB 2025 (Rp miliar)","PDRB ADHK 2025 (Rp miliar)",
   "PMTB ADHB 2025 (Rp miliar)","Gini Maret 2026"],rows,{empty:"Provinsi tidak ditemukan. Periksa ejaan."});
 };
 $("socioQuery").addEventListener("input",render);render();
}
function normal(s){return String(s||"").toLowerCase().replace(/sumatera/g,"sumatra").replace(/[^a-z0-9]/g,"")}
const groups={total_demand:"Total demand per komoditas dan teknologi",tech_mineral:"Mineral menurut semua teknologi",
 tech_sector:"Permintaan sektoral",solar_pv:"Solar PV",wind:"Wind",ev:"Electric vehicles",
 battery_storage:"Battery storage",electricity_networks:"Electricity networks",hydrogen:"Hydrogen"};
function iea(data){
 if(data?.edition!=="IEA Critical Minerals Dataset, July 2026")throw Error("Unexpected IEA source edition");
 const group=$("ieaGroup"),mineral=$("ieaMineral"),supply=$("ieaSupplyMineral");
 const cols=data.columns?.demand||[],supplyCols=data.columns?.supply||[];
 const setOpts=(select,arr)=>{select.replaceChildren();for(const [key,label] of arr){
  const o=document.createElement("option");o.value=key;o.textContent=label;select.append(o)}};
 setOpts(group,Object.entries(groups).filter(([k])=>Array.isArray(data.demand[k])));
 const updateMineral=()=>{
  const rows=data.demand[group.value]||[];
  const keys=[...new Set(rows.flatMap(x=>[x.h,x.n].filter(Boolean)))].sort((a,b)=>a.localeCompare(b));
  setOpts(mineral,[["","Semua mineral dan teknologi"],...keys.map(x=>[x,x])]);
  renderDemand();
 };
 const renderDemand=()=>{
  const rows=(data.demand[group.value]||[]).filter(x=>!mineral.value||x.h===mineral.value||x.n===mineral.value);
  table("ieaDemand",["Mineral/kelompok","Teknologi/bahan","Unit",...cols],rows.slice(0,80)
   .map(x=>[x.h||"—",x.n||"—",x.u||"kt",...(x.v||[]).slice(0,cols.length).map(v=>num(v,5))]));
 };
 const minerals=[...new Set((data.supply||[]).map(x=>x.m))].sort((a,b)=>a.localeCompare(b));
 setOpts(supply,minerals.map(x=>[x,x]));if(minerals.includes("Nickel"))supply.value="Nickel";
 const renderSupply=()=>{
  table("ieaSupply",["Mineral","Proses","Negara/wilayah","Unit",...supplyCols],
   (data.supply||[]).filter(x=>x.m===supply.value).map(x=>[x.m,x.p==="mining"?"Pertambangan":"Pemurnian",
   x.n,x.u||"kt",...(x.v||[]).slice(0,supplyCols.length).map(v=>num(v,4))]));
 };
 group.addEventListener("change",updateMineral);mineral.addEventListener("change",renderDemand);
 supply.addEventListener("change",renderSupply);updateMineral();renderSupply();
 $("ieaSummary").textContent="IEA · "+Object.keys(data.demand||{}).length+
  " kelompok permintaan, "+(data.supply||[]).length+
  " baris pasokan negara dan "+cols.length+" kolom skenario. "+
  "Model 2025–2050, bukan statistik produksi real-time Indonesia. Periksa tipe skenario dan satuan.";
}
function environment(d){
 if(!d)return;
 const indicators=d.indicators||[],quantified=indicators.filter(x=>Number.isFinite(x.observed_value)).length;
 metrics("environmentStatus",[
  ["Indikator registri",String(indicators.length),"Sumber tercatat, tidak semua punya angka"],
  ["Angka terisi",String(quantified),"Observasi numerik dalam registri lingkungan"],
  ["Masih menunggu",String(indicators.length-quantified),"Perlu ingesti / validasi / integrasi GIS"]
 ]);
 table("environmentTable",["ID","Indikator","Wilayah/unit","Lembaga","Status ingesti","Angka teramati"],
  indicators.map(x=>[x.id,x.name,x.scope,x.agency,
   String(x.status||"belum ditinjau").replaceAll("_"," "),Number.isFinite(x.observed_value)?num(x.observed_value):"Belum diimpor"]));
 links("environmentLinks",(d.sources||[]).slice(0,15));
}
function power(d){
 if(!d)return;
 metrics("powerKpis",Object.entries(d.national||{}).sort((a,b)=>a[0].localeCompare(b[0])).map(([year,x])=>[
  "PLN SAIDI "+year,num(x.saidi)+" jam",num(x.saifi)+" kali/tahun · SAIFI"]
 ));
 const rows=Object.entries(d.regions||{}).sort((a,b)=>a[0].localeCompare(b[0])).flatMap(([year,r])=>[
  [year,"Jawa",num(r.java?.saidi),num(r.java?.saifi)],
  [year,"Luar Jawa",num(r.outside_java?.saidi),num(r.outside_java?.saifi)]
 ]);
 table("powerTable",["Tahun","Wilayah agregasi PLN","SAIDI (jam/pelanggan)","SAIFI (gangguan/pelanggan)"],rows);
}
function disasters(d){
 if(!d)return;
 const records=Array.isArray(d.records)?d.records:[];
 metrics("disasterSummary",[
  ["Tahun dasar","2025","BNPB Satu Data · status sumber "+(d.status||"tidak diketahui").replaceAll("_"," ")],
  ["Provinsi tervalidasi",num(records.length,0),"Baris sumber resmi sudah terekstrak dan lolos pemeriksaan"],
  ["Status observasi",records.length?"Data angka tersedia":"Menunggu ingesti","Tidak mengartikan belum diimpor sebagai nol kejadian"],
  ["Audit total BNPB",d.quality_checks?String(d.quality_checks.national_totals_match)+"/"+String(d.quality_checks.national_totals_checked):"—","Kategori yang sesuai agregat nasional"]
 ]);
 if(!records.length){
  table("disasterTable",["Provinsi","Kejadian"],[],
   {empty:"XLSX BNPB 2025 ditemukan di portal resmi; rincian angka provinsi belum berhasil diunduh/diperiksa. Data tidak diisi perkiraan."});
  return;
 }
 const metricIds=Array.isArray(d.disaster_types)?d.disaster_types:["floods","extreme_weather","wildfires","landslides","earthquakes"];
 const select=$("disasterProvince");
 const dossier=$("disasterProvinceDossier");
 for(const row of records){const option=document.createElement("option");option.value=row.province;option.textContent=row.province;select.append(option)}
 const requested=new URLSearchParams(window.location.search).get("province");
 if(requested&&records.some(r=>r.province===requested))select.value=requested;
 const draw=()=>{
  const province=select.value,subset=province?records.filter(r=>r.province===province):records;
  table("disasterTable",["Provinsi",...metricIds],subset.map(row=>[row.province||row.name,
   ...metricIds.map(k=>row[k]===null||row[k]===undefined?"—":num(row[k],0))]));
  dossier.href="./provincial-intelligence.html"+(province?"?province="+encodeURIComponent(province):"")+"#provincialDisasterEvidence";
  dossier.textContent=province?"Lihat dossier "+province+" ↗":"Buka dossier provinsi ↗";
 };
 select.addEventListener("change",draw);draw();
 const note=$("disasterIntegrityNotice");if(note){
  const anomalies=d.quality_checks?.national_aggregate_discrepancies||[];
  note.textContent=anomalies.length?"Audit total nasional BNPB: "+anomalies.map(x=>x.indicator+
   " — jumlah provinsi "+num(x.provincial_sum,0)+", baris nasional "+num(x.source_national,0)+
   " (selisih "+num(x.difference,0)+").").join(" ")+
   " Kedua angka dipertahankan; SLI tidak mengubah sumber.":"Seluruh agregat provinsi sama dengan angka nasional BNPB.";
 }
}
function ruptl(solar,ex){
 if(!solar||!ex)return;
 const rows=Array.isArray(solar.rows)?solar.rows:[],ami=ex.ami?.series||[];
 const total=solar.printed_total_mw;
 metrics("ruptlKpis",[
  ["Potensi waduk",num(rows.length,0),"RUPTL · tabel 2.2, halaman PDF 82–83"],
  ["Potensi PLTS terapung",num(total,1)+" MW","Potensi teknis, bukan pembangkit beroperasi"],
  ["Target AMI",num(ami.length,0)+" tahun","Tabel 2.4 · RUPTL 2022–2045"],
  ["Cakupan sumber",String(ex.source?.pages_in_upload??100)+" halaman","Rincian annex proyek tidak tersedia"]
 ]);
 const provinces=[...new Set(rows.map(x=>x.province).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 const sel=$("ruptlProvince");
 for(const name of provinces){const op=document.createElement("option");op.value=name;op.textContent=name;sel.append(op)}
 const display=()=>{
  table("ruptlReservoirs",["Waduk","Provinsi","Status bendungan","Luas (ha)","Potensi PLTS (MW)","Halaman PDF"],
    rows.filter(x=>!sel.value||x.province===sel.value).map(x=>[x.reservoir,x.province,x.dam_status,
    num(x.area_ha,2),num(x.potential_mw,2),num(x.pdf_page,0)]));
 };
 sel.addEventListener("change",display);display();
 table("ruptlAmi",["Tahun target","Target baru (meter)","Target kumulatif (meter)","Halaman PDF","Status sumber"],
  ami.map(x=>[x.year,num(x.annual_installation_target,0),num(x.cumulative_installation_target,0),
   num(x.source_pdf_page||98,0),(x.quality||"rencana yang diterbitkan").replaceAll("_"," ")]));
}
function aiReports(d){
 if(!d)return;
 const arr=d.indicators||[];
 metrics("aiReportKpis",[
  ["Angka yang ditelusuri",num(arr.length,0),"Halaman PDF teridentifikasi dan disimpan"],
  ["Stanford 2026",num(arr.filter(x=>x.source==="stanford").length,0),"Angka global dan pembanding negara"],
  ["World Bank 2025",num(arr.filter(x=>x.source==="worldbank").length,0),"Angka kelompok pendapatan dunia"],
  ["Katalog kandidat grafik","405","Belum semuanya memiliki seri data numerik terverifikasi"]
 ]);
 const filter=$("aiReportSource"),category=$("aiReportCategory");
 for(const k of [...new Set(arr.map(x=>x.category))].sort()){
  const opt=document.createElement("option");opt.value=k;opt.textContent=k;category.append(opt);
 }
 const render=()=>{
  table("aiReportTable",["Topik","Indikator","Nilai","Periode","Geografi/cakupan","Basis/jenis","PDF"],
   arr.filter(x=>(!filter.value||filter.value===x.source)&&(!category.value||category.value===x.category)).map(x=>[
    x.category,x.label_id,(x.comparator||"")+num(x.value,2)+" "+x.unit,x.period||x.year,
    x.geography,x.methodology,(x.source==="stanford"?"Stanford":"World Bank")+" · hal. "+x.pdf_page
   ]));
 };
 filter.addEventListener("change",render);category.addEventListener("change",render);render();
}
function inventory(d){
 if(!d||!Array.isArray(d.datasets))return;
 const ready=d.datasets.filter(x=>x.status.startsWith("numeric_in_repository")||
  x.status==="full_user_normalized_upload_restored_to_repository").length;
 metrics("inventoryStatus",[
  ["Kelompok sumber",num(d.datasets.length,0),"Rekonsiliasi dokumen/dataset yang diketahui"],
  ["Numerik tersedia",num(ready,0),"Ada JSON sumber; tetap perlu audit"],
  ["Parsial / tertunda",num(d.datasets.length-ready,0),"Belum boleh diklaim terintegrasi lengkap"]
 ]);
 table("inventoryTable",["Subjek","Berkas yang pernah disediakan","Periode/scope","Status","Dashboard utama"],
  d.datasets.map(x=>[x.domain,x.source_upload,x.observation_period,x.status.replaceAll("_"," "),x.main_dashboard]));
}
const manifests=[
 ["security","./data/sli-bps-public-safety.json",security],
 ["governance","./data/sli-bps-regional-intelligence.json",governance],
 ["gini","./data/sli-bps-gini-2026.json",null],
 ["macro","./data/sli-macro-indonesia-2026.json",null],
 ["iea","./data/iea-critical-minerals-2026-full-scenarios.json",iea],
 ["environment","./data/sli-climate-environment.json",environment],
 ["power","./data/pln-saidi-saifi-2023-2025.json",power],
 ["bnpb","./data/sli-bnpb-provincial-2025.json",null],
 ["ruptlSolar","./data/ruplt-2025-2034-floating-solar-potential.json",null],
 ["ruptlSource","./data/pln-ruptl-uploaded-excerpt-2025-2034.json",null],
 ["aiReports","./data/sli-ai-stanford-worldbank-foundations-2025-2026.json",null],
 ["inventory","./data/sli-user-dataset-recovery-inventory.json",inventory]
];
Promise.all(manifests.map(async([id,path])=>{
 try{const res=await fetch(path,{cache:"no-cache"});if(!res.ok)throw Error("HTTP "+res.status);
 return{id,data:await res.json()}}catch(e){return{id,error:String(e.message||e)}}
})).then(results=>{
 const data=Object.fromEntries(results.filter(x=>x.data).map(x=>[x.id,x.data]));
 const ready=results.filter(x=>x.data).length,failed=results.filter(x=>x.error);
 try{security(data.security)}catch(e){failed.push({id:"security",error:e.message})}
 try{governance(data.governance)}catch(e){failed.push({id:"governance",error:e.message})}
 try{socioeconomic(data.governance,data.gini,data.macro)}catch(e){failed.push({id:"socio",error:e.message})}
 try{iea(data.iea)}catch(e){failed.push({id:"iea",error:e.message})}
 try{environment(data.environment)}catch(e){failed.push({id:"environment",error:e.message})}
 try{power(data.power)}catch(e){failed.push({id:"power",error:e.message})}
 try{disasters(data.bnpb)}catch(e){failed.push({id:"bnpb",error:e.message})}
 try{ruptl(data.ruptlSolar,data.ruptlSource)}catch(e){failed.push({id:"ruptl",error:e.message})}
 try{aiReports(data.aiReports)}catch(e){failed.push({id:"aiReports",error:e.message})}
 try{inventory(data.inventory)}catch(e){failed.push({id:"inventory",error:e.message})}
 const status=$("libStatus");status.textContent=ready+"/"+manifests.length+
 " dataset publik berhasil dimuat. "+(failed.length?
  "Belum tersedia: "+[...new Set(failed.map(x=>x.id))].join(", ")+". Cek jaringan atau sumber.":"Nilai ditampilkan berdasarkan periode masing-masing, tidak disatukan menjadi skor risiko.");
 status.dataset.status=failed.length?"partial":"ready";
}).catch(e=>{$("libStatus").textContent="Gagal memuat indeks. "+plain(e.message);$("libStatus").dataset.status="error"});

/* Deep links are now sector-owned detail views. The bare URL stays archival. */
const topicalParents={
 security:["Kebijakan & Tata Kelola","./index.html#policy"],
 governance:["Kebijakan & Tata Kelola","./index.html#policy"],
 socio:["Makroekonomi & Provinsi","./indonesia-macroeconomic-intelligence.html"],
 minerals:["Mineral Kritis","./index.html#minerals"],
 environment:["Geopolitik & Risiko Lingkungan","./index.html#geopolitics"],
 disasters:["Geopolitik & Risiko Lingkungan","./index.html#geopolitics"],
 power:["Energi & Ketenagalistrikan","./index.html#energy"],
 ruptl:["Energi & Ketenagalistrikan","./index.html#energy"],
 "ai-reports":["AI & Teknologi","./ai-intelligence-hub.html"]
};
function applyTopicView(){
 const slug=decodeURIComponent(location.hash.slice(1));
 const parent=topicalParents[slug],section=document.getElementById(slug);
 const active=Boolean(parent&&section?.classList.contains("section"));
 document.body.classList.toggle("sli-library-topic-mode",active);
 let bar=document.getElementById("sliLibraryTopicParent");
 if(active){
  if(!bar){
   bar=document.createElement("nav");bar.id="sliLibraryTopicParent";bar.className="sli-library-topic-parent";bar.setAttribute("aria-label","Topik terkait");
   document.querySelector("#libraryMain .status")?.before(bar);
  }
  bar.replaceChildren();
  const back=document.createElement("a");back.href=parent[1];back.textContent="← Kembali ke "+parent[0];
  const archive=document.createElement("a");archive.href="./sli-sector-data-library.html";archive.textContent="Semua sumber (arsip) ↗";
  bar.append(back,archive);bar.hidden=false;
  document.title=section.querySelector("h2")?.textContent?.trim()+" · SLI Data & Sources";
 }else{
  if(bar)bar.hidden=true;
  document.title="Perpustakaan Data SLI | Kriminalitas, Demokrasi, Sosial Ekonomi, IEA, Lingkungan";
 }
}
window.addEventListener("hashchange",applyTopicView);
applyTopicView();
})();