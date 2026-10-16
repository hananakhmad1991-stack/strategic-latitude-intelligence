/* SLI SKK Migas · 2025 Annual Report interactive Intelligence Review.
 * Single numeric canonical PDF: English Annual Report 2025 (202 pages).
 * Indonesian PDF is a translated edition of the same report, NOT 2 datasets.
 * All numeric plots use transcribed report tables, not a fabricated GIS layer.
 */
(function(){"use strict";
const BASE="data/skkmigas-annual-2025.json",CAT="data/skkmigas-2025-figure-catalog.json";
const NS="http://www.w3.org/2000/svg";
const $=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e};
const S=(tag,root,attrs={})=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));root?.append(e);return e};
const fmt=(v,d=2)=>v==null?"—":Number(v).toLocaleString("en-US",{maximumFractionDigits:d});
const colors=["#dfb472","#67bfcc","#d4a2cb","#9dc785","#eba27c","#819ecf"];
const I=(en,id)=>window.SLIi18n?.language==="id"?id:en;
const links=(url,text)=>{const a=$("a",null,text);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
const currency=(unit)=>unit==="USD billion"?"US$ bn":unit==="USD million"?"US$ mn":unit;
const warnings={
production:"Production is NOT lifting; 2025 NGL and DSLNG condensate classifications changed in October.",
gas:"Gas energy allocations in BBTUD are not production measured in MMSCFD. LNG lifting TBTU is a separate volume/energy unit.",
fiscal:"Cost recovery and government/contractor net shares are components of upstream gross revenue; small differences arise from rounding.",
investment:"2024 revised FCR, 2025 PSC FQR submitted as of 27 April 2026. SKK Migas expenditure is not additive to ESDM or BKPM aggregates.",
operators:"Missing contractor LPG values are missing (not zero); lines break across reported gaps.",
exploration:"2R recoverable oil/gas and contingent resources are not 1P proved reserves or operating production.",
projects:"Planned production capacity and onstream operations must not be confused with actual 2025 production or audited asset-level returns."
};
const paired=[
 {group:"production",names:["Oil lifting","Gas lifting"],ids:["oil_lifting","gas_lifting"]},
 {group:"drilling",names:["Exploration wells","Development wells","Workovers","Well services"],ids:["explore_wells","development_wells","workover","well_service"]},
 {group:"governance",names:["PSN TKDN","Non-PSN TKDN"],ids:["tkdn_psn","tkdn_nonpsn"]}
];
function chartLine(root,items){
 root.replaceChildren();if(!items.length)return;
 const years=[...new Set(items.flatMap(x=>x.years))].sort((a,b)=>a-b);
 const max=Math.max(...items.flatMap(x=>x.values.filter(v=>v!=null))),min=Math.min(0,...items.flatMap(x=>x.values.filter(v=>v!=null)));
 const W=950,H=318,x0=80,x1=927,y0=255,y1=24,range=max-min||1;
 const s=S("svg",root,{viewBox:"0 0 950 318",role:"img","aria-label":"Historical SKK Migas report trends 2015 through 2025"});
 for(let k=0;k<=4;k++){const y=y0-(y0-y1)*k/4;S("line",s,{x1:x0,y1:y,x2:x1,y2:y,stroke:"#3a5870"});const t=S("text",s,{x:x0-8,y:y+4,"font-size":11,fill:"#b0ccd9","text-anchor":"end"});t.textContent=fmt(min+range*k/4,2)}
 const pt=(yr,v)=>[x0+(x1-x0)*(yr-years[0])/(years[years.length-1]-years[0]||1),y0-(y0-y1)*(v-min)/range];
 for(let k=0;k<years.length;k++){if(k%Math.max(1,Math.floor(years.length/9))!==0&&k!==years.length-1)continue;const p=pt(years[k],min);const t=S("text",s,{x:p[0],y:281,fill:"#c3d6e0","font-size":10,"text-anchor":"middle"});t.textContent=years[k]}
 items.forEach((item,index)=>{
  let run=[];
  function commit(){if(run.length>1)S("polyline",s,{points:run.map(p=>p.join(",")).join(" "),fill:"none",stroke:colors[index%colors.length],"stroke-width":index===0?3.6:2.3});run=[]}
  for(let k=0;k<item.years.length;k++){const value=item.values[k];if(value===null){commit();continue;}const p=pt(item.years[k],value);run.push(p);const circle=S("circle",s,{cx:p[0],cy:p[1],r:3.3,fill:colors[index%colors.length]});const tip=S("title",circle);tip.textContent=item.title+" · "+item.years[k]+": "+fmt(value)+" "+item.unit}
  commit();const tt=S("text",s,{x:80+(index%3)*300,y:308+Math.floor(index/3)*11,fill:colors[index%colors.length],"font-size":11});tt.textContent=item.title.slice(0,41);
 });
}
function chartBars(root,items,scope){
 root.replaceChildren();const candidates=items.filter(x=>Number.isFinite(x.value));if(!candidates.length)return;
 const largest=Math.max(...candidates.map(x=>x.value),1);
 for(const m of candidates){
  const line=$("div","sm25-bar-item"),label=$("div","sm25-bar-label");
  label.append($("span",null,m.name||m.title),$("strong",null,fmt(m.value)+" "+(m.unit||scope)));
  const track=$("div","sm25-bar-track"),fill=$("div","sm25-bar-filled");
  fill.style.width=Math.max(1,100*m.value/largest)+"%";
  track.append(fill);line.append(label,track);root.append(line);
 }
}
function drawGasSankey(root,data){
 root.replaceChildren();
 const lines=data.gas_allocation;const d=lines.reduce((s,x)=>s+x.value,0);
 const W=940,H=530,max=d||1;
 const svg=S("svg",root,{viewBox:"0 0 940 530",role:"img","aria-label":"2025 SKK Migas 10 sector natural gas flows, BBTUD"});
 const domestic=lines.filter(x=>x.scope==="Domestic").reduce((s,x)=>s+x.value,0),exports=d-domestic;
 const first=[{name:"Indonesian domestic use",value:domestic,color:"#71bcca",scope:"Domestic"},{name:"Export markets",value:exports,color:"#dfb472",scope:"Export"}];
 const right=[...lines].sort((a,b)=>b.value-a.value);
 const top=20,base=495,leftScale=475/d,leftSegments=new Map(),rightScale=(base-top-right.length*10)/d;
 let sy=top;for(const x of first){const h=x.value*leftScale;leftSegments.set(x.scope,{x:245,y:sy,h,used:0,color:x.color});sy+=h}
 let ty=top;
 const startLine=S("rect",svg,{x:22,y:top,width:22,height:d*leftScale,rx:4,fill:"#dce5e9"});
 let cursor=0;for(const x of first){const h=x.value*leftScale;const y0=top+cursor+h/2;const v=leftSegments.get(x.scope);const y1=v.y+v.h/2;
   S("path",svg,{d:"M44,"+y0+" C126,"+y0+" 170,"+y1+" 245,"+y1,fill:"none",stroke:x.color,opacity:".45","stroke-width":Math.max(1,h)});cursor+=h;}
 const rootLabel=S("text",svg,{x:15,y:12,fill:"#fff","font-size":12});rootLabel.textContent="2025 gas allocation";
 for(const x of first){const v=leftSegments.get(x.scope);const rect=S("rect",svg,{x:245,y:v.y,width:18,height:v.h,rx:2,fill:x.color});const t=S("title",rect);t.textContent=x.name+" "+fmt(x.value)+" BBTUD"}
 for(const [i,r] of right.entries()){
  const left=leftSegments.get(r.scope);const thick=Math.max(.4,r.value*rightScale);
  const srcY=left.y+left.used*leftScale+(r.value*leftScale)/2;left.used+=r.value;
  const dstY=ty+thick/2;
  const path=S("path",svg,{d:"M263,"+srcY+" C440,"+srcY+" 562,"+dstY+" 674,"+dstY,fill:"none",stroke:left.color,"stroke-width":thick,opacity:".54"});
  const t=S("title",path);t.textContent=r.scope+" → "+r.name+": "+fmt(r.value)+" BBTUD";
  S("rect",svg,{x:674,y:ty,width:16,height:thick,rx:1,fill:left.color});
  const label=S("text",svg,{x:706,y:ty+thick/2-2,fill:"#e7f0f3","font-size":12});label.textContent=r.name;
  const amount=S("text",svg,{x:706,y:ty+thick/2+13,fill:"#b9cfdc","font-size":11});amount.textContent=fmt(r.value)+" BBTUD";
  ty+=thick+10;
 }
}
function selectBox(options,selected,cls="sm25-select"){
 const x=$("select",cls);for(const [value,label] of options){const o=$("option",null,label);o.value=value;x.append(o)}if(selected!==undefined)x.value=selected;return x;
}
function kpiCard(m,lang){const card=$("article","sm25-kpi");card.append($("small",null,m.category.toUpperCase()),$("strong",null,fmt(m.value,2)),$("span",null,currency(m.unit)), $("h5",null,m.title));
 if(m.target){const ratio=100*m.value/m.target.value,progress=$("div","sm25-progress"),done=$("div","sm25-progress-done");done.style.width=Math.min(100,ratio)+"%";progress.append(done);card.append(progress,$("p",null,fmt(ratio,1)+"% "+I("of","dari")+" "+m.target.type+" "+fmt(m.target.value)))}else if(m.detail)card.append($("p",null,m.detail));
 card.append($("small",null,"PDF p. "+m.pdf_page));return card}
function renderKpi(block,data){
 const toggle=$("div","sm25-toolbar"),cat=selectBox([["all",I("All indicators","Semua indikator")],...data.categories.map(([id,title])=>[id,title])],"all");
 const group=$("div","sm25-kpis");toggle.append($("label",null,I("KPI category ·","Kelompok indikator ·")),cat);block.append($("h4",null,I("2025 verified operational KPIs","Indikator operasional terverifikasi 2025")),toggle,group);
 function go(){group.replaceChildren();data.metrics.filter(x=>cat.value==="all"||x.category===cat.value).forEach(x=>group.append(kpiCard(x)))}
 cat.addEventListener("change",go);go();
}
function renderSeries(block,data){
 const tools=$("div","sm25-toolbar"),cat=selectBox(data.categories.filter(x=>data.series.some(s=>s.category===x[0])),"production"),ind=selectBox([]);
 const chart=$("div","sm25-chart"),detail=$("p","sm25-note"),source=$("div","sm25-source"),table=$("div","sm25-table-scroll");
 const head=$("h4",null,I("Historical series / investor comparisons","Deret waktu / perbandingan investasi"));
 tools.append($("label",null,I("Theme","Tema")),cat,$("label",null,I("Series","Indikator")),ind);block.append(head,tools,chart,detail,source,table);
 function options(){
  ind.replaceChildren();
  data.series.filter(s=>s.category===cat.value).forEach(s=>{const o=$("option",null,s.title);o.value=s.id;ind.append(o)});
  update();
 }
 function update(){
  const base=data.series.find(x=>x.id===ind.value);if(!base)return;
  const sibling=data.series.filter(s=>s.id!==base.id&&s.category===base.category&&s.unit===base.unit&&s.years.length===base.years.length&&s.years[0]===base.years[0]).slice(0,3);
  const items=[base,...sibling];chartLine(chart,items);
  const foot=warnings[base.category]||"Historical official report figures have source-specific boundaries.";
  detail.textContent="Original SKK Migas Annual Report 2025 · PDF p. "+base.source_pdf_page+" · "+base.unit+". "+foot+" "+(base.note||"");
  source.replaceChildren($("span",null,"PDF p. "+base.source_pdf_page+" · "),links(data.source_url,I("Official report directory ↗","Katalog resmi ↗")));
  table.replaceChildren();const tbl=$("table","sm25-table"),tr=$("tr");["Year",...items.map(s=>s.title)].forEach(name=>tr.append($("th",null,name)));const hd=$("thead");hd.append(tr);tbl.append(hd);
  const bd=$("tbody");
  for(let i=0;i<base.years.length;i++){const row=$("tr");row.append($("th",null,base.years[i]));items.forEach(x=>{const j=x.years.indexOf(base.years[i]);row.append($("td",null,j<0?"—":fmt(x.values[j],3)))});bd.append(row)}tbl.append(bd);table.append(tbl);
 }
 cat.addEventListener("change",options);ind.addEventListener("change",update);options();
}
function renderGas(block,data){
 const wrap=$("div","sm25-gas"),chart=$("div","sm25-sankey"),stats=$("div","sm25-toolbar");
 const total=data.gas_allocation.reduce((s,x)=>s+x.value,0),dom=data.gas_allocation.filter(x=>x.scope==="Domestic").reduce((s,x)=>s+x.value,0);
 stats.append($("span",null,"2025: "+fmt(total)+" BBTUD"),$("span",null,I("Domestic","Domestik")+" "+fmt(dom)+" ("+fmt(dom/total*100,2)+"%)"),$("span",null,I("Exports","Ekspor")+" "+fmt(total-dom)+" BBTUD"));
 wrap.append($("h4",null,I("Natural gas allocation · actual 2025 Sankey","Distribusi gas bumi · Sankey realisasi 2025")),stats,chart,
 $("p","sm25-note",I("Source Table 4.1, PDF p. 106. Domestic and export allocated volumes, not physical transport routes. Gas allocation rounded row sum differs from national published 5,601.20 BBTUD by 0.01 BBTUD. No pipe geometry inferred.","Sumber Tabel 4.1, halaman PDF 106. Ini alokasi gas domestik dan ekspor, bukan rute fisik pipa. Jumlah baris berbeda 0,01 BBTUD akibat pembulatan; tidak ada koordinat pipa yang direka.")));
 block.append(wrap);drawGasSankey(chart,data);
}
function renderTarget(block,data){
 const root=$("div","sm25-target"),items=["oil_lifting","gas_lifting","development_wells","workover","well_service"].map(id=>data.metrics.find(x=>x.id===id)).filter(Boolean);
 root.append($("h4",null,I("2025 plan versus actual · different units preserved","Target vs realisasi 2025 · satuan tetap terpisah")));
 const bars=$("div","sm25-target-grid");
 for(const item of items){if(!item.target)continue;const row=$("article","sm25-target-card");row.append($("h5",null,item.title),$("p",null,fmt(item.value)+" "+item.unit+" · "+fmt(item.value/item.target.value*100,1)+"%"),$("small",null,I("Annual plan","Rencana tahunan")+": "+fmt(item.target.value)+" "+item.unit));
 const p=$("div","sm25-progress"),filled=$("div","sm25-progress-done");filled.style.width=Math.min(100,item.value/item.target.value*100)+"%";p.append(filled);row.append(p);bars.append(row)}
 root.append(bars);block.append(root);
}
function renderDigitizedExhibits(root,doc){
 root.append($("h4",null,I("Numerically digitized source graphs and tables","Grafik dan tabel yang didigitalkan secara numerik")),
 $("p","sm25-note",I("Source-labeled 2010–2025 data only. All values are transcribed from original PDF graph labels or printed tables; charts never estimate from bar heights. Source discrepancies and unreconciled totals stay visible.","Hanya data 2010–2025 yang tercetak. Angka ditranskripsi dari label grafik atau tabel PDF asli, tidak ditebak dari tinggi batang. Selisih dan ketidaksesuaian pada sumber tetap ditampilkan.")));
 const tools=$("div","sm25-toolbar"),kind=selectBox([["series","Annual time series"],["category","Categorical & tabular evidence"]],"series");
 const select=selectBox(doc.series.map(v=>[v.id,v.title]),doc.series[0]?.id);
 const viz=$("div","sm25-chart"),table=$("div","sm25-table-scroll"),detail=$("p","sm25-note");
 const source=$("div","sm25-source");tools.append(kind,select);root.append(tools,viz,detail,source,table);
 function dataset(){
  const set=kind.value==="series"?doc.series:doc.categories;const prev=select.value;
  select.replaceChildren();set.forEach(x=>{const o=$("option",null,x.title);o.value=x.id;select.append(o)});
  if(set.some(x=>x.id===prev))select.value=prev;draw();
 }
 function draw(){
  const list=kind.value==="series"?doc.series:doc.categories;
  const info=list.find(x=>x.id===select.value);if(!info)return;
  viz.replaceChildren();table.replaceChildren();source.replaceChildren();
  detail.textContent=I("Source PDF page","Halaman PDF sumber")+" "+info.source_pdf_page+" · "+info.unit+" · "+(info.note||"Printed original data labels with explicit reference dates.");
  source.append($("span",null,I("Source verified by original PDF SHA-256 · page","Sumber dicek dengan SHA-256 PDF · halaman")+" "+info.source_pdf_page+" · "),links("https://www.skkmigas.go.id/publication?tab=laporan+tahunan","SKK Migas publications ↗"));
  const tbl=$("table","sm25-table"),head=$("thead"),h=$("tr"),body=$("tbody");
  if(kind.value==="series"){
   const matches=doc.series.filter(x=>x.id!==info.id&&x.section===info.section&&x.unit===info.unit&&x.years.length===info.years.length&&x.years[0]===info.years[0]&&x.years.at(-1)===info.years.at(-1)).slice(0,2);
   const aligned=[info,...matches];
   chartLine(viz,aligned.map(x=>({title:x.title,unit:x.unit,years:x.years,values:x.values})));
   ["Year",...aligned.map(x=>x.title)].forEach(name=>h.append($("th",null,name)));
   info.years.forEach((y,i)=>{const row=$("tr");row.append($("th",null,y));aligned.forEach(x=>row.append($("td",null,fmt(x.values[i],3))));body.append(row)});
  }else{
   const hasPlan=info.records.some(x=>x.plan!==undefined);
   if(hasPlan){
    for(const r of info.records){const item=$("div","sm25-target-card");item.append($("h5",null,r.name),
      $("p",null,I("Realized","Realisasi")+" "+fmt(r.realization)+" "+r.unit),
      $("small",null,I("Planned","Rencana")+" "+fmt(r.plan)+" "+r.unit+" · "+fmt(100*r.realization/r.plan,1)+"%"));viz.append(item)}
    ["Item","Plan","Realization","Unit"].forEach(x=>h.append($("th",null,x)));
    info.records.forEach(r=>{const row=$("tr");[r.name,fmt(r.plan),fmt(r.realization),r.unit].forEach(v=>row.append($("td",null,v)));body.append(row)});
   }else{
    const records=info.records.map(x=>({name:x.name,value:x.value,unit:info.unit}));
    chartBars(viz,records,info.unit);
    ["Name","Value","Unit"].forEach(x=>h.append($("th",null,x)));
    records.forEach(r=>{const row=$("tr");[r.name,fmt(r.value,info.unit==="IDR"?0:2),r.unit].forEach(v=>row.append($("td",null,v)));body.append(row)});
   }
  }
  head.append(h);tbl.append(head,body);table.append(tbl);
 }
 kind.addEventListener("change",dataset);select.addEventListener("change",draw);draw();
}
function renderExplorationRegisters(root,registry){
 root.append($("h4",null,I("2025 Exploration · PSE Structures and Discovery Wells","Eksplorasi 2025 · Struktur PSE dan Sumur Penemuan")),
 $("p","sm25-note",I("24 structures with exploration status determinations (PSE) and 15 numbered well-discovery markers from the annual report. These are distinct registers. The report says 14 successful of 24 completed wells; one 15-entry marker is labelled uneconomic. This register is not a GIS well map or an estimate of certified 2026 reserves.","Terdapat 24 struktur PSE dan 15 penanda sumur temuan yang diberi nomor pada laporan. Keduanya daftar berbeda. Laporan menyebut 14 berhasil dari 24 sumur selesai; satu dari 15 penanda dinyatakan tidak ekonomis. Data ini bukan peta GPS atau estimasi cadangan pasti 2026.")));
 const actions=$("div","sm25-toolbar"),kind=selectBox([["pse","24 PSE determinations"],["discovery","15 well-discovery identifiers"]],"pse"),input=$("input","sm25-query");
 input.type="search";input.placeholder=I("Search PSC, contract area, well or structure","Cari KKKS, wilayah kerja, sumur, atau struktur");actions.append(kind,input);root.append(actions);
 const counter=$("p","sm25-note"),table=$("div","sm25-table-scroll");root.append(counter,table);
 function draw(){
  const q=input.value.trim().toLowerCase(),source=kind.value==="pse"?registry.pse_structures:registry.discovery_well_identifiers;
  const fields=kind.value==="pse"?["no","psc","area","structure"]:["map_id","psc","area","well","reported_result"];
  const rows=source.filter(x=>fields.map(k=>x[k]).join(" ").toLowerCase().includes(q));counter.textContent=rows.length+" / "+source.length+" original table rows (PDF p. "+(kind.value==="pse"?49:47)+")";
  table.replaceChildren();const tbl=$("table","sm25-table"),head=$("thead"),hr=$("tr");
  fields.forEach(k=>hr.append($("th",null,k.replaceAll("_"," "))));head.append(hr);tbl.append(head);
  const body=$("tbody");for(const row of rows){const tr=$("tr");fields.forEach(k=>tr.append($("td",null,row[k])));body.append(tr)}tbl.append(body);table.append(tbl);
 }
 kind.addEventListener("change",draw);input.addEventListener("input",draw);draw();
 root.append($("p","sm25-note",I("Source includes duplicate Rengasdengklok PSE entries #14 and #15; preserved as printed. Well-map identifiers are not WGS84 coordinates. Source: report PDF pp. 47 and 49.","Sumber memuat dua entri PSE Rengasdengklok #14 dan #15; keduanya dipertahankan. Nomor penanda sumur bukan koordinat WGS84. Sumber: PDF halaman 47 dan 49.")));
}
function renderPOD2025(root,register){
 root.append($("h4",null,I("2025 POD & Development Approvals · 45 Source Rows","Persetujuan POD dan Pengembangan 2025 · 45 Baris Sumber")),
  $("p","sm25-note",I("This register reports estimated recoverable additions at approval (oil MMBO, gas BSCF, combined MMBOE) by contractor and field. An approval does not establish operating status, marketable production, FID or realized capex.","Daftar ini memuat estimasi penambahan sumber daya pada persetujuan (minyak MMBO, gas BSCF, gabungan MMBOE) per kontraktor dan lapangan. Persetujuan bukan bukti proyek sudah beroperasi, produksi, FID atau realisasi investasi.")));
 const banner=$("div","sm25-pod-caveat");
 banner.append($("strong",null,I("UNRECONCILED ORIGINAL TOTAL","TOTAL SUMBER BELUM REKONSILIASI")),
 $("p",null,I("45 printed table rows total "+fmt(register.listed_table_sum_mmboe)+" MMBOE; report narrative states "+fmt(register.reported_narrative_reserve_addition_mmboe)+" MMBOE. Difference: "+fmt(register.unreconciled_difference_mmboe)+" MMBOE. Rows #10 and #25 repeat OPL Duri HO-4 with the same date. Both remain present exactly as printed; no adjusted total is asserted.","45 baris tabel berjumlah "+fmt(register.listed_table_sum_mmboe)+" MMBOE; narasi melaporkan "+fmt(register.reported_narrative_reserve_addition_mmboe)+" MMBOE. Selisih "+fmt(register.unreconciled_difference_mmboe)+" MMBOE. Baris #10 dan #25 mengulang OPL Duri HO-4 dengan tanggal sama, sehingga keduanya tetap dicatat tanpa total yang direkayasa.")));
 root.append(banner);
 const query=$("input","sm25-query");query.type="search";query.placeholder=I("Filter 45 rows by contractor, field or approval date…","Cari kontraktor, lapangan, atau tanggal persetujuan…");
 const stats=$("p","sm25-note"),chart=$("div","sm25-chart"),table=$("div","sm25-table-scroll");
 root.append(query,stats,chart,table);
 function draw(){
  const q=query.value.trim().toLowerCase();
  const subset=register.records.filter(r=>[r.operator,r.field,r.approval_date,r.no].join(" ").toLowerCase().includes(q));
  stats.textContent=subset.length+" / 45 "+I("printed source approvals · display uses combined MMBOE only for comparable bar lengths","persetujuan di tabel sumber · grafik memakai MMBOE gabungan agar sebanding");
  chartBars(chart,[...subset].sort((a,b)=>b.estimated_combined_mmboe-a.estimated_combined_mmboe).slice(0,12).map(x=>({name:"#"+x.no+" "+x.field,value:x.estimated_combined_mmboe,unit:"MMBOE"})),"MMBOE");
  table.replaceChildren();const t=$("table","sm25-table"),thead=$("thead"),head=$("tr");
  ["#","Contractor / KKKS","POD / field","Oil MMBO","Gas BSCF","Combined MMBOE","Approval date","PDF"].forEach(x=>head.append($("th",null,x)));
  thead.append(head);t.append(thead);const tb=$("tbody");
  for(const r of subset){const tr=$("tr");[r.no,r.operator,r.field,fmt(r.oil_mmbo),fmt(r.gas_bscf),fmt(r.estimated_combined_mmboe),r.approval_date,r.source_pdf_page].forEach(x=>tr.append($("td",null,x)));tb.append(tr)}
  t.append(tb);table.append(t);
 }
 query.addEventListener("input",draw);draw();
 root.append($("p","sm25-note","Source: SKK Migas Annual Report 2025 (English), Table 2.6, original PDF pp. 52–53. Numeric discrepancies, double-listed approval and NULL source dashes preserved."));
}
function renderCatalog(root,data,catalog){
 root.append($("h4",null,I("Report evidence navigator · original 202 PDF pages","Penelusuran bukti laporan · 202 halaman PDF")),
 $("p","sm25-note",I(catalog.entries.length+" indexed report exhibits: "+catalog.digitization_review.numerically_verified+" individually digitized, "+catalog.digitization_review.source_only+" source-only. Original nonnumeric figures and printed maps stay source-linked, not fabricated as GIS.","Ada "+catalog.entries.length+" item laporan: "+catalog.digitization_review.numerically_verified+" sudah didigitalkan numerik dan "+catalog.digitization_review.source_only+" masih referensi sumber. Ilustrasi dan peta cetak tidak direkayasa menjadi GIS.")));
 const controls=$("div","sm25-toolbar"),kind=selectBox([["all",I("All content","Semua")],["graph","Graphs"],["table","Tables"],["figure","Figures"],["map","Original printed maps"]],"all"),search=$("input","sm25-query");
 search.type="search";search.placeholder=I("Search graph, region, PSC, reserves…","Cari grafik, wilayah, KKKS, cadangan…");
 controls.append(kind,search);
 const results=$("div","sm25-catalog"),meta=$("p","sm25-note");root.append(controls,meta,results);
 let count=30;
 function redraw(){
  results.replaceChildren();const q=search.value.trim().toLowerCase();
  const filtered=catalog.entries.filter(x=>(kind.value==="all"||x.kind===kind.value)&&(!q||[x.title,x.number,x.kind,x.pdf_page,x.printed_page].join(" ").toLowerCase().includes(q)));
  meta.textContent=filtered.length+" entries match · "+catalog.entries.length+" original indexed exhibits.";
  for(const x of filtered.slice(0,count)){
   const card=$("article","sm25-catalog-item");
   card.append($("small",null,x.kind.toUpperCase()+" "+x.number+" · PDF p. "+x.pdf_page+" · printed p. "+x.printed_page),
    $("strong",null,x.title),
    $("span","sm25-catalog-status",x.status==="source-catalog-only"?I("Source referenced · not yet numerically digitized","Rujukan sumber · belum didigitalkan"):x.status==="digitized_verified"?I("Numeric values digitized and audited","Angka sudah didigitalkan dan diperiksa"):x.status==="structured_table_verified"?I("Complete named register digitized","Daftar nama telah didigitalkan"):I("Related KPI/table already normalized","KPI/tabel terkait sudah dinormalisasi")));
   card.append(links(data.source_url,I("Find in SKK Migas official report ↗","Buka katalog laporan resmi ↗")));results.append(card);
  }
  if(filtered.length>count){const more=$("button","sm25-more",I("Show more","Lihat lagi"));more.type="button";more.addEventListener("click",()=>{count+=30;redraw()});results.append(more)}
 }
 kind.addEventListener("change",()=>{count=30;redraw()});search.addEventListener("input",()=>{count=30;redraw()});redraw();
}
function renderProjectDossiers(block,data){
 const projects=data.onstream_2025||[];
 block.append($("h4",null,I("16 Upstream Projects Brought Onstream in 2025","16 proyek hulu migas mulai beroperasi 2025")),
  $("p","sm25-note",I("SKK Migas reports 16 projects onstream in 2025 and aggregate planned production capacity of 85,550 BOPD oil and 821 MMSCFD gas. Total CAPEX attributed to this cohort is US$704.6 million, NOT each project. A project onstream during 2025 does not independently certify 2026 utilization.","SKK Migas mencatat 16 proyek onstream 2025 dengan kapasitas rencana agregat minyak 85.550 BOPD dan gas 821 MMSCFD. CAPEX agregat US$704,6 juta untuk keseluruhan kohort, bukan per proyek. Status 2026 belum dipastikan.")));
 const filter=$("input","sm25-query");filter.type="search";filter.placeholder=I("Search operator, PSC, field or project…","Cari operator, wilayah kerja, atau proyek…");
 const grid=$("div","sm25-projects");block.append(filter,grid);
 function draw(){grid.replaceChildren();const q=filter.value.trim().toLowerCase();const chosen=projects.filter(x=>[x.name,x.operator,x.locality].join(" ").toLowerCase().includes(q));
  for(const x of chosen){const item=$("article","sm25-project");
   item.append($("small",null,"2025 ONSTREAM · #"+x.seq+" · PDF p. "+x.pdf_page),
    $("strong",null,x.name),$("p",null,x.operator),$("span",null,x.locality),
    $("small",null,I("No validated 2026 operating state or site GPS from the PDF","Status operasional 2026 dan titik GPS belum terverifikasi")));
   grid.append(item)}
  if(!chosen.length)grid.append($("p","sm25-note",I("No matching published project names","Tidak ditemukan proyek dalam daftar sumber")));
 }
 filter.addEventListener("input",draw);draw();
 block.append($("p","sm25-note",I("Reported project list and names: SKK Migas Annual Report English PDF pp. 67–86; not a nationwide census of every operating oil/gas asset. Existing SLI Strategic Map remains a separate geography dataset.","Daftar proyek dan operator bersumber dari PDF SKK Migas Inggris hal. 67–86; bukan sensus nasional setiap fasilitas migas. Peta SLI memakai sumber geografi tersendiri.")));
}
function renderMap(block,data){
 block.append($("h4",null,I("Work Areas, Reserves and Project Locations · spatial audit","Wilayah Kerja, Cadangan, dan Proyek · audit spasial")),
 $("p","sm25-note",I("The SKK Migas annual report supplies printed work-area maps (PDF pp. 190–198), exploration-location illustrations (pp. 42, 47), and a reserves basin map (p. 50). These are not authoritative WGS84 polygons. To inspect verified site/contractor localities use SLI Strategic Map; no false GPS pins are generated from raster figures.","Laporan SKK Migas menyediakan peta cetak wilayah kerja (halaman PDF 190–198), peta eksplorasi (42, 47), serta peta cekungan cadangan (50). Gambar cetak tersebut bukan polygon GIS WGS84. Lokasi yang terverifikasi dapat dilihat pada Strategic Map; tidak dibuat koordinat palsu.")));
 const refs=$("div","sm25-spatial");
 for(const [p,title] of [[42,"2025 drilling"],[47,"Exploration discoveries"],[50,"Oil & gas 2R reserves"],[190,"National work-area atlas"],[192,"Sumatra / Natuna"],[194,"Java / Kalimantan"],[196,"Eastern Indonesia"],[198,"Nonconventional WK"]]){
  const item=$("div","sm25-spatial-item");item.append($("small",null,"PDF "+p),$("strong",null,title));refs.append(item)}
 refs.append(links("#map",I("Open SLI verified Strategic Map →","Buka Strategic Map SLI →")));
 block.append(refs);
}
async function mount(where,mode){
 const root=typeof where==="string"?document.getElementById(where):where;if(!root)return;
 const section=$("section","sm25-report");root.replaceChildren(section);
 section.append($("small","sm25-eyebrow","SKK MIGAS · 2025 ANNUAL REPORT · 202-PAGE SOURCE"),
 $("h3",null,I("Upstream Oil & Gas · Investor Intelligence","Intelijen Investasi · Hulu Minyak dan Gas")),
 $("p","sm25-intro",I("English annual report is the primary numeric source; the Indonesian edition is a translation cross-check. Production ≠ lifting, reserves ≠ resources, plans ≠ realized investments.","Laporan tahunan Inggris sebagai sumber angka utama; versi Indonesia sebagai pemeriksa istilah. Produksi ≠ lifting, cadangan ≠ sumber daya, rencana ≠ realisasi investasi.")));
 const state=$("p","sm25-note",I("Loading audited report measures…","Memuat data laporan…"));section.append(state);
 try{
  const [d,c,exhibits,pod,exregister,extra]=await Promise.all([fetch(BASE,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("No baseline");return r.json()}),fetch(CAT,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("No figure catalog");return r.json()}),fetch("data/skkmigas-2025-digitized-exhibits.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("No digitized data");return r.json()}),fetch("data/skkmigas-2025-pod-approvals.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("No POD register");return r.json()}),fetch("data/skkmigas-2025-exploration-registers.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("No exploration register");return r.json()}),fetch("data/skkmigas-2025-source-extension.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("No report source extension");return r.json()})]);
  if(d.id!=="sli-skkmigas-annual-2025"||c.entries.length<100||exhibits.series.length<20||pod.records.length!==45||extra.risk_register?.length!==12||extra.categories?.length!==3||exregister.pse_structures.length!==24||exregister.discovery_well_identifiers.length!==15||Math.abs(pod.listed_table_sum_mmboe-643.42)>.01)throw Error("Report index or source register incomplete");
  if(!section.isConnected)return;
  state.textContent=I("2025 source values · report edition 2026 · "+d.metrics.length+" verified KPI definitions · "+d.series.length+" dated time series · "+c.entries.length+" source exhibits, plus "+exhibits.series.length+" newly digitized numeric series. NOT real-time.","Tahun data 2025 · edisi laporan 2026 · "+d.metrics.length+" KPI terverifikasi · "+d.series.length+" deret waktu · "+c.entries.length+" katalog sumber dan "+exhibits.series.length+" seri tambahan. BUKAN data real-time.");
  const tabs=$("div","sm25-tabs"),panel=$("div","sm25-pane");
  const pageTabs=[["overview",I("Executive KPIs","KPI utama")],["trend",I("Historical data","Data historis")],["gas",I("Gas Sankey","Sankey gas")],["targets",I("Targets vs actual","Target vs realisasi")],["mapping",I("PSC / basin maps","Peta WK / cekungan")],["projects",I("16 onstream projects","16 proyek onstream")],["digitized",I("Digitized figures","Grafik digital")],["sourceplus",I("Investor insights 2025","Analisis investor 2025")],["pods",I("45 POD approvals","45 persetujuan POD")],["exploration",I("Exploration registers","Daftar eksplorasi")],["catalog",I("Source catalog","Katalog sumber")]];
  let active=mode==="investment"?"trend":"overview";
  function render(){panel.replaceChildren();for(const b of tabs.querySelectorAll("button")){b.classList.toggle("active",b.dataset.tab===active);b.setAttribute("aria-pressed",b.dataset.tab===active?"true":"false")}
   if(active==="overview")renderKpi(panel,d);
   else if(active==="trend")renderSeries(panel,d);
   else if(active==="gas")renderGas(panel,d);
   else if(active==="targets")renderTarget(panel,d);
   else if(active==="mapping")renderMap(panel,d);
   else if(active==="projects")renderProjectDossiers(panel,d);
   else if(active==="digitized")renderDigitizedExhibits(panel,exhibits);
   else if(active==="sourceplus")window.initSLISKKExtra2025?.(panel,extra);
   else if(active==="pods")renderPOD2025(panel,pod);
   else if(active==="exploration")renderExplorationRegisters(panel,exregister);
   else renderCatalog(panel,d,c);
  }
  for(const [id,title] of pageTabs){const b=$("button","sm25-tab",title);b.type="button";b.dataset.tab=id;b.addEventListener("click",()=>{active=id;render()});tabs.append(b)}
  section.append(tabs,panel);render();
  section.append($("p","sm25-method",d.scope_note+" Source: "+d.source_url+" · source pages refer to the uploaded 202-page English PDF. The catalog links to the official publication directory, not a guaranteed deep-linked PDF page."));
  section.append(links(d.source_url,I("SKK Migas official annual publications ↗","Publikasi tahunan resmi SKK Migas ↗")));
 }catch(err){state.textContent=I("SKK Migas 2025 report data is temporarily unavailable. Please consult the official annual publication.","Data laporan SKK Migas 2025 tidak dapat dimuat; silakan merujuk katalog resmi.");console.warn("[SLI SKK Migas]",err);}
}
window.initSLISKKAnnual2025=mount;
})();