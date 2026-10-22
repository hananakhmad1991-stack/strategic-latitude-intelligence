import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleRequest,validateBrief,allowedTransition,TRANSITIONS} from '../src/index.mjs';
import {validateExpert} from '../src/experts.mjs';

const ORIGIN='https://hananakhmad1991-stack.github.io';
const OWNER='a'.repeat(64);
const valid={
 service:'custom_research',sector:'digital',
 objective:'Investigate investments and energy constraints of Indonesian data center projects',
 expert_criteria:'Independent data centre operations and energy policy expert',
 organization:'Sample client',contact_email:'research@example.org',deliverable:'report',
 timeline:'1-2-weeks',budget:'500-2000'
};
function database(status='new',version=1,hasCandidate=true){
 const statements=[];
 const db={
  statements,
  prepare(sql){
   const statement={sql,args:[],bind(...args){this.args=args;return this},
    async first(){
     if(sql.startsWith('SELECT status,version'))return {status,version};
     if(sql.startsWith('SELECT id FROM request_expert_shortlist'))return hasCandidate?{id:'example-shortlisted-candidate'}:null;
     if(sql.startsWith('SELECT id,status FROM research_requests'))return {id:this.args[0],status};
     if(sql.startsWith('SELECT id FROM consented_experts'))return {id:this.args[0]};
     if(sql.startsWith('SELECT *'))return {id:this.args[0],status,version};
     return null;
    },
    async all(){return {results:[]}},
    async run(){return {meta:{changes:1}}}
   };
   statements.push(statement);return statement;
  },
  async batch(group){
   this.batches=(this.batches||[]).concat([group]);
   return group.map(()=>({meta:{changes:1}}));
  }
 };
 return db;
}
const env=(db=database(),more={})=>({
 CF_EXPERT_DESK_ENABLED:'true',CF_OWNER_USER_HASH:OWNER,
 CF_ALLOWED_ORIGIN:ORIGIN,DB:db,...more
});
const request=(path,method='GET',data=null,origin=ORIGIN)=>new Request('https://private.example'+path,{
 method,headers:origin?{'Origin':origin,...(data!==null?{'Content-Type':'application/json'}:{})}:(data!==null?{'Content-Type':'application/json'}:{}),
 ...(data!==null?{body:JSON.stringify(data)}:{})
});
const owner=async()=>({id:OWNER});
const id='d98b0dd1-3244-49c7-bd9d-d4e6dc4aef32';

