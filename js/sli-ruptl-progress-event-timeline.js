/* PLN RUPTL status event ledger: original press-evidence only, never invented dates */
(()=>{"use strict";
const roots=[...document.querySelectorAll("[data-sli-ruptl-official-timeline]")];if(!roots.length)return;
const P="./data/sli-ruptl-project-progress-primary-evidence.json";
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
function display(root,d){
 const data=ledger(d),all=[...data.dated,...data.periodOnly];
 root.classList.add("sli-ruptl-timeline");
 const title=el("h2","Riwayat bukti proyek RUPTL · Peristiwa terverifikasi");
 const desc=el("p","Peristiwa bersumber dari operator/PLN/ESDM dan diberi tanggal atau periode yang benar-benar disebut. Ini hanya proyek sampel yang berhasil dicocokkan, bukan grafik progres nasional seluruh proyek RUPTL.");
 const badges=el("div");badges.className="sli-ruptl-timeline-stats";
 for(const [label,value] of [["COD fasilitas berbeda (bertanggal)",2],["Kejadian jaringan terkait (bukan COD)",1],["Laporan berperiode tanpa COD spesifik",1],["Total peristiwa unik",4]]){
  const s=el("div");s.append(el("small",label),el("strong",value));badges.append(s)}
 const controls=el("div");controls.className="sli-ruptl-timeline-filters";
 const filter=el("select");[["Semua jenis bukti",""],["COD fasilitas","facility_cod"],["Jaringan terkait (bukan COD)","related_grid_not_powerplant"],["Penambahan kapasitas per periode","period_capacity_addition"]].forEach(([label,id])=>{const x=el("option",label);x.value=id;filter.append(x)});
 const label=el("label","Jenis perkembangan");label.append(filter);controls.append(label);
 const warning=el("p","COD kompleks Jawa-9/10 dihitung sekali sebagai satu fasilitas; tanggal COD unitnya tidak dipetakan. PLTS Bali Timur dilaporkan dalam MWp. Merangin memiliki perbedaan basis 350 MW vs 492 MW. Bukti pengoperasian SUTET Sumsel-1 tidak berarti PLTU Sumsel-1 telah COD.");
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
  state.textContent=shown.length+" bukti unik ditampilkan. Kolom yang tidak tersedia bukan nol; tanggal yang hanya diketahui semesternya tidak diberi hari fiktif.";
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
      completeness:"Exactly 2 distinct COD facility evidence events, 1 transmission milestone excluded from plant COD, and 1 semester-only generation-additions report. Jawa 9/10 combined COD counted once. Not representative of full 2025–2034 RUPTL implementation."})
  });
 }
 filter.addEventListener("change",draw);document.addEventListener("sli:exportready",draw);draw();
}
fetch(P,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Source HTTP "+r.status);return r.json()})
 .then(d=>roots.forEach(root=>display(root,d))).catch(e=>roots.forEach(root=>{root.textContent="Riwayat perkembangan RUPTL tidak tersedia: "+String(e.message)}));
})();