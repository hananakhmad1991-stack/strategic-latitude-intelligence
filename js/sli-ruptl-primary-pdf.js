/* Source-audited PLN RUPTL 2025–2034 plan, original PDF 1,253 pages. */
(()=>{"use strict";
const roots=[...document.querySelectorAll("[data-sli-ruptl-primary]")];if(!roots.length)return;
const PATH="./data/sli-ruptl-primary-pdf-2025-2034.json",NS="http://www.w3.org/2000/svg";
const el=(tag,value)=>{const z=document.createElement(tag);if(value!==undefined)z.textContent=String(value);return z};
const svg=(tag,attrs,txt)=>{const x=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([k,v])=>x.setAttribute(k,String(v)));if(txt!==undefined)x.textContent=String(txt);return x};
const fmt=(n,max=1)=>n===null||n===undefined?"—":Number(n).toLocaleString("id-ID",{maximumFractionDigits:max});
const paperLink=(d,page,label)=>{const a=el("a",label||"PDF sumber asli ↗");a.href=d.source.source_url+"#page="+page;a.target="_blank";a.rel="noopener noreferrer";return a};
function figure(title,desc){const box=el("section");box.className="sli-ruplt-figure";box.append(el("h3",title),el("p",desc));return box}
function attachExport(target,source,headers,rows,meta){
 if(!window.SLIVisualExport?.register)return;
 window.SLIVisualExport.register(target,{getData:()=>({headers,rows,kind:"verified-provider"}),getMeta:()=>({
  title:meta.title,source:source.source.title,sourceUrl:source.source.source_url,period:"2025–2034",
  completeness:meta.note+" Original source table "+meta.table+"; PDF page "+meta.pdf_page+". Original document is PLAN, not actual commissioning."})});
}
function legendRow(label,value){const r=el("span");r.className="sli-ruplt-metric";r.append(el("small",label),el("strong",value));return r}
function svgChart(valuesA,valuesB,years,labelA,labelB,unit){
 const W=890,H=312,L=64,R=20,T=26,B=54,all=[...valuesA,...valuesB].filter(v=>typeof v==="number"),max=Math.max(...all,1)*1.12;
 const chart=svg("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":labelA+" / "+labelB+" ("+unit+")"});
 const yy=n=>H-B-(n/max)*(H-T-B),x=i=>L+i*(W-L-R)/(years.length-1);
 for(let i=0;i<=4;i++){const value=max*i/4;const y=yy(value);
  chart.append(svg("line",{x1:L,y1:y,x2:W-R,y2:y,stroke:"#375770","stroke-dasharray":"4 6"}));
  chart.append(svg("text",{x:L-9,y:y+4,fill:"#d5e5f1","font-size":"12","text-anchor":"end"},fmt(value,0)));
 }
 years.forEach((year,i)=>chart.append(svg("text",{x:x(i),y:H-25,fill:"#d5e5f1","font-size":"12","text-anchor":"middle"},year)));
 const cats=[{data:valuesA,color:"#4ed4ce",label:labelA},{data:valuesB,color:"#e6b771",label:labelB}];
 cats.forEach(({data,color,label})=>{
  let path=[];function finish(){if(path.length>1)chart.append(svg("polyline",{points:path.join(" "),fill:"none",stroke:color,"stroke-width":3}));path=[];}
  data.forEach((value,i)=>{if(value===null){finish();return;}path.push(x(i)+","+yy(value));const c=svg("circle",{cx:x(i),cy:yy(value),r:5,fill:color,stroke:"#152d40","stroke-width":2,tabindex:0,"aria-label":String(years[i])+" "+label+" "+fmt(value)+" "+unit});c.append(svg("title",{},years[i]+" · "+label+": "+fmt(value)+" "+unit));chart.append(c)});
  finish();
 });
 return chart;
}
function build(root,d){
 if(d.schema!=="sli-ruptl-primary-pdf-2025-2034-review-v1"||d.ared_capacity_additions.printed_grand_total_mw!==69512||d.source.original_pdf_pages!==1253)throw Error("RUPTL source coverage/schema mismatch");
 root.classList.add("sli-ruplt-primary");
 const intro=el("section");intro.className="sli-ruplt-intro";
 intro.append(el("h2","RUPTL 2025–2034 · Digitalisasi langsung dokumen resmi"),
  el("p","Angka di bawah adalah rencana menurut RUPTL yang disahkan 26 Mei 2025. Proyeksi 2025–2034 dan COD rencana tidak menunjukkan realisasi ataupun status terkini setiap proyek."));
 const metrics=el("div");metrics.className="sli-ruplt-metrics";
 metrics.append(legendRow("Target pembangkit + storage",fmt(69512,0)+" MW"),legendRow("EBT & energi baru (rencana)",fmt(42569,0)+" MW"),legendRow("Storage (rencana)",fmt(10256,0)+" MW"),legendRow("Fosil (rencana)",fmt(16687,0)+" MW"));
 intro.append(metrics);
 const notice=el("p","Catatan integritas sumber: total rencana 69.512 MW mengacu Diktum KEDUA (PDF halaman 5). Pada Tabel 5.81, penjumlahan total teknologi tercetak adalah 69.514 MW, atau berselisih 2 MW dari grand total resmi. Tiga kategori (PLTBg, PLTB, BESS) juga memiliki selisih masing-masing ±1 MW antara angka tahunan dan total cetaknya. Angka sumber tidak dikoreksi diam-diam.");
 notice.className="sli-ruplt-source-warning";intro.append(notice,paperLink(d,5,"Keputusan Menteri ESDM · PDF hal. 5 ↗"));
 root.append(intro);
 const cap=figure("Rencana penambahan kapasitas per tahun (MW)","Skenario RE Base dibanding Accelerated Renewable Energy Development (ARED). Angka target, bukan tambahan daya yang sudah dibangun.");
 const capChart=svgChart(d.ared_capacity_additions.annual_total_mw,d.rebase_capacity_additions.annual_total_mw,d.ared_capacity_additions.years,"ARED","RE Base","MW");
 const capLegend=el("p","<span>");capLegend.textContent="● ARED     ● RE Base";capLegend.className="sli-ruplt-legend";
 cap.append(capChart,capLegend,paperLink(d,334,"Tabel 5.81 · PDF hal. 334 ↗")," · ",paperLink(d,333,"Tabel 5.80 · PDF hal. 333 ↗"));
 const tech=el("div");tech.className="sli-ruplt-controls";const tl=el("label","Pilih teknologi untuk melihat angka tahunan dan jumlah tercetak");const ts=el("select");
 d.ared_capacity_additions.technologies.forEach((v,i)=>{const op=el("option",v.technology+" · "+fmt(v.printed_total_mw,0)+" MW");op.value=i;ts.append(op)});ts.value="12";tl.append(ts);tech.append(tl);
 const techPlot=el("div"),techMeta=el("p"),techTable=el("div");techTable.className="sli-ruplt-scroll";
 function showTech(){const f=d.ared_capacity_additions.technologies[Number(ts.value)];const svgNode=svgChart(f.annual_mw,Array.from({length:10},()=>null),d.ared_capacity_additions.years,f.technology,"","MW");
  techPlot.replaceChildren(svgNode);
  const x=d.ared_capacity_additions.quality_audit.per_technology_printed_vs_sum_discrepancies.find(x=>x.technology===f.technology);
  techMeta.textContent=f.technology+" · total sesuai cetakan "+fmt(f.printed_total_mw,0)+" MW. Tanda '—' pada sel sumber tetap tidak tersedia, bukan nol."+ (x?" PERHATIAN: jumlah angka tahunan "+fmt(x.sum_nonnull_annual_cells_mw,0)+" MW berbeda dari total tercetak "+fmt(x.printed_total_mw,0)+" MW.":"");
  const table=el("table"),thead=el("thead"),tr=el("tr");["Tahun","Rencana MW (sebagaimana tercetak)"].forEach(x=>tr.append(el("th",x)));thead.append(tr);
  const body=el("tbody");d.ared_capacity_additions.years.forEach((y,i)=>{const r=el("tr");r.append(el("td",y),el("td",fmt(f.annual_mw[i],0)));body.append(r)});
  table.append(thead,body);techTable.replaceChildren(table);
  attachExport(svgNode,d,["Year","Planned "+f.technology+" (MW)"],d.ared_capacity_additions.years.map((y,i)=>[y,f.annual_mw[i]]),{table:"5.81",pdf_page:334,title:"RUPTL ARED "+f.technology, note:"Technology rows as printed, blank dash remains null. Source total "+f.printed_total_mw+" MW."});
 }
 ts.addEventListener("change",showTech);cap.append(tech,techPlot,techMeta,techTable);showTech();root.append(cap);
 attachExport(capChart,d,["Year","ARED planned additions (MW)","RE Base planned additions (MW)"],d.ared_capacity_additions.years.map((y,i)=>[y,d.ared_capacity_additions.annual_total_mw[i],d.rebase_capacity_additions.annual_total_mw[i]]),{table:"5.80/5.81",pdf_page:334,title:"RUPTL PLN planned capacity additions 2025–2034",note:"Source annual total rows, planned MW only."});
 const em=figure("Proyeksi emisi CO₂ dari pembangkitan listrik (juta ton)","Tabel 5.175 dan 5.176: proyeksi RE Base dan ARED, bukan emisi yang telah diamati.");
 const eA=d.emissions_projection.scenarios.find(x=>x.name==="ARED"),eB=d.emissions_projection.scenarios.find(x=>x.name==="RE Base");
 const emChart=svgChart(eA.annual_total,eB.annual_total,d.emissions_projection.years,"ARED","RE Base","juta ton CO₂");
 em.append(emChart,el("p",d.emissions_projection.footnote),paperLink(d,510,"RE Base · PDF hal. 510 ↗")," · ",paperLink(d,511,"ARED · PDF hal. 511 ↗"));root.append(em);
 attachExport(emChart,d,["Year","ARED projected CO2 (million t)","RE Base projected CO2 (million t)"],d.emissions_projection.years.map((y,i)=>[y,eA.annual_total[i],eB.annual_total[i]]),{table:"5.175/5.176",pdf_page:510,title:"RUPTL power-generation emissions projections",note:"Projected emissions only. Not actual historical CO2 emissions; the 151 million tonne BAU comparison is a different benchmark."});
 const proj=figure("Baris proyek yang telah dicocokkan dengan lampiran PDF","Contoh baris proyek bernama dari Tabel A1.11, B1.10, C1.15. Nama wilayah merujuk pada bagian lampiran yang memuat baris, bukan lokasi titik geospasial terverifikasi. Tahun adalah target COD, status adalah keterangan RUPTL terbitan 2025; bukan status aktual 2026.");
 const controls=el("div");controls.className="sli-ruplt-controls";
 const psel=el("select"),sSel=el("select"),yrSel=el("select");
 const province=el("label","Wilayah lampiran"),status=el("label","Status di dokumen 2025"),year=el("label","Target COD ARED");
 for(const [select,all,arr] of [[psel,"Semua provinsi",[...new Set(d.individual_project_source_records.records.map(x=>x.province))]],[sSel,"Semua status",[...new Set(d.individual_project_source_records.records.map(x=>x.status_in_ruplt_2025))]],[yrSel,"Semua tahun",[...new Set(d.individual_project_source_records.records.map(x=>x.cod_ared))]]]){for(const item of [all,...arr]){const op=el("option",item);op.value=item===all?"":item;select.append(op)}}
 province.append(psel);status.append(sSel);year.append(yrSel);controls.append(province,status,year);
 const projectView=el("div");projectView.className="sli-ruplt-scroll";const info=el("p");
 function renderProjects(){
  const rows=d.individual_project_source_records.records.filter(x=>(!psel.value||x.province===psel.value)&&(!sSel.value||x.status_in_ruplt_2025===sSel.value)&&(!yrSel.value||x.cod_ared===yrSel.value));
  info.textContent=rows.length+" baris sampel dari 13 yang diperiksa, bukan daftar proyek nasional lengkap. Kode 2×3 dan 2×50 dipertahankan sebagai kapasitas sumber, bukan dijumlahkan diam-diam.";
  const t=el("table"),head=el("thead"),tr=el("tr");["Wilayah lampiran","Nama/Lokasi sumber","Jenis","Kapasitas (asli)","COD rencana ARED","Status RUPTL 2025","Pengembang (jenis)","Hal. PDF"].forEach(x=>tr.append(el("th",x)));head.append(tr);
  const body=el("tbody");rows.forEach(r=>{const tr=el("tr");[r.province,r.project_name,r.technology,r.capacity_as_printed,r.cod_ared,r.status_in_ruplt_2025,r.developer_class_as_printed].forEach(x=>tr.append(el("td",x)));const td=el("td");td.append(paperLink(d,r.pdf_page,"Hal. "+r.pdf_page));tr.append(td);body.append(tr)});
  t.append(head,body);projectView.replaceChildren(t);
  attachExport(t,d,["Appendix geographic grouping","Project source label","Technology","Source capacity string","Parsed simple MW, null if composite","Planned COD RE Base","Planned COD ARED","2025 source stage","Developer class","Source table","PDF page"],
   rows.map(r=>[r.province,r.project_name,r.technology,r.capacity_as_printed,r.capacity_mw,r.cod_re_base,r.cod_ared,r.status_in_ruplt_2025,r.developer_class_as_printed,r.table,r.pdf_page]),{table:"A1.11/B1.10/C1.15",pdf_page:607,title:"RUPTL selected appendix project source rows",note:"Sample verified source cell transcription. Actual 2026 status, operation, exact site coordinates and realized investment not independently verified."});
 }
 [psel,sSel,yrSel].forEach(x=>x.addEventListener("change",renderProjects));proj.append(controls,info,projectView);renderProjects();root.append(proj);
 document.addEventListener("sli:exportready",()=>{showTech();renderProjects();});
}
fetch(PATH,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(d=>roots.forEach(root=>build(root,d))).catch(e=>roots.forEach(root=>{root.textContent="RUPTL data asli belum dapat dimuat: "+String(e.message)}));
})();