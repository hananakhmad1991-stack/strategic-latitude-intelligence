import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const d=JSON.parse(fs.readFileSync('data/iea-2026-workbook-dashboard.json','utf8'));
const old=JSON.parse(fs.readFileSync('data/iea-indonesia-critical-minerals.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const research=fs.readFileSync('js/research-chapters.js','utf8');
const script=fs.readFileSync('js/iea-2026-explorer.js','utf8');
const css=fs.readFileSync('css/iea-2026-explorer.css','utf8');
assert.equal(d.license,'CC BY 4.0');
assert.match(d.source,/^https:\/\/www\.iea\.org\//);
assert.equal(Object.keys(d.minerals).length,37,'all 37 energy transition minerals covered');
assert.equal(Object.keys(d.supply).length,6,'six commodity mine/refining country tables');
assert.equal(Object.keys(d.technologies).length,6,'six sector demand groups');
assert.deepEqual(d.demand_columns,['2025','STEPS 2030','STEPS 2040','HDS 2040']);
assert.deepEqual(d.supply_columns,['2025','2030 base','2040 base']);
assert.deepEqual(d.supply.Nickel.mining.world,[4207,5098,4858]);
assert.deepEqual(d.supply.Nickel.refining.world,[3729,4231,4159]);
assert.deepEqual(d.supply.Nickel.mining.leaders.find(x=>x[0]==='Indonesia'),['Indonesia',2637,3567,3568]);
assert.deepEqual(d.supply.Nickel.refining.leaders.find(x=>x[0]==='Indonesia'),['Indonesia',1681,2080,2081]);
assert.deepEqual(d.supply.Cobalt.mining.leaders.find(x=>x[0]==='Indonesia'),['Indonesia',48.3,69.1,66.8]);
assert.deepEqual(d.supply.Graphite.refining.leaders.find(x=>x[0]==='Indonesia'),['Indonesia',32,92.7,103]);
assert.deepEqual(d.minerals.Nickel,[625,1409,2403,3253]);
assert.deepEqual(d.technologies['Electric vehicles'].find(x=>x[0]==='Nickel'),['Nickel',439,989,1851,2500]);
assert.deepEqual(d.technologies['Battery storage'].find(x=>x[0]==='Nickel'),['Nickel',27.6,71.4,199,264]);
for(const [name,arr] of Object.entries(d.minerals)){assert.equal(arr.length,4,name);assert.ok(arr.every(x=>typeof x==='number'&&Number.isFinite(x)),name+' values');}
for(const [name,stages] of Object.entries(d.supply)){
 for(const step of ['mining','refining']){
  assert.equal(stages[step].world.length,3,name+' '+step);
  for(const r of stages[step].leaders){assert.equal(r.length,4);assert.ok(r.slice(1).every(x=>x>=0));}
 }
}
assert.match(d.caveat,/model|conditional|scenario|2025/i);
assert.equal(old.workbook_ingestion.status,'parsed_and_integrated');
assert.match(html,/js\/iea-2026-explorer\.js\?v=/);
assert.match(html,/css\/iea-2026-explorer\.css\?v=/);
assert.ok(html.indexOf('js/iea-2026-explorer.js')<html.indexOf('js/research-chapters.js'),'loaded before chapter');
assert.match(html,/id="sliIEA2026EnergyRoot"/);
assert.match(html,/initSLIIEA2026Explorer\?\.\('energy','sliIEA2026EnergyRoot'\)/);
assert.match(research,/initSLIIEA2026Explorer\("minerals",rawIEA\)/);
assert.ok(css.includes('@media')&&css.includes('.iea26-matrix'));
const ctx={window:{},document:{},console};vm.runInNewContext(script,ctx,{filename:'iea-2026-explorer.js'});
assert.equal(typeof ctx.window.initSLIIEA2026Explorer,'function');
console.log('PASS: User IEA workbook July 2026, 37 minerals, 6 country supply chains, 6 technology end-uses, provenance, economic vs world denominator, energy and minerals mount');
