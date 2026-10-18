import {queryTokens,normalize} from "./core.mjs";
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

const SYNONYMS={
 energi:["energy","oil","gas","lng","bbm","minyak","listrik","coal","hormuz","selat"],
 energy:["energi","oil","gas","lng","bbm","minyak","power","hormuz"],
 minyak:["oil","crude","fuel","petroleum"],gas:["lng","lpg","natural gas"],
 geopolitik:["geopolitical","hormuz","iran","sanctions","sanksi"],
 ai:["data center","datacenter","semiconductor","gpu","kecerdasan","chip"],
 data:["datacenter","data center","pusat data"],
 mineral:["nickel","nikel","copper","tembaga","smelter"],
 nikel:["nickel","smelter"],tembaga:["copper"],investasi:["investment","capex","investor"]
};
export function selectMonitoringNewsEvidence(documents,question,history=[],maxResults=4){
 const prev=[...history].reverse().find(x=>x.role==="user")?.content||"";
 const referential=/^(lanjut|perdalam|koreksi|jelaskan lagi|bandingkan|apa dampaknya|what about|continue|correct)/i.test(question.trim());
 const q=referential&&prev?prev+" "+question:question;
 const terms=queryTokens(q).filter(x=>x.length>=3);
 const extended=[...new Set(terms.flatMap(x=>[x,...(SYNONYMS[x]||[])]))];
 if(!extended.length)return [];
 const results=[];
 for(const d of (Array.isArray(documents)?documents:[])){
  if(!d||d.source_type!=="secondary_news")continue;
  const headline=normalize(d.title),publisher=normalize(d.publisher),corpus=normalize(d.text).slice(0,450);
  let score=0;
  for(const term of extended){
   const needle=normalize(term);if(!needle)continue;
   if(headline.includes(needle))score+=terms.includes(term)?14:5;
   if(publisher.includes(needle))score+=3;
   if(corpus.includes(needle))score+=1;
  }
  if(score>0)results.push({d,score});
 }
 results.sort((a,b)=>b.score-a.score||String(b.d.source_date).localeCompare(String(a.d.source_date))||a.d.id.localeCompare(b.d.id));
 return results.slice(0,maxResults).map(x=>x.d);
}
