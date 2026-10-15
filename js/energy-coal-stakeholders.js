/* SLI Coal Stakeholder Intelligence — distinct mining regulation, shareholding, permits and supply links.
   Statutory accountability network is not a chart of direct corporate ownership/reporting. */
(function(){
"use strict";
const ROOT="energyCoalStakeholdersRoot",NS="http://www.w3.org/2000/svg";
let cache=null;
const state={group:"all",issue:"none",selected:"Directorate General of Minerals & Coal",search:""};
const lang=()=>window.SLIi18n?.language==="id"?"id":"en";
const T=(en,id)=>lang()==="id"?id:en;
const E=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=String(txt);return n};
const V=(tag,attr={},txt)=>{const n=document.createElementNS(NS,tag);Object.entries(attr).forEach(([k,v])=>n.setAttribute(k,String(v)));if(txt!=null)n.textContent=String(txt);return n};
const button=(txt,cls,fn)=>{const n=E("button",cls,txt);n.type="button";n.addEventListener("click",fn);return n};
function ext(url,txt){const a=E("a","coal-source",txt);if(!/^https:\/\//.test(url||""))return E("span","coal-note",T("Source unavailable","Sumber tidak tersedia"));a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a}
function truncate(s,n){return s.length>n?s.slice(0,n-1).trim()+"…":s}
function split(s,max){const words=String(s).split(/\s+/);let line1="",line2="";for(const w of words){if(!line1||line1.length+w.length+1<=max)line1+=(line1?" ":"")+w;else line2+=(line2?" ":"")+w}return [truncate(line1,max),truncate(line2,max)]}
function qualifies(a,data){
 if(state.group!=="all"&&a.group!==state.group)return false;
 const route=data.issues.find(x=>x.id===state.issue)?.route;
 if(route&&!route.includes(a.group))return false;
 const q=state.search.trim().toLocaleLowerCase();
 return !q||[a.name,a.id_name,a.lead,a.role,a.summary_en,a.summary_id].join(" ").toLocaleLowerCase().includes(q);
}
function metricCards(root,data){
 const container=E("div","coal-kpis");
 for(const k of data.indicators){
  const card=E("article","coal-kpi");
  card.append(E("div","coal-kpi-label",T(k.label_en,k.label_id)));
  card.append(E("strong","coal-kpi-number",T(k.value_en,k.value_id)));
  card.append(E("p",null,T(k.note_en,k.note_id)));
  card.append(ext(k.source,T("View original source ↗","Lihat sumber asli ↗")));
  container.append(card);
 }
 root.append(container);
 const caveat=E("p","coal-economy-note",T(
  "2025 is the latest fully cited annual baseline here. Coal & lignite GDP is direct value added at current prices (provisional BPS); 2025 PNBP is for the entire mineral-and-coal subsector. Neither is export earnings, corporate turnover or an October 2026 realization.",
  "Tahun 2025 menjadi dasar tahunan lengkap bersumber di modul ini. PDB batubara/lignit adalah nilai tambah harga berlaku (sementara, BPS); PNBP 2025 mencakup seluruh minerba. Keduanya bukan nilai ekspor, omzet, atau realisasi Oktober 2026."));
 root.append(caveat);
}
function flow(root,data,click){
 const frame=E("div","coal-flow");
 const top=E("div","coal-flow-head");
 top.append(E("strong",null,T("Six functional systems · select a group","Enam sistem kelembagaan · pilih kelompok")),
 E("span",null,T("Not direct corporate reporting lines","Bukan garis atasan langsung")));
 frame.append(top);
 const W=960,H=370;
 const svg=V("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":T("Coal sector stakeholder network with six linked functional groups","Jaringan pemangku kepentingan batubara, enam kelompok fungsi")});
 svg.append(V("title",{},T("Coal governance, mining, buyers, revenue and public oversight","Tata kelola, tambang, pembeli, penerimaan, dan pengawasan batubara")));
 svg.append(V("rect",{width:W,height:H,rx:12,fill:"#0b2133"}));
 for(let x=20;x<W;x+=48)svg.append(V("path",{d:"M"+x+" 0 V"+H,stroke:"#37556d","stroke-width":.5,opacity:.14}));
 const pts=[[166,93],[480,93],[794,93],[166,272],[480,272],[794,272]];
 const loc=Object.fromEntries(data.groups.map((g,i)=>[g.id,pts[i]]));
 const links=[["authority","licensing"],["authority","state"],["licensing","private"],["licensing","oversight"],["state","market"],["private","market"],["market","oversight"],["authority","oversight"]];
 links.forEach(([src,dst])=>{
  const a=loc[src],b=loc[dst];if(!a||!b)return;
  svg.append(V("path",{d:"M"+a[0]+" "+a[1]+" Q480 185 "+b[0]+" "+b[1],fill:"none",stroke:"#607f96","stroke-width":1.5,opacity:.38,"stroke-dasharray":src==="oversight"?"5 5":""}));
 });
 data.groups.forEach((g,i)=>{
  const [x,y]=pts[i],current=state.group===g.id;
  const active=current||data.issues.find(z=>z.id===state.issue)?.route.includes(g.id);
  const node=V("g",{role:"button",tabindex:0,"aria-label":T("View ","Lihat ")+(lang()==="id"?g.id_label:g.en)});
  node.style.cursor="pointer";
  node.append(V("rect",{x:x-145,y:y-52,width:290,height:104,rx:13,fill:active?"#294b61":"#152e42",stroke:g.color,"stroke-width":current?2.8:1.5}));
  node.append(V("rect",{x:x-128,y:y-31,width:5,height:62,rx:2,fill:g.color}));
  const [a,b]=split(lang()==="id"?g.id_label:g.en,32);
  node.append(V("text",{x:x-115,y:y-12,fill:"#f7f5ed","font-family":"system-ui","font-size":13,"font-weight":700},a));
  if(b)node.append(V("text",{x:x-115,y:y+6,fill:"#f7f5ed","font-family":"system-ui","font-size":12},b));
  node.append(V("text",{x:x-115,y:y+33,fill:g.color,"font-size":11,"font-family":"system-ui"},data.items.filter(item=>item.group===g.id).length+" "+T("stakeholders","entitas")));
  node.append(V("title",{},lang()==="id"?g.id_label:g.en));
  node.addEventListener("click",()=>click(g.id));
  node.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();click(g.id)}});
  svg.append(node);
 });
 frame.append(svg);
 frame.append(E("p","coal-flow-foot",T("Lines indicate sector relationships, supply dependencies, oversight and contracts. A public company, a BUMN and an IUP/IUPK holder are distinct categories.","Garis menandai hubungan sektoral, ketergantungan pasokan, pengawasan dan kontrak. Emiten terbuka, BUMN, dan pemegang IUP/IUPK tidak selalu sama.")));
 root.append(frame);
}
function profile(root,data){
 const a=data.items.find(x=>x.name===state.selected);
 const aside=E("aside","coal-profile");aside.setAttribute("aria-live","polite");
 if(!a){aside.append(E("p",null,T("Select an actor to inspect its mandate.","Pilih entitas untuk melihat mandatnya.")));root.append(aside);return}
 const category=data.groups.find(g=>g.id===a.group);
 aside.append(E("div","coal-overline",lang()==="id"?category.id_label:category.en));
 aside.append(E("h3",null,lang()==="id"?a.id_name:a.name));
 aside.append(E("p","coal-profile-lead",a.lead));
 aside.append(E("span","coal-role",a.role));
 aside.append(E("p","coal-profile-description",lang()==="id"?a.summary_id:a.summary_en));
 aside.append(E("div","coal-profile-date",T("Reference vintage","Tanggal rujukan")+": "+a.as_of));
 aside.append(ext(a.source,T("Open original institutional / corporate source ↗","Buka sumber asli lembaga/perusahaan ↗")));
 if(["Danantara Indonesia — SOE investment","BP BUMN — strategic SOE rights","Directorate General of Minerals & Coal"].includes(a.name)){
  aside.append(E("p","coal-profile-boundary",T("Regulatory licences, shareholder control, and actual mine operations remain distinct responsibilities.","Izin regulasi, pengendalian pemegang saham dan pengoperasian tambang memiliki tanggung jawab yang berbeda.")));
 }
 root.append(aside);
}
function render(root,data){
 root.replaceChildren();
 const head=E("header","coal-header");
 head.append(E("div","coal-overline",T(data.title_en,data.title_id)+" · "+data.as_of));
 head.append(E("h2",null,T("Coal: Who Regulates, Who Mines, Who Buys?","Batubara: Siapa Mengatur, Menambang, dan Membeli?")));
 head.append(E("p",null,T(data.description_en,data.description_id)));
 root.append(head);
 metricCards(root,data);
 const context=E("details","coal-context");
 context.append(E("summary",null,T("Institutional boundaries, DMO and GDP methodology","Batas kewenangan, DMO dan metode PDB")));
 const contextBody=E("div","coal-context-inner");
 (lang()==="id"?data.notes_id:data.notes_en).forEach(x=>contextBody.append(E("p",null,x)));
 for(const ref of data.reference_sources.slice(0,3))contextBody.append(ext(ref.url,ref.label+" ↗"));
 context.append(contextBody);root.append(context);
 const controls=E("div","coal-controls"),searchWrap=E("label","coal-input-box"),issueWrap=E("label","coal-input-box");
 searchWrap.append(E("span",null,T("Search company, regulator or person","Cari perusahaan, regulator, atau pejabat")));
 const search=E("input","coal-search");search.type="search";search.value=state.search;search.placeholder=T("Tri Winarno, KPC, PTBA, PLN EPI…","Tri Winarno, KPC, PTBA, PLN EPI…");
 search.addEventListener("input",()=>{state.search=search.value;draw()});searchWrap.append(search);
 issueWrap.append(E("span",null,T("Track a coal policy or commercial issue","Telusuri isu kebijakan atau komersial batubara")));
 const selector=E("select","coal-issue");selector.setAttribute("aria-label",T("Coal issue lens","Fokus isu batubara"));
 [{id:"none",en:"All coal stakeholder issues",id_label:"Semua isu batubara"},...data.issues].forEach(o=>{const opt=E("option",null,T(o.en,o.id_label));opt.value=o.id;selector.append(opt)});
 selector.value=state.issue;
 selector.addEventListener("change",()=>{state.issue=selector.value;state.group="all";state.search="";search.value="";draw()});
 issueWrap.append(selector);controls.append(searchWrap,issueWrap);root.append(controls);
 const categories=E("div","coal-categories"),buttons=[];
 const pick=group=>{state.group=state.group===group?"all":group;state.search="";state.issue="none";search.value="";selector.value="none";draw()};
 for(const g of [{id:"all",en:"All "+data.items.length+" stakeholders",id_label:"Semua "+data.items.length+" entitas"},...data.groups]){
  const b=button(T(g.en,g.id_label),"coal-category",()=>pick(g.id));
  b.dataset.group=g.id;b.setAttribute("aria-pressed",String(state.group===g.id));categories.append(b);buttons.push(b);
 }
 root.append(categories);
 const layout=E("div","coal-layout"),main=E("div","coal-main"),side=E("div","coal-side");layout.append(main,side);root.append(layout);
 function draw(){
  main.replaceChildren();side.replaceChildren();
  for(const b of buttons){const active=b.dataset.group===state.group;b.classList.toggle("selected",active);b.setAttribute("aria-pressed",String(active))}
  if(!state.search)flow(main,data,pick);
  const issue=data.issues.find(z=>z.id===state.issue);
  if(issue){
   const ins=E("section","coal-issue-card");ins.append(E("h3",null,T(issue.en,issue.id_label)));
   const list=E("ul");(lang()==="id"?issue.focus_id:issue.focus).forEach(x=>list.append(E("li",null,x)));
   ins.append(list);main.append(ins);
  }
  const shown=data.items.filter(x=>qualifies(x,data));
  if(!shown.some(x=>x.name===state.selected))state.selected=shown[0]?.name||"";
  main.append(E("p","coal-count",shown.length+" "+T("stakeholders shown · click to inspect","entitas ditampilkan · klik untuk detail")));
  const tiles=E("div","coal-tiles");
  for(const a of shown){
   const chip=button(lang()==="id"?a.id_name:a.name,"coal-tile",()=>{state.selected=a.name;draw()});
   chip.classList.toggle("selected",state.selected===a.name);
   chip.setAttribute("aria-pressed",String(state.selected===a.name));
   const g=data.groups.find(x=>x.id===a.group);
   chip.append(E("span",null,lang()==="id"?g.id_label:g.en));tiles.append(chip);
  }
  main.append(tiles);
  if(!shown.length)main.append(E("p","coal-empty",T("No actors match the selected criteria.","Tidak ada entitas sesuai filter ini.")));
  profile(side,data);
 }
 draw();
 root.append(E("p","coal-method-note",T(
  "Editorial snapshot (15 Oct 2026). Legal permits and corporate shareholding vary by company and date; the map cannot certify actual 2026 coal deliveries or current mine output. Official statistical years are displayed separately from the mapping date.",
  "Potret editorial (15 Okt 2026). Perizinan dan pemegang saham berbeda menurut perusahaan/tanggal; peta tidak otomatis memverifikasi pengiriman atau produksi batubara 2026. Tahun data statistik dibedakan dari tanggal pemetaan.")));
}
window.initSLICoalStakeholders=async function(){
 const root=document.getElementById(ROOT);if(!root)return;
 root.setAttribute("data-sli-no-translate","");
 if(cache){render(root,cache);return}
 root.replaceChildren(E("p","coal-empty",T("Loading Coal Stakeholder Intelligence…","Memuat Coal Stakeholder Intelligence…")));
 try{
  const r=await fetch("data/energy-coal-stakeholders.json",{cache:"no-store"});if(!r.ok)throw Error("Data missing");
  const d=await r.json();
  if(!Array.isArray(d.items)||d.items.length<35||d.groups?.length!==6||d.indicators?.length!==4||d.issues?.length<5)throw Error("Dataset incomplete");
  cache=d;render(root,d);
 }catch(e){root.replaceChildren(E("p","coal-empty",T("Coal stakeholder data could not be loaded; the national energy stakeholder map remains available.","Peta batubara belum dapat dimuat; peta stakeholder energi nasional tetap tersedia.")))}
};
document.addEventListener("sli:languagechange",()=>{const root=document.getElementById(ROOT);if(root&&cache)render(root,cache)});
})();
