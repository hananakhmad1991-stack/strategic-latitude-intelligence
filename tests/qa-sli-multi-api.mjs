import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 safePublicUrl,worldBankCandidates,normaliseWorldBankResponse,normaliseTavilyResults,
 retrieveWorldBank,retrieveTavily,collectOptionalLiveEvidence
} from '../research-api/src/external-research.mjs';
import {openAITransport} from '../research-api/src/model-transport.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const wb=[{page:1,total:2},[
 {date:'2025',value:4.9,country:{id:'ID'},countryiso3code:'IDN'},
 {date:'2024',value:5.0,country:{id:'ID'},countryiso3code:'IDN'},
 {date:'2023',value:null,country:{id:'ID'},countryiso3code:'IDN'}
]];
test('World Bank selects exact Indonesia national series rather than province or unrelated data',()=>{
 assert.deepEqual(worldBankCandidates('Berapa inflasi dan pertumbuhan ekonomi Indonesia?').map(x=>x.id),
 ['NY.GDP.MKTP.KD.ZG','FP.CPI.TOTL.ZG']);
 assert.deepEqual(worldBankCandidates('inflasi Jawa Barat'),[]);
 assert.deepEqual(worldBankCandidates('PDRB Provinsi Papua'),[]);
 assert.deepEqual(worldBankCandidates('analisis kelayakan PLTU Batam'),[]);
 assert.deepEqual(worldBankCandidates('inflasi China'),[]);
 const d=normaliseWorldBankResponse(wb,worldBankCandidates('pertumbuhan ekonomi')[0],'2026-10-19');
 assert.equal(d.metric.value,4.9);assert.equal(d.period,'2025');
 assert.equal(d.source_date,'2026-10-19');assert.equal(d.metric.code,'NY.GDP.MKTP.KD.ZG');
 assert.match(d.text,/NOT necessarily the current year/);
 assert.equal(normaliseWorldBankResponse([{},[{date:'2026',value:100,countryiso3code:'USA'}]],worldBankCandidates('inflasi')[0]),null);
});
test('World Bank fetch does not reveal question text or accept an arbitrary outbound URL',async()=>{
 let urls=[];
 const f=async u=>{urls.push(u);return {ok:true,json:async()=>wb}};
 const r=await retrieveWorldBank('pertumbuhan ekonomi Indonesia dengan memo rahasia',{enabled:true,fetcher:f,clock:()=> '2026-10-19'});
 assert.equal(r.status,'retrieved');assert.equal(r.documents.length,1);
 assert.equal(urls.length,1);assert.ok(urls[0].startsWith('https://api.worldbank.org/v2/country/IDN/indicator/'));
 assert.ok(!urls[0].includes('memo'));
 const bad=await retrieveWorldBank('inflasi Indonesia',{enabled:true,fetcher:async()=>{throw Error('network')}});
 assert.equal(bad.documents.length,0);assert.equal(bad.status,'unavailable_or_no_numeric_observation');
});
test('Tavily requires enabled provider, explicit per-question consent and no attachments',async()=>{
 let called=0,body;
 const fake=async(_,options)=>{called++;body=JSON.parse(options.body);return {ok:true,json:async()=>({results:[
  {url:'https://www.reuters.com/world/asia/',title:'Publisher headline',content:'This is an attributed article excerpt.',published_date:'2026-10-18'},
  {url:'http://insecure.com/private',title:'Unsafe',content:'spoof'},
  {url:'https://127.0.0.1/keys',title:'Unsafe 2',content:'spoof'}]})}};
 const base={enabled:true,apiKey:'tvly-fake',fetcher:fake,clock:()=> '2026-10-19'};
 assert.equal((await retrieveTavily('latest data centers Indonesia',{...base,consent:false})).status,'consent_not_granted');
 assert.equal((await retrieveTavily('latest data centers Indonesia',{...base,consent:true,hasAttachments:true})).status,'files_not_sent_to_search');
 assert.equal((await retrieveTavily('my secret API_KEY for project',{...base,consent:true})).status,'query_not_eligible');
 assert.equal(called,0);
 const ok=await retrieveTavily('latest data center investments Indonesia',{...base,consent:true});
 assert.equal(called,1);assert.equal(ok.documents.length,1);assert.equal(ok.documents[0].source_type,'live_web_discovery');
 assert.equal(ok.documents[0].verification_status,'search_excerpt_unverified');
 assert.equal(body.search_depth,'basic');assert.equal(body.include_answer,false);assert.equal(body.include_raw_content,false);
 assert.equal(body.max_results,4);assert.equal(body.auto_parameters,false);
 assert.ok(!JSON.stringify(body).includes('tvly-fake'));
});
test('Search discovery never certifies a headline merely because the source is prominent',()=>{
 const data=normaliseTavilyResults({results:[{url:'https://reuters.com/a',title:'Some breaking story',content:'HUGE VERIFIED CLAIM now'}]},'2026-10-19');
 assert.equal(data.length,1);assert.match(data[0].text,/DISCOVERY ONLY/);
 assert.match(data[0].text,/not a confirmed event/i);
 for(const bad of ['http://reuters.com/a','https://localhost/test','https://169.254.1.1/secrets','https://user:pass@reuters.com/a','https://example.com:4443/'])assert.equal(safePublicUrl(bad),null);
});
test('External bridge explicitly separates provider status and never sends client attachments',async()=>{
 const calls=[];
 const fetcher=async (url,options)=>{calls.push([url,options]);return url.startsWith('https://api.worldbank.org')?{ok:true,json:async()=>wb}:{ok:true,json:async()=>({results:[]})}};
 const res=await collectOptionalLiveEvidence({env:{WORLD_BANK_ENABLED:'true',TAVILY_ENABLED:'true',TAVILY_API_KEY:'tvly-fake'},question:'inflasi Indonesia',consent:true,hasAttachments:true,fetcher});
 assert.equal(res.documents.length,1);assert.equal(res.status.web_search,'files_not_sent_to_search');
 assert.ok(calls.every(([url])=>url.startsWith('https://api.worldbank.org')));
});
test('AI Gateway can only be selected by trusted server config, never arbitrary URL',()=>{
 const env={OPENAI_API_KEY:'secret',CF_AI_GATEWAY_ENABLED:'false'};
 assert.equal(openAITransport(env).endpoint,'https://api.openai.com/v1/responses');
 assert.equal(openAITransport({...env,CF_AI_GATEWAY_ENABLED:'true',CF_AI_GATEWAY_ACCOUNT_ID:'a'.repeat(32),CF_AI_GATEWAY_ID:'sli-research',CF_AI_GATEWAY_TOKEN:'cf-test'}).endpoint,
  'https://gateway.ai.cloudflare.com/v1/'+ 'a'.repeat(32)+'/sli-research/openai/responses');
 assert.throws(()=>openAITransport({...env,CF_AI_GATEWAY_ENABLED:'true',CF_AI_GATEWAY_ACCOUNT_ID:'https://attacker.example',CF_AI_GATEWAY_ID:'anything'}));
 const direct=openAITransport(env);assert.equal(direct.headers.authorization,'Bearer secret');assert.equal(direct.headers['cf-aig-authorization'],undefined);
});
test('Owner Worker and frontend preserve consent boundary and source labeling',()=>{
 const worker=read('research-api/src/owner-test-worker.mjs'),ui=read('sli-research-ai.html'),front=read('js/sli-research-assistant.js'),cfg=read('research-api/wrangler.owner-test.toml.example');
 assert.match(worker,/collectOptionalLiveEvidence/);assert.match(worker,/openAITransport/);assert.match(worker,/body\.external_search===true/);
 assert.match(worker,/official_numeric_api/);assert.match(worker,/live_web_discovery/);assert.match(worker,/external_evidence:/);
 assert.match(front,/external_search:usingOwner&&/);assert.match(ui,/id="raExternalSearchConsent"/);
 assert.match(cfg,/WORLD_BANK_ENABLED = "true"/);
 assert.match(cfg,/keep_vars = true/);
 assert.match(cfg,/CF_AI_GATEWAY_ACCOUNT_ID = "df48c020a08ce74cf7158baf9cc9443b"/);
 assert.match(cfg,/CF_AI_GATEWAY_ID = "sli-research"/);
 assert.doesNotMatch(cfg,/^TAVILY_ENABLED = /m);
 assert.doesNotMatch(cfg,/^CF_AI_GATEWAY_ENABLED = /m);
 assert.ok(cfg.indexOf('keep_vars = true')<cfg.indexOf('[vars]'));
 assert.doesNotMatch(worker,/fetch\("https:\/\/api\.openai\.com\/v1\/responses"/);
});

test('Research UI reports real Tavily statuses instead of silently treating zero results as cached evidence',async()=>{
 const {runInNewContext}=await import('node:vm');
 const source=read('js/sli-research-assistant.js');
 const start=source.indexOf('function externalApiDiagnostic(');
 const end=source.indexOf('function makeExport(){',start);
 assert.ok(start>=0&&end>start,'pure diagnostic helper must be present before export logic');
 const f=runInNewContext(source.slice(start,end)+'\nexternalApiDiagnostic;',{});
 const cases=[
  ['consent_not_granted','belum dicentang'],
  ['not_configured','TAVILY_ENABLED'],
  ['provider_http_401','ditolak'],
  ['provider_http_429','Batas pemakaian'],
  ['timeout','batas waktu'],
  ['discovery_available','3 temuan web']
 ];
 for(const [status,expected] of cases){
  const label=f({external_evidence:{web_search:status,world_bank:'no_matching_national_indicators',
   added_search_leads:status==='discovery_available'?3:0,added_official_records:0},
   model_route:'direct_openai'},'id');
  assert.ok(label.includes(expected),status+': '+label);
  assert.match(label,/WORLD BANK:/);assert.match(label,/Direct OpenAI/);
 }
 assert.match(f({},'id'),/belum melaporkan status Tavily/);
 assert.match(f({external_evidence:{web_search:'discovery_available',world_bank:'retrieved',added_search_leads:2,added_official_records:1},
  model_route:'cloudflare_ai_gateway'},'en'),/Cloudflare AI Gateway/);
 assert.match(source,/report\.prepend\(node\("p","sli-ra-evidence-note",externalApiDiagnostic\(payload,state\.language\)\)\)/);
 assert.match(source,/externalEvidence:payload\.external_evidence\|\|null/);
 assert.match(source,/externalApiDiagnostic\(\{external_evidence:last\.externalEvidence,model_route:last\.modelRoute\}/);
});

test('Tavily discovery links are surfaced with publisher date and actual citation-use status',async()=>{
 const {runInNewContext}=await import('node:vm');
 const script=read('js/sli-research-assistant.js');
 const start=script.indexOf('function renderLiveDiscovery(');
 const end=script.indexOf('function renderMonitoringSignals(',start);
 assert.ok(start>=0&&end>start,'source discovery panel must exist');
 const elements=[];
 const node=(tag,cls,label)=>{const n={tag,cls,label:label||'',children:[],append(...args){this.children.push(...args)}};elements.push(n);return n};
 const safeUrl=u=>{try{const v=new URL(u);return v.protocol==='https:'?v.href:null}catch{return null}};
 const render=runInNewContext(script.slice(start,end)+'\nrenderLiveDiscovery;',{node,safeUrl});
 const report={children:[],append(x){this.children.push(x)}};
 const sources=[
 {title:'SLI baseline',source_url:'https://example.com/base',source_type:'curated_baseline'},
 {title:'Recent investment announcement',source_url:'https://example.com/news',source_type:'live_web_discovery',
  publisher:'Publisher One',period:'publication_date_unverified'},
 {title:'New operator update',source_url:'https://example.net/update',source_type:'live_web_discovery',
  publisher:'Publisher Two',period:'2026-10-10'},
 {title:'Blocked source',source_url:'javascript:alert(1)',source_type:'live_web_discovery'}
 ];
 render({sources,answer:'Search finds a lead [2] but no independently confirmed commissioning.'},report,'id');
 assert.equal(report.children.length,1);
 const panel=report.children[0],text=JSON.stringify(panel);
 assert.match(text,/Sumber baru yang ditemukan Tavily/);
 assert.match(text,/Recent investment announcement/);
 assert.match(text,/New operator update/);
 assert.match(text,/Dikutip sebagai temuan pencarian; klaim belum diverifikasi/);
 assert.match(text,/Belum digunakan dalam analisis/);
 assert.match(text,/tanggal terbit belum diketahui/);
 assert.match(text,/2026-10-10/);
 assert.doesNotMatch(text,/Blocked source/);
 assert.doesNotMatch(text,/SLI baseline/);
 assert.match(read('research-api/src/owner-test-worker.mjs'),/RECENT-WEB COMPARISON RULE/);
 assert.match(script,/renderLiveDiscovery\(payload,report,state\.language\)/);
});


test('Owner CCS bridge activates only for relevant CCS prompts and includes public project dossiers',async()=>{
 const {isCCSQuestion,ccsResearchEvidence}=await import('../research-api/src/ccs-corpus.mjs');
 for(const q of ['Analisis investasi CCS Indonesia 2026','Perkembangan CCUS di Sukowati','carbon capture storage infrastructure'])assert.ok(isCCSQuestion(q));
 assert.equal(isCCSQuestion('Harga BBM dan pembangunan LNG Indonesia 2026'),false);
 assert.deepEqual(ccsResearchEvidence('Harga BBM dan gas LNG'),[]);
 const evidence=ccsResearchEvidence('Analisis perkembangan investasi CCS Indonesia 2026');
 assert.ok(evidence.length>=11);
 for(const name of ['Tangguh','Gundih','Sukowati','Masela','Jatibarang','Arun','Asri']){
  assert.ok(evidence.some(x=>x.title.toLowerCase().includes(name.toLowerCase())),name);
 }
 assert.ok(evidence.some(x=>x.id==='sli_ccs_bp_ucc_fabrication_2025'));
 assert.ok(evidence.some(x=>x.id==='sli_ccs_inpex_abadi_offtake_2026'));
 assert.ok(evidence.some(x=>x.id==='sli_ccs_esdm_abadi_groundbreaking_2026'));
 assert.equal(new Set(evidence.map(x=>x.id)).size,evidence.length);
 for(const row of evidence){
  assert.match(row.source_url,/^https:\/\//);
  assert.ok(row.title&&row.text.length>70&&row.period&&row.publisher);
  assert.match(row.topic,/CCS CCUS/);
 }
});
test('CCS project stages and primary milestones are not conflated with commissioned carbon injection',async()=>{
 const {ccsResearchEvidence}=await import('../research-api/src/ccs-corpus.mjs');
 const docs=ccsResearchEvidence('Perkembangan CCS Indonesia 2026');
 const masela=docs.find(x=>x.title.includes('Abadi Masela gas development'));
 assert.ok(masela);assert.match(masela.text,/Wider gas project groundbreaking/);
 assert.match(masela.text,/NOT inauguration of CCS injection/);
 assert.match(docs.find(x=>x.id==='sli_ccs_esdm_abadi_groundbreaking_2026').text,/does NOT independently establish/);
 assert.match(docs.find(x=>x.id==='sli_ccs_bp_ucc_fabrication_2025').text,/NOT verified commercial CO2 injection/);
 assert.match(docs.find(x=>x.id==='sli_ccs_inpex_abadi_offtake_2026').text,/final investment decision/);
 const worker=read('research-api/src/owner-test-worker.mjs');
 assert.match(worker,/const ccsEvidence=ccsQuestion\?ccsResearchEvidence/);
 assert.match(worker,/\.\.\.ccsEvidence,\.\.\.primaryEvidence/);
 assert.match(worker,/CCS PROJECT STAGE RULE/);
 assert.match(worker,/primaryEvidence0\.filter\(d=>!\/masela\|abadi lng\//);
});
