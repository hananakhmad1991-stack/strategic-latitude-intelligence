/* KKP 2024 Marine Data Exploration: source-limited 33-region hatchery map,
 * 10 observed district-to-commodity Sankey, and two comparable national
 * historical *indices*. Does not invent missing data or crosswalk flows.
 */
const BASE=new URL("../data/",import.meta.url);
const sourceURL=file=>new URL(file,BASE);
const $=id=>document.getElementById(id);
const en=()=>document.documentElement.lang?.startsWith("en");
const T=(id,english)=>en()?english:id;
const fmt=(n,d=0)=>new Intl.NumberFormat(en()?"en-US":"id-ID",{maximumFractionDigits:d}).format(n);
const ns="http://www.w3.org/2000/svg";
const el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=String(txt);return x;};
const svg=(tag,props)=>{const x=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(props||{}))x.setAttribute(k,String(v));return x;};
export function validateMarineVisualInputs(prov,detail,history){
 const problems=[];
 if(prov?.rows?.length!==33||prov.visible_cards_sum!==187483665||prov.national_total_displayed!==188203415||prov.unallocated_displayed_gap!==719750)problems.push("province_scope");
 if(prov?.rows?.reduce((sum,x)=>sum+x.volume_ribu_ekor,0)!==prov.visible_cards_sum)problems.push("province_subtotal");
 const d=detail?.seed_district_top_rows;
 if(d?.year!==2024||d.selected_count!==10||d.source_rows_displayed!==1387||d.rows?.length!==10||d.status!=="source_visible_top_10_only_not_full_1387")problems.push("district_subset");
 if(d?.rows?.some(x=>!Number.isFinite(x.volume_ribu_ekor)||x.volume_ribu_ekor<=0||!x.province||!x.district||!x.species))problems.push("district_cell");
 if(history?.series?.length!==2||history.series.some(s=>s.years?.join(",")!=="2019,2020,2021,2022,2023,2024"||s.national_totals?.some(v=>!(v>0))))problems.push("history");
 return {pass:problems.length===0,problems};
}
export function indexSeries(history){
 return history.series.map(s=>{
  const base=s.national_totals[0];
  return {id:s.id,unit:"2019=100",years:s.years,values:s.national_totals.map(v=>+((v/base)*100).toFixed(2))};
 });
}
export function districtFlows(detail){
 const d=detail.seed_district_top_rows;
 const rows=d.rows.map(x=>({...x,share_of_displayed_subset:null}));
 const total=rows.reduce((s,x)=>s+x.volume_ribu_ekor,0);
 return {total,records:rows.map(x=>({...x,share_of_displayed_subset:x.volume_ribu_ekor/total})),source_rows_displayed:d.source_rows_displayed,displayed_subset:rows.length};
}
export function yearMatrix(series){
 return series.rows.map(r=>({province:r.province,years:series.years.map((year,i)=>({year,value:r.values[i],source_url:series.source_url})),complete:r.values.every(v=>v!==null)}));
}
function createGroup(parent,klass,text){const n=el("div",klass,text);parent.append(n);return n;}
function renderHatcheryMap(prov){
 const host=$("mfVizHatcheryMap"),sel=$("mfVizHatcherySelected");
 if(!window.SLIProvinceMap){host.textContent=T("Komponen peta belum dimuat.","Province map component unavailable.");return}
 const records=prov.rows.map(x=>({name:x.province,value:x.volume_ribu_ekor,period:"2024",source:prov.source_url}));
 window.SLIProvinceMap.render(host,{records,selected:host.dataset.selected||"",period:"2024",unit:"ribu ekor",digits:0,missing:T("Tidak tercetak / tidak tersedia","No printed figure"),label:"KKP 2024 pembenihan: 33 angka provinsi yang tampak",source:"KKP 15-10-2025; "+T("38 bentuk poligon komunitas, bukan BIG resmi","community polygon outlines, NOT official BIG"),onSelect(name,record){
  host.dataset.selected=name;
  sel.textContent=name+" · "+(record?.value===null?T("sel sumber tak ada; jangan tafsirkan sebagai nol","no original data cell, not zero"):fmt(record.value)+" ribu ekor")+". "+T("2024, batas peta ilustratif.","2024, illustrative boundaries.");
  renderHatcheryMap(prov);
 }});
}
function drawNationalIndices(history){
 const host=$("mfVizNationalIndex"),series=indexSeries(history);
 if(!host)return;
 const W=860,H=330,pad=52,x=i=>pad+i*(W-2*pad)/5,y=v=>H-pad-(v-65)/(160-65)*(H-2*pad);
 host.replaceChildren();
 const chart=svg("svg",{viewBox:`0 0 ${W} ${H}`,role:"img","aria-label":T("Dua indeks historis nasional 2019=100","Two national historical indices 2019=100")});
 for(const value of [75,100,125,150]){
  chart.append(svg("line",{x1:pad,y1:y(value),x2:W-pad,y2:y(value),stroke:"#4d6378","stroke-dasharray":value===100?"none":"3 5","stroke-width":value===100?2:1}));
  const l=svg("text",{x:7,y:y(value)+4,fill:"#d5e7f0","font-size":12});l.textContent=value;chart.append(l);
 }
 const colors=["#72d1d1","#f5c577"];
 series.forEach((s,j)=>{
  const points=s.values.map((v,i)=>x(i)+","+y(v));
  chart.append(svg("polyline",{points:points.join(" "),fill:"none",stroke:colors[j],"stroke-width":3.5,"stroke-linecap":"round","stroke-linejoin":"round"}));
  s.values.forEach((v,i)=>{
   const circle=svg("circle",{cx:x(i),cy:y(v),r:5,fill:colors[j],stroke:"#143348","stroke-width":1.2});
   const title=svg("title");title.textContent=s.id+" · "+s.years[i]+": "+fmt(v,2)+" (2019=100)";circle.append(title);chart.append(circle);
  });
 });
 for(let i=0;i<6;i++){const label=svg("text",{x:x(i),y:H-16,"text-anchor":"middle",fill:"#e2e8ef","font-size":12});label.textContent=2019+i;chart.append(label)}
 host.append(chart);
 const legend=el("p","mf-hint",T("2019 = 100 untuk masing-masing seri. Nelayan (jumlah orang) dan rumput laut (ton) TIDAK dijumlahkan; grafik hanya membandingkan indeks perubahan relatif. Pemekaran provinsi memengaruhi perbandingan regional.","Each series rebased to 2019 = 100. Marine fisher headcounts and seaweed tonnage are NOT added; relative change only. Regional boundary changes can affect subnational comparability."));
 host.append(legend);
}
function drawHatcheryCoverage(prov){
 const host=$("mfVizHatcheryCoverage");if(!host)return;host.replaceChildren();
 const pct=prov.visible_cards_sum/prov.national_total_displayed*100,missing=100-pct;
 const bar=el("div","mf-viz-coverage-rail"),part=el("span","mf-viz-coverage-reported");
 part.style.width=pct.toFixed(4)+"%";bar.append(part);host.append(bar);
 const labels=el("div","mf-viz-coverage-labels");
 labels.append(el("span","",T("Jumlah 33 kartu tercetak: ","Sum of 33 printed cards: ")+fmt(prov.visible_cards_sum)+" ribu ekor ("+fmt(pct,2)+"%)"),
 el("span","",T("Selisih belum teralokasi: ","Unallocated difference: ")+fmt(prov.unallocated_displayed_gap)+" ribu ekor ("+fmt(missing,2)+"%)"));
 host.append(labels);
}
export function layoutDistrictSankey(detail){
 const {records,total}=districtFlows(detail),H=450,W=1050,top=44,available=375,gap=7,coords=[170,520,858],w=14;
 const nodes=[new Map(),new Map(),new Map()];
 const labels=[x=>x.province,x=>x.province+" / "+x.district,x=>x.species];
 const paths=[];
 for(const r of records){
  for(let col=0;col<3;col++){
   const key=labels[col](r);
   if(!nodes[col].has(key))nodes[col].set(key,{key,col,total:0});
   nodes[col].get(key).total+=r.volume_ribu_ekor;
  }
 }
 const scale=Math.min(...nodes.map(m=>(available-gap*(m.size-1))/total));
 const lists=nodes.map(m=>[...m.values()].sort((a,b)=>b.total-a.total||a.key.localeCompare(b.key)));
 for(let col=0;col<3;col++){let y=top;for(const n of lists[col]){n.y=y;n.height=n.total*scale;n.outOffset=0;n.inOffset=0;n.x=coords[col];y+=n.height+gap;}}
 for(const r of records){
  const a=nodes[0].get(labels[0](r)),b=nodes[1].get(labels[1](r)),c=nodes[2].get(labels[2](r));
  const thick=r.volume_ribu_ekor*scale;
  for(const [from,to,stage]of [[a,b,0],[b,c,1]]){
   const y0=from.y+from.outOffset,y1=to.y+to.inOffset;from.outOffset+=thick;to.inOffset+=thick;
   const x0=from.x+w,x1=to.x,m0=x0+(x1-x0)*.47,m1=x0+(x1-x0)*.53;
   const d=`M${x0} ${y0} C${m0} ${y0} ${m1} ${y1} ${x1} ${y1} L${x1} ${y1+thick} C${m1} ${y1+thick} ${m0} ${y0+thick} ${x0} ${y0+thick}Z`;
   paths.push({d,stage,record:r,width:thick});
  }
 }
 return {W,H,total,nodes:lists,paths,columns:coords};
}
function drawSankey(detail){
 const host=$("mfVizHatcherySankey"),status=$("mfVizSankeySelected");
 const g=layoutDistrictSankey(detail);if(!host)return;host.replaceChildren();
 const chart=svg("svg",{viewBox:`0 0 ${g.W} ${g.H}`,role:"group","aria-label":"10 baris resmi KKP, provinsi ke kabupaten/kota ke komoditas"});
 const heads=[T("Provinsi","Province"),T("Kabupaten / kota","District / city"),T("Kelompok ikan","Fish group")];
 heads.forEach((l,i)=>{let a=svg("text",{x:g.columns[i],y:24,fill:"#eaf3f6","font-size":17,"font-weight":700});a.textContent=l;chart.append(a)});
 for(const item of g.paths){
  const p=svg("path",{d:item.d,fill:item.stage===0?"#4ea8b5":"#e8ae6b","fill-opacity":"0.38","stroke":"none",tabindex:0,role:"button","aria-label":item.record.province+" / "+item.record.district+" / "+item.record.species});
  p.classList.add("mf-viz-sankey-ribbon");
  const act=()=>{status.textContent=item.record.province+" → "+item.record.district+" → "+item.record.species+": "+fmt(item.record.volume_ribu_ekor)+" ribu ekor · "+T("nilai sumber","source-reported value")+" Rp "+fmt(item.record.value_rp_million)+" juta · "+fmt(item.record.share_of_displayed_subset*100,1)+"% "+T("dari 10 baris ini, bukan pangsa nasional","of only the 10 selected rows, NOT national share");};
  p.addEventListener("click",act);p.addEventListener("keydown",e=>{if(["Enter"," "].includes(e.key)){e.preventDefault();act()}});
  const title=svg("title");title.textContent=item.record.province+" → "+item.record.district+" → "+item.record.species+" · "+fmt(item.record.volume_ribu_ekor)+" ribu ekor";p.append(title);chart.append(p);
 }
 const colors=["#4ba6b1","#c49f6b","#7aabc4"];
 for(let col=0;col<3;col++)for(const n of g.nodes[col]){
  const rect=svg("rect",{x:n.x,y:n.y,width:14,height:Math.max(2,n.height),rx:2,fill:colors[col],stroke:"#b4d4df","stroke-width":.4});
  const label=svg("title");label.textContent=n.key+" · "+fmt(n.total)+" ribu ekor";rect.append(label);chart.append(rect);
  if(n.height>=15){
   const title=svg("text",{x:n.x+19,y:n.y+Math.min(n.height/2+4,16),fill:"#d8e8ed","font-size":10});title.textContent=n.key.replace(/^[^/]+\//,"").slice(0,27);chart.append(title);
  }
 }
 host.append(chart);
 $("mfVizSankeySummary").textContent=T("Aliran 10 baris kabupaten/komoditas yang benar-benar tercetak. Total subset ","Sankey of ONLY 10 source-visible district/commodity rows. Subset sum ")+fmt(g.total)+" ribu ekor. "+T("Bukan keseluruhan 1.387 baris, tidak boleh ditafsirkan sebagai total kabupaten atau provinsi.","NOT all 1,387 rows, not total district or provincial volume.");
}
async function mount(){
 if(!$("mfVizHatcheryMap"))return;
 try{
  const files=["sli-kkp-hatchery-province-cards-2024.json","sli-kkp-portal-screened-2024.json","sli-kkp-regional-historical-2019-2024.json"];
  const responses=await Promise.all(files.map(x=>fetch(sourceURL(x),{cache:"no-store",sliLocalOnly:true})));
  if(responses.some(r=>!r.ok))throw Error("HTTP source file unavailable");
  const [prov,detail,history]=await Promise.all(responses.map(r=>r.json()));
  const status=validateMarineVisualInputs(prov,detail,history);
  if(!status.pass)throw Error("visual_source_validation_"+status.problems.join(","));
  drawHatcheryCoverage(prov);renderHatcheryMap(prov);drawNationalIndices(history);drawSankey(detail);
  const update=()=>{drawHatcheryCoverage(prov);renderHatcheryMap(prov);drawNationalIndices(history);drawSankey(detail)};
  document.addEventListener("sli:languagechange",update);
 }catch(e){$("mfVizHatcheryMap").textContent=T("Tidak ada data resmi yang lolos validasi untuk visualisasi tambahan: ","No source-validated numbers for additional visualizations: ")+e.message;console.error("[SLI KKP visual lab]",e)}
}
if(typeof document!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount()}
