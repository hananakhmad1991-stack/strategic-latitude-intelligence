/* Investment-only headline discovery. Reuses SLI's dated published RSS snapshots. */
(function(){
"use strict";
const TAX=[
 ["FDI & capital","foreign investment|penanaman modal asing|investasi asing|pma\\b|fdi\\b|investor asing|joint venture|kemitraan investasi"],
 ["Project implementation","groundbreaking|peresmian|resmikan|construction|konstruksi|operasional|commissioning|financial close|pendanaan proyek|proyek strategis|psn\\b"],
 ["Downstreaming & energy","hilirisasi|smelter|kilang|refinery|nickel|nikel|mineral|geothermal|panas bumi|pembangkit|data center|pusat data"],
 ["Policy & incentives","bkpm|danantara|insentif investasi|tax holiday|kek\\b|special economic zone|izin investasi|investment regulation"],
 ["Risks & disputes","pembatalan investasi|investasi batal|dispute|sengketa|moratorium|protes proyek|environmental permit|amdal|kendala investasi"]
];
const regexes=TAX.map(([name,pattern])=>[name,new RegExp(pattern,"i")]);
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e};
window.initSLIInvestmentMedia=async function(){
 const root=document.getElementById("investmentMediaRoot");if(!root)return;
 root.replaceChildren();
 const p=el("p","tr-detail","Investment-related headlines discovered from SLI's existing saved news scans. These are attributed leads, not evidence of actual capital disbursement or project completion.");
 const controls=el("div","tr-controls"),type=el("select","tr-select"),search=el("input","tr-select"),status=el("p","tr-status","Loading dated source scans…"),list=el("div","tr-news");
 search.type="search";search.placeholder="Search investor, project, province…";search.setAttribute("aria-label","Search investment headlines");
 [["all","All investment topics"],...TAX.map(([name])=>[name,name])].forEach(([v,t])=>{const x=el("option",null,t);x.value=v;type.append(x)});
 for(const [txt,input] of [["Investment topic",type],["Headline search",search]]){const label=el("label",null,txt);label.append(input);controls.append(label)}
 root.append(p,controls,status,list);
 let matches=[];
 function draw(){
  list.replaceChildren();const q=search.value.toLowerCase().trim();
  const rows=matches.filter(x=>(type.value==="all"||x.topic===type.value)&&(!q||[x.title,x.publisher,x.topic,x.source].join(" ").toLowerCase().includes(q))).slice(0,50);
  if(!rows.length){list.append(el("p","tr-detail",matches.length?"No saved investment headlines match these filters.":"No investment-related headlines in the available dated scans. This does not mean no investments occurred."));return}
  rows.forEach(x=>{
   const card=el("article","tr-news-card"),label=el("div","eyebrow",x.topic+" · "+x.publisher+" · "+x.source),link=el("a",null,x.title),date=el("p","tr-detail",x.date||"Publication date unavailable");
   link.href=x.url;link.target="_blank";link.rel="noopener noreferrer";
   card.append(label,link,date,el("p","tr-detail","Unverified headline lead. Confirm original source, investment amount, project milestone and implementation date before analytical use."));
   list.append(card);
  });
 }
 type.addEventListener("change",draw);search.addEventListener("input",draw);
 const definitions=[["Investment-specific","data/investment-news.json","reports"],["Domestic","data/domestic-energy.json","reports"],["Geopolitical","data/geopolitical-energy.json","events"]];
 const results=await Promise.allSettled(definitions.map(async ([source,url,field])=>{const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw Error(source+" feed unavailable");return {source,data:await response.json(),field}}));
 const seen=new Set();let failed=0;const times=[];let sourceErrors=0;
 for(const result of results){
  if(result.status!=="fulfilled"){failed++;continue}
  const {source,data,field}=result.value;if(data.checked_at_utc)times.push(Date.parse(data.checked_at_utc));sourceErrors+=(Array.isArray(data.errors)?data.errors.length:0);
  for(const item of Array.isArray(data[field])?data[field]:[]){
   const title=String(item.title||""),url=String(item.url||"");if(!/^https:\/\//.test(url)||seen.has(url))continue;
   const topic=(source==="Investment-specific"&&TAX.some(([name])=>name===item.topic))?item.topic:regexes.find(([,rx])=>rx.test(title))?.[0];if(!topic)continue;
   seen.add(url);
   matches.push({title,url,topic,source,publisher:item.publisher||"Source unspecified",date:item.published_at_utc||item.indexed_at_utc||""});
  }
 }
 matches.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 const newest=times.filter(Number.isFinite).sort((a,b)=>b-a)[0];
 const stamp=newest?new Date(newest).toLocaleString("en-GB",{timeZone:"Asia/Jakarta",dateStyle:"medium",timeStyle:"short"})+" WIB":"unknown";
 status.textContent="Saved source scan: "+stamp+" · "+matches.length+" investment-related leads · "+failed+" unavailable feeds · "+sourceErrors+" topic-source errors"+(failed||sourceErrors?" · Partial source coverage":"")+(newest&&Date.now()-newest>6*3600000?" · Delayed data":"");
 draw();
};
})();