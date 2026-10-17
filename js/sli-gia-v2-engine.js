/* Transparent, deterministic, hypothetical GIA scenario mathematics.
   A user-defined proxy is NOT an independently measured geopolitical-risk index. */
(function(root){
 "use strict";
 const pct=x=>Number.isFinite(Number(x))?Number(x):NaN;
 const bounded=(x,a,b)=>Number.isFinite(pct(x))&&pct(x)>=a&&pct(x)<=b;
 function score(inputs,weights={macro:.35,meso:.4,micro:.25}){
  const w=Object.values(weights);if(Math.abs(w.reduce((a,b)=>a+b,0)-1)>1e-8)throw Error('Weights must sum to 1');
  for(const k of ['macro','meso','micro'])if(!bounded(inputs[k],0,100))throw Error('Risk driver input outside 0–100');
  return +(Object.keys(weights).reduce((sum,k)=>sum+pct(inputs[k])*weights[k],0)).toFixed(1);
 }
 function scenario(inputs){
  const value=pct(inputs.value),exposure=pct(inputs.exposure),prob=inputs.prob.map(pct),shocks=inputs.shocks.map(pct);
  if(!bounded(value,0,1e12)||!bounded(exposure,0,100)||prob.length!==3||shocks.length!==3||!prob.every(x=>bounded(x,0,100))||!shocks.every(x=>bounded(x,-100,100)))throw Error('Invalid asset value, exposure, probabilities or shocks');
  if(Math.abs(prob.reduce((a,b)=>a+b,0)-100)>.01)throw Error('Bull/Base/Bear probabilities must total 100%');
  // Signed losses (negative denotes upside); USD million if value specified USD million.
  const losses=shocks.map(x=>+(value*exposure/100*x/100).toFixed(4));
  const expected=+(losses.reduce((sum,v,i)=>sum+v*prob[i]/100,0)).toFixed(4);
  const outcomes=losses.map((loss,i)=>({loss,prob:prob[i]/100})).sort((a,b)=>a.loss-b.loss);
  let cumulative=0,q95=outcomes[outcomes.length-1].loss;
  for(const item of outcomes){cumulative+=item.prob;if(cumulative>=.95-1e-9){q95=item.loss;break}}
  return {losses,expected,p95:q95,downside:Math.max(0,q95),value,exposure,prob,shocks,note:'Discrete user-assumed scenario quantile, not statistically calibrated VaR'};
 }
 function actionState(proxy,threshold){
  if(!bounded(proxy,0,100)||!bounded(threshold,1,100))return {alert:false,label:'Unassessed'};
  return {alert:proxy>=threshold,label:proxy>=threshold?'Scenario threshold exceeded':'Below chosen scenario threshold'};
 }
 function keywordMatches(items,tokens){
  const keys=(tokens||[]).map(x=>String(x).toLowerCase()).filter(x=>x.length>2);
  return items.filter(x=>keys.some(k=>(' '+String(x.title||'').toLowerCase()+' ').includes(k)));
 }
 root.SLIGIA={score,scenario,actionState,keywordMatches};
})(typeof window!=='undefined'?window:globalThis);
