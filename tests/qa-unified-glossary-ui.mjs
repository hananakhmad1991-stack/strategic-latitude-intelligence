// End-to-end DOM smoke tests for shared appendix and canonical sector filters.
// This test uses one canonical JSON file: no duplicated mocked glossary content.
import {readFileSync} from 'node:fs';
import {strict as assert} from 'node:assert';
import {JSDOM} from 'jsdom';
const json=JSON.parse(readFileSync('data/sli-unified-glossary.json','utf8'));
const js=readFileSync('js/sli-shared-appendix.js','utf8');
const delay=t=>new Promise(resolve=>setTimeout(resolve,t));
function env(url,html){
 const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true});
 dom.window.fetch=async ()=>({ok:true,json:async()=>json});
 dom.window.SLIi18n={language:'en'};
 dom.window.eval(js);
 dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded',{bubbles:true}));
 return dom;
}
{
 const d=env('https://example.com/sli-glossary-methodology.html?domain=ai','<!doctype html><html><head></head><body><main><div id="sliGlossaryMain"></div></main></body></html>');
 await delay(40);
 const doc=d.window.document;
 assert(doc.querySelector('#sli-dict-domain'));
 assert.equal(doc.querySelector('#sli-dict-domain').value,'ai');
 assert(doc.querySelectorAll('.sli-dict-row').length>0);
 const term=doc.querySelector('#sli-dict-search');
 term.value='GPU';
 term.dispatchEvent(new d.window.Event('input',{bubbles:true}));
 await delay(5);
 assert(doc.querySelector('#term-gpu'));
 assert(doc.querySelector('#term-gpu .sli-dict-row')===null);
 assert(doc.querySelector('#term-gpu h3').textContent==='GPU');
 const unique=[...doc.querySelectorAll('.sli-dict-row h3')].map(x=>x.textContent);
 assert.equal(new Set(unique).size,unique.length);
 d.window.close();
}
{
 const d=env('https://example.com/sli-glossary-methodology.html?domain=electricity#term-mw-vs-mva','<!doctype html><html><head></head><body><main><div id="sliGlossaryMain"></div></main></body></html>');
 await delay(40);
 assert(d.window.document.querySelector('#term-mw-vs-mva'));
 assert(d.window.document.querySelector('#sli-dict-search').value==='MW vs MVA');
 d.window.close();
}
{
 const d=env('https://example.com/index.html#overview','<!doctype html><html><head></head><body><main><div id="content"></div></main></body></html>');
 await delay(40);
 const doc=d.window.document;
 let compact=doc.querySelector('#sliSharedAppendixBar');
 assert(compact);
 assert(compact.querySelector('a[href*="sli-glossary-methodology.html"]'));
 assert(compact.querySelector('a[href*="domain=macro"]'));
 d.window.location.hash='#map';
 doc.querySelector('#content').innerHTML='';
 doc.dispatchEvent(new d.window.CustomEvent('sli:pagechange',{detail:{page:'map'}}));
 await delay(40);
 compact=doc.querySelector('#sliSharedAppendixBar');
 assert(compact);
 assert(compact.textContent.includes('coordinate'));
 assert(compact.querySelector('a[href*="domain=maps"]'));
 d.window.location.hash='#energy';
 doc.querySelector('#content').innerHTML='<div id="energyAppendixRoot"></div>';
 doc.dispatchEvent(new d.window.CustomEvent('sli:pagechange',{detail:{page:'energy'}}));
 await delay(30);
 assert(!doc.querySelector('#sliSharedAppendixBar'),'Energy tab has one dedicated short appendix, not a duplicate');
 d.window.close();
}
console.log('PASS appendix browser DOM smoke: canonical glossary filters, term deep link, SPA routing and energy nonduplication');
