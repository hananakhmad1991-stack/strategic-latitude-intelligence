/* SLI sector-first navigation · one Home portal, evidence owned by topic dashboards, one glossary.
   Static local links only, no analytics, redirects, network dependency or injected source data. */
(()=>{'use strict';
const groups=[
 ['Start & research tools','Mulai & perangkat riset','terminal','research','guide'],
 ['Economy, investment & regions','Ekonomi, investasi & daerah','macro','industry','greenworkforce','investment','entities','province','opportunity','gini','welfare','labs'],
 ['Energy, minerals & trade','Energi, mineral & perdagangan','energy','electricity','ruptl','minerals','trade','map'],
 ['Food & agriculture','Pangan & pertanian','food'],
 ['Marine & fisheries','Kelautan & perikanan','marine'],
 ['AI & digital transformation','AI & transformasi digital','ai','aihub','komdigi','digital','digitalgov'],
 ['Policy, geopolitics & environment','Kebijakan, geopolitik & lingkungan','policy','ria','geopolitics','indo','climate'],
 ['Reference & quality','Referensi & kualitas','glossary','freshness','inventory']
];
const modules={
 industry:['Industrial Intelligence · Kemenperin','Intelijen Industri · Kemenperin','sli-industrial-intelligence.html','Curated Kemenperin source catalog; numerical indicators require XLSX validation.','Katalog sumber Kemenperin terkurasi; angka indikator menunggu validasi XLSX.'],
 overview:['Home · Intelligence portal','Beranda · Portal intelijen','index.html#home','Enter SLI through sector-owned research and dated public data.','Masuk ke riset sektoral dan data publik bertanggal melalui beranda.'],
 home:['Home · Intelligence portal','Beranda · Portal intelijen','index.html#home','Find sectors and source-dated intelligence.','Temukan sektor dan intelijen bersumber bertanggal.'],
 datahub:['SLI Data Library · BPS / IEA / PLN','Perpustakaan Data SLI · BPS / IEA / PLN','sli-sector-data-library.html','Source-linked, dated crime, democracy, socioeconomic, critical mineral and environmental data; no missing figures invented.','Dataset kriminalitas, demokrasi, sosial-ekonomi, mineral IEA dan lingkungan, dengan periode serta status sumber yang jelas.'],
 terminal:['SLI Decision Terminal · Cross-source workspace','SLI Decision Terminal · Workspace lintas sumber','sli-decision-terminal.html','Issuer, attributed-news and policy search with local watchlists and Research AI handoff. Not a live trading terminal.','Pencarian emiten, berita, dan regulasi dengan watchlist lokal serta jalur DERGUBA AI. Bukan terminal perdagangan langsung.'],
 research:['DERGUBA AI · SLI Research Intelligence · Owner Test','DERGUBA AI · Asisten Riset SLI · Uji Pemilik','sli-research-ai.html','Owner-only generative research is in limited testing; subscriber access is not active.','Riset generatif masih uji khusus pemilik dengan sumber terbatas; akses pelanggan belum aktif.'],
 membership:['Open Access','Akses Terbuka','sli-membership.html','Explore released public intelligence without subscriptions.','Jelajahi intelijen publik tanpa langganan.'],
 guide:['User guide · Start here','Panduan pengguna · Mulai di sini','sli-user-guide.html','Task-based paths, navigation, dates, sources, filters and limitations.','Alur penggunaan, navigasi, tanggal, sumber dan batasan.'],
 entities:['Entity Intelligence · People & Projects','Intelijen Entitas · Tokoh & Proyek','sli-entities.html','Browse source-dated organizations, people and projects across sectors.','Telusuri organisasi, tokoh, dan proyek lintas sektor bersumber bertanggal.'],
 investment:['Investment · Project Tracker','Investasi · Pelacak Proyek','index.html#investment','Projects, investors, capital and execution status.','Proyek, investor, modal dan status pelaksanaan.'],
 greenworkforce:['Green Workforce Intelligence · Bappenas 2025','Intelijen Tenaga Kerja Hijau · Bappenas 2025','green-workforce-intelligence.html','2025–2029 green employment scenarios across 17 economic sectors; forecasts, not actuals.','Skenario pekerjaan hijau 2025–2029 untuk 17 sektor ekonomi; proyeksi, bukan realisasi.'],
 macro:['Macroeconomic Intelligence','Intelijen Makroekonomi','indonesia-macroeconomic-intelligence.html','GDP, inflation, external balances and dated national data.','PDB, inflasi, neraca eksternal dan data nasional.'],
 opportunity:['Provincial Comparison & Stress','Perbandingan & Tekanan Provinsi','provincial-opportunity-engine.html','Compare 38 provincial economies and conditional stress, not predicted returns.','Bandingkan 38 provinsi dan skenario, bukan prediksi keuntungan.'],
 province:['Provincial Intelligence · Dossiers','Intelijen Provinsi · Profil Daerah','provincial-intelligence.html','Industry, energy, PDRB/GRDP, Gini and bounded economic scenarios.','Industri, energi, PDRB, Gini dan skenario ekonomi bersyarat.'],
 welfare:['Welfare Statistics 2026 · Susenas','Kesejahteraan Rakyat 2026 · Susenas','sli-welfare-2026.html','BPS 2026 province map, health, schooling, energy access, digital inclusion and national trends; validated subset only.','Peta provinsi BPS 2026: pendidikan, kesehatan, energi rumah tangga, digitalisasi dan tren nasional; subset yang masih diaudit.'],
 gini:['Gini Ratio · Expenditure Inequality','Rasio Gini · Ketimpangan Pengeluaran','gini-inequality.html','BPS expenditure inequality, not income or wealth inequality.','Ketimpangan pengeluaran BPS, bukan pendapatan atau kekayaan.'],
 labs:['Investor & Scenario Labs','Lab Investor & Skenario','intelligence-labs.html','Source-linked screening and user-supplied model assumptions.','Penyaringan berbasis sumber dan asumsi model dari pengguna.'],
 energy:['Energy Security · Overview','Ketahanan Energi · Gambaran Umum','index.html#energy','Oil, gas, power, biofuels, transition, governance and resilience.','Migas, listrik, bioenergi, transisi dan tata kelola.'],
 food:['Food & Agriculture Intelligence','Intelijen Pangan & Pertanian','food-agriculture-intelligence.html','Official-date agricultural trade, farmer indices, food prices, institutions, exports and evidence assessments.','Perdagangan pertanian, NTP, harga pangan, kelembagaan dan analisis bersumber resmi.'],
 marine:['Marine & Fisheries Intelligence','Intelijen Kelautan & Perikanan','marine-fisheries-intelligence.html','KKP historical fishery production, aquaculture, seaweed, fishers and blue economy source inventory.','Produksi perikanan KKP, budidaya, rumput laut, nelayan serta inventaris sumber ekonomi biru.'],
 map:['Strategic Map','Peta Strategis','index.html#map','Geographic evidence with varying precision, status and source dates.','Bukti spasial dengan akurasi, status dan periode berbeda.'],
 trade:['Trade Flows','Arus Perdagangan','index.html#trade','Commodity trade, partners, balances and coverage conventions.','Komoditas, negara mitra, neraca dan cakupan data.'],
 minerals:['Critical Minerals · Overview','Mineral Kritis · Gambaran Umum','index.html#minerals','Extraction, processing, reserves, ownership and project status.','Ekstraksi, pengolahan, cadangan, kepemilikan dan status.'],
 electricity:['PLN Electricity Statistics','Statistik Ketenagalistrikan PLN','pln-electricity-statistics.html','Electricity source register; distinguish households, villages and grid reliability.','Registri data PLN; bedakan rumah tangga, desa dan keandalan.'],
 ruptl:['PLN RUPTL & Grid Investment','RUPTL PLN & Investasi Jaringan','pln-ruptl-energy-investment.html','Planned infrastructure and source-qualified power investment.','Prasarana terencana dan investasi tenaga listrik.'],
 ai:['AI Infrastructure · Overview','Infrastruktur AI · Gambaran Umum','index.html#ai','Technology and infrastructure big-picture section.','Gambaran sektor teknologi dan infrastruktur.'],
 aihub:['AI Projects & Compute Intelligence','Intelijen Proyek AI & Komputasi','ai-intelligence-hub.html','Detailed projects, power, digital infrastructure and specialized AI research.','Proyek, kelistrikan, infrastruktur dan riset AI.'],
 komdigi:['Komdigi Infrastructure 2025','Infrastruktur Komdigi 2025','ai-infrastructure.html','Official-source digital connectivity data and exports.','Data konektivitas dan ekspor bersumber resmi.'],
 digital:['Digital Economy Readiness','Kesiapan Ekonomi Digital','digital-economy-readiness.html','Readiness, connectivity, talent and public digital services.','Kesiapan, konektivitas, talenta dan layanan digital.'],
 digitalgov:['Digital Governance & Data Centres','Tata Kelola Digital & Pusat Data','digital-governance-data-centers.html','Public sector digital infrastructure and data governance.','Infrastruktur digital pemerintah dan tata kelola data.'],
 policy:['Policy & Regulation · Overview','Kebijakan & Regulasi · Gambaran Umum','index.html#policy','Policy summary and evidence-linked regulatory context.','Ringkasan kebijakan dan konteks regulasi.'],
  geopolitics:['Geopolitical Intelligence','Intelijen Geopolitik','index.html#geopolitics','Six geopolitical theatres, Indonesia exposure, dated official metrics and secondary-news monitoring.','Enam tema geopolitik, paparan Indonesia, data resmi bertanggal dan monitoring berita sekunder.'],
 indo:['Indonesia Intelligence · Domestic & Regional','Intelijen Indonesia · Domestik & Daerah','geopolitical-impact-assessment.html','Integrated geopolitical, economy, regional and public safety intelligence.','Intelijen geopolitik, ekonomi, wilayah dan keselamatan publik.'],
 climate:['Climate & Environment','Iklim & Lingkungan','climate-environment.html','Environmental exposure, dated monitoring and official alerts.','Risiko lingkungan, monitoring dan peringatan resmi.'],
 ria:['Regulatory Instruments & Institutions','Instrumen Regulasi & Kelembagaan','policy-regulatory-intelligence.html','Rules, institutional implementation and linked policy evaluations.','Regulasi, pelaksana dan evaluasi kebijakan.'],
 glossary:['Glossary & Methodology · Reference','Glosarium & Metodologi · Referensi','sli-glossary-methodology.html','Single canonical definitions, methods, units, sources and caveats.','Satu sumber definisi, metodologi, satuan dan batasan.'],
 inventory:['SLI Data Inventory · Dataset Counts','Inventaris Data SLI · Jumlah Dataset','sli-data-inventory.html','Auditable structural counts of public JSON; not certified unique observations.','Hitungan struktural JSON publik, bukan observasi unik tervalidasi.'],
 freshness:['Data Freshness & QA','Kebaruan Data & QA','sli-data-automation-center.html','Review latest observed period, update coverage and system QA.','Periksa periode observasi, pembaruan dan pengujian.'],
 methodology:['Research Methods · Main Site','Metodologi · Situs Utama','index.html#methodology','Concise research principles and links to detailed methodology.','Prinsip riset ringkas dan tautan metodologi lengkap.'],
 about:['About SLI','Tentang SLI','index.html#about','Editorial purpose, independence and research contact.','Tujuan editorial, independensi dan kontak riset.']
};
const related={
 terminal:['entities','research','policy','geopolitics'],
 entities:['investment','aihub','energy','policy'],
 research:['overview','terminal','macro','aihub'],membership:['overview','research','guide','glossary'],overview:['terminal','research','investment','energy'],investment:['province','opportunity','gini','labs'],map:['investment','energy','province'],
 trade:['minerals','energy','macro','marine'],energy:['electricity','ruptl','map','trade','food'],food:['marine','trade','macro','province'],marine:['food','trade','climate','province'],minerals:['map','trade','investment'],
 ai:['aihub','komdigi','digital','digitalgov'],policy:['geopolitics','ria','indo','climate'],geopolitics:['policy','indo','trade','energy'],macro:['opportunity','gini','investment'],
 opportunity:['province','gini','labs'],province:['opportunity','gini','map','electricity'],gini:['province','opportunity','macro','welfare'],
 welfare:['province','gini','macro','research'],
 labs:['province','opportunity','indo'],electricity:['energy','ruptl','province'],ruptl:['energy','electricity','aihub'],
 aihub:['ai','komdigi','digital','electricity'],komdigi:['aihub','digital','digitalgov'],
 digital:['aihub','komdigi','digitalgov'],digitalgov:['aihub','digital','ria'],
 indo:['policy','province','climate','macro'],climate:['indo','policy','map'],ria:['policy','indo','labs'],
 glossary:['guide','freshness','inventory'],freshness:['glossary','guide','inventory'],inventory:['freshness','glossary','guide'],methodology:['glossary','guide','freshness'],about:['guide','overview'],guide:['overview','glossary','freshness']
};
const path=location.pathname.split('/').pop()||'index.html';
const page=()=>path==='index.html'?((!location.hash||location.hash==='#home'||location.hash==='#overview'||location.hash==='#sliPortalSectors')?'home':(modules[location.hash.slice(1)]?location.hash.slice(1):'home')):(Object.keys(modules).find(id=>modules[id][2].split('#')[0]===path)||'detail');
const lang=()=>window.SLIi18n?.language==='id'||document.documentElement.lang==='id'||(!window.SLIi18n&&(()=>{try{return localStorage.getItem('sli-ui-language')==='id'}catch{return false}})())?'id':'en';
const text=(en,id)=>lang()==='id'?id:en;
const label=id=>id==='detail'?(document.title||document.querySelector('h1')?.textContent||'SLI Dashboard').split('|')[0].trim().slice(0,90):(modules[id]?.[lang()==='id'?1:0]||id);
const href=id=>'./'+modules[id][2];
function node(tag,classes,txt){const n=document.createElement(tag);if(classes)n.className=classes;if(txt)n.textContent=txt;return n}
const moduleIcon=Object.freeze({home:'globe',overview:'government',terminal:'technology',research:'technology',entities:'building',investment:'project',macro:'project',opportunity:'project',province:'globe',energy:'energy',food:'government',marine:'globe',map:'globe',trade:'globe',minerals:'mineral',electricity:'energy',ruptl:'energy',ai:'technology',aihub:'technology',policy:'government',geopolitics:'globe',climate:'globe',ria:'government',guide:'link',glossary:'link',freshness:'project',inventory:'project'});
function link(id,cls){const a=node('a',cls),identity=window.SLIEntityIdentity;if(identity){const i=identity.icon(moduleIcon[id]||'building');i.classList.add('sli-nav-icon');a.append(i)}a.append(node('span','',label(id)));a.href=href(id);return a}

/* Unified SLI masthead for detailed dashboards. Index #home and Research AI
   retain their purpose-built headers. Other pages keep original data and tools. */
function dashboardPage(){return path!=='sli-research-ai.html'&&path!=='sli-expert-connect.html'&&path!=='sli-source-viewer.html'}
function mastLink(to,caption,current){
 const a=node('a','sli-platform-link',caption);a.href=to;
 if(current)a.setAttribute('aria-current','page');return a;
}
// Share the actual sticky masthead height with dashboard inspectors and anchor scrolling.
function syncPlatformMastOffset(){
 const mast=document.getElementById('sliPlatformMast');
 const height=mast&&!mast.hidden?Math.ceil(mast.getBoundingClientRect().height):0;
 document.documentElement.style.setProperty('--sli-mast-offset',height+'px');
}
function renderPlatformMast(){
 const use=dashboardPage();
 // A single shared Explore Data menu on Home and sector dashboards.
 const homepage=path==='index.html'&&(document.body.classList.contains('sli-home-active')||!location.hash||location.hash==='#home'||location.hash==='#overview');
 document.body.classList.toggle('sli-dashboard-unified',use&&!homepage);
 let mast=document.getElementById('sliPlatformMast');
 if(!use){if(mast)mast.hidden=true;syncPlatformMastOffset();return}
 if(!mast){
  mast=node('header','sli-platform-mast');mast.id='sliPlatformMast';
  mast.setAttribute('aria-label','Strategic Latitude Intelligence dashboard navigation');
  document.body.insertBefore(mast,document.body.firstChild);
 }
 mast.hidden=false;mast.replaceChildren();
 const inner=node('div','sli-platform-mast-inner');
 const brand=node('a','sli-platform-brand');brand.href='./index.html#home';brand.setAttribute('aria-label','SLI — Strategic Latitude Intelligence home');
 brand.append(node('span','sli-platform-monogram','SLI'));
 const names=node('span','sli-platform-brand-name');names.append(node('strong','', 'STRATEGIC LATITUDE'),node('small','', 'INTELLIGENCE'));brand.append(names);
 const primary=node('nav','sli-platform-links');primary.setAttribute('aria-label','Main SLI navigation');
 const current=page();
 primary.append(mastLink('./index.html#home',text('Home','Beranda'),current==='home'));
 const explorer=node('details','sli-platform-explorer'),summary=node('summary','',text('Explore Data','Jelajahi Data'));
 summary.setAttribute('aria-haspopup','true');summary.setAttribute('aria-expanded','false');
 explorer.addEventListener('toggle',()=>{
  summary.setAttribute('aria-expanded',explorer.open?'true':'false');
 });
 summary.setAttribute('aria-label',text('Browse SLI sector dashboards','Jelajahi dashboard sektoral SLI'));
 explorer.append(summary);
 const sectors=node('div','sli-platform-sector-menu');
 // Canonical information architecture: eight distinct topical families, including independent Marine & Fisheries.
 // Specialist pages and source observations remain owned by ONE substantive category.
 const topicalEvidence={
  macro:[['Socioeconomic provincial data','Data sosial-ekonomi provinsi','socio']],
  energy:[['PLN reliability data','Data keandalan PLN','power'],['RUPTL source tables','Tabel sumber RUPTL','ruptl']],
  minerals:[['IEA mineral scenarios','Skenario mineral IEA','minerals']],
  marine:[['KKP original datasets','Dataset asli KKP','marine']],
  aihub:[['AI research data','Data riset AI','ai-reports']],
  policy:[['Democracy & governance data','Data demokrasi & tata kelola','governance']],
  indo:[['Public safety indicators','Indikator keamanan publik','security']],
  climate:[['Climate & environment evidence','Bukti iklim & lingkungan','environment'],['BNPB disaster history','Riwayat bencana BNPB','disasters']]
 };
 const specialistByGroup={
  0:[['Research evidence preview','Pratinjau bukti riset','sli-research-evidence-preview.html'],
     ['Food & minerals news monitoring','Pemantauan berita pangan & mineral','sli-sector-news.html']],
  1:[['Investment navigator','Navigator investasi','indonesia-investment-navigator.html']],
  2:[['Regional PLN grid baseline','Kondisi jaringan regional PLN','pln-regional-grid-baseline-2024.html'],
     ['RUPTL source intelligence','Intelijen sumber RUPTL','pln-ruptl-2025-2034-source-intelligence.html'],
     ['RUPTL investor digitization','Digitalisasi RUPTL bagi investor','ruplt-investor-digitization.html']],
  5:[['Electricity demand forecast','Proyeksi permintaan listrik','ai-electricity-demand-forecast.html'],
     ['AI investment geography','Sebaran investasi AI','ai-investment-geography.html'],
     ['AI investors & partner projects','Investor & mitra proyek AI','ai-investor-layer.html'],
     ['Project grid & finance','Jaringan & pembiayaan proyek','ai-project-grid-finance.html'],
     ['Regional grid opportunities','Peluang jaringan regional','ai-regional-grid-opportunities.html'],
     ['AI compute & power','Komputasi AI & listrik','indonesia-ai-compute-power.html'],
     ['International AI benchmarks','Pembanding AI internasional','indonesia-ai-global-benchmarks.html'],
     ['AI evidence inventory','Inventaris bukti AI','indonesia-ai-source-inventory.html']],
  6:[['Policy impact evaluation','Evaluasi dampak kebijakan','policy-impact-evaluation.html'],
     ['Sector regulatory impact','Dampak regulasi sektoral','policy-sector-ria.html']],
  7:[['Atlas of 49 research methods','Atlas 49 metode riset','sli-methodology-models.html']]
 };
 for(const [i,group] of groups.entries()){
  const col=node('details','sli-platform-sector-group');
  const header=node('summary','sli-platform-sector-heading');
  header.append(node('span','',text(group[0],group[1])));
  header.append(node('small','',String(group.length-2+(specialistByGroup[i]?.length||0))+' '+text('dashboards','dashboard')));
  col.append(header);
  const items=node('div','sli-platform-group-links');
  for(const id of group.slice(2)){
   const a=link(id);if(id===current){a.setAttribute('aria-current','page');col.open=true}
   items.append(a);
   for(const [en,bahasa,anchor] of topicalEvidence[id]||[]){
    const related=node('a','sli-platform-topic-source',text(en,bahasa));
    related.href='./sli-sector-data-library.html#'+anchor;items.append(related);
   }
  }
  if(specialistByGroup[i]?.length){
   items.append(node('div','sli-platform-subheading',text('Specialist dashboards','Dashboard khusus')));
   for(const [en,bahasa,url] of specialistByGroup[i]){
    const item=node('a','sli-platform-specialist-link',text(en,bahasa));item.href='./'+url;
    if(path===url){item.setAttribute('aria-current','page');col.open=true}
    items.append(item);
   }
  }
  col.append(items);sectors.append(col);
 }
 explorer.append(sectors);
 primary.append(explorer);
 // Customer-facing product navigation; details work with mouse, touch and keyboard.
 const menus=[
  [text('Products','Produk'),[
   [text('Intelligence Dashboard','Dashboard Intelijen'),'./sli-products.html#dashboard'],
   [text('DERGUBA Research AI','DERGUBA Research AI'),'./sli-research-ai.html'],
   [text('Weekly Intelligence Brief','Laporan Intelijen Mingguan'),'./sli-products.html#brief'],
   [text('Monitoring & Alerts','Pemantauan & Peringatan'),'./sli-products.html#monitoring'],
   [text('Analytical Tools & Data Inventory','Perangkat Analisis & Inventaris Data'),'./sli-data-inventory.html']]],
  [text('Solutions','Layanan'),[
   [text('Custom Research & Advisory','Riset Khusus & Konsultasi'),'./sli-custom-research.html'],
   [text('Expert Sourcing & Consultation','Pencarian & Konsultasi Pakar'),'./sli-expert-sourcing.html'],
   [text('Corporate & Institutional Intelligence','Intelijen Korporasi & Institusi'),'./sli-institutional-intelligence.html']]],
 ];
 const menuWrap=node('div','sli-header-menu-set');
 for(const [caption,entries] of menus){
  const detail=node('details','sli-header-dropdown');
  const trigger=node('summary','',caption);trigger.setAttribute('aria-label',caption);
  detail.append(trigger);
  const panel=node('div','sli-header-dropdown-panel');
  for(const [name,url] of entries){const a=node('a','',name);a.href=url;panel.append(a)}
  detail.append(panel);menuWrap.append(detail);
  detail.addEventListener('toggle',()=>{if(detail.open){for(const other of menuWrap.querySelectorAll('details'))if(other!==detail)other.open=false;explorer.open=false}});
 }
 primary.append(menuWrap);

 primary.append(mastLink('/about-us',text('About Us','Tentang Kami'),(path==='/about-us'||path==='sli-about-us.html')));

 // Keep the two client-facing research services visible together above the scrollable sector menu.
 const tools=node('div','sli-platform-tools');
 // All specialist dashboards share the same persisted EN/ID preference as the homepage.
 // Never show a decorative language button that does not apply the language.
 {
  const langs=node('div','sli-platform-language');langs.setAttribute('role','group');langs.setAttribute('aria-label','Language / Bahasa');
  for(const code of ['en','id']){
   const button=node('button','',code.toUpperCase());button.type='button';button.dataset.sliMastLanguage=code;
   const active=lang()===code;button.setAttribute('aria-pressed',String(active));
   if(active)button.classList.add('active');
   button.addEventListener('click',()=>{
    if(window.SLIi18n?.setLanguage)window.SLIi18n.setLanguage(code);
    else {
     const sidebar=document.querySelector('.sidebar [data-sli-locale="'+code+'"]');
     if(sidebar)sidebar.click();
     else {try{localStorage.setItem('sli-ui-language',code)}catch(_){};document.documentElement.lang=code;document.dispatchEvent(new CustomEvent('sli:languagechange',{detail:{language:code}}))}
    }
    renderPlatformMast();
   });
   langs.append(button);
  }
  tools.append(langs);
 }
 // Close dropdowns on Escape and on clicks outside the navigation.
 if(!mast.dataset.sliMenuEvents){
  mast.dataset.sliMenuEvents='1';
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){for(const d of mast.querySelectorAll('details[open]'))d.open=false}});
  document.addEventListener('click',e=>{if(!mast.contains(e.target)){for(const d of mast.querySelectorAll('details[open]'))d.open=false}});
 }
 inner.append(brand,primary,tools);mast.append(inner);
  if(!mast.dataset.sliOffsetObserver){
   mast.dataset.sliOffsetObserver='1';
   if(typeof ResizeObserver==='function'){
    const observer=new ResizeObserver(syncPlatformMastOffset);
    observer.observe(mast);
   } else window.addEventListener('resize',syncPlatformMastOffset);
  }
  syncPlatformMastOffset();
 // Clicking a module navigates normally; no overlay intercepts data controls.
}

