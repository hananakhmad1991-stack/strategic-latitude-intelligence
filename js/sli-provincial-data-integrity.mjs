/* Source-aware provincial indicator registry and fail-closed panel audit.
 * Coverage here reflects datasets actually available in this repository,
 * not a claim that statistics are unavailable from national publishers.
 */
import {buildBpsOfficialPanel} from "./sli-bps-official-panel.mjs";
const BPS_GRDP="https://www.bps.go.id/id/publication/2026/04/30/f01b7d753185ea2e879d321f/produk-domestik-regional-bruto-provinsi-provinsi-di-indonesia-menurut-pengeluaran-2021-2025.html";
const BPS_POLITICS="https://www.bps.go.id/id/publication/2025/12/22/8bc8ad59afe1985f822fce41/statistik-politik-2025.html";
const PLN="https://www.pln.co.id/webapi/media/file/webkorp/asset/Statistik2024.pdf";
const ESDM="https://www.esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf";
const GINI="https://www.bps.go.id/assets/statistics-table/2/OTgjMg%3D%3D/gini-rasio--maret-2026.html";
export const OFFICIAL_INDICATORS=Object.freeze([
 {id:"growth",label:"Pertumbuhan PDRB riil",publisher:"BPS",years:"2022–2025",grain:"province_year",readiness:"panel_ready",source:BPS_GRDP,units:"% YoY · ADHK 2010",role:"dependent",rule:"GRDP ADHK t / ADHK t−1 − 1"},
 {id:"pmtb_lag",label:"PMTB / PDRB tahun sebelumnya",publisher:"BPS",years:"2021–2024 → 2022–2025",grain:"province_year",readiness:"panel_ready",source:BPS_GRDP,units:"% · ADHB lag-1",role:"exploratory_predictor",rule:"PMTB ADHB t−1 / PDRB ADHB t−1; bukan BKPM"},
 {id:"household_lag",label:"Konsumsi rumah tangga / PDRB tahun sebelumnya",publisher:"BPS",years:"2021–2024 → 2022–2025",grain:"province_year",readiness:"panel_ready",source:BPS_GRDP,units:"% · ADHB lag-1",role:"optional_exploratory_predictor",rule:"Household ADHB t−1 / PDRB ADHB t−1; share components may be compositional and collinear"},
 {id:"press_freedom",label:"Indeks Kemerdekaan Pers (IKP)",publisher:"BPS / Dewan Pers",years:"2020–2024",grain:"province_year",readiness:"context_only",source:BPS_POLITICS,units:"index · 0–100",role:"governance_context",rule:"Tersedia di corpus; seri provinsi 2025 tidak ada sehingga tidak dilengkapi dengan nilai buatan"},
 {id:"gini",label:"Rasio Gini provinsi",publisher:"BPS",years:"Maret 2026",grain:"province_snapshot",readiness:"no_year_panel",source:GINI,units:"0–1",role:"context",rule:"Snapshot Maret 2026; jangan disalin ke 2022–2025"},
 {id:"grid_assets",label:"Infrastruktur distribusi/transmisi PLN",publisher:"PLN",years:"2024",grain:"operating_region_snapshot",readiness:"geography_mismatch",source:PLN,units:"MVA / aset UID atau UIT",role:"energy_context",rule:"Wilayah operasi PLN ≠ provinsi; rating aset ≠ daya tersedia"},
 {id:"ev_chargers",label:"SPKLU/SPBKLU menurut provinsi",publisher:"ESDM",years:"2025",grain:"province_snapshot",readiness:"no_year_panel",source:ESDM,units:"jumlah lokasi",role:"energy_context",rule:"Satu tahun saja; tidak mengukur kapasitas listrik atau keandalan jaringan"},
 {id:"employment",label:"TPT, TPAK, dan tenaga kerja tahunan",publisher:"BPS",years:"belum diaudit",grain:"province_year_target",readiness:"source_not_ingested",source:null,units:"% dan orang",role:"future_control",rule:"Membutuhkan seri Agustus/Februari sebanding dan penyesuaian wilayah"},
 {id:"education",label:"IPM / pendidikan menurut provinsi",publisher:"BPS",years:"belum diaudit",grain:"province_year_target",readiness:"source_not_ingested",source:null,units:"indeks/tahun",role:"future_control",rule:"Membutuhkan seri BPS versi sama dan kode batas provinsi konsisten"},
 {id:"bkpm",label:"Realisasi PMA/PMDN tahunan",publisher:"Kementerian Investasi / BKPM",years:"belum diaudit",grain:"province_year_target",readiness:"source_not_ingested",source:null,units:"Rp / US$ dan proyek",role:"future_investment_control",rule:"Tidak setara PMTB/PDRB, jangan dicampur tanpa penyelarasan definisi"}
]);
const finite=n=>typeof n==="number"&&Number.isFinite(n);
const round=n=>Math.round(n*1e6)/1e6;
/** Governance-context series, not automatically a growth determinant. 2025 absent. */
export function buildBpsPressFreedomContext(src){
 if(src?.sources?.politics?.url!==BPS_POLITICS||src?.press_years?.join(",")!=="2020,2021,2022,2023,2024")
  throw Error("BPS Politik press-freedom index year or provenance changed");
 const panel=buildBpsOfficialPanel(src,{balanced:true});
 const selected=new Set(panel.rows.map(r=>r.province));
 const records=[];
 for(const province of src.provinces.filter(p=>selected.has(p.name))){
  if(!Array.isArray(province.press_freedom)||province.press_freedom.length!==5)throw Error("IKP source columns malformed");
  for(let yr=2022;yr<=2024;yr++){
   const value=province.press_freedom[src.press_years.indexOf(yr)];
   if(!finite(value)||value<0||value>100)throw Error("IKP missing or outside 0-100 for "+province.name+" "+yr);
   records.push({province:province.name,year:yr,press_freedom_ikp:value});
  }
 }
 if(records.length!==96||new Set(records.map(r=>r.province)).size!==32)throw Error("IKP province-year sample mismatch");
 return {publisher:"BPS (source: Dewan Pers)",source:BPS_POLITICS,scope:"governance-context-only",year_counts:{"2022":32,"2023":32,"2024":32},n:96,
  missing_2025:true,not_a_causal_growth_control:true,
  caution:"IKP index is an institutional context series; 2025 missing. Avoid automatic joining to 2025 and no causal investment claims.",
  rows:records};
}

