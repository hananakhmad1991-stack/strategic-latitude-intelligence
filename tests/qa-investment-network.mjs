import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('geopolitical-impact-assessment.html');
const js=read('js/sli-investment-network.js');
const data=JSON.parse(read('data/sli-investment-network.json'));
const map=JSON.parse(read('data/sli-investment-network-map.geojson'));
test('network uses two clearly different measured bilateral-investment datasets',()=>{
 assert.equal(data.views.inbound.period,'2025 · full year');
 assert.match(data.views.outbound.period,/2015–2024/);
 assert.match(data.views.inbound.source.url,/bkpm\.go\.id/);
 assert.match(data.views.outbound.source.url,/lowyinstitute\.org/);
 assert.equal(data.views.inbound.records[0].name,'Singapore');
 assert.equal(data.views.inbound.records[0].value,17.4);
 assert.equal(data.views.inbound.records[0].share_percent,30.9);
 assert.equal(data.views.outbound.records[0].name,'Timor-Leste');
 assert.equal(data.views.outbound.records[0].share_percent,42.9);
 assert.equal(data.views.outbound.records.find(x=>x.code==='CHN').value,1.04);
 assert.ok(data.views.inbound.records.slice(1).every(x=>x.share_percent===null),'Do not invent unpublished BKPM shares');
 assert.ok(data.views.outbound.percent_denominator.includes('EACH recipient'),'Recipient-country denominators must remain explicit');
});
test('map is bundled, script parses and old scoring/stress-testing UI is gone',()=>{
 assert.equal(map.features.length,177);
 assert.ok(map.features.some(f=>f.properties.ISO_A3==='IDN'));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const id of ['modeInbound','modeOutbound','rankings','networkMap','mapShapes','mapLines','mapDots','period','selectedAmount','selectedSource'])assert.ok(ids.includes(id));
 for(const removed of ['riskScore','portfolioValue','var95','macroRisk','signalThreshold','newsItems'])assert.ok(!ids.includes(removed));
 assert.doesNotThrow(()=>new Function(js));
 assert.match(html,/sli-investment-network\.js/);
});
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this.handlers={};this.value='';this.style={};this._text='';}
 get textContent(){return this._text+this.children.map(x=>x.textContent||'').join('');}
 set textContent(x){this._text=String(x);this.children=[];}
 append(...els){this.children.push(...els);}
 replaceChildren(...els){this.children=[...els];this._text='';}
 setAttribute(k,v){this.attrs[k]=String(v);}
 addEventListener(k,fn){(this.handlers[k]??=[]).push(fn);}
 fire(k,evt={}){for(const fn of this.handlers[k]||[])fn(evt);}
}
async function mount(withMap=true){
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
 const document={readyState:'complete',getElementById:id=>elements[id],createElement:tag=>new Element(tag),createElementNS:(_ns,tag)=>new Element(tag)};
 const mockFetch=async path=>{const target=path.replace(/^\.\//,'');const payload={'data/sli-investment-network.json':data,'data/sli-investment-network-map.geojson':withMap?map:null}[target];return {ok:!!payload,status:payload?200:404,json:async()=>payload};};
 runInNewContext(js,{document,fetch:mockFetch,Intl,Promise,Math,Number,String});
 for(let i=0;i<60;i++)await Promise.resolve();
 return elements;
}
test('inbound ranking, map and details render on first page load',async()=>{
 const x=await mount();
 assert.equal(x.rankings.children.length,5);
 assert.equal(x.mapShapes.children.length,177);
 assert.equal(x.mapLines.children.length,5);
 assert.match(x.selectedName.textContent,/Singapore/);
 assert.match(x.selectedAmount.textContent,/17\.4 bn/);
 assert.match(x.period.textContent,/2025/);
 assert.equal(x.modeInbound.attrs['aria-pressed'],'true');
});
test('outbound country switch preserves periods, percentages and exact $1.04bn value',async()=>{
 const x=await mount();
 x.modeOutbound.fire('click');
 assert.equal(x.modeOutbound.attrs['aria-pressed'],'true');
 assert.match(x.question.textContent,/Indonesian investment most influential/);
 assert.match(x.selectedName.textContent,/Timor-Leste/);
 assert.match(x.selectedShare.textContent,/42\.9%/);
 x.rankings.children[4].fire('click');
 assert.match(x.selectedName.textContent,/China/);
 assert.match(x.selectedAmount.textContent,/1\.04 bn/);
});
test('rank list continues when map geography fails to load',async()=>{
 const x=await mount(false);
 assert.equal(x.rankings.children.length,5);
 assert.match(x.mapStatus.textContent,/outlines unavailable/);
});
