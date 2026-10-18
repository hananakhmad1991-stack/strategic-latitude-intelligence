import {test} from "node:test";
import assert from "node:assert/strict";
import {multivariateOLS,panelFixedEffects,studentP,studentCritical,sensitivityOLS} from "../js/sli-econometrics.mjs";
test("Student's t tail probabilities and 95% critical values are numerically correct",()=>{
 assert.ok(Math.abs(studentCritical(10)-2.22813885)<0.001);
 assert.ok(Math.abs(studentCritical(1000)-1.96233908)<0.001);
 assert.ok(Math.abs(studentP(0,10)-1)<1e-8);
 assert.ok(Math.abs(studentP(2.22813885,10)-0.05)<1e-4);
});
test("Multivariable QR OLS recovers intercept and two slopes with uncertainty columns",()=>{
 const rows=[];
 for(let i=0;i<90;i++){
  const x=i/10+1,z=(i*7%31)/5;
  rows.push({province:"R"+i,x,z,y:5+1.7*x-0.8*z+Math.sin(i*1.8)*0.25});
 }
 const fit=multivariateOLS(rows,["x","z"],"y");
 assert.equal(fit.n,90);
 assert.ok(Math.abs(fit.coefficient_terms[0].estimate-5)<0.1);
 assert.ok(Math.abs(fit.coefficient_terms[1].estimate-1.7)<0.02);
 assert.ok(Math.abs(fit.coefficient_terms[2].estimate+0.8)<0.02);
 assert.ok(fit.coefficient_terms.every(c=>Number.isFinite(c.std_error_hc1)&&c.ci95_low<c.ci95_high));
 assert.equal(fit.observations.length,90);
 assert.ok(fit.r_squared>0.99);
});
test("Outliers show diagnostics without automatically deleting source rows",()=>{
 const rows=Array.from({length:38},(_,i)=>({province:"P"+i,pmtb:20+i*.5,growth:3+i*.13+(i===37?19:0)}));
 const fit=multivariateOLS(rows,["pmtb"],"growth");
 assert.equal(fit.observations.length,38);
 assert.ok(fit.residual_diagnostics.flagged.length>=1);
 const changed=sensitivityOLS(rows,"pmtb","growth",-15,15);
 assert.ok(changed.excluded_rows.includes("P37"));
 assert.equal(changed.reduced.n,37);
});
test("Singular predictors rejected; mixed missing values use listwise complete-case observations",()=>{
 const rows=Array.from({length:40},(_,i)=>({a:i,b:i*2,y:2*i+1}));
 assert.throws(()=>multivariateOLS(rows,["a","b"],"y"),/rank-deficient/);
 const ok=rows.map((r,i)=>({...r,b:i%4===0?"":i%3}));
 assert.equal(multivariateOLS(ok,["a","b"],"y").rows_used,30);
});
test("Panel FE recovers within-entity signal, includes clustered uncertainty and can add year FE",()=>{
 const rows=[];
 for(let p=0;p<12;p++)for(let year=2020;year<2026;year++){
  const x=(year-2020)+((p*year)%7)/5+p/9,z=((year+p*2)%7)*0.3;
  const y=12+p*7+1.5*x-0.65*z+1.1*(year-2020)+Math.sin(p*7+year)*0.05;
  rows.push({province:"P"+p,year,x,z,y});
 }
 const r=panelFixedEffects(rows,["x","z"],"y","province","year",true);
 assert.equal(r.unit_count,12);assert.equal(r.time_count,6);assert.equal(r.rows_used,72);
 assert.equal(r.two_way_fe,true);assert.ok(r.coefficients.length===2);
 assert.ok(Math.abs(r.coefficients[0].estimate-1.5)<0.1);
 assert.ok(Math.abs(r.coefficients[1].estimate+0.65)<0.1);
 assert.ok(r.coefficients.every(t=>t.std_error_hc1>=0));
 assert.match(r.se_type,/Cluster-robust/);
});
test("Single-year province cross section and duplicate entity-year data must be rejected",()=>{
 const rows=Array.from({length:38},(_,i)=>({province:"P"+i,year:2025,x:3+i,y:5+i*.1}));
 assert.throws(()=>panelFixedEffects(rows,["x"],"y","province","year"),/3 periods/);
 const panel=[];for(let p=0;p<10;p++)for(let t=2020;t<2025;t++)panel.push({province:"P"+p,year:t,x:t+p,y:t-p});
 panel.push({...panel[0]});
 assert.throws(()=>panelFixedEffects(panel,["x"],"y","province","year"),/Duplicate/);
});
