/* Renders a machine-readable data QUALITY BLOCKER, not GIS event figures. */
(()=>{"use strict";const roots=document.querySelectorAll("[data-sli-bnpb-2025-gis-gate]");if(!roots.length)return;
function el(name,txt){const x=document.createElement(name);if(txt!==undefined)x.textContent=txt;return x;}
fetch("./data/sli-bnpb-gis-2025-methodology-gate.json",{cache:"no-store"})
.then(x=>{if(!x.ok)throw Error("HTTP "+x.status);return x.json()}).then(d=>{
 if(d.schema!=="sli-bnpb-2025-gis-vs-provincial-definition-review-v1"||
 !d.not_approved_for_district_2025_event_publication||
 d.status!=="blocked_pending_aggregation_method_review")throw Error("Source quality status mismatch");
 for(const root of roots){
  const heading=el("strong","BNPB GIS 2025 · Verifikasi definisi masih terblokir");
  const text=el("p","Layanan GIS resmi mengembalikan "+d.valid_district_code_rows+
  " geometri kabupaten/kota berkode; "+d.unmapped_blank_district_code_features+
  " objek tidak memiliki kode wilayah yang dapat digunakan. Hasil agregasi angka GIS berbeda jauh dari kompilasi BNPB provinsi 2025. Karena definisi belum direkonsiliasi, SLI tidak menggunakan atribut GIS ini sebagai jumlah kejadian kabupaten/kota atau tren 2024–2025.");
  const source=el("a","Lihat layer GIS BNPB ↗");source.href=d.source_endpoint;source.target="_blank";source.rel="noopener noreferrer";
  const audit=el("a","Log audit sumber ↗");audit.href=d.review_evidence_run;audit.target="_blank";audit.rel="noopener noreferrer";
  root.classList.add("sli-bnpb-gis-review-gate");root.replaceChildren(heading,text,source," · ",audit);
 }
}).catch(()=>roots.forEach(root=>{root.textContent="Status verifikasi GIS BNPB 2025 belum bisa dimuat; data tetap ditahan."}));
})();