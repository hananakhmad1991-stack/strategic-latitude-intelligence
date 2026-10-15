/* SLI Investment Execution Intelligence — source-first registry and analytical framework. */
(function(){
"use strict";
const $=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
const source=(url,label)=>{const a=$("a",null,label+" ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
const heading=(root,title,sub)=>{const x=$("div","section");x.append($("h2",null,title),$("span",null,sub));root.append(x)};
const box=(root,title)=>{const p=$("div","panel");if(title)p.append($("h3",null,title));root.append(p);return p};
const initSafe=(label,fn)=>{try{const result=fn();if(result&&typeof result.catch==="function")result.catch(err=>console.error("[SLI Investment] "+label+" failed",err));return true}catch(err){console.error("[SLI Investment] "+label+" failed",err);return false}};
const links=[
 ["Ministry of Investment / BKPM — official releases","https://www.bkpm.go.id/"],
 ["BPS — investment and national accounts","https://www.bps.go.id/"],
 ["Bank Indonesia — balance of payments and direct investment","https://www.bi.go.id/"],
 ["Indonesia Investment Authority","https://www.ina.go.id/"]
];
const stages=["Announced","Permitted","Early works","Financed","Under construction","Mixed implementation","Commissioning","Operational","Suspended"];
const norm=v=>String(v||"").toLowerCase();
const projectAnchor=name=>"inv-project-"+String(name||"").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
window.initSLIInvestment=async function(){
 const root=document.getElementById("investmentRoot");if(!root)return;
 root.replaceChildren();
 const strap=$("div","eyebrow","STRATEGIC LATITUDE INTELLIGENCE · INVESTMENT EXECUTION");
 const title=$("h2",null,"From Capital Commitments to Delivered Assets");
 const intro=$("p",null,"Track policy-relevant investment through verifiable milestones. Announcements, financial commitments, realized investment statistics and operational assets are different measurements and must never be added together.");
 root.append(strap,title,intro);
 const nav=$("div","tr-jumpnav");
 [["inv-kpis","Investment evidence"],["inv-quality","Evidence health"],["inv-sector-history","Energy & mining investment"],["inv-geography","Regional & FDI"],["inv-pipeline","Project registry"],["inv-assets","Asset & concession intelligence"],["inv-industrial-actors","Forbes Top 20 & EV"],["inv-ownership","Investor & ownership"],["inv-watch","Risks & sources"],["inv-media","Media monitoring"],["inv-revenue","State revenue"],["inv-financing","Financing"],["inv-commitments","Equity commitments"],["inv-corporate-capex","Corporate capex"],["inv-filings","Company filings"],["inv-policy","Forward planning"],["inv-assessment","Overall assessment"]].forEach(([id,label])=>{const a=$("a",null,label);a.href="#"+id;nav.append(a)});root.append(nav);
 heading(root,"National Investment Evidence","BKPM · BPS · BI / distinguish statistical definitions");
 const kpis=$("div","grid tr-grid");kpis.id="inv-kpis";
 const labels=[["Realized investment","Awaiting sourced release","BKPM realized PMA + PMDN; reference period and units required"],["Foreign investment (PMA)","Awaiting sourced release","BKPM realized PMA; not identical to balance-of-payments FDI"],["Domestic investment (PMDN)","Awaiting sourced release","BKPM realized PMDN; avoid combining with project announcements"],["Source-dated project / programme records","0 published","Includes individual projects, programme milestones and portfolios; not all represent delivered assets"]];
 const values=[];
 labels.forEach(([name,value,note])=>{const c=$("div","card tr-kpi");c.style.cursor="default";c.append($("div","eyebrow",name));const v=$("h2","tr-value",value);values.push(v);c.append(v,$("p",null,note));kpis.append(c)});root.append(kpis);
 const warning=$("div","tr-note","Data integrity: national PMA/PMDN realization, announced capex, committed financing and cumulative project cost have different scopes. No unsourced aggregate is presented as live data.");root.append(warning);
 heading(root,"Source Quality & Evidence Gaps","Reviewed snapshot · source dates, ownership links and missing realization");
 const qualityRoot=$("div");qualityRoot.id="inv-quality";root.append(qualityRoot);
 qualityRoot.append($("p","tr-detail","Loading data coverage diagnostics…"));
 heading(root,"Energy & Mining Investment Realization","ESDM historical performance · annual subsector trends");
 const sectors=box(root,"Energy subsector execution, licence types and capital classification");
 sectors.id="inv-sector-history";
 const sectorRoot=$("div");sectorRoot.id="investmentSectorRoot";sectors.append(sectorRoot);
 if(typeof window.initSLIInvestmentSectorEvidence==="function")initSafe("Sector evidence",()=>window.initSLIInvestmentSectorEvidence());
 heading(root,"Where Investment Is Realized","BKPM Q2 2026 · provincial investment, not project capex");
 const geography=box(root,"Top provinces and foreign-investor origin");geography.id="inv-geography";
 const geographyContent=$("div");geography.append(geographyContent);
 heading(root,"Project Implementation Tracker","Project-level milestones · verifiable status");
 const section=box(root,"Search the investment pipeline");section.id="inv-pipeline";
 const explorerRoot=$("div");explorerRoot.id="investmentProjectExplorerRoot";section.append(explorerRoot);
 const stat=$("p","tr-detail","Loading source-dated investment dataset…");section.append(stat);
 heading(root,"Asset, Contract & Operator Intelligence","WK Migas / KKKS · IUPK · smelters · biodiesel & bioenergy · geothermal & solar · EV & batteries · data centers · MoU");
 const assets=box(root,"Who operates the asset, for how long, with which output and investment?");
 assets.id="inv-assets";
 assets.append($("p","tr-detail","Sector-specific legal instruments: PSC contract ends, coal/mineral IUPK permit expiry, data-center facility milestones, and non-binding MoUs are shown independently. Reported production and capacity always retain their reference periods."));
 const assetRoot=$("div");assetRoot.id="investmentAssetsRoot";assets.append(assetRoot);
 if(typeof window.initSLIInvestmentAssets==="function")initSafe("Asset and concession intelligence",()=>window.initSLIInvestmentAssets());
 heading(root,"Forbes Wealth Watch, EV Brands & Corporate Actions","Forbes 2025 published list · country affiliation · public transactions and research caveats");
 const actorBlock=box(root,"Top 20 Indonesia Richest · Forbes + EV Brand / Corporate Action Intelligence");
 actorBlock.id="inv-industrial-actors";
 actorBlock.append($("p","tr-detail","Forbes ranking is a dated wealth estimate, NOT the legal beneficial ownership register or the value invested in Indonesia. Public corporate events and EV country affiliation are tracked separately."));
 const actorRoot=$("div");actorRoot.id="investmentActorsRoot";actorBlock.append(actorRoot);
 if(typeof window.initSLIInvestmentActors==="function")initSafe("Industrial actors, EV brands and market events",()=>window.initSLIInvestmentActors());
 heading(root,"Ownership & Capital Structure","Investor nationality is not ultimate beneficial ownership");
 const own=box(root,"Investor / control intelligence");own.id="inv-ownership";
 own.append($("p",null,"Each verified project record can distinguish Indonesian operating partner, direct shareholder, financing provider, ultimate parent (if independently documented) and public-sector role. Danantara, BP BUMN, line ministries and private investors must not be conflated."));
 const ownershipRoot=$("div");ownershipRoot.id="investmentOwnershipRoot";own.append(ownershipRoot);
 if(typeof window.initSLIInvestmentOwnership==="function")initSafe("Ownership",()=>window.initSLIInvestmentOwnership());
 heading(root,"Investment Risk & Source Watch","Dated editorial and regulatory intelligence");
 const watch=box(root,"Official reference points");watch.id="inv-watch";
 const ul=$("ul");links.forEach(([label,url])=>{const li=$("li");li.append(source(url,label));ul.append(li)});watch.append(ul);
 watch.append($("p",null,"Operational risks: disbursement timing, land acquisition, grid or gas availability, environmental permits, foreign-exchange exposure, offtake contracts and local content requirements. A published approval is not equivalent to completed construction."));
 heading(root,"Investment Media Monitoring","Investment, biofuels, EBT, EV, smelters, AI infrastructure, corporate actions and market-exposure headlines");
 const media=box(root,"Investment-focused source discovery");media.id="inv-media";const feed=$("div");feed.id="investmentMediaRoot";media.append(feed);if(typeof window.initSLIInvestmentMedia==="function")initSafe("Media",()=>window.initSLIInvestmentMedia());
 heading(root,"State Revenue & Sector Receipts","ESDM PNBP · annual vs partial-year comparisons");
 const rev=box(root,"Indonesia sectoral non-tax revenue");rev.id="inv-revenue";
 rev.append($("p",null,"Reported PNBP only. Mineral and coal receipts are combined in this source; figures are not export value, GDP, tax take or investment flows."));
 const revenueTable=$("div","pf-table-wrap");rev.append(revenueTable);
 const finance=box(root,"Debt facilities are NOT realized project investments");finance.id="inv-financing";
 const financeContent=$("div");finance.append(financeContent);
 const commitments=box(root,"Conditional equity & project financing commitments");commitments.id="inv-commitments";
 commitments.append($("p","tr-detail","A signed conditional subscription is not verified paid-in capital. A US$200m component of an US$800m project is NOT US$1bn of additional capital."));
 const commitmentsContent=$("div","pf-table-wrap");commitments.append(commitmentsContent);
 const corporate=box(root,"Verified corporate capital expenditure (actual spend)");corporate.id="inv-corporate-capex";
 corporate.append($("p","tr-detail","Company-reported capex is separate from announcements, signed financing facilities and BKPM national capital realization. Reporting boundaries may cover projects outside Indonesia."));
 const corporateContent=$("div","pf-table-wrap");corporate.append(corporateContent);
 const filingWatch=box(root,"Company disclosure verification queue");filingWatch.id="inv-filings";
 const filingContent=$("div","pf-table-wrap");filingWatch.append(filingContent);
 const policy=box(root,"Forward policy / investment planning");policy.id="inv-policy";
 const evidenceStatus=$("p","tr-detail","Loading official investment data…");root.insertBefore(evidenceStatus,root.firstChild);
 let snapshot=null;
 try{
  const response=await fetch("data/investment-evidence.json",{cache:"no-store"});
  if(!response.ok)throw Error("Official investment dataset not available");
  const evidence=await response.json();snapshot=evidence;
  if(typeof window.renderSLIInvestmentQuality==="function")initSafe("Evidence quality",()=>window.renderSLIInvestmentQuality(qualityRoot,evidence));
  const national=evidence.national;
  if(national){
   values[0].textContent="Rp"+national.total.toLocaleString("id-ID")+" T";
   values[1].textContent="Rp"+national.pma.toLocaleString("id-ID")+" T";
   values[2].textContent="Rp"+national.pmdn.toLocaleString("id-ID")+" T";
   const proof=$("p","tr-detail","BKPM · "+national.period+" · "+national.year_on_year_pct+"% YoY · downstream realization Rp"+national.downstream.toLocaleString("id-ID")+" T · target Rp"+national.target_2026.toLocaleString("id-ID")+" T. ");
   proof.append(source(national.source,"Official BKPM release"));kpis.after(proof);
   if(national.release_status){const latest=$("p","tr-detail","Latest official investment release listed as of "+national.release_status.last_listed_as_of+": "+national.release_status.latest_official_quarter+". ");latest.append(source(national.release_status.source,"BKPM release archive"));proof.after(latest);}
  }
  if(evidence.regional){
   const reg=evidence.regional,body=$("div","inv-regional-bars"),max=Math.max(...reg.values.map(v=>v.value),1);
   reg.values.forEach(v=>{
    const line=$("div","inv-regional-row"),label=$("div","inv-stake-head"),track=$("div","inv-stake-track"),fill=$("div","inv-stake-fill");
    label.append($("span",null,v.name),$("strong",null,"Rp"+v.value.toLocaleString("id-ID")+" T"));
    fill.style.width=(100*v.value/max).toFixed(2)+"%";track.append(fill);line.append(label,track);body.append(line)
   });
   geographyContent.append($("p","tr-detail",reg.period+" · investment realization; bars scaled to largest province, not national totals."),body);
   const note=$("p","tr-detail","Source: ");note.append(source(reg.source,"BKPM provincial Q2 release"));geographyContent.append(note);
  }
  if(evidence.foreign_origins){
   const fdi=evidence.foreign_origins,tableWrap=$("div","pf-table-wrap"),t=$("table");
   t.innerHTML="<thead><tr><th>Rank · PMA origin</th><th>Reported value</th><th>Interpretation</th></tr></thead>";
   const b=$("tbody");(fdi.ranks||[]).forEach(r=>{const tr=$("tr");[r.rank+". "+r.place,r.reported_usd_billion==null?"Not separated in release":"US$"+r.reported_usd_billion+" bn","Country/jurisdiction of recording; not verified ultimate investor"].forEach(x=>tr.append($("td",null,x)));b.append(tr)});
   t.append(b);tableWrap.append(t);
   geographyContent.append($("h3",null,"Foreign investment origins · "+fdi.period),$("p","tr-detail","Top five origins represent "+fdi.top_five_share_pct+"% of PMA in this quarter. Routing via Hong Kong or Singapore does not establish ultimate beneficial ownership."),tableWrap);
   const linkBox=$("p","tr-detail","Official source: ");linkBox.append(source(fdi.source,"BKPM origin ranking"));geographyContent.append(linkBox);
  }
  if(Array.isArray(evidence.financing)){
   for(const facility of evidence.financing){
    const block=$("div","tr-note");
    const amount="US$"+facility.amount_usd_million+" million"+(facility.optional_greenshoe_usd_million?" (optional extra US$"+facility.optional_greenshoe_usd_million+" million)":"");
    block.append($("strong",null,facility.borrower+" · "+amount),$("p",null,facility.instrument+" · "+facility.reported_date),$("p",null,facility.classification),$("p",null,facility.project_relation),source(facility.source,"Company disclosure"));
    financeContent.append(block)
   }
  }
  if(Array.isArray(evidence.corporate_capex)&&evidence.corporate_capex.length){
   const t=$("table");t.innerHTML="<thead><tr><th>Reporting entity</th><th>Period</th><th>Actual company capex</th><th>Scope & allocation</th><th>Primary release</th></tr></thead>";
   const b=$("tbody");
   evidence.corporate_capex.forEach(x=>{
    const tr=$("tr"),components=(x.components||[]).map(a=>a.name+": US$"+a.usd_million+"m").join(" · ");
    [x.entity+(x.ticker?" ("+x.ticker+")":""),x.period,"US$"+x.actual_usd_million+" million",x.geographic_scope+" · "+components].forEach(value=>tr.append($("td",null,value)));
    const src=$("td");src.append(source(x.source,"Company disclosure"));tr.append(src);b.append(tr)
   });
   t.append(b);corporateContent.append(t);
  }
  if(Array.isArray(evidence.company_disclosure_watch)){
   const t=$("table");t.innerHTML="<thead><tr><th>Company</th><th>Published filing</th><th>Review status</th><th>Official source</th></tr></thead>";
   const b=$("tbody");
   evidence.company_disclosure_watch.forEach(x=>{
    const tr=$("tr");[x.entity,x.document+" · "+x.date,x.status].forEach(v=>tr.append($("td",null,v)));
    const td=$("td");td.append(source(x.source,"Filing"));tr.append(td);b.append(tr)
   });t.append(b);filingContent.append(t)
  }
  if(Array.isArray(evidence.capital_commitment_ledger)&&evidence.capital_commitment_ledger.length){
   const t=$("table");t.innerHTML="<thead><tr><th>Investor / project</th><th>Conditional capital</th><th>Total project value</th><th>Closed / paid?</th><th>Verified source</th></tr></thead>";
   const b=$("tbody");
   evidence.capital_commitment_ledger.forEach(x=>{
    const tr=$("tr");
    [x.entity+" · "+x.project,"US$"+x.total_usd_million+"m","US$"+x.total_project_usd_million+"m",x.paid_in_capital_verified===null?"Not independently verified":String(x.paid_in_capital_verified)].forEach(v=>tr.append($("td",null,v)));
    const td=$("td");td.append(source(x.source,"Signed CSSA announcement"));tr.append(td);b.append(tr)
   });t.append(b);commitmentsContent.append(t);
  }
  if(Array.isArray(evidence.programme_overlap_rules)&&evidence.programme_overlap_rules.length){
   const discl=$("details");const summ=$("summary",null,"Project overlap & double-counting safeguards");discl.append(summ);
   const ul=$("ul");for(const item of evidence.programme_overlap_rules)ul.append($("li",null,item.explanation));discl.append(ul);section.append(discl);
  }
  if(Array.isArray(evidence.implementation_watch)&&evidence.implementation_watch.length){
   const dated=$("div","tr-news");
   evidence.implementation_watch.slice().sort((a,b)=>b.event_date.localeCompare(a.event_date)).forEach(event=>{
    const card=$("article","tr-news-card");
    card.append($("div","eyebrow",event.event_date+" · "+event.sector),$("h3",null,event.title));
    card.append($("p","tr-detail","Observed: "+event.observed),$("p","tr-detail","Potential implications: "+event.possible_impact),$("p","tr-detail","Follow-up: "+event.follow_up));
    card.append(source(event.source,"Original institutional release"));dated.append(card);
   });
   watch.append($("h3",null,"Dated investment implementation & policy watch"),dated);
  }
  const projectRows=Array.isArray(evidence.projects)?evidence.projects:[];
  values[3].textContent=projectRows.length+" sourced";
  if(typeof window.initSLIInvestmentExplorer==="function"){
   const loaded=initSafe("Project explorer",()=>window.initSLIInvestmentExplorer(explorerRoot,projectRows,evidence.as_of));
   stat.textContent=loaded?"Project explorer loaded · announced values, realization and corporate ownership remain distinct.":"Project explorer failed to initialize; underlying source JSON remains available.";
  }else stat.textContent="Project viewer is unavailable; the source registry is retained in the data file.";
  const issue=$("div","tr-note");issue.append($("strong",null,"Reconciliation rule: "),document.createTextNode("Multi-year programs, subprojects, corporate debt facilities, FIDs, and BKPM realization cannot be summed as independent capital investment."));
  section.append(issue);
  const rt=$("table");rt.innerHTML="<thead><tr><th>Sector / scope</th><th>PNBP (Rp trillion)</th><th>Period</th><th>Source</th></tr></thead>";
  const rb=$("tbody");
  (evidence.revenue||[]).forEach(x=>{const tr=$("tr");[x.sector,x.value.toLocaleString("id-ID"),x.period].forEach(v=>tr.append($("td",null,v)));const td=$("td");td.append(source(x.source,"ESDM"));tr.append(td);rb.append(tr)});rt.append(rb);revenueTable.append(rt);
  rev.append($("p","tr-detail","Minerals vs coal and AI/data center-specific fiscal receipts are not separately verified by these sources; no artificial split is applied."));
  const scope=$("details");scope.append($("summary",null,"Fiscal coverage by sector · expand definition matrix"));
  const scopeTable=$("div","pf-table-wrap"),matrix=$("table");matrix.innerHTML="<thead><tr><th>Sector</th><th>Fiscal series available</th><th>Separate attribution?</th></tr></thead>";
  const mb=$("tbody");
  const sectorScope=[
   ["Upstream oil","PNBP from petroleum natural resources","Reported separately in the current 2025 ESDM series"],
   ["Natural gas","PNBP from natural gas natural resources","Reported separately in the current 2025 ESDM series"],
   ["Coal","Combined mineral + coal PNBP only","No separate coal figure from this selected report; do not allocate an arbitrary share"],
   ["Non-coal mining / critical minerals","Combined mineral + coal PNBP only","No standalone critical-minerals fiscal series in this dataset"],
   ["Renewable power and geothermal","Fiscal and non-tax categories vary by regulator and license","Not isolated in this current investment dataset"],
   ["AI/data centers and technology","Corporate and indirect taxes may apply; no corresponding unified sector line","No official separate tax/PNBP total verified here"]
  ];
  sectorScope.forEach(row=>{const tr=$("tr");row.forEach(value=>tr.append($("td",null,value)));mb.append(tr)});
  matrix.append(mb);scopeTable.append(matrix);scope.append(scopeTable);rev.append(scope);
  rev.append($("p","tr-detail","Accounting rule: government revenue (tax or PNBP), corporate revenue, export values, investment disbursements and project capital budgets are different statistics and cannot be interchanged."));
  (evidence.policy||[]).forEach(x=>{const p=$("p",null,x.title+": "+x.amount+" · "+x.status+" · ");p.append(source(x.source,"BKPM"));policy.append(p)});
  evidenceStatus.textContent="Published data snapshot · "+evidence.as_of+" · Investment realization "+national.period+"; receipts retain their individual reference periods.";
 }catch(err){evidenceStatus.textContent="Official investment evidence dataset unavailable; headline feed and editorial framework remain accessible.";qualityRoot.textContent="Data coverage diagnostics unavailable.";console.error("[SLI] investment evidence load",err);}
 heading(root,"Overall Strategic Assessment","Evidence-led; no speculative scoring");
 const assess=box(root,"Indonesia Investment Execution Outlook");assess.id="inv-assessment";
 const saved=snapshot||{};
 const projects=Array.isArray(saved.projects)?saved.projects:[];
 const rec=saved.national||{};
 const linked=projects.filter(p=>p.ownership_ref).length;
 const operating=projects.filter(p=>p.stage==="Operational").length;
 const mixed=projects.filter(p=>p.stage==="Mixed implementation").length;
 const sectorNames=[...new Set(projects.map(p=>p.sector).filter(Boolean))];
 const realized=projects.filter(p=>p.capex_realized!==null&&p.capex_realized!==undefined&&p.capex_realized_source).length;
 const points=[
 "Macroeconomic evidence: "+(Number.isFinite(rec.total)?"BKPM recorded Rp"+rec.total.toLocaleString("id-ID")+" trillion in "+rec.period:"No official macro investment total available")+"; investment realization is not the sum of company announcements.",
 "Execution evidence: "+projects.length+" source-dated project/programme records span "+sectorNames.join(", ")+"; "+operating+" are tagged operational and "+mixed+" mix distinct project stages. This does not imply all capital has been spent.",
 "Capital verification: project-level realized CAPEX documentation covers "+realized+"/"+projects.length+" records. Unknown actual disbursement is not zero; neither signed debt nor planned budgets can fill these gaps.",
 "Corporate transparency: "+linked+" of "+projects.length+" project entries link to an entity or PSC profile. Direct equity, operating rights, contractual PSC interests and a natural-person beneficial owner must remain separate.",
 "Territorial concentration: report BKPM province-level investment within its reference quarter, not as a cumulative annual total; review power, access roads, ports, permitting and local value-chain integration.",
 "Policy and revenue: compare incentives, approvals and fiscal PNBP within their own time periods; combined minerba receipts cannot be subdivided into coal and critical minerals without a defensible official dataset.",
 "Monitoring priorities: verify project SPV share registers, financial close, audited realized capital, construction progress and commissioning milestones; use dated releases and do not silently infer progress from elapsed time."
 ];
 const ol=$("ol");points.forEach(p=>ol.append($("li",null,p)));assess.append(ol);
 assess.append($("p","tr-detail","Dataset-derived editorial synthesis using the stored research snapshot "+(saved.as_of||"unknown")+". Recomputed on page load from the current JSON; not a live market prediction or automatic fact-check of external sources."));

};
})();