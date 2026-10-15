import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const d=JSON.parse(fs.readFileSync('data/esdm-2025-mineral-performance.json','utf8'));
const js=fs.readFileSync('js/esdm-2025-mineral-performance.js','utf8');
const chapters=fs.readFileSync('js/research-chapters.js','utf8');
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/esdm-2025-mineral-performance\.js\?v=/);
assert.match(html,/esdm-2025-mineral-performance\.css\?v=/);
assert.ok(html.indexOf('esdm-2025-mineral-performance.js')<html.indexOf('research-chapters.js'));
assert.match(chapters,/which==="minerals"&&typeof window\.initSLIESDMMinerals/);
assert.equal(d.index.realized_2025,86.4);
assert.equal(d.index.target_2025,79.42);
assert.equal(d.index.series.length,5);
assert.equal(d.index.weights.reduce((sum,w)=>sum+w.weight,0),100);
assert.equal(d.processing.find(x=>x.mineral==='Nickel').material_tonnes,313670000);
assert.ok(d.processing.find(x=>x.mineral==='Nickel').unit.includes('NOT contained Ni'));
assert.equal(d.utilization.length,5);
assert.equal(d.procurement.p3dn.actual_pct,81.8);
assert.equal(d.procurement.tkdn.actual_pct,23.46);
assert.ok(d.procurement.tkdn.note.includes('self-assessment'));
assert.equal(d.investment.categories.length,7);
assert.equal(d.investment.total_minerba_usd_m,7008.13);
assert.match(d.investment.scope,/minerals.*coal/i);
const coal=d.investment.categories.filter(x=>x.coal_only);
const mineral=d.investment.categories.filter(x=>x.minerals_only);
assert.equal(coal.length,2);assert.equal(mineral.length,1);
assert.equal(d.risks.length,7);
assert.ok(d.methodology.length>=8);
class N {
 constructor(tag){this.tagName=tag;this.children=[];this._text='';this.className='';this.style={};this.attrs={};this.events={};this.value='';this.href='';this.isConnected=true}
 append(...args){for(let x of args){if(x==null)continue;if(typeof x==='string'){const n=new N('#text');n.textContent=x;x=n}this.children.push(x)}}
 replaceChildren(...args){this.children=[];this._text='';this.append(...args)}
 set textContent(v){this._text=String(v);this.children=[]}
 get textContent(){return this._text||this.children.map(c=>c.textContent).join(' ')}
 setAttribute(k,v){this.attrs[k]=v}
 addEventListener(k,fn){this.events[k]=fn}
 querySelectorAll(q){let out=[];const match=n=>q.startsWith('.')?n.className.split(' ').includes(q.slice(1)):n.tagName===q;
  const walk=n=>{for(const c of n.children){if(match(c))out.push(c);walk(c)}};walk(this);return out}
 querySelector(q){return this.querySelectorAll(q)[0]||null}
}
let fetches=0;
const document={createElement:t=>new N(t),createElementNS:(_,t)=>new N(t)},window={};
const fetch=async path=>{assert.equal(path,'data/esdm-2025-mineral-performance.json');fetches++;return{ok:true,json:async()=>d}};
vm.runInNewContext(js,{document,window,fetch,console});
const sections=Array.from({length:9},()=>new N('section'));
await window.initSLIESDMMinerals(sections);
assert.equal(fetches,1);
assert.deepEqual(sections.map(s=>s.querySelectorAll('.sli-esdm-panel').length),[0,1,2,1,1,0,1,1,1]);
assert.match(sections[1].textContent,/86.4/);
assert.match(sections[2].textContent,/Nickel matte/);
assert.match(sections[4].textContent,/81.8/);
assert.match(sections[4].textContent,/23.46/);
const select=sections[3].querySelector('select');
assert.ok(select);
select.value='mineral';select.events.change();assert.equal(sections[3].querySelectorAll('.sli-esdm-bar-row').length,1);
assert.match(sections[3].textContent,/IUP Mineral/);
select.value='coal';select.events.change();assert.equal(sections[3].querySelectorAll('.sli-esdm-bar-row').length,2);
select.value='unallocated';select.events.change();assert.equal(sections[3].querySelectorAll('.sli-esdm-bar-row').length,4);
select.value='all';select.events.change();assert.equal(sections[3].querySelectorAll('.sli-esdm-bar-row').length,7);
assert.equal(sections[6].querySelectorAll('.sli-esdm-actor').length,9);
assert.equal(sections[7].querySelectorAll('.sli-esdm-risk').length,7);
assert.equal(sections[8].querySelectorAll('li').length,8);
assert.ok(sections[2].textContent.includes('NOT contained Ni'));
console.log('ESDM ministry LAKIN 2025 integration PASS: 5-year mineral index, 5 smelter utilisation comparisons, P3DN/TKDN, 7 investment categories with scope filters, 7 risks and source register.');
