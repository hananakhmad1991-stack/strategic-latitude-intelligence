/* Approved method-routing synonyms. Autonomous proposer may add exactly one
 * phrase/method pair on a review branch, never directly to production.
 * Curated phrases are NOT training data or evidence of estimator execution.
 */
export const CURATED_METHOD_SYNONYMS=Object.freeze([
 {phrase:"regresi linear berganda",method:"multivariate_ols"},
 {phrase:"perbedaan dalam perbedaan",method:"did"},
]);
const normalize=s=>String(s||"").normalize("NFKC").toLowerCase()
 .replace(/[^\p{L}\p{N}]+/gu," ").replace(/\s+/g," ").trim();
export function inferCuratedMethod(question){
 const q=" "+normalize(question)+" ";
 for(const {phrase,method} of CURATED_METHOD_SYNONYMS)
  if(q.includes(" "+normalize(phrase)+" "))return method;
 return "auto";
}
