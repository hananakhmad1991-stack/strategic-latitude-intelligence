/* SLI academic research: deterministic AHP group questionnaires.
 * No upload transport, no imputation, no silent row dropping.
 * Direct judgements are aggregated as AIJ: geometric mean per comparison.
 */
import {ahp,parseCsv} from "./sli-analytical-core.mjs";
const COL={
 respondent:["respondent","respondent_id","responden","id_responden","panelist","expert"],
 a:["criterion_a","criteria_a","criterion_1","kriteria_a","kriteria_1","kriteria1","factor_a"],
 b:["criterion_b","criteria_b","criterion_2","kriteria_b","kriteria_2","kriteria2","factor_b"],
 value:["value","nilai","score","skor","ratio","perbandingan"]
};
const round=n=>Math.round(n*1e6)/1e6;
function col(row,keys){return Object.keys(row).find(k=>keys.includes(k.trim().toLowerCase().replace(/[\s-]+/g,"_")))}
const guardName=s=>typeof s==="string"&&s.trim().length>0&&s.trim().length<=80&&!/[<>\x00-\x1f]/.test(s);
const neat=v=>String(v??"").trim();
export function isAhpQuestion(question){
 return /\bahp\b|analytic(?:al)? hierarchy|perbandingan berpasangan|pairwise comparison|kuesioner (?:ahp|prioritas)|bobot kriteria/i.test(String(question||""));
}
export function isAhpTable(rows){
 if(!Array.isArray(rows)||!rows.length||typeof rows[0]!=="object")return false;
 return Object.entries(COL).every(([k,names])=>!!col(rows[0],names));
}
export function ahpFromQuestionnaire(input){
 if(!Array.isArray(input)||!input.length||input.length>3000)throw Error("AHP expects 1–3,000 comparison rows");
 if(!isAhpTable(input))throw Error("AHP CSV requires columns: respondent,criterion_a,criterion_b,value (Indonesian aliases supported)");
 const keys=Object.fromEntries(Object.entries(COL).map(([k,aliases])=>[k,col(input[0],aliases)]));
 const byPerson=new Map(),crit=new Set();
 for(const [index,r] of input.entries()){
  const who=neat(r[keys.respondent]),a=neat(r[keys.a]),b=neat(r[keys.b]);
  const x=Number(r[keys.value]);
  if(![who,a,b].every(guardName)||a===b||!Number.isFinite(x)||x<1/9-1e-8||x>9+1e-8)
   throw Error("Invalid or missing AHP respondent, criteria, or Saaty score at row "+(index+2));
  crit.add(a);crit.add(b);
  if(!byPerson.has(who))byPerson.set(who,[]);
  byPerson.get(who).push({a,b,x});
 }
 const criteria=[...crit].sort((a,b)=>a.localeCompare(b));
 if(criteria.length<2||criteria.length>10)throw Error("AHP needs 2–10 criteria; found "+criteria.length);
 if(byPerson.size>200)throw Error("AHP questionnaire exceeds 200 respondents");
 const n=criteria.length,per=n*(n-1)/2;
 const pairKey=(a,b)=>a+"\u0000"+b;
 const respondents=[];
 for(const [id,items] of byPerson){
  const seen=new Set(),m=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:null));
  for(const {a,b,x} of items){
   const i=criteria.indexOf(a),j=criteria.indexOf(b),k=pairKey(criteria[Math.min(i,j)],criteria[Math.max(i,j)]);
   if(seen.has(k))throw Error("Duplicate AHP comparison for "+id+": "+a+" / "+b);
   seen.add(k);m[i][j]=x;m[j][i]=1/x;
  }
  if(seen.size!==per)throw Error("Incomplete AHP questionnaire for "+id+": "+seen.size+"/"+per+" unique comparisons. No values imputed.");
  const r=ahp({criteria,pairwise:m});
  respondents.push({id,consistency_ratio:r.consistency_ratio,acceptable:r.acceptable,weights:r.criteria});
 }
 const mat=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>{
  if(i===j)return 1;
  const ratios=respondents.map((r,idx)=>{
   const list=byPerson.get(r.id);
   const edge=list.find(t=>(t.a===criteria[i]&&t.b===criteria[j])||(t.a===criteria[j]&&t.b===criteria[i]));
   return edge.a===criteria[i]?edge.x:1/edge.x;
  });
  return Math.exp(ratios.reduce((sum,x)=>sum+Math.log(x),0)/ratios.length);
 }));
 const group=ahp({criteria,pairwise:mat});
 const ranking=[...group.criteria].sort((a,b)=>b.weight-a.weight);
 return {method:"ahp_group",engine:"local_deterministic_AIJ_geometric_mean",n_respondents:respondents.length,
  n_criteria:n,n_comparisons:input.length,respondents,criteria,group,ranking,
  inconsistent_respondents:respondents.filter(r=>!r.acceptable).map(r=>r.id),
  source:"USER DATA · UNVERIFIED",limitations:[
   "AHP ranking reflects subjective judgments, not a population estimate or statistical causal effect.",
   "AIJ geometric mean combines complete reciprocal Saaty pairwise judgments; each respondent and group consistency checked independently.",
   "CR >0.10 calls for review of comparisons; group CR can be acceptable even when individual respondents are inconsistent.",
   "Criteria ranking is not an alternatives ranking; scoring project/location alternatives requires separate local priorities for each criterion.",
   "Do not confuse external SLI facts with participant judgments or treat an SLI indicator as a judgment without expert confirmation."
  ]};
}
export function ahpFromJson(raw){
 if(raw&&Array.isArray(raw.criteria)&&Array.isArray(raw.pairwise)){
  const g=ahp(raw);
  return {method:"ahp_group",engine:"local_deterministic_AHP",n_respondents:1,n_criteria:g.criteria.length,n_comparisons:g.criteria.length*(g.criteria.length-1)/2,
   respondents:[{id:"submitted_matrix",consistency_ratio:g.consistency_ratio,acceptable:g.acceptable,weights:g.criteria}],
   criteria:raw.criteria,group:g,ranking:[...g.criteria].sort((a,b)=>b.weight-a.weight),inconsistent_respondents:g.acceptable?[]:["submitted_matrix"],source:"USER DATA · UNVERIFIED",
   limitations:["Matrix represents supplied judgments only; not a causal measure.","CR >0.10 needs expert review.","Criteria weighting alone does not rank alternatives.","SLI contextual data must be separately verified."]};
 }
 if(raw&&Array.isArray(raw.rows)&&isAhpTable(raw.rows))return ahpFromQuestionnaire(raw.rows);
 if(raw&&Array.isArray(raw)&&isAhpTable(raw))return ahpFromQuestionnaire(raw);
 throw Error("AHP JSON needs {criteria,pairwise} or row comparisons including respondent,criterion_a,criterion_b,value");
}
export function analyseAhpText(text,name){
 if(typeof text!=="string"||text.length>600000)throw Error("AHP file must be UTF-8 text below 600 KB");
 if(/\.csv$/i.test(name))return ahpFromQuestionnaire(parseCsv(text));
 if(/\.json$/i.test(name))return ahpFromJson(JSON.parse(text));
 throw Error("Local AHP execution accepts CSV or JSON. PDF/images/Excel require a separately activated document extraction pipeline.");
}
export function ahpResultMarkdown(r,lang="id"){
 const english=lang==="en";
 const lines=english?
  ["## AHP questionnaire — completed local calculation","**Provenance:** Unverified user questionnaire processed in your browser. No file transferred to AI servers."]:
  ["## Hasil pengolahan kuesioner AHP","**Asal data:** Kuesioner pengguna belum diverifikasi; dihitung di browser. File tidak dikirim ke server AI."];
 lines.push((english?"**Method:** ":"**Metode:** ")+r.engine+" · "+r.n_respondents+" "+(english?"respondents":"responden")+" · "+r.n_criteria+" "+(english?"criteria":"kriteria"));
 lines.push((english?"**Group consistency ratio (CR):** ":"**Rasio konsistensi kelompok (CR):** ")+(r.group.consistency_ratio===null?"N/A (2 criteria)":r.group.consistency_ratio.toFixed(4))+" — "+(r.group.acceptable?"≤0.10":" >0.10, REVIEW NEEDED"));
 lines.push("| "+(english?"Rank":"Peringkat")+" | "+(english?"Criterion":"Kriteria")+" | "+(english?"Weight":"Bobot")+" |\n|---:|---|---:|");
 for(const [idx,p] of r.ranking.entries())lines.push("| "+(idx+1)+" | "+p.name.replace(/[|]/g,"/")+" | "+p.weight.toFixed(4)+" |");
 lines.push((english?"**Inconsistent respondents (CR >0.10):** ":"**Responden yang perlu pemeriksaan ulang (CR >0,10):** ")+(r.inconsistent_respondents.join(", ")||(english?"None detected":"Tidak terdeteksi")));
 lines.push(english?"**Interpretation:** These weights indicate relative criterion priority within the supplied judgments, not an objectively proven investment or research impact.":"**Interpretasi:** Bobot menunjukkan prioritas relatif menurut penilaian responden, bukan bukti objektif dampak investasi atau hubungan sebab-akibat.");
 for(const warning of r.limitations)lines.push("- "+warning);
 return lines.join("\n\n");
}
