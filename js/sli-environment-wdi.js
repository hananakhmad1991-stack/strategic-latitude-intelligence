/* Source-validated World Bank WDI annual Indonesia environment series.
 * Not real-time readings and not city/province/project exposure predictions. */
(()=>{"use strict";
const SOURCE="./data/sli-environment-worldbank-wdi-indonesia.json",NS="http://www.w3.org/2000/svg";
function node(tag,txt){const e=document.createElement(tag);if(txt!==undefined)e.textContent=String(txt);return e}
function display(value){return typeof value==="number"&&Number.isFinite(value)?value.toLocaleString("id-ID",{maximumFractionDigits:3}):"N/A"}
function init(host){
 if(typeof host==="string")host=document.getElementById(host);
 if(!host)return Promise.resolve(false);
 const wrapper=node("section");wrapper.className="sli-wdi-environment";
 wrapper.append(node("p","Memuat indikator lingkungan Indonesia dari World Bank WDI…"));
 host.replaceChildren(wrapper);
 return fetch(SOURCE,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(d=>{
  const map=new Map(d.indicators.map(x=>[x.indicator_code,x]));
  if(d.schema!=="sli-indonesia-environment-worldbank-wdi-v1"||d.indicators.length!==4||d.geography!=="Indonesia (IDN)")throw Error("WDI version or origin mismatch");
  wrapper.replaceChildren();
  const title=node("h3","Indikator lingkungan nasional · World Bank WDI");
  const sub=node("p","Seri tahunan Indonesia; sumber sekunder World Bank dengan metodologi berbeda menurut indikator. CO₂ memakai EDGAR/JRC di luar LULUCF, bukan kelanjutan seri lama EN.ATM.CO2E.PC. Tahun terbaru berbeda dan bukan kondisi langsung 2026.");
  const kpis=node("div");kpis.className="sli-wdi-kpis";
  for(const m of d.indicators){
   const card=node("article");card.className="sli-wdi-kpi";
   card.append(node("small",m.name),node("strong",display(m.latest_value)),node("span",m.unit+" · "+m.latest_year));
   kpis.append(card);
  }
  const controls=node("label");controls.className="sli-wdi-controls";controls.append(node("span","Pilih seri historis"));
  const select=node("select");
  for(const m of d.indicators){const op=node("option",m.name+" ("+m.unit+")");op.value=m.indicator_code;select.append(op)}
  controls.append(select);
  const desc=node("p");desc.className="sli-wdi-scope";
  const chart=node("div");chart.className="sli-wdi-chart";
  const scroll=node("div");scroll.className="sli-wdi-scroll";scroll.tabIndex=0;
  const foot=node("p");foot.className="sli-wdi-caveat";
  const update=()=>{
   const m=map.get(select.value),series=d.observations.filter(x=>x.indicator_code===m.indicator_code).sort((a,b)=>a.year-b.year);
   desc.textContent="Indonesia · "+m.name+" · "+m.unit+" · "+series[0].year+"–"+series.at(-1).year+" · "+m.scope+". Bukan indikator kabupaten/provinsi atau peringatan kini."+(m.series_break_note?" "+m.series_break_note:"");
   const min=Math.min(...series.map(x=>x.value)),max=Math.max(...series.map(x=>x.value)),range=Math.max(max-min,1e-6);
   const svg=document.createElementNS(NS,"svg");svg.setAttribute("viewBox","0 0 730 225");svg.setAttribute("role","img");
   svg.setAttribute("aria-label",m.name+" di Indonesia "+series[0].year+" sampai "+series.at(-1).year+", nilai terakhir "+display(series.at(-1).value)+" "+m.unit);
   const points=series.map((x,i)=>{const px=22+i*(686/Math.max(1,series.length-1)),py=180-125*(x.value-min)/range;return [px,py,x]});
   const poly=document.createElementNS(NS,"polyline");
   poly.setAttribute("points",points.map(p=>p[0].toFixed(2)+","+p[1].toFixed(2)).join(" "));
   poly.setAttribute("stroke","#e3c182");poly.setAttribute("stroke-width","3");poly.setAttribute("fill","none");
   svg.append(poly);
   for(const [x,y,r] of points){
    const circle=document.createElementNS(NS,"circle");circle.setAttribute("cx",x);circle.setAttribute("cy",y);
    circle.setAttribute("r","2.5");circle.setAttribute("fill","#a8d4d8");
    const title=document.createElementNS(NS,"title");title.textContent=r.year+": "+display(r.value)+" "+m.unit;circle.append(title);svg.append(circle);
   }
   const axes=node("p",series[0].year+"–"+series.at(-1).year+" · skala dinormalisasi dari min "+display(min)+" ke maks "+display(max)+" "+m.unit);
   chart.replaceChildren(svg,axes);
   const table=node("table"),thead=node("thead"),tr=node("tr");
   ["Tahun","Nilai","Unit"].forEach(x=>tr.append(node("th",x)));thead.append(tr);
   const tbody=node("tbody");for(const r of series.slice().reverse()){const row=node("tr");[r.year,display(r.value),m.unit].forEach(v=>row.append(node("td",v)));tbody.append(row)}
   table.append(thead,tbody);scroll.replaceChildren(table);
   foot.replaceChildren();
   foot.append(node("span","World Bank WDI · "+m.indicator_code+" · indeks publikasi historis. "));
   const link=node("a","Buka indikator asli ↗");link.href="https://data.worldbank.org/indicator/"+encodeURIComponent(m.indicator_code)+"?locations=ID";link.target="_blank";link.rel="noopener noreferrer";foot.append(link);
  };
  select.addEventListener("change",update);
  wrapper.append(title,sub,kpis,controls,desc,chart,scroll,foot);
  const note=node("p","CO₂ per kapita 2000–2024 menggunakan seri penerus EDGAR/JRC (EN.GHG.CO2.PC.CE.AR5), bukan seri lama EN.ATM.CO2E.PC. Grafik CO₂ tidak memasukkan LULUCF. Semua 20 indikator lingkungan lokal tetap belum memiliki angka observasi sesuai lokasi.");
  note.className="sli-wdi-caveat";wrapper.append(note);
  update();return true;
 }).catch(e=>{wrapper.textContent="Sumber lingkungan World Bank belum tersedia; silakan verifikasi melalui portal resmi. ("+String(e.message)+")";return false});
}
window.initSLIEnvironmentWDI=init;
})();
