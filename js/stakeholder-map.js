/* SLI Stakeholder Explorer — zero-dependency interactive, accessible SVG power map.
   Visual edges express analytical association / stakeholder scope, NOT statutory command chains.
   Actor facts are read only from the source-dated governance JSON, never hardcoded here. */
(function(){
"use strict";
const NS="http://www.w3.org/2000/svg";
const isID=()=>window.SLIi18n?.language==="id"||document.documentElement?.lang==="id";
const ID_TEXT=new Map([
["PRESIDENCY","KEPRESIDENAN"],["& DIRECTION","& ARAHAN"],["REGULATORS","REGULATOR"],["& INSTITUTIONS","& LEMBAGA"],["OWNERSHIP","KEPEMILIKAN"],["& OPERATORS","& OPERATOR"],["& SCRUTINY","& PENGAWASAN"],["& REGIONS","& DAERAH"],["LOCAL","DAERAH"],["& DELIVERY","& PELAKSANAAN"],
["Strategic","Strategis"],["Implementation","Pelaksanaan"],["Oversight","Pengawasan"],
["INDONESIA","INDONESIA"],["ENERGY","TATA KELOLA"],["GOVERNANCE","ENERGI"],["SELECT A NODE →","PILIH SATU TITIK →"],["CATEGORICAL ASSOCIATIONS · NOT REPORTING LINES","HUBUNGAN FUNGSIONAL · BUKAN GARIS KOMANDO"],
["01 · POLICY","01 · KEBIJAKAN"],["02 · RULES","02 · ATURAN"],["03 · ASSETS","03 · ASET"],["04 · CHECKS","04 · PENGAWASAN"],["05 · LOCALS","05 · DAERAH"],["Strategic direction","Arah strategis"],["Regulator & budget","Regulator dan anggaran"],["Operators / execution","Operator dan pelaksanaan"],["DPR / DPD scrutiny","Pengawasan DPR/DPD"],["Regional implementation","Pelaksanaan daerah"],["CLICK TO READ →","KLIK UNTUK MEMBACA →"],
["Institutions","Lembaga"],["Influence groups","Kelompok pengaruh"],["Issue lenses","Jalur isu"],["Overview","Gambaran Umum"],["Explore actors","Jelajahi pelaku"],["Issue focus","Fokus isu"],
["Six stakeholder systems. SOE portfolio ownership, sector regulators, independent BUMS operators and parliamentary scrutiny remain distinct. Select a node to explore.","Enam sistem pemangku kepentingan ditampilkan terpisah: kepemilikan portofolio BUMN, regulator sektor, operator swasta, dan pengawasan parlemen. Klik bagian peta untuk mempelajarinya."],
["STRATEGIC LATITUDE INTELLIGENCE · STAKEHOLDER POWER MAP","STRATEGIC LATITUDE INTELLIGENCE · PETA PEMANGKU KEPENTINGAN"],
["Indonesia Energy Power Map","Peta Kelembagaan Energi Indonesia"],
["SOE ownership vs regulation · UU 16/2025 · expand mandate diagram","Kepemilikan vs pengaturan BUMN · UU 16/2025 · buka bagan kewenangan"],
["GOVERNMENT · SPECIAL RIGHTS","PEMERINTAH · HAK KHUSUS"],["ECONOMIC SHAREHOLDING","KEPEMILIKAN EKONOMI"],
["State strategic shareholding rights and corporate regulation. Does not license PSCs or supervise private KKKS.","Hak kepemilikan strategis negara dan pengaturan BUMN. Bukan pemberi izin PSC maupun pengawas langsung KKKS swasta."],
["BUMN portfolio investment and operational holding mandate, including Pertamina / PLN; board execution stays with each corporate group.","Mandat investasi portofolio BUMN dan pengelolaan induk operasional termasuk Pertamina/PLN. Pelaksanaan tetap berada pada direksi masing-masing grup."],
["The legal 1%/99% split concerns defined state-shareholding rights: it does not mean Danantara owns 99% of every listed BUMN’s total market equity. Verify each issuer’s share register. Separate chain: ESDM (energy regulation) → SKK Migas/BPMA (upstream PSC management) → KKKS (BUMN, private or foreign field operator). BPH Migas supervises downstream fuel and gas-transport matters. Neither SKK Migas nor BPH Migas is a Danantara subsidiary.","Pembagian 1%/99% berkaitan dengan hak saham negara yang ditentukan hukum, bukan bukti Danantara memiliki 99% seluruh saham beredar setiap BUMN terbuka. Periksa daftar pemegang saham. ESDM mengatur energi, SKK Migas/BPMA mengelola kontrak hulu, KKKS melaksanakan operasi lapangan, dan BPH Migas mengawasi distribusi BBM serta pengangkutan gas. SKK maupun BPH Migas bukan anak perusahaan Danantara."],
["UU 16/2025 legal text ↗","Naskah UU 16/2025 ↗"],["Danantara official mandate ↗","Mandat resmi Danantara ↗"],
["President / DEN Chair","Presiden / Ketua DEN"],["Minister of Energy and Mineral Resources","Menteri ESDM"],["Coordinating Minister for Downstreaming & Energy Transition","Menko Hilirisasi dan Transisi Energi"],["DEN Secretary General","Sekretaris Jenderal DEN"],["SKK Migas Head","Kepala SKK Migas"],["BPI Danantara / CEO","BPI Danantara / CEO"],
["Choose functional institutional branch","Pilih kelompok fungsi kelembagaan"],["Choose an energy policy issue","Pilih isu kebijakan energi"],["Search Simon Mantiri, Purnomo, DPR XII…","Cari tokoh, DPR, dan lembaga…"],["Search all stakeholders by person or institution","Cari seluruh pelaku menurut tokoh atau lembaga"],
["Select a highlighted node to drill down","Pilih titik yang ditandai untuk membuka rincian"],
["Analytical policy influence only. Not statutory reporting lines.","Hanya menggambarkan pengaruh kebijakan secara analitis, bukan garis pertanggungjawaban menurut hukum."],
["Browse complete source-dated stakeholder directory","Jelajahi direktori pelaku dan sumber bertanggal"],
["No matching actors","Tidak ditemukan pelaku yang sesuai"],["READ THE MAP","CARA MEMBACA PETA"],
["Explore who shapes Indonesia’s energy policy","Jelajahi lembaga yang memengaruhi kebijakan energi Indonesia"],
["Only six institutional clusters are shown to keep the overview legible. Open a cluster to inspect its responsible people and organizations.","Peta ringkas menampilkan enam kelompok lembaga agar mudah dibaca. Buka kelompok untuk melihat tokoh, organisasi, peran, dan sumber."],
["Select a branch","Pilih kelompok"],["Open a focused map of its actors.","Buka peta pelaku pada kelompok tersebut."],
["Select an actor","Pilih tokoh atau lembaga"],["View the incumbent, mandate, links and cited source.","Baca pimpinan, mandat, hubungan, dan sumber yang dicantumkan."],
["Trace an energy issue","Telusuri isu energi"],["Compare policy, regulator, operator, parliament and region.","Bandingkan kebijakan, regulator, operator, parlemen, dan daerah."],
["Explore Pertamina & PLN →","Jelajahi Pertamina & PLN →"],
["INSTITUTIONAL BRANCH","KELOMPOK KELEMBAGAAN"],["Explore source-dated members and responsibilities.","Jelajahi anggota, tanggung jawab, dan tanggal sumber."],
["Inspect a key actor","Periksa pelaku utama"],["STAKEHOLDER PROFILE","PROFIL PEMANGKU KEPENTINGAN"],["Leadership to verify","Pimpinan perlu diverifikasi"],
["Responsibility","Tanggung jawab"],["Role under review","Peran masih dikaji"],
["Decision authority","Batas kewenangan"],["Institutional scope; actual mandate must be verified.","Batas kewenangan harus diperiksa menurut dokumen hukum asli."],
["Official appointment / institutional source ↗","Sumber pengangkatan / lembaga resmi ↗"],["Later official leadership confirmation ↗","Konfirmasi pejabat terbaru ↗"],["Related stakeholders","Pelaku terkait"],
["POLICY ACCOUNTABILITY LENS","ANALISIS AKUNTABILITAS KEBIJAKAN"],["Operator / assets","Operator / aset"],["DPR / DPD oversight","Pengawasan DPR/DPD"],
["SLI analytical test","Pemeriksaan analitis SLI"],
["Issue pathway reflects functional responsibilities, not statutory command relationships.","Jalur isu menunjukkan tanggung jawab fungsional, bukan garis komando yang diatur undang-undang."],
["National decision and influence systems","Sistem pengambilan keputusan dan pengaruh nasional"],
["Issue lens","Analisis isu"],["Six hubs only. Click any branch to drill down.","Enam kelompok ditampilkan. Klik satu kelompok untuk membuka rincian."],
["Five accountability stages","Lima tahapan akuntabilitas"],["Choose a stage for responsibilities and analytical checks","Pilih tahapan untuk melihat tanggung jawab dan pemeriksaan analitis"],
["← All branches","← Semua kelompok"],["Lines indicate stakeholder membership in the selected influence cluster—not formal reporting.","Garis menunjukkan keterkaitan pemangku kepentingan, bukan hubungan pelaporan formal."],
["DPR and DPD independent scrutiny are shown separately from regulatory / corporate execution.","Pengawasan independen DPR dan DPD dipisahkan dari pelaksanaan oleh regulator dan perusahaan."],
["STRATEGIC LATITUDE INTELLIGENCE · STAKEHOLDER POWER MAP","STRATEGIC LATITUDE INTELLIGENCE · PETA PEMANGKU KEPENTINGAN"]
]);
const ISSUE_STAGES_ID=[
["Kebijakan harga dan subsidi energi oleh ESDM/Kemenkeu; DEN dilibatkan dalam kondisi nasional.","Ditjen Migas/BPH Migas mengawasi distribusi; Kemenkeu menangani subsidi dan kompensasi.","Pertamina Patra Niaga, terminal, distributor dan SPBU menyalurkan BBM/LPG.","DPR XII mengawasi kebijakan/kuota, DPR VI kinerja Pertamina, DPD II dampak daerah.","Gubernur, BPBD dan pemerintah daerah terdampak mengoordinasikan pelayanan."],
["Kebijakan elektrifikasi dan kecukupan pasokan listrik nasional.","Ditjen Ketenagalistrikan ESDM mengatur penyediaan listrik dan keselamatan.","PLN, unit jaringan dan pengatur beban, perusahaan pembangkit, serta IPP.","DPR XII menilai kebijakan listrik, DPR VI PLN, DPD II layanan daerah.","Pemulihan sistem lokal dan koordinasi kedaruratan provinsi."],
["KEN/NZE, Perpres 14/2024 dan arah kebijakan pengelolaan karbon ESDM.","Ditjen Migas, SKK/BPMA, otoritas wilayah penyimpanan dan KLH menurut izin proyek.","Kontraktor penyimpanan, penangkapan dan transportasi termasuk bp, Pertamina, INPEX serta mitra.","DPR XII mengawasi kerangka perizinan dan investasi; DPD II dampak daerah.","Penggunaan lahan, jalur transportasi dan perlindungan masyarakat setempat."],
["Pasokan energi nasional dan kebijakan ekspor/penerimaan batu bara.","Ditjen Minerba ESDM, Kemenkeu dan KLH sesuai kewenangannya.","Operator tambang, logistik, PLN EPI dan pembangkit penerima batu bara.","DPR XII mengawasi batu bara/listrik, DPR XI anggaran, DPD II daerah.","Izin, reklamasi, tanah dan masyarakat terdampak menurut mandat daerah."],
["Target KEN/RUPTL/EBT serta koordinasi Kemenko Hilirisasi dan Transisi Energi.","Ditjen EBTKE dan Gatrik, BKPM, KLH serta Kementerian Kehutanan.","PLN, Indonesia Power, PGE, Geo Dipa, IPP dan kontraktor EPC.","DPR XII mengawasi EBT, DPR VI investasi BUMN, DPD II daerah.","Pelaksanaan RUED, izin lahan, sambungan listrik dan pengguna lokal."],
["Kebijakan fiskal nasional dan ketepatan sasaran subsidi energi.","Kemenkeu menangani anggaran, ESDM/BPH Migas mengatur alokasi dan pengawasan.","Pertamina Patra Niaga serta PLN melakukan penyaluran dan operasi.","DPR XII memeriksa asumsi, DPR XI/Banggar APBN, DPR VI BUMN, DPD IV fiskal daerah.","Rumah tangga dan pulau terpencil, stok lokal dan kelayakan penerima."],
["Presiden/DEN, Kemenko Hilirisasi, serta BKPM mengarahkan investasi.","ESDM mengatur teknis, Kemenperin industri, KLH lingkungan, Kemenkeu insentif.","Danantara/BUMN dan investor swasta melaksanakan proyek menurut kontraknya.","DPR XII mengawasi energi, DPR VII industri, DPR VI BUMN, DPD II daerah.","Kawasan industri, pelabuhan, BP Batam/KEK dan pemerintah daerah."],
["ESDM/Ditjen Migas menetapkan kebijakan hulu, wilayah kerja, dan target.","SKK Migas mengelola PSC luar Aceh; BPMA di Aceh. BP BUMN bukan pemberi izin PSC.","Pertamina Hulu Energi dan KKKS swasta/asing menjalankan kontrak wilayahnya.","DPR XII mengawasi migas, DPR VI BUMN, DPR XI/Banggar fiskal, DPD II daerah.","Lokasi produksi, fasilitas, keselamatan, dan perlindungan masyarakat lokal."],
["Pemerintah/ESDM menentukan alokasi gas, HGBT, pasokan dan prioritas domestik.","Ditjen Migas mengatur gas, SKK/BPMA kontrak hulu, BPH Migas pengangkutan pipa.","KKKS, PGN, PLN EPI, operator LNG/pipa dan penyedia jargas.","DPR XII mengawasi gas, DPR VI operator BUMN, DPD II pemerataan.","Terminal LNG, pipa, kawasan industri, sambungan rumah tangga dan izin daerah."]
];
const energyStage=(idx,stage,original)=>isID()?(ISSUE_STAGES_ID[idx]?.[stage]||"Periksa peran dan dokumen lembaga terkait."):original;
const actorRole=(data,a)=>{if(!isID())return a.role||"";for(let i=0;i<data.layers.length;i++){let j=data.layers[i].actors.indexOf(a);if(j>=0)return window.SLITranslateEnergyRole?.(i,j,a.role)||a.role}return a.role||""};
function tx(v){const str=String(v??"");if(!isID())return str;return ID_TEXT.get(str)||window.SLIi18n?.translate?.(str,"id")||str}
const LAYER_ID=[
["Pengambilan keputusan presiden, penasihat, dan koordinasi nasional","Arahan dan nasihat strategis berbeda dari keputusan kementerian yang berwenang serta persetujuan operasional."],
["Direktorat teknis ESDM serta regulator hulu dan hilir","Mandat pengawasan berlaku sesuai sektor dan berbeda dari pekerjaan operasi lapangan."],
["Kepemilikan negara, investasi, BUMN, dan operator swasta","Danantara mengelola kepentingan portofolio saham Seri B BUMN; BP BUMN memiliki hak Seri A tersendiri. Regulator, operator swasta, dan pengurus BUMN mempunyai mandat hukum berbeda."],
["DPR RI: legislasi, pengawasan BUMN dan fiskal","Pengawasan parlemen terpisah dari kewenangan pelaksanaan pemerintah."],
["DPD RI: kepentingan energi daerah dan pemerataan fiskal","DPD mewakili daerah; kewenangannya berbeda dari legislasi DPR dan pengaturan ESDM."],
["Pelaksanaan provinsi, lingkungan dan risiko lokasi","Pelaksanaan proyek, penggunaan lahan, RUED, perlindungan lingkungan, dan tanggap darurat tersebar pada berbagai lembaga."]
];
const ISSUE_ID=[
["Kelangkaan BBM / LPG","Uji stok nasional, terminal, pembongkaran kapal, distribusi dan jam SPBU. Antrean di satu daerah tidak membuktikan pasokan nasional kolaps."],
["Pemadaman listrik atau pembatasan beban","Bedakan gangguan pembangkit, jaringan, cadangan daya, waktu pemulihan, dan pelanggan terdampak; periksa pernyataan teknis PLN yang bertanggal."],
["Perizinan CCS/CCUS dan realisasi komersial","Periksa izin lokasi, PoD, FID, fasilitas penangkapan beroperasi, volume injeksi terukur, dan belanja modal aktual. Estimasi potensi geologi bukan realisasi CCS."],
["DMO batu bara dan kepatuhan pertambangan","Pisahkan produksi batu bara, alokasi DMO, pasokan aktual PLN, dan pembayaran. Cocokkan volume serta periode data."],
["Energi terbarukan dan investasi jaringan","Telusuri lelang, PPA, pembiayaan/FID, kesiapan transmisi, konstruksi, dan COD. MW yang diumumkan bukan kapasitas beroperasi."],
["Subsidi energi, kuota BBM, dan APBN","Bedakan rancangan APBN, pagu yang disahkan, subsidi dibayar, kompensasi pemerintah, serta BBM benar-benar disalurkan."],
["Investasi energi strategis dan hilirisasi","Pisahkan rencana investasi, pendanaan final, modal disetor, belanja pembangunan, dan operasi komersial."],
["Hulu migas: PSC, lifting, dan investasi","Portofolio ekonomi BUMN Danantara tidak menjadikan SKK Migas atau kontraktor swasta sebagai anak usaha. Bedakan cadangan, produksi, lifting, realisasi belanja dan transaksi akuisisi yang telah tuntas."],
["Gas industri, LNG dan jargas","Bandingkan produksi gas hulu, penjualan domestik, alokasi HGBT, kapasitas dan aliran pipa, serta sambungan jargas aktual. Kontrak LNG bukan bukti gas telah diterima konsumen."]
];

const palette=["#D8BD80","#83BACB","#82B5A3","#B9A2D8","#D9A780","#95AED6"];
const energyLayerTitle=(index,layer)=>isID()?(LAYER_ID[index]?.[0]||layer.title):layer.title;
const energyLayerSummary=(index,layer)=>isID()?(LAYER_ID[index]?.[1]||layer.summary):layer.summary;
const energyIssue=(index,field,original)=>isID()?(ISSUE_ID[index]?.[field==="issue"?0:1]||original):original;
const titles=[
 ["PRESIDENCY","& DIRECTION"],
 ["REGULATORS","& INSTITUTIONS"],
 ["OWNERSHIP","& OPERATORS"],
 ["DPR RI","& SCRUTINY"],
 ["DPD RI","& REGIONS"],
 ["LOCAL","& DELIVERY"]
];
const kinds=[
 {label:"Strategic",match:[0]}, {label:"Implementation",match:[1,2,5]},
 {label:"Oversight",match:[3,4]}
];
const $=(t,c,txt)=>{const e=document.createElement(t);if(c)e.className=c;if(txt!==undefined)e.textContent=tx(txt);return e};
const sv=(t,attrs={},txt)=>{
 const e=document.createElementNS(NS,t);
 for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));
 if(txt!==undefined)e.textContent=tx(txt);
 return e;
};
function text(svg,x,y,words,attrs={}){
 const val=sv("text",{x,y,"font-family":"Inter, system-ui, sans-serif",...attrs},words);svg.append(val);return val;
}
function curved(svg,x1,y1,x2,y2,stroke,width=1.3,opacity=.45,dash=""){
 const c1=x1+(x2-x1)*.33,c2=x1+(x2-x1)*.66;
 const e=sv("path",{d:"M"+x1+" "+y1+" C "+c1+" "+y1+", "+c2+" "+y2+", "+x2+" "+y2,
   fill:"none",stroke,"stroke-width":width,opacity,"stroke-dasharray":dash});
 svg.append(e);return e;
}
function trim(s,n){return s.length>n?s.slice(0,n-1).trim()+"…":s}
function splitName(name,max=23){
 const parts=String(name).replace(/^(PT |DPR RI · |DPD RI · )/,"").split(/\s+/);
 let a="",b="";
 for(const p of parts){if(!a||a.length+p.length+1<=max)a+=(a?" ":"")+p;else b+=(b?" ":"")+p}
 return [trim(a,max),trim(b,max)];
}
function dot(s,x,y,r,color){s.append(sv("circle",{cx:x,cy:y,r,fill:color}))}
function background(svg,w,h){
 svg.append(sv("rect",{width:w,height:h,rx:20,fill:"#0a1b2c"}));
 const g=sv("g",{stroke:"#355269","stroke-width":.6,opacity:.17});
 for(let x=24;x<w;x+=38)g.append(sv("path",{d:"M"+x+" 0 V"+h}));
 for(let y=22;y<h;y+=38)g.append(sv("path",{d:"M0 "+y+" H"+w}));
 svg.append(g);
 svg.append(sv("circle",{cx:w*.5,cy:h*.5,r:Math.min(w,h)*.45,fill:"none",stroke:"#34546d","stroke-width":1,opacity:.29}));
}
function interactive(node,click,label){
 node.setAttribute("tabindex","0");node.setAttribute("role","button");
 node.setAttribute("aria-label",label);node.style.cursor="pointer";
 node.addEventListener("click",click);
 node.addEventListener("keydown",e=>{
  if(e.key==="Enter"||e.key===" "){e.preventDefault();click()}
 });
 return node;
}
function panelLink(url,label){
 const a=$("a","stake-source",label);
 if(/^https:\/\//.test(url||"")){a.href=url;a.target="_blank";a.rel="noopener noreferrer"}
 else {a.removeAttribute("href");a.textContent="Source unavailable"}
 return a;
}
function stat(label,value){
 const item=$("div","stake-stat");item.append($("strong",null,value),$("span",null,label));return item;
}
function createSvg(w,h,label){
 const s=sv("svg",{viewBox:"0 0 "+w+" "+h,preserveAspectRatio:"xMidYMid meet","aria-label":label,role:"img",class:"stake-svg"});
 s.append(sv("title",{},label));
 background(s,w,h);return s;
}
function overview(svg,data,choose){
 const cx=480,cy=282;
 const positions=[[480,93],[180,197],[780,197],[180,397],[780,397],[480,484]];
 positions.forEach(([x,y],i)=>{
  const oversight=i===3||i===4;
  curved(svg,cx,cy,x,y,palette[i],1.6,.58,oversight?"5 7":"");
 });
 svg.append(sv("circle",{cx,cy,r:103,fill:"#1a3650",stroke:"#a38b5b","stroke-width":1.5}));
 svg.append(sv("circle",{cx,cy,r:90,fill:"#0c2337",stroke:"#d4b97c","stroke-width":.8,opacity:.65}));
 text(svg,cx,cy-29,"INDONESIA",{"text-anchor":"middle",fill:"#d8c18d","font-size":12,"font-weight":700,"letter-spacing":3});
 text(svg,cx,cy-4,"ENERGY",{"text-anchor":"middle",fill:"#f5f4eb","font-size":24,"font-weight":700,"letter-spacing":1});
 text(svg,cx,cy+18,"GOVERNANCE",{"text-anchor":"middle",fill:"#f5f4eb","font-size":16,"font-weight":600,"letter-spacing":1.4});
 const count=data.layers.reduce((sum,x)=>sum+x.actors.length,0);
 text(svg,cx,cy+43,count+(isID()?" pelaku · ":" actors · ")+data.layers.length+(isID()?" kelompok":" branches"),{"text-anchor":"middle",fill:"#a4c3d7","font-size":11});
 positions.forEach(([x,y],i)=>{
  const w=238,h=88,c=palette[i],g=sv("g",{class:"stake-svg-node"}); 
  const rect=sv("rect",{x:x-w/2,y:y-h/2,width:w,height:h,rx:14,fill:"#142d43",stroke:c,"stroke-width":1.35});
  g.append(rect);
  g.append(sv("rect",{x:x-w/2+15,y:y-h/2+15,width:5,height:h-30,rx:3,fill:c}));
  text(g,x-99,y-13,titles[i][0],{fill:"#f0f3f8","font-size":14,"font-weight":720,"letter-spacing":.4});
  text(g,x-99,y+7,titles[i][1],{fill:"#f0f3f8","font-size":13,"font-weight":600});
  text(g,x+100,y+27,data.layers[i].actors.length+(isID()?" pelaku":" actors"),{"text-anchor":"end",fill:c,"font-size":11,"font-weight":700});
  interactive(g,()=>choose(i),"Open "+data.layers[i].title+" — "+data.layers[i].actors.length+" stakeholders");
  const tt=sv("title",{},data.layers[i].title+" · Select to explore");g.append(tt);
  svg.append(g);
 });
}
function layerGraph(svg,layer,index,select,back,selectedName){
 const actors=layer.actors,rows=Math.ceil(actors.length/2),h=Math.max(510,rows*86+80),w=960;
 svg.setAttribute("viewBox","0 0 "+w+" "+h);svg.replaceChildren();
 background(svg,w,h);
 const c=palette[index],cx=173,cy=h/2;
 const hub=sv("g",{});
 hub.append(sv("rect",{x:40,y:cy-81,width:266,height:162,rx:20,fill:"#18354c",stroke:c,"stroke-width":1.7}));
 const short=titles[index];
 text(hub,62,cy-37,short[0],{fill:c,"font-size":15,"font-weight":700,"letter-spacing":1});
 text(hub,62,cy-12,short[1],{fill:"#eff5f7","font-size":19,"font-weight":700});
 text(hub,62,cy+20,actors.length+(isID()?" lembaga dan pelaku":" institutions & actors"),{fill:"#accbda","font-size":12});
 text(hub,62,cy+45,"SELECT A NODE →",{fill:c,"font-size":10,"letter-spacing":1.1});
 interactive(hub,back,"Back to main energy stakeholder map");
 const positions=actors.map((a,i)=>{
  const col=i%2,row=Math.floor(i/2);
  return {a,x:col===0?520:793,y:68+row*85,col};
 });
 positions.forEach((p,i)=>{
  curved(svg,306,cy,p.x-119,p.y,c,selectedName===p.a.name?2.35:.9,selectedName===p.a.name?.94:.27);
 });
 svg.append(hub);
 positions.forEach((p,i)=>{
  const active=selectedName===p.a.name;
  const card=sv("g",{class:"stake-svg-node"});
  const x=p.x,y=p.y,w=252,hh=68;
  card.append(sv("rect",{x:x-w/2,y:y-hh/2,width:w,height:hh,rx:11,fill:active?"#28445b":"#132b40",stroke:active?"#ebcb88":"#57718a","stroke-width":active?2:1}));
  card.append(sv("rect",{x:x-w/2,y:y-hh/2,width:4,height:hh,rx:2,fill:c}));
  const [a,b]=splitName(p.a.name,29);
  text(card,x-w/2+15,y-(b?12:1),a,{fill:"#f7fafb","font-size":11.2,"font-weight":700});
  if(b)text(card,x-w/2+15,y+4,b,{fill:"#edf3f8","font-size":10.8,"font-weight":650});
  const person=String(p.a.person_name||"").trim();
  const label=person&&!/^(president director|head of|leadership|investor|minister|board|agency|institution|office)/i.test(person)?person:(p.a.scope||p.a.kind);
  text(card,x-w/2+15,y+25,trim(label,35),{fill:active?"#eac985":"#9eb7cb","font-size":10.2,"font-weight":person===label?720:500});
  interactive(card,()=>select(p.a.name),"Inspect "+p.a.name+" — "+(p.a.lead||""));
  card.append(sv("title",{},p.a.name+"\n"+(p.a.lead||"")));
  svg.append(card);
 });
 svg.append(sv("text",{x:34,y:26,fill:"#9bbacb","font-size":10,"letter-spacing":1.2},"CATEGORICAL ASSOCIATIONS · NOT REPORTING LINES"));
}
function issueGraph(svg,routes,idx,select){
 const issue=routes[idx],w=960,h=480;
 svg.setAttribute("viewBox","0 0 "+w+" "+h);svg.replaceChildren();
 background(svg,w,h);
 const pts=[[175,158],[480,158],[785,158],[330,357],[645,357]];
 curved(svg,285,158,370,158,"#d1b678",1.4,.54);
 curved(svg,590,158,675,158,"#b7d0df",1.4,.54);
 curved(svg,785,209,635,300,"#c5b0df",1.3,.43,"5 6");
 curved(svg,520,357,535,357,"#c3a780",1.3,.46,"5 6");
 const specs=[
  ["01 · POLICY","Strategic direction",issue.strategic,"#D8BD80"],
  ["02 · RULES","Regulator & budget",issue.regulators,"#83BACB"],
  ["03 · ASSETS","Operators / execution",issue.operators,"#82B5A3"],
  ["04 · CHECKS","DPR / DPD scrutiny",issue.oversight,"#B9A2D8"],
  ["05 · LOCALS","Regional implementation",issue.regional,"#D9A780"]
 ];
 specs.forEach(([top,heading,body,c],i)=>{
  const [x,y]=pts[i],g=sv("g",{class:"stake-svg-node"});
  g.append(sv("rect",{x:x-124,y:y-56,width:248,height:112,rx:14,fill:"#162f43",stroke:c,"stroke-width":1.5}));
  g.append(sv("rect",{x:x-110,y:y-42,width:5,height:84,rx:2,fill:c}));
  text(g,x-98,y-27,top,{fill:c,"font-size":10,"font-weight":750,"letter-spacing":1.2});
  const [first,second]=splitName(heading,22);
  text(g,x-98,y-3,first,{fill:"#f5f7fa","font-size":14,"font-weight":700});
  if(second)text(g,x-98,y+16,second,{fill:"#f5f7fa","font-size":12});
  text(g,x-98,y+36,"CLICK TO READ →",{fill:"#9eb4c7","font-size":10});
  interactive(g,()=>select(i),"Review "+heading+" for "+issue.issue);
  g.append(sv("title",{},body));svg.append(g);
 });
}
window.renderSLIStakeholderMap=function(root,data,restore){
 if(!data||!Array.isArray(data.layers)||!data.layers.length){root.append($("p","gov-note","Institutional actor data is unavailable."));return;}
 const all=data.layers.flatMap((layer,group)=>layer.actors.map(a=>({a,group}))),routes=data.accountability_routes||[];
 const state={mode:"overview",group:0,selected:"",issue:0,issueStep:0,query:"",...(restore||{})};
 const wrapper=$("section","stake-shell");
 wrapper.setAttribute("aria-label","Interactive Indonesia energy stakeholder network");
 const header=$("div","stake-header");
 const heading=$("div");
 heading.append($("div","eyebrow","STRATEGIC LATITUDE INTELLIGENCE · STAKEHOLDER POWER MAP"),$("h2",null,"Indonesia Energy Power Map"));
 heading.append($("p","stake-intro","Six stakeholder systems. SOE portfolio ownership, sector regulators, independent BUMS operators and parliamentary scrutiny remain distinct. Select a node to explore."));
 const stats=$("div","stake-stats");
 stats.append(stat("Institutions",String(all.length)),stat("Influence groups",String(data.layers.length)),stat("Issue lenses",String(routes.length)));
 header.append(heading,stats);wrapper.append(header);
 const keyPeople=[
  {name:"Presidency / National Energy Council (DEN)",title:"President / DEN Chair"},
  {name:"Kementerian ESDM / Minister",title:"Minister of Energy and Mineral Resources"},
  {name:"Kemenko Hilirisasi dan Transisi Energi",title:"Coordinating Minister for Downstreaming & Energy Transition"},
  {name:"Sekretariat Jenderal DEN",title:"DEN Secretary General"},
  {name:"SKK Migas",title:"SKK Migas Head"},
  {name:"Danantara Indonesia (BPI) — SOE portfolio ownership & capital",title:"BPI Danantara / CEO"}
 ];
 const leaders=$("div","stake-key-people");
 leaders.setAttribute("aria-label","Named current decision-makers in Indonesia energy institutional mapping");
 keyPeople.forEach(({name,title})=>{
  const record=all.find(x=>x.a.name===name)?.a;
  if(!record)return;
  const person=record.person_name||(name==="Kemenko Hilirisasi dan Transisi Energi"?"Bahlil Lahadalia":"");
  if(!person)return;
  const chip=$("button","stake-person-chip");
  chip.type="button";
  chip.append($("span",null,title),$("strong",null,person));
  chip.setAttribute("aria-label",title+": "+person+". Open stakeholder profile");
  chip.addEventListener("click",()=>goActor(name));
  leaders.append(chip);
 });
 if(leaders.children.length)wrapper.append(leaders);
 if(data.ownership_model){
  const own=$("details","stake-ownership");
  own.append($("summary",null,"SOE ownership vs regulation · UU 16/2025 · expand mandate diagram"));
  const content=$("div","stake-ownership-content");
  const split=$("div","stake-ownership-rows");
  const bp=$("div","stake-ownership-box");
  bp.append($("span","stake-ownership-kicker","GOVERNMENT · SPECIAL RIGHTS"),
   $("h3",null,"BP BUMN · Series A Dwiwarna (1%)"),
   $("p",null,"State strategic shareholding rights and corporate regulation. Does not license PSCs or supervise private KKKS."));
  const bpi=$("div","stake-ownership-box");
  bpi.append($("span","stake-ownership-kicker","ECONOMIC SHAREHOLDING"),
   $("h3",null,"BPI Danantara · Series B (99%)"),
   $("p",null,"BUMN portfolio investment and operational holding mandate, including Pertamina / PLN; board execution stays with each corporate group."));
  split.append(bp,bpi);content.append(split);
  content.append($("p","stake-ownership-note","The legal 1%/99% split concerns defined state-shareholding rights: it does not mean Danantara owns 99% of every listed BUMN’s total market equity. Verify each issuer’s share register. Separate chain: ESDM (energy regulation) → SKK Migas/BPMA (upstream PSC management) → KKKS (BUMN, private or foreign field operator). BPH Migas supervises downstream fuel and gas-transport matters. Neither SKK Migas nor BPH Migas is a Danantara subsidiary."));
  const citations=$("div","stake-ownership-links");
  citations.append(panelLink(data.ownership_model.source,"UU 16/2025 legal text ↗"),
    panelLink(data.ownership_model.danantara_source,"Danantara official mandate ↗"));
  content.append(citations);own.append(content);wrapper.append(own);
 }
 const tools=$("div","stake-toolbar");
 const tabs=$("div","stake-tabs"),tabRefs={};
 [["overview","Overview"],["layer","Explore actors"],["issue","Issue focus"]].forEach(([mode,label])=>{
  const b=$("button","stake-tab",label);b.type="button";b.addEventListener("click",()=>{
   state.mode=mode;state.selected="";draw();});tabs.append(b);tabRefs[mode]=b;
 });
 const groupSelect=$("select","stake-select");
 groupSelect.setAttribute("aria-label","Choose functional institutional branch");
 data.layers.forEach((layer,i)=>{const op=$("option",null,energyLayerTitle(i,layer).replace(/^\d+\s*·\s*/,""));op.value=i;groupSelect.append(op)});
 groupSelect.addEventListener("change",()=>{state.group=Number(groupSelect.value);state.mode="layer";state.selected="";draw()});
 const issueSelect=$("select","stake-select");
 issueSelect.setAttribute("aria-label","Choose an energy policy issue");
 routes.forEach((r,i)=>{const op=$("option",null,energyIssue(i,"issue",r.issue));op.value=i;issueSelect.append(op)});
 issueSelect.addEventListener("change",()=>{state.issue=Number(issueSelect.value);state.issueStep=0;state.mode="issue";draw()});
 const input=$("input","stake-search");
 input.type="search";input.placeholder="Search Simon Mantiri, Purnomo, DPR XII…";
 input.setAttribute("aria-label","Search all stakeholders by person or institution");
 const results=$("div","stake-search-results");results.setAttribute("role","listbox");
 input.addEventListener("input",()=>{state.query=input.value;showMatches()});
 input.addEventListener("keydown",e=>{if(e.key==="Escape"){input.value="";state.query="";showMatches();}});
 tools.append(tabs,groupSelect,issueSelect);
 const searchWrap=$("div","stake-search-wrap");searchWrap.append(input,results);tools.append(searchWrap);
 wrapper.append(tools);
 const layout=$("div","stake-layout"),figure=$("div","stake-figure"),inspector=$("aside","stake-inspector");
 inspector.setAttribute("aria-live","polite");
 const plotTitle=$("div","stake-plot-title"),canvas=$("div","stake-canvas"),mobile=$("div","stake-mobile-list");
 const zoomHint=$("div","stake-hint","Select a highlighted node to drill down");
 figure.append(plotTitle,canvas,mobile,zoomHint);layout.append(figure,inspector);wrapper.append(layout);
 const legend=$("div","stake-legend");
 const note=$("p","stake-disclaimer",isID()?"Peta ini menjelaskan hubungan fungsional secara analitis, bukan garis komando menurut hukum. Periksa sumber, tanggal dan batasan pada setiap profil.":data.warning||"Analytical policy influence only. Not statutory reporting lines.");
 wrapper.append(legend,note);
 const details=$("details","stake-directory");
 const summary=$("summary",null,"Browse complete source-dated stakeholder directory");
 const directory=$("div","stake-directory-inner");
 details.append(summary,directory);wrapper.append(details);
 root.append(wrapper);
 const find=(name)=>all.find(({a})=>a.name===name);
 function goActor(name){
  const o=find(name);if(!o)return;
  state.group=o.group;state.selected=name;state.mode="layer";
  input.value="";state.query="";showMatches();draw();
 }
 function showMatches(){
  results.replaceChildren();
  const q=state.query.trim().toLowerCase();
  if(q.length<2){results.hidden=true;return;}
  const hits=all.filter(({a})=>[a.name,a.person_name,a.lead,a.scope,a.role].join(" ").toLowerCase().includes(q)).slice(0,9);
  results.hidden=false;
  if(!hits.length){results.append($("div","stake-no-result","No matching actors"));return;}
  hits.forEach(({a,group})=>{const b=$("button","stake-match");b.type="button";
   b.append($("strong",null,a.name),$("span",null,a.lead||a.kind));
   b.addEventListener("click",()=>goActor(a.name));results.append(b)});
 }
 function paintOverviewPanel(){
  inspector.append($("div","stake-eyebrow","READ THE MAP"),$("h3",null,"Explore who shapes Indonesia’s energy policy"));
  inspector.append($("p",null,"Only six institutional clusters are shown to keep the overview legible. Open a cluster to inspect its responsible people and organizations."));
  const ul=$("div","stake-guide");
  [
   ["01","Select a branch","Open a focused map of its actors."],
   ["02","Select an actor","View the incumbent, mandate, links and cited source."],
   ["03","Trace an energy issue","Compare policy, regulator, operator, parliament and region."]
  ].forEach(([num,title,desc])=>{
   const row=$("div","stake-guide-row");
   row.append($("span","stake-step",num),$("div","stake-guide-text"));row.lastChild.append($("strong",null,title),$("p",null,desc));ul.append(row)});
  inspector.append(ul);
  const preferred=$("button","stake-action","Explore Pertamina & PLN →");preferred.type="button";
  preferred.addEventListener("click",()=>{state.mode="layer";state.group=2;draw()});inspector.append(preferred);
 }
 function paintGroupPanel(layer){
  inspector.append($("div","stake-eyebrow","INSTITUTIONAL BRANCH"),$("h3",null,energyLayerTitle(data.layers.indexOf(layer),layer).replace(/^\d+\s*·\s*/,"")));
  inspector.append($("p",null,energyLayerSummary(data.layers.indexOf(layer),layer)||"Explore source-dated members and responsibilities."));
  inspector.append($("div","stake-mini-count",layer.actors.length+" mapped institutions and stakeholders"));
  const lead=$("div","stake-quick-links");
  layer.actors.slice(0,Math.min(layer.actors.length,5)).forEach(a=>{
   const b=$("button","stake-quick");
   b.type="button";b.textContent=a.name;b.addEventListener("click",()=>goActor(a.name));lead.append(b)});
  inspector.append($("h4",null,"Inspect a key actor"),lead);
 }
 function paintActorPanel(a){
  inspector.append($("div","stake-eyebrow","STAKEHOLDER PROFILE"));
  inspector.append($("h3",null,a.name));
  const tag=$("span","stake-role-badge",isID()?"Kelembagaan · "+energyLayerTitle(state.group,data.layers[state.group]).replace(/^\d+\s*·\s*/,""):a.kind+" · "+a.scope);inspector.append(tag);
  inspector.append($("div","stake-person",isID()?(a.person_name||"Pimpinan perlu diverifikasi dari sumber resmi"):(a.lead||"Leadership to verify")));
  inspector.append($("h4",null,"Responsibility"),$("p",null,actorRole(data,a)||"Role under review"));
  inspector.append($("h4",null,"Decision authority"),$("p",null,isID()?"Mandat dan batas kewenangan mengikuti aturan lembaga. Baca dokumen resmi pada tautan di bawah profil serta peran yang dijelaskan di atas.":a.authority||"Institutional scope; actual mandate must be verified."));
  inspector.append($("div","stake-date",(isID()?"Tanggal sumber: ":"Source reference: ")+(a.verified||(isID()?"tidak diketahui":"undated"))+(isID()?" · Status pejabat perlu dicek kembali pada dokumen asli":" · "+(a.evidence_status||a.verification_status||"Monitor appointment status"))));
  if(a.source)inspector.append(panelLink(a.source,"Official appointment / institutional source ↗"));
  if(a.latest_source&&a.latest_source!==a.source)inspector.append(panelLink(a.latest_source,"Later official leadership confirmation ↗"));
  const references=(a.connections||[]).filter(v=>find(v));
  if(references.length){
   inspector.append($("h4",null,"Related stakeholders"));
   const links=$("div","stake-quick-links");
   references.slice(0,6).forEach(v=>{
    const b=$("button","stake-quick",v);b.type="button";b.addEventListener("click",()=>goActor(v));links.append(b);
   });inspector.append(links);
  }
  const back=$("button","stake-action stake-action-ghost","← Back to "+titles[state.group][0]);
  back.type="button";back.addEventListener("click",()=>{state.selected="";draw()});inspector.append(back);
 }
 function paintIssuePanel(r){
  const keys=[
   ["Strategic direction",energyStage(routes.indexOf(r),0,r.strategic)],
   ["Regulator & budget",energyStage(routes.indexOf(r),1,r.regulators)],
   ["Operator / assets",energyStage(routes.indexOf(r),2,r.operators)],
   ["DPR / DPD oversight",energyStage(routes.indexOf(r),3,r.oversight)],
   ["Regional implementation",energyStage(routes.indexOf(r),4,r.regional)]
  ];
  const i=Math.max(0,Math.min(state.issueStep,keys.length-1));
  inspector.append($("div","stake-eyebrow","POLICY ACCOUNTABILITY LENS"));
  inspector.append($("h3",null,energyIssue(routes.indexOf(r),"issue",r.issue)));
  inspector.append($("span","stake-role-badge",(i+1)+" / 5 · "+keys[i][0]));
  inspector.append($("p","stake-issue-read",keys[i][1]));
  const nav=$("div","stake-issue-nav");
  keys.forEach(([label],j)=>{
   const b=$("button","stake-issue-dot",String(j+1));b.type="button";
   if(j===i)b.classList.add("active");b.setAttribute("aria-label","Inspect "+label);
   b.addEventListener("click",()=>{state.issueStep=j;draw()});nav.append(b);
  });inspector.append(nav);
  inspector.append($("h4",null,"SLI analytical test"),$("p",null,energyIssue(routes.indexOf(r),"assessment",r.assessment)));
  inspector.append($("p","stake-date","Issue pathway reflects functional responsibilities, not statutory command relationships."));
 }
 function renderDirectory(){
  if(!details.open)return;
  directory.replaceChildren();
  const list=state.mode==="layer"?[{layer:data.layers[state.group],idx:state.group}]:data.layers.map((layer,idx)=>({layer,idx}));
  list.forEach(({layer,idx})=>{
   const group=$("div","stake-dir-group");group.append($("h4",null,layer.title));
   const buttons=$("div","stake-dir-actors");
   layer.actors.forEach(a=>{
    const b=$("button","stake-dir-button",a.name);b.type="button";
    b.addEventListener("click",()=>goActor(a.name));buttons.append(b);
   });
   group.append(buttons);directory.append(group);
  });
 }
 details.addEventListener("toggle",renderDirectory);
 function draw(){
  Object.entries(tabRefs).forEach(([mode,el])=>{
   el.classList.toggle("selected",state.mode===mode);
   el.setAttribute("aria-pressed",String(state.mode===mode));
  });
  groupSelect.value=String(state.group);groupSelect.hidden=state.mode!=="layer";
  issueSelect.value=String(state.issue);issueSelect.hidden=state.mode!=="issue";
  const isOverview=state.mode==="overview";
  const isLayer=state.mode==="layer";
  const isIssue=state.mode==="issue";
  const title=isOverview?"National decision and influence systems":isLayer?
    energyLayerTitle(state.group,data.layers[state.group]).replace(/^\d+\s*·\s*/,""):routes[state.issue]?.issue||"Issue lens";
  plotTitle.replaceChildren($("strong",null,title),$("span",null,isOverview?"6 clickable branches":isLayer?"Select one of "+data.layers[state.group].actors.length+" actor nodes":"Five accountability stages"));
  const svg=createSvg(960,isOverview?560:isIssue?480:640,title);
  if(isOverview)overview(svg,data,i=>{state.mode="layer";state.group=i;state.selected="";draw()});
  if(isLayer)layerGraph(svg,data.layers[state.group],state.group,goActor,()=>{
   state.mode="overview";state.selected="";draw();
  },state.selected);
  if(isIssue&&routes.length)issueGraph(svg,routes,state.issue,i=>{state.issueStep=i;draw()});
  canvas.dataset.view=isLayer?"layer":isIssue?"issue":"overview";
  canvas.replaceChildren(svg);
  mobile.replaceChildren();
  const mobileOptions=isOverview?data.layers.map((layer,i)=>({
    label:titles[i].join(" ")+" · "+layer.actors.length,
    go:()=>{state.mode="layer";state.group=i;state.selected="";draw()}
   })):isLayer?data.layers[state.group].actors.map(a=>({
    label:a.name,go:()=>goActor(a.name)
   })):routes.length?[
    ["Strategic direction",0],["Rules / budget",1],["Operators",2],
    ["DPR / DPD oversight",3],["Regional implementation",4]
   ].map(([label,index])=>({label,go:()=>{state.issueStep=index;draw()}})):[];
  mobileOptions.forEach(({label,go})=>{
   const b=$("button","stake-mobile-button",label);b.type="button";
   b.addEventListener("click",go);mobile.append(b);
  });
  inspector.replaceChildren();
  if(isOverview)paintOverviewPanel();
  if(isLayer){
   const a=data.layers[state.group].actors.find(x=>x.name===state.selected);
   if(a)paintActorPanel(a);else paintGroupPanel(data.layers[state.group]);
  }
  if(isIssue)paintIssuePanel(routes[state.issue]);
  zoomHint.textContent=isOverview?"Six hubs only. Click any branch to drill down.":isLayer?
    "All "+data.layers[state.group].actors.length+" actors in this branch • select a node or search across all "+all.length:"Choose a stage for responsibilities and analytical checks";
  legend.replaceChildren();
  if(isOverview)data.layers.forEach((layer,i)=>{
   const b=$("button","stake-legend-key");b.type="button";
   const color=$("span","stake-legend-swatch");color.style.background=palette[i];
   b.append(color,document.createTextNode(titles[i].join(" ")));
   b.addEventListener("click",()=>{state.group=i;state.mode="layer";state.selected="";draw()});legend.append(b);
  });
  if(isLayer){
   const b=$("button","stake-legend-key","← All branches");b.type="button";
   b.addEventListener("click",()=>{state.mode="overview";state.selected="";draw()});legend.append(b);
   legend.append($("span","stake-legend-note","Lines indicate stakeholder membership in the selected influence cluster—not formal reporting."));
  }
  if(isIssue)legend.append($("span","stake-legend-note","DPR and DPD independent scrutiny are shown separately from regulatory / corporate execution."));
  if(details.open)renderDirectory();
 }
 results.hidden=true;draw();
 document.addEventListener?.("sli:languagechange",()=>{if(root.isConnected)window.renderSLIStakeholderMap(root,data,{...state});},{once:true});
};
})();