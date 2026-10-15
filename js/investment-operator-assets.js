/* Strategic Latitude Intelligence — asset / operator / concession explorer.
   PSC, IUP/IUPK, commercial cloud services and MoUs have DIFFERENT legal regimes. */
(function(){"use strict";
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined&&text!==null)n.textContent=String(text);return n};
const urlOk=url=>typeof url==="string"&&url.startsWith("https://");
const link=(url,title)=>{if(!urlOk(url))return el("span","inv-muted","Not independently sourced");const a=el("a",null,title+" ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
const label=(parent,name,value)=>{const p=el("p","inv-asset-field");p.append(el("strong",null,name+": "),document.createTextNode(value===null||value===undefined||value===""?"Not independently verified":String(value)));parent.append(p)};
const fAmount=a=>a?.amount==null?"Not independently disclosed":a.unit+" "+Number(a.amount).toLocaleString("en-US");
window.initSLIInvestmentAssets=async function(){
 const root=document.getElementById("investmentAssetsRoot");if(!root)return;
 root.replaceChildren(el("p","tr-detail","Loading WK/KKKS, solar, hydro, wind, geothermal, nuclear, mining and digital infrastructure dossiers…"));
 let d;
 try{const res=await fetch("data/investment-operator-assets.json",{cache:"no-store"});if(!res.ok)throw Error("File not yet published");d=await res.json();if(!Array.isArray(d.records))throw Error("Invalid data schema")}
 catch(err){root.replaceChildren(el("p","tr-detail","Verified asset registry is not available yet. No project or production values have been inferred."));console.error("[SLI] asset intelligence",err);return}
 root.replaceChildren();
 const counts=el("div","inv-asset-stats");
 const priority=["Oil & Gas","Coal","Minerals","Smelters & Processing","Biofuels & Bioenergy","Renewable Energy","Solar PV","Hydropower & Storage","Wind","Nuclear (New Energy)","Electric Vehicles","AI / Data Center"];
 const coveredSectors=[...priority.filter(x=>d.records.some(y=>y.sector===x)),...[...new Set(d.records.map(x=>x.sector))].filter(x=>!priority.includes(x)).sort()];
 for(const sector of coveredSectors){const value=d.records.filter(x=>x.sector===sector).length;const c=el("div","inv-asset-stat");c.append(el("span",null,sector),el("strong",null,value));counts.append(c)}root.append(counts);
 root.append(el("p","tr-detail","Research snapshot "+(d.as_of||"unknown")+". A row may represent an upstream PSC, a company mine, a project or a government MoU — not identical legal/production units. Values refer only to the source period."));
 if(Array.isArray(d.macro_sector_benchmarks)&&d.macro_sector_benchmarks.length){
  const wrap=el("div","inv-asset-benchmarks");
  for(const b of d.macro_sector_benchmarks){
    const card=el("div","inv-asset-stat");
    card.append(el("span",null,b.indicator),el("strong",null,Number(b.value).toLocaleString("en-US")+" "+b.unit),el("small",null,b.period+" · "+b.classification),link(b.source_url,"ESDM / company evidence"));
    wrap.append(card)
  }
  root.append(wrap)
 }
 if(d.ruplt_2025_2034&&Array.isArray(d.ruplt_2025_2034.capacity_GW)){
  const plan=d.ruplt_2025_2034,box=el("details","inv-asset-method");box.open=true;
  box.append(el("summary",null,"RUPTL PLN "+plan.plan_window+" — planned capacity by energy technology (not installed)"));
  const note=el("p","tr-detail","Total new generation planned: "+plan.total_new_generation_GW+" GW across ALL generation technologies. The breakdown below is a selected technology plan, including storage, and must not be summed with site-specific projects or interpreted as commissioned electricity supply.");box.append(note);
  const bars=el("div","inv-ruptl-grid");
  for(const entry of plan.capacity_GW){
   const row=el("div","inv-ruptl-row"),head=el("div","inv-stake-head");
   head.append(el("span",null,entry.technology),el("strong",null,Number(entry.value).toLocaleString("en-US")+" GW"));
   const track=el("div","inv-stake-track"),fill=el("div","inv-stake-fill");fill.style.width=(100*entry.value/17.1)+"%";track.append(fill);row.append(head,track);bars.append(row)
  }
  box.append(bars,el("p","tr-detail",plan.explanation),link(plan.source_url,"PLN / ESDM 2025-2034 RUPTL source"));
  root.append(box)
 }
 if(d.nuclear_status_note){const caution=el("div","tr-note");caution.append(el("strong",null,"Nuclear licensing boundary: "),document.createTextNode(d.nuclear_status_note));root.append(caution)}
 const controls=el("div","inv-asset-controls"),q=el("input","tr-select"),sector=el("select","tr-select"),stage=el("select","tr-select");
 q.type="search";q.placeholder="Search WK, PLTS, PLTA, PLTB, PLTN, KKKS, operator or investor…";q.setAttribute("aria-label","Search sector operator assets");
 const mk=(s,values)=>values.forEach(([value,title])=>{const o=el("option",null,title);o.value=value;s.append(o)});
 mk(sector,[["all","All sectors"],...coveredSectors.map(x=>[x,x])]);
 mk(stage,[["all","All statuses"],...[...new Set(d.records.map(x=>x.stage))].sort().map(x=>[x,x])]);
 for(const [name,input] of [["Find an asset",q],["Sector",sector],["Status",stage]]){const l=el("label",null,name);l.append(input);controls.append(l)}root.append(controls);
 const count=el("p","tr-detail"),tableWrap=el("div","pf-table-wrap inv-asset-table"),table=el("table");
 table.innerHTML="<thead><tr><th>Asset / WK / site</th><th>Operator / entity</th><th>Contract or licence</th><th>Production / capacity</th><th>Investment / status</th><th>Review</th></tr></thead>";
 const body=el("tbody");table.append(body);tableWrap.append(table);root.append(count,tableWrap);
 const dossier=el("div","inv-asset-dossier");dossier.setAttribute("aria-live","polite");root.append(dossier);
 const fmtCapacity=x=>x?.value==null?"Not separately published":Number(x.value).toLocaleString("en-US")+" "+x.unit;
 const fmtOutput=x=>x?.value==null?"No asset-level figure verified":Number(x.value).toLocaleString("en-US")+" "+x.unit;
 function details(x){
  dossier.replaceChildren();
  if(!x){dossier.append(el("p","tr-detail","Select an asset to review the legal licence, operator, recorded production, investment and source limitations."));return}
  dossier.append(el("div","eyebrow",x.sector.toUpperCase()+" · "+x.stage.toUpperCase()),el("h3",null,x.asset));
  const grid=el("div","inv-asset-dossier-grid");
  for(const [name,value] of [["Operator / KKKS",x.operator],["Location",x.region],["Corporate country affiliation",x.affiliation],["Licence / contract",x.legal],["Contract started",x.contract_start||"Undisclosed / not applicable"],["Contract expires",x.contract_end||"Undisclosed / not applicable"],["Output / production",fmtOutput(x.production)],["Planned service / installed capacity",fmtCapacity(x.capacity)],["Investment declared",fAmount(x.investment)]]){const c=el("div","inv-asset-fact");c.append(el("span",null,name),el("strong",null,value));grid.append(c)}dossier.append(grid);
  label(dossier,"Contract expiry qualification",x.contract_end_status);
  if(x.production){label(dossier,"Production reference period",x.production.period);label(dossier,"Production reporting perimeter",x.production.scope);label(dossier,"Production evidence quality",x.production.evidence)}
  if(x.capacity)label(dossier,"Capacity measurement",x.capacity.label);
  if(x.investment)label(dossier,"Investment amount classification",x.investment.basis);
  label(dossier,"Implementation and verification caveat",x.notes);
  const refs=el("div","inv-asset-refs");refs.append(link(x.source_url,"Operator / regulator disclosure"));
  if(x.production?.source_url&&x.production.source_url!==x.source_url)refs.append(link(x.production.source_url,"Production source"));
  if(x.capacity?.source_url&&x.capacity.source_url!==x.source_url)refs.append(link(x.capacity.source_url,"Capacity evidence"));
  if(x.investment?.source_url&&x.investment.source_url!==x.source_url)refs.append(link(x.investment.source_url,"Investment claim"));
  if(x.secondary_source)refs.append(link(x.secondary_source,"Additional corroborating source"));
  if(x.ownership_ref){const ref=el("a",null,"Corporate ownership / PSC dossier ↗");ref.href="#inv-owner-"+x.ownership_ref;ref.addEventListener("click",e=>{const target=document.getElementById("inv-owner-"+x.ownership_ref);if(target){e.preventDefault();target.open=true;target.scrollIntoView({behavior:"smooth",block:"start"});}});refs.append(ref)}
  else refs.append(el("span","inv-muted","No independently cross-matched beneficial-owner dossier"));
  dossier.append(refs);
 }
 let selected=null;
 function draw(){
  const keyword=q.value.trim().toLowerCase(),rows=d.records.filter(x=>(sector.value==="all"||sector.value===x.sector)&&(stage.value==="all"||stage.value===x.stage)&&[x.asset,x.operator,x.region,x.affiliation,x.legal,x.notes].some(v=>String(v||"").toLowerCase().includes(keyword)));
  count.textContent=rows.length+" of "+d.records.length+" sourced asset and agreement dossiers · contract/production quantities cannot be summed across sectors";
  body.replaceChildren();
  for(const x of rows){
   const tr=el("tr");tr.id="sli-asset-"+x.id;const title=el("div","inv-asset-title",x.asset);title.append(el("small",null,x.region+" · "+x.sector));const name=el("td");name.append(title);tr.append(name);
   for(const val of [x.operator,x.legal+" · "+(x.contract_end||"Expiry not established"),x.production?fmtOutput(x.production)+" · "+x.production.period:x.capacity?fmtCapacity(x.capacity)+" · "+x.capacity.label:"No reported output / capacity",fAmount(x.investment)+" · "+x.stage])tr.append(el("td",null,val));
   const button=el("button","inv-view","View dossier");button.type="button";button.setAttribute("aria-label","View dossier for "+x.asset);button.addEventListener("click",()=>{selected=x.id;details(x);body.querySelectorAll("tr").forEach(r=>r.classList.toggle("inv-row-selected",r===tr));dossier.scrollIntoView({behavior:"smooth",block:"start"})});
   const cell=el("td");cell.append(button);tr.append(cell);if(selected===x.id)tr.classList.add("inv-row-selected");body.append(tr);
  }
  if(!rows.length){const tr=el("tr"),td=el("td",null,"No matching WK, concession, data center or agreement. Try a wider sector filter.");td.colSpan=6;tr.append(td);body.append(tr)}
  const current=rows.find(x=>x.id===selected);details(current||null);
 }
 for(const input of [q,sector,stage])input.addEventListener(input===q?"input":"change",draw);draw();
 const onAssetRequest=event=>{
  const id=event?.detail?.id,record=d.records.find(x=>x.id===id);if(!record||!root.isConnected)return;
  q.value="";sector.value="all";stage.value="all";selected=id;draw();
  details(record);
  const row=document.getElementById("sli-asset-"+id);
  if(row){row.classList.add("inv-row-selected");row.scrollIntoView({behavior:"smooth",block:"center"});}
 };
 root.addEventListener("sli:openinvestmentasset",onAssetRequest);
 const methodology=el("details","inv-asset-method");methodology.append(el("summary",null,"Why PSC, IUPK, corporate shares, and MoUs have different data fields"));
 const ul=el("ul");for(const note of d.methodology.distinctions)ul.append(el("li",null,note));methodology.append(ul);root.append(methodology);
};
})();