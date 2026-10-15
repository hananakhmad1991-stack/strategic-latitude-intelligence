/* SLI Investment Ownership Intelligence: direct shares != BO; no guesswork. */
(function(){
"use strict";
const E=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined&&text!==null)n.textContent=String(text);return n};
const link=(url,title)=>{const a=E("a",null,title+" ↗");if(/^https:\/\//.test(url||"")){a.href=url;a.target="_blank";a.rel="noopener noreferrer"}else a.removeAttribute("href");return a};
window.initSLIInvestmentOwnership=async function(){
 const root=document.getElementById("investmentOwnershipRoot");if(!root)return;
 root.replaceChildren(E("p","tr-detail","Loading source-dated shareholder registry…"));
 let data;
 try{const res=await fetch("data/investment-ownership.json",{cache:"no-store"});if(!res.ok)throw Error("Missing ownership file");data=await res.json();if(!Array.isArray(data.entities))throw Error("Invalid entity schema");}
 catch(err){root.replaceChildren(E("p","tr-status","Ownership registry temporarily unavailable. No unidentified ultimate owner is assumed."));console.error("[SLI] investment ownership",err);return}
 root.replaceChildren();
 const callout=E("div","tr-note");
 callout.append(E("strong",null,"Evidence hierarchy: "),document.createTextNode("verified direct shareholders → separately verified corporate parent chain → documented operating/joint control → individually verified beneficial owner. These levels are NOT interchangeable."));
 root.append(callout);
 const meta=E("p","tr-detail","Research snapshot "+data.as_of+" · "+data.entities.length+" covered entities · corporate share data are dated to their individual primary filings, not automatically current.");
 root.append(meta);
 const controls=E("div","tr-controls"),query=E("input","tr-select"),category=E("select","tr-select");
 query.type="search";query.placeholder="Search companies, shareholders, project partners…";query.setAttribute("aria-label","Search ownership registry");
 [["all","All sectors"],["Critical minerals","Critical minerals"],["Energy","Energy"],["AI infrastructure","AI infrastructure"]].forEach(([v,t])=>{const option=E("option",null,t);option.value=v;category.append(option)});
 [["Entity or shareholder",query],["Sector",category]].forEach(([name,item])=>{const l=E("label",null,name);l.append(item);controls.append(l)});
 root.append(controls);
 const results=E("p","tr-detail"),items=E("div","inv-ownership-list");root.append(results,items);
 const pct=x=>Number.isFinite(Number(x))?Number(x).toLocaleString("en-US",{maximumFractionDigits:2})+"%":"Undisclosed";
 const table=(entity)=>{
  const wrap=E("div","pf-table-wrap"),t=E("table");
  const head=E("thead"),hr=E("tr");["Reported direct equity holder","Percent / share","Basis"].forEach(x=>hr.append(E("th",null,x)));head.append(hr);t.append(head);
  const tbody=E("tbody");
  if(entity.direct_shareholders.length){
   for(const s of entity.direct_shareholders){const tr=E("tr");tr.append(E("td",null,s.name),E("td",null,pct(s.pct)),E("td",null,"Direct corporate equity, as of "+entity.ownership_as_of));tbody.append(tr)}
  }else{const tr=E("tr"),cell=E("td",null,"Cap table not verified: named project partners are not necessarily shareholders.");cell.colSpan=3;tr.append(cell);tbody.append(tr)}
  t.append(tbody);wrap.append(t);return wrap;
 };
 function render(){
  const q=query.value.trim().toLowerCase();
  items.replaceChildren();
  const list=data.entities.filter(x=>(category.value==="all"||x.sector===category.value)&&([x.entity,x.ownership_chain,x.control,...x.direct_shareholders.map(s=>s.name),...(x.known_project_partners||[])].join(" ").toLowerCase().includes(q)));
  results.textContent=list.length+" of "+data.entities.length+" entity files · expand to review control, beneficial ownership gap and original disclosures.";
  for(const entity of list){
   const details=E("details","inv-owner-card"),summary=E("summary","inv-owner-head");
   const name=E("span","inv-owner-title",entity.entity),badge=E("span","inv-owner-status",entity.beneficial_owner.status);
   summary.append(name,badge);details.append(summary);
   const content=E("div","inv-owner-content");
   const line=E("p","tr-detail",entity.sector+" · Equity reference "+entity.ownership_as_of+" · "+entity.evidence_tier);content.append(line);
   const stakes=E("div","inv-owner-stakes");
   if(entity.direct_shareholders.length){
    for(const sh of entity.direct_shareholders){
     const row=E("div","inv-stake-row"),head=E("div","inv-stake-head"),track=E("div","inv-stake-track"),fill=E("div","inv-stake-fill");
     head.append(E("span",null,sh.name),E("strong",null,pct(sh.pct)));
     fill.style.width=Math.min(100,Math.max(0,Number(sh.pct)||0))+"%";track.append(fill);row.append(head,track);stakes.append(row)
    }
   }else if(entity.known_project_partners){stakes.append(E("p",null,"Named project partners: "+entity.known_project_partners.join(" · ")))}
   content.append(stakes,table(entity));
   const field=(name,value)=>{const block=E("p","inv-owner-field");block.append(E("strong",null,name+" "),document.createTextNode(value||"Not independently verified"));content.append(block)};
   field("Corporate ownership chain:",entity.ownership_chain);
   field("Governance / operating control:",entity.control);
   field("Natural-person beneficial owner:",entity.beneficial_owner?.natural_person||"Not independently verified; no natural person asserted.");
   field("BO evidence limitation:",entity.beneficial_owner?.reason);
   field("Implementation risk:",entity.risk);
   field("Next monitoring priority:",entity.monitor);
   const refs=E("div","inv-owner-refs");(entity.sources||[]).forEach(s=>refs.append(link(s.url,s.label)));content.append(refs);details.append(content);items.append(details);
  }
  if(!list.length)items.append(E("p","tr-detail","No ownership records match the search."));
 }
 query.addEventListener("input",render);category.addEventListener("change",render);render();
 const note=E("div","tr-note");
 note.append(E("strong",null,"Beneficial-ownership verification rule. "),document.createTextNode(data.methodology.notice+" "));note.append(link(data.methodology.bo_register,"AHU public BO search"));root.append(note);
 const foot=E("p","tr-detail","Company controlling shareholders may be corporations, state holding entities, or widely held public companies. An officer, minister, founder or largest shareholder must not be labelled a natural-person beneficial owner without company-specific verified records.");root.append(foot);
};
})();