function renderBar(){
 // The Expert Connect landing owns a compact header, so do not inject a sitewide
 // breadcrumb and toolbar that would bury its client request form.
 if(path==='sli-expert-connect.html'||path==='sli-research-ai.html'||['sli-company.html','sli-contact.html','sli-help.html','sli-contact-sales.html','sli-custom-research.html','sli-expert-sourcing.html','sli-institutional-intelligence.html','sli-business-info.html','sli-privacy.html','sli-membership.html','sli-products.html'].includes(path)){
  document.getElementById('sliUniversalNavigation')?.remove();
  renderPlatformMast();
  return;
 }
 if(path==='sli-source-viewer.html')return;
 renderPlatformMast();
 const target=document.querySelector('main.main')||document.querySelector('main')||document.body;
 let bar=document.getElementById('sliUniversalNavigation');
 if(!bar){bar=node('nav','sli-universal-nav');bar.id='sliUniversalNavigation';bar.setAttribute('aria-label','Cross-dashboard navigation and user help');
  const reference=target.querySelector('.top')||target.querySelector('header')||target.querySelector('.mast');
  if(reference?.parentNode===target)reference.insertAdjacentElement('afterend',bar);
  else target.insertBefore(bar,target.firstChild);
 }
 const current=page();bar.replaceChildren();bar.classList.toggle('sli-nav-compact',!!document.getElementById('sliPlatformMast')&&!document.getElementById('sliPlatformMast').hidden);
 const position=node('div','sli-location');position.append(link('overview'));
 const sep=node('span','sli-separator',' › ');position.append(sep,node('strong','',label(current)));
 const actions=node('div','sli-universal-actions');
 const guide=link('guide','sli-guide-link');guide.textContent=text('Help & how to use','Panduan pemakaian');
 actions.append(link('research'),guide,link('glossary'),link('freshness'))
 // Explore Data lives in the single shared masthead above; never duplicate it here.
 const relation=node('div','sli-related-links');
 relation.append(node('span','',text('Related:','Terkait:')));
 for(const id of (related[current]||['overview']).slice(0,4))relation.append(link(id));
 bar.append(position,actions,relation);
}
function renderGuide(){
 const target=document.getElementById('sliGuideCatalog');if(!target)return;
 target.replaceChildren();
 for(const g of groups){const section=node('section','sli-guide-group');section.append(node('h3','',text(g[0],g[1])));
  const grid=node('div','sli-guide-cards');
  for(const id of g.slice(2)){const card=node('article','sli-guide-card');const a=link(id);a.className='sli-guide-card-link';
   card.append(a,node('p','',modules[id][lang()==='id'?4:3]));grid.append(card)}
  section.append(grid);target.append(section)}
}
function render(){
 try{renderBar();renderGuide()}
 finally{document.documentElement.classList.remove('sli-chrome-pending')}
}
function closeSectorMenu(event){
 const opened=document.querySelector('.sli-platform-explorer[open]');
 if(!opened)return;
 if(event.type==='keydown'){
  if(event.key==='Escape'){opened.open=false;opened.querySelector('summary')?.focus()}
  return;
 }
 if(!opened.contains(event.target))opened.open=false;
}
document.addEventListener('pointerdown',closeSectorMenu);
document.addEventListener('keydown',closeSectorMenu);

