/* SLI EV intelligence — EN/ID source-vintaged EV statistics, targets and watcher. */
(function(){
"use strict";
const E=(tag,cl,txt)=>{const n=document.createElement(tag);if(cl)n.className=cl;if(txt!==undefined&&txt!==null)n.textContent=String(txt);return n};
const language=()=>window.SLIi18n?.language==="id"?"id":"en";
const t=(en,id)=>language()==="id"?id:en;
const f=n=>Number(n).toLocaleString(language()==="id"?"id-ID":"en-US",{maximumFractionDigits:1});
const a=(url,text)=>{const e=E("a","ev-link",text||t("Evidence ↗","Sumber ↗"));if(/^https:\/\//.test(url||"")){e.href=url;e.target="_blank";e.rel="noopener noreferrer"}return e};
const p=(node,text)=>node.append(E("p","ev-note",text));
const sec=(root,title,subtitle)=>{const head=E("div","ev-head");head.append(E("h3",null,title),E("span",null,subtitle));root.append(head)};
const stat=(label,value,meta,url)=>{const c=E("div","ev-stat");c.append(E("span","ev-eyebrow",label),E("strong","ev-value",value),E("p","ev-note",meta));if(url)c.append(a(url));return c};
function bars(root,rows,max){const cont=E("div","ev-bars");rows.forEach(x=>{const r=E("div","ev-barrow"),lab=E("div","ev-barhead");lab.append(E("span",null,x.label),E("strong",null,f(x.value)+(x.unit||"")));r.append(lab);const track=E("div","ev-track"),fill=E("div","ev-fill");fill.style.width=Math.min(100,Math.max(0,x.value/max*100))+"%";if(x.highlight)fill.classList.add("ev-highlight");track.append(fill);r.append(track);if(x.foot)p(r,x.foot);cont.append(r)});root.append(cont)}
function notice(root,heading,description){const n=E("div","ev-caution");n.append(E("strong",null,heading),E("p",null,description));root.append(n)}
function summary(root,d){
 sec(root,t("Electric mobility snapshot","Ringkasan kendaraan listrik"),t("Car versus motorcycle · distinct methods and periods","Mobil vs motor · metode dan periode berbeda"));
 const k=E("div","ev-stats");
 k.append(stat(t("BEV car sales · Jan–Sep 2026","Penjualan mobil BEV · Jan–Sep 2026"),f(d.cars.gaikindo_wholesale.value),t("GAIKINDO-derived wholesale to dealers; not EV fleet stock","Wholesales berbasis GAIKINDO; bukan populasi mobil"),d.cars.gaikindo_wholesale.source),
 stat(t("EV motorcycle sales · Jan–Aug 2026","Penjualan motor listrik · Jan–Agu 2026"),f(d.motorcycles.sales_2026.value),t("AISMOLI association report, not SRUT registration","Laporan AISMOLI, bukan registrasi SRUT"),d.motorcycles.sales_2026.source),
 stat(t("All battery EV fleet · Aug 2026","Populasi seluruh EV baterai · Agu 2026"),f(d.fleet.latest_national.value),t("Kemenperin, all vehicle categories; not car-only","Kemenperin, seluruh kategori; bukan hanya mobil"),d.fleet.latest_national.source),
 stat(t("SPKLU milestone · May 2026","Capaian SPKLU · Mei 2026"),f(d.infrastructure.milestone_5000.value_at_least)+"+",t("PLN inaugurated its 5,000th unit; exact latest total unknown","PLN meresmikan unit ke-5.000; total terkini belum diverifikasi"),d.infrastructure.milestone_5000.source));root.append(k);
 sec(root,t("National EV fleet population growth","Pertumbuhan populasi EV nasional"),t("All battery electric vehicle classes · dated stock, not sales","Semua jenis kendaraan listrik baterai · data populasi, bukan penjualan"));
 bars(root,[{label:t("2025 year-end reported EV fleet","Populasi EV akhir 2025"),value:d.fleet.latest_national.previous_2025},{label:t("Aug 2026 national EV fleet","Populasi EV nasional Agustus 2026"),value:d.fleet.latest_national.value,highlight:true}],600000);
 const tgt=d.targets;sec(root,t("2030 national EV population ambition","Target populasi kendaraan listrik nasional 2030"),t("Compare fleet stock with fleet target, not wholesales","Bandingkan populasi dengan target populasi, bukan penjualan"));
 const panel=E("div","ev-targets");panel.append(stat(t("Electric cars · target","Mobil listrik · target"),f(tgt.electric_cars_population),t("2030 population target; Apr 2026 car stock available","Target populasi 2030; stok mobil Apr 2026 tersedia"),tgt.source),stat(t("Electric 2-wheelers · target","Motor listrik · target"),f(tgt.electric_two_wheelers_population),t("2030 in-use population; 2026 stock comparison shown below","Populasi 2030; pembanding stok 2026 di bawah"),tgt.source));root.append(panel);
 bars(root,[{label:t("Car fleet Apr 2026 / 2030 cars target","Populasi mobil Apr 2026 / target mobil 2030"),value:d.cars.stock_verified.value,unit:" / "+f(tgt.electric_cars_population),highlight:true,foot:f(tgt.car_stock_progress_pct)+"%"}],tgt.electric_cars_population);
 bars(root,[{label:t("Motorcycle fleet Apr 2026 / 2030 motorcycles target","Populasi motor Apr 2026 / target motor 2030"),value:d.motorcycles.fleet_stock_later.value,unit:" / "+f(tgt.electric_two_wheelers_population),highlight:true,foot:f(tgt.bike_stock_progress_april_pct)+"%"}],tgt.electric_two_wheelers_population);
 notice(root,t("Population source caution","Catatan penting data populasi"),t("Kemenperin by-category stock is dated April 2026, while its latest aggregate 541,678 EV figure is dated August. The unusually large March-to-April reported change requires registry reconciliation. Do not allocate August stock to vehicle types or mistake it for sales.","Data populasi terperinci Kemenperin adalah April 2026, sedangkan total EV 541.678 unit berasal dari Agustus. Lonjakan yang dilaporkan antara Maret dan April perlu rekonsiliasi registrasi. Jangan membagi total Agustus ke tiap jenis kendaraan atau menyebutnya angka penjualan."));
 const type=E("div","ev-types");sec(root,t("EV technology categories","Jenis kendaraan listrik"),t("Different powertrains and statistics","Teknologi dan statistik berbeda"));
 d.types.forEach(x=>{const card=E("div","ev-type");card.append(E("strong",null,x.key),E("span",null,language()==="id"?x.indonesian:x.name));type.append(card)});root.append(type);
}
function cars(root,d){sec(root,t("Battery-electric cars: market & production","Mobil listrik baterai: pasar & produksi"),t("2026 Jan–Sep · factory-to-dealer versus produced in Indonesia","Jan–Sep 2026 · distribusi ke dealer vs produksi Indonesia"));
 const g=E("div","ev-stats");g.append(stat(t("2026 Jan–Sep BEV wholesales","Wholesales BEV Jan–Sep 2026"),f(d.cars.gaikindo_wholesale.value),t("Nine months, not full-year sales","Sembilan bulan, bukan setahun penuh"),d.cars.gaikindo_wholesale.source),stat(t("2025 full-year BEV wholesales","Wholesales BEV sepanjang 2025"),f(d.cars.prior_full_year.value),t("Comparison has different length of observation","Pembanding dengan periode observasi berbeda"),d.cars.prior_full_year.source),stat(t("2026 Jan–Sep BEV local production","Produksi BEV lokal Jan–Sep 2026"),f(d.cars.production.value),t("Domestic manufacturing, not sold units","Produksi domestik, bukan angka penjualan"),d.cars.production.source),stat(t("2026 Q1 BEV sales","Penjualan BEV triwulan I 2026"),f(d.cars.quarterly_snapshot.value),t("Official Kemenperin citing GAIKINDO","Kemenperin mengutip data GAIKINDO"),d.cars.quarterly_snapshot.source));root.append(g);
 sec(root,t("Market sales versus domestic output","Penjualan pasar vs produksi domestik"),t("Both Jan–Sep 2026, distinct economic indicators","Keduanya Jan–Sep 2026, indikator berbeda"));
 bars(root,[{label:t("BEV wholesale","Wholesales BEV"),value:d.cars.gaikindo_wholesale.value,highlight:true},{label:t("BEV domestic production","Produksi BEV domestik"),value:d.cars.production.value}],d.cars.gaikindo_wholesale.value);
 sec(root,t("Selected monthly BEV wholesales","Penjualan BEV bulanan terpilih"),t("Incomplete monthly series; only verified listed months","Seri bulanan belum lengkap; hanya bulan terverifikasi"));
 bars(root,d.cars.monthly_wholesale.map(x=>({label:x.period,value:x.value})),18000);
 notice(root,t("Market categories must not be mixed","Kategori pasar tidak boleh dicampur"),t("HEV and PHEV are shown as separate vehicle types but are not added to the BEV total. BEV wholesales, retail, production and registered population are not interchangeable. Prior-year production comparison has a scope caveat.","HEV dan PHEV adalah jenis terpisah dan tidak ditambahkan ke angka BEV. Wholesales, retail, produksi, dan populasi kendaraan bukan indikator yang sama. Data pembanding produksi tahun sebelumnya memiliki perbedaan cakupan."));
}
function motorcycles(root,d){sec(root,t("Electric two-wheelers: adoption and policy uncertainty","Motor listrik: adopsi dan ketidakpastian kebijakan"),t("Industry sales reports, SRUT records, stock population kept separate","Data asosiasi, SRUT, dan populasi dipisahkan"));
 const k=E("div","ev-stats");k.append(stat(t("Jan–Aug 2026 · AISMOLI","Jan–Agu 2026 · AISMOLI"),f(d.motorcycles.sales_2026.value),t("Industry-reported sales, partial year","Penjualan versi asosiasi, belum setahun"),d.motorcycles.sales_2026.source),stat(t("2025 · SRUT (Kemenhub)","2025 · SRUT (Kemenhub)"),f(d.motorcycles.srut_sales_2025.value),t("Different measurement system","Sistem pencatatan berbeda"),d.motorcycles.srut_sales_2025.source),stat(t("2024 · SRUT (Kemenhub)","2024 · SRUT (Kemenhub)"),f(d.motorcycles.srut_sales_2024.value),t("Comparable SRUT annual basis with 2025","Basis SRUT tahunan sebanding dengan 2025"),d.motorcycles.srut_sales_2024.source),stat(t("Apr 2026 · fleet population","Apr 2026 · populasi motor listrik"),f(d.motorcycles.fleet_stock_later.value),t("Kemenperin by-type stock, not annual unit sales","Stok kendaraan menurut Kemenperin, bukan penjualan tahunan"),d.motorcycles.fleet_stock_later.source));root.append(k);
 sec(root,t("2024–25 SRUT figures","Angka SRUT 2024–2025"),t("Same source family · separate from AISMOLI","Keluarga sumber sama · dipisah dari AISMOLI"));
 bars(root,[{label:"2024 SRUT",value:d.motorcycles.srut_sales_2024.value},{label:"2025 SRUT",value:d.motorcycles.srut_sales_2025.value}],80000);
 notice(root,t("AISMOLI data not comparable to SRUT","Data AISMOLI tidak sama dengan SRUT"),t("AISMOLI estimated about 70,000 electric motorcycle sales in full-year 2025, whereas 2025 SRUT was 55,059. SLI does not construct an artificial 2026 year-on-year decline using these incompatible records.","AISMOLI memperkirakan sekitar 70.000 penjualan motor listrik pada 2025, sedangkan SRUT mencatat 55.059. SLI tidak menghitung penurunan tahunan 2026 menggunakan basis yang berbeda."));
 sec(root,t("Motorcycle market structural context","Konteks pasar sepeda motor"),t("All motorcycle types · 2025 AISI","Seluruh jenis motor · AISI 2025"));
 const p0=E("div","ev-stats");p0.append(stat(t("All motorcycle sales 2025","Seluruh motor terjual 2025"),f(d.motorcycles.all_motorcycle_sales_2025.value),t("Mostly internal-combustion; not electric sales","Mayoritas bermesin bakar; bukan hanya motor listrik"),d.motorcycles.all_motorcycle_sales_2025.source));root.append(p0);
}
function charging(root,d){sec(root,t("Charging stations and grid readiness","Stasiun pengisian dan kesiapan jaringan"),t("SPKLU units are not physical sites; motorcycle swaps are separate","Unit SPKLU berbeda dari lokasi; penukaran baterai motor terpisah"));
 const v=d.infrastructure,box=E("div","ev-stats");box.append(stat(t("PLN & partner SPKLU machines","Mesin SPKLU PLN dan mitra"),f(v.spklu_units.value),t("March 2026 · public car charging stations","Maret 2026 · pengisian kendaraan publik"),v.spklu_units.source),stat(t("SPKLU locations","Lokasi SPKLU"),f(v.spklu_sites.value),t("March 2026 · site count, not charger count","Maret 2026 · jumlah lokasi, bukan unit"),v.spklu_sites.source),stat(t("SPKLU units · end 2025","Unit SPKLU · akhir 2025"),f(v.spklu_prior_year_units.value),t("Historical PLN/partner benchmark","Acuan historis PLN dan mitra"),v.spklu_prior_year_units.source),stat(t("SPKLU 5,000th unit milestone · May 2026","Capaian SPKLU ke-5.000 · Mei 2026"),f(v.milestone_5000.value_at_least)+"+",t("Threshold achieved; latest exact fleet count not verified","Ambang tercapai; jumlah tepat terbaru belum diverifikasi"),v.milestone_5000.source),stat(t("Strategic travel-corridor units","Unit koridor mudik strategis"),f(v.corridors.units),t("Ramadan 2026 · subset of national chargers","Mudik 2026 · bagian dari SPKLU nasional"),v.corridors.source));root.append(box);
 bars(root,[{label:t("PLN/partners end-2025 charging units","Unit pengisian PLN/mitra akhir 2025"),value:v.spklu_prior_year_units.value},{label:t("PLN/partners Mar-2026 charging units","Unit pengisian PLN/mitra Mar 2026"),value:v.spklu_units.value},{label:t("5,000th machine milestone · May 2026","Capaian mesin ke-5.000 · Mei 2026"),value:v.milestone_5000.value_at_least,highlight:true}],5200);
 notice(root,t("Motorcycle battery swapping","Penukaran baterai motor listrik"),t("An audited comparable 2026 national SPBKLU site/bay inventory was not verified. Electric motorcycle swapping infrastructure is not measured by SPKLU car charging-unit totals.","Data nasional 2026 untuk lokasi/unit penukaran baterai SPBKLU yang terverifikasi belum tersedia. Infrastruktur motor listrik tidak bisa disamakan dengan jumlah SPKLU mobil."));
 p(root,language()==="id"?"Keandalan jaringan, konektor, jam operasi, tingkat pemakaian dan bauran emisi listrik penting untuk menilai kesiapan EV, bukan hanya jumlah mesin.":v.advisory);
}
const policyId={
 "EV acceleration framework":["Kerangka percepatan kendaraan listrik","Kerangka regulasi telah berlaku","Regulasi kendaraan listrik baterai, investasi dan pelaksanaan TKDN; ketentuan turunan serta pengecualian berbeda menurut periode."],
 "Domestic-content roadmap (TKDN)":["Peta jalan TKDN","Jadwal resmi berlaku, pengecualian khusus perlu dicek","TKDN minimum 40% untuk 2022–2026, 60% pada 2027–2029 dan 80% mulai 2030. Periksa kewajiban serta masa transisi tiap model."],
 "2025 VAT / luxury tax incentives for certain BEVs":["Insentif PPN dan PPnBM tertentu tahun 2025","Berlaku untuk TA 2025; tidak otomatis diperpanjang hingga 2026","Model yang memenuhi syarat dan periode hukum ditentukan regulasi. Perubahan 2026 memerlukan instrumen hukum baru yang masih berlaku."],
 "2026 electric motorcycle purchase-incentive proposal":["Usulan insentif pembelian motor listrik 2026","Usulan tertunda; belum terverifikasi berlaku","Rencana dukungan Rp5 juta tidak boleh disebut subsidi yang dapat dicairkan tanpa PMK yang efektif."]
};
const industryId={
 "BYD electric passenger-car manufacturing facility inaugurated":["Peresmian fasilitas manufaktur mobil listrik BYD","Peresmian pabrik sebagaimana dilaporkan ANTARA; produksi bulanan, pembelian komponen lokal dan realisasi belanja modal masih harus diverifikasi."],
 "Indonesian EV batteries — first reported exports":["Ekspor awal baterai EV Indonesia yang diumumkan","Operasi komersial dan ekspor awal diumumkan di Weda Bay; nilai proyek kelompok industri tidak boleh dianggap seluruhnya belanja modal fasilitas baterai."],
 "National electric motorcycle (MoLiNas) / ALVA ecosystem":["Ekosistem motor listrik nasional MoLiNas / ALVA","Peluncuran motor listrik nasional dan capaian produksi ALVA 20.000 unit, bukan bukti 20.000 MoLiNas telah terjual."],
 "Domestic EV component supply-chain program":["Pengembangan rantai pasok komponen EV domestik","Pertemuan bisnis industri kecil dan menengah, belum merupakan bukti pengiriman komponen atau realisasi investasi."]
};
function governance(root,d){sec(root,t("EV policies, local content and industrial implementation","Kebijakan EV, TKDN dan perkembangan industri"),t("Enacted law, incentives and industrial activity have separate evidence statuses","Regulasi, insentif dan aktivitas industri memiliki status bukti berbeda"));
 d.policies.forEach(item=>{const c=E("div","ev-record"),translated=policyId[item.title];const title=E("div","ev-record-top");title.append(E("strong",null,language()==="id"&&translated?translated[0]:item.title),E("span",null,language()==="id"&&translated?translated[1]:item.status));c.append(title,E("p","ev-note",item.instrument+" · "+item.date));p(c,language()==="id"&&translated?translated[2]:item.note);c.append(a(item.source));root.append(c)});
 sec(root,t("Industrial and EV supply-chain milestones","Perkembangan industri dan rantai pasok EV"),t("Announcements are not verified realized investments","Pengumuman belum tentu investasi terealisasi"));
 d.industry.forEach(item=>{const c=E("div","ev-record"),translated=industryId[item.name];c.append(E("strong",null,language()==="id"&&translated?translated[0]:item.name),E("p","ev-note",item.period+" · "+item.location),E("p","ev-note",item.participants),E("p","ev-note",language()==="id"&&translated?translated[1]:item.status),a(item.source));root.append(c)});
 sec(root,t("Strategic assessment","Penilaian strategis"),t("Qualitative findings, not quantified economic forecasts","Penilaian kualitatif, bukan proyeksi ekonomi kuantitatif"));
 const warnings=["Populasi kendaraan listrik nasional mencapai 541.678 unit per Agustus 2026, sedangkan rincian mobil versus motor yang dapat dirujuk berasal dari April 2026.","Pertumbuhan wholesales mobil BEV sangat cepat, tetapi pengiriman ke dealer bukan jumlah kendaraan terdaftar maupun populasi kendaraan di jalan.","Adopsi motor listrik melambat menurut AISMOLI; ketidakpastian insentif harus dilacak dengan dokumen regulasi yang sudah berlaku.","Target 2030 merupakan jumlah kendaraan yang beroperasi, bukan penjualan satu tahun. Jangan mencampur jumlah unit produksi dan stok kendaraan.","Jaringan SPKLU telah berkembang, tetapi kesiapan membutuhkan data waktu aktif, lokasi, daya, dan kompatibilitas konektor.","Nilai tambah manufaktur EV bergantung pada pemasok lokal, teknologi baterai, TKDN, dan realisasi investasi; pengumuman proyek saja tidak cukup.","Dampak pengurangan emisi dan ketahanan energi perlu mempertimbangkan bauran pembangkit, penggunaan kendaraan, siklus hidup baterai, dan BBM yang benar-benar tergantikan."];
 const ol=E("ol","ev-findings");(language()==="id"?warnings:d.assessment).forEach(x=>ol.append(E("li",null,x)));root.append(ol);
}
async function news(panel){
 const old=panel.querySelector(".ev-news-body");if(old)old.remove();
 const body=E("div","ev-news-body");panel.append(body);p(body,t("Loading attributable EV updates…","Memuat perkembangan EV…"));
 try{
  const resp=await fetch("data/energy-ev-watch.json",{cache:"no-store"});if(!resp.ok)throw Error("Feed not yet published");const d=await resp.json();
  body.replaceChildren();const date=d.checked_at_utc?new Date(d.checked_at_utc):null;
  const stale=!date||!Number.isFinite(date.getTime())||(Date.now()-date.getTime())>6*3600000;
  p(body,t("Latest source scan: ","Pemindaian sumber terakhir: ")+(date&&Number.isFinite(date.getTime())?date.toLocaleString(language()==="id"?"id-ID":"en-GB",{timeZone:"Asia/Jakarta",dateStyle:"medium",timeStyle:"short"})+" WIB":t("Pending","Belum tersedia"))+(stale?t(" · stale / pending"," · terlambat / menunggu"):"")+(d.errors?.length?t(" · some sources failed"," · beberapa sumber gagal"):""));
  const controls=E("div","ev-news-controls"),listing=E("div");body.append(controls,listing);
  const items=Array.isArray(d.items)?d.items:[],categories=["All","Cars","Motorcycles","Charging","Policy","Industry","Batteries"];
  const opts={"All":"Semua","Cars":"Mobil","Motorcycles":"Motor","Charging":"SPKLU","Policy":"Kebijakan","Industry":"Industri","Batteries":"Baterai"};
  function draw(category){listing.replaceChildren();const r=items.filter(x=>category==="All"||x.category===category).slice(0,18);
   if(!r.length)p(listing,t("No qualifying source leads. Absence is not evidence of no activity.","Tidak ada berita sesuai filter. Ini bukan bukti bahwa tidak ada aktivitas."));
   for(const x of r){const n=E("article","ev-news-card");n.append(E("span","ev-news-meta",x.category+" · "+String(x.published_at_utc||"").slice(0,10)+" · "+x.publisher),a(x.url,x.title+" ↗"),E("p","ev-note",t("Unverified headline; verify actual event and regulations at the original source.","Berita belum diverifikasi; periksa kejadian dan aturan pada sumber asli.")));listing.append(n)}
  }
  categories.forEach((cat,i)=>{const b=E("button","ev-filter"+(!i?" active":""),language()==="id"?opts[cat]:cat);b.type="button";b.addEventListener("click",()=>{for(const x of controls.children)x.classList.toggle("active",x===b);draw(cat)});controls.append(b)});draw("All");
  if(d.stale_previous_results)notice(body,t("Previous leads retained","Temuan lama dipertahankan"),t("The latest upstream scan failed; do not interpret previously discovered titles as new incidents.","Pemindaian terbaru mengalami gangguan; jangan anggap berita lama sebagai insiden baru."));
 }catch(e){body.replaceChildren();p(body,t("The scheduled monitoring feed is not yet available. Sourced research figures above remain accessible.","Umpan berita terjadwal belum tersedia. Data riset bersumber di atas tetap dapat diakses."));}
}
let currentData=null;
function build(root,d){
 root.replaceChildren();
 const hero=E("div","ev-hero");hero.append(E("div","ev-overline",t("INDONESIA · ELECTRIC MOBILITY · 2026","INDONESIA · KENDARAAN LISTRIK · 2026")),E("h2",null,t("Electric Vehicle Intelligence","Intelijen Kendaraan Listrik")),E("p","ev-note",t("Cars, motorcycles, electric buses, targets, industrial projects, charging infrastructure and policy signals.","Mobil listrik, motor listrik, bus, target, proyek industri, infrastruktur pengisian, dan perkembangan kebijakan.")));root.append(hero);
 const tabs=E("div","ev-tabs"),view=E("div","ev-panel");
 const entries=[
 [t("Overview","Ringkasan"),summary],
 [t("Electric cars","Mobil listrik"),cars],
 [t("Motorcycles","Motor listrik"),motorcycles],
 [t("Charging","Pengisian daya"),charging],
 [t("Policy & industry","Kebijakan & industri"),governance]
 ];
 const buttons=[];
 entries.forEach(([name,fn],i)=>{const b=E("button","ev-tab",name);b.type="button";b.addEventListener("click",()=>{view.replaceChildren();fn(view,d);buttons.forEach((btn,j)=>{btn.classList.toggle("active",i===j);btn.setAttribute("aria-pressed",String(i===j))})});tabs.append(b);buttons.push(b)});root.append(tabs,view);buttons[0].click();
 const radar=E("div","ev-panel");const head=E("div","ev-head");head.append(E("h3",null,t("Electric mobility news & policy radar","Radar berita dan kebijakan kendaraan listrik")));const refresh=E("button","ev-refresh",t("Refresh latest published scan ↻","Muat ulang pemindaian terbitan ↻"));refresh.type="button";refresh.onclick=()=>news(radar);head.append(refresh);radar.append(head);
 p(radar,t("Automated public-source discovery every three hours. Refresh retrieves an already-published feed; it does not verify live operational data or change laws automatically.","Penelusuran sumber publik otomatis setiap tiga jam. Muat ulang mengambil data yang sudah terbit, bukan memverifikasi data operasi secara langsung atau mengubah status hukum otomatis."));root.append(radar);news(radar);
 p(root,t("Research as of ","Data riset per ")+d.as_of+". "+t("Factory shipments, registered in-use EV stock and installed charging machines are separate statistical series.","Distribusi pabrik, populasi EV terdaftar, dan jumlah mesin pengisian memakai definisi statistik berbeda."));
}
window.initSLIEV=async function(){
 const root=document.getElementById("energyEVRoot");if(!root)return;
 if(currentData){build(root,currentData);return}
 root.replaceChildren(E("p","ev-note",t("Loading verified EV data…","Memuat data EV terverifikasi…")));
 try{const res=await fetch("data/energy-ev.json",{cache:"no-store"});if(!res.ok)throw Error("No dataset");const data=await res.json();
 if(!data.cars?.gaikindo_wholesale?.value||!data.motorcycles?.fleet_stock?.value||!data.targets?.electric_two_wheelers_population)throw Error("Incomplete dataset");
 currentData=data;build(root,data);
 }catch(e){root.replaceChildren(E("p","ev-note",t("EV data temporarily unavailable; other dashboard sections remain accessible.","Data EV sementara tidak tersedia; bagian dashboard lainnya tetap bisa digunakan.")))}
};
document.addEventListener("sli:languagechange",()=>{const root=document.getElementById("energyEVRoot");if(root&&currentData)build(root,currentData)});
})();
