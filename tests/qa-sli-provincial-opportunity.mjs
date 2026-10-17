import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const code=read('js/sli-opportunity-engine.js');
const html=read('provincial-opportunity-engine.html');
const data=JSON.parse(read('data/sli-bps-regional-intelligence.json'));
const registry=JSON.parse(read('data/sli-project-registry.json'));
const context={window:{},module:{exports:{}}};
runInNewContext(code,context);
const engine=context.module.exports;
test('all 38 provinces appear, with observed 2025 inputs and 2025 provisional source',()=>{
 assert.equal(data.provinces.length,38);
 assert.equal(engine.screen(data).length,38);
 assert.equal(data.grdp_years.at(-1),2025);
 assert.ok(data.caveats.some(x=>/preliminary/i.test(x)));
 assert.equal(engine.screen(data).every(x=>Number.isFinite(x.scale)&&Number.isFinite(x.growth)&&Number.isFinite(x.consumption)&&Number.isFinite(x.formation)),true);
});
test('balanced, market and industrial lenses rank deterministically, respecting objective',()=>{
 for(const preset of ['balanced','market','expansion']){
  const rows=engine.screen(data,{preset});
  assert.equal(rows.length,38);
  assert.equal(rows.every(x=>Number.isFinite(x.score)&&x.score>=0&&x.score<=100),true);
  assert.equal(rows.every((x,i)=>i===0||rows[i-1].score>=x.score),true);
 }
 const market=engine.weightsFor('market');
 assert.ok(market.consumption>market.formation);
 const industrial=engine.weightsFor('expansion');
 assert.ok(industrial.formation>industrial.consumption);
 assert.equal(Object.values(engine.weightsFor('balanced')).reduce((a,b)=>a+b,0),1);
});
test('ties are equal, unavailable values remain unscored, zero weights are safe',()=>{
 const pts=engine.percentiles([{id:1,scale:10},{id:2,scale:10},{id:3,scale:15},{id:4,scale:null}],'scale');
 assert.equal(pts[1],pts[2]);
 assert.equal(pts[3],100);
 assert.equal(pts[4],undefined);
 const demo={provinces:[{id:1,name:'Missing',grdp_current:[1,1,1,1,null],grdp_constant:[1,1,1,1,1],pmtb_current:[1,1,1,1,1],household_current:[1,1,1,1,1]}]};
 assert.equal(engine.screen(demo)[0].score,null);
 const weights=engine.weightsFor('custom',{scale:0,growth:0,consumption:0,formation:0});
 assert.equal(Object.values(weights).reduce((a,b)=>a+b,0),1);
});
test('scenario arithmetic is an observed-2025 partial accounting counterfactual, never a forecast',()=>{
 const row=engine.screen(data).find(x=>x.name==='Jawa Barat');
 assert.ok(row);
 assert.equal(engine.staticShock(row,0,0),0);
 assert.ok(engine.staticShock(row,5,10)<0);
 assert.ok(engine.staticShock(row,10,20)<engine.staticShock(row,5,10));
 const expected=-100*(row.household*.05+row.capital*.1)/row.grdp;
 assert.ok(Math.abs(engine.staticShock(row,5,10)-expected)<1e-10);
 assert.equal(engine.staticShock(row,-3,4),null);
 assert.equal(engine.staticShock({grdp:0,household:20,capital:10},5,10),null);
});
test('project attribution is sourced, non-additive, with national unspecified sites excluded',()=>{
 assert.equal(registry.records.length,25);
 const java=engine.localProjects(registry,'West Java');
 assert.ok(java.some(x=>x.name.includes('Cisokan')));
 assert.ok(java.every(x=>x.provinces.includes('West Java')));
 const westJava=engine.localProjects(registry,'Jawa Barat');
 assert.ok(westJava.some(x=>x.name.includes('Cisokan')));
 assert.ok(engine.localProjects(registry,'Jawa Timur').some(x=>x.name.includes('Manyar')));
 assert.equal(engine.localProjects(registry,'Not a province').length,0);
 assert.ok(registry.records.some(x=>x.provinces.length===0));
 assert.ok(registry.records.every(x=>x.source_url.startsWith('https://')&&x.amount_basis));
});
test('page integrates existing registers with source bounds, clear user control, accessible plot and CSV',()=>{
 assert.match(html,/sli-bps-regional-intelligence\.json/);
 assert.match(html,/sli-project-registry\.json/);
 assert.match(html,/sli-opportunity-engine\.js/);
 assert.match(html,/id="preset"/);
 assert.match(html,/id="consumerShock"/);
 assert.match(html,/id="capitalShock"/);
 assert.match(html,/id="export"/);
 assert.match(html,/id="brief"/);
 assert.match(html,/id="copyBrief"/);
 assert.match(html,/function renderBrief\(/);
 assert.match(html,/Due-diligence priorities/);
 assert.match(html,/aria-label="Interactive provincial growth/);
 assert.match(html,/not a GDP forecast/i);
 assert.match(html,/not added to fit scores/i);
 assert.match(html,/2025 provincial values preliminary/i);
 const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 assert.equal(inline.length,1);
 assert.doesNotThrow(()=>new Function(inline[0]));
});
test('the ranking cannot silently blend political, safety or police figures',()=>{
 assert.doesNotMatch(code,/police_districts|victim_prevalence|dpt_2024|press_freedom|political_risk/);
 assert.match(code,/PMTB|capital/);
 assert.match(html,/not investment, legal or financial advice/);
});
