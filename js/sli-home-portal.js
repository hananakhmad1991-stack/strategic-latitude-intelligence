/* SLI homepage national snapshot. Source values are read from the dated SLI macro
   register, never hardcoded in the landing page or presented as live market prices. */
(()=>{"use strict";
const METRICS=[
 {id:"real_gdp_growth",label:["Real GDP growth","Pertumbuhan PDB riil"]},
 {id:"inflation_yoy",label:["Headline CPI inflation","Inflasi IHK tahunan"]},
 {id:"bi_policy_rate",label:["BI policy rate","Suku bunga kebijakan BI"]},
 {id:"usd_idr_jisdor",label:["USD/IDR · JISDOR","USD/IDR · JISDOR"]}
];
const isId=()=>window.SLIi18n?.language==="id"||document.documentElement.lang?.toLowerCase().startsWith("id");
const T=(en,bahasa)=>isId()?bahasa:en;
let cache=null,pending=null,cacheAt=0;
const TTL=5*60*1000;
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e}
const secureSource=url=>{try{const u=new URL(url);return u.protocol==="https:"?u.href:null}catch{return null}};
async function readMetrics(){
 if(cache&&Date.now()-cacheAt<TTL)return cache;
 if(!pending)pending=fetch("./data/sli-macro-indonesia-2026.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("data unavailable");return r.json()}).then(j=>{
  if(!Array.isArray(j.metrics)||!j.sources||typeof j.sources!=="object")throw Error("invalid source register");
  cache=j;cacheAt=Date.now();return j
 }).finally(()=>{pending=null});
 return pending;
}
async function render(){
 const host=document.getElementById("sliPortalMetrics");if(!host)return;
 try{
  const register=await readMetrics();
  if(document.getElementById("sliPortalMetrics")!==host)return; // switched dashboard
  host.replaceChildren();
  for(const spec of METRICS){
   const m=register.metrics.find(x=>x.id===spec.id);
   const source=m&&register.sources[m.source_id],url=secureSource(source?.url);
   const valid=Number.isFinite(m?.value)&&typeof m?.unit==="string"&&typeof m?.period==="string"&&url;
   const card=el("article","sli-portal-metric-card");
   card.append(el("span",null,T(...spec.label)));
   card.append(el("strong",null,valid?(String(m.display||m.value)+(spec.id==="usd_idr_jisdor"?" IDR":" "+m.unit)):T("Not available","Tidak tersedia")));
   card.append(el("small",null,valid?(T("Observed ","Observasi ")+m.period+" · "+source.publisher):T("No approved observed value","Belum ada nilai observasi terverifikasi")));
   const link=el("a",null,T("Source & date ↗","Sumber & tanggal ↗"));
   link.href=valid?url:"./indonesia-macroeconomic-intelligence.html";
   if(valid){link.target="_blank";link.rel="noopener noreferrer"}
   if(valid&&m.caveat)link.title=m.caveat;
   card.append(link);host.append(card);
  }
 }catch{
  if(document.getElementById("sliPortalMetrics")===host){
   host.replaceChildren(el("p","sli-portal-metric-loading",T("Indicators are temporarily unavailable. Open the macroeconomic dashboard for dated figures.","Indikator sementara tidak tersedia. Buka dashboard makroekonomi untuk angka dan periode rujukannya.")));
  }
 }
}
let healthPending=null,healthCache=null,healthAt=0;
function readHealth(){
 if(healthCache&&Date.now()-healthAt<TTL)return Promise.resolve(healthCache);
 if(!healthPending)healthPending=fetch("./data/sli-automation-health.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("health unavailable");return r.json()}).then(d=>{if(!d.summary||!Number.isFinite(Date.parse(d.generated_at_utc)))throw Error("invalid audit");healthCache=d;healthAt=Date.now();return d}).finally(()=>{healthPending=null});
 return healthPending;
}
async function renderHealth(){
 const host=document.getElementById("sliPortalMetrics");if(!host)return;
 let strip=document.getElementById("sliPortalFreshness");
 if(!strip){strip=el("section","sli-executive-freshness");strip.id="sliPortalFreshness";strip.setAttribute("aria-label","Data freshness");host.insertAdjacentElement("afterend",strip)}
 try{
 const d=await readHealth();if(!strip.isConnected)return;
 const age=(Date.now()-Date.parse(d.generated_at_utc))/3600000;
 const n=d.summary.overdue_or_broken_datasets,f=d.summary.workflow_failures_latest;
 const title=el("strong",null,T("Data freshness audit","Audit kesegaran data"));
 const date=el("span",null,new Intl.DateTimeFormat(isId()?"id-ID":"en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(new Date(d.generated_at_utc))+" WIB");
 const status=el("span","sli-freshness-status",age>12?T("Audit overdue","Audit terlambat"):Number.isFinite(n)&&Number.isFinite(f)?(n||f?T(n+" datasets need review · "+f+" workflow failures",n+" dataset perlu ditinjau · "+f+" workflow gagal"):T("No recorded issues","Tidak ada masalah tercatat")):T("Status unavailable","Status tidak tersedia"));
 status.dataset.state=age>12||n||f?"attention":"neutral";
 const link=el("a",null,T("Audit details ↗","Detail audit ↗"));link.href="./sli-source-viewer.html?dataset=sli-automation-health.json";
 strip.replaceChildren(title,date,status,link);
 }catch{if(strip.isConnected)strip.replaceChildren(el("span",null,T("Data freshness audit unavailable","Audit kesegaran data tidak tersedia")))}
}
let headlinesCache=null,headlinesAt=0,headlinesPending=null;
function readHeadlines(){
 if(headlinesCache&&Date.now()-headlinesAt<TTL)return Promise.resolve(headlinesCache);
 if(!headlinesPending)headlinesPending=fetch("./data/sli-secondary-news-index.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("news unavailable");return r.json()}).then(d=>{
 if(d.schema_version!=="sli-secondary-news-index-v1"||!Array.isArray(d.articles))throw Error("invalid news index");
 headlinesCache=d;headlinesAt=Date.now();return d;
 }).finally(()=>{headlinesPending=null});
 return headlinesPending;
}
async function renderHeadlines(){
 const host=document.getElementById("sliExecutiveHeadlines");if(!host)return;
 host.className="sli-terminal-headlines";
 try{
 const d=await readHeadlines();if(document.getElementById("sliExecutiveHeadlines")!==host)return;
 const now=Date.now(),rows=d.articles.filter(x=>x.evidence_level==="publisher_attributed_news_report"&&typeof x.title==="string"&&typeof x.publisher==="string"&&secureSource(x.url)&&Number.isFinite(Date.parse(x.published_at_utc))&&Date.parse(x.published_at_utc)<=now).sort((a,b)=>Date.parse(b.published_at_utc)-Date.parse(a.published_at_utc)).slice(0,6);
 const fmt=v=>new Intl.DateTimeFormat(isId()?"id-ID":"en-GB",{dateStyle:"medium",timeZone:"Asia/Jakarta"}).format(new Date(v));
 const title=el("h3",null,T("Latest strategic reporting","Pemberitaan strategis terbaru"));
 const recent=rows[0]&&now-Date.parse(rows[0].published_at_utc)<=48*3600000;
 const meta=el("p","sli-terminal-meta",rows.length?T("Latest source: ","Sumber terakhir: ")+fmt(rows[0].published_at_utc)+(recent?"":" · "+T("No reports dated within 48 hours","Tidak ada laporan bertanggal dalam 48 jam")):T("No eligible reports","Tidak ada laporan yang memenuhi syarat"));
 host.replaceChildren(title,meta);
 for(const item of rows){const link=el("a","sli-terminal-story");link.href=secureSource(item.url);link.target="_blank";link.rel="noopener noreferrer";link.append(el("strong",null,item.title),el("small",null,item.publisher+" · "+fmt(item.published_at_utc)+" · "+String(item.sector||"").toUpperCase()));host.append(link)}
 host.append(el("p","sli-terminal-meta",T("Publisher-attributed headlines; not independently verified events.","Judul teratribusi penerbit; bukan kejadian terverifikasi independen.")));
 const link=el("a",null,T("News sources & methodology ↗","Sumber berita & metodologi ↗"));link.href="./sli-source-viewer.html?dataset=sli-secondary-news-index.json";host.append(link);
 }catch{if(host.isConnected)host.replaceChildren(el("h3",null,T("Latest strategic reporting","Pemberitaan strategis terbaru")),el("p","sli-terminal-meta",T("News index temporarily unavailable","Indeks berita sementara tidak tersedia")))}
}
window.initSLIPortalMetrics=()=>{render();renderHealth();renderHeadlines()};
document.addEventListener("sli:languagechange",renderHeadlines);
window.setInterval(()=>{if(document.visibilityState==="visible"&&document.getElementById("sliPortalMetrics")){render();renderHealth();renderHeadlines()}},TTL);
document.addEventListener("sli:languagechange",renderHealth);
document.addEventListener("sli:languagechange",()=>{if(document.getElementById("sliPortalMetrics"))render()});
})();