// Load the same localized UI runtime on every SLI dashboard; index.html already
// imports it explicitly, so do not double-initialize there.
(function bootstrapSLIUniversalLanguage(){
 const current=document.currentScript?.src||document.querySelector?.('script[src*="/js/sli-navigation.js"]')?.src;
 if(!current)return;
 try{
  if(!window.SLIi18n?.setLanguage){
   const saved=localStorage.getItem('sli-ui-language');
   if(saved==='id'||saved==='en')document.documentElement.lang=saved;
  }
 }catch(_){}
 if(window.SLIi18n?.setLanguage||document.querySelector?.('script[src*="/js/i18n.js"]'))return;
 if(document.querySelector?.('script[data-sli-global-i18n]'))return;
 const dictionary=document.createElement('script');
 dictionary.src=new URL('./i18n-dictionary.js?v=20261019-id-audit9',current).href;
 dictionary.dataset.sliGlobalI18n='dictionary';
 dictionary.onload=()=>{
   if(window.SLIi18n?.setLanguage)return;
   const core=document.createElement('script');
   core.src=new URL('./i18n.js?v=20261019-id-audit9',current).href;
   core.dataset.sliGlobalI18n='runtime';
   document.head.appendChild(core);
 };
 dictionary.onerror=()=>console.warn('[SLI] Indonesian language dictionary unavailable; original-language content retained.');
 document.head.appendChild(dictionary);
})();

