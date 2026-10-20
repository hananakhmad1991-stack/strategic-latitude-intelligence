/* SLI homepage national snapshot. Source values are read from the dated SLI macro
   register, never hardcoded in the landing page or presented as live market prices. */
(()=>{"use strict";
const METRICS=[
 {id:"real_gdp_growth",label:["Real GDP growth","Pertumbuhan PDB riil"]},
 {id:"inflation_yoy",label:["Headline CPI inflation","Inflasi IHK tahunan"]},
 {id:"bi_policy_rate",label:["BI policy rate","Suku bunga kebijakan BI"]},
 {id:"usd_idr_jisdor",label:["USD/IDR · JISDOR","USD/IDR · JISDOR"]}
];
const isId=()=>window.SLIi18n?.language==="id"||document.documentElement.lang?.toLowerCase().startsWith("id");
const T=(en,bahasa)=>isId()?bahasa:en;
let cache=null,pending=null;
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e}
const secureSource=url=>{try{const u=new URL(url);return u.protocol==="https:"?u.href:null}catch{return null}};
async function readMetrics(){
 if(cache)return cache;
 if(!pending)pending=fetch("./data/sli-macro-indonesia-2026.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("data unavailable");return r.json()}).then(j=>{
  if(!Array.isArray(j.metrics)||!j.sources||typeof j.sources!=="object")throw Error("invalid source register");
  cache=j;return j
 }).finally(()=>{pending=null});
 return pending;
}
async function render(){
 const host=document.getElementById("sliPortalMetrics");if(!host)return;
 try{
  const register=await readMetrics();
  if(document.getElementById("sliPortalMetrics")!==host)return; // switched dashboard
  host.replaceChildren();
  for(const spec of METRICS){
   const m=register.metrics.find(x=>x.id===spec.id);
   const source=m&&register.sources[m.source_id],url=secureSource(source?.url);
   const valid=Number.isFinite(m?.value)&&typeof m?.unit==="string"&&typeof m?.period==="string"&&url;
   const card=el("article","sli-portal-metric-card");
   card.append(el("span",null,T(...spec.label)));
   card.append(el("strong",null,valid?(String(m.display||m.value)+(spec.id==="usd_idr_jisdor"?" IDR":" "+m.unit)):T("Not available","Tidak tersedia")));
   card.append(el("small",null,valid?(T("Observed ","Observasi ")+m.period+" · "+source.publisher):T("No approved observed value","Belum ada nilai observasi terverifikasi")));
   const link=el("a",null,T("Source & date ↗","Sumber & tanggal ↗"));
   link.href=valid?url:"./indonesia-macroeconomic-intelligence.html";
   if(valid){link.target="_blank";link.rel="noopener noreferrer"}
   if(valid&&m.caveat)link.title=m.caveat;
   card.append(link);host.append(card);
  }
 }catch{
  if(document.getElementById("sliPortalMetrics")===host){
   host.replaceChildren(el("p","sli-portal-metric-loading",T("Indicators are temporarily unavailable. Open the macroeconomic dashboard for dated figures.","Indikator sementara tidak tersedia. Buka dashboard makroekonomi untuk angka dan periode rujukannya.")));
  }
 }
}
window.initSLIPortalMetrics=render;
document.addEventListener("sli:languagechange",()=>{if(document.getElementById("sliPortalMetrics"))render()});
})();
