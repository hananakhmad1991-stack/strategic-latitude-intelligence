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

let lastPolicyData=null;
function policies(root,data){
 lastPolicyData=data;
 const currentLang=()=>window.SLIi18n?.language==="id"?"id":"en";
 const translate=(en,id)=>currentLang()==="id"?id:en;
 section(root,"Energy Policy & Regulatory Update","Enacted instruments, regulatory execution and proposals · with dedicated upstream / downstream oil & gas coverage");
 note(root,data.note);
 const oilCount=data.items.filter(x=>x.sector==="Oil & Gas").length;
 const quick=E("div","gov-quick-filters");quick.setAttribute("role","group");quick.setAttribute("aria-label","Policy topics");
 const oil=E("button","gov-quick",translate("Oil & Gas ("+oilCount+")","Migas ("+oilCount+")"));
 oil.type="button";oil.setAttribute("aria-pressed","false");
 const other=E("button","gov-quick active",translate("All sectors","Semua sektor"));
 other.type="button";other.setAttribute("aria-pressed","true");
 const explain=E("p","gov-meta",translate("Filter by sector and legal status; oil & gas contains upstream, fuel, LPG, industrial gas and Jargas rules.","Filter menurut sektor dan status hukum; migas mencakup hulu, BBM, LPG, gas industri, dan Jargas."));
 quick.append(other,oil);root.append(quick,explain);
 const controls=E("div","gov-controls");
 const sector=elSelect([["all",translate("All policy topics","Semua topik kebijakan")],...Array.from(new Set(data.items.map(x=>x.sector))).sort().map(x=>[x,x==="Oil & Gas"?translate("Oil & Gas","Minyak & Gas Bumi"):x])]);
 const segment=elSelect([["all",translate("All oil & gas subtopics","Semua subsektor migas")],...["Foundation","Upstream","Downstream & fuel","Gas pricing & networks"].map(x=>[x,({Foundation:translate("Legal foundation","Landasan hukum"),Upstream:translate("Upstream / exploration","Hulu / eksplorasi"),"Downstream & fuel":translate("Downstream / fuels and LPG","Hilir / BBM dan LPG"),"Gas pricing & networks":translate("Natural gas, HGBT & Jargas","Gas bumi, HGBT dan Jargas")})[x]])]);
 segment.setAttribute("aria-label",translate("Oil and gas subtopic","Subsektor migas"));
 const state=elSelect([["all",translate("All policy statuses","Semua status kebijakan")],["Enacted",translate("Enacted legal instruments","Regulasi berlaku")],["Official decision",translate("Official decisions","Keputusan resmi")],["Corporate decision",translate("Corporate decisions","Keputusan korporasi")],["Announced — not enacted",translate("Announcements only","Baru pengumuman")],["Draft / under development",translate("Drafts / proposals","Draf / usulan")]]);
 const query=E("input","gov-input");query.type="search";query.placeholder=translate("Search law, instrument or policy…","Cari regulasi, nomor aturan, atau kebijakan…");query.setAttribute("aria-label",translate("Search policy records","Cari arsip regulasi"));
 controls.append(sector,segment,state,query);root.append(controls);
 const status=E("p","gov-meta"),list=E("div","gov-policy-list");root.append(status,list);
 const labels={"Enacted":["Enacted","Berlaku"],"Official decision":["Official decision","Keputusan resmi"],"Corporate decision":["Corporate decision","Keputusan korporasi"],"Announced — not enacted":["Announced only","Baru diumumkan"],"Draft / under development":["Draft","Dalam penyusunan"]};
 const draw=()=>{
  segment.hidden=sector.value!=="Oil & Gas";
  if(segment.hidden)segment.value="all";
  const q=query.value.toLocaleLowerCase().trim();
  const rows=data.items.filter(x=>
   (sector.value==="all"||x.sector===sector.value)&&
   (segment.hidden||segment.value==="all"||x.subsector===segment.value)&&
   (state.value==="all"||x.status===state.value)&&
   [x.title,x.title_id,x.instrument,x.effect,x.effect_id,x.sector,x.subsector].join(" ").toLocaleLowerCase().includes(q)
  ).sort((a,b)=>b.date.localeCompare(a.date));
  const oilActive=sector.value==="Oil & Gas";
  for(const [button,active] of [[oil,oilActive],[other,!oilActive]]){
   button.classList.toggle("active",active);
   button.setAttribute("aria-pressed",String(active));
  }
  status.textContent=rows.length+" "+translate("curated records","catatan terkurasi")+
   (oilActive?" · "+translate("Oil & Gas policy register","Register kebijakan migas"):"")+
   " · "+translate("Reviewed","Ditinjau")+" "+(document.documentElement.dataset.govAsOf||"2026-10-15")+".";
  list.replaceChildren();
  rows.forEach(x=>{
   const card=E("article","gov-policy"),h=E("div","gov-policy-head");
   const str=labels[x.status]||[x.status,x.status];
   h.append(tag(translate(str[0],str[1]),x.status==="Enacted"?"gov-tag gov-enacted":"gov-tag gov-caution"),
    tag(x.sector==="Oil & Gas"?translate("Oil & Gas","Migas"):x.sector,"gov-tag gov-tag-secondary"),
    E("span","gov-date",x.date));
   if(x.subsector)h.append(tag(x.subsector==="Upstream"?translate("Upstream","Hulu"):x.subsector==="Downstream & fuel"?translate("Downstream / fuel","Hilir / BBM"):x.subsector==="Gas pricing & networks"?translate("Gas / HGBT / Jargas","Gas / HGBT / Jargas"):translate("Legal basis","Landasan hukum"),"gov-tag gov-tag-secondary"));
   card.append(h,E("h3",null,currentLang()==="id"&&x.title_id?x.title_id:x.title),E("p","gov-leader",x.instrument),E("p",null,currentLang()==="id"&&x.effect_id?x.effect_id:x.effect));
   card.append(LINK(x.source,translate("Official law / attributable source ↗","Sumber hukum resmi / teratribusi ↗")));
   list.append(card);
  });
  if(!rows.length)note(list,translate("No policy records match the selected sector, date or search.","Tidak ada kebijakan sesuai sektor, status, atau pencarian."));
 };
 other.addEventListener("click",()=>{sector.value="all";segment.value="all";state.value="all";query.value="";draw()});
 oil.addEventListener("click",()=>{sector.value="Oil & Gas";segment.value="all";state.value="all";query.value="";draw()});
 for(const x of [sector,segment,state])x.addEventListener("change",draw);
 query.addEventListener("input",draw);
 draw();
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
  const relevant=kind==="policy"?(data.items||[]).filter(x=>x.group==="ESDM legal instrument candidates"?/peraturan menteri|keputusan menteri|perpres|permen/i.test(x.title||""):/perpres|permen|peraturan|regulasi|kebijakan|menko|migas|hulu|hilir|SKK|BPH|LPG|HGBT|gas bumi|gross split|kontrak migas|lifting|BBM|transisi energi|tarif listrik|subsidi|moratorium|B50|E50/i.test(x.title||"")):(data.reports||[]).filter(x=>x.topic_id==="policy"&&/aturan|regulasi|perpres|permen|kebijakan|izin|migas|gas bumi|HGBT|SKK|BPH|LPG|BBM|gross split|lifting|etanol|subsidi|kuota|energi/i.test(x.title||""));
  check.textContent=(kind==="policy"?"Official-source candidate scan: ":"Fallback domestic policy-news scan: ")+stampLabel+" · "+relevant.length+" attributed leads · NOT legal enactment verification"+(data.stale_previous_results?" · stale data":"");
  relevant.slice(0,5).forEach(x=>{
   const row=E("div","gov-lead");row.append(LINK(x.url,x.title),E("div","gov-meta",(x.publisher||"Source")+" · candidate only; verify original legal text / effective date before promotion"));stories.append(row);
  });
  if(!relevant.length)note(stories,"No recent qualified release candidates. This does NOT prove no new regulations were issued.");
  if((data.scan_errors||[]).length)note(stories,"Some candidate feeds failed; coverage may be incomplete.");
 })();
}
document.addEventListener("sli:languagechange",()=>{
 const root=document.getElementById("energyPolicyRoot");
 if(!root||!lastPolicyData)return;
 root.replaceChildren();
 policies(root,lastPolicyData);
});
function ccs(root,data){
 section(root,"Carbon Capture, Utilisation & Storage (CCS/CCUS)","Geological potential, regulation, project maturity & commercial realisation");
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
  const hero=E("div","gov-hero");hero.append(E("div","eyebrow","INDONESIA · ENERGY GOVERNANCE"),E("h2",null,"Institutional responsibilities & accountability"),E("p",null,"Who directs policy, who regulates and who executes it · verified as of "+d.as_of));root.append(hero);
  governance(root,d.governance);
  const policyRoot=document.getElementById("energyPolicyRoot")||root;
  const ccsRoot=document.getElementById("energyCCSRoot")||root;
  if(policyRoot!==root)policyRoot.replaceChildren();
  if(ccsRoot!==root)ccsRoot.replaceChildren();
  policies(policyRoot,d.policies);
  ccs(ccsRoot,d.ccs);
 }catch(e){root.replaceChildren(E("div","gov-note","Energy governance research data is temporarily unavailable. Other Energy Security sections remain accessible."));}
};
})();
