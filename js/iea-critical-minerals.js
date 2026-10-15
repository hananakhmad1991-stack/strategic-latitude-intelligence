/* IEA Indonesia evidence module. IEA CC BY 4.0, model scope preserved. */
(function(){"use strict";
const dataPath="data/iea-indonesia-critical-minerals.json";
const E=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined&&text!==null)n.textContent=String(text);return n};
const A=(source,label)=>{const a=E("a",null,label||"IEA original source ↗");a.href=source.url;a.target="_blank";a.rel="noopener noreferrer";return a};
const valid=(x)=>typeof x==="number"&&Number.isFinite(x);
function format(m){
 const prefix=m.operator==="greater_than"?"> ":m.operator==="approximately"?"≈ ":"";
 const number=valid(m.value)?Number(m.value).toLocaleString("en-US",{maximumFractionDigits:1}):"Not extracted";
 return prefix+number+" "+(m.unit||"");
}
function render(sections,data){
 if(!Array.isArray(sections)||sections.length<9||!data||!Array.isArray(data.metrics))throw Error("Missing IEA stage or source data");
 const refs=new Map(data.sources.map(s=>[s.id,s]));
 const source=(id)=>{const value=refs.get(id);if(!value||!/^https:\/\/www\.iea\.org\//.test(value.url))throw Error("Invalid attributed IEA source: "+id);return value};
 const section=(heading,description,cls)=>{
  const panel=E("section","sli-iea-panel "+(cls||""));
  panel.append(E("div","sli-iea-eyebrow","INTERNATIONAL ENERGY AGENCY · SOURCE-DATED EVIDENCE"),E("h3",null,heading),E("p","sli-iea-desc",description));
  return panel;
 };
 const metric=(m,context)=>{
  const card=E("article","sli-iea-stat");
  card.append(E("div","sli-iea-stat-label",m.label),E("strong","sli-iea-stat-value",format(m)),
     E("p","sli-iea-stat-period",m.period||String(m.year)||"Year not published"),
     E("p","sli-iea-stat-basis",m.metric_scope));
  if(m.unit==="%"){
   const graph=E("div","sli-iea-meter");
   graph.setAttribute("role","img");
   graph.setAttribute("aria-label",m.label+": "+format(m)+", remainder of relevant denominator "+Math.max(0,100-m.value)+" percent.");
   const fill=E("div","sli-iea-meter-fill");fill.style.width=Math.max(0,Math.min(100,m.value))+"%";
   graph.append(fill);card.append(graph);
  }
  const foot=E("div","sli-iea-foot");
  foot.append(E("p",null,m.note),A(source(m.source_id),"IEA · open source ↗"));
  card.append(foot);
  return card;
 };
 // 02: Exactly one country production indicator; the existing USGS baseline is not overwritten.
 const national=section("IEA Indonesia · Nickel mining share","A separate IEA country benchmark. The USGS estimates above use their own year/vintage; shares from different agencies are not silently merged.","sli-iea-national");
 const ni=data.metrics.find(m=>m.id==="nickel_mined_share");if(ni)national.append(metric(ni));
 national.append(E("p","sli-iea-caveat","Nickel contained-metal mine production, not gross laterite ore tonnage, national reserves or smelter production."));
 sections[1].append(national);
 // 04: historical investment / ownership exposure, intentionally not the SLI project-capex tracker.
 const economics=section("IEA · Nickel capital and ownership exposure","The indicators below use different denominators and historical periods. Do not add them to BKPM realized FDI, announced projects or each other.","sli-iea-economics");
 const metrics=E("div","sli-iea-metric-grid");
 data.metrics.filter(m=>m.id!=="nickel_mined_share").forEach(m=>metrics.append(metric(m)));
 economics.append(metrics);
 const global=E("details","sli-iea-global-context"),summary=E("summary",null,"Global critical minerals signals relevant to Indonesia · actuals versus modelled outlook");
 global.append(summary,E("p","sli-iea-caveat","All indicators below are GLOBAL, not Indonesia production, consumption, FDI or regional forecasts."));
 const ggrid=E("div","sli-iea-global-grid");
 for(const item of data.global_context){
  const g=E("article","sli-iea-global-card");
  g.append(E("small",null,item.period),E("strong",null,format(item)),E("h4",null,item.headline),E("p",null,item.detail),A(source(item.source_id),"IEA publication ↗"));
  ggrid.append(g);
 }
 global.append(ggrid);economics.append(global);sections[3].append(economics);
 // 05: mineral-specific evidence explorer without replicating project or institutional charts.
 const chain=section("IEA · Indonesia mineral exposure explorer","Choose a material to separate Indonesian production evidence from global IEA market forecasts, processing risk and R&D opportunity.","sli-iea-lenses");
 const chooser=E("div","sli-iea-controls");
 const label=E("label",null,"Material / value chain"),id="sli-iea-mineral-select",select=E("select","sli-iea-select");select.id=id;
 label.setAttribute("for",id);
 for(const item of data.lenses){const option=E("option",null,item.mineral);option.value=item.mineral;select.append(option)}
 chooser.append(label,select);chain.append(chooser);
 const detail=E("div","sli-iea-material-detail");chain.append(detail);
 const show=(name)=>{
  const item=data.lenses.find(x=>x.mineral===name)||data.lenses[0];if(!item)return;
  detail.replaceChildren();
  const header=E("div","sli-iea-material-head");
  header.append(E("h4",null,item.mineral),E("span","sli-iea-status",item.status),E("p",null,item.scope));
  detail.append(header);
  const content=E("div","sli-iea-material-columns");
  for(const [heading,txt] of [["IEA finding & Indonesia relevance",item.finding],["Processing / material distinction",item.value_chain]]){
   const col=E("div","sli-iea-material-card");col.append(E("h5",null,heading),E("p",null,txt));content.append(col)
  }
  detail.append(content,E("h5",null,"Watchpoints requiring country/project-level evidence"));
  const ul=E("ul","sli-iea-watch");
  (item.issues||[]).forEach(issue=>ul.append(E("li",null,issue)));
  detail.append(ul);
  const evidence=E("div","sli-iea-refs");(item.source_ids||[]).forEach(sourceId=>evidence.append(A(source(sourceId),"IEA source · "+source(sourceId).year+" ↗")));
  detail.append(evidence);
 };
 select.addEventListener("change",()=>show(select.value));select.value=data.lenses[0]?.mineral||"";show(select.value);
 sections[4].append(chain);
 // 07: source register includes scope, publication year and IEA licence.
 const methods=section("IEA sources, scope and reuse licence","IEA original sources — CC BY 4.0. Quantitative country-level observations and global projection scenarios are distinguished.","sli-iea-methods");
 methods.append(E("p","sli-iea-attribution",data.attribution),E("p","sli-iea-caveat",data.download_status));
 const sourceTable=E("div","sli-iea-sources");
 for(const src of data.sources){
  const card=E("article","sli-iea-source");
  card.append(E("strong",null,src.title),E("p",null,src.scope),E("small",null,"IEA "+(src.published||src.year)+" · CC BY 4.0"),A(source(src.id),"Read original ↗"));
  sourceTable.append(card);
 }
 methods.append(sourceTable);sections[6].append(methods);
 // 08: editorial assessment, separate from quantitative facts and reusable by sector analysts.
 const implications=section("IEA implications for Indonesia · editorial assessment","SLI interpretation based on attributed IEA observations; not a statistical probability and not an IEA policy recommendation.","sli-iea-assessment");
 const ol=E("ol","sli-iea-watch");for(const finding of data.assessments)ol.append(E("li",null,finding));
 implications.append(ol);sections[7].append(implications);
 // 09: user-readable methodology for units/scope.
 const appendix=section("IEA methodological cautions","Evidence discipline: source dates, geography and value-chain segment cannot be mixed.","sli-iea-appendix");
 const methodList=E("ul","sli-iea-watch");
 for(const point of data.methodology||[])methodList.append(E("li",null,point));
 appendix.append(methodList);sections[8].append(appendix);
}
window.initSLIIEAMinerals=async function(sections){
 if(!Array.isArray(sections)||sections.length<9)return;
 const response=await fetch(dataPath,{cache:"no-store"});
 if(!response.ok)throw Error("IEA Indonesia evidence not published: "+response.status);
 const data=await response.json();
 if(!data?.sources?.length||!data?.metrics?.length)throw Error("Incomplete IEA evidence registry");
 render(sections,data);
};
})();