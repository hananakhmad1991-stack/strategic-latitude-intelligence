import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const js=fs.readFileSync('js/research-chapters.js','utf8');
const html=fs.readFileSync('index.html','utf8');
class Node {
 constructor(tag){this.tagName=tag;this.children=[];this.className='';this.id='';this.href='';this._text='';this.events={};this.isConnected=true;this.style={};this.classList={contains:s=>this.className.split(' ').includes(s)}}
 append(...arr){for(let n of arr){if(typeof n==='string'){let t=new Node('#text');t.textContent=n;n=t}if(n)this.children.push(n)}}
 replaceChildren(...arr){this.children=[];this.append(...arr)}
 setAttribute(k,v){this[k]=v}
 addEventListener(k,f){this.events[k]=f}
 get textContent(){return this._text||this.children.map(n=>n.textContent).join(' ')}
 set textContent(v){this._text=String(v)}
 querySelector(q){return this.querySelectorAll(q)[0]||null}
 querySelectorAll(q){let out=[];const match=n=>q==='h3'?n.tagName==='h3':q==='a[href^="https://"]'?n.tagName==='a'&&n.href.startsWith('https://'):false;const walk=n=>{for(const c of n.children){if(match(c))out.push(c);walk(c)}};walk(this);return out}
 scrollIntoView(){this.scrolled=true}
 remove(){}
}
class URLMock {constructor(url){this.hostname=url.split('/')[2]||'unknown'}}
const root=new Node('div');
const document={createElement:t=>new Node(t),createTextNode:v=>{let n=new Node('#text');n.textContent=v;return n},getElementById:id=>id==='sliResearchRoot'?root:null,addEventListener(){}};
const window={};
const investment=JSON.parse(fs.readFileSync('data/investment-evidence.json','utf8'));
const sector=JSON.parse(fs.readFileSync('data/sector-evidence-catalog.json','utf8'));
const aiFeed=JSON.parse(fs.readFileSync('data/ai-monitoring.json','utf8'));
const fixtures={'data/investment-evidence.json':investment,'data/sector-evidence-catalog.json':sector,'data/ai-monitoring.json':aiFeed};
const fetch=async path=>(path in fixtures?{ok:true,json:async()=>fixtures[path]}:{ok:false,status:404});
vm.runInNewContext(js,{window,document,URL:URLMock,fetch});
for(const name of ['minerals','ai']){
 window.initSLIResearch(name);
 for(let i=0;i<10;i++)await Promise.resolve();
 const sections=root.children.filter(n=>n.classList.contains('es-stage'));
 const nav=root.children.find(n=>n.classList.contains('es-toc'));
 assert.equal(sections.length,9,name+' requires 9 Energy Security stages');
 assert.equal(nav?.children.length,9,name+' requires 9 working chapter navigation items');
 for(let i=0;i<9;i++)assert.ok(sections[i].children.length>1,name+' has an empty stage '+(i+1));
 assert.match(sections[0].textContent,/ESDM|Komdigi/);
 assert.match(sections[2].textContent,/Project|Site|Implementation/);
 assert.match(sections[7].textContent,/Assessment/);
 const contents=[];const visit=n=>{contents.push(n);for(const x of n.children)visit(x)};visit(sections[2]);
 const rowCount=contents.filter(n=>n.tagName==='tr').length;
 const chartBars=contents.filter(n=>n.className==='sli-stage-count-bar').length;
 assert.ok(rowCount>=4,name+' needs populated, source-dated project table');
 assert.ok(chartBars>=1,name+' needs project stage chart rendered from the actual dataset');
 nav.children[0].events.click({preventDefault(){}});
 assert.equal(sections[0].scrolled,true,'chapter link should scroll, not navigate to overview');
 console.log(name+': 9 populated stages and working section navigation');
}
const projects=JSON.parse(fs.readFileSync('data/investment-evidence.json','utf8')).projects;
assert.ok(projects.filter(p=>p.sector==='Critical minerals').length>=5);
assert.ok(projects.filter(p=>p.sector==='AI infrastructure').length>=3);
assert.ok(html.includes('research-chapters.js?'));
console.log('SLI research dashboard structure checks PASS');
