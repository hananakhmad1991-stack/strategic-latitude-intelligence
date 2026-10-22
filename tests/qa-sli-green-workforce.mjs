import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const data=JSON.parse(read('data/sli-green-workforce-projections.json'));
test('Bappenas 2025 scenario dataset retains source and audit flags',()=>{
 assert.equal(data.schema,'sli-green-workforce-projections-v1');
 assert.equal(data.status,'source_transcription_pending_independent_visual_qa');
 assert.deepEqual(data.years,[2025,2026,2027,2028,2029]);
 assert.equal(data.sectors.length,17);
 assert.deepEqual(data.source_tables,['Tabel 3','Tabel 4','Tabel 5','Tabel 6']);
 for(const key of ['low','moderate','high']){
  const scenario=data.scenarios[key];
  assert.equal(scenario.total.length,5);
  assert.equal(scenario.sector_rows.length,17);
  assert.equal(new Set(scenario.sector_rows.map(x=>x.sector_id)).size,17);
  for(const row of scenario.sector_rows){assert.equal(row.values.length,5);assert.ok(row.values.every(x=>Number.isInteger(x)&&x>=0));}
  assert.equal(scenario.subtotal_differences.length,5);
  for(let i=0;i<5;i++)assert.equal(scenario.sector_rows.reduce((sum,r)=>sum+r.values[i],0)-scenario.total[i],scenario.subtotal_differences[i]);
 }
 assert.equal(data.scenarios.moderate.total[4],5011918);
});
test('dashboard is navigable and responsive with explicit projection caveats',()=>{
 const page=read('green-workforce-intelligence.html');
 assert.match(page,/name="viewport"/);
 assert.match(page,/@media\(max-width:750px\)/);
 assert.match(page,/sli-green-workforce-projections\.js/);
 assert.match(page,/bukan realisasi/);
 assert.match(page,/peninjauan hak penggunaan/);
 assert.match(read('index.html'),/green-workforce-intelligence\.html/);
 assert.match(read('indonesia-macroeconomic-intelligence.html'),/green-workforce-intelligence\.html/);
 new Script(read('js/sli-green-workforce-projections.js'));
});

test('sector entry points preserve source caveats and canonical module ownership',()=>{
 const nav=read('js/sli-navigation.js');
 assert.match(nav,/greenworkforce:\[/);
 assert.match(nav,/green-workforce-intelligence\\.html/);
 for(const page of ['food-agriculture-intelligence.html','marine-fisheries-intelligence.html','pln-electricity-statistics.html']){
  const source=read(page);
  assert.match(source,/class="sli-green-sector-link"/,page+' missing contextual module');
  assert.match(source,/green-workforce-intelligence\\.html/,page+' missing link');
  assert.match(source,/bukan realisasi pekerjaan per sektor/,page+' missing scenario disclaimer');
 }
 const home=read('index.html');
 assert.match(home,/aria-label="Green Workforce Intelligence dashboard"/);
 assert.match(home,/Bappenas 2025–2029 employment projections/);
});
