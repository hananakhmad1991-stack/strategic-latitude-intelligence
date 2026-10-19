/* Conservative owner-stage legal article check: number AND instrument must match evidence.
 * Fails closed. It cannot determine semantic entailment or current legal validity.
 */
const norm=s=>String(s||"").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
export function auditLegalArticleCitations(answer,evidence){
 const sourceList=Array.isArray(evidence)?evidence:[];
 const anchors=sourceList.filter(x=>x?.provision_anchor?.article&&x.provision_anchor?.instrument_ref&&/^https:\/\//.test(x.source_url||""))
  .map(x=>({article:norm(x.provision_anchor.article),law:norm(x.provision_anchor.instrument_ref)}));
 const statement=String(answer||"");
 const matches=[...statement.matchAll(/\b(?:pasal|article)\s+(\d+[A-Za-z]?)(?![\w])/gi)];
 const unsupported=[];
 for(const m of matches){
  const article="pasal "+m[1].toLowerCase();
  // Require an explicit instrument identifier close to the article reference.
  const before=statement.lastIndexOf(".",m.index-1);
  const after=statement.indexOf(".",m.index+m[0].length);
  const clause=norm(statement.slice(Math.max(m.index-110,before+1,0),Math.min(statement.length,after<0?m.index+130:after+1,m.index+130)));
  const valid=anchors.some(x=>x.article===article&&clause.includes(x.law));
  if(!valid)unsupported.push(article+" (instrument reference missing or unsupported)");
 }
 return {pass:unsupported.length===0,unsupported_articles:[...new Set(unsupported)],
   reviewed_article_anchors:anchors.map(x=>x.law+" "+x.article),
   scope:"conservative article plus instrument identity gate; NOT semantic fact-check, consolidated-current-law confirmation or full-document search"};
}
