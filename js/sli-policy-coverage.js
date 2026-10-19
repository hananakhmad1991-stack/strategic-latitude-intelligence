/* Compact jurisdiction coverage lens: a known JDIH URL != a verified law inventory. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const kinds=new Set(["perda","perda_kab","pergub","perbup","perwali"]);
const norm=s=>String(s||"").toLowerCase().normalize("NFKD").replace(/\s+/g," ").trim();
function matchingRegion(node,p){
 const region=norm(node.region||"");
 const province=norm(p.name);
 if(region==="indonesia"||region==="internasional"||!region)return false;
 if(province==="riau"&&region.includes("kepulauan riau"))return false;
 if(province==="papua"&&/(papua barat|papua selatan|papua tengah|papua pegunungan|papua barat daya)/.test(region))return false;
 return region===province||region.endsWith(", "+province);
}
function init(){
 const root=$("policyCoverageDashboard");if(!root)return;
 Promise.all([
 fetch("./data/sli-policy-source-coverage.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("coverage_http_"+r.status);return r.json()}),
 fetch("./data/sli-policy-regulatory-graph-2026.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("graph_http_"+r.status);return r.json()}),
 fetch("./data/regulatory-monitor.json",{cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null)
 ]).then(([catalog,graph,monitor])=>{
  if(catalog.schema!=="sli-legal-coverage-register-v1"||catalog.provinces?.length!==38||!Array.isArray(graph.nodes))throw Error("coverage_schema");
  const sources=new Map((monitor?.sources||[]).map(s=>[s.id,s]));
  const withPortals=catalog.provinces.filter(p=>p.source_url).length;
  const rules=graph.nodes.filter(n=>kinds.has(n.tier));
  const linked=graph.nodes.filter(n=>rules.includes(n)&&catalog.provinces.some(p=>matchingRegion(n,p))).length;
  $("policyCoverageSummary").textContent="38 provinsi dalam matriks cakupan · "+withPortals+" portal provinsi memiliki alamat teridentifikasi · "+linked+" peraturan daerah dengan lokasi yang dapat dipetakan (dari "+rules.length+" entri daerah dalam indeks). Ini bukan cakupan lengkap Perda.";
  const rows=catalog.provinces.map(p=>{
   const count=rules.filter(n=>matchingRegion(n,p)).length;
   const source=sources.get(p.monitor_source_id);
   const health=source?(source.health==="ok"?"Diakses pada pemeriksaan terakhir":"Akses gagal pada pemeriksaan terakhir"):(p.source_url?"Portal ditemukan; belum dipantau SLI":"Portal belum dikonfirmasi");
   return '<tr><td><strong>'+esc(p.name)+'</strong></td><td>'+count+' dalam indeks</td><td>'+esc(health)+'</td><td>'+(p.source_url?'<a href="'+esc(p.source_url)+'" target="_blank" rel="noopener noreferrer">Buka JDIH resmi ↗</a>':'<span class="quiet">Perlu penelusuran JDIHN</span>')+'</td></tr>';
  });
  $("policyCoverageTable").innerHTML='<thead><tr><th>Provinsi</th><th>Peraturan terindeks</th><th>Status sumber</th><th>Portal</th></tr></thead><tbody>'+rows.join("")+'</tbody>';
  $("policyCoverageDate").textContent="Diperiksa menurut data yang tersimpan pada "+(monitor?.checked_at_utc?.slice(0,10)||catalog.updated_at)+". Kegagalan akses tidak membuktikan portal atau aturannya tidak ada.";
 }).catch(err=>{
  $("policyCoverageSummary").textContent="Matriks cakupan belum dapat dimuat: "+err.message+". Jangan menyimpulkan tidak ada peraturan.";
 });
}
document.addEventListener("DOMContentLoaded",init);
})();
