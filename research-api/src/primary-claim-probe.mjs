/* Bounded read of public original HTML publisher pages for review hints.
 * This does NOT establish entailment, commissioning, legal status or authenticity.
 * No user prompt, private evidence or OpenAI data is sent to these sites; the
 * URL comes from an already allowlisted citation, with no redirects.
 */
import {sourceIsApproved} from "./source-verification.mjs";
import {compareQuotedNumbers} from "./claim-evidence-audit.mjs";
const PRIMARY_ONLY=new Set(["esdm.go.id","www.esdm.go.id","bps.go.id","www.bps.go.id",
 "bi.go.id","www.bi.go.id","pln.co.id","www.pln.co.id","web.pln.co.id",
 "kemenkeu.go.id","www.kemenkeu.go.id","iea.org","www.iea.org",
 "worldbank.org","www.worldbank.org"]);
export function isPrimaryPublisherUrl(value){
 if(!sourceIsApproved(value))return false;
 try{return PRIMARY_ONLY.has(new URL(value).hostname.toLowerCase())}catch{return false}
}
function htmlText(source){
 return String(source||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ")
  .replace(/&nbsp;|&#160;/gi," ").replace(/&amp;/gi,"&").replace(/\s+/g," ");
}
async function probeOne(row,fetcher){
 const base={citation:row.citation,source_url:row.url,
  status:"pending_original_publisher_read",claim_numbers_present:[],claim_numbers_absent:[],
  note:"HTML token/number presence is NOT primary-source claim entailment or fact verification"};
 try{
  const response=await fetcher(row.url,{method:"GET",redirect:"manual",headers:{"accept":"text/html"},
   signal:AbortSignal.timeout(2700)});
  if(!response.ok||response.status>=300)return {...base,status:"publisher_unavailable_or_redirect"};
  const type=String(response.headers?.get?.("content-type")||"");
  if(type.toLowerCase().includes("pdf"))return {...base,status:"pdf_requires_document_review"};
  if(!/^text\/html(?:;|$)/i.test(type))return {...base,status:"publisher_not_html"};
  if(Number(response.headers?.get?.("content-length")||0)>180000)
   return {...base,status:"publisher_html_too_large"};
  const source=(await response.text());
  if(source.length>180000)return {...base,status:"publisher_html_too_large"};
  const text=htmlText(source).replace(/(?<=\d)[,](?=\d{3}(?:\D|$))/g,"");
  // Reuse the same decimal/magnitude/unit screening rules as claim triage.
  // Prevent false negatives for "20,9 miliar" versus "20.9 billion" (or US$7 billion).
  const comparison=compareQuotedNumbers(row.claim,text);
  const wanted=comparison.claim_numbers.map(x=>x.raw),miss=comparison.missing,
        found=wanted.filter(n=>!miss.includes(n));
  return {...base,status:wanted.length?(miss.length?"publisher_page_numbers_incomplete":"publisher_page_numbers_present"):"publisher_page_readable_no_numeric_match",
   claim_numbers_present:found,claim_numbers_absent:miss};
 }catch{return {...base,status:"publisher_fetch_failed_or_timed_out"}}
}
export async function probeCitedPrimaryPages(review,evidence,{enabled=true,fetcher=fetch,maxPages=2}={}){
 if(!enabled)return {status:"disabled",checked:0,results:[],review_scope:"primary_page_number_presence_only_not_verification"};
 const docs=Array.isArray(evidence)?evidence:[],used=new Set(),planned=[];
 for(const row of (Array.isArray(review?.items)?review.items:[])){
  for(const n of row.citations||[]){
   const d=docs[n-1];
   const url=d?.source_url;
   if(!isPrimaryPublisherUrl(url)||used.has(url))continue;
   used.add(url);planned.push({citation:n,url,claim:row.claim});
   if(planned.length>=Math.max(1,Math.min(2,maxPages)))break;
  }
  if(planned.length>=Math.max(1,Math.min(2,maxPages)))break;
 }
 const results=await Promise.all(planned.map(row=>probeOne(row,fetcher)));
 return {status:results.length?"completed_bounded_checks":"no_allowlisted_primary_html_citations",
  checked:results.length,results,review_scope:"primary_page_number_presence_only_not_verification"};
}
