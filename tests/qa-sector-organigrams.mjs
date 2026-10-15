import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const powerMap=fs.readFileSync('js/sector-stakeholder-explorer.js','utf8');
const research=fs.readFileSync('js/research-chapters.js','utf8');
const catalog=JSON.parse(fs.readFileSync('data/sector-governance-explorer.json','utf8'));
const investments=JSON.parse(fs.readFileSync('data/investment-evidence.json','utf8'));
const indicators=JSON.parse(fs.readFileSync('data/sector-evidence-catalog.json','utf8'));
const monitoring=JSON.parse(fs.readFileSync('data/ai-monitoring.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const sources={
 'data/sector-governance-explorer.json':catalog,
 'data/investment-evidence.json':investments,
 'data/sector-evidence-catalog.json':indicators,
 'data/ai-monitoring.json':monitoring,
};

class FakeNode {
 constructor(tag){
  this.tagName=tag;this.children=[];this._text='';this.className='';this.id='';this.href='';this.value='';
  this.style={};this.attrs={};this.dataset={};this.handlers={};this.hidden=false;this.open=false;this.isConnected=true;
  this.classList={
   contains:name=>this.className.split(' ').includes(name),
   add:name=>this.setClass(name,true),
   remove:name=>this.setClass(name,false),
   toggle:(name,flag)=>this.setClass(name,flag===undefined?!this.className.split(' ').includes(name):flag)
  };
 }
 setClass(name,enabled){let s=new Set(this.className.split(' ').filter(Boolean));if(enabled)s.add(name);else s.delete(name);this.className=[...s].join(' ')}
 append(...items){for(let x of items){if(typeof x==='string'){const n=new FakeNode('#text');n.textContent=x;x=n}if(x)this.children.push(x)}}
 appendChild(x){this.append(x);return x}
 get lastChild(){return this.children.at(-1)||null}
 replaceChildren(...items){this.children=[];this._text='';this.append(...items)}
 setAttribute(k,v){this.attrs[k]=v;if(k==='class')this.className=v;if(k==='id')this.id=v}
 getAttribute(k){return this.attrs[k]}
 removeAttribute(k){delete this.attrs[k]}
 addEventListener(k,fn){this.handlers[k]=fn}
 set textContent(v){this._text=String(v);this.children=[]}
 get textContent(){return this._text||this.children.map(n=>n.textContent).join(' ')}
 querySelectorAll(q){
  let out=[];const match=n=>q.startsWith('.')?n.className.split(' ').includes(q.slice(1)):q.startsWith('#')?n.id===q.slice(1):q==='h3'?n.tagName==='h3':q==='a[href^="https://"]'?n.tagName==='a'&&n.href.startsWith('https://'):n.tagName===q;
  const recurse=node=>{for(const child of node.children){if(match(child))out.push(child);recurse(child)}};recurse(this);return out;
 }
 querySelector(q){return this.querySelectorAll(q)[0]||null}
 scrollIntoView(){this.scrolled=true}
 remove(){}
}

class MockURL {constructor(u){this.hostname=u.split('/')[2]||'unknown'}}
const root=new FakeNode('main');
const document={
 createElement:t=>new FakeNode(t),
 createElementNS:(_,t)=>new FakeNode(t),
 createTextNode:t=>{const n=new FakeNode('#text');n.textContent=t;return n},
 getElementById:id=>id==='sliResearchRoot'?root:null,
 querySelector:()=>null,
 addEventListener(){}
};
const window={};
const fetch=async path=>({ok:!!sources[path],status:sources[path]?200:404,json:async()=>sources[path]});
const context={document,window,URL:MockURL,fetch,console};
vm.runInNewContext(powerMap,context);
vm.runInNewContext(research,context);
assert.match(html,/sector-stakeholder-explorer\.js/,'Power-map script should load on all pages');
assert.match(html,/stakeholder-map\.css/,'Must reuse Energy Security styling');

for(const sector of ['minerals','ai']){
 const data=catalog.sectors[sector];
 const count=data.layers.reduce((n,branch)=>n+branch.actors.length,0);
 assert.equal(data.layers.length,6,'six functional hubs required');
 assert.equal(data.accountability_routes.length,9,'nine policy accountability lenses required');
 assert.ok(count>=40,'Sector research must have substantive mapped stakeholders');
 assert.equal(data.meta.key_people.filter(([name])=>data.layers.some(x=>x.actors.some(a=>a.name===name&&a.person_name))).length,6,'all named leader chips require dated sources');
 
 window.initSLIResearch(sector);
 for(let i=0;i<25;i++)await Promise.resolve();
 const stages=root.children.filter(x=>x.classList.contains('es-stage'));
 assert.equal(stages.length,9,'Energy Security structural parity');
 const hierarchy=stages[0].querySelector('.sli-hier-root');
 assert.ok(hierarchy||stages[0].querySelector('.sli-hierarchy-mount'),'Missing presidential hierarchy mounting point');
 const expandable=stages[0].querySelector('.sli-extra-network');
 assert.ok(expandable,'Energy Security detailed network disclosure must exist');
 expandable.open=true;
 expandable.handlers.toggle();
 for(let i=0;i<12;i++)await Promise.resolve();
 const map=stages[0].querySelector('.stake-shell');
 assert.ok(map,'Missing reusable Energy Security power-map component after opening network');
 const tabs=map.querySelectorAll('.stake-tab');
 const leaders=map.querySelectorAll('.stake-person-chip');
 const svg=map.querySelectorAll('.stake-svg');
 assert.equal(tabs.length,3,'Overview / Explore actors / Issue focus');
 assert.equal(leaders.length,6,'six verified named leadership cards');
 assert.equal(svg.length,1);
 assert.equal(map.querySelectorAll('.stake-mobile-button').length,6,'six accessible institutional mobile branches');
 assert.ok(map.textContent.includes(String(count)+' Institutions'));
 
 leaders[0].handlers.click();
 assert.ok(map.querySelector('.stake-inspector').textContent.includes('STAKEHOLDER PROFILE'));
 assert.ok(map.querySelector('.stake-inspector').textContent.includes('Source reference:'));
 
 tabs[2].handlers.click();
 assert.equal(map.querySelectorAll('.stake-issue-dot').length,5);
 let issue=map.querySelectorAll('.stake-select').at(-1);issue.value='3';issue.handlers.change();
 assert.match(map.querySelector('.stake-inspector').textContent,/POLICY ACCOUNTABILITY LENS/);
 
 tabs[1].handlers.click();
 const groups=map.querySelectorAll('.stake-select')[0];groups.value='2';groups.handlers.change();
 assert.ok(map.querySelectorAll('.stake-mobile-button').length>=4);
 
 const nav=root.children.find(x=>x.classList.contains('es-toc'));
 nav.children[0].handlers.click({preventDefault(){}});
 assert.equal(stages[0].scrolled,true,'chapter nav must stay within current sector');
 console.log(sector+' OK: '+count+' actors, 6 named officials, 9 issues, Energy power-map interaction and navigation');
}
