/* SLI Catalyst Intelligence v2 · shared Git-versioned history + device-local preferences.
 * Explicit opt-in notification support only while the page remains open.
 */
(()=>{"use strict";
const ROOT="sliCatalystHistory",FEED="./data/sli-catalyst-history.json";
const PREF="sli-catalyst-v2-preferences",SEEN="sli-catalyst-v2-seen",WATCH="sli-terminal-watchlist-v1";
const $=name=>document.getElementById(name);
const E=(tag,cls,text)=>{const v=document.createElement(tag);if(cls)v.className=cls;if(text!==undefined)v.textContent=String(text);return v};
const id=()=>document.documentElement.lang?.toLowerCase().startsWith("id");
const T=(en,bahasa)=>id()?bahasa:en;
const norm=x=>String(x||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const safeURL=x=>{try{const u=new URL(x);return u.protocol==="https:"&&!u.username&&!u.password?u.href:null}catch{return null}};
const json=(k)=>{try{return JSON.parse(localStorage.getItem(k)||"null")}catch{return null}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const watch=()=>{const x=json(WATCH);return new Set(Array.isArray(x)?x.filter(k=>/^[A-Z0-9]{4}$/.test(k)).slice(0,30):[])};
const prefsDefault={scope:"context",type:"all",level:"direct",text:"",inApp:true,desktop:false};
const validOpts={
 scope:new Set(["context","watch","all"]),type:new Set(["all","news","project","regulation"]),
 level:new Set(["direct","sector"])
};
function prefsRead(){
 const p=json(PREF)||{};
 return {scope:validOpts.scope.has(p.scope)?p.scope:"context",type:validOpts.type.has(p.type)?p.type:"all",
  level:validOpts.level.has(p.level)?p.level:"direct",text:typeof p.text==="string"?p.text.slice(0,120):"",
  inApp:p.inApp!==false,desktop:p.desktop===true};
}
const seenRead=()=>{const x=json(SEEN);return {initialized:!!x?.initialized,known:Array.isArray(x?.known)?x.known.slice(-1800):[],
 read:Array.isArray(x?.read)?x.read.slice(-1800):[]}};
const safeStamp=x=>{const time=Date.parse(x||"");return Number.isFinite(time)?
 new Intl.DateTimeFormat(id()?"id-ID":"en-GB",{year:"numeric",month:"short",day:"numeric",timeZone:"Asia/Jakarta"}).format(new Date(time)):"—"};
const sectorAlias={energy:["oilgas","electricity"],minerals:["minerba"],coal:["energy","minerba"],
 technology:["ai","digital"],food:["agriculture"],transport:["trade"],manufacturing:["industry"]};
const sectorMatch=(signal,sector)=>signal==="cross"||signal===sector||(sectorAlias[sector]||[]).includes(signal);
function pickContext(){
 const root=$(ROOT);
 if(root?.dataset.mode==="issuer"){
  const t=new URLSearchParams(location.search).get("ticker")||"";
  return /^[A-Z0-9]{4}$/.test(t.toUpperCase())?t.toUpperCase():"";
 }
 return window.SLIDecisionTerminal?.getContext?.().issuer?.ticker||"";
}
const groupType=k=>k.startsWith("news")||k==="official_metadata_indexed"?"news":
 k.startsWith("project")?"project":"regulation";
function relevant(e,p,context,watched,issuerByTicker){
 const direct=(e.ticker_links||[]).map(x=>x.ticker);
 const related=p.scope==="all"?[]:p.scope==="context"?(context?[context]:[]):[...watched];
 if(p.scope==="watch"&&related.length===0)return {match:false,basis:"none"};
 if(p.type!=="all"&&groupType(e.kind)!==p.type)return {match:false,basis:"none"};
 if(p.text){
  const search=norm([e.title,e.summary,e.region,...(e.provinces||[]),
   e.sector,e.publisher,e.project_id,e.regulation_id,...direct].join(" "));
  if(!search.includes(norm(p.text)))return {match:false,basis:"none"};
 }
 if(p.scope==="all"||!related.length)return {match:true,basis:"general"};
 if(related.some(t=>direct.includes(t)))return {match:true,basis:"direct"};
 if(p.level==="sector"&&related.some(t=>sectorMatch(e.sector,issuerByTicker.get(t)?.sector)))
  return {match:true,basis:"sector"};
 return {match:false,basis:"none"};
}
function prompt(e,relatedTicker){
 return [
  "Teliti sinyal SLI Catalyst Intelligence v2 secara kritis.",
  "Judul: "+e.title+".",
  "Terdeteksi dalam indeks: "+e.detected_at_utc+".",
  "Tanggal publikasi/dokumen: "+(e.source_at_utc||"tidak tercatat")+".",
  "Sumber: "+e.source_url+".",
  "Jenis: "+e.kind+".",
  relatedTicker?"Konteks ticker: IDX:"+relatedTicker+".":"Konteks sektor: "+e.sector+".",
  e.previous!==null?"Nilai indeks sebelumnya: "+e.previous+". Nilai sekarang: "+e.current+".":"",
  "Bandingkan dengan sumber primer terbaru, dokumen proyek, status hukum/aturan, dan data lintas sektor SLI.",
  "Jelaskan apa yang benar-benar berubah dan kapan, siapa yang terlibat langsung, ketidakpastian, skenario dampak bersyarat, dan pertanyaan penelitian selanjutnya.",
  "Jangan menganggap perubahan indeks sebagai fakta baru di dunia nyata; jangan menyimpulkan dampak saham, kepemilikan, atau sebab akibat dari kecocokan sektor."
 ].join(" ");
}
let data=null,issuerByTicker=new Map(),p=prefsRead(),seen=seenRead(),focused="",lastLoad="",loading=false,ready=false;
function labelledType(e){
 const types={
 news_indexed:["New publisher report in index","Laporan media baru dalam indeks"],
 official_metadata_indexed:["New official metadata lead","Metadata resmi baru dalam indeks"],
 project_added_to_index:["Project added to SLI index","Proyek masuk indeks SLI"],
 project_stage_index_changed:["Project stage changed in SLI","Tahap proyek berubah di indeks SLI"],
 regulation_added_to_index:["Regulation added to SLI index","Regulasi masuk indeks SLI"],
 regulation_status_index_changed:["Legal index status changed","Status indeks regulasi berubah"]
 };
 return T(...(types[e.kind]||["Index update","Pembaruan indeks"]));
}
function strengthLabel(basis){
 return basis==="direct"?T("Explicit recorded linkage","Hubungan eksplisit tercatat"):
 basis==="sector"?T("Sector context only","Hanya konteks sektor"):
 T("General indexed record","Catatan indeks umum");
}
function listItems(){
 if(!data)return [];
 const context=pickContext(),watched=watch();
 return data.events.map(e=>({event:e,...relevant(e,p,context,watched,issuerByTicker)}))
 .filter(x=>x.match).slice(0,80);
}
const persist=()=>{save(PREF,p);render()};
function createControl(label,options,value,change){
 const wrapper=E("label","sli-hist-control");
 wrapper.append(E("span",null,label));const input=E("select");
 for(const [key,en,indo]of options){const o=E("option",null,T(en,indo));o.value=key;input.append(o)}
 input.value=value;input.addEventListener("change",()=>{change(input.value);persist()});wrapper.append(input);return wrapper;
}
function detail(e,basis){
 const box=E("article","sli-hist-detail");
 box.append(E("span","sli-hist-eyebrow",labelledType(e)),E("h3",null,e.title));
 const bar=E("div","sli-hist-metadata");
 bar.append(E("span",null,T("Detected in index: ","Terdeteksi di indeks: ")+safeStamp(e.detected_at_utc)));
 bar.append(E("span",null,T("Source / publication date: ","Tanggal publikasi/sumber: ")+safeStamp(e.source_at_utc)));
 bar.append(E("span",null,T("Publisher / origin: ","Penerbit / asal: ")+(e.publisher||"SLI index")));
 box.append(bar);
 if(e.previous!==null&&e.previous!==undefined){
  const delta=E("div","sli-hist-delta");
  delta.append(E("div",null,T("Previous index value","Nilai indeks sebelumnya")),
   E("strong",null,String(e.previous)),E("span",null,"→"),
   E("div",null,T("Current index value","Nilai indeks terbaru")),E("strong",null,String(e.current||"—")));
  box.append(delta);
 }
 box.append(E("p","sli-hist-caveat",T(
 "This is a dated change in SLI's published source index. It is not independent verification that a project or regulation changed on the detection date.",
 "Ini perubahan bertanggal dalam indeks sumber SLI. Belum membuktikan secara independen bahwa proyek atau regulasi berubah pada tanggal deteksi.")));
 if(e.summary)box.append(E("p","sli-hist-summary",e.summary));
 const ties=E("div","sli-hist-ties");
 ties.append(E("strong",null,strengthLabel(basis)));
 if(Array.isArray(e.ticker_links)&&e.ticker_links.length){
  for(const t of e.ticker_links.slice(0,12)){
   const a=E("a","",t.ticker+" · "+t.basis.replaceAll("_"," "));
   a.href="./sli-issuer.html?ticker="+encodeURIComponent(t.ticker);
   ties.append(a);
  }
 }else ties.append(E("p",null,T("No company-specific linkage has been established.",
 "Belum ada hubungan khusus perusahaan yang terbukti dalam registri.")));
 if(e.region)ties.append(E("p",null,T("Region: ","Wilayah: ")+e.region));
 if(e.provinces?.length)ties.append(E("p",null,T("Provinces: ","Provinsi: ")+e.provinces.join(", ")));
 box.append(ties);
 const buttons=E("div","sli-hist-buttons");
 const u=safeURL(e.source_url);
 if(u){const a=E("a","",T("Inspect source ↗","Periksa sumber ↗"));a.href=u;a.target="_blank";a.rel="noopener noreferrer";buttons.append(a)}
 const ask=E("a","",T("Investigate in DERGUBA AI ↗","Analisis di DERGUBA AI ↗"));
 ask.href="./sli-research-ai.html?prompt="+encodeURIComponent(prompt(e,pickContext()).slice(0,1700));buttons.append(ask);
 const mark=E("button","",T("Mark as read","Tandai dibaca"));mark.type="button";
 mark.addEventListener("click",()=>{if(!seen.read.includes(e.id)){seen.read=[...seen.read,e.id].slice(-1800);save(SEEN,seen)}render()});
 buttons.append(mark);box.append(buttons);
 box.append(E("small","sli-hist-fine",T(
 "No automated price-impact claim or investment recommendation. Verification status remains a research candidate.",
 "Bukan kesimpulan dampak harga atau rekomendasi investasi. Status evidensi masih kandidat untuk diteliti.")));
 return box;
}
function render(){
 const root=$(ROOT);if(!root)return;root.replaceChildren();
 const head=E("div","sli-hist-head");
 const titles=E("div");
 titles.append(E("span","sli-hist-eyebrow","SLI · CATALYST INTELLIGENCE v2"),
  E("h2",null,T("Shared strategic change history","Histori bersama perubahan strategis")),
  E("p","sli-hist-muted",T(
   "Server-published evidence deltas, searchable across issuers, projects and regions. Personal filters stay on this device.",
   "Perubahan bukti dipublikasikan server, dapat ditelusuri lintas emiten, proyek dan wilayah. Filter pribadi tersimpan di perangkat ini.")));
 head.append(titles);
 const stamp=E("div","sli-hist-sync",T("Server index: ","Indeks server: ")+(data?.published_at_utc||"—"));
 head.append(stamp);root.append(head);
 if(!ready){
  root.append(E("p","sli-hist-muted",T(
   "Loading shared server history. The source archive below remains available.",
   "Memuat histori bersama dari server. Arsip sumber di bawah tetap tersedia.")));return;
 }
 const toolbar=E("div","sli-hist-toolbar");
 toolbar.append(createControl(T("Entities","Entitas"),[
  ["context","Selected issuer","Emiten terpilih"],["watch","Saved watchlist","Watchlist tersimpan"],["all","All SLI records","Seluruh catatan SLI"]
 ],p.scope,x=>p.scope=x));
 toolbar.append(createControl(T("Catalyst type","Jenis katalis"),[
  ["all","All changes","Semua perubahan"],["news","Publisher reports","Laporan media"],
  ["project","Projects","Proyek"],["regulation","Regulations","Regulasi"]
 ],p.type,x=>p.type=x));
 toolbar.append(createControl(T("Relevance","Keterkaitan"),[
  ["direct","Explicitly linked only","Hanya hubungan eksplisit"],
  ["sector","Include sector context","Termasuk konteks sektor"]
 ],p.level,x=>p.level=x));
 const search=E("label","sli-hist-control sli-hist-search");
 search.append(E("span",null,T("Ticker, project, province, policy, topic","Ticker, proyek, provinsi, kebijakan, topik")));
 const input=E("input");input.type="search";input.value=p.text;input.maxLength=120;
 input.placeholder=T("Search shared history...","Cari histori bersama...");
 input.addEventListener("input",()=>{p.text=input.value;save(PREF,p);renderResults()});
 search.append(input);toolbar.append(search);root.append(toolbar);
 const options=E("div","sli-hist-options");
 const status=E("div","sli-hist-notice-status",T("In-app activity markers are device-local; no account or server preference sync.",
 "Penanda aktivitas dalam aplikasi bersifat lokal; belum ada sinkronisasi akun atau preferensi ke server."));
 options.append(status);
 const desktop=E("button","sli-hist-desktop",p.desktop?T("Desktop notices ON (while open)","Notifikasi desktop AKTIF (saat terbuka)"):
  T("Enable desktop notices while open","Aktifkan notifikasi desktop saat terbuka"));
 desktop.type="button";desktop.addEventListener("click",async()=>{
  if(p.desktop){p.desktop=false;save(PREF,p);render();return}
  if(typeof Notification==="undefined"||!("requestPermission" in Notification)){
   desktop.textContent=T("Browser does not support desktop notifications","Browser tidak mendukung notifikasi desktop");return
  }
  const permission=await Notification.requestPermission();
  if(permission==="granted"){p.desktop=true;save(PREF,p);render()}
  else desktop.textContent=T("Notification permission not granted","Izin notifikasi belum diberikan");
 });options.append(desktop);root.append(options);
 const results=E("div","sli-hist-results");results.id="sliCatalystHistoryResults";root.append(results);
 renderResults();
}
function renderResults(){
 const host=$("sliCatalystHistoryResults");if(!host||!data)return;host.replaceChildren();
 const rows=listItems(),unread=rows.filter(x=>seen.known.includes(x.event.id)&&!seen.read.includes(x.event.id)).length;
 const summary=E("div","sli-hist-summary",
  data.count+" "+T("shared source-index changes retained","perubahan indeks sumber disimpan bersama")+
  " · "+rows.length+" "+T("matching this view","sesuai filter")+
  " · "+unread+" "+T("new and unread on this device","baru dan belum dibaca di perangkat ini"));
 host.append(summary);
 if(!data.events.length)host.append(E("p","sli-hist-empty",T(
  "Server baseline is initialized; there are no proven index deltas yet. New changes will appear after the next ingestion cycle.",
  "Baseline server sudah tersedia; belum ada perbedaan indeks yang terdeteksi. Perubahan baru akan muncul setelah siklus pembaruan berikutnya.")));
 const wrap=E("div","sli-hist-grid");
 const entries=E("div","sli-hist-list");
 const current=rows.find(x=>x.event.id===focused)||rows[0]; 
 for(const {event:e,basis} of rows.slice(0,40)){
  const btn=E("button","sli-hist-item"+(e.id===current?.event.id?" active":""));btn.type="button";
  btn.setAttribute("aria-pressed",String(e.id===current?.event.id));
  btn.append(E("span","sli-hist-kind",labelledType(e)),E("strong",null,e.title));
  btn.append(E("small",null,safeStamp(e.detected_at_utc)+" · "+(e.sector||"cross")+" · "+strengthLabel(basis)));
  if(seen.known.includes(e.id)&&!seen.read.includes(e.id))btn.append(E("span","sli-hist-new",T("NEW FOR YOU","BARU UNTUK ANDA")));
  btn.addEventListener("click",()=>{
   focused=e.id;if(!seen.read.includes(e.id)){seen.read=[...seen.read,e.id].slice(-1800);save(SEEN,seen)}
   renderResults();
  });
  entries.append(btn);
 }
 if(!rows.length&&data.events.length)entries.append(E("p","sli-hist-empty",T(
 "No recorded change matches these settings. Try all records or include sector context.",
 "Belum ada perubahan yang cocok. Coba semua catatan atau sertakan konteks sektor.")));
 wrap.append(entries);
 const aside=E("div","sli-hist-detail-wrap");
 if(current)aside.append(detail(current.event,current.basis));
 else aside.append(E("p","sli-hist-empty",T("Choose a change record for evidence details.","Pilih catatan perubahan untuk melihat bukti.")));
 wrap.append(aside);host.append(wrap);
}
async function refresh(){
 if(loading)return;loading=true;
 try{
  const resp=await fetch(FEED,{cache:"no-store"});if(!resp.ok)throw Error("HTTP "+resp.status);
  const next=await resp.json();
  if(next?.schema_version!=="sli-catalyst-history-v2"||!Array.isArray(next.events))throw Error("Invalid public history schema");
  const oldKnown=new Set((data?.events||[]).map(e=>e.id));
  const wasReady=ready;
  const all=new Set(next.events.map(x=>x.id));
  if(!seen.initialized){seen.initialized=true;seen.known=[];save(SEEN,seen)}
  else if(wasReady){
   const added=next.events.filter(x=>!oldKnown.has(x.id)&&!seen.known.includes(x.id));
   seen.known=[...new Set([...seen.known,...added.map(x=>x.id)])].filter(x=>all.has(x)).slice(-1800);
   save(SEEN,seen);
   if(p.desktop&&typeof Notification!=="undefined"&&Notification.permission==="granted"){
    const context=pickContext(),watched=watch();
    for(const e of added.filter(x=>relevant(x,p,context,watched,issuerByTicker).match).slice(0,3)){
     try{new Notification("SLI Catalyst · "+labelledType(e),{body:e.title.slice(0,170),tag:e.id})}catch{}
    }
   }
  }
  data=next;ready=true;lastLoad=new Date().toISOString();render();
 }catch(e){
  console.warn("[SLI shared catalyst]",e);
  const root=$(ROOT);
  if(!ready&&root)root.replaceChildren(E("p","sli-hist-error",T(
   "Shared history is temporarily unavailable. Open the published-source explorer below.",
   "Histori bersama sedang tidak tersedia. Buka penjelajah sumber di bawah.")));
 }finally{loading=false}
}
function mount(){
 const root=$(ROOT);if(!root)return;
 render();refresh();
 document.addEventListener("sli:terminalrender",()=>{if(ready)render()});
 document.addEventListener("sli:languagechange",()=>{if(ready)render()});
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refresh()});
 setInterval(()=>{if(document.visibilityState!=="hidden")refresh()},10*60*1000);
}
window.SLICatalystHistory={norm,relevant,prompt,groupType,sectorMatch,refresh};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();