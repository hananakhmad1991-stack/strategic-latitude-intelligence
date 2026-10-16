/* SLI · Komdigi 2025 audited AI & Digital Infrastructure explorer.
 * 195-page original April 2026 publication. All metrics source page-labelled.
 * Explicit metric scope: national 2025 capacities ≠ compute/GPU power; 2029 forecast ≠ installed capacity.
 * Provinces are a ranked grid, not a polygon/GIS map without source-certified geometries.
 */
(function(){"use strict";
const DATA="data/komdigi-digital-infrastructure-2025.json";
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
const l=(en,id)=>window.SLIi18n?.language==="id"?id:en;
const fmt=(v,n=2)=>v===null||v===undefined?"—":Number(v).toLocaleString("en-US",{maximumFractionDigits:n});
const label=(en,id)=>l(en,id);
const opt=(values,chosen)=>{const s=el("select","kd25-select");for(const [val,name] of values){const o=el("option",null,name);o.value=val;s.append(o)}if(chosen)s.value=chosen;return s};
const p=(text,cls="kd25-note")=>el("p",cls,text);
const meta=(text,page)=>{const item=el("div","kd25-provenance");item.append(el("span",null,"KOMDIGI 2025 · PDF p. "+page+" · "),el("span",null,text));return item};
const card=(title,value,unit,note,page)=>{const n=el("article","kd25-kpi");n.append(el("small",null,title),el("strong",null,fmt(value)+(unit?" "+unit:"")),p(note,"kd25-kpi-note"));if(page)n.append(meta("Official annual performance report",page));return n};
function grid(root,entries){const g=el("div","kd25-grid");for(const entry of entries)g.append(entry);root.append(g);return g}
function barPanel(root,rows,{unit="",max=null,maxBars=50,decimals=2,ascending=false}={}){
 root.replaceChildren();
 const subset=rows.slice(0,maxBars),peak=max??Math.max(1,...subset.map(x=>x.value??0));
 const frag=document.createDocumentFragment();
 for(const x of subset){
  const row=el("div","kd25-bar-row"),head=el("div","kd25-bar-head"),name=el("span",null,x.name),val=el("strong",null,(x.value==null?"Not reported":fmt(x.value,decimals))+(x.value==null?"":" "+unit));
  head.append(name,val);
  const track=el("div","kd25-track"),fill=el("div","kd25-fill");
  fill.style.width=(x.value==null?0:Math.max(.3,Math.min(100,100*x.value/peak)))+"%";
  if(ascending)fill.classList.add("kd25-soft");
  track.append(fill);row.append(head,track);frag.append(row);
 }
 root.append(frag);
}
function table(root,headers,rows){
 root.replaceChildren();const outer=el("div","kd25-scroll"),t=el("table","kd25-table"),hd=el("thead"),header=el("tr");
 headers.forEach(x=>header.append(el("th",null,x)));hd.append(header);t.append(hd);const body=el("tbody");
 for(const vals of rows){const row=el("tr");for(const v of vals)row.append(el("td",null,v===null?"—":String(v)));body.append(row)}t.append(body);outer.append(t);root.append(outer);
}
function overview(root,d){
 root.append(el("h3",null,l("Indonesia Digital · evidence snapshot","Indonesia Digital · ringkasan berbasis bukti")));
 const m=new Map(d.metrics.map(x=>[x.id,x]));
 grid(root,[
  card("Data center · reported 2025",370,"MW",l("National capacity ≠ AI/GPU installed capacity.","Kapasitas nasional ≠ kapasitas AI/GPU."),107),
  card("4G population coverage",98.95,"%",l("Q2 2025 mobile operator reported coverage.","Jangkauan operator seluler Triwulan II 2025."),104),
  card("5G population coverage",13.11,"%",l("Operator reported; denominator population.","Menurut operator; penyebut jumlah penduduk."),104),
  card("PDNS tenants",404,"of 730",l("Institutions using government interim cloud.","Instansi yang menggunakan PDNS."),110),
  card("SATRIA-1 IP transit",93,"Gbps",l("Provisioned IP transit, not actual traffic.","IP transit tersedia, bukan trafik aktual."),160),
  card("Public access locations",31394,"locations",l("Nine public service facility sectors.","Sembilan sektor fasilitas publik."),157)
 ]);
 root.append(p(l("Government reported around 370 MW of national data-center capacity in 2025; the 1,410 MW number mentioned elsewhere in the report is a 2029 demand projection, not another 2025 capacity figure. The figures cannot be added or treated as installed AI compute.",
 "Kapasitas pusat data nasional dilaporkan sekitar 370 MW pada 2025. Angka 1.410 MW dalam laporan adalah proyeksi kebutuhan daya 2029, bukan kapasitas beroperasi 2025. Keduanya tidak boleh dijumlahkan atau dianggap kapasitas komputasi AI."),"kd25-warning"));
 root.append(el("h4",null,l("2024 Digital Transformation Index: four pillars","Indeks Transformasi Digital 2024: empat pilar")));
 const plot=el("div","kd25-chart");root.append(plot);
 barPanel(plot,d.collections.digital_pillars.map(x=>({name:x.pillar,value:x.value})),{unit:"/ 100",max:100});
 root.append(meta(l("ITDN 55.52 is measured for 2024, although compared with the ministry's 2025 target of 50.80. Do not publish as a measured 2025 ITDN score.","ITDN 55,52 adalah pengukuran 2024 meskipun dibandingkan dengan target kementerian 2025 sebesar 50,80."),103));
}
function network(root,d){
 const m=new Map(d.metrics.map(x=>[x.id,x]));
 root.append(el("h3",null,l("Mobile coverage · three distinct denominators","Jangkauan seluler · tiga penyebut berbeda")));
 const controls=el("div","kd25-controls"),type=opt([["population",l("Population coverage","Cakupan penduduk")],["settlement",l("Residential area","Luas pemukiman")],["land",l("National land area","Luas wilayah nasional")]]),chart=el("div","kd25-chart");
 controls.append(el("label",null,l("Measure","Indikator")),type);root.append(controls,chart);
 const defs={population:[98.95,13.11,104,"Persons covered, not signal quality"],settlement:[99.23,6.33,104,"Residential km² covered; different from whole land area"],land:[53.82,.28,104,"Whole territory km²; not population"]};
 function draw(){const [a,b,page,note]=defs[type.value];barPanel(chart,[{name:"4G",value:a},{name:"5G",value:b}],{unit:"%",max:100});chart.append(meta(note,page))}
 type.addEventListener("change",draw);draw();
 root.append(el("h4",null,l("Sampled broadband speeds · 2025","Kecepatan broadband hasil pengukuran · 2025")));
 grid(root,[card("Fixed download",51.84,"Mbps","20-city sample · target 37 Mbps",106),
            card("Mobile download",63.51,"Mbps","35 province-capital sample · target 50 Mbps",107),
            card("Fiber-connected kecamatan",5253,"of 7,285","72.12% reached",106)]);
 root.append(el("h4",null,l("Operating BTS in remote 3T areas · macro regions","BTS aktif kawasan 3T · wilayah besar")));
 const bselect=opt([["active","Active 4G + USO"],["4g","BTS 4G"],["uso","USO on-air"],["terminated","USO terminated (excluded)"]],"active"),bchart=el("div","kd25-chart");
 root.append(bselect,bchart);
 const bmap={active:"active","4g":"bts4g",uso:"uso_onair",terminated:"uso_terminated"};
 function bdraw(){barPanel(bchart,d.collections.bts.map(x=>({name:x.region,value:bselect.value==="4g"?x.bts4g_bapl+x.bts4g_nonbapl:x[bmap[bselect.value]]})).sort((a,b)=>b.value-a.value),{unit:"BTS sites",decimals:0});bchart.append(meta(l("Broad regions from Figure 3.6; counts are NOT provincial geocoded towers.","Wilayah besar dari Gambar 3.6; jumlah ini BUKAN titik koordinat menara per provinsi."),108))}
 bselect.addEventListener("change",bdraw);bdraw();
 root.append(meta("FO subsea 131,236.93 km · FO inland 1,021,520.55 km. These are network-route lengths, not a count of reached villages.",105));
}
function cloud(root,d){
 root.append(el("h3",null,l("Data centers, national cloud and PDNS","Pusat data, cloud nasional dan PDNS")));
 grid(root,[
 card("Data center industry · 2025",370,"MW","~1.3 W per person; not dedicated AI/GPU capacity",107),
 card("Data-center power demand · 2029 outlook",1410,"MW","Projection cited from earlier strategy, NOT installed MW",21),
 card("PDNS connected institutions",404,"of 730","55.34% connected and using PDNS",110),
 card("PDN-1 building completion",100,"%","Construction March 2025; migration phased 2025–2028",110)
 ]);
 root.append(el("h4",null,l("PDNS capacity by institutional type · 2025","Kapasitas PDNS menurut jenis instansi · 2025")));
 const options=opt([["vcpu","Virtual CPUs (vCPU)"],["storage_gb","Storage (GB)"],["ram_source_unit","RAM (original table units)"],["institutions","Institutions"]],"vcpu"),chart=el("div","kd25-chart"),t=el("div");
 root.append(options,chart,t);
 function draw(){const unit={vcpu:"vCPU",storage_gb:"GB",ram_source_unit:"source units",institutions:"institutions"}[options.value];
  barPanel(chart,d.collections.pdns.map(x=>({name:x.group,value:x[options.value]})),{unit,decimals:0});
  table(t,["Type","Institutions","vCPU","RAM · source units","Storage GB"],d.collections.pdns.map(x=>[x.group,fmt(x.institutions,0),fmt(x.vcpu,0),fmt(x.ram_source_unit,0),fmt(x.storage_gb,0)]));
 }
 options.addEventListener("change",draw);draw();
 root.append(p(l("Source reconciliation warning: PDNS RAM rows add to 171,774 but the printed total is 171,773; storage rows total 18,337,876 GB while the printed total says 18,337,877 GB. Both totals remain unchanged in the machine-readable source.",
 "Catatan audit: jumlah RAM per baris adalah 171.774 tetapi total tercetak 171.773; jumlah storage per baris 18.337.876 GB sedangkan total tercetak 18.337.877 GB. Angka sumber dipertahankan tanpa koreksi diam-diam."),"kd25-warning"));
 const milestones=el("div","kd25-timeline");for(const [date,title,info] of [["2025-03","PDN-1 · construction complete","100% building construction"],["2025–2028","PDNS → PDN-1","Six-stage migration PLAN, not completed"],["2025","PDN-1 · security and resilience","ISO/IEC 27001:2022 reportedly certified, BSSN ITSA conducted, Ministry of Finance DRC designated"]]){const node=el("article","kd25-timeline-entry");node.append(el("small",null,date),el("strong",null,title),p(info));milestones.append(node)}
 root.append(el("h4",null,l("Reported milestones, not current operations","Milestone yang dilaporkan, bukan status live")),milestones);
 root.append(meta("Official PDN-1 and PDNS source; incident SLA 98.18% in December 2025; 91% target.",110));
}
function backbone(root,d){
 root.append(el("h3",null,l("Satellite gateways and national backbone","Gateway satelit dan backbone nasional")));
 grid(root,[card("SATRIA-1 IP HUB",150,"Gbps","11 gateway design/IP hub capacity",160),
           card("Provisioned IP transit",93,"Gbps","Available transit across 11 gateways",160),
           card("Spot beams",116,"beams","Coverage sectors, not separate satellites",160),
           card("Palapa Ring",12229,"km","Three network packages · 57 service cities",159)]);
 const select=opt([["hub_gbps","IP HUB capacity (Gbps)"],["transit_gbps","Available IP transit (Gbps)"],["ratio","Transit / hub capacity (%)"]]),plot=el("div","kd25-chart");
 root.append(el("h4",null,l("SATRIA-1 · eleven gateways","SATRIA-1 · sebelas gateway")),select,plot);
 function draw(){let kind=select.value;barPanel(plot,d.collections.gateways.map(x=>({name:x.name,value:kind==="ratio"?100*x.transit_gbps/x.hub_gbps:x[kind]})).sort((a,b)=>b.value-a.value),{unit:kind==="ratio"?"%":"Gbps",max:kind==="ratio"?100:null});plot.append(meta(l("City names are source-labelled gateway locations; exact geodetic coordinates are NOT published.","Nama kota merupakan lokasi gateway yang disebut sumber; koordinat geodetik TIDAK tercantum."),160))}
 select.addEventListener("change",draw);draw();
 root.append(el("h4",null,l("Palapa Ring · utilization versus total capacity","Palapa Ring · utilisasi terhadap kapasitas")));
 const networkPlot=el("div","kd25-chart");root.append(networkPlot);
 barPanel(networkPlot,d.collections.palapa.map(x=>({name:x.segment+(x.medium==="microwave"?" · microwave":" · fiber"),value:x.utilization_percent})),{unit:"%",max:100});
 root.append(meta("East microwave source capacity 5,500 Mbps = 5.5 Gbps; 2025 reported SLA 100% on four links. Published nationwide average 54.39% is NOT the four-link simple average.",159));
 root.append(el("h4",null,l("Public internet access · 31,394 sites","Akses internet layanan publik · 31.394 lokasi")));
 const a=el("div","kd25-chart");root.append(a);
 barPanel(a,d.collections.public_access_sites.map(x=>({name:x.category,value:x.locations})).sort((x,y)=>y.value-x.value),{unit:"locations",decimals:0});
 root.append(meta("Exact category totals reconcile to 31,394 public-service sites in source Table 3.24.",157));
}
function regional(root,d){
 root.append(el("h3",null,l("Province-linked government data exchange · SPLP","Pertukaran data antarpemerintah per wilayah provinsi · SPLP")));
 grid(root,[card("SPLP connected IPPD",442,"of 730","60.55% connected nationally · includes central and regional bodies",161),
 card("Daily active exchange",37,"of 730","5.07% of institutions actively exchanging data",161),
 card("Local governments · source headline",378,"of 546","38-province figure headline; differs from visible province label sum",161)]);
 root.append(p(l("Select a province to inspect source fractions. Each numerator / denominator combines province, regency and city governments associated with that province. This is a ranked geographic matrix, NOT an exact GIS administrative polygon or counts of data centers.",
 "Pilih provinsi untuk melihat proporsi pada sumber. Pembilang dan penyebut mencakup pemerintah provinsi, kabupaten, dan kota di wilayah tersebut. Ini matriks geografis, BUKAN polygon GIS atau jumlah data center."),"kd25-note"));
 const toolbar=el("div","kd25-controls"),q=el("input","kd25-filter");q.type="search";q.placeholder=l("Search province…","Cari provinsi…");q.setAttribute("aria-label","Filter provincial government SPLP data");const sort=opt([["coverage","Highest coverage"],["volume","Most connected"],["name","Province A–Z"],["gap","Lowest coverage"]]);
 toolbar.append(q,sort);root.append(toolbar);
 const selected=el("div","kd25-inspector"),matrix=el("div","kd25-provinces"),tableView=el("div");
 root.append(selected,matrix,tableView);
 function inspector(x){selected.replaceChildren();if(!x)return;selected.append(el("strong",null,x.province+" · "+x.connected+" / "+x.total+" · "+fmt(x.percent,1)+"%"),p(l("Reported geographic grouping; no verified polygon or municipality-level coordinates.","Pengelompokan wilayah sumber; tidak ada geometri/polygon atau titik kabupaten/kota terverifikasi.")))}
 function draw(){
  let v=d.collections.splp_provinces.filter(x=>x.province.toLowerCase().includes(q.value.toLowerCase()));
  v.sort((a,b)=>sort.value==="coverage"?b.percent-a.percent:sort.value==="gap"?a.percent-b.percent:sort.value==="volume"?b.connected-a.connected:a.province.localeCompare(b.province));
  matrix.replaceChildren();for(const x of v){const b=el("button","kd25-province"),h=el("span",null,x.province),num=el("strong",null,fmt(x.percent,0)+"%"),track=el("div","kd25-track"),fill=el("div","kd25-fill");
  b.type="button";b.title=x.connected+" of "+x.total+" local administrations";fill.style.width=fmt(x.percent,3)+"%";track.append(fill);b.append(h,num,track);b.addEventListener("click",()=>inspector(x));matrix.append(b)}
  table(tableView,["Province","Connected","Eligible","Percentage"],v.map(x=>[x.province,x.connected,x.total,fmt(x.percent,1)+"%"]));
 }
 q.addEventListener("input",draw);sort.addEventListener("change",draw);draw();inspector(d.collections.splp_provinces[0]);
 root.append(p(l("IMPORTANT source discrepancy: the 38 printed province labels sum to 371/542, but the Figure 3.25 headline reports 378/546. The two disclosures are preserved, not silently reconciled.",
 "PERBEDAAN SUMBER: jumlah 38 label provinsi adalah 371/542, tetapi judul Gambar 3.25 menyebut 378/546. Keduanya dipertahankan, tidak direkonsiliasi diam-diam."),"kd25-warning"));
 root.append(meta(l("One regional aggregate for each of Indonesia's 38 provinces; source Figure 3.25.","Satu agregat untuk masing-masing 38 provinsi, Gambar 3.25."),161));
}
function digital(root,d){
 root.append(el("h3",null,l("Government digital services & the technology economy","Layanan pemerintah digital dan ekonomi teknologi")));
 grid(root,[card("Average app SLA",99.439,"%","Reported service reliability across government application lines",109),
 card("Digital government · connected",442,"of 730","SPLP registrations/connection, not active transactions",161),
 card("Startup contribution",289.5,"IDR bn","Reported intervention attribution, not verified venture capital",113),
 card("Games market forecast",32.7,"IDR tn","2025 industry projection, not realized government receipts",163)]);
 root.append(el("h4",null,l("Application uptime / SLA · 2025","SLA keandalan aplikasi pemerintah · 2025")));
 const chart=el("div","kd25-chart");root.append(chart);
 const apps=d.collections.app_sla.map(x=>({name:x.name,value:x.sla_percent}));
 barPanel(chart,apps.slice().sort((a,b)=>b.value-a.value),{unit:"%",max:100});
 const serviceTable=el("div");root.append(serviceTable);
 table(serviceTable,["Application","2025 SLA","PDF"],apps.map(x=>[x.name,fmt(x.value,3)+"%","109"]));
 root.append(el("h4",null,l("Performance agreements · target vs realization","Perjanjian kinerja · target vs realisasi")));
 const kpiTable=el("div");root.append(kpiTable);
 table(kpiTable,["Indicator","Target","Realization","Observation year","Caveat"],d.collections.strategic_performance.map(x=>[x.label,fmt(x.target,3),fmt(x.realized,3),x.observation_year,x.note]));
 root.append(p(l("The National Digital Transformation Index (ITDN) and Bureaucratic Reform Index compared against 2025 targets use 2024 measurements (marked * in the report). None should be described as a newly observed 2025 score.",
 "Indeks Transformasi Digital Nasional dan Indeks Reformasi Birokrasi yang dibandingkan dengan target 2025 menggunakan data ukur 2024 (ditandai * dalam laporan). Jangan tulis sebagai nilai terukur 2025."),"kd25-warning"));
 root.append(el("h4",null,l("AI policy and technology implementation","Kebijakan AI dan penerapan teknologi")));
 const notes=el("div","kd25-timeline");
 for(const [tag,title,detail] of [["2026 drafting programme","National AI roadmap Presidential Regulation draft","Included in 2026 drafting programme under Keppres 38/2025; not enacted according to this report, page 115."],["2025 regional innovation","Garuda Spark Innovation Hub","Operational in Jakarta, Bandung and Medan, source page 115."],["2025 IoT agricultural pilots","Sragen smart agriculture","Reported melon yield +33%, rice/corn +5.3% in source field trials; not generalized nationwide, page 115."],["2025 fisheries pilot","Sukabumi microbubble aerator","Reported monthly electricity cost reduction averaging 73.5% compared with conventional paddlewheels; local use case, page 115."]]){const n=el("article","kd25-timeline-entry");n.append(el("small",null,tag),el("strong",null,title),p(detail));notes.append(n)}root.append(notes);
}
function catalogue(root,d){
 root.append(el("h3",null,l("Digitized source catalogue · 195-page official report","Katalog data terverifikasi · laporan resmi 195 halaman")));
 const q=el("input","kd25-filter");q.type="search";q.placeholder=l("Filter indicator or source page…","Saring indikator atau halaman sumber…");
 const counter=p(""),tbl=el("div");
 root.append(q,counter,tbl);
 function draw(){const search=q.value.toLowerCase().trim();const rows=d.metrics.filter(x=>[x.id,x.label,x.unit,x.pdf_page,x.basis,x.note].join(" ").toLowerCase().includes(search));
 counter.textContent=rows.length+" / "+d.metrics.length+" source-labelled metrics";
 table(tbl,["Metric","Value","Unit","Period","PDF page","Definition"],rows.map(x=>[x.label,fmt(x.value,3),x.unit,x.period,x.pdf_page,x.basis+(x.note?" · "+x.note:"")]));
 }
 q.addEventListener("input",draw);draw();
 root.append(el("h4",null,l("Methodological caveats","Catatan metodologi")));
 const ul=el("ul","kd25-methodology");d.caveats.forEach(x=>ul.append(el("li",null,x)));root.append(ul);
 const source=el("a","kd25-source-link",l("Official Komdigi report, 2025 (PDF) ↗","Laporan resmi Komdigi 2025 (PDF) ↗"));source.href=d.source_pdf_url;source.target="_blank";source.rel="noopener noreferrer";
 root.append(source,meta("Document issued 13 April 2026 · published by PPID 22 April 2026. Historical 2025 baselines are not automatically revised.",1));
}
function render(root,d){
 root.replaceChildren();if(d?.id!=="komdigi-2025-digital-infrastructure")throw Error("Invalid Komdigi evidence");
 const head=el("div","kd25-header");head.append(el("span","kd25-kicker","KOMDIGI PERFORMANCE REPORT · 2025"),el("h2",null,l("Digital Infrastructure & Technology Evidence","Data Infrastruktur Digital dan Teknologi")),p(l("Official connectivity, data-center, cloud, satellite, 38-province interoperability and public digital service intelligence. Verified report-vintage data, not real-time telemetry.",
 "Konektivitas, pusat data, cloud, satelit, interoperabilitas 38 provinsi dan layanan digital. Data tahunan bersumber, bukan pemantauan real-time.")));
 root.append(head);
 const tabs=[["overview","Overview","Ringkasan"],["network","4G / 5G & BTS","4G / 5G & BTS"],["cloud","Data Center & PDNS","Pusat Data & PDNS"],["backbone","SATRIA & Fiber","SATRIA & Fiber"],["regional","38 Provinces · SPLP","38 Provinsi · SPLP"],["digital","Digital Economy & AI","Ekonomi Digital & AI"],["catalogue","Source Data","Data Sumber"]];
 const nav=el("div","kd25-tablist");nav.setAttribute("role","tablist");const panel=el("div","kd25-panel");panel.id="kd25VisiblePanel";panel.setAttribute("role","tabpanel");
 const buttons=[];for(const [id,en,indo]of tabs){const btn=el("button","kd25-tab",l(en,indo));btn.type="button";btn.dataset.tab=id;btn.setAttribute("role","tab");nav.append(btn);buttons.push(btn);btn.addEventListener("click",()=>show(id))}
 root.append(nav,panel);
 function show(active){
  buttons.forEach(b=>{const on=b.dataset.tab===active;b.setAttribute("aria-selected",String(on));b.classList.toggle("is-active",on)});
  panel.replaceChildren();
  ({overview,network,cloud,backbone,regional,digital,catalogue})[active](panel,d);
 }
 show("overview");root.append(p(l("Source: Laporan Kinerja Kementerian Komunikasi dan Digital 2025, 195 pages, ePPID publication 22 April 2026. Page references appear in every chart and table.",
 "Sumber: Laporan Kinerja Kementerian Komunikasi dan Digital 2025, 195 halaman, dipublikasikan melalui ePPID pada 22 April 2026. Referensi halaman terdapat di grafik/tabel."),"kd25-footer"));
}
async function init(host){
 const root=typeof host==="string"?document.getElementById(host):host;if(!root)return;
 if(root.dataset.kd25Mounted==="true")return;root.dataset.kd25Mounted="true";
 const placeholder=p(l("Loading official Komdigi digital infrastructure statistics…","Memuat data infrastruktur digital resmi Komdigi…"));root.append(placeholder);
 try{const r=await fetch(DATA,{cache:"no-store"});if(!r.ok)throw Error("Data unavailable");const data=await r.json();
 if(!root.isConnected)return;render(root,data)}
 catch(err){console.error("[SLI Komdigi 2025]",err);placeholder.textContent=l("The source chart module could not load. Please try refreshing the dashboard.","Modul data sumber belum dapat dimuat. Silakan muat ulang dashboard.");root.dataset.kd25Mounted="false"}
}
window.initSLIKomdigi2025=init;
})();