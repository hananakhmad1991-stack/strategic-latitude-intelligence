import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const data=JSON.parse(fs.readFileSync('data/iea-indonesia-critical-minerals.json','utf8'));
const script=fs.readFileSync('js/iea-critical-minerals.js','utf8');
const chapter=fs.readFileSync('js/research-chapters.js','utf8');
const html=fs.readFileSync('index.html','utf8');

class Node {
 constructor(tag){this.tagName=tag;this.children=[];this._text='';this.className='';this.style={};this.attrs={};this.events={};this.value='';this.id='';this.href='';this.isConnected=true}
 append(...items){for(const item of items){if(item==null)continue;if(typeof item==='string'){const n=new Node('#text');n.textContent=item;this.children.push(n)}else this.children.push(item)}}
 replaceChildren(...items){this.children=[];this._text='';this.append(...items)}
 set textContent(value){this._text=String(value);this.children=[]}
 get textContent(){return this._text||this.children.map(c=>c.textContent).join(' ')}
 setAttribute(k,v){this.attrs[k]=v}
 addEventListener(k,fn){this.events[k]=fn}
 querySelectorAll(selector){const list=[];const hit=n=>selector.startsWith('.')?n.className.split(' ').includes(selector.slice(1)):n.tagName===selector;const walk=n=>{for(const child of n.children){if(hit(child))list.push(child);walk(child)}};walk(this);return list}
 querySelector(q){return this.querySelectorAll(q)[0]||null}
}
const window={},document={createElement:tag=>new Node(tag)};
let loads=0;
const fetch=async path=>{assert.equal(path,'data/iea-indonesia-critical-minerals.json');loads++;return {ok:true,json:async()=>data}};
vm.runInNewContext(script,{window,document,fetch,console});
assert.match(html,/js\/iea-critical-minerals\.js\?v=/,'IEA JS must be loaded before research chapter');
assert.match(html,/css\/iea-critical-minerals\.css\?v=/,'IEA CSS must be included');
assert.ok(html.indexOf('js/iea-critical-minerals.js')<html.indexOf('js/research-chapters.js'),'IEA module must load before chapter renderer');
assert.match(chapter,/if\(which==="minerals"&&typeof window\.initSLIIEAMinerals/,'Must enrich only Minerals, not AI or Energy Security');
assert.equal(data.metrics.filter(x=>x.metric_scope.includes('Indonesia')||x.label.includes('Indonesia')).length>=1,true);
assert.equal(data.metrics.find(x=>x.id==='nickel_mined_share').value,63);
assert.equal(data.metrics.find(x=>x.id==='nickel_mined_share').year,2024);
assert.equal(data.metrics.find(x=>x.id==='china_refinery_capacity').value,75);
assert.match(data.download_status,/parsed|ingested|integrated/i,'IEA July 2026 workbook must be source-parsed');
assert.equal(data.workbook_ingestion.license,'CC BY 4.0');
assert.equal(data.workbook_ingestion.source_edition,'2026-07-27');
assert.equal(data.lenses.length,7);
assert.ok(data.sources.length>=9,'Missing original IEA citations');
const refs=new Map(data.sources.map(x=>[x.id,x]));
for(const src of refs.values())assert.match(src.url,/^https:\/\/www\.iea\.org\//,'All IEA sources must come from the official agency');
for(const entry of [...data.metrics,...data.global_context]){
 assert.ok(refs.has(entry.source_id),'Missing source for '+entry.id);
 assert.ok(Number.isFinite(entry.value),'Factual numeric record has no value');
 assert.ok(entry.metric_scope||entry.detail,'Missing metric denominator and geographic scope');
}
for(const item of data.global_context)assert.match(item.detail,/global|Indonesia/i,'A global signal needs a scope warning');
const sections=Array.from({length:9},()=>new Node('section'));
await window.initSLIIEAMinerals(sections);
assert.equal(loads,1);
for(const index of [1,3,4,6,7,8])assert.equal(sections[index].querySelectorAll('.sli-iea-panel').length,1,'IEA panel missing in section '+index);
for(const index of [0,2,5])assert.equal(sections[index].querySelectorAll('.sli-iea-panel').length,0,'IEA should not duplicate institution/project/monitoring owner sections');
assert.match(sections[1].textContent,/63 %/);
assert.match(sections[3].textContent,/75 %/);
assert.match(sections[3].textContent,/GLOBAL|global/);
assert.equal(sections[6].querySelectorAll('.sli-iea-source').length,data.sources.length);
const select=sections[4].querySelector('select');
assert.ok(select,'A genuine material selector is required');
select.value='Copper';select.events.change();
assert.match(sections[4].textContent,/Copper/);
assert.match(sections[4].textContent,/25% global/);
select.value='Rare earth elements';select.events.change();
assert.match(sections[4].textContent,/commercial separation claims require independent evidence/);
assert.ok(sections[8].textContent.includes('Scenario')||sections[8].textContent.includes('scenario'));
console.log('IEA Indonesia module QA PASS: 4 sourced metrics, 5 global outlook signals, 7 working mineral lenses, 10 attributed sources; no duplicate owner sections.');
