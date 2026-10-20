/* SLI homepage · TradingView stock heatmap ONLY.
 * No domestic fake prices, ticker catalog, watchlist, nested scroll, or duplicated
 * company inspector. The market visual and attribution belong to TradingView.
 */
(()=>{"use strict";
const ROOT="sliHomeIDXHeatmap";
const REGION="https://www.tradingview.com/markets/stocks-indonesia/";
const HEATMAP="https://www.tradingview.com/heatmap/stock/";
const $=id=>document.getElementById(id);
const lang=()=>document.documentElement?.lang?.toLowerCase().startsWith("id")||window.SLIi18n?.language==="id";
const T=(en,id)=>lang()?id:en;
const E=(tag,cls,val)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(val!==undefined)e.textContent=String(val);return e;};
function link(url,label){const a=E("a",null,label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;}
function render(){
 const root=$(ROOT);if(!root)return false;
 root.replaceChildren();
 root.classList.add("sli-idx-heatmap-only");
 const header=E("div","sli-idx-heatmap-header");
 const heading=E("div");
 heading.append(E("span","sli-idx-overline",T("STOCK MARKET · INDONESIA","PASAR SAHAM · INDONESIA")),
  E("h3",null,T("Stock Market Heatmap","Heatmap Pasar Saham")),
  E("p",null,T(
   "Market capitalization determines tile size; 1-day price change determines red or green. All prices and calculations come from TradingView.",
   "Ukuran kotak mengikuti kapitalisasi pasar; perubahan harga 1 hari menentukan warna merah atau hijau. Seluruh harga dan perhitungan berasal dari TradingView."
  )));
 header.append(heading);root.append(header);
 const frame=E("div","sli-idx-heatmap-frame");
 frame.id="sliIDXTradingViewHeatmap";
 root.append(frame);
 if(window.SLIIDXTradingView?.mountHeatmap){
  window.SLIIDXTradingView.mountHeatmap(frame);
 }else{
  frame.append(E("p","sli-idx-heatmap-loading",T(
   "TradingView heatmap is currently unavailable. Open the market heatmap at TradingView.",
   "Heatmap TradingView belum dapat dimuat. Buka heatmap pasar melalui situs TradingView."
  )));
 }
 const bottom=E("div","sli-idx-heatmap-footer");
 const links=E("div","sli-idx-heatmap-links");
 links.append(link(HEATMAP,T("Open full stock heatmap ↗","Buka heatmap saham lengkap ↗")),
  link(REGION,T("Indonesia / IDX market ↗","Pasar Indonesia / IDX ↗")));
 bottom.append(links);
 bottom.append(E("p",null,T(
  "Provider widget: stock-market heatmap with an Indonesia/IDX default setting. If that market is unsupported by the embedded widget, use the data-source selector or the Indonesia market link. TradingView may delay or block third-party prices.",
  "Widget penyedia: heatmap saham dengan pengaturan awal Indonesia/IDX. Jika bursa tersebut tidak didukung dalam widget, pilih sumber pasar melalui pengaturan di grafik atau tautan pasar Indonesia. Harga TradingView mungkin tertunda atau diblokir oleh browser."
  )));
 root.append(bottom);return true;
}
window.initSLIHomeIDXHeatmap=render;
window.SLIIDXHeatmap={render,mode:"single-provider-heatmap",market:"IDX"};
document.addEventListener("sli:languagechange",()=>{if($(ROOT))render()});
})();
