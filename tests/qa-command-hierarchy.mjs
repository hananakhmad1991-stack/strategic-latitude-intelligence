import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const js=fs.readFileSync('js/sector-command-hierarchy.js','utf8');
const db=JSON.parse(fs.readFileSync('data/sector-command-hierarchy.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
class Node{
 constructor(tag){this.tagName=tag;this.children=[];this.className='';this._text='';this.id='';this.value='';this.attrs={};this.events={};this.style={};this.hidden=false;this.isConnected=true;}
 append(...parts){for(let x of parts){if(typeof x==='string'){const n=new Node('#text');n.textContent=x;x=n}if(x)this.children.push(x)}if(this.tagName==='select'&&!this.value&&this.children.length)this.value=this.children[0].value;}
 prepend(x){this.children.unshift(x)}
 replaceChildren(...parts){this.children=[];this._text='';this.append(...parts)}
 setAttribute(k,v){this.attrs[k]=v}
 addEventListener(k,fn){this.events[k]=fn}
 get textContent(){return this._text||this.children.map(x=>x.textContent).join(' ')}
 set textContent(v){this._text=String(v);this.children=[]}
 querySelectorAll(q){const results=[];const walk=n=>{for(const c of n.children){if(q.startsWith('.')?c.className.split(' ').includes(q.slice(1)):c.tagName===q)results.push(c);walk(c)}};walk(this);return results}
 querySelector(q){return this.querySelectorAll(q)[0]||null}
}
const window={};const document={createElement:t=>new Node(t)};
const fetch=async url=>url==='data/sector-command-hierarchy.json'?{ok:true,json:async()=>db}:{ok:true,json:async()=>({checked_at_utc:null,checks:[]})};
vm.runInNewContext(js,{window,document,fetch,console});
assert.match(html,/sector-command-hierarchy\.js/,'Hierarchy script not loaded');
for(const sector of ['minerals','ai']){
 const nodes=db.sectors[sector].nodes,market=db.sectors[sector].market;
 assert.equal(nodes.filter(x=>x.relation==='root').length,1);
 assert.ok(nodes.length>=20,'Too few hierarchy records');
 assert.ok(market.length>=10,'Private/foreign actors missing');
 for(const [id,person,relation] of [['kemenkoekon','Airlangga Hartarto','coordination'],['bappenas','Rachmat Pambudy','planning']]){
  const x=nodes.find(a=>a.id===id);
  assert.ok(x,'Missing national coordinating/planning ministry '+id);
  assert.equal(x.parent,'pres',id+' must be directly below the President, not beneath ESDM');
  assert.equal(x.relation,relation,'Functional role must not be conflated with sector regulator');
  assert.equal(x.person,person,'Incorrect dated incumbent for '+id);
 }
 const byId=new Map(nodes.map(x=>[x.id,x]));
 for(const a of nodes){
  assert.ok(a.source?.startsWith('https://'),sector+' original source missing for '+a.id);
  if(a.parent)assert.ok(byId.has(a.parent),'Parent missing for '+a.id);
 }
 let root=new Node('main');
 window.initSLICommandHierarchy(sector,root);
 for(let i=0;i<12;i++)await Promise.resolve();
 const top=root.querySelector('.sli-hier-president');
 const lanes=root.querySelector('.sli-hier-lanes');
 const filter=root.querySelector('.sli-hier-select');
 assert.match(top.textContent,/Prabowo Subianto/);
 assert.equal(lanes.querySelectorAll('.sli-hier-domain').length,2,'Government and Danantara groups must be separately rendered');
 const fullPrivate=root.querySelector('.sli-hier-market');
 assert.ok(fullPrivate.querySelectorAll('.sli-hier-domain').some(x=>x.className.includes('private')),'Private sector must be an independent section');
 const divisions=fullPrivate.querySelectorAll('.sli-hier-market-class');
 assert.equal(divisions.length,3,'Domestic, foreign and mixed JV must be separately grouped');
 const coord=nodes.find(x=>x.id==='kemenkohilir');
 assert.equal(coord.parent,'pres','Coordinating ministry must appear below President');
 assert.equal(coord.person,'Bahlil Lahadalia','2026-10-01 coordinating minister attribution');
 assert.equal(coord.lane,'government');
 const corporate=nodes.filter(n=>n.lane==='state');
 assert.ok(corporate.length>=6,'Danantara and SOEs missing');
 const privates=market.filter(x=>x.lane==='private');
 assert.ok(privates.length>=10,'Independent private listings missing');
 const nationalLanes=lanes.textContent;
 assert.match(nationalLanes,/Airlangga Hartarto/,'Kemenko must appear on top-level diagram');
 assert.match(nationalLanes,/Rachmat Pambudy/,'Bappenas must appear on top-level diagram');
 filter.value='policy';filter.events.change();
 assert.match(lanes.textContent,/Kemenko Perekonomian/,'Policy filter must include economic coordination');
 assert.match(lanes.textContent,/Bappenas/,'Policy filter must include national planning');
 filter.value='all';filter.events.change();
 const cards=root.querySelectorAll('.sli-hier-card');
 assert.ok(cards.length>=12,'Incomplete initial expanded corporate/regulatory tree');
 const search=root.querySelector('.sli-hier-search');
 search.value=sector==='minerals'?'Vale':'NeutraDC';search.events.input();
 assert.ok(root.querySelector('.sli-hier-search-hits'),'Name search results absent');
 const expand=root.querySelectorAll('.sli-hier-button')[0];expand.events.click();
 assert.ok(root.querySelectorAll('.sli-hier-card').length>=nodes.length-5,'Expand all fails');
 filter.value='market';filter.events.change();
 assert.equal(root.querySelector('.sli-hier-market').hidden,false);
 assert.equal(root.querySelectorAll('.sli-hier-market-class').length,3);
 for(const category of ['domestic','foreign','joint']){
  filter.value=category;filter.events.change();
  const classes=root.querySelectorAll('.sli-hier-market-class');
  assert.equal(classes.length,1,'Private ownership filter must show only one selected category');
  assert.ok(classes[0].className.includes(category),'Wrong private category displayed');
 }
 console.log(sector+' top-down hierarchy, search, expansion, external market lanes: PASS');
}
assert.equal(db.sectors.minerals.nodes.find(x=>x.id==='dgminerba').parent,'minister');
assert.equal(db.sectors.ai.nodes.find(x=>x.id==='dirAI').parent,'dgE');
assert.equal(db.sectors.minerals.nodes.find(x=>x.id==='dsi').parent,'bpi');
assert.equal(db.sectors.minerals.nodes.find(x=>x.id==='mind').parent,'dam');
assert.equal(db.sectors.minerals.nodes.find(x=>x.id==='vale').relation,'minority');
console.log('No false regulator/owner collapse. All hierarchy tests passed.');
