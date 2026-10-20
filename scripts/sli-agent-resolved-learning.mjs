/* Source-safe SLI post-resolution learning: permanent regression references, not model-weight training.
 * Auto-discovery only suggests merged fixes for a reviewed lesson PR; never copies issue bodies,
 * accepts external instructions, writes production content or promotes unverified claims.
 */
import {readFileSync,existsSync,mkdirSync,writeFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const ROOT=fileURLToPath(new URL("../",import.meta.url));
const PATH="tests/fixtures/sli-agent-resolved-lessons.json";
const file=path=>readFileSync(resolve(ROOT,path),"utf8");
export const loadLessons=()=>JSON.parse(file(PATH));
const safePath=s=>typeof s==="string"&&/^tests\/qa-[a-z0-9-]+\.mjs$/.test(s);
const safeId=s=>typeof s==="string"&&/^[a-z0-9][a-z0-9-]{5,75}$/.test(s);
export function assessResolvedFixes(registry=loadLessons(),reader=file){
 const issues=[],items=Array.isArray(registry?.lessons)?registry.lessons:[];
 if(registry?.schema!=="sli-agent-resolved-lessons-v1"||!Array.isArray(registry?.lessons))
  issues.push("invalid_resolved_lessons_schema");
 if(!/reviewed PR/i.test(registry?.update_policy||""))
  issues.push("missing_human_review_policy");
 const ids=new Set(),prs=new Set();
 for(const item of items){
  const id=item?.id||"missing_id";
  if(!safeId(id)||ids.has(id))issues.push("invalid_or_duplicate_id:"+id);
  ids.add(id);
  if(!Number.isSafeInteger(item?.pr_number)||item.pr_number<1||
     !/^[0-9a-f]{40}$/i.test(item?.merged_commit||""))
   issues.push("invalid_merged_pr_trace:"+id);
  else prs.add(item.pr_number);
  for(const field of ["area","failure_mode","preventive_rule","test_title"]){
   if(typeof item?.[field]!=="string"||item[field].trim().length<12)
    issues.push("missing_"+field+":"+id);
  }
  if(!safePath(item?.test_file)){issues.push("unsafe_test_path:"+id);continue}
  let source;
  try{source=reader(item.test_file)}catch{issues.push("missing_test_file:"+id);continue}
  // Linking to a test filename alone is insufficient: preserve the named scenario.
  if(!source.includes('test("'+item.test_title+'"') &&
     !source.includes("test('"+item.test_title+"'"))
   issues.push("missing_named_regression:"+id);
 }
 return {schema:"sli-agent-resolved-lesson-audit-v1",total:items.length,
  traced_merged_prs:prs.size,regression_files:[...new Set(items.map(x=>x.test_file).filter(safePath))],
  failures:issues,pass:issues.length===0,
  model_weights_changed:false,original_facts_auto_promoted:false,owner_review_required:true};
}
const FIX_TITLE=/\b(?:fix|fixed|bug|regression|repair|repaired|prevent|correct|corrected|recover|recovery|resolve|resolved|derguba|security)\b/i;
export function discoverMergedFixes(prs,registry=loadLessons(),{now=new Date(),days=7,max=30}={}){
 if(!Array.isArray(prs))throw Error("merged PR input is not an array");
 const known=new Set((registry.lessons||[]).map(x=>x.pr_number));
 const cutoff=now.getTime()-Math.max(1,Math.min(30,Number(days)||7))*86400000;
 const candidates=[],seen=new Set();
 for(const pr of prs){
  const number=Number(pr?.number),mergedAt=pr?.mergedAt||pr?.merged_at;
  const time=Date.parse(mergedAt||"");
  if(!Number.isSafeInteger(number)||number<1||!Number.isFinite(time)||
   time<cutoff||time>now.getTime()+86400000||seen.has(number))continue;
  seen.add(number);
  if(known.has(number)||!FIX_TITLE.test(String(pr.title||"")))continue;
  const url="https://github.com/"+String(pr.url||pr.html_url||"").split("github.com/")[1];
  if(!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/pull\/\d+$/.test(url))continue;
  candidates.push({pr_number:number,pr_url:url,review_status:"candidate_requires_human_review"});
  if(candidates.length>=max)break;
 }
 return {schema:"sli-agent-post-fix-discovery-v1",
  evaluation:"merged-PR-title discovery only; requires reviewed executable regression test",
  scanned:prs.length,already_documented_prs:known.size,
  discovered:candidates.length,candidates,
  no_automatic_memory_promotion:true,no_model_training:true};
}
function main(){
 const mergedArg=process.argv.find(x=>x.startsWith("--merged="));
 const outArg=process.argv.find(x=>x.startsWith("--out="));
 const audit=assessResolvedFixes();
 const result={...audit,discovery_status:"not_scanned"};
 if(mergedArg){
  const path=resolve(process.cwd(),mergedArg.slice(9));
  const discovery=discoverMergedFixes(JSON.parse(readFileSync(path,"utf8")));
  Object.assign(result,{discovery_status:"scanned",discovery});
 }
 if(outArg){
  const target=resolve(process.cwd(),outArg.slice(6));
  mkdirSync(dirname(target),{recursive:true});
  writeFileSync(target,JSON.stringify(result,null,2)+"\n");
 }
 console.log("Retained resolved lessons: "+audit.total+" in "+audit.traced_merged_prs+" merged PRs; valid="+audit.pass+
  "; candidates="+(result.discovery?.discovered??"not_scanned"));
 if(!audit.pass){for(const failure of audit.failures)console.error("LESSON QA:",failure);process.exitCode=1}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
