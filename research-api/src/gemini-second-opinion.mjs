/* Optional Gemini second opinion for owner staging. It never rewrites validated answers.
 * Only runs with explicit per-request consent, Cloudflare flag and a server-held secret.
 * Restrict to public sourced passages; never transmit attachments or user-derived data.
 */
export async function geminiSecondOpinion({env,consent,hasPrivateInputs,answer,evidence,fetcher=fetch}) {
 if(!consent)return {status:"not_requested"};
 if(hasPrivateInputs)return {status:"skipped_private_inputs"};
 if(env.SLI_GEMINI_REVIEW_ENABLED!=="true")return {status:"disabled"};
 if(!env.GEMINI_API_KEY)return {status:"not_configured"};
 const model=String(env.GEMINI_REVIEW_MODEL||"gemini-2.5-flash-lite");
 if(!/^gemini-[a-z0-9.-]{3,60}$/.test(model))return {status:"invalid_model_configuration"};
 // Only bounded public SLI excerpts, no original user prompt or secrets.
 const sources=evidence.slice(0,8).map((d,i)=>({index:i+1,title:String(d.title||"").slice(0,150),excerpt:String(d.text||"").slice(0,700)}));
 const prompt="You are an independent reviewer. Compare the answer against ONLY the supplied excerpts. Reply ONLY with compact JSON: {\"status\":\"no_obvious_conflict|possible_conflict|insufficient_evidence\",\"warnings\":[up to 3 short strings]}. Do not claim independent verification or browse. Avoid restating the answer.\n"+JSON.stringify({answer:String(answer).slice(0,6000),sources});
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
 try{
  const res=await fetcher("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent",{
   method:"POST",headers:{"x-goog-api-key":env.GEMINI_API_KEY,"content-type":"application/json"},
   body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json",temperature:0,maxOutputTokens:400}}),signal:controller.signal
  });
  if(!res.ok)return {status:res.status===429?"quota_exhausted":"provider_unavailable"};
  const json=await res.json();
  const raw=json?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("")||"";
  const parsed=JSON.parse(raw);
  const valid=["no_obvious_conflict","possible_conflict","insufficient_evidence"];
  if(!valid.includes(parsed?.status)||!Array.isArray(parsed.warnings))return {status:"invalid_review"};
  return {status:"completed",assessment:parsed.status,warnings:parsed.warnings.filter(x=>typeof x==="string").slice(0,3).map(x=>x.slice(0,220)),scope:"model_opinion_against_partial_excerpts_not_primary_fact_verification"};
 }catch{return {status:"review_unavailable"}}finally{clearTimeout(timeout)}
}
