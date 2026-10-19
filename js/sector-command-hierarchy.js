/* SLI source-dated TOP-DOWN institutional / corporate organization explorer */
(function(){"use strict";

const isId=()=>window.SLIi18n?.language==="id"||document.documentElement?.lang==="id";
const T=(en,id)=>isId()?id:en;
/* Curated platform copy: translated at render time, never modify original official sources. */
const UI_ID={
"Original source ↗":"Sumber asli ↗","No verified source":"Sumber belum terverifikasi",
"National direction":"Arahan nasional","Sector policy":"Kebijakan sektor","Presidential advisory":"Penasihat presiden",
"DEN administrative support":"Dukungan administrasi DEN","Regional administration & RUED":"Pemerintahan daerah & RUED",
"Investment-zone functional interface":"Hubungan fungsional kawasan investasi","Coordinating ministry":"Kementerian koordinator",
"National development planning":"Perencanaan pembangunan nasional","Administrative reporting":"Pelaporan administratif",
"State portfolio":"Portofolio BUMN","Shareholding / member":"Kepemilikan saham / anggota",
"Minority investment / associate":"Investasi minoritas / entitas asosiasi",
"Independent constitutional oversight":"Pengawasan konstitusional independen","Research / applied innovation":"Riset / inovasi terapan",
"Functional demand interface":"Hubungan fungsional kebutuhan","Joint venture / cross-holding":"Usaha patungan / kepemilikan silang",
"Independent commercial market":"Pasar komersial independen","Cybersecurity":"Keamanan siber",
"Loading verified institutional and corporate hierarchy…":"Memuat struktur lembaga dan perusahaan yang diverifikasi…",
"INSTITUTIONAL & CORPORATE COMMAND STRUCTURE":"STRUKTUR KELEMBAGAAN DAN KEPEMILIKAN PERUSAHAAN",
"Government · Danantara & SOEs · Private Sector":"Pemerintah · Danantara & BUMN · Sektor Swasta",
"Three separate systems: public institutions, state corporate portfolios and independent domestic/foreign investors. The Presidency anchors public-sector authority; corporate ownership is not regulatory command.":"Terdapat tiga sistem berbeda: lembaga publik, kelompok perusahaan negara, serta investor swasta dalam dan luar negeri. Presiden memimpin kewenangan pemerintahan; kepemilikan perusahaan bukan kewenangan pengaturan.",
"Expand all":"Buka semua","Collapse all":"Tutup semua","Find people, directorates, companies…":"Cari tokoh, direktorat, perusahaan…",
"Search the hierarchy":"Cari dalam struktur kelembagaan",
"All sectors · grouped":"Semua sektor · berkelompok","Government & public institutions":"Pemerintah & lembaga publik",
"Public policy & regulators":"Kebijakan publik & regulator","Danantara / BUMN":"Danantara / BUMN",
"BRIN / research / defence":"BRIN / riset / pertahanan","Private (all)":"Semua swasta",
"Private · Indonesia":"Swasta · Indonesia","Private · foreign":"Swasta · asing","Private · cross-border JVs":"Swasta · usaha patungan lintas negara",
"Official leadership source watch: awaiting the next dated source scan.":"Pemantauan sumber pejabat: menunggu pemeriksaan sumber berikutnya.",
"Official leadership source verification and research notes are available within this Energy Security institution panel. The two views use the same source-dated governance data.":"Pemeriksaan sumber resmi pejabat dan catatan penelitian tersedia pada panel kelembagaan Ketahanan Energi. Kedua tampilan menggunakan data tata kelola dengan tanggal sumber yang sama.",
"Leadership roster source monitoring is configured but has not completed its first scan. Names are source-dated, not live confirmed.":"Pemantauan daftar pejabat telah diatur tetapi pemeriksaan pertama belum selesai. Nama merujuk tanggal sumber, bukan konfirmasi langsung saat ini.",
"Leadership source scanner status temporarily unavailable; original links remain visible.":"Status pemeriksaan sumber pejabat sementara tidak tersedia; tautan sumber asli tetap dapat dibuka.",
"Reported shareholding and direct official reporting must not be conflated with coordination or related-industry links.":"Kepemilikan saham dan hubungan pelaporan resmi tidak boleh disamakan dengan koordinasi atau keterkaitan industri.",
"SOURCE-DATED ACTOR PROFILE":"PROFIL LEMBAGA BERDASARKAN TANGGAL SUMBER",
"Named incumbent is not independently verified in this register.":"Pejabat yang menjabat belum diverifikasi secara independen dalam registri ini.",
"View original institutional or issuer source ↗":"Lihat sumber resmi lembaga atau penerbit ↗",
"DOMESTIC PRIVATE · INDONESIA":"SWASTA DOMESTIK · INDONESIA",
"FOREIGN PRIVATE · INTERNATIONAL":"SWASTA ASING · INTERNASIONAL",
"MIXED OWNERSHIP & CROSS-BORDER JVs":"KEPEMILIKAN CAMPURAN & USAHA PATUNGAN INTERNASIONAL",
"Indonesian-headquartered private and listed businesses. Individual project JVs must still be checked.":"Perusahaan swasta dan emiten yang berkantor pusat di Indonesia. Status masing-masing usaha patungan proyek tetap harus diperiksa.",
"Foreign-headquartered companies and providers. Local incorporation does not make the parent Indonesian-owned.":"Perusahaan dan penyedia berkantor pusat di luar negeri. Pendirian badan hukum lokal tidak berarti induknya milik Indonesia.",
"Joint ventures and companies with mixed domestic/foreign shareholding, kept separate from purely domestic or foreign parents.":"Perusahaan patungan dengan pemegang saham domestik dan asing, dipisahkan dari perusahaan dengan kepemilikan tunggal.",
"01 · PUBLIC INSTITUTIONS":"01 · LEMBAGA PUBLIK",
"02 · PUBLIC CORPORATE PORTFOLIO":"02 · PORTOFOLIO PERUSAHAAN NEGARA",
"03 · COMMERCIAL MARKET":"03 · PASAR KOMERSIAL",
"GOVERNMENT · POLICY & PUBLIC INSTITUTIONS":"PEMERINTAH · KEBIJAKAN & LEMBAGA PUBLIK",
"Public advisory → coordination → ministries → execution. DEN Secretariat is administratively linked to ESDM and functionally to DEN. Provincial autonomy is preserved under Kemendagri guidance; BP Batam has a separate legal mandate and is not subordinate to BP BUMN. DPR/BPK exercise independent oversight.":"Penasihat publik → koordinasi → kementerian → pelaksanaan. Sekretariat Jenderal DEN terhubung secara administratif dengan ESDM dan secara fungsional dengan DEN. Otonomi daerah tetap berlaku meskipun Kemendagri melakukan pembinaan. BP Batam memiliki kewenangan hukum sendiri, bukan bawahan BP BUMN. DPR dan BPK melakukan pengawasan independen.",
"Independent parliamentary & financial oversight":"Pengawasan parlemen dan keuangan independen",
"DPR RI and BPK RI are NOT directorates under the President or ministers.":"DPR RI dan BPK RI bukan direktorat di bawah Presiden atau kementerian.",
"DANANTARA · STATE-OWNED ENTERPRISES":"DANANTARA · BADAN USAHA MILIK NEGARA",
"Corporate portfolio and equity relationships are shown separately from government regulatory mandates. MIND ID group members, DSI, Telkom and other state-linked companies have different legal roles.":"Portofolio perusahaan dan hubungan kepemilikan saham dipisahkan dari kewenangan regulator pemerintah. Anggota MIND ID, DSI, Telkom dan perusahaan terkait negara lain memiliki peran hukum berbeda.",
"PRIVATE SECTOR · DOMESTIC & FOREIGN":"SEKTOR SWASTA · DALAM & LUAR NEGERI",
"Commercial companies and corporate nationality are separated from the government and Danantara/BUMN organizational chart. Connections to the state are regulatory or contractual, not statutory subordination.":"Perusahaan komersial dan negara asal kepemilikannya dipisahkan dari bagan pemerintah serta Danantara/BUMN. Hubungannya dengan negara bersifat regulasi atau kontraktual, bukan hubungan bawahan berdasarkan undang-undang.",
"GOVERNMENT · HEAD OF STATE / EXECUTIVE DIRECTION":"PEMERINTAH · KEPALA NEGARA / ARAHAN EKSEKUTIF",
"STATE PORTFOLIO · OWNERSHIP / INVESTMENT":"PORTOFOLIO NEGARA · KEPEMILIKAN / INVESTASI",
"Hierarchy data cannot be loaded. The Energy-style institutional network remains available below.":"Data struktur belum dapat dimuat. Jaringan kelembagaan alternatif masih tersedia di bagian bawah."
};
function ui(s){if(!isId()||s==null)return s;let v=String(s);if(Object.prototype.hasOwnProperty.call(UI_ID,v))return UI_ID[v];v=v.replace(/^(\d+) mapped entities$/,"$1 entitas terpetakan").replace(/^Matching actors · (\d+)$/,"Tokoh atau lembaga cocok · $1").replace(/^(\d+) subordinate \/ linked entities$/,"$1 entitas bawahan / terkait");return v;}

const el=(tag,cl,text)=>{const x=document.createElement(tag);if(cl)x.className=cl;if(text!==undefined)x.textContent=ui(text);return x};
const link=(url,label)=>{const a=el("a","sli-hier-link",label||"Original source ↗");if(/^https:\/\//.test(url||"")){a.href=url;a.target="_blank";a.rel="noopener noreferrer"}else{a.textContent="No verified source"}return a};
const typeName={root:"National direction",policy:"Sector policy",advisory:"Presidential advisory",administrative:"DEN administrative support", "local-government":"Regional administration & RUED","zone-interface":"Investment-zone functional interface",coordination:"Coordinating ministry",planning:"National development planning",reporting:"Administrative reporting",portfolio:"State portfolio",equity:"Shareholding / member",minority:"Minority investment / associate",oversight:"Independent constitutional oversight",research:"Research / applied innovation","strategic-interface":"Functional demand interface","joint-venture":"Joint venture / cross-holding",market:"Independent commercial market","security":"Cybersecurity"};

/* Publisher source names remain intact. Indonesian summaries are curated,
 * explicit and not asserted as direct translations of official source texts. */
const ENERGY_ROLE_ID=[
["Menetapkan arah kebijakan dan prioritas ketahanan energi nasional selaku Presiden dan Ketua DEN; bukan operator langsung fasilitas.",
"Memberikan pertimbangan strategis kepada Presiden mengenai kebijakan dan pilihan energi; tidak mengeluarkan izin proyek.",
"Menyiapkan administrasi, rapat, koordinasi dan kajian DEN; bertanggung jawab secara fungsional kepada DEN dan administratif kepada Menteri ESDM.",
"Mengoordinasikan kementerian terkait hilirisasi dan transisi energi. Menko juga menjabat Menteri ESDM pada periode yang tercatat.",
"Menetapkan kebijakan dan mengawasi sektor listrik, migas, EBT, mineral, serta CCS/CCUS sesuai kewenangan peraturan.",
"Menangani APBN, subsidi, kompensasi, insentif perpajakan dan risiko fiskal; bukan operator fasilitas energi.",
"Menyusun arah pembangunan nasional, target dan penyelarasan RPJMN dengan pembiayaan serta infrastruktur energi.",
"Memfasilitasi persetujuan dan promosi investasi; perizinan teknis energi tetap mengikuti ketentuan ESDM.",
"Menangani kebutuhan listrik industri, manufaktur strategis, hilirisasi dan dekarbonisasi sektor industri.",
"Menangani perlindungan lingkungan, persetujuan dampak, dan pengawasan pencemaran; mandatnya berbeda dari pengaturan teknis penyimpanan karbon.",
"Menangani perlindungan dan perizinan kawasan hutan yang berkaitan dengan energi panas bumi, air, biomassa dan jaringan.",
"Membina pemerintahan daerah, RUED dan pertautan perizinan lokal dengan kebijakan nasional tanpa menghapus otonomi daerah.",
"Menangani keselamatan pelabuhan, pelayaran BBM/LNG, transportasi dan logistik energi."],
["BP BUMN menjalankan fungsi pengaturan dan pengawasan BUMN serta hak khusus saham Seri A Dwiwarna negara berdasarkan UU 16/2025; berbeda dari pengelolaan komersial Danantara.",
"Ditjen Migas mengatur kegiatan migas, aspek teknis hulu, kebijakan komersial serta aturan CCS/CCUS sesuai mandat ESDM.",
"Ditjen EBTKE mengurus energi terbarukan, bioenergi dan konservasi; target rencana harus dibedakan dari pembangkit beroperasi.",
"Ditjen Ketenagalistrikan mengatur penyediaan tenaga listrik, tarif dan pengawasan sektor; PLN dan pengembang menjalankan aset.",
"Ditjen Minerba menangani izin pertambangan, penerimaan/royalti, perencanaan produksi, harga acuan serta DMO.",
"Badan Geologi memetakan sumber daya, panas bumi dan data bawah permukaan untuk menilai lokasi penyimpanan CO₂.",
"SKK Migas mengelola kontrak kerja sama hulu (KKS/PSC) dan mengawasi pelaksanaan oleh KKKS.",
"BPH Migas mengatur dan mengawasi penyaluran BBM, kuota BBM tertentu serta pengangkutan gas melalui pipa; berbeda dari SKK Migas.",
"BPMA melaksanakan pengelolaan kegiatan hulu migas Aceh sesuai pengaturan kelembagaan khususnya.",
"BAPETEN mengawasi keselamatan nuklir dan radiasi secara independen; berbeda dari lembaga riset.",
"BRIN melakukan penelitian sistem energi, nuklir, dan inovasi; bukan badan pemberi izin pembangkit nuklir.",
"LEMIGAS memberi pengujian dan bukti teknis terkait reservoir, migas dan penyimpanan karbon; kajian bukan bukti bahwa proyek sudah layak secara komersial."],
["PLN mengelola pembangkitan, transmisi, distribusi, pengadaan dan pelayanan listrik. Profil pimpinan memerlukan verifikasi tanggal sumber.",
"Pertamina mengelola kelompok usaha migas, BBM, investasi energi, serta pengawasan perusahaan anak dan subholding.",
"Pertamina Patra Niaga menjalankan usaha hilir termasuk BBM, distribusi, perdagangan, ritel, dan logistik setelah restrukturisasi yang tercatat.",
"Pertamina Hulu Energi mengelola kegiatan hulu, eksplorasi, produksi, aset gas, investasi PSC dan akuisisi; regulasinya berada pada ESDM/SKK Migas.",
"Pertamina Hulu Indonesia menangani operasi hulu regional Kalimantan, produksi, pengeboran dan pengembangan.",
"Pertamina Geothermal Energy mengembangkan dan mengoperasikan proyek panas bumi; cek tahapan COD dan keputusan investasinya.",
"PLN Indonesia Power mengoperasikan dan mengembangkan pembangkit, termasuk kolaborasi energi terbarukan dalam grup PLN.",
"PLN Energi Primer Indonesia mengelola rantai pasok batu bara, gas, biomassa dan energi primer untuk pembangkit PLN.",
"PGN mengelola transmisi dan distribusi gas, LNG dan infrastruktur gas domestik. Aliran jaringan bukan produksi hulu.",
"Geo Dipa mengembangkan proyek panas bumi terkait negara; status proyek dan investasi aktual harus dicek terpisah.",
"Danantara menangani kepentingan ekonomi dan portofolio investasi BUMN berdasarkan UU 16/2025; bukan regulator teknis sektor energi.",
"SMI dan lembaga pembiayaan publik menyalurkan pembiayaan proyek, pendanaan campuran, dan dukungan infrastruktur; bukan jumlah proyek yang diumumkan.",
"Kelompok pengembang swasta, IPP dan kontraktor EPC; ini kategori pelaku, bukan satu perusahaan atau anak usaha Danantara.",
"Danantara Sumberdaya Indonesia menjalankan fungsi perdagangan/fasilitasi komoditas seperti batu bara, CPO dan feropaduan; bukan badan izin ESDM.",
"Danantara Asset Management mengelola kinerja dan restrukturisasi portofolio perusahaan negara; berbeda dari regulator BUMN.",
"Danantara Investment Management menangani alokasi investasi dan pendanaan; komitmen harus dipisahkan dari dana yang sudah dicairkan.",
"Medco adalah perusahaan energi swasta Indonesia dengan kepentingan operasi hulu termasuk Natuna; kepemilikan tiap blok perlu ditelusuri.",
"ExxonMobil Cepu adalah kontraktor kegiatan hulu Cepu/Banyu Urip di bawah pengawasan SKK Migas; produksi diukur pada lapangan.",
"bp Indonesia menangani proyek gas/LNG termasuk Tangguh bersama mitra PSC; bukan bagian dari pengendalian Danantara.",
"INPEX Masela mengembangkan proyek Abadi LNG bersama mitra; perjanjian penjualan gas tidak membuktikan gas pertama sudah diproduksi.",
"Searah merupakan usaha patungan Eni–PETRONAS di wilayah Kutei; berita transaksi saham harus dibedakan dari penyelesaian transaksi.",
"Rukun Raharja merupakan kelompok swasta Indonesia dalam perdagangan gas industri, jaringan pipa dan kegiatan migas.",
"Harbour Energy memiliki kepentingan PSC Andaman sesuai perkembangan divestasi; wilayah Natuna/Tuna lama tidak boleh otomatis dihitung lagi.",
"Mubadala Energy adalah badan usaha energi milik negara asing yang berinvestasi dalam PSC Andaman; bukan regulator pemerintah Indonesia."],
["Komisi XII DPR RI mengawasi kebijakan energi, SDA, lingkungan dan investasi melalui fungsi legislasi, anggaran, dan pengawasan.",
"Komisi VI DPR RI mengawasi tata kelola dan kinerja BUMN, bukan pemberi izin sumber daya energi.",
"Komisi VII DPR RI mengawasi industri, hilirisasi dan daya saing manufaktur, bukan regulator teknis energi.",
"Komisi XI DPR RI menangani pengawasan fiskal, keuangan dan pembiayaan pembangunan yang berkaitan dengan subsidi energi.",
"Badan Anggaran DPR RI membahas APBN, subsidi dan kompensasi energi, ICP serta asumsi fiskal bersama pemerintah.",
"Badan Legislasi DPR RI melakukan harmonisasi dan perencanaan legislasi termasuk pembahasan aturan energi.",
"BPK RI melakukan pemeriksaan keuangan negara secara independen; temuannya berbeda dari pengawasan kebijakan kementerian."],
["DPD RI mewakili kepentingan daerah dalam kebijakan nasional, SDA, otonomi daerah dan pemerataan fiskal.",
"Komite II DPD RI membahas SDA, energi, infrastruktur dan lingkungan serta kepentingan daerah dalam kebijakan.",
"Komite IV DPD RI menangani pendapatan dan transfer daerah, DBH, royalti sumber daya dan kapasitas pembiayaan provinsi.",
"DPD RI menyampaikan pertimbangan tentang penyelarasan aturan daerah dan rancangan terkait SDA; bukan penerbit izin migas."],
["Pemerintah provinsi menjalankan RUED dan program energi daerah, koordinasi lokasi proyek dan izin sesuai kewenangan; otonomi daerah tetap berlaku.",
"BP Batam dan otoritas kawasan memfasilitasi lahan, infrastruktur serta investasi industri dan energi; BP Batam bukan bawahan hukum BP BUMN, meski ditempatkan sebagai penghubung pada bagan.",
"BNPB/BPBD menangani peringatan dan penanganan kebakaran, banjir serta gangguan infrastruktur; laporan bahaya tidak otomatis berarti aset energi terhenti.",
"BMKG menyediakan informasi cuaca, iklim dan peringatan ekstrem untuk menilai risiko banjir, kekeringan dan jaringan listrik.",
"Unit PLN daerah menangani penyaluran listrik, pemulihan gangguan dan logistik energi lokal; pemimpin korporasi pusat bukan pengganti penanggung jawab lapangan."]
];
function actorTitle(a){
 const original=String(a.title||"");
 if(!isId())return original;
 if(a.title_id)return a.title_id;
 return original.replace(/^Presidency \/ National Energy Council \(DEN\)$/,"Kepresidenan / Dewan Energi Nasional (DEN)")
 .replace(/^PRESIDENCY ·/,"KEPRESIDENAN ·")
 .replace(/Kementerian ESDM \/ Minister/g,"Kementerian ESDM / Menteri")
 .replace(/Ministry of National Development Planning/g,"Kementerian Perencanaan Pembangunan Nasional")
 .replace(/Coordinating Ministry for Downstreaming & Energy Transition/g,"Kementerian Koordinator Bidang Hilirisasi dan Transisi Energi")
 .replace(/Ministry of Energy & Mineral Resources/g,"Kementerian Energi dan Sumber Daya Mineral")
 .replace(/Ministry of Investment/g,"Kementerian Investasi")
 .replace(/Ministry of Industry/g,"Kementerian Perindustrian")
 .replace(/Ministry of Home Affairs/g,"Kementerian Dalam Negeri")
 .replace(/National Development Planning/g,"Perencanaan Pembangunan Nasional")
 .replace(/State-Owned Enterprises Regulatory Agency/g,"Badan Pengaturan BUMN")
 .replace(/national utility/gi,"perusahaan listrik nasional")
 .replace(/parent company/gi,"perusahaan induk")
 .replace(/regional upstream/gi,"hulu regional")
 .replace(/upstream/gi,"hulu").replace(/downstream/gi,"hilir")
 .replace(/public financing institutions/gi,"lembaga pembiayaan publik")
 .replace(/investment holding/gi,"induk investasi")
 .replace(/SOE portfolio ownership & capital/gi,"kepemilikan dan modal portofolio BUMN")
 .replace(/South Andaman/gi,"Andaman Selatan")
 .replace(/Indonesian provincial governments/gi,"pemerintah provinsi Indonesia")
 .replace(/Provincial governments/gi,"Pemerintah provinsi")
 .replace(/Private domestic/gi,"Swasta domestik")
 .replace(/Foreign private/gi,"Swasta asing")
 .replace(/Government/gi,"Pemerintah")
 .replace(/Public policy/gi,"Kebijakan publik")
 .replace(/Independent/gi,"Independen")
 .replace(/Energy & nuclear research/gi,"Riset energi dan nuklir")
 .replace(/Operator/gi,"Operator");
}
function actorRole(a,sector){
 if(!isId())return a.role||"";
 if(a.role_id)return a.role_id;
 const m=String(a.id||"").match(/^en-(\d+)-(\d+)$/);
 if(m&&ENERGY_ROLE_ID[+m[1]]?.[+m[2]])return ENERGY_ROLE_ID[+m[1]][+m[2]];
 const area=sector==="minerals"?"mineral, pertambangan dan hilirisasi":sector==="ai"?"AI, infrastruktur digital, komputasi dan pusat data":"ketahanan dan infrastruktur energi";
 const type=ui(typeName[a.relation]||a.relation||"Koordinasi");
 const org=actorTitle(a);
 const explicit=/^(Kementerian|Ministry|Direktorat|Ditjen|BRIN|Bappenas)/i.test(org)?"sesuai mandat kelembagaannya":a.lane==="private"?"berdasarkan proyek dan kontrak komersial yang didokumentasikan":a.lane==="state"?"sesuai kepemilikan dan mandat usaha yang didokumentasikan":"sesuai kewenangan dan batas tanggung jawab yang berlaku";
 return "Peran "+type.toLowerCase()+" pada "+area+", "+explicit+". Rincian tanggung jawab dan status terbaru perlu diverifikasi melalui sumber asli yang tercantum.";
}
function actorVerification(a){return isId()?"Status bukti sesuai sumber pada periode pelaporan; periksa tanggal dan dokumen asli":(a.verification||"Source not dated")}

function init(which,root,provided){if(!root)return;root.replaceChildren(el("p","sli-hier-status","Loading verified institutional and corporate hierarchy…"));
const source=provided?Promise.resolve(provided):fetch("data/sector-command-hierarchy.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Hierarchy source unavailable");return r.json()});
source.then(db=>{
 const record=db.sectors?.[which];if(!root.isConnected||!record)return;
 const actors=record.nodes||[],market=record.market||[],byId=new Map(actors.map(x=>[x.id,x]));
 const rootNode=actors.find(x=>x.relation==="root");if(!rootNode)throw Error("Missing president root");
 const main=el("section","sli-hier-root");
 const h=el("div","sli-hier-header");h.append(el("div","eyebrow","INSTITUTIONAL & CORPORATE COMMAND STRUCTURE"),el("h3",null,"Government · Danantara & SOEs · Private Sector"),el("p",null,"Three separate systems: public institutions, state corporate portfolios and independent domestic/foreign investors. The Presidency anchors public-sector authority; corporate ownership is not regulatory command."));
 const tools=el("div","sli-hier-tools"),search=el("input","sli-hier-search"),expand=el("button","sli-hier-button","Expand all"),collapse=el("button","sli-hier-button","Collapse all"),filter=el("select","sli-hier-select");
 search.type="search";search.placeholder="Find people, directorates, companies…";search.setAttribute("aria-label","Search the hierarchy");
 const opts=[["all","All sectors · grouped"],["government","Government & public institutions"],["policy","Public policy & regulators"],["portfolio","Danantara / BUMN"],["research","BRIN / research / defence"],["market","Private (all)"],["domestic","Private · Indonesia"],["foreign","Private · foreign"],["joint","Private · cross-border JVs"]];
 for(const [key,title] of opts){const op=el("option",null,title);op.value=key;filter.append(op)}
 for(const button of [expand,collapse])button.type="button";
 tools.append(filter,search,expand,collapse);main.append(h,tools);
 const watch=el("div","sli-hier-watch","Official leadership source watch: awaiting the next dated source scan.");main.append(watch);
 if(which==="energy"){
  watch.textContent="Official leadership source verification and research notes are available within this Energy Security institution panel. The two views use the same source-dated governance data.";
 }else fetch("data/sector-leadership-watch.json",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{
  if(!d?.checked_at_utc){watch.textContent="Leadership roster source monitoring is configured but has not completed its first scan. Names are source-dated, not live confirmed.";return}
  const items=(d.checks||[]).filter(x=>x.sector===which),ok=items.filter(x=>x.status==="name_present_in_source").length,
    review=items.filter(x=>x.status==="name_not_detected_needs_review").length,
    unavailable=items.filter(x=>x.status==="source_access_unavailable").length;
  watch.textContent="Official page scan "+d.checked_at_utc.slice(0,16)+" UTC · "+ok+" names seen in linked source pages · "+review+" need review · "+unavailable+" sources inaccessible. Automated page matching is not proof of incumbent appointment.";
 }).catch(()=>{watch.textContent="Leadership source scanner status temporarily unavailable; original links remain visible."});

 const top=el("div","sli-hier-president"),lanes=el("div","sli-hier-lanes"),outsiders=el("section","sli-hier-market"),info=el("aside","sli-hier-profile");
 main.append(top,lanes,outsiders,info);
 const legend=el("div","sli-hier-legend");for(const [key,title] of Object.entries(typeName)){if(["reporting","policy","coordination","planning","portfolio","equity","minority","research","market","oversight","joint-venture"].includes(key))legend.append(el("span","sli-hier-key "+key,title))}main.append(legend);
 main.append(el("p","sli-hier-foot",db.updated_note+" Reported shareholding and direct official reporting must not be conflated with coordination or related-industry links."));
 root.replaceChildren(main);
 const defaultExpanded=new Set(["pres","minister","esdm","industrial","investment","komdigi","dgE","dgI","bpi","dam","mind","telkom","brin","bpbum-ai","kemendagri-ai"]);
 // The energy adapter has source-indexed IDs. Resolve the same L2 visibility
 // by actor title rather than only static IDs from the minerals/AI registers.
 for(const a of actors)if(/Kementerian ESDM \/ Minister|Kementerian Dalam Negeri|BP BUMN|Coordinating Ministry for Downstreaming/i.test(a.title))defaultExpanded.add(a.id);
 let openIds=new Set(defaultExpanded);
 let selectedId="pres";
 function profile(a){
 info.replaceChildren(el("div","eyebrow","SOURCE-DATED ACTOR PROFILE"),el("h4",null,a.title));
 if(a.person)info.append(el("p","sli-hier-person","Actor / leader: "+a.person));else info.append(el("p","sli-hier-missing","Named incumbent is not independently verified in this register."));
 info.append(el("p",null,a.role),el("p","sli-hier-type","Relationship: "+(typeName[a.relation]||a.relation)));
 if(a.stake)info.append(el("p","sli-hier-stake","Reported stake: "+a.stake));
 if(a.affiliation)info.append(el("p",null,"Corporate affiliation: "+a.affiliation));
 info.append(el("p","sli-hier-provenance","Evidence class: "+a.verification+" · research snapshot "+db.as_of),link(a.source,"View original institutional or issuer source ↗"));
 const path=[];let p=a;while(p&&path.length<8){path.unshift(p.title);p=byId.get(p.parent)}
 if(path.length>1)info.append(el("p","sli-hier-path","Trace: "+path.join(" → ")));
 }
 function card(a,depth=0){
 const wrap=el("div","sli-hier-entry "+a.relation),btn=el("button","sli-hier-card"+(selectedId===a.id?" selected":""),undefined);
 btn.type="button";btn.append(el("small",null,(typeName[a.relation]||a.relation)+" · L"+depth),el("strong",null,a.title));
 if(a.person)btn.append(el("span","sli-hier-lead",a.person));
 if(a.stake)btn.append(el("span","sli-hier-share",a.stake));
 btn.addEventListener("click",()=>{selectedId=a.id;profile(a);draw()});wrap.append(btn);return wrap
 }
 function nested(a,depth,scope,maxDepth=8){
 const node=card(a,depth),children=actors.filter(x=>x.parent===a.id && x.lane===a.lane && x.relation!=="market");
 if(children.length&&depth<maxDepth){const disclosure=el("button","sli-hier-toggle",(openIds.has(a.id)?"−":"+")+" "+children.length+" subordinate / linked entities");disclosure.type="button";
 disclosure.setAttribute("aria-expanded",String(openIds.has(a.id)));disclosure.addEventListener("click",()=>{if(openIds.has(a.id))openIds.delete(a.id);else openIds.add(a.id);draw()});node.append(disclosure);
 if(openIds.has(a.id)){const branch=el("div","sli-hier-children");for(const ch of children)branch.append(nested(ch,depth+1,scope,maxDepth));node.append(branch)}}
 return node
 }

 const govs=actors.filter(a=>a.lane==="government"&&a.id!==rootNode.id);
 const states=actors.filter(a=>a.lane==="state");
 const independent=actors.filter(a=>a.lane==="oversight");
 const marketCategories=[
  {key:"domestic",title:"DOMESTIC PRIVATE · INDONESIA",description:"Indonesian-headquartered private and listed businesses. Individual project JVs must still be checked."},
  {key:"foreign",title:"FOREIGN PRIVATE · INTERNATIONAL",description:"Foreign-headquartered companies and providers. Local incorporation does not make the parent Indonesian-owned."},
  {key:"joint",title:"MIXED OWNERSHIP & CROSS-BORDER JVs",description:"Joint ventures and companies with mixed domestic/foreign shareholding, kept separate from purely domestic or foreign parents."}
 ];
 const renderSection=(title,description,count,cls)=>{
  const section=el("section","sli-hier-domain "+cls);
  const header=el("div","sli-hier-domain-head");
  header.append(el("div","eyebrow",cls==="government"?"01 · PUBLIC INSTITUTIONS":cls==="state"?"02 · PUBLIC CORPORATE PORTFOLIO":"03 · COMMERCIAL MARKET"),
    el("h4",null,title),el("p",null,description),el("span","sli-hier-domain-count",count+" mapped entities"));
  section.append(header);
  return section;
 };
 const domainVisible=(mode,name)=>mode==="all"||(name==="government"&&["government","policy","research"].includes(mode))||
   (name==="state"&&mode==="portfolio");
 const governmentSection=()=>{
  const show=domainVisible(filter.value||"all","government");
  if(!show)return;
  const mode=filter.value||"all";
  const roots=govs.filter(a=>a.parent===rootNode.id||!a.parent)
   .sort((a,b)=>{
    const priority=x=>/Penasihat Khusus Presiden/i.test(x.title)?0:
     /Kemenko Hilirisasi|Coordinating Ministry for Downstreaming/i.test(x.title)?1:
     /Kementerian ESDM \/ Minister|Ministry of Energy & Mineral Resources/i.test(x.title)?2:
     /Kementerian Dalam Negeri/i.test(x.title)?3:
     /BP BUMN/i.test(x.title)?4:10;
    return priority(a)-priority(b);
   });
  let relevant=mode==="research"?roots.filter(a=>["research"].includes(a.relation)||a.id==="defense"||a.id==="highered"):
    mode==="policy"?roots.filter(a=>["policy","coordination","planning"].includes(a.relation)):roots;
  const section=renderSection("GOVERNMENT · POLICY & PUBLIC INSTITUTIONS",
    "Public advisory → coordination → ministries → execution. DEN Secretariat is administratively linked to ESDM and functionally to DEN. Provincial autonomy is preserved under Kemendagri guidance; BP Batam has a separate legal mandate and is not subordinate to BP BUMN. DPR/BPK exercise independent oversight.",
    govs.length+1+independent.length,"government");
  const grid=el("div","sli-hier-domain-grid");
  for(const a of relevant){const c=el("article","sli-hier-lane");c.append(nested(a,1,mode));grid.append(c)}
  section.append(grid);
  if(independent.length && mode!=="research"){
   const over=el("div","sli-hier-independent");
   over.append(el("h4",null,"Independent parliamentary & financial oversight"),
     el("p",null,"DPR RI and BPK RI are NOT directorates under the President or ministers."));
   const cards=el("div","sli-hier-market-grid");
   independent.forEach(a=>cards.append(card(a,1)));over.append(cards);section.append(over);
  }
  lanes.append(section);
 };
 const stateSection=()=>{
  if(!domainVisible(filter.value||"all","state"))return;
  const roots=states.filter(a=>!a.parent||!states.some(p=>p.id===a.parent));
  const section=renderSection("DANANTARA · STATE-OWNED ENTERPRISES",
   "Corporate portfolio and equity relationships are shown separately from government regulatory mandates. MIND ID group members, DSI, Telkom and other state-linked companies have different legal roles.",
   states.length,"state");
  const grid=el("div","sli-hier-domain-grid");
  for(const a of roots){const c=el("article","sli-hier-lane");c.append(nested(a,1,"portfolio"));grid.append(c)}
  section.append(grid);lanes.append(section);
 };
 function marketPanel(){
  const mode=filter.value||"all",visible=["all","market","domestic","foreign","joint"].includes(mode);
  outsiders.hidden=!visible;
  outsiders.replaceChildren();
  if(!visible)return;
  const section=renderSection("PRIVATE SECTOR · DOMESTIC & FOREIGN",
   "Commercial companies and corporate nationality are separated from the government and Danantara/BUMN organizational chart. Connections to the state are regulatory or contractual, not statutory subordination.",
   market.length,"private");
  const body=el("div","sli-hier-market-classifications");
  for(const meta of marketCategories){
   if(!["all","market",meta.key].includes(mode))continue;
   const filtered=market.filter(a=>(a.ownership_category||"joint")===meta.key).filter(a=>!query||[a.title,a.person,a.role,a.affiliation].join(" ").toLowerCase().includes(query));
   const col=el("div","sli-hier-market-class "+meta.key);
   col.append(el("h5",null,meta.title+" · "+filtered.length),el("p",null,meta.description));
   const list=el("div","sli-hier-market-grid");
   filtered.forEach(a=>list.append(card(a,1)));col.append(list);body.append(col);
  }
  section.append(body);outsiders.append(section);
 }
 let query="";
 function draw(){
  query=search.value.trim().toLowerCase();
  const mode=filter.value||"all";
  top.replaceChildren();
  if(!["market","domestic","foreign","joint","portfolio"].includes(mode)){
   top.append(el("p","sli-hier-root-label","GOVERNMENT · HEAD OF STATE / EXECUTIVE DIRECTION"));
   top.append(card(rootNode));
  }else if(mode==="portfolio"){
   top.append(el("p","sli-hier-root-label","STATE PORTFOLIO · OWNERSHIP / INVESTMENT"));
  }
  lanes.replaceChildren();
  governmentSection();
  stateSection();
  marketPanel();
  if(query){
   const matches=[...actors,...market].filter(x=>[x.title,x.person,x.role].join(" ").toLowerCase().includes(query));
   const result=el("div","sli-hier-search-hits");
   result.append(el("h4",null,"Matching actors · "+matches.length));
   for(const a of matches.slice(0,30)){
    const b=el("button","sli-hier-match",a.title+(a.person?" · "+a.person:""));
    b.type="button";
    b.addEventListener("click",()=>{
     selectedId=a.id;
     if(a.parent){let p=a;while(p){openIds.add(p.id);p=byId.get(p.parent)}}
     profile(a);search.value="";filter.value=a.lane==="state"?"portfolio":a.lane==="private"?"market":"government";draw();
    });result.append(b);
   }
   lanes.prepend(result);
  }
 }
 expand.addEventListener("click",()=>{openIds=new Set(actors.map(x=>x.id));draw()});
 collapse.addEventListener("click",()=>{openIds=new Set();draw()});
 search.addEventListener("input",draw);filter.addEventListener("change",draw);
 profile(rootNode);draw();
}).catch(error=>{console.error("[SLI command hierarchy]",error);root.replaceChildren(el("p","sli-hier-status","Hierarchy data cannot be loaded. The Energy-style institutional network remains available below."))});
}
window.initSLICommandHierarchy=init;
})();