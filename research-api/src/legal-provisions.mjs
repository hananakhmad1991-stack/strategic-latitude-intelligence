/* SLI Verified Legal Corpus, curated ARTICLE-LEVEL evidence only.
 * Each record is a reviewed paraphrase anchored to an original official legal PDF.
 * This does NOT certify up-to-date consolidated text, amendment scope or compliance.
 */
import verified from "../../data/sli-verified-legal-provisions.json";
import graph from "../../data/sli-policy-regulatory-graph-2026.json";

const norm=s=>String(s||"").normalize("NFKD").toLowerCase()
  .replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
const officialHosts=new Set(["peraturan.go.id","www.peraturan.go.id","peraturan.bpk.go.id","jdih.tanjungpinangkota.go.id"]);
const cleanRef=s=>norm(s).replace(/\b(?:nomor|no|tahun)\b/g,"").replace(/\s+/g," ").trim();
const refMatches=(q,ref)=>q.includes(cleanRef(ref)) ||
  // Both "UU No. 27 Tahun 2022" and "UU 27/2022" are recognized.
  new RegExp("\\b"+cleanRef(ref).split(" ").join("(?:\\s+|\\s*(?:no|nomor|tahun)\\s*)")+"\\b","i").test(q);
const explicitLaws=q=>[...q.matchAll(/\b(uu|pp|perpres)\s*(?:(?:nomor|no)\s*)?(\d{1,3})\s*(?:tahun\s*)?(?:\/|\-|\s+)(\d{4})\b/gi)]
  .map(m=>m[1].toLowerCase()+" "+m[2]+" "+m[3]);
const articleNumbers=q=>[...q.matchAll(/\b(?:pasal|article)\s+(\d{1,3}[a-z]?)\b/gi)].map(m=>m[1].toLowerCase());
function sourceValid(record){
 try{
  const u=new URL(record.source_url);
  return u.protocol==="https:" && officialHosts.has(u.hostname) && /\.pdf$/i.test(u.pathname) &&
    record.source_type==="official_promulgated_pdf" && record.current_status_certified===false &&
    record.excerpt_kind==="reviewed_paraphrase_not_verbatim" && /^Pasal\s+\d+[a-z]?$/i.test(record.article);
 }catch{return false}
}
function matchRank(x,q,laws,articles){
 const ref=cleanRef(x.instrument_ref), aliases=[ref,...(x.search_aliases||[])].map(norm);
 if(laws.length&&!laws.includes(ref))return -1;
 const thisArticle=norm(x.article).replace(/^pasal /,"");
 if(articles.length&&!articles.includes(thisArticle))return -1;
 let score=laws.includes(ref)?120:0;
 if(articles.length)score+=65;
 let aliasScore=0;
 for(const alias of aliases){
  if(alias.length<3)continue;
  const padded=" "+q+" ";
  if(padded.includes(" "+alias+" "))aliasScore=Math.max(aliasScore,alias.split(" ").length>1?30:12);
 }
 if(!laws.length&&!aliasScore)return -1;
 score+=aliasScore;
 // Choose the most relevant reviewed paragraph when no Pasal was supplied.
 for(const word of norm(x.excerpt_id).split(" ").filter(w=>w.length>5)){
  if((" "+q+" ").includes(" "+word+" "))score+=1;
 }
 return score;
}
export function legalProvisionEvidence(question,max=3){
 const q=norm(question),refs=explicitLaws(q),articles=articleNumbers(q),maxItems=Math.max(0,Math.min(6,Number(max)||0));
 if(!q||!maxItems)return [];
 // A bare article number cannot identify an instrument. Never choose one by
 // topic aliases such as "energi" when multiple statutes contain Pasal 2.
 if(articles.length&&!refs.length)return [];
 return verified.items.filter(sourceValid).map(x=>({x,score:matchRank(x,q,refs,articles)}))
  .filter(z=>z.score>=0).sort((a,b)=>b.score-a.score||
    a.x.law_node_id.localeCompare(b.x.law_node_id)||
    (a.x.display_order??99)-(b.x.display_order??99)||
    a.x.id.localeCompare(b.x.id)).slice(0,maxItems).map(({x})=>({
     id:"primary_"+x.id,title:x.citation_label+" — ringkasan terbatas tingkat pasal",
     text:"REVIEWED ARTICLE PARAPHRASE, NOT PRIMARY VERBATIM TEXT OR CURRENT CONSOLIDATED LAW. "+
       "Instrument: "+x.instrument_ref+". Article: "+x.article+". Original promulgated PDF: "+x.source_url+
       ". Printed page: "+x.page_reference+". Reviewed meaning: "+x.excerpt_id+
       ". Legal applicability limit: "+x.legal_effect_limit+
       ". Current legal status NOT CERTIFIED; inspect latest amendments, judicial decisions, effective date and transitional provisions.",
     publisher:x.publisher,source_url:x.source_url,source_date:x.as_of,
     period:"Original promulgated version; article review "+x.as_of+" (not a live consolidated law)",
     topic:x.research_topic||"legal_provision climate energy regulation",geo:"Indonesia",access:"pro",
     provision_anchor:{law_node_id:x.law_node_id,instrument_ref:x.instrument_ref,article:x.article,
       source_kind:x.source_type,source_revision:"original_promulgated_text_not_consolidated"}
   }));
}
export function validateProvisionRegistry(){
 if(verified.schema!=="sli-legal-provisions-v1"||!Array.isArray(verified.items))throw Error("legal_provisions_schema");
 const ids=new Set(),lawArticles=new Set(),validNodes=new Map(graph.nodes.map(n=>[n.id,n]));
 for(const x of verified.items){
  const ident=x.law_node_id+"|"+norm(x.article);
  if(ids.has(x.id)||lawArticles.has(ident)||!validNodes.has(x.law_node_id)||
    !x.id||!x.citation_label||!x.instrument_ref||!x.article||!x.page_reference||
    !x.as_of||!x.excerpt_id||!x.legal_effect_limit||!sourceValid(x))throw Error("legal_provisions_unverified:"+x.id);
  if(cleanRef(validNodes.get(x.law_node_id).ref)!==cleanRef(x.instrument_ref))throw Error("legal_provisions_law_ref_mismatch:"+x.id);
  ids.add(x.id);lawArticles.add(ident);
 }
 return {entries:ids.size,laws:new Set(verified.items.map(x=>x.law_node_id)).size,
  full_corpus:false,all_status_uncertified:true,source_revision:"original_promulgated_not_consolidated"};
}
