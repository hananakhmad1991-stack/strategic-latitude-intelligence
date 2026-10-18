/* SLI Geopolitical Timeline & Commodity Event Study: source-linked, descriptive (not causal). */
(()=>{"use strict";
const ENDPOINTS={events:"./data/sli-geopolitical-events.json",prices:"./data/sli-geopolitical-commodity-prices.json",news:"./data/sli-secondary-news-index.json"};
const catalog={brent:["Brent crude · USD/bbl","Minyak Brent · USD/barel"],gold:["Gold · USD/toz","Emas · USD/troy oz"],copper:["Copper · USD/mt","Tembaga · USD/ton"],nickel:["Nickel · USD/mt","Nikel · USD/ton"],gas_europe:["European natural gas · USD/mmbtu","Gas Eropa · USD/mmbtu"]};
const colors={line:"#83c6ed",event:"#f5c56c",grid:"#334a60",text:"#c6d8e9",scatter:"#5c859c"};
const ns="http://www.w3.org/2000/svg";
const tx=(en,id)=>window.SLIi18n?.language==="id"?id:en;
const localized=(o,key)=>window.SLIi18n?.language==="id"&&o["id_"+key]?o["id_"+key]:o[key];
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
const svg=(tag,attrs,parent,label)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,String(v));if(label){const t=document.createElementNS(ns,"title");t.textContent=label;e.appendChild(t);}if(parent)parent.appendChild(e);return e};
const validLink=x=>typeof x==="string"&&/^https:\/\/[^\s]+$/i.test(x)?x:null;
const fetchJSON=async url=>{const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);return r.json()};
const monthOf=date=>String(date||"").slice(0,7);
const formatNum=(n,d=1)=>Number(n).toLocaleString(window.SLIi18n?.language==="id"?"id-ID":"en-US",{maximumFractionDigits:d,minimumFractionDigits:d});
const mean=arr=>arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null;
function pearson(xs,ys){
 const n=xs.length;if(n<3)return null;
 const ax=mean(xs),ay=mean(ys);let xx=0,yy=0,xy=0;
 for(let i=0;i<n;i++){const a=xs[i]-ax,b=ys[i]-ay;xx+=a*a;yy+=b*b;xy+=a*b}
 return xx>0&&yy>0?xy/Math.sqrt(xx*yy):null;
}
function pct(a,b){return Number.isFinite(a)&&Number.isFinite(b)&&b>0?(a/b-1)*100:null}
function safeSeries(observations,key,year){
 return (observations||[]).filter(o=>/^\d{4}-\d{2}$/.test(o.month)&&o.month.slice(0,4)>=String(year)&&Number.isFinite(Number(o[key]))&&Number(o[key])>0)
  .map(o=>({month:o.month,value:Number(o[key])})).sort((a,b)=>a.month.localeCompare(b.month));
}
function panelLink(url,title){const a=el("a",null,title);a.href=validLink(url)||"https://www.worldbank.org/en/research/commodity-markets";a.target="_blank";a.rel="noopener noreferrer";return a}
function createPriceGraph(points,selectedEvents,key,recentReports=[]){
 const view=svg("svg",{viewBox:"0 0 940 335",role:"img","aria-label":tx("Monthly commodity price series with dated geopolitical event markers","Harga komoditas bulanan dengan penanda peristiwa geopolitik")});
 if(!points.length)return view;
 const W=940,H=335,L=75,R=25,T=30,B=48;
 const lo=Math.min(...points.map(x=>x.value)),hi=Math.max(...points.map(x=>x.value));
 const yrange=Math.max(1,hi-lo),months=new Map(points.map((p,i)=>[p.month,i]));
 const x=i=>L+i/Math.max(1,points.length-1)*(W-L-R);
 const y=v=>T+(hi-v)/yrange*(H-T-B);
 for(let i=0;i<=4;i++){
  const val=lo+i*yrange/4,py=y(val);
  svg("line",{x1:L,y1:py,x2:W-R,y2:py,stroke:colors.grid},view);
  const t=svg("text",{x:L-10,y:py+4,fill:colors.text,"font-size":12,"text-anchor":"end"},view);t.textContent=formatNum(val,0);
 }
 for(let i=0;i<points.length;i++){
  if(!points[i].month.endsWith("-01"))continue;
  const year=Number(points[i].month.slice(0,4));
  if(year%((points.length>250)?5:2)!==0)continue;
  const t=svg("text",{x:x(i),y:H-16,fill:colors.text,"font-size":12,"text-anchor":"middle"},view);t.textContent=year;
 }
 const path=points.map((v,i)=>(i?"L":"M")+x(i).toFixed(1)+","+y(v.value).toFixed(1)).join(" ");
 svg("path",{d:path,fill:"none",stroke:colors.line,"stroke-width":2.5,"stroke-linejoin":"round"},view);
 for(const ev of selectedEvents){
  const idx=months.get(monthOf(ev.date));if(idx===undefined)continue;
  const xx=x(idx),py=y(points[idx].value);
  svg("line",{x1:xx,y1:T,x2:xx,y2:H-B,stroke:colors.event,"stroke-opacity":".23","stroke-dasharray":"3 4"},view);
  const c=svg("circle",{cx:xx,cy:py,r:5.5,fill:colors.event,stroke:"#192b40","stroke-width":1.5,tabindex:0,role:"img","aria-label":localized(ev,"title")+" · "+ev.date},view);
  svg("title",{},c,localized(ev,"title")+" · "+ev.date+" · "+formatNum(points[idx].value,2)+" "+(key==="brent"?"USD/bbl":"USD"));
 }
 // Publisher-dated recent escalation reports are rendered as hollow mint rings,
 // never used as verified historical milestones or counted in Pearson r.
 const reportedMonths=new Map();
 for(const report of recentReports){
  const month=monthOf(report.published_at_utc);
  if(months.has(month)&&!reportedMonths.has(month))reportedMonths.set(month,report);
 }
 for(const [month,report] of reportedMonths){
  const idx=months.get(month),cx=x(idx),cy=y(points[idx].value);
  svg("circle",{cx,cy,r:10,fill:"none",stroke:"#8fe3c6","stroke-width":2.4,"stroke-dasharray":"3 2"},view,
   tx("Publisher-reported escalation","Eskalasi dilaporkan penerbit")+": "+report.publisher+" · "+month+" · "+report.title);
 }
 return view;
}
function createCorrelationScatter(returns,eventMonths){
 const plot=svg("svg",{viewBox:"0 0 400 234",role:"img","aria-label":tx("Scatter of monthly commodity price changes versus event-month indicator","Sebaran perubahan harga bulanan dibanding indikator bulan peristiwa")});
 const L=43,R=20,T=13,B=37,H=234,W=400;
 const mag=Math.max(7,Math.min(100,Math.ceil(Math.max(...returns.map(x=>Math.abs(x.change)),7)/5)*5));
 const y=v=>T+(mag-v)/(2*mag)*(H-T-B);
 for(const v of [-mag,0,mag]){
  svg("line",{x1:L,y1:y(v),x2:W-R,y2:y(v),stroke:colors.grid},plot);
  const t=svg("text",{x:L-6,y:y(v)+4,fill:colors.text,"font-size":11,"text-anchor":"end"},plot);t.textContent=v+"%";
 }
 for(const [xx,label] of [[130,tx("Other months","Bulan lain")],[300,tx("Event month","Bulan peristiwa")]]){
  const t=svg("text",{x:xx,y:H-9,fill:colors.text,"font-size":12,"text-anchor":"middle"},plot);t.textContent=label;
 }
 returns.forEach((r,i)=>{
  const match=eventMonths.has(r.month);
  const drift=(((i*41)%29)-14)*2.2;
  const xx=(match?300:130)+drift;
  const yy=y(Math.max(-mag,Math.min(mag,r.change)));
  svg("circle",{cx:xx,cy:yy,r:match?4.3:2.3,fill:match?colors.event:colors.scatter,opacity:match?.95:.5},plot,
   r.month+": "+formatNum(r.change,2)+"%");
 });
 return plot;
}
const categoryNames={all:["All events","Semua peristiwa"],conflict:["Conflict","Konflik"],macro:["Macro shocks","Guncangan ekonomi"],trade:["Trade tensions","Ketegangan dagang"],shipping:["Maritime routes","Jalur maritim"],health:["Health crisis","Krisis kesehatan"]};
function eventRows(events,points){
 const map=new Map(points.map(p=>[p.month,p]));
 const box=el("div","sli-geo-timeline-events");
 const prior=new Map(points.map((p,i)=>[p.month,i>0?points[i-1]:null]));
 for(const ev of [...events].reverse()){
  const row=el("article","sli-geo-timeline-event");
  const date=el("time","sli-geo-timeline-date",ev.date);date.dateTime=ev.date;
  const content=el("div");
  const name=panelLink(ev.source_url,localized(ev,"title")+" ↗");name.className="sli-geo-timeline-title";
  content.append(name,el("p",null,localized(ev,"mechanism")));
  const price=map.get(monthOf(ev.date)),before=prior.get(monthOf(ev.date));
  if(price&&before){
   const change=pct(price.value,before.value);
   content.append(el("small","sli-geo-timeline-move",tx("Event-month price: ","Harga bulan peristiwa: ")+formatNum(price.value,2)+
    (change===null?"":(" · "+(change>=0?"+":"")+formatNum(change,1)+"% "+tx("MoM","bulanan")))));
  }else content.append(el("small","sli-geo-timeline-move",ev.publisher+" · "+tx("Historical record","Catatan historis")));
  row.append(date,content);box.append(row);
 }
 return box;
}
function latestSignals(news){
 const entries=(news?.articles||[]),maxAge=45*86400000,now=Date.now();
 const eventRe=/\b(attack|attacks|strikes|missile|war|conflict|blockade|closed|closure|escalat\w*|vessel|shipping|sanction|retaliat\w*|tariff|tanker|serangan|perang|konflik|blokade|penutupan|rudal|kapal|sanksi|eskalasi)\b/i;
 const geoRe=/\b(iran|israel|hormuz|russia|russian|ukraine|red sea|gulf|yemen|houthi|taiwan|china|united states|middle east|laut merah|selat|teluk|tiongkok|amerika)\b/i;
 return entries.filter(x=>x?.evidence_level==="publisher_attributed_news_report"&&
 x.date_type==="publisher_publication_date"&&validLink(x.url)&&
 eventRe.test(x.title||"")&&geoRe.test(x.title||"")&&
 Number.isFinite(Date.parse(x.published_at_utc))&&now-Date.parse(x.published_at_utc)>=0&&now-Date.parse(x.published_at_utc)<=maxAge)
 .sort((a,b)=>b.published_at_utc.localeCompare(a.published_at_utc)).slice(0,7);
}
async function init(){
 const root=document.getElementById("sliGeoTimelineRoot");if(!root)return;
 root.replaceChildren(el("p","sli-geo-timeline-status",tx("Loading geopolitical chronology and source-linked market observations…","Memuat kronologi geopolitik dan harga pasar berbasis sumber…")));
 const fetched=await Promise.allSettled([fetchJSON(ENDPOINTS.events),fetchJSON(ENDPOINTS.prices),fetchJSON(ENDPOINTS.news)]);
 if(!root.isConnected)return;
 const events=fetched[0].status==="fulfilled"?(fetched[0].value.events||[]):[];
 const priceData=fetched[1].status==="fulfilled"?fetched[1].value:null;
 const monitoring=fetched[2].status==="fulfilled"?fetched[2].value:null;
 root.replaceChildren();
 const sec=el("section","geo-intel-section sli-geo-timeline");
 sec.id="geo-commodity-timeline";
 sec.append(el("h2",null,tx("03 · Geopolitical timeline and commodity-price relationships · 1990–present","03 · Timeline geopolitik dan hubungan harga komoditas · 1990–sekarang")),
 el("p","geo-intel-muted",tx("Source-linked historical milestones (1990 onward) are overlaid on World Bank monthly commodity benchmarks. Escalation headlines below refresh from SLI's secondary-news index, but are not added to confirmed events or correlation calculations without review.",
 "Peristiwa historis teratribusi sumber (sejak 1990) ditampilkan bersama harga komoditas bulanan World Bank. Berita eskalasi di bawah diperbarui dari indeks berita sekunder SLI, tetapi tidak otomatis dianggap kejadian terverifikasi ataupun dihitung dalam korelasi.")));
 if(!events.length){
  sec.append(el("p","sli-geo-timeline-status",tx("The historical event register is unavailable.","Registri peristiwa historis belum tersedia.")));root.append(sec);return;
 }
 const controls=el("div","sli-geo-timeline-controls");
 function selectItem(label,options,value){const group=el("label",null,label),sel=el("select");for(const [key,name] of options){const op=el("option",null,name);op.value=key;sel.append(op)}sel.value=value;group.append(sel);controls.append(group);return sel}
 const commodity=selectItem(tx("Commodity","Komoditas"),Object.keys(catalog).map(k=>[k,tx(...catalog[k])]),"brent");
 const since=selectItem(tx("From year","Mulai tahun"),[["1990","1990"],["2000","2000"],["2015","2015"],["2020","2020"]],"1990");
 const kind=selectItem(tx("Event type","Jenis kejadian"),Object.entries(categoryNames).map(([k,v])=>[k,tx(...v)]),"all");
 sec.append(controls);
 const meta=el("p","sli-geo-timeline-meta"),plot=el("div","sli-geo-timeline-plot"),summary=el("div","sli-geo-timeline-grid"),eventHeading=el("h3",null,tx("Historical milestones · click source to inspect","Peristiwa historis · klik sumber untuk memeriksa")),rows=el("div");
 sec.append(meta,plot,summary,eventHeading,rows);
 const obs=Array.isArray(priceData?.observations)?priceData.observations:[];
 const signals=latestSignals(monitoring);
 function update(){
  const year=Number(since.value),selected=events.filter(x=>x.date>=year+"-01-01"&&(kind.value==="all"||x.category===kind.value));
  const points=safeSeries(obs,commodity.value,year);
  meta.textContent=tx("Source: ","Sumber: ")+(priceData?.source||"World Bank Pink Sheet")+" · "+
   (obs.length?tx("Available through ","Tersedia hingga ")+priceData.latest_month:tx("Price source refresh pending","Pembaruan sumber harga belum selesai"))+
   " · "+tx("Selected milestones: ","Peristiwa terpilih: ")+selected.length;
  plot.replaceChildren();summary.replaceChildren();rows.replaceChildren();
  if(points.length<24){
   plot.append(el("p","sli-geo-timeline-status",tx("Historical event list is available. Verified monthly prices are awaiting the first World Bank sync; no values have been estimated.","Daftar peristiwa tersedia. Harga bulanan terverifikasi menunggu sinkronisasi pertama World Bank; tidak ada angka yang direkayasa.")));
   rows.append(eventRows(selected,[]));return;
  }
  const priceGraph=createPriceGraph(points,selected,commodity.value,signals);
  const frame=el("div","sli-geo-timeline-graph");frame.append(priceGraph);plot.append(frame);
 plot.append(el("p","sli-geo-timeline-meta",tx("Gold = curated, source-attributed event; mint ring = recent reported escalation (not independently confirmed, excluded from correlation).",
 "Emas = peristiwa historis teratribusi; lingkar hijau = eskalasi terbaru yang dilaporkan (belum dikonfirmasi independen, tidak masuk korelasi).")));
 const unpriced=signals.filter(report=>monthOf(report.published_at_utc)>points[points.length-1].month);
 if(unpriced.length)plot.append(el("p","sli-geo-timeline-meta",tx("Additional reports published after the latest priced month are listed below without an invented price observation.",
 "Laporan setelah bulan harga terbaru ditampilkan di daftar bawah tanpa membuat angka harga perkiraan.")));
  const eventSet=new Set(selected.map(x=>monthOf(x.date)));
  const monthly=points.slice(1).map((o,i)=>({...o,change:pct(o.value,points[i].value)})).filter(o=>o.change!==null&&Number.isFinite(o.change));
  const x=monthly.map(o=>eventSet.has(o.month)?1:0),y=monthly.map(o=>o.change);
  const mEvent=monthly.filter(o=>eventSet.has(o.month)).map(o=>o.change),mOther=monthly.filter(o=>!eventSet.has(o.month)).map(o=>o.change);
  const corr=mEvent.length>=3&&mOther.length>=3?pearson(x,y):null;
  const analysis=el("article","sli-geo-timeline-interpretation");
  analysis.append(el("h4",null,tx("SLI interpretation · one-month event study","Interpretasi SLI · studi bulan kejadian")),
    el("p",null,corr===null?
     tx("The selected events do not provide enough matching monthly observations for a stable descriptive correlation. Interpret source-linked price changes individually.","Peristiwa terpilih belum menghasilkan cukup observasi bulanan untuk korelasi deskriptif yang stabil. Baca perubahan harga satu per satu."):
     tx("Across ","Dalam ")+monthly.length+tx(" monthly observations, the event-month indicator versus "," observasi bulanan, hubungan indikator bulan kejadian terhadap perubahan ")+
      tx(...catalog[commodity.value])+tx(" month-on-month returns has Pearson r = "," bulanan memiliki korelasi Pearson r = ")+
      formatNum(corr,2)+tx("; event months average ","; rata-rata bulan kejadian ")+formatNum(mean(mEvent),2)+"% "+
      tx("versus ","dibanding ")+formatNum(mean(mOther),2)+"% "+tx("in other months.","pada bulan lainnya.")),
    el("p","sli-geo-timeline-caution",tx("This is a selected-event association, not proof of causation: demand, inventories, policy, timing and other shocks also move prices. Events are assigned to calendar months, so intramonth and lagged responses can be obscured.",
     "Ini asosiasi peristiwa terpilih, bukan bukti sebab-akibat: permintaan, persediaan, kebijakan, waktu kejadian, dan guncangan lain juga menggerakkan harga. Resolusi bulanan dapat menyamarkan respons harian atau tertunda.")));
  const scatter=el("article","sli-geo-timeline-scatter");
  scatter.append(el("h4",null,tx("Monthly returns vs event indicator","Perubahan harga bulanan vs indikator kejadian")),createCorrelationScatter(monthly,eventSet));
  summary.append(analysis,scatter);
  rows.append(eventRows(selected,points));
 }
 for(const ctrl of [commodity,since,kind])ctrl.addEventListener("change",update);
 update();
 const note=el("p","sli-geo-timeline-footer");note.append(tx("The prices are monthly nominal US-dollar benchmarks, not domestic retail prices. ","Harga merupakan acuan bulanan nominal USD, bukan harga eceran domestik. "),
 panelLink(priceData?.source_url||"https://www.worldbank.org/en/research/commodity-markets",tx("World Bank Pink Sheet ↗","World Bank Pink Sheet ↗")));
 sec.append(note);
 const signalSec=el("section","sli-geo-timeline-monitoring");
 signalSec.append(el("h3",null,tx("Latest escalation watch · attributed media signals","Pemantauan eskalasi terkini · sinyal dari media teratribusi")));
 const signals=latestSignals(monitoring);
 const caption=el("p","sli-geo-timeline-meta",tx("Automatically filtered publisher-dated secondary reports, last 45 days. They are not independently verified events; chronology inclusion requires editorial review.",
 "Berita sekunder bertanggal publikasi yang tersaring otomatis selama 45 hari. Ini bukan peristiwa terverifikasi secara independen; pencantuman ke kronologi membutuhkan peninjauan editorial."));
 signalSec.append(caption);
 if(!signals.length)signalSec.append(el("p","sli-geo-timeline-status",tx("No qualifying escalation headlines in this snapshot.","Tidak ada headline eskalasi yang cocok pada snapshot ini.")));
 for(const n of signals){
  const item=el("article","sli-geo-timeline-signal");
  item.append(panelLink(n.url,n.title+" ↗"),el("small",null,n.publisher+" · "+n.published_at_utc.slice(0,10)+" · "+tx("Publisher report","Laporan penerbit")));
  signalSec.append(item);
 }
 sec.append(signalSec);root.append(sec);
}
window.initSLIGeopoliticalTimeline=init;
})();