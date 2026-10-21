/* PLN RUPTL 2025 plan by geographic appendix: candidate source rows, NOT observed operation. */
(()=>{"use strict";
const roots=[...document.querySelectorAll("[data-sli-ruptl-provincial]")];if(!roots.length)return;
const P="./data/sli-ruptl-provincial-source-projects-2025.json",O="./data/sli-ruptl-primary-pdf-2025-2034.json";
const el=(tag,txt)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=String(txt);return x};
const fmt=n=>typeof n==="number"?n.toLocaleString("id-ID",{maximumFractionDigits:2}):"—";
const option=(select,txt,val)=>{const o=el("option",txt);o.value=val;select.append(o)};
const link=(url,label)=>{const x=el("a",label);x.href=url;x.target="_blank";x.rel="noopener noreferrer";return x};
const GROUP={"Aceh":"A.1","DKI Jakarta":"B.1","Sulawesi Utara":"C.1"};
function normalizeExisting(x,i){
 const annex=GROUP[x.province]||null;
 return {id:"old-"+x.id,annex_id:annex,appendix_geography:x.province,table:x.table,pdf_page:x.pdf_page,
 source_project_label:x.project_name,technology:x.technology,capacity_as_printed:x.capacity_as_printed,
 capacity_mw:x.capacity_mw,planned_cod_ared:x.cod_ared,planned_cod_re_base:x.cod_re_base,
 status_as_printed_2025:x.status_in_ruplt_2025,developer_class_as_printed:x.developer_class_as_printed,
 operational_status_2026:null,operational_status_as_of:null,verified_actual_cod:null,
 verified_realized_capacity_mw:null,verified_realization_source_url:null,
 interpretation:"Older 13 source rows, annex-section heading only; exact site geography/current progress unverified."};
}
function render(root,data,legacy){
 if(data.schema!=="sli-ruptl-provincial-source-projects-2025-v1"||data.source_rows.length!==35||data.geographic_appendix_coverage.subsections.length!==34)throw Error("Source review dataset schema mismatch");
 const old=legacy.individual_project_source_records.records.map(normalizeExisting);
 const all=[...old,...data.source_rows]; // disjoint original source row selections; NOT national roster
 root.classList.add("sli-ruptl-provincial");
 const h=el("h2","RUPTL · Proyek per wilayah lampiran dan rencana vs realisasi");
 const pre=el("p","Katalog audit sumber dari PDF RUPTL yang disahkan pada 2025. "+all.length+" baris sampel dari tabel asli; tidak mewakili seluruh proyek nasional. Wilayah lampiran bukan koordinat proyek.");
 const summary=el("div");summary.className="sli-ruptl-province-summary";
 [["Sublampiran geografis",34],["Baris proyek sampel",all.length],["Wilayah lampiran dengan sampel",new Set(all.map(x=>x.annex_id)).size],["Status aktual", "Belum ada yang terverifikasi"]].forEach(([a,b])=>{const c=el("div");c.append(el("small",a),el("strong",b));summary.append(c)});
 const methodology=el("p","PERBEDAAN PENTING: Target COD dan status dokumen tahun 2025 bukan bukti COD aktual, penyerahan operasi, atau konstruksi pada Oktober 2026. Kolom data realisasi kosong berarti BELUM DIVERIFIKASI, bukan proyek gagal atau realisasi nol.");
 methodology.className="sli-ruptl-prov-warning";
 const controls=el("div");controls.className="sli-ruptl-prov-filters";
 const regions=el("select"),tech=el("select"),status=el("select"),q=el("input");
 q.type="search";q.placeholder="Cari nama proyek / wilayah / sistem";
 option(regions,"Semua wilayah lampiran","");option(tech,"Semua teknologi","");option(status,"Semua status rencana","")
 const geographic=data.geographic_appendix_coverage.subsections.map(x=>x.geographic_heading);
 const subset=[...new Set(all.map(x=>x.appendix_geography))];
 subset.sort((a,b)=>a.localeCompare(b,"id")).forEach(x=>option(regions,x,x));
 [...new Set(all.map(x=>x.technology))].sort().forEach(x=>option(tech,x,x));
 [...new Set(all.map(x=>x.status_as_printed_2025))].sort().forEach(x=>option(status,x,x));
 for(const [lab,n] of [["Wilayah sumber",regions],["Teknologi",tech],["Tahap RUPTL 2025",status],["Nama atau sistem",q]]){const l=el("label",lab);l.append(n);controls.append(l)}
 const count=el("p");count.className="sli-ruptl-prov-count";
 const scroller=el("div");scroller.className="sli-ruptl-prov-scroll";
 const coverage=el("details");const covTitle=el("summary","Lihat 34 sublampiran geografis dan cakupan pemeriksaan");const covDiv=el("div");covDiv.className="sli-ruptl-prov-scroll";coverage.append(covTitle,covDiv);
 const footer=el("p");footer.append("Sumber dasar: ",link(data.source.official_url,"RUPTL PLN 2025–2034 PDF resmi ↗"),". Tidak ada nilai realisasi yang diisi otomatis berdasarkan kalender COD.");
 root.replaceChildren(h,pre,summary,methodology,controls,count,scroller,coverage,footer);
 const head=["Wilayah lampiran","Nama menurut tabel","Teknologi","Kapasitas tercetak","Target COD ARED","Status rencana 2025","Realisasi terkini","COD aktual","Asal tabel/PDF"];
 const tabs=el("table"),th=el("thead"),tr=el("tr");head.forEach(x=>tr.append(el("th",x)));th.append(tr);tabs.append(th);
 const tb=el("tbody");tabs.append(tb);scroller.append(tabs);
 const coverageTable=el("table"),cHead=el("thead"),cr=el("tr");
 ["Sublampiran","Cakupan administratif sebagaimana tertulis","PDF halaman","Baris sampel"].forEach(x=>cr.append(el("th",x)));cHead.append(cr);
 const cBody=el("tbody");
 data.geographic_appendix_coverage.subsections.forEach(x=>{const rr=el("tr");const num=all.filter(y=>y.annex_id===x.annex_id).length;
 rr.append(el("td",x.annex_id),el("td",x.geographic_heading));
 const c=el("td");c.append(link(data.source.official_url+"#page="+x.pdf_page,String(x.pdf_page)));rr.append(c,el("td",num?String(num)+" sampel":"Belum ditinjau rinci"));cBody.append(rr)});
 coverageTable.append(cHead,cBody);covDiv.append(coverageTable);
 function renderRows(){
  const term=q.value.toLowerCase().trim();
  const rows=all.filter(x=>(!regions.value||x.appendix_geography===regions.value)&&(!tech.value||x.technology===tech.value)&&(!status.value||x.status_as_printed_2025===status.value)&&(!term||[x.source_project_label,x.appendix_geography,x.source_power_system||""].some(s=>s.toLowerCase().includes(term))));
  count.textContent="Ditampilkan "+rows.length+" / "+all.length+" baris sampel bersumber. Nilai realisasi tidak tersedia ≠ 0.";
  tb.replaceChildren();
  for(const x of rows){
   const tr=el("tr");[x.appendix_geography,x.source_project_label,x.technology,x.capacity_as_printed,x.planned_cod_ared,x.status_as_printed_2025].forEach(k=>tr.append(el("td",k)));
   const actual=el("td","Belum terverifikasi");actual.className="sli-ruptl-prov-unknown";
   const cod=el("td",x.verified_actual_cod===null?"—":x.verified_actual_cod);const source=el("td");source.append(x.table+" · ",link(data.source.official_url+"#page="+x.pdf_page,"PDF "+x.pdf_page+" ↗"));
   tr.append(actual,cod,source);tb.append(tr);
  }
  if(window.SLIVisualExport?.register){
   window.SLIVisualExport.register(tabs,{
    getData:()=>({headers:["Appendix grouping","Source project label","Technology","Printed capacity","Parsed simple MW (null for uncertain/composite)","Planned COD ARED","2025 source stage","Actual status (null=unverified)","Actual COD (null=unverified)","Annex/table","Original PDF page"],
    rows:rows.map(x=>[x.appendix_geography,x.source_project_label,x.technology,x.capacity_as_printed,x.capacity_mw,x.planned_cod_ared,x.status_as_printed_2025,x.operational_status_2026,x.verified_actual_cod,x.table,x.pdf_page]),
    kind:"verified-provider"}),
    getMeta:()=>({title:"RUPTL 2025–2034 source-reviewed project sample: plan versus unverified realization",
     source:data.source.doc,sourceUrl:data.source.official_url,period:"2025–2034 planning horizon; as published May 2025",
     completeness:"ONLY "+rows.length+" filtered manually selected source rows. No verified realization or actual COD. Appendix geographic grouping is NOT verified project site. NULL not zero; national registry incomplete."})
   });
  }
 }
 for(const x of [regions,tech,status])x.addEventListener("change",renderRows);
 q.addEventListener("input",renderRows);
 document.addEventListener("sli:exportready",renderRows);
 renderRows();
}
Promise.all([fetch(P,{cache:"no-store"}).then(x=>{if(!x.ok)throw Error("Province HTTP "+x.status);return x.json()}),fetch(O,{cache:"no-store"}).then(x=>{if(!x.ok)throw Error("Previous source HTTP "+x.status);return x.json()})])
.then(([data,legacy])=>roots.forEach(x=>render(x,data,legacy)))
.catch(err=>roots.forEach(x=>{x.textContent="Katalog proyek per lampiran belum dapat dimuat: "+String(err.message)}));
})();