test('Disabled by default, missing Access or wrong owner fail closed',async()=>{
 const db=database();
 const off=await handleRequest(request('/api/requests'),env(db,{CF_EXPERT_DESK_ENABLED:undefined}),owner);
 assert.equal(off.status,503);
 const noAccess=await handleRequest(request('/api/requests'),env(db));
 assert.equal(noAccess.status,401);
 const other=await handleRequest(request('/api/requests'),env(db),async()=>({id:'b'.repeat(64)}));
 assert.equal(other.status,403);
 assert.equal(db.statements.length,0);
 const spoofed=await handleRequest(request('/api/requests','GET',null,'https://attacker.example'),env(db),owner);
 assert.equal(spoofed.status,403);
 assert.equal((await spoofed.text()).includes('research@example.org'),false);
 const absent=await handleRequest(request('/api/requests'),env(db,{CF_OWNER_USER_HASH:''}),owner);
 assert.equal(absent.status,503);
});
test('Strict mutation Origin, OPTIONS CORS and owner-scoped health',async()=>{
 const db=database();
 assert.equal((await handleRequest(request('/api/requests','POST',valid,null),env(db),owner)).status,403);
 const opt=await handleRequest(request('/api/requests','OPTIONS'),env(db));
 assert.equal(opt.status,204);
 assert.equal(opt.headers.get('Access-Control-Allow-Origin'),ORIGIN);
 assert.equal(opt.headers.get('Access-Control-Allow-Credentials'),'true');
 assert.equal((await handleRequest(request('/api/health'),env(db),owner)).status,200);
 const fromWorker=await (await import('../src/index.mjs')).default.fetch(request('/api/health'),env(db),{});
 assert.equal(fromWorker.status,503,'No configured authentication must fail closed');
});
test('Strict form validation, no implicit data capture, contacts remain private',()=>{
 assert.equal(validateBrief(valid).contact_email,'research@example.org');
 assert.throws(()=>validateBrief({...valid,contact_email:'a@\nmalicious.example'}),/contact_email/);
 assert.throws(()=>validateBrief({...valid,sector:'not_a_sector'}),/sector/);
 assert.throws(()=>validateBrief({...valid,objective:'short'}),/objective/);
 assert.throws(()=>validateBrief({...valid,expert_criteria:'very\nsensitive'}),/expert_criteria/);
 assert.throws(()=>validateBrief({...valid,budget:'request payment now'}),/budget/);
});
test('Owner can record manually received lead, with atomic create and audit metadata',async()=>{
 const db=database(),resp=await handleRequest(request('/api/requests','POST',valid),env(db),owner);
 assert.equal(resp.status,201);
 const item=await resp.json();
 assert.match(item.id,/^[a-f0-9-]{36}$/);
 assert.equal(item.recorded_by_owner,true);
 assert.equal(item.received,false,'Never claim the public client form was submitted');
 assert.equal(item.status,'new');
 assert.equal(db.batches.length,1);
 assert.equal(db.batches[0].length,2,'create + audit must batch');
 assert.ok(db.batches[0][0].sql.includes('INSERT INTO research_requests'));
 assert.ok(db.batches[0][0].args.includes('research@example.org'));
 const listed=await handleRequest(request('/api/requests'),env(db),owner);
 assert.equal(listed.status,200);
 assert.match(db.statements.at(-1).sql,/SELECT id,service,sector,organization,status,version,created_at,updated_at/);
 assert.doesNotMatch(db.statements.at(-1).sql,/contact_email|expert_criteria|objective/);
});
test('Owner workflow requires screening and client approval; rejects stale and invalid transitions',async()=>{
 const db=database('sourcing',4);
 const toShortlist=request('/api/requests/'+id+'/status','POST',{to:'shortlisted',version:4});
 assert.equal((await handleRequest(toShortlist,env(db),owner)).status,400);
 const correct=request('/api/requests/'+id+'/status','POST',{to:'shortlisted',version:4,screening_confirmed:true,note:'Consent and availability reviewed'});
 const result=await handleRequest(correct,env(db),owner);
 assert.equal(result.status,200);
 assert.deepEqual(await result.json(),{id,status:'shortlisted',version:5});
 assert.equal(db.batches.at(-1).length,2,'status update and immutable audit entry batched atomically');
 assert.match(db.batches.at(-1)[1].sql,/WHERE EXISTS/);
 const stale=await handleRequest(request('/api/requests/'+id+'/status','POST',{to:'shortlisted',version:3,screening_confirmed:true}),env(db),owner);
 assert.equal(stale.status,409);
 const missingCandidate=await handleRequest(request('/api/requests/'+id+'/status','POST',{to:'shortlisted',version:4,screening_confirmed:true}),env(database('sourcing',4,false)),owner);
 assert.equal(missingCandidate.status,409,'No shortlist without a linked and screened expert');
 assert.equal(allowedTransition('new','delivered'),false);
 assert.equal(allowedTransition('proposal_sent','approved'),true);
 assert.deepEqual(TRANSITIONS.delivered,[]);
 const db2=database('proposal_sent',7);
 assert.equal((await handleRequest(request('/api/requests/'+id+'/status','POST',{to:'approved',version:7}),env(db2),owner)).status,400);
 assert.equal((await handleRequest(request('/api/requests/'+id+'/status','POST',{to:'approved',version:7,client_approval_confirmed:true}),env(db2),owner)).status,200);
});
test('Private Owner console requires Access and uses a restrictive CSP',async()=>{
 const db=database();
 assert.equal((await handleRequest(request('/owner'),env(db))).status,401);
 assert.equal((await handleRequest(request('/owner'),env(db),async()=>({id:'b'.repeat(64)}))).status,403);
 assert.equal((await handleRequest(request('/owner'),env(db,{CF_EXPERT_DESK_ENABLED:undefined}),owner)).status,503);
 const res=await handleRequest(request('/owner'),env(db),owner);
 assert.equal(res.status,200);
 assert.match(res.headers.get('Content-Type'),/text\/html/);
 assert.match(res.headers.get('Content-Security-Policy'),/default-src 'none'/);
 assert.match(res.headers.get('Content-Security-Policy'),/script-src 'nonce-[a-f0-9]{32}'/);
 assert.match(res.headers.get('Content-Security-Policy'),/connect-src 'self'/);
 assert.equal(res.headers.get('Cache-Control'),'no-store, private');
 const html=await res.text();
 assert.match(html,/Private Research Desk/);
 assert.match(html,/Manually record a received inquiry/);
 assert.match(html,/same-origin/);
 assert.doesNotMatch(html,/research@example\.org|<script[^>]+src=|<form[^>]+action=/i);
 assert.equal((await handleRequest(request('/owner','POST',{}),env(db),owner)).status,404);
});
test('Bad IDs and API methods do not expose leads; owner DELETE uses batch',async()=>{
 const db=database();
 assert.equal((await handleRequest(request('/api/requests/../secrets'),env(db),owner)).status,404);
 assert.equal((await handleRequest(request('/api/requests/not-a-uuid'),env(db),owner)).status,400);
 assert.equal((await handleRequest(request('/api/requests/'+id,'PUT',{}),env(db),owner)).status,404);
 const response=await handleRequest(request('/api/requests/'+id,'DELETE'),env(db),owner);
 assert.equal(response.status,200);
 assert.equal(db.batches.at(-1).length,2);
 assert.ok(db.batches.at(-1)[0].sql.includes('DELETE FROM research_request_history'));
});

