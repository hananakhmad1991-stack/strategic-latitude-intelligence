/* Strategic Latitude Intelligence · Four-lane source-attributed research radar.
   Hourly GitHub collector; browser fetches cached published JSON at five-minute intervals.
   News alerts are NOT verified incidents, forecasts, operating data or measured impact. */
(function(){
"use strict";
const FEED="data/research-signal-radar.json";
const FIVE_MIN=300000;
const MAX_AGE=14*86400000;
const channels={
 minerals:{en:"Critical Minerals",id:"Mineral Kritis",impact:{nickel_market:"market",export_policy:"trade",batteries:"industry",copper_supply:"market",smelter_projects:"delivery",mineral_policy:"policy",environment:"environment",mineral_investment:"investment"}},
 ai:{en:"AI Infrastructure",id:"Infrastruktur AI",impact:{chip_controls:"technology",compute_competition:"investment",data_governance:"policy",subsea:"connectivity",campus_projects:"delivery",power_water:"electricity",ai_policy:"policy",cloud_operations:"operations"}}
};
let pollTimer=null,active=null;
const tr=(en,id)=>window.SLIi18n?.language==="id"?id:en;
const E=(tag,cls,text)=>{
 const e=document.createElement(tag);if(cls)e.className=cls;
 if(text!==undefined&&text!==null)e.textContent=String(text);
 return e;
};
const iso=val=>{const d=new Date(val||"");return Number.isFinite(d.getTime())?d:null};
const stamp=val=>{const d=iso(val);return d?new Intl.DateTimeFormat(window.SLIi18n?.language==="id"?"id-ID":"en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(d)+" WIB":tr("Not yet available","Belum tersedia")};
const diff=val=>{const d=iso(val);return d?Math.max(0,Date.now()-d.getTime()):Infinity};
function classifyFreshness(data){
 const age=diff(data?.generated_at_utc);
 if(data?.status==="upstream_unavailable_last_good_preserved")return {level:"late",text:tr("Upstream unavailable · last good snapshot","Sumber bermasalah · snapshot terakhir")};
 if(!Number.isFinite(age))return {level:"empty",text:tr("Awaiting automated collection","Menunggu pengambilan otomatis")};
 if(age<=3*3600000)return {level:"fresh",text:tr("Recently refreshed","Baru diperbarui")};
 if(age<=24*3600000)return {level:"late",text:tr("Delayed feed","Pembaruan terlambat")};
 return {level:"old",text:tr("Stale snapshot · verify manually","Snapshot lama · perlu verifikasi")};
}
function normalized(items,sector,scope){
 if(!Array.isArray(items))return [];
 return items.filter(x=>x?.sector===sector&&x?.scope===scope&&
   /^https:\/\//.test(x.url||"")&&x.title&&x.publisher&&iso(x.published_at_utc)&&diff(x.published_at_utc)<=MAX_AGE+86400000)
  .sort((a,b)=>iso(b.published_at_utc)-iso(a.published_at_utc)).slice(0,32);
}
function shortDay(utc){
 const date=iso(utc);if(!date)return "-";
 return new Intl.DateTimeFormat(window.SLIi18n?.language==="id"?"id-ID":"en-GB",{day:"2-digit",month:"short",timeZone:"Asia/Jakarta"}).format(date);
}
function histogram(items){
 const now=Date.now(),arr=Array.from({length:7},()=>0);
 for(const entry of items){
  const n=Math.floor((now-iso(entry.published_at_utc).getTime())/86400000);
  if(n>=0&&n<7)arr[6-n]++;
 }
 const max=Math.max(1,...arr);
 const wrap=E("div","sli-radar-histogram");
 wrap.setAttribute("aria-label",tr("Recent 7-day saved headline counts, not incidents","Jumlah headline tersimpan 7 hari, bukan jumlah insiden"));
 for(let i=0;i<arr.length;i++){
  const col=E("div","sli-radar-bar-col");
  const bar=E("div","sli-radar-bar");
  bar.style.height=(6+Math.round(36*arr[i]/max))+"px";
  bar.title=arr[i]+" "+tr("headlines","headline")+" · "+(6-i)+"d";
  col.append(bar,E("small",null,i===6?tr("Today","Hari ini"):String(6-i)));
  wrap.append(col);
 }
 return wrap;
}
function link(url,title){
 const a=E("a",null,title);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;
}
function renderLane(parent,data,sector,scope){
 const items=normalized(data?.groups?.[sector]?.[scope],sector,scope);
 const lane=E("section","sli-radar-lane");lane.dataset.scope=scope;
 const heading=scope==="geopolitical"?tr("Geopolitical Radar","Radar Geopolitik"):tr("Domestic Radar","Radar Domestik");
 const head=E("header","sli-radar-lane-head");
 const left=E("div");left.append(E("small","sli-radar-kicker",scope==="geopolitical"?"GLOBAL → INDONESIA":"INDONESIA · ON THE GROUND"),E("h4",null,heading));
 head.append(left,E("strong","sli-radar-count",items.length+" "+tr("leads","headline")));lane.append(head);
 lane.append(histogram(items));
 const note=E("p","sli-radar-lane-note",scope==="geopolitical"?
   tr("Transmission pathways to Indonesia, not confirmed domestic impacts.","Jalur dampak potensial ke Indonesia, bukan dampak domestik terkonfirmasi."):
   tr("Policy, construction, operations and incident leads; each needs primary-source checking.","Pantauan regulasi, proyek, operasi, dan insiden; masing-masing perlu pemeriksaan sumber primer."));
 lane.append(note);
 const panel=E("div","sli-radar-search-row"),search=E("input","sli-radar-search"),select=E("select","sli-radar-select");
 search.type="search";search.placeholder=tr("Search headlines or publishers","Cari judul atau penerbit");
 search.setAttribute("aria-label",tr("Search "+heading,"Cari "+heading));
 select.setAttribute("aria-label",tr("Filter topic","Filter topik"));
 const topics=[...new Set(items.map(x=>x.channel))];
 for(const [key,label] of [["",tr("All monitored themes","Semua tema")],...topics.map(x=>[x,x])]){
  const option=E("option",null,label);option.value=key;select.append(option);
 }
 panel.append(search,select);lane.append(panel);
 const list=E("div","sli-radar-feed"),footer=E("div","sli-radar-bottom");
 lane.append(list,footer);
 let expanded=false;
 const update=()=>{
  const needle=search.value.toLowerCase().trim(),theme=select.value;
  const filtered=items.filter(x=>(!theme||x.channel===theme)&&(!needle||[x.title,x.publisher,x.channel].join(" ").toLowerCase().includes(needle)));
  const view=expanded?filtered:filtered.slice(0,8);
  list.replaceChildren();
  if(!view.length)list.append(E("p","sli-radar-empty",
    items.length?tr("No headlines match this filter.","Tidak ada headline yang cocok."):
    tr("No dated, qualifying source leads in the current snapshot. This does not mean no events occurred.","Belum ada headline layak tampil di snapshot ini. Bukan berarti tidak ada kejadian.")));
  for(const item of view){
   const article=E("article","sli-radar-item");
   const row=E("div","sli-radar-item-meta");
   row.append(E("span","sli-radar-topic",item.channel||"Monitoring"),E("span","sli-radar-date",shortDay(item.published_at_utc)));
   article.append(row,E("h5",null,""),E("p","sli-radar-publisher",(item.publisher||"")+" · "+stamp(item.published_at_utc)));
   article.querySelector("h5").append(link(item.url,item.title));
   if(item.impact_pathway)article.append(E("p","sli-radar-path",tr("Potential pathway: ","Jalur dampak potensial: ")+item.impact_pathway));
   article.append(E("small","sli-radar-caveat",tr("Attributed headline · unverified","Headline bersumber · belum diverifikasi")));
   list.append(article);
  }
  footer.replaceChildren(E("span",null,tr("Displaying ","Menampilkan ")+view.length+" / "+filtered.length+" "+tr("saved leads","headline tersimpan")));
  if(filtered.length>8){
   const more=E("button","sli-radar-more",expanded?tr("Show fewer","Tampilkan sedikit"):tr("View all matching leads","Lihat semua headline cocok"));
   more.type="button";more.addEventListener("click",()=>{expanded=!expanded;update()});footer.append(more);
  }
 };
 search.addEventListener("input",update);
 select.addEventListener("change",()=>{expanded=false;update()});
 update();parent.append(lane);
}
async function load(slot,which,force){
 if(!slot?.isConnected)return;
 const status=slot.querySelector(".sli-radar-status"),body=slot.querySelector(".sli-radar-grid"),meta=slot.querySelector(".sli-radar-source-date");
 if(!status||!body)return;
 status.textContent=tr("Syncing published snapshot…","Menyinkronkan snapshot terbitan…");
 try{
  const response=await fetch(FEED+(force?"?v="+Date.now():""),{cache:"no-store"});
  if(!response.ok)throw Error("HTTP "+response.status);
  const data=await response.json();
  if(!slot.isConnected||active?.slot!==slot)return;
  if(!data||!data.groups||!data.groups[which])throw Error("Invalid sector registry");
  const state=classifyFreshness(data);
  status.textContent=state.text;status.dataset.state=state.level;
  meta.textContent=tr("Latest successful snapshot: ","Snapshot terakhir yang berhasil: ")+stamp(data.generated_at_utc)+
   " · "+tr("Last scan attempt: ","Percobaan pindai terakhir: ")+stamp(data.last_attempt_at_utc)+
   (data.errors?.length?" · "+data.errors.length+" "+tr("source errors","gangguan sumber"):"");
  body.replaceChildren();renderLane(body,data,which,"geopolitical");renderLane(body,data,which,"domestic");
  const info=slot.querySelector(".sli-radar-scan-detail");
  if(info)info.textContent=tr("Automated source discovery every hour. While this page stays open, the published dataset is rechecked every five minutes. Updates can be delayed by upstream feeds or GitHub scheduling. Article time is not event time, and historical official statistics do not update from news headlines.",
    "Penelusuran sumber otomatis tiap jam. Saat halaman terbuka, dataset yang sudah dipublikasikan dicek ulang setiap lima menit. Pembaruan bisa terlambat karena sumber atau jadwal GitHub. Waktu berita bukan waktu kejadian, dan statistik resmi historis tidak berubah akibat headline.");
 }catch(e){
  status.textContent=tr("Radar feed unavailable","Umpan radar tidak tersedia");status.dataset.state="old";
  meta.textContent=tr("Could not fetch published source snapshot: ","Tidak dapat mengambil snapshot: ")+String(e.message||e);
  body.replaceChildren(E("p","sli-radar-empty",tr("No fallback headlines are invented. Retry after publication is available.","Tidak ada headline cadangan yang direka. Coba kembali setelah data terbit.")));
 }
}
function mount(which,stage){
 if(!channels[which]||!stage)return;
 if(pollTimer!==null){clearInterval(pollTimer);pollTimer=null}
 const wrapper=E("section","sli-research-section sli-radar");
 wrapper.id="sli-"+which+"-radar";wrapper.dataset.sector=which;
 const header=E("div","sli-radar-header");
 const headerTitle=E("div");
 headerTitle.append(E("small","sli-research-num","AUTOMATED OPEN-SOURCE INTELLIGENCE"),E("h3",null,tr("Geopolitical & Domestic Monitoring Radar","Radar Monitoring Geopolitik & Domestik")));
 const manual=E("button","sli-radar-refresh",tr("Refresh published data ↻","Segarkan data terbitan ↻"));manual.type="button";
 manual.addEventListener("click",()=>load(wrapper,which,true));
 header.append(headerTitle,manual);wrapper.append(header);
 const info=E("div","sli-radar-timestamps");
 info.append(E("span","sli-radar-status",tr("Connecting…","Menghubungkan…")),E("span","sli-radar-source-date",tr("Awaiting timestamps","Menunggu waktu sumber")));
 wrapper.append(info,E("div","sli-radar-grid"),E("p","sli-radar-scan-detail"));
 const dis=E("p","sli-radar-method",tr("Verification: monitoring leads are not verified incidents, operating facilities, investment realisation or measured losses. Follow the publisher link and underlying official statements before using them in decisions.",
  "Verifikasi: headline pemantauan bukan insiden terverifikasi, fasilitas beroperasi, realisasi investasi, maupun kerugian terukur. Periksa tautan penerbit serta pernyataan resmi sebelum digunakan untuk keputusan."));
 wrapper.append(dis);
 stage.insertBefore?stage.insertBefore(wrapper,stage.firstChild?.nextSibling||null):stage.append(wrapper);
 active={slot:wrapper,which};load(wrapper,which,false);
 pollTimer=setInterval(()=>{if(active?.slot===wrapper&&wrapper.isConnected)load(wrapper,which,false);else if(active?.slot===wrapper){clearInterval(pollTimer);pollTimer=null}},FIVE_MIN);
}
window.initSLIResearchRadar=mount;
window.SLIResearchRadarHelpers={classifyFreshness,normalized};
})();
