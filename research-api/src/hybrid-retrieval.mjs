/* SLI hybrid retrieval: optional real embeddings, deterministic fallback.
   Vectors must be computed by a trusted server, never invented from keywords.
*/
const finiteVector=v=>Array.isArray(v)&&v.length>=8&&v.length<=4096&&v.every(Number.isFinite);
export function cosineSimilarity(a,b){
 if(!finiteVector(a)||!finiteVector(b)||a.length!==b.length)return null;
 let dot=0,aa=0,bb=0;
 for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}
 return aa>0&&bb>0?dot/Math.sqrt(aa*bb):null;
}
export function rerankWithEmbeddings(documents,queryVector,embeddedIndex,{limit=12,minimum=0.12}={}){
 if(!finiteVector(queryVector)||!Array.isArray(documents)||!embeddedIndex||typeof embeddedIndex!=="object")return [];
 const out=[];
 for(const d of documents){
  if(!d||typeof d.id!=="string")continue;
  const indexed=embeddedIndex[d.id];
  // Keep an exact ID join, never substitute other provinces' records.
  const score=cosineSimilarity(queryVector,indexed);
  if(score!==null&&score>=minimum)out.push({document:d,score});
 }
 return out.sort((a,b)=>b.score-a.score||a.document.id.localeCompare(b.document.id)).slice(0,Math.max(0,Math.min(40,limit)));
}
export function mergeRankedEvidence(lexical,semantic,max=12){
 const map=new Map();
 for(const d of lexical||[])if(d?.id&&!map.has(d.id))map.set(d.id,d);
 const chosen=[...map.values()];
 for(const hit of semantic||[])if(hit.document?.id&&!map.has(hit.document.id)){
  map.set(hit.document.id,hit.document);chosen.push(hit.document);
 }
 return chosen.slice(0,Math.max(0,Math.min(40,max)));
}
