#!/usr/bin/env node
/**
 * SLI Catalyst History v2: shared, Git-versioned change ledger.
 * The ledger reports CHANGES TO THE SLI INDEX, not confirmed real-world milestones.
 * No external APIs, scraped articles, user data, or financial predictions.
 */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {pathToFileURL} from "node:url";
import path from "node:path";
import {createHash} from "node:crypto";

const STATE_FILE="data/sli-catalyst-state.json", HISTORY_FILE="data/sli-catalyst-history.json";
const INPUTS={
 news:"data/sli-secondary-news-index.json",
 projects:"data/sli-project-registry.json",
 laws:"data/sli-policy-regulatory-graph-2026.json",
 issuers:"data/sli-idx-issuer-universe.json",
 groups:"data/sli-corporate-group-registry.json",
 actors:"data/sli-corporate-evidence-relationships.json"
};
const MAX_EVENTS=1800, RETENTION_DAYS=365;
const RE={ticker:/^[A-Z0-9]{4}$/,date:/^\d{4}-\d{2}-\d{2}/};
const normalized=x=>String(x||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const legal=x=>normalized(String(x||"").replace(/\s*\([A-Z0-9]{4}\)\s*$/,"")).replace(/^pt /,"").replace(/ tbk$/,"").trim();
const digest=x=>createHash("sha256").update(x).digest("hex").slice(0,18);
const validDate=x=>{const t=Date.parse(x||"");return Number.isFinite(t)?t:null};
function safeUrl(value){
 try{const u=new URL(value);
  return u.protocol==="https:"&&!u.username&&!u.password&&(!u.port||u.port==="443")&&
   !!u.hostname&&!(/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname))?
   u.href:null;
 }catch{return null}
}
function categorize(s){
 const n=normalized(s);
 if(n.includes("nickel")||n.includes("mineral")||n.includes("smelter"))return "minerals";
 if(n.includes("ai infrastructure")||n.includes("data center"))return "technology";
 if(n.includes("food")||n.includes("agricultur"))return "food";
 if(n.includes("coal"))return "coal";
 if(n.includes("transport"))return "transport";
 if(n.includes("industrial"))return "manufacturing";
 return "energy";
}
function issuerAlias(issuer,groups){
 const names=new Set([legal(issuer.name)]);
 for(const g of groups?.records||[]){
  if(g.exchange==="IDX"&&g.ticker===issuer.ticker)names.add(legal(g.name));
 }
 return names;
}
function projectLinks(projectId,data){
 const related=[],seen=new Set();
 for(const a of data.actors?.project_participations||[]){
  if(a.project_id!==projectId||!safeUrl(a.source_url))continue;
  const actor=legal(String(a.name||"").replace(/\s*\([A-Z0-9]{4}\)\s*$/,""));
  const matchTicker=String(a.name||"").match(/\(([A-Z0-9]{4})\)\s*$/)?.[1];
  for(const i of data.issuers?.records||[]){
   if(!RE.ticker.test(i.ticker||"")||i.exchange!=="IDX"||seen.has(i.ticker))continue;
   const aliases=issuerAlias(i,data.groups);
   if((matchTicker===i.ticker&&aliases.has(actor))||aliases.has(actor)){
    related.push({ticker:i.ticker,basis:"reported_project_participant",actor_name:a.name,
     evidence_url:a.source_url,evidence_date:a.source_date||null});
    seen.add(i.ticker);
   }
  }
 }
 return related.slice(0,20);
}
function headlineLinks(title,data){
 const found=[];
 for(const i of data.issuers?.records||[]){
  if(i.exchange!=="IDX"||!RE.ticker.test(i.ticker||""))continue;
  const names=issuerAlias(i,data.groups);
  const text=" "+normalized(title)+" ";
  const issuerName=[...names].some(n=>n.length>=10&&n.split(" ").length>=2&&text.includes(" "+n+" "));
  const raw=String(title||"");
  const ambiguous=new Set(["BIRD","CITY","HOME","LIFE","STAR","BANK","WIFI","DATA","FOOD","AUTO","MOVE","GOLD","COAL","RICE"]);
  const code=new RegExp("(?:IDX:|\\$|\\()"+i.ticker+"(?:\\)|\\b)").test(raw)||
    (!ambiguous.has(i.ticker)&&new RegExp("(?:^|[^A-Z0-9])"+i.ticker+"(?=$|[^A-Z0-9])").test(raw));
  if(issuerName||code)found.push({ticker:i.ticker,basis:"explicit_headline_identity"});
 }
 return found.slice(0,16);
}
const compactSource=(docs)=>({
 news:docs.news?.updated_at_utc||null,projects:docs.projects?.as_of||null,
 regulations:docs.laws?.updated_at||null,issuers:docs.issuers?.as_of||null,
 participations:docs.actors?.as_of||null
});
const projectState=p=>({stage:String(p.stage||""),source_date:String(p.evidence_date||"")});
const lawState=n=>({status:String(n.status||""),verified_at:String(n.verified_at||"")});
const newsState=n=>String(n.id||"");
const actorKey=a=>digest(String(a.project_id||"")+"|"+legal(a.name));
const actorState=a=>({project_id:String(a.project_id||""),actor_name:String(a.name||""),
 source_date:String(a.source_date||""),source_url:String(a.source_url||""),
 relationship:String(a.relationship||"")});
