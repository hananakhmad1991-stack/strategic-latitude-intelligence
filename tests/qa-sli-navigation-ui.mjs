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
 assert.equal(doc.querySelectorAll('.sli-research-step').length,5,'Every page should expose one source-linked research journey');
 assert.ok(doc.querySelector('.sli-research-step[href="./sli-sector-data-library.html"]'));

 assert.match(doc.querySelector('.sli-location strong').textContent,/Home/);
 assert.ok(doc.querySelector('.sli-universal-actions a[href="./sli-user-guide.html"]'));
 assert.ok(doc.querySelector('.sli-universal-actions a[href="./sli-glossary-methodology.html"]'));
 assert.equal(doc.querySelectorAll('.sli-platform-explorer').length,1,'One canonical Explore Data menu must serve the site');
 assert.ok(doc.querySelector('.sli-platform-sector-menu a[href="./provincial-intelligence.html"]'));
 assert.equal(doc.querySelectorAll('.sli-platform-sector-group').length,8,'All eight canonical sector families, including Marine & Fisheries, must remain discoverable');
 assert.equal(doc.querySelectorAll('.sli-explore-quick-link').length,5,'Offer five task-oriented starting points before specialist modules');
 assert.ok(doc.querySelector('.sli-explore-quick-link[href="./sli-sector-data-library.html"]'),'Evidence pathway should be immediately discoverable');
 assert.ok(doc.querySelector('.sli-explore-quick-link[href="./sli-entities.html"]'),'Company research pathway should be immediately discoverable');

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
