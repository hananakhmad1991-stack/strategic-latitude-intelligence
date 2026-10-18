/* Automated report-STRUCTURE audit; NEVER treat passing as fact-checking or verified citations.
 * Evidence markers are validated by index only. An editor must check claim-to-source entailment.
 */
const markers=s=>[...String(s).matchAll(/\[(\d+)\]/g)].map(x=>Number(x[1]));
const headingPattern=/^#{1,4}\s+(.+)$/gm;
const conclusionPattern=/\b(kesimpulan|rekomendasi|simpulan|penutup|langkah berikutnya|langkah penelitian|ringkasan penelitian|rencana penelitian|conclusions?|recommendations?|next steps?|strategic implications?)\b/i;

function reportEnding(text){
 const lines=String(text).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const last=lines.at(-1)||"";
 const danglingHeading=/^#{1,6}\s+/.test(last)||/^\*\*[^*]+\*\*:?\s*$/.test(last);
 const danglingFence=(String(text).match(/^\s*\x60{3}/gm)||[]).length%2!==0;
 const danglingTable=/^\|?\s*:?-{3,}:?\s*\|/.test(last);
 return {looksComplete:!!last&&!danglingHeading&&!danglingFence&&!danglingTable,danglingHeading,danglingFence,danglingTable};
}
export function auditReport(answer,evidence,{expectedGeography=[],minWords=80,requireConclusion=false}={}){
 const value=String(answer||"");
 const citations=markers(value),n=Array.isArray(evidence)?evidence.length:0;
 const words=value.trim().split(/\s+/).filter(Boolean).length;
 const invalidCitations=[...new Set(citations.filter(i=>!Number.isInteger(i)||i<1||i>n))];
 const missingGeographies=expectedGeography.filter(g=>!value.toLowerCase().includes(String(g).toLowerCase()));
 const headings=[...value.matchAll(headingPattern)].map(m=>m[1].trim());
 const sections=headings.length;
 const hasConclusion=headings.some(h=>conclusionPattern.test(h));
 const ending=reportEnding(value);
 const issues=[];
 if(words<minWords)issues.push("too_short");
 if(sections<2)issues.push("too_few_sections");
 if(n>0&&citations.length===0)issues.push("missing_citations");
 if(invalidCitations.length)issues.push("invalid_citation_indices");
 if(missingGeographies.length)issues.push("requested_geography_missing");
 if(requireConclusion&&!hasConclusion)issues.push("conclusion_heading_missing");
 if(!ending.looksComplete)issues.push("possibly_truncated_ending");
 return {pass:issues.length===0,issues,words,sections,citations:citations.length,invalidCitations,missingGeographies,
  hasConclusion,endingLooksComplete:ending.looksComplete,
  review_scope:"structural_only_not_factual_verification",
  limitations:["Citation numbers may be valid even when claims contradict the cited sources.","Does not independently verify figures, units, chronology, geography synonyms, licensing, econometric execution or external news."]};
}
