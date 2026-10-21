/* SLI cross-sector officeholder hierarchy · official-source dated.
 * Separate statutory ministry units from cross-agency and corporate ties.
 * Shared ministry roster is referenced from five sectors, never copied.
 */
(function(){
"use strict";
const path="./data/sli-cross-sector-official-leadership-2026.json?v=20261021-official-officeholders3";
const site=()=>document.documentElement.lang?.toLowerCase().startsWith("en")??true;
const T=(id,en)=>site()?en:id;
const E=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e};
const urlOK=url=>/^https:\/\/[a-z\d.-]+(?:\/|$)/i.test(String(url||""));
const link=(url,text)=>{const a=E("a","sli-ministry-source",text);if(urlOK(url)){a.href=url;a.rel="noopener noreferrer";a.target="_blank"}return a};
const agencyIcon=ag=>{
 const icon=E("span","sli-ministry-agency-icon");
 icon.title=T("Ikon situs instansi; belum tentu logo resmi.","Agency website icon; not a verified institutional emblem.");
 const asset=ag?.logo?.verified===true?ag.logo.url:ag?.icon?.kind==="official-site-favicon"?ag.icon.src:null;
 if(asset&&urlOK(asset)){
  const img=E("img","sli-ministry-site-icon");img.src=asset;img.alt="";
  img.width=34;img.height=34;img.loading="lazy";img.referrerPolicy="no-referrer";
  img.addEventListener("error",()=>img.replaceWith(E("span","sli-ministry-icon-fallback",(ag?.name||"?").slice(0,2).toUpperCase())),{once:true});
  icon.append(img);
 }else icon.append(E("span","sli-ministry-icon-fallback",(ag?.name||"?").slice(0,2).toUpperCase()));
 return icon;
};

function validateRegistry(d){
 const issues=[];
 if(d?.schema!=="sli-cross-sector-official-leadership-v2"||!d.as_of)issues.push("schema");
 const agencies=d?.agencies||{},sectors=d?.sectors||{};
 for(const key of ["food","energy","minerals","ai","investment","macro","policy","geo","environment","entities","provincial"])if(!sectors[key]?.agencies?.length)issues.push("sector:"+key);
 for(const [id,ag]of Object.entries(agencies)){
  if(!urlOK(ag.source)||!urlOK(ag.website)||!Array.isArray(ag.nodes)||!ag.nodes.length)issues.push("agency:"+id);
  const ids=new Set(ag.nodes.map(n=>n.id));if(ids.size!==ag.nodes.length)issues.push("duplicate_office:"+id);
  if(!ids.has("m")||ag.nodes.filter(n=>["minister","head"].includes(n.tier)).length!==1)issues.push("leadership:"+id);
  if(ag.institutional_class==="independent-central-bank"&&ag.nodes.some(n=>n.tier==="minister"||n.tier==="deputy"))issues.push("independent_bank_hierarchy:"+id);
  if(ag.institutional_class==="line-ministry"&&ag.nodes.some(n=>["head","deputy-head"].includes(n.tier)))issues.push("ministry_role_mismatch:"+id);
  for(const n of ag.nodes){
   if(!n.office_id||!n.office_en||!urlOK(n.source)||!n.checked_on||!n.verification||!["minister","deputy","head","deputy-head","support","oversight","directorate","agency","internal","deputy-agency"].includes(n.tier))issues.push("node:"+id+"/"+n.id);
   if(n.parent&&!ids.has(n.parent))issues.push("parent:"+id+"/"+n.id);if(n.id!=="m"&&!n.parent)issues.push("orphan:"+id+"/"+n.id);if(n.id==="m"&&n.parent)issues.push("root_parent:"+id);
   if(n.person===null&&n.verification!=="unverified_officeholder")issues.push("false_appointment:"+id+"/"+n.id);if(n.person&&n.verification==="unverified_officeholder")issues.push("unsupported_named_officer:"+id+"/"+n.id);
  }
 }
 for(const [k,sector]of Object.entries(sectors))for(const id of sector.agencies||[])if(!agencies[id])issues.push("missing agency:"+k+"/"+id);
 return{pass:issues.length===0,issues};
}
window.validateSLISectorLeadership=validateRegistry;
const mounts=[
 {sector:"food",selector:"#fa-hierarchy"},
 {sector:"energy",selector:"#energyGovernanceRoot"},
 {sector:"minerals",selector:"#minerals-command-hierarchy"},
 {sector:"ai",selector:"#ai-command-hierarchy"},
 {sector:"ai",selector:"#sliAiInfrastructureHierarchy"},
 {sector:"investment",selector:"#sliSourceInvestmentRoot"}
];
let dbPromise=null;
const state=new Map();
function fetchRegistry(){
 if(dbPromise)return dbPromise;
 dbPromise=fetch(path,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Leadership registry HTTP "+r.status);return r.json()}).then(async d=>{
   if(validateRegistry(d).pass)return d;
   // GitHub main can lag behind PR or deployment; only use same-origin valid data.
   const response=await fetch(path,{cache:"no-store",sliLocalOnly:true});
   if(!response.ok)throw Error("No local ministry roster");
   const local=await response.json(),result=validateRegistry(local);
   if(!result.pass)throw Error(result.issues.join(", "));
   return local;
 }).catch(e=>{dbPromise=null;throw e});
 return dbPromise;
}
function build(host,sector,d){
 host.replaceChildren();const st=state.get(sector)||{agency:"all",selected:null,q:"",expanded:new Set()};
 state.set(sector,st);
 const config=d.sectors[sector],agencyIds=config.agencies,people=agencyIds.flatMap(id=>d.agencies[id].nodes.map(n=>({...n,agencyId:id})));
 if(!st.selected||!people.some(n=>st.selected===n.agencyId+":"+n.id))st.selected=people[0].agencyId+":"+people[0].id;
 const shell=E("section","sli-ministry-section");
 const heading=E("div","sli-ministry-heading");
 heading.append(E("div","sli-ministry-overline","SLI / INSTITUTIONAL LEADERSHIP"));
 heading.append(E("h3","",T("Pimpinan, Wamen/Wakil Kepala, Sekjen, Irjen & Unit Teknis","Institutional Heads, Deputies, Secretaries, Inspectors & Technical Offices")));
 heading.append(E("p","",T("Peta kementerian, badan dan lembaga independen berdasarkan sumber resmi (21 Oktober 2026). Kaitan antarinstansi bukan garis komando; Bank Indonesia independen.","Source-dated ministries, agencies and independent institutions reviewed 21 October 2026. Cross-agency links do not establish command; Bank Indonesia is independent.")));
 shell.append(heading);
 const tools=E("div","sli-ministry-tools");
 const select=E("select",""),query=E("input","");query.type="search";query.placeholder=T("Cari pejabat, wamen, dirjen, irjen…","Find ministers, DGs and inspectors…");query.setAttribute("aria-label",T("Cari jabatan dan pejabat","Search officeholders"));
 const all=E("option","",T("Semua instansi terkait","All related agencies"));all.value="all";select.append(all);
 for(const id of agencyIds){const opt=E("option","",d.agencies[id].name);opt.value=id;select.append(opt)}
 select.value=st.agency;query.value=st.q;
 const expand=E("button","",T("Buka semua","Expand all")),collapse=E("button","",T("Tutup semua","Collapse all"));expand.type=collapse.type="button";
 tools.append(select,query,expand,collapse);shell.append(tools);
 const stats=E("div","sli-ministry-count",T(people.length+" jabatan · "+people.filter(n=>n.person).length+" nama terverifikasi",people.length+" offices · "+people.filter(n=>n.person).length+" named leaders"));
 shell.append(stats);
 const coverage=E("p","sli-ministry-warning",T("Cakupan: jabatan yang telah berhasil dipetakan, bukan seluruh instansi/pejabat pemerintah. Baris dengan nama kosong sengaja tidak diisi tanpa verifikasi.","Coverage: offices currently mapped, NOT a census of all government agencies or officeholders. Missing names remain unfilled until verified."));
 shell.append(coverage);
 const layout=E("div","sli-ministry-layout"),left=E("div","sli-ministry-tree"),inspector=E("aside","sli-ministry-inspector");inspector.setAttribute("aria-live","polite");
 layout.append(left,inspector);shell.append(layout);
 const note=E("p","sli-ministry-warning",T(config.note_id,config.note_en)+" "+T("Nama kosong berarti belum diverifikasi, bukan jabatan dihapus. Sumber bertanggal tidak selalu menjamin belum ada pergantian setelah tanggal itu.","Missing names mean unverified, not that the post was abolished. Dated sources do not establish that no later appointment occurred."));
 shell.append(note);host.append(shell);
 const agencyFor=id=>d.agencies[id];
 const record=(agency,id)=>agencyFor(agency)?.nodes.find(n=>n.id===id);
 function inspect(){
  inspector.replaceChildren();const [a,id]=st.selected.split(":");const ag=agencyFor(a),n=record(a,id);if(!ag||!n)return;
  inspector.append(E("small","sli-ministry-kicker",T("PROFIL PEJABAT · SUMBER RESMI","OFFICEHOLDER · OFFICIAL SOURCE")));
  const brand=E("div","sli-ministry-inspector-brand");brand.append(agencyIcon(ag));const title=E("h4","",T(n.office_id,n.office_en));brand.append(title);inspector.append(brand);
  inspector.append(E("p","sli-ministry-entity",ag.name));
  inspector.append(E("p","sli-ministry-icon-note",T("Ikon situs institusi (favicon), bukan logo yang telah tersertifikasi.","Agency website favicon, not a certified institutional logo.")));
  inspector.append(E("strong","sli-ministry-person",n.person||T("Nama belum terverifikasi","Officeholder not verified")));
  inspector.append(E("p","sli-ministry-check",T("Status sumber: ","Source status: ")+n.verification+" · "+n.checked_on));
  inspector.append(E("p","",T(n.mandate_id,n.mandate_en)||n.mandate_id));
  inspector.append(link(n.source,T("Verifikasi jabatan dari sumber resmi ↗","Verify officeholder on official source ↗")));
  inspector.append(link(ag.source,T("Struktur dan mandat lembaga ↗","Agency organization and mandate ↗")));
  if(!n.person)inspector.append(E("p","sli-ministry-alert",T("Sumber struktur ada, tetapi belum ada verifikasi nama pejabat untuk posisi ini.","Institutional role sourced; the current individual has not been verified.")));
  if(n.verification==="acting_appointment")inspector.append(E("p","sli-ministry-alert",T("Pelaksana tugas (Plt.), bukan pejabat definitif.","Acting (Plt.) officeholder, not confirmed as substantive incumbent.")));
 }
 function card(agency,n){
  const b=E("button","sli-ministry-node"+(st.selected===agency+":"+n.id?" selected":""));
  b.type="button";b.setAttribute("aria-pressed",String(st.selected===agency+":"+n.id));
  const top=E("span","sli-ministry-node-line");
  const line=E("span","sli-ministry-officer-head");line.append(agencyIcon(agencyFor(agency)));line.append(E("strong","",T(n.office_id,n.office_en)));top.append(line);
  top.append(E("small","sli-ministry-badge",n.tier==="minister"?"MENTERI":n.tier==="deputy"?"WAMEN":n.tier==="head"?"KEPALA / GUBERNUR":n.tier==="deputy-head"?"WAKIL KEPALA":n.tier==="oversight"?"PENGAWAS":n.tier==="support"?"SEKRETARIAT":"ESELON"));
  b.append(top);b.append(E("span","sli-ministry-name",n.person||T("Belum diverifikasi","Unverified")));
  b.addEventListener("click",()=>{st.selected=agency+":"+n.id;draw()});
  return b;
 }
 const matches=n=>!st.q||[n.office_id,n.office_en,n.person||"",n.id].join(" ").toLowerCase().includes(st.q.trim().toLowerCase());
 function draw(){
  left.replaceChildren();
  const president=E("div","sli-ministry-president");
  president.append(E("small","",T("KONTEKS NEGARA · BUKAN SEMUA GARIS KOMANDO","NATIONAL CONTEXT · NOT UNIVERSAL COMMAND")),E("strong","",T("Tata Kelola Institusi Indonesia","Indonesian Institutional Governance")),E("span","",T("Presiden: "+d.president.name+" · Bank Indonesia independen.","President: "+d.president.name+" · Bank Indonesia is independent.")));
  left.append(president);
  const list=E("div","sli-ministry-agencies");
  for(const id of agencyIds){
   if(st.agency!=="all"&&st.agency!==id)continue;
   const ag=d.agencies[id],relevant=ag.nodes.filter(n=>matches(n)||ag.nodes.some(c=>c.parent===n.id&&matches(c)));
   if(st.q&&!relevant.length)continue;
   const group=E("section","sli-ministry-agency");
   const agencyTitle=E("div","sli-ministry-agency-name");agencyTitle.append(agencyIcon(ag));agencyTitle.append(E("span","",ag.name+(ag.institutional_class==="independent-central-bank"?T(" · Independen"," · Independent"):"")));group.append(agencyTitle);
   const leader=ag.nodes.find(n=>["minister","head"].includes(n.tier));if(leader)group.append(card(id,leader));
   const children=E("div","sli-ministry-deputies");
   for(const n of ag.nodes.filter(n=>["deputy","deputy-head"].includes(n.tier)&&matches(n)))children.append(card(id,n));
   group.append(children);
   const items=ag.nodes.filter(n=>!["minister","deputy","head","deputy-head","internal"].includes(n.tier)&&matches(n));
   const internal=ag.nodes.filter(n=>n.tier==="internal");
   const toggle=E("button","sli-ministry-expand",st.expanded.has(id)?T("Tutup unit teknis −","Collapse technical offices −"):T("Buka Sekjen, Irjen & unit teknis +","Expand secretariat, audit and technical offices +"));
   toggle.type="button";toggle.setAttribute("aria-expanded",String(st.expanded.has(id)||!!st.q));
   toggle.addEventListener("click",()=>{st.expanded.has(id)?st.expanded.delete(id):st.expanded.add(id);draw()});
   group.append(toggle);
   if(st.expanded.has(id)||st.q){
    const rows=E("div","sli-ministry-units");
    for(const n of items){
     const unit=E("div","sli-ministry-unit");unit.append(card(id,n));
     const lower=internal.filter(x=>x.parent===n.id&&matches(x));
     if(lower.length){
      const more=E("button","sli-ministry-subtoggle",st.expanded.has(id+":"+n.id)?T("Tutup unit −","Collapse lower offices −"):T("Lihat unit internal +","View internal offices +"));
      more.type="button";more.addEventListener("click",()=>{st.expanded.has(id+":"+n.id)?st.expanded.delete(id+":"+n.id):st.expanded.add(id+":"+n.id);draw()});
      unit.append(more);
      if(st.expanded.has(id+":"+n.id)){const sub=E("div","sli-ministry-internal");for(const low of lower)sub.append(card(id,low));unit.append(sub)}
     }
     rows.append(unit);
    }
    group.append(rows);
   }
   list.append(group);
  }
  left.append(list);inspect();
 }
 select.addEventListener("change",()=>{st.agency=select.value;st.selected=(st.agency==="all"?agencyIds[0]:st.agency)+":m";draw()});
 query.addEventListener("input",()=>{st.q=query.value;draw()});
 expand.addEventListener("click",()=>{for(const id of agencyIds){st.expanded.add(id);for(const n of agencyFor(id).nodes)if(n.tier!=="internal")st.expanded.add(id+":"+n.id)}draw()});
 collapse.addEventListener("click",()=>{st.expanded.clear();draw()});
 draw();
}
let pending=false;
function hydrate(){
 pending=false;
 const direct=document.querySelectorAll("[data-sli-ministry-sector]");
 for(const target of direct){
  const sector=target.dataset.sliMinistrySector;
  if(target.dataset.sliMinistryAttached==="1")continue;
  target.dataset.sliMinistryAttached="1";
  target.textContent=T("Memuat daftar pejabat bersumber resmi…","Loading verified officeholder hierarchy…");
  fetchRegistry().then(d=>{if(target.isConnected&&d.sectors[sector])build(target,sector,d)}).catch(err=>{if(target.isConnected)target.textContent=T("Registri institusi belum tersedia.","Institutional roster unavailable.");console.error("[SLI leadership]",err)});
 }
 for(const def of mounts){
  const target=document.querySelector(def.selector);if(!target||target.dataset.sliMinistryAttached==="1")continue;
  target.dataset.sliMinistryAttached="1";
  const parent=target.parentNode;if(!parent)continue;
  const host=E("div","sli-ministry-mount");host.dataset.sliSector=def.sector;
  target.before(host);host.textContent=T("Memuat daftar pejabat bersumber resmi…","Loading verified officeholder hierarchy…");
  fetchRegistry().then(d=>{if(host.isConnected)build(host,def.sector,d)}).catch(err=>{if(host.isConnected)host.textContent=T("Registri pejabat belum tersedia.","Officeholder register is unavailable.");console.error("[SLI leadership]",err)});
 }
}
function schedule(){if(pending)return;pending=true;queueMicrotask(hydrate)}
function start(){
 schedule();document.addEventListener("sli:pagechange",schedule);
 document.addEventListener("sli:languagechange",()=>{for(const h of document.querySelectorAll(".sli-ministry-mount")){fetchRegistry().then(d=>{if(h.isConnected)build(h,h.dataset.sliSector,d)}).catch(()=>{})}});
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
