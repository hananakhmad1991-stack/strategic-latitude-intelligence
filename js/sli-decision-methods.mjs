/* SLI deterministic decision-science estimators.
 * TOPSIS: vector normalization, pre-specified nonnegative weights summing to one,
 * benefit/cost ideal solutions, Euclidean separation and relative closeness.
 * Inputs are user-supplied judgments, NOT observed investment returns.
 */
const finite=v=>typeof v==="number"&&Number.isFinite(v);
const round=v=>Math.round(v*1e9)/1e9;
export function topsis(input){
 const alternatives=input?.alternatives,criteria=input?.criteria,matrix=input?.matrix;
 if(!Array.isArray(alternatives)||alternatives.length<2||alternatives.length>30||
    alternatives.some(x=>typeof x!=="string"||!x.trim()||x.length>80)||
    new Set(alternatives.map(x=>x.trim().toLowerCase())).size!==alternatives.length)
  throw Error("TOPSIS requires 2–30 uniquely named alternatives");
 if(!Array.isArray(criteria)||criteria.length<2||criteria.length>10||
    criteria.some(c=>!c||typeof c.name!=="string"||!c.name.trim()||c.name.length>65||
      !finite(c.weight)||c.weight<=0||!["benefit","cost"].includes(c.type))||
    new Set(criteria.map(c=>c.name.trim().toLowerCase())).size!==criteria.length)
  throw Error("TOPSIS requires 2–10 unique criteria with positive numeric weights and type benefit/cost");
 const sum=criteria.reduce((s,c)=>s+c.weight,0);
 if(Math.abs(sum-1)>1e-6)throw Error("TOPSIS criterion weights must sum to 1 (no silent normalisation)");
 if(!Array.isArray(matrix)||matrix.length!==alternatives.length||
    matrix.some(row=>!Array.isArray(row)||row.length!==criteria.length||row.some(x=>!finite(x))))
  throw Error("TOPSIS matrix must contain finite numeric values for every alternative and criterion; no imputation");
 const norms=criteria.map((_,j)=>Math.hypot(...matrix.map(row=>row[j])));
 if(norms.some(n=>n<=0||!finite(n)))throw Error("TOPSIS requires at least one nonzero observation per criterion");
 const weighted=matrix.map(row=>row.map((x,j)=>x/norms[j]*criteria[j].weight));
 const positive=criteria.map((c,j)=>c.type==="benefit"?Math.max(...weighted.map(row=>row[j])):Math.min(...weighted.map(row=>row[j])));
 const negative=criteria.map((c,j)=>c.type==="benefit"?Math.min(...weighted.map(row=>row[j])):Math.max(...weighted.map(row=>row[j])));
 if(positive.every((v,j)=>Math.abs(v-negative[j])<1e-12))throw Error("TOPSIS alternatives cannot be ranked: no criterion discriminates");
 const ranking=weighted.map((row,i)=>{
  const dPositive=Math.hypot(...row.map((v,j)=>v-positive[j]));
  const dNegative=Math.hypot(...row.map((v,j)=>v-negative[j]));
  const denom=dPositive+dNegative;
  return {name:alternatives[i].trim(),score:round(denom?dNegative/denom:0),distance_positive:round(dPositive),distance_negative:round(dNegative),index:i};
 }).sort((a,b)=>b.score-a.score||a.index-b.index).map((r,i)=>({rank:i+1,name:r.name,score:r.score,distance_positive:r.distance_positive,distance_negative:r.distance_negative}));
 return {method:"topsis",alternatives:alternatives.length,criteria:criteria.map(c=>({name:c.name.trim(),weight:c.weight,type:c.type})),ranking,
  formula:"r_ij=x_ij/sqrt(sum_i x_ij^2); v_ij=w_j*r_ij; C_i=D_i-/(D_i+ + D_i-)",
  limitation:"TOPSIS is a conditional preference ranking, not a forecast, financial return or causal estimate. Validate criterion direction, original measurements and weight sensitivity."};
}
