/* SLI BPS 2025/2026 agriculture and horticulture: SOURCE CATALOG ONLY.
 * Uploaded BPS PDFs prohibit commercial reproduction without BPS permission.
 * Do not publish numerical rows or raw business directories through this module.
 */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const dom=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!=null)x.textContent=String(txt);return x};
const sectorNames={
 national_agriculture:"Pertanian nasional",food_agriculture:"Pangan & pertanian",
 marine_fisheries:"Kelautan & perikanan",climate_environment:"Kehutanan & lingkungan"
};
function render(reg){
 const host=$("faBPS2026Catalog");if(!host||!Array.isArray(reg.tables))return;
 host.replaceChildren();
 const h=dom("h3",null,"Katalog sumber BPS 2025–2026 · lintas subsektor");
 const about=dom("p","fa-bps-notice","Dua PDF BPS telah diaudit dan 82 tabel statistik dipetakan ke sektor SLI. Ini adalah indeks sumber, BUKAN salinan angka tabel. Seluruh angka hasil ekstraksi menunggu pemeriksaan visual dan izin tertulis BPS untuk reproduksi komersial. Direktori yang memuat nomor telepon tidak dipublikasikan.");
 host.append(h,about);
 const counts=dom("p","fa-bps-meta","82 tabel · 114 halaman tabel terpetakan · 35 profil semantik hortikultura untuk telaah internal · 4 konflik judul/ruang lingkup + 2 selisih subtotal sumber · 0 seri numerik diterbitkan. Periode, unit, dan jenis agregasi sudah dipetakan awal; audit semua sel dan izin BPS tetap menunggu.");host.append(counts);
 const filters=dom("div","fa-bps-filters"),select=dom("select"),search=dom("input"),status=dom("p","fa-bps-meta");
 select.setAttribute("aria-label","Sektor tabel sumber BPS");
 for(const [value,label] of [["all","Semua subsektor"],...Object.entries(sectorNames)]){
  const o=dom("option",null,label);o.value=value;select.append(o)
 }
 search.type="search";search.placeholder="Cari nomor tabel, subsektor, atau tema";search.setAttribute("aria-label","Cari tabel statistik BPS");
 filters.append(select,search);host.append(filters,status);
 const list=dom("div","fa-bps-list");host.append(list);
 function repaint(){
  const query=search.value.toLowerCase().trim();
  const rows=reg.tables.filter(t=>(select.value==="all"||t.sector===select.value)&&
   (!query||[t.id,t.subsector,t.domain,t.sector,t.semantic_profile?.observation_grain,t.semantic_profile?.measure_type,t.semantic_profile?.printed_period].join(" ").toLowerCase().includes(query)));
  list.replaceChildren();
  status.textContent=rows.length+" dari "+reg.tables.length+" tabel sumber · numerik belum boleh diperbanyak secara komersial tanpa izin BPS.";
  for(const t of rows){
   const doc=reg.documents.find(x=>x.id===t.document_id);if(!doc)continue;
   const article=dom("article","fa-bps-entry");
   const heading=dom("strong",null,"Tabel "+t.id+" · "+(sectorNames[t.sector]||t.sector));
   const desc=dom("p",null,(t.domain||"").replace(/ · /g," · "));
   const meta=dom("small",null,doc.title+" · halaman cetak "+t.printed_page+(t.pdf_page_end>t.pdf_page?"–"+(t.printed_page+t.pdf_page_end-t.pdf_page):"")+" · PDF "+t.pdf_page+(t.pdf_page_end>t.pdf_page?"–"+t.pdf_page_end:"")+" · kandidat visualisasi: "+(t.semantic_profile?.candidate_visualization||t.chart_candidate)+" (belum aktif)");
   const link=dom("a",null,"Cari publikasi resmi BPS ↗");link.href=doc.publisher_search_url;
   link.target="_blank";link.rel="noopener noreferrer";
   if(t.review_flag||t.arithmetic_review_flag){const flag=dom("small","fa-bps-qa-alert",t.review_flag?"Perbedaan judul/tahun atau populasi pada sumber BPS — tahan angka sampai diklarifikasi.":"Selisih subtotal pada publikasi asli — jangan isi tanda pisah dengan hasil pengurangan.");article.append(flag)}
   article.append(heading,desc,meta);
   if(t.semantic_profile){
    const s=t.semantic_profile;
    const grain=s.observation_grain.startsWith("province")?"provinsi":s.observation_grain==="commodity"||s.observation_grain==="commodity_activity"?"komoditas":"unit lainnya";
    const guide=dom("small","fa-bps-semantic","Struktur: "+grain+" · periode sesuai judul cetak: "+s.printed_period+" · jenis ukuran: "+s.measure_type+" · satuan: "+s.unit+". Belum boleh diterbitkan sebagai angka/grafik sebelum validasi seluruh sel dan izin BPS; tanda pisah bukan nol.");
    article.append(guide);
   }
   article.append(link);list.append(article)
  }
 }
 select.addEventListener("change",repaint);search.addEventListener("input",repaint);repaint();
}
async function init(){
 if(!$("faBPS2026Catalog"))return;
 try{
  const r=await fetch("./data/sli-bps-agri-horti-2026-source-register.json",{cache:"no-store"});
  if(!r.ok)throw Error("HTTP "+r.status);
  const d=await r.json();
  if(d.schema!=="sli-bps-agri-horti-2026-source-register-v1"||d.tables?.length!==82||
    d.coverage?.all_verified_numeric_cells_public!==0||d.coverage?.nonstatistical_horticulture_directories_indexed!==0)
      throw Error("Source register policy mismatch");
  render(d);
 }catch(err){console.warn("[SLI BPS source catalog]",err);const host=$("faBPS2026Catalog");if(host)host.textContent="Katalog publikasi BPS belum dapat dimuat; angka sumber tidak ditebak."}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
window.SLIBPSAgriHortiCatalog=Object.freeze({mode:"source-metadata-no-extracted-numeric-republication"});
})();
