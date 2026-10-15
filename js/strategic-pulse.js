/* Indonesia Strategic Pulse — sourced snapshots, not real-time market or event claims. */
(function() {
"use strict";
const SOURCES=[
 ["markets","data/investment-market.json"],
 ["investment","data/investment-evidence.json"],
 ["biofuels","data/energy-biofuels.json"],
 ["transition","data/energy-transition.json"],
 ["palm","data/investment-palm.json"],
 ["assessment","data/daily-energy-assessment.json"],
 ["domestic","data/domestic-energy.json"],
 ["geopolitical","data/geopolitical-energy.json"],
 ["investmentNews","data/investment-news.json"]
];
const dom=(tag,cls,content)=>{
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(content!==undefined&&content!==null)n.textContent=String(content);
 return n;
};
const tr=(en,id)=>window.SLIi18n?.language==="id"?id:en;
const number=(n,digits=0)=>Number(n).toLocaleString(window.SLIi18n?.language==="id"?"id-ID":"en-US",{minimumFractionDigits:digits,maximumFractionDigits:digits});
const validUrl=(u)=>typeof u==="string"&&/^https:\/\//.test(u);
const link=(u,label)=>{
 if(!validUrl(u))return dom("span","sp-signal-meta",tr("Source unavailable","Sumber tidak tersedia"));
 const a=dom("a",null,label);a.href=u;a.target="_blank";a.rel="noopener noreferrer";return a;
};
const dateOnly=(s)=>typeof s==="string"?s.slice(0,10):"";
function dateInfo(s,maxAgeDays=3){
 const raw=dateOnly(s),d=raw?Date.parse(raw+"T12:00:00Z"):NaN,days=(Date.now()-d)/86400000;
 if(!Number.isFinite(d))return {status:"unknown",label:tr("Undated","Tanpa tanggal"),date:tr("No observation date","Tanggal tidak tersedia")};
 if(days< -1.5)return {status:"unknown",label:tr("Check date","Periksa tanggal"),date:raw};
 return {status:days>maxAgeDays?"stale":"dated",label:days>maxAgeDays?tr("Older","Data lama"):tr("Dated","Bertanggal"),date:raw};
}
function kpi(label,value,period,source,foot,age=3){
 const c=dom("div","sp-kpi"),top=dom("div","sp-kpi-top");
 const dt=dateInfo(period,age),stamp=dom("span","sp-stamp "+(dt.status==="stale"?"stale":dt.status==="unknown"?"unknown":""),dt.label);
 top.append(dom("span","sp-kpi-label",label),stamp);
 c.append(top,dom("div","sp-kpi-value",value),dom("div","sp-kpi-foot",dt.date+" · "+foot),link(source,tr("View source ↗","Lihat sumber ↗")));
 return c;
}
function route(label,page,anchor){
 const b=dom("button","sp-route",label);b.type="button";
 b.addEventListener("click",()=>{
  const nav=document.querySelector('#nav button[data-page="'+page+'"]');
  if(nav)nav.click();
  if(anchor)window.setTimeout(()=>document.getElementById(anchor)?.scrollIntoView({behavior:"smooth",block:"start"}),50);
 });
 return b;
}
function signalRows(d){
 const rows=[];
 const add=(items,type,field,tag)=>{
  for(const e of (Array.isArray(items)?items:[])){
   const dt=e.published_at_utc||e.indexed_at_utc||e.evidence_date;
   if(!e.title||!validUrl(e.url)||!dateOnly(dt))continue;
   const timestamp=Date.parse(dt),future=Number.isFinite(timestamp)&&timestamp>Date.now()+86400000;
   if(future)continue;
   rows.push({title:e.title,url:e.url,publisher:e.publisher||tr("Publisher unknown","Penerbit tidak diketahui"),date:dt,type,topic:e[field]||"",note:e[tag]||""});
  }
 };
 add(d.domestic?.reports,"energy","channel","claim_status");
 add(d.geopolitical?.events,"geopolitics","topic","status");
 add(d.investmentNews?.reports,"investment","topic","evidence_status");
 rows.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
 return rows;
}
function renderSignals(root,rows,feeds){
 root.append(dom("h3","sp-panel-title",tr("Monitoring signals","Sinyal pemantauan")));
 root.append(dom("p","sp-panel-sub",tr("Source-attributed headlines for investigation, NOT verified incidents or confirmed trades.","Judul berita bersumber untuk diperiksa, BUKAN insiden terverifikasi atau transaksi pasti.")));
 const bar=dom("div","sp-filter-bar"),list=dom("div","sp-signals"),meta=dom("p","sp-panel-sub");
 const options=[["all",tr("All","Semua")],["energy",tr("Energy","Energi")],["investment",tr("Investment","Investasi")],["geopolitics",tr("Geopolitics","Geopolitik")]];
 let category="all";
 function draw(){
  [...bar.children].forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.type===category)));
  list.replaceChildren();
  const selection=rows.filter(r=>category==="all"||r.type===category).slice(0,5);
  if(!selection.length)list.append(dom("p","sp-panel-sub",tr("No eligible, dated headlines in this saved snapshot.","Belum ada judul berita bertanggal yang memenuhi kriteria pada snapshot tersimpan.")));
  for(const row of selection){
   const item=dom("article","sp-signal");
   item.append(link(row.url,row.title),dom("div","sp-signal-meta",row.publisher+" · "+dateOnly(row.date)+" · "+row.type+" / "+row.topic));
   item.append(dom("p","sp-signal-note",tr("Unverified monitoring lead; check original publication and follow-up documents.","Temuan monitoring belum diverifikasi; periksa publikasi asli dan dokumen lanjutannya.")));
   list.append(item);
  }
  meta.textContent=tr("Showing ","Menampilkan ")+selection.length+tr(" of "," dari ")+rows.filter(r=>category==="all"||r.type===category).length+tr(" dated leads. Headlines are not a factual risk score."," temuan bertanggal. Judul berita bukan skor risiko faktual.");
 }
 for(const [id,title] of options){
  const b=dom("button","sp-filter",title);b.type="button";b.dataset.type=id;b.setAttribute("aria-pressed",String(id===category));
  b.addEventListener("click",()=>{category=id;draw()});bar.append(b);
 }
 root.append(bar,list,meta);
 const oldest=[];
 for(const [label,record] of [["Energy",feeds.domestic],["Geopolitics",feeds.geopolitical],["Investment",feeds.investmentNews]]){
  const checked=record?.checked_at_utc;
  oldest.push(label+": "+(checked?dateOnly(checked):tr("not scanned / curated","belum dipindai / kurasi")));
 }
 root.append(dom("p","sp-meta",tr("Feed status · ","Status umpan · ")+oldest.join(" · ")));
 draw();
}
function brief(root,d){
 root.append(dom("h3","sp-panel-title",tr("Strategic interpretation","Interpretasi strategis")));
 root.append(dom("p","sp-panel-sub",tr("Dated, editorially reviewed baselines; not automated proof of today's events.","Dasar analisis bertanggal; bukan bukti otomatis peristiwa hari ini.")));
 const a=d.assessment;
 if(!a||!Array.isArray(a.points)){
  root.append(dom("p","sp-panel-sub",tr("No assessment dataset available. The dashboard will not invent a summary.","Dataset analisis belum tersedia. Dashboard tidak membuat ringkasan tanpa dasar.")));
  return;
 }
 const status=dateInfo(a.assessment_date_wib,2);
 root.append(dom("p","sp-meta",tr("Assessment","Asesmen")+" · "+a.assessment_date_wib+" · "+status.label));
 const delta=dom("div","sp-chips");
 delta.append(dom("span","sp-chip",a.baseline_changed_since_previous===true?tr("Source baseline revised","Data dasar berubah"):tr("No verified baseline change recorded","Tidak tercatat perubahan data dasar terverifikasi")));
 delta.append(dom("span","sp-chip",Number.isInteger(a.news_new_since_previous)?a.news_new_since_previous+" "+tr("new qualified monitored leads","temuan monitoring baru yang memenuhi kriteria"):tr("Lead delta unavailable","Perubahan temuan tidak tersedia")));
 root.append(delta);
 const preferred=["oil-gas","geopolitics","transition","policy"];
 const selected=preferred.map(id=>a.points.find(p=>p.id===id)).filter(Boolean);
 for(const p of selected){
  const node=dom("article","sp-brief");
  node.append(dom("strong",null,p.heading),dom("p",null,p.implication));
  const more=dom("details"),s=dom("summary",null,tr("Verification priority","Prioritas verifikasi"));
  more.append(s,dom("p",null,p.verification_priority));node.append(more);root.append(node);
 }
}
async function load(){
 const result=await Promise.allSettled(SOURCES.map(async([key,path])=>{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),10000);
  try{
   const r=await fetch(path,{cache:"no-store",signal:controller.signal});
   if(!r.ok)throw Error("HTTP "+r.status);
   return [key,await r.json()];
  }finally{clearTimeout(timeout)}
 }));
 const data={};const errors=[];
 result.forEach((r,i)=>r.status==="fulfilled"?data[r.value[0]]=r.value[1]:errors.push(SOURCES[i][0]));
 return {data,errors};
}
let activeRoot=null;
window.initSLIPulse=async function(reload=false){
 const root=document.getElementById("sliPulse");if(!root)return;
 if(root===activeRoot&&!reload)return;
 activeRoot=root;root.replaceChildren(dom("p","sp-err",tr("Loading dated source snapshots…","Memuat snapshot sumber bertanggal…")));
 const {data,errors}=await load();
 if(root!==document.getElementById("sliPulse"))return;
 const {markets:m,investment:i,biofuels:b,transition:t,palm:p,assessment:a}=data;
 const shell=dom("section","sp-shell"),head=dom("div","sp-head"),intro=dom("div");
 intro.append(dom("div","sp-eyebrow","STRATEGIC LATITUDE · INDONESIA"));
 intro.append(dom("h2","sp-title","Indonesia Strategic Pulse"));
 intro.append(dom("p","sp-subtitle",tr("What matters in markets, investment execution and energy security — sourced evidence, not speculative ratings.","Perkembangan penting pasar, realisasi investasi, dan ketahanan energi — berdasarkan bukti bersumber, bukan peringkat spekulatif.")));
 const actions=dom("div","sp-head-actions");
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
 actions.append(dom("span","sp-date",tr("Viewed","Diakses")+" · "+today+" WIB"));
 const refresh=dom("button","sp-action",tr("Reload snapshots ↻","Muat ulang snapshot ↻"));refresh.type="button";
 refresh.addEventListener("click",()=>window.initSLIPulse(true));actions.append(refresh);
 head.append(intro,actions);shell.append(head);
 const cards=dom("div","sp-kpis");
 if(m?.fx&&Number.isFinite(Number(m.fx.value))){
  cards.append(kpi("USD/IDR · BI", "Rp "+number(m.fx.value),m.fx.observed_date,m.fx.source,tr("BI reference, not streaming spot","Kurs referensi BI, bukan spot real-time")));
 }
 if(m?.ihsg&&Number.isFinite(Number(m.ihsg.value))){
  const change=Number.isFinite(Number(m.ihsg.change_pct))&&m.ihsg.change_pct!==null?" · "+number(m.ihsg.change_pct,2)+"% "+tr("reported change","perubahan dilaporkan"):"";
  cards.append(kpi("IHSG · IDX",number(m.ihsg.value,2),m.ihsg.observed_date,m.ihsg.source,tr("Delayed, not confirmed closing","Tertunda, bukan penutupan terkonfirmasi")+change));
 }
 if(i?.national?.total!=null){
  cards.append(kpi(tr("Realized PMA + PMDN","Realisasi PMA + PMDN"),"Rp "+number(i.national.total,1)+" T",i.national.period==="2026-H1"?"2026-06-30":i.as_of,i.national.source,i.national.period+" · BKPM",125));
 }
 if(b?.actuals_2026?.distributed_million_kl!=null){
  cards.append(kpi(tr("Biodiesel distributed","Biodiesel tersalurkan"),number(b.actuals_2026.distributed_million_kl,2)+"m kL",b.actuals_2026.as_of,b.actuals_2026.source,tr("Year-to-date FAME, not fuel blend","FAME kumulatif, bukan campuran BBM"),45));
 }
 if(t?.ken?.ebt_share_actual_2025!=null){
  cards.append(kpi(tr("NRE primary energy share","Porsi EBT energi primer"),number(t.ken.ebt_share_actual_2025,2)+"%","2025-12-31",t.ken.sources?.[1]||t.ken.sources?.[0],tr("Full-year 2025, not 2026 result","Tahun penuh 2025, bukan hasil 2026"),400));
 }
 if(p?.fiscal?.reported_levies_plus_export_duties_rp_trillion!=null){
  cards.append(kpi(tr("Palm export levy + duty","Pungutan + bea keluar sawit"),"Rp "+number(p.fiscal.reported_levies_plus_export_duties_rp_trillion,2)+" T","2025-12-31",p.fiscal.source,tr("Combined reported collections; NOT full tax take","Gabungan pungutan; BUKAN seluruh pajak"),400));
 }
 if(!cards.children.length)cards.append(dom("p","sp-err",tr("KPI sources unavailable; no numbers imputed.","Sumber KPI tidak tersedia; tidak ada angka perkiraan.")));
 shell.append(cards);
 const columns=dom("div","sp-columns"),analysis=dom("section","sp-panel"),signals=dom("section","sp-panel");
 brief(analysis,data);renderSignals(signals,signalRows(data),data);columns.append(analysis,signals);shell.append(columns);
 const next=dom("div","sp-next");next.append(dom("h3",null,tr("Watch next · verification before inference","Pantau berikutnya · verifikasi sebelum mengambil kesimpulan")));
 next.append(dom("p",null,a?.watch_next||tr("Oil and gas delivery, project milestones, official policy instruments and dated market releases.","Distribusi migas, capaian proyek, kebijakan resmi, dan rilis pasar bertanggal.")));shell.append(next);
 const nav=dom("div","sp-routes");
 nav.append(route(tr("Explore investment ↗","Telusuri investasi ↗"),"investment"),route(tr("Open Energy Security ↗","Buka Ketahanan Energi ↗"),"energy"),route(tr("Research methodology ↗","Metodologi riset ↗"),"methodology"));
 shell.append(nav);
 const foot=dom("div","sp-foot");
 foot.append(document.createTextNode(tr("Methodology: published date ≠ scan time ≠ event date. The feed is a lead-discovery system, not verified intelligence or real-time market pricing. Source delays and missing metrics are displayed rather than filled.","Metodologi: tanggal terbit ≠ waktu pemindaian ≠ tanggal kejadian. Umpan berita menghasilkan temuan, bukan intelijen terkonfirmasi ataupun harga pasar real-time. Keterlambatan sumber dan data kosong ditampilkan, bukan direka.")));
 if(errors.length)foot.append(dom("p","sp-err",tr("Unavailable datasets: ","Dataset belum tersedia: ")+errors.join(", ")));
 shell.append(foot);
 root.replaceChildren(shell);
};
document.addEventListener("sli:languagechange",()=>{if(document.getElementById("sliPulse"))window.initSLIPulse(true)});
})();
