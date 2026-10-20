/* SLI Geopolitics 1950—present: multi-benchmark, source-dated, descriptive event study */
(()=>{"use strict";
const ROOT="sliGeoTimelineRoot", ns="http://www.w3.org/2000/svg";
const URLS={events:"./data/sli-geopolitical-events.json",prices:"./data/sli-geopolitical-commodity-prices.json",news:"./data/sli-secondary-news-index.json"};
const ITEMS={
 brent:["Brent crude","Minyak Brent","energy"],wti:["WTI crude","Minyak WTI","energy"],dubai:["Dubai crude","Minyak Dubai","energy"],oil_average:["World Bank crude average","Rata-rata minyak World Bank","energy"],
 coal_australia:["Australian coal","Batu bara Australia","energy"],coal_south_africa:["South African coal","Batu bara Afrika Selatan","energy"],
 gas_us:["US natural gas","Gas alam AS","energy"],gas_europe:["European natural gas","Gas alam Eropa","energy"],lng_japan:["Japan LNG import benchmark","Acuan LNG impor Jepang","energy"],
 nickel:["Nickel","Nikel","minerals"],copper:["Copper","Tembaga","minerals"],tin:["Tin","Timah","minerals"],aluminum:["Aluminum","Aluminium","minerals"],iron_ore:["Iron ore","Bijih besi","minerals"],zinc:["Zinc","Seng","minerals"],lead:["Lead","Timbal","minerals"],gold:["Gold","Emas","minerals"],silver:["Silver","Perak","minerals"],cobalt:["Cobalt","Kobalt","minerals"],
 rice_thai_5:["Rice · Thai 5%","Beras Thailand 5%","food"],wheat_us_hrw:["Wheat · US HRW","Gandum AS HRW","food"],maize:["Maize","Jagung","food"],
 soybeans:["Soybeans","Kedelai","food"],palm_oil:["Palm oil","Minyak sawit","food"],sugar_world:["Sugar · World","Gula dunia","food"],
 urea:["Urea fertilizer","Pupuk urea","food"],coffee_robusta:["Robusta coffee","Kopi robusta","food"],cocoa:["Cocoa","Kakao","food"]
};
const DEFAULTS={energy:["brent","wti","dubai"],minerals:["nickel","copper","gold"],food:["rice_thai_5","wheat_us_hrw","maize"],cross:["brent","nickel","rice_thai_5","wheat_us_hrw"]};
const PALETTE=["#76c3f3","#edc376","#83d2a0","#d49cf1","#f6a79b"];
const groupLabels={energy:["Energy commodities","Komoditas energi"],minerals:["Mineral and metal commodities","Komoditas mineral dan logam"],food:["Global food & agriculture benchmarks","Komoditas pangan & pertanian global"],cross:["Cross-commodity comparison","Perbandingan lintas komoditas"]};
const categoryNames={all:["All events","Semua peristiwa"],conflict:["Conflict","Konflik"],macro:["Macro shocks","Guncangan ekonomi"],trade:["Trade and oil policy","Perdagangan dan kebijakan minyak"],shipping:["Maritime routes","Jalur maritim"],health:["Health crisis","Krisis kesehatan"],indonesia_presidency:["Indonesia · Presidential and regime change","Indonesia · Presiden dan perubahan rezim"]};
const modeNames={single:["Single","Tunggal"],compare:["Compare · absolute","Bandingkan · nominal"],indexed:["Indexed Compare · 100","Perbandingan indeks · 100"]};
const tx=(en,id)=>window.SLIi18n?.language==="id"?id:en;
const local=(o,k)=>window.SLIi18n?.language==="id"&&o["id_"+k]?o["id_"+k]:o[k];
const text=(v)=>String(v===undefined||v===null?"":v);
const el=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=text(value);return e};
const svg=(tag,attrs={},parent,tooltip)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,text(v));if(tooltip){const t=document.createElementNS(ns,"title");t.textContent=tooltip;e.appendChild(t)}if(parent)parent.appendChild(e);return e};
const fmt=(n,d=1)=>Number(n).toLocaleString(window.SLIi18n?.language==="id"?"id-ID":"en-US",{maximumFractionDigits:d,minimumFractionDigits:d});
const parse=async url=>{const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status+" "+url);return r.json()};
const validUrl=s=>typeof s==="string"&&/^https:\/\/[^\s]+$/i.test(s);
const link=(url,label)=>{const a=el("a",null,label);a.href=validUrl(url)?url:"https://www.worldbank.org/en/research/commodity-markets";a.rel="noopener noreferrer";a.target="_blank";return a};
const month=d=>text(d).slice(0,7);
const num=v=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v))&&Number(v)>0?Number(v):null;
const average=vals=>vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
const pct=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&b>0?(a/b-1)*100:null;
const absMonth=m=>Number(m.slice(0,4))*12+Number(m.slice(5,7))-1;
function seriesFrom(rows,key,year){
 return (rows||[]).filter(r=>r&&/^\d{4}-\d\d$/.test(r.month)&&r.month.slice(0,4)>=String(year)&&num(r[key])!==null)
 .map(r=>({month:r.month,value:num(r[key])})).sort((a,b)=>a.month.localeCompare(b.month));
}
function pearson(xs,ys){
 if(xs.length<3||xs.length!==ys.length)return null;
 const mx=average(xs),my=average(ys);let cov=0,vx=0,vy=0;
 for(let i=0;i<xs.length;i++){const a=xs[i]-mx,b=ys[i]-my;cov+=a*b;vx+=a*a;vy+=b*b}
 return vx>0&&vy>0?cov/Math.sqrt(vx*vy):null;
}
function returns(points){
 let result=[];for(let i=1;i<points.length;i++){
  if(absMonth(points[i].month)-absMonth(points[i-1].month)!==1)continue;
  const change=pct(points[i].value,points[i-1].value);
  if(change!==null)result.push({month:points[i].month,change});
 }return result;
}
function eventStats(points,events){
 const eventMonths=new Set(events.map(e=>month(e.date)));
 const monthly=returns(points),re=monthly.filter(o=>eventMonths.has(o.month)).map(o=>o.change),other=monthly.filter(o=>!eventMonths.has(o.month)).map(o=>o.change);
 return {monthly,events:re.length,other:other.length,meanEvent:average(re),meanOther:average(other),r:re.length>=3&&other.length>=3?pearson(monthly.map(o=>eventMonths.has(o.month)?1:0),monthly.map(o=>o.change)):null};
}
function latestSignals(index){
 const now=Date.now(),maxAge=45*86400000;
 const eventRe=/\b(attack|attacks|strikes|missile|war|conflict|blockade|closed|closure|escalat\w*|vessel|shipping|sanction|retaliat\w*|tariff|tanker|serangan|perang|konflik|blokade|penutupan|rudal|kapal|sanksi|eskalasi)\b/i;
 const location=/\b(iran|israel|hormuz|russia|russian|ukraine|red sea|gulf|yemen|houthi|taiwan|china|united states|middle east|laut merah|selat|teluk|tiongkok|amerika)\b/i;
 return (index?.articles||[]).filter(x=>x?.evidence_level==="publisher_attributed_news_report"&&x.date_type==="publisher_publication_date"&&validUrl(x.url)&&
  eventRe.test(x.title||"")&&location.test(x.title||"")&&Number.isFinite(Date.parse(x.published_at_utc))&&
  now-Date.parse(x.published_at_utc)>=0&&now-Date.parse(x.published_at_utc)<=maxAge)
 .sort((a,b)=>b.published_at_utc.localeCompare(a.published_at_utc)).slice(0,7);
}
function graphLines(series,events,presidentialTransitions,signals,year,lastMonth,isIndex,activeDate,onChoose){
 const root=svg("svg",{viewBox:"0 0 1040 350",role:"img","aria-label":tx("Geopolitical milestones over monthly commodity prices","Peristiwa geopolitik dan harga komoditas bulanan")});
 const W=1040,H=350,L=78,R=26,T=38,B=49;
 const origin=year*12,finish=absMonth(lastMonth),span=Math.max(1,finish-origin);
 const xx=m=>L+(absMonth(m)-origin)/span*(W-L-R);
 const all=series.flatMap(s=>s.points.map(p=>p.value));if(!all.length)return root;
 const smallest=Math.min(...all),largest=Math.max(...all),pad=Math.max((largest-smallest)*0.08,0.0001);
 const lower=Math.min(0,smallest-pad),upper=largest+pad,dy=upper-lower||1;
 const yy=value=>T+(upper-value)/dy*(H-T-B);
 for(let i=0;i<=4;i++){
  const value=lower+dy*i/4,py=yy(value);
  svg("line",{x1:L,x2:W-R,y1:py,y2:py,stroke:"#36516b","stroke-width":1},root);
  const t=svg("text",{x:L-9,y:py+4,fill:"#bed0e0","font-size":12,"text-anchor":"end"},root);t.textContent=fmt(value,isIndex?0:2);
 }
 const interval=span>600?10:span>320?5:span>160?3:2;
 for(let yr=year;yr<=Math.floor(finish/12);yr++){
  if(yr%interval)continue;const x=L+(yr*12-origin)/span*(W-L-R);
  const t=svg("text",{x,y:H-19,fill:"#c2d5e4","font-size":13,"text-anchor":"middle"},root);t.textContent=yr;
 }
 // Cyan diamonds show presidential and regime chronology, not price-shock evidence.
 let lastPoliticalX=-120;
 for(const event of presidentialTransitions){
  const m=month(event.date);if(absMonth(m)<origin||absMonth(m)>finish)continue;
  const x=xx(m),chosen=activeDate===event.date,cy=T+17;
  const tooltip=local(event,"title")+" · "+event.date+" · "+tx("Presidency/regime chronology, not a price shock","Kronologi presiden/rezim, bukan guncangan harga");
  const mark=svg("g",{"class":"sli-geo-presidency-marker"+(chosen?" is-selected":""),role:"button",tabindex:0,
   "aria-label":tooltip,"aria-pressed":chosen?"true":"false","data-presidential-date":event.date},root,tooltip);
  svg("line",{x1:x,x2:x,y1:T+10,y2:H-B,stroke:"#6fe0d8","stroke-width":chosen?3.5:1.6,
   "stroke-opacity":chosen?".9":".48","stroke-dasharray":"2 6"},mark);
  svg("polygon",{points:[x+","+(cy-10),(x+10)+","+cy,x+","+(cy+10),(x-10)+","+cy].join(" "),
   fill:chosen?"#d3ffff":"#72d7d5",stroke:chosen?"#102638":"#174052",
   "stroke-width":chosen?3:2,"class":"sli-geo-presidency-diamond"},mark);
  svg("circle",{cx:x,cy,r:20,fill:"transparent",stroke:"none","class":"sli-geo-presidency-hit"},mark);
  if(x-lastPoliticalX>37||chosen){
   const label=svg("text",{x,y:T-21,"text-anchor":"middle",fill:"#8eede9","font-size":chosen?15:11,
    "font-weight":chosen?800:650,"class":"sli-geo-presidency-year"},mark);
   label.textContent=event.date.slice(0,4);lastPoliticalX=x;
  }
  const choose=()=>onChoose?.(event.date);mark.addEventListener("click",choose);
  mark.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose()}});
 }
 // Source-attributed event markers. The entire marker has a generous pointer/keyboard hit area.
 let lastYearLabelX=-100;
 for(const event of events){
  const m=month(event.date);if(absMonth(m)<origin||absMonth(m)>finish)continue;
  const x=xx(m),chosen=activeDate===event.date;
  const tooltip=local(event,"title")+" · "+event.date+" · "+tx("Open chronology, market evidence and lesson learned","Buka kronologi, bukti pasar dan pelajaran");
  const marker=svg("g",{"class":"sli-geo-event-marker"+(chosen?" is-selected":""),role:"button",tabindex:0,
   "aria-label":tooltip,"aria-pressed":chosen?"true":"false","data-event-date":event.date},root,tooltip);
  const line=svg("line",{x1:x,x2:x,y1:T,y2:H-B,stroke:"#f3c871",
   "stroke-width":chosen?4:2.1,"stroke-opacity":chosen?".96":".53","stroke-dasharray":chosen?"none":"5 6",
   "class":"sli-geo-event-line"},marker);
  svg("circle",{cx:x,cy:T,r:chosen?12:8.8,fill:"#ffce70",stroke:chosen?"#fff9de":"#142e43",
   "stroke-width":chosen?3.5:2.5,"class":"sli-geo-event-dot"},marker);
  // This extra transparent target makes the point easy to click on touch screens.
  svg("circle",{cx:x,cy:T,r:19,fill:"transparent",stroke:"none","class":"sli-geo-event-hit"},marker);
  if(x-lastYearLabelX>31||chosen){
   const label=svg("text",{x,y:T-21,"text-anchor":"middle",fill:chosen?"#fff0b8":"#ecd49a",
    "font-size":chosen?16:12,"font-weight":chosen?800:600,"class":"sli-geo-event-year"},marker);
   label.textContent=event.date.slice(0,4);lastYearLabelX=x;
  }
  const choose=()=>onChoose?.(event.date);
  marker.addEventListener("click",choose);
  marker.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose()}});
 }
 for(const report of signals){
  const m=month(report.published_at_utc);if(absMonth(m)<origin||absMonth(m)>finish)continue;
  svg("circle",{cx:xx(m),cy:T+13,r:6,stroke:"#8ae8c1",fill:"none","stroke-width":2},root,
    tx("Attributed report: ","Berita teratribusi: ")+report.title+" · "+report.publisher);
 }
 series.forEach((s,i)=>{
  const parts=[];let prev=null;
  for(const p of s.points){
   const xpos=xx(p.month).toFixed(2),ypos=yy(p.value).toFixed(2);
   parts.push((prev!==null&&absMonth(p.month)-absMonth(prev)===1?"L":"M")+xpos+","+ypos);prev=p.month;
  }
  if(parts.length)svg("path",{d:parts.join(" "),stroke:PALETTE[i%PALETTE.length],"stroke-width":2.4,fill:"none","stroke-linejoin":"round"},root,
    tx(...ITEMS[s.key])+" · "+(s.points[0]?.month||"")+"–"+(s.points.at(-1)?.month||""));
  for(let j=0;j<s.points.length;j++){
   const p=s.points[j];if(j%12!==0&&!events.some(e=>month(e.date)===p.month))continue;
   svg("circle",{cx:xx(p.month),cy:yy(p.value),r:3,fill:PALETTE[i%PALETTE.length],opacity:.85},root,
    tx(...ITEMS[s.key])+" · "+p.month+" · "+fmt(p.value,2)+(isIndex?" (index)":""));
  }
 });
 return root;
}
function scatter(points,events){
 const chart=svg("svg",{viewBox:"0 0 400 218",role:"img","aria-label":tx("Event month versus monthly returns scatter","Scatter bulan kejadian versus perubahan harga")});
 const monthly=returns(points),ev=new Set(events.map(e=>month(e.date)));
 if(!monthly.length)return chart;
 const absMax=Math.max(8,Math.min(100,Math.ceil(Math.max(...monthly.map(p=>Math.abs(p.change)))/5)*5));
 const py=p=>14+(absMax-Math.max(-absMax,Math.min(absMax,p)))/(2*absMax)*164;
 for(const value of [-absMax,0,absMax]){
  svg("line",{x1:40,x2:391,y1:py(value),y2:py(value),stroke:"#35546a"},chart);
  const label=svg("text",{x:37,y:py(value)+3,"text-anchor":"end",fill:"#b9cddb","font-size":11},chart);label.textContent=value+"%";
 }
 monthly.forEach((p,i)=>{
  const event=ev.has(p.month);
  svg("circle",{cx:(event?290:112)+((i*31)%35-17),cy:py(p.change),r:event?4:2.2,fill:event?"#f1c56e":"#58869e",opacity:event?.9:.48},chart,p.month+" · "+fmt(p.change,2)+"%");
 });
 for(const [x,t] of [[112,tx("Other months","Bulan lain")],[290,tx("Event months","Bulan kejadian")]]){
  const label=svg("text",{x,y:208,"text-anchor":"middle",fill:"#c7d9e7","font-size":12},chart);label.textContent=t;
 }
 return chart;
}
function eventRows(events,points,onChoose,activeDate){
 const container=el("div","sli-geo-timeline-events"),map=new Map(points.map((p,i)=>[p.month,{p,prior:i>0?points[i-1]:null}]));
 for(const e of [...events].reverse()){
  const article=el("article","sli-geo-timeline-event"+(activeDate===e.date?" is-selected":"")),date=el("time","sli-geo-timeline-date",e.date),body=el("div");
  date.dateTime=e.date;const a=link(e.source_url,local(e,"title")+" ↗");a.className="sli-geo-timeline-title";
  const selectEvent=el("button","sli-geo-timeline-open",tx("View event lesson","Lihat pelajaran peristiwa"));selectEvent.type="button";
  selectEvent.addEventListener("click",()=>onChoose?.(e.date));
  if(e.category==="indonesia_presidency")body.append(el("small","sli-geo-timeline-political-tag",tx("INDONESIA · PRESIDENT / REGIME","INDONESIA · PRESIDEN / REZIM")));
  body.append(a,el("p",null,local(e,"mechanism")),selectEvent);
  const match=map.get(month(e.date));
  if(match?.prior&&absMonth(match.p.month)-absMonth(match.prior.month)===1){
   const delta=pct(match.p.value,match.prior.value);
   if(delta!==null)body.append(el("small","sli-geo-timeline-move",tx("Selected benchmark in event month: ","Acuan harga bulan kejadian: ")+fmt(match.p.value,2)+" ("+(delta>=0?"+":"")+fmt(delta,1)+"% MoM)"));
  }else body.append(el("small","sli-geo-timeline-move",e.publisher+" · "+tx("No matching price observation","Tidak ada observasi harga terkait")));
  article.append(date,body);container.append(article);
 }
 return container;
}
function select(label,choices,initial,parent){
 const lab=el("label",null,label),s=el("select");
 for(const [v,t] of choices){const opt=el("option",null,t);opt.value=v;s.append(opt)}
 s.value=initial;lab.append(s);parent.append(lab);return s;
}

