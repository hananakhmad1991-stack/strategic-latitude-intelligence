/* Supplemental numeric layer for all 63 official September 2026 tables.
   Immutable snapshot, not a claim that every extracted row passed visual QA. */
(()=>{"use strict";
let data,source,audit,adaptive;
const $=id=>document.getElementById(id);
const E=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);if(cls)e.className=cls;return e;};
const a=(link,label)=>{const o=E("a",label,"sepsem-link");o.href=link;o.target="_blank";o.rel="noopener noreferrer";return o;};
const num=v=>v===null||v===undefined?"—":Number(v).toLocaleString("id-ID",{maximumFractionDigits:2});
const table=n=>data.table_series.find(t=>t.table===n);
const link=n=>source.publication.pdf+"#page="+source.tables.find(t=>t.number===n).pdfPage;
const months=["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06","2026-07","2026-08"];
const monthNames=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu"];
const key=s=>String(s||"").replace(/^\s*\d+\s+/,"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"");
let chosen=60,chosenRow=0,query="",marketCommodity="",farmerTable=30,worldTable=62;
function select(id,opts,val){const el=$(id);el.replaceChildren();for(const [k,s] of opts){const o=E("option",s);o.value=String(k);el.append(o)}el.value=String(val);}
function lineChart(el,series,labels,unit){
 el.replaceChildren();const finite=series.flatMap(s=>s.vals).filter(Number.isFinite);
 if(!finite.length){el.append(E("p","Angka belum tersedia.","sepsem-note"));return;}
 const min=Math.min(...finite),max=Math.max(...finite),margin=Math.max((max-min)*.08,Math.abs(max)*.02,1),floor=min-margin,ceil=max+margin;
 const W=700,H=235,x=i=>60+i*620/(labels.length-1),y=v=>20+(ceil-v)/(ceil-floor)*169;
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 "+W+" "+H);svg.setAttribute("role","img");svg.setAttribute("aria-label","Grafik bulanan "+unit);
 const L=(tag,attrs,txt)=>{const o=document.createElementNS(svg.namespaceURI,tag);Object.entries(attrs||{}).forEach(([k,v])=>o.setAttribute(k,String(v)));if(txt!==undefined)o.textContent=txt;return o;};
 for(let k=0;k<=4;k++){const val=floor+(ceil-floor)*k/4,yy=y(val);
  svg.append(L("line",{x1:60,x2:680,y1:yy,y2:yy,stroke:"#456277"}));
  svg.append(L("text",{x:54,y:yy+3,fill:"#bed1d8","font-size":10,"text-anchor":"end"},val.toLocaleString("id-ID",{maximumFractionDigits:1})));
 }
 labels.forEach((v,i)=>svg.append(L("text",{x:x(i),y:218,fill:"#d1dce5","font-size":11,"text-anchor":"middle"},v)));
 const colors=["#e9d099","#80c9b4","#c3a6df","#ee9b8c"];
 series.forEach((s,j)=>{const pairs=s.vals.map((v,i)=>({v,i})).filter(z=>Number.isFinite(z.v));
  svg.append(L("path",{d:pairs.map((p,i)=>(i?"L":"M")+x(p.i).toFixed(1)+","+y(p.v).toFixed(1)).join(" "),fill:"none",stroke:colors[j%colors.length],"stroke-width":3}));
  pairs.forEach(p=>{const c=L("circle",{cx:x(p.i),cy:y(p.v),r:4,fill:colors[j%colors.length]});c.append(L("title",{},s.name+" "+labels[p.i]+": "+num(p.v)+" "+unit));svg.append(c);});
 });el.append(svg);
 el.append(E("p",series.map((s,i)=>s.name+" ("+colors[i%colors.length]+")").join(" · "),"sepsem-note"));
}
function download(t){
 const heads=["Nomor tabel","Label asli",...t.periods,...t.extra_periods,"Satuan","Status ekstraksi"];
 const rows=t.rows.map(x=>[t.table,x.label,...t.periods.map(p=>x.values[p]??""),...t.extra_periods.map(p=>x.extra[p]??""),x.unit,t.parse_status]);
 const csv=[heads,...rows].map(x=>x.map(y=>'"'+String(y??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");
 const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),u=URL.createObjectURL(blob),o=document.createElement("a");
 o.href=u;o.download="SLI-Pusdatin-September-2026-Tabel-"+t.table+".csv";o.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
function renderRows(){
 const t=table(chosen),box=$("sepsemNumbers");box.replaceChildren();
 const rows=t.rows.filter(x=>x.label.toLowerCase().includes(query.toLowerCase()));
 box.append(E("h3","Tabel "+chosen+" · "+t.title.replace(/^Tabel\s*\d+\.\s*/,"")));
 box.append(E("p",t.rows.length+" baris diekstraksi · Status: "+t.parse_status+". Angka dengan penanda '-' dipertahankan sebagai tidak tersedia (null).","sepsem-flag"));
 const pdfChecked=Boolean(audit?.independent_table_fingerprints?.[String(chosen)]);
 box.append(E("p",pdfChecked?"Audit PDF tingkat baris: "+audit.independent_table_fingerprints[String(chosen)].count+" baris wilayah/komoditas utama telah dicocokkan dengan posisi teks PDF asli.":"Audit numerik PDF adaptif: "+(adaptive?.pdf_table_evidence?.find(x=>x.table===chosen)?.pdf_numeric_rows??0)+" baris angka cocok dengan teks asli PDF. Pemasangan label/subtotal terhadap sel masih menunggu validasi visual lengkap.","sepsem-flag"));
 const actions=E("div",undefined,"sepsem-controls");const c=E("button","Ekspor seluruh tabel ke CSV");c.onclick=()=>download(t);actions.append(c,a(link(chosen),"Lihat PDF sumber ↗"));box.append(actions);
 const scroll=E("div",undefined,"sepsem-table"),tbl=E("table"),thead=E("thead"),hrow=E("tr");
 ["Komoditas / indikator",...t.periods,...t.extra_periods].forEach(v=>hrow.append(E("th",v)));thead.append(hrow);tbl.append(thead);
 const tbody=E("tbody");rows.forEach(r=>{const tr=E("tr");[r.label,...t.periods.map(k=>num(r.values[k])),...t.extra_periods.map(k=>num(r.extra[k]))].forEach(v=>tr.append(E("td",v)));tbody.append(tr);});tbl.append(tbody);scroll.append(tbl);box.append(E("p",rows.length+" / "+t.rows.length+" baris tampil","sepsem-note"),scroll);
 const pick=E("div",undefined,"sepsem-controls");pick.append(E("label","Grafik baris"));
 const selector=E("select");selector.id="sepsemRow";pick.append(selector);box.append(pick);
 select("sepsemRow",t.rows.map((r,i)=>[i,r.label.slice(0,100)]),Math.min(chosenRow,t.rows.length-1));
 const graph=E("div",undefined,"sepsem-graph");box.append(graph);
 function chart(){const selected=t.rows[Number(selector.value)];if(!selected)return;const ps=t.periods.filter(p=>/^2026-\d\d$/.test(p));if(ps.length<2){graph.replaceChildren(E("p","Tidak tersedia seri bulanan pada tabel ini."));return;}
 lineChart(graph,[{name:selected.label,vals:ps.map(p=>selected.values[p])}],ps.map(x=>x.slice(5)),selected.unit);
 }
 selector.onchange=()=>{chosenRow=Number(selector.value);chart();};chart();
}
function renderMarket(){
 const p=table(60).rows,s=table(61).rows,b=new Set(s.map(x=>key(x.label))),matches=p.filter(x=>b.has(key(x.label)));
 const opts=matches.map(x=>[x.label,x.label.replace(/^\d+\s+/,"")]);
 if(!matches.some(x=>x.label===marketCommodity))marketCommodity=matches[0]?.label||"";
 select("sepsemMarketSelect",opts,marketCommodity);
 const lookup=(arr,l)=>arr.find(x=>key(x.label)===key(l));
 const price=lookup(p,marketCommodity),supply=lookup(s,marketCommodity);
 const host=$("sepsemMarketCharts");host.replaceChildren();const grid=E("div",undefined,"sepsem-grid");
 for(const item of [{name:"Harga Pasar Induk",r:price,unit:"Rp/kg",n:60},{name:"Pasokan Pasar Induk",r:supply,unit:"ton",n:61}]){
  const card=E("div",undefined,"sepsem-box");card.append(E("h3",item.name),E("p","Agustus 2026: "+num(item.r?.values["2026-08"])+" "+item.unit+" · perubahan MoM: "+num(item.r?.extra?.mom_pct)+"%."));
  const c=E("div",undefined,"sepsem-graph");card.append(c);lineChart(c,[{name:item.r?.label||"",vals:months.map(k=>item.r?.values[k]??null)}],monthNames,item.unit);
  card.append(a(link(item.n),"Sumber tabel "+item.n+" ↗"));grid.append(card);
 }host.append(grid,E("p","Harga dan pasokan tidak boleh disamakan atau dijumlahkan; perbandingan bersifat deskriptif, bukan bukti sebab-akibat.","sepsem-note"));
}
function renderFarmer(){
 const t=table(farmerTable);$("sepsemFarmerGraph").replaceChildren();
 const series=[];
 for(const label of ["Nilai Tukar Petani","Nilai Tukar Usaha Pertanian"]){
  const r=t.rows.find(x=>x.label.replace(/^\s*\d+\s+/,"").trim().toLowerCase()===label.toLowerCase());
  if(r)series.push({name:label,vals:months.map(k=>r.values[k])});
 }
 lineChart($("sepsemFarmerGraph"),series,monthNames,"indeks 2018=100");
 $("sepsemFarmerSource").replaceChildren(a(link(farmerTable),"Sumber Tabel "+farmerTable+" ↗"),E("p","Nilai indeks bukan keuntungan perusahaan tani atau pendapatan bersih rumah tangga.","sepsem-note"));
}
function renderWorld(){
 const t=table(worldTable);$("sepsemWorldOptions").replaceChildren();
 const opts=E("select");opts.id="sepsemWorldSelect";$("sepsemWorldOptions").append(E("label",worldTable===62?"Harga komoditas":"Jenis kurs"),opts);
 select("sepsemWorldSelect",t.rows.map((x,i)=>[i,x.label]),0);
 const graph=$("sepsemWorldGraph");
 const redraw=()=>{const r=t.rows[Number(opts.value)];lineChart(graph,[{name:r.label,vals:months.map(k=>r.values[k])}],monthNames,worldTable===63?"Rp/USD":r.unit);};
 opts.onchange=redraw;redraw();$("sepsemWorldSource").replaceChildren(a(link(worldTable),"Tabel "+worldTable+" · PDF sumber ↗"));
}
function start(){
 const base=$("fa-september");if(!base)return;
 const panel=E("article",undefined,"fa-card sepsem");panel.id="sepsemModule";
 panel.innerHTML='<h3>Data terstruktur edisi September · 63 tabel</h3><p>Penelusuran setiap baris sumber, grafik bulanan, ekspor CSV, harga dan pasokan Pasar Induk Kramat Jati, NTP nasional, harga dunia dan kurs. Angka tetap berstatus hasil ekstraksi yang memerlukan pemeriksaan terhadap tabel asli sebelum penggunaan keputusan.</p>'+
 '<div class="sepsem-grid"><div class="sepsem-box"><h3>NTP / NTUP nasional Agustus 2026</h3><div class="sepsem-controls"><label for="sepsemFarmerTable">Cakupan</label><select id="sepsemFarmerTable"></select></div><div id="sepsemFarmerGraph" class="sepsem-graph"></div><div id="sepsemFarmerSource"></div></div>'+
 '<div class="sepsem-box"><h3>Harga internasional dan kurs BI</h3><div class="sepsem-controls"><label for="sepsemWorldTable">Sumber</label><select id="sepsemWorldTable"></select><div id="sepsemWorldOptions" class="sepsem-controls"></div></div><div id="sepsemWorldGraph" class="sepsem-graph"></div><div id="sepsemWorldSource"></div></div></div>'+
 '<div class="sepsem-box"><h3>Harga vs pasokan · Pasar Induk Kramat Jati</h3><div class="sepsem-controls"><label for="sepsemMarketSelect">Komoditas</label><select id="sepsemMarketSelect"></select></div><div id="sepsemMarketCharts"></div></div>'+
 '<div class="sepsem-box"><h3>Seluruh angka tabel: pencarian, grafik &amp; ekspor CSV</h3><div class="sepsem-controls"><label for="sepsemTableChoice">Pilih tabel 1–63</label><select id="sepsemTableChoice"></select><label for="sepsemQuery">Cari baris</label><input id="sepsemQuery" type="search" placeholder="Komoditas, provinsi, indeks…"></div><div id="sepsemNumbers"></div></div>';
 base.append(panel);
 select("sepsemTableChoice",data.table_series.map(t=>[t.table,"Tabel "+t.table+" · "+t.title.replace(/^Tabel\s*\d+\.\s*/,"").slice(0,70)]),chosen);
 $("sepsemTableChoice").onchange=e=>{chosen=Number(e.target.value);chosenRow=0;renderRows();};
 $("sepsemQuery").oninput=e=>{query=e.target.value;renderRows();};
 select("sepsemFarmerTable",Array.from({length:6},(_,i)=>[i+30,table(i+30).title.replace(/^Tabel\s*\d+\.\s*/,"").slice(0,80)]),farmerTable);
 $("sepsemFarmerTable").onchange=e=>{farmerTable=Number(e.target.value);renderFarmer();};
 select("sepsemWorldTable",[[62,"Harga internasional"],[63,"Kurs rupiah / USD"]],worldTable);
 $("sepsemWorldTable").onchange=e=>{worldTable=Number(e.target.value);renderWorld();};
 $("sepsemMarketSelect").onchange=e=>{marketCommodity=e.target.value;renderMarket();};
 renderRows();renderMarket();renderFarmer();renderWorld();
}
async function init(){
 try{
  const r=await Promise.all([
   fetch("./data/pusdatin-agriculture-september-2026-semantic.json",{cache:"no-store"}),
   fetch("./data/pusdatin-agriculture-september-2026.json",{cache:"no-store"}),
   fetch("./data/pusdatin-september-pdf-independent-audit.json",{cache:"no-store"}),
   fetch("./data/pusdatin-september-adaptive-pdf-proof.json",{cache:"no-store"})
  ]);
  if(!r[0].ok||!r[1].ok||!r[2].ok||!r[3].ok)throw Error("September source or independent audit ledger could not load");
  data=await r[0].json();source=await r[1].json();audit=await r[2].json();adaptive=await r[3].json();
  if(data.table_series.length!==63||data.parsed_numeric_row_count!==2163||source.tables.length!==63||audit.verified_table_count!==22||adaptive.numeric_matrix_tables_matched!==63)throw Error("semantic/source/independent-audit integrity mismatch");
  start();
 }catch(e){const parent=$("fa-september");if(parent)parent.append(E("p","Modul angka tambahan belum dapat dimuat: "+e.message,"fa-error"));}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();