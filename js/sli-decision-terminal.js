/* SLI Decision Terminal v1. Safe native cross-source research workspace.
 * Read-only public data. No market price fabrication, no downstream autonomous actions.
 */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const ALLOWED_SECTORS=new Set(["energy","minerals","coal","food","technology","infrastructure","transport","manufacturing"]);
const tickerRE=/^[A-Z0-9]{4}$/;
const sectorNames={
 energy:["Energy & transition","Energi & transisi"],minerals:["Critical minerals","Mineral kritis"],
 coal:["Coal","Batu bara"],food:["Food & agriculture","Pangan & pertanian"],
 technology:["Technology & AI","Teknologi & AI"],infrastructure:["Infrastructure","Infrastruktur"],
 transport:["Logistics & transport","Logistik & transportasi"],manufacturing:["Manufacturing","Manufaktur"]
};
const sectorAlias={
 "energy":["energy","migas","oil","gas","electricity"],"minerals":["minerals","mineral","nickel","nikel","copper","tembaga","bauxite","smelter"],
 "coal":["coal","batubara","batu bara"],"food":["food","pangan","agricultur","pertanian","beras","rice","fertilizer","pupuk"],
 "technology":["technology","digital","ai","datacenter","data center","compute","telekom","internet"],
 "infrastructure":["infrastructure","jalan","grid","pelabuhan"],"transport":["transport","logistik","shipping","maritime"],
 "manufacturing":["manufacturing","manufaktur","industri","factory"]
};
const urls={
 entities:"./sli-entities.html",research:"./sli-research-ai.html",
 energy:"./index.html#energy",minerals:"./index.html#minerals",coal:"./index.html#energy",
 food:"./food-agriculture-intelligence.html",technology:"./ai-intelligence-hub.html",
 infrastructure:"./index.html#investment",transport:"./index.html#trade",
 manufacturing:"./index.html#investment",
 news:"./sli-sector-news.html",policy:"./policy-regulatory-intelligence.html",
 geopolitics:"./index.html#geopolitics",commodities:"./index.html#geopolitics"
};
const EN={all:["All sectors","Semua sektor"],ready:["Source snapshots loaded","Snapshot sumber tersedia"]};
const E=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n};
const id=()=>document.documentElement.lang?.toLowerCase().startsWith("id")||window.SLIi18n?.language==="id";
const T=(en,bahasa)=>id()?bahasa:en;
const safeUrl=value=>{try{const p=new URL(value,document.baseURI);return p.protocol==="https:"&&!p.username&&!p.password?p.href:null}catch{return null}};
const a=(href,value,ext)=>{const n=E("a",null,value);n.href=href;if(ext){n.target="_blank";n.rel="noopener noreferrer"}return n};
const fmtDate=value=>{const date=new Date(value);return Number.isFinite(date.getTime())?date.toLocaleDateString(id()?"id-ID":"en-GB",{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"}):"—"};
const group=key=>key==="all"?T(...EN.all):T(...(sectorNames[key]||[key,key]));
const corpURL=t=>"./sli-issuer.html?ticker="+encodeURIComponent(t);
const WATCH="sli-terminal-watchlist-v1";
const LIMIT_WATCH=30;
let source={issuers:[],news:[],policies:[],meta:{}},watch=new Set(),ready=false,role="investor",sector="all",q="",selected="";
function parseWatch(raw,available){
 const valid=new Set(available.map(x=>x.ticker));const output=new Set();
 if(!Array.isArray(raw))return output;
 for(const x of raw){if(output.size>=LIMIT_WATCH)break;if(tickerRE.test(x||"")&&valid.has(x))output.add(x)}
 return output;
}
function saveWatch(){try{localStorage.setItem(WATCH,JSON.stringify([...watch]))}catch(_){ /* browser storage may be unavailable */ }}
function readWatch(){
 try{return parseWatch(JSON.parse(localStorage.getItem(WATCH)||"[]"),source.issuers)}
 catch{return new Set()}
}
function norm(s){return String(s||"").normalize("NFKD").toLowerCase().replace(/\s+/g," ").trim()}
function classifySector(s){
 const lower=norm(s);if(sectorAlias[lower])return lower;
 for(const [key,terms]of Object.entries(sectorAlias)){if(terms.some(v=>lower===v||lower.includes(" "+v+" ")))return key}
 return lower;
}
function filterIssuers(list,opts){
 const sector=opts.sector||"all",needle=norm(opts.q),saved=opts.watch||new Set();
 return list.filter(x=>x.exchange==="IDX"&&tickerRE.test(x.ticker||"")&&ALLOWED_SECTORS.has(x.sector)&&
 (sector==="all"||x.sector===sector)&&(!needle||norm(x.ticker+" "+x.name+" "+x.sector).includes(needle)))
 .sort((a,b)=>Number(saved.has(b.ticker))-Number(saved.has(a.ticker))||a.ticker.localeCompare(b.ticker));
}
function newsFor(list,opts){
 const needle=norm(opts.q),s=opts.sector,selected=opts.selected||"";
 const selectedActor=opts.issuer?.name||"";
 const rows=list.filter(x=>{
  const text=norm([x.title,x.publisher,x.topic,x.sector].join(" "));
  if(needle&&!text.includes(needle)&&(!selected||!text.includes(norm(selected))))return false;
  if(s==="all")return true;
  return x.sector===s||classifySector(x.sector)===s||(s==="technology"&&x.sector==="ai")||
  (s==="coal"&&x.sector==="energy")||(s==="infrastructure"&&["energy","ai"].includes(x.sector));
 });
 return rows.sort((a,b)=>String(b.published_at_utc||"").localeCompare(String(a.published_at_utc||"")));
}
function policyFor(list,opts){
 const needle=norm(opts.q),s=opts.sector;
 return list.filter(x=>{
  const line=norm([x.ref,x.label,x.sector,x.owner,x.note].join(" "));
  if(needle&&!line.includes(needle))return false;
  if(s==="all")return true;
  return x.sector===s||x.sector==="cross"||
   (s==="coal"&&x.sector==="energy")||
   (s==="technology"&&x.sector==="ai")||
   (s==="infrastructure"&&x.sector==="energy");
 });
}
function researchLink(issuer){
 const target=issuer?("IDX:"+issuer.ticker+" "+issuer.name+"; "):"";
 const prompt=(id()?
 "Riset lintas sumber SLI untuk "+target+"sektor "+group(sector)+". Periksa perubahan regulasi terbaru, berita bersumber dan data resmi bertanggal, cantumkan sumber primer, batas evidensi, dan jalur risiko tanpa mengarang dampak harga.":
 "Research SLI cross-sector context for "+target+group(sector)+". Compare enacted policy, attributed news and source-dated statistics; cite primary sources, limits and conditional risk paths without inventing market effects.");
 return urls.research+"?prompt="+encodeURIComponent(prompt.slice(0,1400));
}
function renderText(){
 for(const n of document.querySelectorAll("[data-terminal-id][data-terminal-en]"))n.textContent=id()?n.dataset.terminalId:n.dataset.terminalEn;
 const roleOptions=[["investor","Investor / Company","Investor / Perusahaan"],["research","Research / OSINT","Penelitian / OSINT"],["policy","Policy / Regulation","Kebijakan / Regulasi"]];
 for(const [v,en,ind]of roleOptions){const n=Array.from($("sliTerminalRole").options).find(x=>x.value===v);if(n)n.textContent=T(en,ind)}
 for(const n of $("sliTerminalSector").options)n.textContent=group(n.value);
}
function status(){
 const s=$("sliTerminalStatus");if(!s)return;
 s.textContent=ready?T("Connected to published SLI snapshots · last news ingestion: ","Terhubung ke snapshot SLI · data berita terakhir diperbarui: ")+fmtDate(source.meta.news):
 T("Source index is temporarily unavailable. The research shortcuts remain accessible.","Indeks sumber belum tersedia. Pintasan riset tetap dapat digunakan.");
}
function stats(){
 const root=$("sliTerminalStats");root.replaceChildren();
 const items=[
  [source.issuers.length,T("IDX issuer candidates","Kandidat emiten IDX")],
  [source.news.length,T("Attributable news records","Catatan berita teratribusi")],
  [source.policies.length,T("Regulatory references","Referensi regulasi")],
  [watch.size,T("Saved local tickers","Ticker tersimpan lokal")]
 ];
 for(const [v,title]of items){const b=E("div","sli-terminal-stat");b.append(E("strong",null,v),E("span",null,title));root.append(b)}
}
function renderEntities(){
 const list=$("sliTerminalEntityList"),details=$("sliTerminalSelected");
 list.replaceChildren();details.replaceChildren();
 const rows=filterIssuers(source.issuers,{sector,q,watch});
 const preferred=(selected&&rows.find(x=>x.ticker===selected))||rows.find(x=>watch.has(x.ticker))||rows[0];
 selected=preferred?.ticker||"";
 $("sliTerminalEntityCount").textContent=rows.length+" "+T("matched","cocok");
 const fragment=document.createDocumentFragment();
 for(const x of rows.slice(0,24)){
  const item=E("div","sli-terminal-entity"+(x.ticker===selected?" active":""));
  const choose=E("button","sli-terminal-select",x.ticker+" · "+x.name);
  choose.type="button";choose.setAttribute("aria-pressed",String(x.ticker===selected));
  choose.addEventListener("click",()=>{selected=x.ticker;draw()});
  const pin=E("button","sli-terminal-pin",watch.has(x.ticker)?T("Saved ✓","Tersimpan ✓"):T("+ Watch","+ Pantau"));
  pin.type="button";pin.setAttribute("aria-pressed",String(watch.has(x.ticker)));
  pin.title=T("Saved in this browser only","Hanya disimpan di browser ini");
  pin.addEventListener("click",()=>{if(watch.has(x.ticker))watch.delete(x.ticker);else if(watch.size<LIMIT_WATCH)watch.add(x.ticker);
    saveWatch();draw()});
  item.append(choose,pin);fragment.append(item);
 }
 list.append(fragment);
 if(rows.length>24)list.append(E("p","sli-terminal-note",T("Showing first 24; refine the search or sector.","Menampilkan 24 pertama; gunakan filter atau pencarian.")));
 if(!rows.length)list.append(E("p","sli-terminal-note",T("No matching issuer candidate. Try another ticker or sector.","Tidak ada kandidat emiten yang cocok. Coba ticker atau sektor lain.")));
 if(preferred){
  details.append(E("h3",null,"IDX:"+preferred.ticker+" · "+preferred.name),E("p","sli-terminal-note",group(preferred.sector)));
  const actions=E("div","sli-terminal-inline-actions");
  actions.append(a(corpURL(preferred.ticker),T("Company dossier ↗","Dossier emiten ↗")),
   a(researchLink(preferred),T("Research AI ↗","Riset AI ↗")));
  if(safeUrl(preferred.source_url))actions.append(a(safeUrl(preferred.source_url),T("IDX source ↗","Sumber BEI ↗"),true));
  details.append(actions);
  details.append(E("p","sli-terminal-note",T("Sector news and regulations alongside this record do not prove they affect this company. Listing status is subject to IDX verification.","Berita sektor dan regulasi di sebelah tidak otomatis membuktikan dampak pada emiten ini. Status emiten perlu verifikasi BEI.")));
 }
}
function renderNews(){
 const target=$("sliTerminalNews");target.replaceChildren();
 const current=source.issuers.find(x=>x.ticker===selected);
 const rows=newsFor(source.news,{sector,q,selected,issuer:current});
 const top=E("p","sli-terminal-count",rows.length+" "+T("matching attributed reports · newest first","laporan teratribusi yang cocok · terbaru dahulu"));target.append(top);
 for(const x of rows.slice(0,9)){
  const path=safeUrl(x.url);if(!path)continue;
  const card=E("article","sli-terminal-news-item");
  const headline=a(path,x.title,true);headline.className="sli-terminal-news-title";
  card.append(headline,E("p","sli-terminal-meta",[x.publisher,fmtDate(x.published_at_utc),group(classifySector(x.sector))].join(" · ")));
  card.append(E("small","sli-terminal-evidence",T("Publisher-attributed report · claims not independently corroborated","Laporan media teratribusi · klaim belum diverifikasi independen")));
  target.append(card);
 }
 if(!rows.length)target.append(E("p","sli-terminal-note",T("No matching records in the current published snapshot. This does not imply no news exists.","Tidak ada catatan yang sesuai pada snapshot. Bukan berarti peristiwa tidak ada.")));
}
function renderPolicies(){
 const target=$("sliTerminalPolicy");target.replaceChildren();
 const rows=policyFor(source.policies,{sector,q});
 target.append(E("p","sli-terminal-count",rows.length+" "+T("regulatory records match this context","catatan regulasi cocok dengan konteks")));
 for(const x of rows.slice(0,8)){
  const item=E("article","sli-terminal-law");
  item.append(E("strong",null,x.ref||x.label||"Regulation"));
  item.append(E("p",null,x.label||""));
  item.append(E("small","sli-terminal-meta",(x.tier||"").toUpperCase()+" · "+(x.status||T("Review current status","Periksa status berlaku"))));
  const sourceLink=safeUrl(x.source);if(sourceLink)item.append(a(sourceLink,T("Official reference ↗","Rujukan resmi ↗"),true));
  target.append(item);
 }
 if(!rows.length)target.append(E("p","sli-terminal-note",T("No matching policy record in the indexed sample.","Tidak ada regulasi yang sesuai pada indeks.")));
 target.append(E("p","sli-terminal-note",T("Legal validity, amendments and operative clauses require verification at JDIH or the official issuing institution.","Status berlaku, perubahan, dan pasal operatif harus diperiksa pada JDIH atau penerbit resmi.")));
}
function renderActions(){
 const target=$("sliTerminalActions");target.replaceChildren();
 const sel=source.issuers.find(x=>x.ticker===selected);
 const items=[
 [researchLink(sel),T("Open in DERGUBA AI ↗","Riset lanjut DERGUBA AI ↗")],
 [urls[sector]||"./index.html#overview",T("Sector dashboard ↗","Dashboard sektor ↗")],
 [urls.news+(sector==="all"?"":"?sector="+encodeURIComponent(sector)),T("News monitoring ↗","Monitoring berita ↗")],
 [urls.policy,T("Policy intelligence ↗","Intelijen regulasi ↗")],
 [urls.geopolitics,T("Geopolitics & commodity charts ↗","Geopolitik & grafik komoditas ↗")],
 ["./sli-glossary-methodology.html",T("Evidence methodology ↗","Metodologi evidensi ↗")]
 ];
 for(const [path,label]of items)target.append(a(path,label));
 target.append(E("p","sli-terminal-watch-disclaimer",T("Watchlist persists only on your current device. It is not an automated alert or recommendation.","Watchlist hanya disimpan pada perangkat ini, bukan notifikasi otomatis atau rekomendasi investasi.")));
}
function draw(){
 if(!ready)return;
 const root=$("sliTerminalRoot");if(root)root.dataset.workspace=role;
 renderText();stats();renderEntities();renderNews();renderPolicies();renderActions();
}
async function load(){
 try{
  const paths=[
   "./data/sli-idx-issuer-universe.json",
   "./data/sli-secondary-news-index.json",
   "./data/sli-policy-regulatory-graph-2026.json"];
  const results=await Promise.all(paths.map(x=>fetch(x,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error(x+" HTTP "+r.status);return r.json()})));
  if(results[0].schema!=="sli-idx-issuer-universe-v1"||!Array.isArray(results[0].records)||
   !Array.isArray(results[1].articles)||!Array.isArray(results[2].nodes))throw Error("Unexpected source schemas");
  source={
   issuers:results[0].records.filter(x=>x.exchange==="IDX"&&tickerRE.test(x.ticker||"")&&ALLOWED_SECTORS.has(x.sector)),
   news:results[1].articles.filter(x=>x.evidence_level==="publisher_attributed_news_report"||x.evidence_level==="official_metadata_change_candidate"),
   policies:results[2].nodes.filter(x=>x.id&&x.ref&&x.source&&x.kind!=="tier_marker"),
   meta:{news:results[1].updated_at_utc,issuers:results[0].as_of,policies:results[2].updated_at}
  };
  watch=readWatch();ready=true;
  const from=new URLSearchParams(location.search);
  const t=(from.get("ticker")||"").trim().toUpperCase();
  if(tickerRE.test(t)&&source.issuers.some(x=>x.ticker===t)){selected=t;sector=source.issuers.find(x=>x.ticker===t).sector;$("sliTerminalSector").value=sector}
  status();draw();
 }catch(err){console.warn("[SLI Terminal]",err);status();
  $("sliTerminalEntityList").append(E("p","sli-terminal-note",T("Unable to load source snapshots at present.","Snapshot sumber belum bisa dimuat.")))}
}
function main(){
 const r=$("sliTerminalRole"),s=$("sliTerminalSector"),input=$("sliTerminalSearch");
 if(!r||!s||!input)return;
 r.addEventListener("change",()=>{role=r.value;if(role==="policy"&&sector==="all"){sector="food";s.value=sector}draw()});
 s.addEventListener("change",()=>{sector=s.value;selected="";draw()});
 input.addEventListener("input",()=>{q=input.value.trim();selected="";draw()});
 document.addEventListener("keydown",event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){event.preventDefault();input.focus();input.select()}
  else if(event.key==="Escape"&&document.activeElement===input){input.value="";q="";selected="";draw()}
 });
 document.addEventListener("sli:languagechange",()=>{status();draw()});
 renderText();load();
}
window.SLIDecisionTerminal={filterIssuers,newsFor,policyFor,parseWatch,corpURL,sectorNames,sourceURLS:urls};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",main,{once:true});else main();
})();
