/* SLI Policy Explorer v2 — browser-only, source-attributed, no inferred in-force status. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=s=>String(s||"").normalize("NFKD").toLowerCase().replace(/\b(nomor|no[.]?|tahun|tentang)\b/gi," ").replace(/[\u2013\u2014.,/\\()]+/g," ").replace(/\s+/g," ").trim();
const fmt=s=>String(s??"").replace(/_/g," ");
const statuses={enacted:"Berlaku — rujukan sumber",amended:"Berlaku dengan perubahan",amending_instrument:"Peraturan perubahan",repealed:"Dicabut / tidak berlaku",check_current:"Perlu periksa status terbaru",transition_review:"Perlu pemeriksaan transisi",listed_active_review_alignment:"Tercatat berlaku; harmonisasi perlu ditinjau",issued_plan_not_commissioned:"Keputusan rencana, bukan realisasi",issued_directive:"Instruksi eksekutif",constitutional_foundation:"Dasar konstitusi",archival_not_verified:"Arsip, status belum dikonfirmasi",project_specific:"Bergantung pada proyek",not_applicable:"Penanda kategori",dispute_appealed_not_final:"Perkara belum final",foreign_rule_conditional_scope:"Hukum asing, ruang lingkup bersyarat"};
const types={uu:"Undang-undang",pp:"Peraturan Pemerintah",perpres:"Peraturan Presiden",permen:"Peraturan Menteri",perda:"Perda Provinsi",perda_kab:"Perda Kabupaten/Kota",pergub:"Peraturan Gubernur",perbup:"Peraturan Bupati",perwali:"Peraturan Wali Kota",inpres:"Instruksi Presiden",decision:"Keputusan / ketetapan",dirjen:"Perdirjen",agency:"Peraturan lembaga",constitutional:"Konstitusi",tap:"Ketetapan MPR",international:"Hukum internasional",foreignlaw:"Hukum asing",technical:"Persyaratan teknis"};
const labels={amended_by:["Diubah oleh","Mengubah"],amends:["Mengubah","Diubah oleh"],specific_provision_amended_by:["Pasal tertentu diubah oleh","Mengubah pasal tertentu"],repeals:["Mencabut","Dicabut oleh"],partially_repealed_by:["Dicabut sebagian oleh","Mencabut sebagian"],implements:["Melaksanakan","Dilaksanakan melalui"],implementation:["Pelaksanaan terkait","Dasar implementasi"],regional_authority_context:["Konteks kewenangan daerah","Dasar kewenangan daerah"],harmonization_review:["Perlu harmonisasi dengan","Perlu ditinjau bersama"],spatial_alignment_review:["Kesesuaian tata ruang","Kesesuaian tata ruang"]};
const legalTypes=new Set(["amended_by","amends","repeals","partially_repealed_by","specific_provision_amended_by"]);
const topicDefs=[
["all","Semua bidang"],
["energy","Energi & listrik"],
["mineral","Minerba & industri"],
["climate","Iklim & lingkungan"],
["digital","AI & digital"],
["region","Daerah & tata ruang"],
["investment","Investasi & perdagangan"],
["food","Pangan, air & bencana"],
["global","Perdagangan global"]];
const topics={
 energy:n=>["energy","electricity","oilgas"].includes(n.sector)||match(n,"energi listrik migas gas bumi ESDM RUED RUPTL"),
 mineral:n=>n.sector==="minerba"||match(n,"minerba mineral batubara tambang pertambangan smelter industri"),
 climate:n=>["carbon","environment"].includes(n.sector)||match(n,"Paris iklim lingkungan air limbah karbon emisi AMDAL NDC"),
 digital:n=>n.sector==="digital"||match(n,"pusat data data center AI digital siber komdigi"),
 region:n=>["perda","perda_kab","pergub","perbup","perwali"].includes(n.tier)||match(n,"daerah provinsi RTRW RDTR otonomi tata ruang kewenangan"),
 investment:n=>match(n,"investasi penanaman modal OSS perizinan pajak retribusi BKPM ekspor impor perdagangan"),
 food:n=>match(n,"pangan pertanian irigasi air bencana BPBD geospasial"),
 global:n=>n.sector==="international"||["international","foreignlaw"].includes(n.tier)
};
function match(n, terms){const corpus=norm([n.ref,n.label,n.note,n.region,n.sector,...(n.topics||[])].join(" "));return terms.split(" ").some(w=>w.length>2&&corpus.includes(norm(w)))}
let db=null,monitor=null;
const state={q:"",topic:"all",region:"all",tier:"all",status:"all",tab:"all",selected:null,limit:20,sort:"priority"};
const allIds=()=>new Map((db?.nodes||[]).map(n=>[n.id,n]));
function policyState(n){return statuses[n.status]||fmt(n.status)}
function regionOf(n){return n.region||"Indonesia"}
function yearOf(n){let m=n.ref.match(/(?:19|20)\d{2}/);return m?Number(m[0]):0}
function isRegional(n){return ["perda","perda_kab","pergub","perbup","perwali"].includes(n.tier)}
function isChanged(n){return ["amended","amending_instrument","repealed"].includes(n.status)||(db?.edges||[]).some(e=>legalTypes.has(e.type)&&(e.from===n.id||e.to===n.id))}
function matchesText(n,q){if(!q)return true;const hay=norm([n.ref,n.label,n.note,n.owner,n.region,n.sector,n.tier,...(n.topics||[])].join(" "));const wanted=norm(q);const compact=s=>s.replace(/\s/g,"");return hay.includes(wanted)||compact(hay).includes(compact(wanted))||wanted.split(" ").filter(Boolean).every(w=>hay.includes(w))}
function getFiltered(){
 if(!db)return [];
 let arr=db.nodes.filter(n=>{
   if(state.tab==="changes"&&!isChanged(n))return false;
   if(state.tab==="regional"&&!isRegional(n))return false;
   if(state.region!=="all"&&regionOf(n)!==state.region)return false;
   if(state.tier!=="all"&&n.tier!==state.tier)return false;
   if(state.status==="current"&&n.status==="repealed")return false;
   if(state.status==="repealed"&&n.status!=="repealed")return false;
   if(state.status==="review"&&!["check_current","transition_review","archival_not_verified","listed_active_review_alignment"].includes(n.status))return false;
   if(state.topic!=="all"&&!topics[state.topic](n))return false;
   return matchesText(n,state.q);
 });
 arr.sort((a,b)=>{
   if(state.sort==="newest")return yearOf(b)-yearOf(a)||a.ref.localeCompare(b.ref,"id");
   if(state.sort==="law")return a.ref.localeCompare(b.ref,"id");
   // Exact name/ref hits first, followed by legally updated instruments.
   const score=n=>(state.q?(norm(n.ref)===norm(state.q)?60:(norm(n.ref).includes(norm(state.q))?25:0)):0)+
     (n.verified_at?9:0)+(n.status==="amending_instrument"?4:0)+
     (n.status==="repealed"?-12:0)+(isRegional(n)?1:0);
   return score(b)-score(a)||yearOf(b)-yearOf(a)||a.ref.localeCompare(b.ref,"id");
 });
 return arr;
}
function stateClass(n){return n.status==="repealed"?"old":n.status==="amended"||n.status==="amending_instrument"?"changed":""}
function itemCard(n,idx){
 return '<button class="law-row '+(state.selected===n.id?"active":"")+'" data-law="'+safe(n.id)+'" aria-label="Buka '+safe(n.ref)+'">'+
 '<span class="row-num">'+String(idx+1).padStart(2,"0")+'</span><span class="row-main"><span class="row-upper"><strong>'+safe(n.ref)+'</strong><span class="mini-status '+stateClass(n)+'">'+safe(policyState(n))+'</span></span>'+
 '<span class="row-title">'+safe(n.label)+'</span><span class="row-meta">'+safe(types[n.tier]||n.tier)+' · '+safe(regionOf(n))+'</span></span><span class="row-arrow" aria-hidden="true">›</span></button>';
}
function bindLaw(container){container.querySelectorAll("[data-law]").forEach(b=>b.addEventListener("click",()=>choose(b.dataset.law)));}
function drawList(){
 const rows=getFiltered();
 $("resultCount").textContent=rows.length+" dokumen ditemukan";
 $("resultCaption").textContent=state.tab==="regional"?"Hanya aturan daerah yang telah tercatat. Aturan nasional berlaku menurut ruang lingkupnya.":state.tab==="changes"?"Riwayat perubahan pada dokumen yang sudah terhubung; belum seluruh amandemen hukum Indonesia.":"Seluruh dokumen dalam indeks terkurasi. Tidak ditemukannya aturan bukan berarti aturan tersebut tidak ada.";
 $("lawResults").innerHTML=rows.length?rows.slice(0,state.limit).map(itemCard).join(""):'<div class="empty-state">Tidak ada dokumen dalam indeks ini yang cocok. Coba hapus filter, atau lanjutkan pencarian ke portal resmi.</div>';
 $("loadMore").hidden=rows.length<=state.limit;
 bindLaw($("lawResults"));
 $("sourceSearch").href="https://peraturan.bpk.go.id/Search?keywords="+encodeURIComponent(state.q||"peraturan");
 $("sourceSearch").title="Cari langsung pada portal JDIH BPK";
 $("nationalSearch").href="https://peraturan.go.id/";
 $("regionHint").textContent=state.region==="all"?"": "Filter wilayah menampilkan aturan daerah terindeks; hukum pusat tetap perlu diperiksa untuk setiap proyek.";
}
function relation(n,e){const target=e.from===n.id?e.to:e.from;const outgoing=e.from===n.id;return {id:target,type:e.type,label:(labels[e.type]||["Kaitan kebijakan","Kaitan kebijakan"])[outgoing?0:1],outgoing};}
function relatedCards(n){
 const index=allIds();
 let rs=db.edges.filter(e=>e.from===n.id||e.to===n.id).map(e=>relation(n,e)).filter(x=>index.has(x.id));
 rs.sort((a,b)=>Number(legalTypes.has(b.type))-Number(legalTypes.has(a.type))||yearOf(index.get(b.id))-yearOf(index.get(a.id)));
 return rs;
}
function linkChip(r,index){const n=index.get(r.id);return '<button type="button" class="relation" data-law="'+safe(n.id)+'"><span class="relation-type">'+safe(r.label)+'</span><strong>'+safe(n.ref)+'</strong><span>'+safe(n.label)+'</span></button>';}
function drawDetails(){
 if(!db)return;
 const index=allIds();
 const n=index.get(state.selected);
 if(!n){$("detailBody").innerHTML='<div class="detail-placeholder"><div class="placeholder-symbol">§</div><h3>Pilih regulasi</h3><p>Klik hasil di sebelah kiri untuk melihat status, riwayat perubahan, peraturan terkait, dan sumber resmi.</p></div>';return}
 const relations=relatedCards(n),law=relations.filter(x=>legalTypes.has(x.type)),other=relations.filter(x=>!legalTypes.has(x.type));
 const dateInfo=n.verified_at?"Tinjauan sumber terakhir: "+n.verified_at:"Status belum dikonfirmasi ulang secara menyeluruh";
 const legalHistory=law.length?law.map(r=>linkChip(r,index)).join(""):'<p class="quiet">Belum ada relasi amandemen atau pencabutan yang tervalidasi dalam indeks SLI. Ini <b>bukan</b> bukti tidak ada perubahan.</p>';
 const linked=other.length?other.slice(0,12).map(r=>linkChip(r,index)).join(""):'<p class="quiet">Belum ada relasi sektor lain yang dipetakan.</p>';
 $("detailBody").innerHTML='<div class="detail-kicker">'+safe(types[n.tier]||n.tier)+' · '+safe(regionOf(n))+'</div>'+
 '<h2>'+safe(n.ref)+'</h2><p class="detail-subtitle">'+safe(n.label)+'</p>'+
 '<div class="detail-status '+stateClass(n)+'">'+safe(policyState(n))+'</div>'+
 '<p class="audit-meta">'+safe(dateInfo)+'</p>'+
 '<div class="detail-actions"><a class="primary-link" href="'+safe(n.source)+'" target="_blank" rel="noopener noreferrer">Buka dokumen resmi ↗</a><button id="shareReg" type="button">Salin tautan</button></div>'+
 '<section class="detail-section"><h3>Makna dan cakupan</h3><p>'+safe(n.note||"Informasi belum ditambahkan.")+'</p><dl><div><dt>Otoritas</dt><dd>'+safe(n.owner||"Belum dicatat")+'</dd></div><div><dt>Jenis</dt><dd>'+safe(types[n.tier]||n.tier)+'</dd></div><div><dt>Lokasi</dt><dd>'+safe(regionOf(n))+'</dd></div>'+(n.enacted_date?'<div><dt>Tanggal berlaku</dt><dd>'+safe(n.enacted_date)+'</dd></div>':'')+'</dl></section>'+
 '<section class="detail-section"><div class="section-title"><h3>Riwayat perubahan dan pencabutan</h3><span>'+law.length+' relasi</span></div><div class="relation-list">'+legalHistory+'</div></section>'+
 '<section class="detail-section"><div class="section-title"><h3>Aturan pelaksanaan & keterkaitan</h3><span>'+other.length+' relasi</span></div><div class="relation-list">'+linked+'</div></section>'+
 '<p class="disclaimer">Catatan: hubungan hukum bersumber dari dokumen yang ditelaah dan belum menjamin naskah konsolidasi terkini. Rujuk sumber resmi serta ketentuan transisi untuk keputusan hukum dan investasi.</p>';
 bindLaw($("detailBody"));
 $("shareReg").onclick=()=>{const url=new URL(window.location.href);url.searchParams.set("law",n.id);navigator.clipboard?.writeText(url.toString()).then(()=>{$("shareReg").textContent="Tautan tersalin";}).catch(()=>{$("shareReg").textContent="Salin lewat address bar";});};
}
function choose(id){state.selected=id;drawList();drawDetails();let url=new URL(window.location.href);url.searchParams.set("law",id);history.replaceState(null,"",url.toString());if(window.matchMedia("(max-width:900px)").matches)$("details").scrollIntoView({behavior:"smooth",block:"start"});}
function setTab(v){state.tab=v;state.limit=20;document.querySelectorAll("[data-tab]").forEach(b=>{const on=b.dataset.tab===v;b.classList.toggle("active",on);b.setAttribute("aria-selected",String(on));});$("catalogue").hidden=v==="alerts";$("alertsPanel").hidden=v!=="alerts";if(v==="alerts")renderMonitor();else drawList();}
function addOptions(id,entries){const el=$(id);for(const [value,label] of entries){const opt=document.createElement("option");opt.value=value;opt.textContent=label;el.appendChild(opt);}}
function exportCsv(){
 const rows=[["Nomor","Judul","Jenis","Wilayah","Bidang","Status SLI","Ditinjau","Penerbit","Sumber resmi"],...getFiltered().map(n=>[n.ref,n.label,types[n.tier]||n.tier,regionOf(n),n.sector,policyState(n),n.verified_at||"",n.owner,n.source])];
 const csv="\ufeff"+rows.map(row=>row.map(s=>'"'+String(s??"").replaceAll('"','""')+'"').join(",")).join("\r\n");
 const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}),href=URL.createObjectURL(blob),a=document.createElement("a");a.href=href;a.download="SLI_regulasi_Indonesia_2026.csv";a.click();setTimeout(()=>URL.revokeObjectURL(href),5000);
}
function renderMonitor(){
 const target=$("alertsBody");
 if(!monitor){target.innerHTML='<p class="quiet">Data pemantauan belum dapat dimuat. Ini bukan bukti bahwa peraturan tidak berubah.</p>';return;}
 const sources=monitor.sources||[],events=monitor.events||[],failed=sources.filter(s=>s.health!=="ok"),newItems=events.filter(e=>e.event_kind==="new_candidate");
 $("monitorSummary").textContent="Pemeriksaan terakhir: "+(monitor.checked_at_utc||"tidak tersedia")+" · "+(sources.length-failed.length)+"/"+sources.length+" sumber berhasil · "+newItems.length+" kandidat perubahan";
 target.innerHTML='<p class="quiet">Perubahan halaman JDIH atau judul berita adalah <b>kandidat</b>. Status berlaku/dicabut tidak otomatis diubah sebelum naskah peraturan ditelaah.</p>'+
 (failed.length?'<details class="source-health"><summary>'+failed.length+' sumber sedang gagal atau terblokir</summary>'+failed.map(s=>'<p>'+safe(s.label)+': '+safe(s.error||s.health)+'</p>').join("")+'</details>':'')+
 '<div class="alert-list">'+events.slice(0,32).map(e=>'<article><span>'+(e.event_kind==="new_candidate"?"Kandidat perubahan":"Arsip pantauan")+'</span><a href="'+safe(e.url)+'" target="_blank" rel="noopener noreferrer">'+safe(e.title)+'</a><small>'+safe(e.issuer)+" · "+safe(e.first_seen_utc||"")+'</small></article>').join("")+'</div>';
}
async function start(){
 try{
  const r=await fetch("./data/sli-policy-regulatory-graph-2026.json",{cache:"no-store"});
  if(!r.ok)throw Error("HTTP "+r.status);
  const data=await r.json();if(!Array.isArray(data.nodes)||!Array.isArray(data.edges))throw Error("Format registri tidak cocok");
  const ids=new Set(data.nodes.map(n=>n.id));if(ids.size!==data.nodes.length||data.edges.some(e=>!ids.has(e.from)||!ids.has(e.to)))throw Error("Relasi registri bermasalah");
  db=data;
  $("totalLaws").textContent=db.nodes.length;
  $("updatedAt").textContent=db.updated_at||"Belum diketahui";
  $("regionalLaws").textContent=db.nodes.filter(isRegional).length;
  $("changeLaws").textContent=db.nodes.filter(isChanged).length;
  addOptions("topic",topicDefs);
  addOptions("region",[...new Set(db.nodes.map(regionOf))].sort((a,b)=>a.localeCompare(b,"id")).map(x=>[x,x]));
  addOptions("tier",[...new Set(db.nodes.map(n=>n.tier))].sort().map(x=>[x,types[x]||x]));
  const initialId=new URL(window.location.href).searchParams.get("law");
  state.selected=ids.has(initialId)?initialId:(db.nodes.some(n=>n.id==="uu23local")?"uu23local":db.nodes[0]?.id);
  for(const [id,key] of [["query","q"],["topic","topic"],["region","region"],["tier","tier"],["status","status"],["sort","sort"]]){$(id).addEventListener(id==="query"?"input":"change",ev=>{state[key]=ev.target.value;state.limit=20;drawList();});}
  document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.tab)));
  $("resetAll").addEventListener("click",()=>{for(const id of ["query","topic","region","tier","status","sort"])$(id).value=id==="query"?"":id==="sort"?"priority":"all";Object.assign(state,{q:"",topic:"all",region:"all",tier:"all",status:"all",sort:"priority",limit:20});setTab("all");});
  $("loadMore").addEventListener("click",()=>{state.limit+=20;drawList();});
  $("exportCsv").addEventListener("click",exportCsv);
  $("printPage").addEventListener("click",()=>window.print());
  for(const btn of document.querySelectorAll("[data-shortcut]"))btn.addEventListener("click",()=>{const id=btn.dataset.shortcut;state.q="";$("query").value="";state.topic="all";$("topic").value="all";setTab("all");choose(id);});
  setTab("all");drawDetails();
  // Retain source attribution, even when monitoring fails.
  fetch("./data/regulatory-monitor.json",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{monitor=j;if(state.tab==="alerts")renderMonitor()}).catch(()=>{monitor=null});
 }catch(error){$("lawResults").innerHTML='<p class="empty-state">Registri belum bisa dimuat: '+safe(error.message)+'. Coba muat ulang atau gunakan portal hukum resmi.</p>';$("detailBody").innerHTML='<p class="quiet">Panel detail menunggu data yang valid.</p>';}
}
document.addEventListener("DOMContentLoaded",start);
})();