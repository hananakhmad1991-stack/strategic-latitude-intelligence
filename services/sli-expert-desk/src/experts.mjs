/* Private, consent-based Expert Registry for the SLI Owner Desk.
 * NO public directory, automated discovery, outbound messages or availability guarantees. */
import {HttpError} from "../../sli-user-intelligence/src/auth.mjs";
const sectors=new Set(["energy","digital","investment","food","policy","geopolitics","other"]);
function textField(v,name,min,max){
 if(typeof v!=="string"||v.trim().length<min||v.trim().length>max||/[\u0000-\u001f\u007f]/.test(v))
  throw new HttpError(400,"Invalid "+name);
 return v.trim();
}
const maybe=(v,name,max)=>v==null||v===""?null:textField(v,name,1,max);
function uuid(v){if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v))throw new HttpError(400,"Invalid reference");return v}
export function validateExpert(input){
 if(!input||typeof input!=="object"||Array.isArray(input))throw new HttpError(400,"Expected expert profile");
 if(input.consent_confirmed!==true)throw new HttpError(400,"Expert registry consent must be verified");
 const date=textField(input.consent_date,"consent_date",10,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+"T00:00:00Z"))||
  new Date(date+"T00:00:00Z").toISOString().slice(0,10)!==date||date>new Date().toISOString().slice(0,10))
  throw new HttpError(400,"Invalid consent_date");
 const sector=textField(input.sector,"sector",2,30);
 if(!sectors.has(sector))throw new HttpError(400,"Invalid sector");
 const contact=maybe(input.contact_email,"contact_email",254);
 if(contact&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact))throw new HttpError(400,"Invalid contact_email");
 const url=maybe(input.public_profile_url,"public_profile_url",500);
 if(url){let u;try{u=new URL(url)}catch{throw new HttpError(400,"Invalid public_profile_url")}
  if(u.protocol!=="https:"||u.username||u.password||!u.hostname.includes("."))
   throw new HttpError(400,"Only public HTTPS profile links allowed");
 }
 return {
  display_name:textField(input.display_name,"display_name",2,140),
  sector,specialty:textField(input.specialty,"specialty",4,280),
  experience_summary:textField(input.experience_summary,"experience_summary",10,900),
  consent_date:date,
  consent_reference:textField(input.consent_reference,"consent_reference",6,240),
  contact_email:contact?contact.toLowerCase():null,
  public_profile_url:url
 };
}
export async function handleExpertRoute(request,ctx){
 const {db,url,json,bodyJson,ownerId,cors}=ctx;
 const pathname=url.pathname;
 if(pathname==="/api/experts"&&request.method==="GET"){
  const requested=url.searchParams.get("sector");
  if(requested&&!sectors.has(requested))throw new HttpError(400,"Invalid sector");
  const sql=requested?
   "SELECT id,display_name,sector,specialty,public_profile_url,consent_verified_at FROM consented_experts WHERE sector=? ORDER BY display_name ASC LIMIT 100":
   "SELECT id,display_name,sector,specialty,public_profile_url,consent_verified_at FROM consented_experts ORDER BY display_name ASC LIMIT 100";
  const result=await (requested?db.prepare(sql).bind(requested):db.prepare(sql)).all();
  return json({items:result.results||[],not_public:true},200,cors);
 }
 if(pathname==="/api/experts"&&request.method==="POST"){
  const expert=validateExpert(await bodyJson(request));
  const id=crypto.randomUUID(),at=new Date().toISOString();
  await db.prepare("INSERT INTO consented_experts(id,display_name,sector,specialty,experience_summary,contact_email,public_profile_url,consent_scope,consent_verified_at,consent_reference,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
   .bind(id,expert.display_name,expert.sector,expert.specialty,expert.experience_summary,expert.contact_email,expert.public_profile_url,"internal_matching",expert.consent_date,expert.consent_reference,at).run();
  return json({id,consent_scope:"internal_matching",publicly_listed:false},201,cors);
 }
 const expert=pathname.match(/^\/api\/experts\/([^/]+)$/);
 if(expert){
  const id=uuid(expert[1]);
  if(request.method==="GET"){
   const record=await db.prepare("SELECT * FROM consented_experts WHERE id=?").bind(id).first();
   if(!record)throw new HttpError(404,"Expert record not found");
   return json({expert:record,publicly_listed:false},200,cors);
  }
  if(request.method==="DELETE"){
   await db.batch([
    db.prepare("DELETE FROM request_expert_shortlist WHERE expert_id=?").bind(id),
    db.prepare("DELETE FROM consented_experts WHERE id=?").bind(id)
   ]);
   return json({id,deleted:true},200,cors);
  }
 }
 const candidates=pathname.match(/^\/api\/requests\/([^/]+)\/candidates$/);
 if(candidates){
  const requestId=uuid(candidates[1]);
  if(request.method==="GET"){
   const r=await db.prepare("SELECT c.id,c.expert_id,e.display_name,e.sector,e.specialty,c.fit_reason,c.reviewed_at FROM request_expert_shortlist c JOIN consented_experts e ON e.id=c.expert_id WHERE c.request_id=? ORDER BY c.reviewed_at DESC LIMIT 30").bind(requestId).all();
   return json({request_id:requestId,candidates:r.results||[],owner_only:true},200,cors);
  }
  if(request.method==="POST"){
   const input=await bodyJson(request);
   if(input?.share_authorized!==true||input?.conflicts_checked!==true||input?.availability_confirmed!==true)
    throw new HttpError(400,"Expert permission, conflicts and availability checks required");
   const expertId=uuid(input.expert_id);
   const fit=textField(input.fit_reason,"fit_reason",15,650);
   const req=await db.prepare("SELECT id FROM research_requests WHERE id=?").bind(requestId).first();
   if(!req)throw new HttpError(404,"Research request not found");
   const person=await db.prepare("SELECT id FROM consented_experts WHERE id=? AND consent_scope=?").bind(expertId,"internal_matching").first();
   if(!person)throw new HttpError(409,"Consented expert not found");
   const id=crypto.randomUUID(),at=new Date().toISOString();
   await db.prepare("INSERT INTO request_expert_shortlist(id,request_id,expert_id,fit_reason,reviewed_by_hash,reviewed_at) VALUES(?,?,?,?,?,?)")
     .bind(id,requestId,expertId,fit,ownerId,at).run();
   // No emails or invitations are automatically sent and project status is not advanced.
   return json({id,request_id:requestId,expert_id:expertId,approval_to_share_checked:true,not_contacted:true},201,cors);
  }
 }
 return null;
}
