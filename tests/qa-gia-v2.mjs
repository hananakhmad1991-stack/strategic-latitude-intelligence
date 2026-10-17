import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={};ctx.window=ctx;runInNewContext(get('js/sli-gia-v2-engine.js'),ctx);const api=ctx.SLIGIA;
test('GIA scoring combines macro, meso and micro exactly and rejects invalid values',()=>{
 assert.equal(api.score({macro:40,meso:55,micro:30}),43.5);
 assert.throws(()=>api.score({macro:-5,meso:60,micro:40}));
 assert.throws(()=>api.score({macro:40,meso:50,micro:55},{macro:.5,meso:.5,micro:.5}));
});
test('scenario loss and user-assumed 95th percentile are mathematically correct',()=>{
 const x=api.scenario({value:100,exposure:60,prob:[20,50,30],shocks:[-5,8,25]});
 assert.deepEqual(Array.from(x.losses),[-3,4.8,15]);
 assert.equal(x.expected,6.3);
 assert.equal(x.p95,15);
 assert.equal(x.downside,15);
 assert.throws(()=>api.scenario({value:100,exposure:60,prob:[20,40,30],shocks:[-5,8,25]}));
 assert.throws(()=>api.scenario({value:100,exposure:150,prob:[20,50,30],shocks:[-5,8,25]}));
});
test('scenario warning threshold is analyst configurable and not live risk',()=>{
 assert.equal(api.actionState(43.5,60).alert,false);
 assert.equal(api.actionState(78,60).alert,true);
 assert.equal(api.actionState(NaN,60).label,'Unassessed');
});
test('GIA source-configured inputs, assumptions and sector channels are complete',()=>{
 const conf=JSON.parse(get('data/sli-gia-v2-config.json'));
 assert.equal(conf.scenarios.length,5);assert.ok(conf.countries.length>=15);
 assert.equal(conf.methodology.score_type,'USER_SCENARIO_0_100');
 assert.equal(conf.methodology.macro_weight+conf.methodology.meso_weight+conf.methodology.micro_weight,1);
 for(const s of conf.scenarios)assert.ok(s.name&&s.country&&s.pathway&&s.watch.length&&s.mitigation.length);
 assert.ok(conf.scenarios.every(s=>conf.countries.some(c=>c.code===s.country)));
});
test('all four stages, world map, portfolio stress and scenario alerts are present',()=>{
 const html=get('geopolitical-impact-assessment.html');
 for(const id of ['ingestion','risk','simulation','alerts','heatMap','riskScore','var95','expectedLoss','downside','alertState','newsItems','exportGia','refreshFeed'])assert.ok(html.includes('id="'+id+'"'));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 for(const js of ['js/sli-gia-v2.js','js/sli-gia-v2-engine.js'])assert.doesNotThrow(()=>new Function(get(js)));
 assert.match(html,/not statistically|not calibrated|not a verified country risk index|not a verified country risk/i);
});
test('old navigator removed from SLI navigation and legacy geo fragment redirects to new GIA',()=>{
 const index=get('index.html'),labs=get('intelligence-labs.html');
 assert.match(index,/geopolitical-impact-assessment\.html/);
 assert.doesNotMatch(index,/indonesia-investment-navigator\.html/);
 assert.match(labs,/location\.hash==='#geo'/);
 assert.match(labs,/geopolitical-impact-assessment\.html/);
 assert.doesNotMatch(labs,/id="impactEvent"/);
});
