/* SLI homepage · provider-owned IHSG quote/chart + source-attributed IDX issuer news.
   IDX quotes are NEVER copied out of TradingView; free public widgets may be delayed.
   News is a headline reference, not an independently verified financial disclosure. */
(()=>{"use strict";
const PRICE_WIDGET="https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
const NEWS_WIDGET="https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
const PRICE_SOURCE="https://id.tradingview.com/symbols/IDX-COMPOSITE/";
const SECTORS=[["all","All SLI sectors","Semua sektor SLI"],["energy","Energy","Energi"],["minerals","Minerals","Mineral"],["coal","Coal","Batu bara"],["food","Food & agriculture","Pangan & pertanian"],["technology","Digital & technology","Digital & teknologi"],["infrastructure","Infrastructure","Infrastruktur"],["transport","Transport","Transportasi"],["manufacturing","Manufacturing","Manufaktur"]];
const E=(tag,cls,value)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=String(value);return x};
const lang=()=>document.documentElement.lang?.toLowerCase().startsWith("id");
const T=(en,id)=>lang()?id:en;
const safe=url=>{try{const u=new URL(url,location.href);return u.protocol==="https:"&&!u.username&&!u.password?u.href:null}catch{return null}};
const link=(url,label)=>{const a=E("a",null,label);a.href=url;a.target="_blank";a.rel="noopener noreferrer nofollow";return a};
const issuerLink=code=>"./sli-issuer.html?ticker="+encodeURIComponent(code);
const time=iso=>{if(!iso)return null;const d=new Date(iso);return Number.isFinite(d.getTime())?d:null};
const stamp=iso=>{const d=time(iso);return d?d.toLocaleString(lang()?"id-ID":"en-GB",{timeZone:"Asia/Jakarta",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"} )+" WIB":T("Unverified time","Waktu tidak tersedia")};
const pct=(a,b)=>Math.floor(a/b*100);
let catalog=[],articles=[],snapshot=null,selectedSector="all",selectedTicker="all",loaded=false,pending=false,heartbeat=null,newsWidgetTicker=null;
function widget(host,url,config,credit){
 host.replaceChildren();
 const frame=E("div","sli-market-tv-frame tradingview-widget-container");
 frame.append(E("div","tradingview-widget-container__widget"));
 const script=E("script");script.type="text/javascript";script.src=url;script.async=true;script.textContent=JSON.stringify(config);
 frame.append(script);
 const c=E("div","tradingview-widget-copyright");
 c.append(link(credit.url,credit.text));frame.append(c);host.append(frame);
}
function chartOptions(){
 return {symbols:[["IHSG","IDX:COMPOSITE|1D"]],chartOnly:false,autosize:true,width:"100%",height:"100%",
 colorTheme:"dark",isTransparent:true,locale:lang()?"id":"en",dateRanges:["1d|1","5d|5","1m|30","3m|60","12m|1D","all|1M"],
 chartType:"area",lineWidth:2,lineType:0,changeMode:"price-and-percent",valuesTracking:"1",
 hideDateRanges:false,hideMarketStatus:false,hideSymbolLogo:false,noTimeScale:false,
 scalePosition:"right",fontColor:"#c7d7e3",gridLineColor:"rgba(80,115,143,.15)",backgroundColor:"#10273b"};
}
function paintIHSG(){
 const root=document.getElementById("sliHomeIHSG");if(!root)return;
 root.replaceChildren();
 const head=E("div","sli-home-market-head");
 const left=E("div");left.append(E("span","sli-home-market-kicker","IDX · COMPOSITE"),
 E("h3",null,T("IHSG · Indonesian Stock Market","IHSG · Pasar Saham Indonesia")),
 E("p",null,T("Latest index value, daily change and historical chart are shown inside TradingView's official market widget.",
 "Nilai indeks terkini, perubahan harian, dan grafik historis ditampilkan langsung melalui widget resmi TradingView.")));
 head.append(left,link(PRICE_SOURCE,T("Open full IHSG chart ↗","Buka grafik IHSG ↗")));
 root.append(head);
 const layout=E("div","sli-home-ihsg-layout"),frame=E("div","sli-home-ihsg-chart");frame.id="sliHomeIHSGChart";
 const aside=E("aside","sli-home-ihsg-note");
 aside.append(E("span","sli-home-market-kicker",T("MARKET DATA POLICY","KEBIJAKAN DATA PASAR")),
 E("strong",null,T("Auto-updated by the provider","Diperbarui otomatis oleh penyedia")),
 E("p",null,T("IDX free widgets can be delayed by around 10 minutes. This is not an exchange-authorized real-time redistribution feed.",
 "Widget publik BEI dapat tertunda sekitar 10 menit. Ini bukan feed redistribusi realtime berlisensi dari bursa.")),
 E("p",null,T("During market closure, the widget may show the last available session. The index quote is not estimated by SLI.",
 "Saat bursa tutup, widget dapat menampilkan data sesi terakhir. SLI tidak mengestimasi nilai IHSG.")),
 link("https://www.tradingview.com/data-coverage/",T("Verify feed delays ↗","Periksa jeda data ↗")));
 layout.append(frame,aside);root.append(layout);
 widget(frame,PRICE_WIDGET,chartOptions(),{url:PRICE_SOURCE,text:"IHSG · TradingView ↗"});
}
function norm(str){return String(str||"").toLowerCase().replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim()}
function mentions(row,issuer){
 if(Array.isArray(row.tickers)&&row.tickers.includes(issuer.ticker))return true;
 const title=String(row.title||"");
 const code=issuer.ticker;
 // Standalone ticker or explicit IDX:CODE; never infer ticker from article sector alone.
 if(!["AUTO","SHIP","BIRD","GOTO","ESSA","UNVR","WINS","GEMS"].includes(code)&&new RegExp("(^|[^A-Za-z0-9])"+code+"(?=$|[^A-Za-z0-9])","i").test(title))return true;
 const name=String(issuer.name||"").trim();
 return name.length>=8&&norm(title).includes(norm(name));
}
function issuerTags(item){
 if(Array.isArray(item.tickers))return item.tickers.filter(t=>catalog.some(r=>r.ticker===t));
 return catalog.filter(i=>mentions(item,i)).map(i=>i.ticker);
}
function sectorRows(){return catalog.filter(i=>selectedSector==="all"||i.sector===selectedSector)}
function updateTickerChoices(){
 const picker=document.getElementById("sliHomeIssuerTicker");if(!picker)return;
 const old=selectedTicker;picker.replaceChildren();
 const all=E("option",null,T("All issuers","Semua emiten"));all.value="all";picker.append(all);
 for(const issuer of sectorRows().sort((a,b)=>a.ticker.localeCompare(b.ticker))){
  const option=E("option",null,issuer.ticker+" · "+issuer.name);option.value=issuer.ticker;picker.append(option);
 }
 selectedTicker=old==="all"||sectorRows().some(x=>x.ticker===old)?old:"all";picker.value=selectedTicker;
}
function newsProviderTicker(){
 const preferred=["ANTM","TLKM","MEDC","PTBA","INDF","JSMR","SMDR","UNTR"];
 if(selectedTicker!=="all")return selectedTicker;
 const available=new Set(sectorRows().map(x=>x.ticker));
 return preferred.find(t=>available.has(t))||sectorRows()[0]?.ticker||null;
}
function paintProviderNews(){
 const host=document.getElementById("sliHomeIssuerProvider"),name=document.getElementById("sliHomeIssuerProviderLabel");if(!host||!name)return;
 const ticker=newsProviderTicker();
 name.textContent=ticker?T("TradingView · "+ticker+" company stories","Berita emiten "+ticker+" · TradingView"):T("No symbol","Tidak ada kode");
 if(newsWidgetTicker===ticker&&host.querySelector("script"))return;
 newsWidgetTicker=ticker;
 if(!ticker){host.replaceChildren(E("p",null,T("No IDX symbol available","Tidak ada kode saham BEI")));return}
 widget(host,NEWS_WIDGET,{feedMode:"symbol",symbol:"IDX:"+ticker,displayMode:"regular",colorTheme:"dark",isTransparent:true,
  locale:lang()?"id":"en",width:"100%",height:"100%"},
 {url:"https://www.tradingview.com/symbols/IDX-"+ticker+"/news/",text:"TradingView · "+ticker+" ↗"});
}
function parseFeeds(docs){
 const all=[],seen=new Set();
 for(const doc of docs){
  const rows=Array.isArray(doc?.articles)?doc.articles:[];
  for(const r of rows){
   if(!r||typeof r.title!=="string"||!safe(r.url)||!time(r.published_at_utc))continue;
   const tickers=issuerTags(r);
   if(!tickers.length)continue;
   const title=r.title.trim().replace(/\s+-\s+[^-]{3,60}$/,"");
   const key=norm(title).replace(/[^\p{L}\p{N}]+/gu," ").trim();
   if(seen.has(key))continue;
   seen.add(key);all.push({...r,tickers});
  }
 }
 return all.sort((a,b)=>Date.parse(b.published_at_utc)-Date.parse(a.published_at_utc));
}
function paintArticles(){
 const root=document.getElementById("sliHomeIssuerArticles"),meta=document.getElementById("sliHomeIssuerStatus");
 if(!root||!meta)return;
 const issuerSector=new Map(catalog.map(i=>[i.ticker,i.sector]));
 const chosen=articles.filter(x=>x.tickers.some(code=>(selectedTicker==="all"||code===selectedTicker)&&(selectedSector==="all"||issuerSector.get(code)===selectedSector)));
 root.replaceChildren();
 const age=snapshot&&time(snapshot.updated_at_utc)?Date.now()-time(snapshot.updated_at_utc).getTime():Infinity;
 const state=snapshot&&age<2*3600000?T("Latest archive","Arsip terkini"):T("Archive may be stale","Arsip mungkin terlambat");
 meta.textContent=T("Matched company headlines: "+chosen.length+" · "+state+" · Last scan ","Berita emiten cocok: "+chosen.length+" · "+state+" · Pemindaian terakhir ")+stamp(snapshot?.updated_at_utc);
 if(!chosen.length){root.append(E("p","sli-home-news-empty",T("No source-attributed issuer headline matched this filter. This does not mean that no event occurred. Open the issuer's exchange disclosure or the news source for a fuller check.","Belum ada judul berita emiten teratribusi yang cocok dengan filter. Ini bukan berarti tidak ada peristiwa. Periksa keterbukaan informasi BEI atau sumber berita.")));return}
 for(const item of chosen.slice(0,12)){
  const a=E("article","sli-home-issuer-story");
  const heading=E("h4");heading.append(link(safe(item.url),item.title));a.append(heading);
  const codes=item.tickers.filter(code=>selectedSector==="all"||issuerSector.get(code)===selectedSector);
  const bar=E("div","sli-home-issuer-story-meta");
  bar.append(E("span",null,String(item.publisher||T("Publisher","Penerbit"))+" · "+stamp(item.published_at_utc)));
  for(const code of codes.slice(0,3)){const b=E("a","sli-home-issuer-tag",code);b.href=issuerLink(code);bar.append(b)}
  a.append(bar);root.append(a);
 }
}
async function requestJSON(url){
 const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);
 return r.json();
}
async function refresh(){
 const root=document.getElementById("sliHomeIssuerNews");if(!root||pending)return;
 pending=true;
 try{
  const [newFeed,archive]=await Promise.allSettled([
   requestJSON("./data/sli-issuer-news.json"),
   requestJSON("./data/sli-secondary-news-index.json")
  ]);
  const docs=[];
  if(newFeed.status==="fulfilled"&&newFeed.value.schema==="sli-issuer-news-v1")docs.push(newFeed.value);
  if(archive.status==="fulfilled"&&Array.isArray(archive.value.articles))docs.push(archive.value);
  if(!docs.length)throw Error("No attributed news source");
  articles=parseFeeds(docs);
  snapshot=docs.reduce((a,b)=>time(b.updated_at_utc)>time(a?.updated_at_utc)?b:a,null);
  loaded=true;paintArticles();
 }catch{
  const status=document.getElementById("sliHomeIssuerStatus");
  if(status)status.textContent=loaded?T("Could not refresh; keeping last source-attributed headlines.","Pembaruan gagal; berita teratribusi sebelumnya tetap ditampilkan."):
  T("Issuer headlines unavailable; no simulated headlines are shown.","Berita emiten belum tersedia; tidak ada berita simulasi.");
 }finally{pending=false}
}
async function loadCatalog(){
 const r=await requestJSON("./data/sli-idx-issuer-universe.json");
 if(r.schema!=="sli-idx-issuer-universe-v1"||!Array.isArray(r.records))throw Error("Invalid issuer catalog");
 catalog=r.records.filter(x=>x.exchange==="IDX"&&/^[A-Z0-9]{4}$/.test(x.ticker||"")&&x.name&&SECTORS.some(s=>s[0]===x.sector));
}
async function paintNews(){
 const root=document.getElementById("sliHomeIssuerNews");if(!root)return;
 root.replaceChildren();
 const header=E("div","sli-home-market-head"),intro=E("div");
 intro.append(E("span","sli-home-market-kicker","SLI · ISSUER MONITOR"),
 E("h3",null,T("Strategic IDX Issuer News Monitor","Monitoring Berita Emiten Strategis")),
 E("p",null,T("Publisher-attributed headlines linked to IDX issuers in SLI's strategic-sector catalogue. Automated scans are not verified company disclosures.",
 "Judul berita teratribusi penerbit yang terkait emiten dalam katalog sektor strategis SLI. Pemindaian otomatis bukan pengganti keterbukaan informasi resmi.")));
 header.append(intro,link("https://www.idx.co.id/id/perusahaan-tercatat/keterbukaan-informasi/",T("IDX disclosures ↗","Keterbukaan informasi BEI ↗")));root.append(header);
 const filters=E("div","sli-home-news-controls");
 const secLabel=E("label");secLabel.append(E("span",null,T("Sector","Sektor")));
 const sec=E("select");sec.id="sliHomeIssuerSector";
 for(const [value,en,id]of SECTORS){const o=E("option",null,T(en,id));o.value=value;sec.append(o)}
 sec.value=selectedSector;sec.addEventListener("change",()=>{selectedSector=sec.value;updateTickerChoices();paintProviderNews();paintArticles()});secLabel.append(sec);
 const issLabel=E("label");issLabel.append(E("span",null,T("Ticker","Kode emiten")));
 const ticker=E("select");ticker.id="sliHomeIssuerTicker";ticker.addEventListener("change",()=>{selectedTicker=ticker.value;paintProviderNews();paintArticles()});issLabel.append(ticker);
 const refreshButton=E("button",null,T("Refresh headlines","Perbarui berita"));refreshButton.type="button";refreshButton.addEventListener("click",refresh);
 filters.append(secLabel,issLabel,refreshButton);root.append(filters);
 const status=E("p","sli-home-news-status",T("Loading attributed headlines…","Memuat berita teratribusi…"));status.id="sliHomeIssuerStatus";status.setAttribute("role","status");root.append(status);
 const grid=E("div","sli-home-news-grid"),stories=E("section","sli-home-news-stories");
 stories.id="sliHomeIssuerArticles";grid.append(stories);
 const provider=E("aside","sli-home-news-provider"),providerHeading=E("h4",null);providerHeading.id="sliHomeIssuerProviderLabel";
 provider.append(providerHeading);
 const feed=E("div","sli-home-news-provider-widget");feed.id="sliHomeIssuerProvider";provider.append(feed);
 provider.append(E("p","sli-home-news-provider-note",T("Provider stories for one selected ticker. Coverage may vary by symbol; no headlines are invented when unavailable.",
 "Berita penyedia untuk satu kode terpilih. Cakupan bisa berbeda per emiten; tidak ada judul buatan saat sumber tidak tersedia.")));
 grid.append(provider);root.append(grid);
 root.append(E("p","sli-home-news-footnote",T("News timestamps are the publisher's reported times (WIB). Scanner refresh depends on its scheduler; the page checks the published index every five minutes while open. Headlines are secondary leads, not independently confirmed facts or investment recommendations.",
 "Waktu berita mengikuti informasi penerbit (WIB). Pembaruan arsip bergantung penjadwal; halaman memeriksa indeks tiap lima menit saat dibuka. Judul berita merupakan petunjuk sekunder, bukan fakta terverifikasi maupun rekomendasi investasi.")));
 try{if(!catalog.length)await loadCatalog();if(!root.isConnected)return;updateTickerChoices();paintProviderNews();await refresh()}
 catch(err){console.warn("[SLI issuer news]",err);status.textContent=T("Ticker register or news unavailable. No market/news values were fabricated.","Katalog emiten atau berita belum tersedia. Tidak ada angka atau berita buatan.")}
 if(!heartbeat)heartbeat=setInterval(()=>{if(document.getElementById("sliHomeIssuerNews"))refresh()},300000);
}
function mount(){paintIHSG();paintNews()}
window.initSLIHomeMarketNews=mount;
document.addEventListener("sli:languagechange",()=>{if(document.getElementById("sliHomeIHSG"))mount()});
})();