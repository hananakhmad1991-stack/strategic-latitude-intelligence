/* SLI Stakeholder Explorer — zero-dependency interactive, accessible SVG power map.
   Visual edges express analytical association / stakeholder scope, NOT statutory command chains.
   Actor facts are read only from the source-dated governance JSON, never hardcoded here. */
(function(){
"use strict";
const NS="http://www.w3.org/2000/svg";
const palette=["#D8BD80","#83BACB","#82B5A3","#B9A2D8","#D9A780","#95AED6"];
const titles=[
 ["PRESIDENCY","& DIRECTION"],
 ["REGULATORS","& INSTITUTIONS"],
 ["STATE-OWNED","& PRIVATE"],
 ["DPR RI","& SCRUTINY"],
 ["DPD RI","& REGIONS"],
 ["LOCAL","& DELIVERY"]
];
const kinds=[
 {label:"Strategic",match:[0]}, {label:"Implementation",match:[1,2,5]},
 {label:"Oversight",match:[3,4]}
];
const $=(t,c,txt)=>{const e=document.createElement(t);if(c)e.className=c;if(txt!==undefined)e.textContent=String(txt);return e};
const sv=(t,attrs={},txt)=>{
 const e=document.createElementNS(NS,t);
 for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));
 if(txt!==undefined)e.textContent=String(txt);
 return e;
};
function text(svg,x,y,words,attrs={}){
 const val=sv("text",{x,y,"font-family":"Inter, system-ui, sans-serif",...attrs},words);svg.append(val);return val;
}
function curved(svg,x1,y1,x2,y2,stroke,width=1.3,opacity=.45,dash=""){
 const c1=x1+(x2-x1)*.33,c2=x1+(x2-x1)*.66;
 const e=sv("path",{d:"M"+x1+" "+y1+" C "+c1+" "+y1+", "+c2+" "+y2+", "+x2+" "+y2,
   fill:"none",stroke,"stroke-width":width,opacity,"stroke-dasharray":dash});
 svg.append(e);return e;
}
function trim(s,n){return s.length>n?s.slice(0,n-1).trim()+"…":s}
function splitName(name,max=23){
 const parts=String(name).replace(/^(PT |DPR RI · |DPD RI · )/,"").split(/\s+/);
 let a="",b="";
 for(const p of parts){if(!a||a.length+p.length+1<=max)a+=(a?" ":"")+p;else b+=(b?" ":"")+p}
 return [trim(a,max),trim(b,max)];
}
function dot(s,x,y,r,color){s.append(sv("circle",{cx:x,cy:y,r,fill:color}))}
function background(svg,w,h){
 svg.append(sv("rect",{width:w,height:h,rx:20,fill:"#0a1b2c"}));
 const g=sv("g",{stroke:"#355269","stroke-width":.6,opacity:.17});
 for(let x=24;x<w;x+=38)g.append(sv("path",{d:"M"+x+" 0 V"+h}));
 for(let y=22;y<h;y+=38)g.append(sv("path",{d:"M0 "+y+" H"+w}));
 svg.append(g);
 svg.append(sv("circle",{cx:w*.5,cy:h*.5,r:Math.min(w,h)*.45,fill:"none",stroke:"#34546d","stroke-width":1,opacity:.29}));
}
function interactive(node,click,label){
 node.setAttribute("tabindex","0");node.setAttribute("role","button");
 node.setAttribute("aria-label",label);node.style.cursor="pointer";
 node.addEventListener("click",click);
 node.addEventListener("keydown",e=>{
  if(e.key==="Enter"||e.key===" "){e.preventDefault();click()}
 });
 return node;
}
function panelLink(url,label){
 const a=$("a","stake-source",label);
 if(/^https:\/\//.test(url||"")){a.href=url;a.target="_blank";a.rel="noopener noreferrer"}
 else {a.removeAttribute("href");a.textContent="Source unavailable"}
 return a;
}
function stat(label,value){
 const item=$("div","stake-stat");item.append($("strong",null,value),$("span",null,label));return item;
}
function createSvg(w,h,label){
 const s=sv("svg",{viewBox:"0 0 "+w+" "+h,preserveAspectRatio:"xMidYMid meet","aria-label":label,role:"img",class:"stake-svg"});
 s.append(sv("title",{},label));
 background(s,w,h);return s;
}
function overview(svg,data,choose){
 const cx=480,cy=282;
 const positions=[[480,93],[180,197],[780,197],[180,397],[780,397],[480,484]];
 positions.forEach(([x,y],i)=>{
  const oversight=i===3||i===4;
  curved(svg,cx,cy,x,y,palette[i],1.6,.58,oversight?"5 7":"");
 });
 svg.append(sv("circle",{cx,cy,r:103,fill:"#1a3650",stroke:"#a38b5b","stroke-width":1.5}));
 svg.append(sv("circle",{cx,cy,r:90,fill:"#0c2337",stroke:"#d4b97c","stroke-width":.8,opacity:.65}));
 text(svg,cx,cy-29,"INDONESIA",{"text-anchor":"middle",fill:"#d8c18d","font-size":12,"font-weight":700,"letter-spacing":3});
 text(svg,cx,cy-4,"ENERGY",{"text-anchor":"middle",fill:"#f5f4eb","font-size":24,"font-weight":700,"letter-spacing":1});
 text(svg,cx,cy+18,"GOVERNANCE",{"text-anchor":"middle",fill:"#f5f4eb","font-size":16,"font-weight":600,"letter-spacing":1.4});
 const count=data.layers.reduce((sum,x)=>sum+x.actors.length,0);
 text(svg,cx,cy+43,count+" actors · "+data.layers.length+" branches",{"text-anchor":"middle",fill:"#a4c3d7","font-size":11});
 positions.forEach(([x,y],i)=>{
  const w=238,h=88,c=palette[i],g=sv("g",{class:"stake-svg-node"}); 
  const rect=sv("rect",{x:x-w/2,y:y-h/2,width:w,height:h,rx:14,fill:"#142d43",stroke:c,"stroke-width":1.35});
  g.append(rect);
  g.append(sv("rect",{x:x-w/2+15,y:y-h/2+15,width:5,height:h-30,rx:3,fill:c}));
  text(g,x-99,y-13,titles[i][0],{fill:"#f0f3f8","font-size":14,"font-weight":720,"letter-spacing":.4});
  text(g,x-99,y+7,titles[i][1],{fill:"#f0f3f8","font-size":13,"font-weight":600});
  text(g,x+100,y+27,data.layers[i].actors.length+" actors",{"text-anchor":"end",fill:c,"font-size":11,"font-weight":700});
  interactive(g,()=>choose(i),"Open "+data.layers[i].title+" — "+data.layers[i].actors.length+" stakeholders");
  const tt=sv("title",{},data.layers[i].title+" · Select to explore");g.append(tt);
  svg.append(g);
 });
}
function layerGraph(svg,layer,index,select,back,selectedName){
 const actors=layer.actors,rows=Math.ceil(actors.length/2),h=Math.max(510,rows*86+80),w=960;
 svg.setAttribute("viewBox","0 0 "+w+" "+h);svg.replaceChildren();
 background(svg,w,h);
 const c=palette[index],cx=173,cy=h/2;
 const hub=sv("g",{});
 hub.append(sv("rect",{x:40,y:cy-81,width:266,height:162,rx:20,fill:"#18354c",stroke:c,"stroke-width":1.7}));
 const short=titles[index];
 text(hub,62,cy-37,short[0],{fill:c,"font-size":15,"font-weight":700,"letter-spacing":1});
 text(hub,62,cy-12,short[1],{fill:"#eff5f7","font-size":19,"font-weight":700});
 text(hub,62,cy+20,actors.length+" institutions & actors",{fill:"#accbda","font-size":12});
 text(hub,62,cy+45,"SELECT A NODE →",{fill:c,"font-size":10,"letter-spacing":1.1});
 interactive(hub,back,"Back to main energy stakeholder map");
 const positions=actors.map((a,i)=>{
  const col=i%2,row=Math.floor(i/2);
  return {a,x:col===0?520:793,y:68+row*85,col};
 });
 positions.forEach((p,i)=>{
  curved(svg,306,cy,p.x-119,p.y,c,selectedName===p.a.name?2.35:.9,selectedName===p.a.name?.94:.27);
 });
 svg.append(hub);
 positions.forEach((p,i)=>{
  const active=selectedName===p.a.name;
  const card=sv("g",{class:"stake-svg-node"});
  const x=p.x,y=p.y,w=252,hh=68;
  card.append(sv("rect",{x:x-w/2,y:y-hh/2,width:w,height:hh,rx:11,fill:active?"#28445b":"#132b40",stroke:active?"#ebcb88":"#57718a","stroke-width":active?2:1}));
  card.append(sv("rect",{x:x-w/2,y:y-hh/2,width:4,height:hh,rx:2,fill:c}));
  const [a,b]=splitName(p.a.name,29);
  text(card,x-w/2+15,y-(b?12:1),a,{fill:"#f7fafb","font-size":11.2,"font-weight":700});
  if(b)text(card,x-w/2+15,y+4,b,{fill:"#edf3f8","font-size":10.8,"font-weight":650});
  text(card,x-w/2+15,y+25,trim(p.a.scope||p.a.kind,35),{fill:active?"#eac985":"#9eb7cb","font-size":9.6});
  interactive(card,()=>select(p.a.name),"Inspect "+p.a.name+" — "+(p.a.lead||""));
  card.append(sv("title",{},p.a.name+"\n"+(p.a.lead||"")));
  svg.append(card);
 });
 svg.append(sv("text",{x:34,y:26,fill:"#9bbacb","font-size":10,"letter-spacing":1.2},"CATEGORICAL ASSOCIATIONS · NOT REPORTING LINES"));
}
function issueGraph(svg,routes,idx,select){
 const issue=routes[idx],w=960,h=480;
 svg.setAttribute("viewBox","0 0 "+w+" "+h);svg.replaceChildren();
 background(svg,w,h);
 const pts=[[175,158],[480,158],[785,158],[330,357],[645,357]];
 curved(svg,285,158,370,158,"#d1b678",1.4,.54);
 curved(svg,590,158,675,158,"#b7d0df",1.4,.54);
 curved(svg,785,209,635,300,"#c5b0df",1.3,.43,"5 6");
 curved(svg,520,357,535,357,"#c3a780",1.3,.46,"5 6");
 const specs=[
  ["01 · POLICY","Strategic direction",issue.strategic,"#D8BD80"],
  ["02 · RULES","Regulator & budget",issue.regulators,"#83BACB"],
  ["03 · ASSETS","Operators / execution",issue.operators,"#82B5A3"],
  ["04 · CHECKS","DPR / DPD scrutiny",issue.oversight,"#B9A2D8"],
  ["05 · LOCALS","Regional implementation",issue.regional,"#D9A780"]
 ];
 specs.forEach(([top,heading,body,c],i)=>{
  const [x,y]=pts[i],g=sv("g",{class:"stake-svg-node"});
  g.append(sv("rect",{x:x-124,y:y-56,width:248,height:112,rx:14,fill:"#162f43",stroke:c,"stroke-width":1.5}));
  g.append(sv("rect",{x:x-110,y:y-42,width:5,height:84,rx:2,fill:c}));
  text(g,x-98,y-27,top,{fill:c,"font-size":10,"font-weight":750,"letter-spacing":1.2});
  const [first,second]=splitName(heading,22);
  text(g,x-98,y-3,first,{fill:"#f5f7fa","font-size":14,"font-weight":700});
  if(second)text(g,x-98,y+16,second,{fill:"#f5f7fa","font-size":12});
  text(g,x-98,y+36,"CLICK TO READ →",{fill:"#9eb4c7","font-size":10});
  interactive(g,()=>select(i),"Review "+heading+" for "+issue.issue);
  g.append(sv("title",{},body));svg.append(g);
 });
}
window.renderSLIStakeholderMap=function(root,data){
 if(!data||!Array.isArray(data.layers)||!data.layers.length){root.append($("p","gov-note","Institutional actor data is unavailable."));return;}
 const all=data.layers.flatMap((layer,group)=>layer.actors.map(a=>({a,group}))),routes=data.accountability_routes||[];
 const state={mode:"overview",group:0,selected:"",issue:0,issueStep:0,query:""};
 const wrapper=$("section","stake-shell");
 wrapper.setAttribute("aria-label","Interactive Indonesia energy stakeholder network");
 const header=$("div","stake-header");
 const heading=$("div");
 heading.append($("div","eyebrow","STRATEGIC LATITUDE INTELLIGENCE · STAKEHOLDER POWER MAP"),$("h2",null,"Indonesia Energy Power Map"));
 heading.append($("p","stake-intro","Six influence systems. One interactive view. Select a branch, inspect an actor or trace issue-by-issue accountability."));
 const stats=$("div","stake-stats");
 stats.append(stat("Institutions",String(all.length)),stat("Influence groups",String(data.layers.length)),stat("Issue lenses",String(routes.length)));
 header.append(heading,stats);wrapper.append(header);
 const tools=$("div","stake-toolbar");
 const tabs=$("div","stake-tabs"),tabRefs={};
 [["overview","Overview"],["layer","Explore actors"],["issue","Issue focus"]].forEach(([mode,label])=>{
  const b=$("button","stake-tab",label);b.type="button";b.addEventListener("click",()=>{
   state.mode=mode;state.selected="";draw();});tabs.append(b);tabRefs[mode]=b;
 });
 const groupSelect=$("select","stake-select");
 groupSelect.setAttribute("aria-label","Choose functional institutional branch");
 data.layers.forEach((layer,i)=>{const op=$("option",null,layer.title.replace(/^\d+\s*·\s*/,""));op.value=i;groupSelect.append(op)});
 groupSelect.addEventListener("change",()=>{state.group=Number(groupSelect.value);state.mode="layer";state.selected="";draw()});
 const issueSelect=$("select","stake-select");
 issueSelect.setAttribute("aria-label","Choose an energy policy issue");
 routes.forEach((r,i)=>{const op=$("option",null,r.issue);op.value=i;issueSelect.append(op)});
 issueSelect.addEventListener("change",()=>{state.issue=Number(issueSelect.value);state.issueStep=0;state.mode="issue";draw()});
 const input=$("input","stake-search");
 input.type="search";input.placeholder="Search Simon Mantiri, Purnomo, DPR XII…";
 input.setAttribute("aria-label","Search all stakeholders by person or institution");
 const results=$("div","stake-search-results");results.setAttribute("role","listbox");
 input.addEventListener("input",()=>{state.query=input.value;showMatches()});
 input.addEventListener("keydown",e=>{if(e.key==="Escape"){input.value="";state.query="";showMatches();}});
 tools.append(tabs,groupSelect,issueSelect);
 const searchWrap=$("div","stake-search-wrap");searchWrap.append(input,results);tools.append(searchWrap);
 wrapper.append(tools);
 const layout=$("div","stake-layout"),figure=$("div","stake-figure"),inspector=$("aside","stake-inspector");
 inspector.setAttribute("aria-live","polite");
 const plotTitle=$("div","stake-plot-title"),canvas=$("div","stake-canvas"),mobile=$("div","stake-mobile-list");
 const zoomHint=$("div","stake-hint","Select a highlighted node to drill down");
 figure.append(plotTitle,canvas,mobile,zoomHint);layout.append(figure,inspector);wrapper.append(layout);
 const legend=$("div","stake-legend");
 const note=$("p","stake-disclaimer",data.warning||"Analytical policy influence only. Not statutory reporting lines.");
 wrapper.append(legend,note);
 const details=$("details","stake-directory");
 const summary=$("summary",null,"Browse complete source-dated stakeholder directory");
 const directory=$("div","stake-directory-inner");
 details.append(summary,directory);wrapper.append(details);
 root.append(wrapper);
 const find=(name)=>all.find(({a})=>a.name===name);
 function goActor(name){
  const o=find(name);if(!o)return;
  state.group=o.group;state.selected=name;state.mode="layer";
  input.value="";state.query="";showMatches();draw();
 }
 function showMatches(){
  results.replaceChildren();
  const q=state.query.trim().toLowerCase();
  if(q.length<2){results.hidden=true;return;}
  const hits=all.filter(({a})=>[a.name,a.person_name,a.lead,a.scope,a.role].join(" ").toLowerCase().includes(q)).slice(0,9);
  results.hidden=false;
  if(!hits.length){results.append($("div","stake-no-result","No matching actors"));return;}
  hits.forEach(({a,group})=>{const b=$("button","stake-match");b.type="button";
   b.append($("strong",null,a.name),$("span",null,a.lead||a.kind));
   b.addEventListener("click",()=>goActor(a.name));results.append(b)});
 }
 function paintOverviewPanel(){
  inspector.append($("div","stake-eyebrow","READ THE MAP"),$("h3",null,"Explore who shapes Indonesia’s energy policy"));
  inspector.append($("p",null,"Only six institutional clusters are shown to keep the overview legible. Open a cluster to inspect its responsible people and organizations."));
  const ul=$("div","stake-guide");
  [
   ["01","Select a branch","Open a focused map of its actors."],
   ["02","Select an actor","View the incumbent, mandate, links and cited source."],
   ["03","Trace an energy issue","Compare policy, regulator, operator, parliament and region."]
  ].forEach(([num,title,desc])=>{
   const row=$("div","stake-guide-row");
   row.append($("span","stake-step",num),$("div","stake-guide-text"));row.lastChild.append($("strong",null,title),$("p",null,desc));ul.append(row)});
  inspector.append(ul);
  const preferred=$("button","stake-action","Explore Pertamina & PLN →");preferred.type="button";
  preferred.addEventListener("click",()=>{state.mode="layer";state.group=2;draw()});inspector.append(preferred);
 }
 function paintGroupPanel(layer){
  inspector.append($("div","stake-eyebrow","INSTITUTIONAL BRANCH"),$("h3",null,layer.title.replace(/^\d+\s*·\s*/,"")));
  inspector.append($("p",null,layer.summary||"Explore source-dated members and responsibilities."));
  inspector.append($("div","stake-mini-count",layer.actors.length+" mapped institutions and stakeholders"));
  const lead=$("div","stake-quick-links");
  layer.actors.slice(0,Math.min(layer.actors.length,5)).forEach(a=>{
   const b=$("button","stake-quick");
   b.type="button";b.textContent=a.name;b.addEventListener("click",()=>goActor(a.name));lead.append(b)});
  inspector.append($("h4",null,"Inspect a key actor"),lead);
 }
 function paintActorPanel(a){
  inspector.append($("div","stake-eyebrow","STAKEHOLDER PROFILE"));
  inspector.append($("h3",null,a.name));
  const tag=$("span","stake-role-badge",a.kind+" · "+a.scope);inspector.append(tag);
  inspector.append($("div","stake-person",a.lead||"Leadership to verify"));
  inspector.append($("h4",null,"Responsibility"),$("p",null,a.role||"Role under review"));
  inspector.append($("h4",null,"Decision authority"),$("p",null,a.authority||"Institutional scope; actual mandate must be verified."));
  inspector.append($("div","stake-date","Source reference: "+(a.verified||"undated")+
      " · "+(a.evidence_status||a.verification_status||"Monitor appointment status")));
  if(a.source)inspector.append(panelLink(a.source,"Open dated institutional source ↗"));
  const references=(a.connections||[]).filter(v=>find(v));
  if(references.length){
   inspector.append($("h4",null,"Related stakeholders"));
   const links=$("div","stake-quick-links");
   references.slice(0,6).forEach(v=>{
    const b=$("button","stake-quick",v);b.type="button";b.addEventListener("click",()=>goActor(v));links.append(b);
   });inspector.append(links);
  }
  const back=$("button","stake-action stake-action-ghost","← Back to "+titles[state.group][0]);
  back.type="button";back.addEventListener("click",()=>{state.selected="";draw()});inspector.append(back);
 }
 function paintIssuePanel(r){
  const keys=[
   ["Strategic direction",r.strategic],
   ["Regulator & budget",r.regulators],
   ["Operator / assets",r.operators],
   ["DPR / DPD oversight",r.oversight],
   ["Regional implementation",r.regional]
  ];
  const i=Math.max(0,Math.min(state.issueStep,keys.length-1));
  inspector.append($("div","stake-eyebrow","POLICY ACCOUNTABILITY LENS"));
  inspector.append($("h3",null,r.issue));
  inspector.append($("span","stake-role-badge",(i+1)+" / 5 · "+keys[i][0]));
  inspector.append($("p","stake-issue-read",keys[i][1]));
  const nav=$("div","stake-issue-nav");
  keys.forEach(([label],j)=>{
   const b=$("button","stake-issue-dot",String(j+1));b.type="button";
   if(j===i)b.classList.add("active");b.setAttribute("aria-label","Inspect "+label);
   b.addEventListener("click",()=>{state.issueStep=j;draw()});nav.append(b);
  });inspector.append(nav);
  inspector.append($("h4",null,"SLI analytical test"),$("p",null,r.assessment));
  inspector.append($("p","stake-date","Issue pathway reflects functional responsibilities, not statutory command relationships."));
 }
 function renderDirectory(){
  if(!details.open)return;
  directory.replaceChildren();
  const list=state.mode==="layer"?[{layer:data.layers[state.group],idx:state.group}]:data.layers.map((layer,idx)=>({layer,idx}));
  list.forEach(({layer,idx})=>{
   const group=$("div","stake-dir-group");group.append($("h4",null,layer.title));
   const buttons=$("div","stake-dir-actors");
   layer.actors.forEach(a=>{
    const b=$("button","stake-dir-button",a.name);b.type="button";
    b.addEventListener("click",()=>goActor(a.name));buttons.append(b);
   });
   group.append(buttons);directory.append(group);
  });
 }
 details.addEventListener("toggle",renderDirectory);
 function draw(){
  Object.entries(tabRefs).forEach(([mode,el])=>{
   el.classList.toggle("selected",state.mode===mode);
   el.setAttribute("aria-pressed",String(state.mode===mode));
  });
  groupSelect.value=String(state.group);groupSelect.hidden=state.mode!=="layer";
  issueSelect.value=String(state.issue);issueSelect.hidden=state.mode!=="issue";
  const isOverview=state.mode==="overview";
  const isLayer=state.mode==="layer";
  const isIssue=state.mode==="issue";
  const title=isOverview?"National decision and influence systems":isLayer?
    data.layers[state.group].title.replace(/^\d+\s*·\s*/,""):routes[state.issue]?.issue||"Issue lens";
  plotTitle.replaceChildren($("strong",null,title),$("span",null,isOverview?"6 clickable branches":isLayer?"Select one of "+data.layers[state.group].actors.length+" actor nodes":"Five accountability stages"));
  const svg=createSvg(960,isOverview?560:isIssue?480:640,title);
  if(isOverview)overview(svg,data,i=>{state.mode="layer";state.group=i;state.selected="";draw()});
  if(isLayer)layerGraph(svg,data.layers[state.group],state.group,goActor,()=>{
   state.mode="overview";state.selected="";draw();
  },state.selected);
  if(isIssue&&routes.length)issueGraph(svg,routes,state.issue,i=>{state.issueStep=i;draw()});
  canvas.replaceChildren(svg);
  mobile.replaceChildren();
  const mobileOptions=isOverview?data.layers.map((layer,i)=>({
    label:titles[i].join(" ")+" · "+layer.actors.length,
    go:()=>{state.mode="layer";state.group=i;state.selected="";draw()}
   })):isLayer?data.layers[state.group].actors.map(a=>({
    label:a.name,go:()=>goActor(a.name)
   })):routes.length?[
    ["Strategic direction",0],["Rules / budget",1],["Operators",2],
    ["DPR / DPD oversight",3],["Regional implementation",4]
   ].map(([label,index])=>({label,go:()=>{state.issueStep=index;draw()}})):[];
  mobileOptions.forEach(({label,go})=>{
   const b=$("button","stake-mobile-button",label);b.type="button";
   b.addEventListener("click",go);mobile.append(b);
  });
  inspector.replaceChildren();
  if(isOverview)paintOverviewPanel();
  if(isLayer){
   const a=data.layers[state.group].actors.find(x=>x.name===state.selected);
   if(a)paintActorPanel(a);else paintGroupPanel(data.layers[state.group]);
  }
  if(isIssue)paintIssuePanel(routes[state.issue]);
  zoomHint.textContent=isOverview?"Six hubs only. Click any branch to drill down.":isLayer?
    "All "+data.layers[state.group].actors.length+" actors in this branch • select a node or search across all 54":"Choose a stage for responsibilities and analytical checks";
  legend.replaceChildren();
  if(isOverview)data.layers.forEach((layer,i)=>{
   const b=$("button","stake-legend-key");b.type="button";
   const color=$("span","stake-legend-swatch");color.style.background=palette[i];
   b.append(color,document.createTextNode(titles[i].join(" ")));
   b.addEventListener("click",()=>{state.group=i;state.mode="layer";state.selected="";draw()});legend.append(b);
  });
  if(isLayer){
   const b=$("button","stake-legend-key","← All branches");b.type="button";
   b.addEventListener("click",()=>{state.mode="overview";state.selected="";draw()});legend.append(b);
   legend.append($("span","stake-legend-note","Lines indicate stakeholder membership in the selected influence cluster—not formal reporting."));
  }
  if(isIssue)legend.append($("span","stake-legend-note","DPR and DPD independent scrutiny are shown separately from regulatory / corporate execution."));
  if(details.open)renderDirectory();
 }
 results.hidden=true;draw();
};
})();