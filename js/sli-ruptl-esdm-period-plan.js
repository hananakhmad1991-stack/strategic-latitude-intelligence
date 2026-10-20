/* Official ESDM presentation: planned period allocation is NOT asset project realization. */
(()=>{"use strict";
const roots=[...document.querySelectorAll("[data-sli-ruptl-period-plan]")];if(!roots.length)return;
const source="./data/sli-ruptl-esdm-2025-2034-period-plan.json";
const mk=(tag,txt)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=String(txt);return x};
const fmt=v=>typeof v==="number"?v.toLocaleString("id-ID",{maximumFractionDigits:1}):"—";
function mount(root,d){
 if(d.schema!=="sli-ruptl-2025-2034-esdm-period-plan-v1"||d.project_records_verified_from_this_source!==0)throw Error("RUPTL presentation source scope invalid");
 const title=mk("h3","RUPTL 2025–2034 · Pembagian kapasitas rencana nasional");
 const note=mk("p","Data rencana penambahan pembangkit/storage dari bahan resmi Ditjen Ketenagalistrikan. Bukan pembangunan yang sudah dilaksanakan, investasi terealisasi, PPA efektif, atau operasi komersial.");
 const table=mk("table"),head=mk("thead"),hr=mk("tr"),tbody=mk("tbody");
 for(const h of ["Jenis teknologi / kelompok",...d.time_windows.map(x=>x+" (GW)")])hr.append(mk("th",h));
 head.append(hr);
 const rows=[...d.groups.map(x=>({label:x.category,values:x.values})),...d.technologies.map(x=>({label:x.label,values:x.values}))];
 rows.forEach((r,i)=>{const tr=mk("tr");if(i<d.groups.length)tr.className="sli-ruptl-period-group";
 tr.append(mk("td",r.label));r.values.forEach(x=>tr.append(mk("td",fmt(x))));tbody.append(tr)});
 table.append(head,tbody);
 const scroll=mk("div");scroll.className="sli-ruptl-period-scroll";scroll.append(table);
 const foot=mk("p",d.totals_note+" "+d.validation_rule);
 const link=mk("a","Sumber resmi: Ditjen Gatrik ESDM ↗");link.href=d.source_url;link.target="_blank";link.rel="noopener noreferrer";
 const caution=mk("p","LAMPIRAN PROYEK: BELUM TERVERIFIKASI LENGKAP. Angka GW di atas adalah target kapasitas dua periode. Tidak tersedia daftar proyek individual yang dapat dikonfirmasi dari tabel ini.");caution.className="sli-ruptl-period-warning";
 root.classList.add("sli-ruptl-period");root.replaceChildren(title,note,scroll,foot,caution,link);
 function register(){
  if(!window.SLIVisualExport?.register)return;
  window.SLIVisualExport.register(table,{getData:()=>({headers:["Technology / category",...d.time_windows.map(x=>x+" (GW)")],rows:rows.map(x=>[x.label,...x.values]),kind:"verified-provider"}),
   getMeta:()=>({title:"RUPTL PLN 2025–2034 · Official ESDM planned capacity by period",
    source:d.publisher,sourceUrl:d.source_url,period:"2025–2030;2031–2034",
    completeness:"Official presentation planned capacity ONLY. Project appendix not validated; no realized/operating assets or committed investments inferred. Dash values are source-null, not zero."})});
 }
 document.addEventListener("sli:exportready",register);register();
}
fetch(source,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(d=>roots.forEach(root=>mount(root,d))).catch(e=>roots.forEach(root=>{root.textContent="RUPTL two-period official source unavailable: "+String(e.message)}));
})();