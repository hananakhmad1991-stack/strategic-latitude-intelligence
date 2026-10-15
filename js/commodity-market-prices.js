/* Strategic Latitude Intelligence — market prices with transparent quote provenance.
   Repository snapshots refresh every 30 min; browser checks every 3 min.
   Not a licensed LME feed, not executable real-time trading quotes. */
(function(){
"use strict";
const SOURCE="https://raw.githubusercontent.com/hananakhmad1991-stack/strategic-latitude-intelligence/main/data/commodity-market-prices.json";
const FALLBACK="data/commodity-market-prices.json";
const POLL=180000;
const meta={
 minerals:{en:"Critical Minerals · Commodity Price Monitor",id:"Mineral Kritis · Monitor Harga Komoditas"},
 energy:{en:"Energy & Bioenergy · Commodity Price Monitor",id:"Energi & Bioenergi · Monitor Harga Komoditas"}
};
const LABELS={
 brent_future:["Brent crude futures","Kontrak minyak Brent"],wti_future:["WTI crude futures","Kontrak minyak WTI"],
 natural_gas_future:["Henry Hub gas futures","Kontrak gas Henry Hub"],
 copper_future:["Copper futures · COMEX","Kontrak tembaga · COMEX"],
 gold_future:["Gold futures","Kontrak emas"],silver_future:["Silver futures","Kontrak perak"],
 nickel:["Nickel · monthly","Nikel · bulanan"],copper_monthly:["Copper · monthly","Tembaga · bulanan"],
 aluminium:["Aluminium · monthly","Aluminium · bulanan"],tin:["Tin · monthly","Timah · bulanan"],
 coal_australia:["Coal · Australia monthly","Batubara Australia · bulanan"],
 palm_oil:["Palm oil · monthly","Minyak sawit · bulanan"]
};
let running=null,interval=null;
function lang(en,id){return window.SLIi18n?.language==="id"?id:en}
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined&&txt!==null)e.textContent=String(txt);return e}
const valid=x=>typeof x==="number"&&Number.isFinite(x)&&x>0;
const date=x=>{const d=new Date(x||"");return Number.isFinite(d.getTime())?d:null};
const age=x=>{const d=date(x);return d?Math.max(0,Date.now()-d.getTime()):Infinity};
function format(n){return Number(n).toLocaleString(window.SLIi18n?.language==="id"?"id-ID":"en-US",{maximumFractionDigits:3,minimumFractionDigits:n<10?2:0})}
function zoned(x){
 const d=date(x);if(!d)return lang("Not available","Tidak tersedia");
 return new Intl.DateTimeFormat(window.SLIi18n?.language==="id"?"id-ID":"en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(d)+" WIB";
}
function quoteState(x){
 if(!valid(x?.value))return {name:"unavailable",label:lang("Unavailable","Tidak tersedia")};
 const gap=age(x.observed_at_utc);
 if(x.tier==="monthly_reference")return {name:"monthly",label:lang("MONTHLY REFERENCE","ACUAN BULANAN")};
 if(gap>72*3600000 || x.availability==="last_good_source_unavailable")
  return {name:"stale",label:lang("STALE / MARKET CLOSED","LAMA / PASAR TUTUP")};
 return {name:"indicative",label:lang("INDICATIVE · MAY BE DELAYED","INDIKATIF · BISA TERTUNDA")};
}
function link(url,txt){const a=el("a",null,txt);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a}
function chart(root,q){
 root.replaceChildren();
 const title=el("div","cp-chart-title");
 const h=el("h4",null,(LABELS[q.id]?.[window.SLIi18n?.language==="id"?1:0]||q.name));title.append(h,el("small",null,q.unit));
 root.append(title);
 const data=(q.history||[]).filter(x=>valid(x.value)&&date(x.observed_at_utc));
 if(data.length<2){root.append(el("p","cp-muted",lang("Not enough dated observations for history.","Belum ada cukup observasi bertanggal.")));return}
 const W=700,H=235,L=68,R=22,T=15,B=37;const values=data.map(x=>x.value);
 const low=Math.min(...values),high=Math.max(...values),pad=(high-low||Math.abs(high)*.04||1)*.14;
 const mn=low-pad,mx=high+pad;
 const pt=(x,i)=>[L+i*(W-L-R)/(data.length-1),T+(H-T-B)*(1-(x.value-mn)/(mx-mn))];
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 700 235");svg.setAttribute("role","img");svg.setAttribute("aria-label",lang("Dated historical price chart, not live ticks","Grafik harga historis bertanggal, bukan tick realtime"));svg.classList.add("cp-spark");
 for(let i=0;i<=4;i++){
  const y=T+(H-T-B)*i/4;
  const li=document.createElementNS(svg.namespaceURI,"line");for(const [k,v] of Object.entries({x1:L,x2:W-R,y1:y,y2:y,stroke:"#395569","stroke-width":"1"}))li.setAttribute(k,v);svg.append(li);
  const text=document.createElementNS(svg.namespaceURI,"text");for(const [k,v] of Object.entries({x:L-9,y:y+4,fill:"#a2b9c9","text-anchor":"end","font-size":"11"}))text.setAttribute(k,v);
  text.textContent=format(mx-(mx-mn)*i/4);svg.append(text);
 }
 const shape=document.createElementNS(svg.namespaceURI,"polyline");shape.setAttribute("points",data.map((x,i)=>pt(x,i).join(",")).join(" "));shape.setAttribute("fill","none");shape.setAttribute("stroke","#d2ad69");shape.setAttribute("stroke-width","2.7");shape.setAttribute("stroke-linejoin","round");shape.setAttribute("stroke-linecap","round");svg.append(shape);
 for(const i of [0,data.length-1]){
  const d=data[i],a=document.createElementNS(svg.namespaceURI,"text");a.setAttribute("x",pt(d,i)[0]);a.setAttribute("y",H-8);a.setAttribute("font-size","11");a.setAttribute("fill","#a6c1d4");a.setAttribute("text-anchor",i?"end":"start");a.textContent=d.observed_at_utc.slice(0,10);svg.append(a);
 }
 const tip=el("p","cp-muted",lang("Historical dates and units retained. Prices from separate markets are not interchangeable.","Tanggal dan satuan historis dipertahankan. Harga berbagai pasar tidak setara."));
 root.append(svg,tip);
}
function card(q,onSelect){
 const node=el("button","cp-quote-card");node.type="button";
 node.dataset.quoteId=q.id;
 const status=quoteState(q),head=el("div","cp-card-head");
 head.append(el("span",null,LABELS[q.id]?.[window.SLIi18n?.language==="id"?1:0]||q.name),el("small","cp-state cp-"+status.name,status.label));
 node.append(head,el("strong","cp-big",valid(q.value)?format(q.value):"—"),
  el("div","cp-unit",q.unit));
 if(q.change_percent!=null&&Number.isFinite(q.change_percent)){
  const signed=(q.change_percent>=0?"+":"")+q.change_percent.toFixed(2)+"%";
  node.append(el("span","cp-delta "+(q.change_percent>=0?"cp-up":"cp-down"),signed+" · "+lang(q.tier==="monthly_reference"?"MoM":"vs previous","vs sebelumnya")));
 }
 node.append(el("small","cp-observed",q.tier==="monthly_reference"?
   lang("Period: ","Periode: ")+(q.observation_period||q.observed_at_utc.slice(0,7)):
   lang("Quote time: ","Waktu kuotasi: ")+zoned(q.observed_at_utc)));
 node.addEventListener("click",()=>onSelect(q));
 return node;
}
function explainStatus(data){
 if(!data?.checked_at_utc)return lang("Awaiting first published snapshot","Menunggu snapshot pertama");
 const elapsed=age(data.checked_at_utc);
 const sync=zoned(data.checked_at_utc);
 return lang("Collection check: ","Cek pengambilan: ")+sync+" · "+(elapsed<3600000?lang("recently checked","baru dicek"):lang("delayed collection","pemindaian terlambat"));
}
async function getLatest(){
 const suffix="?v="+Math.floor(Date.now()/POLL);let last=null;
 for(const url of [SOURCE,FALLBACK]){
  try{
   const res=await fetch(url+suffix,{cache:"no-store"});
   if(!res.ok)throw Error("HTTP "+res.status);
   const data=await res.json();
   if(!Array.isArray(data.quotes)||data.schema_version!==1)throw Error("Invalid data schema");
   return data;
  }catch(e){last=e}
 }
 throw last||Error("No public data");
}
async function update(root,sector){
 if(!root?.isConnected)return;
 const status=root.querySelector(".cp-status"),main=root.querySelector(".cp-groups"),graphs=root.querySelector(".cp-graph"),official=root.querySelector(".cp-official");
 if(!main||!status)return;
 status.textContent=lang("Checking published market snapshot…","Memeriksa snapshot pasar…");
 try{
  const d=await getLatest();
  if(!root.isConnected||running?.root!==root)return;
  status.textContent=explainStatus(d)+" · "+(d.quotes||[]).filter(x=>x.sector===sector).length+" "+lang("available observations","observasi tersedia");
  main.replaceChildren();official.replaceChildren();graphs.replaceChildren();
  const selection=(d.quotes||[]).filter(x=>x.sector===sector&&valid(x.value));
  for(const [tier,label] of [["indicative_futures",lang("INDICATIVE FUTURES · NOT LIVE LME","KONTRAK FUTURES INDIKATIF · BUKAN LME LIVE")],["monthly_reference",lang("IMF / FRED · MONTHLY PRICE BENCHMARKS","IMF / FRED · HARGA ACUAN BULANAN")]]){
   const group=selection.filter(x=>x.tier===tier);
   const section=el("section","cp-series-group");
   section.append(el("h4",null,label));
   const grid=el("div","cp-grid");
   for(const q of group)grid.append(card(q,x=>{for(const e of main.querySelectorAll(".cp-quote-card"))e.setAttribute("aria-pressed",String(e.dataset.quoteId===x.id));chart(graphs,x)}));
   if(!group.length)section.append(el("p","cp-muted",lang("Source unavailable; no price inferred.","Sumber belum tersedia; tidak ada harga perkiraan.")));
   section.append(grid);main.append(section);
  }
  if(selection.length)chart(graphs,selection[0]);
  else graphs.append(el("p","cp-muted",lang("No verified dated prices were downloaded. See source links for market data.","Harga bertanggal belum berhasil diambil. Periksa tautan sumber.")));
  if(sector==="energy"){
   const ref=el("div","cp-reference");ref.append(el("h4",null,lang("INDONESIAN OFFICIAL REFERENCE PRICES","HARGA ACUAN RESMI INDONESIA")));
   for(const x of d.official_indonesia_reference||[]){
    const row=el("p",null);row.append(link(x.url,x.title+" ↗"),document.createTextNode(" · "+x.period+" · "+lang("Official decree, not market futures","Keputusan resmi, bukan futures pasar")));ref.append(row);
   }
   official.append(ref);
  }else{
   const row=el("p","cp-muted",lang("For Indonesian HMA (metal reference prices), check the commodity-specific ESDM decree: ","Untuk HMA Indonesia, lihat keputusan ESDM per komoditas: "));
   row.append(link("https://jdih.esdm.go.id/",lang("ESDM JDIH ↗","JDIH ESDM ↗")));official.append(row);
  }
  const note=root.querySelector(".cp-errors");
  if(note){
   const unavailable=Object.keys(d.errors||{});note.textContent=(unavailable.length?unavailable.length+" "+lang("sources unavailable; ","sumber gagal; "):"")+
   lang("Delayed feeds; last-good fallback preserves original quote date. No source is labelled live unless licensed.",
        "Umpan dapat terlambat; data terakhir mempertahankan tanggal harga asli. Tidak ada sumber dianggap live tanpa lisensi.");
  }
 }catch(e){
  status.textContent=lang("Price feed unavailable · no invented quotes","Umpan harga tidak tersedia · tidak ada harga rekaan");
  main.replaceChildren(el("p","cp-muted",lang("The public source snapshot could not be loaded.","Snapshot sumber publik gagal dimuat.")));
 }
}
function mount(target,sector){
 const mountEl=typeof target==="string"?document.getElementById(target):target;
 if(!mountEl||!meta[sector])return;
 if(interval){clearInterval(interval);interval=null}
 mountEl.replaceChildren();
 const root=el("section","sli-commodity-prices");root.id="sli-commodity-"+sector;
 const header=el("div","cp-header"),title=el("div");
 title.append(el("small","cp-kicker","STRATEGIC LATITUDE · MARKET INTELLIGENCE"),el("h3",null,lang(meta[sector].en,meta[sector].id)));
 const button=el("button","cp-refresh",lang("Refresh snapshot ↻","Segarkan snapshot ↻"));button.type="button";button.addEventListener("click",()=>update(root,sector));
 header.append(title,button);
 root.append(header,el("p","cp-status",lang("Loading…","Memuat…")),
  el("p","cp-intro",lang("Quote values refresh after collector publication; most are delayed futures, while IMF reference prices are monthly. No proprietary live exchange data is redistributed.",
    "Nilai diperbarui setelah publikasi pengumpul data; sebagian adalah futures tertunda, sementara acuan IMF bersifat bulanan. Bukan data live bursa berlisensi.")),
  el("div","cp-groups"),el("div","cp-graph"),el("div","cp-official"),el("p","cp-errors"));
 mountEl.append(root);
 running={root,sector};update(root,sector);
 interval=setInterval(()=>{if(root.isConnected&&running?.root===root)update(root,sector);else{clearInterval(interval);interval=null}},POLL);
}
window.initSLICommodityPrices=mount;
window.SLICommodityPriceHelpers={quoteState,format};
})();
