/* BMKG SACA&D station 46 quality-valid historical rainfall only; NO current alert. */
(()=>{"use strict";
const roots=[...document.querySelectorAll("[data-sli-bmkg-rainfall-history]")];if(!roots.length)return;
const el=(tag,txt)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=String(txt);return e;};
const ns="http://www.w3.org/2000/svg";
const svg=(tag,props={},txt)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(props))e.setAttribute(k,String(v));if(txt!==undefined)e.textContent=String(txt);return e;};
const fmt=x=>Number(x).toLocaleString("id-ID",{maximumFractionDigits:1});
fetch("./data/sli-bmkg-cengkareng-historical-rainfall.json",{cache:"no-store"})
.then(x=>{if(!x.ok)throw Error("HTTP "+x.status);return x.json()}).then(d=>{
 if(d.schema!=="sli-bmkg-saca-historical-station-rainfall-v1"||d.station.id!==46||d.annual_observations.length!==15||d.last_actual_quality_valid_observation_date!=="2020-03-30")throw Error("BMKG station data integrity mismatch");
 for(const root of roots){
  root.classList.add("sli-bmkg-historical");
  root.setAttribute("data-sli-visual","historical-bmkg-station-rainfall");
  const title=el("h3","BMKG SACA&D · Curah hujan tercatat Stasiun Soekarno-Hatta/Cengkareng");
  const warning=el("p","Histori 2000–2014. Total pada grafik hanya menjumlahkan hari pengamatan berkualitas valid (Q=0); tahun dengan hari hilang bukan total hujan tahunan penuh. Pengukuran terakhir yang benar-benar tersedia: 30 Maret 2020, bukan November 2022 atau kondisi 2026.");
  const plot=el("div");plot.className="sli-bmkg-historical-plot";
  const detail=el("p");detail.setAttribute("aria-live","polite");
  const table=el("table"),thead=el("thead"),tr=el("tr"),tbody=el("tbody");
  ["Tahun","Hari pengamatan valid","Hari hilang/diragukan","Total hari valid (mm)","Cakupan penuh"].forEach(x=>tr.append(el("th",x)));thead.append(tr);
  const rows=d.annual_observations;
  const max=Math.max(...rows.map(x=>x.source_observed_rainfall_mm));
  const fig=svg("svg",{viewBox:"0 0 960 420",role:"img","aria-label":"Curah hujan yang terekam pada hari-hari valid di Stasiun Cengkareng, 2000 sampai 2014"});
  const L=66,T=25,B=70,W=960,H=420,spacing=(W-L-27)/rows.length;
  rows.forEach((item,i)=>{
   const x=L+i*spacing+7,barW=Math.max(10,spacing-17),height=(H-T-B)*item.source_observed_rainfall_mm/max,y=H-B-height;
   const rect=svg("rect",{x,y,width:barW,height,fill:item.complete_year?"#75d3c3":"#e4b878",tabindex:0,role:"button","data-value":item.source_observed_rainfall_mm,"aria-label":item.year+": "+fmt(item.source_observed_rainfall_mm)+" mm, "+item.valid_observation_days+" hari valid"});
   rect.append(svg("title",{},item.year+": "+fmt(item.source_observed_rainfall_mm)+" mm dari "+item.valid_observation_days+"/"+item.calendar_days+" hari, "+item.missing_or_suspect_days+" hari tidak tersedia/diragukan."));
   const on=()=>{detail.textContent=item.year+" · "+fmt(item.source_observed_rainfall_mm)+" mm terkumpul dari "+item.valid_observation_days+"/"+item.calendar_days+" hari valid. "+(item.complete_year?"Cakupan hari penuh.":"Total tahunan belum lengkap; "+item.missing_or_suspect_days+" hari ditahan.")};
   rect.addEventListener("click",on);rect.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();on()}});fig.append(rect);
   const l=svg("text",{x:x+barW/2,y:H-B+22,fill:"#d8e6ef","font-size":11,"text-anchor":"middle"},String(item.year));fig.append(l);
   const a=el("tr");[item.year,item.valid_observation_days,item.missing_or_suspect_days,fmt(item.source_observed_rainfall_mm),item.complete_year?"Ya":"Tidak"].forEach(v=>a.append(el("td",v)));tbody.append(a);
  });
  const legend=svg("text",{x:L,y:H-20,fill:"#d2e4e7","font-size":13},"Hijau: pengamatan lengkap · Emas: pengamatan sebagian · angka hanya hari valid (Q=0)");fig.append(legend);
  plot.append(fig);thead.append();table.append(thead,tbody);
  const scroll=el("div");scroll.className="sli-bmkg-historical-scroll";scroll.append(table);
  const link=el("a","Arsip resmi BMKG/SACA&D ↗");link.href=d.official_archive_url;link.target="_blank";link.rel="noopener noreferrer";
  const m=el("p",d.source_limits);const foot=el("p");foot.append(link," · STAID "+d.station.id+" · "+d.original_station_file);
  root.replaceChildren(title,warning,plot,detail,scroll,m,foot);
  const register=()=>{
   if(!window.SLIVisualExport?.register)return;
   window.SLIVisualExport.register(fig,{getData:()=>({headers:["Year","Calendar days","Quality-valid observed days","Missing or suspect days","Observed-days rainfall sum (mm)","Complete coverage"],
     rows:rows.map(x=>[x.year,x.calendar_days,x.valid_observation_days,x.missing_or_suspect_days,x.source_observed_rainfall_mm,x.complete_year]),kind:"verified-provider"}),
    getMeta:()=>({title:"BMKG Soekarno-Hatta station (STAID 46) · historical Q0 observed rainfall days",source:d.publisher,sourceUrl:d.official_archive_url,period:"2000–2014",completeness:d.source_limits})});
  };
  document.addEventListener("sli:exportready",register);register();
 }
}).catch(e=>roots.forEach(r=>{r.textContent="Arsip historis BMKG belum tersedia: "+String(e.message)}));
})();