export function auditOfficialProvincialData(src,preview){
 const panel=buildBpsOfficialPanel(src,{balanced:true});
 const errors=[],warnings=[],details={};
 const rawYears=src.grdp_years;
 const records=src.provinces;
 for(const key of ["grdp_current","grdp_constant","pmtb_current","household_current"]){
  const availability=Object.fromEntries(rawYears.map((yr,i)=>[yr,records.filter(p=>finite(p[key]?.[i])).length]));
  details[key]={unit:src.metrics?.[key]?.unit||"IDR billion",availability_by_year:availability,source_pdf_page:src.metrics?.[key]?.source_pdf_page||null};
  if(availability[2021]!==34||availability[2022]!==34||availability[2023]!==38||availability[2024]!==38||availability[2025]!==38)
   errors.push("Unexpected BPS source coverage in "+key+"; revalidate publisher tables");
 }
 const expectedMissing=new Set(["Papua","Papua Barat","Papua Selatan","Papua Tengah","Papua Pegunungan","Papua Barat Daya"]);
 if(new Set(panel.excluded_provinces.map(x=>x.province)).size!==6||
 panel.excluded_provinces.some(x=>!expectedMissing.has(x.province)))errors.push("Unexpected Papua boundary exclusion list");
 if(panel.rows.length!==128||panel.entity_count!==32||Object.values(panel.year_counts).some(v=>v!==32))
  errors.push("Balanced annual sample coverage deviates from audited 32×4");
 const sampleKeys=["pmtb_share_lag1_pct","household_share_lag1_pct","real_grdp_growth_pct"];
 for(const key of sampleKeys){
  const bad=panel.rows.filter(r=>!finite(r[key])||Math.abs(r[key])>400);
  if(bad.length)errors.push("Invalid derived "+key+" in "+bad.length+" rows");
 }
 const differences=[];
 if(!preview||!Array.isArray(preview.provinces))errors.push("Missing independent 2025 BPS provincial snapshot for growth reconciliation");
 else for(const row of panel.rows.filter(r=>r.year===2025)){
  const p=preview.provinces.find(p=>p.name===row.province);
  if(!p||!finite(p.growth_real_2025_pct))errors.push("No 2025 snapshot match for "+row.province);
  else{
   const err=Math.abs(p.growth_real_2025_pct-row.real_grdp_growth_pct);
   differences.push({province:row.province,absolute_diff_pp:round(err)});
   if(err>0.005)errors.push("2025 growth mismatch >0.005 percentage points: "+row.province);
  }
 }
 let pressContext=null;
 try{pressContext=buildBpsPressFreedomContext(src)}
 catch(err){warnings.push("Non-essential governance context unavailable: "+String(err.message).slice(0,160)+". BPS GRDP audit remains independent.")}
 const extreme=panel.rows.filter(r=>Math.abs(r.real_grdp_growth_pct)>15).map(r=>({province:r.province,year:r.year,growth_pct:r.real_grdp_growth_pct}));
 if(extreme.length)warnings.push("Growth beyond ±15% is flagged for scrutiny, NOT deleted or mechanically labelled invalid.");
 warnings.push("2024 observations revised; 2025 preliminary — publication vintages affect stability.");
 warnings.push("Lagged capital and household expenditure shares are compositional and not causal investment treatment variables.");
 warnings.push("Two predecessor and four new Papua provinces excluded; fixed-boundary backcasts not yet verified.");
 warnings.push("No validated multi-year provincial electricity, employment or education controls yet loaded.");
 const result={
  id:"SLI-OFFICIAL-DATA-INTEGRITY-2026-10",
  status:errors.length?"blocked":"passed_with_caveats",
  source:{title:src.sources?.pdrb?.title,url:src.sources?.pdrb?.url,published:src.sources?.pdrb?.released,source_years:rawYears},
  panel:{n:panel.n,entities:panel.entity_count,years:panel.growth_years,year_counts:panel.year_counts,
   excluded:panel.excluded_provinces,missing_policy:panel.missingness_policy},
  source_coverage:details,
  crosscheck:{sample_size:differences.length,max_abs_diff_pp:differences.length?round(Math.max(...differences.map(d=>d.absolute_diff_pp))):null,tolerance_pp:0.005},
  governance_context:pressContext?{rows:pressContext.n,years:[2022,2023,2024],publisher:pressContext.publisher,source:pressContext.source,missing_2025:true,status:"context_only"}:null,
  review_queue:{extreme_growth:extreme,extreme_count:extreme.length},
  errors,warnings,
  sources:OFFICIAL_INDICATORS.map(({id,label,publisher,years,grain,readiness,source,units,role,rule})=>({id,label,publisher,years,grain,readiness,source,units,role,rule}))
 };
 return result;
}
