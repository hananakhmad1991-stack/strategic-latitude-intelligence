/* SLI Investment Actor Map + EV brand affiliations + market-disclosure radar */
(function(){"use strict";
const E=(tag,cls,value)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined&&value!==null)node.textContent=String(value);return node};
const link=(url,label)=>{const a=E("a",null,label+" ↗");if(/^https:\/\//.test(url||"")){a.href=url;a.target="_blank";a.rel="noopener noreferrer"}return a};
const safe=(fn)=>{try{return fn()}catch(err){console.error("[SLI] Investor actor module",err);return null}};
const section=(parent,label,text)=>{const block=E("div","inv-actor-section");block.append(E("h3",null,label),E("p","tr-detail",text));parent.append(block);return block};
function tableBlock(root,headers){const holder=E("div","pf-table-wrap"),table=E("table"),thead=E("thead"),tr=E("tr");headers.forEach(h=>tr.append(E("th",null,h)));thead.append(tr);table.append(thead);const body=E("tbody");table.append(body);holder.append(table);root.append(holder);return body}
function td(row,text){const cell=E("td",null,text);row.append(cell);return cell}
function assetJump(parent,assetId){
 const a=E("a",null,"Asset dossier ↗");a.href="#inv-assets";
 a.addEventListener("click",evt=>{
  const target=document.getElementById("investmentAssetsRoot");
  if(target){evt.preventDefault();target.dispatchEvent(new CustomEvent("sli:openinvestmentasset",{detail:{id:assetId}}))}
 });
 parent.append(a);
}
window.initSLIInvestmentActors=async function(){
 const root=document.getElementById("investmentActorsRoot");if(!root)return;
 root.replaceChildren(E("p","tr-detail","Loading source-attributed company, EV brand and event dossiers…"));
 let dataset;try{const response=await fetch("data/investment-actors-ev-events.json",{cache:"no-store"});if(!response.ok)throw Error("Registry unavailable");dataset=await response.json();}catch(err){root.textContent="Industrial actor evidence registry unavailable.";console.error("[SLI] actor registry",err);return}
 root.replaceChildren();
 root.append(E("p","tr-detail","Research snapshot "+dataset.as_of+" · "+dataset.actors.length+" dated decision-maker profiles · "+dataset.brands.length+" EV brands · "+dataset.corporate_events.length+" selected corporate-action and policy records. Actors are NOT automatically ultimate beneficial owners."));
 const people=section(root,"Industrial Actor & Corporate Control Map","Founder/owner, publicly disclosed shareholder, executive and regulator roles are separate. Click source for dated company disclosure.");
 const filters=E("div","inv-actor-controls"),sector=E("select","tr-select"),query=E("input","tr-select");query.type="search";query.placeholder="Search person, company or sector…";query.setAttribute("aria-label","Search strategic industrial actors");
 const select=(el,list)=>list.forEach(x=>{const op=E("option",null,x);op.value=x;el.append(op)});
 select(sector,["All sectors",...[...new Set(dataset.actors.map(x=>x.sector))].sort()]);
 for(const [label,node] of [["Sector",sector],["Actor or company",query]]){const l=E("label",null,label);l.append(node);filters.append(l)}people.append(filters);
 const pCount=E("p","tr-detail"),pCards=E("div","inv-actor-cards");people.append(pCount,pCards);
 function renderPeople(){
  const q=query.value.trim().toLowerCase(),rows=dataset.actors.filter(x=>(sector.value==="All sectors"||sector.value===x.sector)&&[x.name,x.organisation,x.role,x.sector].join(" ").toLowerCase().includes(q));
  pCards.replaceChildren();pCount.textContent=rows.length+" of "+dataset.actors.length+" sourced actors shown";
  for(const x of rows){const c=E("article","inv-actor-card");c.append(E("div","eyebrow",x.role_type+" · "+x.sector),E("h4",null,x.name),E("p","inv-actor-position",x.role+" · "+x.organisation));
   c.append(E("p","tr-detail",x.company_connection));const ul=E("p","tr-detail","Ownership classification: "+x.ownership_class);c.append(ul);
   const foot=E("div","inv-actor-foot");foot.append(E("span",null,"As documented: "+x.evidence_date),link(x.source_url,"Company / regulator source"));if(x.asset_ids?.length)x.asset_ids.forEach(id=>assetJump(foot,id));c.append(foot);pCards.append(c)}
  if(!rows.length)pCards.append(E("p","tr-detail","No actors match these filters. The register is an explicitly selected sample, not a comprehensive BO database."));
 }
 sector.addEventListener("change",renderPeople);query.addEventListener("input",renderPeople);renderPeople();
 const brands=section(root,"EV Brand, Manufacturing & Country-Affiliation Matrix","A brand's nationality, import/retail status, Indonesian assembly, local battery supply and parent-company CAPEX are distinct measures.");
 const eControls=E("div","inv-actor-controls"),eQ=E("input","tr-select");eQ.type="search";eQ.placeholder="Search EV brand, model or country…";eQ.setAttribute("aria-label","Filter EV brands");
 const eLabel=E("label",null,"EV brand or model");eLabel.append(eQ);eControls.append(eLabel);brands.append(eControls);
 const eTable=tableBlock(brands,["Brand / origin","Local legal / commercial entity","Models marketed","Production in Indonesia","Investment & source"]);let eRows=dataset.brands;
 function renderBrands(){eRows=dataset.brands.filter(x=>[x.brand,x.origin,x.models.join(" "),x.indonesian_entity].join(" ").toLowerCase().includes(eQ.value.toLowerCase()));eTable.replaceChildren();
  for(const b of eRows){const tr=E("tr");td(tr,b.brand+" · "+b.origin);td(tr,b.indonesian_entity);td(tr,b.models.join(" · "));td(tr,b.manufacturing_status);const c=E("td");c.append(E("div",null,b.investment),link(b.source_url,"Primary company release"));assetJump(c,b.asset_ref);tr.append(c);eTable.append(tr)}
  if(!eRows.length){const tr=E("tr"),c=td(tr,"No brands match filters");c.colSpan=5;eTable.append(tr)}
 }
 eQ.addEventListener("input",renderBrands);renderBrands();
 const actions=section(root,"Corporate Actions & Market Exposure Radar","Source-led corporate events are attributed below. 'Signal' describes a mechanism for follow-up, not a verified stock-price response or buy/sell recommendation.");
 const actionControls=E("div","inv-actor-controls"),sectorA=E("select","tr-select"),searchA=E("input","tr-select");searchA.type="search";searchA.placeholder="Search company, transaction or issue…";
 select(sectorA,["All sectors",...[...new Set(dataset.corporate_events.map(x=>x.sector))].sort()]);
 for(const [name,input] of [["Sector",sectorA],["Headline / company",searchA]]){const l=E("label",null,name);l.append(input);actionControls.append(l)}actions.append(actionControls);
 const summary=E("p","tr-detail"),list=E("div","inv-action-list");actions.append(summary,list);
 function renderActions(){const q=searchA.value.toLowerCase(),rows=dataset.corporate_events.filter(x=>(sectorA.value==="All sectors"||x.sector===sectorA.value)&&[x.headline,x.entity,x.type,x.signal,x.sector].join(" ").toLowerCase().includes(q)).sort((a,b)=>b.date.localeCompare(a.date));
  list.replaceChildren();summary.textContent=rows.length+" of "+dataset.corporate_events.length+" attributed disclosures";
  for(const x of rows){const item=E("details","inv-action-card"),header=E("summary");header.append(E("span",null,x.date+" · "+x.entity+" · "+x.headline),E("small",null,x.signal));item.append(header);
    const inner=E("div","inv-action-detail");for(const [key,value] of [["Event class",x.type],["Verified event status",x.event_status],["Potential exposure · analytical hypothesis",x.impact_hypothesis],["Follow-up documentation needed",x.confirmation_needed]]){const p=E("p");p.append(E("strong",null,key+": "),document.createTextNode(value));inner.append(p)}inner.append(link(x.source_url,"Open original disclosure"));item.append(inner);list.append(item)}
  if(!rows.length)list.append(E("p","tr-detail","No matching corporate disclosures. Live headline discovery continues in Investment Media Monitoring below."));
 }
 sectorA.addEventListener("change",renderActions);searchA.addEventListener("input",renderActions);renderActions();
 const foot=E("p","tr-detail","Method: "+dataset.sentiment_method);root.append(foot);
};
})();