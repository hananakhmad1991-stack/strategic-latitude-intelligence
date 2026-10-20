/* SLI Food & Agriculture Intelligence.
 * Dated public source data only. 63 source tables; no invented live values.
 * Clickable inspectors, comparable series, and SLI universal export providers.
 */
(()=>{"use strict";
const $=id=>document.getElementById(id),en=()=>document.documentElement.lang==="en",t=(a,b)=>en()?a:b;
const pdfPage=(source,page)=>source+"#page="+page;
const el=(tag,text,className)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);if(className)x.className=className;return x};
const integer=x=>x==null?"—":Number(x).toLocaleString(en()?"en-US":"id-ID",{maximumFractionDigits:1});
const decimal=(x,d=2)=>x==null?"—":Number(x).toLocaleString(en()?"en-US":"id-ID",{minimumFractionDigits:d,maximumFractionDigits:d});
const USD=x=>x==null?"—":"US$"+decimal(x/1e6,2)+" "+t("billion","miliar");
const rowSource=(db,table)=>pdfPage(db.publication.pdf,db.tables.find(z=>z.number===table)?.pdfPage||15);
const sections=[
 {name:"Koordinasi nasional",nameEn:"National coordination",nodes:[
  {id:"kemenkopangan",name:"Kemenko Bidang Pangan",en:"Coordinating Ministry for Food",role:"Sinkronisasi lintas kementerian, kebijakan tata niaga dan distribusi pangan serta penyelesaian hambatan antar-kementerian. Bukan pemberi izin seluruh subsektor.",roleEn:"Inter-ministerial food policy coordination, trade/distribution policy and dispute resolution. Not the licensing authority for every subsector.",link:"https://www.kemenkopangan.go.id/tugas-fungsi",tag:"Koordinator",tagEn:"Coordinator"},
  {id:"bapanas",name:"Badan Pangan Nasional",en:"National Food Agency",role:"Ketersediaan pangan, stabilisasi pasokan dan harga, cadangan pangan pemerintah, kerawanan pangan, diversifikasi dan keamanan pangan dalam lingkup tugasnya.",roleEn:"Food availability, price/supply stabilization, government reserves, insecurity, diversification and food-safety mandates.",link:"https://badanpangan.go.id/wiki/tugas-fungsi",tag:"Otoritas pangan",tagEn:"Food agency"}]},
 {name:"Pelaksana kebijakan sektoral",nameEn:"Technical implementation",nodes:[
  {id:"kementan",name:"Kementerian Pertanian",en:"Ministry of Agriculture",role:"Budidaya dan produksi tanaman pangan, hortikultura, perkebunan, peternakan, sarana/prasarana, penyuluhan dan modernisasi. Struktur mengikuti ketentuan organisasi terkini.",roleEn:"Agricultural production, crops, horticulture, plantations, livestock, infrastructure, extension and modernization, under current organizational rules.",link:"https://pertanian.go.id/index.php/page/view/7?lang=id",tag:"Teknis sektor",tagEn:"Technical"},
  {id:"pusdatin",name:"Pusdatin Kementan",en:"Ministry of Agriculture Data Center",role:"Kompilasi dan penerbitan Statistik Terkini Ekonomi Pertanian. Angka perdagangan berasal dari BPS dan data lain dari instansi asal; bukan seluruhnya hasil survei sendiri.",roleEn:"Compiles and publishes agricultural statistics, including BPS trade and third-party indicators; not the original collector for all series.",link:"https://satudata.pertanian.go.id/",tag:"Penerbit data",tagEn:"Data publisher"},
  {id:"kemendag",name:"Kementerian Perdagangan",en:"Ministry of Trade",role:"Instrumen tata niaga, kebijakan perdagangan dalam lingkup kewenangan, informasi harga dan koordinasi ekspor/impor.",roleEn:"Trade policy, market administration, price intelligence and import/export policy within its competence.",link:"https://www.kemendag.go.id/",tag:"Perdagangan",tagEn:"Trade"},
  {id:"pemda",name:"Pemerintah Daerah / Dinas Pertanian",en:"Regional Governments / Agricultural Offices",role:"Program, penyuluhan, pendataan, fasilitasi infrastruktur dan pengawasan lapangan sesuai pembagian kewenangan pusat-daerah; bukan unit bawahan Pusdatin.",roleEn:"Regionally mandated programmes, extension, local statistics, facilities and field oversight. Not a Pusdatin subordinate unit.",link:"https://www.kemendagri.go.id/",tag:"Pelaksana daerah",tagEn:"Regional execution"}]},
 {name:"Layanan publik dan statistik",nameEn:"Public services and statistical evidence",nodes:[
  {id:"bps",name:"Badan Pusat Statistik",en:"Statistics Indonesia (BPS)",role:"Statistik resmi NTP, IHK, inflasi dan ekspor-impor; metodologi dan angka asli ditelusuri ke publikasi BPS.",roleEn:"Official NTP, consumer prices/inflation and foreign trade statistics; original surveys and classifications belong to BPS.",link:"https://www.bps.go.id/",tag:"Statistik",tagEn:"Statistics"},
  {id:"bgn",name:"Badan Gizi Nasional",en:"National Nutrition Agency",role:"Pelaksanaan program gizi publik; perlu dibedakan dari fungsi perdagangan dan produksi pertanian.",roleEn:"Public nutrition service programmes, distinct from agricultural production and commodity trade policy.",link:"https://www.bgn.go.id/",tag:"Layanan gizi",tagEn:"Nutrition service"},
  {id:"bi",name:"Bank Indonesia",en:"Bank Indonesia",role:"Sumber kurs rupiah dan beberapa indikator pasar yang memengaruhi nilai konversi serta biaya impor. Bukan regulator produksi pangan.",roleEn:"Exchange-rate reference and financial conditions relevant to import costs, not agricultural-production supervision.",link:"https://www.bi.go.id/",tag:"Konteks moneter",tagEn:"Monetary context"}]},
 {name:"Operator & rantai pasok",nameEn:"Operators and food supply chains",nodes:[
  {id:"bulog",name:"Perum BULOG",en:"BULOG",role:"Operator BUMN pengadaan/penyaluran komoditas tertentu dan cadangan pangan pemerintah berdasarkan penugasan; bukan kementerian pembuat seluruh kebijakan pangan.",roleEn:"State enterprise implementing designated procurement, distribution and food-reserve tasks; not an all-sector regulator.",link:"https://www.bulog.co.id/",tag:"Operator BUMN",tagEn:"SOE operator"},
  {id:"pupuk",name:"Pupuk Indonesia",en:"Pupuk Indonesia",role:"Holding industri pupuk nasional dan rantai pasok input pertanian. Operasi perusahaan perlu dibedakan dari regulator subsidi dan penetapan kuota.",roleEn:"Fertilizer industrial and input supply group. Corporate operations are distinct from subsidy and quota policy authority.",link:"https://www.pupuk-indonesia.com/",tag:"Input pertanian",tagEn:"Farm inputs"},
  {id:"idfood",name:"ID FOOD",en:"ID FOOD",role:"Kelompok BUMN pangan pada mata rantai produksi, pengolahan dan distribusi; tidak otomatis menjadi regulator harga nasional.",roleEn:"Food SOE group in production, processing and distribution; not automatically the national price regulator.",link:"https://www.idfood.co.id/",tag:"BUMN pangan",tagEn:"Food SOE"}]}
];
let data,leadership=null,farmerMetric="ntp",selectedProvince=11,priceCommodity=0,selectedPlace=11,tradeScope="Segar + olahan",institutionId="kemenkopangan";
const node=()=>sections.flatMap(g=>g.nodes).find(x=>x.id===institutionId);
function titleLocalized(){document.querySelectorAll("[data-en][data-id]").forEach(x=>{x.textContent=en()?x.dataset.en:x.dataset.id});}
function anchor(href,text){const x=el("a",text);x.href=href;x.target="_blank";x.rel="noopener noreferrer";return x;}
function detailLine(parent,key,val){const d=el("dt",key),v=el("dd",val);parent.append(d,v)}
function kpi(text,value,period){const box=el("article",undefined,"fa-kpi"),h=el("small",text),v=el("strong",value),f=el("em",period);box.append(h,v,f);return box}
function findTrade(sector,scope,metric){return data.trade.find(x=>x.scope===scope&&x.sector===sector)?.[metric]??null}
function renderKpis(){
 const root=$("faKpis");root.replaceChildren();
 const all=data.trade.find(x=>x.scope==="Segar + olahan"&&x.sector==="Pertanian Total");
 const raw=findTrade("Pertanian Total","Segar","balance"),processed=findTrade("Pertanian Total","Olahan","balance");
 root.append(
  kpi(t("Agricultural trade surplus","Surplus perdagangan pertanian"),USD(all.balance),t("Jan–Apr 2026 · thousand US$ reported","Jan–Apr 2026 · sumber ribu USD")),
  kpi(t("Processed agricultural balance","Neraca pertanian olahan"),USD(processed),t("Jan–Apr 2026","Jan–Apr 2026")),
  kpi(t("Fresh agricultural balance","Neraca pertanian segar"),USD(raw),t("Jan–Apr 2026","Jan–Apr 2026")),
  kpi(t("Province coverage · NTP","Cakupan provinsi · NTP"),"38",t("May 2026 · 2018 index base","Mei 2026 · indeks 2018=100")));
 $("faReadMe").replaceChildren(
  el("p",t("Crop, horticulture, plantation and livestock trade are grouped using the publisher's BTKI 2022 HS scope. Fresh and processed commodities are distinct; agricultural trade is not the same as rice sufficiency.","Perdagangan tanaman pangan, hortikultura, perkebunan, dan peternakan dikelompokkan menurut cakupan kode HS BTKI 2022. Produk segar dan olahan dibedakan; neraca pertanian tidak sama dengan swasembada beras.")),
  el("p",t("Use filters, click chart bars and read the right-side evidence panel. All monetary balances below use the source unit 'thousand USD'; KPI scales are converted explicitly.","Gunakan filter, klik grafik, dan baca panel bukti di sebelah kanan. Nilai perdagangan pada tabel menggunakan 'ribu USD'; kartu KPI mengubah skalanya secara eksplisit.")));
 $("faFreshness").replaceChildren(
  el("p",t("The source is the Ministry's June 2026 publication (an exact release day is not specified). Trade stops in April, price and farmer indicators in May. The later published editions require separate numerical ingestion and revalidation.","Sumber adalah edisi Kementan Juni 2026 (tanggal rilis harian tidak disebutkan). Data perdagangan berhenti April, harga dan indeks petani pada Mei. Publikasi edisi berikutnya memerlukan impor angka dan validasi terpisah.")),
  anchor(data.publication.publisher_page,t("Publication record and PDF","Registri publikasi dan PDF")),
  el("p",t("Missing ≠ zero. A high NTP is not proof of household profitability; high producer prices do not establish farm income.","Data hilang ≠ nol. NTP tinggi bukan bukti laba rumah tangga; harga produsen tinggi tidak otomatis menaikkan pendapatan petani.")));
}
function buildBar(label,value,maxVal,onClick,selected,unit,negative){
 const b=el("button",undefined,"fa-bar");b.type="button";b.setAttribute("aria-pressed",selected?"true":"false");b.title=label+" · "+(value==null?"—":decimal(value,unit==="price"?0:2));
 const name=el("span",label,"fa-bar-name"),track=el("span",undefined,"fa-bar-track");
 const fill=el("span",undefined,"fa-bar-fill"+(negative?" negative":" good"));fill.style.width=value==null?"0%":Math.max(1,Math.abs(value)/maxVal*100).toFixed(2)+"%";track.append(fill);
 b.append(name,track,el("span",value==null?"—":(unit==="price"?"Rp "+integer(value):unit==="balance"?(value<0?"−":"+")+integer(Math.abs(value)):decimal(value)),"fa-bar-value"));
 b.addEventListener("click",onClick);return b;
}
function attachProvider(id,headers,rows){
 const host=$(id);
 const register=()=>window.SLIVisualExport?.register?.(host,{getData:()=>({headers,rows,kind:"publisher_series"})});
 if(!register())document.addEventListener("sli:exportready",register,{once:true});
}
function renderTrade(){
 const scope=$("faTradeScope").value;tradeScope=scope;
 const period=$("faTradeMonth").value;
 const rows=(period==="2026-01/2026-04"?data.trade:data.tradeMonthly).filter(x=>x.scope===scope&&(period==="2026-01/2026-04"||x.period===period));
 const plotted=rows.filter(x=>x.sector!=="Pertanian Total");
 const max=Math.max(...plotted.map(x=>Math.abs(x.balance)));
 const chart=$("faTradeChart");chart.replaceChildren();chart.classList.add("sli-bar-chart");
 plotted.forEach(item=>chart.append(buildBar(item.sector,item.balance,max,()=>{$("faTradeInsight").textContent=t("Trade balance","Neraca perdagangan")+" "+item.sector+": "+integer(item.balance)+" "+t("thousand US dollars","ribu USD")+". "+t("Foreign trade ≠ domestic production, and a positive sub-sector balance can coexist with food imports.","Perdagangan luar negeri ≠ produksi dalam negeri; surplus sub-sektor dapat terjadi bersamaan dengan impor pangan.");},false,"balance",item.balance<0)));
 chart.append(el("p",t("Source balances are shown, not an inferred net amount from rounded bars.","Ditampilkan neraca asli dari sumber, bukan hasil estimasi grafik."),"fa-axis-hint"));
 const tbody=$("faTradeTable").querySelector("tbody");tbody.replaceChildren();
 rows.forEach(item=>{const tr=el("tr");for(const [val,cls] of [[item.sector,""],[integer(item.export),""],[integer(item.import),""],[integer(item.balance),item.balance<0?"fa-negative":"fa-positive"]]){tr.append(el("td",val,cls))}tbody.append(tr)});
 const i=scope==="Segar + olahan"?1:scope==="Segar"?2:3;
 $("faTradeSource").href=rowSource(data,i);
 $("faTradeInsight").textContent=t("Period / Periode: ","Periode data: ")+period+". "+t("Select a bar to inspect its source value.","Klik batang untuk melihat angka bersumber.");
 attachProvider("faTradeChartCard",[t("Subsector","Sub-sektor"),t("Export (thousand USD)","Ekspor (ribu USD)"),t("Import (thousand USD)","Impor (ribu USD)"),t("Balance (thousand USD)","Neraca (ribu USD)"),"Source"],rows.map(r=>[r.sector,r.export,r.import,r.balance,rowSource(data,i)+" · "+period]));
}
const ns="http://www.w3.org/2000/svg";
function svgNode(name,attrs={}){const p=document.createElementNS(ns,name);for(const [key,value] of Object.entries(attrs))p.setAttribute(key,String(value));return p}
function renderNationalTrend(){
 const groupIndex=Number($("faNationalGroup").value)||0;
 const metric=$("faNationalMetric").value==="ntup"?"ntup":"ntp";
 const item=data.nationalFarmerIndices.series[groupIndex];
 const vals=item[metric],dates=data.nationalFarmerIndices.periods;
 // The first observation May 2025 is eight calendar months before January 2026.
 const months=[0,8,9,10,11,12],m=70,M=720,top=28,bottom=248;
 const lo=Math.floor((Math.min(...vals)-3)/5)*5,hi=Math.ceil((Math.max(...vals)+3)/5)*5;
 const x=i=>m+months[i]/12*(M-m),y=v=>bottom-(v-lo)/(hi-lo)*(bottom-top);
 const area=$("faNationalTrend");area.replaceChildren();
 const svg=svgNode("svg",{viewBox:"0 0 780 295","aria-label":"NTP/NTUP "+item.name+" "+dates.join(", "),role:"img"});
 svg.classList.add("fa-national-svg");
 for(let t=0;t<=4;t++){
  const v=lo+(hi-lo)*t/4,yy=y(v);
  svg.append(svgNode("line",{x1:m,y1:yy,x2:M,y2:yy,stroke:"#36566b","stroke-width":"1"}));
  const label=svgNode("text",{x:m-10,y:yy+4,fill:"#b7cedb","font-size":"12","text-anchor":"end"});
  label.textContent=decimal(v,1);svg.append(label);
 }
 const curve=vals.map((v,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(v).toFixed(1)).join(" ");
 svg.append(svgNode("path",{d:curve,fill:"none",stroke:"#d7b678","stroke-width":"3","stroke-linejoin":"round"}));
 vals.forEach((v,i)=>{
  const cx=x(i),cy=y(v);
  const btn=svgNode("circle",{cx,cy,r:i===5?7:5,fill:i===5?"#f1d396":"#81c7ac",stroke:"#183449","stroke-width":"2",tabindex:"0",role:"button","aria-label":dates[i]+": "+decimal(v),style:"cursor:pointer"});
  const show=()=>{
   $("faNationalDetail").textContent=item.name+" · "+metric.toUpperCase()+" · "+dates[i]+": "+decimal(v)+". "+t("Published index 2018=100; not household income.","Indeks sumber 2018=100; bukan pendapatan rumah tangga.");
   svg.querySelectorAll("circle").forEach(n=>n.setAttribute("stroke-width","2"));btn.setAttribute("stroke-width","5");
  };
  btn.addEventListener("click",show);
  btn.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();show()}});
  svg.append(btn);
  const text=svgNode("text",{x:cx,y:bottom+27,fill:"#d4e1e9","text-anchor":"middle","font-size":"12"});
  text.textContent=["May 25","Jan 26","Feb 26","Mar 26","Apr 26","May 26"][i];svg.append(text);
 });
 area.append(svg);
 const last=vals.at(-1),earlier=vals.at(-2);
 $("faNationalDetail").textContent=item.name+" · "+metric.toUpperCase()+": "+decimal(last)+" ("+t("May 2026","Mei 2026")+"), "+t("monthly change","perubahan bulanan")+" "+(last-earlier>=0?"+":"")+decimal(last-earlier)+" "+t("index points","poin indeks")+". "+t("Click any chart point for a source-dated reading.","Klik titik grafik untuk melihat data bersumber.");
 $("faNationalSource").href=rowSource(data,item.table);
 attachProvider("faNationalTrendCard",["Reference period",item.name+" "+metric.toUpperCase()+" (2018=100)","Source"],dates.map((day,i)=>[day,vals[i],rowSource(data,item.table)]));
}

