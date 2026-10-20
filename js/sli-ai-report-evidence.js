/* Stanford / World Bank user-report snapshots for AI Hub. Observed vs modelled; geography always visible. */
(()=>{"use strict";
 const host=document.getElementById("sliAiReportEvidence");if(!host)return;
 const fmt=x=>typeof x==="number"?x.toLocaleString("id-ID",{maximumFractionDigits:2}):"—";
 fetch("./data/sli-ai-stanford-worldbank-foundations-2025-2026.json",{cache:"no-cache"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(d=>{
  const summary=document.getElementById("sliAiReportSummary");
  summary.textContent=d.indicators.length+" source-page-checked numerical indicators · Stanford AI Index 2026 and World Bank AI Foundations 2025. Publisher-reported numbers from original PDF summaries, not independent verification of the underlying studies. Global/income-group numbers are NOT Indonesia statistics.";
  const table=document.createElement("table"),thead=document.createElement("thead"),tr=document.createElement("tr");
  for(const k of ["Topik","Indikator","Nilai","Periode","Geografi","Jenis ukuran","Sumber (halaman PDF)"]){const th=document.createElement("th");th.textContent=k;tr.append(th)}thead.append(tr);table.append(thead);
  const tbody=document.createElement("tbody");table.append(tbody);host.replaceChildren(table);
  const select=document.getElementById("sliAiReportCategory");
  for(const cat of [...new Set(d.indicators.map(x=>x.category))].sort()){
   const opt=document.createElement("option");opt.value=cat;opt.textContent=cat;select.append(opt);
  }
  const redraw=()=>{
   tbody.replaceChildren();
   const group=d.indicators.filter(x=>!select.value||x.category===select.value);
   for(const x of group){
    const tr=document.createElement("tr"),source=d.sources[x.source];
    const vals=[x.category,x.label_id,(x.comparator||"")+fmt(x.value)+" "+x.unit,x.period||x.year,
     x.geography,x.methodology,source.publisher+" · PDF page "+x.pdf_page+" · "+(x.pdf_verification||"attributed source")];
    vals.forEach((v,i)=>{const cell=document.createElement(i===0?"th":"td");cell.textContent=v;if(i===0)cell.scope="row";tr.append(cell)});
    tbody.append(tr);
   }
  };
  select.addEventListener("change",redraw);redraw();
  const b=document.getElementById("sliAiReportDetailLink");if(b)b.href="./sli-sector-data-library.html#ai-reports";
 }).catch(e=>{host.textContent="Data laporan global belum dapat dimuat ("+String(e.message)+"). Akses indikator melalui Perpustakaan Data SLI."});
})();