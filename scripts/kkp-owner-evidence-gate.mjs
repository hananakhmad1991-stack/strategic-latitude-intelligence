/* Pure validation of live Owner KKP answers. Structural citations, not factual review.
 * No secrets, request data or source content are ever exported from this module.
 */
const citationPattern=/\[(?:\*\*)?([1-9][0-9]*)(?:\*\*)?\]/g;
function officialKKP(value){
 try{
  const u=new URL(String(value||""));
  return u.protocol==="https:"&&u.hostname==="portaldata.kkp.go.id";
 }catch{return false}
}
export function assessOwnerKKPEvidence(response){
 const v=response&&typeof response==="object"?response:{};
 const answer=typeof v.answer==="string"?v.answer:"";
 const sources=Array.isArray(v.sources)?v.sources:[];
 const structurallyValid=v.mode==="generative_rag"&&answer.length>=160&&Array.isArray(v.sources);
 const citations=[...answer.matchAll(citationPattern)].map(m=>Number(m[1]));
 const officialPositions=sources.flatMap((s,i)=>
  officialKKP(s?.source_url||s?.url)?[i+1]:[]);
 const validCitationPositions=citations.length>0&&citations.every(i=>i<=sources.length);
 const officialCitedPositions=officialPositions.filter(i=>citations.includes(i));
 return {
  structurallyValid,
  citedNumbersCount:new Set(citations).size,
  validCitationPositions,
  officialKKPSourcesCount:officialPositions.length,
  officialCitedPositionsCount:officialCitedPositions.length,
  // Nothing here checks whether an asserted measurement matches the linked table.
  passed:structurallyValid&&validCitationPositions&&officialCitedPositions.length>0
 };
}
