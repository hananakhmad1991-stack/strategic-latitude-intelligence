/* Owner-test-only public legal index bridge. Metadata is NOT the consolidated legal text.
 * Never present a graph node as article-level evidence or conclusive present legal effect.
 * The public dated index is acceptable for owner-side exploratory model grounding only.
 */
import graph from "../../data/sli-policy-regulatory-graph-2026.json";
const legalTypes=new Set(["amended_by","amends","repeals","partially_repealed_by","specific_provision_amended_by"]);
const allowedKinds=new Set(["uu","pp","perpres","permen","perda","perda_kab","pergub","perbup","perwali","inpres","decision","agency","dirjen","tap","international","foreignlaw"]);
const limits={enacted:"Published/enacted record; NOT proof no later amendment or repeal.",
 amended:"Base law amended; original version must not be used as consolidated operative text.",
 amending_instrument:"Amendment instrument; scope and affected provisions require examination.",
 repealed:"Recorded as repealed in SLI index; confirm successor and legal transition.",
 check_current:"Current status expressly NOT comprehensively verified.",
 transition_review:"Transitional provisions and alignment remain unresolved.",
 listed_active_review_alignment:"JDIH listing seen; up-to-date alignment NOT legally certified."};
function policySector(n){
 const x=(n.sector||"").toLowerCase(), text=(n.ref+" "+n.label+" "+n.note).toLowerCase();
 if(/data|digital|komdigi|cyber|pdp|ai\b/.test(x+" "+text)&&(/pusat data|artificial intelligence|digital|pdp|privacy|siber|cyber/.test(text)||x==="digital"))return "ai";
 if(/minerba|mineral|mining|smelter|pertambangan/.test(x+" "+text))return "minerals";
 if(/pangan|beras|food|pertanian/.test(x+" "+text))return "food";
 if(/wto|arbitra|trade|impor|ekspor|perdagangan/.test(x+" "+text))return "trade";
 if(/otonomi|pemerintahan daerah|rtrw|spatial|tata ruang|kewenangan daerah/.test(text)||["region","regional"].includes(x))return "regional";
 if(/lingkungan|iklim|paris|ndc|karbon|renewab|transisi energi/.test(x+" "+text))return "energy";
 if(/electricity|listrik|pln|grid|ketenagalistrikan/.test(x+" "+text))return "energy";
 if(/migas|batubara|power|energy|energi/.test(x+" "+text))return "energy";
 return "regional";
}
function region(n){
 const original=String(n.region||"Indonesia");
 return original==="Indonesia"?"Indonesia":original;
}
export function policyLegalEvidence(){
 const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
 const out=[];
 for(const n of graph.nodes){
  if(!allowedKinds.has(n.tier)||n.kind==="tier_marker"||n.status==="not_applicable"||!/^https:\/\//i.test(n.source||""))continue;
  const linked=graph.edges.filter(e=>(e.from===n.id||e.to===n.id)&&legalTypes.has(e.type)).slice(0,10)
   .map(e=>{const other=nodes.get(e.from===n.id?e.to:e.from);return other?e.type+" : "+other.ref:null}).filter(Boolean);
  const caution=limits[n.status]||"Special legal category; legal applicability must be checked.";
  const text=[
   "PUBLIC SLI LEGAL INDEX METADATA ONLY; the full official statute has NOT been provided to the model.",
   "Instrument: "+n.ref+" — "+n.label+". Issuer/authority: "+(n.owner||"not documented")+
      ". Region: "+region(n)+". Index classification: "+n.status+".",
   "Legal status caveat: "+caution,
   "Index synopsis (editorial, not article text): "+(n.note||"not documented")+".",
   linked.length?"Recorded legal relation(s), not full consolidated text: "+linked.join("; ")+".":"No confirmed amendment/repeal link in this partial SLI graph; absence of record is NOT proof of no amendments.",
   "Original source link is a lead for independent human confirmation of current status, article numbers, official promulgation and transitional rules. No compliance verdict without primary text."
  ].join("\n").slice(0,2450);
  out.push({id:"policy_law_"+n.id,title:n.ref+" · "+n.label,text,
   source_url:n.source,source_date:n.verified_at||null,period:graph.updated_at+" curated index snapshot (not enactment date)",
   publisher:n.owner||"Official legal reference via SLI",topic:policySector(n),geo:region(n),access:"pro"});
 }
 return out;
}
export const policyCorpusAudit=Object.freeze({
 snapshot:graph.updated_at,totalIndex:graph.nodes.length,
 legalMetadataCount:policyLegalEvidence().length,
 disclaimer:"Source URLs and index notes, no article text; not a consolidated up-to-date statute database."
});