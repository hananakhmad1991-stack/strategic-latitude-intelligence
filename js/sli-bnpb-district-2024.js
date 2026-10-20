/* BNPB 2024 kabupaten/kota observed disaster counts. No asset hazard imputation. */
(()=>{"use strict";
const roots=[...document.querySelectorAll("[data-sli-bnpb-district]")];if(!roots.length)return;
const SOURCE="./data/sli-bnpb-district-2024.json";
const metrics=[
 ["flood_events","Banjir","Flood events"],
 ["coastal_events","Gelombang pasang & abrasi","Coastal events"],
 ["wildfire_events","Karhutla","Wildfire events"],
 ["landslide_events","Tanah longsor","Landslide events"],
 ["drought_events","Kekeringan","Drought events"],
 ["extreme_weather_events","Cuaca ekstrem","Extreme weather events"],
 ["earthquake_events","Gempa bumi","Earthquake events"],
 ["volcano_events","Erupsi gunung api","Volcano events"],
 ["tsunami_events","Tsunami","Tsunami events"]];
function el(tag,txt){const n=document.createElement(tag);if(txt!==undefined)n.textContent=String(txt);return n}
function en(){return document.documentElement.lang.toLowerCase().startsWith("en")}
function number(n){return typeof n==="number"?n.toLocaleString("id-ID"):"—"}
function view(root,d){
 if(d.schema!=="sli-bnpb-district-2024-types-v1"||d.year!==2024||d.district_count!==450||d.records.length!==450)throw Error("District evidence schema/coverage mismatch");
 const heading=el("h3",en()?"BNPB 2024 · District-level observed disaster events":"BNPB 2024 · Kejadian bencana kabupaten/kota");
 const warning=el("p",en()?"Publisher lists 450 district/city rows, not all Indonesian districts. An omitted district is UNKNOWN, never zero. Counts are historical observed events, not asset risk probabilities.":"Sumber memuat 450 baris kabupaten/kota, bukan seluruh kabupaten/kota Indonesia. Wilayah yang tidak tercantum BERSTATUS TIDAK TERSEDIA, bukan nol. Angka merupakan kejadian historis, bukan probabilitas risiko aset.");
 const ctrl=el("div");ctrl.className="sli-bnpb-district-controls";
 const ml=el("label",en()?"Disaster type":"Jenis bencana"),select=el("select");
 metrics.forEach(([key,id,eng])=>{const o=el("option",en()?eng:id);o.value=key;select.append(o)});ml.append(select);
 const fl=el("label",en()?"Search name or district code":"Cari nama atau kode kabupaten/kota"),filter=el("input");
 filter.type="search";filter.placeholder=en()?"District or code":"Kabupaten/kota atau kode";fl.append(filter);ctrl.append(ml,fl);
 const summary=el("p");summary.className="sli-bnpb-district-summary";
 const list=el("div");list.className="sli-bnpb-district-table scroll";list.setAttribute("role","region");list.setAttribute("tabindex","0");list.setAttribute("aria-label",en()?"BNPB source dataset 2024 districts":"Tabel kabupaten/kota BNPB 2024");
 const nav=el("div");nav.className="sli-bnpb-district-nav";
 const previous=el("button",en()?"Previous":"Sebelumnya"),next=el("button",en()?"Next":"Berikutnya"),page=el("span");previous.type=next.type="button";nav.append(previous,page,next);
 const detail=el("div",en()?"Select a district row to inspect dated source evidence.":"Klik baris kabupaten/kota untuk melihat keterangan angka dan sumber.");detail.className="sli-bnpb-district-detail";detail.setAttribute("aria-live","polite");
 const source=el("p");
 const link=el("a",en()?"Official BNPB 2024 dataset ↗":"Buka dataset resmi BNPB 2024 ↗");
 link.href=d.official_resource_url;link.rel="noopener noreferrer";link.target="_blank";
 source.append(link," · "+(en()?"ODC Attribution · source snapshot":"ODC Attribution · cuplikan sumber")+" · "+d.retrieved_at.slice(0,10));
 root.classList.add("sli-bnpb-district");root.replaceChildren(heading,warning,ctrl,summary,list,nav,detail,source);
 let current=0,filtered=[];
 function selectRow(rec){
  const parts=[rec.district+" ("+rec.admin_code+") · 2024"];
  for(const [k,id,eng] of metrics)parts.push((en()?eng:id)+": "+number(rec[k]));
  detail.textContent=parts.join(" · ")+". "+(en()?"BNPB official district-year event counts, not damage, financial loss, or asset hazard.":"Jumlah kejadian BNPB per kabupaten/kota-tahun, bukan kerusakan, kerugian finansial, atau ancaman spesifik aset.");
 }
 function registerExporter(table){
  const api=window.SLIVisualExport;if(!api?.register)return;
  const name=metrics.find(x=>x[0]===select.value),key=name[0];
  api.register(table,{getData:()=>({headers:["District code","Kabupaten/Kota",en()?name[2]:name[1],"Period"],
    rows:filtered.map(r=>[r.admin_code,r.district,r[key],2024]),kind:"verified-provider"}),
   getMeta:()=>({title:"BNPB 2024 kabupaten/kota · "+(en()?name[2]:name[1]),
    source:"BNPB Satu Data Bencana Indonesia (2024 district historical event count)",
    sourceUrl:d.official_resource_url,period:"2024",
    completeness:"All "+filtered.length+" reported source rows matching selection; publisher lists 450 districts only, omitted jurisdictions not zero. Not an asset hazard, casualty, or economic-loss value."})});
 }
 function render(){
  const key=select.value,term=filter.value.trim().toLowerCase();
  filtered=d.records.filter(r=>r[key]!==null&&(r.district.toLowerCase().includes(term)||r.admin_code.includes(term)));
  filtered.sort((a,b)=>b[key]-a[key]||a.district.localeCompare(b.district,"id"));
  const totalPages=Math.max(1,Math.ceil(filtered.length/25));current=Math.max(0,Math.min(current,totalPages-1));
  const rows=filtered.slice(current*25,(current+1)*25);
  summary.textContent=(en()?"Publisher-listed rows: ":"Baris sumber: ")+d.district_count+
   " · "+(en()?"Matching districts: ":"Kabupaten/kota cocok: ")+filtered.length+
   " · "+(en()?"Total of reported selected rows: ":"Jumlah kejadian pada baris yang dipilih: ")+number(filtered.reduce((n,r)=>n+r[key],0))+
   " · "+(en()?"2024 (not a nationwide completeness claim)":"2024 (tidak menyiratkan cakupan nasional lengkap)");
  const table=el("table"),head=el("thead"),hrow=el("tr");
  for(const label of [en()?"Code":"Kode",en()?"District":"Kabupaten/kota",en()?"Events":"Kejadian","Tahun"]){const c=el("th",label);hrow.append(c)}head.append(hrow);
  const body=el("tbody");
  rows.forEach(r=>{const tr=el("tr");tr.tabIndex=0;
   for(const x of [r.admin_code,r.district,number(r[key]),"2024"])tr.append(el("td",x));
   tr.addEventListener("click",()=>selectRow(r));
   tr.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();selectRow(r)}});
   body.append(tr)});
  table.append(head,body);list.replaceChildren(table);
  previous.disabled=current===0;next.disabled=current===totalPages-1;
  page.textContent=(en()?"Page ":"Halaman ")+(current+1)+" / "+totalPages;
  registerExporter(table);
 }
 select.addEventListener("change",()=>{current=0;render()});
 filter.addEventListener("input",()=>{current=0;render()});
 previous.addEventListener("click",()=>{current--;render()});
 next.addEventListener("click",()=>{current++;render()});
 document.addEventListener("sli:exportready",()=>{const t=list.querySelector("table");if(t)registerExporter(t)});
 render();
}
fetch(SOURCE,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(d=>roots.forEach(x=>view(x,d))).catch(e=>roots.forEach(x=>{x.textContent="BNPB historical district data unavailable: "+String(e.message)}));
})();