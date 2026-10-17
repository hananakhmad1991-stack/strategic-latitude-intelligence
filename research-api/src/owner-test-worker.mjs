/* Owner-only staging for SLI Research AI. Do NOT reuse as public production authentication.
 * Inputs come from user's site, but generation is protected by server-side random owner token,
 * same-origin CORS, per-token Cloudflare rate limiter, and external model spend budget.
 * Corpus is ONLY the already-public original SLI evidence snippets, never Pro/Enterprise data.
 */
import preview from "../../data/sli-research-evidence-preview.json";
import provinces from "../../data/sli-research-province-preview.json";
import {validateAssistantPayload,selectResearchEvidence,modelRequest,verifyResearchAnswer} from "./assistant-core.mjs";
import {extractModelText} from "./core.mjs";

const HEADERS={"content-type":"application/json;charset=utf-8","cache-control":"no-store,private","x-content-type-options":"nosniff","vary":"Origin"};
const send=(status,body,origin)=>new Response(JSON.stringify(body),{status,headers:{...HEADERS,...(origin?{"access-control-allow-origin":origin}:{})}});
function validOrigin(input){try{const u=new URL(input);return u.protocol==="https:"&&u.pathname==="/"&&!u.search&&!u.hash&&!u.username&&!u.password?u.origin:null}catch{return null}}
function safeSource(src){try{const u=new URL(src);return u.protocol==="https:"?u.href:null}catch{return null}}
const cleanId=id=>String(id).replace(/[^a-zA-Z0-9_-]/g,"_").slice(0,80);
function sourceDoc({id,title,text,source_url,source_date,period,publisher,topic,geo}){
 if(!safeSource(source_url)||!text)return null;
 return {id:cleanId(id),title,text,source_url,source_date,period,publisher,topic,geo,access:"pro"};
}
function publicCorpus(){
 const docs=[];
 for(const d of preview.documents||[]){
  const row=sourceDoc({id:d.id,title:d.title+" / "+(d.title_en||d.title),
   text:(d.text_en||d.text).slice(0,1700),source_url:d.source_url,source_date:d.source_date,period:d.period,publisher:d.publisher,topic:d.topic,geo:d.geo});
  if(row)docs.push(row);
 }
 for(const p of provinces.provinces||[]){
  const growth=(p.growth_real_2025_pct??"not available");
  const capital=(p.pmtb_share_2025_pct??"not available");
  const consumers=(p.household_share_2025_pct??"not available");
  const gini=(p.gini_expenditure_2026_03??"not available");
  const context="Preliminary 2025 expenditure GRDP for "+p.name+" ("+p.name_en+"): nominal "+p.grdp_current_2025_bn+
   " IDR billion; real GRDP growth "+growth+"% YoY; household consumption share "+consumers+
   "%; PMTB/GFCF share "+capital+"%. PMTB/GFCF is a national accounts measure, NOT realized BKPM project investment. Rates and levels belong to different denominators.";
  const grdp=sourceDoc({id:"province_grdp_"+p.name_en,title:p.name+" / "+p.name_en+" · Regional GRDP 2025",
   text:context,source_url:provinces.sources.grdp.url,source_date:provinces.sources.grdp.released,
   period:"2025 preliminary",publisher:"BPS",topic:"regional economy investment growth",geo:p.name_en});
  if(grdp)docs.push(grdp);
  const unequal=sourceDoc({id:"province_gini_"+p.name_en,title:p.name+" / "+p.name_en+" · Expenditure Gini March 2026",
   text:"Expenditure Gini for "+p.name+" ("+p.name_en+") in March 2026 was "+gini+
    " on scale 0–1. This is expenditure inequality, not income inequality and not a causal index of investment performance. Indonesia national expenditure Gini was 0.368 in March 2026; province and national numbers cannot be averaged.",
   source_url:provinces.sources.gini.url,source_date:provinces.sources.gini.last_updated,
   period:"2026-03",publisher:"BPS",topic:"regional inequality gini",geo:p.name_en});
  if(unequal)docs.push(unequal);
  for(const item of p.project_examples||[]){
   const project=sourceDoc({id:"province_project_"+p.name_en+"_"+item.id,
    title:item.title+" · "+p.name,text:"Public SLI project-tracker observation: "+item.title+
     "; area "+p.name+"; reported sector "+item.sector+"; stage "+item.stage+"; milestone date "+item.evidence_date+
     "; description of reported scale "+(item.investment_basis||"not validated")+
     ". Announced/planned/in construction is NOT evidence of completed capex or operational capacity.",
    source_url:item.source_url,source_date:item.evidence_date,period:item.evidence_date,publisher:item.entity||"Original project announcement",
    topic:item.sector+" project investment",geo:p.name_en});
   if(project)docs.push(project);
  }
 }
 return docs;
}
const DATA=publicCorpus();
async function sha256(token){return new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)))}
async function equalToken(a,b){
 if(typeof a!=="string"||typeof b!=="string"||a.length<48||a.length>256||b.length<48||b.length>256)return false;
 const x=await sha256(a),y=await sha256(b);let diff=0;
 for(let i=0;i<x.length;i++)diff|=x[i]^y[i];
 return diff===0;
}
async function readBody(req,limit=22000){
 const reader=req.body?.getReader();if(!reader)return "";
 const chunks=[];let length=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;
  length+=value.byteLength;if(length>limit)throw Error("too_large");chunks.push(value)}}
 finally{try{await reader.cancel()}catch{}try{reader.releaseLock()}catch{}}
 const all=new Uint8Array(length);let index=0;for(const c of chunks){all.set(c,index);index+=c.byteLength}
 return new TextDecoder("utf-8",{fatal:true}).decode(all)
}
export default{
 async fetch(req,env){
  const origin=validOrigin(env?.WEB_ORIGIN),incoming=req.headers.get("origin");
  if(!origin||origin!==incoming)return send(403,{error:"origin_denied"});
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{...HEADERS,"access-control-allow-origin":origin,"access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"content-type, x-sli-owner-test-token","access-control-max-age":"300"}});
  const path=new URL(req.url).pathname;
  if(path!=="/v1/owner-research"||req.method!=="POST")return send(404,{error:"not_found"},origin);
  if(env.STAGING_ONLY!=="true"||!env.OPENAI_API_KEY||!env.RESEARCH_MODEL||!env.OWNER_TEST_TOKEN||!env.AI_LIMITER)return send(503,{error:"staging_unavailable"},origin);
  if(!(await equalToken(req.headers.get("x-sli-owner-test-token"),env.OWNER_TEST_TOKEN)))return send(401,{error:"owner_authentication_required"},origin);
  if(!/^application\/json(?:;|$)/i.test(req.headers.get("content-type")||""))return send(415,{error:"json_required"},origin);
  let body;try{body=JSON.parse(await readBody(req))}catch{return send(400,{error:"malformed_or_large_request"},origin)}
  const payload=validateAssistantPayload(body);
  if(!payload)return send(422,{error:"invalid_research_instruction"},origin);
  let rate;try{rate=await env.AI_LIMITER.limit({key:(await sha256(env.OWNER_TEST_TOKEN)).slice(0,16).join("-")})}catch{return send(503,{error:"rate_limiter_not_ready"},origin)}
  if(!rate?.success)return send(429,{error:"owner_test_rate_limit"},origin);
  const evidence=selectResearchEvidence(DATA,payload.question,payload.history,"pro",10);
  if(!evidence.length)return send(200,{mode:"generative_rag",answer:payload.language==="id"?
    "Belum cukup bukti sesuai pertanyaan ini dalam corpus uji terbatas SLI. Tidak ada analisis generatif yang dibuat karena sumbernya tidak memadai.":
    "The limited SLI test corpus has insufficient matching evidence. No unsupported report was generated.",
    sources:[],evidence_status:"insufficient",research_format:payload.mode},origin);
  const params=modelRequest(payload,evidence,env.RESEARCH_MODEL);
  params.max_output_tokens=Math.min(params.max_output_tokens,Number(env.OWNER_MAX_OUTPUT_TOKENS)||1800);
  let answer;
  try{
   const res=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"authorization":"Bearer "+env.OPENAI_API_KEY,"content-type":"application/json"},body:JSON.stringify(params)});
   if(!res.ok)return send(502,{error:"model_request_failed"},origin);
   const json=await res.json();
   if(json.status!=="completed")return send(502,{error:"model_response_incomplete"},origin);
   answer=extractModelText(json);
  }catch{return send(502,{error:"model_unreachable"},origin)}
  if(!verifyResearchAnswer(answer,evidence))return send(502,{error:"invalid_or_missing_source_citations"},origin);
  return send(200,{mode:"generative_rag",research_format:payload.mode,answer,
   evidence_status:"owner_staging_verify_sources",
   sources:evidence.map(({id,title,source_url,period,source_date,publisher,geo},i)=>({index:i+1,id,title,source_url,period,source_date,publisher,geo}))},origin);
 }
};
