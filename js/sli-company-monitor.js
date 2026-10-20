/* SLI Company Monitor v2 · exact, source-attributed joins.
 * Do not infer project participation from a sector, similar word or geography.
 * A project actor is not necessarily a shareholder or project owner.
 */
(()=>{"use strict";
const paths={
 issuers:"./data/sli-idx-issuer-universe.json",
 groups:"./data/sli-corporate-group-registry.json",
 projects:"./data/sli-project-registry.json",
 edges:"./data/sli-corporate-evidence-relationships.json"
};
const $=id=>document.getElementById(id);
const E=(tag,cls,value)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=String(value);return x};
const id=()=>document.documentElement.lang?.toLowerCase().startsWith("id");
const T=(en,bahasa)=>id()?bahasa:en;
const norm=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const safe=x=>{try{const u=new URL(x);return u.protocol==="https:"&&!u.username&&!u.password?u.href:null}catch{return null}};
const link=(url,title)=>{const u=safe(url),a=E(u?"a":"span","sli-cm-link",title);if(u){a.href=u;a.target="_blank";a.rel="noopener noreferrer"}return a};
const projectUrl="./index.html#investment";
const sectorRoute={
 energy:"./index.html#energy",coal:"./index.html#energy",
 minerals:"./index.html#minerals",technology:"./ai-intelligence-hub.html",
 food:"./food-agriculture-intelligence.html",infrastructure:"./index.html#investment",
 transport:"./index.html#trade",manufacturing:"./index.html#investment"
};
const watchThemes={
 energy:[["Fuel / demand policy","Harga energi / kebijakan permintaan"],["Grid & transition","Kelistrikan & transisi"],["Licensing & fiscal rules","Perizinan & fiskal"]],
 minerals:[["Metal price & export rules","Harga mineral & aturan ekspor"],["Smelter operating readiness","Kesiapan operasi smelter"],["Power, water and permits","Energi, air & perizinan"]],
 coal:[["Coal benchmarks & royalties","Harga acuan & royalti batu bara"],["Logistics and demand","Logistik & permintaan"],["Energy transition policy","Kebijakan transisi energi"]],
 technology:[["Power reliability & capacity","Keandalan dan kapasitas listrik"],["Data and cybersecurity rules","Aturan data & keamanan siber"],["Infrastructure milestones","Tahap infrastruktur"]],
 food:[["Supply and weather","Pasokan & cuaca"],["Import and trade rules","Aturan impor & perdagangan"],["Fertilizer and logistics","Pupuk & logistik"]],
 infrastructure:[["Construction status","Status pembangunan"],["Public procurement & permits","Pengadaan & perizinan"],["Power and materials","Energi & material"]],
 transport:[["Fuel and freight markets","Harga energi & angkutan"],["Port and trade flows","Pelabuhan & arus dagang"],["Operational and policy shifts","Perubahan operasi & kebijakan"]],
 manufacturing:[["Input commodity prices","Harga bahan baku"],["Energy and logistics","Energi & logistik"],["Industrial and trade rules","Aturan industri & perdagangan"]]
};
let cache=null,pending=null,lastTicker="",activeProjectId="";
const readJSON=path=>fetch(path,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error(path+" HTTP "+r.status);return r.json()});
async function getData(){
 if(cache)return cache;
 if(pending)return pending;
 pending=Promise.allSettled(Object.entries(paths).map(async([key,path])=>[key,await readJSON(path)]))
 .then(out=>{
  const v={},failures=[];
  out.forEach((row,i)=>{
   const name=Object.keys(paths)[i];
   if(row.status==="fulfilled")v[row.value[0]]=row.value[1];
   else failures.push(name);
  });
  if(v.issuers?.schema!=="sli-idx-issuer-universe-v1"||!Array.isArray(v.issuers.records)){v.issuers=null;failures.push("issuer schema")}
  if(!Array.isArray(v.groups?.records)){v.groups=null;failures.push("group schema")}
  if(!Array.isArray(v.projects?.records)){v.projects=null;failures.push("project schema")}
  if(!Array.isArray(v.edges?.project_participations)){v.edges=null;failures.push("participation schema")}
  cache={...v,failures:[...new Set(failures)]};return cache;
 }).finally(()=>{pending=null});
 return pending;
}
/** Strict equality of attested corporate identifiers; no fuzzy or substring match.
 * A parenthesized ticker is accepted only when equal to the user's actual ticker.
 */