function labelBlock(name,body){
 const block=el("section","sli-geo-insight-block");
 block.append(el("h5",null,name),el("p",null,body||"—"));return block;
}
function marketMoves(event,series,coverage){
 // Report observed event-month and following-month benchmark changes, never causal attribution.
 const container=el("div","sli-geo-insight-moves");
 if(!series.length){container.append(el("p","sli-geo-timeline-meta",tx("Select a benchmark to see market observations.","Pilih acuan untuk melihat observasi pasar.")));return container}
 const eventMonth=month(event.date),ref=absMonth(eventMonth);
 for(const s of series){
  const m=new Map(s.points.map(p=>[absMonth(p.month),p.value]));
  const price=m.get(ref),prior=m.get(ref-1),next=m.get(ref+1);
  const row=el("div","sli-geo-insight-move"),name=el("strong",null,tx(ITEMS[s.key][0],ITEMS[s.key][1]));
  const fmtChange=(a,b)=>{const p=pct(a,b);return p===null?null:(p>=0?"+":"")+fmt(p,1)+"%"};
  row.append(name);
  if(price===undefined){
   row.append(el("span",null,tx("No published benchmark in ","Belum ada observasi acuan pada ")+eventMonth));
  }else{
   const unit=coverage[s.key]?.unit||"",m1=fmtChange(price,prior),m2=next===undefined?null:fmtChange(next,price);
   row.append(el("span",null,fmt(price,2)+" "+unit));
   row.append(el("span",null,tx("Event month MoM: ","Bulan kejadian MoM: ")+(m1??tx("N/A","T/A"))));
   row.append(el("span",null,tx("Following month MoM: ","Bulan berikutnya MoM: ")+(m2??tx("N/A","T/A"))));
  }
  container.append(row);
 }
 return container;
}
function eventInsight(event,series,coverage,onReset){
 const panel=el("article","sli-geo-timeline-interpretation sli-geo-event-insight");
 const header=el("div","sli-geo-insight-head");
 const headText=el("div");
 headText.append(el("small","sli-geo-insight-kicker",tx("SELECTED EVENT · LESSON LEARNED","PERISTIWA TERPILIH · PELAJARAN")),
 el("h4",null,local(event,"title")),
 el("p","sli-geo-insight-date",event.date+" · "+event.publisher+(event.category==="indonesia_presidency"?" · "+tx("Political timeline","Linimasa politik"):"")));
 const reset=el("button","sli-geo-insight-reset",tx("Back to general analysis","Kembali ke analisis umum"));reset.type="button";reset.addEventListener("click",onReset);
 header.append(headText,reset);panel.append(header);
 panel.append(labelBlock(tx("1. What happened · chronology","1. Apa yang terjadi · kronologi"),local(event,"chronology")||local(event,"mechanism")));
 panel.append(labelBlock(tx("2. Transmission pathways · possible mechanisms","2. Jalur transmisi · mekanisme potensial"),local(event,"mechanism")));
 panel.append(labelBlock(tx("3. Commodity-market context","3. Konteks pasar komoditas"),local(event,"market_context")));
 panel.append(marketMoves(event,series,coverage));
 if(event.category==="indonesia_presidency")panel.append(el("p","sli-geo-timeline-caution",tx("Presidential and regime changes are context only; excluded from geopolitical event-month statistics. Price movements are not attributed to the presidential succession.","Pergantian presiden dan rezim merupakan konteks saja; dikecualikan dari statistik kejadian geopolitik. Perubahan harga tidak diklaim disebabkan oleh suksesi presiden.")));
 panel.append(labelBlock(tx("4. Lesson learned","4. Pelajaran yang bisa diambil"),local(event,"lesson")));
 const source=el("p","sli-geo-timeline-caution");
 source.append(tx("Historical narrative: ","Kronologi historis: "),link(event.source_url,event.publisher+" ↗"));
 panel.append(source,el("p","sli-geo-timeline-caution",tx("Monthly price changes are descriptive observations from the World Bank, not a causal estimate of this event. Other demand, policy, inventory and timing factors may matter.",
 "Perubahan harga bulanan adalah observasi deskriptif dari World Bank, bukan estimasi dampak kausal peristiwa ini. Faktor permintaan, kebijakan, persediaan, dan waktu juga mungkin berpengaruh.")));
 return panel;
}