test('Expert profiles require documented consent, valid scope and source',()=>{
 const ex={
  display_name:'Example Consenting Expert',sector:'energy',specialty:'Indonesian energy market',
  experience_summary:'Ten years in industry and energy policy research',
  contact_email:'specialist@example.org',public_profile_url:'https://example.org/profile',
  consent_confirmed:true,consent_date:'2026-01-01',consent_reference:'Explicit written opt-in ref example-001'
 };
 assert.equal(validateExpert(ex).sector,'energy');
 for(const bad of [
  {...ex,consent_confirmed:false},
  {...ex,consent_date:'2099-01-01'},
  {...ex,consent_reference:''},
  {...ex,sector:'unknown'},
  {...ex,public_profile_url:'http://example.org/profile'},
  {...ex,contact_email:'private@example.org\nBcc:elsewhere'}
 ])assert.throws(()=>validateExpert(bad));
});
test('Owner-only expert registry and shortlist do not publish candidates or send messages',async()=>{
 const db=database('sourcing');
 const ex={
  display_name:'Consenting Example',sector:'digital',
  specialty:'Data centre infrastructure and energy policy',
  experience_summary:'Independent technical research and digital infrastructure experience',
  contact_email:'expert@example.org',public_profile_url:'https://example.org/expert',
  consent_confirmed:true,consent_date:'2026-01-01',
  consent_reference:'Written opt-in to SLI private expert sourcing'
 };
 const denied=await handleRequest(request('/api/experts','POST',ex),env(db),async()=>({id:'b'.repeat(64)}));
 assert.equal(denied.status,403);
 const invalid=await handleRequest(request('/api/experts','POST',{...ex,consent_confirmed:false}),env(db),owner);
 assert.equal(invalid.status,400);
 const saved=await handleRequest(request('/api/experts','POST',ex),env(db),owner);
 assert.equal(saved.status,201);
 const out=await saved.json();
 assert.equal(out.publicly_listed,false);
 assert.equal(out.consent_scope,'internal_matching');
 assert.ok(db.statements.some(x=>x.sql.includes('INSERT INTO consented_experts')));
 const listed=await handleRequest(request('/api/experts'),env(db),owner);
 assert.equal(listed.status,200);
 assert.match(db.statements.at(-1).sql,/SELECT id,display_name,sector,specialty,public_profile_url,consent_verified_at/);
 assert.doesNotMatch(db.statements.at(-1).sql,/contact_email|consent_reference/);
 const notScreened=await handleRequest(request('/api/requests/'+id+'/candidates','POST',{expert_id:out.id,fit_reason:'Qualified expert with experience in AI energy policy'}),env(db),owner);
 assert.equal(notScreened.status,400);
 const shortlisted=await handleRequest(request('/api/requests/'+id+'/candidates','POST',{
  expert_id:out.id,fit_reason:'Relevant expertise in Indonesian AI infrastructure regulation',
  share_authorized:true,conflicts_checked:true,availability_confirmed:true
 }),env(db),owner);
 assert.equal(shortlisted.status,201);
 assert.equal((await shortlisted.json()).not_contacted,true);
 assert.ok(db.statements.some(x=>x.sql.includes('INSERT INTO request_expert_shortlist')));
 assert.equal((await handleRequest(request('/api/experts/'+out.id,'DELETE'),env(db),owner)).status,200);
 assert.ok(db.batches.at(-1)[0].sql.includes('DELETE FROM request_expert_shortlist'));
});
