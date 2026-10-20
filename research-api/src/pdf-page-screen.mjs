/* PDF text-page candidate matching for reviewer triage ONLY.
 * No network requests; no OCR; no semantic contradiction or factual certification.
 */
import {compareQuotedNumbers, numericTokens} from "./claim-evidence-audit.mjs";
const HOSTS=new Set(["esdm.go.id","www.esdm.go.id","bps.go.id","www.bps.go.id",
 "bi.go.id","www.bi.go.id","pln.co.id","www.pln.co.id","web.pln.co.id",
 "kemenkeu.go.id","www.kemenkeu.go.id","iea.org","www.iea.org",
 "worldbank.org","www.worldbank.org"]);
function validManifest(manifest){
 if(manifest?.schema!=="sli-official-pdf-pages-v1"||
  !/^[a-f0-9]{64}$/.test(String(manifest.document_sha256||""))||
  !Array.isArray(manifest.pages)||manifest.pages.length>12)return false;
 try{
  const u=new URL(manifest.source_url);
  if(u.protocol!=="https:"||!HOSTS.has(u.hostname)||u.username||u.password||
   u.port||u.search||u.hash||!u.pathname.toLowerCase().endsWith(".pdf"))return false;
 }catch{return false}
 const pages=new Set();
 for(const p of manifest.pages){
  if(!Number.isInteger(p.page)||p.page<1||p.page>120||pages.has(p.page)||
   typeof p.text_excerpt!=="string"||p.text_excerpt.length>6000||
   !/^[a-f0-9]{64}$/.test(String(p.text_sha256||"")))return false;
  pages.add(p.page);
 }
 return true;
}
function significantTokens(value){
 return [...new Set((String(value||"").toLowerCase().match(/[\p{L}\p{N}]{5,}/gu)||[])
  .filter(w=>!/^(?:proyek|project|dalam|untuk|bahwa|tahun|yang|mereka|source|sumber|dengan)$/.test(w)))].slice(0,32);
}
export function screenClaimAgainstPdfPages(claim,manifest,{maxCandidates=3}={}){
 const base={schema:"sli-pdf-page-screen-v1",
  review_status:"human_original_pdf_page_and_entailment_review_required",
  verified:false,source_url:null,document_sha256:null,candidates:[],
  note:"Text/numbers co-occurring on a PDF page do not prove the claim, project stage, legal effect or actual investment."};
 if(!validManifest(manifest))return {...base,status:"invalid_or_unreviewed_manifest"};
 const terms=significantTokens(claim);
 const wanted=numericTokens(claim).slice(0,14).map(n=>n.raw);
 const ranked=manifest.pages.map(p=>{
  const pageText=p.text_excerpt;
  const pageTerms=new Set(significantTokens(pageText));
  const matching_terms=terms.filter(t=>pageTerms.has(t));
  const missing_numbers=compareQuotedNumbers(claim,pageText).missing;
  const numeric_matches=wanted.filter(x=>!missing_numbers.includes(x));
  return {page:p.page,page_text_sha256:p.text_sha256,
   numeric_matches,missing_numbers,matching_terms:matching_terms.slice(0,10),
   lexical_overlap_count:matching_terms.length,
   visual_review_required:true,
   text_truncated:!!p.text_truncated,
   note:"Page-text co-occurrence only; not entailment and not human reviewed."};
 }).sort((a,b)=>(b.numeric_matches.length*10+b.lexical_overlap_count)-
                  (a.numeric_matches.length*10+a.lexical_overlap_count)||a.page-b.page);
 return {...base,status:"page_candidates_screened_not_verified",
  source_url:manifest.source_url,document_sha256:manifest.document_sha256,
  total_scanned_pages:manifest.pages.length,
  candidates:ranked.filter(x=>x.numeric_matches.length||x.lexical_overlap_count)
   .slice(0,Math.max(1,Math.min(5,maxCandidates)))};
}
