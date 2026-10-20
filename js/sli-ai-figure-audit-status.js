/* Source report figure-label candidate audit only. Never marks unreviewed figures as numeric. */
(()=>{"use strict";
const hosts=document.querySelectorAll("[data-sli-ai-figure-audit]");
if(!hosts.length)return;
fetch("./data/sli-ai-figure-source-audit.json",{cache:"no-store"})
 .then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()})
 .then(d=>{
  if(d.schema!=="sli-ai-publisher-figure-audit-v1")throw Error("figure audit schema");
  for(const root of hosts){
   const box=document.createElement("p");
   box.className="notice";
   const num=d.text_figure_label_total,done=d.already_digitized_numeric_source_figures;
   box.textContent="Audit PDF sumber · "+d.audit_date+": "+num+
    " kemunculan label figure terdeteksi otomatis (Stanford "+d.publisher_reports[0].text_figure_label_candidates+
    ", World Bank "+d.publisher_reports[1].text_figure_label_candidates+
    "). Bukan "+num+" grafik terverifikasi. Hanya "+done+
    " panel grafik yang telah memiliki dataset numerik dari label asli ("+d.distinct_digitized_figure_numbers+" nomor gambar berbeda); sisanya masih kandidat yang memerlukan pemeriksaan visual, angka, periode, lisensi dan definisi.";
   const link=document.createElement("a");
   link.textContent="Lihat log audit ↗";link.href=d.publisher_reports[0].evidence_run;
   link.target="_blank";link.rel="noopener noreferrer";
   box.append(" ",link);root.replaceChildren(box);
  }
 }).catch(()=>hosts.forEach(x=>x.textContent="Status katalog grafik sumber sementara tidak tersedia."));
})();