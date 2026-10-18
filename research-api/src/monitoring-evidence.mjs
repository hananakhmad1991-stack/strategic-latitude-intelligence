/* All monitored SLI news may become ATTRIBUTED SECONDARY evidence; none is silently
 * promoted to an independently confirmed event or official numeric baseline.
 * Source is a fixed, public GitHub Pages index, never a URL supplied by a user.
 */
const SNAPSHOT="https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/data/sli-secondary-news-index.json";
const ALLOWED_SECTORS=new Set(["minerals","ai","energy","regional","food","trade","geopolitics","macro"]);
export function normalizeMonitoringEvidence(doc,nowMs=Date.now()){
 if(doc?.schema_version!=="sli-secondary-news-index-v1"||!Array.isArray(doc.articles)||doc.articles.length>4000)return [];
 const rows=[],ids=new Set(),maxAge=365*86400000;
 for(const r of doc.articles){
  if(!r||typeof r.id!=="string"||!/^sli_feed_[a-f0-9]{25}$/.test(r.id)||ids.has(r.id)||
     typeof r.title!=="string"||r.title.length<12||r.title.length>260||
     typeof r.publisher!=="string"||r.publisher.length<3||r.publisher.length>100||
     typeof r.published_at_utc!=="string"||!ALLOWED_SECTORS.has(r.sector)||
     !["publisher_attributed_news_report","official_metadata_change_candidate"].includes(r.evidence_level))continue;
  const date=Date.parse(r.published_at_utc),age=nowMs-date;
  if(!Number.isFinite(date)||age< -600000||age>maxAge)continue;
  let u;
  try{u=new URL(r.url)}catch{continue}
  if(u.protocol!=="https:"||u.username||u.password||u.port||!u.hostname||u.hostname==="localhost"||u.hostname.endsWith(".localhost")||u.hostname.endsWith(".local")||/^(?:127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(u.hostname)||ids.has(r.id))continue;
  ids.add(r.id);
  const publisher=r.publisher.trim(),when=r.published_at_utc.slice(0,10);
  const isDoc=r.evidence_level==="official_metadata_change_candidate";
  const direct=r.link_kind==="publisher_or_official_link";
  const caveat=isDoc?
   "This is a MONITOR DETECTION of a changed document/listing; NOT evidence that a regulation was enacted, amended or revoked.":"This is an attributable publisher NEWS HEADLINE in an SLI monitoring feed, not article-body or independent event verification.";
  const text="SECONDARY MONITORING RECORD. "+publisher+" ("+when+") "+(isDoc?"listing detected: ":"reported in a news headline: ")+
   r.title+". "+caveat+" Link: "+(direct?"publisher/official URL":"aggregator URL pointing toward publisher coverage")+
   ". SLI must compare the reported event with dated official indicators and relevant independent OSINT; do not infer precise costs, impacts, capacity or project completion from a headline alone.";
  rows.push({id:r.id,title:r.title,text,source_url:r.url,publisher,source_date:when,
   period:when,topic:r.sector,geo:String(r.geo||"Indonesia and global context").slice(0,90),access:"pro",
   source_type:"secondary_news",verification_status:isDoc?"listing_change_candidate":"publisher_attributed",
   article_body_checked:r.article_body_checked===true,link_kind:r.link_kind,monitor_source:r.monitor_source});
 }
 return rows;
}
export async function fetchMonitoringEvidence(fetcher=fetch){
 try{
  const res=await fetcher(SNAPSHOT,{method:"GET",headers:{accept:"application/json"},
   signal:AbortSignal.timeout(4000),cf:{cacheEverything:true,cacheTtl:300}});
  if(!res?.ok||Number(res.headers?.get("content-length")||0)>1900000)throw Error("index_unavailable_or_large");
  const txt=await res.text();
  if(txt.length>1900000)throw Error("index_too_large");
  const parsed=JSON.parse(txt);
  const documents=normalizeMonitoringEvidence(parsed);
  return {status:"attributed_secondary_monitoring_index",documents,registered_count:documents.length,updated_at:parsed.updated_at_utc||null};
 }catch{return {status:"secondary_monitoring_unavailable",documents:[],registered_count:0,updated_at:null}}
}
