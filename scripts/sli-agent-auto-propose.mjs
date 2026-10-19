/* Autonomous but review-gated SLI code improvements.
 * Only fixes a reviewed, synthetic method-intent routing mismatch.
 * Never applies to main, changes secrets, trains model weights or deploys.
 * Execute in a temporary GitHub Actions checkout and make a DRAFT PR.
 */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {METHODS,inferMethod} from "../js/sli-analytical-core.mjs";

const ROOT=fileURLToPath(new URL("../",import.meta.url));
const QUEUE="tests/fixtures/sli-reviewed-autonomous-candidates.json";
const BASELINE="tests/fixtures/sli-agent-eval-cases.json";
const ROUTES="js/sli-method-aliases.mjs";
const load=path=>JSON.parse(readFileSync(resolve(ROOT,path),"utf8"));
const failure=message=>{throw Error("SLI auto-proposer guard: "+message)};
const norm=s=>String(s||"").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").replace(/\s+/g," ").trim();

export function validatedCandidates(queue=load(QUEUE),catalog=METHODS){
 if(queue?.schema_version!=="sli-reviewed-autonomous-change-candidates-v1"||
    queue.mode!=="auto_propose_branch_and_pr_not_auto_merge"||
    !Array.isArray(queue.candidates)||queue.candidates.length>15)failure("invalid reviewed proposal queue");
 const ids=new Set(),out=[];
 for(const c of queue.candidates){
  if(!c||c.category!=="method_route"||typeof c.id!=="string"||
    !/^[a-z0-9][a-z0-9-]{4,49}$/.test(c.id)||ids.has(c.id)||
    !Number.isInteger(c.priority)||c.priority<1||c.priority>30||
    typeof c.phrase!=="string"||!/^[\p{L}\p{N} -]{6,60}$/u.test(c.phrase)||
    typeof c.prompt!=="string"||c.prompt.length<15||c.prompt.length>180||
    typeof c.method!=="string"||typeof c.review_note!=="string"||c.review_note.length<20||
    !norm(c.prompt).includes(norm(c.phrase)))failure("invalid or unreviewed candidate shape");
  const matched=catalog.find(m=>m.id===c.method);
  if(!matched||c.expected_status!==matched.status)failure("method or implementation status mismatched for "+c.id);
  ids.add(c.id);out.push(c);
 }
 return out.sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id));
}
export function selectCandidate({queue=load(QUEUE),infer=inferMethod,skipCandidates=[]}={}){
 const cases=load(BASELINE).cases||[];
 const used=new Set(cases.map(c=>norm(c.prompt)));
 const skip=new Set(skipCandidates);
 for(const c of validatedCandidates(queue)){
  if(skip.has(c.id)||used.has(norm(c.prompt)))continue;
  if(infer(c.prompt)===c.method)continue;
  if(infer(c.prompt)!=="auto")continue; // do not override a different explicit methodology
  return c;
 }
 return null;
}
export function planPatch({queue=load(QUEUE),routes=readFileSync(resolve(ROOT,ROUTES),"utf8"),fixture=load(BASELINE),skipCandidates=[]}={}){
 const c=selectCandidate({queue,skipCandidates});
 if(!c)return {status:"no_safe_candidate",changed:false,files:[]};
 const anchor="export const CURATED_METHOD_SYNONYMS=Object.freeze([\n";
 if(!routes.includes(anchor))failure("production alias module changed; manual review required");
 if(routes.includes(JSON.stringify(c.phrase)))failure("duplicate alias; investigate instead of overwriting");
 if(fixture?.schema_version!=="sli-agent-eval-cases-v1"||!Array.isArray(fixture.cases))failure("invalid evaluation benchmark");
 if(fixture.cases.some(x=>x.id==="auto_"+c.id))failure("duplicate regression case");
 // JSON.stringify prevents the proposal queue from injecting executable JS.
 const item=" {phrase:"+JSON.stringify(c.phrase)+",method:"+JSON.stringify(c.method)+"},\n";
 const nextRoutes=routes.replace(anchor,anchor+item);
 const nextFixture={...fixture,cases:[...fixture.cases,{
  id:"auto_"+c.id,category:"method",prompt:c.prompt,expected:c.method,expected_status:c.expected_status
 }]};
 const nextFixtureText=JSON.stringify(nextFixture,null,2)+"\n";
 return {status:"patch_ready",changed:true,candidate_id:c.id,method:c.method,
  baseline_method:inferMethod(c.prompt),expected_status:c.expected_status,review_note:c.review_note,
  files:[ROUTES,BASELINE],output:{routes:nextRoutes,fixture:nextFixtureText},
  guard:"draft PR only; tests and human merge required; no model weight/secret/production modification"};
}
function main(){
 const apply=process.argv.includes("--apply");
 const reportArg=process.argv.find(v=>v.startsWith("--report="));
 const skipCandidates=String(process.env.SLI_AGENT_PROPOSED_IDS||"").split(",").filter(x=>/^[a-z0-9][a-z0-9-]{4,49}$/.test(x));
 const plan=planPatch({skipCandidates});
 if(apply&&plan.changed){
  writeFileSync(resolve(ROOT,ROUTES),plan.output.routes);
  writeFileSync(resolve(ROOT,BASELINE),plan.output.fixture);
 }
 const summary={...plan};
 delete summary.output;
 if(reportArg){
  const location=resolve(process.cwd(),reportArg.slice(9));
  mkdirSync(dirname(location),{recursive:true});
  writeFileSync(location,JSON.stringify(summary,null,2)+"\n");
 }
 process.stdout.write(JSON.stringify(summary)+"\n");
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main()}catch(e){process.stderr.write(String(e.message||e)+"\n");process.exitCode=1}
}
