/* PLN RUPTL 2025 plan by geographic appendix: candidate source rows, NOT observed operation. */
(()=>{"use strict";
const roots=[...document.querySelectorAll("[data-sli-ruptl-provincial]")];if(!roots.length)return;
const P="./data/sli-ruptl-provincial-source-projects-2025.json",O="./data/sli-ruptl-primary-pdf-2025-2034.json",E="./data/sli-ruptl-project-progress-primary-evidence.json";
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
function render(root,data,legacy,evidence){
 if(evidence.schema!=="sli-ruptl-project-official-progress-evidence-v1"||evidence.approved_attribution_count!==4)throw Error("Independent current milestone evidence mismatch");
 const evidenceMap=new Map(evidence.observations.map(x=>[x.project_sample_id,x]));
 if(data.schema!=="sli-ruptl-provincial-source-projects-2025-v1"||data.source_rows.length!==35||data.geographic_appendix_coverage.subsections.length!==34)throw Error("Source review dataset schema mismatch");
 const old=legacy.individual_project_source_records.records.map(normalizeExisting);
 const all=[...old,...data.source_rows]; // disjoint original source row selections; NOT national roster
 root.classList.add("sli-ruptl-provincial");
 const h=el("h2","RUPTL · Proyek per wilayah lampiran dan rencana vs realisasi");
 const pre=el("p","Katalog audit sumber dari PDF RUPTL yang disahkan pada 2025. "+all.length+" baris sampel dari tabel asli; tidak mewakili seluruh proyek nasional. Wilayah lampiran bukan koordinat proyek.");
 const summary=el("div");summary.className="sli-ruptl-province-summary";
 [["Sublampiran geografis",34],["Baris proyek sampel",all.length],["Wilayah lampiran dengan sampel",new Set(all.map(x=>x.annex_id)).size],["Baris dengan bukti resmi",evidenceMap.size+" / "+all.length+" sampel"]].forEach(([a,b])=>{const c=el("div");c.append(el("small",a),el("strong",b));summary.append(c)});
 const methodology=el("p","PERBEDAAN PENTING: Target COD dan status dokumen tahun 2025 bukan bukti COD aktual, penyerahan operasi, atau konstruksi pada Oktober 2026. Kolom data realisasi kosong berarti BELUM DIVERIFIKASI, bukan proyek gagal atau realisasi nol. Bukti Jawa-9/10 adalah COD kompleks gabungan (tanggal unit masing-masing tidak ditentukan). Bukti Bali Timur memakai MWp yang tidak langsung setara dengan MW RUPTL. PLTA Merangin 350 MW (rencana) versus 492 MW (laporan ESDM) memiliki perbedaan definisi kapasitas yang BELUM direkonsiliasi.");
 methodology.className="sli-ruptl-prov-warning";
 const controls=el("div");controls.className="sli-ruptl-prov-filters";
 const regions=el("select"),tech=el("select"),status=el("select"),actualFilter=el("select"),q=el("input");
 q.type="search";q.placeholder="Cari nama proyek / wilayah / sistem";
 option(regions,"Semua wilayah lampiran","");option(tech,"Semua teknologi","");option(status,"Semua status rencana","");option(actualFilter,"Semua status realisasi","");option(actualFilter,"Ada bukti milestone resmi","verified");option(actualFilter,"Belum ditemukan bukti yang sesuai","unknown");
 if(data.geographic_appendix_coverage.original_project_table_headings_located!==34||data.geographic_appendix_coverage.subsections.some(x=>!x.project_table_number||!x.project_table_pdf_page))throw Error("All-34 source table locator metadata incomplete");
 const scan=data.geographic_appendix_coverage.all_annex_source_grid_scan;
 if(!scan||scan.raw_numbered_grid_row_candidates!==970||scan.approved_project_records_from_this_scan!==0)throw Error("Unreviewed scan totals or publication guard changed");
 const subset=[...new Set(all.map(x=>x.appendix_geography))];
 subset.sort((a,b)=>a.localeCompare(b,"id")).forEach(x=>option(regions,x,x));
 [...new Set(all.map(x=>x.technology))].sort().forEach(x=>option(tech,x,x));
 [...new Set(all.map(x=>x.status_as_printed_2025))].sort().forEach(x=>option(status,x,x));
 for(const [lab,n] of [["Wilayah sumber",regions],["Teknologi",tech],["Tahap RUPTL 2025",status],["Bukti realisasi",actualFilter],["Nama atau sistem",q]]){const l=el("label",lab);l.append(n);controls.append(l)}
 const count=el("p");count.className="sli-ruptl-prov-count";
 const scroller=el("div");scroller.className="sli-ruptl-prov-scroll";
 const coverage=el("details");const covTitle=el("summary","Lihat 34 tabel proyek asli: nomor tabel, halaman PDF, 970 kandidat mentah");const covDiv=el("div");covDiv.className="sli-ruptl-prov-scroll";coverage.append(covTitle,covDiv);
 const footer=el("p");footer.append("Sumber dasar: ",link(data.source.official_url,"RUPTL PLN 2025–2034 PDF resmi ↗")," · ",link(scan.run,"Audit ekstraksi semua 34 sublampiran ↗"),". Jumlah 970 adalah baris grid calon hasil mesin, BUKAN proyek individual tervalidasi. Tidak ada realisasi yang diisi otomatis dari target COD.");
 root.replaceChildren(h,pre,summary,methodology,controls,count,scroller,coverage,footer);
 const head=["Wilayah lampiran","Nama menurut tabel","Teknologi","Kapasitas tercetak","Target COD ARED","Status rencana 2025","Bukti perkembangan","COD aktual unit (jika terbukti)","Asal tabel/PDF"];
 const tabs=el("table"),th=el("thead"),tr=el("tr");head.forEach(x=>tr.append(el("th",x)));th.append(tr);tabs.append(th);
 const tb=el("tbody");tabs.append(tb);scroller.append(tabs);
 const coverageTable=el("table"),cHead=el("thead"),cr=el("tr");
 ["Sublampiran","Cakupan administratif sebagaimana tertulis","Awal lampiran","Tabel rencana pembangkit asli","Baris kandidat hasil mesin","Baris sampel diperiksa"].forEach(x=>cr.append(el("th",x)));cHead.append(cr);
 const cBody=el("tbody");
 data.geographic_appendix_coverage.subsections.forEach(x=>{const rr=el("tr");const num=all.filter(y=>y.annex_id===x.annex_id).length;
 rr.append(el("td",x.annex_id),el("td",x.geographic_heading));
 const c=el("td");c.append(link(data.source.official_url+"#page="+x.pdf_page,String(x.pdf_page)));const t=el("td");t.append(link(data.source.official_url+"#page="+x.project_table_pdf_page,"Tabel "+x.project_table_number+" · PDF "+x.project_table_pdf_page));rr.append(c,t,el("td",x.machine_candidate_numbered_grid_rows+" kandidat mentah (bukan proyek disetujui)"),el("td",num?String(num)+" baris proyek sampel":"Belum ditinjau sebagai baris proyek"));cBody.append(rr)});
 coverageTable.append(cHead,cBody);covDiv.append(coverageTable);
 function renderRows(){
  const term=q.value.toLowerCase().trim();
  const rows=all.filter(x=>(!regions.value||x.appendix_geography===regions.value)&&(!tech.value||x.technology===tech.value)&&(!status.value||x.status_as_printed_2025===status.value)&&(!actualFilter.value||(actualFilter.value==="verified"?evidenceMap.has(x.id):!evidenceMap.has(x.id)))&&(!term||[x.source_project_label,x.appendix_geography,x.source_power_system||""].some(s=>s.toLowerCase().includes(term))));
  count.textContent="Ditampilkan "+rows.length+" / "+all.length+" baris sampel, dengan "+rows.filter(x=>evidenceMap.has(x.id)).length+" baris punya bukti resmi. Nilai realisasi yang tidak ditemukan ≠ 0.";
  tb.replaceChildren();
  for(const x of rows){
   const tr=el("tr");[x.appendix_geography,x.source_project_label,x.technology,x.capacity_as_printed,x.planned_cod_ared,x.status_as_printed_2025].forEach(k=>tr.append(el("td",k)));
   const e=evidenceMap.get(x.id)||null;
   const actual=el("td",e?(e.source_event_type==="recorded_new_renewable_generation_capacity_first_half_2025"?"ESDM mencatat penambahan PLTA pada semester I 2025 (kapasitas 492 MW menurut laporan; RUPTL 350 MW, belum sebanding)":"COD dikonfirmasi dalam sumber operator ("+e.source_event_date+")"):"Belum ada bukti spesifik yang cocok");actual.className=e?"sli-ruptl-prov-evidence":"sli-ruptl-prov-unknown";
   if(e){actual.append(" · ",link(e.source_url,"Sumber primer ↗"));if(e.facility_group==="PLTU Jawa 9 & 10")actual.append(" · COD tingkat kompleks, bukan COD individual");if(e.capacity_source_unit==="MWp")actual.append(" · 25 MWp tidak langsung dibandingkan dengan 25 MW");if(e.capacity_comparability_to_ruptl==="blocked_pending_capacity_definition_and_asset_mapping_review")actual.append(" · Perbandingan kapasitas tidak boleh dihitung sampai definisi cocok");}
   const cod=el("td",e?.individually_attributed_actual_cod||"—");const source=el("td");source.append(x.table+" · ",link(data.source.official_url+"#page="+x.pdf_page,"PDF "+x.pdf_page+" ↗"));
   tr.append(actual,cod,source);tb.append(tr);
  }
  if(window.SLIVisualExport?.register){
   window.SLIVisualExport.register(tabs,{
    getData:()=>({headers:["Appendix grouping","Source project label","Technology","Printed capacity","Parsed simple MW (null for uncertain/composite)","Planned COD ARED","2025 source stage","Observed evidence milestone","Observed event date / reporting period","Individually attributed actual COD (null if unknown)","Primary evidence URL","Source capacity unit","Annex/table","Original PDF page"],
    rows:rows.map(x=>[x.appendix_geography,x.source_project_label,x.technology,x.capacity_as_printed,x.capacity_mw,x.planned_cod_ared,x.status_as_printed_2025,evidenceMap.get(x.id)?.observed_status??null,(evidenceMap.get(x.id)?.source_event_date??evidenceMap.get(x.id)?.reporting_period??null),evidenceMap.get(x.id)?.individually_attributed_actual_cod??null,evidenceMap.get(x.id)?.source_url??null,evidenceMap.get(x.id)?.capacity_source_unit??null,x.table,x.pdf_page]),
    kind:"verified-provider"}),
    getMeta:()=>({title:"RUPTL 2025–2034 provincial source-row sample: plan versus verified official milestone",
     source:data.source.doc,sourceUrl:data.source.official_url,period:"2025–2034 planning horizon; as published May 2025",
     completeness:"ONLY "+rows.length+" filtered source-row samples. "+rows.filter(x=>evidenceMap.has(x.id)).length+" have separately sourced dated milestones. Jawa-9 and Jawa-10 belong to ONE complex and do not have individually mapped unit COD dates. Bali Timur: source MWp differs from plan MW. Merangin 492 MW vs plan 350 MW cannot be compared arithmetically without methodology checks. Other statuses are null, not zero. Not a national registry."})
   });
  }
 }
 for(const x of [regions,tech,status,actualFilter])x.addEventListener("change",renderRows);
 q.addEventListener("input",renderRows);
 document.addEventListener("sli:exportready",renderRows);
 renderRows();
}
Promise.all([fetch(P,{cache:"no-store"}).then(x=>{if(!x.ok)throw Error("Province HTTP "+x.status);return x.json()}),fetch(O,{cache:"no-store"}).then(x=>{if(!x.ok)throw Error("Previous source HTTP "+x.status);return x.json()}),fetch(E,{cache:"no-store"}).then(x=>{if(!x.ok)throw Error("Evidence HTTP "+x.status);return x.json()})])
.then(([data,legacy,evidence])=>roots.forEach(x=>render(x,data,legacy,evidence)))
.catch(err=>roots.forEach(x=>{x.textContent="Katalog proyek per lampiran belum dapat dimuat: "+String(err.message)}));
})();