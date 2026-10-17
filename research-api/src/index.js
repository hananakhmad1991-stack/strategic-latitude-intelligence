/* SLI conversational Research AI · STAGING ONLY, not deployed.
 * Production requires verified Supabase identity, active entitlement, vetted private R2,
 * server-held model key, rate/cost limits, and signed-off privacy/licensing.
 */
import {verifyUserToken} from "../../membership-api/src/index.js";
import {citationsValid,extractModelText} from "./core.mjs";
import {validateAssistantPayload,selectResearchEvidence,modelRequest,verifyResearchAnswer} from "./assistant-core.mjs";
const J={"content-type":"application/json; charset=utf-8","cache-control":"private, no-store","x-content-type-options":"nosniff","vary":"Origin, Authorization"};
function response(status,body,origin){
 const extra=origin?{"access-control-allow-origin":origin}:{};
 return new Response(JSON.stringify(body),{status,headers:{...J,...extra}});
}
function trustedOrigin(input){
 try{const u=new URL(input);return u.protocol==="https:"&&u.pathname==="/"&&!u.search&&!u.hash&&!u.username&&!u.password?u.origin:null}catch{return null}
}
async function planOf(userId,db){
 const rec=await db.prepare("SELECT plan,status,access_until FROM subscriptions WHERE user_id = ? LIMIT 1").bind(userId).first();
 if(!rec||!["pro","enterprise"].includes(rec.plan)||!["active","trialing"].includes(rec.status)||!Number.isFinite(Date.parse(rec.access_until))||Date.parse(rec.access_until)<=Date.now())return "open";
 return rec.plan;
}
async function readBodyLimited(req,maxBytes=24000){
 const reader=req.body?.getReader();if(!reader)return "";
 const chunks=[];let size=0;
 try{
  while(true){
   const {value,done}=await reader.read();if(done)break;
   size+=value.byteLength;if(size>maxBytes)throw Error("too_large");
   chunks.push(value);
  }
 }catch(e){try{await reader.cancel()}catch{}throw e}finally{try{reader.releaseLock()}catch{}}
 const bytes=new Uint8Array(size);let i=0;
 for(const c of chunks){bytes.set(c,i);i+=c.byteLength}
 return new TextDecoder("utf-8",{fatal:true}).decode(bytes);
}
export default {
 async fetch(req,env){
  const allowed=trustedOrigin(env?.WEB_ORIGIN),incoming=req.headers.get("origin");
  if(!allowed||incoming!==allowed)return response(403,{error:"origin_denied"});
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{...J,"access-control-allow-origin":allowed,"access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"authorization, content-type","access-control-max-age":"300"}});
  if(req.method!=="POST")return response(405,{error:"method_not_allowed"},allowed);
  if(new URL(req.url).pathname!=="/v1/research")return response(404,{error:"not_found"},allowed);
  if(!env.DB||!env.RESEARCH_BUCKET||!env.OPENAI_API_KEY||!env.RESEARCH_MODEL||!env.SUPABASE_URL||!env.AI_LIMITER)return response(503,{error:"research_not_configured"},allowed);
  const token=(req.headers.get("authorization")||"").match(/^Bearer ([A-Za-z0-9._-]{50,10000})$/);
  if(!token)return response(401,{error:"authentication_required"},allowed);
  let userId;
  try{userId=await verifyUserToken(token[1],env)}catch{return response(401,{error:"invalid_token"},allowed)}
  let plan;
  try{plan=await planOf(userId,env.DB)}catch{return response(503,{error:"entitlement_unavailable"},allowed)}
  if(plan==="open")return response(403,{error:"pro_membership_required"},allowed);
  if(!/^application\/json(?:;|$)/i.test(req.headers.get("content-type")||""))return response(415,{error:"json_content_type_required"},allowed);
  const length=Number(req.headers.get("content-length")||0);
  if(length>24000)return response(413,{error:"request_too_large"},allowed);
  let json;
  try{const raw=await readBodyLimited(req);json=JSON.parse(raw)}
  catch(e){return response(e.message==="too_large"?413:400,{error:e.message==="too_large"?"request_too_large":"invalid_request_body"},allowed)}
  const payload=validateAssistantPayload(json);
  if(!payload)return response(422,{error:"invalid_research_instruction"},allowed);
  let allowance;
  try{allowance=await env.AI_LIMITER.limit({key:userId})}catch{return response(503,{error:"limiter_unavailable"},allowed)}
  if(!allowance?.success)return response(429,{error:"request_quota_exceeded"},allowed);
  let corpus;
  try{
   const file=await env.RESEARCH_BUCKET.get("pro/research-evidence.json");
   if(!file)return response(503,{error:"private_research_corpus_missing"},allowed);
   corpus=await file.json();
  }catch{return response(503,{error:"research_corpus_unavailable"},allowed)}
  const evidence=selectResearchEvidence(corpus?.documents,payload.question,payload.history,plan,10);
  if(!evidence.length)return response(200,{
   mode:"generative_rag",answer:payload.language==="id"?
   "Bukti dalam database SLI yang boleh digunakan belum cukup untuk menjawab instruksi ini. Saya tidak akan mengganti wilayah yang ditanyakan dengan wilayah lain atau mengarang angka.":
   "Insufficient authorised SLI evidence for this question. No other geography or invented statistic was substituted.",
   sources:[],research_format:payload.mode,evidence_status:"insufficient_no_model_call"
  },allowed);
  // No client-supplied sources or privilege claims are passed to the model.
  const modelPayload=modelRequest(payload,evidence,env.RESEARCH_MODEL);
  let raw;
  try{
   const modelRes=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",headers:{"authorization":"Bearer "+env.OPENAI_API_KEY,"content-type":"application/json"},
    body:JSON.stringify(modelPayload)
   });
   if(!modelRes.ok)return response(502,{error:"research_model_error"},allowed);
   raw=await modelRes.json();
  }catch{return response(502,{error:"research_model_unreachable"},allowed)}
  if(raw?.status!=="completed")return response(502,{error:"research_model_incomplete"},allowed);
  const answer=extractModelText(raw);
  if(!verifyResearchAnswer(answer,evidence)||!citationsValid(answer,evidence))return response(502,{error:"citation_validation_failed",message:"AI answer withheld because valid numbered citations are missing."},allowed);
  return response(200,{
   mode:"generative_rag",research_format:payload.mode,
   answer,sources:evidence.map(({id,title,source_url,period,source_date,publisher,geo},i)=>({index:i+1,id,title,source_url,period,source_date,publisher,geo})),
   evidence_status:"generated_references_require_fact_check"
  },allowed);
 }
};
