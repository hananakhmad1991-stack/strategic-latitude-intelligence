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

const gini=JSON.parse(read('data/sli-bps-gini-2026.json'));
test('Gini socioeconomic context joins all 38 provinces without modifying their fit score',()=>{
 const base=engine.screen(data);
 const linked=engine.attachInequality(base,gini);
 assert.equal(linked.length,38);
 assert.deepEqual([...new Set(linked.map(x=>x.name))].sort(),[...new Set(gini.provinces.map(x=>x.name))].sort());
 assert.equal(linked.every((x,i)=>x.score===base[i].score),true);
 assert.equal(linked.find(x=>x.name==='DKI Jakarta').inequality.combined,0.435);
 assert.equal(linked.find(x=>x.name==='DKI Jakarta').inequality.rural,null);
 assert.equal(linked.find(x=>x.name==='Jawa Barat').inequality.combined,0.413);
 assert.equal(gini.national.combined,0.368);
 assert.equal(gini.national.urban,0.387);
 assert.equal(gini.national.rural,0.296);
});
test('National, urban and rural inequality are compared only within like-for-like population areas',()=>{
 const linked=engine.attachInequality(engine.screen(data),gini);
 const jakarta=linked.find(x=>x.name==='DKI Jakarta');
 const combined=engine.inequalityContext(jakarta,gini,'combined');
 assert.equal(combined.value,0.435);
 assert.equal(combined.national,0.368);
 assert.equal(combined.difference,0.067);
 assert.equal(combined.comparison,'Above national');
 const rural=engine.inequalityContext(jakarta,gini,'rural');
 assert.equal(rural.value,null);
 assert.equal(rural.national,0.296);
 assert.equal(rural.comparison,'Not available');
 const java=linked.find(x=>x.name==='Jawa Barat');
 const urb=engine.inequalityContext(java,gini,'urban');
 assert.equal(urb.national,0.387);
 assert.equal(urb.value,0.424);
});
test('Geographic medians summarize separate provinces without producing unsupported regional Gini',()=>{
 const linked=engine.attachInequality(engine.screen(data),gini);
 const groups=engine.groupedProvinceMedians(linked,'combined');
 assert.equal(Object.keys(groups).length,7);
 assert.equal(groups.Java.count,6);
 assert.equal(groups.Java.median,0.388);
 assert.ok(groups.Sumatra.minimum<=groups.Sumatra.median);
 assert.ok(groups.Sumatra.median<=groups.Sumatra.maximum);
 assert.equal(engine.groupedProvinceMedians(linked,'rural').Java.count,5);
});
test('Gini source failure leaves economic model scored and its inequality observations missing',()=>{
 const base=engine.screen(data),linked=engine.attachInequality(base,null);
 assert.equal(linked.length,38);
 assert.equal(linked.every((x,i)=>x.score===base[i].score&&x.inequality.combined===null),true);
 const c=engine.inequalityContext(linked[0],null);
 assert.equal(c.value,null);
 assert.equal(c.comparison,'Not available');
});
test('Original investment interface integrates Gini context, comparative visualization, dated analyst briefs and CSV',()=>{
 assert.match(html,/sli-bps-gini-2026\.json/);
 assert.match(html,/id="giniArea"/);
 assert.match(html,/id="equityScatter"/);
 assert.match(html,/id="nationalAreaGini"/);
 assert.match(html,/function renderInequality\(/);
 assert.match(html,/Socioeconomic context for/);
 assert.match(html,/gini_coefficient_march_2026/);
 assert.match(html,/national_gini_selected_area_march_2026/);
 assert.match(html,/Gini does not contribute to the fit score/);
 assert.match(html,/datasets are different periods and not synchronized/);
 assert.match(html,/not official regional Gini/i);
 assert.match(html,/gini-inequality\.html/);
 const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
 assert.equal(inline.length,1);
 assert.doesNotThrow(()=>new Function(inline[0][1]));
});
