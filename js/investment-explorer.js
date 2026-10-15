/* SLI Investment Project Explorer — single source-linked table + responsive dossier
   No financial amounts are aggregated across currency, time or project hierarchy. */
(function(){"use strict";
const el=(tag,cls,value)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined&&value!==null)x.textContent=String(value);return x};
const validUrl=url=>typeof url==="string"&&/^https:\/\//i.test(url);
const source=(url,label)=>{if(!validUrl(url))return el("span","inv-muted","Source not provided");
 const a=el("a",null,label+" ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
const anchor=name=>"inv-project-"+String(name||"").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
const unique=arr=>[...new Set(arr.filter(Boolean))].sort();
function cell(row,content,cl){const td=el("td",cl);if(typeof content==="string")td.textContent=content;else if(content)td.append(content);row.append(td);return td}
function sumBadge(parent,label,value){const b=el("div","inv-explorer-stat");b.append(el("span",null,label),el("strong",null,value));parent.append(b)}
function csvCell(str){const s=String(str??"");return '"'+s.replace(/^[=+@\-\t\r]/,"'").replace(/"/g,'""')+'"'}
function download(rows){
 const header=["Project","Sector","Region","Status","Evidence date","Announced amount","Amount basis","Actual disbursed project capex","Investor/implementer","Ownership reference","Source","Next milestone"];
 const matrix=[header,...rows.map(x=>[x.name,x.sector,x.region,x.stage,x.evidence_date,x.reported_amount==null?"Not independently disclosed":x.currency+" "+x.reported_amount,x.amount_basis,x.capex_realized==null?"Not independently verified":String(x.capex_realized),x.investor,x.ownership_ref||"Not mapped",x.source_url,x.next_step])];
 const data="\ufeff"+matrix.map(row=>row.map(csvCell).join(",")).join("\r\n");
 const blob=new Blob([data],{type:"text/csv;charset=utf-8"}),href=URL.createObjectURL(blob);
 const a=el("a");a.href=href;a.download="sli-investment-projects-filtered.csv";a.style.display="none";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),2000);
}
window.initSLIInvestmentExplorer=function(root,data,asOf){
 if(!root)return;root.replaceChildren();
 const records=Array.isArray(data)?data.filter(x=>x&&x.name&&x.stage&&validUrl(x.source_url)):[],
  stages=unique(records.map(x=>x.stage)),sectors=unique(records.map(x=>x.sector));
 const description=el("p","tr-detail","Independent, source-dated investment and programme records · research snapshot "+(asOf||"date unknown")+". An announced budget is not audited expenditure. Portfolios and subprojects may overlap.");root.append(description);
 const summary=el("div","inv-explorer-stats");
 sumBadge(summary,"Sourced records",records.length);
 sumBadge(summary,"Operating assets",records.filter(x=>x.stage==="Operational").length);
 sumBadge(summary,"Mixed-stage programmes",records.filter(x=>x.stage==="Mixed implementation").length);
 sumBadge(summary,"Linked ownership files",records.filter(x=>x.ownership_ref).length);
 root.append(summary);
 const controls=el("div","inv-explorer-controls"),query=el("input","tr-select"),sector=el("select","tr-select"),stage=el("select","tr-select"),order=el("select","tr-select");
 query.type="search";query.placeholder="Search project, investor, province…";query.setAttribute("aria-label","Search project records");
 function options(select,items){items.forEach(([v,label])=>{const op=el("option",null,label);op.value=v;select.append(op)})}
 options(sector,[["all","All sectors"],...sectors.map(x=>[x,x])]);
 options(stage,[["all","All implementation stages"],...stages.map(x=>[x,x])]);
 options(order,[["newest","Latest evidence first"],["oldest","Oldest evidence first"],["name","Project name A–Z"]]);
 for(const [title,element] of [["Search records",query],["Sector",sector],["Implementation",stage],["Sort",order]]){const label=el("label",null,title);label.append(element);controls.append(label)}
 root.append(controls);
 const bar=el("div","inv-explorer-bar"),feedback=el("p","tr-detail"),exportButton=el("button","inv-export","Export filtered CSV");
 exportButton.type="button";bar.append(feedback,exportButton);root.append(bar);
 const layout=el("div","pf-table-wrap inv-explorer-table"),table=el("table");const thead=el("thead"),hr=el("tr");
 ["Project / investor","Sector · location","Evidence milestone","Announced value","Verified cash spent","Dossier"].forEach(t=>hr.append(el("th",null,t)));
 thead.append(hr);table.append(thead);const tbody=el("tbody");table.append(tbody);layout.append(table);root.append(layout);
 const detail=el("section","inv-explorer-detail");detail.setAttribute("aria-live","polite");root.append(detail);
 const note=el("p","tr-detail","Disclaimer: facility operating status is not proof of original project budget fully spent. Values in different currencies or reporting perimeters are never summed.");root.append(note);
 let filtered=[],selected="";
 const amount=x=>x.reported_amount==null?"Undisclosed":x.currency+" "+Number(x.reported_amount).toLocaleString("en-US");
 function dossier(x){
   detail.replaceChildren();
   if(!x){detail.append(el("p","tr-detail","Select View dossier in a row to inspect project milestones, ownership, capital basis and source evidence."));return}
   detail.append(el("div","eyebrow","PROJECT DOSSIER · "+(x.sector||"")+" · "+(x.evidence_date||"Date unavailable")),el("h3",null,x.name));
   const facts=el("div","inv-dossier-grid");
   [["Project / announced amount",amount(x)],["Amount definition",x.amount_basis||"Not available"],["Actual project capital disbursement",x.capex_realized==null?"Not independently verified":String(x.capex_realized)],["Delivery stage",x.stage||"Unverified"],["Location",x.region||"Not disclosed"],["Investor / operator",x.investor||"Not verified"]].forEach(([label,val])=>{const b=el("div","inv-dossier-fact");b.append(el("span",null,label),el("strong",null,val));facts.append(b)});
   detail.append(facts);
   for(const [name,value] of [["Evidence / stage qualification",x.status_note],["Next verification milestone",x.next_step],["Reporting and financial caveat",x.verification_class||x.amount_type],["Programme overlap group",x.program_group||"Not tagged"]]){if(value){const p=el("p","inv-dossier-note");p.append(el("strong",null,name+": "),document.createTextNode(value));detail.append(p)}}
   const refs=el("div","inv-dossier-links");
   refs.append(source(x.source_url,"Primary project evidence"));
   if(x.initial_commitment_source)refs.append(source(x.initial_commitment_source,"Original capital announcement"));
   if(x.capex_realized_source)refs.append(source(x.capex_realized_source,"Realized CAPEX document"));
   if(x.ownership_ref){
     const a=el("a",null,"Open shareholder / PSC dossier ↗");a.href="#inv-owner-"+x.ownership_ref;
     a.addEventListener("click",event=>{const box=document.getElementById("inv-owner-"+x.ownership_ref);if(box){event.preventDefault();box.open=true;box.scrollIntoView({behavior:"smooth",block:"start"});}});
     refs.append(a)
   }else refs.append(el("span","inv-muted","No verified company-level ownership dossier linked yet"));
   detail.append(refs);
 }
 function draw(){
   const q=query.value.trim().toLowerCase();
   filtered=records.filter(x=>(sector.value==="all"||sector.value===x.sector)&&(stage.value==="all"||stage.value===x.stage)
    &&[x.name,x.investor,x.region,x.sector,x.stage].some(y=>String(y||"").toLowerCase().includes(q)));
   filtered.sort((a,b)=>order.value==="name"?a.name.localeCompare(b.name):order.value==="oldest"?String(a.evidence_date||"").localeCompare(String(b.evidence_date||"")):String(b.evidence_date||"").localeCompare(String(a.evidence_date||"")));
   feedback.textContent=filtered.length+" of "+records.length+" records · No additive total of announced project amounts";
   exportButton.disabled=!filtered.length;
   tbody.replaceChildren();
   for(const x of filtered){
    const tr=el("tr");tr.id=anchor(x.name);if(selected===x.name)tr.classList.add("inv-row-selected");
    const name=el("div","inv-project-name",x.name);name.append(el("small",null,x.investor||"Investor not reported"));
    cell(tr,name);cell(tr,(x.sector||"")+" · "+(x.region||"Not disclosed"));
    const progress=el("div");progress.append(el("strong",null,x.stage),el("small",null,"Evidence "+(x.evidence_date||"Undated")));cell(tr,progress);
    const v=el("div");v.append(el("strong",null,amount(x)),el("small",null,x.reported_amount==null?"No amount verified":(x.amount_type||"Not actual disbursement")));cell(tr,v);
    cell(tr,x.capex_realized==null?"Not verified":String(x.capex_realized),"inv-spend-cell");
    const btn=el("button","inv-view","View dossier");btn.type="button";btn.setAttribute("aria-label","View evidence dossier for "+x.name);
    btn.addEventListener("click",()=>{selected=x.name;dossier(x);tbody.querySelectorAll("tr").forEach(row=>row.classList.toggle("inv-row-selected",row.id===anchor(x.name)));detail.scrollIntoView({behavior:"smooth",block:"start"})});
    cell(tr,btn);tbody.append(tr);
   }
   if(!filtered.length){const tr=el("tr"),td=el("td",null,"No projects match these filters. Try another sector or implementation stage.");td.colSpan=6;tr.append(td);tbody.append(tr)}
   const selectedRecord=filtered.find(x=>x.name===selected);dossier(selectedRecord||null);
 }
 query.addEventListener("input",draw);sector.addEventListener("change",draw);stage.addEventListener("change",draw);order.addEventListener("change",draw);
 exportButton.addEventListener("click",()=>download(filtered));
 draw();
};
})();