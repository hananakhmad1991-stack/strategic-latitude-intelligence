/* SLI Research Analysis · zero-network deterministic analytical preview.
 * 38 province mini-profiles, exact entity matching, dates and noncausal analysis.
 * No generative model, forecasts, or hidden premium data.
 */
export const normalize = value=>String(value||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
const inPhrase=(text,phrase)=>(" "+text+" ").includes(" "+normalize(phrase)+" ");
const terms=query=>normalize(query).split(" ").filter(x=>x.length>2&&!new Set(["yang","dari","untuk","pada","terhadap","bagaimana","berapa","dengan","what","which","about","the","and","indonesia","adalah","latest","tahun","provinsi","analisis","analysis","status","saya","please","does","tell","show"]).has(x));
const conceptGroups={
 growth:["pertumbuhan","growth","ekonomi","economic","pdrb","grdp","gdp"],
 investment:["investasi","investment","investor","pmtb","modal","capex","peluang","potensi","opportunity"],
 inequality:["gini","ketimpangan","inequality","distribution"],
 consumption:["konsumsi","consumption","household","rumah tangga","pasar","market"],
 ai:["ai","data center","datacenter","pusat data","cloud","gpu","komputasi","computing"],
 minerals:["nikel","nickel","smelter","hp al","hpal","minerals","mineral","baterai","battery","tambang"],
 energy:["energi","energy","oil","gas","batubara","coal","brent","wti","renewables","listrik","electricity"],
 trade:["ekspor","export","import","impor","perdagangan","trade","neraca"],
 inflation:["inflasi","inflation","cpi","harga konsumen"],
 interest:["suku bunga","bi rate","interest rate","policy rate","bunga acuan"],
 currency:["rupiah","kurs","usd idr","jisdor","exchange rate"],
 news:["berita","news","monitoring","headlines"],
 risk:["risiko","risk","hambatan","challenges","tantangan","swot","prospek","outlook"],
 econometric:["ekonometrika","econometric","multiplier","kausal","causal","regresi","regression"]
};
export function detectIntents(query){
 const q=normalize(query),set=[];
 for(const [key,syn] of Object.entries(conceptGroups))if(syn.some(v=>inPhrase(q,v)))set.push(key);
 return set;
}
export function findProvinces(query,profiles){
 const q=normalize(query);
 if(!q||!Array.isArray(profiles))return [];
 const hits=[];
 for(const p of profiles){
  for(const label of [p.name,p.name_en,...(p.aliases||[])].filter(Boolean)){
   const alias=normalize(label),hay=" "+q+" ",needle=" "+alias+" ";
   let pos=hay.indexOf(needle);
   while(pos>=0){
    hits.push({profile:p,start:pos,end:pos+needle.length,weight:alias.length});
    pos=hay.indexOf(needle,pos+1);
   }
  }
 }
 hits.sort((a,b)=>b.weight-a.weight||a.start-b.start);
 const accepted=[];
 for(const hit of hits){
  if(accepted.some(x=>Math.max(x.start,hit.start)<Math.min(x.end,hit.end)))continue;
  accepted.push(hit);
 }
 accepted.sort((a,b)=>a.start-b.start);
 return [...new Map(accepted.map(x=>[x.profile.name,x.profile])).values()];
}
export function validateProfiles(data){
 return !!(data&&data.schema==="sli-research-province-preview-v1"&&Array.isArray(data.provinces)&&data.provinces.length===38&&data.provinces.every(p=>p.name&&Array.isArray(p.project_examples)&&p.name_en)&&new Set(data.provinces.map(p=>p.name)).size===38);
}
const fmt=(x,lang,dec=2)=>x==null?"N/A":Number(x).toLocaleString(lang==="id"?"id-ID":"en-US",{maximumFractionDigits:dec,minimumFractionDigits:dec});
const local=(condition,id,en)=>condition==="id"?id:en;
const datum=(n)=>Number.isFinite(n);
const cite=(i)=>" ["+i+"]";
function source(title,url,period,publisher,source_date){return {title,source_url:url,period,publisher,source_date}}
function linkEvidence(profile,ref){
 return ref.type==="gini" ? profile.gini_expenditure_2026_03 : profile.grdp_current_2025_bn
}
function computeProfile(p,lang,src){
 const growth=p.growth_real_2025_pct,cap=p.pmtb_share_2025_pct,h=p.household_share_2025_pct,g=p.gini_expenditure_2026_03;
 const name=lang==="id"?p.name:p.name_en;
 const card=[];
 if(datum(growth))card.push({label:local(lang,"Pertumbuhan riil PDRB 2025","Real GRDP growth 2025"),value:fmt(growth,lang)+"%",period:"2025",citation:1});
 if(datum(h))card.push({label:local(lang,"Porsi konsumsi rumah tangga","Household consumption share"),value:fmt(h,lang)+"%",period:"2025",citation:1});
 if(datum(cap))card.push({label:local(lang,"PMTB / PDRB","Gross fixed capital formation / GRDP"),value:fmt(cap,lang)+"%",period:"2025",citation:1});
 if(datum(g))card.push({label:local(lang,"Rasio Gini pengeluaran","Expenditure Gini"),value:fmt(g,lang,3),period:"Maret 2026",citation:2});
 return {name,card};
}
function analyseOne(p,query,lang,metadata){
 const intent=detectIntents(query),name=lang==="id"?p.name:p.name_en,m=computeProfile(p,lang),growth=p.growth_real_2025_pct,cap=p.pmtb_share_2025_pct,h=p.household_share_2025_pct,g=p.gini_expenditure_2026_03;
 const evidence=[
  source("BPS · PDRB Provinsi Menurut Pengeluaran 2021–2025",metadata.sources.grdp.url,"2025 (preliminary)","BPS",metadata.sources.grdp.released),
  source("BPS · Gini Rasio Provinsi Maret 2026",metadata.sources.gini.url,"2026-03","BPS",metadata.sources.gini.last_updated||metadata.as_of)
 ];
 const sections=[];
 const general=local(lang,
 "Pada 2025, "+name+" mencatat pertumbuhan riil PDRB "+(datum(growth)?fmt(growth,lang)+"%":"yang belum tersedia")+". Porsi konsumsi rumah tangga mencapai "+(datum(h)?fmt(h,lang)+"%":"N/A")+" dari PDRB harga berlaku, sedangkan pembentukan modal tetap bruto (PMTB) "+(datum(cap)?fmt(cap,lang)+"%":"N/A")+". Komposisi ini membantu membaca struktur permintaan dan pembentukan modal, tetapi tidak menunjukkan secara langsung laba proyek atau realisasi penanaman modal investor." +cite(1),
 "In 2025, "+name+" registered real GRDP growth of "+(datum(growth)?fmt(growth,lang)+"%":"N/A")+". Household spending accounted for "+(datum(h)?fmt(h,lang)+"%":"N/A")+" of current-price GRDP and gross fixed capital formation (GFCF) for "+(datum(cap)?fmt(cap,lang)+"%":"N/A")+". These expenditure shares reveal economic structure but cannot establish realized investor spending or project profitability."+cite(1));
 sections.push({title:local(lang,"Pembacaan ekonomi daerah","Regional economic assessment"),body:general});
 if(intent.includes("investment")||intent.includes("risk")||intent.length===0||intent.includes("growth")){
  const profile=local(lang,
  "PMTB sebesar "+(datum(cap)?fmt(cap,lang)+"%":"N/A")+" adalah komponen neraca pengeluaran ekonomi daerah—bukan nilai investasi BKPM atau multiplier effect. Dalam tahap penyaringan investasi, indikator ini perlu dipasangkan dengan ketersediaan daya listrik, logistik, izin, tenaga kerja, permintaan sektoral, dan data proyek yang telah diverifikasi." +cite(1),
  "GFCF at "+(datum(cap)?fmt(cap,lang)+"%":"N/A")+" is an expenditure-accounting component, NOT BKPM realized investment or a multiplier-effect estimate. Investor screening should also test power availability, logistics, permits, skills, demand and independently verified project economics."+cite(1));
  sections.push({title:local(lang,"Implikasi untuk investasi","Implications for investment"),body:profile});
 }
 if(intent.includes("inequality")||intent.length===0||intent.includes("risk")||intent.includes("growth")||intent.includes("investment")){
  const inequality=local(lang,
   "Rasio Gini pengeluaran Maret 2026 adalah "+(datum(g)?fmt(g,lang,3):"N/A")+", dibanding angka nasional 0,368 pada periode yang sama. "+(datum(g)?(g>0.368?"Koefisien daerah lebih tinggi, yang berarti ketimpangan pengeluarannya lebih besar menurut ukuran ini.":g<0.368?"Koefisien daerah lebih rendah, yang berarti ketimpangan pengeluarannya lebih kecil menurut ukuran ini.":"Angkanya setara dengan koefisien nasional."):"Nilai tidak tersedia.")+" Ini bukan angka ketimpangan pendapatan, bukan ukuran daya beli, dan tidak membuktikan pertumbuhan menyebar merata. Periode Gini 2026 dan pertumbuhan 2025 berbeda." +cite(2),
   "March 2026 expenditure Gini was "+(datum(g)?fmt(g,lang,3):"N/A")+" against the same-period national coefficient of 0.368. "+(datum(g)?(g>0.368?"The province has higher measured expenditure inequality.":g<0.368?"The province has lower measured expenditure inequality.":"The coefficient equals the national value."):"The observation is unavailable.")+" This is neither income inequality nor purchasing power and says nothing causal about growth. The 2026 Gini and 2025 growth observations refer to different periods."+cite(2));
  sections.push({title:local(lang,"Keseimbangan pertumbuhan dan ketimpangan","Growth and distribution"),body:inequality});
 }
 const projectFocus=intent.includes("ai")||intent.includes("minerals")||intent.includes("energy");
 const words=projectFocus?(p.project_examples||[]).filter(x=>(intent.includes("ai")&&/ai|data|cloud/i.test(x.sector+" "+x.title))||(intent.includes("minerals")&&/mineral|battery|smelter|hpal|nickel/i.test(x.sector+" "+x.title))||(intent.includes("energy")&&/energy|power|listrik|renewable/i.test(x.sector+" "+x.title))):[];
 if(words.length){
  const relevant=words.slice(0,2);
  const strings=[];
  for(const row of relevant){
   const num=evidence.length+1;
   evidence.push(source(row.title,row.source_url,row.evidence_date,row.entity||"Public project record",row.evidence_date));
   strings.push(local(lang,
   row.title+" tercatat sebagai proyek terkurasi, status sumber: "+row.stage+" ("+row.evidence_date+"). Pengumuman atau tahap konstruksi bukan bukti belanja terealisasi maupun kapasitas operasi.",
   row.title+" appears in the curated project register at reported stage "+row.stage+" ("+row.evidence_date+"). An announcement or construction milestone is not proof of realized capital expenditure or operational capacity.")+cite(num));
  }
  sections.push({title:local(lang,"Contoh proyek terlapor","Reported project examples"),body:strings.join(" ")});
 } else if(projectFocus){
  sections.push({title:local(lang,"Kesenjangan bukti sektoral","Sector evidence gap"),body:local(lang,
  "Dalam sampel proyek SLI saat ini belum ada bukti spesifik "+(intent.includes("ai")?"data center/AI":intent.includes("minerals")?"hilirisasi mineral":"energi")+" yang cukup untuk "+name+". Ini BUKAN berarti tidak ada proyek di wilayah tersebut. Pemeriksaan proyek dan kapasitas sektor memerlukan registri yang lebih lengkap sebelum menyimpulkan kelayakan investasi.",
  "The current curated SLI sample does not contain sufficient province-specific "+(intent.includes("ai")?"AI/data center":intent.includes("minerals")?"critical mineral":"energy")+" project evidence for "+name+". That does NOT mean no projects exist. Additional registered project and operating-capacity sources are required before due diligence.")});
 }
 if(intent.includes("risk")&& !words.length)sections.push({title:local(lang,"Risiko dan keterbatasan riset","Risks and due-diligence gaps"),body:local(lang,"Kelayakan investasi tidak dapat disimpulkan dari PDRB dan PMTB saja. Periksa sumber daya, biaya energi, jaringan listrik, pasar, regulasi, logistik, dan kualitas informasi proyek secara spesifik.","Investment viability cannot be inferred from GRDP and GFCF alone. Validate resource economics, energy and grid supply, logistics, market access, permitting and source reliability.")});
 if(intent.includes("inflation"))sections.push({title:local(lang,"Indikator yang belum tersedia","Unavailable indicators"),body:local(lang,"Tidak ada seri inflasi/IHK khusus "+name+" dalam corpus Research Open. Angka inflasi nasional tidak boleh diberi label sebagai inflasi provinsi.", "Province-specific CPI/inflation for "+name+" is not in this Open research corpus. National inflation must not be represented as provincial inflation.")});
 if(intent.includes("econometric"))sections.push({title:local(lang,"Batas model ekonometrika","Econometric model limits"),body:local(lang,"Angka ini bersifat deskriptif. Tidak ada estimasi koefisien kausal, model input-output, regresi panel, atau proyeksi multiplier effect yang tervalidasi untuk pertanyaan ini. Simulasi memerlukan asumsi, data input-output, dan pengujian model.", "These observations are descriptive. No tested causal coefficient, input-output multiplier, panel regression, or project return forecast is available for this question. Modelling requires specified assumptions and validation.")});
 const limit=local(lang,"Ini cuplikan analisis daerah, bukan seluruh profil sektoral, komparasi 38 provinsi, atau rekomendasi investasi. Data PDRB 2025 bersifat sementara; data Gini Maret 2026 menggunakan periode survei berbeda.","This is a limited provincial analytical preview, not full sector dossiers, 38-province screening, or investment advice. The 2025 GRDP figures are preliminary and March 2026 Gini refers to a different measurement period.");
 return {kind:"province",geo:[p.name],title:local(lang,"Assessment Ekonomi & Investasi: ","Regional Economic & Investment Assessment: ")+name,lead:local(lang,"Pertumbuhan, struktur permintaan, pembentukan modal, distribusi pengeluaran, dan batas bukti proyek perlu dinilai bersama; satu indikator tidak dapat menentukan kelayakan investasi "+name+".","Growth, spending structure, capital formation, expenditure inequality and project evidence must be read together; no single indicator can determine investment feasibility in "+name+"."),
 sections,metrics:m.card,sources:evidence,limit,suggestions:local(lang,["Bagaimana hubungan PMTB dan pertumbuhan "+p.name+"?","Bagaimana ketimpangan dan peluang investasi "+p.name+"?","Apa bukti proyek AI di "+p.name+"?"],["Explain GFCF and growth in "+p.name_en,"What does expenditure inequality show in "+p.name_en+"?","What AI investment evidence exists in "+p.name_en+"?"])};
}
function compareTwo(a,b,query,lang,metadata){
 const left=analyseOne(a,query,lang,metadata),right=analyseOne(b,query,lang,metadata),nameA=left.geo[0],nameB=right.geo[0],diff=(x,y)=>datum(x)&&datum(y)?fmt(x-y,lang):"N/A";
 const title=local(lang,"Perbandingan terbatas: ","Limited comparison: ")+(lang==="id"?nameA+" vs "+nameB:a.name_en+" vs "+b.name_en);
 const gA=a.growth_real_2025_pct,gB=b.growth_real_2025_pct,pA=a.pmtb_share_2025_pct,pB=b.pmtb_share_2025_pct,nA=a.gini_expenditure_2026_03,nB=b.gini_expenditure_2026_03;
 const sections=[
 {title:local(lang,"Pertumbuhan dan struktur modal","Growth and capital formation"),body:local(lang,
  a.name+" memiliki pertumbuhan PDRB riil 2025 "+fmt(gA,lang)+"%, sedangkan "+b.name+" "+fmt(gB,lang)+"%. Selisih "+diff(gA,gB)+" poin persentase tidak otomatis berarti tingkat pengembalian investasi berbeda. Porsi PMTB kedua daerah masing-masing "+fmt(pA,lang)+"% dan "+fmt(pB,lang)+"% dari PDRB harga berlaku; ini pembentukan modal dalam akun nasional, bukan realisasi investasi BKPM."+cite(1),
  a.name_en+" had real GRDP growth of "+fmt(gA,lang)+"% in 2025, versus "+fmt(gB,lang)+"% for "+b.name_en+". The "+diff(gA,gB)+" percentage-point gap does not predict investment returns. GFCF comprised "+fmt(pA,lang)+"% and "+fmt(pB,lang)+"% of current-price GRDP, respectively; this is not BKPM realized investment."+cite(1))},
 {title:local(lang,"Ketimpangan dan risiko interpretasi","Inequality and interpretation"),body:local(lang,
  "Gini pengeluaran Maret 2026 untuk "+a.name+" sebesar "+fmt(nA,lang,3)+", dibanding "+fmt(nB,lang,3)+" di "+b.name+". Koefisien ini bukan daya beli atau indeks kemiskinan dan tidak menilai ketahanan bisnis. Data PDRB 2025 dan Gini 2026 tidak boleh disimpulkan sebagai hubungan sebab-akibat."+cite(2),
  "March 2026 expenditure Gini is "+fmt(nA,lang,3)+" in "+a.name_en+" versus "+fmt(nB,lang,3)+" in "+b.name_en+". These coefficients neither measure purchasing power nor business resilience, and comparing 2025 GRDP to 2026 Gini cannot establish causality."+cite(2))},
 {title:local(lang,"Keputusan due diligence","Due diligence implications"),body:local(lang,
  "Untuk menentukan mana yang lebih prospektif berdasarkan sektor, investor tetap perlu memeriksa jaringan listrik, rantai pasok, kawasan industri, tenaga kerja, biaya logistik, izin, dan kelayakan proyek tertentu. Data preview ini belum cukup untuk memilih daerah investasi.",
  "A sector-specific decision still needs verified grid capacity, industrial sites, supply chains, skills, logistics, permits and project feasibility. The preview cannot choose an investable province.")}
 ];
 return {kind:"comparison",geo:[a.name,b.name],title,lead:local(lang,"Perbandingan indikator dapat menyaring pertanyaan riset, bukan menentukan rekomendasi investasi.","A descriptive comparison can narrow due diligence questions, not select investment winners."),sections,metrics:[
 {label:(lang==="id"?a.name:a.name_en)+" · growth 2025",value:fmt(gA,lang)+"%",period:"2025",citation:1},
 {label:(lang==="id"?b.name:b.name_en)+" · growth 2025",value:fmt(gB,lang)+"%",period:"2025",citation:1},
 {label:(lang==="id"?a.name:a.name_en)+" · Gini",value:fmt(nA,lang,3),period:"2026-03",citation:2},
 {label:(lang==="id"?b.name:b.name_en)+" · Gini",value:fmt(nB,lang,3),period:"2026-03",citation:2}
 ],sources:[
  source("BPS · PDRB Provinsi 2021–2025",metadata.sources.grdp.url,"2025","BPS",metadata.sources.grdp.released),
  source("BPS · Rasio Gini Provinsi 2026",metadata.sources.gini.url,"2026-03","BPS",metadata.sources.gini.last_updated||metadata.as_of)
 ],limit:local(lang,"Perbandingan ini hanya cuplikan dua provinsi dan tidak mengakses seluruh dossier SLI Pro.","This compares two limited previews, not the complete SLI Pro dossiers."),suggestions:local(lang,["Bandingkan PDRB Jawa Tengah vs Jawa Barat","Apa faktor risiko investasi Jawa Tengah?"],["Compare Central Java and West Java GRDP","What are the investment risks in Central Java?"])};
}
export function generateProvinceReport(question,scope,lang="id"){
 if(!validateProfiles(scope))throw Error("Invalid province preview scope");
 const matches=findProvinces(question,scope.provinces);
 if(!matches.length)return null;
 if(matches.length>2)return {kind:"limit",geo:matches.map(x=>x.name),title:local(lang,"Perbandingan lebih dari dua provinsi","Comparison of more than two provinces"),lead:local(lang,"Preview Open hanya dapat membandingkan dua provinsi per pertanyaan; analisis 38 provinsi lengkap disediakan dalam paket Pro setelah aksesnya aktif.","Open preview only compares up to two selected provinces; full 38-province analysis is planned for Pro."),sections:[],metrics:[],sources:[],limit:"",suggestions:[]};
 return matches.length===1?analyseOne(matches[0],question,lang,scope):compareTwo(matches[0],matches[1],question,lang,scope);
}
export function generateThematicReport(question,corpus,lang="id",scope="all"){
 if(!Array.isArray(corpus?.documents))throw Error("Invalid evidence corpus");
 const intents=detectIntents(question),q=normalize(question);
 const chosen=scope!=="all"?scope:null;
 const direct={
  interest:["macro-bi_policy_rate"],
  currency:["macro-usd_idr_jisdor"],
  inflation:["macro-inflation_yoy"],
  inequality:["gini-national"],
  growth:["macro-real_gdp_growth"],
  trade:["macro-exports_month","macro-imports_month"],
  econometric:["method-growth-gini"],
  investment:["method-growth-gini"],
  energy:["energy-brent","energy-wti","energy-henry_hub"],
  ai:["aiproject-digital-edge-cgk","aiproject-pdg-jc3","aiproject-pdg-jc4"],
  minerals:["project-sli-project-001","project-sli-project-004","project-sli-project-006"]
 };
 const priority=["interest","currency","inflation","inequality","trade","econometric","ai","minerals","energy","growth","investment"];
 let concept=priority.find(x=>intents.includes(x))||null;
 if(chosen){
  const fromTopic={macroeconomy:"growth",regional:"growth",inequality:"inequality",trade:"trade",minerals:"minerals",ai:"ai",energy:"energy",methodology:"econometric",investment:"investment"};
  concept=fromTopic[chosen]||concept;
 }
 const topicFor={interest:"macroeconomy",currency:"macroeconomy",inflation:"macroeconomy",inequality:"inequality",growth:"macroeconomy",trade:"trade",econometric:"methodology",investment:"methodology",energy:"energy",ai:"ai",minerals:"minerals"};
 const exactIds=direct[concept]||[];
 const pool=corpus.documents;
 let docs=pool.filter(d=>exactIds.includes(d.id)&&(!chosen||d.topic===chosen||chosen==="macroeconomy"&&d.topic==="macroeconomy"));
 if(!docs.length&&concept){
  const t=topicFor[concept];
  docs=pool.filter(d=>d.topic===t).filter(d=>{
   const hay=normalize(d.title+" "+d.text+" "+d.title_en+" "+d.text_en);
   return conceptGroups[concept]?.some(w=>inPhrase(hay,w))||false
  }).slice(0,3);
 }
 if(!docs.length){
  const tokens=terms(question).filter(x=>!/^[0-9]{4}$/.test(x));
  const score=doc=>tokens.reduce((n,t)=>n+(normalize(doc.title+" "+doc.title_en).includes(t)?6:0)+(normalize(doc.text+" "+doc.text_en).includes(t)?1:0),0);
  docs=pool.filter(d=>!chosen||d.topic===chosen).map(d=>({...d,_score:score(d)})).filter(d=>d._score>=4).sort((a,b)=>b._score-a._score).slice(0,2);
 }
 if(!docs.length)return {kind:"insufficient",title:local(lang,"Bukti belum cukup","Insufficient evidence"),lead:local(lang,"Belum tersedia bukti yang cocok untuk menjawab pertanyaan khusus ini. Saya tidak akan menggantinya dengan angka atau provinsi lain.","There is no suitably matched evidence for this question. The system will not substitute another region or invent data."),sections:[],sources:[],metrics:[],limit:"",geo:[],suggestions:[]};
 const sources=docs.map(d=>source(lang==="id"?d.title:d.title_en||d.title,d.source_url,d.period,d.publisher,d.source_date));
 const sections=[];
 if(concept==="inflation"&&docs.some(d=>d.id==="macro-inflation_yoy")){
  const d=docs.find(d=>d.id==="macro-inflation_yoy"),v=fmt(d.metric.value,lang);
  sections.push({title:local(lang,"Interpretasi tekanan harga","Interpreting price pressures"),body:local(lang,
   "Inflasi IHK umum tercatat "+v+"% year-on-year pada September 2026. Angka ini mengukur perubahan tingkat harga dibanding September tahun sebelumnya, bukan kenaikan harga bulanan atau proyeksi inflasi tahun penuh. Bagi investor, data ini relevan terhadap asumsi biaya dan daya beli, tetapi dampaknya berbeda antarindustri dan harus dilihat bersama upah, kurs serta kebijakan moneter."+cite(1),
   "Headline CPI inflation was "+v+"% year-on-year in September 2026. This compares prices with September of the previous year, not month-on-month inflation or an annual forecast. Investors may use it to stress-test costs and spending assumptions, but sector effects also depend on wages, exchange rates and monetary policy."+cite(1))});
 }else if(concept==="interest"&&docs.some(d=>d.id==="macro-bi_policy_rate")){
  const d=docs.find(d=>d.id==="macro-bi_policy_rate");
  sections.push({title:local(lang,"Implikasi kebijakan moneter","Monetary policy implications"),body:local(lang,
  "BI policy rate yang tercatat sebesar "+fmt(d.metric.value,lang)+"% pada "+d.period+". Ini adalah tingkat kebijakan moneter, bukan suku bunga pinjaman spesifik setiap bank. Evaluasi pembiayaan proyek tetap membutuhkan bunga efektif kredit, tenor, struktur modal, inflasi, dan risiko nilai tukar."+cite(1),
  "The recorded BI policy rate was "+fmt(d.metric.value,lang)+"% as of "+d.period+". It is a monetary policy rate, not an individual project's borrowing rate. Financing assessment requires actual lending costs, tenor, capital structure, inflation and FX risk."+cite(1))});
 }else if(concept==="currency"&&docs.some(d=>d.id==="macro-usd_idr_jisdor")){
  const d=docs.find(d=>d.id==="macro-usd_idr_jisdor");
  sections.push({title:local(lang,"Eksposur nilai tukar","Currency exposure"),body:local(lang,
  "Kurs referensi JISDOR USD/IDR pada "+d.period+" tercatat "+fmt(d.metric.value,lang,0)+" rupiah per dolar AS. Kurs tanggal tertentu bukan perkiraan kurs mendatang maupun tarif transaksi bank. Dampak pada investasi bergantung pada mata uang belanja modal, pembelian barang impor, dan kewajiban valas."+cite(1),
  "The USD/IDR JISDOR reference rate was "+fmt(d.metric.value,lang,0)+" rupiah per US dollar as of "+d.period+". This is a dated reference, not a future exchange-rate forecast or tradable quote. Project exposure depends on imported capital goods and foreign-currency liabilities."+cite(1))});
 }else if(concept==="growth"&&docs.some(d=>d.id==="macro-real_gdp_growth")){
  const d=docs.find(d=>d.id==="macro-real_gdp_growth");
  sections.push({title:local(lang,"Pembacaan pertumbuhan nasional","National growth assessment"),body:local(lang,
  "Pertumbuhan PDB riil "+fmt(d.metric.value,lang)+"% YoY pada kuartal II 2026 adalah perbandingan terhadap kuartal II tahun 2025, bukan pertumbuhan tahunan penuh. Investor perlu memeriksa komposisi sektor dan kontribusi wilayah sebelum mengaitkannya dengan peluang proyek tertentu."+cite(1),
  "Real GDP grew "+fmt(d.metric.value,lang)+"% year-on-year in Q2 2026, comparing the quarter with Q2 2025—not calendar-year growth. Sectoral composition and regional contribution are needed before drawing project-specific conclusions."+cite(1))});
 }else if(concept==="trade"&&docs.length>=2&&docs[0].metric&&docs[1].metric){
  const ex=docs.find(x=>x.id==="macro-exports_month"),im=docs.find(x=>x.id==="macro-imports_month");
  if(ex&&im)sections.push({title:local(lang,"Posisi perdagangan barang","Merchandise trade position"),body:local(lang,
  "Nilai ekspor barang Agustus 2026 sebesar US$"+fmt(ex.metric.value,lang)+" miliar, sedangkan impor US$"+fmt(im.metric.value,lang)+" miliar. Selisih ekspor dikurangi impor pada bulan yang sama sekitar US$"+fmt(ex.metric.value-im.metric.value,lang)+" miliar; ini tidak identik dengan neraca berjalan, tidak memerinci komoditas, dan bukan proyeksi."+cite(1)+cite(2),
  "Goods exports in August 2026 were US$"+fmt(ex.metric.value,lang)+" billion versus imports of US$"+fmt(im.metric.value,lang)+" billion. The monthly difference was approximately US$"+fmt(ex.metric.value-im.metric.value,lang)+" billion; this is not the current-account balance and does not provide a commodity breakdown or forecast."+cite(1)+cite(2))});
 }else if(concept==="econometric"||concept==="investment"){
  sections.push({title:local(lang,"Kerangka analisis investasi","Investment analytical framework"),body:local(lang,
  "PMTB mencerminkan pembentukan modal tetap dalam akun pengeluaran PDRB. Indikator ini berbeda dari investasi terealisasi BKPM, komitmen proyek, dan estimasi multiplier effect. Analisis ekonometrika memerlukan data lintas waktu dan wilayah yang konsisten serta spesifikasi model; tidak ada koefisien kausal yang dihitung oleh preview ini."+cite(1),
  "GFCF is fixed capital formation within expenditure accounts, distinct from BKPM realized investments, project commitments, or multiplier effects. Econometric inference needs consistent time-series/panel data and a validated model; this preview has not estimated causal coefficients."+cite(1))});
 }else if(concept==="ai"||concept==="minerals"){
  const titles=docs.map(d=>d.title);
  sections.push({title:local(lang,"Kemajuan proyek dan keterbatasan bukti","Project progress and evidence gaps"),body:local(lang,
  "Sampel registri mencakup "+titles.join(", ")+". Proyek berada pada tahap yang berbeda, sehingga rencana kapasitas, pengumuman investasi, konstruksi, dan operasi tidak boleh dijumlahkan atau dianggap sebagai nilai investasi terealisasi. Ketersediaan listrik, logistik, izin, dan pembeli akhir masih perlu diperiksa per proyek."+docs.map((_,i)=>cite(i+1)).join(""),
  "The selected registry includes "+titles.join(", ")+". Capacity plans, investment announcements, construction and operations are different stages and cannot be aggregated as realized investment. Power, logistics, permits and downstream demand require project-specific verification."+docs.map((_,i)=>cite(i+1)).join(""))});
 }
 if(!sections.length)sections.push({title:local(lang,"Apa yang benar-benar diketahui","What the evidence actually establishes"),body:(lang==="id"?docs[0].text:docs[0].text_en||docs[0].text)+cite(1)});
 sections.push({title:local(lang,"Implikasi dan pemeriksaan lanjutan","Implications and validation"),body:local(lang,
  "Temuan ini merupakan dasar penyaringan awal, bukan keputusan investasi. Perbedaan periode statistik, metode pengukuran, status implementasi, dan keterbatasan cakupan sumber harus diperiksa sebelum menggunakan angka dalam proyeksi atau penilaian risiko.",
  "This supports early screening rather than a final investment decision. Verify indicator vintages, methodology, implementation status and completeness before incorporating figures into forecasts or risk assessments.")});
 const metrics=docs.filter(d=>d.metric&&datum(d.metric.value)).slice(0,3).map(d=>({label:d.metric.label,value:fmt(d.metric.value,lang,2)+" "+d.metric.unit,period:d.metric.period,citation:docs.indexOf(d)+1}));
 return {kind:"theme",geo:[],title:local(lang,"SLI Research Assessment · ","SLI Research Assessment · ")+(concept||chosen||"Indonesia"),lead:local(lang,"Penilaian dirumuskan dari indikator atau proyek yang relevan beserta implikasi dan batasannya—bukan hasil pencarian mentah.","An assessment of relevant observations, interpretation and evidence gaps—not raw search listings."),sections,metrics,sources,limit:local(lang,"Analisis hanya memakai cuplikan Open yang bersumber; model AI generatif dan dataset lengkap Pro belum tersedia.","Uses a limited public curated corpus; generative AI and full Pro research datasets are not yet live."),suggestions:[]};
}
export function buildResearchReport(question,profiles,corpus,lang="id",topic="all"){
 if(!String(question||"").trim())return null;
 const q=String(question).trim().slice(0,500);
 const province=generateProvinceReport(q,profiles,lang);
 return province||generateThematicReport(q,corpus,lang,topic);
}
export function reportToText(report,question,lang="id"){
 if(!report)return "";
 const body=[report.title,local(lang,"Pertanyaan: ","Question: ")+question,"",report.lead,""];
 for(const s of report.sections)body.push(s.title+"\n"+s.body+"\n");
 if(report.limit)body.push(local(lang,"Batasan: ","Limitations: ")+report.limit);
 body.push("",local(lang,"Sumber:","Sources:"));
 for(const [i,s] of report.sources.entries())body.push("["+(i+1)+"] "+s.publisher+" · "+s.period+" · "+s.source_url);
 return body.join("\n");
}