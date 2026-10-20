/* Provenance-led company relationships. Never infer parentage from a project participation. */
(function(){
"use strict";
const $=id=>document.getElementById(id),lang=()=>document.documentElement.lang==="id";
const T=(en,id)=>lang()?id:en;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
const safe=u=>{try{return new URL(u).protocol==="https:"?u:null}catch{return null}};
const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("id").replace(/\s+/g," ").trim();
let db,nodes=[],byKey=new Map(),selected="",scope="all",query="";
function build(data){
 const map=new Map(),profiles=data.ownership_profiles||[],parts=data.project_participations||[];
 const put=(name,role)=>{
  const key=norm(name);if(!key)return null;
  if(!map.has(key))map.set(key,{key,name,roles:new Set(),profile:null,ownedIn:[],projects:[],sources:new Set()});
  const n=map.get(key);n.roles.add(role);return n;
 };
 for(const profile of profiles){
  const subject=put(profile.name,"ownership");
  if(!subject)continue;
  subject.profile=profile;
  for(const url of profile.source_urls||[])if(safe(url))subject.sources.add(url);
  for(const sh of profile.shareholders||[]){
   if(sh.holder_kind==="aggregate_not_entity")continue;
   const entity=put(sh.name,"ownership");
   if(!entity)continue;
   entity.ownedIn.push({target:profile.name,percentage:sh.reported_pct,period:profile.reference_date,source:profile.source_urls?.[0]||null});
   for(const url of profile.source_urls||[])if(safe(url))entity.sources.add(url);
  }
 }
 for(const p of parts){
  const n=put(p.name,"project");if(!n)continue;
  n.projects.push(p);
  if(safe(p.source_url))n.sources.add(p.source_url);
 }
 return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,"id"));
}
function link(parent,url,label){
 if(!safe(url))return;
 const a=el("a","sli-evidence-link",label+" ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";parent.append(a);
}
function field(dl,name,val){if(val===undefined||val===null||val==="")return;dl.append(el("dt","",name),el("dd","",val))}
function choose(key){selected=key;drawList();drawDetail()}
function drawList(){
 const out=$("sliEvidenceList");if(!out)return;out.replaceChildren();
 const terms=norm(query).split(" ").filter(Boolean);
 const results=nodes.filter(n=>(scope==="all"||n.roles.has(scope))&&terms.every(t=>norm([n.name,n.profile?.name,n.ownedIn.map(x=>x.target).join(" "),n.projects.map(x=>x.project_name).join(" ")].join(" ")).includes(t)));
 $("sliEvidenceStat").textContent=results.length+" "+T("matching names · ","nama cocok · ")+db.coverage.ownership_profiles+" "+T("ownership dossiers · ","profil kepemilikan · ")+db.coverage.project_participation_links+" "+T("project participation references","referensi partisipasi proyek");
 for(const n of results.slice(0,120)){
  const b=el("button","sli-evidence-hit");b.type="button";b.setAttribute("aria-pressed",String(selected===n.key));
  b.append(el("strong","",n.name),el("small","",[(n.profile||n.ownedIn.length)?T("Ownership disclosure","Kepemilikan"):"",n.projects.length?T("Project participant","Partisipan proyek"):""].filter(Boolean).join(" · ")));
  b.addEventListener("click",()=>choose(n.key));out.append(b);
 }
 if(results.length>120)out.append(el("p","sli-evidence-note",T("First 120 results; refine your search.","120 pertama; persempit kata pencarian.")));
 if(!results.length)out.append(el("p","sli-evidence-note",T("No matches in the cited relationship records.","Tidak ada hasil dalam registri relasi bersumber.")));
 if(!results.some(n=>n.key===selected))selected=results[0]?.key||"";
}
function drawDetail(){
 const out=$("sliEvidenceDetail");if(!out)return;out.replaceChildren();
 const n=byKey.get(selected);if(!n){out.append(el("p","",T("Select a company or investor to inspect evidence.","Pilih perusahaan atau investor untuk melihat bukti.")));return}
 out.append(el("h3","",n.name));
 out.append(el("p","sli-evidence-note",T("Source-led evidence, not a beneficial ownership certification.","Bukti sumber, bukan sertifikasi pemilik manfaat akhir.")));
 if(n.profile){
  const p=n.profile;
  const section=el("section","sli-evidence-profile");section.append(el("h4","",T("Reported direct shareholdings","Pemegang saham langsung terlapor")));
  const dl=el("dl","sli-evidence-fields");
  field(dl,T("Reference date","Tanggal rujukan"),p.reference_date);
  field(dl,T("Control qualification","Catatan pengendalian"),p.control_note);
  field(dl,T("Reported ownership chain","Penjelasan rantai kepemilikan"),p.ownership_chain_note);
  section.append(dl);
  if(p.shareholders.length){
   const table=el("table","sli-evidence-equity"),thead=el("thead"),row=el("tr");
   for(const heading of [T("Shareholder","Pemegang saham"),T("Reported direct interest","Porsi langsung terlapor")])row.append(el("th","",heading));
   thead.append(row);table.append(thead);
   const tbody=el("tbody");
   for(const shareholder of p.shareholders){
    const tr=el("tr");
    const lab=el("td","",shareholder.name+(shareholder.holder_kind==="aggregate_not_entity"?" · "+T("aggregate, not a legal entity","agregat, bukan badan hukum"):""));
    const amount=el("td","",typeof shareholder.reported_pct==="number"?new Intl.NumberFormat(lang()?"id-ID":"en-US",{maximumFractionDigits:7}).format(shareholder.reported_pct)+"%":"N/A");
    tr.append(lab,amount);tbody.append(tr);
   }
   table.append(tbody);section.append(table);
  }else section.append(el("p","sli-evidence-note",T("Shareholding percentages not established in the reviewed source.","Persentase saham tidak terverifikasi pada sumber yang dikaji.")));
  for(const [i,url] of (p.source_urls||[]).entries())link(section,url,T("Original ownership source","Sumber kepemilikan asli")+" "+(i+1));
  out.append(section);
 }
 if(n.ownedIn.length){
  const section=el("section","sli-evidence-profile");section.append(el("h4","",T("Reported holdings in other entities","Kepemilikan pada entitas lain")));
  for(const h of n.ownedIn){
   const p=el("p","sli-evidence-note",h.target+" · "+new Intl.NumberFormat(lang()?"id-ID":"en-US",{maximumFractionDigits:7}).format(h.percentage)+"% · "+h.period);
   section.append(p);link(section,h.source,T("Review dated shareholder record","Periksa bukti bertanggal"));
  }
  out.append(section);
 }
 if(n.projects.length){
  const section=el("section","sli-evidence-profile");section.append(el("h4","",T("Reported project participation — not equity","Partisipasi proyek terlapor — bukan saham")));
  for(const p of n.projects){
   const item=el("div","sli-evidence-project");item.append(el("strong","",p.project_name));
   const dl=el("dl","sli-evidence-fields");
   field(dl,T("Sector","Sektor"),p.project_sector);field(dl,T("Region","Lokasi"),p.project_region);
   field(dl,T("Evidence date","Tanggal bukti"),p.source_date);
   field(dl,T("Project register's exact role description","Keterangan peran dalam registri"),p.project_role_note);
   field(dl,T("Evidence status","Status bukti"),p.verification);
   item.append(dl);link(item,p.source_url,T("Original project source","Sumber proyek asli"));section.append(item);
  }out.append(section);
 }
 if(!n.profile&&!n.projects.length&&!n.ownedIn.length)out.append(el("p","",T("No relationship evidence available.","Bukti relasi belum tersedia.")));
}
async function init(){
 try{
  const response=await fetch("./data/sli-corporate-evidence-relationships.json",{cache:"no-store"});
  if(!response.ok)throw Error("HTTP "+response.status);
  const d=await response.json();
  if(d?.schema!=="sli-corporate-evidence-relationships-v1"||d.ownership_profiles?.length<15||d.project_participations?.length<20)throw Error("Unexpected evidence relationship dataset");
  db=d;nodes=build(d);byKey=new Map(nodes.map(n=>[n.key,n]));
  $("sliEvidenceType").addEventListener("change",e=>{scope=e.target.value;drawList();drawDetail()});
  $("sliEvidenceSearch").addEventListener("input",e=>{query=e.target.value;drawList();drawDetail()});
  document.addEventListener("sli:languagechange",()=>{drawList();drawDetail()});
  drawList();drawDetail();
 }catch(err){
  console.warn("[SLI corporate evidence]",err);
  const m=$("sliEvidenceStat");if(m)m.textContent=T("Evidence register unavailable; no fallback facts invented.","Registri bukti tidak tersedia; data pengganti tidak dibuat-buat.");
 }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
