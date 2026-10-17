/* SLI shared information architecture · one overview, evidence in chapters, one glossary.
   Static local links only, no analytics, redirects, network dependency or injected source data. */
(()=>{'use strict';
const groups=[
 ['Start here','Mulai di sini','overview','guide','membership'],
 ['Investment & regions','Investasi & daerah','investment','macro','opportunity','province','gini','labs'],
 ['Energy, trade & assets','Energi, perdagangan & aset','energy','map','trade','minerals','electricity','ruptl'],
 ['Technology & AI','Teknologi & AI','ai','aihub','komdigi','digital','digitalgov'],
 ['Policy, environment & intelligence','Kebijakan, lingkungan & intelijen','policy','indo','climate','ria'],
 ['Reference & transparency','Referensi & transparansi','glossary','freshness']
];
const modules={
 overview:['Overview · Big picture','Gambaran besar · Overview','index.html#overview','National executive context; go deeper for tables, project records and source detail.','Konteks nasional; buka modul detail untuk tabel dan sumber.'],
 membership:['Membership · Open / Pro / Enterprise','Keanggotaan · Open / Pro / Enterprise','sli-membership.html','Plans and early-access requests; payments are not active yet.','Paket dan permintaan akses awal; pembayaran belum aktif.'],
 guide:['User guide · Start here','Panduan pengguna · Mulai di sini','sli-user-guide.html','Task-based paths, navigation, dates, sources, filters and limitations.','Alur penggunaan, navigasi, tanggal, sumber dan batasan.'],
 investment:['Investment Tracker','Pelacak Investasi','index.html#investment','Projects, investors, capital and execution status.','Proyek, investor, modal dan status pelaksanaan.'],
 macro:['Macroeconomic Intelligence','Intelijen Makroekonomi','indonesia-macroeconomic-intelligence.html','GDP, inflation, external balances and dated national data.','PDB, inflasi, neraca eksternal dan data nasional.'],
 opportunity:['Provincial Opportunity & Stress','Peluang & Tekanan Provinsi','provincial-opportunity-engine.html','Compare 38 provincial economies and conditional stress, not predicted returns.','Bandingkan 38 provinsi dan skenario, bukan prediksi keuntungan.'],
 province:['Provincial Investment Dossiers','Profil Investasi 38 Provinsi','provincial-intelligence.html','Industry, energy, PDRB/GRDP, Gini and bounded economic scenarios.','Industri, energi, PDRB, Gini dan skenario ekonomi bersyarat.'],
 gini:['Gini Ratio · Expenditure Inequality','Rasio Gini · Ketimpangan Pengeluaran','gini-inequality.html','BPS expenditure inequality, not income or wealth inequality.','Ketimpangan pengeluaran BPS, bukan pendapatan atau kekayaan.'],
 labs:['Investor & Scenario Labs','Lab Investor & Skenario','intelligence-labs.html','Source-linked screening and user-supplied model assumptions.','Penyaringan berbasis sumber dan asumsi model dari pengguna.'],
 energy:['Energy Security','Ketahanan Energi','index.html#energy','Oil, gas, power, biofuels, transition, governance and resilience.','Migas, listrik, bioenergi, transisi dan tata kelola.'],
 map:['Strategic Map','Peta Strategis','index.html#map','Geographic evidence with varying precision, status and source dates.','Bukti spasial dengan akurasi, status dan periode berbeda.'],
 trade:['Trade Flows','Arus Perdagangan','index.html#trade','Commodity trade, partners, balances and coverage conventions.','Komoditas, negara mitra, neraca dan cakupan data.'],
 minerals:['Critical Minerals','Mineral Kritis','index.html#minerals','Extraction, processing, reserves, ownership and project status.','Ekstraksi, pengolahan, cadangan, kepemilikan dan status.'],
 electricity:['PLN Electricity Statistics','Statistik Ketenagalistrikan PLN','pln-electricity-statistics.html','Electricity source register; distinguish households, villages and grid reliability.','Registri data PLN; bedakan rumah tangga, desa dan keandalan.'],
 ruptl:['PLN RUPTL & Grid Investment','RUPTL PLN & Investasi Jaringan','pln-ruptl-energy-investment.html','Planned infrastructure and source-qualified power investment.','Prasarana terencana dan investasi tenaga listrik.'],
 ai:['AI Infrastructure','Infrastruktur AI','index.html#ai','Technology and infrastructure big-picture section.','Gambaran sektor teknologi dan infrastruktur.'],
 aihub:['AI Intelligence Hub','Pusat Intelijen AI','ai-intelligence-hub.html','Detailed projects, power, digital infrastructure and specialized AI research.','Proyek, kelistrikan, infrastruktur dan riset AI.'],
 komdigi:['Komdigi Infrastructure 2025','Infrastruktur Komdigi 2025','ai-infrastructure.html','Official-source digital connectivity data and exports.','Data konektivitas dan ekspor bersumber resmi.'],
 digital:['Digital Economy Readiness','Kesiapan Ekonomi Digital','digital-economy-readiness.html','Readiness, connectivity, talent and public digital services.','Kesiapan, konektivitas, talenta dan layanan digital.'],
 digitalgov:['Digital Governance & Data Centres','Tata Kelola Digital & Pusat Data','digital-governance-data-centers.html','Public sector digital infrastructure and data governance.','Infrastruktur digital pemerintah dan tata kelola data.'],
 policy:['Policy & Risk','Kebijakan & Risiko','index.html#policy','Policy summary and evidence-linked regulatory context.','Ringkasan kebijakan dan konteks regulasi.'],
 indo:['Indonesia Intelligence','Intelijen Indonesia','geopolitical-impact-assessment.html','Integrated geopolitical, economy, regional and public safety intelligence.','Intelijen geopolitik, ekonomi, wilayah dan keselamatan publik.'],
 climate:['Climate & Environment','Iklim & Lingkungan','climate-environment.html','Environmental exposure, dated monitoring and official alerts.','Risiko lingkungan, monitoring dan peringatan resmi.'],
 ria:['Policy & Regulatory Intelligence','Intelijen Kebijakan & Regulasi','policy-regulatory-intelligence.html','Rules, institutional implementation and linked policy evaluations.','Regulasi, pelaksana dan evaluasi kebijakan.'],
 glossary:['Glossary & Methodology','Glosarium & Metodologi','sli-glossary-methodology.html','Single canonical definitions, methods, units, sources and caveats.','Satu sumber definisi, metodologi, satuan dan batasan.'],
 freshness:['Data Freshness & QA','Kebaruan Data & QA','sli-data-automation-center.html','Review latest observed period, update coverage and system QA.','Periksa periode observasi, pembaruan dan pengujian.'],
 methodology:['Research Methods · Main Site','Metodologi · Situs Utama','index.html#methodology','Concise research principles and links to detailed methodology.','Prinsip riset ringkas dan tautan metodologi lengkap.'],
 about:['About SLI','Tentang SLI','index.html#about','Editorial purpose, independence and research contact.','Tujuan editorial, independensi dan kontak riset.']
};
const related={
 membership:['overview','guide','glossary'],overview:['investment','energy','ai','indo'],investment:['province','opportunity','gini','labs'],map:['investment','energy','province'],
 trade:['minerals','energy','macro'],energy:['electricity','ruptl','map','trade'],minerals:['map','trade','investment'],
 ai:['aihub','komdigi','digital','digitalgov'],policy:['ria','indo','climate'],macro:['opportunity','gini','investment'],
 opportunity:['province','gini','labs'],province:['opportunity','gini','map','electricity'],gini:['province','opportunity','macro'],
 labs:['province','opportunity','indo'],electricity:['energy','ruptl','province'],ruptl:['energy','electricity','aihub'],
 aihub:['ai','komdigi','digital','electricity'],komdigi:['aihub','digital','digitalgov'],
 digital:['aihub','komdigi','digitalgov'],digitalgov:['aihub','digital','ria'],
 indo:['policy','province','climate','macro'],climate:['indo','policy','map'],ria:['policy','indo','labs'],
 glossary:['guide','freshness'],freshness:['glossary','guide'],methodology:['glossary','guide','freshness'],about:['guide','overview'],guide:['overview','glossary','freshness']
};
const path=location.pathname.split('/').pop()||'index.html';
const page=()=>path==='index.html'?(modules[location.hash.slice(1)]?location.hash.slice(1):'overview'):(Object.keys(modules).find(id=>modules[id][2].split('#')[0]===path)||'guide');
const lang=()=>window.SLIi18n?.language==='id'||document.documentElement.lang==='id'?'id':'en';
const text=(en,id)=>lang()==='id'?id:en;
const label=id=>modules[id]?.[lang()==='id'?1:0]||id;
const href=id=>'./'+modules[id][2];
function node(tag,classes,txt){const n=document.createElement(tag);if(classes)n.className=classes;if(txt)n.textContent=txt;return n}
function link(id,cls){const a=node('a',cls,label(id));a.href=href(id);return a}
function renderBar(){
 const target=document.querySelector('main.main')||document.querySelector('main')||document.body;
 let bar=document.getElementById('sliUniversalNavigation');
 if(!bar){bar=node('nav','sli-universal-nav');bar.id='sliUniversalNavigation';bar.setAttribute('aria-label','Cross-dashboard navigation and user help');
  const reference=target.querySelector('.top')||target.querySelector('header')||target.querySelector('.mast');
  if(reference?.parentNode===target)reference.insertAdjacentElement('afterend',bar);
  else target.insertBefore(bar,target.firstChild);
 }
 const current=page();bar.replaceChildren();
 const position=node('div','sli-location');position.append(link('overview'));
 const sep=node('span','sli-separator',' › ');position.append(sep,node('strong','',label(current)));
 const actions=node('div','sli-universal-actions');
 const guide=link('guide','sli-guide-link');guide.textContent=text('Help & how to use','Panduan pemakaian');
 actions.append(link('membership'),guide,link('glossary'),link('freshness'));
 const dropdown=node('details','sli-explore-menu'),summary=node('summary','',text('Explore all modules','Jelajahi semua modul'));
 dropdown.append(summary);
 const list=node('div','sli-modules-grid');
 for(const g of groups){const block=node('div','sli-menu-group'),h=node('h3','',text(g[0],g[1]));block.append(h);
  for(const id of g.slice(2)){const a=link(id);if(id===current)a.setAttribute('aria-current','page');block.append(a)}list.append(block)}
 dropdown.append(list);actions.append(dropdown);
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
function render(){renderBar();renderGuide()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
window.addEventListener('hashchange',()=>renderBar());
document.addEventListener('sli:pagechange',()=>renderBar());
document.addEventListener('sli:languagechange',render);
window.SLIArchitecture={modules,groups,related,refresh:render};
})();
