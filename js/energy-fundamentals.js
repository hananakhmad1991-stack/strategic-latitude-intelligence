/* SLI Energy Fundamentals Explorer: ESDM-sourced dated observations; no live claims. */
(function(){
"use strict";
const NS="http://www.w3.org/2000/svg";
const palette={gold:"#d7b678",blue:"#67b7ef",grid:"#3b536c",ink:"#b4cde0"};
function node(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e}
function elSvg(tag,attrs,parent){const e=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([key,val])=>e.setAttribute(key,val));if(parent)parent.appendChild(e);return e}
function fmt(v){return Number(v).toLocaleString("en-US",{maximumFractionDigits:3})}
function link(url,title){const a=node("a",null,title);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a}
function heading(name,side){const h=node("div","section");h.append(node("h2",null,name),node("span",null,side));return h}
function card(parent,kicker,value,foot,source){const e=node("div","card ef-kpi");e.style.cursor="default";e.append(node("div","eyebrow",kicker),node("h2","ef-value",value),node("p",null,foot));if(source)e.append(link(source,"Official source ↗"));parent.append(e)}
function chart(svg,points,kind,unit,selected){
 const W=760,H=310,L=76,T=18,B=55,R=26,plotW=W-L-R,plotH=H-T-B;
 svg.replaceChildren();svg.setAttribute("viewBox","0 0 "+W+" "+H);
 const values=points.map(x=>x[1]);const max=Math.max(...values,1)*1.16;const step=plotW/points.length;
 const y=v=>T+plotH-(v/max)*plotH;const cx=i=>L+step*(i+.5);
 for(let k=0;k<=4;k++){const n=max*k/4,yy=y(n);elSvg("line",{x1:L,y1:yy,x2:W-R,y2:yy,stroke:palette.grid,"stroke-width":.8},svg);
 const lab=elSvg("text",{x:L-12,y:yy+4,fill:palette.ink,"text-anchor":"end","font-size":11},svg);lab.textContent=Number(n.toFixed(2)).toLocaleString("en-US");}
 if(kind==="line"){const line=elSvg("polyline",{points:points.map((p,i)=>cx(i)+","+y(p[1])).join(" "),fill:"none",stroke:palette.gold,"stroke-width":3},svg)}
 points.forEach(([year,value],i)=>{
 const x=cx(i),yy=y(value);
 const b=kind==="line"?elSvg("circle",{cx:x,cy:yy,r:7,fill:palette.gold,stroke:"#243e55","stroke-width":2},svg):
 elSvg("rect",{x:x-Math.min(48,step*.62)/2,y:yy,width:Math.min(48,step*.62),height:T+plotH-yy,rx:4,fill:palette.gold},svg);
 b.setAttribute("tabindex","0");b.setAttribute("role","button");b.setAttribute("aria-label",year+": "+fmt(value)+" "+unit);
 b.style.cursor="pointer";b.addEventListener("click",()=>selected(year,value));b.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selected(year,value)}});
 const lbl=elSvg("text",{x,y:H-25,fill:palette.ink,"font-size":12,"text-anchor":"middle"},svg);lbl.textContent=year;
 });
 const lbl=elSvg("text",{x:L,y:12,fill:palette.ink,"font-size":11},svg);lbl.textContent=unit;
}
function buildExplorer(root,data){
 root.append(heading("Historical Production, Trade & Reserves Explorer","Interactive official time series · 2020–2025"));
 const pane=node("div","panel");
 const controls=node("div","ef-controls");
 const field=(name,el)=>{const wrap=node("label",null,name);wrap.append(el);controls.append(wrap);return el};
 const series=field("Indicator",node("select","ef-select"));
 const scopes=[["oil_gas","Oil and Gas"],["coal","Coal, DMO & Exports"],["reserves","Proved Reserves"],["renewable","Renewable Share"]];
 for(const [category,label] of scopes){const grp=node("optgroup");grp.label=label;Object.entries(data.series).filter(([k,v])=>v.domain===category).forEach(([k,v])=>{const opt=node("option",null,v.name);opt.value=k;grp.append(opt)});series.append(grp)}
 const type=field("Chart style",node("select","ef-select"));for(const mode of ["line","bar"]){const o=node("option",null,mode==="line"?"Line":"Bar");o.value=mode;type.append(o)}
 const from=field("From year",node("select","ef-select"));const reset=node("button","ef-btn","Reset");reset.type="button";const dl=node("button","ef-btn","Download CSV");dl.type="button";controls.append(reset,dl);
 const plot=node("div","ef-plot");const svg=elSvg("svg",{role:"img","aria-label":"Interactive energy fundamentals series",style:"width:100%;min-width:400px;display:block"},plot);
 const info=node("p","ef-detail","Click a bar or point to read a dated observation.");
 const foot=node("p","ef-detail");
 const sources=node("div","ef-source");pane.append(controls,plot,info,foot,sources);
 root.append(pane);
 function render(){
 const selected=data.series[series.value];if(!selected)return;
 from.replaceChildren();const keys=Object.keys(selected.values).sort();keys.forEach(year=>{const o=node("option",null,year);o.value=year;from.append(o)});
 from.value=keys[0];draw();
 }
 function draw(){
 const current=data.series[series.value];const pts=Object.entries(current.values).filter(([year])=>Number(year)>=Number(from.value)).map(([year,value])=>[year,Number(value)]).sort((a,b)=>Number(a[0])-Number(b[0]));
 if(!pts.length)return;
 plot.style.overflowX="auto";chart(svg,pts,type.value,current.unit,(year,value)=>{info.textContent=year+" · "+current.name+": "+fmt(value)+" "+current.unit});
 info.textContent="Latest annual observation: "+pts[pts.length-1][0]+" · "+fmt(pts[pts.length-1][1])+" "+current.unit+" · Click chart marks for any year.";
 foot.textContent=current.note;
 sources.replaceChildren(node("span",null,"Primary sources: "));
 current.sources.forEach((href,i)=>{if(i)sources.append(node("span",null," · "));sources.append(link(href,"Official publication "+(i+1)+" ↗"))});
 }
 series.value="oil_lifting";type.value="line";render();
 series.addEventListener("change",render);type.addEventListener("change",draw);
 from.addEventListener("change",draw);
 reset.addEventListener("click",()=>{series.value="oil_lifting";type.value="line";render()});
 dl.addEventListener("click",()=>{
 const s=data.series[series.value];const rows=Object.entries(s.values).filter(([y])=>Number(y)>=Number(from.value));
 const clean=x=>'"'+String(x).replace(/"/g,'""')+'"';
 const csv=[["year","value","unit","indicator","source"],...rows.map(([y,v])=>[y,v,s.unit,s.name,s.sources[0]])].map(r=>r.map(clean).join(",")).join("\r\n");
 const obj=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));const a=node("a");a.href=obj;a.download="SLI-"+series.value+".csv";a.click();setTimeout(()=>URL.revokeObjectURL(obj),1000);
 });
}
function buildReserves(root,d){
 root.append(heading("Indonesia's Proven Reserves & Coal Resource Base","Different geological and commercial classifications"));
 const grid=node("div","grid ef-grid");
 const items=[
 ["Oil · proved P1",fmt(d.oil_proved.value)+" bn bbl","2025 · commercially recoverable, proven",d.oil_proved.source],
 ["Gas · proved P1",fmt(d.gas_proved.value)+" TSCF","2025 · commercially recoverable, proven",d.gas_proved.source],
 ["Coal · reserves",fmt(d.coal_reserves.value)+" bn t","H1 2025 · designated reserves",d.coal_reserves.source],
 ["Coal · resources",fmt(d.coal_resources.value)+" bn t","H1 2025 · includes non-reserve resources",d.coal_resources.source],
 ["Oil · potential",fmt(d.oil_potential.value)+" bn bbl","2025 · separate from proved P1",d.oil_potential.source],
 ["Gas · potential",fmt(d.gas_potential.value)+" TSCF","2025 · separate from proved P1",d.gas_potential.source]
 ];
 items.forEach(v=>card(grid,...v));root.append(grid);
 const n=node("div","notice");n.append(node("p",null,"Proved reserves (P1) are not interchangeable with unproved potential or in-place resources. Coal resources may include material not economically or technically recoverable under current conditions. Reserve/production ratios are conditional estimates, not depletion dates."));root.append(n);
}
function buildCoal(root,data){
 root.append(heading("Coal: Exports, Domestic Obligation & Data Reconciliation","2025 publications have differing vintages"));
 const e=node("div","panel");e.innerHTML='<div class="ef-kv"><span>Minerba production (annual report)</span><strong>817.48 Mt</strong><span>Minerba domestic use / DMO*</span><strong>246.88 Mt</strong><span>HEESI 2025 export series</span><strong>522.56 Mt</strong><span>Earlier ministry briefing: production</span><strong>~790 Mt</strong><span>Earlier ministry briefing: DMO</span><strong>~254 Mt</strong><span>Earlier ministry briefing: exports</span><strong>~514 Mt</strong></div>';
 e.append(node("p","ef-detail","*Minerba 2025 DMO awaits final reconciliation. The figures above are not treated as a single material-balance equation; different reporting vintages may vary."));
 const sr=node("p","ef-source");sr.append(link(data.sources.minerba2025,"Minerba 2025 ↗"),document.createTextNode(" · "),link(data.sources.heesi,"HEESI 2025 ↗"),document.createTextNode(" · "),link(data.sources.esdm2025,"Ministry briefing ↗"));e.append(sr);root.append(e);
}
function buildRenewables(root,data){
 const r=data.renewables;
 root.append(heading("New & Renewable Energy (EBT/NRE)","Installed capacity vs technical potential are distinct measures"));
 const grid=node("div","grid ef-grid");
 card(grid,"Reported EBT energy mix","15.75%","2025 · primary energy share (ESDM)",r.reported_source);
 card(grid,"ESDM-reported installed EBT","15.630 GW","Year-end 2025 · includes 450 MW coal gasification",r.reported_source);
 card(grid,"Technical renewable potential","~3,687 GW","National technical potential, not feasible pipeline",r.potential_source);
 card(grid,"2026 capacity snapshot","16.278 GW","2026 ESDM publication · not full year",data.snapshots[2].source);
 root.append(grid);
 const two=node("div","cols ef-two");const a=node("div","panel"),b=node("div","panel");
 a.append(node("h3",null,"2025 reported installed capacity by technology"),node("p","ef-detail","ESDM power-capacity categories in MW. Coal gasification is highlighted separately as non-renewable."));
 const max=Math.max(...r.installed_by_type_mw.map(x=>x.value));
 r.installed_by_type_mw.forEach(x=>{
  const wrap=node("div","ef-barrow");
  const lab=node("div","ef-barlabel");lab.append(node("span",null,x.name),node("strong",null,fmt(x.value)+" MW"));
  const track=node("div","ef-track"),fill=node("div","ef-fill");
  if(x.name.includes("non-renewable"))fill.style.background="#748aa0";
  fill.style.width=(x.value/max*100)+"%";track.append(fill);wrap.append(lab,track);a.append(wrap);
 });
 a.append(link(r.reported_source,"ESDM installed capacity release ↗"));
 b.append(node("h3",null,"Technical potential by source"),node("p","ef-detail","Gigawatts of assessed potential; these are not booked reserves, construction projects or commissioned plants."));
 r.technical_potential_gw.forEach(x=>{const row=node("div","ef-potential");row.append(node("span",null,x.name),node("strong",null,fmt(x.value)+" GW"));b.append(row)});
 b.append(link(r.potential_source,"ESDM potential estimate ↗"));
 two.append(a,b);root.append(two);
 const note=node("div","notice");note.append(node("p",null,r.note));root.append(note);
}
function buildSnapshot(root,data){
 root.append(heading("2026 Operational Snapshots","Point-in-time observations · not full-year production"));
 const grid=node("div","grid ef-grid");data.snapshots.forEach(x=>card(grid,x.name,x.value+" "+x.unit,"As of "+x.as_of+" · "+x.note,x.source));root.append(grid);
}
window.initEnergyFundamentals=async function(){
 const root=document.getElementById("energyFundamentalsRoot");if(!root)return;
 root.replaceChildren(node("p",null,"Loading sourced historical series…"));
 try{
  const req=await fetch("data/energy-fundamentals.json",{cache:"no-store"});if(!req.ok)throw Error("Dataset not published");
  const d=await req.json();if(!d.series||!d.reserves||!d.renewables)throw Error("Dataset incomplete");
  root.replaceChildren();const cap=node("div","notice");cap.append(node("p",null,"Latest complete annual series: 2025. Separate 2026 operational snapshots are labelled by their observation date. Every dataset retains its original units and source. Dashboard data vintage: "+d.updated+"."));root.append(cap);
  buildSnapshot(root,d);buildExplorer(root,d);buildReserves(root,d.reserves);buildCoal(root,d);buildRenewables(root,d);
 }catch(e){root.replaceChildren(node("div","notice","Energy Fundamentals dataset is not available. Previous Energy Security sections remain accessible."))}
};
})();
