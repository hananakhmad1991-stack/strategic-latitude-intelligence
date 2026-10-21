/* SLI homepage · IDX-first market overview.
 * TradingView owns all quotes and percentage changes. An unsupported IDX heatmap
 * dataSource used to silently fall back to S&P 500. Never mislabel that US market.
 */
(()=>{"use strict";
const ROOT="sliHomeIDXHeatmap";
const IDX_URL="https://www.tradingview.com/markets/stocks-indonesia/";
const GLOBAL_URL="https://www.tradingview.com/heatmap/stock/";
const $=id=>document.getElementById(id);
const lang=()=>document.documentElement?.lang?.toLowerCase().startsWith("id")||window.SLIi18n?.language==="id";
const T=(en,id)=>lang()?id:en;
const E=(tag,cls,val)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(val!==undefined)el.textContent=String(val);return el};
const external=(url,label)=>{const a=E("a",null,label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
let selection="idx";
function render(){
 const root=$(ROOT);if(!root)return false;
 root.replaceChildren();
 root.classList.add("sli-idx-market-home");
 const heading=E("div","sli-idx-market-heading");
 heading.append(E("span","sli-idx-overline",T("STOCK MARKET · INDONESIA FIRST","PASAR SAHAM · PRIORITAS INDONESIA")));
 heading.append(E("h3",null,T("IDX Market Overview","Ringkasan Pasar IDX")));
 heading.append(E("p",null,T(
  "Indonesian stocks by default, with prices and daily changes shown by TradingView. Switch explicitly to the global S&P 500 heatmap if needed.",
  "Saham Indonesia tampil secara default, dengan harga dan perubahan harian disajikan oleh TradingView. Anda dapat beralih secara eksplisit ke heatmap global S&P 500."
 )));
 root.append(heading);
 const switches=E("div","sli-idx-market-switch");
 switches.setAttribute("role","group");
 switches.setAttribute("aria-label",T("Choose IDX or global market","Pilih pasar IDX atau global"));
 for(const [market,en,id] of [["idx","Indonesia · IDX","Indonesia · IDX"],["global","Global · S&P 500 heatmap","Global · heatmap S&P 500"]]){
  const button=E("button","sli-idx-market-button"+(selection===market?" is-active":""),T(en,id));
  button.type="button";button.setAttribute("aria-pressed",String(selection===market));
  button.addEventListener("click",()=>{if(selection!==market){selection=market;render()}});
  switches.append(button);
 }
 root.append(switches);
 const isIDX=selection==="idx";
 const modeNote=E("p","sli-idx-market-note",isIDX?T(
  "IDX quote overview — not a market-cap-weighted heatmap. Only provider-reported IDX prices are shown; no SLI-estimated market caps or returns.",
  "Ringkasan harga IDX — bukan heatmap berbobot kapitalisasi pasar. Hanya harga IDX dari penyedia yang ditampilkan, tanpa estimasi kapitalisasi atau imbal hasil buatan SLI."
 ):T(
  "Global comparison: S&P 500 (United States), not Indonesia. Tile sizes and price-change colors belong to TradingView.",
  "Pembanding global: S&P 500 (Amerika Serikat), bukan Indonesia. Ukuran dan warna perubahan harga berasal dari TradingView."
 ));
 root.append(modeNote);
 const frame=E("div","sli-idx-home-market-frame");
 frame.id="sliIDXTradingViewHeatmap";
 frame.setAttribute("aria-label",isIDX?T("IDX stock quotes supplied by TradingView","Harga saham IDX dari TradingView"):T("US S&P 500 heatmap","Heatmap S&P 500 Amerika Serikat"));
 root.append(frame);
 const provider=window.SLIIDXTradingView;
 if(isIDX?typeof provider?.mountHomeIDX==="function":typeof provider?.mountHeatmap==="function"){
  if(isIDX)provider.mountHomeIDX(frame);
  else provider.mountHeatmap(frame);
 }else{
  frame.append(E("p","sli-idx-heatmap-loading",T("The market widget could not load. Use the direct provider link below.","Widget pasar tidak dapat dimuat. Gunakan tautan langsung penyedia di bawah.")));
 }
 const footer=E("div","sli-idx-market-footer");
 if(isIDX){
  footer.append(external(IDX_URL,T("Open Indonesian stocks & sector heatmap ↗","Buka saham Indonesia & heatmap sektor ↗")));
  footer.append(E("p",null,T(
   "Quotes may be delayed or blocked by browser settings. The full Indonesian market and sector heatmap are on TradingView. The SLI sector watchlist below offers additional IDX filters.",
   "Harga dapat tertunda atau diblokir pengaturan browser. Pasar Indonesia dan heatmap sektornya tersedia di TradingView. Watchlist sektoral SLI di bawah menyediakan filter IDX tambahan."
  )));
 }else{
  footer.append(external(GLOBAL_URL,T("Open full S&P 500 heatmap ↗","Buka heatmap S&P 500 lengkap ↗")));
 }
 root.append(footer);
 return true;
}
window.initSLIHomeIDXHeatmap=render;
window.SLIIDXHeatmap={render,mode:"provider-idx-first-overview",market:"IDX",getSelection:()=>selection};
document.addEventListener("sli:languagechange",()=>{if($(ROOT))render()});
})();