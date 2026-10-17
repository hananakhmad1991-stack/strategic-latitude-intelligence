import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('geopolitical-impact-assessment.html'),script=read('js/sli-gia-v2.js');
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this.handlers={};this.dataset={};this._text='';this.value='';this.style={};this.hidden=false;this.disabled=false;}
 get textContent(){return this._text+this.children.map(x=>x.textContent||'').join('')}
 set textContent(x){this._text=String(x);this.children=[]}
 append(...items){this.children.push(...items)}
 replaceChildren(...items){this.children=[...items];this._text=''}
 setAttribute(k,v){this.attrs[k]=String(v)}
 addEventListener(k,handler){(this.handlers[k]??=[]).push(handler)}
 fire(type,extra={}){for(const cb of this.handlers[type]||[])cb(extra)}
 click(){this.fire('click')}
 scrollIntoView(){}
 remove(){}
}
async function page(){
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);const els=Object.fromEntries(ids.map(x=>[x,new Element(x)]));
 const doc={getElementById:k=>els[k],querySelectorAll:()=>[],createElement:tag=>new Element(tag),createElementNS:(_ns,tag)=>new Element(tag),body:new Element('body')};
 const ctx={document:doc,window:{},fetch:async url=>{const p=url.replace(/^\.\//,'');if(p.includes('raw.githubusercontent.com'))throw Error('Network unavailable');const contents={ 'data/sli-gia-v2-config.json':read('data/sli-gia-v2-config.json'),'data/research-signal-radar.json':read('data/research-signal-radar.json'),'data/sli-gia-world-110m.geojson':read('data/sli-gia-world-110m.geojson')};return {ok:!!contents[p],status:contents[p]?200:404,json:async()=>JSON.parse(contents[p])}},Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout:fn=>fn(),Date,Intl,Number,Math,console};
 ctx.window=ctx;runInNewContext(read('js/sli-gia-v2-engine.js'),ctx);runInNewContext(script,ctx);
 for(let i=0;i<90;i++)await Promise.resolve();
 return els;
}
test('GIA renders a risk proxy, scenario financials, country map fallback and source-dated news',async()=>{
 const els=await page();
 assert.match(els.riskScore.textContent,/43.5/);
 assert.match(els.expectedLoss.textContent,/6.3/);
 assert.match(els.var95.textContent,/15/);
 assert.equal(els.mapPins.children.filter(x=>x.tag==='circle').length,17);
 assert.equal(els.mapShapes.children.length,177);
 assert.match(els.sourceWatchStatus.textContent,/SOURCE WATCH/);
 assert.match(els.mapStatus.textContent,/Natural Earth boundary map loaded/i);
 assert.equal(els.newsItems.children.length,12);
 assert.match(els.feedCount.textContent,/\d+/);
});
test('editing analyst risk inputs updates a conditional alert, not a verified geopolitical index',async()=>{
 const els=await page();
 els.macroRisk.value='90';els.mesoRisk.value='90';els.microRisk.value='90';els.macroRisk.fire('input');
 assert.match(els.riskScore.textContent,/90/);
 assert.match(els.alertState.textContent,/SCENARIO WARNING/);
 els.threshold.value='95';els.threshold.fire('input');
 assert.match(els.alertState.textContent,/SCENARIO MONITOR/);
});
test('financial scenario rejects probability totals different from 100%',async()=>{
 const els=await page();
 els.bearProbability.value='10';els.bearProbability.fire('input');
 assert.match(els.modelError.textContent,/total 100/);
 assert.equal(els.var95.textContent,'N/A');
});
test('country selection and source headline search remain functional without remote world geometry',async()=>{
 const els=await page();
 els.country.value='CHN';els.country.fire('input');assert.match(els.mapStatus.textContent,/China/);
 els.newsSearch.value='data center';els.newsSearch.fire('input');
 assert.match(els.newsStatus.textContent,/matching headlines/);
});