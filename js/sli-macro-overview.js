/* SLI Overview macro module: official dated releases and compact ten-day BI reference trend. */
(function(){
"use strict";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=(n,d=2)=>Number(n).toLocaleString("en-US",{maximumFractionDigits:d});
const ids=["real_gdp_growth","inflation_yoy","bi_policy_rate","usd_idr_jisdor","unemployment_rate","poverty_rate","forex_reserves","fiscal_balance"];
function sparkline(pts){
 if(!pts?.length)return "";
 const values=pts.map(x=>x.value),min=Math.min(...values),max=Math.max(...values);
 const x=i=>12+i*250/Math.max(1,pts.length-1);
 const y=v=>66-(v-min)/Math.max(1,max-min)*54;
 return '<svg viewBox="0 0 280 85" role="img" aria-label="Verified last ten business-day USD/IDR JISDOR trend" style="width:100%;max-height:90px;display:block;margin:5px 0"><polyline points="'+pts.map((p,i)=>x(i)+","+y(p.value)).join(" ")+'" fill="none" stroke="#d7b678" stroke-width="2.7"/>'+pts.map((p,i)=>'<circle cx="'+x(i)+'" cy="'+y(p.value)+'" r="3.5" fill="#84bfcb"><title>'+esc(p.period)+" · "+fmt(p.value,0)+" IDR/USD</title></circle>").join("")+'</svg>';
}
window.initSLIMacroOverview=async function(){
 const root=document.getElementById("sliMacroOverviewRoot");if(!root)return;
 root.innerHTML='<section class="sli-macro-preview"><div class="section"><h2>Indonesia Macroeconomic Intelligence</h2><span>Loading source-dated BPS, BI and fiscal indicators…</span></div></section>';
 try{
  const r=await fetch("./data/sli-macro-indonesia-2026.json",{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);
  const d=await r.json();
  if(!root.isConnected)return;
  const m=ids.map(id=>d.metrics.find(x=>x.id===id)).filter(Boolean);
  const cards=m.map(x=>'<article class="sli-macro-mini-card"><small>'+esc(x.label)+'</small><b>'+esc(x.display)+(x.id==="real_gdp_growth"||x.id==="inflation_yoy"||x.id==="bi_policy_rate"||x.id==="unemployment_rate"||x.id==="poverty_rate"||x.id==="fiscal_balance"?"%":"")+'</b><span>'+esc(x.period)+' · '+esc(d.sources[x.source_id].publisher)+'</span><a href="'+esc(d.sources[x.source_id].url)+'" target="_blank" rel="noopener noreferrer">Primary source ↗</a></article>').join("");
  const fx=d.manual_series.find(s=>s.id==="usd_idr_jisdor");
  root.innerHTML='<section class="sli-macro-preview" aria-label="Indonesia macroeconomic source-dated overview"><style>'+
 '.sli-macro-preview{margin:20px 0 27px}.sli-macro-preview .macro-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.sli-macro-mini-card{background:#11283c;border:1px solid #344f68;border-radius:11px;padding:13px;min-width:0}.sli-macro-mini-card small{display:block;color:#b5c8d7;font-size:11px}.sli-macro-mini-card b{display:block;font-size:clamp(20px,2vw,26px);color:#d7b678;margin:5px 0}.sli-macro-mini-card span{display:block;color:#9cbfca;font-size:11px}.sli-macro-mini-card a{display:inline-block;color:#d7b678;font-size:11px;margin-top:8px}.sli-macro-preview .macro-foot{background:#10283a;border-left:3px solid #d7b678;margin-top:12px;padding:12px 14px;font-size:12px;color:#b6cad9}.sli-macro-preview .macro-foot a{color:#d7b678}.sli-macro-preview .macro-bottom{display:grid;grid-template-columns:minmax(260px,1fr) 1.5fr;gap:12px;margin-top:11px}.sli-macro-preview .macro-bottom>div{padding:11px 13px;background:#0d263b;border:1px solid #344f68;border-radius:9px}.sli-macro-preview .macro-bottom p{margin:3px 0;font-size:12px;color:#b1c7d5}@media(max-width:1000px){.sli-macro-preview .macro-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.sli-macro-preview .macro-grid,.sli-macro-preview .macro-bottom{grid-template-columns:1fr}}'+
 '</style><div class="section"><h2>Indonesia Macroeconomic Intelligence</h2><span>Official BPS · Bank Indonesia · Kemenkeu. Values have different reporting periods.</span></div><div class="macro-grid">'+cards+'</div><div class="macro-bottom"><div><small>USD/IDR · BI JISDOR, 5–16 October 2026</small>'+sparkline(fx?.points)+'<small style="font-size:11px;color:#b7c9d6">Reference-rate business days. Higher rate means weaker rupiah against USD.</small></div><div><strong>Macro context for investors</strong><p>Growth and income indicate broad demand; FX and interest rates affect imported equipment and financing costs. Merchandise trade, the balance of payments and fiscal deficit use different scopes. These are context indicators, not forecasts or investment recommendations.</p><p><a style="color:#d7b678" href="./indonesia-macroeconomic-intelligence.html">Explore 18 macro indicators, dynamic historical charts and CSV export ↗</a></p></div></div><div class="macro-foot">Source dates vary: GDP Q2 2026 · employment February · poverty/Gini March · trade August · inflation/reserves September · JISDOR October. Annual WDI history is refreshed separately. <a href="./indonesia-macroeconomic-intelligence.html">Full definitions, annual historical trends and source audit ↗</a></div></section>';
 }catch(error){
  if(root.isConnected)root.innerHTML='<div style="margin:15px 0;padding:13px;background:#14283a;border-left:3px solid #d7b678"><strong>Indonesia macro data temporarily unavailable.</strong> <a href="./indonesia-macroeconomic-intelligence.html">Open dedicated macroeconomic dashboard ↗</a></div>';
 }
};
})();