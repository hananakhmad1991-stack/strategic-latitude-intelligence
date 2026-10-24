import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const code=readFileSync(new URL('../js/sli-navigation.js',import.meta.url),'utf8');
function setup(path,markup){
 const dom=new JSDOM('<!doctype html><html lang="en"><head></head><body>'+markup+'</body></html>',{
  url:'https://example.org/strategic-latitude-intelligence/'+path,runScripts:'outside-only',pretendToBeVisual:true});
 dom.window.SLIi18n={language:'en'};
 dom.window.eval(code);
 dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded',{bubbles:true}));
 return dom;
}
test('Home has one stable breadcrumb, detailed sector links and live route change',()=>{
 const d=setup('index.html#home','<main class="main"><div class="top">Existing header</div><div id="content"></div></main>');
 const doc=d.window.document;
 assert.equal(doc.querySelectorAll('#sliUniversalNavigation').length,1);
 assert.match(doc.querySelector('.sli-location strong').textContent,/Home/);
 assert.ok(doc.querySelector('.sli-universal-actions a[href="./sli-user-guide.html"]'));
 assert.ok(doc.querySelector('.sli-universal-actions a[href="./sli-glossary-methodology.html"]'));
 assert.equal(doc.querySelectorAll('.sli-platform-explorer').length,1,'One canonical Explore Data menu must serve the site');
 assert.ok(doc.querySelector('.sli-platform-sector-menu a[href="./provincial-intelligence.html"]'));
 assert.equal(doc.querySelectorAll('.sli-platform-sector-group').length,8,'All eight canonical sector families, including Marine & Fisheries, must remain discoverable');
 assert.ok([...doc.querySelectorAll('.sli-platform-sector-heading')].some(x=>/Marine|Fisheries|Kelautan|Perikanan/i.test(x.textContent)),'Marine & Fisheries family missing');
 assert.equal(doc.querySelectorAll('.sli-explore-menu').length,0,'Remove legacy duplicate explorer');
 d.window.location.hash='#energy';
 doc.dispatchEvent(new d.window.CustomEvent('sli:pagechange',{detail:{page:'energy'}}));
 assert.match(doc.querySelector('.sli-location strong').textContent,/Energy Security/);
 assert.ok(doc.querySelector('.sli-related-links a[href="./pln-electricity-statistics.html"]'));
 assert.equal(doc.querySelectorAll('#sliUniversalNavigation').length,1);
 d.window.SLIi18n.language='id';
 doc.dispatchEvent(new d.window.CustomEvent('sli:languagechange'));
 assert.match(doc.querySelector('.sli-location strong').textContent,/Ketahanan Energi/);
 assert.ok(doc.querySelector('.sli-universal-actions').textContent.includes('Panduan pemakaian'));
 d.window.close();
});
test('specialist page exposes a compact cross-dashboard route, without replacing its content',()=>{
 const d=setup('gini-inequality.html','<main><header><h1>Gini Ratio Explorer</h1></header><section id="data">Original data</section></main>');
 const doc=d.window.document;
 assert.equal(doc.querySelectorAll('#sliUniversalNavigation').length,1);
 assert.match(doc.querySelector('.sli-location strong').textContent,/Gini Ratio/);
 assert.ok(doc.querySelector('#data')?.textContent.includes('Original data'));
 assert.ok(doc.querySelector('.sli-related-links a[href="./provincial-intelligence.html"]'));
 d.window.close();
});
test('guide renders the catalog as real linked, grouped and bilingual modules',()=>{
 const d=setup('sli-user-guide.html','<main><header><h1>How to use SLI</h1></header><section id="sliGuideCatalog"></section></main>');
 const doc=d.window.document;
 assert.equal(doc.querySelectorAll('.sli-guide-group').length,8,'The guide must cover all eight SLI module groups');
 assert.ok([...doc.querySelectorAll('.sli-guide-group h3')].some(x=>/Marine|Fisheries|Kelautan|Perikanan/i.test(x.textContent)),'Marine & Fisheries guide group missing');
 assert.ok(doc.querySelectorAll('.sli-guide-card').length>=20);
 assert.ok(doc.querySelector('a[href="./index.html#home"]'));
 assert.equal(doc.querySelectorAll('.sli-platform-links a[href="./index.html#overview"]').length,0);
 assert.ok(doc.querySelector('.sli-guide-cards a[href="./sli-data-automation-center.html"]'));
 d.window.SLIi18n.language='id';
 doc.dispatchEvent(new d.window.CustomEvent('sli:languagechange'));
 assert.ok(doc.querySelector('#sliGuideCatalog').textContent.includes('Panduan pengguna'));
 d.window.close();
});

test('DERGUBA AI and Expert Connect are adjacent, visible top-level quick actions, including on Home',()=>{
 const paths=['index.html#home','gini-inequality.html'];
 for(const path of paths){
  const d=setup(path,'<main class="main"><div class="top">Header</div><div id="content"></div></main>');
  const doc=d.window.document;
  const quick=doc.querySelector('#sliPlatformMast .sli-platform-tools > nav.sli-platform-quicklinks');
  assert.ok(quick,'Quick-access research pair must render in top header: '+path);
  assert.deepEqual([...quick.querySelectorAll('a')].slice(0,2).map(a=>a.getAttribute('href')),[
   './sli-research-ai.html','./sli-expert-connect.html'
  ],'Research AI and Expert Connect must be adjacent in one row');
  assert.equal(doc.querySelectorAll('a.sli-platform-link[href="./sli-expert-connect.html"]').length,1,'No duplicate Expert Connect in scroll navigation');
  assert.equal(quick.parentElement.classList.contains('sli-platform-tools'),true);
  d.window.SLIi18n.language='id';
  doc.dispatchEvent(new d.window.CustomEvent('sli:languagechange'));
  assert.match(doc.querySelector('.sli-platform-quicklinks').textContent,/Carikan Pakar/);
  d.window.close();
 }
 const home=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(home.includes('sli-navigation.js?v=20261024-audit-nav1'),'Home must cache-bust top nav JS');
 assert.ok(home.includes('sli-navigation.css?v=20261024-audit-touch1'),'Home must cache-bust top nav CSS');
});

test('Expert Connect uses its own compact navigation and never injects off-topic OSINT',()=>{
 const d=setup('sli-expert-connect.html','<main id="sliExpertMain"><header class="sli-expert-header"><nav><a href="./index.html#home">Home</a><a href="./sli-research-ai.html">DERGUBA AI</a></nav></header><section class="sli-expert-hero"><h1 id="expertTitle">Expert Connect</h1></section></main>');
 const doc=d.window.document;
 assert.equal(doc.querySelectorAll('#sliUniversalNavigation').length,0,'No six-link universal breadcrumb before the research hero');
 assert.equal(doc.querySelectorAll('#sliPlatformMast').length,0,'Use the dedicated service landing header');
 assert.equal(doc.querySelectorAll('#sliSecondaryEvidenceLoader').length,0,'No secondary-news widget request on service pages');
 assert.ok(doc.querySelector('#expertTitle')?.textContent.includes('Expert Connect'),'Original landing content remains');
 assert.ok(doc.querySelector('.sli-expert-header a[href="./sli-research-ai.html"]'),'DERGUBA remains reachable from the compact header');
 d.window.close();
});
