import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('SLI homepage clearly describes connected research rather than endless dashboard search',()=>{
 const home=read('index.html');
 assert.match(home,/Find the expertise to act/);
 assert.match(home,/Temukan pakar untuk bertindak/);
 assert.doesNotMatch(home,/without searching through an endless dashboard/);
 for(const link of ['#sliPortalSectors','./provincial-intelligence.html','./sli-entities.html','./sli-sector-data-library.html']){
  assert.ok(home.includes('href="'+link+'"'),link);
 }
 for(const expected of ['sli-service-path','01 · INTELLIGENCE','02 · DERGUBA AI','03 · EXPERT CONNECT','no pre-enrolled expert panel','editable inquiry'])assert.ok(home.includes(expected),expected);
 assert.match(home,/sliPortalMetrics/);
 assert.match(home,/sliOrbitGlobe/);
});
test('shared navigation follows source evidence to user analysis and remains bilingual',()=>{
 const nav=read('js/sli-navigation.js');
 for(const label of ['Research journey','Alur riset','Original sources','Sumber asli','Companies & actors','Perusahaan & aktor']){
  assert.ok(nav.includes(label),label);
 }
 assert.match(read('css/sli-navigation.css'),/sli-research-path/);
});
