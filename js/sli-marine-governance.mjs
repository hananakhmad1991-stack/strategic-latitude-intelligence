/* SLI Marine 2026 · verified hierarchy and evidence-linked functional network */
const DATA_URL=new URL("../data/sli-marine-governance.json?v=20261021-officers-v2",import.meta.url);
const KKP_ICON="https://ptsp.kkp.go.id/assets/out/images/logo385.png";
const https=s=>typeof s==="string"&&/^https:\/\/[^<>\s]+$/.test(s);
export function validateMarineGovernance(data){
 const issues=[],hierarchy=Array.isArray(data?.hierarchy)?data.hierarchy:[],actors=Array.isArray(data?.actors)?data.actors:[],groups=Array.isArray(data?.groups)?data.groups:[],ids=new Set();
 if(data?.schema!=="sli-marine-governance-v2"||!data?.as_of)issues.push("schema");
 for(const x of [...hierarchy,...actors]){
  if(!x.id||ids.has(x.id)||!x.label_id||!x.label_en||!x.role_id||!x.role_en||!https(x.source))issues.push("invalid_actor");
  ids.add(x.id);
  if(x.officeholder&&(!x.officeholder.name||!https(x.officeholder.source)||!x.officeholder.checked_on))issues.push("invalid_officeholder");
 }
 if(hierarchy.length<30||hierarchy.filter(x=>x.parent===null).length!==1)issues.push("hierarchy_incomplete");
 const official=new Set(hierarchy.map(x=>x.id));
 for(const x of hierarchy){if(x.parent!==null&&!official.has(x.parent))issues.push("invalid_parent");let y=x,seen=new Set();while(y?.parent){if(seen.has(y.id)){issues.push("cycle");break}seen.add(y.id);y=hierarchy.find(z=>z.id===y.parent)}}
 if(!official.has("djprl")||!official.has("djpkel")||!official.has("wamen")||!official.has("minister"))issues.push("outdated_directorates");
 if(data.hierarchy.find(x=>x.id==="wamen")?.officeholder?.name!=="Irwan Meilano")issues.push("outdated_deputy_minister");
 if(groups.length!==6||new Set(groups.map(x=>x.id)).size!==6)issues.push("invalid_hubs");
 for(const g of groups){if(!g.label_id||!g.label_en||!g.issue_id||!g.issue_en||!g.actor_ids?.length)issues.push("hub_content");for(const id of g.actor_ids||[])if(!ids.has(id))issues.push("unknown_actor")}
 if(!data.presentation?.functional_network_not_command)issues.push("mandate_warning");
 if(!https(data.emblem?.url)||!https(data.emblem?.source))issues.push("unverified_logo");
 return {pass:issues.length===0,issues,organizations:hierarchy.length,verified_people:hierarchy.filter(x=>x.officeholder).length};
}
const $=id=>document.getElementById(id);
const en=()=>document.documentElement.lang.toLowerCase().startsWith("en");
const T=(id,english)=>en()?english:id;
const E=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=String(txt);return x};
const sourced=(url,label)=>{const a=E("a","mf-gov-link",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
const dataById=(d,id)=>[...d.hierarchy,...d.actors].find(x=>x.id===id);
function logoOrIcon(x,d){
 const box=E("span","mf-institution-emblem");
 const isKkp=d.hierarchy.some(n=>n.id===x.id);
 if(isKkp&&x.id!=="president"){const img=E("img");img.src=d.emblem?.url||KKP_ICON;img.alt="KKP";img.loading="lazy";img.referrerPolicy="no-referrer";img.addEventListener("error",()=>img.replaceWith(E("span","",x.id==="president"?"RI":"KKP")),{once:true});box.append(img)}
 else box.append(E("span","",x.id.toUpperCase().slice(0,3)));
 return box;
}
function card(d,x,selected,click,compact=false){
 const b=E("button","mf-gov-node"+(compact?" mf-gov-node--small":""),undefined);b.type="button";b.dataset.mfEntity=x.id;
 b.setAttribute("aria-pressed",String(selected===x.id));
 const lead=E("span","mf-gov-node-main");lead.append(logoOrIcon(x,d));
 const words=E("span","mf-gov-node-content");
 words.append(E("strong","",T(x.label_id,x.label_en)));
 if(x.officeholder)words.append(E("small","mf-gov-officeholder",x.officeholder.name));
 lead.append(words);b.append(lead);
 b.addEventListener("click",()=>click(x.id));return b;
}
function profile(d,id,host,hub=null){
 if(!host)return;host.replaceChildren();const x=dataById(d,id);if(!x)return;
 host.append(E("div","mf-gov-profile-eyebrow",T(hub?"JEJARING · PROFIL LEMBAGA":"HIERARKI · PROFIL LEMBAGA",hub?"NETWORK · INSTITUTION PROFILE":"HIERARCHY · INSTITUTION PROFILE")));
 if(hub)host.append(E("div","mf-gov-breadcrumb",T(hub.label_id,hub.label_en)));
 const row=E("div","mf-gov-profile-heading");row.append(logoOrIcon(x,d));row.append(E("h4","",T(x.label_id,x.label_en)));host.append(row);
 const officer=x.officeholder;
 if(officer){
  host.append(E("h5","mf-gov-person",officer.name));
  host.append(E("p","mf-gov-check",T("Pejabat · verifikasi sumber resmi: ","Officeholder · official source review: ")+(officer.checked_on||d.as_of)));
  if(officer.acting)host.append(E("p","mf-gov-review-note",T("Status pelaksana tugas masih memerlukan konfirmasi terpisah.","Acting appointment status requires separate confirmation.")));
  host.append(sourced(officer.source,T("Verifikasi pejabat ↗","Verify officeholder ↗")));
 }else host.append(E("p","mf-gov-review-note",T("Pejabat belum terverifikasi; nama tidak ditampilkan.","Officeholder not verified; name deliberately withheld.")));
 host.append(E("p","mf-gov-role",T(x.role_id,x.role_en)));
 if(x.sector_contact){host.append(E("h5","mf-gov-mates-heading",T("Kontak teknis sektoral","Sector policy counterpart")));host.append(E("p","",x.sector_contact.name+" · "+x.sector_contact.role));host.append(sourced(x.sector_contact.source,T("Direktori resmi ↗","Official directory ↗")))}
 const status=E("div","mf-gov-source-box");
 status.append(E("strong","",T("Mandat dan sumber resmi","Mandate and primary source")));
 status.append(sourced(x.source,T("Periksa dokumen lembaga ↗","Open institutional evidence ↗")));
 host.append(status);
 if(hub){
  host.append(E("h5","mf-gov-mates-heading",T("Koneksi fungsional","Functional accountability links")));
  host.append(E("p","mf-gov-hub-explain",T(hub.issue_id,hub.issue_en)));
  const ul=E("ul","mf-gov-linked-list");
  for(const other of hub.actor_ids.filter(z=>z!==id)){const n=dataById(d,other);if(n)ul.append(E("li","",T(n.label_id,n.label_en)))}
  host.append(ul);
  host.append(E("p","mf-gov-review-note",T("Keterkaitan tidak menyiratkan hubungan atasan-bawahan, kontrak, atau perintah hukum.","Links do not imply subordination, contractual relationship or statutory instruction.")));
 }
}
const family=x=>x==="directorate"?"direction":"support";
function renderHierarchy(d,state){
 const root=$("mfHierarchyDiagram");if(!root)return;root.replaceChildren();
 const q=state.query.toLocaleLowerCase("id").trim(),lane=state.lane;
 const matching=x=>!q||[x.label_id,x.label_en,x.role_id,x.officeholder?.name||""].some(v=>v.toLocaleLowerCase("id").includes(q));
 const childSet=d.hierarchy.filter(x=>x.level==="internal");
 const matchUnit=p=>childSet.some(x=>x.parent===p&&matching(x));
 const lanes=[
  {id:"direction",idTitle:"01 · Direktorat teknis & pengawasan",enTitle:"01 · Technical directorates & surveillance"},
  {id:"support",idTitle:"02 · Manajemen, audit & kualitas",enTitle:"02 · Management, audit & capability"}
 ];
 function appendCard(host,x,compact=false){host.append(card(d,x,state.selectedHierarchy,id=>{state.selectedHierarchy=id;renderHierarchy(d,state)},compact))}
 const introduction=E("div","mf-gov-intro");introduction.append(E("strong","",T("Struktur tata kelola kelautan dan perikanan nasional","National marine and fisheries governance structure")));
 introduction.append(E("p","",T("Mulai dari Presiden dan Menteri, lalu telusuri Ditjen, badan dan unit kerja. Peta ini menggambarkan struktur internal KKP, bukan hierarki seluruh kementerian atau BUMN.","Start with the President and Minister, then inspect directorates, agencies and internal offices. This is KKP's internal structure, not the hierarchy of all ministries or enterprises.")));
 root.append(introduction);
 const executive=E("div","mf-gov-executive");
 for(const id of ["president","kkp","minister","wamen"]){const x=dataById(d,id);const group=E("div","mf-gov-executive-cell");group.append(E("div","mf-gov-level",id==="president"?"LEVEL 0 · "+T("ARAH NASIONAL","NATIONAL DIRECTION"):id==="kkp"?"LEVEL 1 · KKP":id==="minister"?"LEVEL 2 · "+T("MENTERI","MINISTER"):"LEVEL 2 · "+T("WAKIL MENTERI","DEPUTY MINISTER")));appendCard(group,x);executive.append(group)}
 root.append(executive);
 const columns=E("div","mf-gov-lanes");
 for(const v of lanes){
  if(lane!=="all"&&lane!==v.id)continue;
  const col=E("section","mf-gov-lane");col.append(E("h5","",T(v.idTitle,v.enTitle)));
  let visible=0;
  for(const x of d.hierarchy.filter(n=>n.parent==="minister"&&n.level==="directorate"&&family(n.id==="setjen"||n.id==="itjen"||n.id==="bppsdm"||n.id==="bppmhkp"?"support":"directorate")===v.id)){
   if(!matching(x)&&!matchUnit(x.id))continue;
   visible++;
   const section=E("div","mf-gov-unit-block");const main=E("div","mf-gov-unit-main");
   appendCard(main,x);
   const children=childSet.filter(n=>n.parent===x.id);
   if(children.length){
    const toggle=E("button","mf-gov-expand",state.expanded.has(x.id)?T("Tutup unit −","Collapse −"):T("Buka unit +","Expand +"));
    toggle.type="button";toggle.setAttribute("aria-expanded",String(state.expanded.has(x.id)||!!q));toggle.title=T("Tampilkan unit internal","Show internal directorates");
    toggle.addEventListener("click",()=>{state.expanded.has(x.id)?state.expanded.delete(x.id):state.expanded.add(x.id);renderHierarchy(d,state)});
    main.append(toggle);
   }
   section.append(main);
   if(children.length&&(state.expanded.has(x.id)||!!q)){
    const units=E("div","mf-gov-internal-units");
    for(const child of children.filter(matching))appendCard(units,child,true);
    if(units.childElementCount)section.append(units);
   }
   col.append(section);
  }
  if(!visible)col.append(E("p","mf-hint",T("Tidak ada unit sesuai filter.","No units match the current filter.")));
  columns.append(col);
 }
 root.append(columns);profile(d,state.selectedHierarchy,$("mfHierarchyProfile"));
 const count=$("mfHierarchyCount");if(count)count.textContent=T(d.hierarchy.length+" simpul · "+d.hierarchy.filter(x=>x.officeholder).length+" profil pejabat resmi",d.hierarchy.length+" organization nodes · "+d.hierarchy.filter(x=>x.officeholder).length+" official officeholder profiles");
}
function renderNetwork(d,state){
 const root=$("mfNetworkDiagram");if(!root)return;root.replaceChildren();
 const q=state.networkQuery.toLocaleLowerCase("id").trim();
 const filtered=d.groups.filter(g=>state.hub==="all"||g.id===state.hub).map(g=>({...g,matches:g.actor_ids.map(id=>dataById(d,id)).filter(Boolean).filter(x=>!q||[x.label_id,x.label_en,x.role_id,x.officeholder?.name||"",g.label_id,g.label_en].some(s=>s.toLocaleLowerCase("id").includes(q)))})).filter(g=>g.matches.length);
 const canvas=E("div","mf-gov-network-canvas");
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 svg.setAttribute("viewBox","0 0 1000 570");svg.setAttribute("preserveAspectRatio","none");svg.classList.add("mf-gov-link-lines");svg.setAttribute("aria-hidden","true");
 const points=[[170,120],[500,120],[830,120],[170,445],[500,445],[830,445]];
 for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){if(j-i===1||j-i===3){const l=document.createElementNS("http://www.w3.org/2000/svg","line");for(const [k,v]of Object.entries({x1:points[i][0],y1:points[i][1],x2:points[j][0],y2:points[j][1]}))l.setAttribute(k,v);svg.append(l)}}
 canvas.append(svg);
 const grid=E("div","mf-gov-network-grid");let count=0;
 for(const g of filtered){
  const full=d.groups.findIndex(x=>x.id===g.id),hub=E("button","mf-gov-hub mf-gov-hub--"+g.id+(state.selectedHub?.id===g.id?" is-active":""));
  hub.type="button";hub.dataset.hub=g.id;
  const left=E("span","mf-gov-hub-bar");
  const info=E("span","mf-gov-hub-copy");info.append(E("strong","",T(g.label_id,g.label_en)));info.append(E("small","",T(g.matches.length+" lembaga",g.matches.length+" institutions")));
  hub.append(left,info);
  hub.addEventListener("click",()=>{state.selectedHub=g;state.selectedNetwork=g.actor_ids[0];renderNetwork(d,state)});
  const item=E("div","mf-gov-network-item");item.append(hub);
  if(state.selectedHub?.id===g.id){
   const list=E("div","mf-gov-network-actors");
   for(const x of g.matches){const b=card(d,x,state.selectedNetwork,id=>{state.selectedNetwork=id;state.selectedHub=g;renderNetwork(d,state)},true);list.append(b);count++}
   item.append(list);
  }else count+=g.matches.length;
  grid.append(item);
 }
 canvas.append(grid);root.append(canvas);
 if(!filtered.length)root.append(E("p","mf-hint",T("Tidak ada entitas yang cocok.","No matching institutions.")));
 const chosen=filtered.find(x=>x.id===state.selectedHub?.id)||filtered[0]||d.groups[0];if(chosen?.id!==state.selectedHub?.id)state.selectedHub=chosen;
 if(chosen&&!chosen.actor_ids.includes(state.selectedNetwork))state.selectedNetwork=chosen.actor_ids[0];
 profile(d,state.selectedNetwork,$("mfNetworkProfile"),chosen);
 const counter=$("mfNetworkCount");if(counter)counter.textContent=T(count+" entri · "+filtered.length+" klaster",count+" entries · "+filtered.length+" hubs");
}
async function init(){
 if(!$("mfHierarchyDiagram"))return;
 try{
  const res=await fetch(DATA_URL,{cache:"no-store"});if(!res.ok)throw Error("Marine governance HTTP "+res.status);
  let d=await res.json(),check=validateMarineGovernance(d);
  if(!check.pass){
   // The public fetch transport can return an older GitHub main copy during PR QA or deployment.
   // Recover only from the exact same-origin source JSON and require full source validation.
   const local=await fetch(DATA_URL,{cache:"no-store",sliLocalOnly:true});
   if(local.ok){const candidate=await local.json(),verified=validateMarineGovernance(candidate);
    if(verified.pass){d=candidate;check=verified;}
   }
  }
  if(!check.pass)throw Error(check.issues.join(", ")+" · source="+res.url+" · schema="+d.schema+" · count="+d.hierarchy?.length);
  const state={selectedHierarchy:"minister",selectedNetwork:"djpt",selectedHub:d.groups.find(g=>g.id==="capture"),hub:"all",lane:"all",query:"",networkQuery:"",expanded:new Set(["djprl"])};
  const q=$("mfHierarchyQuery"),sel=$("mfHierarchyFilter");
  if(q)q.addEventListener("input",()=>{state.query=q.value;renderHierarchy(d,state)});
  if(sel)sel.addEventListener("change",()=>{state.lane=sel.value;renderHierarchy(d,state)});
  $("mfExpandAll")?.addEventListener("click",()=>{state.expanded=new Set(d.hierarchy.filter(x=>d.hierarchy.some(z=>z.parent===x.id)).map(x=>x.id));renderHierarchy(d,state)});
  $("mfCollapseAll")?.addEventListener("click",()=>{state.expanded.clear();renderHierarchy(d,state)});
  const filter=$("mfNetworkFilter"),input=$("mfNetworkQuery"),chips=$("mfNetworkChips");
  if(filter){for(const g of d.groups){const opt=E("option","",T(g.label_id,g.label_en));opt.value=g.id;filter.append(opt)}filter.addEventListener("change",()=>{state.hub=filter.value;renderNetwork(d,state)})}
  if(input)input.addEventListener("input",()=>{state.networkQuery=input.value;renderNetwork(d,state)});
  function chipsRender(){
   if(!chips)return;chips.replaceChildren();
   for(const g of [{id:"all",label_id:"Semua "+[...new Set(d.groups.flatMap(x=>x.actor_ids))].length+" entitas",label_en:"All "+[...new Set(d.groups.flatMap(x=>x.actor_ids))].length+" entities"},...d.groups]){
    const b=E("button","mf-gov-chip"+(g.id===state.hub?" active":""),T(g.label_id,g.label_en));b.type="button";b.setAttribute("aria-pressed",String(g.id===state.hub));
    b.addEventListener("click",()=>{state.hub=g.id;if(filter)filter.value=g.id;chipsRender();renderNetwork(d,state)});
    chips.append(b);
   }
  }
  const render=()=>{
   if(filter)for(const o of filter.options){const g=d.groups.find(x=>x.id===o.value);if(g)o.textContent=T(g.label_id,g.label_en)}
   chipsRender();renderHierarchy(d,state);renderNetwork(d,state);
  };
  document.addEventListener("sli:languagechange",render);
  new MutationObserver(changes=>{if(changes.some(x=>x.attributeName==="lang"))render()}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  render();
 }catch(err){
  for(const id of ["mfHierarchyDiagram","mfNetworkDiagram"])if($(id))$(id).textContent=T("Peta kelembagaan belum tersedia. Tidak ada fakta pengganti yang direka.","Institutional map is unavailable; no source facts are invented.");
  console.error("[SLI Marine governance v2]",err);
 }
}
if(typeof document!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init()}
