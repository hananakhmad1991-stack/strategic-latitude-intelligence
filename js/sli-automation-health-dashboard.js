/* SLI Whole Dashboard Automation Control Center, native HTML/JS only. */
(function(){
'use strict';
const SRC='./data/sli-automation-health.json';
const RAW='https://raw.githubusercontent.com/hananakhmad1991-stack/strategic-latitude-intelligence/main/data/sli-automation-health.json';
const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const datestr=x=>{if(!x)return 'Belum tercatat';let d=new Date(x);return Number.isNaN(d.getTime())?'Format tidak diketahui':d.toLocaleString('id-ID',{timeZone:'Asia/Jakarta',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})+' WIB'};
const statuses={recent_check:'Baru diperiksa',overdue:'Pemeriksaan terlambat',workflow_failure:'Workflow gagal',freshness_unknown:'Tanggal pemeriksaan belum ada',schedule_unknown:'Jadwal tak diketahui',source_date_only:'Hanya tanggal snapshot',curated_not_automated:'Kurasi manual',source_edition_static:'Referensi historis',invalid_dataset:'Data tidak valid'};
const modes={automated_numeric:'Data numerik otomatis',automated_discovery:'Monitoring / kandidat review',computed_from_sources:'Analisis turunan',curated_snapshot:'Snapshot terkurasi',static_reference:'Dokumen / historis',status_unknown:'Tidak diketahui'};
const badge=(v,kind)=>'<span class="sli-ah-tag '+(kind||'')+'">'+escapeHTML(v)+'</span>';
let publicationWatch=null;
let current=null;
let filters={category:'all',mode:'all',status:'all',text:''};
function shell(){
return '<style>'+
'.sli-ah{margin:18px 0 27px;color:inherit}.sli-ah .sli-ah-title{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px}.sli-ah a{color:#d7b678}.sli-ah h2{margin:5px 0 9px;font-size:22px}.sli-ah small,.sli-ah p{color:#b8ccd8}.sli-ah .sli-ah-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:12px 0}.sli-ah .sli-ah-card{background:#12283c;border:1px solid #365269;border-radius:9px;padding:13px}.sli-ah .sli-ah-card strong{display:block;color:#d7b678;font-size:25px}.sli-ah .sli-ah-card small{display:block;font-size:11px}.sli-ah .sli-ah-note{padding:11px 14px;border-left:3px solid #d7b678;background:#0d283d;font-size:12px;margin:12px 0}.sli-ah .sli-ah-alert{border-left-color:#dca98d}.sli-ah .sli-ah-tag{display:inline-block;border:1px solid #5e7c8d;border-radius:14px;padding:2px 7px;color:#bdcdd7;font-size:11px;margin:2px}.sli-ah .sli-ah-tag.warning{color:#ffbd97;border-color:#b68774}.sli-ah .sli-ah-tag.good{color:#8edac1;border-color:#5c9a84}.sli-ah button,.sli-ah input,.sli-ah select{font:inherit;background:#10283c;border:1px solid #648397;color:#eff5f8;border-radius:8px;padding:8px 10px;max-width:100%}.sli-ah button{cursor:pointer}.sli-ah label{display:flex;flex-direction:column;gap:4px;color:#c4d1dd;font-size:11px}.sli-ah .sli-ah-controls{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;margin:12px 0}.sli-ah .sli-ah-scroll{overflow:auto;max-height:760px;border:1px solid #3a5266;border-radius:8px}.sli-ah table{border-collapse:collapse;width:100%;min-width:930px;font-size:12px}.sli-ah th,.sli-ah td{text-align:left;border-bottom:1px solid #2f4a5d;padding:9px;vertical-align:top}.sli-ah th{position:sticky;top:0;background:#18364a;color:#d7b678;z-index:1}.sli-ah .sli-ah-empty{padding:20px;color:#bcd0dd}.sli-ah .sli-ah-actions{display:flex;gap:8px;flex-wrap:wrap}.sli-ah .sli-ah-link{display:inline-block;padding:7px 11px;text-decoration:none;border:1px solid #607c90;border-radius:7px;font-size:12px}.sli-ah .sli-ah-modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}.sli-ah .sli-ah-modes>div{padding:11px;background:#152e43;border-radius:8px;border:1px solid #354e62}.sli-ah .sli-ah-modes strong{color:#f0dcaf}.sli-ah .sli-ah-meta{display:flex;gap:8px;flex-wrap:wrap;margin:9px 0}.sli-ah .sli-ah-mini{font-size:11px;color:#bacad6}.sli-ah .sli-ah-hidden{display:none}@media(max-width:1100px){.sli-ah .sli-ah-metrics{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.sli-ah .sli-ah-metrics,.sli-ah .sli-ah-modes{grid-template-columns:1fr}.sli-ah label{width:100%}}'+
'</style>';
}
function actionLinks(){return '<div class="sli-ah-actions"><a class="sli-ah-link" href="./sli-data-automation-center.html">Open all datasets and workflows ↗</a><a class="sli-ah-link" href="https://github.com/hananakhmad1991-stack/strategic-latitude-intelligence/actions" target="_blank" rel="noopener noreferrer">GitHub Actions ↗</a><a class="sli-ah-link" href="./data/sli-automation-policy.json">Update policy & definitions ↗</a></div>'}
function totals(data){let s=data.summary||{};return '<div class="sli-ah-metrics">'+[
['All datasets',s.datasets],['Auto numeric feeds',s.auto_numeric_datasets],
['Source/discovery feeds',s.auto_discovery_datasets],['Curated & historical',s.curated_or_archival_datasets],
['Scheduled workflows',s.scheduled_workflows],['Datasets needing attention',s.overdue_or_broken_datasets],
['Latest workflow failures',s.workflow_failures_latest],['Workflow API warnings',s.workflow_status_api_errors]
].map(([name,value])=>'<div class="sli-ah-card"><small>'+escapeHTML(name)+'</small><strong>'+escapeHTML(value??'—')+'</strong></div>').join('')+'</div>'}
function banner(data){
 if(data.audit_state==='awaiting_first_run')return '<div class="sli-ah-note sli-ah-alert">Audit belum pernah selesai. Angka tidak boleh diartikan sebagai seluruh sumber sehat. Jalankan workflow pertama atau tunggu penjadwalan.</div>';
 let age=Date.now()-new Date(data.generated_at_utc).getTime(),stale=!Number.isFinite(age)||age>24*3600000;
 let issues=(data.summary?.overdue_or_broken_datasets||0)+(data.summary?.workflow_failures_latest||0);
 return '<div class="sli-ah-note '+(stale||issues?'sli-ah-alert':'')+'"><b>'+(
   stale?'Audit lebih dari 24 jam—jangan anggap status masih mutakhir':
   issues?'Perhatian: terdapat workflow/data tertunda atau gagal':
   'Audit pembaruan dan klasifikasi dataset tersedia'
 )+'</b>. Diperiksa: '+escapeHTML(datestr(data.generated_at_utc))+
 '. <b>Tidak semua konten dapat diperbarui otomatis:</b> angka terstruktur dapat disinkronkan; perubahan peraturan, pejabat, proyek, data PDF dan penilaian dampak tetap memerlukan konfirmasi resmi. Pembaruan berita adalah kandidat pemeriksaan, bukan perubahan fakta.</div>';
}
function publicationStatus(){if(!publicationWatch)return '<div class="sli-ah-note">Publication edition watcher has not returned a readable source snapshot. This is not evidence that publishers have no newer reports.</div>';
const p=publicationWatch,lead=(p.events||[]).filter(x=>x.event_kind==='new_candidate').slice(0,5),failed=(p.sources||[]).filter(x=>x.health!=='ok');
return '<div class="sli-ah-card"><strong style="font-size:15px">Official report and macro publication watcher</strong><p class="sli-ah-mini">Publisher sources readable: '+escapeHTML(p.healthy_source_count)+' / '+escapeHTML(p.source_count)+' · unavailable or unparseable: '+escapeHTML(p.scan_errors)+' · last audit '+escapeHTML(datestr(p.checked_at_utc))+'. New links are review candidates, not automatically verified statistics.</p>'+
(lead.length?lead.map(x=>'<p class="sli-ah-mini">'+badge('NEW REPORT LEAD','warning')+' <a href="'+escapeHTML(x.url)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(x.title)+'</a> · '+escapeHTML(x.publisher)+'</p>').join(''):'<p class="sli-ah-mini">No new link detected beyond stored publication baseline; unparseable sources are explicitly reported, not treated as unchanged.</p>')+
(failed.length?'<p class="sli-ah-mini">Publisher gaps: '+failed.slice(0,8).map(x=>escapeHTML(x.publisher)+' ('+escapeHTML(x.health)+')').join(', ')+'</p>':'')+
'<p class="sli-ah-mini"><a href="./data/sli-publication-watch.json">See publication source and candidate audit ↗</a></p></div>'}
function shortView(data){
 let problem=(data.attention||[]).slice(0,5);
 return shell()+'<section class="sli-ah"><div class="sli-ah-title"><div><div style="color:#d7b678;font-size:11px;letter-spacing:1.5px">SOURCE TRANSPARENCY · AUTOMATION CONTROL</div><h2>Data Freshness & Auto-Update Status</h2></div></div>'+banner(data)+totals(data)+
 '<div class="sli-ah-modes"><div><strong>Automatic numeric data</strong><p class="sli-ah-mini">World Bank WDI and supported market/statistical machine-readable series; always retain observation date and source.</p></div><div><strong>Monitoring & verification queue</strong><p class="sli-ah-mini">Law changes, sector actors, AI project milestones and news are leads, not auto-certified facts.</p></div><div><strong>Published historical data</strong><p class="sli-ah-mini">RUPTL, PLN annual tables, HEESI and BPS reports remain tied to their source edition until new PDF/data is verified.</p></div></div>'+
 publicationStatus()+
 (problem.length?'<div class="sli-ah-card"><strong style="font-size:14px">Recent operational attention</strong>'+problem.map(x=>'<p class="sli-ah-mini">'+badge(x.status,'warning')+' '+escapeHTML(x.id)+'</p>').join('')+'</div>':'')+
 '<p class="sli-ah-mini">Latest structured data reads GitHub main with a safe Pages fallback. If raw data cannot be read, the page can be older than the repository. Auto-run success is not proof of publisher completeness or legal validity.</p>'+actionLinks()+'</section>';
}
function fullView(data){
 const items=data.datasets||[];
 const categories=[...new Set(items.map(x=>x.group))].sort();
 const options=(list,value)=>list.map(([v,l])=>'<option value="'+escapeHTML(v)+'"'+(v===value?' selected':'')+'>'+escapeHTML(l)+'</option>').join('');
 let table=items.filter(x=>(filters.category==='all'||x.group===filters.category)&&
 (filters.mode==='all'||x.mode===filters.mode)&&(filters.status==='all'||x.status===filters.status)&&
 (x.id+' '+x.group+' '+x.note+' '+x.status).toLowerCase().includes(filters.text.toLowerCase()));
 const ordered=table.sort((a,b)=>{const weigh=x=>x.status==='workflow_failure'?0:x.status==='overdue'?1:x.status==='invalid_dataset'?2:x.mode==='curated_snapshot'?3:4;return weigh(a)-weigh(b)||a.id.localeCompare(b.id)});
 return shell()+'<div class="sli-ah"><h2>Every SLI source dataset · live audit</h2>'+banner(data)+totals(data)+
 '<div class="sli-ah-controls"><label>Search file/sector <input id="sli-ah-search" placeholder="PLN, regulation, AI, project…" value="'+escapeHTML(filters.text)+'"></label><label>Sector <select id="sli-ah-category">'+options([['all','All sectors'],...categories.map(x=>[x,x])],filters.category)+'</select></label><label>Refresh type <select id="sli-ah-mode">'+options([['all','All update modes'],...Object.entries(modes)],filters.mode)+'</select></label><label>Source status <select id="sli-ah-status">'+options([['all','All statuses'],...Object.entries(statuses)],filters.status)+'</select></label><button id="sli-ah-csv">Export audit CSV</button><button id="sli-ah-retry">Reload latest</button></div>'+
 '<div class="sli-ah-meta">'+badge(ordered.length+' / '+items.length+' datasets')+badge(data.workflows?.length+' workflows')+badge('Snapshot '+datestr(data.generated_at_utc))+'</div>'+
 '<div class="sli-ah-scroll"><table><thead><tr><th>Dataset / domain</th><th>Update class</th><th>Health classification</th><th>Record/source date</th><th>Scheduled pipeline</th><th>Limits and next evidence step</th></tr></thead><tbody>'+ordered.map(x=>{
    let runs=(x.scheduled_writers||[]).map(w=>'<a target="_blank" rel="noopener noreferrer" href="https://github.com/hananakhmad1991-stack/strategic-latitude-intelligence/actions/workflows/'+encodeURIComponent(w)+'">'+escapeHTML(w)+'</a>').join('<br>');
    const tagKind=x.status==='recent_check'?'good':(['overdue','workflow_failure','invalid_dataset'].includes(x.status)?'warning':'');
    return '<tr><td><a href="./'+escapeHTML(x.id)+'">'+escapeHTML(x.id.split('/').at(-1))+'</a><br><small>'+escapeHTML(x.group)+'</small></td><td>'+badge(modes[x.mode]||x.mode)+'</td><td>'+badge(statuses[x.status]||x.status,tagKind)+'</td><td>'+escapeHTML(datestr(x.last_record_utc))+'<br><small>'+escapeHTML(x.last_record_key||'No audit timestamp')+'</small></td><td>'+ (runs||'<small>Not automatically written</small>')+(x.cadence_hours?'<br><small>Scheduled every ≈ '+escapeHTML(x.cadence_hours)+' h</small>':'')+'</td><td>'+escapeHTML(x.note||'')+'</td></tr>'
 }).join('')+'</tbody></table></div>'+
 publicationStatus()+
 '<h2>Scheduled monitors, QA, failed runs</h2><div class="sli-ah-scroll"><table><thead><tr><th>GitHub workflow</th><th>Schedule</th><th>Last run status</th><th>Last activity</th><th>Output JSON</th></tr></thead><tbody>'+
 (data.workflows||[]).map(x=>{let r=x.last_run||{};return '<tr><td><a target="_blank" rel="noopener noreferrer" href="https://github.com/hananakhmad1991-stack/strategic-latitude-intelligence/actions/workflows/'+encodeURIComponent(x.id)+'">'+escapeHTML(x.name||x.id)+'</a></td><td>'+escapeHTML(x.scheduled?x.cron.join(' / '):'QA / manual only')+'</td><td>'+badge(r.conclusion||r.status||'No available run',r.conclusion==='failure'?'warning':r.conclusion==='success'?'good':'')+'</td><td>'+escapeHTML(datestr(r.updated_at))+'</td><td>'+escapeHTML((x.datasets_written||[]).join(', ')||'Validation / report only')+'</td></tr>'}).join('')+'</tbody></table></div>'+
 '<div class="sli-ah-note"><strong>Evidence standards:</strong> verified statistics can refresh when stable provider data is available; source changes, maps, pdf reports and legal/project statuses need versioned evidence before publication. Long-lived historical tables are not necessarily broken. This coverage inventory detects pipeline health, not the truth of every source. All times Jakarta WIB and schedules best-effort.</div>'+actionLinks()+'</div>';
}
function dataCsv(data){let cols=['id','group','mode','status','last_record_utc','last_record_key','cadence_hours','scheduled_writers','note'];let rows=[cols,...(data.datasets||[]).map(x=>cols.map(k=>Array.isArray(x[k])?x[k].join(';'):x[k]??''))];let blob=new Blob([rows.map(r=>r.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\n')],{type:'text/csv'});let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='sli_dataset_automation_audit.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200);}
async function load(){const r=await fetch(SRC,{cache:'no-store'});if(!r.ok)throw Error('Dataset audit HTTP '+r.status);return r.json();}
async function paint(){
 const compact=document.getElementById('sliAutomationHealthRoot'),full=document.getElementById('sliAutomationCenterRoot');if(!compact&&!full)return;
 try{current=await load();try{const pr=await fetch('./data/sli-publication-watch.json',{cache:'no-store'});publicationWatch=pr.ok?await pr.json():null;}catch(_){publicationWatch=null;}if(compact?.isConnected)compact.innerHTML=shortView(current);if(full?.isConnected)full.innerHTML=fullView(current);
 if(full?.isConnected){
   for(const [id,key] of [['sli-ah-category','category'],['sli-ah-mode','mode'],['sli-ah-status','status']])full.querySelector('#'+id).onchange=e=>{filters[key]=e.target.value;full.innerHTML=fullView(current);wire()};
   wire();
 }}catch(err){
 const html='<div class="sli-ah-note"><b>Data Freshness status unavailable.</b> '+escapeHTML(err.message)+'. A missing audit snapshot does not mean that all datasets are current. <a href="https://github.com/hananakhmad1991-stack/strategic-latitude-intelligence/actions/workflows/sli-automation-health.yml">Inspect audit workflow ↗</a></div>';
 if(compact?.isConnected)compact.innerHTML=shell()+html;if(full?.isConnected)full.innerHTML=shell()+html;
 }
}
function wire(){let full=document.getElementById('sliAutomationCenterRoot');if(!full)return;const s=full.querySelector('#sli-ah-search');if(s)s.oninput=e=>{filters.text=e.target.value;const active=document.activeElement;const a=active?.selectionStart,b=active?.selectionEnd;full.innerHTML=fullView(current);wire();const next=full.querySelector('#sli-ah-search');next?.focus();if(next?.setSelectionRange)next.setSelectionRange(a,b)};
 for(const [id,key] of [['sli-ah-category','category'],['sli-ah-mode','mode'],['sli-ah-status','status']]){let el=full.querySelector('#'+id);if(el)el.onchange=e=>{filters[key]=e.target.value;full.innerHTML=fullView(current);wire()}}
 const csv=full.querySelector('#sli-ah-csv');if(csv)csv.onclick=()=>dataCsv(current);
 const reload=full.querySelector('#sli-ah-retry');if(reload)reload.onclick=paint;
}
window.initSLIAutomationHealth=paint;
if(document.getElementById('sliAutomationCenterRoot'))paint();
})();