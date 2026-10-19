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
