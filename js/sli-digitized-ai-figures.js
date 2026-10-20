/* Numeric chart-label digitization from Stanford HAI AI Index 2026, PDF pages 31 and 33. */
(()=>{"use strict";
const roots=[...document.querySelectorAll("[data-sli-ai-figures]")];if(!roots.length)return;
const NS="http://www.w3.org/2000/svg",PATH="./data/sli-stanford-2026-digitized-figures.json";
function el(tag,text){const x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);return x}
function svg(tag,attrs,txt){const n=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,String(v)));if(txt!==undefined)n.textContent=String(txt);return n}
const fmt=x=>Number(x).toLocaleString("id-ID",{maximumFractionDigits:2});
const en=()=>document.documentElement.lang.toLowerCase().startsWith("en");
function chart(root,d){
root.classList.add("sli-figure-atlas");
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
function bars(f){
 const W=870,L=142,R=86,T=16,S=30,H=T+f.values.length*S+26,max=5500;
 const v=svg("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":en()?f.title_en:f.title_id});
 f.values.slice().reverse().forEach((r,i)=>{const y=T+i*S;
 addText(v,L-12,y+17,r.country,11,"#dce9f1","end");
 const w=(W-L-R)*r.count/max;
 const b=svg("rect",{x:L,y:y+3,width:w,height:19,rx:3,fill:i===0?"#64ccca":"#6a9bbc"});
 point(b,r.country,r.count,f);v.append(b);
 addText(v,L+w+7,y+17,fmt(r.count),11,"#eef5f9","start");
 });addText(v,L,H-4,en()?"Facility count, 2025 (linear scale)":"Jumlah fasilitas, 2025 (skala linear)",11,"#cbdfe7","start");return v;
}
function show(){
 const f=d.figures[Number(select.value)||0],isPower=f.id.includes("power");
 meta.textContent=f.source_credit+" · Figure "+f.figure_number+" · PDF "+f.pdf_page+" · "+(en()?"Published numbers, not independent study validation":"Angka terbitan, bukan validasi independen studi asal");
 plot.replaceChildren(isPower?line(f):bars(f));
 warn.textContent=en()?f.caution_en:f.caution_id;
 sourceLink(f);
 setDetail(isPower?f.values[f.values.length-1].period:f.values[f.values.length-1].country,isPower?f.values[f.values.length-1].value_gw:f.values[f.values.length-1].count,f);
 const thead=el("thead"),tr=el("tr");[isPower?"Kuartal":"Negara",isPower?"Estimasi daya (GW)":"Fasilitas"].forEach(h=>tr.append(el("th",h)));thead.append(tr);
 const tbody=el("tbody");f.values.forEach(r=>{const row=el("tr");row.append(el("td",isPower?r.period:r.country),el("td",fmt(isPower?r.value_gw:r.count)));tbody.append(row)});
 table.replaceChildren(thead,tbody);
}
select.addEventListener("change",show);show();
}
fetch(PATH,{cache:"no-cache"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(d=>roots.forEach(root=>chart(root,d))).catch(e=>roots.forEach(root=>{root.textContent="Source-verified Stanford figures unavailable: "+String(e.message)}));
})();