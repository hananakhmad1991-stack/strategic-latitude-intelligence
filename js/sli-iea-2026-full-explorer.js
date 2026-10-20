/* IEA July 2026 user-normalized full critical minerals model: optional 16-column scenario explorer.
 * Conditional model output, NOT observed 2030+ production and NOT Indonesia-only demand.
 */
(function(){
"use strict";
const FILE="./data/iea-critical-minerals-2026-full-scenarios.json";
const GROUPS={total_demand:"Total demand",tech_mineral:"Mineral demand by technology",tech_sector:"Sector demand",
 solar_pv:"Solar PV",wind:"Wind",ev:"Electric vehicles",battery_storage:"Battery storage",
 electricity_networks:"Electricity networks",hydrogen:"Hydrogen"};
const SCENARIOS=["CPS","STEPS","HDS"];
const metric=x=>typeof x==="number"&&Number.isFinite(x)?x.toLocaleString("en-US",{maximumFractionDigits:3}):"N/A";
const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e};
function select(label,items){
 const wrap=el("label"),title=el("span",label),field=el("select");wrap.append(title,field);
 for(const [key,value] of items){const o=el("option",value);o.value=key;field.append(o)}
 return {wrap,field};
}
function mount(target){
 if(typeof target==="string")target=document.getElementById(target);
 if(!target)return Promise.resolve(false);
 const node=el("section");node.className="sli-iea-full";
 const eyebrow=el("small","IEA · JULY 2026 · CC BY 4.0 · SOURCE MODEL");
 const heading=el("h3","Full Critical Minerals Scenario Explorer · 2025–2050");
 const intro=el("p","The user-supplied original IEA model has a 2025 baseline and CPS, STEPS, HDS paths at 2030, 2035, 2040, 2045 and 2050. These are global/model scope, NOT actual production or realized Indonesian output.");
 const loading=el("p","Loading nine demand tables and the full 16-column IEA scenario model…");loading.setAttribute("role","status");
 node.append(eyebrow,heading,intro,loading);target.append(node);
 return fetch(FILE,{cache:"no-cache"}).then(r=>{if(!r.ok)throw Error("IEA source data HTTP "+r.status);return r.json()}).then(d=>{
  const cols=d.columns?.demand||[];
  if(d.edition!=="IEA Critical Minerals Dataset, July 2026"||d.license!=="CC BY 4.0"||cols.length!==16||
     !SCENARIOS.every(k=>cols.includes(k+" 2030")&&cols.includes(k+" 2050"))||!d.demand?.total_demand)throw Error("IEA full-model version or schema mismatch");
  const group=select("Demand table",Object.entries(GROUPS).filter(([k])=>Array.isArray(d.demand[k])));
  const item=select("Mineral / technology",[]);
  const scenario=select("IEA conditional scenario",SCENARIOS.map(k=>[k,k]));
  scenario.field.value="STEPS";
  const controls=el("div");controls.className="sli-iea-full-controls";controls.append(group.wrap,item.wrap,scenario.wrap);
  const facts=el("p");facts.className="sli-iea-full-note";
  const chart=el("div");chart.className="sli-iea-full-chart";chart.setAttribute("role","img");
  const scroll=el("div");scroll.className="sli-iea-full-scroll";scroll.tabIndex=0;
  const provenance=el("p");provenance.className="sli-iea-full-foot";
  const source=el("a","Original IEA Critical Minerals Dataset 2026 ↗");source.href=d.source;source.target="_blank";source.rel="noopener noreferrer";
  const library=el("a","All 16 model columns & 108 supply rows in SLI Data Library ↗");library.href="./sli-sector-data-library.html#minerals";
  provenance.append(source,document.createTextNode(" · "),library,document.createTextNode(" · IEA (2026), Critical Minerals Dataset, CC BY 4.0. No IEA endorsement."));
  const updateItems=()=>{
   const entries=d.demand[group.field.value]||[];
   item.field.replaceChildren();
   entries.forEach((x,i)=>{const o=el("option",(x.h||"Not specified")+" · "+(x.n||"Total")+" ["+(x.u||"unit not specified")+"]");o.value=String(i);item.field.append(o)});
   render();
  };
  function render(){
   const row=(d.demand[group.field.value]||[])[Number(item.field.value)||0];
   if(!row){chart.replaceChildren();scroll.replaceChildren();facts.textContent="No indexed source series for this selection.";return}
   const names=["2025 baseline",...["2030","2035","2040","2045","2050"].map(y=>scenario.field.value+" "+y)];
   const points=names.map(name=>({label:name,year:name.slice(-4),value:row.v[cols.indexOf(name)]}));
   if(points.some(x=>x.value===undefined))throw Error("IEA model values do not match declared source columns");
   const valid=points.filter(x=>typeof x.value==="number"&&Number.isFinite(x.value));
   const maximum=Math.max(1,...valid.map(x=>x.value));
   chart.replaceChildren();
   for(const p of points){
    const col=el("div");col.className="sli-iea-full-bar";
    const value=el("strong",metric(p.value));const track=el("div");track.className="sli-iea-full-track";
    const fill=el("i");fill.style.height=(typeof p.value==="number"&&p.value>=0?100*p.value/maximum:0).toFixed(2)+"%";
    track.append(fill);const year=el("small",p.year);
    col.append(value,track,year);chart.append(col);
   }
   chart.setAttribute("aria-label",row.h+" / "+(row.n||"total")+" · "+scenario.field.value+" · "+points.map(x=>x.label+": "+metric(x.value)+" "+row.u).join("; "));
   const t=el("table"),thead=el("thead"),headers=el("tr");
   ["Mineral","Application","Unit",...names].forEach(h=>headers.append(el("th",h)));
   thead.append(headers);
   const tbody=el("tbody"),tr=el("tr");
   [row.h,row.n||"—",row.u||"N/A",...points.map(x=>metric(x.value))].forEach(v=>tr.append(el("td",v)));tbody.append(tr);t.append(thead,tbody);scroll.replaceChildren(t);
   facts.textContent="Source row "+(row.r??"N/A")+" · "+group.field.options[group.field.selectedIndex].textContent+
     " · units "+(row.u||"unspecified")+". 2025 model baseline; future paths are conditional modelled outputs. Not Indonesian demand unless separately specified by IEA.";
  }
  group.field.addEventListener("change",updateItems);
  item.field.addEventListener("change",render);
  scenario.field.addEventListener("change",render);
  loading.replaceWith(controls,facts,chart,scroll,provenance);
  updateItems();
  return true;
 }).catch(e=>{loading.textContent="Full IEA model temporarily unavailable; check the original IEA source and Data Library.";const link=el("a","IEA data product ↗");link.href="https://www.iea.org/data-and-statistics/data-product/critical-minerals-dataset";link.target="_blank";link.rel="noopener noreferrer";node.append(link);console.warn("[SLI IEA full model]",e);return false});
}
window.initSLIIEA2026FullExplorer=mount;
})();
