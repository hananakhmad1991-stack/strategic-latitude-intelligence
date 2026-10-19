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

/* Policy retrieval uses its own legal identifiers and jurisdiction guardrails;
 * generic sector RAG exclusion must not discard cross-ministry investment laws. */
const policyStop=new Set("apa bagaimana apakah yang dari pada dengan untuk saya ingin perlu jelaskan serta tentang adalah saja dalam aturan hukum regulasi kebijakan peraturan undang undang tahun nomor terbaru permen negara indonesia terhadap dan atau bagi dapat".split(" "));
const simplify=v=>String(v||"").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
function queryTerms(question){
 const q=simplify(question),t=new Set(q.split(" ").filter(x=>x.length>2&&!policyStop.has(x)));
 if(/pusat data|data center|data centre|komputasi|artificial intelligence/.test(q))["data","digital","ai","pdp"].forEach(x=>t.add(x));
 if(/penanaman modal|perizinan|investor|investasi/.test(q))["investasi","perizinan","oss","bkpm"].forEach(x=>t.add(x));
 if(/paris|karbon|emisi|iklim|nze/.test(q))["paris","climate","lingkungan","energi"].forEach(x=>t.add(x));
 if(/otonomi|daerah|kewenangan/.test(q))["daerah","otonomi","kewenangan"].forEach(x=>t.add(x));
 return [...t];
}
export function selectPolicyEvidence(question,max=4,documents=policyLegalEvidence()){
 const q=simplify(question), terms=queryTerms(question);
 const batam=q.includes("batam"),bekasi=q.includes("bekasi"),semarang=q.includes("semarang");
 const geoList=batam?["kepulauan riau","batam"]:bekasi?["jawa barat","bekasi"]:semarang?["jawa tengah","semarang"]:[];
 const key=(String(question).match(/\b(uu|pp|perpres|perda)\s*(?:no(?:mor)?\s*)?(\d+)\s*[/\-]\s*((?:19|20)\d{2})\b/i)||[]);
 const refKey=key.length?simplify(key[1]+" "+key[2]+" "+key[3]):"";
 return documents.map(d=>{
  const area=simplify(d.geo||"");
  if(geoList.length&&area!=="indonesia"&&!geoList.some(x=>area.includes(x)||x.includes(area)))return null;
  const title=simplify(d.title),text=simplify(d.text);
  let score=0;
  for(const t of terms){if(title.split(" ").includes(t))score+=7;else if(title.includes(t))score+=4;else if(text.includes(t))score+=1;}
  if(refKey&&title.replace(/\s+/g,"").includes(refKey.replace(/\s+/g,"")))score+=100;
  if(geoList.length&&area!=="indonesia")score+=7;
  if(q.includes("paris")&&d.id==="policy_law_uu16paris")score+=40;
  if(q.includes("otonomi")&&d.id==="policy_law_uu23local")score+=40;
  return {d,score};
 }).filter(x=>x&&x.score>=3).sort((a,b)=>b.score-a.score||a.d.id.localeCompare(b.d.id))
  .slice(0,Math.max(0,Math.min(max,8))).map(x=>x.d);
}
