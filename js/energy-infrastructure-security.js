/* SLI Refining, Electricity, Jargas and Energy Resilience — source-vintaged official observations. */
(function(){
"use strict";
const $=(tag,cl,val)=>{const el=document.createElement(tag);if(cl)el.className=cl;if(val!==undefined&&val!==null)el.textContent=String(val);return el};
const fmt=(n,d=0)=>Number(n).toLocaleString("id-ID",{maximumFractionDigits:d,minimumFractionDigits:d});
const link=(src,label="Original source ↗")=>{const a=$("a","infra-source",label);if(/^https:\/\//.test(src||"")){a.href=src;a.target="_blank";a.rel="noopener noreferrer"}return a};
const box=(cl)=>$("div",cl);
const desc=(parent,t)=>parent.append($("p","infra-description",t));
const section=(name,kicker)=>{const c=$("div","infra-head");c.append($("h3",null,name),$("span",null,kicker));return c};
function kpi(heading,num,detail,href){
 const c=$("div","infra-kpi");c.append($("span","infra-eyebrow",heading),$("strong","infra-number",num),$("p",null,detail));if(href)c.append(link(href));return c;
}
function bar(label,value,max,unit,color,info){
 const c=$("div","infra-bar-row"),top=$("div","infra-bar-top");
 top.append($("strong",null,label),$("span",null,fmt(value,value<10?2:1)+" "+unit));c.append(top);
 const line=$("div","infra-track"),fill=$("div","infra-track-fill");fill.style.width=Math.max(0,Math.min(100,value/max*100))+"%";if(color)fill.style.background=color;line.append(fill);c.append(line);
 if(info)c.append($("small",null,info));return c;
}
function refinery(p,d){
 p.append(section("Six major oil refineries & processing capacity","KPI / KPB · Mbpd, not daily realized throughput"));
 const row=$("div","infra-kpi-grid");
 row.append(kpi("ESDM national reported capacity",fmt(d.reported_national.value,2)+" million bpd","2025 reported rounded total; national scope",d.reported_national.source));
 row.append(kpi("Listed six refineries",fmt(d.sum_of_listed_kbpd)+" kbpd","Sum of source-vintaged nameplate capacities; includes Balikpapan RDMP 360",d.units[3].source));
 row.append(kpi("2025 refining utilization",fmt(d.utilisation.value,1)+"%","Annual national ESDM assessment; not current-day load",d.utilisation.source));
 p.append(row);
 const layout=$("div","infra-split"),list=$("div","infra-bars"),detail=$("div","infra-detail");
 const chosen=$("div","infra-ref-picker");p.append(layout);
 let pick=0;
 function renderDetail(){
  detail.replaceChildren();
  const v=d.units[pick];detail.append($("span","infra-eyebrow",v.province+" · "+v.city),$("h4",null,v.name));
  detail.append($("div","infra-large",fmt(v.nameplate_kbpd)+" kbpd"),$("p","infra-description",v.status));
  desc(detail,v.latest_basis);detail.append(link(v.source,"Official refinery / operator source ↗"));
  if(v.commissioning_source)detail.append(link(v.commissioning_source,"2026 RDMP commissioning source ↗"));
  detail.append($("p","infra-mini","Last cited evidence: "+v.verified+(v.nci?" · Nelson Index: "+v.nci:"")));
 }
 d.units.forEach((v,i)=>{
  const b=$("button","infra-ref-button");
  b.type="button";b.append($("span",null,v.name),$("strong",null,fmt(v.nameplate_kbpd)+" kbpd"));
  b.addEventListener("click",()=>{pick=i;renderDetail();Array.from(list.children).forEach((n,j)=>n.classList.toggle("active",i===j))});
  b.classList.toggle("active",i===pick);list.append(b);
 });
 layout.append(list,detail);renderDetail();
 desc(p,d.scope_note);
}
function electrification(p,d){
 p.append(section("Electricity access & regional service gaps","Q1 2026 · national and PLN definitions distinct"));
 const k=$("div","infra-kpi-grid");
 k.append(kpi("National electrification",fmt(d.national.ratio_total_pct,3)+"%","Household access including non-PLN sources · Q1 2026",d.national.source));
 k.append(kpi("PLN electrification",fmt(d.national.ratio_pln_pct,3)+"%","Grid / PLN-reported RE; different numerator",d.national.source));
 k.append(kpi("Gap outside PLN access",fmt(d.national.ratio_total_pct-d.national.ratio_pln_pct,3)+" pp","Definition-based national difference; not a count of unserved households",d.national.source));p.append(k);
 const region=$("div","infra-split"),bars=$("div","infra-bars"),side=$("div","infra-detail");
 bars.append($("h4",null,"Priority regions: verified comparable 2025 examples"));
 for(const r of d.regional_gaps){
  const c=$("div","infra-region");
  c.append($("strong",null,r.province));
  if(r.ratio_total_pct===null){c.append($("p","infra-mini","Comparable provincial total not yet verified"))}
  else{
   c.append(bar("Total electrification",r.ratio_total_pct,100,"%", "#65bbbe"));
   c.append(bar("PLN electrification",r.ratio_pln_pct,100,"%", "#d7b678"));
  }c.append(link(r.source,"Evidence ↗"));bars.append(c);
 }
 side.append($("h4",null,"Why the national average hides gaps"));
 desc(side,"The national near-100% ratio can coexist with off-grid villages, micro-solar household connections, limited operating hours and vulnerable diesel-based mini-grids.");
 desc(side,d.note);
 region.append(bars,side);p.append(region);
}
function power(p,d){
 p.append(section("PLTU vs PLTD vs renewable generation","2025 installed capacity · MW, not number of stations"));
 const c=$("div","infra-kpi-grid");
 c.append(kpi("Installed nationwide",fmt(d.national.capacity_mw/1000,2)+" GW","ESDM nationwide including non-PLN / captive facilities",d.national.source));
 c.append(kpi("PLTU (steam / coal)",fmt(d.capacity_by_type_mw.find(x=>x.type==="PLTU").mw/1000,2)+" GW","Installed nameplate capacity · not generated kWh",d.national.source));
 c.append(kpi("PLTD (diesel)",fmt(d.capacity_by_type_mw.find(x=>x.type==="PLTD").mw/1000,2)+" GW","Installed diesel generating nameplate",d.national.source));p.append(c);
 const controls=$("div","infra-controls"),choice=$("select","infra-select");
 [["major","Key types"],["all","All 17 categories"],["renewable","Renewables only"]].forEach(([val,txt])=>{const opt=$("option",null,txt);opt.value=val;choice.append(opt)});
 controls.append($("label",null,"Show generation technologies"),choice);p.append(controls);
 const plot=$("div","infra-plant-bars");p.append(plot);
 function draw(){
  plot.replaceChildren();
  let arr=d.capacity_by_type_mw;
  if(choice.value==="major")arr=arr.filter(x=>["PLTU","PLTD","PLTGU","PLTA","PLTP","PLTS","PLTBm"].includes(x.type));
  if(choice.value==="renewable")arr=arr.filter(x=>x.family==="Renewable");
  const max=Math.max(1,...arr.map(x=>x.mw));
  arr.forEach(x=>plot.append(bar(x.type+" · "+x.category,x.mw,max,"MW",x.family==="Renewable"?"#6eaeab":x.family==="Fossil"?"#d7b678":"#a8a8b5")));
 }
 choice.addEventListener("change",draw);draw();
 const others=$("div","infra-kpi-grid");
 others.append(kpi("Official EBT programme",fmt(d.reported_ebt.capacity_mw/1000,2)+" GW","2025 EBTKE reported; category includes 468 MW classified gasification/WHB",d.reported_ebt.source));
 others.append(kpi("PLN Group units",fmt(d.unit_count.total_pln_group_units)+" units","2025 PLN Group across ALL technologies only, not national unit count",d.unit_count.source));
 others.append(kpi("PLN Group own capacity",fmt(d.pln_group.capacity_mw/1000,2)+" GW","PLN-owned plant subset (not 107.5 GW nationwide)",d.pln_group.source));p.append(others);
 desc(p,d.unit_count.note+" "+d.method_note);
}
function jargas(p,d){
 p.append(section("Household natural gas distribution (Jargas)","connections, budget, and implementation are different measures"));
 const row=$("div","infra-kpi-grid");
 row.append(kpi("Historical connections",fmt(d.historic.connected_households)+" SR",d.historic.period+" cumulative reference · not verified end-2026 count",d.historic.source));
 row.append(kpi("2025–26 construction contracts",fmt(d.project_2025_2026.planned_connections)+" SR",fmt(d.project_2025_2026.appropriation_idr_trillion,3)+" triliun rupiah · 15 districts / municipalities",d.project_2025_2026.source));
 row.append(kpi("2026 policy target",fmt(d.target_2026.target_connections)+" SR","Announced planned connections; actual installed figure pending",d.target_2026.source));p.append(row);
 const expl=$("div","infra-split");
 const card=$("div","infra-detail");
 card.append($("h4",null,"Source-to-customer deployment funnel"));
 [["Legacy reported connections",d.historic.status],["Signed programme & EPC",d.project_2025_2026.status],["Annual expansion aspiration",d.target_2026.status]].forEach(([title,detail])=>{
  const part=$("div","infra-funnel");part.append($("strong",null,title),$("p",null,detail));card.append(part);
 });
 const local=$("div","infra-detail");
 local.append($("h4",null,"Sleman case study · Beyond-pipeline CNG"));
 local.append($("div","infra-large",fmt(d.example.customers)+" connections"));
 desc(local,">141 km gas network; 2026 report. This is a local implementation example, NOT an extra amount to add automatically to national historical totals.");
 local.append(link(d.example.source));
 desc(local,d.emissions_note);
 expl.append(card,local);p.append(expl);
}
function energyIndex(p,d){
 const h=d.official;
 p.append(section("National Energy Security Index — full 4A scorecard","DEN / ESDM · provisional 2025 · 4A official, +S analytical overlay"));
 const row=$("div","infra-kpi-grid");
 row.append(kpi("2025 official IKE",fmt(h.index,2)+" / 10","Tahan · provisional 2025 (Setjen DEN/ESDM)",h.source));
 row.append(kpi("4A pillars",4+" pillars","ESDM / DEN weighted AHP, not a simple average",h.source));
 row.append(kpi("Extra S lens", "Unscored", "Strategic Latitude supplemental Sustainability diagnostic; not official DEN",h.source));p.append(row);
 const bars=$("div","infra-score-bars");
 const detail=$("div","infra-detail infra-index-detail");let selected=0;
 const colors=["#d3b46f","#72b8bd","#8a9fd4","#c69f83"];
 function render(){
  bars.replaceChildren();detail.replaceChildren();
  d.aspects.forEach((a,i)=>{
   const v=$("button","infra-score-button");v.type="button";v.classList.toggle("active",i===selected);
   const label=$("div","infra-score-line");label.append($("strong",null,a.name),$("span",null,fmt(a.score2025,2)+" / 10"));v.append(label);
   const bg=$("div","infra-score-track"),fill=$("div","infra-score-fill");fill.style.width=a.score2025*10+"%";fill.style.background=colors[i];bg.append(fill);v.append(bg);v.addEventListener("click",()=>{selected=i;render()});bars.append(v);
  });
  const a=d.aspects[selected];
  detail.append($("span","infra-eyebrow",a.code.toUpperCase()),$("h4",null,a.name),$("div","infra-large",fmt(a.score2025,2)+" / 10"));
  const delta=a.score2025-a.score2024;
  detail.append($("p","infra-mini","2024 basis "+fmt(a.score2024,2)+" · indicative change "+(delta>=0?"+":"")+fmt(delta,2)+" · do not compare with pre-formula years"));
  a.indicators.forEach(([code,lab,oldv,nowv])=>{
   const el=$("div","infra-indicator");el.append($("span",null,code+" · "+lab),$("strong",null,fmt(nowv,2)));el.append(bar("2025",nowv,10,"/10",nowv<6?"#d99f6e":"#7aadb7"));detail.append(el);
  });
  desc(detail,a.weakness);
 }
 render();
 const layout=$("div","infra-split");layout.append(bars,detail);p.append(layout);
 const low=$("div","infra-detail");low.append($("h4",null,"Five constraints in the official scorecard"));
 const ul=$("ul","infra-gaps");d.major_gaps.forEach(x=>ul.append($("li",null,x)));low.append(ul);p.append(low);
 const overlay=$("details","infra-overlay");
 overlay.append($("summary",null,"+S Sustainability / Long-run resilience · supplementary SLI lens (not official IKE)"));
 const inner=$("div","infra-overlay-inner");
 desc(inner,d.sustainability_overlay.warning);
 const list=$("ul");d.sustainability_overlay.dimensions.forEach(x=>list.append($("li",null,x)));inner.append(list);overlay.append(inner);p.append(overlay);
 p.append(link(h.source,"ESDM 2025 report Tables 12–13 pp. 55–56 ↗"));
 desc(p,h.method);
}
window.initSLIInfrastructure=async function(){
 const root=document.getElementById("energyInfrastructureRoot");if(!root)return;
 root.replaceChildren($("p","infra-description","Loading refinery, generation, electrification, jargas and 4A data…"));
 try{
  const resp=await fetch("data/energy-infrastructure-security.json",{cache:"no-store"});
  if(!resp.ok)throw Error("dataset unavailable");
  const d=await resp.json();
  if(!d.refinery?.units||!d.electrification?.national||!d.energy_security?.aspects)throw Error("incomplete data");
  root.replaceChildren();
  const hero=$("div","infra-hero");
  hero.append($("div","eyebrow","ENERGY ASSET BASELINE · OCTOBER 2026 REVIEW"),$("h2",null,"Infrastructure & Energy Security Intelligence"));
  desc(hero,"Oil refining · electrification gaps · generation capacity · household gas networks · energy security 4A scorecard");
  root.append(hero);
  const tabs=$("div","infra-tabs");const mount=$("div","infra-mount");
  const panes=[
   ["Refinery & RDMP",()=>refinery(mount,d.refinery)],
   ["Electrification",()=>electrification(mount,d.electrification)],
   ["PLTU · PLTD · EBT",()=>power(mount,d.power_generation)],
   ["Jargas",()=>jargas(mount,d.jargas)],
   ["IKE: 4A + S",()=>energyIndex(mount,d.energy_security)]
  ];
  let active=0;
  const buttons=[];
  function draw(){
   mount.replaceChildren();panes[active][1]();
   buttons.forEach((b,i)=>{b.classList.toggle("active",i===active);b.setAttribute("aria-pressed",String(i===active))});
  }
  panes.forEach(([name],i)=>{const b=$("button","infra-tab",name);b.type="button";
   b.addEventListener("click",()=>{active=i;draw()});buttons.push(b);tabs.append(b)});
  root.append(tabs,mount);
  root.append($("p","infra-vintage","Source vintage varies (2025 official full-year, Q1 2026 national electrification and named 2026 operator releases). Missing 2026 actuals are not estimated. This is a source-dated analysis, not a live telemetry feed."));
  draw();
 }catch(e){root.replaceChildren($("p","infra-description","Infrastructure research dataset temporarily unavailable; existing energy sections remain accessible."))}
};
})();