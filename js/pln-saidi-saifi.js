/* SLI · Official PLN outage continuity (2023–2025). Source granularity: PLN UNIT, never synthetic province totals. */
(()=>{"use strict";
const DATA="./data/pln-saidi-saifi-2023-2025.json",YEARS=["2023","2024","2025"];
const NS="http://www.w3.org/2000/svg";
const n=(tag,cls,label)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(label!==undefined)e.textContent=String(label);return e;};
const fmt=v=>v==null?"N/A":Number(v).toLocaleString("id-ID",{minimumFractionDigits:2,maximumFractionDigits:2});
function external(url,label){const a=n("a",null,label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;}
function field(label,value){const r=n("div","rel-datum");r.append(n("dt",null,label),n("dd",null,value));return r;}
function sNode(tag,attrs,parent){const e=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([k,v])=>e.setAttribute(k,String(v)));parent.append(e);return e;}
function option(select,value,label){const x=n("option",null,label);x.value=value;select.append(x);}
function start(root,db){
 if(root.dataset.loaded==="yes")return;root.dataset.loaded="yes";root.className="sli-rel-root";
 const unitById=new Map(db.records.map(x=>[x.id,x]));
 const state={year:"2025",metric:"saidi",province:"",unit:"aceh",scale:"sqrt",view:"all"};
 const head=n("header","rel-head");
 head.append(n("div","rel-kicker","PLN · OFFICIAL ANNUAL STATISTICS · 2023–2025"),n("h2",null,"Electricity Reliability | SAIDI & SAIFI"));
 head.append(n("p",null,"Compare electricity interruption duration and frequency by PLN service unit, with a 38-province locator and original-source inspector. Lower figures generally indicate better continuity; these are not verified feeder-level or provincial-total statistics."));
 const controls=n("div","rel-controls");
 function control(label,values){
  const wrap=n("label","rel-control");wrap.append(n("span",null,label));const select=n("select");select.setAttribute("aria-label",label);
  for(const [value,txt] of values)option(select,value,txt);wrap.append(select);controls.append(wrap);return select;
 }
 const province=control("Province / Wilayah",[["","All PLN reporting units"],...db.provinces.map(x=>[x.name,x.name])]);
 const year=control("Reporting year",YEARS.map(x=>[x,x]));
 const metric=control("Indicator",[["saidi","SAIDI · hours/customer"],["saifi","SAIFI · interruptions/customer"]]);
 const scope=control("Show",[["all","All PLN reporting units"],["province","Selected province's linked units"]]);
 const scale=control("Bar display scale",[["sqrt","Square-root display scale"],["linear","Linear display scale"]]);
 year.value=state.year;metric.value=state.metric;scope.value=state.view;scale.value=state.scale;
 const kpis=n("div","rel-kpis");
 const k1=n("div","rel-kpi"),k2=n("div","rel-kpi"),k3=n("div","rel-kpi");
 kpis.append(k1,k2,k3);
 const main=n("div","rel-layout"),left=n("div","rel-left"),inspector=n("aside","rel-inspector");
 inspector.setAttribute("aria-live","polite");
 const charts=n("div","rel-chart-grid"),barsWrap=n("section","rel-viz"),trendWrap=n("section","rel-viz");
 const barsTitle=n("h3",null,"PLN service-unit comparison");
 const barsNote=n("p","rel-mininote","Click a reporting unit to inspect scope, source, trend and interpretation.");
 const bars=n("div","sli-reliability-bars");bars.setAttribute("data-sli-visual-bars","");bars.dataset.sliVisualExportId="pln-saidi-saifi-unit-bars";
 barsWrap.append(barsTitle,barsNote,bars);
 const trendHead=n("h3",null,"Historical continuity · 2023–2025");
 const trendText=n("p","rel-mininote","National published aggregate and selected PLN reporting unit; no province-level interpolation.");
 const plot=n("div","rel-plot"),svg=sNode("svg",{viewBox:"0 0 670 280",role:"img","aria-label":"SAIDI or SAIFI 2023 to 2025 for Indonesia and selected PLN unit"},plot);
 plot.dataset.sliVisualExportId="pln-saidi-saifi-trend";
 trendWrap.append(trendHead,trendText,plot);
 charts.append(barsWrap,trendWrap);left.append(charts);main.append(left,inspector);
 const foot=n("div","rel-method");
 foot.append(n("strong",null,"Data integrity & decision use"),n("p",null,"PLN reports its interruption indicators by service unit. A shared UID covering several provinces is not a province-only observation. Kepulauan Riau includes a separately reported PLN Batam operating area. The Papua unit uses historical territorial naming; newer Papua provinces have no verified standalone records here. National averages are publisher-reported, never the simple average of the displayed units. These values cannot certify power quality or firm capacity at an investor's particular site."));
 const sources=n("p","rel-sources","Original sources: ");
 YEARS.forEach((y,i)=>{if(i)sources.append(" · ");sources.append(external(db.sources[y],"PLN Statistics "+y+" · Table 16 ↗"));});
 foot.append(sources);
 root.append(head,controls,kpis,main,foot);
 function getProvince(){return db.provinces.find(x=>x.name===state.province);}
 function linkedUnits(){return (getProvince()?.reporting_unit_ids||[]).map(x=>unitById.get(x)).filter(Boolean);}
 function currentUnit(){return unitById.get(state.unit);}
 function unitValue(row,y=state.year){return row?.values?.[y]?.[state.metric]??null;}
 function unitClassification(row){if(!row)return "No verified unit";
  if(row.scope==="distinct_operator_batam")return "Batam licensed PLN operating company · not Kepri-wide";
  if(row.scope==="multi_province_pln_unit")return "Shared multi-province PLN reporting unit · regional proxy only";
  if(row.scope==="legacy_unit_label_scope_unverified")return "Historical Papua unit name · administrative coverage not validated";
  return "Single-province-labelled PLN unit · not a verified province aggregate";
 }
 function drawKpis(){
  const y=state.year,m=state.metric,p=getProvince(),u=currentUnit();
  const set=(box,cap,big,note)=>{box.replaceChildren(n("small",null,cap),n("strong",null,big),n("p",null,note));};
  set(k1,"INDONESIA · "+y,fmt(db.national[y][m]),db.indicators[m].unit+" · official national weighted aggregate");
  set(k2,"SELECTED PLN SERVICE UNIT",u?fmt(unitValue(u)):"N/A",u?u.unit:"Select a reporting unit to view its observed value");
  set(k3,p?"PROVINCE LOCATOR":"PUBLISHER SOURCE COVERAGE",p?.name||db.records.length+" reporting units",p?(p.granularity==="province_data_not_separately_available"?"Not separately published / unverified":linkedUnits().length>1?"Multiple overlapping reported units · no province-wide aggregate":linkedUnits().length===1?unitClassification(linkedUnits()[0]):"No verified provincial data"):"38 provinces indexed; values remain PLN-unit level");
 }
 function detail(){
  inspector.replaceChildren();
  const p=getProvince(),u=currentUnit(),linked=linkedUnits(),value=unitValue(u);
  inspector.append(n("div","rel-inspector-kicker","SELECTED OBSERVATION · ORIGINAL SOURCE"));
  inspector.append(n("h3",null,u?u.unit:"Select a PLN reporting unit"));
  if(p){
   const pnote=n("p","rel-scope-warning",p.name+": "+(p.granularity==="province_data_not_separately_available"?"No verified disaggregated SAIDI/SAIFI for this new Papua province. The legacy PLN Papua unit must not be assigned to this province.":p.granularity==="multiple_overlapping_pln_service_units"?"Two reported PLN operating scopes intersect here. They are not additive and cannot be averaged into one province figure.":p.granularity==="multi_province_unit_proxy"?"The displayed data refer to the wider PLN reporting unit, not exclusively to this province.":"PLN unit value labelled for this province, not a independently verified geographic province-wide aggregate."));
   inspector.append(pnote);
   if(linked.length>1){const info=n("p","rel-mininote","Linked units: "+linked.map(x=>x.unit).join(" | "));inspector.append(info);}
  }
  if(u){
   const dl=n("dl","rel-data");
   dl.append(field("SAIDI · "+state.year,fmt(u.values[state.year].saidi)+" hours/customer"),field("SAIFI · "+state.year,fmt(u.values[state.year].saifi)+" interruptions/customer"),field("Reporting scope",unitClassification(u)),field("Named provinces / areas",u.provinces.join(", ")));
   if(u.values[String(Number(state.year)-1)]){const prev=u.values[String(Number(state.year)-1)][state.metric],cur=unitValue(u);dl.append(field("Change from previous year",(cur>=prev?"+":"")+fmt(cur-prev)+" "+(state.metric==="saidi"?"hours/customer":"times/customer")+" (absolute)"));}
   inspector.append(dl);
   inspector.append(n("p","rel-mininote",u.id==="aceh"&&state.year==="2025"?"2025 Aceh has an exceptional reported SAIDI value (212.47). Confirm the underlying disturbance events and PLN measurement notes before inferring a permanent deterioration.":"SAIDI quantifies outage duration; SAIFI quantifies event frequency. One can move without the other. These are descriptive source observations, not site-specific uptime guarantees."));
   inspector.append(external(db.sources[state.year],"Read original PLN Statistics "+state.year+" · Table 16 ↗"));
  }else inspector.append(n("p","rel-scope-warning","This province has no separately validated reporting-unit mapping in the current source edition. No numeric provincial estimate is inserted."));
  inspector.append(n("p","rel-method-note","SLI evidence class: official secondary statistics · annual, PLN-unit granularity · reporting year "+state.year+". Date of dataset review: "+db.as_of+"."));
 }
 function drawBars(){
  const m=state.metric,y=state.year,max=Math.max(...db.records.map(x=>unitValue(x))),arr=state.view==="province"&&state.province?linkedUnits():db.records.slice();
  arr.sort((a,b)=>unitValue(b)-unitValue(a));bars.replaceChildren();
  if(!arr.length){bars.append(n("p","rel-scope-warning","No verified reporting-unit observation for the selected province; choose All PLN reporting units to inspect the published table."));return;}
  for(const u of arr){
   const v=unitValue(u),pct=100*(state.scale==="sqrt"?Math.sqrt(v/max):v/max);
   const button=n("button","rel-row"+(state.unit===u.id?" active":""),null);button.type="button";button.title="Inspect "+u.unit+" · "+y;button.dataset.unit=u.id;
   const first=n("span","rel-name",u.unit),track=n("span","rel-track"),fill=n("span","rel-fill");fill.style.width=Math.max(2,pct)+"%";track.append(fill);
   const number=n("span","rel-value",fmt(v));button.append(first,track,number);
   button.addEventListener("click",()=>{state.unit=u.id;drawBars();drawTrend();drawKpis();detail();});
   bars.append(button);
  }
  barsNote.textContent="Reporting year "+y+" · "+db.indicators[m].unit+". Ordered from higher to lower interruption impact; bar width "+(state.scale==="sqrt"?"uses a square-root visual scale to preserve smaller values":"uses a linear visual scale")+". The printed numbers are always the original reported values.";
 }
 function drawTrend(){
  svg.replaceChildren();const m=state.metric,u=currentUnit(),series=[{name:"Indonesia",values:YEARS.map(y=>db.national[y][m]),color:"#d7b678"}];
  if(u)series.push({name:u.unit,values:YEARS.map(y=>unitValue(u,y)),color:"#80bdde"});
  const max=Math.max(1,...series.flatMap(x=>x.values))*1.10,L=68,R=18,T=32,B=48,W=670,H=280;
  const px=i=>L+(W-L-R)*i/(YEARS.length-1),py=v=>H-B-(v/max)*(H-B-T);
  for(let tick=0;tick<=4;tick++){const v=max*tick/4,y=py(v);sNode("line",{x1:L,y1:y,x2:W-R,y2:y,stroke:"#38556a","stroke-width":1},svg);const t=sNode("text",{x:L-10,y:y+4,"text-anchor":"end",fill:"#b7cad8","font-size":12},svg);t.textContent=fmt(v);}
  YEARS.forEach((year,i)=>{const label=sNode("text",{x:px(i),y:H-18,"text-anchor":"middle",fill:"#d7e2e9","font-size":13},svg);label.textContent=year;});
  series.forEach((item,index)=>{
   sNode("polyline",{points:item.values.map((v,i)=>px(i)+","+py(v)).join(" "),stroke:item.color,"stroke-width":3,fill:"none"},svg);
   item.values.forEach((v,i)=>{const point=sNode("circle",{cx:px(i),cy:py(v),r:5,fill:item.color,stroke:"#0a2031","stroke-width":2},svg);sNode("title",{},point).textContent=item.name+" · "+YEARS[i]+": "+fmt(v)+" "+db.indicators[m].unit;});
   const label=sNode("text",{x:18,y:15+index*15,fill:item.color,"font-size":12},svg);label.textContent=(index===0?"● National":"● "+item.name).slice(0,88);
  });
  trendText.textContent="Official annual observations. "+(u?"Blue = "+u.unit+"; gold = national published aggregate.":"Gold = national published aggregate.")+" National values are not calculated from an average of the displayed units.";
 }
 function exportRegister(){
  const svc=window.SLIVisualExport;if(!svc?.register)return;
  const chosen=()=>db.records.filter(x=>state.view!=="province"||!state.province||linkedUnits().some(z=>z.id===x.id)).slice().sort((a,b)=>unitValue(b)-unitValue(a));
  svc.register(bars,{getData:()=>({kind:"verified-provider",headers:["Reporting year","PLN reporting unit","Named administrative coverage","SAIDI (hours/customer)","SAIFI (interruptions/customer)","Reporting scope","Source URL"],rows:chosen().map(u=>[Number(state.year),u.unit,u.provinces.join("; "),u.values[state.year].saidi,u.values[state.year].saifi,unitClassification(u),db.sources[state.year]])}),getMeta:()=>({title:"PLN SAIDI SAIFI by service unit "+state.year,source:"PT PLN (Persero) · PLN Statistics, Table 16",sourceUrl:db.sources[state.year],period:state.year,completeness:"Published PLN units, NOT separately observed 38 province values"})});
  svc.register(svg,{getData:()=>({kind:"verified-provider",headers:["Year","Scope","SAIDI (hours/customer)","SAIFI (interruptions/customer)","Source URL"],rows:YEARS.flatMap(y=>[[Number(y),"Indonesia",db.national[y].saidi,db.national[y].saifi,db.sources[y]],...(currentUnit()?[[Number(y),currentUnit().unit,currentUnit().values[y].saidi,currentUnit().values[y].saifi,db.sources[y]]]:[])])}),getMeta:()=>({title:"PLN outage history 2023–2025 · "+(currentUnit()?.unit||"Indonesia"),source:"PT PLN (Persero) · PLN Statistics Table 16",sourceUrl:db.sources["2025"],period:"2023–2025",completeness:"Official publisher-reported national and selected service-unit observations; no synthetic province totals"})});
 }
 function draw(){drawKpis();drawBars();drawTrend();detail();exportRegister();}
 province.addEventListener("change",()=>{state.province=province.value;const units=linkedUnits();state.unit=units[0]?.id||"";draw();});
 year.addEventListener("change",()=>{state.year=year.value;draw();});
 metric.addEventListener("change",()=>{state.metric=metric.value;draw();});
 scope.addEventListener("change",()=>{state.view=scope.value;draw();});
 scale.addEventListener("change",()=>{state.scale=scale.value;draw();});
 document.addEventListener("sli:exportready",exportRegister);
 const params=new URLSearchParams(location.search),p=params.get("province");if(p&&db.provinces.some(x=>x.name===p)){state.province=p;province.value=p;state.unit=linkedUnits()[0]?.id||"";}
 draw();
}
async function init(){const roots=Array.from(document.querySelectorAll("[data-sli-reliability-root]"));if(!roots.length)return;
 try{const r=await fetch(DATA,{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);const data=await r.json();if(data.records?.length!==23||data.provinces?.length!==38)throw Error("Incomplete PLN source registry");for(const root of roots)start(root,data);}
 catch(e){for(const root of roots){root.replaceChildren(n("p","rel-scope-warning","PLN reliability source data unavailable: "+e.message));}}}
window.initSLIReliability=init;
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
