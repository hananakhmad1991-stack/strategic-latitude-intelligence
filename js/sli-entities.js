/* Source-linked entity explorer. No guessed identities, private uploads or live-status claims.
 * Uses the SAME public sector hierarchy and project registry as the analytical dashboards. */
(()=>{'use strict';
const $=id=>document.getElementById(id),I=()=>window.SLIEntityIdentity;
const id=()=>window.SLIi18n?.language==='id'||document.documentElement.lang==='id';
const T=(en,bahasa)=>id()?bahasa:en;
const el=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e};
const safe=url=>I().isHttps(url);
const catalog=new Map();let all=[],visible=[],selected='',registryDate='',displayLimit=100,issuerCoverage=null,assetProfiles=new Map(),equityProfiles=new Map();
function upsert(record){
 const prev=catalog.get(record.key);
 if(prev){prev.sectors=[...new Set([...prev.sectors,...record.sectors])];prev.records.push(...record.records);
  if(!prev.source&&record.source)prev.source=record.source;
  if(!prev.person&&record.person)prev.person=record.person;
  if(!prev.role&&record.role)prev.role=record.role;
  if(record.corporate)prev.corporate=record.corporate;
 }else catalog.set(record.key,record);
}
function fromHierarchy(db){
 registryDate=db.as_of||'';
 for(const [sector,section] of Object.entries(db.sectors||{})){
  for(const a of [...(section.nodes||[]),...(section.market||[])]){
   if(!a?.title)continue;
   const type=['government','oversight'].includes(a.lane)?'institution':'company';
   const key=type+':'+I().nameKey(a.title);
   const rec={sector,actorId:a.id,parentId:a.parent,relation:a.relation,verification:a.verification,source:a.source};
   upsert({key,type,title:a.title,person:a.person||'',source:safe(a.source),role:a.role||'',date:db.as_of||'',sectors:[sector],records:[rec],summary:a.role||'',original:a});
   if(a.person){
    const personKey='person:'+I().nameKey(a.person);
    upsert({key:personKey,type:'person',title:a.person,person:a.person,source:safe(a.source),role:a.title,date:db.as_of||'',sectors:[sector],records:[rec],summary:T('Listed in dated leadership register.','Tercatat dalam registri pimpinan bertanggal.'),original:a});
   }
  }
 }
}
function fromProjects(db){
 for(const p of db.records||[]){
  if(!p?.id||!p.name)continue;
  upsert({key:'project:'+I().nameKey(p.id),type:'project',title:p.name,person:'',source:safe(p.source_url),role:p.sector||'',date:p.evidence_date||db.as_of||'',sectors:['projects'],records:[{projectId:p.id,sector:p.sector,source:p.source_url}],summary:p.status_note||'',original:p});
 }
}
function fromCorporateGroups(db){
 registryDate=db.as_of||registryDate;
 for(const n of db.records||[]){
  if(!n?.id||!n.name||!safe(n.source_url))continue;
  const rec={sector:n.sector||'corporate',actorId:n.id,parentId:n.parent_id,relation:n.relationship,verification:'source-dated',source:n.source_url};
  const key='company:'+I().nameKey(n.name);
  upsert({key,type:'company',title:n.name,person:n.directors?.find(d=>d.title_id==='Direktur Utama')?.name||'',source:n.source_url,role:n.business_id,date:n.source_date,sectors:['corporate',n.sector||'corporate'],records:[rec],summary:n.business_id,original:n,corporate:n});
  for(const d of n.directors||[]){
   if(!d?.name||!safe(d.source_url))continue;
   upsert({key:'person:'+I().nameKey(d.name),type:'person',title:d.name,person:d.name,source:d.source_url,role:d.title_id+' · '+n.name,date:d.source_date,sectors:['corporate'],records:[rec],summary:T('Source-dated director of ','Direksi yang tercatat di ')+n.name,original:n});
  }
 }
}
function fromIssuerUniverse(db){
 if(db?.schema!=='sli-idx-issuer-universe-v1'||!Array.isArray(db.records)||db.records.length<20)throw Error('IDX catalogue malformed');
 issuerCoverage={count:db.records.length,status:db.source_status,as_of:db.as_of};
 const seen=new Set();
 for(const n of db.records){
  if(!/^[A-Z0-9]{4}$/.test(n.ticker||'')||seen.has(n.ticker)||!safe(n.source_url)||!n.name||!n.sector)throw Error('Issuer catalogue invalid or duplicate '+n.ticker);
  seen.add(n.ticker);
  const match=[...catalog.values()].find(a=>a.type==='company'&&a.corporate?.exchange==='IDX'&&a.corporate?.ticker===n.ticker);
  const rec={sector:n.sector,source:n.source_url,verification:n.verification,issuerCode:n.ticker};
  if(match){match.sectors=[...new Set([...match.sectors,n.sector])];match.records.push(rec);match.issuerRecord=n;continue}
  const key='company:idx:'+n.ticker;
  const official=n.verification==='official_exchange_snapshot';
  const corporate={...n,listing_status:official?'listed':'verification-pending'};
  upsert({key,type:'company',title:n.name,person:'',source:n.source_url,role:'IDX: '+n.ticker+' · '+(official?T('Official issuer snapshot','Snapshot emiten resmi'):T('Issuer candidate — verify current listing','Kandidat emiten — periksa pencatatan terkini')),date:db.as_of,sectors:[n.sector],records:[rec],summary:n.name,original:n,corporate,issuerRecord:n});
 }
}
function fromCorporateEvidence(db){
 if(db?.schema!=='sli-corporate-evidence-relationships-v1')throw Error('Unsupported relationship evidence');
 const note=T('Dated source record; no ultimate ownership inferred','Bukti bertanggal; kepemilikan akhir tidak diasumsikan');
 const add=(name,type,role,date,url,tag,record,detail)=>{
  if(!name||!safe(url))return;
  const key=type+':'+I().nameKey(name);
  upsert({key,type,title:name,person:'',source:url,role,date,sectors:[tag],records:[record],summary:role,original:detail||null});
 };
 for(const p of db.ownership_profiles||[]){
  const source=p.source_urls?.find(safe);
  if(!source)continue;
  const role=T('Dated direct equity disclosure','Keterbukaan pemegang saham langsung')+' · '+p.reference_date;
  add(p.name,'company',role,p.reference_date,source,'corporate',{source,relationship:'reported_direct_equity',profile_id:p.id,verification:'source-dated'},p);
  for(const shareholder of p.shareholders||[]){
   if(!['organization','person'].includes(shareholder.holder_kind))continue;
   const kind=shareholder.holder_kind==='person'?'person':'company';
   add(shareholder.name,kind,note+' · '+p.name,p.reference_date,source,'corporate',
    {source,relationship:'reported_direct_shareholder',target:p.name,pct:shareholder.reported_pct,verification:'source-dated'},null);
  }
 }
 for(const p of db.project_participations||[]){
  const institution=/^(Danantara Indonesia|Indonesia Investment Authority)/.test(p.name);
  add(p.name,institution?'institution':'company',
   T('Reported project participant (not a shareholder)','Peserta proyek terlapor (bukan bukti saham)')+' · '+p.project_name,
   p.source_date,p.source_url,'projects',
   {source:p.source_url,relationship:'reported_project_participant_not_equity_shareholder',projectId:p.project_id,verification:p.verification},null);
 }
}
const typeLabels={person:['Person','Tokoh'],institution:['Institution','Lembaga'],company:['Company','Perusahaan'],project:['Project','Proyek']};
const sectorLabels={finance:['Banking & finance','Perbankan & keuangan'],infrastructure:['Infrastructure & construction','Infrastruktur & konstruksi'],transport:['Transport & logistics','Transportasi & logistik'],property:['Property & industrial estates','Properti & kawasan industri'],healthcare:['Health & pharma','Kesehatan & farmasi'],manufacturing:['Industrial manufacturing','Industri manufaktur'],retail:['Retail & commerce','Ritel & perdagangan'],other:['Unclassified','Lainnya'],corporate:['Corporate groups','Grup perusahaan'],energy:['Energy','Energi'],minerals:['Critical minerals','Mineral kritis'],coal:['Coal','Batu bara'],technology:['AI, data centers & technology','AI, data center & teknologi'],food:['Food & agriculture','Pangan & pertanian'],ai:['AI & digital','AI & digital'],projects:['Project register','Registri proyek']};
const labelType=a=>typeLabels[a.type]?.[id()?1:0]||a.type;
function applyLanguage(){
 for(const e of document.querySelectorAll('[data-id][data-en]'))e.textContent=e.dataset[id()?'id':'en'];
 for(const [selector,opts] of [['sliEntityType',[['all','All entities','Semua entitas'],['person','People','Tokoh'],['institution','Institutions','Lembaga'],['company','Companies','Perusahaan'],['project','Projects','Proyek']]],['sliEntitySector',[['all','All sectors','Semua sektor'],['ai','AI & digital','AI & digital'],['minerals','Minerals','Mineral'],['projects','Project register','Registri proyek'],['corporate','Corporate groups','Grup perusahaan'],['energy','Energy','Energi'],['coal','Coal','Batu bara'],['technology','AI & technology','AI & teknologi'],['food','Food & agriculture','Pangan & pertanian'],['finance','Banking & finance','Perbankan & keuangan'],['infrastructure','Infrastructure & construction','Infrastruktur & konstruksi'],['transport','Transport & logistics','Transportasi & logistik'],['property','Property & estates','Properti & kawasan industri'],['healthcare','Health & pharma','Kesehatan & farmasi'],['manufacturing','Manufacturing','Manufaktur'],['retail','Retail & trade','Ritel & perdagangan'],['other','Unclassified','Lainnya']]]]){
  const select=$(selector);if(!select)continue;for(const [k,en,bahasa] of opts){const opt=[...select.options].find(x=>x.value===k);if(opt)opt.textContent=T(en,bahasa)}
 }
}
function sectorTags(a,host){const tags=el('div','sli-entity-linked-sectors');
 for(const s of a.sectors){const names=sectorLabels[s];if(names)tags.append(el('span','',names[id()?1:0]))}
 host.append(tags);
}
function summaryLine(a){if(a.type==='project')return a.original?.sector||labelType(a);
 return a.role&&a.role.length>85?a.role.slice(0,82)+'…':a.role||labelType(a)}
function drawList(){
 const target=$('sliEntityCards');target.replaceChildren();
 for(const a of visible.slice(0,displayLimit)){
  const b=el('button','sli-entity-card');b.type='button';b.dataset.key=a.key;b.setAttribute('aria-pressed',String(a.key===selected));b.setAttribute('aria-label',T('View details for ','Lihat profil ')+a.title);
  b.append(I().brand(a.type==='person'?'':a.title,a.type==='person'?'person':a.type==='institution'?'government':a.type==='project'?'project':'building'));
  const body=el('span','sli-entity-card-body');body.append(el('strong','',a.title),el('small','',labelType(a)+' · '+summaryLine(a)));
  b.append(body);b.addEventListener('click',()=>{selected=a.key;history.replaceState(null,'','#'+encodeURIComponent(a.key));drawList();drawDetail()});target.append(b);
 }
 if(!visible.length)target.append(el('p','',T('No matching records. Try a different name or sector.','Tidak ada entitas yang cocok. Ubah nama atau sektor.')));
 $('sliEntityCount').textContent=T('Entries: ','Entitas: ')+visible.length+(visible.length>displayLimit?' · '+T('showing first ','menampilkan ') +displayLimit:'');
 const more=$('sliEntityMore');if(more){more.hidden=visible.length<=displayLimit;more.textContent=T('Show next 100 entities','Tampilkan 100 entitas berikutnya');}
 $('sliEntityStatus').textContent=T('Dated public register: ','Registri publik bertanggal: ')+registryDate+' · '+T('Filter does not verify current incumbency.','Filter tidak memverifikasi pejabat aktif.');
}
function addDl(dl,key,val){if(val===null||val===undefined||val==='')return;dl.append(el('dt','',key),el('dd','',val))}
function linkTo(host,url,caption){if(!safe(url))return;const a=el('a','',caption+' ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';host.append(a)}
function drawDetail(){
 const a=catalog.get(selected),host=$('sliEntityDetail');host.replaceChildren();
 if(!a){host.append(el('p','',T('Select an entry to inspect evidence.','Pilih entitas untuk melihat sumber.')));return}
 const h=el('div','sli-entity-dossier-title');h.append(I().brand(a.type==='person'?'':a.title,a.type==='person'?'person':a.type==='institution'?'government':a.type==='project'?'project':'building'));
 h.append(el('h2','',a.title));host.append(h,el('span','sli-entity-status-tag',labelType(a)));sectorTags(a,host);
 if(a.type==='person'){const p=el('p','',T('Public profile: ','Profil publik: '));p.append(I().personLink(a.title,a.source));host.append(p)}
 if(a.summary)host.append(el('p','',a.summary));
 const dl=el('dl');
 if(a.type==='project'){
  const p=a.original;
  addDl(dl,T('Sector','Sektor'),p.sector);addDl(dl,T('Location','Lokasi'),p.region);
  addDl(dl,T('Stage','Tahap'),p.stage);addDl(dl,T('Investor (reported)','Investor (dilaporkan)'),p.investor);
  if(p.reported_amount!==null&&p.reported_amount!==undefined){
   addDl(dl,T('Announced amount','Nilai diumumkan'),String(p.reported_amount)+' '+(p.currency||''));
   addDl(dl,T('Basis','Dasar angka'),p.amount_basis)}
  addDl(dl,T('Evidence date','Tanggal bukti'),p.evidence_date);addDl(dl,T('Evidence status','Status bukti'),p.verification_class);
  addDl(dl,T('Realized spending','Pengeluaran terealisasi'),p.actual_capex==null?T('Not verified in register','Belum terverifikasi di registri'):String(p.actual_capex));
 }else{
  addDl(dl,T('Registry snapshot','Cuplikan registri'),registryDate);
  if(a.type==='person')addDl(dl,T('Listed role','Jabatan tercatat'),a.role);
  if(a.person&&a.type!=='person'){const key=el('dt','',T('Named leader','Pimpinan tercatat'));const dd=el('dd');dd.append(I().personLink(a.person,a.source));dl.append(key,dd)}
  addDl(dl,T('Evidence class','Jenis bukti'),a.original?.verification||T('Source-linked register','Registri dengan sumber'));
  if(a.records.length>1)addDl(dl,T('Matched register rows','Baris registri terkait'),String(a.records.length));
  if(a.records.some(r=>r.relationship==='reported_direct_shareholder'||r.relationship==='reported_direct_equity'||r.relationship==='reported_project_participant_not_equity_shareholder'))
   addDl(dl,T('Relationships','Hubungan'),T('Dated direct holdings or reported project involvement; see the evidence network above for exact source and basis.',
   'Kepemilikan langsung atau partisipasi proyek terlapor; lihat jaringan bukti di atas untuk sumber dan dasar hubungan.'));
 }
 if(a.type==='company'&&a.issuerRecord){
  const n=a.issuerRecord;
  addDl(dl,T('IDX universe classification','Klasifikasi katalog BEI'),n.verification==='official_exchange_snapshot'?
   T('Official issuer-directory snapshot, subject to subsequent changes','Snapshot direktori resmi BEI, dapat berubah'):
   T('Initial curated ticker; official current listing unverified','Kode hasil kurasi awal; status pencatatan terkini belum terkonfirmasi'));
  addDl(dl,T('Ticker / exchange','Kode saham / bursa'),'IDX:'+n.ticker);
  addDl(dl,T('Sector tag','Tag sektor'),n.sector);
  const profile=equityProfiles.get(n.ticker);
  if(profile){
   addDl(dl,T('Direct shareholding reference','Tanggal kepemilikan langsung'),profile.reference_date);
   for(const sh of (profile.shareholders||[]).filter(x=>x.holder_kind!=='aggregate_not_entity').slice(0,8)){
    addDl(dl,T('Shareholder · not necessarily beneficial owner','Pemegang saham · belum tentu pemilik manfaat'),sh.name+' · '+(sh.reported_pct??'N/A')+'%');
   }
   for(const source of profile.source_urls||[])linkTo(host,source,T('Shareholder evidence','Bukti pemegang saham'));
  }
  addDl(dl,T('Ultimate beneficial owner','Pemilik manfaat akhir'),T('Not independently verified','Belum terverifikasi'));
  const asset=assetProfiles.get(n.ticker);
  if(asset){
   for(const c of asset.cross_border_links||[])addDl(dl,T('Corporate country link','Keterkaitan negara korporasi'),c.actor+' · '+c.country+' · '+T('not individual nationality','bukan kewarganegaraan individu'));
   for(const right of asset.rights||[]){
    const amount=right.participating_interest_pct!=null?' · '+right.participating_interest_pct+'% '+T('PSC participation','partisipasi PSC'):right.area_ha!=null?' · '+right.area_ha+' ha':'';
    addDl(dl,T('Source-dated concession/permit','Konsesi/izin bertanggal'),right.name+' · '+right.region+amount+' · '+right.source_period);
    linkTo(host,right.source_url,T('Asset and concession source','Sumber konsesi dan aset'));
   }
  }
  const dossier=el('a','',T('Full ownership & concession dossier','Dossier lengkap kepemilikan & konsesi')+' ↗');
  dossier.href='./sli-issuer.html?ticker='+encodeURIComponent(n.ticker);host.append(dossier);
 }
 if(a.type==='company'&&a.corporate){
  const c=a.corporate,listed=c.listing_status==='listed'&&c.ticker,fmt=v=>typeof v==='number'&&Number.isFinite(v)?new Intl.NumberFormat(id()?'id-ID':'en-US',{maximumFractionDigits:2}).format(v):null;
  addDl(dl,T('Company segment','Segmen perusahaan'),c.sector||'');
  addDl(dl,T('Business type','Kategori korporasi'),c.ownership_class||'');
  addDl(dl,T('Listing / ticker','Pencatatan / kode saham'),listed?c.exchange+': '+c.ticker:T('Not separately listed','Tidak tercatat tersendiri'));
  addDl(dl,T('Reported market capitalization','Kapitalisasi pasar terlapor'),listed?(fmt(c.market_cap)&&c.market_cap_as_of&&c.market_cap_source_url?fmt(c.market_cap)+' '+c.market_cap_currency+' · '+c.market_cap_as_of:'N/A · '+T('dated closing quote and shares outstanding not ingested','perlu harga penutupan dan saham beredar dengan tanggal sama')):T('Not applicable to unlisted company','Tidak berlaku untuk perusahaan non-Tbk'));
  for(const [label,v] of [[T('Revenue','Pendapatan'),c.revenue],[T('Profit for year (all interests)','Laba tahun berjalan (total)'),c.net_income],[T('Total assets','Total aset'),c.total_assets]]){
   addDl(dl,label,fmt(v)&&c.financial_source_url&&c.financial_period?fmt(v)+' '+(c.financial_currency||'')+' · '+c.financial_period:'N/A · '+T('dated issuer report unavailable','laporan emiten bertanggal belum tersedia'));
  }
  if(c.financial_basis)addDl(dl,T('Accounting basis','Basis akuntansi'),c.financial_basis);
  if(listed&&c.exchange==='IDX'){
   const d=el('div','sli-entity-finance-links');
   linkTo(d,'https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/'+encodeURIComponent(c.ticker),T('IDX company profile','Profil emiten BEI'));
   linkTo(d,'https://www.idx.co.id/id/perusahaan-tercatat/laporan-keuangan-dan-tahunan/',T('IDX issuer reports','Laporan emiten BEI'));
   linkTo(d,'https://www.idx.co.id/id/perusahaan-tercatat/data-kepemilikan-saham/',T('IDX shareholder disclosures','Keterbukaan pemegang saham BEI'));
   host.append(d);
  }
 }
 host.append(dl,el('h3','',T('Primary references and provenance','Referensi dan keterlacakan')));
 linkTo(host,a.source,T('Open original source','Buka sumber asli'));
 if(a.type==='person'){const person=I().safeProfile(a.title,a.source);if(person.kind==='wikipedia')linkTo(host,person.url,'Wikipedia · '+T('biographical context only','hanya konteks biografi'))}
 host.append(el('p','',T('The source link supports the listed record; it does not certify the person is currently in office or that an announced project is completed.','Tautan sumber mendukung catatan yang ditampilkan, bukan jaminan seseorang masih menjabat atau proyek telah selesai.')));
}
function filter(){
 displayLimit=100;
 const q=I().nameKey($('sliEntitySearch').value).split('-').filter(Boolean),type=$('sliEntityType').value,sector=$('sliEntitySector').value;
 visible=all.filter(a=>(type==='all'||a.type===type)&&(sector==='all'||a.sectors.includes(sector))&&q.every(term=>I().nameKey([a.title,a.role,a.summary,a.person,a.original?.region,a.original?.investor,a.corporate?.ticker,a.corporate?.exchange,a.issuerRecord?.ticker].join(' ')).split('-').some(t=>t.includes(term))));
 if(!visible.some(a=>a.key===selected))selected=visible[0]?.key||'';
 drawList();drawDetail();
}
function csvCell(v){let s=String(v??'');if(/^[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
function exportCSV(){
 if(!visible.length)return;
 const headers=['name','type','sectors','registry_date_or_evidence_date','source_url','role_or_sector','evidence_status','exchange','ticker','listing_status','market_cap','market_cap_as_of','revenue','net_income','total_assets','financial_period','financial_source_url'];
 const rows=visible.map(a=>[a.title,a.type,a.sectors.join('; '),a.date,a.source||'',a.role,a.original?.verification_class||a.original?.verification||'',a.corporate?.exchange,a.corporate?.ticker,a.corporate?.listing_status,a.corporate?.market_cap,a.corporate?.market_cap_as_of,a.corporate?.revenue,a.corporate?.net_income,a.corporate?.total_assets,a.corporate?.financial_period,a.corporate?.financial_source_url]);
 const csv='\uFEFF'+[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
 const obj=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
 const l=document.createElement('a');l.href=obj;l.download='sli-entity-evidence-index.csv';document.body.append(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(obj),500);
}
async function load(){
 try{
  const results=await Promise.all(['./data/sector-command-hierarchy.json','./data/sli-project-registry.json','./data/sli-corporate-group-registry.json'].map(async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(url+' HTTP '+r.status);return r.json()}));
  if(!results[0]?.sectors||!Array.isArray(results[1]?.records)||!Array.isArray(results[2]?.records))throw new Error('Entity schemas invalid');
  fromHierarchy(results[0]);fromProjects(results[1]);fromCorporateGroups(results[2]);
  try{const response=await fetch('./data/sli-idx-issuer-universe.json',{cache:'no-store'});if(!response.ok)throw Error('IDX catalogue HTTP '+response.status);
   fromIssuerUniverse(await response.json());}catch(error){console.warn('[SLI IDX catalogue]',error)}
  try{const response=await fetch('./data/sli-corporate-evidence-relationships.json',{cache:'no-store'});if(!response.ok)throw Error('Relationship evidence HTTP '+response.status);
   const evidence=await response.json();fromCorporateEvidence(evidence);
   const tickerById={medc:'MEDC',vale:'INCO',antam:'ANTM',ptba:'PTBA',telkom:'TLKM',byan:'BYAN',aadi:'AADI',astra:'ASII'};
   equityProfiles=new Map((evidence.ownership_profiles||[]).filter(p=>tickerById[p.id]).map(p=>[tickerById[p.id],p]));
  }catch(error){console.warn('[SLI corporate relationship evidence]',error)}
  try{const response=await fetch('./data/sli-issuer-actor-assets.json',{cache:'no-store'});if(!response.ok)throw Error('Actor assets HTTP '+response.status);
   const assetData=await response.json();
   if(assetData.schema==='sli-issuer-actor-assets-v1')assetProfiles=new Map((assetData.records||[]).map(n=>[n.ticker,n]));
  }catch(error){console.warn('[SLI issuer actor evidence]',error)}
  const coverage=$('sliEntityCoverage');if(coverage&&issuerCoverage)coverage.textContent=
   T('Issuer catalogue: ','Katalog emiten: ')+issuerCoverage.count+' · '+(issuerCoverage.status==='official_exchange_bulk_snapshot'?
    T('Official IDX profile snapshot · ','Snapshot profil resmi BEI · '):T('Initial candidate list; full IDX reconciliation pending · ','Daftar kandidat awal; rekonsiliasi penuh BEI belum selesai · '))+issuerCoverage.as_of+
   ' · '+T('Group-tree and verified reports remain separate.','Pohon grup dan laporan terverifikasi tetap dipisahkan.');
  all=[...catalog.values()].sort((a,b)=>a.title.localeCompare(b.title,'id'));
  const hash=decodeURIComponent(location.hash.slice(1)),requestedTicker=new URLSearchParams(location.search).get('ticker')||'';
  const target=[...catalog.values()].find(a=>a.type==='company'&&((a.corporate?.exchange==='IDX'&&a.corporate?.ticker===requestedTicker)||a.issuerRecord?.ticker===requestedTicker));
  selected=catalog.has(hash)?hash:(target?.key||'');
  if(target){$('sliEntityType').value='company';$('sliEntitySector').value='all';$('sliEntitySearch').value=requestedTicker;}
  applyLanguage();filter();
 }catch(e){console.warn('[SLI entities]',e);$('sliEntityStatus').textContent=T('Source registers unavailable. Try again later; no records have been invented.','Registri sumber tidak dapat dibaca. Tidak ada data pengganti yang dibuat-buat.')}
}
document.addEventListener('DOMContentLoaded',()=>{
 for(const x of ['sliEntitySearch','sliEntityType','sliEntitySector'])$(x).addEventListener(x==='sliEntitySearch'?'input':'change',filter);
 $('sliEntityExport').addEventListener('click',exportCSV);
 $('sliEntityMore')?.addEventListener('click',()=>{displayLimit+=100;drawList();});
 document.addEventListener('sli:languagechange',()=>{applyLanguage();filter()});
 load();
});
})();