function initPanels(root,prices,events,signals,presidencies=[]){
 const rows=Array.isArray(prices?.observations)?prices.observations:[];
 const coverage=prices?.series_coverage||{},available=Object.keys(ITEMS).filter(k=>coverage[k]?.count>3);
 root.replaceChildren();
 const wrapper=el("section","geo-intel-section sli-geo-timeline");wrapper.id="geo-commodity-timeline";
 wrapper.append(el("h2",null,tx("03 · Geopolitical events, Indonesian presidents & commodity prices · 1945–present","03 · Atlas peristiwa geopolitik, presiden Indonesia & harga komoditas · 1945–sekarang")),
 el("p","geo-intel-muted",tx("Indonesia presidential chronology begins 1945 and global geopolitical milestones in 1950. World Bank nominal monthly prices begin in 1960, with later start dates for several benchmarks. Historical Brent values before the modern benchmark emerged should be read as the World Bank's retrospective series, not contemporaneous traded spot quotes. Missing years stay blank; news headlines are not independent event confirmation.",
 "Linimasa presiden Indonesia dimulai 1945 dan peristiwa geopolitik global sejak 1950. Harga bulanan nominal World Bank tersedia sejak 1960, sedangkan beberapa acuan baru tersedia setelahnya. Seri historis Brent sebelum perdagangan acuannya berkembang perlu dibaca sebagai seri rekonstruksi World Bank, bukan harga spot sezaman. Tahun tanpa data tetap kosong; berita monitoring tidak otomatis menjadi bukti kejadian independen.")));
 const controls=el("div","sli-geo-timeline-controls");
 const year=select(tx("From year","Mulai tahun"),[1945,1950,1960,1970,1980,1990,2000,2010,2020].map(y=>[String(y),String(y)]),"1945",controls);
 const kind=select(tx("Historical event filter","Filter kejadian historis"),Object.entries(categoryNames).map(([k,v])=>[k,tx(...v)]),"all",controls);
 const politicalToggle=el("label","sli-geo-political-toggle"),showPresidents=el("input");showPresidents.type="checkbox";showPresidents.checked=true;
 politicalToggle.append(showPresidents,el("span",null,tx("Show Indonesian presidential/regime transitions (cyan diamonds)","Tampilkan pergantian presiden/rezim Indonesia (belah ketupat biru)")));
 controls.append(politicalToggle);
 wrapper.append(controls);
 const legendNote=el("div","sli-geo-political-legend");
 legendNote.append(el("span",null,tx("● Gold · geopolitical events","● Emas · peristiwa geopolitik")),el("span",null,tx("◆ Cyan · Indonesia presidents & regime changes (context only)","◆ Biru · presiden & perubahan rezim Indonesia (hanya konteks)")));
 wrapper.append(legendNote);
 const overview=el("div","sli-geo-timeline-meta");
 overview.textContent=(prices?.source||"World Bank Pink Sheet")+" · "+tx("Monthly data through ","Data bulanan hingga ")+(prices?.latest_month||"—")+" · "+
  tx("History since ","Kronologi sejak ")+events[0]?.date.slice(0,4)+" · "+tx("Series available: ","Seri tersedia: ")+available.length;
 wrapper.append(overview);
 if(!rows.length)wrapper.append(el("p","sli-geo-timeline-status",tx("Verified price synchronization is pending; event chronology remains available.","Sinkronisasi harga terverifikasi belum tersedia; kronologi tetap dapat diakses.")));
 let activeDate=null;
 const allHistorical=[...events,...presidencies].sort((a,b)=>a.date.localeCompare(b.date));
 const filteredGeo=()=>events.filter(e=>e.date>=year.value+"-01-01"&&(kind.value==="all"||e.category===kind.value));
 const filteredPresidencies=()=>showPresidents.checked&&(kind.value==="all"||kind.value==="indonesia_presidency")?presidencies.filter(e=>e.date>=year.value+"-01-01"):[];
 const nav=el("nav","sli-geo-event-navigation");nav.setAttribute("aria-label",tx("Event lessons navigation","Navigasi pelajaran peristiwa"));
 const indicator=el("p","sli-geo-event-selection",tx("Select a gold event dot on any chart to explore its historical lesson.","Klik dot emas pada grafik mana pun untuk mempelajari kronologi dan dampaknya."));
 indicator.setAttribute("aria-live","polite");
 const controlsNav=el("div","sli-geo-event-nav-buttons");
 const previous=el("button","sli-geo-event-nav-prev",tx("◀ Previous event","◀ Peristiwa sebelumnya"));
 const next=el("button","sli-geo-event-nav-next",tx("Next event ▶","Peristiwa berikutnya ▶"));
 const reset=el("button","sli-geo-event-nav-reset",tx("Reset to overview","Kembali ke gambaran umum"));
 for(const btn of [previous,next,reset]){btn.type="button";controlsNav.append(btn)}
 nav.append(indicator,controlsNav);wrapper.append(nav);
 const visibleEvents=()=>[...filteredGeo(),...filteredPresidencies()].sort((a,b)=>a.date.localeCompare(b.date));
 function chooseEvent(date){
  const ev=allHistorical.find(e=>e.date===date);
  if(!ev||!visibleEvents().some(e=>e.date===date))return;
  activeDate=date;refresh();
 }
 function resetEvent(){activeDate=null;refresh()}
 previous.addEventListener("click",()=>navigate(-1));next.addEventListener("click",()=>navigate(1));
 reset.addEventListener("click",resetEvent);
 function navigate(direction){
  const list=visibleEvents();const i=list.findIndex(e=>e.date===activeDate);
  if(i<0)return;const target=list[i+direction];if(target)chooseEvent(target.date);
 }
 function updateEventNav(){
  const ev=allHistorical.find(e=>e.date===activeDate);
  const list=visibleEvents(),i=ev?list.findIndex(e=>e.date===ev.date):-1;
  indicator.textContent=ev?
   tx("Selected event: ","Peristiwa terpilih: ")+local(ev,"title")+" · "+ev.date:
   tx("Select a gold event dot on any chart to read a chronology, price evidence and lesson learned.","Klik dot emas pada grafik mana pun untuk membaca kronologi, bukti harga, dan pelajaran.");
  previous.disabled=i<=0;next.disabled=i<0||i>=list.length-1;reset.disabled=!ev;
 }
 const contexts=[];
 for(const group of ["energy","minerals","food","cross"]){
  const section=el("section","sli-geo-timeline-panel");
  section.append(el("h3",null,tx(...groupLabels[group])));
  const note=el("p","sli-geo-timeline-meta",group==="cross"?
    tx("One indexed chart across sectors, common first overlapping observation = 100.","Satu grafik indeks antar-sektor, observasi pertama yang tumpang tindih = 100."):
    tx("Select up to five benchmarks; absolute comparison requires the same unit.","Pilih maksimal lima komoditas; perbandingan nominal membutuhkan satuan yang sama."));
  section.append(note);
  const action=el("div","sli-geo-timeline-panel-controls");
  const modes=group==="cross"?[["indexed",tx(...modeNames.indexed)]]:Object.entries(modeNames).map(([k,v])=>[k,tx(...v)]);
  const mode=select(tx("Display mode","Mode grafik"),modes,group==="cross"?"indexed":"indexed",action);
  const pick=el("div","sli-geo-timeline-picks");
  const keys=group==="cross"?available:available.filter(k=>ITEMS[k][2]===group);
  const selected=new Set(DEFAULTS[group].filter(k=>keys.includes(k)));if(!selected.size&&keys.length)selected.add(keys[0]);
  const status=el("p","sli-geo-timeline-meta");
  const chart=el("div","sli-geo-timeline-plot"),legend=el("div","sli-geo-timeline-legend"),reports=el("div","sli-geo-timeline-grid");
  const boxes=new Map();
  for(const k of keys){
   const option=el("label","sli-geo-timeline-option"),check=el("input");check.type="checkbox";check.checked=selected.has(k);
   option.append(check,el("span",null,tx(ITEMS[k][0],ITEMS[k][1])));
   check.addEventListener("change",()=>{
    if(check.checked&&mode.value==="single"){
     selected.clear();for(const other of boxes.values())other.checked=false;check.checked=true;
    }
    if(check.checked&&selected.size>=5){check.checked=false;status.textContent=tx("Maximum five lines per chart.","Maksimal lima garis dalam satu grafik.");return}
    if(check.checked)selected.add(k);else selected.delete(k);
    if(!selected.size){check.checked=true;selected.add(k);return}draw();
   });
   boxes.set(k,check);pick.append(option);
  }
  section.append(action,pick,status,chart,legend,reports);
  wrapper.append(section);
  function draw(){
   status.textContent="";
   chart.replaceChildren();legend.replaceChildren();reports.replaceChildren();
   if(!rows.length||!selected.size){chart.append(el("p","sli-geo-timeline-status",tx("No verified series available.","Belum ada seri data yang terverifikasi.")));return}
   const start=Number(year.value),chosenEvents=filteredGeo(),chosenPolitical=filteredPresidencies();
   const keys=[...selected].filter(k=>available.includes(k)).slice(0,5);
   let active=mode.value==="single"?keys.slice(0,1):keys;
   let drawMode=mode.value;
   if(drawMode==="compare"&&new Set(active.map(k=>coverage[k].unit)).size>1){
    drawMode="indexed";mode.value="indexed";
    status.textContent=tx("Different physical units detected; switched to indexed comparison with a common baseline.",
     "Satuan fisik berbeda; otomatis diganti ke perbandingan indeks dengan basis bersama.");
   }
   const raw=active.map(key=>({key,points:seriesFrom(rows,key,start)})).filter(s=>s.points.length);
   if(!raw.length){chart.append(el("p","sli-geo-timeline-status",tx("No published monthly price observations for the selected years.","Belum ada harga bulanan terbit untuk periode yang dipilih.")));return}
   let common=null;
   if(drawMode==="indexed"){
    const m=new Map();
    for(const s of raw)for(const p of s.points)m.set(p.month,(m.get(p.month)||0)+1);
    common=[...m].filter(([key,n])=>n===raw.length).map(([key])=>key).sort()[0]||null;
    if(!common){chart.append(el("p","sli-geo-timeline-status",tx("No overlapping monthly observation for selected commodities.","Tidak ada observasi bulanan yang beririsan untuk komoditas terpilih.")));return}
   }
   const series=raw.map(s=>{
    if(drawMode!=="indexed")return s;
    const base=s.points.find(p=>p.month===common)?.value;
    return {key:s.key,points:s.points.filter(p=>p.month>=common).map(p=>({month:p.month,value:p.value/base*100}))};
   }).filter(s=>s.points.length);
   const last=prices.latest_month||rows.at(-1).month;
   chart.append(graphLines(series,chosenEvents,chosenPolitical,signals,start,last,drawMode==="indexed",activeDate,chooseEvent));
   if(window.SLIVisualExport){
    window.SLIVisualExport.register(chart,{
     getData:()=>{
      const months=[...new Set(raw.flatMap(s=>s.points.map(p=>p.month)))].sort();
      const dict=raw.map(s=>new Map(s.points.map(p=>[p.month,p.value])));
      return {headers:["Month",...raw.map(s=>ITEMS[s.key][0]+" ("+(coverage[s.key]?.unit||"")+")")],
       rows:months.map(m=>[m,...dict.map(map=>map.has(m)?map.get(m):"")]),kind:"verified-provider"};
     },
     getMeta:()=>({source:prices.source,sourceUrl:prices.source_url,
      period:raw[0]?.points[0]?.month+"–"+prices.latest_month,
      completeness:"Full published source observations for selected commodities; raw prices, not visual index values."})
    });
   }

   chart.append(el("p","sli-geo-timeline-meta",drawMode==="indexed"?
    tx("Index base = 100 at the first common observed month: ","Basis indeks = 100 pada bulan pertama yang sama: ")+common+
     tx(". Pre-baseline values are deliberately not plotted.",". Data sebelum basis sengaja tidak diplot."):
    tx("Nominal price units: ","Satuan harga nominal: ")+coverage[series[0].key].unit));
   series.forEach((s,i)=>{
    const item=el("span","sli-geo-timeline-legend-item");
    const swatch=el("i","sli-geo-timeline-swatch");swatch.style.background=PALETTE[i%PALETTE.length];
    const cov=coverage[s.key];item.append(swatch,el("span",null,tx(ITEMS[s.key][0],ITEMS[s.key][1])+" · "+cov.first+"–"+cov.last));
    legend.append(item);
   });
   const focus=raw.find(s=>s.key===series[0].key);
   const stats=eventStats(focus.points,chosenEvents);
   const valid=raw.map(s=>({key:s.key,stats:eventStats(s.points,chosenEvents)}));
   const chosen=activeDate?allHistorical.find(e=>e.date===activeDate):null;
   if(chosen){
    const eventPanel=eventInsight(chosen,raw,coverage,resetEvent);
    const sc=el("article","sli-geo-timeline-scatter");
    sc.append(el("h4",null,tx("Event-month indicator vs monthly returns · ","Indikator kejadian vs perubahan bulanan · ")+tx(ITEMS[focus.key][0],ITEMS[focus.key][1])),scatter(focus.points,chosenEvents));
    reports.append(eventPanel,sc);
    if(window.SLIVisualExport)window.SLIVisualExport.register(sc,{
     getData:()=>({headers:["Month","Price change (% MoM)","Curated event month"],
      rows:returns(focus.points).map(r=>[r.month,r.change,chosenEvents.some(e=>month(e.date)===r.month)?1:0]),kind:"verified-provider"}),
     getMeta:()=>({source:prices.source,sourceUrl:prices.source_url,period:start+"–"+prices.latest_month})
    });

    return;
   }
   const info=el("article","sli-geo-timeline-interpretation");
   const first=valid[0];
   info.append(el("h4",null,tx("SLI analytical note","Catatan analisis SLI")));
   const message=first.stats.r===null?
    tx("The selected event sample has too few overlapping monthly observations to estimate a meaningful Pearson coefficient.",
       "Sampel peristiwa terpilih belum memiliki cukup observasi bulanan yang beririsan untuk menghitung koefisien Pearson yang bermakna."):
    tx(ITEMS[first.key][0],ITEMS[first.key][1])+
     tx(" shows a descriptive event-month Pearson r of "," memiliki korelasi deskriptif Pearson r bulan kejadian sebesar ")+
     fmt(first.stats.r,2)+tx(" across "," dari ")+first.stats.monthly.length+
     tx(" observed monthly returns."," perubahan harga bulanan teramati.");
   info.append(el("p",null,message));
   let second=valid.slice(1).find(x=>x.stats.r!==null);
   info.append(el("p","sli-geo-timeline-caution",second?
    tx("For comparison, ","Sebagai pembanding, ")+tx(ITEMS[second.key][0],ITEMS[second.key][1])+
      " r = "+fmt(second.stats.r,2)+". "+tx("These associations are not causal estimates: demand, policy, inventory and timing also affect prices.",
      "Asosiasi ini bukan perkiraan sebab-akibat: permintaan, kebijakan, persediaan, dan waktu turut memengaruhi harga."):
    tx("Event dates are matched only to their calendar month, without pretending to measure intraday effects or causal direction.",
      "Tanggal peristiwa dicocokkan pada bulan kalender, tanpa mengklaim mengukur dampak harian maupun arah kausalitas.")));
   const sc=el("article","sli-geo-timeline-scatter");
   sc.append(el("h4",null,tx("Monthly return vs event indicator · ","Perubahan bulanan vs indikator kejadian · ")+tx(ITEMS[focus.key][0],ITEMS[focus.key][1])),scatter(focus.points,chosenEvents));
   reports.append(info,sc);
    if(window.SLIVisualExport)window.SLIVisualExport.register(sc,{
     getData:()=>({headers:["Month","Price change (% MoM)","Curated event month"],
      rows:returns(focus.points).map(r=>[r.month,r.change,chosenEvents.some(e=>month(e.date)===r.month)?1:0]),kind:"verified-provider"}),
     getMeta:()=>({source:prices.source,sourceUrl:prices.source_url,period:start+"–"+prices.latest_month})
    });

  }
  mode.addEventListener("change",()=>{
   if(mode.value==="single"){
    const first=[...selected][0];selected.clear();selected.add(first);
    for(const [k,box] of boxes)box.checked=k===first;
   }
   draw();
  });
  contexts.push(draw);
 }
 const note=el("p","sli-geo-timeline-footer");
 note.append(tx("Benchmark dates differ. The 1950s contain geopolitical events, not World Bank monthly price observations. No interpolation, zero-filling, implicit currency conversion or causal inference. ",
 "Tanggal awal setiap acuan berbeda. Periode 1950-an memuat peristiwa geopolitik, bukan observasi harga bulanan World Bank. Tidak dilakukan interpolasi, pengisian nol, konversi mata uang diam-diam, ataupun klaim kausal. "),
 link(prices?.source_url,tx("World Bank Pink Sheet ↗","World Bank Pink Sheet ↗")));
 wrapper.append(note);
 const history=el("section","sli-geo-timeline-panel");history.append(el("h3",null,tx("Geopolitical milestones & Indonesian presidents · 1945–present","Kronologi geopolitik & presiden Indonesia · 1945–sekarang")));
 const list=el("div");history.append(list);wrapper.append(history);
 const news=el("section","sli-geo-timeline-monitoring");
 news.append(el("h3",null,tx("Latest escalation watch · secondary reports","Pemantauan eskalasi terbaru · berita sekunder")),
 el("p","sli-geo-timeline-meta",tx("Updated through SLI's hourly news index. Reported headlines are visually distinct and excluded from statistical event indicators until reviewed.",
 "Diperbarui melalui indeks berita SLI setiap jam. Headline yang dilaporkan diberi penanda berbeda dan dikecualikan dari indikator statistik hingga ditinjau.")));
 for(const report of signals){const item=el("article","sli-geo-timeline-signal");
 item.append(link(report.url,report.title+" ↗"),el("small",null,report.publisher+" · "+report.published_at_utc.slice(0,10)));news.append(item)}
 if(!signals.length)news.append(el("p","sli-geo-timeline-status",tx("No qualifying recent escalations in this feed.","Tidak ada eskalasi terbaru yang cocok pada feed ini.")));
 wrapper.append(news);root.append(wrapper);
 function refresh(){
  if(activeDate&&!visibleEvents().some(e=>e.date===activeDate))activeDate=null;
  updateEventNav();
  for(const render of contexts)render();
  const selected=visibleEvents();
  list.replaceChildren(eventRows(selected,seriesFrom(rows,"brent",Number(year.value)),chooseEvent,activeDate));
 }
 year.addEventListener("change",refresh);kind.addEventListener("change",refresh);showPresidents.addEventListener("change",refresh);
 refresh();
}
async function init(){
 const root=document.getElementById(ROOT);if(!root)return;
 root.replaceChildren(el("p","sli-geo-timeline-status",tx("Loading verified benchmarks…","Memuat acuan harga terverifikasi…")));
 const fetched=await Promise.allSettled([parse(URLS.events),parse(URLS.prices),parse(URLS.news)]);
 if(!root.isConnected)return;
 const events=fetched[0].status==="fulfilled"?(fetched[0].value.events||[]):[];
 const presidencies=fetched[0].status==="fulfilled"?(fetched[0].value.presidential_transitions||[]):[];
 const prices=fetched[1].status==="fulfilled"?fetched[1].value:null;
 const news=fetched[2].status==="fulfilled"?fetched[2].value:null;
 if(!events.length){root.replaceChildren(el("p","sli-geo-timeline-status",tx("Historical event register is unavailable.","Registri peristiwa historis tidak tersedia.")));return}
 initPanels(root,prices,events,latestSignals(news),presidencies);
}
window.SLIGeoTimelineCompute={seriesFrom,pearson,eventStats,returns};
window.initSLIGeopoliticalTimeline=init;
})();