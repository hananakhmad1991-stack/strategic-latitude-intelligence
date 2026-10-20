/* Verified official RUPTL full PDF document navigation; no project-level approval implied. */
(()=>{"use strict";
const roots=[...document.querySelectorAll("[data-sli-ruptl-annex-index]")];if(!roots.length)return;
const mk=(tag,value)=>{const e=document.createElement(tag);if(value!==undefined)e.textContent=String(value);return e;};
fetch("./data/sli-ruptl-full-official-annex-index.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(d=>{
 if(d.schema!=="sli-ruptl-2025-2034-full-official-annex-index-v1"||d.source_pdf_total_pages!==1253||d.verified_individual_project_records!==0||d.headings.length!==42||!d.source_url.startsWith("https://gatrik.esdm.go.id/"))throw Error("Official RUPTL source integrity version invalid");
 for(const root of roots){
  const h=mk("h3","RUPTL 2025–2034 · Indeks 42 bagian lampiran PDF resmi");
  const intro=mk("p","PDF lengkap 1.253 halaman terverifikasi. Lampiran A–E tercatat menurut nomor halaman PDF. Tabel ini untuk navigasi sumber; belum mengonfirmasi nama proyek, pemilik, kapasitas MW, jadwal COD, konstruksi atau operasi.");
  const ctl=mk("label","Pilih lampiran: ");
  const pick=mk("select");[["","Semua lampiran"],...["A","B","C","D","E"].map(x=>[x,"Lampiran "+x])].forEach(([v,label])=>{const op=mk("option",label);op.value=v;pick.append(op)});ctl.append(pick);
  const count=mk("p");const scroll=mk("div");scroll.className="sli-ruptl-annex-scroll";scroll.tabIndex=0;
  const note=mk("p",d.index_limits);note.className="sli-ruptl-annex-warning";
  const proof=mk("p");const pdf=mk("a","Buka PDF resmi Gatrik ↗");pdf.href=d.source_url;pdf.target="_blank";pdf.rel="noopener noreferrer";
  const audit=mk("a","Lihat audit integritas PDF ↗");audit.href=d.source_audit_run;audit.target="_blank";audit.rel="noopener noreferrer";
  proof.append(pdf," · ",audit," · SHA-256: "+d.source_sha256.slice(0,20)+"…");
  root.classList.add("sli-ruptl-annex-index");root.setAttribute("data-sli-visual","official-ruptl-annex-page-index");root.replaceChildren(h,intro,ctl,count,scroll,note,proof);
  let visible=d.headings;
  function render(){
   visible=d.headings.filter(x=>!pick.value||x.annex_group===pick.value);
   count.textContent="Bagian yang tampil: "+visible.length+" dari 42. Halaman adalah nomor PDF, bukan halaman cetak.";
   const table=mk("table"),head=mk("thead"),hr=mk("tr"),body=mk("tbody");
   ["Bagian lampiran","Halaman PDF","Sumber"].forEach(x=>hr.append(mk("th",x)));head.append(hr);
   for(const row of visible){const tr=mk("tr");tr.append(mk("td",row.heading),mk("td",row.pdf_page));
    const cell=mk("td"),a=mk("a","Buka halaman ↗");a.href=d.source_url+"#page="+row.pdf_page;a.target="_blank";a.rel="noopener noreferrer";cell.append(a);tr.append(cell);body.append(tr);}
   table.append(head,body);scroll.replaceChildren(table);
   if(window.SLIVisualExport?.register)window.SLIVisualExport.register(table,{
    getData:()=>({headers:["Annex group","Official PDF section heading","PDF page","Verified project status"],rows:visible.map(x=>[x.annex_group,x.heading,x.pdf_page,x.status]),kind:"verified-provider"}),
    getMeta:()=>({title:"Official full RUPTL 2025–2034 annex source page index",source:d.publisher,sourceUrl:d.source_url,period:"2025–2034",completeness:d.index_limits})
   });
  }
  pick.addEventListener("change",render);document.addEventListener("sli:exportready",render,{once:true});render();
 }
}).catch(e=>roots.forEach(root=>{root.textContent="Indeks PDF resmi RUPTL belum dapat dibuka: "+String(e.message)}));
})();