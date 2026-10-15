import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const data=JSON.parse(fs.readFileSync('data/energy-governance-ccs.json','utf8'));
const adapter=fs.readFileSync('js/energy-hierarchy-adapter.js','utf8');
const command=fs.readFileSync('js/sector-command-hierarchy.js','utf8');
const fullMap=fs.readFileSync('js/stakeholder-map.js','utf8');
const page=fs.readFileSync('js/energy-governance-ccs.js','utf8');
const html=fs.readFileSync('index.html','utf8');
assert.ok(html.includes('energy-hierarchy-adapter.js'),'Canonical Energy actor adapter must be loaded');
assert.match(html,/energy-governance-ccs\.js\?v=/,'Energy module must have a new cache token');
class FakeNode{
 constructor(tag){this.tagName=tag;this.children=[];this._text='';this.className='';this.id='';this.href='';this.style={};this.dataset={};this.attrs={};this.events={};this.hidden=false;this.open=false;this.isConnected=true;this.value='';this.classList={contains:v=>this.className.split(' ').includes(v)}}
 append(...items){for(let n of items){if(typeof n==='string'){const t=new FakeNode('#text');t.textContent=n;n=t}if(n)this.children.push(n)}if(this.tagName==='select'&&!this.value&&this.children.length)this.value=this.children[0].value||''}
 replaceChildren(...items){this.children=[];this._text='';this.append(...items)}
 prepend(n){this.children.unshift(n)}
 setAttribute(k,v){this.attrs[k]=v;if(k==='id')this.id=v;if(k==='class')this.className=v}
 getAttribute(k){return this.attrs[k]}
 addEventListener(k,cb){this.events[k]=cb}
 get textContent(){return this._text||this.children.map(n=>n.textContent).join(' ')}
 set textContent(v){this._text=String(v);this.children=[]}
 querySelectorAll(selector){let out=[];const matches=n=>selector.startsWith('.')?n.className.split(' ').includes(selector.slice(1)):selector.startsWith('#')?n.id===selector.slice(1):n.tagName===selector;const walk=n=>{for(const child of n.children){if(matches(child))out.push(child);walk(child)}};walk(this);return out}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null}
}
const window={};const document={
 createElement:t=>new FakeNode(t),
 createElementNS:(_,t)=>new FakeNode(t),
 createTextNode:v=>{const n=new FakeNode('#text');n.textContent=v;return n},
 querySelector:()=>null,
 addEventListener(){}
};
const fetch=async()=>({ok:true,json:async()=>({checked_at_utc:null,checks:[]})});
const context={window,document,fetch,console};
vm.runInNewContext(adapter,context);
vm.runInNewContext(command,context);
vm.runInNewContext(fullMap,context);
const energyGovernance=page.slice(page.indexOf('function governance(root,data,asOf){'),page.indexOf('\nlet lastPolicyData=null;',page.indexOf('function governance(root,data,asOf){')));
assert.ok(energyGovernance.startsWith('function governance('),'Energy governance view must be exported as an isolated testable function');
const E=(tag,cls,label)=>{const v=document.createElement(tag);if(cls)v.className=cls;if(label!==undefined&&label!==null)v.textContent=label;return v};
const LINK=(url,label)=>{const a=E('a',null,label);a.href=url;return a};
const govContext={...context,E,LINK,showActorWatch:()=>{}};
vm.runInNewContext(energyGovernance,govContext);
const build=window.buildSLIEnergyHierarchy(data.governance,data.as_of);
const org=build.sectors.energy;
assert.ok(data.governance.layers.flatMap(x=>x.actors).length>=65,'Canonical governance dataset unexpectedly lost institutions');
assert.ok(org.nodes.length+org.market.length>=60,'Energy hierarchy should derive substantive actors, not a placeholder');
const byName=part=>org.nodes.find(n=>n.title.includes(part));
const pres=org.nodes.find(x=>x.relation==='root');
assert.equal(byName('Ditjen Migas').parent,byName('Kementerian ESDM / Minister').id);
assert.equal(byName('Ditjen EBTKE').parent,byName('Kementerian ESDM / Minister').id);
assert.equal(byName('PT Pertamina Patra Niaga').parent,byName('PT Pertamina (Persero)').id);
assert.equal(byName('PT PLN Indonesia Power').parent,byName('PT PLN (Persero)').id);
assert.equal(byName('PT Danantara Asset Management').parent,byName('Danantara Indonesia (BPI)').id);
assert.equal(byName('Kemenko Hilirisasi').parent,pres.id);
assert.ok(org.nodes.filter(a=>a.lane==='oversight').length>=10,'DPR/DPD/BPK should be independently shown');
assert.ok(org.market.some(a=>a.ownership_category==='domestic'));
assert.ok(org.market.some(a=>a.ownership_category==='foreign'));
assert.ok(org.market.some(a=>a.ownership_category==='joint'));
const root=new FakeNode('section');
govContext.governance(root,data.governance,data.as_of);
const wrap=root.querySelector('.sli-energy-institution-explorer');
assert.ok(wrap,'Energy institution explorer should be consolidated in one collapsible panel');
assert.equal(root.children.length,1,'Energy stakeholder area should not duplicate institution sections');
assert.equal(wrap.open,true,'Grouped hierarchy shown by default');
const tabs=wrap.querySelectorAll('.sli-sector-explorer-tab');
assert.equal(tabs.length,2);
assert.ok(tabs[1].textContent.includes('Government / Danantara & BUMN / Private'));
for(let i=0;i<16;i++)await Promise.resolve();
const hierarchy=wrap.querySelector('.sli-sector-hierarchy-pane');
const network=wrap.querySelectorAll('.sli-sector-explorer-pane')[0];
assert.equal(hierarchy.hidden,false);
assert.ok(hierarchy.querySelector('.sli-hier-root'),'Grouped government hierarchy failed to load');
assert.ok(hierarchy.querySelectorAll('.sli-hier-domain').length>=2,'Government and Danantara should be separate groups');
assert.equal(hierarchy.querySelectorAll('.sli-hier-market-class').length,3,'Domestic, foreign and JV listings must be separated');
const companies=hierarchy.querySelector('.sli-hier-market').textContent;
assert.match(companies,/Medco/);
assert.match(companies,/ExxonMobil/);
tabs[0].events.click();
assert.equal(hierarchy.hidden,true);
assert.equal(network.hidden,false);
const sourceMap=network.querySelector('.stake-shell');
assert.ok(sourceMap,'The original interactive Energy Security Power Map must be preserved');
assert.equal(sourceMap.querySelectorAll('.stake-person-chip').length,6,'Existing leadership cards must remain');
assert.equal(sourceMap.querySelectorAll('.stake-tab').length,3,'Keep Overview / Explore Actors / Issue Focus');
tabs[1].events.click();
assert.equal(hierarchy.hidden,false);
assert.equal(network.hidden,true);
console.log('Energy Security parity QA PASS: '+org.nodes.length+' institutional/oversight/state nodes; '+org.market.length+' operators; one explorer, two tabs, original interactive network retained.');
