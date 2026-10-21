/* Unified Food / Minerals monitoring lens. Uses the same attributed secondary index as Research AI. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const en=()=>document.documentElement.lang?.toLowerCase().startsWith("en");
const T=(id,e)=>en()?e:id;
const E=(t,c,v)=>{const n=document.createElement(t);if(c)n.className=c;if(v!==undefined)n.textContent=String(v);return n};
const sectorRefs={
 food:{id:"Pangan & Pertanian",en:"Food & Agriculture",paths:[["Dashboard pangan","Food dashboard","./food-agriculture-intelligence.html"],["Peta kelembagaan","Institutions","./food-agriculture-intelligence.html#fa-hierarchy"],["Kebijakan pangan","Food policy","./policy-regulatory-intelligence.html"]]},
 marine:{id:"Kelautan & Perikanan",en:"Marine & Fisheries",paths:[["Dashboard KKP","KKP dashboard","./marine-fisheries-intelligence.html"],["Peraturan KKP","KKP regulations","./policy-regulatory-intelligence.html?sector=marine"],["Entitas kelautan","Marine entities","./sli-entities.html?sector=marine"]]},
 minerals:{id:"Mineral Kritis",en:"Critical Minerals",paths:[["Dashboard mineral","Minerals dashboard","./index.html#minerals"],["Investasi mineral","Mineral projects","./index.html#investment"],["Regulasi mineral","Minerals policy","./policy-regulatory-intelligence.html"]]}
};
let news=null,radar=null;
function safe(u){try{const x=new URL(u,document.baseURI);return x.protocol==="https:"&&!x.username&&!x.password?x.href:null}catch{return null}}
function link(u,v){const a=E("a",null,v);a.href=u;return a}
function date(s){const v=new Date(s);return Number.isFinite(v.getTime())?v.toLocaleDateString(en()?"en-GB":"id-ID",{timeZone:"Asia/Jakarta",year:"numeric",month:"short",day:"numeric"}):"—"}
function sector(row){return String(row?.sector||"").toLowerCase()}
function relevant(row,chosen,scope,q){
 const sec=sector(row);if(chosen!=="all"&&sec!==chosen)return false;
 const origin=String(row.monitor_source||"");
 if(scope!=="all"&&String(row.scope||"")!==scope)return false;
 const corpus=[row.title,row.publisher,row.topic,row.geo].join(" ").toLowerCase();
 return !q||corpus.includes(q);
}
function render(){
 if(!news)return;
 for(const n of document.querySelectorAll("[data-en][data-id]"))n.textContent=en()?n.dataset.en:n.dataset.id;
 for(const [value,idText,enText] of [["food","Pangan & Pertanian","Food & Agriculture"],["minerals","Mineral Kritis","Critical Minerals"],["marine","Kelautan & Perikanan","Marine & Fisheries"],["all","Seluruh sektor","All monitored sectors"]]){
  const n=Array.from($("sliNewsSector").options).find(x=>x.value===value);if(n)n.textContent=T(idText,enText);
 }
 const root=$("sliNewsCards");root.replaceChildren();
 const chosen=$("sliNewsSector").value,scope=$("sliNewsScope").value,q=$("sliNewsSearch").value.toLowerCase().trim();
 let arr=news.articles.filter(row=>relevant(row,chosen,scope,q)&&safe(row.url))
   .sort((a,b)=>Date.parse(b.published_at_utc||"")-Date.parse(a.published_at_utc||""));
 const info=$("sliNewsInsights");info.replaceChildren();
 const radarCount=chosen==="all"?null:radar?.counts?.[chosen];
 const head=E("div","sli-news-kpi");head.append(E("small",null,T("Laporan tersimpan yang cocok","Matching archived reports")),E("strong",null,String(arr.length)));info.append(head);
 const b=E("div","sli-news-kpi");b.append(E("small",null,T("Radar geopolitik/domestik terbaru","Latest geopolitical/domestic radar")));
 b.append(E("strong",null,radarCount?String(radarCount.geopolitical||0)+" / "+String(radarCount.domestic||0):"—"));info.append(b);
 const last=E("div","sli-news-kpi");last.append(E("small",null,T("Snapshot arsip terakhir","Last archive snapshot")),E("strong",null,date(news.updated_at_utc)));info.append(last);
 if(!arr.length)root.append(E("p","sli-news-empty",T("Belum ada berita yang cocok dalam arsip yang telah dipublikasikan. Ini bukan berarti tidak ada peristiwa; silakan cek ulang setelah pemindaian otomatis berikutnya.","No matching published reports yet. This does not mean nothing happened; check after the next monitoring scan.")));
 for(const item of arr.slice(0,60)){
  const card=E("article","sli-news-report"),label=sectorRefs[sector(item)];
  const h=E("h3");const a=link(safe(item.url),item.title);a.target="_blank";a.rel="noopener noreferrer";h.append(a);card.append(h);
  card.append(E("p","sli-news-report-meta",[item.publisher,date(item.published_at_utc),label?T(label.id,label.en):item.sector].join(" · ")));
  const p=E("p","sli-news-note",item.evidence_level==="official_metadata_change_candidate"
  ?T("Kandidat metadata resmi; status hukum harus dicek.","Official listing candidate; check legal force.")
  :T("Laporan media teratribusi; isi/angka belum divalidasi independen.","Publisher-attributed reporting; contents and numbers not independently validated."));
  card.append(p);
  const acts=E("div","sli-news-report-links");
  if(label)for(const [idText,enText,url]of label.paths)acts.append(link(url,T(idText,enText)));
  acts.append(link("./index.html#geopolitics",T("Geopolitik ↗","Geopolitics ↗")));
  const prompt=(label?T(label.id,label.en):"Indonesia")+" · "+item.title+". "+T("Bandingkan berita ini dengan sumber resmi, status kebijakan dan data historis SLI; jelaskan mana fakta yang dapat diperiksa dan mana temuan awal.","Compare this report with source-dated SLI official evidence and policy, separating confirmed facts from attributed claims.");
  acts.append(link("./sli-research-ai.html?prompt="+encodeURIComponent(prompt.slice(0,1100)),T("Analisis dengan Research AI ↗","Analyze with Research AI ↗")));
  card.append(acts);root.append(card);
 }
 const s=$("sliNewsStatus");const indexed=news.count||news.articles.length;
 s.textContent=T("Arsip "+indexed+" berita sekunder teratribusi · "+arr.length+" cocok · terakhir "+date(news.updated_at_utc),
 "Archive "+indexed+" attributed secondary reports · "+arr.length+" matching · last update "+date(news.updated_at_utc));
}
async function main(){
 const src=["./data/sli-secondary-news-index.json","./data/research-signal-radar.json"];
 const results=await Promise.allSettled(src.map(u=>fetch(u,{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject(Error("HTTP "+r.status)))));
 if(results[0].status!=="fulfilled"||!Array.isArray(results[0].value.articles)){
  $("sliNewsStatus").textContent=T("Arsip berita tidak tersedia; sumber belum bisa dimuat.","Monitoring archive unavailable.");return}
 news=results[0].value;radar=results[1].status==="fulfilled"?results[1].value:null;
 const val=new URLSearchParams(location.search).get("sector");
 if(val==="minerals"||val==="food"||val==="marine"||val==="all")$("sliNewsSector").value=val;
 for(const id of ["sliNewsSector","sliNewsScope","sliNewsSearch"])$(id).addEventListener(id==="sliNewsSearch"?"input":"change",render);
 document.addEventListener("sli:languagechange",render);
 const observer=new MutationObserver(a=>{if(a.some(e=>e.attributeName==="lang"))render()});observer.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
 for(const n of document.querySelectorAll("[data-en][data-id]"))n.textContent=en()?n.dataset.en:n.dataset.id;
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",main,{once:true});else main();
})();
