/* One-shot, owner-authenticated BPS evidence acceptance smoke.
 * NEVER prints, stores, uploads or copies the owner test token or model answer.
 * One API call max, no retry and no model calls in --self-test mode.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const welfare=JSON.parse(readFileSync(new URL("../data/sli-bps-welfare-2026.json",import.meta.url),"utf8"));
const water=welfare.provincial_metrics.find(x=>x.id==="piped_drinking_water");
const acehIndex=welfare.provinces.findIndex(x=>x.name==="Aceh");
if(!water||acehIndex<0)throw Error("BPS dataset lacks exact Aceh drinking-water category");
const precision=welfare.sampling_error_2026.metrics.piped_drinking_water;
if(precision.sampling_table!=="9.88"||precision.source_main_table!=="6.23")throw Error("BPS source table crosswalk changed");
const reference={estimate:welfare.provinces[acehIndex].values[water.index],se:precision.standard_error_pp[acehIndex],rse:precision.relative_standard_error_pct[acehIndex],low:precision.confidence_interval_low_pct[acehIndex],high:precision.confidence_interval_high_pct[acehIndex]};
if(Object.values(reference).some(x=>!Number.isFinite(x)))throw Error("BPS primary-value reference missing");
const ORIGIN="https://hananakhmad1991-stack.github.io";
const ENDPOINT="https://sli-research-owner-test.hananakhmad1991.workers.dev/v1/owner-research";
const QUESTION="Menurut BPS Statistik Kesejahteraan Rakyat 2026 (Susenas Maret), berapa persentase rumah tangga Aceh dengan sumber utama air minum leding (Tabel 6.23), dan bagaimana SE, RSE, interval kepercayaan 95% dari tabel sampling error 9.88? Bedakan estimasi survey dan kepastian statistik, sertakan sitasi sumber BPS dan nomor halaman PDF. Jangan mengarang nilai yang tidak tersedia.";

/* Numerical source-citation gate:
 * passing with generic mentions of SE, RSE or table numbers is intentionally impossible.
 * This checks printed values as transcribed into SLI's curated subset; it does not
 * independently certify the underlying BPS PDF or its commercial reuse rights.
 */
function numberToken(value){
 const n=Number(value).toFixed(2);
 const [whole,decimal]=n.split(".");
 return new RegExp("(?<![\\d.,])"+whole+"[,.]"+decimal+"(?![\\d])","g");
}
function labeledValuePresent(answer,value,kind){
 const re=numberToken(value);
 for(const found of answer.matchAll(re)){
  const at=found.index??0;
  const before=answer.slice(Math.max(0,at-80),at);
  const after=answer.slice(at+found[0].length,Math.min(answer.length,at+found[0].length+30));
  if(kind==="rse"&&/(?:^|[^\w])RSE\s*(?:[:=()]|\badalah\b|\bsebesar\b|\bof\b)?[^0-9]{0,25}$/i.test(before))return true;
  if(kind==="se"&&/(?:^|[^\w])(?:SE|standard\s+error|kesalahan\s+baku)\s*(?:[:=()]|\badalah\b|\bsebesar\b|\bof\b)?[^0-9]{0,25}$/i.test(before)&&!/\bRSE[^0-9]*$/i.test(before))return true;
  if(kind==="estimate"&&/(?:air\s+minum|leding|Aceh|perkiraan|estimasi|persentase)[^0-9]{0,65}$/i.test(before))return true;
  if(kind==="rse"&&/\bRSE\b/i.test(after)&&!/\d/.test(after.slice(0,7)))return true;
  if(kind==="se"&&/(?:\bSE\b|\bstandard error\b)/i.test(after)&&!/\d/.test(after.slice(0,7)))return true;
 }
 return false;
}
function intervalPresent(answer,low,high){
 for(const lowMatch of answer.matchAll(numberToken(low))){
  const nearby=answer.slice(Math.max(0,lowMatch.index-95),Math.min(answer.length,lowMatch.index+110));
  if(numberToken(high).test(nearby)&&/(?:CI|IK|interval|kepercayaan|confidence)/i.test(nearby)&&/95\s*%/.test(nearby))return true;
 }
 return false;
}
export function evaluateBpsOwnerReply(status,reply){
 const issues=[];
 if(status!==200)issues.push("unexpected_status_"+status);
 if(reply?.mode!=="generative_rag")issues.push("not_generative_research");
 const answer=String(reply?.answer||"");
 const sources=Array.isArray(reply?.sources)?reply.sources:[];
 const bps=sources.filter(x=>typeof x?.source_url==="string"
  && x.source_url===welfare.source.source_url
  && (/^bps_welfare_province_/.test(String(x.id))||/BPS|Susenas/i.test(String(x.title))));
 const aceh=sources.map((source,i)=>({...source,sourceOrdinal:Number.isInteger(source?.index)&&source.index>0?source.index:i+1})).filter(x=>
  bps.some(b=>b.id===x.id&&b.source_url===x.source_url)
  && /aceh/i.test(String(x.title)+" "+String(x.geo)+" "+String(x.id)));
 if(!bps.length)issues.push("missing_primary_BPS_publication_source");
 if(!aceh.length)issues.push("missing_Aceh_province_source");
 if(!/BPS|Susenas/i.test(answer))issues.push("answer_missing_BPS_attribution");
 if(!/rumah\s+tangga/i.test(answer)||!/(?:air\s+minum|leding)/i.test(answer))issues.push("answer_missing_correct_denominator");
 if(!labeledValuePresent(answer,reference.estimate,"estimate"))issues.push("estimated_drinking_water_value_incorrect_or_unattributed");
 if(!labeledValuePresent(answer,reference.se,"se"))issues.push("SE_numeric_value_incorrect_or_unattributed");
 if(!labeledValuePresent(answer,reference.rse,"rse"))issues.push("RSE_numeric_value_incorrect_or_unattributed");
 if(!intervalPresent(answer,reference.low,reference.high))issues.push("CI95_bounds_incorrect_or_missing");
 if(!/9[.,]88/.test(answer))issues.push("answer_missing_sampling_table_9_88");
 if(!/6[.,]23/.test(answer))issues.push("answer_missing_base_table_6_23");
 if(!/215/.test(answer)||!/434/.test(answer))issues.push("answer_missing_exact_PDF_pages");
 if(!aceh.some(src=>answer.includes("["+src.sourceOrdinal+"]")||answer.includes(src.source_url)))issues.push("missing_citation_to_Aceh_source_index");
 if(!reply?.quality_audit||typeof reply.quality_audit!=="object")issues.push("missing_answer_quality_audit");
 if(/methodology_design_only_no_verified_sli_evidence/.test(String(reply?.evidence_status)))issues.push("model_answer_without_evidence");
 return {pass:issues.length===0,issues,source_count:sources.length,bps_source_count:bps.length,aceh_source_count:aceh.length,answer_length:answer.length,numerical_reference_source:"curated_BPS_Susenas_2026_exact_category_source_tables_6_23_and_9_88"};
}

