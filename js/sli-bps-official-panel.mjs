/* BPS official 2021–2025 province GRDP by expenditure, curated in existing SLI corpus.
 * This builder performs transparent DERIVED computations; it never imputes missing
 * Papua histories or treats national Gini / PLN 2024 as provincial annual indicators.
 */
export const BPS_PANEL_META=Object.freeze({
 id:"sli-bps-official-annual-grdp-panel-v2-boundary-harmonized",
 publisher:"BPS (Badan Pusat Statistik)",
 title:"PDRB Provinsi-Provinsi Menurut Pengeluaran 2021–2025 (Vol. 12, 2026)",
 url:"https://www.bps.go.id/id/publication/2026/04/30/f01b7d753185ea2e879d321f/produk-domestik-regional-bruto-provinsi-provinsi-di-indonesia-menurut-pengeluaran-2021-2025.html",
 published:"2026-04-30",
 base_year:2010,
 observation_vintage:"2024 revised, 2025 preliminary",
 provenance:"SLI curated BPS table arrays; annual ratios and year-on-year growth computed client-side",
 licensing:"Check BPS permission before redistributing substantial source tables commercially.",
 admin_boundary_sources:[
  "https://papua.bps.go.id/id/pressrelease/2024/02/05/876/pertumbuhan-ekonomi-",
  "https://papuabarat.bps.go.id/id/publication/2024/04/04/038627aa90c2a310aaf907c6/gross-regional-domestic-product-of-papua-barat-province-by-industry-20192023.html"
 ],
 admin_boundary_note:"Papua and Papua Barat GRDP prior to 2023 include areas split into four new provinces. 2022->2023 level comparisons are not like-for-like without geographic backcasting; do not present the collapse as economic contraction."
});
const valid=n=>typeof n==="number"&&Number.isFinite(n);
const round=n=>Math.round(n*1e6)/1e6;
const required=["grdp_current","grdp_constant","pmtb_current","household_current"];
const nonneg=v=>valid(v)&&v>=0;
const normalized=str=>String(str||"").trim();
export function buildBpsOfficialPanel(src,{balanced=true}={}){
 if(!src||src.schema!=="sli-bps-regional-intelligence-v1"||
  !Array.isArray(src.provinces)||!Array.isArray(src.grdp_years))
  throw Error("Expected authenticated source-format BPS provincial SLI data");
 const years=src.grdp_years;
 if(years.join(",")!=="2021,2022,2023,2024,2025")
  throw Error("BPS vintage/year schema changed; re-verify source before computing growth");
 if(src.sources?.pdrb?.url!==BPS_PANEL_META.url)throw Error("Unexpected BPS publication provenance");
 if(src.provinces.length!==38||new Set(src.provinces.map(p=>p.name)).size!==38)
  throw Error("Expected exactly 38 unique provincial records; stop if publication changed");
 const allowed=src.provinces.filter(p=>required.every(k=>Array.isArray(p[k])&&p[k].length===5));
 if(allowed.length!==38)throw Error("Missing or malformed GRDP/PMTB series");
 const rows=[],omitted=[];
 const boundaryBreakProvinces=new Set(["Papua","Papua Barat"]);
 // BPS documents 2023 separation of Papua / Papua Barat into new provinces.
 // Do not treat the abrupt 2022–2023 change of administrative coverage as true GRDP growth.
 // Until fixed-boundary backcasts are independently verified, exclude both predecessor
 // provinces from *all* candidate regression panels, not just the 2023 transition.

 for(const p of allowed){
  const name=normalized(p.name);
  if(!name||name.length>90)throw Error("Invalid province name");
  if(boundaryBreakProvinces.has(name)){
   omitted.push({province:name,reason:"2023 province-boundary break: 2022/2023 pre/post split PDRB not comparable; predecessor entity excluded without imputation or false negative growth"});
   continue;
  }
  const complete2021to25=years.every((year,i)=>required.every(k=>nonneg(p[k][i])))&&years.every((year,i)=>p.grdp_current[i]>0&&p.grdp_constant[i]>0);
  if(balanced&&!complete2021to25){
   omitted.push({province:name,reason:"missing BPS 2021–2022 comparability; never imputed"});
   continue;
  }
  for(let i=1;i<years.length;i++){
   const previous=required.every(k=>nonneg(p[k][i-1]))&&p.grdp_current[i-1]>0&&p.grdp_constant[i-1]>0;
   const current=required.every(k=>nonneg(p[k][i]))&&p.grdp_current[i]>0&&p.grdp_constant[i]>0;
   if(!previous||!current)continue;
   const prevCurrent=p.grdp_current[i-1],currentCurrent=p.grdp_current[i];
   const growth=100*(p.grdp_constant[i]/p.grdp_constant[i-1]-1);
   const pmtbLag=100*p.pmtb_current[i-1]/prevCurrent;
   const pmtbCurrent=100*p.pmtb_current[i]/currentCurrent;
   const householdCurrent=100*p.household_current[i]/currentCurrent;
   if(![growth,pmtbLag,pmtbCurrent,householdCurrent].every(Number.isFinite)||
     pmtbLag<0||pmtbLag>250||pmtbCurrent<0||pmtbCurrent>250||
     householdCurrent<0||householdCurrent>250||growth<-99||growth>500)
    throw Error("Implausible BPS-derived provincial values; inspect publication and units");
   rows.push({
    province:name,year:years[i],
    pmtb_share_lag1_pct:round(pmtbLag),
    real_grdp_growth_pct:round(growth),
    pmtb_share_pct:round(pmtbCurrent),
    household_share_pct:round(householdCurrent),
    grdp_current_rp_billion:round(currentCurrent),
    grdp_constant_2010_rp_billion:round(p.grdp_constant[i]),
    vintage_status:years[i]===2025?"preliminary":years[i]===2024?"revised":"published"
   });
  }
 }
 const provinces=new Set(rows.map(r=>r.province)),observedYears=new Set(rows.map(r=>r.year));
 const counts=Object.fromEntries(years.slice(1).map(year=>[year,rows.filter(r=>r.year===year).length]));
 if(balanced&&(rows.length!==128||provinces.size!==32||observedYears.size!==4||
  Object.values(counts).some(n=>n!==32)))
  throw Error("Balanced BPS 2022–2025 panel coverage changed; hold model for provenance review");
 if(!balanced&&(rows.length!==136||provinces.size!==36))
  throw Error("Unbalanced BPS panel coverage changed; hold for review");
 if(new Set(rows.map(r=>r.province+"|"+r.year)).size!==rows.length)throw Error("Duplicate province-year row");
 return {
  schema:"sli-bps-official-panel-derived-v2-geographically-screened",
  status:"source_attributed_not_official_model_estimate",
  publication:BPS_PANEL_META,
  balanced,
  selected_baseline:balanced?"32 geographically comparable provinces, 2022–2025":"36 provinces with available years, excluding Papua and Papua Barat until boundary backcasting",
  source_years:years,
  growth_years:years.slice(1),
  n:rows.length,
  entity_count:provinces.size,
  year_counts:counts,
  excluded_provinces:omitted,
  missingness_policy:"Never invent missing province-years; four new Papua provinces lack 2021–22 BPS back-series; pre-split Papua/Papua Barat are excluded from regressions because 2023 values cannot be compared with pre-2023 territory.",
  model_policy:"Exploratory association with LAGGED one-year PMTB share, NOT a causal estimate; FE and time FE do not eliminate time-varying confounding or endogenous composition.",
  alternative_metrics_policy:"Gini 2026 and PLN 2024 are distinct cross-sectional vintages; no fabricated annual merge.",
  commercial_reuse_warning:"Check original BPS commercial table-republication permission before selling/re-exporting extensive observations.",
  comparability_warning:"Crucial 2023 administrative break: old Papua and Papua Barat province boundaries change; apparent 2023 -71%/-34% unadjusted growth is NOT economic contraction. Excluded from official-data panel until fixed-boundary reconstructions are sourced.",
  rows
 };
}
