/* Deterministic, non-causal regional economic calculations.
 * Only use harmonised, same-unit/same-year observations; never generate missing values.
 * References: BLS QCEW Location Quotient; Dunn traditional shift-share.
 */
const positive=(x,label)=>{if(!Number.isFinite(x)||x<=0)throw new RangeError(label+" must be finite and > 0");return x};
const nonnegative=(x,label)=>{if(!Number.isFinite(x)||x<0)throw new RangeError(label+" must be finite and >= 0");return x};
export function locationQuotient({regionalIndustry,regionalTotal,nationalIndustry,nationalTotal}){
 const ri=nonnegative(regionalIndustry,"regionalIndustry"),rt=positive(regionalTotal,"regionalTotal");
 const ni=positive(nationalIndustry,"nationalIndustry"),nt=positive(nationalTotal,"nationalTotal");
 if(ri>rt||ni>nt)throw new RangeError("industry cannot exceed corresponding total");
 if(rt>nt||ri>ni)throw new RangeError("region cannot exceed its corresponding national aggregate");
 const regionalShare=ri/rt,nationalShare=ni/nt,value=regionalShare/nationalShare;
 return {method:"lq",value,regionalShare,nationalShare,interpretation:value>1?"above_national_concentration":value<1?"below_national_concentration":"equal_concentration",causal:false};
}
export function shiftShare({regionalIndustryBase,regionalIndustryEnd,nationalIndustryBase,nationalIndustryEnd,nationalTotalBase,nationalTotalEnd}){
 const rb=positive(regionalIndustryBase,"regionalIndustryBase"),re=nonnegative(regionalIndustryEnd,"regionalIndustryEnd");
 const nib=positive(nationalIndustryBase,"nationalIndustryBase"),nie=nonnegative(nationalIndustryEnd,"nationalIndustryEnd");
 const ntb=positive(nationalTotalBase,"nationalTotalBase"),nte=nonnegative(nationalTotalEnd,"nationalTotalEnd");
 if(rb>nib||re>nie||nib>ntb||nie>nte)throw new RangeError("regional/industry totals must be nested consistently");
 const nationalGrowth=nte/ntb-1,industryGrowth=nie/nib-1,regionalGrowth=re/rb-1;
 const nationalEffect=rb*nationalGrowth,industryMixEffect=rb*(industryGrowth-nationalGrowth),regionalCompetitiveEffect=rb*(regionalGrowth-industryGrowth);
 const observedChange=re-rb,explainedChange=nationalEffect+industryMixEffect+regionalCompetitiveEffect;
 if(Math.abs(observedChange-explainedChange)>1e-9*Math.max(1,Math.abs(observedChange)))throw new Error("shift-share reconciliation failed");
 return {method:"shift_share",nationalEffect,industryMixEffect,regionalCompetitiveEffect,observedChange,explainedChange,nationalGrowth,industryGrowth,regionalGrowth,causal:false};
}
