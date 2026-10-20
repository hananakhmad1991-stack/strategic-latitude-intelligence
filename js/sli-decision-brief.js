/* SLI Decision Terminal · source-qualified evidence brief. No automated fact validation. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const api=()=>window.SLIDecisionTerminal;
const isID=()=>document.documentElement.lang?.toLowerCase().startsWith("id");
const T=(en,id)=>isID()?id:en;
const E=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
const safe=x=>{try{const u=new URL(x,document.baseURI);return u.protocol==="https:"&&!u.username&&!u.password?u.href:null}catch{return null}};
let chosenNews="",chosenPolicy="",lastKey="";
function records(){
 const a=api(),snapshot=a?.getSnapshot(),ctx=a?.getContext();
 if(!a||!snapshot||!ctx)return null;
 return {
  snapshot,ctx,
  news:a.newsFor(snapshot.news,{sector:ctx.sector,q:ctx.q}).filter(x=>safe(x.url)),
  policies:a.policyFor(snapshot.policies,{sector:ctx.sector,q:ctx.q}).filter(x=>safe(x.source))
 };
}
function selected(data){
 const n=data.news.find(x=>x.id===chosenNews)||data.news[0]||null;
 const p=data.policies.find(x=>x.id===chosenPolicy)||data.policies[0]||null;
 return {n,p};
}
function evidenceText(data){
 const {ctx,snapshot}=data,{n,p}=selected(data);
 return [
  "STRATEGIC LATITUDE INTELLIGENCE — DECISION TERMINAL",
  "Research lead / bahan analisis · Not investment or legal advice",
  "Context: "+(ctx.issuer?ctx.issuer.ticker+" | "+ctx.issuer.name+" | ":"")+ctx.sector,
  "Search: "+(ctx.q||"—"),
  "Important: a sector match does not establish direct impact on an issuer.",
  "Secondary news shows what a publisher reported, not independently corroborated facts.",
  "Legal validity and amendments must be confirmed at the issuing authority / JDIH.",
  "",
  "SECONDARY NEWS LEAD",
  n?[n.title,n.publisher+" | "+(n.published_at_utc||"date not given"),"Evidence: "+n.evidence_level,"Full article inspected: "+(n.article_body_checked===true?"yes":"not confirmed"),n.url].join("\n"):"No matched news in this snapshot.",
  "",
  "REGULATORY LEAD",
  p?[p.ref+" | "+p.label,"Index status: "+(p.status||"not assessed"),"Last source verification: "+(p.verified_at||"not specified"),p.source].join("\n"):"No matched regulatory record in this snapshot.",
  "",
  "SLI data snapshots: IDX "+(snapshot.meta.issuers||"unavailable")+", news "+(snapshot.meta.news||"unavailable")+", regulations "+(snapshot.meta.policies||"unavailable"),
  "This is a navigation and evidence-preparation aid, not a verified analytic conclusion."
 ].join("\n");
}
function render(){
 const host=$("sliTerminalEvidence");if(!host)return;
 const data=records();if(!data)return;
 const key=[data.ctx.sector,data.ctx.q,data.ctx.issuer?.ticker||""].join("|");
 if(lastKey!==key){chosenNews="";chosenPolicy="";lastKey=key}
 const {ctx,snapshot,news,policies}=data;
 const n=selected(data).n,p=selected(data).p;
 host.replaceChildren();
 const head=E("div","sli-terminal-brief-head");
 const title=E("div");
 title.append(E("span","sli-terminal-brief-eyebrow","SLI / EVIDENCE WORKSPACE"),E("h2","",T("Cross-source evidence brief","Ringkasan bukti lintas sumber")));
 head.append(title);
 const actions=E("div","sli-terminal-brief-actions");
 const copy=E("button",null,T("Copy sourced brief","Salin ringkasan bersumber"));copy.type="button";
 copy.addEventListener("click",async()=>{
  try{if(!navigator.clipboard?.writeText)throw Error("not supported");await navigator.clipboard.writeText(evidenceText(data));copy.textContent=T("Copied ✓","Tersalin ✓")}
  catch{copy.textContent=T("Copy unavailable in this browser","Penyalinan tidak tersedia pada browser ini")}
 });
 const research=E("a",null,T("Open in DERGUBA AI ↗","Buka di DERGUBA AI ↗"));
 const target=ctx.issuer?("Emiten "+ctx.issuer.ticker+" / "+ctx.issuer.name+". "):"";
 const lead=(n?" Laporan teratribusi: "+n.title+" (sumber "+n.url+").":"")+(p?" Regulasi: "+p.ref+" (sumber "+p.source+").":"");
 const prompt="Analisis "+target+"sektor "+ctx.sector+". "+(ctx.q?"Fokus "+ctx.q+". ":"")+"Bandingkan sumber resmi, berita teratribusi, status regulasi dan data bertanggal. Jangan menyimpulkan hubungan kausal atau dampak harga tanpa verifikasi."+lead;
 research.href="./sli-research-ai.html?prompt="+encodeURIComponent(prompt.slice(0,1700));
 actions.append(copy,research);head.append(actions);host.append(head);
 host.append(E("p","sli-terminal-brief-context",
  (ctx.issuer?ctx.issuer.ticker+" · "+ctx.issuer.name+" · ":"")+ctx.sector+" · "+
  news.length+" "+T("news leads","rujukan berita")+" · "+policies.length+" "+T("policy leads","rujukan regulasi")));
 if(ctx.companyContext)host.append(E("p","sli-terminal-brief-caution",T(
  "The sources below match the issuer’s sector, not necessarily that company. Never interpret a match as proof of exposure.",
  "Sumber di bawah terkait sektor emiten, belum tentu perusahaan tersebut. Kecocokan bukan bukti paparan atau dampak.")));
 const columns=E("div","sli-terminal-brief-grid");
 function column(type,items,chosen,label,valueOf,onChange,meta,details){
  const section=E("div","sli-terminal-brief-card");section.append(E("strong","",label));
  if(!items.length){section.append(E("p","",T("No indexed source in this context.","Tidak ada sumber terindeks untuk konteks ini.")));return section}
  const select=E("select");select.setAttribute("aria-label",label);
  for(const x of items.slice(0,25)){
   const option=E("option",null,valueOf(x));option.value=x.id;
   if(x.id===chosen)option.selected=true;select.append(option)
  }
  select.value=chosen&&items.some(x=>x.id===chosen)?chosen:items[0].id;
  select.addEventListener("change",()=>{onChange(select.value);render()});section.append(select);
  const picked=items.find(x=>x.id===select.value)||items[0];
  section.append(E("p","sli-terminal-brief-meta",meta(picked)));
  const link=E("a",null,T("Open indexed report link ↗","Buka tautan laporan terindeks ↗"));
  link.href=safe(type==="news"?picked.url:picked.source);
  link.target="_blank";link.rel="noopener noreferrer";section.append(link);
  section.append(E("small","sli-terminal-brief-provenance",details(picked)));
  return section;
 }
 columns.append(column("news",news,chosenNews,T("Attributable news","Berita teratribusi"),x=>x.title,
  v=>{chosenNews=v},x=>x.publisher+" · "+(x.published_at_utc||"undated"),
  x=>T("Headline/index metadata; full text and claims not independently checked.","Metadata berita; isi dan klaim belum diverifikasi independen.")));
 columns.append(column("policy",policies,chosenPolicy,T("Regulatory reference","Rujukan regulasi"),x=>x.ref+" · "+x.label,
  v=>{chosenPolicy=v},x=>x.ref+" · "+(x.status||"check_current"),
  x=>T("Index status is not a legal opinion; check amendments and enforceable text in JDIH.","Status indeks bukan pendapat hukum; periksa perubahan serta teks berlaku di JDIH.")));
 host.append(columns);
 host.append(E("p","sli-terminal-brief-fine",T(
  "Issuer candidates are not a live IDX census. No live securities quotes, inferred company financials or automated investment alerts.",
  "Kandidat emiten bukan sensus BEI real-time. Tidak ada harga saham live, angka keuangan rekaan atau alert investasi otomatis.")));
}
document.addEventListener("sli:terminalrender",render);
document.addEventListener("sli:languagechange",render);
window.SLIDecisionBrief={records,evidenceText,render};
if(document.readyState!=="loading")render();
})();