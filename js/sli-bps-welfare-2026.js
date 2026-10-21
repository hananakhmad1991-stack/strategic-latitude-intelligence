/* SLI Susenas 2026 human welfare: 23 national series, 7 province comparison slices.
   A public small-subset data explorer. All map shapes are SLI source geometry;
   every observation retains the original BPS table/page. No invented zeroes.
*/
(function(){
"use strict";
const SRC="./data/sli-bps-welfare-2026.json";
const MAP="./data/sli-indonesia-province-38.geojson";
const $=s=>document.querySelector(s);
const svgNS="http://www.w3.org/2000/svg";
const num=v=>v===null||v===undefined?"NA":Number(v).toLocaleString("id-ID",{maximumFractionDigits:2})+"%";
const norm=s=>String(s||"").toLowerCase().replace(/sumatra/g,"sumatera").replace(/kepulauan /g,"kep. ").replace(/daerah istimewa /g,"di ").replace(/dki /g,"dki ").replace(/[^a-z0-9]/g,"");
const fmt=v=>v==="~0"?"≈0":v===null||v===undefined?"NA":Number(v).toLocaleString("id-ID",{maximumFractionDigits:2});

function samplePrecision(data,metric,province){
 const source=data.sampling_error_2026?.metrics?.[metric.id];
 if(!source)return {status:"unlinked",label:"RSE belum ditautkan untuk indikator ini",rse:null,ci:null,source:null};
 const idx=data.provinces.findIndex(p=>p.name===province);
 if(idx<0)return {status:"unlinked",label:"Wilayah tidak ditemukan",rse:null,ci:null,source:null};
 const rse=source.relative_standard_error_pct[idx],se=source.standard_error_pp?.[idx]??null,lo=source.confidence_interval_low_pct[idx],hi=source.confidence_interval_high_pct[idx];
 const status=rse===null?"not_reported":rse>50?"unreliable":rse>25?"caution":"standard";
 const label=status==="unreliable"?"Tidak andal":status==="caution"?"Gunakan hati-hati":status==="standard"?"Presisi memadai":"RSE tidak dilaporkan";
 return {status,label,rse,se,ci:lo!==null&&hi!==null?[lo,hi]:null,source};
}
function precisionText(q){
 if(q.status==="unlinked")return q.label;
 return "SE "+(q.se===null?"NA":fmt(q.se)+" poin persentase")+" · RSE "+(q.rse===null?"NA":fmt(q.rse)+"%")+" · "+q.label+
  (q.ci?" · CI 95% "+fmt(q.ci[0])+"–"+fmt(q.ci[1])+"%":"")+
  " · Tabel "+q.source.sampling_table+" PDF hal. "+q.source.pdf_page;
}

function el(tag,attrs={},value){
 const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);
 if(value!==undefined)n.textContent=String(value);return n;
}
function svgEl(tag,attrs={}){const n=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n}
function setOptions(select,entries,selected){
 select.replaceChildren();for(const [value,label] of entries){const option=el("option",{value},label);select.append(option)}
 if(entries.some(a=>a[0]===selected))select.value=selected;
}
async function load(){
 const r=await fetch(SRC,{cache:"no-cache"});if(!r.ok)throw Error("Dataset HTTP "+r.status);
 const data=await r.json();
 if(data?.schema!=="sli-bps-welfare-2026-v1"||data.provinces?.length!==39||data.provincial_metrics?.length!==9)throw Error("Versi dataset tidak valid.");
 return data;
}
function choroplethColor(v,min,max){
 if(v===null)return "#657084";
 const t=(max>min)?(v-min)/(max-min):.5;
 const light=79-t*40;
 return "hsl("+(197+t*17)+", 64%, "+light+"%)";
}
function pathCoords(geometry){
 const rings=[];
 const polys=geometry.type==="MultiPolygon"?geometry.coordinates:geometry.type==="Polygon"?[geometry.coordinates]:[];
 for(const p of polys)for(const ring of p){
  const points=ring.map(([lon,lat])=>[(lon-92.8)*22.3,(8.6-lat)*23.2]);
  if(points.length>2)rings.push("M"+points.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join("L")+"Z")
 }
 return rings.join(" ");
}
function drawMap(data,geo,metric,selectedName,onSelect){
 const svg=$("#welfareMap");svg.replaceChildren();
 const vals=new Map(data.provinces.filter(p=>p.name!=="Indonesia").map(p=>[norm(p.name),p.values[metric.index]]));
 const numbers=[...vals.values()].filter(Number.isFinite);
 const min=Math.min(...numbers),max=Math.max(...numbers);
 let matched=0;
 for(const feature of geo.features||[]){
  const name=feature.properties?.PROVINSI||feature.properties?.name||"";
  const value=vals.has(norm(name))?vals.get(norm(name)):null;
  const matchedProvince=data.provinces.find(p=>norm(p.name)===norm(name));
  const q=samplePrecision(data,metric,matchedProvince?.name||"");
  if(vals.has(norm(name)))matched++;
  const path=svgEl("path",{d:pathCoords(feature.geometry),
    fill:q.status==="unreliable"?"#7f7286":choroplethColor(value,min,max),
    stroke:q.status==="caution"?"#e3b75b":"#13263c",
    "stroke-width":q.status==="caution"?"1.7":".75",
    "fill-rule":"evenodd",tabindex:"0",role:"button","aria-label":name+": "+num(value)+" · "+precisionText(q)});
  if(norm(name)===norm(selectedName))path.setAttribute("stroke-width","3");
  const title=svgEl("title");title.textContent=name+": "+num(value)+" · "+precisionText(q);path.append(title);
  const click=()=>onSelect(name);path.addEventListener("click",click);
  path.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();click()}});
  svg.append(path);
 }
 $("#geoMatch").textContent=matched+"/38 geometri cocok · ungu keabu-abuan = RSE >50% (tidak andal); garis kuning = RSE >25–50% (hati-hati). Warna lain menunjukkan nilai, bukan baik atau buruk.";
}
function drawRank(data,metric,onSelect){
 const div=$("#rankBars");div.replaceChildren();
 const rows=data.provinces.filter(p=>p.name!=="Indonesia"&&typeof p.values[metric.index]==="number"&&samplePrecision(data,metric,p.name).status!=="unreliable")
  .sort((a,b)=>b.values[metric.index]-a.values[metric.index]);
 const top=rows.slice(0,12);const max=Math.max(...rows.map(p=>p.values[metric.index]),1);
 for(const p of top){
  const b=el("button",{class:"bar-row",type:"button","aria-label":p.name+" "+num(p.values[metric.index])});
  b.append(el("span",{class:"bar-region"},p.name));
  const track=el("span",{class:"bar-track"});
  track.append(el("span",{class:"bar-fill",style:"width:"+Math.min(100,p.values[metric.index]/max*100)+"%"}));
  b.append(track);b.append(el("span",{class:"bar-value"},num(p.values[metric.index])+(samplePrecision(data,metric,p.name).status==="caution"?" ⚠":"")));
  b.addEventListener("click",()=>onSelect(p.name));div.append(b)
 }
 $("#rankNote").textContent="12 nilai tertinggi, RSE >50% dikeluarkan dari peringkat. ⚠ = RSE >25–50%. Tiga indikator tanpa tautan RSE tepat bersifat eksploratif. Angka tinggi tidak otomatis lebih baik.";
}
function renderTable(data,metric,selectedName,onSelect,search){
 const body=$("#provinceRows");body.replaceChildren();
 const query=norm(search);
 let rows=data.provinces.filter(p=>p.name!=="Indonesia");
 if(query)rows=rows.filter(p=>norm(p.name).includes(query));
 const mode=$("#sortMode").value;
 rows.sort((a,b)=>mode==="ascending"?(a.values[metric.index]??-1)-(b.values[metric.index]??-1):
  mode==="alphabetical"?a.name.localeCompare(b.name,"id"):
  (b.values[metric.index]??-1)-(a.values[metric.index]??-1));
 for(const [i,p] of rows.entries()){
  const tr=el("tr");if(norm(p.name)===norm(selectedName))tr.classList.add("chosen");
  const th=el("th",{scope:"row"});
  const a=el("button",{type:"button",class:"region-link"},p.name);
  a.addEventListener("click",()=>onSelect(p.name));th.append(a);
  const q=samplePrecision(data,metric,p.name);
  tr.append(el("td",{},i+1));tr.append(th);tr.append(el("td",{},num(p.values[metric.index])));
  tr.append(el("td",{},q.se===null?"—":fmt(q.se)));
  tr.append(el("td",{},q.rse===null?"—":fmt(q.rse)+"%"));
  tr.append(el("td",{},q.ci?fmt(q.ci[0])+"–"+fmt(q.ci[1]):"—"));
  tr.append(el("td",{},q.label));
  body.append(tr)
 }
 $("#tableCount").textContent=rows.length+" provinsi ditampilkan; Indonesia (nilai nasional) "+num(data.provinces.at(-1).values[metric.index])+".";
}
function renderTrend(data){
 const sel=$("#trendSelect");const s=data.national_series.find(i=>i.id===sel.value)||data.national_series[0];
 const host=$("#trendSvg");host.replaceChildren();
 const years=data.years, valid=s.values.map((v,i)=>({v,y:years[i],i})).filter(p=>typeof p.v==="number");
 if(!valid.length){$("#trendCaption").textContent="Belum tersedia.";return}
 const width=720,height=244,left=50,top=20,right=25,bottom=47;
 const min=Math.max(0,Math.min(...valid.map(p=>p.v))-Math.max(1,(Math.max(...valid.map(p=>p.v))-Math.min(...valid.map(p=>p.v)))*.4));
 const max=Math.min(100,Math.max(...valid.map(p=>p.v))+Math.max(1,(Math.max(...valid.map(p=>p.v))-Math.min(...valid.map(p=>p.v)))*.4));
 const x=i=>left+(width-left-right)*i/(years.length-1), y=v=>height-bottom-(v-min)/Math.max(.01,max-min)*(height-top-bottom);
 for(let j=0;j<=4;j++){
  const v=min+(max-min)*j/4, yy=y(v);
  host.append(svgEl("line",{x1:left,x2:width-right,y1:yy,y2:yy,stroke:"#2f4564","stroke-dasharray":"4 6"}));
  const t=svgEl("text",{x:left-8,y:yy+4,fill:"#a9bad0","font-size":"12","text-anchor":"end"});t.textContent=fmt(v);host.append(t)
 }
 for(const p of valid){
  const c=svgEl("circle",{cx:x(p.i),cy:y(p.v),r:"5.8",fill:"#65d7df",stroke:"#102238","stroke-width":"2"});host.append(c);
  const lab=svgEl("text",{x:x(p.i),y:y(p.v)-13,fill:"#eafcff","font-size":"12","text-anchor":"middle"});lab.textContent=fmt(p.v);host.append(lab)
 }
 for(let i=0;i<years.length;i++){
  const t=svgEl("text",{x:x(i),y:height-19,fill:"#bdcce2","font-size":"13","text-anchor":"middle"});t.textContent=years[i];host.append(t)
 }
 let segment=[];function flush(){
  if(segment.length>1){host.insertBefore(svgEl("polyline",{points:segment.map(p=>x(p.i)+","+y(p.v)).join(" "),fill:"none",stroke:"#65d7df","stroke-width":"3","stroke-linejoin":"round"}),host.firstChild)}
  segment=[]
 }
 for(let i=0;i<s.values.length;i++){
  if(s.values[i]===null){flush()}else segment.push({i,v:s.values[i]});
 }
 flush();
 $("#trendCaption").textContent=s.label+" · dalam persen · BPS, Statistik Kunci PDF halaman "+s.pdf_page+
  ". Sumbu Y menyesuaikan rentang; tahun kosong tidak diinterpolasi.";
}
function csv(data){
 const cols=["Provinsi",...data.provincial_metrics.map(m=>m.id)];
 const rows=[cols,...data.provinces.map(p=>[p.name,...p.values])];
 const str="\uFEFF"+rows.map(row=>row.map(v=>'"'+String(v===null?"NA":v).replace(/"/g,'""')+'"').join(",")).join("\r\n");
 const u=URL.createObjectURL(new Blob([str],{type:"text/csv;charset=utf-8"}));
 const a=el("a",{href:u,download:"sli-susenas-2026-nine-indicators.csv"});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)
}
async function main(){
 const data=await load();let geo=null;try{const r=await fetch(MAP);if(r.ok)geo=await r.json()}catch{}
 $("#sourceBps").href=data.source.source_url;
 $("#sourceFoot").href=data.source.source_url;
 $("#sourceDate").textContent="Survei Maret 2026 · terbit 5 Oktober 2026 · "+data.quality.core_tables_cataloged+" tabel utama diinventarisasi";
 const sector=$("#sectorSelect"),indicator=$("#indicatorSelect"),search=$("#provinceSearch");
 const areas=[...new Set(data.provincial_metrics.map(m=>m.sector))];
 setOptions(sector,[["all","Semua sektor"],...areas.map(s=>[s,s])],"all");
 let activeMetric=data.provincial_metrics.find(m=>m.id==="internet_5_plus");
 let selected="Indonesia";
 setOptions($("#trendSelect"),data.national_series.map(s=>[s.id,s.sector+" · "+s.label]),"health_insurance");
 function draw(){
  $("#indicatorInfo").textContent=activeMetric.label+" · tabel "+activeMetric.table+" · PDF halaman "+activeMetric.pdf_page+
   " · "+activeMetric.denominator+". Data merupakan estimasi Susenas, bukan pencatatan layanan real-time.";
  if(geo)drawMap(data,geo,activeMetric,selected,onSelect);
  else $("#geoMatch").textContent="Geometri peta tidak dapat dimuat; data tabel tetap tersedia.";
  drawRank(data,activeMetric,onSelect);
  renderTable(data,activeMetric,selected,onSelect,search.value);
  const p=data.provinces.find(p=>norm(p.name)===norm(selected))||data.provinces.at(-1);
  $("#selection").textContent=p.name+" · "+activeMetric.label+" : "+num(p.values[activeMetric.index])+" · "+precisionText(samplePrecision(data,activeMetric,p.name))+" (Susenas 2026).";
 }
 function onSelect(name){selected=data.provinces.some(p=>norm(p.name)===norm(name))?data.provinces.find(p=>norm(p.name)===norm(name)).name:"Indonesia";draw()}
 function updateIndicators(){
  const items=data.provincial_metrics.filter(m=>sector.value==="all"||m.sector===sector.value);
  const chosen=items.some(m=>m.id===activeMetric.id)?activeMetric.id:items[0].id;
  setOptions(indicator,items.map(m=>[m.id,m.label]),chosen);
  activeMetric=data.provincial_metrics.find(m=>m.id===chosen);draw()
 }
 sector.addEventListener("change",updateIndicators);
 indicator.addEventListener("change",()=>{activeMetric=data.provincial_metrics.find(m=>m.id===indicator.value);draw()});
 search.addEventListener("input",draw);$("#sortMode").addEventListener("change",draw);
 $("#trendSelect").addEventListener("change",()=>renderTrend(data));
 $("#csvButton").addEventListener("click",()=>csv(data));
 $("#copyQuestion").addEventListener("click",async()=>{
  const prompt="Analisis indikator "+activeMetric.label+" di "+selected+" dibandingkan nasional dengan bukti primer BPS Statistik Kesejahteraan Rakyat 2026 tabel "+activeMetric.table+" halaman "+activeMetric.pdf_page+
   ". Bedakan deskripsi dan inferensi, jelaskan penyebut, keterbatasan RSE, serta jangan mengklaim hubungan sebab akibat tanpa bukti.";
  try{await navigator.clipboard.writeText(prompt);$("#copyStatus").textContent="Pertanyaan riset tersalin; buka DERGUBA AI untuk menggunakannya."}
  catch{$("#copyStatus").textContent=prompt}
 });
 $("#status").textContent="Tabel pilot termuat · 38 provinsi + nasional · 23 seri indikator nasional · QA sel lengkap & izin reproduksi komersial masih perlu dipastikan.";
 updateIndicators();renderTrend(data)
}
main().catch(e=>{$("#status").textContent="Dataset gagal dimuat: "+e.message+"; ulangi atau buka sumber BPS."})
})();
