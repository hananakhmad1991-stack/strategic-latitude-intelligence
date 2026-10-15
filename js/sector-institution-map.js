/* SLI sector institution explorer. Source-led functional network, not hierarchy. */
(function(){
"use strict";
const NS="http://www.w3.org/2000/svg";
const colors=["#D8BD80","#83BACB","#82B5A3","#B9A2D8","#D9A780","#95AED6"];
const E=(tag,cls,label)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(label!==undefined)el.textContent=String(label);return el};
const SVG=(tag,attrs,parent,label)=>{const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs||{}))el.setAttribute(k,String(v));if(label!==undefined)el.textContent=String(label);if(parent)parent.append(el);return el};
const link=(url,label)=>{const a=E("a",null,label);const external=/^https:\/\//.test(url||"");a.href=external?url:"#policy";if(external){a.target="_blank";a.rel="noopener noreferrer"}else a.addEventListener("click",ev=>{ev.preventDefault();document.querySelector('#nav button[data-page="policy"]')?.click()});return a};
const fade=(str,max)=>str.length<=max?str:str.slice(0,max-1)+"…";
function init(sector,mount,fallback=[]){
 if(!mount)return;
 mount.replaceChildren(E("p","sli-org-status","Loading institutional source register…"));
 fetch("data/sector-institution-map.json",{cache:"no-store"}).then(response=>{if(!response.ok)throw Error("institution dataset HTTP "+response.status);return response.json()}).then(all=>{
 if(!mount.isConnected)return;
 const data=all[sector];if(!data||!Array.isArray(data.branches))throw Error("No mapping for "+sector);
 const state={branch:null,actor:null,query:""};
 const shell=E("section","stake-shell sli-org-shell");
 const title=E("div","stake-header sli-org-header"),intro=E("div");
 intro.append(E("div","eyebrow","STRATEGIC LATITUDE INTELLIGENCE · INSTITUTIONAL & POLICY STRUCTURE"),E("h2",null,data.title),E("p","stake-intro",data.subtitle));
 const totals=data.branches.reduce((n,b)=>n+b.actors.length,0);
 const stats=E("div","sli-org-stats");stats.append(E("strong",null,totals+" sourced actors"),E("span",null,data.branches.length+" functional branches · reviewed "+all.as_of));
 title.append(intro,stats);shell.append(title);
 shell.append(E("p","sli-org-disclaimer","Visual connections represent functional participation, not statutory command or ownership. Current officeholder names are intentionally omitted unless formally verified."));
 const bar=E("div","sli-org-toolbar");
 const back=E("button","sli-org-action","← National map");back.type="button";
 const select=E("select","sli-org-select");select.setAttribute("aria-label","Explore institutional function");
 select.append(Object.assign(E("option",null,"Overview · all branches"),{value:"all"}));
 data.branches.forEach((b,i)=>{const op=E("option",null,b.name);op.value=String(i);select.append(op)});
 const search=E("input","sli-org-search");search.type="search";search.placeholder="Search institution or company";search.setAttribute("aria-label","Search sector institutions");
 back.addEventListener("click",()=>{state.branch=null;state.actor=null;state.query="";search.value="";select.value="all";render()});
 select.addEventListener("change",()=>{state.branch=select.value==="all"?null:Number(select.value);state.actor=null;render()});
 search.addEventListener("input",()=>{state.query=search.value.trim().toLowerCase();render()});
 bar.append(back,select,search);shell.append(bar);
 const columns=E("div","sli-org-columns"),left=E("div","sli-org-main"),inspector=E("aside","sli-org-inspector");
 const canvas=E("div","sli-org-canvas"),branchButtons=E("div","sli-org-branch-buttons"),actorsList=E("div","sli-org-actor-list");
 left.append(canvas,branchButtons,actorsList);columns.append(left,inspector);shell.append(columns);
 const methodology=E("p","sli-org-footer","Policy instruments are maintained in Policy & Risk. Actor roles follow the original organizations; this viewer is not a legal attribution of reporting lines.");
 methodology.append(" ",link("#policy","Open central Policy & Risk ↗"));shell.append(methodology);
 mount.replaceChildren(shell);
 function setBranch(i){state.branch=i;state.actor=null;select.value=String(i);render()}
 function setActor(i){state.actor=i;render()}
 function interactive(node,fn,label){node.setAttribute("role","button");node.setAttribute("tabindex","0");node.setAttribute("aria-label",label);node.addEventListener("click",fn);node.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();fn()}})}
 function drawOverview(){
 const svg=SVG("svg",{viewBox:"0 0 930 550",role:"img","aria-label":"Six functional branches of "+data.title,class:"sli-org-svg"},canvas);
 const P=[[155,122],[465,76],[775,122],[155,430],[465,472],[775,430]],center=[465,275];
 P.forEach(([x,y],i)=>{const dx=center[0]-x,dy=center[1]-y;SVG("path",{d:"M"+center[0]+" "+center[1]+" Q"+(center[0]+x)/2+" "+(center[1]+y)/2+" "+x+" "+y,fill:"none",stroke:colors[i],"stroke-width":1.8,"stroke-opacity":".62"},svg)});
 const core=SVG("g",{},svg);SVG("rect",{x:317,y:223,width:296,height:103,rx:18,fill:"#122c40",stroke:"#d8bd80","stroke-width":2},core);
 SVG("text",{x:465,y:257,"text-anchor":"middle","font-weight":800,"font-size":13,fill:"#e9d6a8"},core,"SECTOR ECOSYSTEM");
 const chunks=data.central.split(" "),half=Math.ceil(chunks.length/2);
 SVG("text",{x:465,y:283,"text-anchor":"middle","font-weight":720,"font-size":14,fill:"#f3f5f7"},core,chunks.slice(0,half).join(" "));
 SVG("text",{x:465,y:301,"text-anchor":"middle","font-weight":720,"font-size":14,fill:"#f3f5f7"},core,chunks.slice(half).join(" "));
 data.branches.forEach((branch,i)=>{const [x,y]=P[i],w=252,h=92,g=SVG("g",{class:"sli-org-node"},svg);
 SVG("rect",{x:x-w/2,y:y-h/2,width:w,height:h,rx:13,fill:"#17364c",stroke:colors[i],"stroke-width":1.75},g);
 SVG("rect",{x:x-w/2+12,y:y-h/2+15,width:5,height:h-30,rx:2,fill:colors[i]},g);
 SVG("text",{x:x-w/2+29,y:y-10,fill:"#f5f7fa","font-weight":750,"font-size":15},g,fade(branch.name,27));
 SVG("text",{x:x-w/2+29,y:y+15,fill:"#a9c3d2","font-size":12},g,branch.actors.length+" actors · Explore →");
 interactive(g,()=>setBranch(i),"Explore "+branch.name);
 });
 }
 function drawBranch(index,items){
 const branch=data.branches[index],svg=SVG("svg",{viewBox:"0 0 930 455",role:"img","aria-label":"Stakeholder actors: "+branch.name,class:"sli-org-svg"},canvas);
 SVG("rect",{x:284,y:20,width:360,height:67,rx:12,fill:"#17364c",stroke:colors[index],"stroke-width":1.5},svg);
 SVG("text",{x:465,y:48,"text-anchor":"middle",fill:"#f5f7fa","font-size":17,"font-weight":750},svg,branch.name);
 SVG("text",{x:465,y:70,"text-anchor":"middle",fill:"#a9c3d2","font-size":12},svg,"Functional actors · click for mandate");
 const shown=items.slice(0,9);const rows=Math.ceil(shown.length/3),step=rows?320/rows:320;
 shown.forEach(({actor,idx},j)=>{const col=j%3,row=Math.floor(j/3),x=155+col*310,y=138+row*step;
 SVG("path",{d:"M465 87 L465 112 L"+x+" 112 L"+x+" "+(y-36),stroke:colors[index],"stroke-opacity":".45","stroke-width":1.4,fill:"none"},svg);
 const g=SVG("g",{class:"sli-org-node"},svg);SVG("rect",{x:x-137,y:y-36,width:274,height:76,rx:11,fill:"#132e42",stroke:colors[index],"stroke-width":state.actor===idx?2.4:1.1},g);
 const words=actor.name.split(" ");let first="",second="";for(const w of words){if((first+" "+w).length<31&&!second)first+=(first?" ":"")+w;else second+=(second?" ":"")+w}
 SVG("text",{x:x-125,y:y-5,fill:"#eef4f7","font-size":12.5,"font-weight":700},g,fade(first,32));
 SVG("text",{x:x-125,y:y+13,fill:"#acc3d3","font-size":11.5},g,fade(second||actor.role,38));
 interactive(g,()=>setActor(idx),"Details for "+actor.name);
 });
 }
 function renderInspector(items){
 inspector.replaceChildren();
 const branch=state.branch==null?null:data.branches[state.branch];
 if(!branch){inspector.append(E("small","sli-research-num","HOW TO EXPLORE"),E("h3",null,"Who decides, who operates, who oversees?"),E("p",null,"Choose one of the six institutional branches on the diagram or in the accessible buttons below. Select an actor to view the mandate and original source."));
 const guide=E("ol","sli-org-guide");["Choose a functional branch","Select an institution or operator","Inspect its role, limitations and dated source"].forEach(x=>guide.append(E("li",null,x)));inspector.append(guide);return}
 inspector.append(E("small","sli-research-num",branch.name.toUpperCase()),E("h3",null,branch.description));
 if(state.actor!=null){const actor=branch.actors[state.actor];if(actor){inspector.append(E("h4",null,actor.name),E("p",null,actor.role),E("p","sli-org-caveat",actor.detail),link(actor.source,"Original institution / evidence ↗"));return}}
 inspector.append(E("p",null,branch.actors.length+" linked actors. Select an institution to see specific responsibilities and limitations."));
 const action=E("div","sli-org-inspect-list");for(const {actor,idx} of items){const b=E("button",null,actor.name+" →");b.type="button";b.addEventListener("click",()=>setActor(idx));action.append(b)}inspector.append(action);
 }
 function render(){
 canvas.replaceChildren();actorsList.replaceChildren();branchButtons.replaceChildren();
 const list=state.branch===null?[]:data.branches[state.branch].actors.map((actor,idx)=>({actor,idx})).filter(({actor})=>!state.query||(actor.name+" "+actor.role).toLowerCase().includes(state.query));
 if(state.branch===null)drawOverview();else drawBranch(state.branch,list);
 data.branches.forEach((branch,i)=>{const b=E("button","sli-org-branch-btn"+(i===state.branch?" active":""),branch.name+" · "+branch.actors.length);b.type="button";b.addEventListener("click",()=>setBranch(i));branchButtons.append(b)});
 if(state.branch!==null){for(const {actor,idx} of list){const b=E("button","sli-org-actor-btn"+(idx===state.actor?" active":""),actor.name);b.type="button";b.addEventListener("click",()=>setActor(idx));actorsList.append(b)}}
 back.hidden=state.branch===null;select.value=state.branch===null?"all":String(state.branch);
 renderInspector(list);
 }
 render();
 }).catch(error=>{console.error("[SLI institutional map]",error);mount.replaceChildren(E("p","sli-org-status","Institutional data unavailable. Source register could not be loaded; sector indicators below remain accessible."));if(fallback.length){const list=E("div","sli-research-grid");for(const [group,name,role,,url] of fallback){const card=E("article","sli-research-card");card.append(E("h4",null,group),E("strong",null,name),E("p",null,role),link(url,"Source ↗"));list.append(card)}mount.append(list)}});
}
window.initSLISectorOrganigram=init;
})();