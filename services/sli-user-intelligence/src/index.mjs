// SLI User Intelligence Backend (Cloudflare Worker / D1). No secrets in static dashboard.
import {requireIdentity,HttpError} from "./auth.mjs";
import {validatePreferences,eligible,eventKind,validateEvent,DEFAULT_PREFS} from "./matcher.mjs";
const HISTORY="https://raw.githubusercontent.com/hananakhmad1991-stack/strategic-latitude-intelligence/main/data/sli-catalyst-history.json";
const MAX_USERS=200,MAX_EVENTS=24;
const nowUTC=()=>new Date().toISOString();
const json=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...extra}});
function allowedOrigin(request,env){
 const origin=request.headers.get("Origin");
 const allowed=String(env.CF_ALLOWED_ORIGIN||"");
 if(!/^https:\/\/[a-z0-9.-]+(?::443)?$/.test(allowed))throw new HttpError(503,"Allowed browser origin not configured");
 if(origin&&origin!==allowed)throw new HttpError(403,"Unapproved browser origin");
 if(request.method!=="GET"&&request.method!=="HEAD"&&request.method!=="OPTIONS"&&origin!==allowed)
  throw new HttpError(403,"Origin required for mutations");
 return origin===allowed?{"Access-Control-Allow-Origin":allowed,"Access-Control-Allow-Credentials":"true","Vary":"Origin"}:{"Vary":"Origin"};
}
function safeReturn(error,headers){
 const status=error instanceof HttpError?error.status:500;
 return json({error:status===500?"Internal service error":error.message},status,headers);
}
async function readPayload(request){
 let raw;try{raw=await request.text()}catch{throw new HttpError(400,"Invalid request body")}
 if(raw.length>6000)throw new HttpError(413,"Request too large");
 try{return JSON.parse(raw)}catch{throw new HttpError(400,"Expected JSON body")}
}
function requireDB(env){
 if(!env.DB||typeof env.DB.prepare!=="function")throw new HttpError(503,"Cloudflare D1 not connected");
 return env.DB;
}
function prefsRow(row){
 if(!row)return {enrolled:false,preferences:DEFAULT_PREFS};
 let value;try{value=validatePreferences(JSON.parse(row.preferences_json))}catch{value=DEFAULT_PREFS}
 return {enrolled:true,preferences:value,updated_at:row.updated_at};
}
export async function handleRequest(request,env,identify=requireIdentity){
 let headers={};
 try{
  headers=allowedOrigin(request,env);
  const url=new URL(request.url);
  if(request.method==="OPTIONS"){
   return new Response(null,{status:204,headers:{...headers,
    "Access-Control-Allow-Methods":"GET,PUT,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type",
    "Access-Control-Max-Age":"600"}});
  }
  if(!url.pathname.startsWith("/api/"))throw new HttpError(404,"Not found");
  const db=requireDB(env);
  const who=await identify(request,env);
  const me=who.id;
  if(url.pathname==="/api/me"&&request.method==="GET"){
   const row=await db.prepare("SELECT preferences_json,updated_at FROM user_profiles WHERE user_id=?").bind(me).first();
   return json({...prefsRow(row),identity_provider:"cloudflare_access",channels:{in_app:true,email:false,push:false}},200,headers);
  }
  if(url.pathname==="/api/preferences"&&request.method==="PUT"){
   const prefs=validatePreferences(await readPayload(request));
   const now=nowUTC();
   await db.prepare("INSERT INTO user_profiles(user_id,preferences_json,created_at,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET preferences_json=excluded.preferences_json,updated_at=excluded.updated_at")
    .bind(me,JSON.stringify(prefs),now,now).run();
   return json({enrolled:true,preferences:prefs,updated_at:now},200,headers);
  }
  if(url.pathname==="/api/preferences"&&request.method==="GET"){
   const row=await db.prepare("SELECT preferences_json,updated_at FROM user_profiles WHERE user_id=?").bind(me).first();
   return json(prefsRow(row),200,headers);
  }
  if(url.pathname==="/api/inbox"&&request.method==="GET"){
   const lim=Number(url.searchParams.get("limit")||20),offset=Number(url.searchParams.get("offset")||0);
   if(!Number.isInteger(lim)||lim<1||lim>50||!Number.isInteger(offset)||offset<0||offset>10000)
    throw new HttpError(400,"Invalid inbox paging");
   const result=await db.prepare("SELECT id,event_id,title,event_kind,relevance,source_url,detected_at,created_at,read_at FROM notification_inbox WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?")
    .bind(me,lim,offset).all();
   const unread=await db.prepare("SELECT COUNT(*) AS n FROM notification_inbox WHERE user_id=? AND read_at IS NULL").bind(me).first();
   return json({items:result.results||[],unread:Number(unread?.n||0),limit:lim,offset},200,headers);
  }
  if(url.pathname==="/api/inbox/read"&&request.method==="POST"){
   const body=await readPayload(request);
   if(!Array.isArray(body.ids)||body.ids.length>50||body.ids.some(x=>typeof x!=="string"||!(/^[a-f0-9-]{36}$/i).test(x)))
    throw new HttpError(400,"Invalid notification IDs");
   const ids=[...new Set(body.ids)];
   if(ids.length)await db.batch(ids.map(id=>db.prepare("UPDATE notification_inbox SET read_at=? WHERE id=? AND user_id=? AND read_at IS NULL")
     .bind(nowUTC(),id,me)));
   return json({accepted:ids.length},200,headers);
  }
  if(url.pathname==="/api/me"&&request.method==="DELETE"){
   await db.batch([
    db.prepare("DELETE FROM notification_inbox WHERE user_id=?").bind(me),
    db.prepare("DELETE FROM user_profiles WHERE user_id=?").bind(me)]);
   return json({deleted:true},200,headers);
  }
  throw new HttpError(404,"Unknown endpoint");
 }catch(error){
  if(!(error instanceof HttpError))console.error("[SLI User Backend]",String(error));
  return safeReturn(error,headers);
 }
}
async function fetchLedger(fetcher){
 const r=await fetcher(HISTORY,{redirect:"error",headers:{Accept:"application/json"},signal:AbortSignal.timeout(7000)});
 if(!r.ok)throw new Error("SLI history HTTP "+r.status);
 const text=await r.text();if(text.length>2000000)throw new Error("SLI history size exceeded");
 const d=JSON.parse(text);
 if(d.schema_version!=="sli-catalyst-history-v2"||!Array.isArray(d.events)||d.events.length>1800)
  throw new Error("Invalid SLI history schema");
 return d.events.filter(validateEvent).sort((a,b)=>a.detected_at_utc.localeCompare(b.detected_at_utc));
}
export async function processEvents(env,fetcher=fetch){
 const db=requireDB(env),events=await fetchLedger(fetcher),now=nowUTC();
 const state=await db.prepare("SELECT value FROM service_state WHERE key='first_activated_at'").first();
 if(!state){
  // First activation is a baseline. No retrospective notifications.
  await db.prepare("INSERT OR IGNORE INTO service_state(key,value) VALUES('first_activated_at',?)").bind(now).run();
  return {initialized:true,delivered:0,processed:0};
 }
 const after=Date.parse(state.value);
 if(!Number.isFinite(after))throw new Error("Invalid notification activation baseline");
 const processed=await db.prepare("SELECT event_id FROM processed_events ORDER BY processed_at DESC LIMIT 2000").all();
 const known=new Set((processed.results||[]).map(x=>x.event_id));
 const candidates=events.filter(e=>Date.parse(e.detected_at_utc)>after&&!known.has(e.id)).slice(0,MAX_EVENTS);
 if(!candidates.length)return {initialized:false,delivered:0,processed:0};
 const result=await db.prepare("SELECT user_id,preferences_json FROM user_profiles LIMIT ?").bind(MAX_USERS+1).all();
 const profiles=result.results||[];
 if(profiles.length>MAX_USERS)throw new Error("Delivery capacity exceeded; fanout must be batched before scaling");
 let delivered=0;
 for(const item of candidates){
  const stmts=[];
  for(const user of profiles){
   let p;try{p=validatePreferences(JSON.parse(user.preferences_json))}catch{continue}
   const basis=eligible(item,p);
   if(!basis)continue;
   stmts.push(db.prepare("INSERT OR IGNORE INTO notification_inbox(id,user_id,event_id,title,event_kind,relevance,source_url,detected_at,created_at) VALUES(?,?,?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(),user.user_id,item.id,item.title,eventKind(item),basis,item.source_url,item.detected_at_utc,now));
   delivered++;
  }
  // D1 batch executes statements transactionally, preventing recorded events without inbox delivery.
  stmts.push(db.prepare("INSERT OR IGNORE INTO processed_events(event_id,processed_at) VALUES(?,?)").bind(item.id,now));
  await db.batch(stmts);
 }
 return {initialized:false,delivered,processed:candidates.length};
}
export default {
 fetch:handleRequest,
 scheduled(_event,env,ctx){ctx.waitUntil(processEvents(env))}
};