function initialState(docs,at){
 return {schema_version:"sli-catalyst-baseline-v2",initialized_at_utc:at,
 news_ids:(docs.news?.articles||[]).map(newsState).filter(Boolean).slice(0,4000),
 projects:Object.fromEntries((docs.projects?.records||[]).filter(x=>x.id).map(x=>[x.id,projectState(x)])),
 laws:Object.fromEntries((docs.laws?.nodes||[]).filter(x=>x.id&&x.kind!=="tier_marker").map(x=>[x.id,lawState(x)])),
 participant_evidence:Object.fromEntries((docs.actors?.project_participations||[])
  .filter(x=>x.project_id&&x.name&&safeUrl(x.source_url)).map(x=>[actorKey(x),actorState(x)]))}
}
function event({kind,key,title,sector="",source_url,publisher="",source_at_utc=null,
 date_type="index_record_date",summary="",project_id=null,regulation_id=null,previous=null,current=null,
 provinces=[],region="",ticker_links=[],detected_at_utc}){
 return {id:"sli-catalyst-"+digest(kind+"|"+key+"|"+detected_at_utc),kind,title,
  detected_at_utc,source_at_utc,date_type,source_url,publisher,sector,summary,
  project_id,regulation_id,previous,current,
  provinces:Array.isArray(provinces)?provinces.filter(x=>typeof x==="string").slice(0,12):[],
  region,ticker_links,
  evidence_status:"index_change_candidate_not_independently_verified",
  impact_status:"not_assessed",source_count:1};
}
function deltaEvents(before,docs,at){
 if(!before)return [];
 const results=[],previousNews=new Set(before.news_ids||[]);
 const publicationRef=validDate(docs.news?.updated_at_utc)||validDate(at);
 for(const a of docs.news?.articles||[]){
  if(!a.id||previousNews.has(a.id)||!safeUrl(a.url))continue;
  const date=validDate(a.published_at_utc);
  if(!date||date>publicationRef+86400000||publicationRef-date>30*86400000)continue;
  results.push(event({kind:a.evidence_level==="official_metadata_change_candidate"?
     "official_metadata_indexed":"news_indexed",
   key:a.id,title:a.title||"Untitled monitoring record",source_url:a.url,publisher:a.publisher||"",
   source_at_utc:a.published_at_utc,date_type:a.date_type||"publisher_publication_date",
   sector:a.sector||"regional",region:a.geo==="Indonesia and global context"?"":a.geo||"",
   summary:"Publisher/index metadata only; full article and claims not independently verified.",
   ticker_links:headlineLinks(a.title,docs),detected_at_utc:at}));
 }
 for(const p of docs.projects?.records||[]){
  const url=safeUrl(p.source_url),prev=before.projects?.[p.id];
  if(!p.id||!url)continue;
  const current=projectState(p);
  const added=!prev;
  if(!added&&(!prev.stage||!current.stage||prev.stage===current.stage))continue;
  results.push(event({kind:added?"project_added_to_index":"project_stage_index_changed",
   key:p.id+"|"+(prev?.stage||"")+"|"+current.stage,title:p.name,sector:categorize(p.sector),
   source_url:url,publisher:"SLI project registry / cited issuing source",
   source_at_utc:p.evidence_date||null,date_type:"project_source_date",
   summary:added?"New project register entry; not a newly announced real-world project.":
    "Project stage field changed in SLI; verify the effective milestone/date with the source.",
   project_id:p.id,previous:added?null:prev.stage,current:current.stage,
   provinces:p.provinces,region:p.region||"",ticker_links:projectLinks(p.id,docs),detected_at_utc:at}));
 }
 if(before.participant_evidence){
 for(const actor of docs.actors?.project_participations||[]){
  if(!actor.project_id||!actor.name||!safeUrl(actor.source_url))continue;
  const key=actorKey(actor),previous=before.participant_evidence?.[key],current=actorState(actor);
  if(!previous){
   const project=(docs.projects?.records||[]).find(x=>x.id===actor.project_id);
   const onlyThis={...docs,actors:{project_participations:[actor]}};
   results.push(event({kind:"project_participant_indexed",key,
    title:(project?.name||actor.project_id)+" · "+actor.name,
    sector:categorize(project?.sector||""),source_url:actor.source_url,
    publisher:"SLI corporate participation register / cited source",
    source_at_utc:actor.source_date||null,date_type:"participation_source_date",
    summary:"An actor/project participation evidence link entered SLI; not an equity or control assertion.",
    project_id:actor.project_id,previous:null,current:"reported participant",
    provinces:project?.provinces||[],region:project?.region||"",
    ticker_links:projectLinks(actor.project_id,onlyThis),detected_at_utc:at}));
  }else if(previous.source_date!==current.source_date&&current.source_date&&previous.source_date){
   const project=(docs.projects?.records||[]).find(x=>x.id===actor.project_id);
   const onlyThis={...docs,actors:{project_participations:[actor]}};
   results.push(event({kind:"project_participation_evidence_revised",key:key+"|"+current.source_date,
    title:(project?.name||actor.project_id)+" · "+actor.name,
    sector:categorize(project?.sector||""),source_url:actor.source_url,
    publisher:"SLI corporate participation register / cited source",
    source_at_utc:actor.source_date,date_type:"participation_source_date",
    summary:"Dated source record for an actor/project link changed in SLI; not proof of new shareholding.",
    project_id:actor.project_id,previous:previous.source_date,current:current.source_date,
    provinces:project?.provinces||[],region:project?.region||"",
    ticker_links:projectLinks(actor.project_id,onlyThis),detected_at_utc:at}));
  }
 }
 }
 for(const law of docs.laws?.nodes||[]){
  const url=safeUrl(law.source),prev=before.laws?.[law.id];
  if(!law.id||law.kind==="tier_marker"||!url)continue;
  const current=lawState(law),added=!prev;
  if(!added&&(!prev.status||!current.status||prev.status===current.status))continue;
  results.push(event({kind:added?"regulation_added_to_index":"regulation_status_index_changed",
   key:law.id+"|"+(prev?.status||"")+"|"+current.status,title:law.ref+" · "+law.label,
   sector:law.sector||"cross",source_url:url,publisher:law.owner||"Issuing institution (consult official source)",
   source_at_utc:law.verified_at||docs.laws.updated_at||null,date_type:"regulatory_index_date",
   summary:added?"New entry in SLI's legal index, not necessarily a new law.":
     "SLI legal index status changed; check text, amendments and effective date in official JDIH.",
   regulation_id:law.id,previous:added?null:prev.status,current:current.status,
   region:law.region||"Indonesia",detected_at_utc:at}));
 }
 return results;
}
async function jsonOrNull(root,rel){
 try{return JSON.parse(await readFile(path.join(root,rel),"utf8"))}catch{return null}
}
const stable=x=>JSON.stringify(x,null,2)+"\n";
async function writeIfChanged(root,rel,obj){
 const target=path.join(root,rel),s=stable(obj);
 let old=null;try{old=await readFile(target,"utf8")}catch{}
 if(s===old)return false;
 await mkdir(path.dirname(target),{recursive:true});await writeFile(target,s);return true;
}
export async function build(root,{now=new Date().toISOString()}={}){
 const docs={};const missing=[];
 for(const [key,rel]of Object.entries(INPUTS)){
  const d=await jsonOrNull(root,rel);
  const valid=key==="news"?Array.isArray(d?.articles):
   key==="laws"?Array.isArray(d?.nodes):
   key==="actors"?Array.isArray(d?.project_participations):
   Array.isArray(d?.records);
  if(valid)docs[key]=d;else missing.push(key);
 }
 if(!docs.news&&!docs.projects&&!docs.laws)throw Error("No event-bearing registries available");
 let prev=await jsonOrNull(root,STATE_FILE);
 if(prev?.schema_version!=="sli-catalyst-baseline-v2")prev=null;
 const oldHistory=await jsonOrNull(root,HISTORY_FILE);
 const oldEvents=oldHistory?.schema_version==="sli-catalyst-history-v2"&&Array.isArray(oldHistory.events)?oldHistory.events:[];
 // Do not declare changes for the first observation of a source after an outage.
 const baseline=initialState(docs,now);
 if(prev){
  baseline.initialized_at_utc=prev.initialized_at_utc;
  for(const [k,source]of [["news_ids","news"],["projects","projects"],["laws","laws"],["participant_evidence","actors"]]){
   if(!docs[source])baseline[k]=prev[k];
  }
 }
 const changes=deltaEvents(prev,docs,now);
 const cutoff=validDate(now)-RETENTION_DAYS*86400000;
 const eventMap=new Map();
 for(const e of [...oldEvents,...changes]){
  if(!e?.id||!validDate(e.detected_at_utc)||validDate(e.detected_at_utc)<cutoff)continue;
  eventMap.set(e.id,e);
 }
 const events=[...eventMap.values()].sort((a,b)=>String(b.detected_at_utc).localeCompare(String(a.detected_at_utc))).slice(0,MAX_EVENTS);
 // generated_at_utc is a publishing timestamp, not a fabricated event timestamp.
 const changedCount=changes.filter(e=>!oldEvents.some(o=>o.id===e.id)).length;
 const history={schema_version:"sli-catalyst-history-v2",
   initialized_at_utc:baseline.initialized_at_utc,
   published_at_utc:changedCount||events.length!==oldEvents.length?now:oldHistory?.published_at_utc||now,
   provenance_policy:"Shared Git-versioned SLI index deltas. News is publisher-attributed, project/regulation events are changes to the SLI index only. Not independently verified factual changes, firm exposure, or trading alerts.",
   retention_days:RETENTION_DAYS,
   source_snapshots:compactSource(docs),
   count:events.length,events};
 const stateWritten=await writeIfChanged(root,STATE_FILE,baseline);
 const historyWritten=await writeIfChanged(root,HISTORY_FILE,history);
 return {stateWritten,historyWritten,added:changedCount,total:events.length,missing,initialized:!prev};
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 build(path.resolve(process.argv[2]||"."),{now:new Date().toISOString()}).then(x=>{
  process.stdout.write(JSON.stringify(x)+"\n");
 }).catch(e=>{process.stderr.write(String(e)+"\n");process.exitCode=1});
}
