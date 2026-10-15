/* SLI editorial synthesis: seven connected analytical essays backed by dated, expandable evidence.
   News findings are NOT verified production losses or machine-generated conclusions. */
(function(){
"use strict";
const ROOT="energyOverallAssessment";
const E=(tag,cl,text)=>{const n=document.createElement(tag);if(cl)n.className=cl;if(text!==undefined&&text!==null)n.textContent=String(text);return n};
const lang=()=>window.SLIi18n?.language==="id"?"id":"en";
const local=(en,id)=>lang()==="id"?id:en;
const dateTime=iso=>{const d=new Date(iso);return Number.isFinite(d.getTime())?d.toLocaleString(lang()==="id"?"id-ID":"en-GB",{timeZone:"Asia/Jakarta",dateStyle:"medium",timeStyle:"short"})+" WIB":local("Date not available","Tanggal belum tersedia")};
const link=(url,label)=>{if(!/^https:\/\//.test(url||""))return null;const a=E("a",null,label||local("Original publication ↗","Sumber asli ↗"));a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
const pieces=[
 {id:"oil-gas",en:"Oil and gas: abundance is not the same as security",idTitle:"Migas: kelimpahan sumber daya belum tentu berarti ketahanan",
 enBody:[
 "Indonesia's resource endowment offers strategic room to manoeuvre, yet it cannot by itself guarantee a reliable flow of fuel and gas to households, industry or power plants. The harder question is whether discoveries are converted into production, how quickly mature fields can be replaced, and whether domestic refineries and distribution systems can serve changing demand.",
 "That distinction is especially important when interpreting reports of regional fuel shortages. A disruption at a terminal or in the last mile of delivery may have very different causes from a decline in national crude output. A sound energy-security assessment therefore follows the entire chain—from subsurface reserves and production to processing, storage and delivery."
 ],idBody:[
 "Kekayaan minyak dan gas memberi Indonesia ruang strategis, tetapi besarnya cadangan tidak otomatis menjamin BBM dan gas tersedia di rumah tangga, industri, maupun pembangkit. Pertanyaan yang lebih menentukan adalah seberapa cepat temuan cadangan baru masuk tahap produksi, sejauh mana penurunan lapangan tua dapat diimbangi, dan apakah kilang serta jaringan distribusi mampu mengikuti perubahan kebutuhan.",
 "Pembedaan ini penting ketika muncul kabar kelangkaan BBM di suatu wilayah. Masalah terminal atau distribusi akhir tidak selalu berakar pada penurunan produksi minyak nasional. Karena itu, ketahanan pasokan perlu dibaca sebagai satu rantai: cadangan, produksi, pengolahan, penyimpanan, dan penyaluran."
 ]},
 {id:"geopolitics",en:"External shocks travel through prices before they reach the pump",idTitle:"Guncangan eksternal sering menjalar melalui harga sebelum mencapai SPBU",
 enBody:[
 "Indonesia's exposure to imported petroleum makes distant events economically relevant even when domestic facilities remain operational. A conflict around maritime chokepoints can alter freight, insurance and price expectations, while exchange-rate movements determine how those costs translate into rupiah. What appears at first to be a geopolitical incident may therefore become a question of fiscal space, fuel affordability and industrial competitiveness.",
 "Nevertheless, a reported attack or change in vessel routing is not proof that an oil field has stopped producing or a shipping lane has closed. The causal chain must be verified through physical movements, confirmed outages and dated market observations. The distinction between a risk premium and a measurable loss of supply is central to responsible monitoring."
 ],idBody:[
 "Ketergantungan pada minyak bumi impor membuat peristiwa yang terjadi jauh dari Indonesia tetap relevan secara ekonomi, bahkan ketika seluruh fasilitas domestik beroperasi normal. Konflik di jalur pelayaran dapat mengubah biaya angkut, premi asuransi, dan ekspektasi harga; pergerakan rupiah kemudian menentukan besarnya tekanan tersebut dalam biaya energi nasional. Persoalan geopolitik pun dapat berkembang menjadi tekanan terhadap ruang fiskal, keterjangkauan BBM, dan daya saing industri.",
 "Namun, laporan serangan atau pengalihan rute kapal bukan bukti bahwa ladang minyak berhenti berproduksi atau selat strategis telah ditutup. Rantai sebab-akibat itu harus diuji melalui pergerakan fisik komoditas, gangguan yang terkonfirmasi, dan data pasar bertanggal. Premi risiko berbeda dari kehilangan pasokan yang benar-benar terukur."
 ]},
 {id:"coal",en:"Coal provides a buffer, but also creates competing obligations",idTitle:"Batubara memberi bantalan ketahanan sekaligus menghadirkan kepentingan yang bersaing",
 enBody:[
 "Coal remains an important pillar of domestic power security while also generating export revenue. These two roles can pull policy in different directions: electricity supply needs predictable domestic deliveries, whereas export opportunities expose producers to international demand and pricing. Production totals alone reveal little about whether coal of the right quality reaches the right plant when it is needed.",
 "The more useful questions concern actual domestic market obligation deliveries, stock adequacy, logistics and the changing economics of coal-fired generation. Over the longer term, any transition strategy must reconcile near-term system reliability with the financial and environmental costs of maintaining a large coal fleet."
 ],idBody:[
 "Batubara masih menjadi salah satu penyangga utama keamanan pasokan listrik sekaligus sumber penerimaan ekspor. Kedua fungsi itu tidak selalu bergerak searah: pembangkit memerlukan pasokan domestik yang dapat diprediksi, sementara peluang ekspor mengikuti permintaan dan harga internasional. Jumlah produksi nasional saja belum menjawab apakah batubara dengan kualitas tepat benar-benar sampai ke pembangkit pada saat dibutuhkan.",
 "Karena itu, perhatian perlu diarahkan pada realisasi DMO, kecukupan stok, logistik, dan keekonomian pembangkit berbahan bakar batubara. Dalam jangka panjang, kebijakan transisi juga harus menyeimbangkan keandalan sistem saat ini dengan biaya finansial serta lingkungan dari ketergantungan terhadap PLTU."
 ]},
 {id:"power",en:"The next industrial constraint may be delivery, not generation",idTitle:"Kendala industri berikutnya bisa terletak pada penyaluran, bukan pembangkitan",
 enBody:[
 "The expansion of smelters, data centres and industrial estates has raised the economic importance of electricity reliability. A national capacity figure is useful, but it does not establish whether power is available at the exact location, quality and hour required by industry. Transmission bottlenecks, reserve margins, voltage stability and restoration times can matter as much as new megawatts.",
 "For this reason, a blackout should be examined locally before it becomes a national headline about energy insecurity. What matters is the verified cause, duration and affected load, together with the speed of restoration. Electrification coverage is also not identical to continuous, affordable and reliable service."
 ],idBody:[
 "Bertambahnya smelter, pusat data, dan kawasan industri membuat keandalan listrik semakin menentukan daya saing ekonomi. Angka kapasitas nasional memang penting, tetapi tidak menjamin listrik tersedia di lokasi, kualitas, dan jam yang diperlukan industri. Hambatan transmisi, cadangan daya, kestabilan tegangan, dan waktu pemulihan dapat sama pentingnya dengan pembangunan pembangkit baru.",
 "Karena itu, pemadaman di satu daerah sebaiknya dianalisis secara lokal sebelum dijadikan kesimpulan tentang kerentanan sistem nasional. Penyebab yang terkonfirmasi, lamanya gangguan, beban terdampak, dan kecepatan pemulihan lebih bermakna daripada judul berita semata. Rasio elektrifikasi yang tinggi pun tidak otomatis berarti layanan listrik sudah andal dan terjangkau sepanjang waktu."
 ]},
 {id:"transition",en:"The transition will be judged by operating assets, not announcements",idTitle:"Keberhasilan transisi akan ditentukan aset yang beroperasi, bukan pengumuman",
 enBody:[
 "Indonesia's transition challenge is increasingly one of execution rather than ambition. New renewable capacity, storage systems and regional energy plans matter only to the extent that financing, construction, grid connections and commercial operations turn plans into measurable supply. The gap between a proposed project and its actual contribution to the power system deserves closer attention than the headline investment value.",
 "New technologies bring additional trade-offs. Biodiesel blending can reduce reliance on imported diesel, but shifts attention towards palm-oil feedstock, logistics and financing. Electric-vehicle adoption may reduce demand for petroleum, while increasing demands on power networks and battery supply chains. These initiatives strengthen resilience only when their implementation and lifecycle impacts can be demonstrated."
 ],idBody:[
 "Tantangan transisi energi Indonesia semakin bergeser dari ambisi menuju pelaksanaan. Kapasitas EBT, penyimpanan energi, dan rencana energi daerah baru bermakna apabila pembiayaan, konstruksi, koneksi jaringan, serta operasi komersial benar-benar menghasilkan pasokan yang terukur. Jarak antara proyek yang diumumkan dan kontribusinya terhadap sistem energi patut diperhatikan lebih serius daripada nilai investasi di atas kertas.",
 "Teknologi baru juga membawa pertukaran risiko. Pencampuran biodiesel dapat mengurangi ketergantungan pada solar impor, tetapi memperbesar perhatian terhadap bahan baku sawit, logistik, dan pendanaan. Adopsi kendaraan listrik dapat menekan kebutuhan minyak bumi, namun meningkatkan tuntutan terhadap jaringan listrik dan rantai pasok baterai. Manfaat ketahanannya perlu dibuktikan melalui implementasi dan dampak sepanjang siklus hidup."
 ]},
 {id:"carbon",en:"Avoided emissions and actual emissions tell different stories",idTitle:"Emisi yang dihindari dan emisi aktual menceritakan dua hal berbeda",
 enBody:[
 "Energy-transition progress should not be measured solely by mitigation claims or capacity targets. An avoided-emissions estimate describes an intervention relative to a counterfactual baseline; the national greenhouse-gas inventory records what was actually emitted under a defined methodology. Both can inform decisions, but they answer different questions and must not be added together as if they were interchangeable.",
 "The same discipline applies to forest fires and environmental incidents. A fire may affect land-use emissions, air quality and access to infrastructure, yet an energy-system outage requires separate evidence. Credible progress toward net zero depends on consistent inventories, verifiable operating projects and a clear account of what changed from one reporting year to the next."
 ],idBody:[
 "Kemajuan transisi tidak cukup diukur dari klaim penurunan emisi atau target kapasitas. Estimasi emisi yang berhasil dihindari membandingkan intervensi dengan kondisi hipotetis tanpa intervensi; sementara inventarisasi gas rumah kaca mencatat emisi aktual berdasarkan metodologi tertentu. Keduanya bermanfaat, tetapi menjawab pertanyaan berbeda dan tidak boleh disamakan.",
 "Disiplin ini juga berlaku untuk kebakaran hutan dan insiden lingkungan. Kebakaran dapat memengaruhi emisi dari penggunaan lahan, kualitas udara, dan akses infrastruktur, tetapi gangguan pasokan energi memerlukan bukti tersendiri. Kemajuan menuju net zero harus ditopang inventarisasi konsisten, proyek yang benar-benar beroperasi, serta penjelasan jernih tentang perubahan antartahun."
 ]},
 {id:"policy",en:"Institutional coordination is the real test of energy policy",idTitle:"Koordinasi antarlembaga menjadi ujian sesungguhnya bagi kebijakan energi",
 enBody:[
 "The energy agenda reaches across ministries, regulators, state-owned enterprises, regional governments and legislative oversight. National targets establish direction, but outcomes depend on which institution is accountable for permits, financing, grid delivery, infrastructure operation and enforcement. Treating all institutions as one chain of command obscures those responsibilities.",
 "The standard of evidence therefore matters as much as the ambition of a policy. A draft is not an enacted rule; a financing agreement is not expenditure; and construction does not guarantee an operating plant. The strongest near-term measure of progress is the ability to connect decisions to verified milestones, measured outputs and accountable institutions."
 ],idBody:[
 "Agenda energi melibatkan kementerian, regulator, BUMN, pemerintah daerah, dan fungsi pengawasan legislatif. Target nasional menunjukkan arah, tetapi hasil akhirnya bergantung pada kejelasan pihak yang bertanggung jawab atas izin, pembiayaan, jaringan listrik, operasi infrastruktur, dan penegakan aturan. Menganggap seluruh lembaga berada dalam satu garis komando justru mengaburkan pembagian kewenangan.",
 "Karena itu, kualitas bukti sama pentingnya dengan ambisi kebijakan. Draf belum tentu menjadi peraturan; kesepakatan pembiayaan bukan realisasi investasi; dan konstruksi tidak otomatis berarti fasilitas sudah beroperasi. Kemajuan paling berguna untuk dipantau adalah hubungan yang dapat dibuktikan antara keputusan, tonggak implementasi, hasil terukur, dan lembaga penanggung jawab."
 ]}
];
const lead={
 en:"Indonesia's energy security is best understood as a question of conversion: how effectively natural resources become reliable services, how policy commitments become operating assets, and how global disturbances translate into domestic prices and risks. Its strengths are substantial, but they coexist with imported-fuel exposure, a geographically uneven power system and the cost of delivering a complex energy transition. The seven themes below connect these pressures rather than treating each statistic as a separate verdict.",
 id:"Ketahanan energi Indonesia pada dasarnya merupakan persoalan kemampuan mengubah potensi menjadi hasil: bagaimana sumber daya menjadi layanan energi yang andal, bagaimana komitmen kebijakan berubah menjadi aset yang beroperasi, dan bagaimana gangguan global menjalar ke biaya serta risiko domestik. Indonesia memiliki sejumlah kekuatan, tetapi juga menghadapi ketergantungan BBM impor, ketimpangan keandalan kelistrikan antarwilayah, dan mahalnya pelaksanaan transisi energi. Tujuh pembahasan berikut menghubungkan persoalan-persoalan tersebut dalam satu gambaran strategis."
};
let cached=null;
function sources(parent,list){
 if(!Array.isArray(list)||!list.length)return;
 const box=E("div","oa-daily-sources");box.append(E("strong",null,local("Evidence: ","Sumber: ")));
 list.slice(0,5).forEach((x,i)=>{const url=link(x.url,x.label||local("Publication ↗","Publikasi ↗"));if(url){if(i)box.append(document.createTextNode(" · "));box.append(url)}});
 parent.append(box);
}
function evidence(panel,point){
 const details=E("details","oa-evidence"),title=E("summary",null,local("View dated figures, verification tests and source leads","Buka angka acuan, pengujian, dan sumber berita"));
 details.append(title);
 const inner=E("div");
 if(point){
  if(point.finding){const p=E("p","oa-fact",point.finding);inner.append(p)}
  if(point.verification_priority)inner.append(E("p","oa-verification",local("What to verify next: ","Hal yang perlu diverifikasi: ")+point.verification_priority));
  sources(inner,point.baseline_sources);
  const leads=Array.isArray(point.recent_news_leads)?point.recent_news_leads.filter(x=>x.url&&x.title):[];
  if(leads.length){
   inner.append(E("p","oa-note",local("Monitored headlines are attributable discovery leads, not verified operational impacts.","Berita yang terpantau baru merupakan temuan bersumber, bukan dampak operasional yang telah diverifikasi.")));
   const list=E("div","oa-daily-leads");
   leads.slice(0,2).forEach(x=>{const row=E("div","oa-daily-headline"),a0=link(x.url,x.title+" ↗");if(a0)row.append(a0,E("div","oa-daily-meta",(x.publisher||local("Source","Sumber"))+" · "+dateTime(x.published_at_utc)));list.append(row)});
   inner.append(list);
  }
 }else inner.append(E("p","oa-note",local("Source observations are temporarily unavailable; this is an editorial interpretation, not a newly verified daily report.","Pengamatan sumber sementara tidak tersedia; pembahasan ini adalah interpretasi editorial, bukan laporan harian yang baru diverifikasi.")));
 details.append(inner);panel.append(details);
}
function render(root,data,error){
 root.replaceChildren();
 const stamp=data?.generated_at_utc?dateTime(data.generated_at_utc):local("Date unavailable","Tanggal belum tersedia");
 const section=E("div","section"),heading=E("h2",null,local("Indonesia Energy Security: Strategic Assessment","Ketahanan Energi Indonesia: Penilaian Strategis"));
 heading.id="energy-overall-heading";section.append(heading,E("span",null,(data?local("Research synthesis refreshed ","Sintesis riset diperbarui "):local("Editorial reference · ","Acuan editorial · "))+stamp));root.append(section);
 const intro=E("p","oa-intro oa-story",lead[lang()]);root.append(intro);
 if(error)root.append(E("p","oa-daily-fallback",local("The latest machine-readable assessment could not be loaded. The synthesis below is a source-vintaged editorial baseline, not a fresh daily finding.","Data penilaian otomatis terbaru tidak dapat dimuat. Analisis di bawah adalah acuan editorial bertanggal, bukan temuan harian baru.")));
 if(data){
  const age=(Date.now()-new Date(data.generated_at_utc).getTime())/36e5;
  const hint=E("p","oa-editorial-meta",local("Verified statistics remain tied to their published reference years. Automatic news scans surface potential changes; they do not verify events.","Statistik terverifikasi selalu mengikuti tahun rujukan resmi. Pemindaian berita menunjukkan kemungkinan perkembangan, bukan verifikasi kejadian."));
  if(age>36)hint.append(E("strong","oa-daily-stale",local(" · Assessment is older than 36 hours."," · Assessment telah lebih dari 36 jam.")));
  root.append(hint);
 }
 const byId=new Map(Array.isArray(data?.points)?data.points.map(p=>[p.id,p]):[]);
 const list=E("ol","oa-list");
 pieces.forEach((x,i)=>{const li=E("li","oa-daily-point"),top=E("div","oa-overline",String(i+1).padStart(2,"0")+" · "+local("Strategic finding","Temuan strategis"));li.append(top,E("h3",null,lang()==="id"?x.idTitle:x.en));const body=lang()==="id"?x.idBody:x.enBody;body.forEach(p=>li.append(E("p","oa-story",p)));evidence(li,byId.get(x.id));list.append(li)});
 root.append(list);
 const footer=E("div","oa-footer");
 footer.append(E("strong",null,local("What to watch next","Apa yang perlu dipantau berikutnya")));
 footer.append(E("p",null,local("Prioritise confirmed oil and gas deliveries, refinery and grid reliability, coal DMO consistency, renewable commissioning, provincial-plan execution, actual greenhouse-gas inventories and verified regulatory instruments. Treat each new headline as a question to test, not a conclusion.","Prioritaskan realisasi pasokan minyak dan gas, keandalan kilang serta jaringan listrik, konsistensi DMO batubara, proyek EBT yang mulai beroperasi, pelaksanaan rencana energi daerah, inventarisasi emisi aktual, dan regulasi yang telah berlaku. Perlakukan judul berita baru sebagai pertanyaan untuk diuji, bukan kesimpulan.")));
 footer.append(E("p","oa-note",local("Analytical interpretation, not a real-time risk score, investment recommendation or operational certification.","Interpretasi analitis, bukan skor risiko langsung, rekomendasi investasi, atau sertifikasi kondisi operasi.")));
 root.append(footer);
}
window.initDailyEnergyAssessment=async function(){
 const root=document.getElementById(ROOT);if(!root)return;
 if(cached){render(root,cached,false);return}
 root.replaceChildren(E("p","oa-intro",local("Loading dated strategic assessment…","Memuat penilaian strategis bertanggal…")));
 try{
  const response=await fetch("data/daily-energy-assessment.json",{cache:"no-store"});
  if(!response.ok)throw Error("feed absent");
  const d=await response.json();
  if(!Array.isArray(d.points)||d.points.length!==7||!d.generated_at_utc)throw Error("unexpected assessment format");
  cached=d;render(root,d,false);
 }catch(e){render(root,null,true)}
};
document.addEventListener("sli:languagechange",()=>{const root=document.getElementById(ROOT);if(root)render(root,cached,!cached)});
})();
