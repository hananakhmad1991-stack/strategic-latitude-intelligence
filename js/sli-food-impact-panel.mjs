import {buildFoodEvidence,FOOD_COMMODITIES} from "./sli-food-impact-engine.mjs?v=20261021-impact1";
/* Shared descriptive Food Evidence Lens mounted on Food dashboard and Research AI.
 * No secret API or inference of causes, issuer impact, or national food security status. */
const $=(id,base=document)=>base.getElementById?base.getElementById(id):base.querySelector("#"+id);
const el=(tag,txt,className)=>{const x=document.createElement(tag);if(txt!=null)x.textContent=String(txt);if(className)x.className=className;return x};
const nf=(n,dec=0)=>n==null?"Data tidak tersedia":Number(n).toLocaleString("id-ID",{minimumFractionDigits:dec,maximumFractionDigits:dec});
const percent=n=>n==null?"Belum tersedia":(n>0?"+":"")+nf(n,2)+"%";
const link=(url,label)=>{const a=el("a",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
function stat(caption,value,note){const d=el("article",null,"sli-fi-metric");d.append(el("small",caption),el("strong",value),el("span",note));return d}
function paragraph(text){return el("p",text)}
function label(text,id){const l=el("label",text);l.htmlFor=id;return l}
function choose(id,entries){const s=el("select");s.id=id;for(const [v,title] of entries){const o=el("option",title);o.value=String(v);s.append(o)}return s}
const sectorLinks=[
 ["./index.html#sliHomeIDXSectors","IDX Sector Watchlist"],
 ["./provincial-intelligence.html","Provincial Intelligence"],
 ["./policy-regulatory-intelligence.html","Regulasi & Kebijakan"],
 ["./geopolitical-impact-assessment.html","Geopolitical Intelligence"],
 ["./sli-research-evidence-preview.html","Research Evidence Preview"]
];
const mode=()=>document.getElementById("fa-september")?"food":document.getElementById("raIntro")?"research":document.getElementById("raForm")?"preview":null;
async function init(){
 const where=mode();if(!where)return;
 const anchor=where==="food"?document.getElementById("fa-september"):where==="research"?document.getElementById("raIntro"):document.getElementById("raForm");
 if(!anchor)return;
 const root=el("section",null,"sli-food-impact");root.id="sliFoodImpactLens";root.setAttribute("aria-label","Pusdatin evidence and food-sector implications");
 if(where==="food"){const num=anchor.querySelector("#sepsemModule");if(num)anchor.insertBefore(root,num);else anchor.append(root)}
 else anchor.insertAdjacentElement("afterend",root);
 root.append(el("h2","Food Intelligence · apa yang berubah, di mana, dan dampak potensial"));
 root.append(paragraph("Analisis deskriptif data Pusdatin September 2026 (observasi Agustus). Perubahan harga dan NTP tidak membuktikan penyebab, kerawanan pangan, atau efek laba emiten."));
 const controls=el("div",null,"sli-fi-controls");const commodity=choose("sliFiCommodity",FOOD_COMMODITIES.map(c=>[c.table,c.label])),province=choose("sliFiProvince",[["Jawa Barat","Jawa Barat"]]);
 controls.append(label("Komoditas",commodity.id),commodity,label("Provinsi / wilayah",province.id),province);
 root.append(controls);
 const flags=el("p",null,"sli-fi-note");flags.id="sliFiCoverage";root.append(flags);
 const body=el("div",null,"sli-fi-content");root.append(body);
 const dataUrls=["./data/pusdatin-agriculture-september-2026-semantic.json","./data/pusdatin-agriculture-september-2026.json","./data/pusdatin-september-pdf-independent-audit.json","./data/pusdatin-september-layout-audit-2026.json"];
 try{
  const res=await Promise.all(dataUrls.map(path=>fetch(path,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error(path+" HTTP "+r.status);return r.json()})));
  const [sem,source,audit,layout]=res;
  if(layout.schema!=="sli-pusdatin-september-63-table-layout-audit-v2"||layout.numeric_matrix_matched!==33)throw Error("Mismatch audit status");
  const provinces=sem.table_series.find(t=>t.table===38).rows.map(x=>x.label.replace(/^\d+\s+/,""));
  province.replaceChildren();for(const p of provinces){const o=el("option",p);o.value=p;province.append(o)}province.value="Jawa Barat";
  function render(){
   const d=buildFoodEvidence(sem,source,audit,{commodity:commodity.value,province:province.value});
   body.replaceChildren();
   const tiles=el("div",null,"sli-fi-grid");
   tiles.append(stat("Rata-rata nasional · Agustus",nf(d.national.value)+" Rp/kg",percent(d.national.monthly_change_pct)+" vs Juli 2026"));
   tiles.append(stat("Harga · "+d.region.name,d.region.price==null?"Tidak dilaporkan":nf(d.region.price)+" Rp/kg",percent(d.region.monthly_change_pct)+" vs Juli 2026"));
   tiles.append(stat("NTP · "+d.region.name,nf(d.region.ntp,2),percent(d.region.ntp_monthly_change_pct)+" MoM · basis 2018=100"));
   tiles.append(stat("Sinyal akses harga",d.food_security.signal==="large_monthly_change"?"Perubahan besar":d.food_security.signal==="notable_monthly_change"?"Perubahan menonjol":d.food_security.signal==="data_gap"?"Data tidak cukup":"Perubahan relatif terbatas","Bukan indeks resmi ketahanan pangan"));
   body.append(tiles);
   const insight=el("div",null,"sli-fi-insights");
   const sections=[
    ["Apa yang berubah","Rata-rata harga nasional "+d.commodity+" "+d.national.direction+" "+percent(d.national.monthly_change_pct)+" dari Juli ke Agustus 2026. Perubahan tingkat provinsi: "+percent(d.region.monthly_change_pct)+". Hanya dua observasi bulanan; tidak menunjukkan tren jangka panjang."],
    ["Wilayah & ketimpangan cakupan",d.region.name+": harga "+(d.region.price_observed?"tercatat":"tidak tersedia dalam tabel pasar")+", sedangkan NTP "+(d.region.ntp_observed?"tercatat":"tidak tersedia")+". Sumber harga mencakup 34 lokasi; tabel NTP mencakup 38 provinsi. Jangan menyamakan kedua cakupan."],
    ["Mengapa berubah? · masih hipotesis","Faktor yang harus diperiksa secara independen: "+d.potential_drivers.to_verify+". Publikasi Pusdatin ini tidak menyediakan identifikasi kausal. Perlu bukti pasokan, logistik, cuaca, dan kebijakan pada lokasi serta periode yang sama."],
    ["Sektor & perusahaan berpotensi terdampak","Eksposur tematik untuk diteliti: "+d.sector_exposure.sectors+". Belum ada nama emiten yang dapat dinyatakan terdampak dari seri harga ini; diperlukan laporan sumber bahan baku, penjualan, margin, dan kontrak perusahaan."],
    ["Implikasi ketahanan pangan","Perubahan harga dapat menjadi petunjuk tekanan keterjangkauan. Penilaian kerawanan pangan tetap memerlukan pendapatan/daya beli, konsumsi, stok, produksi, distribusi, serta kerentanan rumah tangga."]
   ];
   for(const [heading,text] of sections){const card=el("article",null,"sli-fi-insight");card.append(el("h3",heading),paragraph(text));insight.append(card)}
   body.append(insight);
   const refs=el("div",null,"sli-fi-sources");refs.append(el("strong","Bukti resmi dan periode: "),link(d.national.source_url,"Tabel "+d.commodity_table+" (harga) ↗"),link(d.region.ntp_source_url,"Tabel 38 (NTP) ↗"));
   const docs=el("p","Audit: 22 tabel telah diperiksa lebih kuat terhadap baris PDF; 11 tabel lainnya cocok pada matriks angka; 30 masih memiliki pengecualian tata letak. Data historis, bukan harga live.","sli-fi-note");refs.append(docs);body.append(refs);
   flags.textContent="Basis data Agustus 2026 · publikasi September 2026 · verifikasi angka != validasi penyebab atau dampak korporasi · null bukan nol";
  }
  commodity.addEventListener("change",render);province.addEventListener("change",render);render();
  const routes=el("nav",null,"sli-fi-routes");routes.setAttribute("aria-label","Explore related sector modules");
  for(const [href,name] of sectorLinks){const a=el("a",name+" ↗");a.href=href;routes.append(a)}root.append(routes);
 }catch(err){flags.textContent="Analisis pangan tidak tersedia: "+String(err.message);flags.setAttribute("role","alert")}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
