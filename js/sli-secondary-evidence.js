/* Sitewide SLI Secondary Evidence: one consistent, provenance-aware news index.
 * An attributable report is a usable SECONDARY source of what a publisher reported.
 * It is not independent verification of each reported fact or project/price metric.
 * Uses only SLI repository-published metadata; no copyrighted article scraping.
 */
(()=>{'use strict';
if(window.SLISecondaryEvidence?.installed)return;
const FEED='./data/sli-secondary-news-index.json',MAX_ITEMS=4000,TTL=5*60*1000;
let snapshot=null,lastRead=0,pending=null,serial=0;
const lang=()=>window.SLIi18n?.language==='id'||document.documentElement.lang==='id'?'id':'en';
const tr=(en,id)=>lang()==='id'?id:en;
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e}
function safeUrl(url){
 try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&u.port===''&&
  u.hostname&&!(/^(?:localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(u.hostname))?u.href:null}catch{return null}
}
const scopeFor=(path,hash='')=>{
 const val=(path||'').split('/').pop()||'index.html',route=val==='index.html'?(hash||'').replace(/^#/,''):'';
 if(/^(ai|aihub|digital|digitalgov|komdigi)$/.test(route)||/^(ai-|digital-|indonesia-ai-)/.test(val))return 'ai';
 if(/^(energy|electricity|ruptl)$/.test(route)||/^(pln-|ruplt-|energy-)/.test(val))return 'energy';
 if(route==='minerals'||/mineral|smelter/.test(val))return 'minerals';
 if(route==='trade'||/trade/.test(val))return 'trade';
 if(route==='climate'||/climate|environment/.test(val))return 'energy';
 if(route==='indo'||/geopolitical/.test(val))return 'all';
 if(/^(investment|macro|province|gini|opportunity|policy|ria|labs)$/.test(route)||/investment|provincial|macroeconomic|gini|policy|regulatory|intelligence-labs/.test(val))return 'regional';
 return 'all';
};
const context=()=>scopeFor(location.pathname,location.hash);
const label=s=>({all:tr('All subjects','Semua topik'),regional:tr('Investment, provinces & policy','Investasi, provinsi & kebijakan'),
 energy:tr('Energy, security & environment','Energi, keamanan & lingkungan'),ai:tr('AI, technology & data centers','AI, teknologi & pusat data'),
 minerals:tr('Critical minerals','Mineral kritis'),trade:tr('Trade & supply chains','Perdagangan & rantai pasok')}[s]||s);
function formatDate(value){const d=new Date(value||'');return Number.isFinite(d.getTime())?
 new Intl.DateTimeFormat(lang()==='id'?'id-ID':'en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Jakarta'}).format(d):tr('Date unavailable','Tanggal tidak tersedia')}
function eligible(record){return record&&typeof record.title==='string'&&record.title.length>=12&&
 typeof record.publisher==='string'&&record.publisher.length>=3&&typeof record.url==='string'&&safeUrl(record.url)&&
 Number.isFinite(Date.parse(record.published_at_utc||''))&&typeof record.sector==='string'}
async function read(){
 if(snapshot&&Date.now()-lastRead<TTL)return snapshot;
 if(pending)return pending;
 pending=fetch(FEED,{cache:'no-store'}).then(async r=>{
  if(!r.ok)throw Error('HTTP '+r.status);
  const content=await r.text();if(content.length>12000000)throw Error('index_too_large');
  const doc=JSON.parse(content);
  if(doc.schema_version!=='sli-secondary-news-index-v1'||!Array.isArray(doc.articles)||doc.articles.length>MAX_ITEMS)
   throw Error('invalid_index');
  snapshot={...doc,articles:doc.articles.filter(eligible)};
  lastRead=Date.now();return snapshot;
 }).finally(()=>{pending=null});
 return pending;
}
function rowsFor(doc,{sector='all',term='',limit=8}={}){
 const q=String(term||'').toLocaleLowerCase().trim();
 return doc.articles.filter(x=>(sector==='all'||x.sector===sector)&&
  (!q||[x.title,x.publisher,x.topic,x.geo].some(v=>String(v||'').toLocaleLowerCase().includes(q))))
  .sort((a,b)=>Date.parse(b.published_at_utc)-Date.parse(a.published_at_utc)).slice(0,limit);
}
function renderResults(panel,doc){
 const filter=panel.querySelector('[data-sli-news-filter]');
 const search=panel.querySelector('[data-sli-news-search]');
 const root=panel.querySelector('[data-sli-news-results]'),meta=panel.querySelector('[data-sli-news-meta]');
 if(!root)return;
 const selected=filter?.value||'all',keyword=search?.value.trim()||'';
 const rows=rowsFor(doc,{sector:selected,term:keyword,limit:Number(panel.querySelector('[data-sli-news-limit]')?.value||8)});
 root.replaceChildren();
 if(!rows.length)root.append(el('p','sli-news-empty',tr('No matching attributed news in this snapshot.','Belum ada berita teratribusi yang sesuai pada snapshot ini.')));
 for(const item of rows){
  const card=el('article','sli-news-record'),head=el('div','sli-news-item-head');
  const link=el('a','sli-news-link',item.title);link.href=safeUrl(item.url);link.target='_blank';link.rel='noopener noreferrer';
  head.append(link);
  const details=el('p','sli-news-byline',item.publisher+' · '+formatDate(item.published_at_utc)+' · '+String(item.sector||'').toUpperCase());
  const note=el('p','sli-news-evidence-level',item.evidence_level==='official_metadata_change_candidate'?
   tr('Official listing change detected; legal effect requires checking the actual instrument.','Perubahan metadata dokumen terdeteksi; status hukum memerlukan pemeriksaan naskah.'):
   tr('Headline · secondary source','Judul berita · sumber sekunder'));
  card.append(head,details,note);root.append(card);
 }
 if(meta){
  const latest=doc.articles.reduce((n,x)=>Math.max(n,Date.parse(x.published_at_utc)||0),0);
  const age=latest?(Date.now()-latest)/86400000:Infinity;
  meta.textContent=tr('Showing ','Menampilkan ')+rows.length+' · '+tr('Archive: ','Arsip: ')+doc.articles.length+' · '+tr('Index updated: ','Indeks diperbarui: ')+formatDate(doc.updated_at_utc)+' · '+tr('Latest source date: ','Tanggal sumber terakhir: ')+(latest?formatDate(latest):'—');
  if(age>2)meta.textContent+=' · '+tr('No source dated within 48 hours','Tidak ada sumber bertanggal dalam 48 jam terakhir');
 }
}
function apply(){
 const nav=document.getElementById('sliUniversalNavigation');
 if(!nav||!nav.parentNode)return;
 let panel=document.getElementById('sliUniversalSecondaryEvidence');
 if(!panel){
  panel=el('section','sli-secondary-universal');panel.id='sliUniversalSecondaryEvidence';
  const details=el('details','sli-news-details');
  const summary=el('summary','sli-news-summary');
  summary.append(el('strong',null,tr('News & OSINT · secondary evidence','Berita & OSINT · data sekunder')));
  const counts=el('span','sli-news-count',tr('Open news archive','Buka arsip berita'));counts.setAttribute('data-sli-news-count','');
  summary.append(counts);details.append(summary);
  const inner=el('div','sli-news-body');
  inner.append(el('p','sli-news-intro',tr('Attributable reporting is valid secondary research evidence of what a publisher reported. Compare with SLI indicators and other OSINT. Headlines alone do not establish event impacts, investment realization or enacted law.','Pemberitaan teratribusi merupakan data sekunder tentang apa yang dilaporkan penerbit. Bandingkan dengan indikator SLI dan OSINT lainnya. Judul saja tidak membuktikan dampak kejadian, realisasi investasi, atau berlakunya regulasi.')));
  const controls=el('div','sli-news-controls');
  const sector=el('select','sli-news-sector');sector.setAttribute('data-sli-news-filter','');sector.setAttribute('aria-label',tr('Secondary news sector','Sektor berita sekunder'));
  for(const key of ['all','regional','energy','ai','minerals','trade','geopolitics','food','macro']){
   const opt=el('option',null,label(key));opt.value=key;sector.append(opt)}
  const search=el('input','sli-news-search');search.type='search';search.placeholder=tr('Search topics, publishers, regions…','Cari isu, media, wilayah…');
  search.setAttribute('aria-label',tr('Search secondary research news','Cari berita data sekunder'));search.setAttribute('data-sli-news-search','');
  const sources=el('a','sli-news-policy',tr('News sources & methodology ↗','Sumber berita & metodologi ↗'));sources.href='./sli-source-viewer.html?dataset=sli-secondary-news-index.json';
  const limit=el('select','sli-news-sector');limit.setAttribute('data-sli-news-limit','');limit.setAttribute('aria-label',tr('Number of results','Jumlah hasil'));
  for(const n of [8,20,50]){const opt=el('option',null,String(n)+' '+tr('results','hasil'));opt.value=String(n);limit.append(opt)}
  controls.append(sector,search,limit,sources);inner.append(controls);
  const meta=el('small','sli-news-meta',tr('Loading source register…','Memuat indeks sumber…'));meta.setAttribute('data-sli-news-meta','');
  inner.append(meta);
  const results=el('div','sli-news-results');results.setAttribute('data-sli-news-results','');inner.append(results);
  details.append(inner);panel.append(details);
  nav.insertAdjacentElement('afterend',panel);
  const load=()=>{
   const sequence=++serial;
   meta.textContent=tr('Loading source register…','Memuat indeks sumber…');
   read().then(doc=>{
    if(sequence!==serial||!panel.isConnected)return;
    const counter=panel.querySelector('[data-sli-news-count]');
    counter.textContent=doc.articles.length+' '+tr('attributed records','berita teratribusi');
    renderResults(panel,doc);
   }).catch(()=>{
    if(sequence!==serial||!panel.isConnected)return;
    meta.textContent=tr('Archive currently unavailable; original dashboard indicators remain available.','Indeks berita belum dapat diakses; data utama dashboard tetap tersedia.');
   });
  };
  details.addEventListener('toggle',()=>{if(details.open)load()});
  sector.addEventListener('change',()=>{if(snapshot)renderResults(panel,snapshot)});
  search.addEventListener('input',()=>{if(snapshot)renderResults(panel,snapshot)});
  limit.addEventListener('change',()=>{if(snapshot)renderResults(panel,snapshot)});
  window.setInterval(()=>{if(details.open&&panel.isConnected&&document.visibilityState==='visible')load()},TTL);
 }
 const sector=panel.querySelector('[data-sli-news-filter]');
 const next=context();
 if(sector&&panel.dataset.context!==next){
  panel.dataset.context=next;sector.value=next;if(snapshot)renderResults(panel,snapshot);
 }
 const title=panel.querySelector('.sli-news-summary strong');
 if(title)title.textContent=tr('News & OSINT · secondary evidence for ','Berita & OSINT · data sekunder untuk ')+label(next);
 if(snapshot)renderResults(panel,snapshot);
 if(panel.querySelector('details')?.open&&!snapshot)read().then(doc=>renderResults(panel,doc)).catch(()=>{});
}
function schedule(){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply()}
schedule();
window.addEventListener('hashchange',apply);
document.addEventListener('sli:pagechange',apply);
document.addEventListener('sli:languagechange',apply);
window.SLISecondaryEvidence={installed:true,read,rowsFor,scopeFor,refresh:apply};
})();