export async function liveSmoke(env=process.env){
 const token=env.SLI_OWNER_SMOKE_TOKEN;
 if(typeof token!=="string"||token.length<48)throw Error("Missing private SLI_OWNER_SMOKE_TOKEN (48+ characters). No model request made.");
 const url=new URL(env.SLI_OWNER_SMOKE_ENDPOINT||ENDPOINT);
 if(url.origin!==new URL(ENDPOINT).origin||url.pathname!=="/v1/owner-research"||url.protocol!=="https:"||url.search||url.hash||url.username||url.password)throw Error("Unapproved owner endpoint. No model request made.");
 const body={question:QUESTION,mode:"executive_summary",language:"id",history:[],methodology:"auto"};
 const res=await fetch(url,{method:"POST",headers:{"Origin":ORIGIN,"Content-Type":"application/json","x-sli-owner-test-token":token},
   body:JSON.stringify(body),redirect:"error",signal:AbortSignal.timeout(40000)});
 const data=await res.json().catch(()=>({}));
 const result=evaluateBpsOwnerReply(res.status,data);
 console.log(JSON.stringify({test:"BPS Owner Test live reference and uncertainty",...result},null,2));
 if(!result.pass)process.exitCode=1;
 return result;
}
function selfTest(){
 const valid={mode:"generative_rag",answer:
  "Menurut BPS Susenas Maret 2026, rumah tangga di Aceh dengan sumber utama air minum leding diperkirakan 7,49% (Tabel 6.23, PDF halaman 215). "+
  "SE 0,33 poin persentase, RSE 4,38%, dan CI 95% 6,84–8,13% (Tabel 9.88, PDF halaman 434) [1]. Ini estimasi, bukan kepastian populasi.",
  sources:[{index:1,id:"bps_welfare_province_aceh",geo:"Aceh",title:"BPS Susenas 2026 Provinsi Aceh",source_url:welfare.source.source_url}],
  quality_audit:{status:"source_limited"},evidence_status:"owner_staging_source_dated_corpus"};
 assert.equal(evaluateBpsOwnerReply(200,valid).pass,true,"Correct documented values must pass");
 for(const [bad,field] of [
  ["7,49%","7,48%"],["SE 0,33","SE 0,53"],["RSE 4,38","RSE 4,83"],
  ["6,84–8,13","6,84–8,31"],["PDF halaman 434","PDF halaman 443"],["[1]","[2]"],
 ]){
  const failed=evaluateBpsOwnerReply(200,{...valid,answer:valid.answer.replace(bad,field)});
  assert.equal(failed.pass,false,"Must reject modified "+bad+" => "+field);
 }
 assert.equal(evaluateBpsOwnerReply(200,{...valid,sources:[]}).pass,false);
 assert.equal(evaluateBpsOwnerReply(200,{...valid,answer:"BPS data unavailable."}).pass,false);
 assert.equal(evaluateBpsOwnerReply(401,{error:"owner_authentication_required"}).pass,false);
 const english={...valid,answer:valid.answer.replace("7,49%","7.49%").replace("0,33","0.33").replace("4,38","4.38").replace("6,84–8,13","6.84–8.13")};
 assert.equal(evaluateBpsOwnerReply(200,english).pass,true,"Both Indonesian and English decimals must pass");
 console.log("BPS owner numerical and citation validator self-tests PASS (no network/model usage).");
}
if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href){
 if(process.argv.includes("--self-test"))selfTest();
 else liveSmoke().catch(error=>{console.error("Owner BPS smoke failed:",error.message);process.exitCode=1});
}
