/* SLI Owner Test: source-dated national energy evidence, derived from existing verified SLI inventories.
 * This is NOT live scraping; bundled datasets update on next Worker deployment.
 * News/headline monitoring is intentionally excluded from VERIFIED observations.
 */
import fundamentals from "../../data/energy-fundamentals.json" with {type:"json"};
import fiscal from "../../data/energy-prices-fiscal.json" with {type:"json"};
import transition from "../../data/energy-transition.json" with {type:"json"};
import assessment from "../../data/daily-energy-assessment.json" with {type:"json"};
import infrastructure from "../../data/energy-infrastructure-security.json" with {type:"json"};
const valid=u=>typeof u==="string"&&u.startsWith("https://");
const docs=[];
function add(id,title,text,url,period,publisher="ESDM",type="baseline"){
 if(!valid(url)||!text||!id)return;
 docs.push({id:"sli_energy_"+id,title,text,source_url:url,
  source_date:String(period),period:String(period),publisher,geo:"Indonesia",
  topic:"energy security indonesia national "+type,access:"pro",verified_source_kind:"source_dated_sli_snapshot"});
}
for(const [key,label]of [
 ["oil_production","Oil production · field average"],["oil_lifting","Oil lifting · definitions differ"],
 ["gas_production","Natural gas gross production"],["gas_domestic","Natural gas domestic allocation"],
 ["gas_export","Natural gas export allocation"],["oil_proved","Proved oil reserves"],
 ["gas_proved","Proved gas reserves"],["coal_production","Coal production"],
 ["coal_dmo","Coal domestic allocation"],["coal_export","Coal exports"],
 ["nre_share","Renewable share of primary energy"]]){
 const series=fundamentals.series[key];if(!series)continue;
 const y="2025",value=series.values?.[y],url=series.sources?.find(valid);
 if(typeof value!=="number"||!valid(url))continue;
 add(key,label,label+": "+value+" "+series.unit+" in "+y+
 ". "+String(series.note||"").slice(0,580)+
 " Distinguish production, lifting, imports, DMO and exports; these measures do not share the same denominator.",
 url,y,"ESDM",key.startsWith("coal")?"coal":key.startsWith("nre")?"renewables":"oil_gas");
}
for(const [id,r,label] of [
 ["oil_reserves",fundamentals.reserves.oil_proved,"Proved oil reserves"],
 ["gas_reserves",fundamentals.reserves.gas_proved,"Proved natural gas reserves"]]){
 if(typeof r?.value==="number")add(id,label,label+": "+r.value+" "+r.unit+" ("+r.year+"). Proved reserve stock, not one-year production or total resources.",r.source,r.year,"ESDM","oil_gas");
}
const paid=fiscal.subsidies?.combined_paid;
if(paid)add("subsidy_compensation_2026","Energy fiscal payments · 2026",
 "Indonesia January–September 2026 actual reported total of energy subsidies PLUS compensation paid: Rp "+paid.value+" trillion. It is NOT direct subsidies alone. This is partial-year paid fiscal expenditure, not annual full-year budget. "+paid.note,
 paid.source,paid.period,"Ministry of Finance / ANTARA","fiscal");
const q1=fiscal.subsidies?.q1_2026_actual;
if(q1)add("subsidies_q1","Direct energy subsidies · Q1 2026",
 "Direct energy subsidies paid during Q1 2026: Rp "+q1.value+" trillion; breakdown fuel Rp "+q1.breakdown.bbm+
 "tn, LPG 3kg Rp "+q1.breakdown.lpg_3kg+"tn, electricity Rp "+q1.breakdown.electricity+
 "tn. This EXCLUDES compensation; must not compare with Jan–Sep combined payments without category reconciliation.",
 q1.source,q1.period,"Kementerian Keuangan","fiscal");
