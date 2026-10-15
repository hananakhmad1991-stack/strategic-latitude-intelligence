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

function showActorWatch(root){
 const panel=E("div","gov-live");
 panel.append(E("h3",null,"Official leadership verification · automated source scan"));
 const status=E("p","gov-meta","Loading verification status…"),items=E("div","gov-leads");
 panel.append(status,items);root.append(panel);
 fetch("data/energy-actors-status.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Not published");return r.json()}).then(d=>{
  const checked=new Date(d.checked_at_utc);
  const age=(Date.now()-checked.getTime())/3600000;
  status.textContent="Official source scan: "+(isNaN(checked.getTime())?"date unavailable":checked.toLocaleString("en-GB",{timeZone:"Asia/Jakarta",dateStyle:"medium",timeStyle:"short"})+" WIB")+" · "+d.official_sources_checked+" sources · "+(d.verified_auto_changes||[]).length+" automatically corroborated leadership changes"+(age>12?" · Delayed scan":"");
  const pending=(d.requires_review||[]);
  if(pending.length){note(items,pending.length+" candidate appointments await two independent official-source confirmations.");
   pending.slice(0,5).forEach(x=>{const row=E("div","gov-lead");row.append(E("strong",null,x.actor+": "+x.candidate),E("p","gov-meta",x.reason));items.append(row)})}
  else note(items,"No uncorroborated ministerial appointments detected by this scan. This does not prove there have been no changes.");
  if((d.errors||[]).length)note(items,(d.errors||[]).length+" institutional source checks could not be completed; review the source-health file.");
  if((d.appointment_headline_leads||[]).length){
   const h=E("div","gov-layer-title");h.append(E("strong",null,"Recently indexed appointment reports · unverified"));items.append(h);
   (d.appointment_headline_leads||[]).slice(0,5).forEach(x=>{const r=E("div","gov-lead");r.append(LINK(x.url,x.title),E("p","gov-meta",(x.publisher||"Source")+" · "+String(x.published_at_utc||"").slice(0,10)+" · Verify official appointment before changing roster"));items.append(r);});
  }

 }).catch(()=>{status.textContent="Institutional monitor not yet published. The currently verified actor roster remains visible below."});
}
function showCCSWatch(root){
 const box=E("div","gov-live");box.append(E("h3",null,"CCS/CCUS Development Watch · attributed sources"));
 const stamp=E("p","gov-meta","Awaiting dated project monitoring scan…"),list=E("div","gov-leads");box.append(stamp,list);root.append(box);
 fetch("data/energy-ccs-updates.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Not published");return r.json()}).then(d=>{
  const t=new Date(d.checked_at_utc),age=(Date.now()-t.getTime())/3600000;
  const items=(d.updates||[]).filter(x=>x.url&&x.title);
  stamp.textContent="CCS source scan: "+(isNaN(t.getTime())?"date unavailable":t.toLocaleString("en-GB",{timeZone:"Asia/Jakarta",dateStyle:"medium",timeStyle:"short"})+" WIB")+" · "+items.length+" attributed leads"+(age>12?" · Delayed scan":"")+(d.stale_previous_results?" · Previous leads retained":"");
  items.slice(0,8).forEach(x=>{const row=E("div","gov-lead");row.append(tag(x.track),E("span","gov-meta"," · "+x.publisher+" · "+String(x.published_at_utc||"").slice(0,10)),E("div",null));row.lastChild.append(LINK(x.url,x.title));row.append(E("p","gov-meta","Headline discovered automatically; stage, investment and CO₂ injection NOT independently verified."));list.append(row)});
  if(!items.length)note(list,"No qualifying CCS sources found in the scan. This does not imply no project activity.");
  if((d.errors||[]).length)note(list,"Some CCS feeds failed; coverage may be incomplete.");
 }).catch(()=>{stamp.textContent="CCS project change scanner has not published data; verified project snapshots remain below.";});
}

function governance(root,data){
 if(typeof window.renderSLIStakeholderMap==="function"){
  window.renderSLIStakeholderMap(root,data);
 }else{
  const el=E("div","gov-note","Interactive stakeholder map is temporarily unavailable. The research data and policy register remain accessible.");
  root.append(el);
  const groups=E("div");
  data.layers.forEach(layer=>{
   const section=E("details","gov-details");
   const title=E("summary",null,layer.title+" · "+layer.actors.length+" actors");section.append(title);
   layer.actors.forEach(x=>{
    const p=E("p",null,x.name+" — "+x.lead+" — "+x.role);section.append(p,LINK(x.source,"Source ↗"));
   });groups.append(section);
  });root.append(groups);
 }
 const secondary=E("details","stake-directory");
 const summary=E("summary",null,"Official source monitoring & research notes");
 const content=E("div","stake-directory-inner");
 secondary.append(summary,content);root.append(secondary);
 let ready=false;
 secondary.addEventListener("toggle",()=>{
  if(!secondary.open||ready)return;
  ready=true;showActorWatch(content);
  const analysis=E("div","gov-takeaways");
  analysis.append(E("h3",null,"Governance analytical findings"));
  const ul=E("ol");(data.strategic_readout||[]).forEach(t=>ul.append(E("li",null,t)));
  analysis.append(ul);content.append(analysis);
 });
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
  const relevant=kind==="policy"?(data.items||[]).filter(x=>x.group==="ESDM legal instrument candidates"?/peraturan menteri|keputusan menteri|perpres|permen/i.test(x.title||""):/perpres|permen|peraturan|regulasi|kebijakan|menko|transisi energi|tarif listrik|subsidi|moratorium|B50|E50/i.test(x.title||"")):(data.reports||[]).filter(x=>x.topic_id==="policy"&&/aturan|regulasi|perpres|permen|kebijakan|izin|etanol|subsidi|kuota|energi/i.test(x.title||""));
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
 showCCSWatch(root);
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
