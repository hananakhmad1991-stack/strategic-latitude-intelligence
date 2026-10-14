/* SLI Energy Governance / Policy Register / CCS-CCUS Project Intelligence. */
(function(){
"use strict";
const E=(tag,cl,text)=>{const e=document.createElement(tag);if(cl)e.className=cl;if(text!==undefined&&text!==null)e.textContent=String(text);return e};
const LINK=(url,label)=>{if(!/^https:\/\//i.test(url||""))return E("span",null,label||"Source unavailable");const a=E("a",null,label||"Source ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
const section=(p,t,sub)=>{const x=E("div","section");x.append(E("h2",null,t),E("span",null,sub));p.append(x);return x};
const note=(p,text,cls="gov-note")=>p.append(E("div",cls,text));
const elSelect=(opts,cls="gov-select")=>{const s=E("select",cls);opts.forEach(([v,label])=>{const o=E("option",null,label);o.value=v;s.append(o)});return s};
const meta=(p,s)=>p.append(E("p","gov-meta",s));
const tag=(text,cls="gov-tag")=>E("span",cls,text);
function governance(root,data){
 section(root,"01 · Institutional Structure & Actor Analysis","Strategic authority → regulation / oversight → investment / execution");
 note(root,data.warning);
 const headline=E("div","gov-chain");["President & DEN | national priorities","ESDM / Finance / Bappenas | policy, planning, fiscal","Regulators & SKK Migas / BPMA | permits, oversight","PLN / Pertamina / private operators | project execution"].forEach((x,i)=>{if(i)headline.append(E("span","gov-arrow","→"));headline.append(E("div","gov-node",x))});root.append(headline);
 const controls=E("div","gov-controls"),search=E("input","gov-input"),kind=elSelect([["all","All actor types"],...["Strategy","Regulator","Fiscal","Planning","Implementer","Operator","Financier","Research"].map(x=>[x,x])]);
 search.placeholder="Find agency, official, responsibility…";search.setAttribute("aria-label","Search actors");
 controls.append(search,kind);root.append(controls);
 const mount=E("div");root.append(mount);
 const draw=()=>{
  mount.replaceChildren();
  const query=search.value.toLocaleLowerCase();
  let count=0;
  data.layers.forEach(layer=>{
   const items=layer.actors.filter(x=>(kind.value==="all"||kind.value===x.kind)&&[x.name,x.lead,x.role,x.scope].join(" ").toLowerCase().includes(query));
   if(!items.length)return;
   count+=items.length;
   const box=E("div","gov-layer"),title=E("div","gov-layer-title");title.append(E("strong",null,layer.title),E("span",null,items.length+" actors"));box.append(title);
   const cards=E("div","gov-grid");
   items.forEach(x=>{
    const card=E("article","gov-actor"),header=E("div","gov-actor-head");header.append(tag(x.kind),tag(x.scope,"gov-tag gov-tag-secondary"));card.append(header,E("h3",null,x.name),E("p","gov-leader",x.lead),E("p",null,x.role));
    const foot=E("div","gov-foot");foot.append(E("span",null,"Source checked: "+x.verified),LINK(x.source,"Role source ↗"));card.append(foot);cards.append(card);
   });box.append(cards);mount.append(box);
  });
  if(!count)note(mount,"No institutional records match this filter.");
 };
 search.addEventListener("input",draw);kind.addEventListener("change",draw);draw();
 const analysis=E("div","gov-takeaways");analysis.append(E("h3",null,"Governance assessment · Where authority meets implementation"));
 const ul=E("ul");data.strategic_readout.forEach(x=>ul.append(E("li",null,x)));analysis.append(ul);root.append(analysis);
}
function policies(root,data){
 section(root,"02 · Energy Policy & Regulatory Update","Enacted instruments vs corporate decisions vs proposals");
 note(root,data.note);
 const controls=E("div","gov-controls");
 const sector=elSelect([["all","All policy topics"],...Array.from(new Set(data.items.map(x=>x.sector))).sort().map(x=>[x,x])]);
 const state=elSelect([["all","All policy statuses"],["Enacted","Enacted"],["Official decision","Official decisions"],["Corporate decision","Corporate decisions"],["Announced — not enacted","Announcements only"],["Draft / under development","Drafts / proposals"]]);
 const query=E("input","gov-input");query.placeholder="Search instrument or policy…";query.setAttribute("aria-label","Search policy records");
 controls.append(sector,state,query);root.append(controls);
 const status=E("p","gov-meta"),list=E("div","gov-policy-list");root.append(status,list);
 const draw=()=>{
  const rows=data.items.filter(x=>(sector.value==="all"||x.sector===sector.value)&&(state.value==="all"||x.status===state.value)&&[x.title,x.instrument,x.effect,x.sector].join(" ").toLowerCase().includes(query.value.toLowerCase())).sort((a,b)=>b.date.localeCompare(a.date));
  status.textContent=rows.length+" dated policy / governance records, curated through "+(document.documentElement.dataset.govAsOf||"15 October 2026")+".";
  list.replaceChildren();
  rows.forEach(x=>{
   const card=E("article","gov-policy"),h=E("div","gov-policy-head");h.append(tag(x.status,x.status==="Enacted"?"gov-tag gov-enacted":"gov-tag gov-caution"),tag(x.sector,"gov-tag gov-tag-secondary"),E("span","gov-date",x.date));card.append(h,E("h3",null,x.title),E("p","gov-leader",x.instrument),E("p",null,x.effect));
   card.append(LINK(x.source,"Primary / attributable source ↗"));list.append(card);
  });
  if(!rows.length)note(list,"No records match these filters.");
 };
 for(const x of [sector,state])x.addEventListener("change",draw);query.addEventListener("input",draw);draw();
 const live=E("div","gov-live");live.append(E("h3",null,"Recent regulatory-news leads (not enacted-policy records)"));
 const check=E("p","gov-meta","Reading attributed domestic monitoring leads…"),stories=E("div","gov-leads");live.append(check,stories);root.append(live);

 (async()=>{
  let data,kind;
  try{
   const r=await fetch("data/energy-policy-leads.json",{cache:"no-store"});
   if(!r.ok)throw Error("Policy watcher has not published yet");
   data=await r.json();kind="policy";
  }catch(e){
   try{
    const r=await fetch("data/domestic-energy.json",{cache:"no-store"});
    if(!r.ok)throw Error("Domestic watcher missing");
    data=await r.json();kind="domestic";
   }catch(err){check.textContent="Awaiting the first valid policy-source scan. Curated dated legal and policy records remain above.";return;}
  }
  const stamp=new Date(data.checked_at_utc);
  const stampLabel=isNaN(stamp.getTime())?"unknown":stamp.toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jakarta"})+" WIB";
  const relevant=kind==="policy"?(data.items||[]):(data.reports||[]).filter(x=>x.topic_id==="policy"&&/aturan|regulasi|perpres|permen|kebijakan|izin|etanol|subsidi|kuota|energi/i.test(x.title||""));
  check.textContent=(kind==="policy"?"Official-source candidate scan: ":"Fallback domestic policy-news scan: ")+stampLabel+" · "+relevant.length+" attributed leads · NOT legal enactment verification"+(data.stale_previous_results?" · stale data":"");
  relevant.slice(0,5).forEach(x=>{
   const row=E("div","gov-lead");row.append(LINK(x.url,x.title),E("div","gov-meta",(x.publisher||"Source")+" · candidate only; verify original legal text / effective date before promotion"));stories.append(row);
  });
  if(!relevant.length)note(stories,"No recent qualified release candidates. This does NOT prove no new regulations were issued.");
  if((data.scan_errors||[]).length)note(stories,"Some candidate feeds failed; coverage may be incomplete.");
 })();
}
function ccs(root,data){
 section(root,"03 · Carbon Capture, Utilisation & Storage (CCS/CCUS)","Geological potential, regulation, project maturity & commercial realisation");
 note(root,data.note,"gov-note gov-caution-note");
 const kpis=E("div","gov-kpis");
 const latest=data.potential[0],prior=data.potential[1];
 const values=[
  ["2026 saline-aquifer screening",latest.saline_gt.toLocaleString("en-US")+" Gt CO₂","Geological estimate · not permitted capacity"],
  ["2026 depleted-reservoir estimate",latest.depleted_gt+" Gt CO₂","Historical field/reservoir screening"],
  ["Policy project ambition","~15 projects","2024 ESDM potential 2026–2030; not delivered count"],
  ["Commercial CO₂ injection","Unverified","No comparable audited nationwide injected volume"],
  ["CCS-only realized investment","Not established","No consolidated project-level actual capex"]
 ];
 values.forEach(([k,v,desc])=>{const card=E("div","card gov-kpi");card.style.cursor="default";card.append(E("div","eyebrow",k),E("h2","gov-big",v),E("p",null,desc));kpis.append(card)});root.append(kpis);
 const vintage=E("div","gov-vintage");vintage.append(E("h3",null,"Different geological-study vintages — do not add"));
 [latest,prior].forEach(x=>{const r=E("div","gov-vintage-row");r.append(E("strong",null,x.vintage),E("span",null,x.saline_gt+" Gt saline + "+x.depleted_gt+" Gt depleted"),LINK(x.source,"Official source ↗"));vintage.append(r)});
 vintage.append(E("p","gov-meta","The 2026 500/4 Gt and 2024 572.77/4.85 Gt estimates use different dated studies and levels of screening. They are not annual progress, certified capacity, available injection rates or captured emissions."));root.append(vintage);
 const summary=E("div","gov-status");summary.append(E("strong",null,"Project-count and realisation caveat"),E("p",null,data.target.text),LINK(data.target.source,"ESDM target statement ↗"),E("p",null,data.realized.note));root.append(summary);
 section(root,"Selected Major CCS/CCUS Projects","Operator, status, indicative potential, investment disclosure and delivery test");
 const ctrl=E("div","gov-controls"),filter=elSelect([["all","All development stages"],...Array.from(new Set(data.projects.map(x=>x.stage))).map(x=>[x,x])]);
 const search=E("input","gov-input");search.placeholder="Search project, operator or province…";search.setAttribute("aria-label","Search CCS projects");ctrl.append(filter,search);root.append(ctrl);
 const holder=E("div","gov-projects"),status=E("p","gov-meta");root.append(status,holder);
 const draw=()=>{
  const projects=data.projects.filter(p=>(filter.value==="all"||p.stage===filter.value)&&[p.name,p.operator,p.location,p.partners,p.status].join(" ").toLowerCase().includes(search.value.toLowerCase()));
  status.textContent=projects.length+" documented projects / studies. Stage is per cited dated source and does not certify current onstream status.";
  holder.replaceChildren();projects.forEach(p=>{
   const card=E("article","gov-project"),head=E("div","gov-project-head");
   head.append(E("div",null),tag(p.stage));head.firstChild.append(E("h3",null,p.name),E("div","gov-meta",p.location+" · "+p.operator));card.append(head);
   const details=E("div","gov-project-grid");
   const fields=[
    ["Implementation",p.status+" · "+p.realization],
    ["Parties",p.partners],
    ["Storage / CO₂",p.storage_million_tco2===null?"Not disclosed / unverified":p.storage_million_tco2+" million tCO₂ indicative; "+p.storage_basis],
    ["Investment",p.investment_usd_billion===null?"Not verified":("US$"+p.investment_usd_billion+" billion · "+p.investment_basis)],
    ["Target / next milestone",p.target],
   ];
   fields.forEach(([k,v])=>{const item=E("div","gov-project-cell");item.append(E("strong",null,k),E("p",null,v));details.append(item)});
   card.append(details);const foot=E("div","gov-foot");foot.append(E("span",null,"Source vintage: "+p.date),LINK(p.source,"Project evidence ↗"));card.append(foot);holder.append(card);
  });
  if(!projects.length)note(holder,"No projects match this filter.");
 };
 filter.addEventListener("change",draw);search.addEventListener("input",draw);draw();
 const assessment=E("div","gov-takeaways");assessment.append(E("h3",null,"SLI CCS/CCUS strategic assessment"));const ul=E("ol");data.assessment.forEach(x=>ul.append(E("li",null,x)));assessment.append(ul);root.append(assessment);
}
window.initEnergyGovernance=async function(){
 const root=document.getElementById("energyGovernanceRoot");if(!root)return;
 root.replaceChildren(E("p",null,"Loading sourced energy governance and CCS research…"));
 try{
  const r=await fetch("data/energy-governance-ccs.json",{cache:"no-store"});if(!r.ok)throw Error("Data not published");
  const d=await r.json();if(!d.governance?.layers||!d.policies?.items||!d.ccs?.projects)throw Error("Incomplete research data");
  document.documentElement.dataset.govAsOf=d.as_of;
  root.replaceChildren();
  const hero=E("div","gov-hero");hero.append(E("div","eyebrow","Energy governance & carbon management intelligence"),E("h2",null,"Who decides, who executes — and what is actually happening?"),E("p",null,"Source-dated institutional mapping, regulatory implementation and CCS investment tracking · "+d.as_of));root.append(hero);
  governance(root,d.governance);policies(root,d.policies);ccs(root,d.ccs);
 }catch(e){root.replaceChildren(E("div","gov-note","Energy governance research data is temporarily unavailable. Other Energy Security sections remain accessible."));}
};
})();
