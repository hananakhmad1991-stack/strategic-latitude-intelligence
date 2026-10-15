/* SLI Oil & Gas Institutional Explorer — project/PSC relationships, not corporate command hierarchy. */
(function(){
"use strict";
const MOUNT="energyOilGasStakeholdersRoot",NS="http://www.w3.org/2000/svg";let cache=null;
const E=(tag,cls,content)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(content!=null)e.textContent=String(content);return e};
const SVG=(tag,attrs={},content)=>{const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(content!=null)e.textContent=String(content);return e};
const lang=()=>window.SLIi18n?.language==="id"?"id":"en",T=(en,id)=>lang()==="id"?id:en;
const state={group:"all",selected:"SKK Migas",issue:"none",query:""};
function safeLink(url,label){if(typeof url!=="string"||!/^https:\/\//.test(url))return E("span",null,T("Source unavailable","Sumber belum tersedia"));const a=E("a","ogas-link",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a}
function button(text,cls,onClick){const b=E("button",cls,text);b.type="button";b.addEventListener("click",onClick);return b}
function roleText(a){return lang()==="id"?a.summary_id:a.summary_en}
function filtered(data){return data.items.filter(a=>{
 const eligible=state.issue==="none"||data.issues.find(x=>x.id===state.issue)?.route.includes(a.group);
 const category=state.group==="all"||state.group===a.group;
 const q=state.query.trim().toLocaleLowerCase();
 const search=!q||[a.name,a.id_name,a.lead,a.role,a.summary_en,a.summary_id].join(" ").toLocaleLowerCase().includes(q);
 return eligible&&category&&search;
})}
function profile(container,data){
 const actor=data.items.find(x=>x.name===state.selected);
 const panel=E("aside","ogas-profile");panel.setAttribute("aria-live","polite");
 if(!actor){panel.append(E("div","ogas-label",T("Select a stakeholder","Pilih pemangku kepentingan")),E("p",null,T("Select any institution or company to review its legal and commercial role.","Pilih lembaga atau perusahaan untuk melihat kewenangan hukum dan peran komersialnya.")));container.append(panel);return}
 const group=data.groups.find(g=>g.id===actor.group);
 panel.append(E("div","ogas-label",lang()==="id"?group.id_label:group.en));
 panel.append(E("h3",null,lang()==="id"?actor.id_name:actor.name));
 panel.append(E("p","ogas-lead",actor.lead),E("p","ogas-role",roleText(actor)));
 panel.append(E("span","ogas-profile-badge",actor.role));
 const stamp=E("div","ogas-vintage",T("Reference date","Tanggal rujukan")+": "+actor.as_of);
 panel.append(stamp,safeLink(actor.source,T("Open original publication ↗","Buka sumber asli ↗")));
 if(actor.group==="policy"&&(actor.name==="Danantara Indonesia"||actor.name==="BP BUMN"))panel.append(E("p","ogas-caution",T(
  "SOE shareholding and administrative rules are separate from ESDM licensing and SKK Migas contractor oversight.",
  "Hak saham BUMN dan tata kelola administratif berbeda dari izin ESDM serta pengawasan kontraktor SKK Migas.")));
 container.append(panel);
}
function drawFlow(root,data,onPickGroup){
 const graph=E("div","ogas-graph");
 const head=E("div","ogas-graph-head");
 head.append(E("strong",null,T("Functional accountability · click a node","Alur akuntabilitas · klik node")),
   E("span",null,T("Not a universal reporting hierarchy","Bukan satu rantai komando")));
 graph.append(head);
 const svg=SVG("svg",{viewBox:"0 0 920 360",role:"img","aria-label":T("Oil and gas institutional groups, linked by functional interactions","Kelompok pemangku kepentingan migas terhubung melalui interaksi fungsional")});
 svg.append(SVG("title",{},T("Oil and Gas decision-to-delivery network","Jaringan pengambilan keputusan hingga penyaluran migas")));
 svg.append(SVG("rect",{x:0,y:0,width:920,height:360,rx:14,fill:"#0b2234"}));
 const xy=[[153,76],[459,76],[765,76],[153,260],[459,260],[765,260]];
 const coords={};data.groups.forEach((g,i)=>{coords[g.id]=xy[i]});
 const edges=[["policy","upstream"],["policy","downstream"],["upstream","state"],["upstream","private"],["state","downstream"],["private","downstream"],["regions","upstream"],["regions","downstream"]];
 edges.forEach(([a,b])=>{
  const u=coords[a],v=coords[b];if(!u||!v)return;
  const path=SVG("path",{d:"M"+u[0]+" "+u[1]+" Q460 164 "+v[0]+" "+v[1],fill:"none",stroke:"#547891","stroke-width":1.4,opacity:.45,"stroke-dasharray":a==="regions"?"6 5":""});
  svg.append(path);
 });
 data.groups.forEach((g,i)=>{
  const [x,y]=xy[i],active=state.group===g.id||state.issue!=="none"&&data.issues.find(j=>j.id===state.issue)?.route.includes(g.id);
  const node=SVG("g",{role:"button",tabindex:0,"aria-label":T("Open ","Buka ")+(lang()==="id"?g.id_label:g.en)});
  node.style.cursor="pointer";
  node.append(SVG("rect",{x:x-139,y:y-49,width:278,height:98,rx:12,fill:active?"#24445c":"#152d43",stroke:g.color,"stroke-width":active?2.5:1.35}));
  node.append(SVG("rect",{x:x-121,y:y-29,width:5,height:58,rx:2,fill:g.color}));
  const phrase=lang()==="id"?g.id_label:g.en;
  const pieces=phrase.length>33?[phrase.slice(0,33),phrase.slice(33)]:[phrase,""];
  node.append(SVG("text",{x:x-108,y:y-12,fill:"#f1f4f7","font-size":13,"font-family":"system-ui", "font-weight":"700"},pieces[0]));
  if(pieces[1])node.append(SVG("text",{x:x-108,y:y+5,fill:"#f1f4f7","font-size":11,"font-family":"system-ui"},pieces[1]));
  node.append(SVG("text",{x:x-108,y:y+29,fill:g.color,"font-size":11,"font-family":"system-ui"},data.items.filter(a=>a.group===g.id).length+" "+T("entities","entitas")));
  node.append(SVG("title",{},phrase));
  node.addEventListener("click",()=>onPickGroup(g.id));node.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onPickGroup(g.id)}});
  svg.append(node);
 });
 graph.append(svg);
 const note=E("p","ogas-chart-note",T("Links show regulatory, operating, financing or accountability interactions. Danantara ownership does not extend to SKK Migas, BPH Migas or independent BUMS / foreign KKKS.","Garis menunjukkan hubungan regulasi, operasi, pembiayaan, atau pengawasan. Kepemilikan Danantara tidak mencakup SKK Migas, BPH Migas, dan KKKS swasta maupun asing."));
 graph.append(note);root.append(graph);
}
function render(root,data){
 root.replaceChildren();
 const header=E("div","ogas-header");
 header.append(E("div","ogas-overline","OIL & GAS STAKEHOLDER INTELLIGENCE · "+data.as_of));
 header.append(E("h2",null,T("Oil & Gas: Who Regulates, Who Operates?","Migas: Siapa Mengatur, Siapa Mengoperasikan?")));
 header.append(E("p",null,lang()==="id"?data.description_id:data.description_en));
 root.append(header);
 const notes=E("details","ogas-context");
 notes.append(E("summary",null,T("Understanding Danantara, BP BUMN and upstream/downstream jurisdiction","Memahami kewenangan Danantara, BP BUMN, serta hulu dan hilir migas")));
 const nbody=E("div","ogas-context-body");
 (lang()==="id"?data.notes_id:data.notes_en).forEach(x=>nbody.append(E("p",null,x)));
 nbody.append(safeLink(data.reference_sources[0].url,T("Review UU 16/2025 text ↗","Tinjau naskah UU 16/2025 ↗")));
 notes.append(nbody);root.append(notes);
 const controls=E("div","ogas-controls");
 const searchWrap=E("label","ogas-search-label");
 searchWrap.append(E("span",null,T("Find an institution, contractor or person","Cari lembaga, kontraktor, atau nama")));
 const input=E("input","ogas-search");input.type="search";input.value=state.query;input.placeholder=T("SKK Migas, ExxonMobil, Medco, PGN…","SKK Migas, ExxonMobil, Medco, PGN…");input.addEventListener("input",()=>{state.query=input.value;drawResults()});searchWrap.append(input);
 const issueWrap=E("label","ogas-issue-label");issueWrap.append(E("span",null,T("Trace a specific oil & gas issue","Telusuri isu migas khusus")));
 const select=E("select","ogas-issue-select");select.setAttribute("aria-label",T("Select oil gas issue","Pilih isu migas"));
 [{id:"none",en:"All institutional responsibilities",id_label:"Semua hubungan kelembagaan"},...data.issues].forEach(x=>{const opt=E("option",null,lang()==="id"?x.id_label:x.en);opt.value=x.id;select.append(opt)});
 select.value=state.issue;select.addEventListener("change",()=>{state.issue=select.value;state.group="all";drawResults()});issueWrap.append(select);
 controls.append(searchWrap,issueWrap);root.append(controls);
 const categories=E("div","ogas-groups");
 function pick(group){state.group=state.group===group?"all":group;state.query="";input.value="";drawResults()}
 const groupButtons=[];
 [{id:"all",en:"All 27 entities",id_label:"Semua 27 entitas"},...data.groups].forEach(g=>{
  const b=button(lang()==="id"?g.id_label:g.en,"ogas-group-tab",()=>pick(g.id));
  b.setAttribute("aria-pressed",String(state.group===g.id));b.dataset.group=g.id;categories.append(b);groupButtons.push(b);
 });
 root.append(categories);
 const body=E("div","ogas-layout"),visual=E("div","ogas-main"),inspector=E("div","ogas-inspector");
 body.append(visual,inspector);root.append(body);
 function drawResults(){
  visual.replaceChildren();inspector.replaceChildren();
  groupButtons.forEach(b=>{const active=b.dataset.group===state.group;b.classList.toggle("selected",active);b.setAttribute("aria-pressed",String(active))});
  if(!state.query)drawFlow(visual,data,pick);
  const issue=data.issues.find(x=>x.id===state.issue);
  if(issue){
   const insight=E("div","ogas-issue-insight");
   insight.append(E("h3",null,lang()==="id"?issue.id_label:issue.en));
   const ul=E("ul");(lang()==="id"?issue.focus_id:issue.focus).forEach(x=>ul.append(E("li",null,x)));insight.append(ul);visual.append(insight);
  }
  const rows=filtered(data);
  if(!rows.some(x=>x.name===state.selected))state.selected=rows[0]?.name||"";
  const count=E("p","ogas-count",rows.length+" "+T("shown · select one to inspect details","ditampilkan · pilih untuk rincian"));
  visual.append(count);
  const tiles=E("div","ogas-tiles");
  rows.forEach(a=>{
   const item=button(lang()==="id"?a.id_name:a.name,"ogas-tile",()=>{state.selected=a.name;drawResults()});
   item.classList.toggle("selected",state.selected===a.name);item.setAttribute("aria-pressed",String(state.selected===a.name));
   const label=data.groups.find(g=>g.id===a.group);
   item.append(E("span",null,lang()==="id"?label.id_label:label.en));
   tiles.append(item);
  });visual.append(tiles);
  if(!rows.length)visual.append(E("p","ogas-empty",T("No stakeholders match this filter.","Tidak ada entitas sesuai pencarian.")));
  profile(inspector,data);
 }
 drawResults();
 const foot=E("p","ogas-footnote",T("Method: source-dated organization profiles, company disclosures and contract-specific reporting. A signed stake-sale agreement, project FID and completed ownership transfer are distinct events. This is not a live company registry.","Metode: profil kelembagaan bertanggal, keterbukaan perusahaan, dan laporan kontrak spesifik. Penandatanganan jual-beli saham, keputusan investasi final, dan pengalihan kepemilikan selesai adalah peristiwa berbeda. Ini bukan registri perusahaan langsung."));
 root.append(foot);
}
window.initSLIOilGasStakeholders=async function(){
 const root=document.getElementById(MOUNT);if(!root)return;
 root.setAttribute("data-sli-no-translate","");
 if(cache){render(root,cache);return}
 root.replaceChildren(E("p","ogas-empty",T("Loading dedicated Oil & Gas accountability map…","Memuat peta khusus akuntabilitas migas…")));
 try{
  const r=await fetch("data/energy-oil-gas-stakeholders.json",{cache:"no-store"});if(!r.ok)throw Error("dataset unavailable");
  const d=await r.json();if(!Array.isArray(d.items)||d.items.length<20||d.groups?.length!==6)throw Error("incomplete dataset");
  cache=d;render(root,d);
 }catch(err){root.replaceChildren(E("p","ogas-empty",T("The dedicated oil & gas map cannot be loaded at present; the general stakeholder map remains available.","Peta migas khusus sementara tidak dapat dimuat; peta pemangku kepentingan umum tetap tersedia.")))}
};
document.addEventListener("sli:languagechange",()=>{const root=document.getElementById(MOUNT);if(root&&cache)render(root,cache)});
})();
