/* SLI independent evidence-gated scoring. No default scores or invented thresholds. */
export function indicatorScore(i){
 const m=i?.measurement,t=i?.risk_thresholds;
 if(!m||!Number.isFinite(m.value))return {status:'N/A',reason:'Missing observation'};
 if(!m.source_url||!/^https:\/\//.test(m.source_url)||!m.period)return {status:'N/A',reason:'Untraceable observation'};
 if(!['increasing','decreasing'].includes(i.risk_direction))return {status:'N/A',reason:'Risk direction not approved'};
 if(!t||!Number.isFinite(t.safe)||!Number.isFinite(t.critical)||t.safe===t.critical)return {status:'N/A',reason:'Approved thresholds missing'};
 if(!Number.isFinite(i.weight)||i.weight<=0)return {status:'N/A',reason:'Indicator weight not approved'};
 if(!['verified_primary','validated_secondary'].includes(m.validation_status))return {status:'N/A',reason:'Primary/secondary source validation pending'};
 if((i.risk_direction==='increasing'&&t.critical<t.safe)||(i.risk_direction==='decreasing'&&t.critical>t.safe))return {status:'N/A',reason:'Threshold orientation contradicts direction'};
 const score=100*Math.min(1,Math.max(0,(m.value-t.safe)/(t.critical-t.safe)));
 return {status:'scored',score,weight:i.weight,source:m.source_url,period:m.period};
}
export function assessDomain(indicators,{minCoverage=.7}={}){
 if(!Array.isArray(indicators)||indicators.length===0)return {status:'N/A',reason:'No indicators',coverage:0,scored:0,total:0};
 const required=indicators.filter(i=>i.required!==false);
 if(!required.length)return {status:'N/A',reason:'No required indicators',coverage:0,scored:0,total:indicators.length};
 const results=required.map(i=>({indicator:i,result:indicatorScore(i)}));
 const complete=results.filter(x=>x.result.status==='scored');
 const coverage=complete.length/required.length;
 const missingCore=results.some(x=>x.indicator.core===true&&x.result.status!=='scored');
 if(coverage<minCoverage||missingCore)return {status:'N/A',reason:missingCore?'Core indicator unscored':'Insufficient validated indicator coverage',coverage,scored:complete.length,total:required.length};
 const denom=complete.reduce((a,x)=>a+x.result.weight,0);
 return {status:'scored',score:complete.reduce((a,x)=>a+x.result.score*x.result.weight,0)/denom,coverage,scored:complete.length,total:required.length};
}
