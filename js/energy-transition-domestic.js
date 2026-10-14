/* SLI Transition / Provincial RUED / Domestic Intelligence */
(function(){
"use strict";
const svgNS="http://www.w3.org/2000/svg";
function dom(tag,text,cls){const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=String(text);if(cls)e.className=cls;return e}
function add(parent,...children){parent.append(...children);return parent}
function a(url,label){const e=dom("a",label);e.href=url;e.target="_blank";e.rel="noopener noreferrer";return e}
function h(parent,text,sub){const d=dom("div",null,"section");add(d,dom("h2",text),dom("span",sub));parent.append(d)}
function panel(parent){const e=dom("div",null,"panel");parent.append(e);return e}
function kpi(parent,label,value,desc,source){const e=dom("div",null,"card tr-kpi");e.style.cursor="default";add(e,dom("div",label,"eyebrow"),dom("h2",value,"tr-value"),dom("p",desc));if(source)e.append(a(source,"Official source ↗"));parent.append(e)}
function svg(tag,props,parent){const n=document.createElementNS(svgNS,tag);Object.entries(props||{}).forEach(([k,v])=>n.setAttribute(k,v));if(parent)parent.append(n);return n}
function fmt(n){return Number(n).toLocaleString("en-US",{maximumFractionDigits:2})}
function warning(parent,s){add(parent,dom("div",s,"tr-note"))}
function buildRUED(root,d){
 root.replaceChildren();
 h(root,"RUED — Provincial Energy Plan Implementation","DEN / ESDM · individual province targets");
 const grid=dom("div",null,"grid tr-grid");
 kpi(grid,"National planning framework","PP 40/2025","KEN regulatory update; RUED is implemented at provincial level.",d.sources.ken);
 kpi(grid,"National EBT mix — 2025","15.75%","Reported national primary energy mix, not the province-specific RUED attainment.",d.sources.esdm);
 kpi(grid,"East Java RUED target 2025","12.15%","Legal provincial target, not a verified achievement or national benchmark.",d.sources.jatim);
 kpi(grid,"East Java RUED target 2050","23.76%","Provincial Regulation No. 3 of 2024; realization requires its own official release.",d.sources.jatim);
 root.append(grid);
 const pane=panel(root);add(pane,dom("h3","How RUED progress is assessed"),dom("p","RUED achievement requires province-specific actual primary-energy mix, adopted targets, operating clean-energy projects and annual execution evidence. We have not verified a single national RUED completion percentage."));
 const method=dom("p",null,"tr-link");add(method,a(d.sources.den,"DEN 2025 annual performance report ↗"),document.createTextNode(" · "),a(d.sources.jatim,"East Java RUED regulation ↗"));pane.append(method);
 warning(root,"Do not compare East Java's 12.15% target directly with national 15.75% achievement. The prior national RUEN 23% (2025) target belongs to the older planning framework; PP 40/2025 updates the KEN framework.");
}
function drawEmission(svgEl,points,key,onPick){
 svgEl.replaceChildren();const W=840,H=310,L=75,T=24,B=46,R=25,ph=H-T-B,pw=W-L-R;
 svgEl.setAttribute("viewBox","0 0 "+W+" "+H);
 const values=points.map(x=>x[key]);const max=Math.max(...values)*1.17;const X=i=>L+pw*(i/(points.length-1||1));const Y=v=>T+ph*(1-v/max);
 [0,.25,.5,.75,1].forEach(m=>{const y=Y(max*m);svg("line",{x1:L,x2:W-R,y1:y,y2:y,stroke:"#3a536b"},svgEl);const t=svg("text",{x:L-12,y:y+3,fill:"#b9d1e1","text-anchor":"end","font-size":11},svgEl);t.textContent=fmt(max*m)});
 svg("polyline",{points:points.map((x,i)=>X(i)+","+Y(x[key])).join(" "),fill:"none",stroke:"#d7b678","stroke-width":3},svgEl);
 points.forEach((row,i)=>{
 const cx=X(i),cy=Y(row[key]),hit=svg("circle",{cx,cy,r:5.8,fill:"#d7b678",role:"button",tabindex:"0","aria-label":row.year+" "+fmt(row[key])+" million tons CO2 equivalent"},svgEl);
 hit.style.cursor="pointer";
 const choose=()=>onPick(row);
 hit.addEventListener("click",choose);hit.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose()}});
 if(i%2===0||points.length<=8){const t=svg("text",{x:cx,y:H-21,fill:"#b9d1e1","text-anchor":"middle","font-size":11},svgEl);t.textContent=row.year}
 });
 const ylab=svg("text",{x:L,y:14,fill:"#b9d1e1","font-size":12},svgEl);ylab.textContent="MtCO2e / year";
}
function buildTransition(root,d){
 root.replaceChildren();
 h(root,"Indonesia Net Zero Transition & Carbon Dashboard","Policy commitments, delivered capacity & emissions inventory");
 warning(root,"Indonesia's national long-term NZE commitment is 2060 or sooner. ESDM's 2026 discussion of a 2050–2060 transition is not a verified national deadline of 2050. The below metrics distinguish targets from outcomes.");
 const grid=dom("div",null,"grid tr-grid");
 kpi(grid,"National long-term pathway","NZE 2060","Or sooner, conditional on implementation and national commitments.",d.sources.nze);
 kpi(grid,"Realized EBT primary mix","15.75%","2025 reported achievement, not the 2025 target.",d.sources.esdm);
 kpi(grid,"KEN EBT goal for 2025","17–20%","Revised KEN reporting, ESDM 2025. Older 23% RUEN benchmark separately archived.",d.sources.ebt2025);
 kpi(grid,"2034 RUPTL planned additions","69.5 GW","RUPTL 2025–2034; not constructed capacity.",d.sources.ruptl);
 root.append(grid);
 const m=panel(root);add(m,dom("h3","2025 EBT actual vs revised KEN range"),dom("p","Actual 15.75% vs reference band 17–20% (percentage of primary energy, not grid capacity)."));
 const bar=dom("div",null,"tr-band");const fill=dom("div",null,"tr-band-fill");fill.style.width="78.75%";bar.append(fill);const min=dom("div",null,"tr-band-marker");min.style.left="85%";bar.append(min);m.append(bar);
 add(m,dom("p","2025 shortfall: 1.25–4.25 percentage points against the published revised range. Not a linear percentage of the journey to NZE.","tr-detail"),a(d.sources.ebt2025,"ESDM EBTKE 2025 performance report ↗"));
 h(root,"Historical Indonesian Greenhouse-Gas Emissions","BPS / KLHK national GHG inventory · 2010–2023");
 const p=panel(root);const controls=dom("div",null,"tr-controls");
 const metric=dom("select",null,"tr-select");[["energy_mtco2e","Energy-sector GHG"],["national_mtco2e","Total national GHG (all sectors)"]].forEach(([v,t])=>{const o=dom("option",t);o.value=v;metric.append(o)});
 const start=dom("select",null,"tr-select");[2010,2015,2019,2021].forEach(y=>{const o=dom("option",String(y));o.value=String(y);start.append(o)});
 const button=dom("button","Download CSV","tr-btn");button.type="button";const label=(str,ctrl)=>{const l=dom("label",str);l.append(ctrl);controls.append(l)};
 label("Emissions series",metric);label("From year",start);controls.append(button);p.append(controls);
 const plot=dom("div",null,"tr-chart");const chart=svg("svg",{role:"img","aria-label":"Historical BPS Indonesia greenhouse gas annual inventory",style:"width:100%;min-width:460px;display:block"},plot);p.append(plot);
 const info=dom("p","Select a point to inspect the emissions inventory.","tr-detail");p.append(info);
 const foot=dom("p","This is annual GHG emitted (CO2-equivalent). It is not the cumulative avoided emissions figure from ESDM mitigation programs. The all-sector inventory includes land use and peat fires.","tr-detail");p.append(foot);
 p.append(a(d.sources.bps,"BPS: Greenhouse gas emissions by sector, 2000–2023 ↗"));
 function render(){
 const pts=d.emissions.series.filter(x=>x.year>=Number(start.value));drawEmission(chart,pts,metric.value,row=>{info.textContent=row.year+" · "+(metric.value==="energy_mtco2e"?"Energy":"National")+" GHG emissions: "+fmt(row[metric.value])+" MtCO2e."});
 const row=pts[pts.length-1];info.textContent="Latest available inventory: "+row.year+" · "+fmt(row[metric.value])+" MtCO2e. Point-in-time inventory up to 2023; later-year figures have not been assumed.";
 }
 metric.addEventListener("change",render);start.addEventListener("change",render);render();
 button.addEventListener("click",()=>{
 const cols=["year","energy_mtco2e","national_mtco2e"];
 const rows=d.emissions.series.filter(x=>x.year>=Number(start.value));
 const csv=[cols.join(","),...rows.map(x=>cols.map(k=>x[k]).join(","))].join("\r\n");
 const u=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=dom("a");a.href=u;a.download="SLI-Indonesia-BPS-GHG-inventory.csv";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
 });
 h(root,"Mitigation Achievements Are Not Emissions Inventory","ESDM reported reductions / avoided emissions");
 const mitigation=panel(root);add(mitigation,dom("h3","Energy-sector reported emissions reductions"),
 dom("p","2024 achieved: 147.61 MtCO2e reduction (verification caveat in contemporary ESDM reporting); 2025 performance report cites 165.31 MtCO2e. These reductions must NOT be subtracted mechanically from national inventory data."));
 const tb=dom("div");tb.style.overflowX="auto";const table=dom("table");table.innerHTML="<thead><tr><th>Year</th><th>Target reduction (MtCO2e)</th><th>Reported achievement (MtCO2e)</th></tr></thead>";
 const tbody=dom("tbody");d.mitigation.series.forEach(row=>{const tr=dom("tr");[row.year,row.target,row.achievement].forEach(val=>tr.append(dom("td",val)));tbody.append(tr)});table.append(tbody);tb.append(table);mitigation.append(tb);
 const links=dom("p",null,"tr-link");add(links,a(d.sources.reductions,"ESDM 2019–2024 series ↗"),document.createTextNode(" · "),a(d.sources.ebt2025,"ESDM 2025 report ↗"));mitigation.append(links);
 h(root,"RUPTL Implementation Watch","2034 planned additions; monitor commissioning evidence");
 const cap=dom("div",null,"grid tr-grid");
 kpi(cap,"Renewables planned","42.6 GW","RUPTL 2025–2034 additions; not delivered.",d.sources.ruptl);
 kpi(cap,"Storage planned","10.3 GW","Battery and pumped storage; separate from renewable generation.",d.sources.ruptl);
 kpi(cap,"Fossil generation planned","16.6 GW","New additions include fossil capacity; avoid implying full decarbonization.",d.sources.ruptl);
 kpi(cap,"2034 total additions","69.5 GW","76% of additions include EBT plus storage, not 76% renewable electricity.",d.sources.ruptl);
 root.append(cap);
 const z=panel(root);add(z,dom("h3","Strategic transition interpretation"),
 dom("p","A rising renewable share alone does not establish falling national greenhouse-gas emissions. Compare absolute GHG inventory, actual clean electricity generated, fossil generation and transmission investments."),
 dom("p","Regional RUED execution and project commissioning determine how national plans translate into delivered outcomes. Before revising assessments, validate plant COD, network integration and energy-mix definitions."));
}
function buildDomestic(root,d){
 root.replaceChildren();
 h(root,"Indonesia Domestic Energy & Environmental Intelligence","RSS-based source discovery · scheduled every 3 hours");
 warning(root,"Latest reports are attributed news leads, not independently verified outage, scarcity, wildfire or commissioned-project claims. Automated impact notes are conditional analysis and need original-source confirmation.");
 const status=dom("div","Waiting for first domestic monitoring scan","tr-status");root.append(status);
 const controls=dom("div",null,"tr-controls");const cat=dom("select",null,"tr-select");const all=dom("option","All categories");all.value="all";cat.append(all);
 const search=dom("input",null,"tr-select");search.type="search";search.placeholder="Search location, PLN, BBM, regulation…";
 const label=(txt,x)=>{const l=dom("label",txt);l.append(x);controls.append(l)};
 label("Category",cat);label("Search",search);root.append(controls);
 const listing=dom("div",null,"tr-news");root.append(listing);
 h(root,"Verified Editorial Watch Notes","Dated official incidents · not automatic live updates");
 const examples=[
 {date:"12 Oct 2026",cat:"Forest fires",title:"BNPB: wildfire response in Central Sulawesi",text:"BNPB reported a 1-hectare fire on 11 October in Tojo Una-Una that responders extinguished that day; other locations were also reported.",impact:"Watch nearby transmission and distribution assets and haze; this report does NOT establish power supply disruption.",href:"https://ppid.bnpb.go.id/berita/perkembangan-situasi-dan-penanganan-bencana-di-tanah-air-tanggal-12-oktober-2026-MBPJ"},
 {date:"1–14 Oct 2026",cat:"Coal regulation",title:"First-period October HBA decision",text:"ESDM published the first-period October 2026 HBA reference-price decree in JDIH. A government pricing decision is not itself a shipment or price-realization statistic.",impact:"Check coal sales reference, quality grades and subsequent second-period decree before interpreting export or PLN fuel costs.",href:"https://jdih.esdm.go.id/"}
 ];
 examples.forEach(x=>{const e=panel(root);e.append(dom("div",x.date+" · "+x.cat,"eyebrow"),dom("h3",x.title),dom("p",x.text),dom("p","Indonesia energy relevance: "+x.impact),a(x.href,"Original official source ↗"))});
 const controlsState={reports:[]};
 function draw(){
 listing.replaceChildren();
 const q=search.value.toLowerCase().trim();
 const xs=controlsState.reports.filter(x=>(cat.value==="all"||x.category===cat.value)&&(!q||[x.title,x.publisher,x.category].join(" ").toLowerCase().includes(q)));
 if(!xs.length){listing.append(dom("p",controlsState.reports.length?"No reports match this filter.":"No attributed reports available from the latest scan.","tr-detail"));return}
 xs.forEach(x=>{
  const e=dom("article",null,"tr-news-card");
  const date=new Date(x.published_at_utc);
  e.append(dom("div",x.category+" · "+x.publisher,"eyebrow"),a(x.url,x.title),dom("div",isNaN(date.getTime())?"Date unverified":date.toLocaleString("en-GB",{timeZone:"Asia/Jakarta",dateStyle:"medium",timeStyle:"short"})+" WIB","tr-detail"));
  e.append(dom("p","Possible energy impact: "+x.analysis),dom("p","Verify: "+x.evidence_to_check,"tr-detail"),dom("p","Status: "+x.claim_status,"tr-detail"));
  listing.append(e);
 });
 }
 async function load(){
 try{
  const res=await fetch("data/domestic-energy.json",{cache:"no-store"});if(!res.ok)throw Error("not published");
  const data=await res.json();if(!Array.isArray(data.reports))throw Error("bad schema");
  controlsState.reports=data.reports;
  const t=new Date(data.checked_at_utc),age=(Date.now()-t.getTime())/36e5;status.textContent="Latest saved scan: "+t.toLocaleString("en-GB",{timeZone:"Asia/Jakarta",dateStyle:"medium",timeStyle:"short"})+" WIB"+(age>6?" · Older than monitoring target":"")+" · "+data.reports.length+" attributed reports";
  [...new Set(data.reports.map(x=>x.category))].sort().forEach(v=>{const o=dom("option",v);o.value=v;cat.append(o)});
  draw();
 }catch(err){status.textContent="Awaiting the first published domestic news dataset";listing.append(dom("p","The scheduled watcher has not yet produced a verified source feed. Dated official editorial notes remain visible below.","tr-detail"))}
 }
 cat.addEventListener("change",draw);search.addEventListener("input",draw);load();
}
window.initSLITransition=async function(){
 const rued=document.getElementById("energyRUEDRoot"),transition=document.getElementById("energyTransitionRoot"),domestic=document.getElementById("domesticRadarRoot");
 if(domestic)buildDomestic(domestic);
 if(!rued&&!transition)return;
 try{
 const res=await fetch("data/energy-transition.json",{cache:"no-store"});if(!res.ok)throw Error("dataset unavailable");
 const d=await res.json();
 if(rued)buildRUED(rued,d);if(transition)buildTransition(transition,d);
 }catch(err){
 for(const x of [rued,transition])if(x)x.textContent="NZE / RUED dataset temporarily unavailable; original Energy Security monitor remains accessible.";
 }
};
})();
