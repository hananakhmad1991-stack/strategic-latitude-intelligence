import test from "node:test";
import assert from "node:assert/strict";
import {geminiSecondOpinion} from "../research-api/src/gemini-second-opinion.mjs";
const base={env:{SLI_GEMINI_REVIEW_ENABLED:"true",GEMINI_API_KEY:"test-key"},consent:true,hasPrivateInputs:false,answer:"A sourced answer [1].",evidence:[{title:"Public source",text:"A sourced answer."}]};
test("consent and environment must explicitly enable review",async()=>{
 assert.equal((await geminiSecondOpinion({...base,consent:false})).status,"not_requested");
 assert.equal((await geminiSecondOpinion({...base,hasPrivateInputs:true})).status,"skipped_private_inputs");
 assert.equal((await geminiSecondOpinion({...base,env:{}})).status,"disabled");
});
test("200 response yields advisory review without exposing raw model response",async()=>{
 let called=false;
 const r=await geminiSecondOpinion({...base,fetcher:async(url,init)=>{
  called=true;assert.match(url,/generativelanguage.googleapis.com/);
  assert.equal(init.headers["x-goog-api-key"],"test-key");
  assert.doesNotMatch(init.body,/test-key/);
  return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({status:"possible_conflict",warnings:["Check figure."]})}]}}]})};
 }});
 assert.equal(called,true);assert.equal(r.status,"completed");assert.equal(r.assessment,"possible_conflict");
});
test("quota exhaustion never disrupts primary answer",async()=>{
 const r=await geminiSecondOpinion({...base,fetcher:async()=>({ok:false,status:429})});
 assert.equal(r.status,"quota_exhausted");
});
