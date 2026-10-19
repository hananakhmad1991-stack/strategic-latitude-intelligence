/* Reject article-level claims not grounded in an expressly audited provision.
 * This deterministic gate is deliberately conservative, not a semantic proof of truth.
 */
const norm=s=>String(s||"").normalize("NFKD").toLowerCase().replace(/\s+/g," ").trim();
export function auditLegalArticleCitations(answer,evidence){
 const sources=Array.isArray(evidence)?evidence:[];
 const anchorRefs=new Set(sources.filter(x=>x?.provision_anchor?.article&&/^https:\/\//.test(x.source_url||""))
  .map(x=>norm(x.provision_anchor.article)));
 const mentioned=[...new Set(Array.from(String(answer||"").matchAll(/\b(?:pasal|article)\s+(\d+[A-Za-z]?)(?![\w])/gi),m=>"pasal "+m[1].toLowerCase()))];
 const unsupported=mentioned.filter(x=>!anchorRefs.has(norm(x)));
 return {
  pass:unsupported.length===0,
  unsupported_articles:unsupported,
  reviewed_article_anchors:[...anchorRefs],
  scope:"number-level conservative legal provision gate; no claim entailment, legal currency or complete statute verification"
 };
}
