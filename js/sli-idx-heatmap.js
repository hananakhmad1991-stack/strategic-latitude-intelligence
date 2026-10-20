/* SLI IDX & IHSG watch universe: source-bound homepage equity heatmap, not a price simulator.
 * IDX ticker identity -> existing SLI Entity Intelligence key (ticker query + candidate hash).
 * Price, color and size never invented; licensed EOD quote feed is optional and must pass gates.
 */
(()=>{"use strict";
const ROOT="sliHomeIDXHeatmap", universeURL="./data/sli-idx-issuer-universe.json",
 feedURL="./data/sli-idx-market-snapshot.json";
const sectorDefs=[
 ["energy","Energy & transition","Energi & transisi"],
 ["minerals","Metals & minerals","Logam & mineral"],
 ["coal","Coal & mining","Batu bara & tambang"],
 ["food","Food & agriculture","Pangan & pertanian"],
 ["technology","Digital & technology","Digital & teknologi"],
 ["infrastructure","Infrastructure","Infrastruktur"],
 ["transport","Logistics & transport","Logistik & transportasi"],
 ["manufacturing","Strategic manufacturing","Industri strategis"]
];
const allowed=new Set(sectorDefs.map(x=>x[0]));
const $=(id)=>document.getElementById(id);
const language=()=>document.documentElement?.lang==="id"||window.SLIi18n?.language==="id";
const tr=(a,b)=>language()?b:a;
const text=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e};
const href=(url,label,external)=>{const a=text("a",null,label);a.href=url;if(external){a.target="_blank";a.rel="noopener noreferrer"}return a};
const safe=(url)=>{try{const x=new URL(url);return x.protocol==="https:"&&!x.username&&!x.password?x.href:null}catch{return null}};
const tickerURL=t=>"./sli-issuer.html?ticker="+encodeURIComponent(t);
const tradingView=t=>"https://www.tradingview.com/symbols/IDX-"+encodeURIComponent(t)+"/";
const sectorText=k=>{const s=sectorDefs.find(v=>v[0]===k);return s?tr(s[1],s[2]):k};
const fmt=(n,max=1)=>new Intl.NumberFormat(language()?"id-ID":"en-US",{maximumFractionDigits:max,minimumFractionDigits:max}).format(n);
const VALID_TICKER=/^[A-Z0-9]{4}$/;
let original=[],feed=new Map(),feedInfo=null,selected="MEDC",activeSector="energy",query="",validQuotes=false;
let cached=null,fetching=null,epoch=0;
function uniqueSorted(rows){
 const unique=new Map();
 for(const x of rows){if(x?.exchange==="IDX"&&VALID_TICKER.test(x.ticker||"")&&allowed.has(x.sector)&&typeof x.name==="string"&&x.name.trim()&&!unique.has(x.ticker))
   unique.set(x.ticker,{...x});}
 return [...unique.values()].sort((a,b)=>a.sector.localeCompare(b.sector)||a.ticker.localeCompare(b.ticker));
}
function parseMarket(data,universe){
 const result=new Map(),status={active:false,message:"missing_verified_rights_or_quotes",date:null,publisher:null};
 if(!data||data.schema!=="sli-idx-market-snapshot-v1"||data.market!=="IDX"||data.currency!=="IDR"||
 data.redistribution_permitted!==true||data.license_status!=="redistribution_approved"||
 !safe(data.provider_url)||!data.provider||!/^\d{4}-\d{2}-\d{2}$/.test(data.snapshot_date||"")||
 !Array.isArray(data.quotes))return {quotes:result,status};
 const members=new Set(universe.map(r=>r.ticker)),sourceDate=data.snapshot_date;
 for(const p of data.quotes){
  if(!VALID_TICKER.test(p?.ticker||"")||!members.has(p.ticker)||result.has(p.ticker))continue;
  const close=Number(p.close_idr),previous=Number(p.previous_close_idr),cap=p.market_cap_idr;
  if(p.observed_date!==sourceDate||!safe(p.source_url)||!Number.isFinite(close)||close<=0||
    !Number.isFinite(previous)||previous<=0||typeof p.close_idr!=="number"||
    typeof p.previous_close_idr!=="number"||(cap!==null&&cap!==undefined&&
    (typeof cap!=="number"||!Number.isFinite(cap)||cap<=0)))continue;
  const rawChange=(close-previous)/previous*100;
  if(Math.abs(rawChange)>2000)continue; // defensively reject malformed units / obvious outliers
  if(typeof p.change_pct==="number"&&Math.abs(p.change_pct-rawChange)>0.05)continue;
  result.set(p.ticker,{close,previous,change:rawChange,marketCap:Number.isFinite(cap)&&cap>0?cap:null,source_url:p.source_url,date:sourceDate});
 }
 status.active=result.size>0;status.message=result.size?"licensed_eod_prices":"provider_feed_has_no_valid_quotes";
 status.date=sourceDate;status.publisher=data.provider;
 return {quotes:result,status};
}
function tileArea(n,group){
 // Fair layout: equal-sized tiles unless all visible securities have dated source-linked cap.
 const capOk=group.every(r=>Number.isFinite(feed.get(r.ticker)?.marketCap)&&feed.get(r.ticker).marketCap>0);
 if(!capOk)return 1;
 const max=Math.max(...group.map(r=>feed.get(r.ticker).marketCap));
 const scaled=Math.sqrt(feed.get(n.ticker).marketCap/max);
 return Math.max(1,Math.min(4,Math.round(scaled*4)));
}
function view(){
 const root=$(ROOT);if(!root)return;
 root.replaceChildren();const filtered=original.filter(x=>(activeSector==="all"||x.sector===activeSector)&&
 (!query||[x.ticker,x.name,x.sector].join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase())));
 if(!filtered.some(x=>x.ticker===selected))selected=filtered[0]?.ticker||"";
 const head=text("div","sli-idx-head");
 const meta=text("div");meta.append(text("span","sli-idx-eyebrow",tr("IDX / INDONESIAN LISTED ISSUER MAP","BEI / PETA EMITEN INDONESIA")),
 text("h3",null,tr("SLI IDX Watchlist & Entity Map","Watchlist IDX & Peta Emiten SLI")));
 meta.append(text("p",null,tr("Selected BEI/IDX issuer universe with direct links to sourced SLI company dossiers. This is not an official IHSG constituent list.",
 "Watchlist pasar TradingView menampilkan pergerakan merah/hijau, sedangkan peta SLI menyediakan 178 kode saham dengan tautan ke profil perusahaan masing-masing. Bukan daftar resmi konstituen IHSG.")));
 const anchor=href("https://www.tradingview.com/markets/stocks-indonesia/market-movers-all-stocks/",tr("IDX EOD market ↗","Pasar saham IDX EOD ↗"),true);anchor.className="sli-idx-external";
 const markets=text("div","sli-idx-market-links");markets.append(anchor,href("https://id.tradingview.com/symbols/IDX-COMPOSITE/",tr("IHSG / IDX Composite ↗","IHSG / Indeks Komposit ↗"),true));
 head.append(meta,markets);root.append(head);
 const form=text("div","sli-idx-tools");
 const sectorLabel=text("label");sectorLabel.append(text("span",null,tr("SLI sector","Sektor SLI")));
 const select=text("select");select.id="sliIDXGroupFilter";select.setAttribute("aria-label",tr("Filter IDX issuers by SLI sector","Saring emiten IDX berdasarkan sektor SLI"));
 for(const [v,t] of [["all",tr("All strategic sectors","Semua sektor strategis")],...sectorDefs.map(x=>[x[0],sectorText(x[0])])]){const opt=text("option",null,t);opt.value=v;select.append(opt)}
 select.value=activeSector;select.addEventListener("change",()=>{activeSector=select.value;selected=original.find(r=>activeSector==="all"?r.sector==="energy":r.sector===activeSector)?.ticker||"";view()});sectorLabel.append(select);
 const searchLabel=text("label");searchLabel.append(text("span",null,tr("Find ticker or company","Cari kode saham atau perusahaan")));
 const input=text("input");input.type="search";input.value=query;input.placeholder=tr("ANTM, TLKM, PTBA, Indofood…","ANTM, TLKM, PTBA, Indofood…");
 input.setAttribute("aria-label",tr("Search IDX stock ticker","Cari ticker BEI"));input.addEventListener("input",()=>{query=input.value.trim();updateFiltered()});
 searchLabel.append(input);
 const count=text("div","sli-idx-count");count.id="sliIDXCount";form.append(sectorLabel,searchLabel,count);
 root.append(form);
 const disclosure=text("div","sli-idx-disclosure");
 const quotes=feed.size;
 const priceState=validQuotes&&quotes?
 tr(quotes+" verified EOD quotes · "+feedInfo.date+" · "+feedInfo.publisher+" · not intraday",""+quotes+" harga EOD bersumber · "+feedInfo.date+" · "+feedInfo.publisher+" · bukan intraday"):
 tr("The TradingView watchlist below displays provider-owned stock movements. The SLI issuer map stays neutral until a licensed market feed is connected; no fabricated percentages.",
 "Watchlist TradingView di bawah menampilkan pergerakan saham dari penyedia. Peta emiten SLI tetap netral sampai feed pasar berizin terhubung; tidak ada persentase rekaan.");
 disclosure.append(text("span","sli-idx-disclosure-dot",validQuotes&&quotes?"●":"○"),text("span",null,priceState));root.append(disclosure);
 const provider=text("section","sli-idx-provider");provider.id="sliIDXTradingViewHeatmap";
 provider.append(text("h4","sli-idx-curated-heading",tr("IDX stock heatmap · price change (%) and market cap","Heatmap saham IDX · perubahan harga (%) dan kapitalisasi")));
 provider.append(text("p","sli-idx-provider-note",tr("TradingView's own IDX exchange-wide heatmap, not an exact SLI-sector universe. Green/red and size are calculated by the provider (IDX prices can be end-of-day).","Heatmap seluruh bursa IDX milik TradingView, bukan hanya ticker sektor SLI. Warna hijau/merah dan ukuran dihitung penyedia (harga IDX dapat berupa EOD).")));
 const priceMount=text("div","sli-idx-heatmap-mount");provider.append(priceMount);root.append(provider);
 if(window.SLIIDXTradingView?.mountHeatmap)window.SLIIDXTradingView.mountHeatmap(priceMount);
 const fallback=href("https://www.tradingview.com/heatmap/stock/",tr("Open complete stock heatmap on TradingView ↗","Lihat heatmap saham lengkap di TradingView ↗"),true);
 fallback.className="sli-idx-tv-fallback";provider.append(fallback);
 const more=text("details","sli-idx-watchlist-accordion");more.id="sliIDXTradingViewWatchlist";
 const moreTitle=text("summary",null,tr("More IDX quotes · watchlist by SLI strategic sector","Lihat harga IDX lainnya · watchlist per sektor strategis SLI"));
 more.append(moreTitle);
 const watchlistMount=text("div","sli-idx-watchlist-mount");more.append(watchlistMount);root.append(more);
 // Lazy-create only when requested, avoiding large third-party iframes and nested scroll traps.
 more.addEventListener("toggle",()=>{if(more.open&&window.SLIIDXTradingView?.mount)window.SLIIDXTradingView.mount(watchlistMount,original,activeSector)});
 root.append(text("h4","sli-idx-curated-heading",tr("SLI sector issuers · select a ticker to inspect its matching dossier","Emiten sektor SLI · pilih kode untuk profil emiten yang sesuai")));
 const workspace=text("div","sli-idx-workspace"),map=text("div","sli-idx-map"),panel=text("aside","sli-idx-detail");
 panel.id="sliIDXDetail";panel.setAttribute("aria-live","polite");workspace.append(map,panel);root.append(workspace);
 function updateFiltered(){
  const matches=original.filter(x=>(activeSector==="all"||x.sector===activeSector)&&(!query||[x.ticker,x.name].join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase())));
  if(!matches.some(x=>x.ticker===selected))selected=matches.find(x=>x.sector==="energy")?.ticker||matches[0]?.ticker||"";
  count.textContent=matches.length+" / "+original.length+" "+tr("mapped candidate tickers","kode kandidat terpetakan");
  map.replaceChildren();
  const groups=sectorDefs.filter(([code])=>activeSector==="all"||activeSector===code);
  for(const [category]of groups){
   const records=matches.filter(r=>r.sector===category);if(!records.length)continue;
   const section=text(activeSector==="all"?"details":"section","sli-idx-sector");section.setAttribute("data-sector",category);
   if(activeSector==="all")section.open=records.some(r=>r.ticker===selected);
   const headline=text(activeSector==="all"?"summary":"h4",null,sectorText(category)+" · "+records.length);section.append(headline);
   const grid=text("div","sli-idx-tiles");
   for(const item of records){
    const p=feed.get(item.ticker);
    const b=text("button","sli-idx-tile "+(p?"has-quote "+(p.change>0?"positive":p.change<0?"negative":"flat"):"no-quote"));
    b.type="button";b.dataset.ticker=item.ticker;b.setAttribute("aria-pressed",String(item.ticker===selected));
    b.style.setProperty("--sli-idx-area",String(tileArea(item,records)));
    b.append(text("strong",null,item.ticker),text("small",null,item.name));
    b.append(text("span","sli-idx-change",p?(p.change>0?"+":"")+fmt(p.change,2)+"%":tr("Open dossier ↗","Profil emiten ↗")));
    b.title=item.ticker+" · "+item.name+" · "+(p?fmt(p.change,2)+"% "+p.date:tr("Price not licensed","Harga belum berizin"));
    b.addEventListener("click",()=>{selected=item.ticker;const all=map.querySelectorAll(".sli-idx-tile");all.forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.ticker===selected)));drawDetail(panel,item)});
    grid.append(b);
   }
   section.append(grid);map.append(section);
  }
  if(!map.children.length)map.append(text("p","sli-idx-empty",tr("No tickers match this filter.","Tidak ada ticker yang sesuai.")));
  const chosen=matches.find(x=>x.ticker===selected)||matches[0];selected=chosen?.ticker||"";
  map.querySelectorAll(".sli-idx-tile").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.ticker===selected)));
  drawDetail(panel,chosen);
 }
 updateFiltered();
 const foot=text("p","sli-idx-footnote",tr("Source: SLI IDX issuer seed (not yet a fully reconciled BEI census). Official listing status, IDX sector classification, index inclusion and financial data must be verified with dated BEI disclosures. No investment recommendation.",
 "Sumber: katalog awal emiten IDX SLI (belum merupakan sensus BEI terverifikasi). Status pencatatan, klasifikasi IDX-IC, keanggotaan indeks dan data keuangan perlu diverifikasi melalui keterbukaan BEI bertanggal. Bukan rekomendasi investasi."));
 root.append(foot);
}
function drawDetail(host,item){
 host.replaceChildren();
 if(!item){host.append(text("p",null,tr("Select a ticker to inspect its SLI entity record.","Pilih kode saham untuk membuka profil entitas SLI.")));return}
 host.append(text("span","sli-idx-eyebrow",tr("LINKED ENTITY DOSSIER","PROFIL ENTITAS TERHUBUNG")),text("h4",null,item.name));
 const code=text("strong","sli-idx-code","IDX:"+item.ticker);host.append(code,text("p",null,sectorText(item.sector)));
 const dl=text("dl","sli-idx-facts");
 function row(k,v){dl.append(text("dt",null,k),text("dd",null,v))}
 const market=feed.get(item.ticker);
 row(tr("Ticker / exchange","Kode / bursa"),"IDX:"+item.ticker);
 row(tr("Issuer directory status","Status direktori emiten"),item.verification==="official_exchange_snapshot"?
 tr("Official dated profile snapshot","Snapshot profil resmi bertanggal"):tr("SLI candidate · official IDX reconciliation pending","Kandidat SLI · rekonsiliasi BEI belum selesai"));
 if(market)row(tr("Observed close","Harga penutupan"),fmt(market.close,0)+" IDR · "+market.date);
 if(market)row(tr("Daily change","Perubahan harian"),(market.change>=0?"+":"")+fmt(market.change,2)+"%");
 if(market&&market.marketCap)row(tr("Market cap","Kapitalisasi pasar"),fmt(market.marketCap,0)+" IDR");
 host.append(dl);
 const links=text("div","sli-idx-links");
 const dossier=href(tickerURL(item.ticker),tr("Open IDX:"+item.ticker+" dedicated company dossier ↗","Buka dossier khusus emiten "+item.ticker+" ↗"));dossier.className="sli-idx-entity-link";links.append(dossier);
 if(safe(item.source_url))links.append(href(item.source_url,tr("IDX issuer source ↗","Sumber emiten BEI ↗"),true));
 links.append(href(tradingView(item.ticker),tr("Provider market quote ↗","Harga pasar dari TradingView ↗"),true));
 if(market?.source_url)links.append(href(market.source_url,tr("EOD quote source ↗","Sumber harga EOD ↗"),true));
 const prompt=tr("Analyze IDX:"+item.ticker+" ("+item.name+"): sector "+item.sector+", official IDX disclosure, ownership, sourced fundamentals, and risks. Clearly separate observed facts from missing EOD quote and uncertainty.",
 "Analisis emiten IDX:"+item.ticker+" ("+item.name+"): sektor "+item.sector+", keterbukaan resmi BEI, kepemilikan, fundamental bersumber, dan risiko. Bedakan data yang teramati dari harga EOD yang belum tersedia.");
 links.append(href("./sli-research-ai.html?prompt="+encodeURIComponent(prompt),tr("Research AI ↗","Analisis Research AI ↗")));
 host.append(links);
 host.append(text("p","sli-idx-entity-note",tr("This ticker opens an issuer-specific SLI dossier. The TradingView watchlist displays provider quotes independently and cannot be imported into SLI internal price records.",
 "Kode saham langsung membuka dossier emiten khusus. Watchlist TradingView menampilkan harga milik penyedia secara terpisah dan tidak menjadi data harga internal SLI.")));
}
async function read(){
 if(cached)return cached;
 if(!fetching)fetching=Promise.all([
 fetch(universeURL,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("IDX universe HTTP "+r.status);return r.json()}),
 fetch(feedURL,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("IDX quote HTTP "+r.status);return r.json()}).catch(()=>null)
 ]).then(([universe,snapshot])=>{
  if(universe.schema!=="sli-idx-issuer-universe-v1"||!Array.isArray(universe.records)||universe.records.length<50)throw Error("IDX issuer registry invalid");
  const issuers=uniqueSorted(universe.records),market=parseMarket(snapshot,issuers);
  cached={issuers,market};return cached;
 }).finally(()=>{fetching=null});
 return fetching;
}
async function render(){
 const root=$(ROOT);if(!root)return;
 const myEpoch=++epoch;root.replaceChildren(text("p","sli-idx-loading",tr("Loading sourced IDX issuer catalogue…","Memuat katalog kode emiten IDX bersumber…")));
 try{
 const data=await read();
 if(myEpoch!==epoch||$(ROOT)!==root)return;
 original=data.issuers;feed=data.market.quotes;feedInfo=data.market.status;validQuotes=feedInfo.active;view();
 }catch(err){if(myEpoch!==epoch)return;root.replaceChildren(text("p","sli-idx-empty",tr("Issuer registry could not load. No market figures were substituted.","Katalog emiten belum bisa dimuat. Tidak ada angka pasar pengganti yang dibuat.")));console.error("[SLI IDX Heatmap]",err)}
}
document.addEventListener("sli:languagechange",()=>{if($(ROOT)&&original.length)view()});
window.initSLIHomeIDXHeatmap=render;
window.SLIIDXHeatmap={parseMarket,uniqueSorted,tickerURL};
})();
