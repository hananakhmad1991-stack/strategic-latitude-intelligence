/* SLI regulation/news monitor presentation. Does not modify legal status. */
(function(){
'use strict';
const root=document.getElementById('sli-regulatory-monitor-root');
if(!root)return;
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>{if(!s)return 'Belum diperiksa';const d=new Date(s);return Number.isNaN(d.getTime())?'Tanggal tidak tersedia':d.toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'})+' WIB'};
let snapshot;
let selectedSector='all',typeFilter='all',groupFilter='all';
function render(){
 if(!snapshot)return;
 const d=snapshot;
 const baseline=d.monitoring_status==='awaiting_first_run';
 const stale=!baseline&&(!d.checked_at_utc||Date.now()-Date.parse(d.checked_at_utc)>48*3600000);
 const good=d.sources.filter(s=>s.health==='ok').length;
 const failed=d.sources.filter(s=>s.health==='error').length;
 const candidates=d.events.filter(x=>x.event_kind==='new_candidate');
 const counts=[
  ['Terakhir diperiksa',date(d.checked_at_utc)],
  ['Sumber berhasil / total',good+' / '+d.sources.length],
  ['Sumber gagal',failed],
  ['Kandidat baru · semua sumber',candidates.length]
 ];
 let html='<div class="grid">'+counts.map(([lab,val])=>'<div class="box"><small>'+e(lab)+'</small><strong style="display:block;color:#d7b678;font-size:20px">'+e(val)+'</strong></div>').join('')+'</div>';
 html+='<div class="note" style="border-left-color:'+(failed?'#ffbd97':'#76c2b1')+'"><strong>'+(
 baseline?'Belum ada pemeriksaan otomatis yang terekam':
 stale?'Snapshot lebih dari 48 jam — kemungkinan ada gangguan jadwal/sumber':
 failed?'Sebagian sumber tidak dapat diperiksa':
 'Snapshot kandidat sumber resmi telah diperbarui'
 )+'.</strong> Berita dan perubahan metadata merupakan <b>lead verifikasi</b>, bukan konfirmasi UU/PP/Permen berlaku, diubah, atau dicabut. '+(failed?'Daftar sumber gagal ditampilkan di bawah.':'')+'</div>';
 html+='<div class="tools"><label>Cakupan <select id="policy-monitor-group"><option value="all">Semua: domestik & geopolitik</option><option value="domestic_policy"'+(groupFilter==='domestic_policy'?' selected':'')+'>Kebijakan domestik</option><option value="geopolitical_policy"'+(groupFilter==='geopolitical_policy'?' selected':'')+'>Kebijakan geopolitik / WTO / arbitrase</option></select></label><label>Sektor <select id="policy-monitor-sector"><option value="all">Semua sektor</option>'+
 [['international','WTO / Treaty / Arbitration'],['electricity','Listrik & grid'],['energy','Energi'],['oilgas','Migas'],['minerba','Minerba'],['digital','AI / Digital'],['carbon','Karbon'],['environment','Lingkungan'],['cross','Lintas kementerian']].map(([x,y])=>'<option value="'+x+'"'+(selectedSector===x?' selected':'')+'>'+y+'</option>').join('')+'</select></label><label>Tipe temuan <select id="policy-monitor-type"><option value="all">Semua</option><option value="new_candidate"'+(typeFilter==='new_candidate'?' selected':'')+'>Kandidat perubahan baru</option><option value="baseline_observation"'+(typeFilter==='baseline_observation'?' selected':'')+'>Baseline sumber</option></select></label><button id="policy-monitor-download">Export CSV</button><a class="btn" href="https://github.com/hananakhmad1991-stack/strategic-latitude-intelligence/actions/workflows/regulatory-change-monitor.yml" target="_blank" rel="noopener noreferrer">Lihat workflow ↗</a></div>';
 const items=d.events.filter(item=>(groupFilter==='all'||(item.monitor_group||(item.kind==='international_policy_news'?'geopolitical_policy':'domestic_policy'))===groupFilter)&&(selectedSector==='all'||item.sectors?.includes(selectedSector))&&(typeFilter==='all'||item.event_kind===typeFilter)).slice(0,55);
 html+='<div class="two"><div class="box" style="max-height:580px;overflow:auto"><h3>Perubahan & berita kebijakan yang ditemukan</h3><p class="mini">Urut berdasarkan pertama kali terdeteksi; <b>bukan</b> urutan tanggal penerbitan resmi. '+items.length+' hasil terlihat.</p>';
 html+=items.length?items.map(it=>'<article class="selectrow"><span class="chip '+(it.event_kind==='new_candidate'?'status':'')+'">'+(it.event_kind==='new_candidate'?'PERLU REVIEW · BARU':'BASELINE')+'</span><span class="chip">'+e(it.kind?.replaceAll('_',' ')||'Artikel resmi')+'</span><p style="margin:6px 0"><a href="'+e(it.url)+'" target="_blank" rel="noopener noreferrer"><strong>'+e(it.title)+'</strong> ↗</a></p><div class="mini">'+e(it.issuer)+' · ditemukan '+e(date(it.first_seen_utc))+'</div><p class="mini">'+e(it.preview||'Tidak ada ringkasan otomatis')+'</p><small>Legal status: BELUM diverifikasi · '+e((it.sectors||[]).join(', '))+'</small></article>').join(''):'<p>Belum ada temuan yang dapat ditampilkan untuk filter ini. Jika sumber gagal diperiksa, ini <b>bukan</b> bukti tidak ada perubahan hukum.</p>';
 html+='</div><div class="box" style="max-height:580px;overflow:auto"><h3>Kesehatan sumber resmi</h3>';
 html+=d.sources.map(s=>'<div class="selectrow"><div class="riskhead"><strong><a href="'+e(s.url)+'" target="_blank" rel="noopener noreferrer">'+e(s.label)+' ↗</a></strong><span class="chip '+(s.health==='ok'?'status':'')+'">'+(s.health==='ok'?'OK':s.health==='error'?'ERROR':'PENDING')+'</span></div><small>Terakhir berhasil: '+e(date(s.last_success_utc))+'</small>'+(s.error?'<p class="mini" style="color:#ffbd97">Gagal: '+e(s.error)+'</p>':'')+'</div>').join('');
 html+='<h3 style="margin-top:16px">Status halaman regulasi yang diawasi</h3>';
 let records=Object.values(d.watched_law_records||{});
 html+=records.length?records.map(s=>'<div class="selectrow"><strong><a href="'+e(s.source_url)+'" target="_blank" rel="noopener noreferrer">'+e(s.reference)+'</a></strong> · <span class="chip">'+e(s.health||'unknown')+'</span><div class="mini">'+e((s.latest_candidate_review||'').replaceAll('_',' '))+'</div></div>').join(''):'<p class="mini">Belum ada pemindaian halaman langsung tersimpan.</p>';
 html+='</div></div>';
 html+='<p class="mini">Fakta legal tetap merujuk ke register sumber resmi. SLI tidak mengubah otomatis status UU/PP/Perda ketika menemukan headline atau perubahan metadata. <a href="./data/regulatory-monitor.json">Unduh snapshot audit JSON ↗</a>. <a href="./data/regulatory-monitor-sources.json">Daftar sumber dan interval pemindaian ↗</a>.</p>';
 root.innerHTML=html;
 document.getElementById('policy-monitor-group').onchange=x=>{groupFilter=x.target.value;render()};
 document.getElementById('policy-monitor-sector').onchange=x=>{selectedSector=x.target.value;render()};
 document.getElementById('policy-monitor-type').onchange=x=>{typeFilter=x.target.value;render()};
 document.getElementById('policy-monitor-download').onclick=()=>{
  const rows=[['first_seen_utc','type','issuer','title','url','classification','legal_status_update','sectors'],
    ...d.events.map(x=>[x.first_seen_utc,x.kind,x.issuer,x.title,x.url,x.classification,x.legal_status_update,(x.sectors||[]).join(';')])];
  const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='sli_regulatory_monitor_candidates.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 };
}
fetch('./data/regulatory-monitor.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()})
.then(d=>{snapshot=d;render()}).catch(ex=>root.innerHTML='<div class="note"><strong>Monitoring unavailable:</strong> '+e(ex.message)+' — kondisi ini tidak berarti tidak ada perubahan regulasi.</div>');
})();