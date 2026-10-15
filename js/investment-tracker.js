/* SLI Investment Execution Intelligence — source-first registry and analytical framework. */
(function(){
"use strict";
const $=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
const source=(url,label)=>{const a=$("a",null,label+" ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
const heading=(root,title,sub)=>{const x=$("div","section");x.append($("h2",null,title),$("span",null,sub));root.append(x)};
const box=(root,title)=>{const p=$("div","panel");if(title)p.append($("h3",null,title));root.append(p);return p};
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
 [["inv-kpis","Investment evidence"],["inv-geography","Regional & FDI"],["inv-pipeline","Project registry"],["inv-ownership","Investor & ownership"],["inv-watch","Risks & sources"],["inv-media","Media monitoring"],["inv-revenue","State revenue"],["inv-financing","Financing"],["inv-commitments","Equity commitments"],["inv-corporate-capex","Corporate capex"],["inv-filings","Company filings"],["inv-policy","Forward planning"],["inv-assessment","Overall assessment"]].forEach(([id,label])=>{const a=$("a",null,label);a.href="#"+id;nav.append(a)});root.append(nav);
 heading(root,"National Investment Evidence","BKPM · BPS · BI / distinguish statistical definitions");
 const kpis=$("div","grid tr-grid");kpis.id="inv-kpis";
 const labels=[["Realized investment","Awaiting sourced release","BKPM realized PMA + PMDN; reference period and units required"],["Foreign investment (PMA)","Awaiting sourced release","BKPM realized PMA; not identical to balance-of-payments FDI"],["Domestic investment (PMDN)","Awaiting sourced release","BKPM realized PMDN; avoid combining with project announcements"],["Source-dated project / programme records","0 published","Includes individual projects, programme milestones and portfolios; not all represent delivered assets"]];
 const values=[];
 labels.forEach(([name,value,note])=>{const c=$("div","card tr-kpi");c.style.cursor="default";c.append($("div","eyebrow",name));const v=$("h2","tr-value",value);values.push(v);c.append(v,$("p",null,note));kpis.append(c)});root.append(kpis);
 const warning=$("div","tr-note","Data integrity: national PMA/PMDN realization, announced capex, committed financing and cumulative project cost have different scopes. No unsourced aggregate is presented as live data.");root.append(warning);
 heading(root,"Where Investment Is Realized","BKPM Q2 2026 · provincial investment, not project capex");
 const geography=box(root,"Top provinces and foreign-investor origin");geography.id="inv-geography";
 const geographyContent=$("div");geography.append(geographyContent);
 heading(root,"Project Implementation Tracker","Project-level milestones · verifiable status");
 const section=box(root,"Search the investment pipeline");section.id="inv-pipeline";
 const controls=$("div","tr-controls"),search=$("input","tr-select");search.placeholder="Search project, region, investor or sector…";search.type="search";search.setAttribute("aria-label","Search investment projects");
 const select=$("select","tr-select");[["all","All stages"],...stages.map(s=>[s,s])].forEach(([val,name])=>{const o=$("option",null,name);o.value=val;select.append(o)});
 const sector=$("select","tr-select");[["all","All sectors"],["Energy","Energy"],["Critical minerals","Critical minerals"],["AI infrastructure","AI infrastructure"],["Other","Other"]].forEach(([v,n])=>{const o=$("option",null,n);o.value=v;sector.append(o)});
 [[search,"Project search"],[select,"Implementation stage"],[sector,"Sector"]].forEach(([el,txt])=>{const l=$("label",null,txt);l.append(el);controls.append(l)});section.append(controls);
 const stat=$("p","tr-detail","Loading source-dated project registry…"),tableWrap=$("div","pf-table-wrap");section.append(stat,tableWrap);
 const tbl=$("table");tbl.innerHTML="<thead><tr><th>Project / investor</th><th>Sector / region</th><th>Milestone</th><th>Evidence date</th><th>Primary source</th></tr></thead>";const tbody=$("tbody");tbl.append(tbody);tableWrap.append(tbl);
 let records=[];
 function render(){
  tbody.replaceChildren();const q=norm(search.value);const rows=records.filter(x=>(select.value==="all"||x.stage===select.value)&&(sector.value==="all"||x.sector===sector.value)&&norm([x.name,x.investor,x.region,x.sector].join(" ")).includes(q));
  stat.textContent=records.length?rows.length+" of "+records.length+" sourced records shown · milestone is not proof of project completion": "No verified project-level records published yet. The framework is ready for curated evidence; no hypothetical projects are shown as facts.";
  for(const x of rows){const tr=$("tr");[x.name+" · "+x.investor,x.sector+" · "+x.region,x.stage,x.evidence_date].forEach(t=>tr.append($("td",null,t)));const cell=$("td");cell.append(source(x.source_url,"Evidence"));tr.append(cell);tbody.append(tr)}
 }
 [search,select,sector].forEach(el=>el.addEventListener(el===search?"input":"change",render));
 heading(root,"Ownership & Capital Structure","Investor nationality is not ultimate beneficial ownership");
 const own=box(root,"Investor / control intelligence");own.id="inv-ownership";
 own.append($("p",null,"Each verified project record can distinguish Indonesian operating partner, direct shareholder, financing provider, ultimate parent (if independently documented) and public-sector role. Danantara, BP BUMN, line ministries and private investors must not be conflated."));
 const ownershipRoot=$("div");ownershipRoot.id="investmentOwnershipRoot";own.append(ownershipRoot);
 if(typeof window.initSLIInvestmentOwnership==="function")window.initSLIInvestmentOwnership();
 const axis=$("div","grid tr-grid");
 [["Who finances?","Equity · debt · syndicated loans · incentives"],["Who operates?","Project SPV · offtaker · engineering contractor"],["What is delivered?","Permits · construction · energization · production"],["What remains exposed?","Land · grid · environmental clearance · FX"]].forEach(([a,b])=>{const c=$("div","card tr-kpi");c.style.cursor="default";c.append($("h3",null,a),$("p",null,b));axis.append(c)});root.append(axis);
 heading(root,"Investment Risk & Source Watch","Dated editorial and regulatory intelligence");
 const watch=box(root,"Official reference points");watch.id="inv-watch";
 const ul=$("ul");links.forEach(([label,url])=>{const li=$("li");li.append(source(url,label));ul.append(li)});watch.append(ul);
 watch.append($("p",null,"Operational risks: disbursement timing, land acquisition, grid or gas availability, environmental permits, foreign-exchange exposure, offtake contracts and local content requirements. A published approval is not equivalent to completed construction."));
 heading(root,"Investment Media Monitoring","Domestic, FDI, project implementation and investment policy headlines");
 const media=box(root,"Investment-focused source discovery");media.id="inv-media";const feed=$("div");feed.id="investmentMediaRoot";media.append(feed);if(typeof window.initSLIInvestmentMedia==="function")window.initSLIInvestmentMedia();
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
 try{
  const response=await fetch("data/investment-evidence.json",{cache:"no-store"});
  if(!response.ok)throw Error("Official investment dataset not available");
  const evidence=await response.json();
  const national=evidence.national;
  if(national){
   values[0].textContent="Rp"+national.total.toLocaleString("id-ID")+" T";
   values[1].textContent="Rp"+national.pma.toLocaleString("id-ID")+" T";
   values[2].textContent="Rp"+national.pmdn.toLocaleString("id-ID")+" T";
   const proof=$("p","tr-detail","BKPM · "+national.period+" · "+national.year_on_year_pct+"% YoY · downstream realization Rp"+national.downstream.toLocaleString("id-ID")+" T · target Rp"+national.target_2026.toLocaleString("id-ID")+" T. ");
   proof.append(source(national.source,"Official BKPM release"));kpis.after(proof);
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
  const existing=new Set(records.map(x=>x.name));
  for(const record of projectRows){if(!existing.has(record.name))records.push(record);}
  values[3].textContent=records.length+" sourced";
  const detail=$("div","pf-table-wrap");
  const t=$("table");t.innerHTML="<thead><tr><th>Company / project</th><th>Sector · status</th><th>Announced project value</th><th>Verified spent capital</th><th>Next delivery milestone</th><th>Source / ownership</th></tr></thead>";
  const body=$("tbody");
  const dateLabel=(x)=>x.evidence_date||"Undated";
  projectRows.forEach(x=>{
   const tr=$("tr");tr.id=projectAnchor(x.name);
   const named=$("td");named.append($("strong",null,x.name),$("p","tr-detail",x.investor));tr.append(named);
   tr.append($("td",null,x.sector+" · "+x.stage+" · evidence "+dateLabel(x)));
   const amount=$("td");amount.append($("strong",null,x.reported_amount===null?"Not disclosed":x.currency+" "+Number(x.reported_amount).toLocaleString("en-US")));amount.append($("p","tr-detail",x.amount_basis));tr.append(amount);
   const actual=$("td");actual.append($("strong",null,x.capex_realized===null||x.capex_realized===undefined?"Not independently verified":String(x.capex_realized)));
   actual.append($("p","tr-detail","Not zero. Project cost / FID / debt does not equal actual capital spent."));tr.append(actual);
   const milestone=$("td");milestone.append($("p",null,x.status_note),$("p","tr-detail","Next: "+x.next_step));tr.append(milestone);
   const src=$("td");src.append(source(x.source_url,"Project disclosure"));
   if(x.initial_commitment_source){src.append($("p","tr-detail","Initial commitment: "),source(x.initial_commitment_source,"Original amount source"));}
   if(x.ownership_ref){
    const ref=$("a",null,"Ownership dossier ↗");ref.href="#inv-owner-"+x.ownership_ref;ref.addEventListener("click",evt=>{
     const card=document.getElementById("inv-owner-"+x.ownership_ref);
     if(card){evt.preventDefault();card.open=true;card.scrollIntoView({behavior:"smooth",block:"start"});}
    });src.append($("p","tr-detail","Ownership: "),ref);
   }else src.append($("p","tr-detail","Ownership mapping pending independent verification"));
   tr.append(src);body.append(tr);
  });
  t.append(body);detail.append(t);
  section.append($("h3",null,"Investment execution & company evidence ledger"),$("p","tr-detail","Amounts are attributed to public sources. An unreported realized-capex field is unknown, not zero. Facility operation confirms physical delivery, not the total value disbursed."),detail);
  const issue=$("div","tr-note");issue.append($("strong",null,"Reconciliation rule: "),document.createTextNode("Do not add commitments from a multi-year program, its subprojects, corporate debt, an FID and national BKPM realization as though they were independent investment flows."));
  section.append(issue);
  const rt=$("table");rt.innerHTML="<thead><tr><th>Sector / scope</th><th>PNBP (Rp trillion)</th><th>Period</th><th>Source</th></tr></thead>";
  const rb=$("tbody");
  (evidence.revenue||[]).forEach(x=>{const tr=$("tr");[x.sector,x.value.toLocaleString("id-ID"),x.period].forEach(v=>tr.append($("td",null,v)));const td=$("td");td.append(source(x.source,"ESDM"));tr.append(td);rb.append(tr)});rt.append(rb);revenueTable.append(rt);
  rev.append($("p","tr-detail","Minerals vs coal and AI/data center-specific fiscal receipts are not separately verified by these sources; no artificial split is applied."));
  (evidence.policy||[]).forEach(x=>{const p=$("p",null,x.title+": "+x.amount+" · "+x.status+" · ");p.append(source(x.source,"BKPM"));policy.append(p)});
  evidenceStatus.textContent="Published data snapshot · "+evidence.as_of+" · Investment realization "+national.period+"; receipts retain their individual reference periods.";
 }catch(err){evidenceStatus.textContent="Official investment evidence dataset unavailable; headline feed and editorial framework remain accessible.";console.error("[SLI] investment evidence load",err);}
 render();
 heading(root,"Overall Strategic Assessment","Evidence-led; no speculative scoring");
 const assess=box(root,"Indonesia Investment Execution Outlook");assess.id="inv-assessment";
 const points=[
 "Capital conversion: BKPM reported Rp1,010.6 trillion realized in H1 2026 (49.5% of the full-year target); do not confuse this with announced multi-year project budgets.",
 "Investor origin: the five leading booking jurisdictions contributed 79.6% of Q2 2026 PMA; the origin of the recorded investment is not proof of an ultimate beneficial owner.",
 "Spatial concentration: Jakarta and Java remain key hubs, while nickel-intensive eastern provinces rank among Q2 leaders. Local power, transport, ports and water remain critical execution constraints.",
 "Critical minerals: distinguish mined ore sales from completed HPAL commissioning. Vale's Morowali and Pomalaa milestones cannot be treated as all-project commercial operation.",
 "Corporate control: Freeport economic ownership differs from operating rights; Vale explicitly describes joint control. Track shareholder agreements rather than extrapolating from percentage stakes.",
 "Revenue vs investment: PNBP SDA oil, gas and minerba is government non-tax revenue, not gross exports, project capital expenditure or a proxy for corporate taxes.",
 "Delivery discipline: compare financial close, capital drawdown, environmental approval, construction evidence and actual utilization separately; maintain company-level BO gaps explicitly."
 ];
 const ol=$("ol");points.forEach(p=>ol.append($("li",null,p)));assess.append(ol);
 assess.append($("p","tr-detail","Editorial framework (not an automated market forecast). This assessment will become quantitative as verified releases and project records are published."));
 try{
 const response=await fetch("data/investment-projects.json",{cache:"no-store"});if(!response.ok)throw Error("no registry");
 const data=await response.json();
 const legacy=Array.isArray(data.projects)?data.projects.filter(x=>x.name&&x.investor&&x.region&&x.sector&&stages.includes(x.stage)&&/^https:\/\//.test(x.source_url||"")&&/^\d{4}-\d{2}-\d{2}$/.test(x.evidence_date||"")):[]; const known=new Set(records.map(x=>x.name));legacy.forEach(x=>{if(!known.has(x.name))records.push(x)});
 values[3].textContent=records.length+" verified";
 if(data.as_of)stat.title="Last registry review: "+data.as_of;
 }catch(err){console.info("[SLI] Investment registry is awaiting publication.");}
 render();
};
})();