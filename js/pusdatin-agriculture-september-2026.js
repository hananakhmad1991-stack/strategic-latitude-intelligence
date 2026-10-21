/* Source-dated Pusdatin September 2026 layer, June preserved as archival baseline. */
(()=>{"use strict";
const fmt=v=>v==null?"—":Number(v).toLocaleString("id-ID",{maximumFractionDigits:2});
const usd=v=>v==null?"—":"US$"+fmt(v/1e6)+" miliar";
const norm=s=>String(s||"").toLowerCase().replace(/^kep\.\s*/,"kepulauan ").replace("nusa tanggara","nusa tenggara").replace(/[^a-z0-9]/g,"");
const E=(tag,txt,cls)=>{const x=document.createElement(tag);if(txt!=null)x.textContent=String(txt);if(cls)x.className=cls;return x;};
const A=(url,txt)=>{const x=E("a",txt);x.href=url;x.target="_blank";x.rel="noopener noreferrer";return x;};
const sel=(name,entries,def)=>{const x=E("select");x.setAttribute("aria-label",name);for(const [v,t] of entries){const o=E("option",t);o.value=v;if(v===def)o.selected=true;x.append(o)}return x;};
const md={"2026-01/07":"Jan–Jul 2026","2026-07":"Jul 2026","2026-06":"Jun 2026","2026-05":"Mei 2026","2026-04":"Apr 2026","2026-03":"Mar 2026","2026-02":"Feb 2026","2026-01":"Jan 2026"};
const category={total:"Segar + olahan",fresh:"Segar",processed:"Olahan"};
function init(){
 const below=document.getElementById("fa-overview");if(!below)return;
 const root=E("section",null,"fa-section sep");root.id="fa-september";root.innerHTML=[
 '<div class="fa-heading"><div><span class="fa-step">01 / PUSDATIN · 23 SEPTEMBER 2026</span><h2>Statistik Pertanian September 2026</h2></div><small>63 tabel · perdagangan Juli · harga dan NTP Agustus</small></div>',
 '<p class="fa-note">Snapshot resmi Pusdatin yang lebih baru dari arsip Juni di bawah. Bukan angka real-time. Sumber BPS, BI dan Pasar Induk Kramat Jati yang dikompilasi Kementan. Data tidak tersedia ≠ nol.</p>',
 '<div id="sepKpi" class="fa-kpis"></div>',
 '<div class="fa-two"><article class="fa-card"><h3>Neraca perdagangan menurut subsektor</h3><div id="sepTradeControls" class="fa-toolbar"></div><div id="sepBars"></div><div id="sepTradeSource" class="fa-note"></div></article>',
 '<article class="fa-card"><h3>Perkembangan neraca bulanan</h3><div id="sepTimeline"></div><p class="fa-note">Satuan sumber: ribu USD; jumlah kumulatif bukan total bulanan.</p></article></div>',
 '<div class="fa-two fa-two-wide"><article class="fa-card"><h3>Peta data pertanian provinsi dan harga konsumen</h3><div id="sepGeoControls" class="fa-toolbar"></div><div id="sepMap" role="group" aria-label="Peta interaktif Indonesia"></div><div id="sepGeoRanking"></div></article>',
 '<aside class="fa-card"><h3>Rincian indikator wilayah</h3><div id="sepDetail" aria-live="polite"></div><p class="fa-note">Indeks NTP/NTUP memakai 38 provinsi; harga konsumen tercatat pada 34 wilayah sumber. Tidak disajikan sebagai cakupan identik.</p></aside></div>',
 '<article class="fa-card"><h3>Katalog digital · 63 tabel asli</h3><div id="sepTableControls" class="fa-toolbar"></div><div id="sepCount" class="fa-note"></div><div class="fa-two"><div id="sepTableList"></div><div id="sepTableInspect"></div></div><p class="fa-note">90 baris seri perdagangan dan 678 baris regional telah dipisahkan secara numerik. Seluruh 63 tabel memiliki transkrip halaman, sementara tabel lainnya belum dinyatakan lolos validasi angka per baris.</p></article>'
 ].join("");below.parentNode.insertBefore(root,below);
 const $=id=>root.querySelector("#"+id);
 fetch("./data/pusdatin-agriculture-september-2026.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(db=>{
  const pdf=n=>db.publication.pdf+"#page="+db.tables.find(t=>t.number===n).pdfPage;
  const trade=(scope,metric,sector="Pertanian Total")=>db.trade_rows.find(z=>z.scope===scope&&z.metric===metric&&z.unit==="ribu USD"&&z.sector===sector);
  const kpis=[["Neraca pertanian",trade("total","neraca")?.values["2026-01/07"]],["Segar",trade("fresh","neraca")?.values["2026-01/07"]],["Olahan",trade("processed","neraca")?.values["2026-01/07"]]];
  for(const [name,value] of kpis){const x=E("article",null,"fa-kpi");x.append(E("small",name),E("strong",usd(value)),E("em","Jan–Jul 2026"));$("sepKpi").append(x)}
  const last=E("article",null,"fa-kpi");last.append(E("small","Cakupan dokumen"),E("strong","63 tabel"),E("em","89 halaman · 2026-09-23"));$("sepKpi").append(last);
  let scope="total",period="2026-01/07";
  const sc=sel("Cakupan perdagangan",Object.entries(category),scope),pc=sel("Periode perdagangan",Object.entries(md),period);
  $("sepTradeControls").append(E("label","Cakupan"),sc,E("label","Periode"),pc);
  function renderTrade(){
   const table=scope==="total"?1:scope==="fresh"?2:3;
   const rows=db.trade_rows.filter(r=>r.table===table&&r.metric==="neraca"&&r.unit==="ribu USD"&&r.sector!=="Pertanian Total");
   const max=Math.max(1,...rows.map(r=>Math.abs(r.values[period]??0)));$("sepBars").replaceChildren();
   for(const r of rows){const v=r.values[period],b=E("button",null,"sep-bar"),track=E("span",null,"sep-bar-track"),fill=E("span",null,"sep-bar-fill"+(v<0?" minus":""));fill.style.width=(100*Math.abs(v||0)/max)+"%";track.append(fill);b.append(E("span",r.sector),track,E("b",usd(v)));b.onclick=()=>{$("sepTradeSource").replaceChildren(E("span",r.sector+" · "+md[period]+" = "+fmt(v)+" ribu USD · "),A(pdf(table),"Sumber asli ↗"))};$("sepBars").append(b)}
   $("sepTradeSource").replaceChildren(A(pdf(table),"Sumber Pusdatin · Tabel "+table+" ↗"));
   const timeline=$("sepTimeline");timeline.replaceChildren();
   for(const month of ["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06","2026-07"]){const v=trade(scope,"neraca")?.values[month];const r=E("div",null,"sep-trend");r.append(E("span",month.slice(5)),E("b",usd(v)));timeline.append(r)}
  }sc.onchange=()=>{scope=sc.value;renderTrade()};pc.onchange=()=>{period=pc.value;renderTrade()};renderTrade();
  const dataset=db.regional_series,metric=sel("Indikator wilayah",dataset.map(d=>[String(d.table),"Tabel "+d.table+" · "+db.tables.find(t=>t.number===d.table).title.slice(0,71)]),"38"),month=sel("Periode wilayah",db.month_keys_other.map(m=>[m,m]),"2026-08"),place=sel("Provinsi/lokasi",[],"");$("sepGeoControls").append(E("label","Indikator"),metric,E("label","Bulan"),month,E("label","Wilayah"),place);
  let selected="Jawa Barat",geometry=null;
  function renderGeo(){
   const d=dataset.find(x=>String(x.table)===metric.value),k=month.value,rows=d.rows;place.replaceChildren();
   for(const r of rows){const opt=E("option",r.name);opt.value=r.name;place.append(opt)}
   const current=rows.find(r=>norm(r.name)===norm(selected))||rows[0];selected=current?.name||"";place.value=selected;
   $("sepDetail").replaceChildren(E("h4",selected),E("p","Tabel "+d.table+" · "+k+": "+fmt(current?.values[k])+" "+(d.table<=43?"(indeks 2018=100)":"Rp/kg")),E("p","Bulanan "+fmt(current?.mom_pct_published)+"%; tahunan "+fmt(current?.yoy_pct_published)+"%"),A(pdf(d.table),"Cek PDF asli ↗"));
   const list=$("sepGeoRanking");list.replaceChildren();for(const r of [...rows].sort((a,b)=>(b.values[k]??-Infinity)-(a.values[k]??-Infinity))){const b=E("button",r.name+" · "+fmt(r.values[k]),"sep-region"+(r.name===selected?" picked":""));b.onclick=()=>{selected=r.name;renderGeo()};list.append(b)}
   const host=$("sepMap");host.replaceChildren();if(!geometry){host.append(E("p","Peta geografi sedang dimuat; daftar wilayah tetap tersedia."));return}
   const vals=rows.map(r=>r.values[k]).filter(v=>v!=null),mn=Math.min(...vals),mx=Math.max(...vals);
   const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 920 370");
   const coords=rings=>rings.map(ring=>ring.map((p,i)=>(i?"L":"M")+((p[0]-94)*18+10).toFixed(1)+" "+((7-p[1])*18+10).toFixed(1)).join(" ")+" Z").join(" ");
   for(const f of geometry){const name=f.properties.PROVINSI,found=rows.find(r=>norm(r.name)===norm(name)),v=found?.values[k]??null,c=v==null?"#71818b":"hsl("+(210-(mx===mn?.5:(v-mn)/(mx-mn))*160)+",55%,60%)";
    const shape=document.createElementNS(svg.namespaceURI,"path"),polys=f.geometry.type==="Polygon"?[f.geometry.coordinates]:f.geometry.coordinates;
    shape.setAttribute("d",polys.map(coords).join(" "));shape.setAttribute("fill",c);shape.setAttribute("stroke",norm(selected)===norm(name)?"#ffe4a6":"#254254");shape.setAttribute("stroke-width",norm(selected)===norm(name)?"2.5":".6");shape.style.cursor="pointer";shape.setAttribute("tabindex","0");shape.setAttribute("role","button");shape.setAttribute("aria-label",name+": "+fmt(v));const title=document.createElementNS(svg.namespaceURI,"title");title.textContent=name+": "+fmt(v);shape.append(title);
    const choose=()=>{if(found){selected=found.name;renderGeo()}};shape.addEventListener("click",choose);shape.addEventListener("keydown",e=>{if(e.key==="Enter"){choose()}});svg.append(shape)
   }host.append(svg)
  }
  metric.onchange=renderGeo;month.onchange=renderGeo;place.onchange=()=>{selected=place.value;renderGeo()};
  fetch("./data/sli-indonesia-province-38.geojson").then(r=>r.ok?r.json():null).then(j=>{geometry=j?.features||null;renderGeo()}).catch(()=>renderGeo());renderGeo();
  const query=E("input");query.type="search";query.placeholder="Cari nomor/komoditas/indikator…";query.setAttribute("aria-label","Cari 63 tabel");
  const only=E("input");only.type="checkbox";const label=E("label");label.append(only,E("span"," Hanya angka yang telah dipisahkan"));$("sepTableControls").append(query,label);
  const isStructured=n=>n<=3||(n>=36&&n<=43)||(n>=49&&n<=59);let chosen=1;
  function viewTables(){
   const matches=db.tables.filter(x=>(!only.checked||isStructured(x.number))&&(x.title.toLowerCase().includes(query.value.toLowerCase())||String(x.number)===query.value.trim()));$("sepCount").textContent=matches.length+" dari 63 tabel";
   const list=$("sepTableList");list.replaceChildren();for(const r of matches){const b=E("button","Tabel "+r.number+" · "+r.title.replace(/^Tabel\s*\d+\.\s*/,"").slice(0,100),"sep-source"+(r.number===chosen?" selected":""));b.onclick=()=>{chosen=r.number;viewTables()};list.append(b)}
   const r=db.tables.find(t=>t.number===chosen)||matches[0],host=$("sepTableInspect");host.replaceChildren();if(!r)return;
   host.append(E("h4",r.title),E("p","Halaman PDF "+r.pdfPage+" · "+(isStructured(r.number)?"angka terstruktur sebagian":"transkrip sumber; angka menunggu validasi semantik")),A(pdf(r.number),"Lihat halaman resmi ↗"));
   const pre=E("pre",r.text_rows,"sep-transcript");pre.setAttribute("tabindex","0");host.append(pre);
   const copy=E("button","Salin teks tabel");copy.onclick=()=>navigator.clipboard?.writeText(r.text_rows);host.append(copy)
  }query.oninput=viewTables;only.onchange=viewTables;viewTables();
 }).catch(err=>{$("sepKpi").textContent="Dataset Pusdatin September gagal dimuat: "+err.message});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();