/* Indonesia Energy Prices, Subsidies, Fuel Quotas and Realized Investment */
(function(){
"use strict";
function n(tag,text,cl){const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=String(text);if(cl)e.className=cl;return e}
function link(url,label){const a=n("a",label);a.href=url;a.rel="noopener noreferrer";a.target="_blank";return a}
function sec(root,title,sub){const h=n("div",null,"section");h.append(n("h2",title),n("span",sub));root.append(h)}
function panel(root){const e=n("div",null,"panel");root.append(e);return e}
function fmt(x,dec=2){return Number(x).toLocaleString("en-US",{maximumFractionDigits:dec,minimumFractionDigits:0})}
function rp(x,dec=0){return "Rp"+Number(x).toLocaleString("en-US",{minimumFractionDigits:dec,maximumFractionDigits:dec})}
function kpi(root,title,value,description,url){const e=n("div",null,"card pf-kpi");e.style.cursor="default";e.append(n("div",title,"eyebrow"),n("h2",value,"pf-value"),n("p",description));if(url)e.append(link(url,"Original source ↗"));root.append(e)}
function note(root,text){root.append(n("p",text,"pf-note"))}
function table(root,headers,rows){
 const sc=n("div",null,"pf-table-wrap"),tb=n("table");
 const hd=n("thead"),hr=n("tr");headers.forEach(s=>hr.append(n("th",s)));hd.append(hr);tb.append(hd);
 const bd=n("tbody");rows.forEach(cells=>{const tr=n("tr");cells.forEach(x=>{const c=n("td");if(x&&typeof x==="object"&&x.url)c.append(link(x.url,x.label));else c.textContent=String(x);tr.append(c)});bd.append(tr)});
 tb.append(bd);sc.append(tb);root.append(sc)
}
function subsidy(root,data){
 sec(root,"Energy Subsidies & Fiscal Exposure","Budget/outlook, direct subsidy payments and compensation are distinct");
 const s=data.subsidies,grid=n("div",null,"grid pf-grid");
 kpi(grid,"Subsidy + compensation paid","Rp"+fmt(s.combined_paid.value,1)+" tn","January–September 2026 · +"+fmt(s.combined_paid.year_on_year_percent,1)+"% YoY. NOT subsidies-only.",s.combined_paid.source);
 kpi(grid,"Direct energy subsidies paid","Rp"+fmt(s.q1_2026_actual.value,1)+" tn","Q1 2026 · BBM, LPG 3 kg and electricity; excludes compensation.",s.q1_2026_actual.source);
 kpi(grid,"Direct energy subsidy outlook","Rp"+fmt(s.outlook_2026.value,2)+" tn","FY2026 outlook cited August 2026; not actual spending or original enacted appropriation.",s.outlook_2026.source);
 root.append(grid);
 const p=panel(root);p.append(n("h3","Q1 2026 direct-subsidy payment breakdown"));
 table(p,["Category","Paid, Rp trillion"],[["Fuel (BBM)",rp(s.q1_2026_actual.breakdown.bbm,1)+" tn"],["LPG 3 kg",rp(s.q1_2026_actual.breakdown.lpg_3kg,1)+" tn"],["Electricity",rp(s.q1_2026_actual.breakdown.electricity,1)+" tn"]]);
 note(p,"Historical policy vintage: the original RAPBN 2026 proposed Rp"+fmt(s.draft_2026.value,1)+"tn in direct energy subsidies. It was a PROPOSAL, not the same basis as the August 2026 outlook or the January–September combined payments.");
 note(p,"Strategic interpretation: when world oil prices and the rupiah move, fixed retail prices may shift the adjustment burden toward state subsidies/compensation. The date of state payments does not necessarily match the date underlying costs were incurred.");
 p.append(link(s.draft_2026.source,"Kemenkeu 2026 proposal ↗"),document.createTextNode(" · "),link(s.combined_paid.source,"September 2026 payment reporting ↗"));
}
function quota(root,d){
 sec(root,"2026 Fuel Quota vs Recorded Distribution","BPH Migas · Q1 utilization against annual allocation");
 const p=panel(root);
 const q=d.quotas;
 q.items.forEach(x=>{
  const pct=100*x.q1_distribution/x.annual_quota;
  const bar=n("div",null,"pf-quota");
  const head=n("div",null,"pf-quota-head");
  head.append(n("strong",x.name),n("span",fmt(pct,1)+"% annual quota used in Q1"));
  const track=n("div",null,"pf-quota-track"),fill=n("div",null,"pf-quota-fill");fill.style.width=Math.min(100,pct)+"%";track.append(fill);
  bar.append(head,track,n("p","2026 quota: "+fmt(x.annual_quota,0)+" kL · distributed Jan–Mar 2026: "+fmt(x.q1_distribution,0)+" kL. "+x.type));
  p.append(bar);
 });
 note(p,q.note);
 p.append(link(q.items[0].source,"BPH Migas annual quota ↗"),document.createTextNode(" · "),link(q.items[0].q1_source,"BPH Migas Q1 dispatch ↗"));
}
function investment(root,d){
 sec(root,"Realized Sectoral Energy Investment","Migas and EBTKE separated · ESDM 2019–2025");
 const inv=d.investment,grid=n("div",null,"grid pf-grid");
 kpi(grid,"Migas — 2025 realized","US$"+fmt(inv.latest.migas)+"bn","vs official 2025 target US$"+fmt(inv.latest.migas_target)+"bn.",inv.source);
 kpi(grid,"EBTKE — 2025 realized","US$"+fmt(inv.latest.ebtke)+"bn","Includes conservation; distinct from renewable generation capex.",inv.breakdown_source);
 kpi(grid,"Entire ESDM sector — 2025","US$"+fmt(inv.latest.total_usd_billion)+"bn","Includes Migas, EBTKE, electricity, minerals and coal.",inv.source);
 root.append(grid);
 const p=panel(root),controls=n("div",null,"pf-controls");
 const select=n("select",null,"pf-select");[["both","Migas vs EBTKE"],["migas","Migas only"],["ebtke","EBTKE only"]].forEach(([v,label])=>{const o=n("option",label);o.value=v;select.append(o)});
 const kind=n("select",null,"pf-select");[["line","Line"],["bar","Bar"]].forEach(([v,l])=>{const o=n("option",l);o.value=v;kind.append(o)});
 const dl=n("button","Download investment CSV","pf-btn");dl.type="button";
 const label=(name,x)=>{const l=n("label",name);l.append(x);controls.append(l)};
 label("Investment series",select);label("Chart style",kind);controls.append(dl);p.append(controls);
 const box=n("div",null,"pf-chart");const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("role","img");svg.setAttribute("aria-label","ESDM reported realized energy investments 2019 to 2025");svg.style.cssText="width:100%;min-width:480px;display:block";box.append(svg);p.append(box);
 const info=n("p","Click any chart mark to read year-specific investment.","pf-note");p.append(info);
 const ns="http://www.w3.org/2000/svg";
 function shape(tag,attrs,par){const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));par.append(e);return e}
 function draw(){
  svg.replaceChildren();svg.setAttribute("viewBox","0 0 810 320");
  const years=inv.series,lines=select.value==="both"?["migas","ebtke"]:[select.value];
  const max=Math.max(...years.flatMap(r=>lines.map(k=>r[k])))*1.12;
  const L=75,T=26,HY=260,W=700,X=i=>L+i*(W/(years.length-1)),Y=v=>T+(HY-T)*(1-v/max);
  [0,.25,.5,.75,1].forEach(f=>{const yy=Y(max*f);shape("line",{x1:L,y1:yy,x2:790,y2:yy,stroke:"#3e5871"},svg);const t=shape("text",{x:70,y:yy+4,fill:"#a7bfd0","text-anchor":"end","font-size":11},svg);t.textContent=fmt(max*f,1)});
  const colors={migas:"#d7b678",ebtke:"#59b5dc"};
  lines.forEach(key=>{
   if(kind.value==="line")shape("polyline",{fill:"none","stroke-width":3,stroke:colors[key],points:years.map((r,i)=>X(i)+","+Y(r[key])).join(" ")},svg);
   years.forEach((r,i)=>{
    const xx=X(i),yy=Y(r[key]);
    const v=kind.value==="bar"?
     shape("rect",{x:xx-25+(key==="migas"?0:24),y:yy,width:select.value==="both"?22:44,height:HY-yy,fill:colors[key],rx:3,tabindex:0,role:"button"},svg):
     shape("circle",{cx:xx,cy:yy,r:6.5,fill:colors[key],tabindex:0,role:"button"},svg);
    v.style.cursor="pointer";v.setAttribute("aria-label",r.year+" "+key+" "+fmt(r[key])+" billion USD");
    const update=()=>{info.textContent=r.year+" · "+(key==="migas"?"Oil and Gas":"EBTKE")+" realized investment: US$"+fmt(r[key])+" billion (ESDM)."};
    v.addEventListener("click",update);v.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();update()}});
   });
  });
  years.forEach((r,i)=>{const t=shape("text",{x:X(i),y:292,fill:"#bfd2e0","text-anchor":"middle","font-size":12},svg);t.textContent=r.year});
  const t=shape("text",{x:75,y:14,fill:"#bfd2e0","font-size":11},svg);t.textContent="US$ billion";
  info.textContent="2025: Migas US$"+fmt(inv.latest.migas)+"bn, EBTKE US$"+fmt(inv.latest.ebtke)+"bn. Select series or a point for annual values.";
 }
 select.addEventListener("change",draw);kind.addEventListener("change",draw);draw();
 dl.addEventListener("click",()=>{
  const keys=["year","migas","ebtke","electricity","minerba"];
  const csv=[keys.join(","),...inv.series.map(y=>keys.map(k=>y[k]).join(","))].join("\r\n");
  const uri=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=n("a");a.href=uri;a.download="SLI-ESDM-sector-investment-2019-2025.csv";a.click();setTimeout(()=>URL.revokeObjectURL(uri),1000);
 });
 const breakdown=panel(root);breakdown.append(n("h3","EBTKE realized investment — 2025 breakdown"));
 table(breakdown,["Subsector","US$ million"],inv.ebtke_breakdown_2025_million_usd.map(x=>[x.name,fmt(x.value,1)]));
 note(breakdown,"Reported EBTKE total: US$"+fmt(inv.ebtke_breakdown_total_million_usd,2)+"mn. "+inv.note);
 note(breakdown,"2026 status: "+inv.latest_2026_status);
 breakdown.append(link(inv.breakdown_source,"ESDM 2025 detailed breakdown ↗"),document.createTextNode(" · "),link(inv.latest_2026_catalog,"2026 ESDM reporting catalog ↗"));
}
function prices(root,d){
 sec(root,"Indonesian Retail Fuel Prices","Pertamina public list · effective 1 October 2026 · region-sensitive");
 const p=panel(root);
 const grid=n("div",null,"grid pf-grid");
 const fuel=d.fuel;
 ["Pertalite (JBKP)","Biosolar (JBT)","Pertamax RON 92"].forEach(name=>{
   const f=fuel.rows.find(x=>x.name===name);
   kpi(grid,name,rp(f.price)+"/L",f.category+" · indicative 1 October 2026.",fuel.source);
 });
 p.append(grid);
 table(p,["Product","Price, Rp/litre","Classification"],fuel.rows.map(x=>[x.name,rp(x.price),x.category]));
 note(p,fuel.market+" "+fuel.reference_area+" "+fuel.note);
 p.append(link(fuel.source,"October 2026 Pertamina list ↗"));
}
function electricity(root,d){
 sec(root,"PLN Retail Electricity Tariffs","October–December 2026 · Rp per kWh · by customer group");
 const p=panel(root),e=d.electricity;
 const controls=n("div",null,"pf-controls");const sel=n("select",null,"pf-select");
 ["All customer groups","Residential subsidized","Residential nonsubsidized","Business nonsubsidized","Industry nonsubsidized","Government nonsubsidized","Public lighting","Special"].forEach(x=>{const op=n("option",x);op.value=x;sel.append(op)});
 const l=n("label","Filter tariff group");l.append(sel);controls.append(l);p.append(controls);
 const tableRoot=n("div");p.append(tableRoot);
 const render=()=>{tableRoot.replaceChildren();const group=sel.value;table(tableRoot,["PLN tariff group","Rate (Rp/kWh)","Classification"],e.rows.filter(r=>group==="All customer groups"||r.category===group).map(r=>[r.group,rp(r.rate,Number.isInteger(r.rate)?0:2),r.category]))};
 sel.addEventListener("change",render);render();
 note(p,e.note+" "+e.policy);
 p.append(link(e.source,"ESDM Q4 tariff decision ↗"),document.createTextNode(" · "),link(e.rate_source,"Full tariff schedule ↗"));
}
window.initFiscalPrices=async function(){
 const root=document.getElementById("energyFiscalRoot");if(!root)return;
 root.replaceChildren(n("p","Loading official-source energy fiscal and retail datasets…"));
 try{
 const response=await fetch("data/energy-prices-fiscal.json",{cache:"no-store"});if(!response.ok)throw Error("File not published");
 const d=await response.json();if(!d.subsidies||!d.quotas||!d.investment||!d.fuel||!d.electricity)throw Error("Incomplete dataset");
 root.replaceChildren();const banner=n("div",null,"pf-warning");
 banner.append(n("strong","Dated public data · 15 October 2026"),n("p","Fiscal disbursement is not the same as budget; JBT fuel is not identical to JBKP Pertalite; Q1 volume is not year-to-date October distribution; ESDM realized capital spending is not an investment-announcement pipeline; retail tariffs depend on product, customer classification and location."));
 root.append(banner);
 subsidy(root,d);quota(root,d);investment(root,d);prices(root,d);electricity(root,d);
 }catch(err){
 root.replaceChildren(n("p","Energy subsidy and tariff source dataset is not yet available. All other Energy Security dashboards remain accessible.","pf-warning"));
 }
};
})();
