import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const dir='data/cross-source-policy-2026.json';
const d=JSON.parse(fs.readFileSync(dir,'utf8'));
const html=fs.readFileSync('index.html','utf8');
const research=fs.readFileSync('js/research-chapters.js','utf8');
const source=fs.readFileSync('js/source-data-bridge.js','utf8');
assert.ok(html.includes('js/source-data-bridge.js?v='),'new data module must be loaded');
assert.ok(html.includes('css/source-data-bridge.css?v='),'source styles loaded');
for(const marker of ['sliSourceEnergyRoot','sliSourceInvestmentRoot','sliSourceOverviewRoot'])
 assert.ok(html.includes(marker),'missing dashboard mounting point '+marker);
assert.ok(html.includes("initSLISourceBridge?.('energy','sliSourceEnergyRoot')"));
assert.ok(html.includes("initSLISourceBridge('investment','sliSourceInvestmentRoot')"));
assert.ok(html.includes("initSLISourceBridge('overview','sliSourceOverviewRoot')"));
assert.ok(research.includes('initSLISourceBridge(which,sourceMount)'),'specialist mineral and AI economics page should mount');
assert.ok(research.includes('initSLISourceBridge("policy",policyEvidence)'),'policy risk should retain official investment and energy source provenance');
assert.ok(source.includes('scope==="World"'),'world metrics must not appear as Indonesian statistics');
assert.ok(d.reviewed_at&&d.licensing.includes('non-CC'),'explicit IEA data license warning');
assert.ok(d.bkpm.raw_import_status.includes('not directly retrievable'),'do not invent raw provincial data');
const books={bkpm:d.bkpm.quarterly_kpis,esdm:d.esdm.items,iea:d.iea.items};
const get=(p,id)=>books[p].find(x=>x.id===id);
assert.equal(get('bkpm','h1-realized').value,1010.6);
assert.equal(get('bkpm','q2-realized').value,511.8);
assert.equal(get('bkpm','h1-workers').value,1448862);
assert.equal(get('bkpm','target-2026').kind,'target');
assert.equal(get('esdm','esdm-investment-total').value,31.96);
const parts=['esdm-oil-gas','esdm-minerba','esdm-electricity','esdm-renewables'];
assert.ok(Math.abs(parts.reduce((s,id)=>s+get('esdm',id).value,0)-31.96)<0.00001,'ESDM component sum');
assert.equal(get('esdm','esdm-security-index').value,7.04);
assert.equal(get('esdm','esdm-security-index').kind,'provisional');
assert.equal(get('esdm','esdm-ebt-oct').period,'2025-10');
assert.equal(get('iea','iea-energy-growth').value,1.3);
assert.equal(get('iea','iea-renewables-new').value,800);
assert.equal(get('iea','iea-data-centers-growth').value,17);
assert.equal(get('iea','iea-ev-global-sales').operator,'>');
for(const [p,arr] of Object.entries(books))for(const x of arr){
 assert.ok(x.id&&x.label&&Number.isFinite(x.value)&&x.unit,'bad sourced value '+x.id);
 assert.ok(/^https:\/\//.test(x.source_url),'no primary source '+x.id);
 assert.ok(x.description&&x.description.length>25,'metric requires source/unit/definition '+x.id);
 if(p==='iea')assert.equal(x.scope,'World','IEA world metrics cannot be labelled as Indonesian');
}
for(const [where,refs] of Object.entries(d.groups)){
 for(const [source,ids] of Object.entries(refs)){
  assert.ok(books[source],source);
  for(const id of ids)assert.ok(get(source,id),'unsourced '+where+' reference '+id);
 }
}
const ctx={window:{SLIi18n:{language:'en'}},document:{},console};
vm.runInNewContext(source,ctx,{filename:'source-data-bridge.js'});
assert.equal(typeof ctx.window.initSLISourceBridge,'function');
console.log('PASS: Official 2026 BKPM, ESDM 2025 and IEA 2025 cross-sector sources, licensing, units, period isolation and six mounts');
