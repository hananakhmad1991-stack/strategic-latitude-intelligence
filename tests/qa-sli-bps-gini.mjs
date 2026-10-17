import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const data=JSON.parse(file('data/sli-bps-gini-2026.json'));
const regional=JSON.parse(file('data/sli-bps-regional-intelligence.json'));
const html=file('gini-inequality.html');
const js=file('js/sli-bps-gini-explorer.js');
const main=file('index.html');
const indonesia=file('geopolitical-impact-assessment.html');
test('BPS March 2026 Gini snapshot identifies publication and national statistical definitions',()=>{
 assert.equal(data.schema,'sli-bps-gini-ratio-v1');
 assert.equal(data.measurement_period,'2026-03');
 assert.equal(data.published_at,'2026-08-05');
 assert.equal(data.national.combined,0.368);
 assert.equal(data.national.urban,0.387);
 assert.equal(data.national.rural,0.296);
 assert.deepEqual(data.national.history.map(v=>v.period),['2025-03','2025-09','2026-03']);
 assert.deepEqual(data.national.history.map(v=>v.combined),[0.375,0.363,0.368]);
 assert.ok(data.sources.every(s=>s.url.startsWith('https://www.bps.go.id/')));
});
test('all 38 provinces precisely align with already digitized BPS provincial universe',()=>{
 const official=new Set(regional.provinces.map(p=>p.name));
 const gini=new Set(data.provinces.map(p=>p.name));
 assert.equal(data.provinces.length,38);
 assert.equal(gini.size,38);
 assert.deepEqual([...gini].sort(),[...official].sort());
 assert.equal(data.provinces.every(p=>typeof p.combined==='number'&&p.combined>0&&p.combined<1),true);
 assert.equal(data.provinces.every(p=>p.urban===null||(p.urban>0&&p.urban<1)),true);
 assert.equal(data.provinces.every(p=>p.rural===null||(p.rural>0&&p.rural<1)),true);
});
test('selected benchmark provinces match directly published BPS table, with missingness respected',()=>{
 const p=Object.fromEntries(data.provinces.map(x=>[x.name,x]));
 assert.equal(p['DKI Jakarta'].combined,0.435);
 assert.equal(p['DKI Jakarta'].rural,null);
 assert.equal(p['Jawa Barat'].combined,0.413);
 assert.equal(p['DI Yogyakarta'].combined,0.411);
 assert.equal(p['Kepulauan Bangka Belitung'].combined,0.214);
 assert.equal(p['Papua Selatan'].combined,0.405);
 assert.equal(p['Papua Barat Daya'].rural,0.481);
 assert.equal(p['Jawa Tengah'].combined,0.354);
 assert.equal(p['Kalimantan Utara'].combined,0.253);
});
test('all seven geographic regions are descriptive groupings only, not fabricated regional coefficients',()=>{
 const counts=Object.groupBy(data.provinces,p=>p.region);
 assert.equal(Object.keys(counts).length,7);
 assert.equal(counts.Sumatra.length,10);
 assert.equal(counts.Java.length,6);
 assert.equal(counts['Bali & Nusa Tenggara'].length,3);
 assert.equal(counts.Kalimantan.length,5);
 assert.equal(counts.Sulawesi.length,6);
 assert.equal(counts.Maluku.length,2);
 assert.equal(counts.Papua.length,6);
 assert.ok(data.notes.some(x=>/not official regional Gini/i.test(x)));
 assert.doesNotMatch(js,/national\s*=\s*.*reduce/i);
 assert.match(html,/not<\/strong> represent official Gini/);
});
test('source-based explorer supports whole population urban rural and missing data, with no invented historic province series',()=>{
 assert.match(js,/for\(const type of \['combined','urban','rural'\]\)/);
 assert.match(js,/f\(p\[field\]\)/);
 assert.match(js,/p\[metric\]/);
 assert.match(js,/median/i);
 assert.match(js,/Province|province/);
 assert.doesNotMatch(JSON.stringify(data.provinces),/"history"/);
 assert.match(js,/data\/sli-bps-gini-2026\.json/);
 assert.match(js,/Source|source|publication/);
 assert.doesNotThrow(()=>new Function(js));
});
test('main SLI, Indonesia Regional Data and provincial model all link to detailed Gini explorer',()=>{
 for(const page of [main,indonesia,file('provincial-opportunity-engine.html')])assert.match(page,/gini-inequality\.html/);
 assert.match(html,/sli-bps-gini-explorer\.js/);
 for(const name of ['giniNational','giniUrban','giniRural','regionOverview','provinceRows','provinceDetail','nationalHistory','area','region','sort','search','export','sourceLinks']){
  assert.match(html,new RegExp('id="'+name+'"'));
 }
 assert.match(indonesia,/0\.368/);
});
test('measurement limitations and BPS source licensing caution are visible to users',()=>{
 assert.match(html,/expenditure—not wealth or income/);
 assert.match(html,/national Gini is.*not.*calculated by averaging provincial coefficients/);
 assert.match(html,/source.*BPS|BPS.*source/i);
 assert.match(html,/commercial data licensing/);
 assert.match(html,/new-Papua/i);
 assert.match(data.notes.join(' '),/not a welfare or purchasing-power index/i);
});
