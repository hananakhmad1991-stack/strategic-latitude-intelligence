/* Source figure-label digitization from Stanford HAI AI Index 2026 and World Bank AI Foundations 2025. */
(()=>{"use strict";
const roots=[...document.querySelectorAll("[data-sli-ai-figures]")];if(!roots.length)return;
const NS="http://www.w3.org/2000/svg",PATH="./data/sli-stanford-2026-digitized-figures.json",WB_PATH="./data/sli-worldbank-ai-2025-digitized-figure-panels.json";
function el(tag,text){const x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);return x}
function svg(tag,attrs,txt){const n=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,String(v)));if(txt!==undefined)n.textContent=String(txt);return n}
const fmt=x=>Number(x).toLocaleString(en()?"en-US":"id-ID",{maximumFractionDigits:2});
const en=()=>document.documentElement.lang.toLowerCase().startsWith("en");
const localizedUnit=u=>en()?u:({facilities:"fasilitas",models:"model",satellites:"satelit"}[u]||u);
function chart(root,d){
root.classList.add("sli-figure-atlas");root.setAttribute("data-sli-visual","source-reviewed-original-report-figure-panels");
const heading=el("h3",en()?"Digitized original-report figures":"Grafik laporan asli yang telah didigitalisasi");
const selectWrap=el("div");selectWrap.className="sli-figure-select";
const lab=el("label",en()?"Choose figure":"Pilih grafik");const select=el("select");lab.append(select);selectWrap.append(lab);
d.figures.forEach((f,i)=>{const provider=f.source_url?"World Bank":"Stanford";const op=el("option",provider+" · "+(en()?f.title_en:f.title_id)+" · "+(en()?"Figure ":"Gambar ")+f.figure_number+(f.figure_panel||""));op.value=String(i);op.dataset.sliFigureId=(f.source_url?"worldbank:":"stanford:")+f.figure_number+(f.figure_panel||"");select.append(op)});
const meta=el("p"),plot=el("div"),detail=el("div"),warn=el("p"),source=el("p"),details=el("details"),sum=el("summary",en()?"Show exact transcribed values":"Lihat tabel nilai sumber"),table=el("table");
plot.className="sli-figure-plot";detail.className="sli-figure-detail";details.append(sum,table);
root.replaceChildren(heading,selectWrap,meta,plot,detail,warn,source,details);
function sourceLink(f){source.replaceChildren();const publisher=f.source_url?"World Bank 2025":"Stanford 2026";const a=el("a",publisher+" · "+(en()?"Figure ":"Gambar ")+f.figure_number+(f.figure_panel||"")+" · "+(en()?"PDF page ":"halaman PDF ")+f.pdf_page);a.href=f.source_url||d.source.official_url;a.target="_blank";a.rel="noopener noreferrer";source.append(a)}
function setDetail(label,value,f){detail.textContent=label+": "+fmt(value)+" "+localizedUnit(f.unit)+". "+(en()?f.caution_en:f.caution_id)}
function point(base,label,value,f){const title=svg("title",{},label+": "+fmt(value)+" "+localizedUnit(f.unit));base.append(title);base.setAttribute("data-value",String(value));base.setAttribute("tabindex","0");base.setAttribute("role","button");base.setAttribute("aria-label",label+": "+fmt(value)+" "+localizedUnit(f.unit));const run=()=>setDetail(label,value,f);base.addEventListener("click",run);base.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();run()}})}
function addText(v,x,y,content,size=12,color="#bdd7e3",anchor="middle"){v.append(svg("text",{x,y,fill:color,"font-size":size,"text-anchor":anchor},content))}
function line(f){
 const W=850,H=295,L=58,R=24,T=18,B=52,max=35;
 const v=svg("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":en()?f.title_en:f.title_id});
 const x=i=>L+i*(W-L-R)/(f.values.length-1), y=n=>H-B-n*(H-T-B)/max;
 [0,10,20,30].forEach(n=>{v.append(svg("line",{x1:L,y1:y(n),x2:W-R,y2:y(n),stroke:"#456277","stroke-dasharray":"4 5"}));addText(v,L-10,y(n)+4,n+" GW",11,"#c9d9e7","end")});
 const points=f.values.map((r,i)=>x(i)+","+y(r.value_gw)).join(" ");
 v.append(svg("polyline",{points,fill:"none",stroke:"#4fd0c8","stroke-width":"3","stroke-linejoin":"round"}));
 f.values.forEach((r,i)=>{const g=svg("circle",{cx:x(i),cy:y(r.value_gw),r:5,fill:"#e7bc78",stroke:"#093145","stroke-width":2});point(g,r.period,r.value_gw,f);v.append(g);if(i%3===0||i===15)addText(v,x(i),H-24,r.period,10)});
 addText(v,L,H-6,en()?"Quarter · global modelled power (GW)":"Kuartal · estimasi daya global (GW)",11,"#bfd8df","start");
 return v;
}
function barDatum(r){
 return {label:r.country||r.label_id||r.label_en||"—",labelEn:r.country||r.label_en||r.label_id||"—",
  value:r.count===undefined?r.value:r.count};
}
function bars(f){
 const records=f.values.slice().map(barDatum);
 const W=1080,L=385,R=135,T=16,S=35,H=T+records.length*S+34;
 const max=Math.max(1,...records.map(r=>r.value))*1.03;
 const v=svg("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":en()?f.title_en:f.title_id});
 records.forEach((r,i)=>{const y=T+i*S,label=en()?r.labelEn:r.label;
  addText(v,L-12,y+20,label,12,"#dce9f1","end");
  const w=(W-L-R)*(r.value/max);
  const b=svg("rect",{x:L,y:y+5,width:Math.max(.5,w),height:21,rx:3,fill:i===0?"#64ccca":"#6a9bbc"});
  point(b,label,r.value,f);v.append(b);
  addText(v,L+w+9,y+20,fmt(r.value),12,"#eef5f9","start");
 });
 addText(v,L,H-5,localizedUnit(f.unit)+" · "+(f.year||"2025"),12,"#cbdfe7","start");return v;
}
function multiLine(f){
 const W=900,H=370,L=64,R=35,T=22,B=83;
 const chart=svg("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":en()?f.title_en:f.title_id});
 const x=i=>L+i*(W-L-R)/(f.values.length-1);
 // Natural log transform is visual only; original integer numbers exported unchanged.
 const y=v=>H-B-(Math.log10(1+v)/Math.log10(10001))*(H-T-B);
 const keys=f.series.map(z=>z.key),colors=["#54bcd1","#f0c379","#c999ed","#8fc896"];
 [1,10,100,1000,10000].forEach(n=>{
  const yy=y(n);chart.append(svg("line",{x1:L,y1:yy,x2:W-R,y2:yy,stroke:"#375d73","stroke-dasharray":"3 5"}));
  addText(chart,L-9,yy+4,String(n),12,"#cee2eb","end");
 });
 f.values.forEach((v,i)=>addText(chart,x(i),H-B+22,String(v.year),11,"#c9dce7"));
 f.series.forEach((cat,j)=>{
  const points=f.values.map((v,i)=>x(i)+","+y(v[cat.key])).join(" ");
  chart.append(svg("polyline",{points,fill:"none",stroke:colors[j],"stroke-width":j===0?3:2.2}));
  f.values.forEach((v,i)=>{
   const g=svg("circle",{cx:x(i),cy:y(v[cat.key]),r:4,fill:colors[j],stroke:"#102c3f","stroke-width":"1.3"});
   point(g,String(v.year)+" · "+(en()?cat.label_en:cat.label_id),v[cat.key],f);chart.append(g);
  });
  const lx=L+(j%2)*390,ly=H-43+Math.floor(j/2)*18;
  chart.append(svg("line",{x1:lx,y1:ly-4,x2:lx+24,y2:ly-4,stroke:colors[j],"stroke-width":3}));
  addText(chart,lx+31,ly,en()?cat.label_en:cat.label_id,12,"#dbe8ee","start");
 });
 addText(chart,L,13,en()?"Log scale (1+count) · original values remain exact":"Skala log (1+jumlah) · nilai asal tidak diubah",12,"#d2e6eb","start");
 return chart;
}
function registerExporter(){
 const f=d.figures[Number(select.value)||0],isPower=!!f.values[0].period,multi=f.chart_type==="multi-series-line";
 const svgNode=plot.querySelector("svg");if(!svgNode||!window.SLIVisualExport?.register)return;
 const labelName=isPower?"Quarter":f.values[0].country?"Country":"Category";
 window.SLIVisualExport.register(svgNode,{
  getData:()=>({headers:multi?["Year",...f.series.map(x=>x.label_en+" (satellites)")]:[labelName,f.title_en+" ("+f.unit+")"],
   rows:multi?f.values.map(r=>[r.year,...f.series.map(x=>r[x.key])]):f.values.map(r=>isPower?[r.period,r.value_gw]:[r.country||r.label_en,r.count===undefined?r.value:r.count]),kind:"verified-provider"}),
  getMeta:()=>({title:en()?f.title_en:f.title_id,source:f.source_credit,
   sourceUrl:f.source_url||d.source.official_url,period:isPower?"2022Q1–2025Q4":String(f.period||f.year||2025),
   completeness:"Exact printed numeric source-labels only; "+f.statistical_status+". "+f.caution_en})
 });
}
document.addEventListener("sli:exportready",registerExporter);
function show(){
 const f=d.figures[Number(select.value)||0],isPower=!!f.values[0].period,multi=f.chart_type==="multi-series-line";
 const selected=f.values.at(-1);
 const selectedLabel=multi?String(selected.year)+" · "+f.series[0].key:isPower?selected.period:(selected.country||(en()?selected.label_en:selected.label_id));
 const selectedValue=multi?selected[f.series[0].key]:isPower?selected.value_gw:selected.count===undefined?selected.value:selected.count;
 meta.textContent=f.source_credit+" · "+(en()?"Figure ":"Gambar ")+f.figure_number+(f.figure_panel||"")+" · PDF "+f.pdf_page+" · "+(en()?"Publisher figures are not independently audited by SLI":"Angka sumber belum menjadi validasi independen metodologi penerbit");
 plot.replaceChildren(multi?multiLine(f):isPower?line(f):bars(f));
 warn.textContent=en()?f.caution_en:f.caution_id;
 sourceLink(f);setDetail(selectedLabel,selectedValue,f);
 const thead=el("thead"),tr=el("tr");
 (multi?[en()?"Year":"Tahun",...f.series.map(x=>(en()?x.label_en:x.label_id)+" ("+localizedUnit(f.unit)+")")]:[isPower?(en()?"Quarter":"Kuartal"):f.values[0].country?(en()?"Country":"Negara"):(en()?"Category":"Kategori"),(en()?f.title_en:f.title_id)+" ("+localizedUnit(f.unit)+")"]).forEach(h=>tr.append(el("th",h)));
 thead.append(tr);
 const tbody=el("tbody");
 f.values.forEach(r=>{const row=el("tr");if(multi){row.append(el("td",r.year));f.series.forEach(x=>row.append(el("td",fmt(r[x.key]))));}
  else {const val=isPower?r.value_gw:r.count===undefined?r.value:r.count;
   row.append(el("td",isPower?r.period:r.country||(en()?r.label_en:r.label_id)),el("td",fmt(val)));}tbody.append(row)});
 table.replaceChildren(thead,tbody);registerExporter();
}
select.addEventListener("change",show);
 // The atlas is rendered from JSON after page load; switching EN/ID must refresh
 // its dynamic labels while preserving the selected publisher figure and raw values.
 document.addEventListener("sli:languagechange",()=>{
  heading.textContent=en()?"Digitized original-report figures":"Grafik laporan asli yang telah didigitalisasi";
  if(lab.firstChild?.nodeType===Node.TEXT_NODE)lab.firstChild.textContent=en()?"Choose figure":"Pilih grafik";
  d.figures.forEach((f,i)=>{
   const op=select.options[i];if(!op)return;
   op.textContent=(f.source_url?"World Bank":"Stanford")+" · "+(en()?f.title_en:f.title_id)+" · "+(en()?"Figure ":"Gambar ")+f.figure_number+(f.figure_panel||"");
  });
  sum.textContent=en()?"Show exact transcribed values":"Lihat tabel nilai sumber";
  show();
 });
 show();
}
async function loadJSON(path){const r=await fetch(path,{cache:"no-cache"});if(!r.ok)throw Error("HTTP "+r.status+" "+path);return r.json()}
Promise.allSettled([loadJSON(PATH),loadJSON(WB_PATH)]).then(results=>{
 const stanford=results[0];if(stanford.status!=="fulfilled")throw stanford.reason;
 const d=stanford.value;if(d.schema!=="sli-stanford-ai-index-2026-digitized-figures-v1"||!Array.isArray(d.figures))throw Error("Stanford dataset schema");
 const bank=results[1];
 if(bank.status==="fulfilled"&&bank.value.schema==="sli-worldbank-ai-foundations-2025-digitized-figure-panels-v1"&&Array.isArray(bank.value.figures)){
  d.figures.push(...bank.value.figures.map(f=>({...f,source_url:f.source_url||bank.value.source.official_url})));
 }
 roots.forEach(root=>chart(root,d));
}).catch(e=>roots.forEach(root=>{root.textContent=(en()?"Source-reviewed AI figures unavailable: ":"Grafik AI berbasis sumber yang ditinjau belum tersedia: ")+String(e.message)}));
})();