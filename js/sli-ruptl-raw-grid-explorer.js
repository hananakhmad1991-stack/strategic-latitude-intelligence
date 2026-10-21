/* Digitized original PDF table GRID CELLS: 970 machine-only candidates, not 970 commissioned assets. */
(()=>{"use strict";
const roots=[...document.querySelectorAll("[data-sli-ruptl-raw-grid]")];
if(!roots.length)return;
const path="./data/sli-ruptl-970-raw-grid-candidates-review.json";
const el=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined&&text!==null)x.textContent=String(text);return x};
const source=(url,name)=>{const a=el("a",name);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
function csv(name,rows){
 const payload=rows.map(row=>row.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\r\n");
 const u=URL.createObjectURL(new Blob(["\uFEFF",payload],{type:"text/csv;charset=utf-8"})),a=el("a");a.download=name;a.href=u;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);
}
function render(root,data){
 if(data.schema!=="sli-ruptl-all34-original-grid-raw-review-catalog-v1"||data.source_pdf_sha256!=="1308ee580c7c1642fe7817e000c87cb2dc87053e1fcef90606dcc1da396fd002"||data.total_annexes!==34||data.total_raw_grid_candidates!==970||data.approved_as_distinct_project_records!==0||data.actual_project_cod_confirmed_from_this_dataset!==0)throw Error("Raw original PDF review ledger must stay unapproved and checksum pinned");
 const sections=data.sections,rows=sections.flatMap(a=>a.rows.map(x=>({...x,annex_id:a.annex_id,region:a.geographic_heading})));
 if(rows.length!==970||new Set(sections.map(x=>x.annex_id)).size!==34||new Set(rows.map(x=>x.source_key)).size!==970)throw Error("Original grid-page record identity mismatch");
 const frame=el("details");frame.className="sli-ruptl-raw-explorer";
 const summary=el("summary","Katalog digital 970 baris tabel sumber · klik untuk jelajahi dan unduh");
 const container=el("div");frame.append(summary,container);
 const warn=el("p","Ini SEL ASLI hasil pembacaan mesin dari 34 tabel rencana pembangkit RUPTL 2025–2034, BUKAN 970 proyek unik. Posisi kolom pada PDF dapat bergeser; teks seperti '98 ,' bukan otomatis 9,8 MW tanpa pengecekan visual. Tidak ada data COD aktual atau realisasi dari katalog ini.");warn.className="rv-disclaimer";
 const metrics=el("div");metrics.className="rv-raw-metrics";
 [["Baris grid digital",970],["Kelompok lampiran",34],["Proyek baru disetujui",0]].forEach(([name,n])=>{const c=el("div");c.append(el("small",name),el("strong",n));metrics.append(c)});
 const filters=el("div");filters.className="rv-raw-controls";
 const q=el("input"),select=el("select"),pageSize=30;
 q.type="search";q.placeholder="Cari teks asli proyek, teknologi, sistem atau baris";q.setAttribute("aria-label","Cari isi sel tabel sumber yang diekstrak");
 select.setAttribute("aria-label","Filter lampiran RUPTL");
 let op=el("option","Semua 34 sublampiran");op.value="";select.append(op);
 sections.forEach(x=>{const o=el("option",x.annex_id+" · "+x.geographic_heading);o.value=x.annex_id;select.append(o)});
 const count=el("p"),buttons=el("div");buttons.className="rv-raw-buttons";
 const prev=el("button","← Sebelumnya"),next=el("button","Berikutnya →"),download=el("button","Ekspor hasil filter CSV");
 for(const b of [prev,next,download])b.type="button";
 filters.append(q,select,download);
 const scroller=el("div");scroller.className="rv-raw-scroller";
 const table=el("table"),thead=el("thead"),tr=el("tr");
 ["Kelompok wilayah","No sumber","Isi sel asli hasil ekstraksi (belum dibetulkan)","Referensi PDF"].forEach(x=>tr.append(el("th",x)));
 thead.append(tr);const tbody=el("tbody");table.append(thead,tbody);scroller.append(table);
 buttons.append(prev,count,next);
 const foot=el("p");foot.append("Jejak ekstraksi: ",source(data.extraction_artifact,"audit GitHub asli ↗")," · ",source(data.source_url,"dokumen resmi 1.253 halaman ↗"),". Untuk proyek yang sudah diperiksa, gunakan tabel 92 baris sampel pada bagian bawah.");
 container.append(warn,metrics,filters,scroller,buttons,foot);
 root.replaceChildren(frame);
 let page=0,filtered=rows;
 function recalc(){const term=q.value.trim().toLocaleLowerCase("id-ID");
  filtered=rows.filter(x=>(!select.value||x.annex_id===select.value)&&(!term||[x.region,x.annex_id,x.original_row_no,...x.raw_cells.map(z=>z??"")].join(" ").toLocaleLowerCase("id-ID").includes(term)));
  page=0;draw();
 }
 function draw(){
  const pageTotal=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(Math.max(0,page),pageTotal-1);
  const cut=filtered.slice(page*pageSize,(page+1)*pageSize);
  tbody.replaceChildren();
  for(const x of cut){
   const r=el("tr");
   r.append(el("td",x.annex_id+" · "+x.region),el("td",x.original_row_no));
   const cells=el("td");cells.append(el("code",x.raw_cells.map(x=>x??"∅").join(" | ")));r.append(cells);
   const evidence=el("td");evidence.append(source(data.source_url+"#page="+x.page,"PDF "+x.page+" · "+x.table+" ↗"));r.append(evidence);
   tbody.append(r);
  }
  if(!cut.length){const tr=el("tr"),td=el("td","Tidak ditemukan teks sumber yang sesuai.");td.colSpan=4;tr.append(td);tbody.append(tr)}
  count.textContent="Baris "+(filtered.length?page*pageSize+1:0)+"–"+Math.min(filtered.length,(page+1)*pageSize)+" dari "+filtered.length+" kandidat · halaman "+(page+1)+"/"+pageTotal;
  prev.disabled=page===0;next.disabled=page>=pageTotal-1;
 }
 q.addEventListener("input",recalc);
 select.addEventListener("change",()=>{recalc();const current=select.value;if(current)document.dispatchEvent(new CustomEvent("sli:ruptl-region-selected",{detail:{annex_id:current}}))});
 prev.addEventListener("click",()=>{page--;draw()});
 next.addEventListener("click",()=>{page++;draw()});
 download.addEventListener("click",()=>csv("sli_ruptl_970_original_grid_cells_REVIEW_ONLY.csv",[["annex_id","region","source_key","source_pdf_page","original_source_row_no","source_table","original_cells_JSON","review_status"],...filtered.map(x=>[x.annex_id,x.region,x.source_key,x.page,x.original_row_no,x.table,JSON.stringify(x.raw_cells),"machine_grid_candidate_not_verified_project"])]));
 document.addEventListener("sli:ruptl-region-focus",e=>{if(!e.detail?.annex_id)return;select.value=e.detail.annex_id;recalc()});
 draw();
}
fetch(path,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()})
 .then(data=>roots.forEach(root=>render(root,data))).catch(error=>roots.forEach(root=>root.replaceChildren(el("p","Katalog mentah belum dapat dimuat: "+error.message))));
})();