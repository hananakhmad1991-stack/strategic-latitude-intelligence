/* Palm investment, fiscal and biodiesel feedstock module: source-dated research. */
(function(){
"use strict";
const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined&&value!==null)n.textContent=String(value);return n};
const a=(url,label)=>{const n=el("a",null,label+" ↗");if(/^https:\/\//.test(url||"")){n.href=url;n.target="_blank";n.rel="noopener noreferrer"}else n.removeAttribute("href");return n};
const read=async p=>{const r=await fetch(p,{cache:"no-store"});if(!r.ok)throw Error("Missing "+p);return r.json()};
const id=()=>window.SLIi18n?.language==="id";
const L=(en,indo)=>id()?indo:en;
function panelCard(title,value,note,source){
 const x=el("div","palm-stat");
 x.append(el("div","eyebrow",title),el("strong",null,value),el("p",null,note));
 if(source){const links=el("div","palm-links");links.append(a(source,L("Source","Sumber")));x.append(links)}
 return x;
}
function block(root,title,sub){
 root.append(el("h3","palm-sub",title));
 if(sub)root.append(el("p","tr-detail",sub));
}
function statGrid(root,items){
 const g=el("div","palm-grid");items.forEach(x=>g.append(panelCard(...x)));root.append(g);
}
function render(root,d,news){
 root.replaceChildren();
 const title=el("h3",null,L("Palm oil: investment, public returns & B50 feedstock","Sawit: investasi, penerimaan publik & bahan baku B50"));
 const date=el("div","palm-pill",L("Research snapshot","Snapshot riset")+" · "+d.as_of);
 root.append(title,date,el("p","palm-intro",L(
  "Oil palm is a strategic agro-industrial input for biodiesel. This panel separates investments, export earnings, fiscal collections, physical feedstock and company sales.",
  "Sawit adalah bahan baku agroindustri strategis untuk biodiesel. Panel ini memisahkan investasi, nilai ekspor, pungutan fiskal, bahan baku fisik, dan penjualan perusahaan."
  )));
 const v=d.investment,f=d.fiscal,t=d.trade;
 statGrid(root,[
  [L("Palm-only downstream investment · 2025","Investasi hilirisasi sawit saja · 2025"),L("Not yet verified","Belum terverifikasi"),L("Official BKPM LKPM palm-only dataset is available; total not independently aggregated.","Dataset LKPM khusus sawit tersedia di BKPM; total belum diverifikasi."),v.palm_2025_dataset_url],
  [L("Plantation + forestry downstream · 2025","Hilirisasi perkebunan + kehutanan · 2025"),"Rp"+v.broad_2025_downstream_forestry_plantation_rp_trillion+" T",L("Broader BKPM sector comparator. NOT palm-oil-only.","Pembanding kategori BKPM gabungan. BUKAN khusus sawit."),v.broad_2025_source],
  [L("Palm export levy + duty · 2025","Pungutan ekspor + bea keluar sawit · 2025"),"Rp"+f.reported_levies_plus_export_duties_rp_trillion+" T",L("Government-attributed combined collection; not audited as a single APBN tax receipt.","Angka gabungan menurut pemerintah; bukan satu pos pajak APBN yang sudah direkonsiliasi."),f.source],
  [L("Palm-product export value · Jan–Aug 2026","Nilai ekspor produk sawit · Jan–Agu 2026"),"US$"+t.exports_ytd_usd_billion+" bn",L("GAPKI industry series; export sales are not state receipts.","Seri industri GAPKI; nilai ekspor bukan penerimaan negara."),t.ytd_source],
  [L("Palm production · Jan–Aug 2026","Produksi sawit · Jan–Agu 2026"),t.output_ytd_million_tonnes+"m tonnes",L("Cumulative CPO + PKO industry volume, NOT FAME biodiesel output.","Volume kumulatif CPO + PKO, BUKAN produksi biodiesel FAME."),t.ytd_source],
  [L("Domestic palm use · Jan–Aug 2026","Pemakaian sawit domestik · Jan–Agu 2026"),t.consumption_ytd_million_tonnes+"m tonnes",L("Palm products used in food, energy and oleochemicals.","Produk sawit untuk pangan, energi, dan oleokimia."),t.ytd_source]
 ]);
 const cols=el("div","palm-columns");
 const left=el("div"),right=el("div");
 left.append(el("h3","palm-sub",L("Realized investment: exact reporting boundary","Investasi terealisasi: batas definisi")));
 left.append(el("p","tr-detail",id()?v.definition:"The Rp144.5tn comparator aggregates plantation and forestry downstreaming, not palm-specific investment. A numeric palm-only PMA/PMDN value will appear only after aggregating the original LKPM CSV."));
 left.append(a(v.palm_2025_dataset_url,L("BKPM palm-only investment dataset","Dataset investasi khusus sawit BKPM")));
 right.append(el("h3","palm-sub",L("State returns: fiscal accounting","Penerimaan negara: akuntansi fiskal")));
 right.append(el("p","tr-detail",id()?
  "Rp53,13 T merupakan gabungan pungutan ekspor dan bea keluar yang dikutip pemerintah. Belum dipisahkan antara dana BPDP dan penerimaan APBN. PPh, PPN, dan PBB khusus sawit belum tersedia secara terverifikasi.":
  f.scope+" "+f.breakdown_note));
 right.append(a(f.source,L("Government statement / BPDP","Pernyataan pemerintah / BPDP")));
 cols.append(left,right);root.append(cols);
 block(root,L("Source-to-fuel chain · what actually comes from palm","Rantai bahan baku sampai bahan bakar · yang berasal dari sawit"),L("Tap any stage for its methodological definition.","Ketuk tahap untuk melihat batasan data."));
 const chain=el("div","palm-chain");
 d.biofuel_link.materials.forEach((m,i)=>{
  const detail=el("details"),label=el("summary",null,(i+1)+". "+m.title);
  const content=el("p",null,m.description);
  detail.append(label,content);chain.append(detail)
 });root.append(chain);
 root.append(el("p","tr-detail",L("Critical distinction: palm supports FAME biodiesel, but not every biofuel is palm-based. Bioethanol typically comes from sugar or starch crops; SAF feedstocks differ by technology.","Pembedaan penting: sawit menyuplai biodiesel FAME, tetapi tidak semua biofuel berbasis sawit. Bioetanol umumnya berasal dari tanaman bergula/berpati, sedangkan bahan baku SAF tergantung teknologinya.")));
 block(root,L("Who operates and who keeps the records?","Siapa yang beroperasi dan memegang data?"),L("An operational actor is not evidence of a newly completed investment.","Pelaku operasional bukan bukti investasi baru telah direalisasikan."));
 const actors=el("div","palm-watch");
 for(const x of d.actors){const q=el("article");q.append(el("strong",null,x.name),el("small",null,x.role),el("p","tr-detail",x.note),a(x.source,L("Source record","Catatan sumber")));actors.append(q)}
 root.append(actors);
 block(root,L("Palm investment and policy watch","Pemantauan investasi dan kebijakan sawit"),L("Auto-refreshed news headlines are unverified leads; the numeric metrics above are editorially sourced snapshots.","Judul berita dipindai otomatis dan belum diverifikasi; angka di atas adalah snapshot riset bersumber."));
 const watch=el("div","palm-watch");
 const matched=(news?.reports||[]).filter(x=>x.topic===d.monitoring.news_topic).slice(0,6);
 if(!matched.length)watch.append(el("p","tr-detail",L("No current palm-specific feed entries. Scan results will appear when the next eligible source is indexed.","Belum ada berita khusus sawit. Hasil pemindaian akan muncul bila sumber baru terindeks.")));
 for(const x of matched){const entry=el("article");entry.append(a(x.url,x.title),el("small",null,(x.published_at_utc||"Date unknown")+" · "+(x.publisher||"Source unknown")+" · "+L("Unverified headline lead","Judul belum diverifikasi")));watch.append(entry)}
 root.append(watch);
 root.append(el("p","tr-detail",d.definitions+" "+L("Last automatic media scan: ","Pemindaian media otomatis terakhir: ")+(news?.checked_at_utc||L("not yet available","belum tersedia"))));
 const bio=el("button","viz-btn",L("Open Biodiesel & Biofuels module ↗","Buka modul Biodiesel & Biofuel ↗"));
 bio.type="button";bio.addEventListener("click",()=>{const b=document.querySelector('button[data-page="energy"]');if(b)b.click();const target=document.getElementById("energyBiofuelsRoot");if(target)target.scrollIntoView({behavior:"smooth",block:"start"})});root.append(bio);
}
let last=null,lastNews=null;
window.initSLIInvestmentPalm=async function(){
 const root=document.getElementById("investmentPalmRoot");if(!root)return;
 if(last){render(root,last,lastNews);return}
 root.replaceChildren(el("p","tr-detail","Loading source-dated palm oil investment intelligence…"));
 try{const [d,n]=await Promise.allSettled([read("data/investment-palm.json"),read("data/investment-news.json")]);
  if(d.status!=="fulfilled")throw Error("Palm snapshot missing");
  last=d.value;lastNews=n.status==="fulfilled"?n.value:null;render(root,last,lastNews);
 }catch(e){root.replaceChildren(el("p","tr-detail","Palm research data unavailable; no estimates substituted."));console.error("[SLI] palm panel",e)}
};
document.addEventListener("sli:languagechange",()=>{const root=document.getElementById("investmentPalmRoot");if(root&&last)render(root,last,lastNews)});
})();
