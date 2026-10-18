/* SLI secondary-news evidence gate.
 * Source discovery / title match != article-claim review. This register is PUBLIC.
 * Claim-level reviewed records only; never accept Google News RSS links as citations.
 */
const FEED="https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/data/sli-reviewed-secondary-news.json";
const HOSTS=new Set([
 "reuters.com","www.reuters.com","antaranews.com","www.antaranews.com",
 "apnews.com","www.apnews.com","kompas.com","www.kompas.com",
 "tempo.co","www.tempo.co","bisnis.com","www.bisnis.com",
 "katadata.co.id","www.katadata.co.id","kontan.co.id","www.kontan.co.id",
 "thejakartapost.com","www.thejakartapost.com",
 "mining.com","www.mining.com","datacenterdynamics.com","www.datacenterdynamics.com",
 "channelnewsasia.com","www.channelnewsasia.com",
 "scmp.com","www.scmp.com","nikkei.com","asia.nikkei.com",
 "cnbc.com","www.cnbc.com","ft.com","www.ft.com",
 "esdm.go.id","www.esdm.go.id","bi.go.id","www.bi.go.id",
 "bps.go.id","www.bps.go.id","kemenkeu.go.id","www.kemenkeu.go.id",
 "komdigi.go.id","www.komdigi.go.id","setkab.go.id","www.setkab.go.id",
 "bkpm.go.id","www.bkpm.go.id","pln.co.id","web.pln.co.id","www.pln.co.id"
]);
const SECTORS=new Set(["minerals","ai","energy","regional","food","trade","geopolitics","policy","investment"]);
export function approvedPublisherArticle(value){
 try{
  const u=new URL(value);
  return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&HOSTS.has(u.hostname.toLowerCase())&&
    u.pathname.length>1&&!/\.(?:rss|xml)$/i.test(u.pathname);
 }catch{return false}
}
const dateOK=s=>typeof s==="string"&&/^20\d\d-\d\d-\d\dT/.test(s)&&Number.isFinite(Date.parse(s));
export function secondaryArticleIsReviewed(d,nowMs=Date.now()){
 if(!d||typeof d!=="object"||d.verification_status!=="claim_reviewed"||d.source_type!=="secondary_news"||
    typeof d.id!=="string"||!/^sli_news_[a-z0-9_-]{3,70}$/.test(d.id)||
    !approvedPublisherArticle(d.article_url)||typeof d.publisher!=="string"||d.publisher.trim().length<3||d.publisher.length>100||
    typeof d.title!=="string"||d.title.length<15||d.title.length>260||
    typeof d.claim_summary!=="string"||d.claim_summary.length<45||d.claim_summary.length>850||
    typeof d.topic!=="string"||!SECTORS.has(d.topic)||typeof d.geo!=="string"||d.geo.length>90||
    typeof d.reviewer!=="string"||d.reviewer.length<5||d.reviewer.length>100||
    !dateOK(d.published_at_utc)||!dateOK(d.reviewed_at_utc)||
    Date.parse(d.published_at_utc)>nowMs+600000||Date.parse(d.reviewed_at_utc)>nowMs+600000||
    Date.parse(d.reviewed_at_utc)<Date.parse(d.published_at_utc)||
    d.article_body_inspected!==true||d.specific_claim_checked_in_body!==true||d.publisher_identity_checked!==true||
    typeof d.review_note!=="string"||d.review_note.length<20||d.review_note.length>500)return false;
 return true;
}
export function convertReviewedArticles(doc,nowMs=Date.now()){
 if(doc?.schema_version!=="sli-reviewed-secondary-news-v1"||!Array.isArray(doc.articles)||doc.articles.length>150)return [];
 const ids=new Set(),urls=new Set(),out=[];
 for(const d of doc.articles){
  if(!secondaryArticleIsReviewed(d,nowMs)||ids.has(d.id)||urls.has(d.article_url))continue;
  ids.add(d.id);urls.add(d.article_url);
  // Publisher's claim is a dated secondary report, not independent proof of events or official statistics.
  const text="ATTRIBUTED SECONDARY MEDIA REPORT; original publisher article/body and SPECIFIC claim manually reviewed by SLI, not independently proven. "+
    d.publisher+" ("+d.published_at_utc.slice(0,10)+") reported: "+d.claim_summary.trim()+
    ". SLI editorial review: "+d.review_note.trim()+
    ". Treat figures and project milestones as publisher-reported, NOT verified government numbers, actual CAPEX or proven operational capacity.";
  out.push({id:d.id,title:d.title.slice(0,260),text:text.slice(0,1900),source_url:d.article_url,
   source_date:d.published_at_utc.slice(0,10),period:d.published_at_utc.slice(0,10),
   publisher:d.publisher,topic:d.topic==="policy"?"regional":d.topic==="investment"?"regional":d.topic==="geopolitics"?"energy":d.topic,
   geo:d.geo,access:"pro",source_type:"secondary_news",verification_status:"claim_reviewed",
   reviewed_at_utc:d.reviewed_at_utc});
 }
 return out;
}
export async function fetchReviewedSecondaryArticles(fetcher=fetch){
 try{
  const res=await fetcher(FEED,{method:"GET",headers:{accept:"application/json"},
   signal:AbortSignal.timeout(4000),cf:{cacheEverything:true,cacheTtl:300}});
  if(!res?.ok||Number(res.headers?.get("content-length")||0)>110000)throw Error("feed_unavailable_or_large");
  const raw=await res.text();
  if(raw.length>110000)throw Error("feed_too_large");
  const articles=convertReviewedArticles(JSON.parse(raw));
  return {status:articles.length?"claim_reviewed_secondary_articles":"no_approved_secondary_articles",articles};
 }catch{return {status:"secondary_articles_unavailable",articles:[]}}
}