function farmerValues(){return farmerMetric==="ntup"?data.ntp.ntup:farmerMetric==="ntp_april"?data.ntp.april:data.ntp.may}
function renderFarmer(){
 const values=farmerValues();
 const pair=data.provinces.map((name,i)=>({name,value:values[i],i})).sort((a,b)=>b.value-a.value);
 const root=$("faFarmerChart");root.replaceChildren();root.classList.add("sli-bar-chart");
 const max=Math.max(...pair.map(x=>x.value));
 pair.forEach(item=>root.append(buildBar(item.name,item.value,max,()=>{selectedProvince=item.i;$("faFarmerProvince").value=String(item.i);renderFarmerDetail();renderFarmer()},item.i===selectedProvince,"index",false)));
 const m=farmerMetric==="ntup"?39:38;$("faFarmerSource").href=rowSource(data,m);
 renderFarmerDetail();
 attachProvider("faFarmerChartCard",["Province",farmerMetric.toUpperCase(),"Period","Source"],pair.map(v=>[v.name,v.value,farmerMetric==="ntp_april"?"2026-04":"2026-05",rowSource(data,m)]));
}
function renderFarmerDetail(){
 const name=data.provinces[selectedProvince],a=data.ntp.may[selectedProvince],b=data.ntp.april[selectedProvince],c=data.ntp.ntup[selectedProvince];
 const root=$("faFarmerDetail");root.replaceChildren(el("h3",name),el("div",decimal(farmerValues()[selectedProvince]),"fa-big"));
 const dl=el("dl");detailLine(dl,"NTP · Mei 2026",decimal(a));detailLine(dl,"NTP · Apr 2026",decimal(b));
 detailLine(dl,"NTUP · Mei 2026",decimal(c));detailLine(dl,t("MoM change (index points)","Perubahan bulanan (poin indeks)"),(a-b>=0?"+":"")+decimal(a-b));root.append(dl);
 root.append(el("p",t("NTP measures the ratio of prices received to prices paid; NTUP is a farm-business exchange index. Neither index directly measures net household profit.","NTP membandingkan indeks harga diterima dan dibayar petani; NTUP mengukur nilai tukar usaha pertanian. Keduanya bukan laba bersih rumah tangga.")));
 root.append(anchor(rowSource(data,38),t("NTP original table · page 57 ↗","Tabel NTP asli · halaman 57 ↗")));
}
function price(){return data.prices.items[priceCommodity]}
function renderPrices(){
 const item=price(),values=item.values;
 const pair=data.prices.places.map((name,i)=>({name,value:values[i],i})).sort((a,b)=>(b.value??-Infinity)-(a.value??-Infinity));
 const root=$("faPricesChart");root.replaceChildren();root.classList.add("sli-bar-chart");
 const max=Math.max(1,...pair.map(x=>x.value||0));
 pair.forEach(row=>root.append(buildBar(row.name,row.value,max,()=>{selectedPlace=row.i;$("faPricePlace").value=String(row.i);renderPrices()},row.i===selectedPlace,"price",false)));
 $("faPriceSource").href=rowSource(data,item.table);
 renderPriceDetail();
 attachProvider("faPricesChartCard",["Province/market","Price (Rp/kg)","Month","Publisher table"],pair.map(x=>[x.name,x.value,"2026-05",rowSource(data,item.table)]));
}
function renderPriceDetail(){
 const x=price(),v=x.values[selectedPlace];const root=$("faPriceDetail");root.replaceChildren(el("h3",data.prices.places[selectedPlace]),el("div",v==null?"—":"Rp "+integer(v),"fa-big"),el("p",x.name+" · "+t("May 2026, traditional markets","Mei 2026, pasar tradisional")));
 root.append(el("p",v==null?t("Not reported: this is NOT a price of zero.","Tidak tersedia dalam publikasi: BUKAN harga nol."):t("Descriptive reported retail price. Province labels and sampling methods may differ from newer official price-monitor feeds.","Harga eceran sebagaimana dilaporkan. Cakupan lokasi dan metodologinya dapat berbeda dari pemantauan harga resmi terbaru.")));
 root.append(anchor(rowSource(data,x.table),t("Inspect original price table ↗","Periksa tabel harga sumber ↗")));
}
function renderOrg(){
  if(window.SLIFoodGovernance&&typeof window.SLIFoodGovernance.render==="function"){window.SLIFoodGovernance.render();if(window.SLIFoodGovernanceHierarchy&&typeof window.SLIFoodGovernanceHierarchy.render==="function")window.SLIFoodGovernanceHierarchy.render();return}
 const root=$("faOrgGraph");root.replaceChildren();
 for(const group of sections){
  root.append(el("h4",en()?group.nameEn:group.name));
  const row=el("div",undefined,"fa-org-row");
  for(const item of group.nodes){
   const btn=el("button");btn.type="button";btn.setAttribute("data-active",String(item.id===institutionId));
   btn.append(el("strong",en()?item.en:item.name),el("small",en()?item.tagEn:item.tag));
   btn.addEventListener("click",()=>{institutionId=item.id;renderOrg()});row.append(btn);
  }
  root.append(row);
 }
 const profile=node(),out=$("faOrgDetail");out.replaceChildren(el("h3",en()?profile.en:profile.name),el("p",en()?profile.roleEn:profile.role));
 const dl=el("dl");detailLine(dl,t("Institution type","Jenis lembaga"),en()?profile.tagEn:profile.tag);
 detailLine(dl,t("Evidence status","Status bukti"),t("Official institutional mandate","Mandat kelembagaan resmi"));out.append(dl);
 if(profile.id==="bapanas"||profile.id==="kementan"){
  const office=leadership?.appointments?.find(a=>a.institution_id===profile.id);
  const valid=office&&office.person&&office.sources?.some(src=>src.type==="official_dated_press_release"&&src.url?.startsWith("https://"))&&office.last_official_confirmation;
  if(valid){
   out.append(el("h4",t("Official officeholder — source dated","Pejabat — bersumber dan bertanggal")));
   out.append(el("div",office.person,"fa-big fa-leader-name"));
   const who=el("dl");detailLine(who,t("Position","Jabatan"),en()?office.office_en:office.office);
   detailLine(who,t("Concurrent office","Jabatan rangkap"),en()?office.concurrent_role_en:office.concurrent_role);
   detailLine(who,t("Last confirmed by official source","Konfirmasi sumber resmi terakhir"),office.last_official_confirmation);
   if(office.instrument)detailLine(who,t("Appointment instrument","Dasar pengangkatan"),office.instrument);
   out.append(who,anchor(office.sources.find(x=>x.type==="official_head_profile")?.url||office.sources[0].url,t("Official officeholder profile ↗","Profil pejabat resmi ↗")));
   out.append(el("p",t("Leadership is a human-reviewed, source-dated registry—not live AI extraction. Check for later appointments before relying on this profile.","Nama pejabat berasal dari registri bertanggal yang telah ditinjau manusia, bukan hasil ekstraksi AI real-time. Periksa kemungkinan mutasi berikutnya.")));
  }else out.append(el("p",t("The current officeholder has not been verified against primary sources. No name is displayed.","Pejabat saat ini belum diverifikasi dengan sumber primer. Nama tidak ditampilkan.")));
 }
 out.append(anchor(profile.link,t("Open primary institutional source ↗","Buka sumber kelembagaan primer ↗")));
 out.append(el("p",t("Functional association is not an official reporting hierarchy. Verify statutory organisation changes through JDIH before decisions.","Hubungan tugas di peta bukan hierarki laporan yang sah secara otomatis. Perubahan organisasi wajib dicek melalui JDIH.")));
}
function assessments(){
 const all=data.trade.find(x=>x.sector==="Pertanian Total"&&x.scope==="Segar + olahan");
 const crops=data.trade.find(x=>x.sector==="Tanaman Pangan"&&x.scope==="Segar + olahan");
 const estate=data.trade.find(x=>x.sector==="Perkebunan"&&x.scope==="Segar + olahan");
 const ntp=data.ntp.may;
 const under100=ntp.filter(x=>x<100).length;
 const assessment=[
 [t("Agricultural surplus masks crop dependency","Surplus pertanian menutupi defisit tanaman pangan"),t("The Jan–Apr 2026 total trade balance is positive at "+USD(all.balance)+", but food-crop trade is negative at "+USD(Math.abs(crops.balance))+". A single aggregate surplus should never be used as a self-sufficiency claim.","Neraca pertanian Januari–April 2026 positif "+USD(all.balance)+", tetapi neraca tanaman pangan defisit "+USD(Math.abs(crops.balance))+". Surplus total tidak boleh disamakan dengan swasembada pangan.")],
 [t("Plantation exports dominate the net picture","Perkebunan menjadi penopang neraca"),t("Plantation trade posted a surplus of "+USD(estate.balance)+"; dependency and resilience analysis should separate palm, coffee, cocoa and other plantation chains rather than treat them as staple foods.","Perkebunan mencatat surplus "+USD(estate.balance)+"; analisis ketahanan harus membedakan komoditas perkebunan dari bahan pangan pokok dan risiko pasar masing-masing.")],
 [t("Fresh and processed balance differ","Neraca segar dan olahan berbeda"),t("The fresh agricultural balance is negative while processed agricultural exports generate the positive total. The split is relevant to domestic processing capacity, not evidence of profitability for each firm.","Neraca perdagangan pertanian segar defisit, sedangkan olahan surplus. Perbedaan ini relevan bagi kapasitas pengolahan domestik, bukan bukti setiap perusahaan menguntungkan.")],
 [t("Farmer welfare remains uneven","Kesejahteraan petani belum merata"),t("May 2026 NTP ranges from "+decimal(Math.min(...ntp))+" to "+decimal(Math.max(...ntp))+" across 38 provinces; "+under100+" are below index 100. The index cannot reveal absolute income or household poverty.","Pada Mei 2026 NTP 38 provinsi berkisar "+decimal(Math.min(...ntp))+" hingga "+decimal(Math.max(...ntp))+"; "+under100+" provinsi berada di bawah 100. Indeks ini tidak menunjukkan pendapatan absolut atau kemiskinan keluarga.")],
 [t("Retail price gaps are not all supply shortages","Perbedaan harga tidak selalu berarti kelangkaan"),t("Rice, chilies and meat prices differ by place, but logistics, quality, sampling and price-reporting coverage also matter. Compare with wholesale trends, stocks, production and independent BPS data before a shortage claim.","Harga beras, cabai, dan protein berbeda menurut wilayah, tetapi logistik, mutu, cakupan sampel, dan metode pelaporan ikut memengaruhi. Verifikasi stok, produksi, dan data BPS sebelum menyimpulkan kelangkaan.")],
 [t("Institutional mandates must not be conflated","Mandat kelembagaan harus dibedakan"),t("Kemenko Pangan coordinates, Kementan oversees agriculture, Bapanas manages food governance, BPS publishes statistics and Bulog operates assignments. Treating them as a single vertical chain can produce invalid policy conclusions.","Kemenko Pangan berkoordinasi, Kementan melaksanakan kebijakan pertanian, Bapanas menangani urusan pangan, BPS menyediakan statistik, dan Bulog menjalankan penugasan. Jangan menyajikan semuanya sebagai satu rantai komando.")],
 [t("Data recency is part of the research conclusion","Kebaruan data adalah bagian dari kesimpulan"),t("The uploaded official June edition ends in April/May 2026. More recent Pusdatin releases exist; do not use this snapshot as a current October price, fresh rice stock or live investment condition.","Publikasi resmi Juni yang diunggah hanya sampai April/Mei 2026. Edisi Pusdatin yang lebih baru sudah terbit; jangan gunakan angka ini sebagai harga Oktober, stok beras terkini, atau kondisi investasi real-time.")]
 ];
 const root=$("faAssessment");root.replaceChildren();
 assessment.forEach(([name,explain],i)=>{const a=el("article");a.append(el("span",String(i+1).padStart(2,"0")),el("h3",name),el("p",explain));root.append(a)});
}
function renderSourceList(){
 const value=$("faSourceSearch").value.toLowerCase().trim(),status=$("faSourceScope").value;
 const rows=data.tables.filter(row=>(!value||[row.name,String(row.number)].join(" ").toLowerCase().includes(value))&&(status==="all"||(status==="numeric"?row.structured:!row.structured)));
 $("faSourceCount").textContent=rows.length+" / "+data.tables.length+" "+t("original publication tables shown","tabel publikasi sumber ditampilkan");
 const root=$("faSourceList");root.replaceChildren();
 for(const a of rows){
  const card=el("article",undefined,"fa-source-entry"),p=anchor(pdfPage(data.publication.pdf,a.pdfPage),"Tabel "+a.number+" · "+a.name);
  const hint=el("small",t("PDF page ","Halaman PDF ")+a.pdfPage+" · "+(a.number<=27?"2026-04":"2026-05"));
  card.append(p,el("span",a.structured?t("NUMERIC SERIES","SERI ANGKA"):t("SOURCE LINK ONLY","TAUTAN SUMBER"),"fa-badge"+(a.structured?"":" pending")),hint);root.append(card);
 }
}
function selectOptions(elId,values,selected){const parent=$(elId);parent.replaceChildren();values.forEach((x,i)=>{const o=el("option",x);o.value=String(i);parent.append(o)});parent.value=String(selected)}
function renderAll(){
 titleLocalized();renderKpis();renderTrade();renderNationalTrend();renderFarmer();renderPrices();renderOrg();assessments();renderSourceList();
}
async function init(){
 try{
  const res=await fetch("./data/food-agriculture-2026.json",{cache:"no-store"});if(!res.ok)throw Error("HTTP "+res.status);
  data=await res.json();
  leadership=await fetch("./data/food-institution-leadership.json",{cache:"no-store"})
     .then(r=>r.ok?r.json():null).catch(()=>null);
  if(leadership?.schema_version!=="sli-food-leadership-v1"||leadership?.review_status!=="official_primary_source_verified")leadership=null;
  if(data.schema!=="sli-food-2026-launch-v1"||data.provinces.length!==38||data.tables.length!==63||data.trade.length!==15||data.tradeMonthly?.length!==60||data.nationalFarmerIndices?.series?.length!==6)throw Error("Food source dataset failed integrity test");
  selectOptions("faNationalGroup",data.nationalFarmerIndices.series.map(x=>x.name),0);
  selectOptions("faFarmerProvince",data.provinces,selectedProvince);
  selectOptions("faPricePlace",data.prices.places,selectedPlace);
  selectOptions("faCommodity",data.prices.items.map(x=>x.name),0);
  $("faTradeScope").addEventListener("change",renderTrade);
  $("faTradeMonth").addEventListener("change",renderTrade);
  $("faNationalGroup").addEventListener("change",renderNationalTrend);
  $("faNationalMetric").addEventListener("change",renderNationalTrend);
  $("faFarmerMetric").addEventListener("change",()=>{farmerMetric=$("faFarmerMetric").value;renderFarmer()});
  $("faFarmerProvince").addEventListener("change",()=>{selectedProvince=Number($("faFarmerProvince").value);renderFarmer()});
  $("faCommodity").addEventListener("change",()=>{priceCommodity=Number($("faCommodity").value);renderPrices()});
  $("faPricePlace").addEventListener("change",()=>{selectedPlace=Number($("faPricePlace").value);renderPrices()});
  $("faSourceSearch").addEventListener("input",renderSourceList);
  $("faSourceScope").addEventListener("change",renderSourceList);
  const observer=new MutationObserver(records=>{if(records.some(r=>r.attributeName==="lang"))renderAll()});
  observer.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  renderAll();
 }catch(err){$("faKpis").replaceChildren(el("p",t("Dashboard source unavailable: ","Data dashboard tidak dapat dimuat: ")+err.message,"fa-error"))}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
