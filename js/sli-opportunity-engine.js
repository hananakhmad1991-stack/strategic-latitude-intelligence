/* SLI Provincial Opportunity & Stress Engine.
 * Deterministic, user-weighted screening; never a probability, credit rating or GDP forecast.
 * Inputs: BPS provincial expenditure GRDP 2021–2025 and source-attributed project registry.
 */
(function(root, factory){
  const api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  if(root) root.SLIOpportunityEngine=api;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const FACTORS=['scale','growth','consumption','formation'];
  const PRESETS={
    balanced:{scale:30,growth:25,consumption:20,formation:25},
    market:{scale:35,growth:25,consumption:35,formation:5},
    expansion:{scale:20,growth:30,consumption:5,formation:45}
  };
  function finite(x){return typeof x==='number' && Number.isFinite(x);}
  function last(p,key){const v=p?.[key];return Array.isArray(v)?v[v.length-1]:null;}
  function observations(p){
    const current=last(p,'grdp_current'),constant=last(p,'grdp_constant');
    const previous=p?.grdp_constant?.[p.grdp_constant.length-2];
    const household=last(p,'household_current'),capital=last(p,'pmtb_current');
    return {
      name:p?.name||'Unknown',id:p?.id,
      scale:finite(current)?current/1000:null,
      growth:finite(previous)&&previous>0&&finite(constant)?100*(constant/previous-1):null,
      consumption:finite(current)&&current>0&&finite(household)?100*household/current:null,
      formation:finite(current)&&current>0&&finite(capital)?100*capital/current:null,
      grdp:finite(current)?current:null,
      household:finite(household)?household:null,
      capital:finite(capital)?capital:null,
      constantSeries:Array.isArray(p?.grdp_constant)?p.grdp_constant.slice():[]
    };
  }
  function percentiles(rows,key){
    const sorted=rows.filter(x=>finite(x[key])).map(x=>({id:x.id,value:x[key]})).sort((a,b)=>a.value-b.value);
    const result={};
    for(let i=0;i<sorted.length;){
      let j=i+1;while(j<sorted.length&&Math.abs(sorted[j].value-sorted[i].value)<1e-10)j++;
      const rank=sorted.length===1?50:100*((i+j-1)/2)/(sorted.length-1);
      for(let n=i;n<j;n++)result[sorted[n].id]=rank;
      i=j;
    }
    return result;
  }
  function weightsFor(preset='balanced',custom){
    const w=custom||PRESETS[preset]||PRESETS.balanced;
    const clean={};
    for(const key of FACTORS)clean[key]=finite(Number(w[key]))?Math.max(0,Number(w[key])):0;
    const total=Object.values(clean).reduce((a,b)=>a+b,0);
    return total>0?Object.fromEntries(FACTORS.map(k=>[k,clean[k]/total])):Object.fromEntries(FACTORS.map(k=>[k,0.25]));
  }
  function screen(data,{preset='balanced',weights=null}={}){
    const rows=(data?.provinces||[]).map(observations);
    const pct=Object.fromEntries(FACTORS.map(k=>[k,percentiles(rows,k)]));
    const w=weightsFor(preset,weights);
    return rows.map(row=>{
      const drivers={},missing=[];
      let result=0;
      for(const key of FACTORS){
        if(!w[key])continue;
        const value=pct[key][row.id];
        if(!finite(value)){missing.push(key);continue;}
        drivers[key]=value;
        result+=w[key]*value;
      }
      return {...row,score:missing.length?null:result,missing,drivers};
    }).sort((a,b)=>(b.score??-Infinity)-(a.score??-Infinity)||a.name.localeCompare(b.name));
  }
  function staticShock(row,consumerDropPct=0,capitalDropPct=0){
    const c=Number(consumerDropPct),i=Number(capitalDropPct);
    if(!finite(c)||!finite(i)||c<0||i<0||!finite(row?.grdp)||row.grdp<=0||!finite(row.household)||!finite(row.capital))return null;
    // A partial expenditure-accounting counterfactual, NOT an econometric forecast.
    // Both shocks are changes from reported 2025 expenditure components, everything else held constant.
    return -100*(row.household*(c/100)+row.capital*(i/100))/row.grdp;
  }
  function localProjects(registry,province){
    return (registry?.records||[]).filter(x=>Array.isArray(x.provinces)&&x.provinces.includes(province));
  }
  function profile(row){
    const factors=FACTORS.filter(k=>finite(row.drivers?.[k])).sort((a,b)=>row.drivers[b]-row.drivers[a]);
    return {relativeStrengths:factors.slice(0,2),relativeConstraints:factors.slice(-2).reverse()};
  }
  function format(v,digits=1){return finite(v)?v.toLocaleString('en-US',{maximumFractionDigits:digits}):'N/A';}
  return {FACTORS,PRESETS,observations,weightsFor,percentiles,screen,staticShock,localProjects,profile,format};
});
