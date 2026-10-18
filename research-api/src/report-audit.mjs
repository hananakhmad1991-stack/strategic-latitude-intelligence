/* Lightweight factual-report gate. This is NOT equivalent to expert human review. */
const markers=s=>[...String(s).matchAll(/\[(\d+)\]/g)].map(x=>Number(x[1]));
export function auditReport(answer,evidence,{expectedGeography=[],minWords=80}={}){
 const text=String(answer||"");
 const citations=markers(text),n=Array.isArray(evidence)?evidence.length:0;
 const words=text.trim().split(/\s+/).filter(Boolean).length;
 const invalidCitations=citations.filter(i=>!Number.isInteger(i)||i<1||i>n);
 const missingGeographies=expectedGeography.filter(g=>!text.toLowerCase().includes(String(g).toLowerCase()));
 const sections=(text.match(/^#{1,3}\s+.+/gm)||[]).length;
 return {pass:words>=minWords&&sections>=2&&invalidCitations.length===0&&(n===0||citations.length>0)&&missingGeographies.length===0,
  words,sections,citations:citations.length,invalidCitations,missingGeographies,
  limitations:["Cannot prove factual correctness, citation entailment, statistical validity or prose quality without independent source/model review"]};
}
