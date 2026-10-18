/* Structural change descriptive lens for SLI official-source province panel.
 * No time-series manufacturing shares or nickel causal attribution are fabricated.
 */
export function structuralEconomyEvidence(panel, register,smelterRegistry){
 if(panel?.schema!=="sli-bps-official-panel-derived-v2-geographically-screened"||
  panel?.n!==128||panel?.entity_count!==32||panel?.growth_years?.join(",")!=="2022,2023,2024,2025")
  throw Error("Structural lens requires audited BPS 32×4 provincial panel. No synthetic or unverified data.");
 if(register?.schema!=="sli-structural-industry-source-register-v1"||
  register?.validation_policy?.approved_observations!==128||
  register?.publications?.length!==6)throw Error("Publisher registry is missing or vintage changed.");
 const facts=register.case_facts;
 if(facts?.province!=="Maluku Utara"||facts.year!==2025||facts.publisher!=="BPS Maluku Utara"||
  !Number.isFinite(facts.manufacturing_real_growth_pct)||!facts.source?.startsWith("https://malut.bps.go.id/"))
  throw Error("Missing official Maluku Utara manufacturing observation and source.");
 const years=panel.growth_years;
 const yearSeries=years.map(year=>{
  const rows=panel.rows.filter(r=>r.year===year);
  if(rows.length!==32)throw Error("Panel year coverage not balanced: "+year);
  const values=rows.map(x=>x.real_grdp_growth_pct).sort((a,b)=>a-b);
  if(values.some(v=>typeof v!=="number"||!Number.isFinite(v)))throw Error("Non-numeric growth");
  const median=(values[15]+values[16])/2;
  const malut=rows.find(r=>r.province==="Maluku Utara");
  if(!malut)throw Error("Maluku Utara is not represented in balanced BPS panel");
  const rank=1+rows.filter(r=>r.real_grdp_growth_pct>malut.real_grdp_growth_pct).length;
  return {
   year,province_count:32,
   malut_real_grdp_growth_pct:malut.real_grdp_growth_pct,
   province_median_real_growth_pct:Number(median.toFixed(6)),
   malut_minus_median_pp:Number((malut.real_grdp_growth_pct-median).toFixed(6)),
   rank_descending:rank,
   rank_description:"Rank of growth among 32 provinces, unweighted, not ranking economic size.",
   national_caveat:"Unweighted provincial median is not Indonesia GDP growth."
  };
 });
 const recent=yearSeries.find(r=>r.year===2025);
 if(Math.abs(recent.malut_real_grdp_growth_pct-facts.real_grdp_growth_pct)>.01)
  throw Error("BPS February 2026 GRDP release disagrees with SLI expenditure dataset; check publication revisions.");
 const validSmelters=Array.isArray(smelterRegistry?.records)?
  smelterRegistry.records.filter(r=>r.province===facts.province):[];
 if(!validSmelters.every(r=>typeof r.id==="string"&&r.name&&r.source?.startsWith("https://")))
  throw Error("Malformed SLI facility dossiers; reject unsourced facility records.");
 const facilityExamples=validSmelters.filter(r=>/nickel|ferro|hpal|rke[f]|refin|smelt|mhp|cobalt/i.test(
  [r.product,r.technology,r.name,r.scope_note].filter(Boolean).join(" "))).slice(0,8).map(r=>({
   id:r.id,name:r.name,operator:r.operator||"unknown",product:r.product||"unspecified",
   stage:r.stage||"unverified",source:r.source,evidence_date:r.evidence_date||"undated",
   caveat:"Dossier about a named project/facility; not a provincially exhaustive industrial plant count or validated annual manufacturing output."
  }));
 const forecastAllowed=register.validation_policy.allow_industry_controls;
 if(forecastAllowed!==false||register.validation_policy.allow_historical_extension!==false)
  throw Error("Unverified historical values or industry controls must not be enabled for econometrics");
 return {
  schema:"sli-structural-economy-lens-v1",
  status:"descriptive_verified_input_only",
  data_range:"2022–2025 from BPS expenditure series",
  original_year_count:years.length,
  scope:panel.selected_baseline,
  province:"Maluku Utara",
  yearSeries,
  latest:{
   ...recent,
   malut_real_grdp_growth_pct:facts.real_grdp_growth_pct,
   grdp_calculated_from_BPS_ADHK_pct:recent.malut_real_grdp_growth_pct,
   manufacturing_real_growth_pct:facts.manufacturing_real_growth_pct,
   export_goods_services_growth_pct:facts.export_goods_services_growth_pct,
   source:facts.source,source_date:facts.source_date,
   vintage:facts.observation_vintage
  },
  facilityExamples,
  facility_disclosure:"Individual SLI operator/source dossiers are examples only. Never sum nameplate capacity, actual output or operating-facility counts across overlapping groups/projects.",
  historic_sources:register.publications.map(p=>({
   id:p.id,publisher:p.publisher,years:p.years,published:p.published,url:p.url,status:p.status
  })),
  research_gate:{
   historical_extension_ready:false,
   quantitative_industry_share_ready:false,
   panel_industry_regressors_ready:false,
   reason:"The official publications exist, but the provincial manufacturing ADHB/ADHK numeric series and 2019–2020 expenditure cells have not yet been digitized and reconciled in SLI.",
   minimum_checks:register.validation_policy.require
  },
  synthesis:[
   "Maluku Utara's 2025 annual real GRDP growth of "+facts.real_grdp_growth_pct+"% was high relative to the unweighted 32-province median ("+recent.province_median_real_growth_pct+"%). This measures provincial divergence, NOT the share of growth caused by nickel.",
   "The BPS release reports manufacturing output growth of "+facts.manufacturing_real_growth_pct+"% in 2025 and exports of goods and services growing "+facts.export_goods_services_growth_pct+"%. These are different annual growth indicators; none describes manufacturing's PDRB share or an investment multiplier.",
   "SLI documents nearby downstream-industry facility cases, but facility capacity, equity ownership and total regional industrial output are different objects. Longer fixed-geography sector histories and energy/labour controls are needed before including an industry explanatory variable in a panel model."
  ],
  methodological_limits:[
   "This is a descriptive evidence panel, not difference-in-differences, shift-share decomposition or a causal investment estimate.",
   "The 32-province comparator excludes Papua/Papua Barat and four new Papua provinces due to 2023 boundary changes.",
   "Feb 2026 Maluku Utara statistical release and April/September 2026 industry publications may use different data revisions; reconcile source vintages before extracting 2025 industry series.",
   "Industry manufacturing growth 62.64% must never be confused with contribution/share to annual GRDP growth.",
   "2020–2024 and 2021–2025 published tables overlap in 2021–2024, but numeric data must be checked before appending years."
  ]
 };
}