function companyNames(issuer,groups){
 const rows=(groups?.records||[]).filter(x=>x.exchange==="IDX"&&x.ticker===issuer.ticker&&safe(x.source_url));
 const words=new Set([norm(issuer.name)]);
 for(const row of rows)words.add(norm(row.name));
 return {rows,words};
}
function attributedProjects(issuer,groups,projects,edges){
 if(!issuer||!Array.isArray(projects?.records)||!Array.isArray(edges?.project_participations))return [];
 const company=companyNames(issuer,groups),byId=new Map(projects.records.map(p=>[p.id,p]));
 const seen=new Set(),matches=[];
 for(const edge of edges.project_participations){
  if(!edge.project_id||!safe(edge.source_url)||!byId.has(edge.project_id))continue;
  const tag=String(edge.name||"").match(/\(([A-Z0-9]{4})\)\s*$/);
  const exactTicker=tag?.[1]===issuer.ticker;
  const exactName=company.words.has(norm(edge.name))||
   (exactTicker&&company.words.has(norm(String(edge.name).replace(/\s*\([A-Z0-9]{4}\)\s*$/,""))));
  if(!exactTicker&&!exactName)continue;
  if(seen.has(edge.project_id))continue;
  seen.add(edge.project_id);
  matches.push({project:byId.get(edge.project_id),edge,matchBasis:exactTicker?"ticker-in-actor-record":"exact-company-name"});
 }
 return matches.sort((a,b)=>String(b.edge.source_date||"").localeCompare(String(a.edge.source_date||"")));
}
function groupEvidence(issuer,groups){
 const rows=companyNames(issuer,groups).rows;
 const indexed=new Map((groups?.records||[]).map(x=>[x.id,x]));
 return rows.map(row=>{
  const parent=row.parent_id?indexed.get(row.parent_id):null;
  const children=(groups?.records||[]).filter(x=>x.parent_id===row.id);
  return {row,parent,children};
 });
}
function issuerTicker(){
 const root=$("sliCompanyMonitor");
 if(!root)return null;
 if(root.dataset.mode==="terminal")return window.SLIDecisionTerminal?.getSelection?.()||null;
 const qp=new URLSearchParams(location.search);
 const t=(qp.get("ticker")||"").trim().toUpperCase();
 return /^[A-Z0-9]{4}$/.test(t)?t:null;
}
function labelled(parent,label,text){
 const row=E("div","sli-cm-fact");row.append(E("span",null,label),E("strong",null,text||"—"));parent.append(row);
}
function projectDetail(item,host){
 host.replaceChildren();
 const {project:p,edge:e}=item;
 host.append(E("span","sli-cm-eyebrow","SOURCE-ATTRIBUTED PROJECT"),E("h3",null,p.name));
 const facts=E("div","sli-cm-facts");
 labelled(facts,T("Stage (source snapshot)","Tahap (snapshot sumber)"),p.stage);
 labelled(facts,T("Location","Lokasi"),p.region||p.provinces?.join(", "));
 labelled(facts,T("Project sector","Sektor proyek"),p.sector);
 labelled(facts,T("Source date","Tanggal sumber"),e.source_date||p.evidence_date||"—");
 labelled(facts,T("Participant evidence","Bukti partisipasi"),e.name);
 host.append(facts);
 if(p.reported_amount!==null&&Number.isFinite(Number(p.reported_amount))){
  host.append(E("p","sli-cm-finance",
   T("Announced project amount: ","Nilai proyek yang diumumkan: ")+p.reported_amount+" "+(p.currency||"")+
   ". "+(p.amount_basis||"")+". "+T("Not realized CAPEX or company attribution.","Bukan realisasi belanja modal atau nilai milik emiten.")));
 }
 if(e.project_role_note)host.append(E("p","sli-cm-note",T("Reported actors: ","Pihak yang dilaporkan: ")+e.project_role_note));
 host.append(E("p","sli-cm-note",T("Verification limit: ","Batas verifikasi: ")+(e.verification||p.verification_class||T("Check the latest milestone.","Periksa perkembangan terbaru."))));
 if(p.status_note)host.append(E("p","sli-cm-note",p.status_note));
 const sources=E("div","sli-cm-sources");
 sources.append(link(e.source_url,T("Participation evidence ↗","Bukti partisipasi ↗")));
 if(safe(p.source_url)&&p.source_url!==e.source_url)sources.append(link(p.source_url,T("Project milestone source ↗","Sumber capaian proyek ↗")));
 sources.append(E("a","sli-cm-link",T("Investment dashboard →","Dashboard investasi →")));
 sources.lastElementChild.href=projectUrl;
 host.append(sources);
}
function render(){
 const host=$("sliCompanyMonitor");if(!host)return;
 const ticker=issuerTicker();
 if(!ticker){host.replaceChildren();host.hidden=true;return}
 host.hidden=false;
 if(!cache){host.replaceChildren(E("p","sli-cm-loading",T("Loading sourced company relationships…","Memuat hubungan perusahaan bersumber…")));getData().then(render).catch(()=>{
  host.replaceChildren(E("p","sli-cm-note",T("Source registry unavailable.","Registri sumber tidak tersedia.")))
 });return}
 const record=cache.issuers?.records.find(x=>x.exchange==="IDX"&&x.ticker===ticker);
 if(!record){host.replaceChildren(E("p","sli-cm-note",T("Ticker not verified in the SLI candidate registry.","Kode belum tercatat dalam katalog kandidat emiten SLI.")));return}
 if(lastTicker!==ticker){lastTicker=ticker;activeProjectId=""}
 const parts=attributedProjects(record,cache.groups,cache.projects,cache.edges);
 const corporate=groupEvidence(record,cache.groups);
 const current=parts.find(x=>x.project.id===activeProjectId)||parts[0];
 const shell=E("div","sli-cm-shell");
 const head=E("header","sli-cm-header");
 const top=E("div");
 top.append(E("span","sli-cm-eyebrow","SLI · COMPANY MONITOR"),E("h2",null,"IDX:"+ticker+" · "+record.name));
 top.append(E("p","sli-cm-intro",T(
  "A company-specific evidence workspace: only explicitly documented project participants and dated corporate-register links are shown.",
  "Ruang analisis perusahaan: hanya proyek dengan partisipasi terdokumentasi dan hubungan korporasi bersumber bertanggal yang ditampilkan."
 )));
 head.append(top);
 const go=E("a","sli-cm-dossier",T("Full company dossier ↗","Profil perusahaan lengkap ↗"));
 go.href="./sli-issuer.html?ticker="+encodeURIComponent(ticker);head.append(go);shell.append(head);
 const strip=E("div","sli-cm-stats");
 for(const [v,label]of [
  [parts.length,T("documented project links","tautan proyek tercatat")],
  [corporate.length,T("group-register matches","kecocokan registri grup")],
  [cache.failures.length?T("Partial sources","Sumber parsial"):T("Indexed sources","Sumber terindeks"),T("verification basis","dasar verifikasi")]
 ]){const stat=E("div","sli-cm-stat");stat.append(E("strong",null,v),E("span",null,label));strip.append(stat)}
 shell.append(strip);
 if(cache.failures.length)shell.append(E("p","sli-cm-warning",T("Unavailable registries: ","Registri belum tersedia: ")+cache.failures.join(", ")+T(". Missing links cannot be interpreted as absence.",". Hubungan yang tidak muncul bukan berarti tidak ada.")));
 const main=E("div","sli-cm-main");
 const list=E("section","sli-cm-panel sli-cm-projects");
 list.append(E("h3",null,T("Project participation · evidenced","Partisipasi proyek · bersumber")));
 list.append(E("p","sli-cm-muted",T(
  "Actor participation is not equity ownership; only links found by exact company identity/ticker in source records.",
  "Partisipasi pihak proyek bukan kepemilikan saham; hanya kecocokan identitas perusahaan/kode saham dalam bukti sumber.")));
 const entries=E("div","sli-cm-project-list");
 for(const item of parts){
  const button=E("button","sli-cm-project"+(current?.project.id===item.project.id?" active":""));
  button.type="button";button.setAttribute("aria-pressed",String(current?.project.id===item.project.id));
  button.append(E("strong",null,item.project.name),E("small",null,(item.project.stage||"—")+" · "+(item.project.region||"—")));
  button.addEventListener("click",()=>{activeProjectId=item.project.id;render()});entries.append(button)
 }
 if(!parts.length)entries.append(E("p","sli-cm-empty",T(
  "No explicitly attributable projects in this curated registry. This does not establish that the company has no projects.",
  "Belum ada proyek yang secara eksplisit terhubung dalam registri terbatas. Ini bukan berarti perusahaan tidak memiliki proyek.")));
 list.append(entries);main.append(list);
 const detail=E("section","sli-cm-panel sli-cm-detail");
 if(current)projectDetail(current,detail);
 else detail.append(E("h3",null,T("Project evidence","Bukti proyek")),E("p","sli-cm-muted",
 T("Select a documented project when one becomes available.","Pilih proyek yang terdokumentasi saat tersedia.")));
 main.append(detail);shell.append(main);
 const lower=E("div","sli-cm-secondary");
 const group=E("section","sli-cm-panel");
 group.append(E("h3",null,T("Corporate relationship register","Registri hubungan korporasi")));
 if(!corporate.length)group.append(E("p","sli-cm-empty",T(
  "No exact ticker match in the curated group register. Open entity intelligence for wider company discovery.",
  "Belum ada kecocokan kode saham pada registri grup. Buka Intelijen Entitas untuk pencarian lebih luas.")));
 for(const r of corporate.slice(0,3)){
  const cell=E("article","sli-cm-group-record");
  cell.append(E("strong",null,r.row.name),E("p",null,
   T("Reported relationship: ","Hubungan yang dilaporkan: ")+(r.row.relationship||"unspecified")+" · "+(r.row.source_date||"undated")));
  if(r.parent){
   cell.append(E("p",null,T("Parent node in SLI registry: ","Simpul induk dalam registri SLI: ")+r.parent.name));
  }
  if(r.children.length)cell.append(E("p",null,T("Directly linked nodes: ","Simpul turunan terkait: ")+r.children.slice(0,5).map(x=>x.name).join("; ")));
  cell.append(link(r.row.source_url,T("Corporate register source ↗","Sumber registri korporasi ↗")));
  group.append(cell)
 }
 group.append(E("p","sli-cm-muted",T(
  "Group membership and parent_id are documentary relationship leads, not proof of effective equity or ultimate ownership.",
  "Keanggotaan grup dan parent_id adalah petunjuk hubungan dari dokumen, bukan bukti porsi saham efektif atau pemilik manfaat akhir.")));
 lower.append(group);
 const risks=E("section","sli-cm-panel");
 risks.append(E("h3",null,T("Sector research lens","Fokus penelusuran risiko sektoral")));
 risks.append(E("p","sli-cm-muted",T("Questions to investigate; not scored exposures or verified company impacts.",
 "Tema untuk diteliti; bukan skor risiko atau dampak perusahaan yang sudah terverifikasi.")));
 const topics=watchThemes[record.sector]||[];
 for(const [en,bahasa]of topics){
  const item=E("div","sli-cm-risk");item.append(E("span",null,"◇"),E("span",null,T(en,bahasa)));risks.append(item)
 }
 const routes=E("div","sli-cm-sources");
 const dash=E("a","sli-cm-link",T("Sector dashboard →","Dashboard sektor →"));dash.href=sectorRoute[record.sector]||"./index.html#overview";
 const term=E("a","sli-cm-link",T("Decision Terminal →","Decision Terminal →"));term.href="./sli-decision-terminal.html?ticker="+encodeURIComponent(ticker);
 const research=E("a","sli-cm-link",T("Investigate with DERGUBA AI →","Riset dengan DERGUBA AI →"));
 const statement=T("Research ","Teliti ")+"IDX:"+ticker+" "+record.name+". "+T("Review source-dated project participation, corporate links, sector policies, commodities and reporting. Verify each cited document. Do not infer causality, company ownership or price effects from sector overlaps.",
 "Periksa partisipasi proyek bertanggal, hubungan korporasi, kebijakan, komoditas, dan pemberitaan sektoral dengan sumber. Jangan simpulkan sebab-akibat, kepemilikan, atau dampak harga dari kesamaan sektor.");
 const projectLead=parts.length?" "+T("Documented project leads: ","Petunjuk proyek tercatat: ")+parts.slice(0,3).map(x=>x.project.name+" ("+x.edge.source_url+")").join("; "):"";
 research.href="./sli-research-ai.html?prompt="+encodeURIComponent((statement+projectLead).slice(0,1700));
 routes.append(dash,term,research);risks.append(routes);lower.append(risks);shell.append(lower);
 const foot=E("p","sli-cm-footer",
  T("Coverage: ","Cakupan: ")+
  [cache.issuers?.as_of&&"IDX "+cache.issuers.as_of,cache.groups?.as_of&&T("Corporate ","Korporasi ")+cache.groups.as_of,
   cache.projects?.as_of&&T("Projects ","Proyek ")+cache.projects.as_of,cache.edges?.as_of&&T("Participations ","Partisipasi ")+cache.edges.as_of].filter(Boolean).join(" · ")+
  T(". Partial curated registries; listing and project stages require current primary-source rechecks. No market pricing data is inferred.",
   ". Registri terbatas; pencatatan emiten dan tahap proyek perlu verifikasi sumber primer terkini. Tidak ada harga pasar hasil asumsi."));
 shell.append(foot);
 host.replaceChildren(shell);
}
function start(){
 if(!$("sliCompanyMonitor"))return;
 render();
 document.addEventListener("sli:terminalrender",render);
 document.addEventListener("sli:languagechange",render);
}
window.SLICompanyMonitor={norm,companyNames,attributedProjects,groupEvidence,render,sourcePaths:paths};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();