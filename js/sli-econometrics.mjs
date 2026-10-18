/* Deterministic investor research estimators. Executable only on uploaded rows.
 * No causal claims, no automatic source verification; all inference conditional on model assumptions.
 */
const nval=v=>v===null||v===undefined||String(v).trim()===""?null:Number(v);
const finite=Number.isFinite;
const rnd=v=>finite(v)?Math.round(v*1e6)/1e6:null;
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const sum=v=>v.reduce((a,b)=>a+b,0);
const mean=v=>sum(v)/v.length;
const lngamma=z=>{
 const p=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];
 if(z<0.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-lngamma(1-z);
 z-=1;let x=p[0];for(let i=1;i<9;i++)x+=p[i]/(z+i);
 const t=z+7.5;return Math.log(2*Math.PI)/2+(z+0.5)*Math.log(t)-t+Math.log(x);
};
function betacf(a,b,x){
 const FPMIN=1e-300,EPS=3e-13;
 let c=1,d=1-(a+b)*x/(a+1-b+1); // overwritten with canonical continued-fraction first denominator
 d=1-(a+b)*x/(a+1);if(Math.abs(d)<FPMIN)d=FPMIN;
 d=1/d;let h=d;
 for(let m=1;m<=240;m++){
  const m2=2*m;
  let aa=m*(b-m)*x/((a+m2-1)*(a+m2));
  d=1+aa*d;if(Math.abs(d)<FPMIN)d=FPMIN;c=1+aa/c;if(Math.abs(c)<FPMIN)c=FPMIN;d=1/d;h*=d*c;
  aa=-(a+m)*(a+b+m)*x/((a+m2)*(a+m2+1));
  d=1+aa*d;if(Math.abs(d)<FPMIN)d=FPMIN;c=1+aa/c;if(Math.abs(c)<FPMIN)c=FPMIN;d=1/d;
  const delta=d*c;h*=delta;if(Math.abs(delta-1)<EPS)break;
 }
 return h;
}
function betai(a,b,x){
 if(x<=0)return 0;if(x>=1)return 1;
 const bt=Math.exp(lngamma(a+b)-lngamma(a)-lngamma(b)+a*Math.log(x)+b*Math.log1p(-x));
 return x<(a+1)/(a+b+2)?bt*betacf(a,b,x)/a:1-bt*betacf(b,a,1-x)/b;
}
export function studentP(t,df){
 if(!finite(t)||!finite(df)||df<=0)throw Error("Invalid t statistic or degrees of freedom");
 return Math.max(0,Math.min(1,betai(df/2,0.5,df/(df+t*t))));
}
export function studentCritical(df,alpha=.05){
 if(!finite(df)||df<1||!(alpha>0&&alpha<1))throw Error("Invalid confidence interval degrees of freedom");
 let lo=0,hi=20;
 for(let i=0;i<80;i++){const m=(lo+hi)/2;if(studentP(m,df)>alpha)lo=m;else hi=m}
 return (lo+hi)/2;
}
const matrix=(rows,headers)=>rows.map(r=>headers.map(h=>nval(r[h])));
const trn=m=>m[0].map((_,i)=>m.map(row=>row[i]));
function regression(y,X,{names,intercept=true,clusters=null,lostDf=0}={}){
 const n=y.length,k=X[0]?.length||0;
 if(!n||!k||n<=k+lostDf+4||k>80)throw Error("Insufficient degrees of freedom for this regression design");
 if(X.some(r=>r.length!==k||r.some(v=>!finite(v)))||y.some(v=>!finite(v)))throw Error("Numeric finite values required");
 const means=Array(k).fill(0),scales=Array(k).fill(1),cols=[];
 for(let j=0;j<k;j++){
  const a=X.map(r=>r[j]);means[j]=intercept?mean(a):0;
  const ss=sum(a.map(v=>(v-means[j])**2));
  scales[j]=Math.sqrt(ss/n);
  if(!(scales[j]>1e-12))throw Error("Model matrix is rank-deficient: predictor has no within-sample variation");
  cols.push(a.map(v=>(v-means[j])/scales[j]));
 }
 if(intercept)cols.unshift(Array(n).fill(1));
 const m=cols.length,q=[],R=Array.from({length:m},()=>Array(m).fill(0));
 // Twice re-orthogonalized modified Gram-Schmidt QR, with standardized regressors.
 for(let j=0;j<m;j++){
  let v=[...cols[j]],base=Math.sqrt(dot(v,v));
  for(let pass=0;pass<2;pass++)for(let i=0;i<j;i++){
   const b=dot(q[i],v);R[i][j]+=b;v=v.map((z,h)=>z-b*q[i][h]);
  }
  R[j][j]=Math.sqrt(dot(v,v));
  if(R[j][j]<base*1e-9||!finite(R[j][j]))throw Error("Model matrix is rank-deficient: correlated predictors/dummies");
  q.push(v.map(z=>z/R[j][j]));
 }
 function solve(b){const x=Array(m).fill(0);for(let i=m-1;i>=0;i--){x[i]=(b[i]-sum(R[i].slice(i+1).map((v,j)=>v*x[i+j+1])))/R[i][i]}return x}
 const theta=solve(q.map(c=>dot(c,y)));
 const beta=theta.slice(intercept?1:0).map((v,j)=>v/scales[j]);
 const interceptValue=intercept?theta[0]-sum(beta.map((b,j)=>b*means[j])):0;
 const fitted=X.map(row=>interceptValue+dot(row,beta)),residual=y.map((v,i)=>v-fitted[i]);
 const sse=sum(residual.map(v=>v*v)),df=n-m-lostDf;
 if(df<5)throw Error("At least five residual degrees of freedom required");
 const sigma=Math.sqrt(sse/df),tss=sum(y.map(v=>(v-mean(y))**2));
 const qt=q.map(c=>c),leverage=Array.from({length:n},(_,i)=>sum(qt.map(c=>c[i]**2)));
 // (X'X)^-1 X' = R^-1 Q'; keep transformations between standardized/raw units explicit.
 const inverseR=Array.from({length:m},(_,j)=>solve(Array.from({length:m},(_,i)=>Number(i===j))));
 const inv=trn(inverseR);
 const bread=(u)=>inv.map(row=>dot(row,u));
 const gram=Array.from({length:m},()=>Array(m).fill(0));
 if(clusters){
  const grouped=new Map();
  clusters.forEach((g,i)=>{if(!grouped.has(g))grouped.set(g,Array(m).fill(0));const a=grouped.get(g);for(let j=0;j<m;j++)a[j]+=q[j][i]*residual[i]});
  const G=grouped.size;
  if(G<8)throw Error("Cluster-robust panel intervals require at least 8 distinct entities");
  const correction=G/(G-1)*(n-1)/df;
  for(const u of grouped.values())for(let a=0;a<m;a++)for(let b=0;b<m;b++)gram[a][b]+=u[a]*u[b]*correction;
 }else{
  const correction=n/df;for(let i=0;i<n;i++)for(let a=0;a<m;a++)for(let b=0;b<m;b++)gram[a][b]+=q[a][i]*q[b][i]*residual[i]**2*correction;
 }
 const robustCov=Array.from({length:m},(_,a)=>Array.from({length:m},(_,b)=>sum(inv[a].map((v,i)=>sum(inv[b].map((w,j)=>v*gram[i][j]*w))))));
 const stdToRaw=Array.from({length:m},(_,i)=>Array.from({length:m},(_,j)=>{
  if(intercept){
   if(i===0)return j===0?1: -means[j-1]/scales[j-1];
   return j===i?1/scales[i-1]:0;
  }
  return j===i?1/scales[i]:0;
 }));
 const cov=stdToRaw.map(a=>stdToRaw.map(b=>sum(a.map((z,i)=>sum(b.map((w,j)=>z*robustCov[i][j]*w))))));
 const estimates=intercept?[interceptValue,...beta]:beta;
 const ciDf=clusters?new Set(clusters).size-1:df,critical=studentCritical(ciDf);
 const terms=estimates.map((coef,i)=>{
  const se=Math.sqrt(Math.max(0,cov[i][i])),t=se>0?coef/se:null;
  return {name:(intercept?["Intercept",...(names||[])]:names||[])[i]||("parameter_"+i),
   estimate:rnd(coef),std_error_hc1:rnd(se),t_stat:rnd(t),p_value_approx:rnd(t===null?null:studentP(t,ciDf)),
   ci95_low:rnd(coef-critical*se),ci95_high:rnd(coef+critical*se)};
 });
 const cooks=residual.map((e,i)=>sigma>0&&(1-leverage[i])>1e-9?e**2/(m*sigma*sigma)*leverage[i]/(1-leverage[i])**2:null);
 const flagged=cooks.map((cook,i)=>({index:i+1,cook_d:rnd(cook),standardized_residual:rnd(sigma>0?residual[i]/(sigma*Math.sqrt(Math.max(1e-9,1-leverage[i]))):0),
 leverage:rnd(leverage[i])})).filter(o=>o.cook_d!==null&&(o.cook_d>4/n||Math.abs(o.standardized_residual)>3)).slice(0,30);
 return {n,predictors:k,degrees_freedom:df,coefficient_terms:terms,r_squared:rnd(tss>0?1-sse/tss:null),
 residual_sd:rnd(sigma),rmse:rnd(Math.sqrt(sse/n)),condition_warning:null,
 residual_diagnostics:{leverage_cook_threshold:rnd(4/n),flagged_count:flagged.length,flagged,
  durbin_watson:rnd(sse>0?sum(residual.slice(1).map((e,i)=>(e-residual[i])**2))/sse:null),
  note:"Durbin–Watson depends on meaningful row/time ordering and is not a panel serial-correlation test."},
 fitted:fitted.map(rnd),residual:residual.map(rnd),
 se_type:clusters?"Cluster-robust by entity (CR1, exploratory t intervals df=G-1)":"HC1 heteroskedasticity-robust (t intervals df=n-k)",
 limitations:"Observational model. Standard errors and confidence intervals rely on identification, sample and dependence assumptions; no causal inference or validated forecast."};
}
function cleanRows(rows,predictors,outcome){
 if(!Array.isArray(rows)||!rows.length||rows.length>3000)throw Error("Model supports 1 to 3,000 data rows");
 if(!Array.isArray(predictors)||!predictors.length||predictors.length>5||new Set(predictors).size!==predictors.length||predictors.includes(outcome))throw Error("Select 1 to 5 distinct predictors, different from Y");
 const pairs=rows.map((r,i)=>({index:i,x:predictors.map(key=>nval(r[key])),y:nval(r[outcome]),label:String(r.province||r.region||r.name||r.id||"Row "+(i+1)).slice(0,80)}))
 .filter(r=>finite(r.y)&&r.x.every(finite));
 if(pairs.length<predictors.length+12)throw Error("Not enough complete observations: need predictors plus at least 12 complete rows");
 return pairs;
}
export function multivariateOLS(rows,predictors,outcome){
 const used=cleanRows(rows,predictors,outcome);
 const fit=regression(used.map(d=>d.y),used.map(d=>d.x),{names:predictors});
 return {method:"multivariate_ols",outcome,predictors,rows_used:fit.n,rows_excluded:rows.length-fit.n,
  ...fit,observations:used.map((d,i)=>({name:d.label,source_row:d.index+1,x:d.x,y:d.y,
   fitted:fit.fitted[i],residual:fit.residual[i],
   influential:fit.residual_diagnostics.flagged.some(o=>o.index===i+1)})),
  inference_note:"HC1 robust SE; 95% approximate t intervals. Cross-sectional association, not policy or investment treatment effect."};
}
export function panelFixedEffects(rows,predictors,outcome,entityField,timeField,includeYearFE=false){
 if(typeof entityField!=="string"||typeof timeField!=="string"||entityField===timeField)throw Error("Panel needs different entity and time identifier columns");
 const raw=cleanRows(rows,predictors,outcome);
 const seen=new Set();const pairs=raw.map(o=>({...o,entity:String(rows[o.index][entityField]??"").trim(),time:String(rows[o.index][timeField]??"").trim()}));
 if(pairs.some(d=>!d.entity||!d.time))throw Error("Missing unit/year in complete panel observations");
 for(const d of pairs){const id=JSON.stringify([d.entity,d.time]);if(seen.has(id))throw Error("Duplicate entity-period rows: aggregate or correct repeated observations");seen.add(id)}
 const units=[...new Set(pairs.map(d=>d.entity))],times=[...new Set(pairs.map(d=>d.time))];
 if(units.length<8||times.length<3)throw Error("Panel FE requires at least 8 entities and 3 periods; 38 provinces observed for only one year are NOT a panel");
 const sizes=units.map(id=>pairs.filter(d=>d.entity===id).length);
 if(sizes.some(v=>v<2))throw Error("Each entity needs at least two years for the within estimator");
 if(pairs.length<units.length+times.length+predictors.length+15)throw Error("Panel too short for reliable exploratory FE estimation");
 const group=new Map(units.map(id=>[id,pairs.filter(d=>d.entity===id)]));
 const predictorsWithin=pairs.map(d=>d.x.map((v,j)=>v-mean(group.get(d.entity).map(z=>z.x[j]))));
 const yWithin=pairs.map(d=>d.y-mean(group.get(d.entity).map(z=>z.y)));
 const yearTerms=includeYearFE?times.slice(1):[];
 const X= predictorsWithin.map((row,i)=>[...row,...yearTerms.map(t=>Number(pairs[i].time===t)-mean(group.get(pairs[i].entity).map(z=>Number(z.time===t))))]);
 const names=[...predictors,...yearTerms.map(t=>"time:"+t)];
 const fit=regression(yWithin,X,{names,intercept:false,clusters:pairs.map(d=>d.entity),lostDf:units.length-1});
 return {method:"panel_fe",outcome,predictors,entity_field:entityField,time_field:timeField,
  unit_count:units.length,time_count:times.length,two_way_fe:includeYearFE,rows_used:fit.n,rows_excluded:rows.length-fit.n,
  coefficients:fit.coefficient_terms.filter(v=>predictors.includes(v.name)),
  time_controls:includeYearFE?yearTerms.map(x=>"time:"+x):[],
  within_r_squared:fit.r_squared,degrees_freedom:fit.degrees_freedom,
  residual_sd:fit.residual_sd,rmse:fit.rmse,residual_diagnostics:fit.residual_diagnostics,
  se_type:fit.se_type,
  limitations:"Within-entity fixed effects remove time-invariant entity characteristics only. Time-varying confounding, reverse causation, panel dependence and model validity require independent assessment; no causality or investment multiplier is established."};
}
export function sensitivityOLS(rows,x,y,lower=-15,upper=15){
 const full=multivariateOLS(rows,[x],y);
 const filtered=rows.filter(r=>{const v=nval(r[y]);return !finite(v)||(v>=lower&&v<=upper)});
 const reduced=filtered.length>=15&&filtered.length<rows.length?multivariateOLS(filtered,[x],y):null;
 return {full,reduced,excluded_rows:rows.filter(r=>finite(nval(r[y]))&&(nval(r[y])<lower||nval(r[y])>upper)).map(r=>String(r.province||r.name||"unknown")),
 note:"Sensitivity only. The +/-15 percent growth threshold is illustrative, not a valid automatic rule for excluding economic observations."};
}
