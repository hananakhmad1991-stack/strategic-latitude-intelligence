/* Numeric chart-label digitization from Stanford HAI AI Index 2026, original PDF pages 30, 31, 33 and 39. */
(()=>{"use strict";
const roots=[...document.querySelectorAll("[data-sli-ai-figures]")];if(!roots.length)return;
const NS="http://www.w3.org/2000/svg",PATH="./data/sli-stanford-2026-digitized-figures.json";
function el(tag,text){const x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);return x}
function svg(tag,attrs,txt){const n=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,String(v)));if(txt!==undefined)n.textContent=String(txt);return n}
const fmt=x=>Number(x).toLocaleString("id-ID",{maximumFractionDigits:2});
const en=()=>document.documentElement.lang.toLowerCase().startsWith("en");
function chart(root,d){
root.classList.add("sli-figure-atlas");root.setAttribute("data-sli-visual","source-verified-stanford-figures");
const heading=el("h3",en()?"Digitized original-report figures":"Grafik laporan asli yang telah didigitalisasi");
const selectWrap=el("div");selectWrap.className="sli-figure-select";
const lab=el("label",en()?"Choose figure":"Pilih grafik");const select=el("select");lab.append(select);selectWrap.append(lab);
d.figures.forEach((f,i)=>{const op=el("option",(en()?f.title_en:f.title_id)+" · Figure "+f.figure_number);op.value=String(i);select.append(op)});
const meta=el("p"),plot=el("div"),detail=el("div"),warn=el("p"),source=el("p"),details=el("details"),sum=el("summary",en()?"Show exact transcribed values":"Lihat tabel nilai sumber"),table=el("table");
plot.className="sli-figure-plot";detail.className="sli-figure-detail";details.append(sum,table);
root.replaceChildren(heading,selectWrap,meta,plot,detail,warn,source,details);
function sourceLink(f){source.replaceChildren();const a=el("a",(en()?"Original Stanford 2026 PDF":"PDF asli Stanford 2026")+" · Figure "+f.figure_number+" · "+(en()?"PDF page ":"halaman PDF ")+f.pdf_page);a.href=d.source.official_url;a.target="_blank";a.rel="noopener noreferrer";source.append(a)}
function setDetail(label,value,f){detail.textContent=label+": "+fmt(value)+" "+f.unit+". "+(en()?f.caution_en:f.caution_id)}
function point(base,label,value,f){const title=svg("title",{},label+": "+fmt(value)+" "+f.unit);base.append(title);base.setAttribute("data-value",String(value));base.setAttribute("tabindex","0");base.setAttribute("role","button");base.setAttribute("aria-label",label+": "+fmt(value)+" "+f.unit);const run=()=>setDetail(label,value,f);base.addEventListener("click",run);base.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();run()}})}
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
 addText(v,L,H-5,f.unit+" · "+(f.year||"2025"),12,"#cbdfe7","start");return v;
}
function registerExporter(){
 const f=d.figures[Number(select.value)||0],isPower=!!f.values[0].period;
 const svgNode=plot.querySelector("svg");if(!svgNode||!window.SLIVisualExport?.register)return;
 const labelName=isPower?"Quarter":f.values[0].country?"Country":"Category";
 window.SLIVisualExport.register(svgNode,{
  getData:()=>({headers:[labelName,f.title_en+" ("+f.unit+")"],
   rows:f.values.map(r=>isPower?[r.period,r.value_gw]:[r.country||r.label_en,r.count===undefined?r.value:r.count]),kind:"verified-provider"}),
  getMeta:()=>({title:en()?f.title_en:f.title_id,source:f.source_credit,
   sourceUrl:d.source.official_url,period:isPower?"2022Q1–2025Q4":String(f.year||2025),
   completeness:"Exact printed numeric source-labels only; "+f.statistical_status+". "+f.caution_en})
 });
}
document.addEventListener("sli:exportready",registerExporter);
function show(){
 const f=d.figures[Number(select.value)||0],isPower=!!f.values[0].period;
 const selected=f.values.at(-1);
 const selectedLabel=isPower?selected.period:(selected.country||(en()?selected.label_en:selected.label_id));
 const selectedValue=isPower?selected.value_gw:selected.count===undefined?selected.value:selected.count;
 meta.textContent=f.source_credit+" · Figure "+f.figure_number+" · PDF "+f.pdf_page+" · "+(en()?"Publisher figures are not independently audited by SLI":"Angka sumber belum menjadi validasi independen metodologi penerbit");
 plot.replaceChildren(isPower?line(f):bars(f));
 warn.textContent=en()?f.caution_en:f.caution_id;
 sourceLink(f);setDetail(selectedLabel,selectedValue,f);
 const thead=el("thead"),tr=el("tr");
 [isPower?"Kuartal":f.values[0].country?"Negara":"Kategori",f.title_en+" ("+f.unit+")"].forEach(h=>tr.append(el("th",h)));
 thead.append(tr);
 const tbody=el("tbody");
 f.values.forEach(r=>{const row=el("tr");const val=isPower?r.value_gw:r.count===undefined?r.value:r.count;
  row.append(el("td",isPower?r.period:r.country||(en()?r.label_en:r.label_id)),el("td",fmt(val)));tbody.append(row)});
 table.replaceChildren(thead,tbody);registerExporter();
}
select.addEventListener("change",show);show();
}
fetch(PATH,{cache:"no-cache"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(d=>roots.forEach(root=>chart(root,d))).catch(e=>roots.forEach(root=>{root.textContent="Source-verified Stanford figures unavailable: "+String(e.message)}));
})();