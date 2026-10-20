/* Official TradingView market-overview embed. All EOD quotes, colors and calculations
 * remain inside the TradingView iframe. No quote scraping, SLI redistribution or proxy.
 * Tabs derive from the exact IDX ticker catalogue rendered alongside this widget.
 */
(()=>{"use strict";
const SCRIPT="https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
const SECTORS=[
 ["energy","Energi","Energy"],["minerals","Mineral","Minerals"],["coal","Batu bara","Coal"],
 ["food","Pangan","Food"],["technology","Teknologi","Technology"],
 ["infrastructure","Infrastruktur","Infrastructure"],["transport","Transportasi","Transport"],
 ["manufacturing","Manufaktur","Manufacturing"]
];
const T=(id,en)=>document.documentElement.lang==="id"?id:en;
const E=(t,c,txt)=>{const n=document.createElement(t);if(c)n.className=c;if(txt!==undefined)n.textContent=txt;return n};
const route="https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/sli-issuer.html";
const priority={
 energy:["MEDC","PGAS","AKRA","PGEO","BREN","ELSA","TPIA","BRPT","ESSA"],
 minerals:["ANTM","AMMN","INCO","MDKA","MBMA","NCKL","TINS","BRMS","HRUM"],
 coal:["PTBA","ADRO","AADI","ITMG","BYAN","BUMI","INDY","GEMS","DSSA"],
 food:["INDF","ICBP","CPIN","JPFA","MYOR","AALI","UNVR","CMRY","DSNG"],
 technology:["TLKM","ISAT","EXCL","GOTO","DCII","MTEL","TOWR","TBIG","EMTK"],
 infrastructure:["JSMR","WIKA","PTPP","ADHI","SSIA","CMNP","TOTL","WTON","WEGE"],
 transport:["BIRD","SMDR","TMAS","ASSA","GIAA","WINS","MPMX","SHIP","MBSS"],
 manufacturing:["UNTR","AUTO","SMGR","INKP","TKIM","INTP","AVIA","KRAS","IMAS"]
};
function watchlistConfig(rows,selected="all"){
 const ordered=SECTORS.filter(([s])=>selected==="all"||selected===s);
 const tabs=ordered.map(([sector,id,en])=>{
  const picks=rows.filter(x=>x.sector===sector&&/^[A-Z0-9]{4}$/.test(x.ticker||""))
   .sort((a,b)=>{const p=priority[sector]||[];const x=p.indexOf(a.ticker),y=p.indexOf(b.ticker);return (x<0?999:x)-(y<0?999:y)||a.ticker.localeCompare(b.ticker)})
   .slice(0,9);
  return {title:T(id,en),originalTitle:en,symbols:picks.map(x=>({s:"IDX:"+x.ticker,d:x.ticker+" · "+x.name.slice(0,29)}))};
 }).filter(t=>t.symbols.length>0);
 return {colorTheme:"dark",dateRange:"1M",locale:document.documentElement.lang==="id"?"id":"en",
   largeChartUrl:route,isTransparent:true,showSymbolLogo:true,showChart:false,
   showFloatingTooltip:true,plotLineColorGrowing:"rgba(21,148,110,1)",plotLineColorFalling:"rgba(201,77,96,1)",
   scaleFontColor:"#c4dae8",gridLineColor:"rgba(114,137,155,.18)",
   width:"100%",height:"100%",tabs};
}
function mount(host,rows,selected){
 if(!host)return;
 host.replaceChildren();
 const heading=E("div","sli-idx-provider-header");
 heading.append(E("h4",null,T("Watchlist IDX · pergerakan harga penyedia","IDX watchlist · provider market movements")),
 E("p",null,T("Harga dan perubahan (%) ditampilkan langsung oleh TradingView dalam widget miliknya. Pilih sektor di filter SLI. Klik simbol untuk membuka dossier emiten tertentu.","Prices and daily changes (%) display inside TradingView's own widget. Select SLI sector above and click any symbol for its specific company dossier.")));
 host.append(heading);
 const container=E("div","sli-idx-provider-container tradingview-widget-container");
 const mountPoint=E("div","tradingview-widget-container__widget");
 container.append(mountPoint);
 const legal=E("div","tradingview-widget-copyright");
 const attribution=E("a",null,"Market data by TradingView ↗");attribution.href="https://www.tradingview.com/markets/stocks-indonesia/";
 attribution.target="_blank";attribution.rel="noopener noreferrer nofollow";legal.append(attribution);container.append(legal);
 const options=watchlistConfig(rows,selected);
 if(!options.tabs.length){host.append(E("p",null,T("Belum ada kode IDX dalam sektor ini.","No IDX symbols in this sector.")));return}
 const script=E("script");script.type="text/javascript";script.src=SCRIPT;script.async=true;script.textContent=JSON.stringify(options);
 container.append(script);host.append(container);
 const fallback=E("p","sli-idx-provider-note",
 T("Jika widget diblokir oleh browser/jaringan, buka TradingView atau klik kode saham di peta SLI di bawah. Indikator pasar bisa tertunda (EOD).",
 "If the external widget is blocked, use TradingView or select a symbol in the SLI ticker map below. Market prices may be delayed (EOD)."));
 host.append(fallback);
}

/* Exchange-restricted TradingView Stock Heatmap. This is a provider visualization
   for IDX (not a custom selection of SLI-listed companies and not internal market data).
   Provider may reject unsupported market codes or block third-party embedding. */
const HEATMAP_SCRIPT="https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
function heatmapConfig(){
 return {dataSource:"IDX",exchanges:["IDX"],blockSize:"market_cap_basic",blockColor:"change",
  grouping:"sector",locale:document.documentElement.lang==="id"?"id":"en",
  symbolUrl:route,colorTheme:"dark",hasTopBar:true,isDataSetEnabled:false,
  isZoomEnabled:true,hasSymbolTooltip:true,isMonoSize:false,width:"100%",height:"100%"};
}
function mountHeatmap(host){
 if(!host)return;
 host.replaceChildren();
 const widget=E("div","sli-idx-priceheatmap tradingview-widget-container");
 widget.append(E("div","tradingview-widget-container__widget"));
 const legal=E("div","tradingview-widget-copyright");
 const a=E("a",null,"TradingView Stock Heatmap ↗");a.href="https://www.tradingview.com/heatmap/stock/";
 a.target="_blank";a.rel="noopener noreferrer nofollow";legal.append(a);widget.append(legal);
 const script=E("script");script.type="text/javascript";script.src=HEATMAP_SCRIPT;script.async=true;
 script.textContent=JSON.stringify(heatmapConfig());widget.append(script);host.append(widget);
}

window.SLIIDXTradingView={watchlistConfig,mount,scriptUrl:SCRIPT,issuerRoute:route,heatmapScriptUrl:HEATMAP_SCRIPT,heatmapConfig,mountHeatmap};
})();