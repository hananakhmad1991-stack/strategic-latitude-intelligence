import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const data=JSON.parse(fs.readFileSync('data/usgs-indonesia-minerals-2026.json','utf8'));
const moduleCode=fs.readFileSync('js/usgs-critical-minerals.js','utf8');
const chapter=fs.readFileSync('js/research-chapters.js','utf8');
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/usgs-critical-minerals\.js\?v=/);
assert.match(html,/usgs-critical-minerals\.css\?v=/);
assert.ok(html.indexOf('usgs-critical-minerals.js')<html.indexOf('research-chapters.js'));
assert.match(chapter,/which==="minerals"&&typeof window\.initSLIUSGSMinerals/);
assert.equal(data.headline.find(x=>x.id==='nickel_2025').value,2600000);
assert.equal(data.headline.find(x=>x.id==='nickel_reserves_2026').value,62000000);
assert.equal(data.headline.find(x=>x.id==='nickel_global_share_2025').kind,'calculated');
assert.equal(data.rank2024.find(x=>x.commodity==='Nickel').global_share,62);
assert.equal(data.rank2024.find(x=>x.commodity==='Cobalt').global_share,12);
assert.equal(data.series.length,21);
for(const line of data.series){
 assert.equal(line.years.length,5,line.id);
 assert.equal(line.values.length,5,line.id);
 assert.equal(line.estimated.length,5,line.id);
 assert.ok(line.values.every(v=>Number.isFinite(v)&&v>=0),line.id);
 assert.ok(line.unit&&line.source_id,line.id);
}
const ids=new Set(data.series.map(x=>x.id));
for(const group of data.trend_groups)for(const x of group.ids)assert.ok(ids.has(x),x);
assert.equal(data.sites.length,6);
assert.ok(data.sites.every(s=>s.lat>=-11&&s.lat<=8&&s.lon>94&&s.lon<142));
assert.equal(data.trade.flows.length,4);
for(const flow of data.trade.flows){
 assert.ok(Math.abs(flow.calc_value-flow.total*flow.share/100)<1e-6,'Incorrect derived bilateral flow');
 assert.ok(flow.total>0&&flow.share>0&&flow.share<100,'Invalid share');
}
assert.ok(data.sources.every(s=>s.url.startsWith('https://')&&s.date));
class N {
 constructor(tag){this.tagName=tag;this.children=[];this.className='';this._text='';this.style={};this.attrs={};this.events={};this.value='';this.id='';this.href='';this.isConnected=true;}
 append(...xs){for(let x of xs){if(x==null)continue;if(typeof x==='string'){const n=new N('#text');n.textContent=x;x=n}this.children.push(x)}}
 replaceChildren(...xs){this.children=[];this._text='';this.append(...xs)}
 set textContent(v){this._text=String(v);this.children=[]}
 get textContent(){return this._text||this.children.map(x=>x.textContent).join(' ')}
 setAttribute(k,v){this.attrs[k]=v;if(k==='id')this.id=v}
 addEventListener(k,f){this.events[k]=f}
 querySelectorAll(q){const out=[];const match=n=>q.startsWith('.')?n.className.split(' ').includes(q.slice(1)):n.tagName===q;const walk=n=>{for(const c of n.children){if(match(c))out.push(c);walk(c)}};walk(this);return out}
 querySelector(q){return this.querySelectorAll(q)[0]||null}
}
const document={createElement:t=>new N(t),createElementNS:(_,t)=>new N(t)};
const window={};
let count=0;
const fetch=async path=>{assert.equal(path,'data/usgs-indonesia-minerals-2026.json');count++;return{ok:true,json:async()=>data}};
vm.runInNewContext(moduleCode,{document,window,fetch,console});
const sections=Array.from({length:9},()=>new N('section'));
await window.initSLIUSGSMinerals(sections);
assert.equal(count,1);
assert.deepEqual(sections.map(s=>s.querySelectorAll('.sli-usgs-panel').length),[0,1,3,1,0,0,1,0,1]);
assert.match(sections[1].textContent,/62%/);
assert.match(sections[1].textContent,/2025e/);
assert.match(sections[1].textContent,/66.7%/);
assert.equal(sections[1].querySelectorAll('.sli-usgs-share-row').length,5);
const sels=sections[2].querySelectorAll('select');
assert.equal(sels[0].children.length,7);
assert.equal(sels[1].children.length,5);
sels[0].value='copper';sels[0].events.change();
sels[1].value='2021';sels[1].events.change();
assert.match(sections[2].textContent,/Copper · mine concentrates/);
assert.match(sections[2].textContent,/712,000/);
const processSelect=sels[2];processSelect.value='cobalt';processSelect.events.change();
assert.match(sections[2].textContent,/Cobalt sulphate/);
const mapSVG=sections[2].querySelectorAll('svg')[1],markers=mapSVG.querySelectorAll('g');
assert.equal(markers.length,6);
markers[1].events.click();
assert.match(sections[2].textContent,/Gresik/);
const trade=sections[3];
assert.equal(trade.querySelectorAll('.sli-usgs-trade-card').length,4);
assert.match(trade.textContent,/24.64bn/);
assert.match(trade.textContent,/no complete mineral trade balance inferred/i);
assert.equal(sections[3].querySelectorAll('.sli-usgs-economy-card').length,2,'GDP mining vs manufacturing contributions should be separate');
assert.equal(sections[6].querySelectorAll('.sli-usgs-source').length,4);
assert.equal(sections[6].querySelectorAll('.sli-usgs-policy-card').length,4,'Historical policies should remain in the source panel');
assert.match(sections[6].textContent,/not evidence of current legal status/i);
assert.ok(sections[8].querySelectorAll('li').length>=7);
console.log('USGS source-level and interaction QA PASS: 21 production series, 5 share bars, 7 trend groups, 5 value chains, 6 locations, 4 trade aggregates, original citation and scope intact.');
