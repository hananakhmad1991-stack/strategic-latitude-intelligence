/* Strategic Latitude Intelligence — BKPM / ESDM / IEA source-verified bridge.
   Dated statistics only. No synthetic investment splits or undocumented API.
   Each indicator stays in the source's own data perimeter and reference year. */
(function(){
"use strict";
const DATA="data/cross-source-policy-2026.json";
const RAW="https://raw.githubusercontent.com/hananakhmad1991-stack/strategic-latitude-intelligence/main/data/cross-source-policy-2026.json";
const headings={
 investment:["Investment Realization & Strategic Capital Context","Realisasi Investasi & Konteks Modal Strategis"],
 energy:["Energy Security · Indonesian and World Benchmarks","Ketahanan Energi · Tolok Ukur Indonesia & Global"],
 minerals:["Mineral Processing · Investment and Global Demand","Hilirisasi Mineral · Investasi & Permintaan Global"],
 ai:["AI Infrastructure · Capital, Power & Global Signals","Infrastruktur AI · Modal, Listrik & Sinyal Global"],
 overview:["Strategic Signals · BKPM, ESDM & IEA","Sinyal Strategis · BKPM, ESDM & IEA"],
 policy:["Policy Evidence · Investment, Energy & Technology","Bukti Kebijakan · Investasi, Energi & Teknologi"]
};
const sourceLabels={bkpm:"BKPM · INVESTMENT REALIZATION",esdm:"ESDM · 2025 INDONESIA",iea:"IEA · 2025 WORLD"};
const select=(en,id)=>window.SLIi18n?.language==="id"?id:en;
const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined&&text!==null)x.textContent=String(text);return x};
const fmt=x=>Number(x).toLocaleString(window.SLIi18n?.language==="id"?"id-ID":"en-US",{maximumFractionDigits:2});
const valueText=m=>(m.operator||"")+fmt(m.value);
const link=(url,name)=>{const a=el("a",null,name);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
const allIndicators=d=>({
 bkpm:d.bkpm.quarterly_kpis,
 esdm:d.esdm.items,
 iea:d.iea.items
});
function validate(d){
 if(!d?.groups||!d?.bkpm?.quarterly_kpis||!d?.esdm?.items||!d?.iea?.items)throw Error("Incomplete source registry");
 const checks=[["esdm-investment-total",31.96],["h1-realized",1010.6],["iea-data-centers-growth",17]];
 for(const [id,val] of checks){
  const item=Object.values(allIndicators(d)).flat().find(x=>x.id===id);
  if(!item||item.value!==val)throw Error("Core source value "+id+" missing or inconsistent");
 }
 return d;
}
async function download(){
 let error=null;
 for(const url of [RAW,DATA]){
  try{const r=await fetch(url+"?v=20261016-source1",{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);return validate(await r.json())}
  catch(e){error=e}
 }
 throw error||Error("No published evidence");
}
function metricCard(m){
 const card=el("article","sli-source-metric");
 card.append(el("small","sli-source-metric-period",(m.scope==="World"?"WORLD · ":"INDONESIA · ")+(m.period||"2025")+(m.kind==="provisional"?" · PROVISIONAL":"")),
   el("strong","sli-source-metric-value",valueText(m)),
   el("span","sli-source-metric-unit",m.unit),
   el("h5",null,m.label),
   el("p",null,m.description));
 card.append(link(m.source_url,"Primary report ↗"));return card;
}
function section(root,d,source,selected){
 const group=source==="bkpm"?d.bkpm:d[source],names=allIndicators(d);
 const rows=names[source].filter(x=>selected.includes(x.id));
 const block=el("div","sli-source-group");
 block.append(el("h4",null,sourceLabels[source]),
  el("p","sli-source-caption",
   source==="bkpm"
    ?"BKPM 2026 Q2 · Quarterly LKPM; source press release 17 July 2026. Not corporate project audited CAPEX."
    :source==="esdm"
    ?"2025 ministry performance, figures verified against annual report. ESDM investment and BKPM realised investment have different reporting scopes."
    :"World trends for 2025 published 20 April 2026. Global signals are not Indonesian outcomes."));
 const grid=el("div","sli-source-metric-grid");
 rows.forEach(m=>grid.append(metricCard(m)));block.append(grid);
 if(source==="esdm"&&selected.some(x=>x.startsWith("esdm-")&&x.includes("investment"))||source==="esdm"&&selected.includes("esdm-oil-gas")){
  const pairs=group.items.filter(x=>["esdm-oil-gas","esdm-minerba","esdm-electricity","esdm-renewables"].includes(x.id));
  if(pairs.length===4){
   const plot=el("div","sli-source-bars");
   plot.append(el("h5",null,"ESDM realized investment 2025 · US$ billion (sector accounting only)"));
   for(const item of pairs){
    const line=el("div","sli-source-bar-row");
    line.append(el("span",null,item.label.replace(" investment","")),el("strong",null,fmt(item.value)));
    const track=el("div","sli-source-bar-track"),fill=el("div","sli-source-bar-fill");
    fill.style.width=(item.value/18.02*100).toFixed(3)+"%";
    track.append(fill);line.append(track);plot.append(line);
   }
   plot.append(el("p","sli-source-caption","ESDM 2025: sector components sum to US$31.96bn within ESDM accounting; do not sum with BKPM LKPM."));
   block.append(plot);
  }
 }
 if(source==="bkpm"){
  block.append(el("p","sli-source-caveat",
   "Data granularity available from the official Q2 2026 portal: period, PMA/PMDN, investment-origin country, KBLI sector, province, district, Java/outside Java, and direct workers. Raw CSV rows were not yet retrievable here: no numeric sub-sector, provincial or AI/mineral-specific investment values are fabricated."));
  const actions=el("div","sli-source-actions");
  actions.append(link(d.bkpm.dataset_detail,"BKPM Q2 2026 dataset / CSV ↗"),link(d.bkpm.data_catalog,"Browse all BKPM public datasets ↗"));
  block.append(actions);
 }
 const href=source==="bkpm"?d.bkpm.source_press_release:group.source;
 block.append(link(href,source==="bkpm"?"Official LKPM release ↗":"Read original source ↗"));
 return block;
}
function mount(scope,target){
 if(!headings[scope])return;
 const root=typeof target==="string"?document.getElementById(target):target;
 if(!root)return;
 root.replaceChildren();
 const wrap=el("section","sli-source-bridge");
 wrap.id="sli-source-bridge-"+scope;
 const title=el("div","sli-source-bridge-head");
 title.append(el("small",null,"SOURCE-LED CROSS-SECTOR INTELLIGENCE"),
  el("h3",null,select(...headings[scope])),
  el("p","sli-source-caption",
   select("Official Indonesia indicators alongside international context, with separate denominators and reporting periods.",
          "Indikator resmi Indonesia dan konteks internasional, dengan periode serta cakupan berbeda.")));
 wrap.append(title);
 const state=el("p","sli-source-caption","Loading source-dated evidence…");
 wrap.append(state);root.append(wrap);
 download().then(d=>{
  if(!wrap.isConnected)return;
  state.textContent="Source review 16 October 2026 · BKPM Q2 2026 / ESDM full year 2025 / IEA world 2025. NOT REAL-TIME.";
  const keys=d.groups[scope]||d.groups.investment;
  const nav=el("div","sli-source-tabs"),area=el("div","sli-source-content");
  const sourceKeys=["bkpm","esdm","iea"].filter(x=>(keys[x]||[]).length);
  let active=scope==="energy"?"esdm":scope==="ai"?"iea":"bkpm";
  if(!sourceKeys.includes(active))active=sourceKeys[0];
  const redraw=()=>{
   area.replaceChildren(section(area,d,active,keys[active]));
   for(const button of nav.children){const x=button.dataset.source===active;button.setAttribute("aria-pressed",String(x));button.classList.toggle("active",x)}
  };
  for(const k of sourceKeys){
   const b=el("button","sli-source-tab",sourceLabels[k]);b.type="button";b.dataset.source=k;
   b.addEventListener("click",()=>{active=k;redraw()});nav.append(b);
  }
  wrap.append(nav,area);
  const meta=el("p","sli-source-disclaimer",
   "Methodological boundary: BKPM's PMA/PMDN realization excludes upstream oil/gas and finance; ESDM covers upstream oil/gas in its own sector investment series. Neither is a site-level CAPEX ledger. Global IEA statistics are contextual signals, not an Indonesia production or investment denominator. IEA report figures carry CC BY 4.0 attribution; its downloadable dataset has separate reuse conditions.");
  const sources=el("div","sli-source-links");
  for(const src of d.source_registry||[]){sources.append(link(src.url,src.publisher+" · "+src.title+" ↗"))}
  wrap.append(meta,sources);
  redraw();
 }).catch(e=>{state.textContent="Source data unavailable. Historical canonical sector panels remain active; no values inferred.";console.warn("[SLI source bridge]",String(e))});
}
window.initSLISourceBridge=mount;
})();
