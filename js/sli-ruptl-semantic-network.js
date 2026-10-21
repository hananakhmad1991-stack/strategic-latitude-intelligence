/* Full original RUPTL semantic review, source-led 2026 milestones, and network table source cells. */
(()=>{"use strict";
const roots=[...document.querySelectorAll("[data-sli-ruptl-semantic-network]")];
if(!roots.length)return;
const base="./data/",urlPDF="https://gatrik.esdm.go.id/gatrik/gatrik-api/storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf";
const $=(tag,value,css)=>{const x=document.createElement(tag);if(value!==undefined&&value!==null)x.textContent=String(value);if(css)x.className=css;return x};
function a(url,label){const x=$("a",label);x.href=url;x.target="_blank";x.rel="noopener noreferrer";return x}
const integer=x=>Number(x).toLocaleString("id-ID");
function selector(title,options){const x=$("select");x.setAttribute("aria-label",title);for(const [label,value] of options){const o=$("option",label);o.value=value;x.append(o)}return x}
async function fetchJSON(path){const r=await fetch(base+path,{cache:"no-store"});if(!r.ok)throw Error(path+" HTTP "+r.status);return r.json()}
function table(header){const t=$("table"),h=$("thead"),tr=$("tr"),body=$("tbody");header.forEach(s=>tr.append($("th",s)));h.append(tr);t.append(h,body);return {table:t,body}}
function buildPager(filter,{onRow,pageSize=30}={}){
 const out=$("div"),scroller=$("div",null,"sem-scroller"),{table:tab,body}=table(["Referensi","Isi sumber / hasil kandidat","Asal / status"]);
 scroller.append(tab);const actions=$("div",null,"sem-actions"),previous=$("button","← Sebelumnya"),next=$("button","Berikutnya →"),count=$("span");
 for(const b of [previous,next])b.type="button";actions.append(previous,count,next);out.append(scroller,actions);
 let records=[],page=0;
 function draw(){
  page=Math.max(0,Math.min(page,Math.max(0,Math.ceil(records.length/pageSize)-1)));
  body.replaceChildren();const slice=records.slice(page*pageSize,(page+1)*pageSize);
  for(const r of slice){const tr=$("tr");for(const cell of onRow(r)){const td=$("td");if(typeof cell==="string"||typeof cell==="number"||cell===null)td.textContent=String(cell??"—");else td.append(cell);tr.append(td)}body.append(tr)}
  if(!slice.length){const tr=$("tr"),td=$("td","Tidak ada hasil untuk filter ini.");td.colSpan=3;tr.append(td);body.append(tr)}
  count.textContent=(records.length?integer(page*pageSize+1):"0")+"–"+integer(Math.min((page+1)*pageSize,records.length))+" / "+integer(records.length)+" baris";
  previous.disabled=page===0;next.disabled=(page+1)*pageSize>=records.length;
 }
 previous.addEventListener("click",()=>{page--;draw()});next.addEventListener("click",()=>{page++;draw()});
 return {out,setRows(rows){records=filter?rows.filter(filter):rows;page=0;draw()},getRows(){return records}};
}
function surface(parent,name,hint,loader){
 const det=$("details"),title=$("summary",name),body=$("div");body.append($("p",hint,"semantic-intro"));det.append(title,body);
 let started=false;
 det.addEventListener("toggle",()=>{if(!det.open||started)return;started=true;loader(body).catch(e=>body.append($("p","Data sumber belum dapat dibaca: "+e.message,"semantic-warning")))});
 parent.append(det);
}
function summary(root,model){
 const header=$("div");
 header.append($("h2","RUPTL · Inventaris semantik dan realisasi"),$("p","Telusuri proyek, kuota wilayah, tabel transmisi/gardu/distribusi, dan perkembangan resmi 2026. Semua data RUPTL tetap berstatus rencana hingga ada sumber aktual yang cocok.","semantic-intro"));
 const stats=$("div",null,"semantic-grid");
 [["Halaman sumber resmi","1.253"],["Baris kandidat pembangkit","970"],["Lampiran geografis","34"],["Baris sumber diperiksa","92"],["Realisasi nasional 2026","Belum lengkap"],["COD otomatis dari target","0"]].forEach(([lab,value])=>{const x=$("div");x.append($("small",lab),$("strong",value));stats.append(x)});
 const notice=$("p","Peringatan: baris tabel bukan identitas proyek; aktivitas pada tahun 2026 tidak otomatis menjadi COD. MW, MWp, MWh, kV, kms, dan MVA tidak dapat disamakan. Angka nasional yang dipublikasikan di grafik utama tetap target RUPTL, bukan jumlah proyek baru beroperasi.","semantic-warning");
 root.append(header,stats,notice);
}
function eventList(root){
 const section=$("div",null,"sem-evidence");
 const info=$("p","Sumber peristiwa PLN/ESDM bertanggal, dibedakan antara eksplorasi, penggenangan, tender, perjanjian kerja sama dan pemberian tegangan.","semantic-intro");
 root.append($("h3","Target rencana dibanding bukti bertanggal 2026"),info,section);
 return fetchJSON("sli-ruptl-2026-independent-primary-milestones.json").then(d=>{
  if(d.schema!=="sli-ruptl-2026-independent-primary-milestones-v1"||d.validated_2026_individual_plant_cod_event_count_from_this_dataset!==0)throw Error("2026 primary evidence schema mismatch");
  for(const e of d.events){
   const card=$("article",null,"sem-event");
   card.append($("small",e.observed_date+" · "+e.source_agency),$("strong",e.project),$("p",e.observed_status));
   if(e.original_ruplt_source){const z=e.original_ruplt_source;card.append($("p","RUPTL "+z.table+" · PDF "+z.pdf_page+" · target COD "+z.planned_ared_cod_year+" · kapasitas rencana "+z.printed_planned_capacity_mw+" MW"))}
   card.append($("p",e.comparability),a(e.source_url,"Bukti instansi resmi ↗"));
   section.append(card);
  }
 });
}
function semanticRows(body){
 return fetchJSON("sli-ruptl-970-semantic-candidates-2025.json").then(d=>{
  if(d.schema!=="sli-ruptl-970-semantic-candidate-ledger-v1"||d.rows.length!==970||d.counters.verified_distinct_physical_assets_from_machine_extract!==0)throw Error("Semantic row guard failed");
  const line=$("p","Terbaca: "+integer(d.counters.recognized_technology)+" teknologi; "+integer(d.counters.candidate_name_present)+" label kandidat; "+integer(d.counters.program_quota_area_candidates)+" kuota/program; "+integer(d.counters.name_collision_candidates)+" label bentrok potensial. Yang cocok secara unik dengan 92 baris terkurasi: "+integer(d.counters.curated_sample_matched_uniquely)+". Semuanya masih kandidat identitas kecuali verifikasi sumber baris tersendiri.","semantic-intro");
  body.append(line);
  const q=$("input"),m=selector("Kelas data",[["Semua jenis",""],["Kuota/program","program_quota_or_area"],["Label proyek bernama","named_source_label_not_distinct_asset"],["Nama tidak terbaca","unresolved_source_cell"]]),
  n=selector("Tinjauan nama",[["Semua kandidat",""],["Nama duplikat potensial","duplicates"],["Sampel cocok terkurasi","curated"]]);
  q.type="search";q.placeholder="Cari nama, teknologi atau tabel asli";q.setAttribute("aria-label","Cari kandidat pembangkit dari PDF");
  const regionOptions=[["Semua wilayah RUPTL",""],...Array.from(new Set(d.rows.map(r=>r.annex_id))).sort().map(id=>[id,id])];
  const region=selector("Wilayah sumber RUPTL",regionOptions);
  const ctrls=$("div",null,"sem-controls");ctrls.append(q,region,m,n);body.append(ctrls);
  const pager=buildPager(null,{onRow:r=>[
    a(urlPDF+"#page="+r.source_pdf_page,r.annex_id+" · "+r.source_table+" p"+r.source_pdf_page),
    (()=>{const x=$("div");x.append($("strong",r.source_label_candidate||"Label tidak terbaca"),
       $("div",String(r.technology_candidate||"Teknologi belum jelas")+" · "+String(r.record_kind_candidate).replaceAll("_"," ")),
       $("small","Sel kapasitas mesin: "+String(r.capacity_source_cell_unreviewed??"—")+" · "+(r.sample_source_row_match_id?"sampel terkurasi "+r.sample_source_row_match_id:"belum cocok sampel")));return x})(),
    (r.name_collision_not_proof_same_asset?"Nama serupa muncul berulang; identitas BELUM digabung": "Identitas fasilitas BELUM terverifikasi")
  ]});
  body.append(pager.out);
  function filt(){
   const term=q.value.trim().toLocaleLowerCase("id-ID");
   pager.setRows(d.rows.filter(r=>(!region.value||r.annex_id===region.value)&&(!m.value||r.record_kind_candidate===m.value)
     &&(!n.value||(n.value==="duplicates"?r.name_collision_not_proof_same_asset:!!r.sample_source_row_match_id))
     &&(!term||[r.source_label_candidate,r.annex_id,r.technology_candidate,r.source_table].join(" ").toLocaleLowerCase("id-ID").includes(term))));
  }
  [m,n].forEach(x=>x.addEventListener("change",filt));q.addEventListener("input",filt);
  region.addEventListener("change",()=>{
    filt();
    if(region.value)document.dispatchEvent(new CustomEvent("sli:ruptl-region-selected",{detail:{annex_id:region.value}}));
  });
  document.addEventListener("sli:ruptl-region-focus",e=>{
    const id=e.detail?.annex_id;
    if(id&&regionOptions.some(x=>x[1]===id)){region.value=id;filt();}
  });
  filt();
 });
}
function networkRows(body){
 return Promise.all([fetchJSON("sli-ruptl-1253-page-table-inventory-review.json"),fetchJSON("sli-ruptl-network-table-grids-review.json")]).then(([inv,grid])=>{
  if(inv.schema!=="sli-ruptl-all-1253-pages-table-headings-v1"||inv.page_count_audited!==1253||grid.schema!=="sli-ruptl-network-source-tables-raw-grid-review-v1"||grid.published_network_asset_count!==0)throw Error("Network audit full-PDF guard failed");
  body.append($("p","Diindeks: "+integer(inv.original_table_heading_candidates)+" judul tabel kandidat dari 1.253 halaman. "+integer(inv.network_table_heading_candidates)+" judul terkait transmisi/gardu/distribusi; "+integer(grid.pages_with_source_cells)+" halaman mempunyai hasil ekstraksi grid yang dapat ditinjau. Sisa halaman grid yang belum diproses: "+grid.remaining_pages_not_grid_parsed+".","semantic-intro"));
  const topics=["transmission","substations","distribution"];
  const typ=selector("Kelompok infrastruktur",[["Semua jaringan dan distribusi",""],["Transmisi","transmission"],["Gardu induk","substations"],["Distribusi","distribution"]]),
   q=$("input");q.type="search";q.placeholder="Cari nomor atau judul tabel";q.setAttribute("aria-label","Cari tabel RUPTL semua halaman");
  const ctrls=$("div",null,"sem-controls");ctrls.append(typ,q);body.append(ctrls);
  const gridByPage=new Map(grid.pages.map(g=>[g.pdf_page,g]));
  const relevant=inv.table_headings.filter(x=>x.topic_candidates.some(t=>topics.includes(t)));
  const pager=buildPager(null,{onRow:r=>[
    a(urlPDF+"#page="+r.pdf_page,"PDF "+r.pdf_page+" · Tabel "+r.table),
    (()=>{const x=$("div");x.append($("strong",r.title_as_extracted||r.nearby_text_as_extracted||"Judul terbaca sebagian"),
      $("small","Jenis: "+r.topic_candidates.join(", ")));return x})(),
    gridByPage.has(r.pdf_page)
      ?("Grid asli: "+gridByPage.get(r.pdf_page).grids.length+" tabel, raw source cells tersedia")
      :"Belum diperiksa sel tabel per kolom"
  ]});
  body.append(pager.out);
  const rawDetail=$("details"),rawSummary=$("summary","Lihat sel sumber asli untuk halaman tabel terpilih"),rawPanel=$("div");
  const p=selector("Halaman dengan ekstraksi grid",grid.pages.map(x=>["Halaman PDF "+x.pdf_page+" · "+x.grids.length+" grid",String(x.pdf_page)]));
  const preview=$("div",null,"sem-scroller");rawPanel.append(p,preview);rawDetail.append(rawSummary,rawPanel);body.append(rawDetail);
  function rawPage(){
   const page=gridByPage.get(Number(p.value));if(!page){preview.textContent="Belum ada grid.";return}
   preview.replaceChildren();
   if(page.error)preview.append($("p","Parser: "+page.error));
   for(const gr of page.grids.slice(0,8)){
    const d=$("details");d.append($("summary","Grid #"+gr.grid_index+" · "+gr.rows.length+" baris sumber"));
    const txt=$("pre",gr.rows.slice(0,40).map(row=>JSON.stringify(row)).join("\n"),"sem-cell");
    d.append(txt);preview.append(d);
   }
  }
  p.addEventListener("change",rawPage);rawPage();
  function filt(){const qv=q.value.trim().toLocaleLowerCase("id-ID");
   pager.setRows(relevant.filter(x=>(!typ.value||x.topic_candidates.includes(typ.value))&&(!qv||[x.table,x.title_as_extracted,x.nearby_text_as_extracted].join(" ").toLocaleLowerCase("id-ID").includes(qv))))}
  typ.addEventListener("change",filt);q.addEventListener("input",filt);filt();
 });
}
for(const root of roots){
 root.classList.add("sli-ruptl-semantic");
 summary(root);
 eventList(root).catch(e=>root.append($("p","Bukti 2026 tidak dapat dimuat: "+e.message,"semantic-warning")));
 surface(root,"970 baris · klasifikasi semantik, kuota, nama berulang dan rekonsiliasi sampel",
  "Berisi kandidat semantik dengan jejak nomor tabel, halaman asli dan status tinjauan. Tidak memuat dugaan angka realisasi.",semanticRows);
 surface(root,"1.253 halaman · tabel transmisi, gardu induk, dan distribusi",
  "Inventaris semua halaman berikut sel tabel jaringan tersimpan sebagai review-only. Halaman dan tabel asli tetap dapat dibuka.",networkRows);
}
})();