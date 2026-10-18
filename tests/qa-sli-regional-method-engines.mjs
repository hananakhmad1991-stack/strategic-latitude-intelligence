import {test} from "node:test";
import assert from "node:assert/strict";
import {locationQuotient,shiftShare} from "../js/sli-regional-method-engines.mjs";
test("LQ benchmarks BLS share-of-share identity",()=>{
 const v=locationQuotient({regionalIndustry:200,regionalTotal:1000,nationalIndustry:1000,nationalTotal:10000});
 assert.equal(v.value,2);assert.equal(v.regionalShare,0.2);assert.equal(v.nationalShare,0.1);assert.equal(v.causal,false);
});
test("LQ rejects incompatible totals and zero benchmark",()=>{
 assert.throws(()=>locationQuotient({regionalIndustry:200,regionalTotal:100,nationalIndustry:1000,nationalTotal:10000}),RangeError);
 assert.throws(()=>locationQuotient({regionalIndustry:10,regionalTotal:100,nationalIndustry:0,nationalTotal:10000}),RangeError);
 assert.throws(()=>locationQuotient({regionalIndustry:NaN,regionalTotal:100,nationalIndustry:1000,nationalTotal:10000}),RangeError);
});
test("traditional shift-share decomposes observed change exactly",()=>{
 const v=shiftShare({regionalIndustryBase:100,regionalIndustryEnd:125,nationalIndustryBase:1000,nationalIndustryEnd:1200,nationalTotalBase:10000,nationalTotalEnd:11000});
 assert.ok(Math.abs(v.nationalEffect-10)<1e-10);
 assert.ok(Math.abs(v.industryMixEffect-10)<1e-10);
 assert.ok(Math.abs(v.regionalCompetitiveEffect-5)<1e-10);
 assert.ok(Math.abs(v.explainedChange-v.observedChange)<1e-10);
 assert.equal(v.causal,false);
});
test("shift-share rejects zero base, nonfinite or non-nested inputs",()=>{
 const d={regionalIndustryBase:100,regionalIndustryEnd:125,nationalIndustryBase:1000,nationalIndustryEnd:1200,nationalTotalBase:10000,nationalTotalEnd:11000};
 assert.throws(()=>shiftShare({...d,regionalIndustryBase:0}),RangeError);
 assert.throws(()=>shiftShare({...d,regionalIndustryEnd:1250}),RangeError);
 assert.throws(()=>shiftShare({...d,nationalTotalEnd:Infinity}),RangeError);
});
