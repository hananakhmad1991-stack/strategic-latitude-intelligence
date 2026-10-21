/* Source-led RUPTL visualization: original official plan versus source samples, never current operations. */
(()=>{"use strict";
const roots=[...document.querySelectorAll("[data-sli-ruptl-visual]")];
if(!roots.length)return;
const files={
 plan:"./data/sli-ruptl-primary-pdf-2025-2034.json",
 coverage:"./data/sli-ruptl-provincial-source-projects-2025.json",
 first:"./data/sli-ruptl-expanded-22-annex-source-rows.json",
 map:"./data/sli-indonesia-province-38.geojson"
};
const ns="http://www.w3.org/2000/svg";
const colors=["#68b9c6","#dcb775","#ab98d2"];
const fmt=n=>Number(n).toLocaleString("id-ID",{maximumFractionDigits:1});
function el(t,text,cls){const x=document.createElement(t);if(text!==undefined&&text!==null)x.textContent=String(text);if(cls)x.className=cls;return x}
function svg(t,attrs,text){const x=document.createElementNS(ns,t);for(const [k,v] of Object.entries(attrs||{}))x.setAttribute(k,String(v));if(text!==undefined)x.textContent=String(text);return x}
function button(name,fn){const b=el("button",name);b.type="button";b.addEventListener("click",fn);return b}
function panel(title,description){const p=el("div",null,"rv-panel");p.append(el("h3",title));if(description)p.append(el("p",description,"rv-compact"));return p}
function svgRoot(w,h,label){return svg("svg",{viewBox:"0 0 "+w+" "+h,role:"img","aria-label":label,xmlns:ns})}
function csv(name,rows){const data=rows.map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\r\n");const url=URL.createObjectURL(new Blob(["\uFEFF",data],{type:"text/csv;charset=utf-8"}));const a=el("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function sourceLink(url,label){const a=el("a",label);a.href=url;a.rel="noopener noreferrer";a.target="_blank";return a}
function groupOf(n){
 const names={"Daerah Istimewa Yogyakarta":"DI Yogyakarta"};
 const province=names[n]||n;
 if(["Papua","Papua Tengah","Papua Selatan","Papua Pegunungan"].includes(province))return "C.9";
 if(["Papua Barat","Papua Barat Daya"].includes(province))return "C.10";
 if(province==="Kepulauan Riau")return "A.4";
 return province;
}
const projectGroup={"Aceh":"A.1","DKI Jakarta":"B.1","Sulawesi Utara":"C.1"};
function run(root,plan,coverage,expansion,boundaries){
 const geographic=coverage.geographic_appendix_coverage;
 const records=plan.individual_project_source_records.records;
 const regions=geographic.subsections;
 if(plan.source.original_pdf_pages!==1253||plan.source.sha256!==coverage.source.sha256||coverage.source.sha256!==expansion.source_sha256)throw Error("Source PDF identity mismatch");
 if(regions.length!==34||records.length!==13||coverage.source_rows.length!==35||expansion.rows.length!==44||boundaries.features.length!==38)throw Error("Source-map sample count guard mismatch");
 const all=[
 ...records.map(x=>({id:x.id,annex_id:projectGroup[x.province],technology:x.technology,source_project_label:x.project_name,planned_cod_ared:x.cod_ared})),
 ...coverage.source_rows,...expansion.rows];
 if(all.length!==92||new Set(all.map(x=>x.annex_id)).size!==34)throw Error("92/34 evidence coverage invariant failed");
 const byId=new Map(regions.map(x=>[x.annex_id,x]));
 const sourceCount=new Map();
 for(const r of all)sourceCount.set(r.annex_id,(sourceCount.get(r.annex_id)||0)+1);
 const official=plan.official_decree_totals;
 const flows=[
  {label:"EBT + energi baru",value:official.renewables_and_new_energy_mw,color:colors[0]},
  {label:"Penyimpanan energi",value:official.energy_storage_mw,color:colors[1]},
  {label:"Pembangkit fosil",value:official.fossil_generation_mw,color:colors[2]}];
 const total=official.new_capacity_and_storage_mw;
 if(flows.reduce((s,f)=>s+f.value,0)!==total)throw Error("National capacity decomposition does not reconcile");
 root.classList.add("sli-ruptl-viz");
 const kicker=el("div","RUPTL 2025–2034 · eksplorasi interaktif","rv-kicker");
 const top=el("div",null,"rv-top"),left=el("div");left.append(kicker,el("h2","RUPTL dalam data, bukan tumpukan PDF"),el("p","Peta 38 provinsi / 34 kelompok lampiran, rencana kapasitas nasional dan 92 baris sampel sumber. Klik wilayah atau batang grafik untuk melihat angka."));top.append(left);
 const grid=el("div",null,"rv-grid");
 const mapPanel=panel("Peta interaktif · kelompok geografis RUPTL","Warna merepresentasikan jumlah baris sampel, bukan jumlah proyek operasional atau besaran MW provinsi.");
 const mapModes=el("div",null,"rv-map-buttons");
 const sampleBtn=button("92 baris sampel",()=>drawMap("samples"));
 const rawBtn=button("970 kandidat (belum valid)",()=>drawMap("candidates"));
 mapModes.append(sampleBtn,rawBtn);mapPanel.append(mapModes);
 const mapBox=el("div",null,"rv-map"),mapInfo=el("div",null,"rv-map-info"),mapLegend=el("div",null,"rv-legend");mapPanel.append(mapBox,mapLegend,mapInfo);
 const mapOpen=button("Lihat daftar baris wilayah ini ↓",()=>{if(selected){document.dispatchEvent(new CustomEvent("sli:ruptl-region-focus",{detail:{annex_id:selected}}));const target=document.getElementById("ruplt-provincial-project-review");target?.scrollIntoView({behavior:"smooth",block:"start"});}});
 mapOpen.disabled=true;mapPanel.append(mapOpen);
 grid.append(mapPanel);
 const sumPanel=panel("Komposisi penambahan nasional · MW","Perhitungan resmi dari keputusan RUPTL; storage dihitung sebagai kapasitas daya MW, bukan energi MWh.");
 const donut=el("div",null,"rv-donut-wrap");sumPanel.append(donut);
 const downloadFlows=button("Ekspor komposisi CSV",()=>csv("sli_ruptl_approved_national_mix.csv",[["kelompok","rencana_MW","jenis_data"],...flows.map(f=>[f.label,f.value,"RUPTL 2025 approved plan"])]));
 sumPanel.append(downloadFlows,el("p","TOTAL "+fmt(total)+" MW adalah target kapasitas baru dan penyimpanan 2025–2034, bukan pembangkit yang sudah beroperasi.","rv-hint"));
 grid.append(sumPanel);
 const sankeyPanel=panel("Sankey · alokasi rencana nasional","Satu sumber 69.512 MW dibagi menjadi tiga kategori resmi; bukan aliran fisik listrik atau provinsi proyek.");
 const sankeyHolder=el("div",null,"rv-chart-wrap");sankeyPanel.append(sankeyHolder);grid.append(sankeyPanel);
 const yearPanel=panel("Diagram batang · rencana penambahan per tahun","Satuan MW, seri nasional skenario ARED, target COD per tahun (bukan realisasi).");
 const yearHolder=el("div",null,"rv-chart-wrap");yearPanel.append(yearHolder);
 yearPanel.append(button("Ekspor tahunan CSV",()=>csv("sli_ruptl_annual_ared_plan.csv",[["tahun","MW_rencana","skenario","status"],...plan.ared_capacity_additions.years.map((y,i)=>[y,plan.ared_capacity_additions.annual_total_mw[i],"ARED","plan_only"])])));
 grid.append(yearPanel);
 const techPanel=panel("Perbandingan teknologi · total rencana 2025–2034","Nilai adalah jumlah tercetak per teknologi; total kolom sumber berbeda 2 MW dari total keputusan. Angka tidak dikoreksi diam-diam.");
 techPanel.classList.add("rv-span2");
 const technologyControls=el("div",null,"rv-top"),technologySelect=el("select");
 [["10","10 teknologi terbesar"],["20","Semua 20 teknologi"]].forEach(([v,label])=>{const op=el("option",label);op.value=v;technologySelect.append(op)});
 technologySelect.setAttribute("aria-label","Jumlah teknologi");
 technologyControls.append(technologySelect,button("Ekspor teknologi CSV",()=>csv("sli_ruptl_technology_plan.csv",[["teknologi","MW_total_tercetak","jenis_data"],...plan.ared_capacity_additions.technologies.map(x=>[x.technology,x.printed_total_mw,"RUPTL 2025 planned"])])));
 techPanel.append(technologyControls);
 const techHolder=el("div",null,"rv-chart-wrap");techPanel.append(techHolder);grid.append(techPanel);
 const caveat=el("p",null,"rv-disclaimer");
 caveat.append("Peta memakai batas 38 provinsi administratif, tetapi angka bersumber dari 34 kelompok lampiran RUPTL. C.9 menggabungkan empat provinsi Papua dan C.10 menggabungkan dua provinsi; angkanya tidak boleh dijumlahkan lintas provinsi dalam kelompok yang sama. A.4 tidak mencakup Batam. Peta bukan geolokasi aset. Data 970 baris masih hasil ekstraksi mesin yang belum diverifikasi proyek per proyek. Rekonsiliasi realisasi 2026 tetap terpisah. ");
 caveat.append(sourceLink(coverage.source.official_url,"Buka bukti PDF asli ↗")," · ",sourceLink("https://github.com/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces","Peta provinsi CC BY 4.0 ↗"));
 root.replaceChildren(top,grid,caveat);
 let selected=null,mode="samples",paths=[];
 function info(id,province){
  const a=byId.get(id),n=sourceCount.get(id)||0;
  if(!a){mapInfo.textContent="Pilih satu provinsi untuk membuka kelompok lampiran RUPTL.";return}
  mapInfo.replaceChildren(el("strong",a.annex_id+" · "+a.geographic_heading),el("div",fmt(n)+" baris sampel yang ditranskripsikan; "+fmt(a.machine_candidate_numbered_grid_rows)+" kandidat baris mesin belum disetujui.","rv-stat"),el("small","Tabel "+a.project_table_number+" · sumber halaman "+a.project_table_pdf_page+". Pilihan di peta: "+province+"."));
  if(id==="C.9"||id==="C.10")mapInfo.append(el("p","Ini satu kelompok lampiran multi-provinsi: jumlah hanya dihitung SATU kali.","rv-hint"));
  if(id==="A.4")mapInfo.append(el("p","Lampiran sumber mengecualikan Batam.","rv-hint"));
  mapInfo.append(sourceLink(coverage.source.official_url+"#page="+a.project_table_pdf_page,"Lihat halaman tabel resmi ↗"));
 }
 function selectRegion(id,province){
  selected=id;mapOpen.disabled=!id;info(id,province);
  paths.forEach(o=>o.path.classList.toggle("rv-selected",o.id===selected));
  document.dispatchEvent(new CustomEvent("sli:ruptl-region-focus",{detail:{annex_id:id,scroll:false}}));
 }
 const proj=coord=>[(coord[0]-94)*920/49+18,(7-coord[1])*380/19+17];
 function polygonPath(geometry){
  const polygons=geometry.type==="Polygon"?[geometry.coordinates]:geometry.coordinates;
  return polygons.map(poly=>poly.map(ring=>ring.map((p,i)=>{const xy=proj(p);return (i?"L":"M")+xy[0].toFixed(1)+" "+xy[1].toFixed(1)}).join(" ")+"Z").join(" ")).join(" ");
 }
 function colorFor(value,max){
  if(value===0)return "#355063";
  const opacity=Math.min(1,.23+Math.sqrt(value/Math.max(1,max))*.77);
  const low=[44,99,123],high=[94,208,212];
  return "#"+low.map((c,i)=>Math.round(c+(high[i]-c)*opacity).toString(16).padStart(2,"0")).join("");
 }
 function drawMap(nextMode){
  mode=nextMode;
  sampleBtn.setAttribute("aria-pressed",String(mode==="samples"));
  rawBtn.setAttribute("aria-pressed",String(mode==="candidates"));
  const drawing=svgRoot(960,430,"Peta kelompok lampiran RUPTL interaktif, klik provinsi untuk rincian sumber.");
  const numbers=regions.map(r=>mode==="samples"?(sourceCount.get(r.annex_id)||0):r.machine_candidate_numbered_grid_rows);
  const max=Math.max(...numbers);
  paths=[];
  for(const f of boundaries.features){
   const province=f.properties.PROVINSI;
   const candidate=groupOf(province);
   const id=byId.has(candidate)?candidate:regions.find(r=>r.geographic_heading===candidate)?.annex_id;
   const annex=id?byId.get(id):null;
   const count=annex?(mode==="samples"?(sourceCount.get(id)||0):annex.machine_candidate_numbered_grid_rows):0;
   const path=svg("path",{d:polygonPath(f.geometry),fill:colorFor(count,max),stroke:"#19354b","stroke-width":"1",role:"button",tabindex:"0","aria-label":province+": "+fmt(count)+" "+(mode==="samples"?"baris sampel":"kandidat mentah")});
   path.append(svg("title",{},province+" · "+(annex?annex.geographic_heading:"Tidak terpetakan")+" · "+count+" baris"));
   path.addEventListener("click",()=>selectRegion(id,province));
   path.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectRegion(id,province)}});
   paths.push({path,id});
   drawing.append(path);
  }
  mapBox.replaceChildren(drawing);
  paths.forEach(o=>o.path.classList.toggle("rv-selected",o.id===selected));
  mapLegend.replaceChildren(el("span",mode==="samples"?"Gradasi: jumlah baris sumber pilihan":"Gradasi: kandidat grid mentah, bukan proyek"),el("span",null,"rv-key"));
  mapLegend.lastChild.style.background="linear-gradient(90deg,#2c637b,#5ed0d4)";
  info(selected,selected?byId.get(selected).geographic_heading:"");
 }
 function donutChart(){
  const s=svgRoot(250,250,"Diagram donat "+fmt(total)+" MW kapasitas baru dan penyimpanan resmi.");
  s.append(svg("circle",{cx:125,cy:125,r:87,fill:"none",stroke:"#26465d","stroke-width":29}));
  let cum=0;
  flows.forEach(f=>{
   const perimeter=2*Math.PI*87,len=f.value/total*perimeter;
   const arc=svg("circle",{cx:125,cy:125,r:87,fill:"none",stroke:f.color,"stroke-width":29,transform:"rotate(-90 125 125)","stroke-dasharray":len+" "+(perimeter-len),"stroke-dashoffset":-cum});
   arc.append(svg("title",{},f.label+": "+fmt(f.value)+" MW"));
   s.append(arc);cum+=len;
  });
  s.append(svg("text",{x:125,y:119,"text-anchor":"middle",fill:"#f5dfa8","font-size":27,"font-weight":"700"},fmt(total)));
  s.append(svg("text",{x:125,y:144,"text-anchor":"middle",fill:"#d1e0e9","font-size":12},"MW direncanakan"));
  const legend=el("div",null,"rv-donut-legend");
  flows.forEach(f=>{const r=el("div");const name=el("span");const dot=el("span","● ");dot.style.color=f.color;name.append(dot,document.createTextNode(f.label));r.append(name,el("b",fmt(f.value)+" MW"));legend.append(r)});
  donut.replaceChildren(s,legend);
 }
 function sankeyChart(){
  const s=svgRoot(990,375,"Sankey alokasi rencana "+fmt(total)+" MW menjadi energi baru-terbarukan, penyimpanan, dan fosil.");
  s.append(svg("rect",{x:95,y:71,width:95,height:230,rx:10,fill:"#416a7c"}));
  s.append(svg("text",{x:143,y:55,"text-anchor":"middle",fill:"#e7d3a7","font-size":16},"RUPTL"));
  s.append(svg("text",{x:143,y:321,"text-anchor":"middle",fill:"#e7d3a7","font-size":14},fmt(total)+" MW"));
  let from=71,to=45;
  for(const f of flows){
   const width=f.value/total*230;
   const d="M190 "+from+" C360 "+from+" 475 "+to+" 660 "+to+" L660 "+(to+width)+" C475 "+(to+width)+" 360 "+(from+width)+" 190 "+(from+width)+" Z";
   const path=svg("path",{d,fill:f.color,opacity:.83});path.append(svg("title",{},f.label+" "+fmt(f.value)+" MW"));
   s.append(path,svg("rect",{x:660,y:to,width:16,height:width,rx:2,fill:f.color}));
   const y=to+width/2;
   s.append(svg("text",{x:691,y:y-6,fill:"#ecf4f7","font-size":15,"font-weight":"700"},f.label),svg("text",{x:691,y:y+15,fill:"#c8dbe9","font-size":13},fmt(f.value)+" MW"));
   from+=width;to+=width+15;
  }
  sankeyHolder.replaceChildren(s);
 }
 function barsAnnual(){
  const d=plan.ared_capacity_additions,years=d.years,vals=d.annual_total_mw,max=Math.max(...vals),s=svgRoot(1000,405,"Rencana penambahan MW tahunan 2025 hingga 2034");
  for(let i=0;i<=4;i++){const y=331-i*69;s.append(svg("line",{x1:65,y1:y,x2:990,y2:y,stroke:"#395367","stroke-dasharray":"4 5"}));s.append(svg("text",{x:57,y:y+5,"text-anchor":"end",fill:"#a9c4d5","font-size":12},fmt(max*i/4)))}
  vals.forEach((value,i)=>{
   const w=62,x=87+i*89,h=value/max*268,y=331-h;
   const bar=svg("rect",{x,y,width:w,height:h,rx:4,fill:i===vals.indexOf(max)?"#e5c281":"#5caebc",tabindex:0,role:"img","aria-label":years[i]+": "+fmt(value)+" MW"});
   bar.append(svg("title",{},years[i]+": "+fmt(value)+" MW rencana"));s.append(bar);
   s.append(svg("text",{x:x+w/2,y:y-7,"text-anchor":"middle",fill:"#dcecf1","font-size":12},fmt(value)));
   s.append(svg("text",{x:x+w/2,y:356,"text-anchor":"middle",fill:"#bfcfdb","font-size":13},years[i]));
  });
  yearHolder.replaceChildren(s);
 }
 function barsTechnology(){
  const list=[...plan.ared_capacity_additions.technologies].sort((a,b)=>b.printed_total_mw-a.printed_total_mw).slice(0,Number(technologySelect.value));
  const height=43+list.length*33,max=Math.max(...list.map(x=>x.printed_total_mw));
  const s=svgRoot(1000,height,"Peringkat teknologi dengan total MW tercetak dalam RUPTL 2025–2034");
  list.forEach((x,i)=>{const y=24+i*33,w=x.printed_total_mw/max*705;
   s.append(svg("text",{x:11,y:y+15,fill:"#e4eef5","font-size":13},x.technology));
   const rect=svg("rect",{x:133,y,width:w,height:21,rx:3,fill:i%2?"#81b6cb":"#d7b678"});rect.append(svg("title",{},x.technology+": "+fmt(x.printed_total_mw)+" MW tercetak"));s.append(rect);
   s.append(svg("text",{x:Math.min(935,145+w),y:y+15,fill:"#e9f2f6","font-size":13},fmt(x.printed_total_mw)+" MW"));
  });
  techHolder.replaceChildren(s);
 }
 donutChart();sankeyChart();barsAnnual();barsTechnology();
 technologySelect.addEventListener("change",barsTechnology);
 document.addEventListener("sli:ruptl-region-selected",e=>{const id=e.detail?.annex_id;if(byId.has(id)&&id!==selected){selected=id;drawMap(mode)}});
 drawMap("samples");
}
Promise.all(Object.values(files).map(url=>fetch(url,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error(url+" HTTP "+r.status);return r.json()})))
 .then(([plan,coverage,first,map])=>roots.forEach(root=>run(root,plan,coverage,first,map)))
 .catch(error=>roots.forEach(root=>root.replaceChildren(el("p","Visual RUPTL tidak dapat dimuat: "+error.message))));
})();