// Common entity identity loaded once on every specialist page; no unreviewed remote bios.
(function bootstrapIdentity(){
 const here=document.currentScript?.src||document.querySelector?.('script[src*="/js/sli-navigation.js"]')?.src;
 if(!here)return;
 if(!document.querySelector('link[data-sli-identity-css]')){const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('../css/sli-entity-identity.css?v=20261019-p1p5',here).href;css.dataset.sliIdentityCss='1';document.head.append(css)}
 if(!window.SLIEntityIdentity&&!document.querySelector('script[data-sli-identity-js]')){
  const script=document.createElement('script');script.src=new URL('./sli-entity-identity.js?v=20261019-p1p5',here).href;script.dataset.sliIdentityJs='1';script.onload=()=>{if(document.readyState!=='loading')render()};document.head.append(script)
 }
})();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
window.addEventListener('hashchange',()=>renderBar());
document.addEventListener('sli:pagechange',()=>renderBar());
document.addEventListener('sli:languagechange',render);
window.SLIArchitecture={modules,groups,related,refresh:render};
 // Shared context for all dashboards: attributable secondary news and dated OSINT.
 function mountSecondaryEvidence(){
   // OSINT summaries are for intelligence dashboards, not service-request landing pages.
   if(path==='sli-expert-connect.html'||path==='sli-research-ai.html')return;
  if(document.getElementById('sliSecondaryEvidenceLoader'))return;
  const script=document.createElement('script');script.id='sliSecondaryEvidenceLoader';
  script.src='./js/sli-secondary-evidence.js?v=20261018-sitewide1';script.defer=true;
  document.head.appendChild(script);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountSecondaryEvidence,{once:true});
 else mountSecondaryEvidence();


