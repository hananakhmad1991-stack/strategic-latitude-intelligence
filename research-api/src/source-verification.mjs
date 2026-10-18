/* Shared OSINT verification utility for SLI research sectors.
   Only fetch pre-approved source origins. An HTTP 200 does not verify a factual claim.
*/
const ALLOWED=new Set(["esdm.go.id","www.esdm.go.id","bps.go.id","www.bps.go.id","bi.go.id","www.bi.go.id","pln.co.id","web.pln.co.id","www.pln.co.id","kemenkeu.go.id","www.kemenkeu.go.id","antaranews.com","www.antaranews.com","reuters.com","www.reuters.com","iea.org","www.iea.org","worldbank.org","www.worldbank.org","imf.org","www.imf.org"]);
export function sourceIsApproved(value){
 try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&u.port===""&&ALLOWED.has(u.hostname.toLowerCase())}catch{return false}
}
export function compareHeadlineWithArticle(headline,html){
 const h=String(headline||"").toLowerCase().match(/[a-z0-9]{4,}/g)||[];
 const title=String(html||"").match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]*>/g," ").toLowerCase()||"";
 const words=new Set(title.match(/[a-z0-9]{4,}/g)||[]);
 const common=[...new Set(h)].filter(w=>words.has(w)).length;
 return {matches:common>=Math.min(3,Math.max(2,Math.ceil(new Set(h).size*0.35))),common};
}
export async function verifyPublisherPage(candidate,fetcher=fetch){
 if(!candidate||!sourceIsApproved(candidate.url)||!candidate.title)return {status:"not_verified",reason:"source_not_approved"};
 try{
  const response=await fetcher(candidate.url,{method:"GET",redirect:"manual",headers:{accept:"text/html"},signal:AbortSignal.timeout(4500)});
  if(!response.ok||response.status>=300)return {status:"not_verified",reason:"publisher_unavailable_or_redirect"};
  const type=String(response.headers?.get("content-type")||"");
  if(!/^text\/html(?:;|$)/i.test(type))return {status:"not_verified",reason:"not_html"};
  if(Number(response.headers?.get("content-length")||0)>160000)return {status:"not_verified",reason:"too_large"};
  const html=(await response.text()).slice(0,160001);
  if(html.length>160000)return {status:"not_verified",reason:"too_large"};
  const match=compareHeadlineWithArticle(candidate.title,html);
  if(!match.matches)return {status:"not_verified",reason:"headline_not_matched"};
  return {status:"publisher_page_matched",publisher_url:candidate.url,title:candidate.title,checked_at:new Date().toISOString(),note:"Publisher page/title matched; individual factual assertions still require source-grounded validation"};
 }catch{return {status:"not_verified",reason:"network_or_parse_error"}}
}
