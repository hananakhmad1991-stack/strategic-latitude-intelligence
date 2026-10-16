/* One canonical, bilingual SLI dictionary and non-redundant reading guide.
 * Canonical source: data/sli-unified-glossary.json (retains original glossary source paths).
 * Main-page excerpts provide context and links, never a second competing definition.
 */
(function(){
'use strict';
const URLPATH='./sli-glossary-methodology.html';
let cache=null,domain='all',category='all',query='',limit=40;
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const locEN=()=>window.SLIi18n?.language==='id'?'id':'en';
const T=(en,id)=>locEN()==='id'?id:en;
const CONTEXT={
overview:{domains:['macro','investment','data'],why:['These are national-context indicators at different dates; a latest release is not necessarily a present-day measurement.','Indikator konteks nasional memiliki periode berbeda; rilis terbaru belum tentu observasi saat ini.'],notes:['Growth YoY ≠ annual GDP growth; a monthly deficit ≠ full-year outcome.','Pertumbuhan YoY tidak otomatis pertumbuhan tahunan; defisit berjalan bukan hasil akhir tahun.'],link:'indonesia-macroeconomic-intelligence.html'},
trade:{domains:['trade','macro','minerals'],why:['Trade surplus (goods-only), goods-and-services national accounts and the balance of payments measure distinct scopes.','Surplus perdagangan barang, neraca barang-jasa, dan neraca pembayaran mengukur cakupan yang berbeda.'],notes:['Check partner/commodity HS codes, USD values and source time windows before drawing trade Sankey or calculating balance.','Periksa kode HS komoditas/mitra, nilai USD dan periode sebelum menghitung neraca atau membuat Sankey.'],link:'indonesia-macroeconomic-intelligence.html'},
map:{domains:['maps','data','investment'],why:['Asset sector, infrastructure type, corporate owner and source registry are different classification dimensions.','Sektor aset, jenis infrastruktur, pemilik perusahaan dan registri sumber merupakan dimensi klasifikasi berbeda.'],notes:['An approximate locality pin is not a measured facility coordinate. One asset may appear in company, field, plant and project datasets.','Titik lokasi perkiraan bukan koordinat fasilitas terukur. Satu aset dapat muncul pada data perusahaan, lapangan, fasilitas dan proyek.'],link:'data/strategic-map-glossary.json'},
minerals:{domains:['minerals','trade','energy'],why:['Ore and metal product tonnages, reserve estimates, installed smelter output and actual utilization are different baselines.','Tonase bijih dan logam hasil olahan, cadangan, kapasitas smelter dan utilisasi nyata memiliki basis berbeda.'],notes:['Separate permitting, operational status, upstream source, processing technology and WTO exposure for each mineral.','Bedakan izin, status operasi, asal bahan baku, teknologi proses, dan eksposur WTO untuk setiap mineral.'],link:'ruplt-investor-digitization.html'},
energy:{domains:['energy','electricity','oilgas','minerals'],why:['Power (MW), energy (GWh), capacity (MVA), and actual dispatch remain separate metrics.','Daya (MW), energi (GWh), kapasitas (MVA), serta operasi nyata adalah indikator berbeda.'],notes:['RUPTL planned equipment cannot be interpreted as commissioned firm grid headroom.','Peralatan yang direncanakan di RUPTL bukan kapasitas andal jaringan yang sudah beroperasi.'],link:'pln-ruptl-energy-investment.html'},
investment:{domains:['investment','minerals','maps'],why:['Do not add planned capital, signed financing and realized investment into a single amount.','Jangan jumlahkan modal direncanakan, pembiayaan ditandatangani, dan investasi yang terealisasi.'],notes:['Announced MW, operational MW and reported ownership require dated source evidence.','MW diumumkan, MW beroperasi, dan kepemilikan harus memiliki sumber dan tanggal.'],link:'sli-data-automation-center.html'},
ai:{domains:['ai','electricity','investment'],why:['IT MW, facility MW, GPU deployment, and cloud service availability represent different scopes.','MW IT, MW fasilitas, GPU terpasang, dan layanan cloud memiliki cakupan berbeda.'],notes:['Check verified grid power, N-1 reserve, cooling and commissioned computing separately.','Periksa daya jaringan, cadangan N-1, pendinginan, dan komputasi beroperasi secara terpisah.'],link:'ai-project-grid-finance.html'},
policy:{domains:['policy','trade','data'],why:['Legally effective rules, executive instructions, pending appeals and proposed regulations have different status.','Aturan berlaku, instruksi eksekutif, banding yang berjalan dan rancangan regulasi memiliki status berbeda.'],notes:['RIA-lite screening is not a completed ex-post policy impact evaluation or legal judgment.','Skrining RIA-lite bukan evaluasi dampak ex-post yang selesai atau putusan hukum.'],link:'policy-impact-evaluation.html'},
research:{domains:['data','policy','maps'],why:['A source-check timestamp is not a statistical observation date or a new official release.','Tanggal pemeriksaan sumber bukan periode statistik maupun tanggal rilis baru.'],notes:['Null is unknown; not zero. Sourced archival vintages remain historical even when checked today.','Null berarti belum diketahui, bukan nol. Angka arsip tetap historis meskipun diperiksa hari ini.'],link:'sli-data-automation-center.html'},
methodology:{domains:['data','policy','macro'],why:['Method and denominator must be stated before cross-source comparisons and aggregation.','Metode dan penyebut harus disebutkan sebelum perbandingan atau agregasi sumber.'],notes:['Do not infer policy causality or quantify NPV/CBA from unsupported assumptions.','Jangan menyimpulkan kausalitas kebijakan atau menghitung NPV/CBA tanpa data pendukung.'],link:'policy-impact-evaluation.html'}
};
const FILE_HINTS=[
[/ai|digital|data-cent|compute|gpu/i,'ai'],[/energy|pln|ruptl|electric|heesi|skkmigas/i,'energy'],[/invest|mineral|usgs|smelter|ruplt/i,'investment'],[/policy|regulat|impact|risk/i,'policy'],[/macro/i,'overview'],[/automat|audit|source|research/i,'research']
];
function contextFor(){
 let page=(location.hash||'').slice(1).split('?')[0];
 if(location.pathname.endsWith('/index.html')||location.pathname==='/'||location.pathname.endsWith('/strategic-latitude-intelligence/')){
  if(page.startsWith('energy')||page.startsWith('es-'))return 'energy';
  if(page==='trade')return 'trade';
  if(page==='map')return 'map';
  if(page==='minerals')return 'minerals';
  if(page.includes('investment'))return 'investment';
  if(page.includes('policy'))return 'policy';
  if(page.includes('ai'))return 'ai';
  if(page==='methodology')return 'methodology';
  if(page==='research')return 'research';
  return 'overview';
 }
 let filename=location.pathname.split('/').pop()||'';
 for(const [re,ctx] of FILE_HINTS)if(re.test(filename))return ctx;
 return 'research';
}
function style(){
 if(document.getElementById('sli-shared-glossary-style'))return;
 const el=document.createElement('style');el.id='sli-shared-glossary-style';
 el.textContent='.sli-shared-appendix{margin:27px 0 9px;padding:14px 17px;background:#112a3d;border:1px solid #39546a;border-radius:11px;color:#c6d6df;max-width:100%}.sli-shared-appendix summary{font-size:13px;cursor:pointer;color:#e5c890;font-weight:700}.sli-shared-appendix p{font-size:12px;line-height:1.7;margin:8px 0;color:#c0d1df}.sli-shared-appendix .sli-note-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}.sli-shared-appendix .sli-note-row div{padding:9px 11px;background:#15354b;border-radius:7px;font-size:11px}.sli-shared-appendix a{color:#e3bd7d}.sli-shared-appendix .sli-terms{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.sli-shared-appendix .sli-terms a{padding:5px 8px;background:#1c4256;border:1px solid #537187;border-radius:7px;text-decoration:none;font-size:11px}.sli-shared-appendix .sli-no-dupe{font-size:11px;color:#a7c6d2}.sli-dictionary{color:#f1f5f9}.sli-dictionary .sli-glos-controls{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0}.sli-dictionary label{display:flex;flex-direction:column;gap:5px;min-width:170px;font-size:12px;color:#a8c4d5}.sli-dictionary select,.sli-dictionary input,.sli-dictionary button{border:1px solid #55768d;background:#122c42;color:#f1f4f6;padding:9px 12px;border-radius:8px;font:inherit;min-height:39px}.sli-dictionary input{width:min(100%,380px)}.sli-dictionary button{cursor:pointer}.sli-dictionary .sli-dict-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.sli-dictionary .sli-dict-row{background:#132b40;border:1px solid #37536b;border-radius:10px;padding:14px;scroll-margin-top:18px;min-width:0}.sli-dictionary .sli-dict-row h3{margin:0;color:#e3c689;font-size:15px;overflow-wrap:anywhere}.sli-dictionary .sli-dict-row p{font-size:12px;color:#d6e3ed;margin:7px 0;line-height:1.65}.sli-dictionary .sli-dict-row small{display:block;color:#a9c1d2;font-size:11px}.sli-dictionary .sli-dict-row a{font-size:11px;color:#e0c084}.sli-dictionary .sli-dict-meta{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0}.sli-dictionary .sli-dict-meta span{border:1px solid #4b6980;padding:1px 7px;border-radius:12px;font-size:10px;color:#b6cbd8}.sli-dictionary .sli-glos-empty{padding:16px;border:1px dashed #65849a;color:#c5d9e8}.sli-dictionary .sli-glos-counter{padding:8px 0;color:#b5cddd;font-size:12px}@media(max-width:740px){.sli-dictionary .sli-dict-grid,.sli-shared-appendix .sli-note-row{grid-template-columns:1fr}.sli-dictionary label{width:100%}}';
 document.head.append(el)
}
async function getData(){
 if(cache)return cache;
 const res=await fetch('./data/sli-unified-glossary.json',{cache:'no-store'});
 if(!res.ok)throw Error('Unified glossary unavailable '+res.status);
 const json=await res.json();
 if(!Array.isArray(json.items)||json.items.length<200)throw Error('Dictionary incomplete');
 cache=json;return json;
}
function curatedTerms(ctx,data){
 const domains=CONTEXT[ctx].domains;
 const picks={overview:['GDP / PDB','Inflation (YoY / MoM)','JISDOR','Gini (BPS / WDI)'],
 trade:['Neraca perdagangan barang','BOP / NPI','Current account / Transaksi berjalan','USD / IDR'],
 map:['WGS84 / coordinates','Coordinates accuracy','Announcement vs realized','Missing / null vs zero'],
 minerals:['DS592','CBAM / CRMA','Installed capacity vs generation','Announcement vs realized'],
 energy:['MW vs MVA','Installed capacity vs generation','Firm headroom','Energy security 4A + S'],
 investment:['Announcement vs realized','Investment commitment vs realization','CAPEX / OPEX','Operational / COD'],
 ai:['IT load vs facility power','PUE','Firm headroom','Cloud region / AZ'],
 policy:['Inpres','Perda / Pergub / Perbup / Perwali','RIA / Regulatory Impact Assessment','Legal status (in force / draft / appealed)'],
 research:['Dataset observation date','Last checked','Missing / null vs zero','Source provenance'],
 methodology:['Ex-ante / Process / Ex-post','Impact pathway / Theory of change','Counterfactual','Source provenance']
 };
 return (picks[ctx]||picks.research).map(t=>data.items.find(x=>x.term===t)).filter(x=>x&&x.domains.some(z=>domains.includes(z)));
}
function compact(root,data){
 const ctx=contextFor(),c=CONTEXT[ctx]||CONTEXT.research,terms=curatedTerms(ctx,data);
 const glossaryTerm=x=>'<a href="'+URLPATH+'?domain='+encodeURIComponent(c.domains[0])+'#term-'+encodeURIComponent(x.slug)+'">'+esc(x.term)+' ↗</a>';
 root.innerHTML='<section class="sli-shared-appendix" data-sli-no-translate><details><summary>'+
  T('Appendix · Definitions, units & how to read this dashboard','Lampiran · Definisi, satuan & cara membaca dashboard')+
 '</summary><p>'+esc(T(c.why[0],c.why[1]))+'</p>'+
 '<div class="sli-note-row"><div>'+esc(T(c.notes[0],c.notes[1]))+'</div><div>'+
 esc(T('Source date, observation period, units, geography and evidence status are not interchangeable.','Tanggal sumber, periode observasi, satuan, wilayah, dan status bukti tidak boleh dipertukarkan.'))+'</div></div>'+
 '<div class="sli-terms">'+terms.map(glossaryTerm).join('')+'</div>'+
 '<p class="sli-no-dupe">'+esc(T('Each reusable term has one canonical entry. Specialized chart calculations and source caveats remain beside the visual.','Setiap istilah umum hanya memiliki satu definisi acuan. Rumus grafik serta keterbatasan sumber tetap ada di samping visual.'))+'</p>'+
 '<p><a href="'+URLPATH+'?domain='+encodeURIComponent(c.domains[0])+'">'+esc(T('Browse complete bilingual glossary and methodology','Buka glosarium dwibahasa dan metodologi lengkap'))+' ↗</a> · '+
 '<a href="'+c.link+'">'+esc(T('Sector evidence and definitions','Bukti dan definisi sektoral'))+' ↗</a></p></details></section>'
}
function mount(){
 style();
 // Energy Security has its own short source-specific reading guide pointing to the
 // same canonical dictionary. Do not show two appendices on that tab.
 if(contextFor()==="energy"&&document.getElementById("energyAppendixRoot"))return;
 const isIndex=location.pathname.endsWith('/index.html')||location.pathname==='/'||location.pathname.endsWith('/strategic-latitude-intelligence/');
 const rootId=isIndex?'sliSharedAppendixBar':'sliSharedAppendixBar';
 let root=document.getElementById(rootId);
 const parent=isIndex?document.getElementById('content'):(document.querySelector('main')||document.body);
 if(!parent)return;
 if(!root){root=document.createElement('div');root.id=rootId;parent.append(root)}
 getData().then(d=>{if(root.isConnected)compact(root,d)}).catch(()=>{if(root.isConnected)root.innerHTML='<p style="font-size:12px;padding:11px;background:#142b3c">Appendix temporarily unavailable. <a href="'+URLPATH+'">Open full reference ↗</a>.</p>'})
}
function drawFull(data){
 const root=document.getElementById('sliGlossaryMain');if(!root)return;
 style();const params=new URLSearchParams(location.search);
 if(!root.dataset.ready){domain=params.get('domain')||'all';root.dataset.ready='1'}
 let choices=Object.entries(data.domain_labels);
 if(domain!=='all'&&!data.domain_labels[domain])domain='all';
 const select=(opts,value)=>opts.map(([key,label])=>'<option value="'+esc(key)+'"'+(key===value?' selected':'')+'>'+esc(label)+'</option>').join('');
 const cats=Object.entries(data.category_labels);
 root.innerHTML='<div class="sli-dictionary" data-sli-no-translate><div class="sli-glos-controls">'+
 '<label>'+T('Search all terms','Cari seluruh istilah')+'<input type="search" id="sli-dict-search" placeholder="'+T('Abbreviation, unit, definition…','Singkatan, satuan, definisi…')+'" value="'+esc(query)+'"></label>'+
 '<label>'+T('Sector','Sektor')+'<select id="sli-dict-domain">'+select([['all',T('All sectors','Semua sektor')],...choices.map(([a,b])=>[a,locEN()==='id'?b[1]:b[0]])],domain)+'</select></label>'+
 '<label>'+T('Definition type','Jenis definisi')+'<select id="sli-dict-cat">'+select([['all',T('All types','Semua jenis')],...cats.map(([a,b])=>[a,locEN()==='id'?b[1]:b[0]])],category)+'</select></label>'+
 '<button id="sli-dict-more">'+T('Show more','Tampilkan lagi')+'</button><button id="sli-dict-clear">'+T('Clear','Bersihkan')+'</button></div>'+
 '<div id="sli-dict-results"></div></div>';
 const update=()=>{
 const q=query.trim().toLocaleLowerCase(),rows=data.items.filter(x=>(domain==='all'||x.domains.includes(domain))&&(category==='all'||x.category===category)&&(!q||[x.term,x.en,x.id,x.note_en,x.note_id,x.map_context].join(' ').toLocaleLowerCase().includes(q)));
 const selected=rows.slice(0,limit);
 const out=root.querySelector('#sli-dict-results');out.innerHTML='<div class="sli-glos-counter">'+rows.length+' '+T('matching unique entries','istilah unik cocok')+' · '+selected.length+' '+T('displayed','ditampilkan')+' · '+data.items.length+' '+T('total terms','total istilah')+'</div>'+
 (selected.length?'<div class="sli-dict-grid">'+selected.map(x=>{
    const reference=x.source_path&&!x.source_path.endsWith('sli-unified-glossary.json')?'<a href="./'+esc(x.source_path)+'">'+esc(T('Original entry','Entri asli'))+' ↗</a>':'';
    return '<article class="sli-dict-row" id="term-'+esc(x.slug)+'"><h3>'+esc(x.term)+'</h3><div class="sli-dict-meta">'+
       x.domains.slice(0,4).map(z=>'<span>'+esc(data.domain_labels[z]?.[locEN()==='id'?1:0]||z)+'</span>').join('')+'</div>'+
       '<p>'+esc(locEN()==='id'?x.id:x.en)+'</p>'+
       ((x.note_en||x.note_id)?'<small>'+esc(locEN()==='id'?(x.note_id||x.note_en):x.note_en)+'</small>':'')+
       '<small>'+esc(x.origin)+' · '+esc(x.map_context||'')+' '+reference+'</small></article>';
 }).join('')+'</div>':'<div class="sli-glos-empty">'+T('No entries. Change term or sector filter.','Istilah tidak ditemukan. Ubah kata pencarian atau sektor.')+'</div>');
 const more=root.querySelector('#sli-dict-more');more.disabled=selected.length>=rows.length;
 };
 const search=root.querySelector('#sli-dict-search');
 search.oninput=e=>{query=e.target.value;limit=50;update()};
 root.querySelector('#sli-dict-domain').onchange=e=>{domain=e.target.value;limit=50;update()};
 root.querySelector('#sli-dict-cat').onchange=e=>{category=e.target.value;limit=50;update()};
 root.querySelector('#sli-dict-more').onclick=()=>{limit+=60;update()};
 root.querySelector('#sli-dict-clear').onclick=()=>{query='';domain='all';category='all';limit=50;drawFull(data)};
 const anchor=decodeURIComponent(location.hash).replace(/^#/,'');
 if(anchor.startsWith('term-')){
   const target=data.items.find(x=>'term-'+x.slug===anchor);
   if(target){domain='all';category='all';query=target.term;limit=50;search.value=query;root.querySelector('#sli-dict-domain').value='all';update();requestAnimationFrame(()=>document.getElementById(anchor)?.scrollIntoView({block:'center'}));return}
 }
 update();
}
function attach(){
 const glossary=document.getElementById('sliGlossaryMain');if(glossary){getData().then(drawFull).catch(e=>{glossary.textContent='Cannot read unified glossary: '+e.message});return}
 mount()
}
document.addEventListener('DOMContentLoaded',attach);
document.addEventListener('sli:pagechange',()=>{if(!document.getElementById('sliGlossaryMain'))setTimeout(mount,0)});
document.addEventListener('sli:languagechange',()=>{if(document.getElementById('sliGlossaryMain')&&cache)drawFull(cache);else mount()});
})();