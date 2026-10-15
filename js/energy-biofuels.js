/* SLI Biofuels Intelligence. All figures have source vintages; no implied live metering. */
(function(){
"use strict";
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined&&txt!==null)n.textContent=String(txt);return n};
const id=n=>new Intl.NumberFormat("id-ID",{maximumFractionDigits:2}).format(Number(n));
const link=(url,txt)=>{const a=el("a","bio-source",txt||"Official / attributed source ↗");if(/^https:\/\//.test(url||"")){a.href=url;a.target="_blank";a.rel="noopener noreferrer"}return a};
const add=(parent,tag,cls,txt)=>{const n=el(tag,cls,txt);parent.append(n);return n};
const note=(parent,txt)=>add(parent,"p","bio-note",txt);
const box=(title,val,sub,url)=>{const c=el("div","bio-stat");add(c,"span","bio-cap",title);add(c,"strong","bio-value",val);note(c,sub);if(url)c.append(link(url,"Source ↗"));return c};
const subsection=(p,title,small)=>{const h=el("div","bio-head");add(h,"h3",null,title);add(h,"span",null,small);p.append(h)};
function graph(p,items,max){const c=el("div","bio-graph");items.forEach(item=>{const r=el("div","bio-bar-row");const top=el("div","bio-bar-label");top.append(el("span",null,item.label),el("strong",null,id(item.n)+" "+(item.unit||"million kL")));r.append(top);const track=el("div","bio-bar-track"),fill=el("div","bio-bar-fill");fill.style.width=Math.min(100,Math.max(0,item.n/max*100))+"%";if(item.highlight)fill.classList.add("bio-bar-accent");track.append(fill);r.append(track);if(item.note)note(r,item.note);c.append(r)});p.append(c)}
function overview(p,d){subsection(p,"Manufacturing capacity versus fuel demand","Different vintages and scopes — do not confuse output with blending capacity");
 const g=el("div","bio-stats");g.append(
 box("Installed FAME capacity · 2026",id(d.installed_capacity.million_kl_per_year)+"m kL/yr","Aggregated nameplate; operational utilization unverified",d.installed_capacity.source),
 box("2025 biodiesel production",id(d.actuals_2025.production_million_kl)+"m kL","Actual FAME production · full-year official record",d.actuals_2025.source),
 box("2025 domestic distribution",id(d.actuals_2025.domestic_distribution_million_kl)+"m kL","Delivered FAME; different from 2025 internal KPI measure",d.actuals_2025.source),
 box("2026 year-to-date delivered",id(d.actuals_2026.distributed_million_kl)+"m kL","Cumulative to "+d.actuals_2026.as_of+" only",d.actuals_2026.source),
 box("2026 B50 planning volume",id(d.allocation.revised_planning_million_kl)+"m kL","June government estimate — not signed revised company allocations",d.allocation.planning_source),
 box("Original 2026 allocation",id(d.allocation.initial_2026_kl/1e6)+"m kL","Dec 2025 initial Kepmen 439 (B40 basis)",d.allocation.source));p.append(g);
 subsection(p,"Capacity, projection and verified volume","million kL · distinct concepts, not one utilization time series");
 graph(p,[{label:"2026 installed capacity",n:d.installed_capacity.million_kl_per_year},{label:"2026 planning volume",n:d.allocation.revised_planning_million_kl,highlight:true},{label:"2025 actual production",n:d.actuals_2025.production_million_kl},{label:"2025 actual domestic distribution",n:d.actuals_2025.domestic_distribution_million_kl},{label:"2026 distributed through 7 Sep",n:d.actuals_2026.distributed_million_kl}],d.installed_capacity.million_kl_per_year);
 note(p,d.installed_capacity.caveat);note(p,d.actuals_2025.caveat);
 const call=el("div","bio-emphasis");add(call,"strong",null,"Current blending regime: "+d.blend.current+" · from 1 July 2026");note(call,d.blend.phase+" · B40 is a prior-phase reference; 2026 distribution is not yet a full-year actual.");call.append(link(d.blend.source,"B50 government release ↗"));p.append(call);
}
function plants(p,d){subsection(p,"Biodiesel production assets","Biodiesel FAME plants are separate from Pertamina crude-oil refineries");
 const g=el("div","bio-stats");g.append(box("Nameplate manufacturing",id(d.installed_capacity.million_kl_per_year)+"m kL/yr","Attributed 2026 EBTKE industry figure",d.installed_capacity.source),box("Nominated BBN businesses",d.plants.number_of_blenders_or_bbn_entities+" companies","Business count is NOT number of factory sites",d.plants.source),box("Nominated fuel distributors",d.plants.number_of_fuel_distributors+" companies","2026 original allocation roster",d.plants.source));p.append(g);
 note(p,d.plants.locations_note);
 const unknown=el("div","bio-emphasis");add(unknown,"strong",null,"Plant-level database · awaiting primary-source nameplate roster");note(unknown,"Individual operators, provinces, nameplate kL/year, utilization, commissioning, and terminal offtake must be separately verified. SLI will not fabricate a plant-by-plant capacity table or classify fuel blending terminals as production factories.");p.append(unknown);
 subsection(p,"2025 production versus distribution","Official EBTKE annual volumes");
 graph(p,[{label:"Produced",n:d.actuals_2025.production_million_kl},{label:"Distributed domestically",n:d.actuals_2025.domestic_distribution_million_kl,highlight:true},{label:"Reported exported",n:d.actuals_2025.exports_million_kl}],17);
 note(p,"Production less domestic distribution is not automatically export or unused spare capacity; inventory, timing and reporting boundaries can differ.");
}
function flows(p,d){subsection(p,"Consumption, allocation & blending","Volumes refer to biodiesel/FAME unless specified");
 const g=el("div","bio-stats");g.append(box("Jan–7 Sep 2026 delivered",id(d.actuals_2026.distributed_million_kl)+"m kL",d.actuals_2026.status,d.actuals_2026.source),box("2026 initial PSO allocation",id(d.allocation.pso_kl/1e6)+"m kL","Initial Kepmen 439; not the current amended B50 allocation",d.allocation.source),box("2026 initial non-PSO allocation",id(d.allocation.non_pso_kl/1e6)+"m kL","Initial Kepmen 439; check 2026 revision",d.allocation.source));p.append(g);
 graph(p,[{label:"Initial 2026 allocation (issued Dec 2025)",n:d.allocation.initial_2026_kl/1e6},{label:"June B50 programme planning estimate",n:d.allocation.revised_planning_million_kl,highlight:true},{label:"Actual to 7 Sep 2026 only",n:d.actuals_2026.distributed_million_kl}],20);
 note(p,d.allocation.target_2026_other_note);
 subsection(p,"2021–2025 utilization/distribution context","Annual public references · vintage differences");
 graph(p,d.domestic_distribution_history.map(r=>({label:String(r.year),n:r.million_kl,unit:"million kL"})),16);
 note(p,d.history_note);d.history_sources.forEach((url,i)=>p.append(link(url,i?"2025 EBTKE actual record ↗":"2021–24 ESDM series ↗")));
 const call=el("div","bio-emphasis");add(call,"strong",null,"Diesel market: "+d.diesel_market.consumption_range_million_kl_per_year.join("–")+"m kL finished fuel/year");note(call,d.diesel_market.note);call.append(link(d.diesel_market.source));p.append(call);
 subsection(p,"Bioethanol · separate maturity stage","E20 is not confirmed as nationwide in force");
 const e=d.ethanol;const eg=el("div","bio-stats");eg.append(box("E20 ethanol requirement discussed",id(e.announced_need_million_kl)+"m kL","ESDM 12 October policy estimate, not actual demand",e.official_source),box("Fuel-ethanol capacity","Not verified","No current national plant-by-plant certified capacity",e.official_source),box("Fuel-ethanol production","Not verified","Not inferred from industrial ethanol or gasoline demand",e.official_source));p.append(eg);
 note(p,e.consistency_warning);note(p,e.roadmap);p.append(link(e.roadmap_source,"E10→E20 planning roadmap ↗"));note(p,"Feedstocks under discussion: "+e.feedstocks.join(", ")+". Planned regions: "+e.feedstock_regions.join(", ")+".");note(p,e.alternative_pilots);p.append(link(e.specification_source,"2026 technical specification ↗"));
}
function policy(p,d){subsection(p,"Biodiesel & bioethanol policy register","Enacted vs initial allocation vs proposals");
 d.policies.forEach(pol=>{const c=el("div","bio-policy");const top=el("div","bio-policy-head");add(top,"strong",null,pol.name);add(top,"span",null,pol.category);c.append(top);add(c,"p","bio-rule",pol.instrument+" · "+pol.date);add(c,"p","bio-status",pol.status);note(c,pol.note);c.append(link(pol.source,"Policy release ↗"));p.append(c)});
 subsection(p,"Pricing & BPDP funding","Price index is not retail pump price");
 const g=el("div","bio-stats");g.append(box("Biodiesel HIP · OCT 2026","Rp "+id(d.price.hip_biodiesel_rp_per_l)+"/L","October 2026 EBTKE benchmark + freight (not retail)",d.price.biodiesel_source),box("Bioethanol HIP · JUN 2026","Rp "+id(d.price.hip_bioethanol_rp_per_l)+"/L","June 2026 EBTKE benchmark; older vintage",d.price.source));p.append(g);note(p,d.price.warning);
}
function risk(p,d){subsection(p,"Strategic implications for Indonesia","Analytical judgments — not quantified real-time warnings");const ul=el("ol","bio-risks");d.assessment.forEach(x=>add(ul,"li",null,x));p.append(ul);
 subsection(p,"Key feedstock and operational dependency","Palm oil · energy security · food security");note(p,d.feedstock.upstream_dependency);note(p,d.feedstock.risk);p.append(link(d.feedstock.source,"Technical implementation source ↗"));
}
async function radar(root,force){
 let old=root.querySelector(".bio-radar-results");if(old)old.remove();
 const out=el("div","bio-radar-results");root.append(out);note(out,"Loading published biofuel news and policy discovery…");
 try{
  const response=await fetch("data/energy-biofuels-watch.json?version="+(force?Date.now():"latest"),{cache:"no-store"});
  if(!response.ok)throw Error("not published");const d=await response.json();out.replaceChildren();
  const t=d.checked_at_utc?new Date(d.checked_at_utc):null;
  const age=t&&Number.isFinite(t.getTime())?(Date.now()-t.getTime())/3600000:null;
  add(out,"p","bio-note","Last public-source scan: "+(t?t.toLocaleString("id-ID",{timeZone:"Asia/Jakarta",dateStyle:"medium",timeStyle:"short"})+" WIB":"unknown")+
    (age!==null&&age>6?" · STALE (>6 hours)":"")+(d.errors&&d.errors.length?" · source errors reported":"")+". Headlines are discovery leads, not confirmed incidents or enacted regulations.");
  const controls=el("div","bio-chips");const types=["All","Policy","Capacity","Production","Feedstock","Distribution","Bioethanol","Sustainability","Prices"];const list=el("div","bio-radar-list");out.append(controls,list);
  const news=(d.items||[]).filter(x=>x.title&&x.url);
  function draw(type){list.replaceChildren();const showing=news.filter(x=>type==="All"||x.category===type).slice(0,18);
    if(!showing.length)note(list,"No attributable current source candidates for this category. Absence does not prove no incidents.");
    showing.forEach(x=>{const card=el("div","bio-news");add(card,"span","bio-news-tag",x.category+" · "+String(x.published_at_utc||"").slice(0,10));card.append(link(x.url,x.title+" ↗"));note(card,x.publisher+" · "+x.status);list.append(card)})}
  types.forEach((type,i)=>{const b=el("button","bio-chip"+(i===0?" active":""),type);b.type="button";b.onclick=()=>{Array.from(controls.children).forEach(c=>c.classList.toggle("active",c===b));draw(type)};controls.append(b)});draw("All");
 }catch(e){out.replaceChildren();note(out,"Live discovery ledger is not yet available. The curated figures and source links above remain usable.");}
}
window.initSLIBiofuels=async function(){
 const root=document.getElementById("energyBiofuelsRoot");if(!root)return;
 root.replaceChildren(el("p","bio-note","Loading biodiesel manufacturing, B50 programme and ethanol policy data…"));
 try{
  const r=await fetch("data/energy-biofuels.json",{cache:"no-store"});if(!r.ok)throw Error("missing");
  const d=await r.json();if(!d.installed_capacity||!d.blend||!Array.isArray(d.policies))throw Error("schema");root.replaceChildren();
  const hero=el("div","bio-hero");add(hero,"div","bio-overline","INDONESIA · BIOFUELS INTELLIGENCE · "+d.as_of);add(hero,"h2",null,"Biodiesel & Biofuel Security");note(hero,"Installed FAME capacity, actual output, mandated blends, CPO feedstock, fuel ethanol and regulatory implementation — with evidence vintages and monitored news leads.");root.append(hero);
  const tabs=el("div","bio-tabs"),panel=el("div","bio-panel"),entries=[["Snapshot",overview],["Production assets",plants],["Supply & demand",flows],["Policies & HIP",policy],["Risks",risk]];
  const btns=[];entries.forEach(([name,fn],i)=>{const b=el("button","bio-tab",name);b.type="button";b.onclick=()=>{panel.replaceChildren();fn(panel,d);btns.forEach((x,j)=>{x.classList.toggle("active",i===j);x.setAttribute("aria-pressed",String(i===j))})};btns.push(b);tabs.append(b)});root.append(tabs,panel);btns[0].click();
  const live=el("div","bio-panel bio-radar");const heading=el("div","bio-head");heading.append(el("h3",null,"Biofuel news & regulatory watch"));const refresh=el("button","bio-refresh","Refresh published feed ↻");refresh.type="button";refresh.onclick=()=>radar(live,true);heading.append(refresh);live.append(heading);note(live,"Automatic public-source headline discovery, updated on a scheduled basis. The refresh button fetches the latest published scan; it does NOT trigger live source verification.");root.append(live);radar(live,false);
  note(root,"As-of "+d.as_of+". No manufacturing-meter telemetry, certified real-time volumes, site-level installed capacity or revised enacted 2026 allocation have been independently established. Sources and official records take precedence over media snippets.");
 }catch(e){root.replaceChildren(el("p","bio-note","Biofuel research baseline could not be loaded. Other Energy Security features remain available."))}
};
})();