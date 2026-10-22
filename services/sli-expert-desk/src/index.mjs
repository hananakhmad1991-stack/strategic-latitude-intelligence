/* SLI Expert Desk private owner queue — OFF by default; no public submission endpoint.
 * Cloudflare Access + per-owner allowlist + private D1, not GitHub Pages storage. */
import {HttpError,requireIdentity} from "../../sli-user-intelligence/src/auth.mjs";
import {handleExpertRoute} from "./experts.mjs";

const SERVICES=new Set(["expert_sourcing","consultation","custom_research","advisory"]);
const SECTORS=new Set(["energy","digital","investment","food","policy","geopolitics","other"]);
const DELIVERABLES=new Set(["call","shortlist","brief","report","discuss"]);
const TIMELINES=new Set(["flexible","1-2-weeks","3-5-days","longer"]);
const BUDGETS=new Set(["not_provided","under500","500-2000","2000-5000","above5000","discuss"]);
export const TRANSITIONS=Object.freeze({
 new:["scoping","declined","cancelled"],
 scoping:["sourcing","declined","cancelled"],
 sourcing:["shortlisted","declined","cancelled"],
 shortlisted:["proposal_sent","sourcing","cancelled"],
 proposal_sent:["approved","sourcing","declined","cancelled"],
 approved:["in_progress","cancelled"],
 in_progress:["delivered","cancelled"],
 delivered:[],declined:[],cancelled:[]
});
const statusCodes=new Set(Object.keys(TRANSITIONS));
const headers={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","X-Frame-Options":"DENY"};
const json=(data,status=200,cors={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...cors}});
function errorResponse(error,cors){
 const status=error instanceof HttpError?error.status:500;
 // Do not leak D1/secret values, stack traces, expert profile data or contact emails on 500.
 return json({error:status===500?"Internal service error":error.message},status,cors);
}
function guardEnabled(env){
 if(env.CF_EXPERT_DESK_ENABLED!=="true")throw new HttpError(503,"Expert Desk intake not active");
 if(!/^[a-f0-9]{64}$/i.test(String(env.CF_OWNER_USER_HASH||"")))
  throw new HttpError(503,"Owner access not configured");
}
function corsFor(request,env){
 const exact=String(env.CF_ALLOWED_ORIGIN||"");
 if(!/^https:\/\/[a-z0-9.-]+(?::443)?$/.test(exact))throw new HttpError(503,"Allowed origin not configured");
 const origin=request.headers.get("Origin");
 if(origin&&origin!==exact)throw new HttpError(403,"Unapproved origin");
 if(!["GET","HEAD","OPTIONS"].includes(request.method)&&origin!==exact)
  throw new HttpError(403,"Origin required for mutations");
 return origin===exact?{"Access-Control-Allow-Origin":exact,"Access-Control-Allow-Credentials":"true","Vary":"Origin"}:{"Vary":"Origin"};
}
function requiredText(value,field,min,max){
 if(typeof value!=="string")throw new HttpError(400,"Invalid "+field);
 const valueTrim=value.trim();
 if(valueTrim.length<min||valueTrim.length>max||/[\u0000-\u001f\u007f]/.test(valueTrim))
  throw new HttpError(400,"Invalid "+field);
 return valueTrim;
}
function optionalText(value,field,max){
 if(value==null||value==="")return null;
 return requiredText(value,field,1,max);
}
function choice(value,allowed,field){
 if(typeof value!=="string"||!allowed.has(value))throw new HttpError(400,"Invalid "+field);
 return value;
}
export function validateBrief(input){
 if(!input||typeof input!=="object"||Array.isArray(input))throw new HttpError(400,"Expected project brief");
 const email=optionalText(input.contact_email,"contact_email",254);
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  throw new HttpError(400,"Invalid contact_email");
 return {
  service:choice(input.service,SERVICES,"service"),
  sector:choice(input.sector,SECTORS,"sector"),
  objective:requiredText(input.objective,"objective",15,2000),
  expert_criteria:requiredText(input.expert_criteria,"expert_criteria",8,1000),
  organization:optionalText(input.organization,"organization",160),
  contact_email:email?email.toLowerCase():null,
  deliverable:choice(input.deliverable,DELIVERABLES,"deliverable"),
  timeline:choice(input.timeline,TIMELINES,"timeline"),
  budget:choice(input.budget,BUDGETS,"budget")
 };
}
export function allowedTransition(from,to){return Array.isArray(TRANSITIONS[from])&&TRANSITIONS[from].includes(to)}
function requestID(id){if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))throw new HttpError(400,"Invalid request reference");return id}
function requireDB(env){if(typeof env.DB?.prepare!=="function"||typeof env.DB?.batch!=="function")throw new HttpError(503,"Private database unavailable");return env.DB}
async function bodyJson(request){
 if(!/^application\/json\b/i.test(request.headers.get("Content-Type")||""))throw new HttpError(415,"JSON required");
 const data=await request.text();
 if(data.length>6000)throw new HttpError(413,"Request too large");
 try{return JSON.parse(data)}catch{throw new HttpError(400,"Invalid JSON")}
}
function ownerIdentity(identity,env){
 if(typeof identity?.id!=="string"||!/^[a-f0-9]{64}$/i.test(identity.id))throw new HttpError(403,"Owner identity unavailable");
 if(identity.id.toLowerCase()!==String(env.CF_OWNER_USER_HASH).toLowerCase())
  throw new HttpError(403,"Not an authorized owner");
}
function limitedNumber(raw,fallback,max){
 if(raw===null)return fallback;
 if(!/^\d{1,3}$/.test(raw))throw new HttpError(400,"Invalid pagination");
 return Math.min(max,Number(raw));
}
export async function handleRequest(request,env,identify=()=>{throw new HttpError(401,"Access required")}){
 let cors={};
 try{
  guardEnabled(env);cors=corsFor(request,env);
  const url=new URL(request.url);
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{...cors,"Access-Control-Allow-Methods":"GET,POST,DELETE,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}});
  if(!url.pathname.startsWith("/api/"))throw new HttpError(404,"Not found");
  const person=await identify(request,env);ownerIdentity(person,env);
  const db=requireDB(env);
  const expertResult=await handleExpertRoute(request,{db,url,json,bodyJson,ownerId:person.id,cors});
  if(expertResult)return expertResult;
  if(url.pathname==="/api/health"&&request.method==="GET")
   return json({active:true,scope:"owner_only",customer_intake:false},200,cors);
  if(url.pathname==="/api/requests"&&request.method==="GET"){
   const lim=limitedNumber(url.searchParams.get("limit"),20,50),off=limitedNumber(url.searchParams.get("offset"),0,999);
   const status=url.searchParams.get("status");
   if(status!==null&&!statusCodes.has(status))throw new HttpError(400,"Invalid status");
   // List excludes contact email and full confidential brief: fetch detail only when needed.
   const statement=status?
    db.prepare("SELECT id,service,sector,organization,status,version,created_at,updated_at FROM research_requests WHERE status=? ORDER BY created_at DESC LIMIT ? OFFSET ?").bind(status,lim,off):
    db.prepare("SELECT id,service,sector,organization,status,version,created_at,updated_at FROM research_requests ORDER BY created_at DESC LIMIT ? OFFSET ?").bind(lim,off);
   const result=await statement.all();
   return json({items:result.results||[],limit:lim,offset:off},200,cors);
  }
  if(url.pathname==="/api/requests"&&request.method==="POST"){
   const data=validateBrief(await bodyJson(request));
   const id=crypto.randomUUID(),when=new Date().toISOString();
   await db.batch([
    db.prepare("INSERT INTO research_requests(id,service,sector,objective,expert_criteria,organization,contact_email,deliverable,timeline,budget,status,version,source,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(id,data.service,data.sector,data.objective,data.expert_criteria,data.organization,data.contact_email,data.deliverable,data.timeline,data.budget,"new",1,"owner_manual",when,when),
    db.prepare("INSERT INTO research_request_history(request_id,from_status,to_status,owner_hash,note,changed_at) VALUES(?,?,?,?,?,?)")
      .bind(id,null,"new",person.id,"Owner entered from separately received inquiry",when)
   ]);
   return json({id,status:"new",version:1,received:false,recorded_by_owner:true},201,cors);
  }
  const match=url.pathname.match(/^\/api\/requests\/([^/]+)(?:\/status)?$/);
  if(match){
   const id=requestID(match[1]);const statusRoute=url.pathname.endsWith("/status");
   if(request.method==="GET"&&!statusRoute){
    const record=await db.prepare("SELECT * FROM research_requests WHERE id=?").bind(id).first();
    if(!record)throw new HttpError(404,"Request not found");
    const events=await db.prepare("SELECT from_status,to_status,changed_at,note FROM research_request_history WHERE request_id=? ORDER BY id DESC LIMIT 50").bind(id).all();
    return json({request:record,history:events.results||[]},200,cors);
   }
   if(request.method==="POST"&&statusRoute){
    const input=await bodyJson(request);
    const to=choice(input?.to,statusCodes,"status");
    const expectedVersion=input?.version;
    if(!Number.isSafeInteger(expectedVersion)||expectedVersion<1)throw new HttpError(400,"Invalid version");
    const note=optionalText(input?.note,"note",400);
    const record=await db.prepare("SELECT status,version FROM research_requests WHERE id=?").bind(id).first();
    if(!record)throw new HttpError(404,"Request not found");
    if(record.version!==expectedVersion)throw new HttpError(409,"Stale request; refresh");
    if(!allowedTransition(record.status,to))throw new HttpError(409,"Invalid workflow transition");
    // A human confirms actual screening / consent before shortlist; client approval before paid work.
    if(to==="shortlisted"){
      if(input.screening_confirmed!==true)throw new HttpError(400,"Expert consent and screening confirmation required");
      const candidate=await db.prepare("SELECT id FROM request_expert_shortlist WHERE request_id=? LIMIT 1").bind(id).first();
      if(!candidate)throw new HttpError(409,"No screened candidate has been linked to this request");
    }
    if(to==="approved"&&input.client_approval_confirmed!==true)throw new HttpError(400,"Client approval confirmation required");
    const changedAt=new Date().toISOString();
    // D1 batch is transactional: state and audit history are committed together.
    // The conditional INSERT is skipped if an optimistic-version conflict wins.
    const results=await db.batch([
      db.prepare("UPDATE research_requests SET status=?,version=version+1,updated_at=? WHERE id=? AND version=?")
        .bind(to,changedAt,id,expectedVersion),
      db.prepare("INSERT INTO research_request_history(request_id,from_status,to_status,owner_hash,note,changed_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM research_requests WHERE id=? AND version=? AND status=?)")
        .bind(id,record.status,to,person.id,note,changedAt,id,expectedVersion+1,to)
    ]);
    if((results[0]?.meta?.changes||0)!==1)throw new HttpError(409,"Concurrent update; refresh");
    return json({id,status:to,version:expectedVersion+1},200,cors);
   }
   if(request.method==="DELETE"&&!statusRoute){
    await db.batch([
      db.prepare("DELETE FROM research_request_history WHERE request_id=?").bind(id),
      db.prepare("DELETE FROM research_requests WHERE id=?").bind(id)
    ]);
    return json({deleted:true,id},200,cors);
   }
  }
  throw new HttpError(404,"Not found");
 }catch(err){return errorResponse(err,cors)}
}
export default {
 fetch(request,env,ctx){
  // Verify Cloudflare Access JWT signature, claims and owner hash for every request.
  // Edge Access must additionally restrict this Worker; never accept forged headers.
  return handleRequest(request,env,()=>requireIdentity(request,env));
 }
};
