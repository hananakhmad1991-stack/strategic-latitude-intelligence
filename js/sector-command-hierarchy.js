/* SLI source-dated TOP-DOWN institutional / corporate organization explorer */
(function(){"use strict";
const el=(tag,cl,text)=>{const x=document.createElement(tag);if(cl)x.className=cl;if(text!==undefined)x.textContent=String(text);return x};
const link=(url,label)=>{const a=el("a","sli-hier-link",label||"Original source ↗");if(/^https:\/\//.test(url||"")){a.href=url;a.target="_blank";a.rel="noopener noreferrer"}else{a.textContent="No verified source"}return a};
const typeName={root:"National direction",policy:"Sector policy",coordination:"Coordinating ministry",planning:"National development planning",reporting:"Administrative reporting",portfolio:"State portfolio",equity:"Shareholding / member",minority:"Minority investment / associate",oversight:"Independent constitutional oversight",research:"Research / applied innovation","strategic-interface":"Functional demand interface","joint-venture":"Joint venture / cross-holding",market:"Independent commercial market","security":"Cybersecurity"};
function init(which,root){if(!root)return;root.replaceChildren(el("p","sli-hier-status","Loading verified institutional and corporate hierarchy…"));
fetch("data/sector-command-hierarchy.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Hierarchy source unavailable");return r.json()}).then(db=>{
 const record=db.sectors?.[which];if(!root.isConnected||!record)return;
 const actors=record.nodes||[],market=record.market||[],byId=new Map(actors.map(x=>[x.id,x]));
 const rootNode=actors.find(x=>x.relation==="root");if(!rootNode)throw Error("Missing president root");
 const main=el("section","sli-hier-root");
 const h=el("div","sli-hier-header");h.append(el("div","eyebrow","INSTITUTIONAL & CORPORATE COMMAND STRUCTURE"),el("h3",null,"Government · Danantara & SOEs · Private Sector"),el("p",null,"Three separate systems: public institutions, state corporate portfolios and independent domestic/foreign investors. The Presidency anchors public-sector authority; corporate ownership is not regulatory command."));
 const tools=el("div","sli-hier-tools"),search=el("input","sli-hier-search"),expand=el("button","sli-hier-button","Expand all"),collapse=el("button","sli-hier-button","Collapse all"),filter=el("select","sli-hier-select");
 search.type="search";search.placeholder="Find people, directorates, companies…";search.setAttribute("aria-label","Search the hierarchy");
 const opts=[["all","All sectors · grouped"],["government","Government & public institutions"],["policy","Public policy & regulators"],["portfolio","Danantara / BUMN"],["research","BRIN / research / defence"],["market","Private (all)"],["domestic","Private · Indonesia"],["foreign","Private · foreign"],["joint","Private · cross-border JVs"]];
 for(const [key,title] of opts){const op=el("option",null,title);op.value=key;filter.append(op)}
 for(const button of [expand,collapse])button.type="button";
 tools.append(filter,search,expand,collapse);main.append(h,tools);
 const watch=el("div","sli-hier-watch","Official leadership source watch: awaiting the next dated source scan.");main.append(watch);
 fetch("data/sector-leadership-watch.json",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{
  if(!d?.checked_at_utc){watch.textContent="Leadership roster source monitoring is configured but has not completed its first scan. Names are source-dated, not live confirmed.";return}
  const items=(d.checks||[]).filter(x=>x.sector===which),ok=items.filter(x=>x.status==="name_present_in_source").length,
    review=items.filter(x=>x.status==="name_not_detected_needs_review").length,
    unavailable=items.filter(x=>x.status==="source_access_unavailable").length;
  watch.textContent="Official page scan "+d.checked_at_utc.slice(0,16)+" UTC · "+ok+" names seen in linked source pages · "+review+" need review · "+unavailable+" sources inaccessible. Automated page matching is not proof of incumbent appointment.";
 }).catch(()=>{watch.textContent="Leadership source scanner status temporarily unavailable; original links remain visible."});

 const top=el("div","sli-hier-president"),lanes=el("div","sli-hier-lanes"),outsiders=el("section","sli-hier-market"),info=el("aside","sli-hier-profile");
 main.append(top,lanes,outsiders,info);
 const legend=el("div","sli-hier-legend");for(const [key,title] of Object.entries(typeName)){if(["reporting","policy","coordination","planning","portfolio","equity","minority","research","market","oversight","joint-venture"].includes(key))legend.append(el("span","sli-hier-key "+key,title))}main.append(legend);
 main.append(el("p","sli-hier-foot",db.updated_note+" Reported shareholding and direct official reporting must not be conflated with coordination or related-industry links."));
 root.replaceChildren(main);
 const defaultExpanded=new Set(["pres","minister","industrial","investment","komdigi","dgE","dgI","bpi","dam","mind","telkom","brin"]);
 let openIds=new Set(defaultExpanded);
 let selectedId="pres";
 function profile(a){
 info.replaceChildren(el("div","eyebrow","SOURCE-DATED ACTOR PROFILE"),el("h4",null,a.title));
 if(a.person)info.append(el("p","sli-hier-person","Actor / leader: "+a.person));else info.append(el("p","sli-hier-missing","Named incumbent is not independently verified in this register."));
 info.append(el("p",null,a.role),el("p","sli-hier-type","Relationship: "+(typeName[a.relation]||a.relation)));
 if(a.stake)info.append(el("p","sli-hier-stake","Reported stake: "+a.stake));
 if(a.affiliation)info.append(el("p",null,"Corporate affiliation: "+a.affiliation));
 info.append(el("p","sli-hier-provenance","Evidence class: "+a.verification+" · research snapshot "+db.as_of),link(a.source,"View original institutional or issuer source ↗"));
 const path=[];let p=a;while(p&&path.length<8){path.unshift(p.title);p=byId.get(p.parent)}
 if(path.length>1)info.append(el("p","sli-hier-path","Trace: "+path.join(" → ")));
 }
 function card(a,depth=0){
 const wrap=el("div","sli-hier-entry "+a.relation),btn=el("button","sli-hier-card"+(selectedId===a.id?" selected":""),undefined);
 btn.type="button";btn.append(el("small",null,(typeName[a.relation]||a.relation)+" · L"+depth),el("strong",null,a.title));
 if(a.person)btn.append(el("span","sli-hier-lead",a.person));
 if(a.stake)btn.append(el("span","sli-hier-share",a.stake));
 btn.addEventListener("click",()=>{selectedId=a.id;profile(a);draw()});wrap.append(btn);return wrap
 }
 function nested(a,depth,scope,maxDepth=8){
 const node=card(a,depth),children=actors.filter(x=>x.parent===a.id && x.lane===a.lane && x.relation!=="market");
 if(children.length&&depth<maxDepth){const disclosure=el("button","sli-hier-toggle",(openIds.has(a.id)?"−":"+")+" "+children.length+" subordinate / linked entities");disclosure.type="button";
 disclosure.setAttribute("aria-expanded",String(openIds.has(a.id)));disclosure.addEventListener("click",()=>{if(openIds.has(a.id))openIds.delete(a.id);else openIds.add(a.id);draw()});node.append(disclosure);
 if(openIds.has(a.id)){const branch=el("div","sli-hier-children");for(const ch of children)branch.append(nested(ch,depth+1,scope,maxDepth));node.append(branch)}}
 return node
 }

 const govs=actors.filter(a=>a.lane==="government"&&a.id!=="pres");
 const states=actors.filter(a=>a.lane==="state");
 const independent=actors.filter(a=>a.lane==="oversight");
 const marketCategories=[
  {key:"domestic",title:"DOMESTIC PRIVATE · INDONESIA",description:"Indonesian-headquartered private and listed businesses. Individual project JVs must still be checked."},
  {key:"foreign",title:"FOREIGN PRIVATE · INTERNATIONAL",description:"Foreign-headquartered companies and providers. Local incorporation does not make the parent Indonesian-owned."},
  {key:"joint",title:"MIXED OWNERSHIP & CROSS-BORDER JVs",description:"Joint ventures and companies with mixed domestic/foreign shareholding, kept separate from purely domestic or foreign parents."}
 ];
 const renderSection=(title,description,count,cls)=>{
  const section=el("section","sli-hier-domain "+cls);
  const header=el("div","sli-hier-domain-head");
  header.append(el("div","eyebrow",cls==="government"?"01 · PUBLIC INSTITUTIONS":cls==="state"?"02 · PUBLIC CORPORATE PORTFOLIO":"03 · COMMERCIAL MARKET"),
    el("h4",null,title),el("p",null,description),el("span","sli-hier-domain-count",count+" mapped entities"));
  section.append(header);
  return section;
 };
 const domainVisible=(mode,name)=>mode==="all"||(name==="government"&&["government","policy","research"].includes(mode))||
   (name==="state"&&mode==="portfolio");
 const governmentSection=()=>{
  const show=domainVisible(filter.value||"all","government");
  if(!show)return;
  const mode=filter.value||"all";
  const roots=govs.filter(a=>a.parent==="pres");
  let relevant=mode==="research"?roots.filter(a=>["research"].includes(a.relation)||a.id==="defense"||a.id==="highered"):
    mode==="policy"?roots.filter(a=>["policy","coordination","planning"].includes(a.relation)):roots;
  const section=renderSection("GOVERNMENT · POLICY & PUBLIC INSTITUTIONS",
    "President → coordinating ministries and ministries → directorates. BRIN and executive agencies have separate mandates; DPR/BPK are independent oversight bodies, not presidential subordinates.",
    govs.length+1+independent.length,"government");
  const grid=el("div","sli-hier-domain-grid");
  for(const a of relevant){const c=el("article","sli-hier-lane");c.append(nested(a,1,mode));grid.append(c)}
  section.append(grid);
  if(independent.length && mode!=="research"){
   const over=el("div","sli-hier-independent");
   over.append(el("h4",null,"Independent parliamentary & financial oversight"),
     el("p",null,"DPR RI and BPK RI are NOT directorates under the President or ministers."));
   const cards=el("div","sli-hier-market-grid");
   independent.forEach(a=>cards.append(card(a,1)));over.append(cards);section.append(over);
  }
  lanes.append(section);
 };
 const stateSection=()=>{
  if(!domainVisible(filter.value||"all","state"))return;
  const roots=states.filter(a=>!a.parent||!states.some(p=>p.id===a.parent));
  const section=renderSection("DANANTARA · STATE-OWNED ENTERPRISES",
   "Corporate portfolio and equity relationships are shown separately from government regulatory mandates. MIND ID group members, DSI, Telkom and other state-linked companies have different legal roles.",
   states.length,"state");
  const grid=el("div","sli-hier-domain-grid");
  for(const a of roots){const c=el("article","sli-hier-lane");c.append(nested(a,1,"portfolio"));grid.append(c)}
  section.append(grid);lanes.append(section);
 };
 function marketPanel(){
  const mode=filter.value||"all",visible=["all","market","domestic","foreign","joint"].includes(mode);
  outsiders.hidden=!visible;
  outsiders.replaceChildren();
  if(!visible)return;
  const section=renderSection("PRIVATE SECTOR · DOMESTIC & FOREIGN",
   "Commercial companies and corporate nationality are separated from the government and Danantara/BUMN organizational chart. Connections to the state are regulatory or contractual, not statutory subordination.",
   market.length,"private");
  const body=el("div","sli-hier-market-classifications");
  for(const meta of marketCategories){
   if(!["all","market",meta.key].includes(mode))continue;
   const filtered=market.filter(a=>(a.ownership_category||"joint")===meta.key).filter(a=>!query||[a.title,a.person,a.role,a.affiliation].join(" ").toLowerCase().includes(query));
   const col=el("div","sli-hier-market-class "+meta.key);
   col.append(el("h5",null,meta.title+" · "+filtered.length),el("p",null,meta.description));
   const list=el("div","sli-hier-market-grid");
   filtered.forEach(a=>list.append(card(a,1)));col.append(list);body.append(col);
  }
  section.append(body);outsiders.append(section);
 }
 let query="";
 function draw(){
  query=search.value.trim().toLowerCase();
  const mode=filter.value||"all";
  top.replaceChildren();
  if(!["market","domestic","foreign","joint","portfolio"].includes(mode)){
   top.append(el("p","sli-hier-root-label","GOVERNMENT · HEAD OF STATE / EXECUTIVE DIRECTION"));
   top.append(card(rootNode));
  }else if(mode==="portfolio"){
   top.append(el("p","sli-hier-root-label","STATE PORTFOLIO · OWNERSHIP / INVESTMENT"));
  }
  lanes.replaceChildren();
  governmentSection();
  stateSection();
  marketPanel();
  if(query){
   const matches=[...actors,...market].filter(x=>[x.title,x.person,x.role].join(" ").toLowerCase().includes(query));
   const result=el("div","sli-hier-search-hits");
   result.append(el("h4",null,"Matching actors · "+matches.length));
   for(const a of matches.slice(0,30)){
    const b=el("button","sli-hier-match",a.title+(a.person?" · "+a.person:""));
    b.type="button";
    b.addEventListener("click",()=>{
     selectedId=a.id;
     if(a.parent){let p=a;while(p){openIds.add(p.id);p=byId.get(p.parent)}}
     profile(a);search.value="";filter.value=a.lane==="state"?"portfolio":a.lane==="private"?"market":"government";draw();
    });result.append(b);
   }
   lanes.prepend(result);
  }
 }
 expand.addEventListener("click",()=>{openIds=new Set(actors.map(x=>x.id));draw()});
 collapse.addEventListener("click",()=>{openIds=new Set();draw()});
 search.addEventListener("input",draw);filter.addEventListener("change",draw);
 profile(rootNode);draw();
}).catch(error=>{console.error("[SLI command hierarchy]",error);root.replaceChildren(el("p","sli-hier-status","Hierarchy data cannot be loaded. The Energy-style institutional network remains available below."))});
}
window.initSLICommandHierarchy=init;
})();