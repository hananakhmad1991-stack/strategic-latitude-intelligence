import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const catalogue=JSON.parse(read('data/sli-policy-source-coverage.json'));
const graph=JSON.parse(read('data/sli-policy-regulatory-graph-2026.json'));
const monitor=JSON.parse(read('data/regulatory-monitor.json'));

test('Province and municipal JDIH catalogue separates official source discovery from exhaustive law indexing',()=>{
 assert.equal(catalogue.provinces.length,38);
 assert.ok(catalogue.provinces.filter(p=>p.source_url).length>=29);
 assert.ok(catalogue.provinces.filter(p=>!p.source_url).length>0,'Never imply all JDIHs were recovered');
 assert.ok(catalogue.local_government_sources.length>=4);
 for(const local of catalogue.local_government_sources) {
  assert.match(local.source_url,/^https:\/\//);
  assert.ok(local.verification_scope);
 }
 const central=graph.nodes.find(x=>x.id==='perda_jateng_rtrw2024');
 const kab=graph.nodes.find(x=>x.id==='perda_magelang_rtrw2024');
 const archive=graph.nodes.find(x=>x.id==='perda_magelang_rtrwold2011');
 assert.equal(central.region,'Jawa Tengah');
 assert.equal(kab.tier,'perda_kab');
 assert.equal(archive.status,'repealed');
});

test('Reader renders provenance-aware 38-province and separate locality coverage without inventing completion',async()=>{
 const els=new Map();
 const get=id=>{if(!els.has(id))els.set(id,{id,textContent:'',innerHTML:''});return els.get(id)};
 const doc={getElementById:get,addEventListener(type,handler){if(type==='DOMContentLoaded')this.start=handler}};
 const code=read('js/sli-policy-coverage.js');
 vm.runInNewContext(code,{document:doc,console,fetch:async url=>({
  ok:true,json:async()=>url.includes('policy-source-coverage')?catalogue:url.includes('regulatory-monitor')?monitor:graph
 })});
 assert.equal(typeof doc.start,'function');
 doc.start();
 await new Promise(resolve=>setImmediate(resolve));
 assert.match(get('policyCoverageSummary').textContent,/38 provinsi/);
 assert.match(get('policyCoverageSummary').textContent,/29 portal/);
 assert.match(get('policyCoverageTable').innerHTML,/Lampung/);
 assert.match(get('policyLocalCoverageSummary').textContent,/4 sumber kabupaten\/kota/);
 assert.match(get('policyLocalCoverageTable').innerHTML,/Kabupaten Magelang/);
 assert.match(get('policyLocalCoverageTable').innerHTML,/noopener noreferrer/);
 assert.doesNotMatch(get('policyLocalCoverageSummary').textContent,/semua perda/i);
});
