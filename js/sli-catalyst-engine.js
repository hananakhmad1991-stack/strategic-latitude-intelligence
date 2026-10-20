/* SLI Alert & Catalyst Engine v1 — source snapshot reader, not push notifications.
 * Never elevate a headline to a verified event or a sector match to direct issuer exposure.
 */
(()=>{"use strict";
const ROOT="sliCatalystEngine",STORE="sli-catalyst-state-v1",WATCH="sli-terminal-watchlist-v1";
const SOURCES={
 news:"./data/sli-secondary-news-index.json",projects:"./data/sli-project-registry.json",
 laws:"./data/sli-policy-regulatory-graph-2026.json",
 issuers:"./data/sli-idx-issuer-universe.json",
 participation:"./data/sli-corporate-evidence-relationships.json",
 groups:"./data/sli-corporate-group-registry.json"
};
const E=(tag,cls,t)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(t!==undefined)x.textContent=String(t);return x};
const $=id=>document.getElementById(id),id=()=>document.documentElement.lang?.toLowerCase().startsWith("id");
const T=(en,bahasa)=>id()?bahasa:en;
const norm=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const sourceUrl=x=>{try{const u=new URL(x);return u.protocol==="https:"&&!u.username&&!u.password&&!(/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname))?u.href:null}catch{return null}};
const dateOk=x=>{const v=Date.parse(x||"");return Number.isFinite(v)?v:null};
const readLocal=key=>{try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}};
const writeLocal=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
const listWatch=()=>{const x=readLocal(WATCH);return new Set(Array.isArray(x)?x.filter(v=>/^[A-Z0-9]{4}$/.test(v)).slice(0,30):[])};
const SECTOR={
 energy:["energy","oilgas","electricity"],minerals:["minerals","minerba"],
 coal:["coal","minerba","energy"],technology:["technology","ai","digital"],
 food:["food","agriculture"],infrastructure:["infrastructure","energy","electricity"],
 transport:["transport","trade"],manufacturing:["manufacturing","industry"]
};
const section=(x,s)=>s==="all"||x===s||(SECTOR[s]||[]).includes(x)||x==="cross";
function aliasName(s){return norm(s).replace(/^pt /,"").replace(/ tbk$/,"").replace(/\s*\([^)]*\)\s*$/,"").trim()}
function exactTicker(text,ticker){if(!ticker||!/^[A-Z0-9]{4}$/.test(ticker))return false;
 return new RegExp("(?:^|[^A-Z0-9])"+ticker+"(?=$|[^A-Z0-9])").test(String(text||""))}
