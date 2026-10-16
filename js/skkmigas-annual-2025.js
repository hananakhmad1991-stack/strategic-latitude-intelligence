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
 let p=0;for(const x of first){const h=x.value*leftScale;S("path",svg,{d:"M44,"+(top+p)+" C126,"+(top+p)+" 170,"+sy+" 245,"+sy,fill:"none",stroke:x.color,opacity:".45","stroke-width":Math.max(1,h)});p+=h;sy=top+p-h/2; }
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
function renderCatalog(root,data,catalog){
 root.append($("h4",null,I("Original report evidence navigator · 202 PDF pages","Penelusuran bukti laporan · 202 halaman PDF")),
 $("p","sm25-note",I("The 99 indexed graphics, tables, figures and printed maps below are ALL traceable to original PDF page numbers. Status 'source catalog' means it has not yet been digitized into an auditable machine-data series; it is not a claim that a new interactive GIS polygon or chart already exists.","99 grafik, tabel, gambar, dan peta tercetak memiliki halaman PDF sumber. Status katalog berarti isi belum seluruhnya dikonversi menjadi data mesin terverifikasi; bukan klaim semua peta sudah berbentuk GIS.")));
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
    $("span","sm25-catalog-status",x.status==="source-catalog-only"?I("Source referenced · not yet fully digitized","Rujukan sumber · belum dinormalisasi penuh"):I("Related verified KPI/table available","Data/KPI terkait tersedia")));
   card.append(links(data.source_url,I("Find in SKK Migas official report ↗","Buka katalog laporan resmi ↗")));results.append(card);
  }
  if(filtered.length>count){const more=$("button","sm25-more",I("Show more","Lihat lagi"));more.type="button";more.addEventListener("click",()=>{count+=30;redraw()});results.append(more)}
 }
 kind.addEventListener("change",()=>{count=30;redraw()});search.addEventListener("input",()=>{count=30;redraw()});redraw();
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
  const [d,c]=await Promise.all([fetch(BASE,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("No baseline");return r.json()}),fetch(CAT,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("No figure catalog");return r.json()})]);
  if(d.id!=="sli-skkmigas-annual-2025"||c.entries.length<90)throw Error("Report index incomplete");
  if(!section.isConnected)return;
  state.textContent=I("2025 source values · report edition 2026 · "+d.metrics.length+" verified KPI definitions · "+d.series.length+" dated time series · "+c.entries.length+" table/graph/figure/map references. NOT real-time.","Tahun data 2025 · edisi laporan 2026 · "+d.metrics.length+" KPI terverifikasi · "+d.series.length+" deret waktu · "+c.entries.length+" grafik/tabel/gambar/peta. BUKAN data real-time.");
  const tabs=$("div","sm25-tabs"),panel=$("div","sm25-pane");
  const pageTabs=[["overview","Executive KPIs"],["trend","Historical data"],["gas","Gas Sankey"],["targets","Targets vs actual"],["mapping","PSC / basin map"],["catalog","Source catalog"]];
  let active=mode==="investment"?"trend":"overview";
  function render(){panel.replaceChildren();for(const b of tabs.querySelectorAll("button")){b.classList.toggle("active",b.dataset.tab===active);b.setAttribute("aria-pressed",b.dataset.tab===active?"true":"false")}
   if(active==="overview")renderKpi(panel,d);
   else if(active==="trend")renderSeries(panel,d);
   else if(active==="gas")renderGas(panel,d);
   else if(active==="targets")renderTarget(panel,d);
   else if(active==="mapping")renderMap(panel,d);
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