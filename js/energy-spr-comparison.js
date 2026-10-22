/* Strategic Latitude Intelligence · energy oil-security comparison, v2026-10-22.
   IEA days of NET IMPORTS != Indonesia days of DOMESTIC BBM DISTRIBUTION.
   Do not create an implied apples-to-apples ranking or fill missing strategic reserve actuals. */
(function(){
"use strict";
const ID="energySPRRoot",DATA="./data/energy-spr-comparison-2026.json";
const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined&&text!==null)el.textContent=String(text);return el;};
const isId=()=>document.documentElement.lang.toLowerCase().startsWith("id");
const tr=(english,indonesian)=>isId()?indonesian:english;
const fmt=(v,dec=0)=>Number(v).toLocaleString(isId()?"id-ID":"en-US",{minimumFractionDigits:dec,maximumFractionDigits:dec});
const external=(url,label)=>{const a=make("a",null,label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;};
const para=(container,text,cls)=>container.append(make("p",cls||"",text));
let cache=null,tab="benchmark",search="",sort="desc",expandedChart=false;

function metric(label,num,detail){
 const item=make("article","spr-metric");item.append(make("span","spr-kicker",label),make("strong","spr-num",num),make("p","spr-metric-foot",detail));return item;
}
function header(root,d){
 const head=make("div","spr-head");
 head.append(make("p","spr-eyebrow",tr("ENERGY SECURITY / OIL STOCKHOLDING","KETAHANAN ENERGI / CADANGAN MINYAK")),
 make("h2",null,tr("Strategic Petroleum Reserves: 25-Country Comparison","Perbandingan Cadangan Minyak: 25 Negara")));
 para(head,tr("24 IEA oil-importing members plus Indonesia · official annual operating stocks and legally defined strategic buffer targets.",
 "24 anggota IEA pengimpor minyak serta Indonesia · stok operasional resmi dan target cadangan penyangga yang ditetapkan hukum."));
 root.append(head);
 const row=make("div","spr-metrics");
 row.append(metric(tr("IEA minimum","Minimum IEA"),"90 "+tr("days","hari"),tr("Net oil imports; member obligation","Impor bersih minyak; kewajiban anggota")),
 metric(tr("Indonesia BBM · 2025","BBM Indonesia · 2025"),fmt(d.indonesia.operational_fuel_days_2025,2)+" "+tr("days","hari"),tr("ESDM annual operational coverage","Cadangan operasional tahunan ESDM")),
 metric(tr("Indonesia BBM · Mar 2026","BBM Indonesia · Mar 2026"),"≈"+fmt(d.indonesia.official_fuel_statement_2026_03_days)+" "+tr("days","hari"),tr("Dated government statement","Pernyataan pemerintah bertanggal")),
 metric(tr("CPE target horizon","Horizon target CPE"),String(d.indonesia.strategic_buffer_cpe_targets.completion_horizon_year),tr("Legal target, not current stored volume","Target hukum, bukan stok aktual")));
 root.append(row);
 const caveat=make("div","spr-caution");
 caveat.append(make("strong",null,tr("Different denominators — not a valid head-to-head ranking.","Pembagi berbeda — bukan peringkat yang setara.")));
 para(caveat,tr(
 "The 90-day IEA obligation is based on prior-year NET OIL IMPORTS and eligible emergency stocks. Indonesia's 20.76 days measures commercial BBM stock / domestic daily distribution. Indonesia is an IEA Association country, not bound by the members' 90-day requirement. Strategic/buffer stocks actually stored have not been confirmed.",
 "Kewajiban IEA 90 hari memakai IMPOR BERSIH MINYAK tahun sebelumnya dan stok darurat yang memenuhi syarat. Angka Indonesia 20,76 hari adalah stok BBM operasional / penyaluran BBM harian domestik. Indonesia merupakan negara asosiasi IEA, bukan anggota yang diwajibkan memiliki 90 hari. Realisasi stok strategis/penyangga belum terverifikasi."));
 root.append(caveat);
}

function tabs(root){
 const list=make("div","spr-tabs");list.setAttribute("role","tablist");list.setAttribute("aria-label",tr("Oil stock analysis sections","Bagian analisis cadangan minyak"));
 const labels=[["benchmark",tr("25-country table & chart","Tabel & grafik 25 negara")],["policy",tr("Indonesia · Policy links","Indonesia · Kaitan kebijakan")],["sources",tr("Sources & methodology","Sumber & metodologi")]];
 for(const [key,title] of labels){
  const b=make("button","spr-tab",title);b.type="button";b.setAttribute("role","tab");b.setAttribute("aria-selected",String(tab===key));b.classList.toggle("active",tab===key);
  b.addEventListener("click",()=>{tab=key;render(cache);});list.append(b);
 }
 root.append(list);
}

function comparePanel(root,d){
 const panel=make("section","spr-section");panel.append(make("h3",null,tr("Oil cover by country","Lama cadangan minyak per negara")));
 para(panel,tr(
 "IEA members: approximate readings from Figure 3 (December 2025), except New Zealand's 88 days reported in the text. Indonesia: exact 2025 annual operating-fuel indicator, shown separately because its denominator differs.",
 "Anggota IEA: estimasi pembacaan grafik Figure 3 (Desember 2025), kecuali 88 hari Selandia Baru yang disebut eksplisit dalam teks. Indonesia: indikator operasional BBM tahunan 2025, dipisahkan karena dasar hitung berbeda."),"spr-caption");
 const controls=make("div","spr-controls");
 const input=make("input","spr-input");input.type="search";input.placeholder=tr("Search country…","Cari negara…");input.setAttribute("aria-label",tr("Search country","Cari negara"));input.value=search;
 input.addEventListener("input",e=>{search=e.target.value;redrawBenchmark(d,panel);});
 const sel=make("select","spr-select");sel.setAttribute("aria-label",tr("Sort countries","Urutkan negara"));
 for(const [value,name] of [["desc",tr("Highest coverage first","Hari terbanyak")],["asc",tr("Lowest coverage first","Hari terendah")],["alpha",tr("Country A–Z","Negara A–Z")]]){
 const opt=make("option",null,name);opt.value=value;sel.append(opt);
 }sel.value=sort;sel.addEventListener("change",()=>{sort=sel.value;redrawBenchmark(d,panel);});
 const csv=make("button","spr-action",tr("Export 25-country CSV","Unduh CSV 25 negara"));csv.type="button";csv.addEventListener("click",()=>download(d));
 controls.append(input,sel,csv);panel.append(controls);
 const mount=make("div","spr-benchmark-body");panel.append(mount);root.append(panel);
 fillBenchmark(d,mount);
}
function visibleRows(d){
 const q=search.toLocaleLowerCase().trim();
 const rows=d.countries.filter(x=>!q||x.country.toLocaleLowerCase().includes(q)||x.code.toLowerCase().includes(q));
 return rows.sort((a,b)=>{
  if(a.group!==b.group)return a.group==="indonesia_operational"?1:-1;
  return sort==="alpha"?a.country.localeCompare(b.country):sort==="asc"?a.days-b.days:b.days-a.days;
 });
}
function redrawBenchmark(d,section){
 const mount=section.querySelector(".spr-benchmark-body");if(mount)fillBenchmark(d,mount);
}
function fillBenchmark(d,mount){
 mount.replaceChildren();
 const entries=visibleRows(d),members=entries.filter(x=>x.group==="iea_net_imports");
 const caption=make("p","spr-count",tr("Showing ","Menampilkan ")+entries.length+tr(" of 25 countries (24 IEA + Indonesia)"," dari 25 negara (24 IEA + Indonesia)"));mount.append(caption);
 if(!entries.length){para(mount,tr("No matching countries.","Tidak ditemukan negara."));return;}
 const graph=make("div","spr-graph");graph.append(make("h4",null,tr("IEA member stocks · days of net imports","Cadangan anggota IEA · hari impor bersih")));
 const vis=expandedChart?members:members.slice(0,10);
 const barArea=make("div","spr-bars");
 for(const row of vis){
  const r=make("div","spr-bar-row");
  const nm=make("span","spr-bar-country",row.country),track=make("div","spr-bar-track"),fill=make("div","spr-bar-fill");
  fill.style.width=Math.min(100,row.days/500*100)+"%";
  const threshold=make("span","spr-threshold");threshold.style.left="18%";threshold.title=tr("IEA 90-day minimum","Minimum IEA 90 hari");
  track.append(fill,threshold);
  r.append(nm,track,make("strong","spr-bar-value",(row.value_status==="reported_exact_in_ieefa_text"?"":"≈")+fmt(row.days)));
  barArea.append(r);
 }
 graph.append(barArea);
 const legend=make("p","spr-caption",tr("Gold marker = 90-day IEA minimum · values with ≈ are graphical estimates, not exact IEA data.","Garis emas = minimum IEA 90 hari · angka ≈ adalah estimasi dari grafik, bukan data IEA presisi."));
 graph.append(legend);
 if(members.length>10){const toggle=make("button","spr-link-button",expandedChart?tr("Show fewer","Ringkas"):tr("Show all 24 IEA countries","Tampilkan 24 anggota IEA"));toggle.type="button";toggle.addEventListener("click",()=>{expandedChart=!expandedChart;fillBenchmark(d,mount)});graph.append(toggle);}
 mount.append(graph);
 const region=make("div","spr-table-wrap");region.setAttribute("tabindex","0");region.setAttribute("role","region");region.setAttribute("aria-label",tr("Country coverage table, horizontally scrollable","Tabel hari cadangan negara, dapat digeser"));
 const table=make("table","spr-table"),thead=make("thead"),trh=make("tr");
 for(const h of [tr("Country","Negara"),tr("Coverage (days)","Cadangan (hari)"),tr("Stock type / denominator","Jenis stok / dasar hitung"),tr("Period","Periode"),tr("Evidence quality","Kualitas bukti")])trh.append(make("th",null,h));
 thead.append(trh);table.append(thead);
 const body=make("tbody");
 for(const e of entries){
  const row=make("tr",e.code==="ID"?"spr-indonesia":"");
  row.append(make("th",null,e.country));
  row.append(make("td","spr-table-number",(e.value_status==="graphical_approximation"?"≈":"")+fmt(e.days,e.code==="ID"?2:0)));
  row.append(make("td",null,e.group==="iea_net_imports"?tr("Emergency oil stocks / net imports","Stok minyak darurat / impor bersih"):tr("Operational BBM / domestic daily distribution","BBM operasional / penyaluran harian domestik")));
  row.append(make("td",null,e.as_of.slice(0,7)));
  row.append(make("td",null,e.value_status==="graphical_approximation"?tr("Approx. chart read","Estimasi grafik"):e.code==="ID"?tr("Official ESDM report","Laporan resmi ESDM"):tr("Reported prose figure","Angka eksplisit laporan")));
  body.append(row);
 }
 table.append(body);region.append(table);mount.append(region);
 const foot=make("p","spr-caption");foot.append(tr("IEA oil importers' average: 141 days (December 2025, IEEFA). Not a world average. Indonesia is not included in the IEA average. ",
 "Rata-rata pengimpor minyak anggota IEA: 141 hari (Desember 2025, IEEFA), bukan rata-rata dunia. Indonesia tidak masuk perhitungan tersebut. "),
 external(d.cross_country_chart.source,tr("View original cross-country chart ↗","Buka grafik sumber ↗")));mount.append(foot);
}
function download(d){
 const header=["country","iso_code","coverage_days","value_status","stock_category","denominator","observation_date","source_url"];
 const raw=d.countries.map(row=>{
  const source=row.code==="ID"?d.indonesia.official_2025_source:d.cross_country_chart.source;
  return [row.country,row.code,String(row.days),row.value_status,row.stock_type,row.denominator,row.as_of,source];
 });
 const csv=[header,...raw].map(cols=>cols.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\r\n");
 const url=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));
 const a=make("a");a.href=url;a.download="sli-energy-oil-stock-cover-25-countries-2026-10-22.csv";document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function fact(container,title,content,detail,source,sourceLabel){
 const card=make("article","spr-policy-card");card.append(make("h4",null,title),make("strong","spr-policy-stat",content),make("p",null,detail));if(source)card.append(external(source,sourceLabel||tr("Primary source ↗","Sumber primer ↗")));container.append(card);
}
function policyPanel(root,d){
 const i=d.indonesia,buf=i.strategic_buffer_cpe_targets,p=make("section","spr-section");
 p.append(make("h3",null,tr("Three layers of reserves — three different purposes","Tiga lapisan cadangan — tiga fungsi berbeda")));
 const row=make("div","spr-policy-grid");
 fact(row,tr("1 · Operational stocks (industry)","1 · Cadangan operasional (badan usaha)"),fmt(i.operational_fuel_days_2025,2)+tr(" days BBM"," hari BBM"),
 tr("Daily logistical continuity; 2025 actual BBM, not sovereign SPR. 2025 LPG operational cover: ","Menjaga kontinuitas logistik harian; realisasi BBM 2025, bukan SPR milik negara. Cadangan operasional LPG 2025: ")+fmt(i.operational_lpg_days_2025,2)+tr(" days."," hari."),i.official_2025_source);
 fact(row,tr("2 · Strategic / emergency stock architecture","2 · Arsitektur cadangan strategis / darurat"),tr("IEA: ≥90 days","IEA: ≥90 hari"),
 tr("IEA members' eligible emergency petroleum stocks based on net imports. Indonesia's actual stock days on this same methodology are unavailable; no legal Indonesian 90-day compliance claim.",
 "Anggota IEA menghitung stok darurat minyak berdasarkan impor bersih. Realisasi hari Indonesia pada metodologi yang sama belum tersedia; tidak ada klaim kewajiban hukum 90 hari bagi Indonesia."),d.iea_standard.source);
 fact(row,tr("3 · Energy buffer reserve (CPE)","3 · Cadangan Penyangga Energi (CPE)"),String(buf.completion_horizon_year),
 tr("Government-owned buffer inventory required by Perpres 96/2024; deadlines and target quantities are not evidence that inventory has already been acquired.",
 "Persediaan penyangga milik pemerintah berdasarkan Perpres 96/2024; target volume dan tenggat tidak membuktikan bahwa stok telah dibeli dan disimpan."),buf.official_law_pdf);
 p.append(row);
 p.append(make("h4","spr-subtitle",tr("CPE legally prescribed volumes, to be fulfilled through 2035","Volume CPE yang ditetapkan hukum, untuk dipenuhi hingga 2035")));
 const targets=make("div","spr-target-grid");
 for(const [name,value] of [[tr("Gasoline","Bensin"),fmt(buf.gasoline_million_barrels,2)+tr(" million barrels"," juta barel")],[tr("LPG","LPG"),fmt(buf.lpg_thousand_metric_tonnes,2)+tr(" thousand tonnes"," ribu ton")],[tr("Crude oil","Minyak mentah"),fmt(buf.crude_million_barrels,2)+tr(" million barrels"," juta barel")]]){
  targets.append(metric(name,value,tr("Legal target · actual volume not verified","Target hukum · realisasi belum terverifikasi")));
 }p.append(targets);
 const alert=make("div","spr-caution");para(alert,tr(
 "Do not add operational stock days to CPE target volumes or infer national SPR coverage from petroleum geological reserves (P1). Those are distinct inventory, target and underground-reserve concepts.",
 "Jangan menjumlah hari cadangan operasional dengan target volume CPE, atau menghitung hari SPR nasional dari cadangan geologi minyak (P1). Ketiganya konsep yang berbeda."));p.append(alert);
 p.append(make("h3","spr-subtitle",tr("Policy transmission: where stockholding meets national security","Transmisi kebijakan: kaitan stok dengan keamanan nasional")));
 const list=make("ol","spr-policy-list");
 const points=isId()?[
  "Ketahanan impor: guncangan jalur Hormuz atau keterlambatan kapal menaikkan risiko pasokan bensin, diesel, LPG, serta minyak untuk kilang; uji berdasarkan asal impor dan lama perjalanan kapal, bukan berita saja.",
  "Ruang fiskal: impor mahal dan depresiasi rupiah dapat menambah tekanan pada harga BBM dan subsidi/kompensasi; stok fisik mengurangi paparan gangguan volume tetapi tidak menjamin harga stabil.",
  "Kapasitas penyimpanan: pernyataan pemerintah Maret 2026 menyebut daya tampung BBM sekitar 25 hari; perlu investasi tangki, terminal, konektivitas antarpulau dan standar pergantian stok.",
  "Tata kelola CPE: DEN menyepakati desain/lokasi, ESDM mengelola, negara membiayai sesuai kemampuan fiskal; setiap proyek perlu bukti pengadaan, volume terisi, kesiapan pelepasan, dan pemulihan stok.",
  "Respons darurat: tetapkan aturan pelepasan stok, prioritas layanan vital, demand restraint dan mekanisme refill; latihan krisis dan transparansi metodologi penting sebelum klaim kesiapan."
 ]:[
  "Import resilience: Hormuz disruption or delayed tankers can affect refined fuel, LPG and refinery feedstock; verify import origin and delivery times rather than inferring supply outages from headlines.",
  "Fiscal transmission: expensive imports and FX shocks can increase fuel price and subsidy/compensation pressure; stocks protect supply continuity but cannot guarantee stable market prices.",
  "Storage capacity: the March 2026 government statement cited a fuel storage ceiling of about 25 days; tanks, terminals, inter-island connectivity and rotation standards require investment.",
  "CPE governance: DEN sets design/location decisions and ESDM manages implementation; every project needs evidence of procurement, filled volumes, release readiness and replenishment.",
  "Crisis operations: define drawdown triggers, critical-user allocation, demand restraint and stock replenishment, and test emergency-response plans before claiming readiness."
 ];
 for(const txt of points)list.append(make("li",null,txt));
 p.append(list);para(p,tr("Policy interpretation is SLI analysis, not a finding that a crisis is occurring or that the 2035 CPE target is funded or operational.","Analisis keterkaitan kebijakan adalah interpretasi SLI, bukan bukti krisis sedang berlangsung atau target CPE 2035 telah dibiayai maupun beroperasi."),"spr-caption");
 root.append(p);
}
function sourcesPanel(root,d){
 const panel=make("section","spr-section");panel.append(make("h3",null,tr("Source register and validation rules","Daftar sumber dan aturan validasi")));
 const list=make("ul","spr-source-list");
 for(const s of d.sources){
  const li=make("li");li.append(make("strong",null,s.publisher+" · "),external(s.url,s.title+" ↗"),make("span","spr-source-class"," "+s.type.replaceAll("_"," ")));list.append(li);
 }panel.append(list);
 const caveat=make("div","spr-caution");
 para(caveat,tr(
 "IEEFA's Figure 3 reproduces IEA figures at end-December 2025. The graphic labels countries but does not print precise values for each bar. Therefore all extracted values except New Zealand are approximate visual readings, not official exact IEA exports. New Zealand's 88 days and the importer-average 141 days are explicit in accompanying prose. Future replacement with the official IEA downloadable numeric dataset should take precedence if licensed and obtainable.",
 "Figure 3 IEEFA mengutip data IEA akhir Desember 2025. Grafik memuat nama negara tetapi tidak mencetak angka presisi tiap batang. Karena itu seluruh angka hasil pembacaan grafik selain Selandia Baru merupakan estimasi visual, bukan ekspor data IEA presisi. Angka 88 hari Selandia Baru dan rata-rata 141 hari disebut eksplisit dalam narasi. Jika kelak angka IEA resmi dapat diperoleh beserta hak pakainya, angka presisi itu harus menggantikan estimasi."));
 para(caveat,tr(
 "Missing values remain unknown (null): Indonesia's true IEA-method days of net-import cover, actual filled government strategic oil stocks, CPE stock days and CPE procurement progress. Policy targets are not operational achievements.",
 "Angka yang belum tersedia tetap null: hari cadangan Indonesia dengan rumus impor bersih IEA, stok strategis pemerintah yang benar-benar terisi, hari stok CPE serta kemajuan pengadaan CPE. Target kebijakan bukan realisasi operasional."));
 panel.append(caveat);root.append(panel);
}
function render(data){
 const root=document.getElementById(ID);if(!root||!data)return;
 root.replaceChildren();if(!Array.isArray(data.countries)||data.countries.length!==25||data.countries.filter(x=>x.code==="ID").length!==1){
  root.append(make("p","spr-caution",tr("Data validation failed; comparison withheld.","Validasi data gagal; perbandingan tidak ditampilkan.")));return;
 }
 header(root,data);tabs(root);
 if(tab==="benchmark")comparePanel(root,data);else if(tab==="policy")policyPanel(root,data);else sourcesPanel(root,data);
}
window.initSLIEnergySPR=async function(){
 const root=document.getElementById(ID);if(!root)return;
 if(cache){render(cache);return;}
 root.replaceChildren(make("p","spr-caption",tr("Loading dated energy-reserve evidence…","Memuat data cadangan energi bertanggal…")));
 try{const req=await fetch(DATA,{cache:"no-store"});if(!req.ok)throw Error("HTTP "+req.status);const d=await req.json();if(!d.iea_standard?.days||!d.indonesia?.operational_fuel_days_2025)throw Error("Invalid dataset");cache=d;render(cache);}
 catch(err){console.error("[SLI energy SPR]",err);root.replaceChildren(make("p","spr-caution",tr("Oil-reserve evidence dataset unavailable; other Energy modules are unaffected.","Dataset cadangan minyak belum tersedia; modul Energy lain tetap dapat digunakan.")));}
};
document.addEventListener("sli:languagechange",()=>{if(document.getElementById(ID)&&cache)render(cache);});
})();
