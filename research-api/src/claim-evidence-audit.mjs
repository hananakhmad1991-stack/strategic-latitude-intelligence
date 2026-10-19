/* SLI claim-to-source REVIEW TRIAGE (not fact verification).
 * No extra HTTP requests. A numbered citation or publisher URL is NEVER
 * sufficient to mark a statement verified against an original publication.
 * Extracts important claims and identifies missing local excerpt support.
 */
const CITE=/\[(\d{1,3})\]/g;
const NUM=/\b\d[\d.,]*(?:\s*(?:GW|MW|MVA|kWh|MWh|GWh|ton(?:ne)?s?|tCO2|MtCO2|triliun|miliar|billion|million|persen|%|USD|Rp|km|jiwa))?\b/gi;
const FACT=/(?:\d{4}|[\d.,]+\s*(?:MW|GW|%|USD|Rp|ton|triliun|miliar|billion|million)|commission|onstream|beroperasi|operational|operasi komersial|konstruksi|groundbreaking|FID\b|persetujuan|efektif|berlaku|diundangkan|ratifikas|perubahan peraturan|million tonnes)/i;
const HIGH=[
 ["commercial_operation",/beroperasi|operasi komersial|commercial operation|first gas|onstream|commissioned|commissioning|injeksi komersial/i],
 ["realized_investment",/realisasi (?:investasi|capex)|spent|disbursed|capital expenditure realized|terealisasi|dana terserap/i],
 ["law_status",/mulai berlaku|efektif|dicabut|diubah|diundangkan|ratifikas|berlaku sejak|legal status/i],
 ["construction",/under construction|konstruksi|pembangunan fisik|first steel|groundbreaking|fabrication|pembangunan dimulai/i],
 ["quantitative",/[\d.,]+\s*(?:MW|GW|MVA|USD|Rp|triliun|miliar|billion|million|tCO2|%)/i]
];
function chunks(text){
 return String(text||"").split(/\n+/).flatMap(p=>
  p.split(/(?<=[.!?;])\s+(?=[A-ZÀ-ÖØ-Ý0-9])/)).map(s=>s.trim())
   .filter(s=>s&&s.length>35&&!/^#{1,5}\s/.test(s)).slice(0,120);
}
function normalize(s){
 return String(s||"").toLowerCase().replace(/\[(\d+)\]/g,"").replace(/[,\s]+/g,"")
  .replace(/(\d)[.](\d)/g,"$1.$2");
}
function numbers(text){
 const withoutCites=String(text||"").replace(/\[(\d+)\]/g,"");
 return [...new Set((withoutCites.match(NUM)||[]).map(s=>s.trim()).filter(s=>/\d/.test(s)))].slice(0,12);
}
function cited(s,total){
 return [...new Set([...s.matchAll(CITE)].map(m=>Number(m[1])).filter(i=>i>0&&i<=total))];
}
export function auditResearchClaims(answer,evidence,{maxItems=15}={}){
 const docs=Array.isArray(evidence)?evidence:[];
 const assessed=[],seen=new Set();let count=0;
 for(const part of chunks(answer)){
  if(!FACT.test(part))continue;
  count++;
  const indices=cited(part,docs.length);
  const linked=indices.map(n=>docs[n-1]).filter(Boolean);
  const num=numbers(part);
  const corpus=normalize(linked.map(d=>String(d.title||"")+" "+String(d.text||"")+" "+String(d.period||"")).join(" "));
  const missing=num.filter(n=>!corpus.includes(normalize(n)));
  const kind=HIGH.find(([,re])=>re.test(part))?.[0]||"factual";
  const weak=linked.some(d=>d.source_type==="live_web_discovery"||
   d.source_type==="public_dashboard_source_record_not_claim_verified"||
   /^sli_tavily_|^dashboard_/.test(String(d.id||"")));
  const primary=linked.some(d=>typeof d.source_url==="string"&&/^https:\/\//.test(d.source_url)&&
   !/^sli_tavily_|^dashboard_/.test(String(d.id||""))&&
   d.source_type!=="secondary_news");
  const issues=[];
  if(!indices.length)issues.push("no_local_citation");
  if(missing.length)issues.push("numbers_absent_from_cited_excerpts");
  if(weak)issues.push("discovery_or_dashboard_snapshot_citation");
  if(!primary)issues.push("original_primary_document_not_established");
  // Even a date/number found in an internal excerpt does not establish actual
  // claim entailment by the primary publisher page. No 'verified' status exists.
  issues.push("primary_page_claim_entailment_not_checked");
  const signature=kind+"|"+part.slice(0,125).toLowerCase();
  if(seen.has(signature))continue;seen.add(signature);
  if(assessed.length<maxItems)assessed.push({
   claim:part.slice(0,270),category:kind,citations:indices,
   missing_numbers:missing.slice(0,5),issues,
   review_status:"pending_primary_document_and_editorial_review"
  });
 }
 return {scope:"citation_and_local_excerpt_triage_only_not_claim_fact_check",
  assessed_claims:count,shown_claims:assessed.length,
  primary_claims_automatically_verified:0,
  unattributed_claims:assessed.filter(c=>c.issues.includes("no_local_citation")).length,
  quantity_excerpts_mismatch:assessed.filter(c=>c.missing_numbers.length>0).length,
  discovery_or_snapshot_only:assessed.filter(c=>c.issues.includes("original_primary_document_not_established")).length,
  items:assessed,
  limitations:[
   "Citation indices and matching numbers are not proof of a source supporting the assertion.",
   "Publisher articles/PDFs were NOT independently fetched or checked by this audit.",
   "Sample is capped; manual editorial review required for any material project, legal or investment claim."
  ]};
}
