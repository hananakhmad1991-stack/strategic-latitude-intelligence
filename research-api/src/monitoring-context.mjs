/* Public-source monitoring leads for OWNER staging only. Discovery != fact check.
 * Fetch only one hard-coded SLI GitHub Pages path. No arbitrary URL input/SSRF.
 */
const SNAPSHOT="https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/data/daily-energy-assessment.json";
const WINDOW_HOURS=72;
export function selectEnergyHeadlineLeads(doc,nowMs=Date.now()){
 const out=[];
 if(!doc||typeof doc!=="object"||!Array.isArray(doc.points))return out;
 for(const point of doc.points){
  for(const lead of (Array.isArray(point.recent_news_leads)?point.recent_news_leads:[]).slice(0,2)){
   if(!lead||typeof lead.title!=="string"||lead.title.length<8||lead.title.length>350||
    typeof lead.url!=="string"||!lead.url.startsWith("https://news.google.com/rss/articles/")||
    typeof lead.published_at_utc!=="string")continue;
   const ts=Date.parse(lead.published_at_utc);
   if(!Number.isFinite(ts)||ts>nowMs+600000||nowMs-ts>WINDOW_HOURS*3600000)continue;
   if(out.some(x=>x.title===lead.title))continue;
   out.push({category:point.id,title:lead.title,publisher:String(lead.publisher||"undisclosed").slice(0,75),
    published_at_utc:lead.published_at_utc,url:lead.url,
    evidence_status:"UNVERIFIED MONITORING HEADLINE — not checked against publisher article body"});
   if(out.length>=8)return out;
  }
 }
 return out;
}
export async function fetchEnergyMonitoring(fetcher=fetch){
 let latest;
 try{
  const resp=await fetcher(SNAPSHOT,{method:"GET",headers:{accept:"application/json"},
   signal:AbortSignal.timeout(3600),cf:{cacheEverything:true,cacheTtl:300}});
  if(!resp?.ok)throw Error("monitor_snapshot_http");
  const declared=Number(resp.headers?.get("content-length")||0);
  if(declared>90000)throw Error("monitor_snapshot_too_large");
  const txt=await resp.text();
  if(txt.length>90000)throw Error("monitor_snapshot_too_large");
  latest=JSON.parse(txt);
  if(!/^20\d{2}-\d{2}-\d{2}$/.test(latest?.assessment_date_wib||"")||
     !Array.isArray(latest?.points)||latest.points.length>14)
    throw Error("monitor_snapshot_invalid");
  return {status:"source_dated_public_monitoring",as_of:latest.assessment_date_wib,
   checked_at_utc:latest.generated_at_utc||null,signals:selectEnergyHeadlineLeads(latest)};
 }catch{
  return {status:"monitoring_unavailable",as_of:null,checked_at_utc:null,signals:[]};
 }
}
export function monitoringPromptContext(monitor){
 if(!monitor?.signals?.length)return "";
 return "RECENT ATTRIBUTED NEWS MONITORING HEADLINES — UNVERIFIED DISCOVERY ONLY; do not treat these as established events, project milestones, outage facts, investment values or investment advice. This is NOT live article-body verification. If relevant, label any discussion 'headline leads requiring original publisher verification'.\n"+
 monitor.signals.slice(0,7).map((s,i)=>"- "+(i+1)+". "+s.title+" ("+s.publisher+"; "+s.published_at_utc+"; "+s.category+").").join("\n");
}
