/* SLI IDX sector watchlist · separate from exchange-wide heatmap.
 * Market numbers stay inside TradingView's provider-owned iframe.
 * Company names/ticker-to-dossier links use the SAME SLI issuer candidate register.
 */
(()=>{"use strict";
const ROOT="sliHomeIDXSectors";
const PROVIDER=window.SLIIDXTradingView;
const SECTORS=[
 ["energy","Energy & transition","Energi & transisi"],
 ["minerals","Metals & minerals","Logam & mineral"],
 ["coal","Coal & mining","Batu bara & tambang"],
 ["food","Food & agriculture","Pangan & pertanian"],
 ["technology","Digital & technology","Digital & teknologi"],
 ["infrastructure","Infrastructure","Infrastruktur"],
 ["transport","Logistics & transport","Logistik & transportasi"],
 ["manufacturing","Strategic manufacturing","Manufaktur strategis"],
 ["finance","Banking & financial services","Perbankan & jasa keuangan"],
 ["property","Property & real estate","Properti & real estat"],
 ["healthcare","Healthcare & pharmaceuticals","Kesehatan & farmasi"],
 ["retail","Retail & consumer distribution","Ritel & distribusi konsumen"]
];
const E=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n};
const lang=()=>document.documentElement?.lang?.toLowerCase().startsWith("id")||window.SLIi18n?.language==="id";
const T=(en,id)=>lang()?id:en;
const tickerUrl=t=>"./sli-issuer.html?ticker="+encodeURIComponent(t);
const ALLOWED=/^[A-Z0-9]{4}$/;
let candidates=[],sector="energy",ready=null,issuerQuery="";
function activeIssuerList(rows,k){
 return rows.filter(x=>x.sector===k&&x.exchange==="IDX"&&ALLOWED.test(x.ticker||"")&&x.name);
}
function link(url,label,external=false){
 const a=E("a",null,label);a.href=url;if(external){a.target="_blank";a.rel="noopener noreferrer"}return a;
}
async function source(){
 if(ready)return ready;
 ready=fetch("./data/sli-idx-issuer-universe.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("IDX issuer registry HTTP "+r.status);return r.json()})
 .then(data=>{if(data.schema!=="sli-idx-issuer-universe-v1"||!Array.isArray(data.records))throw Error("Unsupported ticker register");return data.records});
 return ready;
}
function renderUI(){
 const root=document.getElementById(ROOT);if(!root||!candidates.length)return;
 root.replaceChildren();
 root.classList.add("sli-idx-sectoral");
 const header=E("div","sli-idx-sectoral-header");
 header.append(E("span","sli-idx-sectoral-kicker",T("SLI · INDONESIAN STRATEGIC SECTORS","SLI · SEKTOR STRATEGIS INDONESIA")),
 E("h3",null,T("IDX Sector Watchlist & Company Research","Watchlist Sektoral IDX & Riset Perusahaan")),
 E("p",null,T("Unlike the full-market heatmap above, this section covers twelve SLI strategic research categories. Provider quotes and the SLI company register are kept separate.",
 "Berbeda dari heatmap pasar umum di atas, bagian ini mencakup 12 kategori riset strategis SLI. Harga penyedia dan registri perusahaan SLI tetap dipisahkan.")));
 root.append(header);
 const tabs=E("div","sli-idx-sectoral-tabs");tabs.setAttribute("role","group");tabs.setAttribute("aria-label",T("Filter selected IDX strategic sector","Pilih sektor saham strategis IDX"));
 for(const [key,en,id]of SECTORS){
  const amount=activeIssuerList(candidates,key).length;
  const b=E("button","sli-idx-sectoral-tab"+(sector===key?" active":""),T(en,id)+" · "+amount);
  b.type="button";b.setAttribute("aria-pressed",String(sector===key));
  b.addEventListener("click",()=>{if(sector===key)return;sector=key;issuerQuery="";renderUI()});tabs.append(b);
 }
 root.append(tabs);
 const verifiedCount=candidates.filter(x=>x.verification==='official_exchange_snapshot').length;
 root.append(E("p","sli-idx-sectoral-disclosure",T(
  candidates.length+" curated ticker leads across 12 research sectors; "+verifiedCount+" officially reconciled snapshots. This is NOT the full IDX issuer universe, and some listings may be stale. The quote widget shows only a short provider-selected subset.",
  candidates.length+" kandidat kode saham di 12 sektor riset; "+verifiedCount+" snapshot yang telah direkonsiliasi secara resmi. Ini BUKAN sensus seluruh emiten BEI; sebagian kode bisa berubah. Widget harga hanya menampilkan sebagian kecil pilihan penyedia."
  )));
 const selected=activeIssuerList(candidates,sector);
 const financialRows=selected.filter(x=>x.financial_source_url&&x.financial_period&&
   ["revenue","net_income","total_assets"].some(k=>typeof x[k]==="number"&&Number.isFinite(x[k])));
 const verifiedAssets=new Set(["MEDC","INCO","BYAN","AADI","ASII"]);
 const review=E("div","sli-idx-sectoral-coverage");
 const rate=E("strong",null,T("Financial evidence: ","Bukti keuangan: ")+financialRows.length+"/"+selected.length);
 const actorRate=E("span",null,T(" · "+selected.filter(x=>verifiedAssets.has(x.ticker)).length+" issuer concession/actor dossiers"," · "+selected.filter(x=>verifiedAssets.has(x.ticker)).length+" dossier aktor/konsesi"));
 const caution=E("small",null,T(
  "N/A means no source-reconciled figure, never zero. Periods/currencies vary; bank income is not industrial revenue. Specific issuer dossiers distinguish direct shareholders, officers, country links and concessions from unverified ultimate owners.",
  "N/A berarti angka belum direkonsiliasi dengan sumber, bukan nol. Periode/mata uang berbeda; pendapatan bunga bank bukan pendapatan industri. Dossier emiten memisahkan pemegang saham langsung, pengurus, keterkaitan negara dan konsesi dari pemilik manfaat akhir yang belum terverifikasi."
 ));
 review.append(rate,actorRate,caution);
 const verifiedList=E("div","sli-idx-sectoral-finance-links");
 financialRows.forEach(x=>{
   const a=link(tickerUrl(x.ticker),x.ticker+" · "+x.financial_period+" ↗");
   a.title=T("Source-linked financials and company actors","Keuangan bersumber dan aktor perusahaan");
   verifiedList.append(a);
 });
 if(financialRows.length)review.append(verifiedList);
 const directory=link("./sli-entities.html",T("Explore company/people/ownership relationships ↗","Jelajahi hubungan perusahaan/orang/kepemilikan ↗"));
 directory.className="sli-idx-sectoral-directory";
 review.append(directory);
 root.append(review);
 const cols=E("div","sli-idx-sectoral-columns");
 const market=E("section","sli-idx-sectoral-quotes");
 market.append(E("h4",null,T("Market watchlist · IDX quotations","Watchlist pasar · harga saham IDX")));
 market.append(E("p","sli-idx-sectoral-note",T("Provider-owned delayed/EOD figures. Green/red and percentages are from TradingView, not replicated into SLI's research database.",
 "Data penyedia dapat tertunda/EOD. Persentase dan warna naik/turun berasal dari TradingView, bukan disalin menjadi data internal SLI.")));
 const mount=E("div","sli-idx-sectoral-widget");market.append(mount);
 if(PROVIDER?.mountCompact)PROVIDER.mountCompact(mount,candidates,sector);
 else market.append(E("p","sli-idx-sectoral-note",T("Market provider widget unavailable.","Widget penyedia pasar belum tersedia.")));
 cols.append(market);
 const group=E("section","sli-idx-sectoral-issuers");
 group.append(E("h4",null,T("Sector tickers → specific company dossiers","Kode saham sektoral → dossier emiten khusus")));
 group.append(E("p","sli-idx-sectoral-note",T("Click a ticker for its exact entity profile, source links and company-group relationships.",
 "Klik ticker untuk membuka profil emiten yang tepat, tautan sumber, dan hubungan grup perusahaan.")));
 const best=PROVIDER?.watchlistConfig?PROVIDER.watchlistConfig(candidates,sector,6).tabs[0]?.symbols.map(x=>x.s.slice(4)):[];
 const byCode=new Map(selected.map(x=>[x.ticker,x]));
 const top=(best||[]).map(x=>byCode.get(x)).filter(Boolean);
 if(!top.length)top.push(...selected.slice(0,6));
 const quick=E("div","sli-idx-sectoral-tickers");
 for(const issuer of top){const a=link(tickerUrl(issuer.ticker),"");a.className="sli-idx-sectoral-ticker";
  a.append(E("strong",null,issuer.ticker),E("small",null,issuer.name));quick.append(a)}
 group.append(quick);
 const searchWrap=E("div","sli-idx-sectoral-search");
 const filter=E("input","sli-idx-sectoral-input");filter.type="search";
 filter.placeholder=T("Filter sector tickers by symbol or name…","Cari kode atau nama emiten sektor ini…");
 filter.setAttribute("aria-label",T("Search issuers in this sector","Cari emiten di sektor ini"));
 filter.value=issuerQuery;
 searchWrap.append(filter);group.append(searchWrap);
 const browse=E("section","sli-idx-sectoral-browse");
 const browseTitle=E("h5",null,T("All indexed sector issuers","Seluruh emiten sektor yang terindeks"));
 const resultCount=E("p","sli-idx-sectoral-note");
 const rest=E("div","sli-idx-sectoral-rest");
 const PAGE_SIZE=60;
 let shown=PAGE_SIZE;
 const more=E("button","sli-idx-sectoral-load-more",T("Load more issuers","Muat lebih banyak emiten"));
 more.type="button";
 const drawMatches=()=>{
  rest.replaceChildren();
  const q=issuerQuery.toLocaleLowerCase("id").trim();
  const matches=selected.filter(x=>!q||(x.ticker+" "+x.name).toLocaleLowerCase("id").includes(q));
  for(const x of matches.slice(0,shown)){const a=link(tickerUrl(x.ticker),x.ticker+" · "+x.name);rest.append(a)}
  resultCount.textContent=T("Showing "+Math.min(shown,matches.length)+" of "+matches.length+" indexed sector issuers","Menampilkan "+Math.min(shown,matches.length)+" dari "+matches.length+" emiten sektor terindeks");
  more.hidden=shown>=matches.length;
  if(!matches.length)rest.append(E("p","sli-idx-sectoral-note",T("No ticker matches the filter.","Tidak ada kode yang cocok.")));
 };
 filter.addEventListener("input",()=>{issuerQuery=filter.value;shown=PAGE_SIZE;drawMatches()});
 more.addEventListener("click",()=>{shown+=PAGE_SIZE;drawMatches()});
 browse.append(browseTitle,resultCount,rest,more);
 group.append(browse);
 drawMatches();
 group.append(E("p","sli-idx-sectoral-disclosure",T("Issuer universe is a curated SLI candidate list, not a fully reconciled official IDX census or an IHSG membership list. Confirm listing status and fundamentals with BEI.",
 "Daftar emiten adalah katalog kandidat kurasi SLI, bukan sensus resmi BEI atau daftar konstituen IHSG. Periksa kembali pencatatan dan fundamental melalui BEI.")));
 cols.append(group);root.append(cols);
}
async function render(){
 const root=document.getElementById(ROOT);if(!root)return;
 root.replaceChildren(E("p","sli-idx-sectoral-loading",T("Loading source-linked sector issuers…","Memuat kode emiten sektoral bersumber…")));
 try{candidates=await source();if(root.isConnected)renderUI()}
 catch(err){console.error("[SLI IDX Sectors]",err);root.replaceChildren(E("p","sli-idx-sectoral-loading",T("Issuer catalogue temporarily unavailable. No market figures were substituted.","Katalog emiten belum dapat dimuat. Tidak ada angka pasar buatan yang ditampilkan.")))}
}
window.initSLIHomeIDXSectors=render;
window.SLIIDXSectors={activeIssuerList,tickerUrl,sectorKeys:SECTORS.map(x=>x[0])};
document.addEventListener("sli:languagechange",()=>{if(document.getElementById(ROOT)&&candidates.length)renderUI()});
})();