// SLI source attribution: machine-readable back-end records are not user-facing downloads or original publisher reports.
function sliSourceViewerHref(href){
 try{
  const u=new URL(href,document.baseURI);
  if(u.origin!==location.origin)return null;
  const m=u.pathname.match(/\/data\/([a-z0-9][a-z0-9._-]*\.json)$/i);
  return m?new URL("./sli-source-viewer.html?dataset="+encodeURIComponent(m[1]),document.baseURI).href:null;
 }catch{return null}
}
function normalizeSLISourceLinks(){
 if(typeof document==='undefined'||!document?.querySelectorAll)return;
 for(const a of document.querySelectorAll("a[href]")){
  if(a.dataset.sliHumanSourceLink==="1")continue;
  const target=sliSourceViewerHref(a.getAttribute("href"));
  if(!target)continue;
  a.dataset.sliHumanSourceLink="1";
  a.removeAttribute("download");
  const visible=(a.textContent||"").trim();
  const useId=window.SLIi18n?.language==="id"||document.documentElement.lang?.toLowerCase().startsWith("id");
  a.textContent=/\bPDF\b/i.test(visible)?
   (useId?"Referensi & dokumen penerbit (jika tersedia) ↗":"Publisher references & documents (if available) ↗"):
   (useId?"Sumber & metodologi SLI ↗":"SLI sources & methodology ↗");
  a.href=target;
  a.title="Review dataset provenance, original publishers and SLI methodology; no raw-data download";
  a.removeAttribute("target");
 }
}
let sourceLinksQueued=false;
function queueSourceLinks(){
 if(sourceLinksQueued)return;
 sourceLinksQueued=true;
 Promise.resolve().then(()=>{sourceLinksQueued=false;normalizeSLISourceLinks()});
}
function initSourceLinks(){
 queueSourceLinks();
 if(typeof MutationObserver!=="undefined"&&document.body)
  new MutationObserver(queueSourceLinks).observe(document.body,{subtree:true,childList:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initSourceLinks,{once:true});
else initSourceLinks();
document.addEventListener("sli:pagechange",queueSourceLinks);
document.addEventListener("sli:languagechange",queueSourceLinks);

/* Shared visual export bootstrap: every published SLI HTML page imports this navigation module.
 * Load once; keep export JS/CSS isolated from existing dashboard rendering. */
(function initSLIUniversalExport(){
 try{
  if(document.querySelector('[data-sli-export-bootstrap]'))return;
  const current=document.currentScript?.src||document.querySelector('script[src*="/js/sli-navigation.js"]')?.src;
  if(!current)return;
  const css=document.createElement("link");css.rel="stylesheet";
  css.href=new URL("../css/sli-visual-export.css?v=20261019-onepoint6",current).href;
  css.dataset.sliExportBootstrap="css";document.head.append(css);
  const formats=document.createElement("script");
  formats.src=new URL("./sli-visual-export-formats.js?v=20261019-insights1",current).href;
  formats.dataset.sliExportBootstrap="formats";
  formats.onload=function(){
   const core=document.createElement("script");
   core.src=new URL("./sli-visual-export.js?v=20261019-reporttoolbar1",current).href;
   core.dataset.sliExportBootstrap="core";
   document.head.append(core);
  };
  formats.onerror=function(){console.warn("[SLI] Visual exporter formats could not load")};
  document.head.append(formats);
 }catch(error){console.error("[SLI] Visual exporter boot",error)}
})();

})();
