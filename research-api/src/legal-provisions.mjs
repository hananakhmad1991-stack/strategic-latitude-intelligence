/* Pilot authoritative article anchors: editorial paraphrases checked against source PDF.
 * An article record is not evidence that an entire act is currently consolidated.
 */
import verified from "../../data/sli-verified-legal-provisions.json";
const normal=s=>String(s||"").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const triggers={
 uu16paris:[/\buu\s*(?:no\s*)?16\s*[\/-]\s*2016\b/i,/paris/i,/unfccc/i,/persetujuan iklim/i]
};
export function legalProvisionEvidence(question,max=2){
 const q=String(question||"");
 return verified.items.filter(x=>triggers[x.law_node_id]?.some(re=>re.test(q))&&
  x.current_status_certified===false&&
  x.source_type==="official_promulgated_pdf"&&
  /^https:\/\//.test(x.source_url)&&x.article)
 .sort((a,b)=>a.id.localeCompare(b.id))
 .slice(0,Math.max(0,Math.min(2,max)))
 .map(x=>({
  id:"primary_"+x.id,title:x.citation_label+" — penjelasan terbatas tingkat pasal",
  text:"ARTICLE-LEVEL CURATED PARAPHRASE, NOT PRIMARY ORIGINAL STATUTE TEXT. Citation: "+x.citation_label+
   ". Primary official publication: "+x.source_url+". Page: "+x.page_reference+
   ". Verified proposition: "+x.excerpt_id+
   ". Applicability guardrail: "+x.legal_effect_limit+
   ". Current status NOT CERTIFIED; verify latest amendments and official full wording before legal reliance.",
  publisher:x.publisher,source_url:x.source_url,source_date:x.as_of,period:"2016 published law; checked "+x.as_of,
  topic:"legal_provision climate energy regulation",geo:"Indonesia",access:"pro",
  provision_anchor:{law_node_id:x.law_node_id,article:x.article,source_kind:x.source_type}
 }));
}
export function validateProvisionRegistry(){
 if(verified.schema!=="sli-legal-provisions-v1"||!Array.isArray(verified.items))throw Error("legal_provisions_schema");
 const ids=new Set();
 for(const x of verified.items){
  if(ids.has(x.id)||!x.article||!x.law_node_id||!x.source_url||!/^https:\/\//.test(x.source_url)||x.current_status_certified!==false)throw Error("legal_provisions_unverified");
  ids.add(x.id);
 }
 return {entries:ids.size,full_corpus:false,all_status_uncertified:true};
}