for(const q of fiscal.quotas?.items||[]){
 const id=q.name.toLowerCase().includes("pertalite")?"pertalite":q.name.toLowerCase().includes("diesel")?"diesel":"kerosene";
 add("fuel_quota_"+id,"2026 subsidized/assigned fuel quota · "+q.name,
 "Annual allocation of "+q.name+": "+q.annual_quota+" kL in 2026. Q1 distribution "+q.q1_distribution+
 " kL as of "+q.q1_as_of+". Q1 distribution is NOT October year-to-date depletion. "+String(q.note||""),
 q.source,"2026 allocation / Q1 2026 realization","BPH Migas / ANTARA","oil_gas");
}
const nre=transition.ken;
if(nre)add("nre_policy","KEN PP 40/2025 · Renewables target and actual",
 "PP 40/2025 new KEN target for 2025 renewable share "+nre.target_ebt_2025_low+"–"+
 nre.target_ebt_2025_high+"%, against reported actual "+nre.ebt_share_actual_2025+
 "%. The prior RUEN 23% target belongs to a distinct policy vintage; do not conflate. "+nre.notes,
 nre.sources?.[1]||nre.sources?.[0],"2025 results · policy 2025","ESDM / KEN","renewables");
const rup=transition.ruplt;
if(rup)add("rupTL","RUPTL PLN 2025–2034 · planned capacity",
 "PLN 2025–2034 RUPTL planned new capacity "+rup.planned_new_capacity_gw+" GW, comprising "+
 rup.renewables_gw+" GW renewables, "+rup.storage_gw+" GW storage and "+rup.fossil_gw+
 " GW fossil. These are PLANNED additions, not commissioned operation. "+rup.notes,
 rup.source,rup.period,"ESDM / PLN","power");
const invest=fiscal.investment?.series?.find(x=>x.year===2025);
if(invest)add("realized_investment_2025","Realized sector investment · ESDM 2025",
 "ESDM administrative energy/mining realized investment 2025: oil and gas US$"+invest.migas+
 "bn; EBTKE US$"+invest.ebtke+"bn; electricity US$"+invest.electricity+
 "bn; mining US$"+invest.minerba+"bn. Administrative sector classifications vary from BKPM.",
 fiscal.investment?.sources?.[0]||fundamentals.sources?.migas2025,"2025","ESDM","investment");
const ike=infrastructure.energy_security?.official;
if(ike&&Number.isFinite(ike.index)&&valid(ike.source)){
 add("official_security_index_2025","Official Indonesia Energy Security Index (IKE) 2025 · 4A",
  "Official 2025 Indeks Ketahanan Energi (IKE): "+ike.index+"/10; classification "+ike.status+
  "; provisional "+ike.provisional+". Scale "+ike.scale+". Comparison with 2024 reference: "+
  ike.previous_comparable_2024+"/10 (verify methodology and vintage before interpreting changes). "+
  ike.method+" This is an actual national official composite index; do NOT assert that SLI has no single energy security index.",
  ike.source,String(ike.year),"ESDM / Dewan Energi Nasional","energy");
 for(const pillar of infrastructure.energy_security.aspects||[]){
  add("ike_4a_"+pillar.code.toLowerCase(),"Official IKE 2025 · "+pillar.name,
   "Official energy security 4A pillar "+pillar.name+": score 2025 "+pillar.score2025+
   "/10 versus 2024 "+pillar.score2024+
   "/10. Component indicators (code, name, 2024, 2025): "+
   pillar.indicators.map(x=>x.join(" | ")).join("; ")+
   ". Analytical limitation: "+pillar.weakness+
   ". These pillar figures must NOT be averaged to reconstruct the weighted overall IKE.",
   ike.source,String(ike.year),"ESDM / Dewan Energi Nasional","energy");
 }
}
for(const row of assessment.points||[]){
 // Source-derived qualitative synthesis is supporting analysis, not new independently confirmed facts.
 const url=row.baseline_sources?.find(s=>valid(s?.url))?.url;
 if(!url)continue;
 add("daily_"+row.id,"SLI reviewed source-grounded lens · "+row.heading,
 "SLI deterministic editorial analysis produced "+assessment.assessment_date_wib+": "+row.finding+
 " Important: this is an analytical synthesis, NOT an independent confirmation of monitored news stories.",
 url,assessment.assessment_date_wib,"SLI synthesis of ESDM / official sources","assessment");
}
export function nationalEnergyEvidence(){return docs.map(x=>({...x}));}
export function energyCorpusAudit(){
 return {count:docs.length,unique_ids:new Set(docs.map(x=>x.id)).size,
  categories:[...new Set(docs.map(x=>x.title))].length,
  assessment_date:assessment.assessment_date_wib,baseline_updated:fundamentals.updated,
  disclaimer:"Bundled official baseline snapshots only; no live web fetching, no verified news event claims."};
}
