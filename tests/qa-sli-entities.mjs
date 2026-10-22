import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const data=JSON.parse(read('data/sector-command-hierarchy.json'));
const projects=JSON.parse(read('data/sli-project-registry.json'));
const home=read('index.html'),page=read('sli-entities.html');
const navigation=read('js/sli-navigation.js');
const identities=read('js/sli-entity-identity.js');
test('Entity catalogue uses actual reviewed source registers, not copied synthetic counts',()=>{
 assert.ok(Object.keys(data.sectors).includes('minerals'));
 assert.ok(Object.keys(data.sectors).includes('ai'));
 assert.ok(data.sectors.minerals.nodes.length>=20);
 assert.ok(data.sectors.ai.nodes.length>=20);
 assert.ok(projects.records.length>=3);
 assert.match(read('js/sli-entities.js'),/data\/sector-command-hierarchy\.json/);
 assert.match(read('js/sli-entities.js'),/data\/sli-project-registry\.json/);
 assert.match(read('js/sli-entities.js'),/reported_amount/);
 assert.match(read('js/sli-entities.js'),/actual_capex/);
 for(const p of projects.records){assert.ok(p.source_url?.startsWith('https://'),'Project lacking verified source: '+p.id)}
});
test('Clear provenance, accessible source-linked UI and no user-entered HTML injection',()=>{
 for(const k of ['id="sliEntitySearch"','id="sliEntityType"','id="sliEntitySector"','id="sliEntityCards"','id="sliEntityDetail"','id="sliEntityExport"','aria-live="polite"'])assert.ok(page.includes(k),k);
 for(const p of ['css/sli-entities.css','css/sli-entity-identity.css','js/sli-entities.js','js/sli-entity-identity.js'])assert.ok(existsSync(new URL('../'+p,import.meta.url)),p);
 assert.doesNotMatch(read('js/sli-entities.js'),/\.innerHTML\s*=/);
 assert.match(read('js/sli-entities.js'),/textContent/);
 assert.ok(read('js/sli-entities.js').includes('replace(/"/g')); // CSV quote escaping
 assert.match(page,/Wikipedia bukan bukti pejabat masih menjabat/);
});
test('Public links never silently guess biographies, and full page has source qualifiers',()=>{
 const window={};const document={readyState:'loading',addEventListener(){}};
 vm.runInNewContext(identities,{window,document,URL},{filename:'sli-entity-identity.js'});
 const lib=window.SLIEntityIdentity;
 assert.equal(lib.safeProfile('Bahlil Lahadalia','https://www.esdm.go.id/').kind,'wikipedia');
 assert.equal(lib.safeProfile('Random Identical Name','https://www.esdm.go.id/').kind,'official-source');
 assert.equal(lib.safeProfile('Another Person','http://example.com').url,null);
 assert.equal(lib.website('Ministry of Energy & Mineral Resources · ESDM'),'https://esdm.go.id/');
 assert.equal(lib.website('Unrelated News Actor'),null);
 assert.match(identities,/noopener noreferrer/);
});
test('Navigation adds one dedicated directory without hiding legacy sector dashboards',()=>{
 assert.match(navigation,/entities:\['Entity Intelligence/);
 assert.match(home,/href="\.\/sli-entities\.html"/);
 assert.match(navigation,/sli-nav-compact/);
 assert.match(read('css/sli-entity-identity.css'),/\.sli-universal-nav\.sli-nav-compact/);
 assert.match(read('js/sector-command-hierarchy.js'),/personLink\(a\.person,a\.source\)/);
 assert.match(read('js/sli-research-ai.js'),/if\(!state\.last\?\.summary\)return/);
});

test('Broad company directory is diversified, traceable and honest about provisional IDX metadata',()=>{
 const issuer=JSON.parse(read('data/sli-idx-issuer-universe.json'));
 const corp=JSON.parse(read('data/sli-corporate-group-registry.json'));
 assert.equal(issuer.schema,'sli-idx-issuer-universe-v1');
 assert.ok(issuer.records.length>=250);
 assert.ok(new Set(issuer.records.map(x=>x.ticker)).size===issuer.records.length,'No duplicate ticker IDs');
 assert.ok(new Set(issuer.records.map(x=>x.sector)).size>=12,'Cover strategic and general economy sectors');
 for(const e of issuer.records){
  assert.match(e.ticker,/^[A-Z0-9]{4}$/);
  assert.ok(e.name&&e.sector&&e.source_url.startsWith('https://www.idx.co.id/'));
  assert.equal(e.market_cap,null);
  assert.ok(['idx_seed_awaiting_official_refresh','official_exchange_snapshot','official_ksei_security_listing'].includes(e.verification));
  if(e.verification==='official_ksei_security_listing')assert.equal(e.listing_source_url,'https://web.ksei.co.id/services/registered-securities/shares/lc/'+e.ticker);
 }
 const overlap=new Set(corp.records.filter(x=>x.exchange==='IDX').map(x=>x.ticker));
 const distinct=issuer.records.length+corp.records.length-issuer.records.filter(x=>overlap.has(x.ticker)).length;
 assert.ok(distinct>=350,'At least 350 distinct corporate registry and IDX ticker records');
 assert.match(page,/id="sliEntityMore"/);
 assert.match(page,/id="sliIssuerDirectory"/);
 assert.match(page,/id="sliEntityCoverage"/);
 const js=read('js/sli-entities.js');
 assert.match(js,/function fromIssuerUniverse/);
 assert.match(js,/a\.corporate\?\.exchange==='IDX'/);
 assert.match(js,/displayLimit\+=100/);
 assert.match(js,/fromIssuerUniverse\(await response\.json\(\)\)/);
 assert.doesNotMatch(js,/for\(const a of visible\.slice\(0,160\)\)/);
});
