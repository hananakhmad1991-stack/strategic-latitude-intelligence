import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const research=fs.readFileSync('js/research-chapters.js','utf8');
const organization=fs.readFileSync('js/sector-institution-map.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const directory=JSON.parse(fs.readFileSync('data/sector-institution-map.json','utf8'));
const datasets={
 'data/sector-institution-map.json':directory,
 'data/investment-evidence.json':JSON.parse(fs.readFileSync('data/investment-evidence.json','utf8')),
 'data/sector-evidence-catalog.json':JSON.parse(fs.readFileSync('data/sector-evidence-catalog.json','utf8')),
 'data/ai-monitoring.json':JSON.parse(fs.readFileSync('data/ai-monitoring.json','utf8'))
};
class FakeNode{
 constructor(tag){this.tagName=tag;this.children=[];this.className='';this.style={};this.id='';this.href='';this.events={};this.attrs={};this._text='';this.hidden=false;this.isConnected=true;this.classList={contains:name=>this.className.split(' ').includes(name)}}
 append(...nodes){for(let n of nodes){if(typeof n==='string'){const t=new FakeNode('#text');t.textContent=n;n=t}if(n)this.children.push(n)}}
 replaceChildren(...nodes){this.children=[];this.append(...nodes)}
 setAttribute(k,v){this.attrs[k]=v;if(k==='class')this.className=v;if(k==='id')this.id=v}
 getAttribute(k){return this.attrs[k]}
 addEventListener(name,fn){this.events[name]=fn}
 set textContent(v){this._text=String(v)}
 get textContent(){return this._text||this.children.map(n=>n.textContent).join(' ')}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null}
 querySelectorAll(selector){const out=[];const hit=n=>selector==='h3'?n.tagName==='h3':selector==='a[href^="https://"]'?n.tagName==='a'&&n.href.startsWith('https://'):selector.startsWith('.')?n.className.split(' ').includes(selector.slice(1)):false;const scan=n=>{for(const child of n.children){if(hit(child))out.push(child);scan(child)}};scan(this);return out}
 scrollIntoView(){this.scrolled=true}
 remove(){}
}
class URLMock{constructor(text){this.hostname=text.split('/')[2]||'unknown'}}
const root=new FakeNode('main');
const document={
 createElement:tag=>new FakeNode(tag),
 createElementNS:(_,tag)=>new FakeNode(tag),
 createTextNode:text=>{const n=new FakeNode('#text');n.textContent=text;return n},
 getElementById:id=>id==='sliResearchRoot'?root:null,
 querySelector:()=>null,
 addEventListener(){}
};
const window={};
const fetch=async path=>({ok:!!datasets[path],status:datasets[path]?200:404,json:async()=>datasets[path]});
const context={window,document,fetch,URL:URLMock,console};
vm.runInNewContext(organization,context);
vm.runInNewContext(research,context);
assert.ok(index.includes('id="sliMobileNavToggle"'),'Mobile menu toggle not installed');
assert.ok(index.includes('sector-institution-map.js'),'Missing organigram dependency');
assert.ok(index.includes('const pagesFromURL='),'Unified hash routing missing');
for(const sector of ['minerals','ai']){
 window.initSLIResearch(sector);
 for(let i=0;i<18;i++)await Promise.resolve();
 const stages=root.children.filter(n=>n.classList.contains('es-stage'));
 assert.equal(stages.length,9,'Energy Security parity: nine sector sections');
 assert.ok(stages.every(n=>n.children.length>1),'One or more empty sections');
 const org=stages[0].querySelector('.sli-org-shell');
 assert.ok(org,'Institutional organigram missing in stage 01');
 const nav=root.children.find(n=>n.classList.contains('es-toc'));
 assert.equal(nav.children.length,9);
 const nodes=org.querySelectorAll('.sli-org-node');
 assert.equal(nodes.length,6,'Six functional branches should be visible in overview SVG');
 nodes[0].events.click();
 const actor=org.querySelectorAll('.sli-org-node')[0];
 assert.ok(actor,'Group drilldown has no actors');
 actor.events.click();
 assert.match(org.querySelector('.sli-org-inspector').textContent,/Original institution \/ evidence/);
 const groupButtons=org.querySelector('.sli-org-branch-buttons');
 assert.equal(groupButtons.children.length,6);
 nav.children[0].events.click({preventDefault(){}});
 assert.equal(stages[0].scrolled,true,'Chapter navigation must scroll rather than return to Overview');
 console.log(sector+': 9 panels, 6 clickable organizational branches, actor provenance, navigation OK');
}
