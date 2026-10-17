import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('geopolitical-impact-assessment.html');
const code=read('js/sli-indonesia-power-profile.js');
const data=JSON.parse(read('data/sli-indonesia-power-profile.json'));
test('Lowy source-dated Indonesia country snapshot is grounded and internally consistent',()=>{
 const power=data.overview.comprehensive_power;
 assert.equal(data.source.publisher,'Lowy Institute');
 assert.equal(data.source.edition,2025);
 assert.equal(power.rank,9);assert.equal(power.universe,27);assert.equal(power.score,22.5);assert.equal(power.annual_score_change,.2);
 assert.equal(data.metrics.length,8);assert.equal(data.metrics.find(m=>m.id==='diplomacy').score,67.2);
 assert.equal(data.metrics.find(m=>m.id==='military').rank,13);
 assert.equal(data.metrics.find(m=>m.id==='resilience').score_change,2.5);
 assert.equal(data.metrics.find(m=>m.id==='defence').score_change,-4.3);
 assert.ok(data.metrics.every(m=>Number.isFinite(m.score)&&m.rank>=1&&m.rank<=27&&m.source_url===data.source.url));
 assert.ok(data.annual_change.records.every(x=>data.metrics.some(m=>m.id===x.id&&m.score_change===x.score_change&&m.rank_change===x.rank_change)));
});
test('trade influence interpretations use distinct denominator and 2024 period',()=>{
 const inf=data.influence;
 assert.equal(inf.year,2024);
 assert.equal(inf.views.into_indonesia.records[0].name,'China');
 assert.equal(inf.views.into_indonesia.records[0].percent,27.3);
 assert.equal(inf.views.indonesia_influence.records[0].name,'Timor-Leste');
 assert.equal(inf.views.indonesia_influence.records[0].percent,35.4);
 assert.notEqual(inf.views.into_indonesia.denominator,inf.views.indonesia_influence.denominator);
});
test('overview, annual, trade influence, scores and provenance sections replace old investment network',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const key of ['overview','changes','influence','scores','overallRank','overallScore','annualRows','intoCountry','fromCountry','countryList','selectedPercent','scoreSort','measureCards'])assert.ok(ids.includes(key),key);
 for(const removed of ['modeInbound','modeOutbound','networkMap','riskScore','portfolioValue','var95'])assert.ok(!ids.includes(removed));
 assert.match(html,/Lowy Institute/);
 assert.doesNotThrow(()=>new Function(code));
});
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.handlers={};this.attrs={};this.dataset={};this.style={};this._text='';this.value='';this.hidden=false;this.lastChild=null;}
 get textContent(){return this._text+this.children.map(x=>x.textContent||'').join('');}
 set textContent(v){this._text=String(v);this.children=[];}
 append(...items){this.children.push(...items);this.lastChild=items.at(-1)??this.lastChild;}
 replaceChildren(...items){this.children=[...items];this._text='';this.lastChild=this.children.at(-1);}
 setAttribute(k,v){this.attrs[k]=String(v);}
 addEventListener(k,cb){(this.handlers[k]??=[]).push(cb);}
 fire(k){for(const cb of this.handlers[k]||[])cb({preventDefault(){}});}
 scrollIntoView(){}
}
async function mount(broken=false){
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 const els=Object.fromEntries(ids.map(x=>[x,new Element()]));
 const tabs=['overview','changes','influence','scores'].map(name=>{const b=new Element('button');b.dataset.tab=name;return b;});
 const document={readyState:'complete',getElementById:id=>els[id],querySelectorAll:sel=>sel==='[data-tab]'?tabs:[],createElement:tag=>new Element(tag)};
 const location={hash:''};
 const window={history:{replaceState:(_a,_b,hash)=>location.hash=hash},addEventListener(){}};
 const fetch=async()=>broken?{ok:false,status:503}:{ok:true,json:async()=>data};
 runInNewContext(code,{document,window,location,fetch,Intl});
 for(let i=0;i<50;i++)await Promise.resolve();
 return {els,tabs,location};
}
test('first-page overview, changes, eight scores and bilateral country list actually render',async()=>{
 const {els}=await mount();
 assert.equal(els.overallRank.textContent,'#9');
 assert.equal(els.overallScore.textContent,'22.5');
 assert.equal(els.keyInsights.children.length,4);
 assert.equal(els.annualRows.children.length,8);
 assert.equal(els.measureCards.children.length,8);
 assert.equal(els.countryList.children.length,5);
 assert.equal(els.selectedCountry.textContent,'China');
});
test('tab buttons, two trade influence directions and country selection update the details',async()=>{
 const {els,tabs,location}=await mount();
 tabs[2].fire('click');assert.equal(els.influence.hidden,false);assert.equal(els.overview.hidden,true);
 assert.equal(location.hash,'#influence');
 els.fromCountry.fire('click');assert.equal(els.selectedCountry.textContent,'Timor-Leste');assert.equal(els.selectedPercent.textContent,'35.4%');
 els.countryList.children[1].fire('click');assert.equal(els.selectedCountry.textContent,'Singapore');
 assert.equal(els.selectedPercent.textContent,'5.8%');
 els.intoCountry.fire('click');assert.equal(els.selectedCountry.textContent,'China');
});
test('sorting and selected score details remain interactive',async()=>{
 const {els,tabs}=await mount();
 els.scoreSort.value='score';els.scoreSort.fire('change');
 assert.equal(els.measureCards.children[0].dataset.id,'diplomacy');
 els.measureCards.children[1].fire('click');
 assert.match(els.selectedMeasure.textContent,/Resilience|Cultural|Economic|Military|Defence|Future/);
 tabs[3].fire('click');assert.equal(els.scores.hidden,false);
});
test('on missing source, the page reports missing data instead of inventing rankings',async()=>{
 const {els}=await mount(true);
 assert.match(els.powerSummary.textContent,/could not be loaded/);
 assert.match(els.annualRows.textContent,/unavailable/);
});