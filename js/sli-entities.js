/* Source-linked entity explorer. No guessed identities, private uploads or live-status claims.
 * Uses the SAME public sector hierarchy and project registry as the analytical dashboards. */
(()=>{'use strict';
const $=id=>document.getElementById(id),I=()=>window.SLIEntityIdentity;
const id=()=>window.SLIi18n?.language==='id'||document.documentElement.lang==='id';
const T=(en,bahasa)=>id()?bahasa:en;
const el=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e};
const safe=url=>I().isHttps(url);
const catalog=new Map();let all=[],visible=[],selected='',registryDate='';
function upsert(record){
 const prev=catalog.get(record.key);
 if(prev){prev.sectors=[...new Set([...prev.sectors,...record.sectors])];prev.records.push(...record.records);
  if(!prev.source&&record.source)prev.source=record.source;
  if(!prev.person&&record.person)prev.person=record.person;
  if(!prev.role&&record.role)prev.role=record.role;
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
 for(const n of db.records||[]){
  if(!n?.id||!n.name||!safe(n.source_url))continue;
  const rec={sector:'corporate',actorId:n.id,parentId:n.parent_id,relation:n.relationship,verification:'source-dated',source:n.source_url};
  const key='company:'+I().nameKey(n.name);
  upsert({key,type:'company',title:n.name,person:n.directors?.find(d=>d.title_id==='Direktur Utama')?.name||'',source:n.source_url,role:n.business_id,date:n.source_date,sectors:['corporate'],records:[rec],summary:n.business_id,original:n});
  for(const d of n.directors||[]){
   if(!d?.name||!safe(d.source_url))continue;
   upsert({key:'person:'+I().nameKey(d.name),type:'person',title:d.name,person:d.name,source:d.source_url,role:d.title_id+' · '+n.name,date:d.source_date,sectors:['corporate'],records:[rec],summary:T('Source-dated director of ','Direksi yang tercatat di ')+n.name,original:n});
  }
 }
}
const typeLabels={person:['Person','Tokoh'],institution:['Institution','Lembaga'],company:['Company','Perusahaan'],project:['Project','Proyek']};
const sectorLabels={corporate:['SOE Corporate Groups','Grup BUMN'],minerals:['Critical minerals','Mineral kritis'],ai:['AI & digital','AI & digital'],projects:['Project register','Registri proyek']};
const labelType=a=>typeLabels[a.type]?.[id()?1:0]||a.type;
function applyLanguage(){
 for(const e of document.querySelectorAll('[data-id][data-en]'))e.textContent=e.dataset[id()?'id':'en'];
 for(const [selector,opts] of [['sliEntityType',[['all','All entities','Semua entitas'],['person','People','Tokoh'],['institution','Institutions','Lembaga'],['company','Companies','Perusahaan'],['project','Projects','Proyek']]],['sliEntitySector',[['all','All sectors','Semua sektor'],['ai','AI & digital','AI & digital'],['minerals','Minerals','Mineral'],['projects','Project register','Registri proyek'],['corporate','Corporate groups','Grup BUMN']]]]){
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
 for(const a of visible.slice(0,160)){
  const b=el('button','sli-entity-card');b.type='button';b.dataset.key=a.key;b.setAttribute('aria-pressed',String(a.key===selected));b.setAttribute('aria-label',T('View details for ','Lihat profil ')+a.title);
  b.append(I().brand(a.type==='person'?'':a.title,a.type==='person'?'person':a.type==='institution'?'government':a.type==='project'?'project':'building'));
  const body=el('span','sli-entity-card-body');body.append(el('strong','',a.title),el('small','',labelType(a)+' · '+summaryLine(a)));
  b.append(body);b.addEventListener('click',()=>{selected=a.key;history.replaceState(null,'','#'+encodeURIComponent(a.key));drawList();drawDetail()});target.append(b);
 }
 if(!visible.length)target.append(el('p','',T('No matching records. Try a different name or sector.','Tidak ada entitas yang cocok. Ubah nama atau sektor.')));
 $('sliEntityCount').textContent=T('Entries: ','Entitas: ')+visible.length+(visible.length>160?' · '+T('first 160 shown','160 pertama ditampilkan'):'');
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
 }
 host.append(dl,el('h3','',T('Primary references and provenance','Referensi dan keterlacakan')));
 linkTo(host,a.source,T('Open original source','Buka sumber asli'));
 if(a.type==='person'){const person=I().safeProfile(a.title,a.source);if(person.kind==='wikipedia')linkTo(host,person.url,'Wikipedia · '+T('biographical context only','hanya konteks biografi'))}
 host.append(el('p','',T('The source link supports the listed record; it does not certify the person is currently in office or that an announced project is completed.','Tautan sumber mendukung catatan yang ditampilkan, bukan jaminan seseorang masih menjabat atau proyek telah selesai.')));
}
function filter(){
 const q=I().nameKey($('sliEntitySearch').value).split('-').filter(Boolean),type=$('sliEntityType').value,sector=$('sliEntitySector').value;
 visible=all.filter(a=>(type==='all'||a.type===type)&&(sector==='all'||a.sectors.includes(sector))&&q.every(term=>I().nameKey([a.title,a.role,a.summary,a.person,a.original?.region,a.original?.investor].join(' ')).split('-').some(t=>t.includes(term))));
 if(!visible.some(a=>a.key===selected))selected=visible[0]?.key||'';
 drawList();drawDetail();
}
function csvCell(v){let s=String(v??'');if(/^[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
function exportCSV(){
 if(!visible.length)return;
 const headers=['name','type','sectors','registry_date_or_evidence_date','source_url','role_or_sector','evidence_status'];
 const rows=visible.map(a=>[a.title,a.type,a.sectors.join('; '),a.date,a.source||'',a.role,a.original?.verification_class||a.original?.verification||'']);
 const csv='\uFEFF'+[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
 const obj=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
 const l=document.createElement('a');l.href=obj;l.download='sli-entity-evidence-index.csv';document.body.append(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(obj),500);
}
async function load(){
 try{
  const results=await Promise.all(['./data/sector-command-hierarchy.json','./data/sli-project-registry.json','./data/sli-corporate-group-registry.json'].map(async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(url+' HTTP '+r.status);return r.json()}));
  if(!results[0]?.sectors||!Array.isArray(results[1]?.records)||!Array.isArray(results[2]?.records))throw new Error('Entity schemas invalid');
  fromHierarchy(results[0]);fromProjects(results[1]);fromCorporateGroups(results[2]);
  all=[...catalog.values()].sort((a,b)=>a.title.localeCompare(b.title,'id'));
  const hash=decodeURIComponent(location.hash.slice(1));selected=catalog.has(hash)?hash:'';
  applyLanguage();filter();
 }catch(e){console.warn('[SLI entities]',e);$('sliEntityStatus').textContent=T('Source registers unavailable. Try again later; no records have been invented.','Registri sumber tidak dapat dibaca. Tidak ada data pengganti yang dibuat-buat.')}
}
document.addEventListener('DOMContentLoaded',()=>{
 for(const x of ['sliEntitySearch','sliEntityType','sliEntitySector'])$(x).addEventListener(x==='sliEntitySearch'?'input':'change',filter);
 $('sliEntityExport').addEventListener('click',exportCSV);
 document.addEventListener('sli:languagechange',()=>{applyLanguage();filter()});
 load();
});
})();