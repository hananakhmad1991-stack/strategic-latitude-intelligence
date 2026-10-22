/* Owner-only LIVE smoke: credentials come from local environment, never CLI or git.
 * 2 accepted requests total; do not run alongside another owner request within 60s.
 */
const endpoint="https://sli-research-owner-test.hananakhmad1991.workers.dev/v1/owner-expert-discovery";
const token=process.env.SLI_OWNER_TEST_TOKEN;
if(!token||token.length<48){console.error("Missing local SLI_OWNER_TEST_TOKEN (at least 48 chars).");process.exit(2)}
const origin="https://hananakhmad1991-stack.github.io";
async function call(payload,authorized=true){
 const res=await fetch(endpoint,{method:"POST",headers:{"Origin":origin,"content-type":"application/json",...(authorized?{"x-sli-owner-test-token":token}:{})},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
 const data=await res.json().catch(()=>({}));
 return {code:res.status,body:data};
}
try{
 const unauthed=await call({type:"topic",topic:"energy security",consent:true},false);
 if(unauthed.code!==401||unauthed.body.error!=="owner_authentication_required")throw Error("unauthenticated_gate_not_401");
 console.log("PASS: unauthenticated requests rejected (401)");
 const topic=await call({type:"topic",topic:"data center artificial intelligence",consent:true});
 if(topic.code!==200||topic.body.status!=="discovery_only"||!Array.isArray(topic.body.candidates))throw Error("openalex_unavailable_or_disabled: HTTP "+topic.code+" / "+String(topic.body.status||topic.body.error));
 console.log("PASS: OpenAlex candidate response; count="+topic.body.candidates.length);
 const doi=await call({type:"doi",doi:"10.1038/nature12373",consent:true});
 if(doi.code!==200||doi.body.status!=="metadata_found"||!doi.body.title)throw Error("crossref_unavailable_or_disabled: HTTP "+doi.code+" / "+String(doi.body.status||doi.body.error));
 console.log("PASS: Crossref verified DOI metadata retrieved; year="+String(doi.body.year||"unknown"));
 console.log("LIVE OWNER EXPERT DISCOVERY SMOKE PASS. Results are public candidates, NOT vetted or contracted SLI experts.");
}catch(e){console.error("FAIL:",e.message);process.exitCode=1}
