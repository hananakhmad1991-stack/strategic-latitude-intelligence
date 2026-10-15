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
const stages=["Announced","Permitted","Financed","Under construction","Commissioning","Operational","Suspended"];
const norm=v=>String(v||"").toLowerCase();
window.initSLIInvestment=async function(){
 const root=document.getElementById("investmentRoot");if(!root)return;
 root.replaceChildren();
 const strap=$("div","eyebrow","STRATEGIC LATITUDE INTELLIGENCE · INVESTMENT EXECUTION");
 const title=$("h2",null,"From Capital Commitments to Delivered Assets");
 const intro=$("p",null,"Track policy-relevant investment through verifiable milestones. Announcements, financial commitments, realized investment statistics and operational assets are different measurements and must never be added together.");
 root.append(strap,title,intro);
 const nav=$("div","tr-jumpnav");
 [["inv-kpis","Investment evidence"],["inv-pipeline","Project registry"],["inv-ownership","Investor & ownership"],["inv-watch","Risks & sources"],["inv-assessment","Overall assessment"]].forEach(([id,label])=>{const a=$("a",null,label);a.href="#"+id;nav.append(a)});root.append(nav);
 heading(root,"National Investment Evidence","BKPM · BPS · BI / distinguish statistical definitions");
 const kpis=$("div","grid tr-grid");kpis.id="inv-kpis";
 const labels=[["Realized investment","Awaiting sourced release","BKPM realized PMA + PMDN; reference period and units required"],["Foreign investment (PMA)","Awaiting sourced release","BKPM realized PMA; not identical to balance-of-payments FDI"],["Domestic investment (PMDN)","Awaiting sourced release","BKPM realized PMDN; avoid combining with project announcements"],["Verified projects","0 published","Only source-dated project records appear in the registry"]];
 const values=[];
 labels.forEach(([name,value,note])=>{const c=$("div","card tr-kpi");c.style.cursor="default";c.append($("div","eyebrow",name));const v=$("h2","tr-value",value);values.push(v);c.append(v,$("p",null,note));kpis.append(c)});root.append(kpis);
 const warning=$("div","tr-note","Data integrity: national PMA/PMDN realization, announced capex, committed financing and cumulative project cost have different scopes. No unsourced aggregate is presented as live data.");root.append(warning);
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
 const axis=$("div","grid tr-grid");
 [["Who finances?","Equity · debt · syndicated loans · incentives"],["Who operates?","Project SPV · offtaker · engineering contractor"],["What is delivered?","Permits · construction · energization · production"],["What remains exposed?","Land · grid · environmental clearance · FX"]].forEach(([a,b])=>{const c=$("div","card tr-kpi");c.style.cursor="default";c.append($("h3",null,a),$("p",null,b));axis.append(c)});root.append(axis);
 heading(root,"Investment Risk & Source Watch","Dated editorial and regulatory intelligence");
 const watch=box(root,"Official reference points");watch.id="inv-watch";
 const ul=$("ul");links.forEach(([label,url])=>{const li=$("li");li.append(source(url,label));ul.append(li)});watch.append(ul);
 watch.append($("p",null,"Operational risks: disbursement timing, land acquisition, grid or gas availability, environmental permits, foreign-exchange exposure, offtake contracts and local content requirements. A published approval is not equivalent to completed construction."));
 heading(root,"Overall Strategic Assessment","Evidence-led; no speculative scoring");
 const assess=box(root,"Indonesia Investment Execution Outlook");assess.id="inv-assessment";
 const points=[
 "Distinguish announced project capex from official realized PMA/PMDN flows and operational capacity.",
 "Watch project conversion through documented financial close, construction and commissioning.",
 "Map shareholder control separately from permitting power and sectoral regulation.",
 "Compare regional concentration with supporting power, port, transport and skilled-labor infrastructure.",
 "Track exposure to global interest rates, demand, trade rules and changes in downstream policy.",
 "Give each project a dated source, evidence status, last review and explicit unresolved questions."
 ];
 const ol=$("ol");points.forEach(p=>ol.append($("li",null,p)));assess.append(ol);
 assess.append($("p","tr-detail","Editorial framework (not an automated market forecast). This assessment will become quantitative as verified releases and project records are published."));
 try{
 const response=await fetch("data/investment-projects.json",{cache:"no-store"});if(!response.ok)throw Error("no registry");
 const data=await response.json();
 records=Array.isArray(data.projects)?data.projects.filter(x=>x.name&&x.investor&&x.region&&x.sector&&stages.includes(x.stage)&&/^https:\/\//.test(x.source_url||"")&&/^\d{4}-\d{2}-\d{2}$/.test(x.evidence_date||"")):[];
 values[3].textContent=records.length+" verified";
 if(data.as_of)stat.title="Last registry review: "+data.as_of;
 }catch(err){console.info("[SLI] Investment registry is awaiting publication.");}
 render();
};
})();