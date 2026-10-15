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
 root.append(E("p","tr-detail","Research snapshot "+dataset.as_of+" · Forbes ranked-wealth list is independently dated · "+dataset.brands.length+" EV brand records · "+dataset.corporate_events.length+" attributed corporate-action events."));
 const select=(el,list)=>list.forEach(x=>{const op=E("option",null,x);op.value=x;el.append(op)});
 const richest=section(root,"Forbes Indonesia · Top 20 Richest","Official annual list, NOT real-time Forbes net worth, current BO status or proof of capital invested in Indonesia.");
 const richText=E("p","tr-detail","Loading the dated Forbes ranking…");richest.append(richText);
 try{
  const fr=await fetch("data/investment-forbes-top20.json",{cache:"no-store"});
  if(!fr.ok)throw Error("Forbes source snapshot unavailable");
  const f=await fr.json();
  if(!Array.isArray(f.rankings)||f.rankings.length<20)throw Error("Incomplete source edition");
  richText.textContent=f.edition+" · source "+f.published+" · last review "+f.reviewed_as_of+" · "+f.status+". "+f.basis;
  const check=E("p","tr-detail",f.last_auto_checked_at?"Automatic source check "+f.last_auto_checked_at:"Automated source checking not yet confirmed to have run.");
  richest.append(check);
  if(f.review_alert)richest.append(E("p","tr-note","New-edition review: "+f.review_alert));
  const find=E("input","tr-select");find.type="search";find.placeholder="Find a Forbes name or industry…";find.setAttribute("aria-label","Search Forbes Indonesia top twenty");richest.append(find);
  const table=tableBlock(richest,["Rank","Forbes person / family","2025 estimated wealth (USD bn)","Forbes industry / source"]);
  function renderForbes(){
    const q=find.value.trim().toLowerCase();
    const list=f.rankings.filter(x=>[x.name,x.forbes_industry].join(" ").toLowerCase().includes(q));
    table.replaceChildren();
    for(const person of list){const tr=E("tr");td(tr,"#"+person.rank);td(tr,person.name);td(tr,"$"+Number(person.net_worth_usd_billion).toLocaleString("en-US",{maximumFractionDigits:2})+" bn");
      const src=E("td");src.append(E("span",null,person.forbes_industry+" · "),link(f.source_url,"Forbes edition"));tr.append(src);table.append(tr)}
    if(!list.length){const row=E("tr"),cell=td(row,"No matches");cell.colSpan=4;table.append(row)}
  }
  find.addEventListener("input",renderForbes);renderForbes();
 }catch(err){richText.textContent="Forbes ranking unavailable or not source-validated. Open the official Forbes list directly.";richest.append(link("https://www.forbeschina.com/lists/1855","Forbes original publication"));console.error("[SLI Forbes]",err)}
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