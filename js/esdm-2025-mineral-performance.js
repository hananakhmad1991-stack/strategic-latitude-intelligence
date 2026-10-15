/* ESDM Kementerian LAKIN 2025: 2025 domestic mineral governance KPIs.
   Isolated from USGS physical production, IEA outlooks, and project capex. */
(function(){"use strict";
const PATH="data/esdm-2025-mineral-performance.json",NS="http://www.w3.org/2000/svg";
function E(t,c,label){const x=document.createElement(t);if(c)x.className=c;if(label!==undefined)x.textContent=String(label);return x}
function svg(t,props,parent,label){const x=document.createElementNS(NS,t);Object.entries(props||{}).forEach(([k,v])=>x.setAttribute(k,String(v)));if(label!==undefined)x.textContent=String(label);parent?.append(x);return x}
function src(d,p,label){const a=E("a","sli-esdm-source",label||"ESDM LAKIN 2025 · source ↗");a.href=d.source.url+(p?"#page="+(p+1):"");a.target="_blank";a.rel="noopener noreferrer";return a}
function section(head,subtitle){const s=E("section","sli-esdm-panel");s.append(E("small","sli-esdm-kicker","KEMENTERIAN ESDM · 2025 PERFORMANCE"),E("h3",null,head),E("p","sli-esdm-subtitle",subtitle));return s}
function fmt(x){return Number(x).toLocaleString("en-US",{maximumFractionDigits:2})}
function foot(p,d,page){const footer=E("div","sli-esdm-footer");footer.append(src(d,page,"Original ESDM report · p. "+(page-18)+" ↗"));p.append(footer)}
function card(head,big,sub){const x=E("article","sli-esdm-card");x.append(E("span",null,head),E("strong",null,big),E("small",null,sub));return x}
function bar(title,actual,target,max,unit){const row=E("div","sli-esdm-bar-row"),label=E("div","sli-esdm-bar-label");
 label.append(E("span",null,title),E("strong",null,fmt(actual)+(unit||"%")));
 const track=E("div","sli-esdm-track"),fill=E("div","sli-esdm-fill");fill.style.width=Math.min(100,actual/max*100)+"%";track.append(fill);
 if(target!==undefined&&target!==null){const mark=E("span","sli-esdm-target");mark.style.left=Math.min(100,target/max*100)+"%";mark.title="Target: "+fmt(target)+(unit||"%");track.append(mark)}
 row.append(label,track,E("small",null,target==null?"Reported result":"Target: "+fmt(target)+(unit||"%")));return row}
function indexPanel(stage,d){
 const i=d.index,p=section("National Mineral Supply & Value-Addition Index","Kementerian ESDM performance indicator, not an international mineral-security or reserves index.");
 const head=E("div","sli-esdm-stat-grid");head.append(card("ESDM index · 2025",fmt(i.realized_2025),"Target "+fmt(i.target_2025)),card("Target achievement",fmt(i.achievement_percent)+"%","Performance-score / target"),card("2024→2025 movement",(i.realized_2025-i.series[3].value).toFixed(2)+" pts","Index methodology subject to 2025–29 revision"));p.append(head);
 const shell=E("div","sli-esdm-index-chart");
 const chart=svg("svg",{viewBox:"0 0 800 280",role:"img","aria-label":"Mineral value-add index from 2021 to 2025"},shell);
 const X=n=>70+n*170,Y=v=>224-(v-70)/25*175;
 for(let v=70;v<=95;v+=5){svg("line",{x1:62,y1:Y(v),x2:760,y2:Y(v),stroke:"#35536a","stroke-dasharray":"4 5"},chart);svg("text",{x:53,y:Y(v)+4,"text-anchor":"end",fill:"#bfd3df","font-size":12},chart,v)}
 svg("polyline",{points:i.series.map((a,j)=>X(j)+","+Y(a.value)).join(" "),fill:"none",stroke:"#e2c182","stroke-width":4},chart);
 i.series.forEach((a,j)=>{svg("circle",{cx:X(j),cy:Y(a.value),r:5.7,fill:"#f3d190",stroke:"#0b2435","stroke-width":2},chart);svg("text",{x:X(j),y:Y(a.value)-14,"text-anchor":"middle",fill:"#f4ddae","font-size":13},chart,fmt(a.value));svg("text",{x:X(j),y:254,"text-anchor":"middle",fill:"#bdced8","font-size":12},chart,a.year)});
 p.append(shell);const w=E("details","sli-esdm-details");w.append(E("summary",null,"Index construction · 4 weighted components"));const weights=E("div","sli-esdm-weights");i.weights.forEach(x=>weights.append(bar(x.name,x.weight,null,40,"%")));w.append(weights);p.append(w,E("p","sli-esdm-warning",i.methodology_warning));foot(p,d,i.pdf_page);stage.append(p)
}
function processingPanel(stage,d){
 const p=section("Domestic Processing Ratio · 2025","Administrative performance of processed versus mined mineral inputs. Nickel raw-material tonnes are NOT contained Ni tonnes from USGS/IEA.");
 const grid=E("div","sli-esdm-stat-grid");d.processing.forEach(x=>{const c=card(x.mineral,fmt(x.ratio_actual)+"%","2025 ratio · target "+fmt(x.ratio_target)+"%");c.append(E("p",null,x.mineral==="Nickel"?"313.67 million t of raw-material units reported":x.mineral==="Tin"?"98,670 t of material · 56.38% of 175,000 t volume target":"Precious metal reporting uses an inconsistent ozT notation; see source"));grid.append(c)});p.append(grid);
 const u=section("Integrated Smelter / Refinery Utilisation","2025 Q4 observed utilisation against performance target, for smelters integrated with mining permits. This is NOT all national processing capacity.");
 const chart=E("div","sli-esdm-bars");d.utilization.forEach(x=>chart.append(bar(x.product,x.actual_pct,x.target_pct,125,"%")));u.append(chart,E("p","sli-esdm-warning",d.scope_utilization));
 const legend=E("p","sli-esdm-subtitle","Gold & silver, tin, processed nickel (FeNi/NPI) and nickel matte show different realised-versus-target outcomes. Utilisation >100% is a reporting ratio, not necessarily a physical engineering maximum.");u.append(legend);
 p.append(E("p","sli-esdm-warning","2025 nickel reported ratio 100% vs target 97%; the 103% achievement figure means 100 / 97, not 103% of all Indonesian ore processed. Source data are from integrated IUP facilities."));
 foot(p,d,83);foot(u,d,84);stage.append(p,u);
}
function investPanel(stage,d){
 const inv=d.investment,p=section("ESDM 2025 Minerba Investment · Permit-Category Drilldown","US$7.008 billion covers MINERAL + COAL + mining services, NOT investment in critical minerals alone. Source cut-off: 31 January 2026.");
 const headline=E("div","sli-esdm-stat-grid");headline.append(card("Total 2025 Minerba","US$"+(inv.total_minerba_usd_m/1000).toFixed(3)+"bn","Minerals + coal + services"),card("PK target","US$"+(inv.target_pk_usd_m/1000).toFixed(3)+"bn","Ministry performance target"),card("Achievement",fmt(inv.achievement_vs_pk_pct)+"%","Versus ministry PK target"));p.append(headline);
 const dropdown=E("select","sli-esdm-select");dropdown.setAttribute("aria-label","Filter Minerba investment categories");
 for(const [v,n] of [["all","All permits · minerals, coal, services"],["mineral","Mineral only flagged permits"],["coal","Coal only flagged permits"],["unallocated","Mixed/undisaggregated permits"]]){const opt=E("option",null,n);opt.value=v;dropdown.append(opt)}
 p.append(dropdown);
 const wrap=E("div","sli-esdm-investment-bars"),table=E("table","sli-esdm-table");
 function render(){
  wrap.replaceChildren();table.replaceChildren();
  const selected=inv.categories.filter(x=>dropdown.value==="all"||(dropdown.value==="mineral"?!!x.minerals_only:dropdown.value==="coal"?!!x.coal_only:!x.minerals_only&&!x.coal_only));
  selected.forEach(x=>{const b=bar(x.code+" · "+x.name,x.realized,x.target,4000,"m USD");if(x.coal_only)b.className+=" sli-esdm-coal";if(x.minerals_only)b.className+=" sli-esdm-mineral";wrap.append(b)});
  const th=E("tr");["Permit class","Target (USD m)","Realized (USD m)","Scope"].forEach(h=>th.append(E("th",null,h)));const thead=E("thead");thead.append(th);table.append(thead);
  const body=E("tbody");selected.forEach(x=>{const tr=E("tr");[x.code,fmt(x.target),fmt(x.realized),x.coal_only?"Coal":x.minerals_only?"Minerals (permit class)":"Not commodity-split"].forEach(v=>tr.append(E("td",null,v)));body.append(tr)});table.append(body);
 }
 dropdown.value="all";dropdown.addEventListener("change",render);render();
 p.append(wrap,E("div","sli-esdm-scroll",null));p.children[p.children.length-1].append(table);
 p.append(E("p","sli-esdm-warning",inv.scope+" "+inv.note));
 foot(p,d,145);stage.append(p)
}
function procurementPanel(stage,d){
 const p=section("Domestic Procurement & Local Content · 2025","P3DN procurement and TKDN local-content procurement are two different administrative indicators, neither a share of domestically owned mining firms.");
 const a=d.procurement.p3dn,b=d.procurement.tkdn;
 const visual=E("div","sli-esdm-bars");visual.append(bar("P3DN · domestic procurement",a.actual_pct,a.target_pct,100,"%"),bar("TKDN · certified-local-content goods spending",b.actual_pct,b.target_pct,100,"%"));p.append(visual);
 p.append(E("p","sli-esdm-warning",a.note+" "+b.note));
 const taxonomy=E("div","sli-esdm-taxonomy");d.policy_outputs.filter(x=>x.name.includes("product")).forEach(x=>taxonomy.append(E("p",null,x.description)));p.append(taxonomy);foot(p,d,86);stage.append(p)
}
function sourcesPanel(stage,d){
 const p=section("2025 Government Evidence & Implementation Register","ESDM LAKIN 2025 policy execution references, departmental mandates and primary-source pages. Legal status of actual regulations belongs to Policy & Risk.");
 const summary=E("div","sli-esdm-actors");d.actors.forEach(x=>{const card=E("article","sli-esdm-actor");card.append(E("small",null,x.relationship),E("h4",null,x.name),E("p",null,x.role),src(d,x.page+18,"Report p. "+x.page+" ↗"));summary.append(card)});p.append(summary);
 const items=E("div","sli-esdm-actors");d.policy_outputs.forEach(x=>{const card=E("article","sli-esdm-actor");card.append(E("h4",null,x.name),E("p",null,x.description),src(d,x.page+18,"Report p. "+x.page+" ↗"));items.append(card)});
 p.append(E("h4",null,"2025 programme implementation"),items,src(d,0,"Read full LAKIN Kementerian ESDM 2025 ↗"));stage.append(p)
}
function risksPanel(stage,d){
 const p=section("ESDM-Identified Bottlenecks · 2025","Risk issues explicitly acknowledged in the Ministry's 2025 performance report; this is an archival evidence layer, not a 2026 incident feed.");
 const grid=E("div","sli-esdm-risks");for(const item of d.risks){const x=E("details","sli-esdm-risk");x.append(E("summary",null,item.title),E("p",null,item.detail),src(d,item.page+18,"ESDM report p. "+item.page+" ↗"));grid.append(x)}
 p.append(grid);stage.append(p)
}
function methodsPanel(stage,d){
 const p=section("Measurement & Source Caveats","A guide to reconciling ESDM 2025 with USGS 2026 and IEA 2026 without mixing periods, metal contents or policy metrics.");
 const ul=E("ul","sli-esdm-methods");d.methodology.forEach(x=>ul.append(E("li",null,x)));
 p.append(ul,src(d,0,"Full ministry report (368 PDF pages) ↗"));stage.append(p)
}
window.initSLIESDMMinerals=async function(sections){
 if(!Array.isArray(sections)||sections.length<9)return;
 const r=await fetch(PATH,{cache:"no-store"});if(!r.ok)throw Error("ESDM source unavailable HTTP "+r.status);
 const d=await r.json();if(!d.index?.series||!d.investment?.categories)throw Error("ESDM data incomplete");
 indexPanel(sections[1],d);
 processingPanel(sections[2],d);
 investPanel(sections[3],d);
 procurementPanel(sections[4],d);
 sourcesPanel(sections[6],d);
 risksPanel(sections[7],d);
 methodsPanel(sections[8],d);
};
})();