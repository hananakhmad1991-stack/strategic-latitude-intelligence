import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {METHODS,getMethod,parseCsv,describe,correlation,ols,ahp,stockFlow,evaluate} from "../js/sli-analytical-core.mjs";
import {validateAssistantPayload,modelRequest} from "../research-api/src/assistant-core.mjs";
test("Curated methodology catalog reports executable vs design-only estimators",()=>{
 assert.ok(METHODS.length>=40);assert.equal(new Set(METHODS.map(m=>m.id)).size,METHODS.length);
 assert.equal(getMethod("did")?.status,"design");assert.equal(getMethod("ols")?.status,"local");
 assert.throws(()=>evaluate({method:"did",rows:[]}),/not executable/);
});
test("Quoted CSV, missingness and descriptive summaries are computed reproducibly",()=>{
 const rows=parseCsv('province,value,cost\n"Jawa, Tengah",10,1\n"Jawa Barat",20,3\n"Papua",30,5\n');
 assert.equal(rows[0].province,"Jawa, Tengah");
 const summaries=describe(rows);
 assert.equal(summaries.find(x=>x.column==="value").mean,20);
 assert.equal(summaries.find(x=>x.column==="cost").median,3);
 assert.throws(()=>parseCsv('x\n"bad'),/Unclosed/);
});
test("Pearson and OLS coefficients are numeric and do not claim causation",()=>{
 const rows=[{x:1,y:3},{x:2,y:5},{x:3,y:7},{x:4,y:9}];
 assert.equal(correlation(rows,"x","y").r,1);
 const r=ols(rows,"x","y");assert.equal(r.slope,2);assert.equal(r.intercept,1);assert.equal(r.r_squared,1);
 assert.throws(()=>ols([{x:1,y:3},{x:1,y:6},{x:1,y:5}],"x","y"),/no variation/);
});
test("AHP checks Saaty consistency and reciprocal judgments",()=>{
 const r=ahp({criteria:["Grid","Cost","Labor"],pairwise:[[1,3,5],[1/3,1,2],[1/5,1/2,1]]});
 assert.equal(r.acceptable,true);assert.ok(r.criteria[0].weight>r.criteria[1].weight);
 assert.throws(()=>ahp({criteria:["Grid","Cost"],pairwise:[[1,8],[8,1]]}),/reciprocal/);
});
test("Discrete stock flow stays nonnegative and is explicitly not a calibrated forecast",()=>{
 const r=stockFlow({initial_stock:100,inflow_per_period:10,outflow_rate:0.1,periods:5});
 assert.equal(r.final_stock,100);assert.equal(r.trajectory.length,6);
 assert.throws(()=>stockFlow({initial_stock:100,inflow_per_period:1,outflow_rate:1.5,periods:5}),/requires/);
});
test("Private worker accepts opt-in summarized data and rejects unconsented upload",()=>{
 const base={question:"Compare provincial investment evidence using descriptive statistics",mode:"deep_research",language:"en",history:[],methodology:"ols"};
 const user_analysis={origin:"user_uploaded_unverified",file_name:"test.csv",rows:4,columns:[{column:"investment",n:4,missing:0,mean:4,median:4,sd:1,min:2,max:6}],computed:{method:"ols",n:4,slope:2},consent:true};
 const p=validateAssistantPayload({...base,user_analysis});assert.ok(p);
 const req=modelRequest(p,[{id:"abc",title:"Indonesia GDP",geo:"Indonesia",period:"2025",source_date:"2026-01-01",publisher:"BPS",text:"GDP values",source_url:"https://www.bps.go.id"}],"sample-model");
 const input=req.input[0].content[0].text;
 assert.match(input,/user_uploaded_analysis/);assert.match(req.instructions,/NEVER infer/);
 assert.equal(validateAssistantPayload({...base,user_analysis:{...user_analysis,consent:false}}),null);
 assert.equal(validateAssistantPayload({...base,methodology:"invented_method"}),null);
});

test("Workbench usability: navy-shell styles cannot white-out light statistical tables",()=>{
 const css=readFileSync(new URL("../css/sli-analytical-workbench.css",import.meta.url),"utf8");
 const js=readFileSync(new URL("../js/sli-analytical-workbench-ui.mjs",import.meta.url),"utf8");
 const html=readFileSync(new URL("../sli-research-ai.html",import.meta.url),"utf8");
 assert.match(css,/body\.sli-research-brand #raAnalyticalWorkbench \.ra-wb-output th/);
 assert.match(css,/\.ra-wb-output td\{/);
 assert.match(css,/color:#173a55!important/);
 assert.match(css,/#raAnalyticalWorkbench \.ra-wb-variables\[hidden\]\{display:none!important\}/);
 assert.match(js,/id\?"Interpretasi untuk investor"/);
 assert.match(js,/Lanjut: jalankan regresi PMTB/);
 assert.match(js,/method\.value="ols";desc\(\)/);
 assert.match(html,/sli-analytical-workbench\.css\?v=20261018-econometrics\d+/);
 assert.match(html,/sli-analytical-workbench-ui\.mjs\?v=20261018-econometrics\d+/);
});

test("New local econometrics are catalogued and connected to truthful UI plus research report",()=>{
 const html=readFileSync(new URL("../sli-research-ai.html",import.meta.url),"utf8");
 const src=readFileSync(new URL("../js/sli-analytical-workbench-ui.mjs",import.meta.url),"utf8");
 const report=readFileSync(new URL("../js/sli-econometrics-report.mjs",import.meta.url),"utf8");
 assert.equal(getMethod("multivariate_ols")?.status,"local");
 assert.equal(getMethod("panel_fe")?.status,"local");
 assert.equal(getMethod("did")?.status,"design");
 assert.match(src,/renderEconometricResult\(output,robustness\)/);
 assert.match(src,/panelFixedEffects\(data,xs,y\.value/);
 assert.match(src,/scatterPlot\(fit,sensitivity\?\.reduced/);
 assert.match(src,/downloadMarkdown\(investorMarkdown/);
 assert.match(report,/Cook D/);
 assert.match(html,/sli-analytical-workbench-ui\.mjs/);
});
