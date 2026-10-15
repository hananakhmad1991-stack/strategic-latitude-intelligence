/* Investment sector analytics: official ESDM yearly flows vs Danantara deal types. */
(function(){
"use strict";
const E=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined&&value!==null)n.textContent=String(value);return n};
const link=(url,text)=>{const a=E("a",null,text+" ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
const money=n=>Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
window.initSLIInvestmentSectorEvidence=async function(){
 const root=document.getElementById("investmentSectorRoot");if(!root)return;
 root.replaceChildren(E("p","tr-detail","Loading source-dated ESDM investment records…"));
 let d;
 try{const res=await fetch("data/investment-sector-evidence.json",{cache:"no-store"});if(!res.ok)throw Error("Sector dataset missing");d=await res.json();if(!Array.isArray(d.sector_history))throw Error("Sector history schema unavailable")}
 catch(err){root.replaceChildren(E("p","tr-status","ESDM sector historical data unavailable. Project tracker and revenue records remain independently accessible."));console.error("[SLI] sector evidence",err);return}
 root.replaceChildren();
 const disclaimer=E("div","tr-note","INVESTMENT ACCOUNTING: ESDM sector investment ≠ BKPM PMA/PMDN realization ≠ PNBP state receipts ≠ corporate AUM. Different scopes must never be added.");root.append(disclaimer);
 const controls=E("div","tr-controls"),yearSelect=E("select","tr-select");
 for(const x of d.sector_history){const o=E("option",null,String(x.year));o.value=String(x.year);yearSelect.append(o)}
 yearSelect.value=String(d.sector_history[d.sector_history.length-1].year);
 const lbl=E("label",null,"Observation year");lbl.append(yearSelect);controls.append(lbl);root.append(controls);
 const historical=E("div","tr-chart");historical.style.marginBottom="14px";
 const chartSelect=E("select","tr-select");
 [["total","Total ESDM"],["migas","Oil & gas"],["minerba","Mineral & coal"],["power","Electricity"],["ebt","EBTKE"]].forEach(([v,label])=>{const opt=E("option",null,label);opt.value=v;chartSelect.append(opt)});
 const chartLbl=E("label",null,"Historical series");chartLbl.append(chartSelect);
 const chartControls=E("div","tr-controls");chartControls.append(chartLbl);root.append(chartControls,historical);
 function renderTrend(){
  historical.replaceChildren();
  const svgNS="http://www.w3.org/2000/svg",S=(tag,attrs,text)=>{const n=document.createElementNS(svgNS,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,String(v)));if(text!==undefined)n.textContent=String(text);return n};
  const W=820,H=285,L=59,R=27,T=22,B=45,pw=W-L-R,ph=H-T-B;
  const metric=chartSelect.value,series=d.sector_history,max=Math.max(...series.map(p=>p[metric]))*1.2;
  const x=i=>L+pw*i/(series.length-1),y=n=>T+ph*(1-n/max);
  const svg=S("svg",{viewBox:"0 0 820 285",style:"width:100%;min-width:520px;display:block",role:"img","aria-label":"ESDM sector investment historical comparison from 2019 through 2025, US dollar billions"});
  for(let i=0;i<=4;i++){
   const val=max*i/4,yy=y(val);svg.append(S("line",{x1:L,x2:W-R,y1:yy,y2:yy,stroke:"#36546b","stroke-width":1}));
   const t=S("text",{x:L-12,y:yy+4,"text-anchor":"end","font-size":11,fill:"#a9bfd2"},val.toFixed(1));svg.append(t)
  }
  const points=series.map((p,i)=>x(i)+","+y(p[metric])).join(" ");
  svg.append(S("polyline",{points,fill:"none",stroke:"#d7b678","stroke-width":3}));
  series.forEach((p,i)=>{
   const node=S("circle",{cx:x(i),cy:y(p[metric]),r:6,fill:"#d7b678",stroke:"#0b2033","stroke-width":2,tabindex:"0",role:"button","aria-label":"View "+p.year+", US$"+money(p[metric])+" billion"});
   node.append(S("title",{},"US$"+money(p[metric])+"bn · "+p.year));
   const choose=()=>{yearSelect.value=String(p.year);renderYear()};
   node.addEventListener("click",choose);node.addEventListener("keydown",evt=>{if(evt.key==="Enter"||evt.key===" "){evt.preventDefault();choose()}});
   svg.append(node);
   svg.append(S("text",{x:x(i),y:H-19,"text-anchor":"middle","font-size":11,fill:"#adc4d5"},String(p.year)));
  });
  historical.append(svg);
 }
 chartSelect.addEventListener("change",renderTrend);renderTrend();
 const total=E("div","inv-sector-summary"),details=E("div","inv-sector-bars");
 root.append(total,details);
 const parts=[["Oil & gas","migas"],["Mineral & coal","minerba"],["Electricity","power"],["Renewables (EBTKE)","ebt"]];
 function renderYear(){
  total.replaceChildren();details.replaceChildren();
  const record=d.sector_history.find(x=>x.year===Number(yearSelect.value));if(!record)return;
  const top=E("div","grid tr-grid");
  const c=E("div","card tr-kpi");c.style.cursor="default";c.append(E("div","eyebrow","ESDM · "+record.year+" sector total"),E("h2","tr-value","US$"+money(record.total)+"bn"),E("p",null,"Sector-specific investment realization, not BKPM annual total"));top.append(c);
  for(const [name,key] of parts){
   const item=E("div","card tr-kpi");item.style.cursor="default";
   item.append(E("div","eyebrow",name),E("h2","tr-value","US$"+money(record[key])+"bn"),E("p",null,(100*record[key]/record.total).toFixed(1)+"% of published ESDM total"));top.append(item);
  }
  total.append(top);
  const prev=d.sector_history.find(x=>x.year===record.year-1);
  if(prev)total.append(E("p","tr-detail","Reported ESDM total YoY: "+(100*(record.total/prev.total-1)).toFixed(1)+"% versus "+prev.year+". This is not a national GDP growth rate."));
  const bar=E("div","inv-investment-bars");for(const [label,key] of parts){
   const wrap=E("div","inv-sector-bar"),row=E("div","inv-stake-head"),track=E("div","inv-stake-track"),fill=E("div","inv-stake-fill");
   row.append(E("span",null,label),E("strong",null,"US$"+money(record[key])+"bn"));
   fill.style.width=Math.min(100,100*record[key]/record.total)+"%";track.append(fill);wrap.append(row,track);bar.append(wrap)
  }
  details.append(bar);
  if(record.year===2025){
   const line=E("p","tr-detail","2025 ESDM target: US$"+money(d.target_2025.total)+"bn · reported realization "+(100*record.total/d.target_2025.total).toFixed(1)+"% of target. Migas target US$"+money(d.target_2025.migas)+"bn versus actual US$"+money(record.migas)+"bn.");
   details.append(line);
  }
  const rounding=parts.reduce((n,entry)=>n+record[entry[1]],0);
  if(Math.abs(rounding-record.total)>0.025)details.append(E("p","tr-detail","Publication reconciliation caveat: component total US$"+money(rounding)+"bn differs from published total US$"+money(record.total)+"bn. SLI preserves source numbers without artificial balancing."));
 }
 yearSelect.addEventListener("change",renderYear);renderYear();
 const sourceNote=E("p","tr-detail","Official source: ");sourceNote.append(link(d.sector_source.url,"ESDM Secretariat General 2025 annual report"));root.append(sourceNote);
 const hr=E("div","section");hr.append(E("h2",null,"Mining investment by licence type · 2025"),E("span",null,"Not mineral commodity totals"));root.append(hr);
 const miner=d.minerba_2025;
 const mineral=E("div","pf-table-wrap"),tbl=E("table");tbl.innerHTML="<thead><tr><th>Permit category</th><th>Actual US$m</th><th>Target US$m</th><th>Target attainment</th></tr></thead>";
 const tbody=E("tbody");for(const line of miner.lines){const tr=E("tr");[line.type,money(line.actual),money(line.target),(100*line.actual/line.target).toFixed(1)+"%"].forEach(c=>tr.append(E("td",null,c)));tbody.append(tr)}
 const footer=E("tr");[ "Official published total",money(miner.total_usd_million),money(miner.target_usd_million),(100*miner.total_usd_million/miner.target_usd_million).toFixed(1)+"%"].forEach(c=>footer.append(E("td",null,c)));tbody.append(footer);tbl.append(tbody);mineral.append(tbl);root.append(mineral);
 const nc=E("p","tr-detail",miner.note+" ");nc.append(link(miner.source.url,"ESDM 2025 Table 45"));root.append(nc);
 const hd=E("div","section");hd.append(E("h2",null,"Capital classification · Danantara transaction watch"),E("span",null,"Funded vs conditional vs assets under management"));root.append(hd);
 const choices=E("select","tr-select");
 [["all","All classifications"],["Outbound convertible preferred equity","Outbound investment"],["Managed assets / AUM stock","Assets under management"]].forEach(([v,label])=>{const o=E("option",null,label);o.value=v;choices.append(o)});
 const choiceLabel=E("label",null,"Transaction category");choiceLabel.append(choices);const row=E("div","tr-controls");row.append(choiceLabel);root.append(row);
 const deals=E("div","tr-news");root.append(deals);
 function renderDeals(){
  deals.replaceChildren();
  for(const t of d.deal_register.filter(x=>choices.value==="all"||x.type===choices.value)){
   const card=E("article","tr-news-card");
   card.append(E("div","eyebrow",t.published+" · "+t.jurisdiction+" · "+t.type));
   card.append(E("h3",null,t.entity),E("p",null,t.value+" "+t.unit+" · "+t.status));
   card.append(E("p","tr-detail","Financial meaning: "+t.deal_reality));
   card.append(E("p","tr-detail","Next evidence: "+t.next));
   const refs=E("p","tr-detail","Original source: ");refs.append(link(t.source,"Primary disclosure"));card.append(refs);deals.append(card);
  }
 }
 choices.addEventListener("change",renderDeals);renderDeals();
 const takeaway=E("details");takeaway.append(E("summary",null,"Investment interpretation · evidence-led assessment"));
 const ul=E("ol");for(const point of d.assessment)ul.append(E("li",null,point));takeaway.append(ul);root.append(takeaway);
};
})();