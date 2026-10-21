/* PLN RUPTL status event ledger: original press-evidence only, never invented dates */
(()=>{"use strict";
const roots=[...document.querySelectorAll("[data-sli-ruptl-official-timeline]")];if(!roots.length)return;
const P="./data/sli-ruptl-project-progress-primary-evidence.json",S="./data/sli-ruptl-official-inauguration-slo-2025.json";
const el=(name,txt)=>{const n=document.createElement(name);if(txt!==undefined)n.textContent=String(txt);return n};
const sourceLink=(url,label)=>{const n=el("a",label);n.href=url;n.target="_blank";n.rel="noopener noreferrer";return n};
const validDay=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s);
function ledger(d){
 if(d.schema!=="sli-ruptl-project-official-progress-evidence-v1")throw Error("source evidence schema changed");
 const cod=new Map();
 for(const x of d.observations){
  if(x.source_event_type!=="commercial_operations_confirmed_at_plant_complex"&&x.source_event_type!=="commercial_operation_date_confirmed")continue;
  if(!validDay(x.source_event_date))throw Error("invalid exact COD day");
  const key=x.facility_group+"|"+x.source_event_date;
  if(!cod.has(key))cod.set(key,{key,label:x.facility_group,date:x.source_event_date,type:"facility_cod",
   type_id:"COD fasilitas",publisher:x.source_publisher,url:x.source_url,
   details:x.facility_group==="PLTU Jawa 9 & 10"?"COD kompleks Jawa 9 & 10; jangan anggap ini tanggal COD unit individual.":"COD PLTS Bali Timur; kapasitas operator dalam MWp bukan MW AC RUPTL.",
   row_ids:[]});
  cod.get(key).row_ids.push(x.project_sample_id);
 }
 const dated=[...cod.values()];
 for(const x of d.related_not_plant_cod){
  if(!x.never_promote_to_power_plant_operational_status)throw Error("transmission source missing guard");
  if(!validDay(x.source_event_date))throw Error("invalid grid milestone");
  dated.push({key:"grid|"+x.source_event_date,label:"Jaringan transmisi terkait "+x.source_project_label,
   date:x.source_event_date,type:"related_grid_not_powerplant",type_id:"Pengoperasian jaringan (bukan COD pembangkit)",
   publisher:x.source_publisher,url:x.source_url,details:x.interpretation,row_ids:[]});
 }
 dated.sort((a,b)=>a.date.localeCompare(b.date)||a.type.localeCompare(b.type));
 const periodOnly=d.observations.filter(x=>x.source_event_type==="recorded_new_renewable_generation_capacity_first_half_2025")
 .map(x=>({label:x.facility_group,date:null,period:x.reporting_period,type:"period_capacity_addition",
  type_id:"Laporan penambahan kapasitas (periode)",publisher:x.source_publisher,url:x.source_url,
  details:"ESDM mencatat PLTA Merangin 492 MW pada semester I 2025, sementara RUPTL merencanakan 350 MW. Definisi kapasitas belum sebanding; tanggal COD unit tidak terverifikasi.",row_ids:[x.project_sample_id]}));
 if(dated.filter(x=>x.type==="facility_cod").length!==2||periodOnly.length!==1)
  throw Error("Expected 2 facility COD milestones and 1 reporting-period observation");
 return {dated,periodOnly};
}
function display(root,d,supplement){
 if(supplement.schema!=="sli-ruplt-primary-official-project-event-supplement-2025-v1"||supplement.events.length!==5||supplement.new_events_actual_cod_confirmed!==0)throw Error("Supplement source/cod constraints failed");
 const data=ledger(d);
 const extra=supplement.events.map(x=>{
  if((x.event_date!==null&&!validDay(x.event_date))||(x.event_date===null&&!/^\d{4}-\d{2}$/.test(x.event_period||"")))throw Error("Unverified event time precision");
  if(x.verified_actual_cod!==null)throw Error("SLO or inauguration cannot be treated as COD");
  const type=x.event_type==="government_inauguration_not_commercial_cod"?"official_inauguration_not_cod":"slo_certificate_not_cod";
  return {date:x.event_date,period:x.event_period,label:x.site,type,
    type_id:type==="official_inauguration_not_cod"?"Peresmian resmi (bukan COD)":"Sertifikat laik operasi / SLO (bukan COD)",
    publisher:x.event_source_publisher,url:x.event_primary_source_url,
    details:x.event_claim+". Batasan: "+x.quality_note,row_ids:[x.original_table+" PDF "+x.original_pdf_page+" row "+x.original_source_row_no]};
 });
 const all=[...data.dated,...data.periodOnly,...extra];
 all.sort((a,b)=>(a.date||a.period||"").localeCompare(b.date||b.period||"")||a.type.localeCompare(b.type));
 if(all.length!==9||extra.filter(x=>x.type==="official_inauguration_not_cod").length!==3||extra.filter(x=>x.type==="slo_certificate_not_cod").length!==2)throw Error("Event-count or classification mismatch");
 root.classList.add("sli-ruptl-timeline");
 const title=el("h2","Riwayat bukti proyek RUPTL · Peristiwa terverifikasi");
 const desc=el("p","Peristiwa bersumber dari operator/PLN/ESDM dan diberi tanggal atau periode yang benar-benar disebut. Ini hanya proyek sampel yang berhasil dicocokkan, bukan grafik progres nasional seluruh proyek RUPTL.");
 const badges=el("div");badges.className="sli-ruptl-timeline-stats";
 for(const [label,value] of [["COD fasilitas berbeda (bertanggal)",2],["Kejadian jaringan terkait (bukan COD)",1],["Laporan berperiode tanpa COD spesifik",1],["Peresmian (bukan COD)",3],["SLO (bukan COD)",2],["Total peristiwa unik",9]]){
  const s=el("div");s.append(el("small",label),el("strong",value));badges.append(s)}
 const controls=el("div");controls.className="sli-ruptl-timeline-filters";
 const filter=el("select");[["Semua jenis bukti",""],["COD fasilitas","facility_cod"],["Jaringan terkait (bukan COD)","related_grid_not_powerplant"],["Penambahan kapasitas per periode","period_capacity_addition"],["Peresmian resmi, bukan COD","official_inauguration_not_cod"],["SLO resmi, bukan COD","slo_certificate_not_cod"]].forEach(([label,id])=>{const x=el("option",label);x.value=id;filter.append(x)});
 const label=el("label","Jenis perkembangan");label.append(filter);controls.append(label);
 const warning=el("p","COD kompleks Jawa-9/10 dihitung sekali sebagai satu fasilitas; tanggal COD unitnya tidak dipetakan. PLTS Bali Timur dilaporkan dalam MWp. Merangin memiliki perbedaan basis 350 MW vs 492 MW. Bukti pengoperasian SUTET Sumsel-1 tidak berarti PLTU Sumsel-1 telah COD. Peresmian PLTS IKN, PLTA Asahan III dan PLTP Ijen bukan tanggal COD. SLO Ijen dan Lumut Balai bukan COD; tanggal SLO Ijen diketahui bulannya saja.");
 warning.className="sli-ruptl-timeline-warning";
 const list=el("div");list.className="sli-ruptl-timeline-events";
 const table=el("table"),thead=el("thead"),tr=el("tr");
 ["Tanggal / periode","Fasilitas / terkait","Jenis peristiwa","Sumber primer","Batas interpretasi"].forEach(t=>tr.append(el("th",t)));
 thead.append(tr);const body=el("tbody");table.append(thead,body);
 const scroll=el("div");scroll.className="sli-ruptl-timeline-scroll";scroll.append(table);
 const state=el("p");state.className="sli-ruptl-timeline-count";
 root.replaceChildren(title,desc,badges,warning,controls,state,scroll);
 function draw(){
  const shown=all.filter(x=>!filter.value||x.type===filter.value);
  state.textContent=shown.length+" / "+all.length+" bukti sejarah berbeda ditampilkan. Tanggal yang hanya diketahui bulan/semester tidak diberi hari fiktif. Peresmian, SLO, operasi jaringan dan COD adalah jenis kejadian yang berbeda.";
  body.replaceChildren();
  for(const x of shown){
   const row=el("tr");const date=el("td",x.date||x.period+" (tanpa tanggal unit)");
   const cat=el("td",x.label),type=el("td",x.type_id);
   const linkTd=el("td");linkTd.append(sourceLink(x.url,x.publisher+" ↗"));
   row.append(date,cat,type,linkTd,el("td",x.details));body.append(row)
  }
  if(window.SLIVisualExport?.register)window.SLIVisualExport.register(table,{
    getData:()=>({headers:["Date if exact (null otherwise)","Reporting period (null if exact)","Facility","Event class","Primary source publisher","Official source URL","Limitations","Matched sample row IDs"],
      rows:shown.map(x=>[x.date||null,x.period||null,x.label,x.type,x.publisher,x.url,x.details,x.row_ids.join(";")]),kind:"verified-provider"}),
    getMeta:()=>({title:"SLI PLN RUPTL source-confirmed event timeline (not national realization rates)",source:"Dated PLN/ESDM/operator primary reports linked per observation",
      sourceUrl:"https://gatrik.esdm.go.id/gatrik/gatrik-api/storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf",
      period:"2025 operator/agency milestone evidence",
      completeness:"9 unique dated/period source events: 2 separate facility CODs (Jawa 9/10 complex once), 1 transmission energization NOT plant COD, 1 Merangin H1 only, 3 plant inaugurations, 2 plant SLO reports (Ijen month-only). An inaugural/SLO date is NOT an actual COD. Not a national realization count."})
  });
 }
 filter.addEventListener("change",draw);document.addEventListener("sli:exportready",draw);draw();
}
Promise.all([fetch(P,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Source HTTP "+r.status);return r.json()}),fetch(S,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Supplement HTTP "+r.status);return r.json()})])
 .then(([d,supplement])=>roots.forEach(root=>display(root,d,supplement))).catch(e=>roots.forEach(root=>{root.textContent="Riwayat perkembangan RUPTL tidak tersedia: "+String(e.message)}));
})();