/* SLI Corporate Group Explorer: dated, source-attributed ownership graph.
 * parent_id is an observed snapshot of a reported relationship, not inference from naming.
 * No Wikipedia search-by-name or speculative director assignment. */
(()=>{'use strict';
const ROOT='sliCorporateGroups',FILE='./data/sli-corporate-group-registry.json';
const T=(en,id)=>document.documentElement.lang==='id'?id:en;
const E=(tag,cl,s)=>{const e=document.createElement(tag);if(cl)e.className=cl;if(s!==undefined)e.textContent=String(s);return e};
const source=a=>{try{const u=new URL(a);return u.protocol==='https:'?u.href:null}catch{return null}};
const I=()=>window.SLIEntityIdentity;
let data,byId,group='pertamina',sector='energy',selected='per',query='',expand=new Set();
function aLink(url,title){const valid=source(url),a=E(valid?'a':'span','sli-cg-link',title);if(valid){a.href=valid;a.target='_blank';a.rel='noopener noreferrer'}return a}
function iconOf(n){
 const type=n.tier===0&&n.ownership_class==='indonesian-state'?'government':'building';
 return I()?.siteBrand?.(n.website_domain,type)||I()?.brand(n.name,type)||E('span','sli-cg-no-icon','▢');
}
function depthName(n){if(n.relationship==='business-unit')return T('Business unit · not separate issuer','Unit bisnis · bukan emiten tersendiri');if(n.relationship==='associated-investment')return T('Associated investment · verify control','Investasi terkait · kendali belum pasti');if(n.relationship==='reported-member')return T('Reported member · ownership not inferred','Anggota terlapor · kepemilikan belum diasumsikan');return n.tier===0?T('Group root / standalone issuer','Induk grup / emiten tersendiri'):n.tier===1?T('Subsidiary','Anak'):n.tier===2?T('Grandchild','Cucu'):n.tier===3?T('Great-grandchild','Cicit'):T('Deeper tier','Lapisan lanjutan')}
function children(id){return data.records.filter(n=>n.parent_id===id).sort((a,b)=>a.name.localeCompare(b.name,'id'))}
function path(n){const result=[];const visited=new Set();while(n&&!visited.has(n.id)){result.unshift(n);visited.add(n.id);n=byId.get(n.parent_id)}return result}
function card(n,depth=0){
 const row=E('div','sli-cg-entry');
 const button=E('button','sli-cg-entry-main');button.type='button';button.setAttribute('aria-pressed',String(selected===n.id));
 const brand=iconOf(n);brand.classList.add('sli-cg-logo');button.append(brand);
 const words=E('span','sli-cg-words');words.append(E('strong','',n.name),E('small','',depthName(n)+' · '+n.business_id));button.append(words);
 button.addEventListener('click',()=>{selected=n.id;renderDetails();renderTree()});row.append(button);
 const kids=children(n.id);if(kids.length){
  const toggle=E('button','sli-cg-fold',expand.has(n.id)?'−':'+' );toggle.type='button';toggle.setAttribute('aria-label',T('Expand / collapse children of ','Buka / tutup turunan dari ')+n.name);
  toggle.setAttribute('aria-expanded',String(expand.has(n.id)));
  toggle.addEventListener('click',()=>{expand.has(n.id)?expand.delete(n.id):expand.add(n.id);renderTree()});row.append(toggle);
  if(expand.has(n.id)){const branch=E('div','sli-cg-branch');for(const c of kids)branch.append(card(c,depth+1));row.append(branch)}
 }
 return row;
}
function sectorName(key){return ({energy:T('Energy & utilities','Energi & utilitas'),minerals:T('Minerals & downstream','Mineral & hilirisasi'),coal:T('Coal','Batu bara'),technology:T('AI, data centers & technology','AI, pusat data & teknologi'),food:T('Food & agribusiness','Pangan & agribisnis')})[key]||key}
function className(key){return ({'indonesian-state':T('State-owned / SOE','BUMN'),'indonesian-private':T('Indonesian private','Swasta Indonesia'),'foreign':T('Foreign company','Perusahaan asing'),'foreign-linked':T('Foreign-affiliated IDX issuer','Emiten dengan afiliasi asing'),'joint-venture':T('Joint venture / strategic investor','Usaha patungan / investor strategis')})[key]||T('Review control evidence','Verifikasi pengendalian')}
function renderTabs(){
 const tabs=document.getElementById('sliCgGroupTabs');if(!tabs||!data)return;tabs.replaceChildren();
 const groups=data.groups.filter(g=>sector==='all'||g.sector===sector);
 for(const g of groups){const b=E('button','',g.name);b.type='button';b.dataset.sliCgGroup=g.id;b.setAttribute('aria-pressed',String(g.id===group));
  b.addEventListener('click',()=>{group=g.id;selected=g.root_id;query='';document.getElementById('sliCgSearch').value='';expand.add(g.root_id);renderTabs();renderTree();renderDetails()});tabs.append(b)}
 const count=data.records.filter(n=>sector==='all'||n.sector===sector).length;
 document.getElementById('sliCgCoverage').textContent=count+' '+T('company records across ','entitas dalam ')+groups.length+' '+T('groups; dated, not exhaustive','grup; bersumber, belum menyeluruh');
 renderIssuerTable();
}
function renderIssuerTable(){
 const tbody=document.getElementById('sliCgIssuerRows'),count=document.getElementById('sliCgIssuerCount');
 if(!tbody||!data)return;
 tbody.replaceChildren();
 const issuers=data.records.filter(n=>n.listing_status==='listed'&&n.ticker&&(sector==='all'||n.sector===sector)).sort((a,b)=>(a.exchange||'').localeCompare(b.exchange||'')||a.ticker.localeCompare(b.ticker));
 count.textContent=issuers.length+' '+T('listed entities','emiten');
 const finance=(n,k)=>typeof n[k]==='number'&&Number.isFinite(n[k])&&n.financial_period&&source(n.financial_source_url)?
  new Intl.NumberFormat(document.documentElement.lang==='id'?'id-ID':'en-US',{maximumFractionDigits:2}).format(n[k])+' '+(n.financial_currency||''):'N/A';
 for(const n of issuers){
  const row=E('tr');row.setAttribute('data-sli-issuer',n.ticker);
  const code=E('td','',n.exchange+':'+n.ticker),name=E('td'),button=E('button','sli-cg-issuer-open',n.name);
  button.type='button';button.addEventListener('click',()=>{sector=n.sector;document.getElementById('sliCgSector').value=sector;
   group=n.group;selected=n.id;query='';document.getElementById('sliCgSearch').value='';
   for(const p of path(n))expand.add(p.id);
   renderTabs();renderTree();renderDetails();
   document.getElementById('sliCgDossier')?.scrollIntoView?.({block:'nearest',behavior:'smooth'});
  });
  name.append(button);
  const cap=typeof n.market_cap==='number'&&Number.isFinite(n.market_cap)&&n.market_cap_as_of&&n.market_cap_source_url?
   new Intl.NumberFormat(document.documentElement.lang==='id'?'id-ID':'en-US').format(n.market_cap)+' '+n.market_cap_currency+' · '+n.market_cap_as_of:'N/A';
  const cells=[code,name,E('td','',sectorName(n.sector)),E('td','',cap),E('td','',finance(n,'revenue')),E('td','',finance(n,'net_income')),E('td','',finance(n,'total_assets')),E('td','',n.financial_period||T('Not verified','Belum terverifikasi'))];
  for(const cell of cells)row.append(cell);
  const src=E('td');src.append(aLink(n.financial_source_url||n.source_url,T('Disclosure ↗','Dokumen ↗')));row.append(src);tbody.append(row);
 }
 if(!issuers.length){const row=E('tr'),cell=E('td','',T('No listed issuers in this category.','Tidak ada emiten tercatat pada kategori ini.'));cell.colSpan=9;row.append(cell);tbody.append(row)}
}
function renderTree(){
 const mount=document.getElementById('sliCgTree');if(!mount||!data)return;mount.replaceChildren();
 const root=data.groups.find(g=>g.id===group);if(!root)return;
 const normalized=I().nameKey(query).split('-').filter(Boolean);
 if(normalized.length){
  const matches=data.records.filter(n=>(sector==='all'||n.sector===sector)&&normalized.every(term=>I().nameKey([n.name,n.business_id,n.ticker||'',n.directors?.map(d=>d.name).join(' ')||''].join(' ')).includes(term))).slice(0,100);
  mount.append(E('p','sli-cg-small',T('Matching entities across sector groups: ','Entitas cocok lintas grup sektor: ')+matches.length));
  for(const n of matches)mount.append(cardSearch(n));
  if(!matches.length)mount.append(E('p','sli-cg-small',T('No matches in this sector. Try All sectors.','Tidak ada hasil di sektor ini; coba Semua sektor.')));
 }else mount.append(card(byId.get(root.root_id)));
 const count=data.records.filter(n=>n.group===group).length;
 document.getElementById('sliCgCount').textContent=count+' '+T('documented records in selected group · not a full audited ownership census','catatan grup terpilih · bukan sensus kepemilikan penuh');
 document.querySelectorAll('[data-sli-cg-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sliCgGroup===group)));
}
function cardSearch(n){const b=E('button','sli-cg-hit',n.name+' · '+(n.ticker?n.exchange+':'+n.ticker+' · ':'')+sectorName(n.sector));b.type='button';b.addEventListener('click',()=>{selected=n.id;group=n.group;renderTabs();renderDetails()});return b}
function renderDetails(){
 const host=document.getElementById('sliCgDossier');if(!host)return;
 host.replaceChildren();
 const n=byId?.get(selected);if(!n||n.group!==group){host.append(E('p','',T('Choose a company to view its dossier.','Pilih perusahaan untuk melihat profil.')));return}
 const head=E('div','sli-cg-profile-title');head.append(iconOf(n));const names=E('div');names.append(E('small','',depthName(n)),E('h3','',n.name));head.append(names);host.append(head);
 const chip=E('span','sli-cg-chip',n.relationship==='joint-venture'?T('Joint venture (not wholly owned)','Usaha patungan (bukan milik penuh)'):n.relationship==='subsidiary'?T('Reported subsidiary','Anak usaha terlapor'):n.relationship==='business-unit'?T('Business unit (not a legal company)','Unit bisnis (bukan badan hukum terpisah)'):n.relationship==='reported-member'?T('Reported group member','Anggota grup terlapor'):n.relationship==='associated-investment'?T('Related investment; control unverified','Investasi terkait; kendali belum terverifikasi'):T('Parent or standalone issuer','Induk atau emiten tersendiri'));host.append(chip);
 host.append(E('p','sli-cg-company-tags',sectorName(n.sector||'energy')+' · '+className(n.ownership_class)+' · '+(n.listing_status==='listed'?T('Publicly listed','Emiten tercatat'):T('Unlisted / private / subsidiary','Tidak tercatat / privat / anak usaha'))));
 const desc=E('p','sli-cg-business',n.business_id);host.append(desc);
 const dl=E('dl','sli-cg-fields');
 const pairs=[[T('Generation','Generasi'),depthName(n)],[n.source_date_basis==='registry_review'?T('Registry review date','Tanggal pemeriksaan registri'):T('Dated source','Tanggal sumber'),n.source_date],
 [T('Reported ownership','Persentase terlapor'),n.ownership_pct===null?T('Not recorded · do not infer 100%','Tidak tersedia · jangan asumsikan 100%'):n.ownership_pct+'%'],
 [T('Reported link to','Relasi tercatat dengan'),n.parent_id?byId.get(n.parent_id)?.name:T('Standalone/root','Entitas mandiri/induk')]];
 for(const [label,value] of pairs){dl.append(E('dt','',label),E('dd','',value))}host.append(dl);
 const disclosure=E('section','sli-cg-finance');disclosure.append(E('h4','',T('Capital markets & financial disclosure','Pasar modal & keterbukaan keuangan')));
 const fd=E('dl','sli-cg-fields'),listing=n.listing_status==='listed'&&n.ticker;
 const shown=(value)=>typeof value==='number'&&Number.isFinite(value);
 const line=(label,value)=>fd.append(E('dt','',label),E('dd','',value));
 line(T('Issuer / exchange','Emiten / bursa'),listing?n.exchange+':'+n.ticker:T('No separate exchange ticker','Tidak memiliki kode saham tersendiri'));
 if(listing){
  line(T('Market capitalization','Kapitalisasi pasar'),shown(n.market_cap)&&n.market_cap_as_of&&n.market_cap_currency&&n.market_cap_source_url?
   new Intl.NumberFormat(document.documentElement.lang==='id'?'id-ID':'en-US',{maximumFractionDigits:2}).format(n.market_cap)+' '+n.market_cap_currency+' · '+n.market_cap_as_of:
   T('N/A · closing price and shares outstanding not ingested','N/A · harga penutupan dan saham beredar belum terindeks'));
  line(T('Closing price × outstanding shares','Harga penutupan × saham beredar'),shown(n.closing_price)&&shown(n.shares_outstanding)&&n.market_cap_as_of?n.closing_price+' × '+n.shares_outstanding+' · '+n.market_cap_as_of:'N/A');
 }else line(T('Market cap','Kapitalisasi pasar'),T('Not applicable: no separately listed shares','Tidak berlaku: tidak ada saham yang dicatatkan tersendiri'));
 for(const [label,value] of [[T('Revenue','Pendapatan'),n.revenue],[T('Profit for year (all interests)','Laba tahun berjalan (total)'),n.net_income],[T('Total assets','Total aset'),n.total_assets]]){
  line(label,shown(value)&&n.financial_period&&n.financial_source_url?
  new Intl.NumberFormat(document.documentElement.lang==='id'?'id-ID':'en-US').format(value)+' '+(n.financial_currency||'')+' · '+n.financial_period:'N/A · '+T('report/period pending source verification','perlu laporan dan periode terverifikasi'));
 }
 disclosure.append(fd);
 const note=E('p','sli-cg-small',T('Capitalization is price × issued outstanding shares on the same dated trading session, not company asset value or project investment. Financial statements and shareholder percentages use their own reporting periods. Missing is not zero.','Kapitalisasi = harga saham × jumlah saham beredar pada tanggal perdagangan yang sama; bukan total aset atau nilai proyek. Laporan keuangan dan kepemilikan mengikuti tanggal serta cakupan sendiri. Data kosong bukan nol.'));
 disclosure.append(note);
 if(n.financial_basis)disclosure.append(E('p','sli-cg-small',T('Reporting basis: ','Basis laporan: ')+n.financial_basis));
 const financeLinks=E('div','sli-cg-source-links');
 if(listing&&n.exchange==='IDX'){
  financeLinks.append(aLink('https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/'+encodeURIComponent(n.ticker),T('IDX issuer profile ↗','Profil emiten BEI ↗')));
  financeLinks.append(aLink('https://www.idx.co.id/id/perusahaan-tercatat/laporan-keuangan-dan-tahunan/',T('IDX financial/annual reports ↗','Laporan keuangan & tahunan BEI ↗')));
  financeLinks.append(aLink('https://www.idx.co.id/id/perusahaan-tercatat/data-kepemilikan-saham/',T('IDX/KSEI share ownership ↗','Kepemilikan saham BEI/KSEI ↗')));
 }
 if(source(n.financial_source_url))financeLinks.append(aLink(n.financial_source_url,T('Dated issuer financial report ↗','Laporan keuangan bertanggal ↗')));
 if(source(n.market_cap_source_url))financeLinks.append(aLink(n.market_cap_source_url,T('Trading data for market cap ↗','Bukti perdagangan kapitalisasi ↗')));
 disclosure.append(financeLinks);host.append(disclosure);
 const chain=E('div','sli-cg-chain'),p=path(n);chain.append(E('h4','',T('Ownership path','Jalur grup')));
 p.forEach((x,i)=>{if(i)chain.append(E('span','sli-cg-sep','›'));const b=E('button','sli-cg-path',x.name);b.type='button';b.addEventListener('click',()=>{selected=x.id;expand.add(x.parent_id);renderTree();renderDetails()});chain.append(b)});host.append(chain);
 const directors=E('section','sli-cg-board');directors.append(E('h4','',T('Named board of directors','Direksi yang teridentifikasi')));
 if(n.directors?.length){
  for(const d of n.directors){
   const card=E('div','sli-cg-director');const symbol=I()?.icon?.('person');if(symbol)card.append(symbol);
   const stack=E('div','sli-cg-director-body');const name=I()?.personLink?.(d.name,d.source_url)||E('strong','',d.name);
   stack.append(name,E('small','',d.title_id+' · '+d.source_date));
   stack.append(aLink(d.source_url,T('Official appointment / roster source ↗','Sumber resmi jabatan / susunan direksi ↗')));card.append(stack);directors.append(card)
  }
 }else directors.append(E('p','sli-cg-small',T('Director roster not sufficiently verified from a dated source.','Susunan direksi belum cukup terverifikasi dari sumber bertanggal.')));
 host.append(directors);
 if(n.source_note)host.append(E('p','sli-cg-warning',n.source_note));
 const sources=E('div','sli-cg-source-links');sources.append(aLink(n.source_url,T('Read original ownership / business source ↗','Periksa sumber kepemilikan / bisnis ↗')));
 if(n.website_domain)sources.append(aLink('https://'+n.website_domain+'/',T('Company website ↗','Situs perusahaan ↗')));
 host.append(sources);
 host.append(E('p','sli-cg-small',T('A company website icon is a favicon, not a certified logo. Source dates vary. Directors may change after the cited release.','Ikon dari situs perusahaan adalah favicon, bukan logo yang disertifikasi. Tanggal sumber berbeda-beda; susunan direksi dapat berubah setelah tanggal publikasi.')));
}
function csvCell(value){let s=String(value??'');if(/^[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
function exportRows(){
 if(!data)return;
 const columns=['group','sector','ownership_class','entity_name','parent_entity','relationship','exchange','ticker','listing_status','market_cap','market_cap_currency','market_cap_as_of','market_cap_source_url','revenue','net_income','total_assets','financial_currency','financial_period','financial_source_url','business','ownership_pct_reported','directors_names','source_date','source_date_basis','original_source'];
 const rows=data.records.filter(n=>n.group===group).map(n=>[n.group,n.sector,n.ownership_class,n.name,byId.get(n.parent_id)?.name||'',n.relationship,n.exchange,n.ticker,n.listing_status,n.market_cap,n.market_cap_currency,n.market_cap_as_of,n.market_cap_source_url,n.revenue,n.net_income,n.total_assets,n.financial_currency,n.financial_period,n.financial_source_url,n.business_id,n.ownership_pct,n.directors?.map(d=>d.name+' — '+d.title_id).join('; ')||'',n.source_date,n.source_date_basis,n.source_url]);
 const content='\uFEFF'+[columns,...rows].map(c=>c.map(csvCell).join(',')).join('\r\n');
 const object=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
 const link=document.createElement('a');link.href=object;link.download='sli-'+group+'-group-evidence.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(object),1000);
}
function initialize(db){
 if(db?.schema!=='sli-corporate-group-registry-v2'||!Array.isArray(db.records)||!Array.isArray(db.groups)||db.groups.length<5)throw Error('Multisector registry schema invalid');
 const ids=new Set(),groups=new Map(db.groups.map(g=>[g.id,g]));
 for(const g of db.groups){if(!g.root_id||!['energy','minerals','coal','technology','food'].includes(g.sector))throw Error('Invalid group sector '+g.id)}
 for(const n of db.records){
  if(!n.id||ids.has(n.id)||!source(n.source_url)||!n.business_id||!n.source_date||!groups.has(n.group))throw Error('Unattributed company '+n?.id);
  if(n.listing_status==='listed'&&(!n.ticker||!['IDX','NASDAQ','SGX'].includes(n.exchange)))throw Error('Listed issuer without documented market '+n.id);
  if(n.market_cap!==null&&n.market_cap!==undefined&&(!n.market_cap_source_url||!n.market_cap_currency||!n.market_cap_as_of||!Number.isFinite(n.closing_price)||!Number.isFinite(n.shares_outstanding)))throw Error('Market cap without matched source, quote and float '+n.id);
  if([n.revenue,n.net_income,n.total_assets].some(v=>v!==null&&v!==undefined)&&(!n.financial_source_url||!n.financial_period||!n.financial_currency))throw Error('Financial amount without dated report '+n.id);
  ids.add(n.id);
 }
 const lookup=new Map(db.records.map(n=>[n.id,n]));
 for(const n of db.records){
  const root=groups.get(n.group);
  if(n.parent_id){const p=lookup.get(n.parent_id);if(!p||p.group!==n.group)throw Error('Broken group relation '+n.id)}
  let depth=0,parent=n,seen=new Set([n.id]);
  while(parent.parent_id){parent=lookup.get(parent.parent_id);if(!parent||seen.has(parent.id))throw Error('Corporate ownership cycle '+n.id);seen.add(parent.id);depth++}
  if(parent.id!==root.root_id||n.tier!==depth)throw Error('Broken group root or generation '+n.id);
 }
 data=db;byId=lookup;
 const params=new URLSearchParams(location.search),requestedGroup=params.get('group');
 if(groups.has(requestedGroup))group=requestedGroup;
 sector=groups.get(group)?.sector||'energy';
 if(['all','energy','minerals','coal','technology','food'].includes(params.get('sector'))&&params.get('sector')==='all')sector='all';
 selected=groups.get(group)?.root_id;
 expand=new Set([selected]);
 const sectorSelect=document.getElementById('sliCgSector');sectorSelect.value=sector;
 sectorSelect.addEventListener('change',()=>{sector=sectorSelect.value;
  const matches=db.groups.filter(g=>sector==='all'||g.sector===sector);
  if(!matches.some(g=>g.id===group)){group=matches[0].id;selected=matches[0].root_id}
  query='';document.getElementById('sliCgSearch').value='';expand.add(selected);renderTabs();renderTree();renderDetails();
 });
 document.getElementById('sliCgSearch').addEventListener('input',e=>{query=e.target.value.trim();renderTree()});
 document.getElementById('sliCgExpand').addEventListener('click',()=>{expand=new Set(data.records.filter(n=>n.group===group).map(n=>n.id));renderTree()});
 document.getElementById('sliCgCollapse').addEventListener('click',()=>{expand=new Set([groups.get(group).root_id]);renderTree()});
 document.getElementById('sliCgCsv').addEventListener('click',exportRows);
 document.addEventListener('sli:languagechange',()=>{renderTabs();renderTree();renderDetails()});
 renderTabs();renderTree();renderDetails();
}
function load(){
 const root=document.getElementById(ROOT);if(!root)return;
 fetch(FILE,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(initialize)
 .catch(err=>{console.error('[SLI company group explorer]',err);const host=document.getElementById('sliCgTree');if(host)host.textContent=T('Company register unavailable; no substitute data invented.','Data perusahaan belum bisa dimuat; tidak dibuat data pengganti.');});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();