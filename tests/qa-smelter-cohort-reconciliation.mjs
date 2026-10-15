import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const d=JSON.parse(fs.readFileSync('data/strategic-map-smelter-2026.json','utf8'));
const a=d.academic_nickel_baseline;
assert.equal(a.reported,147);
assert.equal(a.operation,54);assert.equal(a.construction,38);assert.equal(a.planning,55);
assert.equal(a.technology.length,2);
assert.equal(a.technology.reduce((s,x)=>s+x.total,0),147);
for(const field of ['operating','construction','planning'])
 assert.equal(a.technology.reduce((s,x)=>s+x[field],0),{operating:54,construction:38,planning:55}[field]);
assert.equal(d.official_2024.reported,15);
assert.equal(d.official_2024.commodities.reduce((s,x)=>s+x.total,0),15);
assert.equal(d.official_baseline.reported,28);
assert.equal(d.official_baseline.by_commodity.reduce((s,x)=>s+x.total,0),28);
assert.equal(d.official_baseline.by_commodity.reduce((s,x)=>s+x.operating,0),13);
const legacy=JSON.parse(fs.readFileSync('data/strategic-map-biofuel-smelters.json','utf8')).records.filter(x=>/smelter|processing/i.test(x.group||""));
const aliases=d.records.filter(x=>x.original_id);
assert.ok(aliases.every(x=>legacy.some(y=>y.id===x.original_id)),'Unknown legacy cross-reference');
const named=legacy.length+d.records.length-aliases.length;
assert.equal(named,54,'No aggregate-only placeholders inserted for 147 historical nickel units');
assert.equal(new Set(d.records.map(x=>x.id)).size,d.records.length,'No duplicate new names');
for(const row of d.records){
 assert.ok(row.id&&row.name&&row.region&&/^https:\/\//.test(row.source));
 if(row.province===null)assert.match(row.location_precision,/unverified|unknown/i,'Unknown coordinates must remain unknown');
}
const html=fs.readFileSync('index.html','utf8');
assert.ok(html.includes('smelter-cohort-reconciliation.js?'));
assert.ok(html.includes('smelter-cohort-reconciliation.css?'));
assert.ok(fs.readFileSync('js/research-chapters.js','utf8').includes('initSLISmelterCohort(sections[2])'));
assert.match(fs.readFileSync('js/strategic-map.js','utf8'),/SMELTER INVENTORY RECONCILIATION/);
const script=fs.readFileSync('js/smelter-cohort-reconciliation.js','utf8');
const window={};vm.runInNewContext(script,{window,document:{}});
assert.equal(typeof window.initSLISmelterCohort,'function');
console.log('PASS: 147 historical nickel projects, 15/28 ESDM perimeter, 54 named dossiers, no phantom 2026 GPS');
