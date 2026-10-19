/* Claim-to-evidence REVIEW TRIAGE. Never certifies a factual statement.
 * Numeric matching is a conservative screening aid, not entailment verification.
 */
const CITE=/\[(\d{1,3})\]/g;
const NUM=/((?:USD|US\$|IDR|Rp|\$)\s*)?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?)(?:\s*(triliun|trillion|miliar|billion|juta|million|MtCO2|tCO2|GW|MW|MVA|GWh|MWh|kWh|km|tonnes?|persen|%))?/gi;
const FACT=/(?:\b(?:19|20)\d{2}\b|[\d.,]+\s*(?:MW|GW|%|USD|Rp|ton|triliun|miliar|billion|million)|\bFID\b|commission|onstream|beroperasi|operational|operasi komersial|konstruksi|groundbreaking|fabrikasi|investment|investasi|capex|persetujuan|efektif|berlaku|diundangkan|ratifikas)/i;
const CATEGORY=[
 ["commercial_operation",/beroperasi|operasi komersial|commercial operation|first gas|onstream|commissioned|commissioning|injeksi komersial/i],
 ["realized_investment",/realisasi (?:investasi|capex)|spent|disbursed|capital expenditure realized|terealisasi|dana terserap|\b(?:USD|US\$|\$)\s*[\d.,]+\s*(?:billion|miliar|triliun|million)/i],
 ["law_status",/mulai berlaku|efektif|dicabut|diubah|diundangkan|ratifikas|berlaku sejak|legal status/i],
 ["investment_decision",/\bFID\b|final investment decision|keputusan investasi (?:akhir|final)/i],
 ["construction",/under construction|konstruksi|pembangunan fisik|first steel|groundbreaking|fabrication|fabrikasi|pembangunan dimulai/i],
 ["quantitative",/[\d.,]+\s*(?:MW|GW|MVA|USD|Rp|triliun|miliar|billion|million|tCO2|%)/i]
];
const SKIP=/^(?:#{1,6}\s|(?:fid|konstruksi fisik|commissioning|operasi komersial)\s+(?:berarti|adalah)|(?:itu penting karena|sebagai prinsip metodologi|secara metodologis|secara praktis ini berarti))/i;
const SCALE={miliar:"billion",billion:"billion",triliun:"trillion",trillion:"trillion",juta:"million",million:"million"};
const UNITS=new Set(["mw","gw","mva","gwh","mwh","kwh","km","tco2","mtco2","%","ton","tonne","tonnes","persen"]);
const normalizeValue=raw=>{
 let x=String(raw).replace(/\s/g,"");
 const dot=x.lastIndexOf("."),comma=x.lastIndexOf(",");
 if(dot>=0&&comma>=0){
  const decimal=dot>comma?".":",";
  x=x.replace(decimal==="."?/,/g:/\./g,"").replace(decimal,",",".");
 }else if(/[.,]/.test(x)){
  const mark=dot>=0?".":",";
  const parts=x.split(mark);
  if(parts.length>2||parts.length===2&&parts[1].length===3&&parts[0].length<=3)
   x=parts.join("");
  else x=x.replace(",",".");
 }
 const n=Number(x);
 return Number.isFinite(n)?n.toString():null;
};
function signature(item){
 return [item.number,item.currency||"",item.scale||"",item.unit||""].join("|");
}
export function numericTokens(text){
 const input=String(text||"").replace(CITE,"");
 const out=[],seen=new Set();
 for(const m of input.matchAll(NUM)){
  const val=normalizeValue(m[2]);if(val===null)continue;
  const raw=m[0].trim();let currency=(m[1]||"").trim().toLowerCase(),scale=(m[3]||"").trim().toLowerCase();
  if(currency==="us$"||currency==="$")currency="usd";
  if(currency==="rp")currency="idr";
  const unit=UNITS.has(scale)?scale.replace(/^persen$/,"%"):null;
  if(!unit)scale=SCALE[scale]||null;else scale=null;
  // A "USD 7 miliar" quantity must preserve both denomination and magnitude.
  const entry={raw,number:val,currency:currency||null,scale,unit};
  const k=signature(entry);if(seen.has(k))continue;
  seen.add(k);out.push(entry);
  if(out.length>=70)break;
 }
 return out;
}
function numericEquivalent(needle,haystack){
 if(needle.number!==haystack.number)return false;
 if(needle.currency&&haystack.currency&&needle.currency!==haystack.currency)return false;
 if(needle.scale&&haystack.scale&&needle.scale!==haystack.scale)return false;
 if(needle.unit&&haystack.unit&&needle.unit!==haystack.unit)return false;
 // A stated amount or physical unit cannot be equated with a different explicit
 // currency/unit, but absent units within excerpts are only a screening limitation.
 return true;
}
export function compareQuotedNumbers(claim,excerpt){
 const found=numericTokens(excerpt),claimNums=numericTokens(claim).slice(0,14);
 return {claim_numbers:claimNums,missing:claimNums.filter(n=>!found.some(f=>numericEquivalent(n,f))).map(x=>x.raw)};
}
function citations(text,total){
 return [...new Set([...String(text).matchAll(CITE)].map(m=>Number(m[1])).filter(x=>x>0&&x<=total))];
}
function paragraphs(text){
 return String(text||"").split(/\n+/).map(x=>x.trim()).filter(Boolean).slice(0,130);
}
function claimSegments(block){
 const lines=block.split(/\n/).map(x=>x.trim()).filter(Boolean);
 return lines.flatMap(line=>{
  if(line.startsWith("|"))return [line];
  return line.split(/(?<=[.!?;])\s+(?=[A-ZÀ-ÖØ-Ý0-9*])/).filter(Boolean);
 }).slice(0,35);
}
function candidate(part){
 if(part.length<28||SKIP.test(part))return false;
 const text=part.replace(/\*\*/g,"").replace(/^\|\s*/,"");
 return FACT.test(text)&&!/^[-–*]?\s*(?:FID|Commissioning|Construction)\s*means\b/i.test(text);
}
function kindOf(text){return CATEGORY.find(([,r])=>r.test(text))?.[0]||"factual"}
function relevantRisk(kind,hasAmount){
 return (kind==="commercial_operation"||kind==="law_status"?70:kind==="realized_investment"?65:kind==="investment_decision"?55:kind==="construction"?50:kind==="quantitative"?40:20)
   +(hasAmount?10:0);
}
export function auditResearchClaims(answer,evidence,{maxItems=15}={}){
 const docs=Array.isArray(evidence)?evidence:[];
 const records=[],dedupe=new Set();
 for(const block of paragraphs(answer)){
  const paragraphCitations=citations(block,docs.length);
  // A trailing citation often covers a multi-sentence paragraph. Keep it scoped
  // to that paragraph, never borrow references from a separate paragraph.
  for(const segment of claimSegments(block)){
   const part=segment.trim();
   if(!candidate(part))continue;
   const direct=citations(part,docs.length);
   const indices=direct.length?direct:block.length<=2200?paragraphCitations:[];
   const scope=direct.length?"direct":indices.length?"same_paragraph":"none";
   const linked=indices.map(i=>docs[i-1]).filter(Boolean);
   const quoted=linked.map(d=>String(d.title||"")+" "+String(d.text||"")+" "+String(d.period||"")).join(" ");
   const missing=indices.length?compareQuotedNumbers(part,quoted).missing:[];
   const kind=kindOf(part),hasAmount=/(?:USD|US\$|Rp|IDR|\$)\s*[\d.,]+/i.test(part);
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
   issues.push("primary_page_claim_entailment_not_checked");
   const fingerprint=part.toLowerCase().replace(/\*\*/g,"").replace(CITE,"").replace(/\s+/g," ").slice(0,155);
   if(dedupe.has(fingerprint))continue;
   dedupe.add(fingerprint);
   records.push({claim:part.slice(0,300),category:kind,citations:indices,citation_scope:scope,
    missing_numbers:missing.slice(0,6),issues,
    review_status:"pending_primary_document_and_editorial_review",
    score:relevantRisk(kind,hasAmount)});
  }
 }
 // Examine representative material/high-risk claims rather than the first N
 // introductory or boilerplate sentences in a long report.
 records.sort((a,b)=>b.score-a.score);
 const items=records.slice(0,Math.max(1,Math.min(35,maxItems))).map(({score,...rest})=>rest);
 return {scope:"citation_and_local_excerpt_triage_only_not_claim_fact_check",
  assessed_claims:records.length,shown_claims:items.length,
  primary_claims_automatically_verified:0,
  unattributed_claims:items.filter(x=>x.issues.includes("no_local_citation")).length,
  quantity_excerpts_mismatch:items.filter(x=>x.missing_numbers.length>0).length,
  discovery_or_snapshot_only:items.filter(x=>x.issues.includes("original_primary_document_not_established")).length,
  items,
  limitations:[
   "The audit displays a capped, prioritised sample; issue counts refer to displayed claims only.",
   "Equivalent decimal comma/point and Indonesian/English magnitude words are treated as screening matches, not verification.",
   "An excerpt, a source URL, and matching numbers do NOT prove the publisher supports the statement.",
   "Publisher articles/PDFs were NOT independently fetched by this claim triage; any separate original-page check is limited to HTML numeric tokens.",
   "Publisher HTML numeric presence is a separate limited check, not factual or legal certification."
  ]};
}
