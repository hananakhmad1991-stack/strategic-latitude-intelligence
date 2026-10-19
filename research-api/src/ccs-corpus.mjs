/* CCS-only owner-preview bridge: SLI's existing PUBLIC governance/CCS registry,
 * supplemented by dated operator/regulator primary milestone reports.
 * Project-wide LNG, drilling, FID and CO2-injection commissioning are distinct.
 * This is NOT a complete 2026 national project audit.
 */
import governance from "../../data/energy-governance-ccs.json" with {type:"json"};

const PROJECTS=governance.ccs?.projects||[];
const PRIMARY=[
 {
  id:"sli_ccs_bp_ucc_fabrication_2025",
  name:"Tangguh UCC — bp first steel cutting at Karimun yard",
  date:"2025-07-30",location:"West Papua",
  publisher:"bp and SKK Migas",
  source:"https://www.bp.com/content/dam/bp/country-sites/en_id/indonesia/home/news/press-releases/ENG_Photo%20Release_Proyek%20Tangguh%20UCC%20di%20Karimun%20Yard.pdf",
  text:"PRIMARY OPERATOR MILESTONE (30 July 2025): bp reported first steel cutting on 29 July 2025 for fabrication of the Tangguh UCC offshore platform jacket at the Karimun yard. The UCC development combines Ubadari gas field, enhanced gas recovery through CCUS and compression. This is evidence of physical FABRICATION work for Tangguh UCC, NOT verified commercial CO2 injection or operated storage volume. Distinguish Tangguh LNG Train 3 operation since 2023 from newer UCC/CCUS component commissioning."
 },
 {
  id:"sli_ccs_bp_ucc_fid_2024",
  name:"Tangguh UCC — bp operator FID",
  date:"2024-11-21",location:"West Papua",publisher:"bp",
  source:"https://www.bp.com/content/dam/bp/country-sites/id_id/indonesia/home/news/press-releases/241121%20Siaran%20pers%20proyek%20Tangguh%20UCC.pdf",
  text:"PRIMARY OPERATOR FID (21 November 2024): bp and PSC partners approved final investment decision for integrated Ubadari/CCUS/Compression development. Approximate sequestration POTENTIAL 15 million tonnes of CO2 in an initial phase is prospective, NOT CO2 already injected. Integrated project investment cannot be assigned in full to CCS alone. FID and construction evidence do not prove commercial injection startup."
 },
 {
  id:"sli_ccs_inpex_abadi_offtake_2026",
  name:"Abadi LNG Masela — INPEX offtake negotiations and FID status, May 2026",
  date:"2026-05-20",location:"Maluku",publisher:"INPEX",
  source:"https://www.inpex.com/english/news/upload/20260520.pdf",
  text:"PRIMARY OPERATOR STATUS (20 May 2026): INPEX reported agreements in principle for LNG and pipeline gas offtake while continuing toward a final investment decision for Abadi LNG. Abadi development includes a PLANNED CCS component. Gas offtake agreements are not proof of CCS-only construction or operational CO2 storage. Interpret this update alongside later 16 July 2026 ESDM press release reporting broader LNG PROJECT groundbreaking; neither announcement establishes commercial CCS commissioning."
 },
 {
  id:"sli_ccs_esdm_abadi_groundbreaking_2026",
  name:"Abadi Masela — ESDM confirms broader LNG project groundbreaking",
  date:"2026-07-16",location:"Maluku",publisher:"Kementerian ESDM",
  source:"https://esdm.go.id/id/media-center/arsip-berita/pembangunan-lng-abadi-masela-mulai-jalan-pemerintah-dorong-pertumbuhan-ekonomi-lokal-",
  text:"PRIMARY GOVERNMENT REPORT (16 July 2026): Kementerian ESDM reported a groundbreaking and commencement of physical development for the INTEGRATED Abadi Masela LNG PROJECT with a reported whole-project value of USD20.9 billion. This does NOT independently establish that the CCS sub-facility entered mechanical construction or commissioned CO2 injection. Separate LNG-wide commencement, CCS-specific EPC progress, and full-scale storage operation. Amount refers to whole LNG project, NOT dedicated CCS capex or actual disbursement. INPEX previously described ongoing FEED and pre-FID commercial preparations."
 },
 {
  id:"sli_ccs_phe_sukowati_phase1_injection_2024",
  name:"Sukowati CO2-EOR — Pertamina reports successful historical phase-1 pilot",
  date:"2024-11",location:"East Java",publisher:"Pertamina Corporate Newsletter",
  source:"https://www.pertamina.com/Media/File/CNU%20November%202024.pdf",
  text:"PRIMARY COMPANY DISCLOSURE (Pertamina November 2024, retrospective): Pertamina reported SUKOWATI Phase-1 Huff & Puff CO2 INJECTION was SUCCESSFULLY carried out in 2023. It described an August 2024 Joint Study Agreement for Phase-2 inter-well injection and a planned Q4 2024 start; the stated plan is not proof phase-2 injection occurred. This contradicts an older stage label 'study/pilot planned' if interpreted as NO past injection. A historical CO2-EOR pilot test does NOT establish full-scale commercial CCS storage operation in 2026, certified stored tonnes or CCS-only realized investment. Preserve source dates and distinguish operator statement from independently audited measurement."
 },
 {
  id:"sli_ccs_esdm_sukowati_trial_2024",
  name:"Sukowati and Jatibarang — ESDM confirms CO2-EOR trial injections had begun",
  date:"2024-08-01",location:"East Java and West Java",publisher:"Kementerian ESDM",
  source:"https://www.esdm.go.id/en/media-center/news-archives/penyimpanan-karbon-jadi-solusi-reduksi-emisi-dan-capai-target-nze-di-2060",
  text:"PRIMARY GOVERNMENT STATEMENT (1 August 2024, Press Release 395.Pers/04/SJI/2024): ESDM stated trial CO2 injections especially for enhanced oil recovery had ALREADY STARTED in some fields, naming Sukowati and Jatibarang operated by Pertamina. This supports a historical pilot-injection milestone, NOT continuous commercial operation of a dedicated 2026 geological CCS storage service. The statement does not establish injection date per well, 2026 throughput, independently measured stored volume or realised CCS-only capital spending."
 },
 {
  id:"sli_ccs_esdm_gundih_pilot_statement_2022",
  name:"Gundih CCS/CCUS — ESDM historical statement on pilot injection",
  date:"2022-03-24",location:"Central Java",publisher:"Ditjen Migas Kementerian ESDM",
  source:"https://migas.esdm.go.id/post/jaring-perspektif-pengembangan-ccs-ccus-kementerian-esdm-diskusi-dengan-negara-mitra",
  text:"PRIMARY GOVERNMENT STATEMENT (24 March 2022): Indonesia's Director General of Oil and Gas said historical Gundih CCS studies dating back around a decade had REACHED a pilot-injection stage and described an ambition to transition to CCUS. This is an attributed regulator statement, not an operator metering report. The Gundih dashboard's 'study/pre-FEED' label may refer to a different later full-scale development. Do NOT conclude Gundih never piloted injection; also do NOT equate historical pilot to commercially operating CCS/CCUS in 2026, completed storage infrastructure, a FID, or certified cumulative CO2 sequestered."
 },
 {
   id:"sli_ccs_esdm_national_2025_report",
  name:"Indonesia CCS/CCUS national potential-project roster — ESDM 2025 performance report",
  date:"2025",location:"Indonesia",publisher:"Ditjen Migas Kementerian ESDM",
  source:"https://www.esdm.go.id/assets/media/content/content-laporan-kinerja-ditjen-minyak-dan-gas-bumi-tahun-2025.pdf",
  text:"OFFICIAL 2025 REPORT (publication date not established in this source summary): ESDM enumerates multiple potential CCS/CCUS projects and historical studies, including Tangguh UCC, Gundih, Sukowati, Jatibarang, Arun, Sunda-Asri, Sakakemang, East Kalimantan and Donggi Matindok. They are a potential-project/study ROSTER, not a live census of commissioned sites as of 2026. National estimated geological storage potential is NOT injectivity-tested, licensed or operating capacity. Original report should be consulted for the project-by-project vintage."
 }
];
const clean=(s,n=350)=>String(s??"").replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,n);
export function isCCSQuestion(question){
 const q=String(question||"");
 return /(?:\bccs\b|\bccus\b|\bco[\u2082\u2083₂]?[- ]?(?:eor|egr)\b|carbon captur|carbon storag|penangkapan karbon|penyimpanan karbon|sekuestrasi karbon|injeksi co2|injeksi co₂)/i.test(q);
}
function projectDocument(p,i){
 if(!p||!/^https:\/\//.test(String(p.source||""))||!p.name)return null;
 const investment=p.investment_usd_billion==null?"CCS investment not quantified in cited evidence":String(p.investment_usd_billion)+" USD billion is a stated bundled/estimated project amount, NOT proven CCS-only realized capital expenditure";
 const capacity=p.storage_million_tco2==null?"CO2 storage or injection volume not independently quantified":String(p.storage_million_tco2)+" million tonnes CO2 is potential or indicative storage over its stated horizon, NOT CO2 already injected";
 return {id:"sli_ccs_project_"+String(i+1).padStart(2,"0"),
   title:clean(p.name,190),geo:clean(p.location,100),period:clean(p.date||"date not confirmed",28),
   source_date:clean(p.date||"not confirmed",28),publisher:clean(p.operator||"Project source",120),
   source_url:p.source,access:"pro",topic:"energy project investment carbon capture CCS CCUS",
   text:"SLI PUBLIC CCS PROJECT DOSSIER — DATED, NOT AUTOMATICALLY UPDATED: "+clean(p.name,160)+
    ". Reported stage: "+clean(p.stage,85)+". Detailed status: "+clean(p.status,170)+
    ". Location: "+clean(p.location,100)+". Operator: "+clean(p.operator,140)+
    ". Partners: "+clean(p.partners,140)+". Source vintage: "+clean(p.date,30)+
    ". Investment scope: "+clean(p.investment_basis,260)+". "+investment+
    ". Storage metric: "+clean(p.storage_basis,230)+". "+capacity+
    ". Forward target: "+clean(p.target,230)+". Actual injection/capex caution: "+clean(p.realization,260)+
    ". CRITICAL: this stage label is a DATED DASHBOARD SNAPSHOT and may predate later public operator/regulator pilot milestones. Use newer dated primary disclosures where available, not the stale label alone. Gas/LNG groundbreaking, FEED, FID, historic pilot injection, CCUS-platform fabrication and COMMERCIAL CO2 injection are NOT interchangeable. Never claim 2026 commercial CCS operating from an older target year."};
}
function primaryDocument(p){
 return {id:p.id,title:p.name,geo:p.location,period:p.date,source_date:p.date,
  publisher:p.publisher,source_url:p.source,access:"pro",topic:"energy project investment carbon capture CCS CCUS",text:p.text};
}
export function ccsResearchEvidence(question){
 if(!isCCSQuestion(question))return [];
 const primary=PRIMARY.map(primaryDocument);
 const projects=PROJECTS.map(projectDocument).filter(Boolean);
 // Front-load actual physical UCC fabrication and the distinction between LNG construction and CCS operation;
 // preserve the full local dossiers even if underlying main project registry returns only Masela.
 const ordered=[primary[0],primary[3],primary[2],primary[1],primary[5],primary[6],primary[7],...projects,primary[4]];
 const seen=new Set();return ordered.filter(d=>{if(seen.has(d.id))return false;seen.add(d.id);return true});
}
