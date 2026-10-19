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
 assert.match(cfg,/WORLD_BANK_ENABLED = "true"/);assert.match(cfg,/TAVILY_ENABLED = "false"/);assert.match(cfg,/CF_AI_GATEWAY_ENABLED = "false"/);
 assert.doesNotMatch(worker,/fetch\("https:\/\/api\.openai\.com\/v1\/responses"/);
});
