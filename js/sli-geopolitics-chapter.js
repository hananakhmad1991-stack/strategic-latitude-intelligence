/* SLI Geopolitical Intelligence — original, source-dated editorial assessment.
 * Source data: BPS/BKPM/BI/ESDM registers plus attributed monitoring archive.
 * A published headline is secondary evidence that it was REPORTED, not automatically
 * independent proof of closure, conflict, CAPEX, manufacturing output or impact.
 */
(()=>{"use strict";
const INPUTS={
 chapter:"./data/sli-geopolitical-chapter.json",
 official:"./data/sli-indonesia-original-intelligence.json",
 news:"./data/sli-secondary-news-index.json"
};
const FALLBACK_LINK="./geopolitical-impact-assessment.html";
const el=(t,cls,v)=>{const n=document.createElement(t);if(cls)n.className=cls;if(v!==undefined&&v!==null)n.textContent=String(v);return n};
const lang=()=>window.SLIi18n?.language==="id"?"id":"en";
const tx=(en,id)=>lang()==="id"?id:en;
const field=(x,k)=>lang()==="id"&&(x["id_"+k]||x["id_"+k]===0)?x["id_"+k]:x[k];
function safeUrl(url){
 try{
  if(/^\.\/[a-z0-9/_-]+(?:\.html)?(?:#[a-z0-9_-]+)?$/i.test(url))return url;
  if(/^\.\/sli-source-viewer\.html\?dataset=[a-z0-9._-]+\.json$/i.test(url))return url;
  const u=new URL(url);if(u.protocol==="https:"&&!u.username&&!u.password)return u.href;
 }catch{}return null;
}
function link(url,text,cls){
 const a=el("a",cls,text),safe=safeUrl(url);
 a.href=safe||FALLBACK_LINK;
 if(safe?.startsWith("https://")){a.target="_blank";a.rel="noopener noreferrer"}
 return a;
}
const dated=s=>{
 if(!s)return tx("Not dated","Belum bertanggal");
 const d=new Date(s);return Number.isFinite(d.getTime())?
 new Intl.DateTimeFormat(lang()==="id"?"id-ID":"en-GB",{dateStyle:"medium",timeZone:"Asia/Jakarta"}).format(d):
 String(s).slice(0,10);
};
const read=async url=>{const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);return r.json()};
const p=(text,cls)=>el("p",cls,text);
const h=(level,text,cls)=>el("h"+level,cls,text);
function createMetricCard(m){
 const c=el("article","geo-intel-metric");
 c.append(p(m.label,"geo-intel-metric-label"),el("strong","geo-intel-num",m.display||"—"));
 c.append(p((m.period||"—")+" · "+(m.publisher||"—"),"geo-intel-date"));
 if(safeUrl(m.source_url))c.append(link(m.source_url,tx("View original source ↗","Lihat sumber asli ↗")));
 return c;
}
function createTradeChart(partners){
 const group=el("section","geo-intel-section");group.id="geo-trade";
 group.append(h(2,tx("02 · Trade relationships as geopolitical exposure","02 · Hubungan perdagangan sebagai paparan geopolitik")),
 p(tx("Selected bilateral merchandise trade (BPS, 2025). Each bar displays exports and imports separately; the figure does not measure diplomatic alignment, services, investment stock or total welfare.",
 "Perdagangan barang bilateral terpilih (BPS, 2025). Batang menunjukkan ekspor dan impor secara terpisah; ini bukan ukuran kedekatan diplomatik, jasa, stok investasi, atau kesejahteraan nasional."),"geo-intel-muted"));
 const frame=el("div","geo-intel-tradechart");
 const limit=Math.max(1,...partners.flatMap(x=>[Number(x.exports)||0,Number(x.imports)||0]));
 for(const r of partners){
  const row=el("div","geo-intel-traderow"),top=el("div","geo-intel-tradehead"),
  title=el("strong",null,r.country),balance=el("span",null,(Number(r.balance)<0?"−":"+")+"US$"+Math.abs(Number(r.balance)).toFixed(2)+"bn");
  top.append(title,balance);row.append(top);
  for(const [key,label] of [["exports",tx("Exports","Ekspor")],["imports",tx("Imports","Impor")]]){
   const v=Number(r[key])||0,bar=el("div","geo-intel-tradebar"),fill=el("span","geo-intel-tradefill "+key);
   fill.style.width=(v/limit*100)+"%";bar.append(fill);
   const detail=el("div","geo-intel-bardesc");detail.append(el("span",null,label),bar,el("b",null,"US$"+v.toFixed(2)+"bn"));row.append(detail);
  }
  row.append(link(r.source_url,tx("BPS source ↗","Sumber BPS ↗")));frame.append(row);
 }
 group.append(frame,p(tx("Net trade is exports minus imports for the same partner and 2025 goods scope. Do not convert these figures into current tariff impacts or forecasts.",
 "Neraca adalah ekspor dikurangi impor untuk negara dan cakupan barang pada tahun 2025 yang sama. Jangan mengubah angka ini menjadi dampak tarif terkini atau proyeksi tanpa model dan data lain."),"geo-intel-source-note"));
 return group;
}
function createTopicCard(theme,active,choose){
 const b=el("button","geo-intel-topic"+(active?" active":""),null);
 b.type="button";b.setAttribute("aria-pressed",String(active));
 b.append(el("span","geo-intel-topic-index",String(theme.order).padStart(2,"0")),el("strong",null,field(theme,"title")),el("small",null,field(theme,"thesis")));
 b.addEventListener("click",()=>choose(theme.id));
 return b;
}
function createTopicDetail(theme,metricMap){
 const wrap=el("section","geo-intel-topicdetail");wrap.id="geo-chosen-topic";
 wrap.append(p(theme.region+" · "+theme.tag,"geo-intel-kicker"),
 h(3,field(theme,"title")),p(field(theme,"thesis"),"geo-intel-topic-thesis"));
 const grid=el("div","geo-intel-analysis-grid");
 for(const [a,k] of [
 [tx("How the risk travels","Bagaimana risiko merambat"),"mechanism"],
 [tx("Why it matters for Indonesia","Mengapa penting bagi Indonesia"),"indonesia"],
 [tx("What is not yet established","Apa yang belum terbukti"),"counter"],
 [tx("What SLI should monitor","Apa yang perlu dipantau SLI"),"watch"]
 ]){
  const block=el("article","geo-intel-analytical-panel");
  block.append(h(4,a),p(field(theme,k)));grid.append(block);
 }
 wrap.append(grid);
 const facts=el("div","geo-intel-facts");
 for(const id of theme.evidence||[]){
  const m=metricMap.get(id);if(m)facts.append(createMetricCard(m));
 }
 if(facts.children.length){wrap.append(h(4,tx("Relevant measured baselines · distinct reference periods","Indikator terukur terkait · periode rujukan berbeda")),facts)}
 const more=el("div","geo-intel-links");for(const item of theme.links||[])more.append(link(item.url,item.label+" ↗"));
 wrap.append(more);return wrap;
}
const newsValid=x=>x&&typeof x.title==="string"&&typeof x.publisher==="string"&&x.title.length>10&&
 safeUrl(x.url)&&Number.isFinite(Date.parse(x.published_at_utc||""))&&
 ["publisher_attributed_news_report","official_metadata_change_candidate"].includes(x.evidence_level);
function matchesTopic(x,theme,query){
 const hay=[x.title,x.publisher,x.topic,x.geo].join(" ").toLowerCase();
 const keywords=(theme?.search||[]).map(z=>z.toLowerCase()).filter(s=>s.length>=3);
 const typed=query.toLowerCase().trim();
 return (!typed||hay.includes(typed))&&(!theme||keywords.some(term=>hay.includes(term)));
}
function renderNews(root,index,theme,query){
 root.replaceChildren();
 if(!index?.articles?.length){root.append(p(tx("Monitoring index is temporarily unavailable; geopolitical analysis and official data remain accessible.","Indeks monitoring belum tersedia; analisis geopolitik dan data resmi tetap bisa dibaca.")));return}
 const all=index.articles.filter(newsValid),matched=all.filter(x=>matchesTopic(x,theme,query));
 const header=p(tx("Showing ","Menampilkan ")+Math.min(8,matched.length)+" / "+matched.length+
  tx(" relevant attributed reports · index updated "," berita relevan teratribusi · indeks diperbarui ")+dated(index.updated_at_utc),"geo-intel-meta");
 root.append(header);
 if(!matched.length){root.append(p(tx("No qualifying items in this snapshot for the selected topic; absence of headlines is not absence of geopolitical events.","Tidak ada berita cocok pada snapshot ini; ketiadaan headline bukan berarti tidak ada perkembangan geopolitik.")));return}
 for(const x of matched.slice(0,8)){
  const box=el("article","geo-intel-news-item"),kind=x.evidence_level==="official_metadata_change_candidate";
  box.append(link(x.url,x.title,"geo-intel-headline"));
  box.append(p(x.publisher+" · "+dated(x.published_at_utc)+" · "+String(x.sector||"").toUpperCase(),"geo-intel-meta"));
  box.append(p(kind?
   tx("Official-listing metadata change; legal effect not established.","Perubahan metadata dokumen; akibat hukum belum ditetapkan."):
   tx("Attributed secondary news · reported headline, not independent confirmation of every claim.","Berita sekunder teratribusi · headline terlapor, bukan konfirmasi independen setiap klaim."),"geo-intel-small"));
  root.append(box);
 }
}
function render(root,chapter,official,news){
 if(!root.isConnected)return;
 root.replaceChildren();
 const metricMap=new Map((official?.metrics||[]).map(m=>[m.id,m]));
 const hero=el("section","geo-intel-hero");
 hero.append(p("STRATEGIC LATITUDE INTELLIGENCE · INDONESIA","geo-intel-kicker"),
 h(1,tx("Geopolitical Intelligence","Intelijen Geopolitik")),
 p(tx("How global security, economic competition, technology and diplomacy transmit risk into Indonesia's energy, trade, industry and investment decisions.",
 "Bagaimana keamanan global, persaingan ekonomi, teknologi, dan diplomasi memengaruhi energi, perdagangan, industri, serta keputusan investasi Indonesia."),"geo-intel-lead"));
 const meta=el("div","geo-intel-meta-row");
 meta.append(el("span",null,tx("Analysis edition: ","Edisi analisis: ")+chapter.as_of),
 el("span",null,tx("Official data: source-dated","Data resmi: sesuai periode sumber")),
 el("span",null,tx("News: attributed secondary evidence","Berita: sumber sekunder teratribusi")));
 hero.append(meta);root.append(hero);
 const jump=el("nav","geo-intel-jump");jump.setAttribute("aria-label","Geopolitical Intelligence sections");
 for(const [label,url] of [[tx("Policy & regulations","Kebijakan & regulasi"),"./index.html#policy"],
 [tx("Indonesia deep-dive dossiers","Riset mendalam Indonesia"),FALLBACK_LINK],
 [tx("Research AI","Research AI"),"./sli-research-ai.html"]])jump.append(link(url,label+" ↗"));
 root.append(jump);
 const stateIntro=el("section","geo-intel-section");stateIntro.append(h(2,tx("01 · Strategic position and external vulnerabilities","01 · Posisi strategis dan kerentanan eksternal")),
 p(tx("Indonesia is not exposed to one single geopolitical shock. Its vulnerabilities are transmitted through imported petroleum, freight and insurance, exported commodities, access to advanced technologies, foreign capital and domestic grid reliability. A shock can improve one sector's terms of trade while raising costs for another.",
 "Indonesia tidak terpapar satu jenis guncangan geopolitik saja. Risiko merambat melalui impor migas, ongkos angkut dan asuransi, ekspor komoditas, akses teknologi maju, modal asing, dan keandalan listrik domestik. Guncangan dapat menguntungkan satu sektor sekaligus menaikkan biaya sektor lain."),"geo-intel-lead"));
 const line=el("div","geo-intel-facts");
 for(const id of ["oil_deficit","reserves","surplus","investment"]){const m=metricMap.get(id);if(m)line.append(createMetricCard(m))}
 stateIntro.append(line,p(tx("These are distinct observation periods and units; do not aggregate them or treat them as a geopolitical risk index.",
 "Indikator ini memiliki satuan dan periode berbeda; jangan menjumlahkan atau menganggapnya sebagai indeks risiko geopolitik."),"geo-intel-source-note"));root.append(stateIntro);
 root.append(createTradeChart(official?.partners||[]));
 const timelineRoot=el("div");timelineRoot.id="sliGeoTimelineRoot";root.append(timelineRoot);
 const desk=el("section","geo-intel-section");desk.append(h(2,tx("04 · Six geopolitical theatres shaping Indonesia","04 · Enam medan geopolitik yang memengaruhi Indonesia")),
 p(tx("Choose a theatre to read mechanisms, counterevidence, measured indicators and issues to monitor. Analysis is editorial and conditional; numbers come only from the original data register.",
 "Pilih tema untuk membaca mekanisme, bukti pembanding, indikator terukur, serta perkembangan yang perlu dipantau. Analisis bersifat editorial dan bersyarat; angka hanya berasal dari registri data asli."),"geo-intel-muted"));
 const chooser=el("div","geo-intel-chooser"),details=el("div","geo-intel-detail-slot");desk.append(chooser,details);root.append(desk);
 const feed=el("section","geo-intel-section");feed.id="geo-news";
 feed.append(h(2,tx("05 · News and OSINT · attributed secondary evidence","05 · Berita dan OSINT · data sekunder teratribusi")),
 p(tx("Reuters, CGTN, ANTARA and other monitored publishers are eligible. The original media headline is usable evidence of what a publisher reported; the occurrence, magnitude and quantified Indonesian impact require further comparison with official records and independent OSINT.",
 "Reuters, CGTN, ANTARA, dan media monitoring lainnya dapat digunakan. Headline merupakan bukti apa yang dilaporkan penerbit; kejadian, besaran, dan dampak terukur bagi Indonesia perlu diuji dengan data resmi dan OSINT lain."),"geo-intel-muted"));
 const filter=el("div","geo-intel-controls"),topic=el("select","geo-intel-select"),
 search=el("input","geo-intel-search");
 topic.setAttribute("aria-label",tx("Choose geopolitical theme","Pilih tema geopolitik"));
 for(const x of [{id:"all",title:tx("All monitored geopolitical topics","Semua topik geopolitik")},...chapter.themes.map(t=>({id:t.id,title:field(t,"title")}))]){
  const opt=el("option",null,x.title);opt.value=x.id;topic.append(opt)
 }
 search.type="search";search.placeholder=tx("Search publisher or issue…","Cari media atau isu…");search.setAttribute("aria-label","Search geopolitical news archive");
 filter.append(topic,search,link("./sli-source-viewer.html?dataset=sli-secondary-news-index.json",tx("Source register ↗","Registri sumber ↗")));
 const listing=el("div","geo-intel-news-grid");feed.append(filter,listing);root.append(feed);
 const scenarios=el("section","geo-intel-section");scenarios.append(h(2,tx("06 · Scenario pathways, not probability forecasts","06 · Jalur skenario, bukan ramalan probabilitas")));
 const cases=el("div","geo-intel-scenarios");
 for(const s of chapter.scenarios||[]){
  const card=el("article","geo-intel-scenario");
  card.append(h(3,field(s,"title")),p(field(s,"narrative")));cases.append(card)
 }scenarios.append(cases);root.append(scenarios);
 const conclusion=el("section","geo-intel-section geo-intel-conclusion");
 conclusion.append(h(2,tx("07 · Overall strategic assessment","07 · Penilaian strategis keseluruhan")));
 const ordered=el("ol","geo-intel-assessment");
 for(const [en,id] of chapter.assessments||[])ordered.append(el("li",null,tx(en,id)));
 conclusion.append(ordered,
  p(tx("This is an original SLI synthesis, not a conflict forecast, legal finding or investment recommendation. Recheck publication dates, article bodies, contract terms and source rights before external use.",
 "Ini sintesis orisinal SLI, bukan ramalan konflik, putusan hukum, atau rekomendasi investasi. Periksa ulang tanggal publikasi, isi artikel, kontrak, dan hak penggunaan sebelum disebarluaskan."),"geo-intel-source-note"));
 root.append(conclusion);
 let current="maritime";
 function update(){
  const theme=chapter.themes.find(t=>t.id===current)||chapter.themes[0];
  chooser.replaceChildren();for(const x of chapter.themes)chooser.append(createTopicCard(x,x.id===theme.id,choose));
  details.replaceChildren(createTopicDetail(theme,metricMap));
 }
 function choose(id){current=id;update();topic.value=id;renderNews(listing,news,chapter.themes.find(t=>t.id===id),search.value)}
 topic.addEventListener("change",()=>renderNews(listing,news,chapter.themes.find(t=>t.id===topic.value),search.value));
 search.addEventListener("input",()=>renderNews(listing,news,chapter.themes.find(t=>t.id===topic.value),search.value));
 update();topic.value="all";renderNews(listing,news,null,"");
}
async function init(){
 const root=document.getElementById("sliGeoChapterRoot");if(!root)return;
 const [chapter,official,news]=await Promise.allSettled(Object.values(INPUTS).map(read));
 if(!root.isConnected)return;
 if(chapter.status!=="fulfilled"||!Array.isArray(chapter.value?.themes)||chapter.value.themes.length!==6){
  root.replaceChildren(h(2,tx("Geopolitical chapter temporarily unavailable","Bab geopolitik belum dapat dimuat")),
   p(tx("Please try refreshing; existing Indonesia intelligence dossiers remain accessible.","Silakan segarkan halaman; dossier Intelijen Indonesia masih tersedia.")),
   link(FALLBACK_LINK,tx("Open Indonesia Intelligence ↗","Buka Intelijen Indonesia ↗")));
  return;
 }
 render(root,chapter.value,official.status==="fulfilled"?official.value:null,
  news.status==="fulfilled"?news.value:null);
 if(typeof window.initSLIGeopoliticalTimeline==="function")window.initSLIGeopoliticalTimeline().catch(err=>console.error("[SLI geopolitical timeline]",err));
}
window.initSLIGeopoliticsChapter=init;
document.addEventListener("sli:languagechange",()=>{if(document.getElementById("sliGeoChapterRoot"))init()});
})();