function nameMention(title,issuer){
 const name=aliasName(issuer?.name);if(name.length<9||name.split(" ").length<2)return false;
 return (" "+norm(title)+" ").includes(" "+name+" ");
}
function issuerLinks(issuer,companies,projects,participation){
 const cm=window.SLICompanyMonitor;
 if(cm?.attributedProjects)return cm.attributedProjects(issuer,companies,projects,participation);
 return [];
}
function buildContext(data,ticker){
 const issuer=(data.issuers?.records||[]).find(x=>x.ticker===ticker&&x.exchange==="IDX");
 return issuer?{issuer,projects:issuerLinks(issuer,data.groups,data.projects,data.participation)}:null;
}
function relevance(signal,ctx){
 if(!ctx)return {level:"sector",explain:"topic-only"};
 const issuer=ctx.issuer;
 if(signal.type==="news"){
  const title=signal.title;
  if(exactTicker(title,issuer.ticker)||nameMention(title,issuer))
   return {level:"named",explain:"issuer-explicitly-named-in-headline"};
  for(const item of ctx.projects){
   const pname=norm(item.project.name);
   if(pname.length>=14&&(" "+norm(title)+" ").includes(" "+pname+" "))
    return {level:"project",explain:"project-name-in-headline-plus-documentary-participation"};
  }
 }
 if((signal.type==="project-update"||signal.type==="project-added")&&ctx.projects.some(x=>x.project.id===signal.projectId))
  return {level:"project",explain:"exact-participation-register"};
 if(signal.type==="law-update"||signal.type==="law-added")
  return {level:"sector",explain:"sector-regulation-only"};
 return {level:"sector",explain:"sector-context-only"};
}
function snapshotOf(data){
 return {
  newsIds:(data.news?.articles||[]).map(x=>x.id).filter(Boolean).slice(0,1800),
  projects:Object.fromEntries((data.projects?.records||[]).filter(x=>x.id).map(x=>[x.id,{stage:x.stage||"",date:x.evidence_date||""}])),
  laws:Object.fromEntries((data.laws?.nodes||[]).filter(x=>x.id&&x.kind!=="tier_marker").map(x=>[x.id,{status:x.status||"",date:x.verified_at||""}]))
 };
}
function detectChanges(previous,data){
 if(!previous)return [];
 const found=[];
 if(data.news?.articles&&Array.isArray(previous.newsIds)){
  const old=new Set(previous.newsIds);
  for(const article of data.news.articles){
   if(!article.id||old.has(article.id)||!sourceUrl(article.url))continue;
   const pub=dateOk(article.published_at_utc),ingest=dateOk(data.news.updated_at_utc);
   // Limit "new since index snapshot" to articles published during the past 30 days.
   if(!pub||!ingest||pub>ingest+86400000||ingest-pub>30*86400000)continue;
   found.push({id:"news:"+article.id,type:"news",recordId:article.id,stamp:article.published_at_utc});
  }
 }
 if(data.projects?.records&&previous.projects){
  for(const p of data.projects.records){
   if(!p.id||!sourceUrl(p.source_url))continue;
   const before=previous.projects[p.id];
   if(!before){found.push({id:"project-added:"+p.id,type:"project-added",projectId:p.id,stamp:p.evidence_date||data.projects.as_of});continue}
   if(before.stage!==p.stage&&before.stage&&p.stage){
    found.push({id:"project-update:"+p.id+":"+before.stage+">"+p.stage,type:"project-update",projectId:p.id,previousValue:before.stage,nextValue:p.stage,stamp:data.projects.as_of});
   }
  }
 }
 if(data.laws?.nodes&&previous.laws){
  for(const law of data.laws.nodes){
   if(!law.id||law.kind==="tier_marker"||!sourceUrl(law.source))continue;
   const before=previous.laws[law.id];
   if(!before){found.push({id:"law-added:"+law.id,type:"law-added",lawId:law.id,stamp:data.laws.updated_at});continue}
   if(before.status!==law.status&&before.status&&law.status){
    found.push({id:"law-update:"+law.id+":"+before.status+">"+law.status,type:"law-update",lawId:law.id,previousValue:before.status,nextValue:law.status,stamp:data.laws.updated_at});
   }
  }
 }
 return found.slice(0,120);
}
function baselineMerge(old,data){
 const next={...(old||{})},s=snapshotOf(data);
 for(const [key,source]of [["newsIds","news"],["projects","projects"],["laws","laws"]])
  if(data[source])next[key]=s[key];
 return next;
}
function eventsFromNews(data){
 return (data.news?.articles||[]).filter(a=>a.id&&sourceUrl(a.url)).slice(0,320)
 .map(a=>({id:"news:"+a.id,type:"news",recordId:a.id,stamp:a.published_at_utc,preview:true}));
}
function materialize(entry,data){
 if(entry.type==="news"){
  const n=(data.news?.articles||[]).find(x=>x.id===entry.recordId);
  if(!n||!sourceUrl(n.url))return null;
  return {...entry,title:n.title,url:n.url,stamp:n.published_at_utc,publisher:n.publisher||"",
   sector:n.sector||"",note:n.topic||"",dateType:n.date_type||"publisher_publication_date",
   verified:false,mode:"publisher_headline_metadata"};
 }
 if(entry.type==="project-update"||entry.type==="project-added"){
  const p=(data.projects?.records||[]).find(x=>x.id===entry.projectId);
  if(!p||!sourceUrl(p.source_url))return null;
  return {...entry,title:p.name,url:p.source_url,sector:projectSector(p.sector),publisher:"SLI · project registry",
   note:p.verification_class||p.status_note||"",dateType:"source_registry_snapshot",verified:false,stage:p.stage,region:p.region||""};
 }
 if(entry.type==="law-update"||entry.type==="law-added"){
  const n=(data.laws?.nodes||[]).find(x=>x.id===entry.lawId);
  if(!n||!sourceUrl(n.source))return null;
  return {...entry,title:n.ref+" · "+n.label,url:n.source,sector:n.sector||"cross",
   publisher:"SLI · regulatory index",note:n.note||"",dateType:"index_record_change",verified:false,status:n.status,region:n.region||""};
 }
 return null;
}
function projectSector(x){
 const n=norm(x);
 if(n.includes("mineral")||n.includes("nickel")||n.includes("smelter"))return "minerals";
 if(n.includes("ai infrastructure")||n.includes("data center"))return "technology";
 if(n.includes("coal"))return "coal";
 if(n.includes("agri")||n.includes("food"))return "food";
 return "energy";
}
function researchPrompt(row,selected){
 const what=row.type==="news"?"laporan media teratribusi":
  row.type.startsWith("law")?"perubahan catatan indeks regulasi":"perubahan catatan registri proyek";
 return [
  "Analisis sinyal SLI ("+what+").",
  "Objek: "+row.title+".",
  selected?"Emiten dalam konteks: IDX:"+selected.issuer.ticker+" "+selected.issuer.name+".":"Konteks sektoral: "+row.sector+".",
  "Sumber: "+row.url+".",
  "Tanggal sumber: "+(row.stamp||"tidak diketahui")+".",
  "Pisahkan klaim media, perubahan catatan SLI, fakta primer, dan hipotesis. Verifikasi perkembangan terbaru pada sumber primer.",
  "Jangan menyimpulkan dampak harga saham, kepemilikan, penerapan aturan pada perusahaan, maupun sebab akibat tanpa dokumen yang mendukung.",
  "Tampilkan apa yang berubah, kapan, status verifikasi, pihak yang disebut langsung, implikasi bersyarat dan pertanyaan lanjutan."
 ].join(" ");
}
let data={},log=[],storage=null,ready=false,busy=false,selected="",scope="context",kind="all",since=false,focusId="",inited=false,lastChecked="";
function currentTicker(){
 const root=$(ROOT),fromTerminal=root?.dataset.mode==="terminal";
 if(fromTerminal)return window.SLIDecisionTerminal?.getSelection?.()||"";
 const x=new URLSearchParams(location.search).get("ticker")||"";
 return /^[A-Z0-9]{4}$/.test(x.toUpperCase())?x.toUpperCase():"";
}
function match(row,contexts){
 const tickers=[];
 let best=null;
 for(const ctx of contexts){
  const rel=relevance(row,ctx);
  const sufficient=rel.level!=="sector"||section(row.sector,ctx.issuer.sector);
  if(sufficient){tickers.push(ctx.issuer.ticker);
   if(!best||(rel.level==="named"?3:rel.level==="project"?2:1)>(best.level==="named"?3:best.level==="project"?2:1))best=rel}
 }
 return {tickers,best:best||{level:"sector",explain:"general-context"}};
}
function viewItems(){
 if(!ready)return [];
 const ticker=currentTicker(),watched=listWatch(),codes=scope==="watch"?[...watched]:scope==="context"&&ticker?[ticker]:[];
 const contexts=codes.map(t=>buildContext(data,t)).filter(Boolean);
 const merged=new Map();
 // Current news are displayed as INDEXED reports, regardless of prior browser baseline.
 for(const item of eventsFromNews(data)){const full=materialize(item,data);if(full)merged.set(item.id,full)}
 for(const item of log){const full=materialize(item,data);if(full)merged.set(item.id,{...full,preview:false})}
 let rows=[...merged.values()].filter(x=>kind==="all"||(kind==="changes"?x.type!=="news":x.type===kind));
 if(since)rows=rows.filter(x=>log.some(e=>e.id===x.id)&&!(storage?.read||[]).includes(x.id));
 if(scope==="watch"&&!contexts.length)return [];
 rows=rows.map(x=>{
  const matched=match(x,contexts);
  return {...x,matched,unread:log.some(e=>e.id===x.id)&&!(storage?.read||[]).includes(x.id)};
 }).filter(x=>{
  if(scope==="all")return true;
  if(scope==="watch")return x.matched.tickers.length>0;
  if(scope==="context"){
   if(contexts.length)return x.matched.tickers.length>0;
   const selectedSector=window.SLIDecisionTerminal?.getContext?.().sector;
   return !selectedSector||selectedSector==="all"||section(x.sector,selectedSector);
  }
  return true;
 });
 const weight=x=>x.type==="news"?(x.matched.best.level==="named"?3:x.matched.best.level==="project"?2:1):4;
 return rows.sort((a,b)=>Number(b.unread)-Number(a.unread)||weight(b)-weight(a)||
 String(b.stamp||"").localeCompare(String(a.stamp||""))).slice(0,80);
}
function fmtStamp(value){
 if(!dateOk(value))return T("Date unavailable","Tanggal belum tersedia");
 return new Intl.DateTimeFormat(id()?"id-ID":"en-GB",{timeZone:"Asia/Jakarta",day:"numeric",month:"short",year:"numeric"}).format(new Date(value));
}
function label(row){
 if(row.type==="news")return T("Attributed headline","Judul berita teratribusi");
 if(row.type==="project-update")return T("PROJECT REGISTER CHANGE","PERUBAHAN REGISTRI PROYEK");
 if(row.type==="project-added")return T("Added to project index","Ditambahkan ke indeks proyek");
 if(row.type==="law-update")return T("REGULATORY INDEX CHANGE","PERUBAHAN INDEKS REGULASI");
 return T("Added to regulatory index","Ditambahkan ke indeks regulasi");
}
function describe(row){
 if(row.type==="project-update"||row.type==="law-update")
  return T("Index value changed from ","Nilai pada indeks berubah dari ")+"“"+row.previousValue+"” → “"+row.nextValue+"”. "+
   T("This does not establish the date or legal effect of the real-world change.",
     "Ini bukan bukti tanggal kejadian atau akibat hukum di dunia nyata.");
 if(row.type==="project-added"||row.type==="law-added")
  return T("First detected in the published SLI index, not necessarily newly announced in the world.",
   "Baru terdeteksi dalam indeks SLI, belum tentu baru diumumkan di dunia nyata.");
 return T("Publisher reported this headline; its underlying claims were not independently corroborated by SLI.",
  "Media menerbitkan judul tersebut; klaim di dalamnya belum diverifikasi secara independen oleh SLI.");
}
function createDetail(row){
 const article=E("article","sli-ca-detail");
 article.append(E("span","sli-ca-kicker",label(row)),E("h3","",row.title));
 const meta=E("div","sli-ca-meta",row.publisher+" · "+fmtStamp(row.stamp));article.append(meta);
 article.append(E("p","sli-ca-disclaimer",describe(row)));
 if(row.matched.tickers.length){
  const ties=E("div","sli-ca-ties");
  ties.append(E("strong",null,T("Contextual ticker links: ","Kaitan ticker dalam konteks: ")+row.matched.tickers.join(", ")));
  ties.append(E("p",null,row.matched.best.level==="named"?
    T("Ticker/company is named in the headline; no impact has been established.",
      "Ticker/nama perusahaan disebut dalam judul; dampak belum terbukti."):
    row.matched.best.level==="project"?
    T("Explicit project participation in SLI registry; verify latest project role.",
      "Partisipasi proyek tercatat eksplisit di SLI; verifikasi peran terbaru."):
    T("Same sector only, not a confirmed company exposure.","Hanya sektor yang sama, bukan bukti paparan perusahaan.")));
  article.append(ties);
 }
 if(row.note)article.append(E("p","sli-ca-note",row.note));
 if(row.region)article.append(E("p","sli-ca-note",T("Region: ","Wilayah: ")+row.region));
 const actions=E("div","sli-ca-actions");
 const external=E("a","",T("Open underlying source ↗","Buka sumber terkait ↗"));
 external.href=row.url;external.rel="noopener noreferrer";external.target="_blank";
 const issuer=currentTicker()?buildContext(data,currentTicker()):null;
 const research=E("a","",T("Investigate with DERGUBA AI ↗","Telusuri dengan DERGUBA AI ↗"));
 research.href="./sli-research-ai.html?prompt="+encodeURIComponent(researchPrompt(row,issuer).slice(0,1800));
 actions.append(external,research);article.append(actions);
 article.append(E("small","sli-ca-caveat",row.type==="news"?
  T("Headline/index feed, possibly an aggregator URL; not full-text article verification.",
    "Feed judul berita, mungkin melalui agregator; bukan pemeriksaan artikel lengkap."):
  T("Published SLI index only. Consult the original dated documentation before relying on this change.",
    "Hanya perubahan indeks SLI. Periksa dokumen asli bertanggal sebelum menggunakan kesimpulan.")));
 return article;
}
function markRead(idToRead){
 if(!storage)return;
 const seen=new Set(storage.read||[]);
 seen.add(idToRead);storage.read=[...seen].slice(-250);
 writeLocal(STORE,storage);render();
}
function render(){
 const host=$(ROOT);if(!host)return;
 if(!ready){host.replaceChildren(E("p","sli-ca-loading",T("Loading published SLI monitoring registers…","Memuat registri monitoring SLI yang telah diterbitkan…")));return}
 host.replaceChildren();
 const header=E("header","sli-ca-head");
 const title=E("div");
 title.append(E("span","sli-ca-kicker","SLI · ALERT & CATALYST ENGINE"),E("h2","",T("Strategic signals & evidence changes","Sinyal strategis & perubahan bukti")));
 title.append(E("p","sli-ca-sub",T("Published monitoring leads and browser-observed register changes; not push notifications, investment alerts, or verified company impacts.",
  "Pantauan sumber terbit dan perubahan registri yang diamati browser; bukan notifikasi push, sinyal investasi, atau bukti dampak emiten.")));
 header.append(title);
 const status=E("div","sli-ca-snapshot",T("News snapshot: ","Snapshot berita: ")+(data.news?.updated_at_utc||"—")+"\n"+
 T("Checked in this browser: ","Terakhir diperiksa di browser: ")+(lastChecked||"—"));
 header.append(status);host.append(header);
 const bar=E("div","sli-ca-bar");
 function selectBox(label,values,value,action){
  const wrapper=E("label","sli-ca-control");wrapper.append(E("span",null,label));
  const sel=E("select");for(const [key,en,bahasa]of values){const opt=E("option",null,T(en,bahasa));opt.value=key;sel.append(opt)}
  sel.value=value;sel.addEventListener("change",()=>{action(sel.value);render()});wrapper.append(sel);return wrapper;
 }
 bar.append(selectBox(T("Scope","Cakupan"),[
  ["context","Selected company/sector","Emiten/sektor terpilih"],["watch","Local ticker watchlist","Watchlist ticker lokal"],["all","All published signals","Semua sinyal terindeks"]
 ],scope,x=>scope=x));
 bar.append(selectBox(T("Signal type","Jenis sinyal"),[
  ["all","News & index changes","Berita & perubahan indeks"],["news","Attributed headlines","Judul berita teratribusi"],["changes","Project & legal index changes","Perubahan indeks proyek & hukum"]
 ],kind,x=>kind=x));
 const only=E("label","sli-ca-only");const check=E("input");check.type="checkbox";check.checked=since;
 check.addEventListener("change",()=>{since=check.checked;render()});
 only.append(check,E("span",null,T("New since browser baseline","Baru sejak baseline browser")));bar.append(only);
 host.append(bar);
 const rows=viewItems(),unread=rows.filter(x=>x.unread).length;
 const summary=E("p","sli-ca-summary",rows.length+" "+T("matching signals","sinyal sesuai")+
 " · "+unread+" "+T("unread changes since local baseline","perubahan belum dibaca sejak baseline lokal")+
 (scope==="watch"?" · "+listWatch().size+" "+T("saved tickers","ticker tersimpan"):""));
 host.append(summary);
 if(data.failures?.length)host.append(E("p","sli-ca-warning",T("Partial source load: ","Sebagian sumber gagal dimuat: ")+data.failures.join(", ")));
 const grid=E("div","sli-ca-grid");
 const list=E("div","sli-ca-list");list.setAttribute("role","list");
 if(!rows.length)list.append(E("p","sli-ca-empty",scope==="watch"&&!listWatch().size?
   T("No local watchlist tickers yet. Save issuers in Decision Terminal first.",
     "Belum ada ticker tersimpan. Tambahkan emiten ke watchlist di Decision Terminal terlebih dahulu."):
   T("No source-matched signal under this filter. This is not evidence that nothing happened.",
     "Tidak ada sinyal cocok pada filter ini. Ini bukan bukti bahwa tidak ada peristiwa.")));
 const active=rows.find(x=>x.id===focusId)||rows[0];
 for(const row of rows.slice(0,40)){
  const btn=E("button","sli-ca-item"+(active?.id===row.id?" active":""));
  btn.type="button";btn.setAttribute("aria-pressed",String(active?.id===row.id));
  const top=E("span","sli-ca-item-line");
  top.append(E("small",null,label(row)));
  if(row.unread)top.append(E("small","sli-ca-unread",T("NEW IN INDEX","BARU DI INDEKS")));
  btn.append(top,E("strong",null,row.title),E("small","sli-ca-time",fmtStamp(row.stamp)+" · "+(row.sector||"cross")));
  btn.addEventListener("click",()=>{focusId=row.id;markRead(row.id)});list.append(btn);
 }
 if(rows.length>40)list.append(E("p","sli-ca-foot",T("Top 40 shown; refine filters.","Menampilkan 40 teratas; persempit filter.")));
 grid.append(list);
 const detail=E("div","sli-ca-detail-column");
 if(active)detail.append(createDetail(active));
 else detail.append(E("p","sli-ca-empty",T("Select a sourced signal to inspect.","Pilih sinyal dengan sumber untuk ditelusuri.")));
 grid.append(detail);host.append(grid);
 host.append(E("p","sli-ca-foot",T(
  "First visit establishes a baseline, not historical change claims. 'New' is new to the index/browser, not necessarily a new real-world development. Refreshes while open; no push, email, SMS, or background alerts.",
  "Kunjungan pertama membentuk baseline, bukan klaim perubahan historis. 'Baru' berarti baru dalam indeks/browser, belum tentu peristiwa baru. Sumber diperiksa ulang saat halaman terbuka; tidak ada notifikasi push, email, SMS, atau alert latar belakang.")));
}
async function refresh(){
 if(busy||!$(ROOT))return;
 busy=true;
 try{
  const chunks=await Promise.allSettled(Object.entries(SOURCES).map(async([key,url])=>{
   const response=await fetch(url,{cache:"no-store"});
   if(!response.ok)throw Error(url+" "+response.status);
   return [key,await response.json()];
  }));
  const next={...data},failures=[];
  chunks.forEach((o,i)=>{
   const key=Object.keys(SOURCES)[i];
   if(o.status==="fulfilled"){
    const d=o.value[1];
    const valid=key==="news"?Array.isArray(d?.articles):
     key==="laws"?Array.isArray(d?.nodes):
     key==="participation"?Array.isArray(d?.project_participations):Array.isArray(d?.records);
    if(valid)next[key]=d;else failures.push(key+" schema");
   }else failures.push(key);
  });
  if(!next.news&&!next.projects&&!next.laws)throw Error("No indexed monitoring registers");
  const prior=readLocal(STORE);
  const currentBaseline=baselineMerge(prior?.baseline,next);
  const changes=detectChanges(prior?.baseline,next);
  const oldEvents=Array.isArray(prior?.events)?prior.events:[];
  const eventMap=new Map(oldEvents.map(x=>[x.id,x]));
  for(const item of changes)eventMap.set(item.id,item);
  const allowedEvents=[...eventMap.values()].slice(-180);
  storage={version:1,baseline:currentBaseline,events:allowedEvents,
   read:Array.isArray(prior?.read)?prior.read.slice(-250):[]};
  writeLocal(STORE,storage);
  data={...next,failures};log=allowedEvents;ready=true;
  lastChecked=new Date().toLocaleString(id()?"id-ID":"en-GB",{timeZone:"Asia/Jakarta"});
  render();
 }catch(error){
  console.warn("[SLI Catalyst]",error);
  if(!ready)$(ROOT)?.replaceChildren(E("p","sli-ca-warning",T("Monitoring register currently unavailable.","Registri monitoring belum tersedia.")));
 }finally{busy=false}
}
function start(){
 if(!$(ROOT)||inited)return;inited=true;
 const watch=listWatch(),t=currentTicker();
 scope=t?"context":watch.size?"watch":"all";
 render();refresh();
 document.addEventListener("sli:terminalrender",()=>{if(ready)render()});
 document.addEventListener("sli:languagechange",()=>{if(ready)render()});
 window.addEventListener("focus",()=>{if(ready)refresh()});
 setInterval(()=>{if(document.visibilityState!=="hidden")refresh()},10*60*1000);
}
window.SLICatalystEngine={norm,exactTicker,nameMention,section,relevance,buildContext,snapshotOf,detectChanges,baselineMerge,materialize,projectSector,researchPrompt,viewItems,refresh};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();