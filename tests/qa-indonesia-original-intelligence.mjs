import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=file('geopolitical-impact-assessment.html');
const js=file('js/sli-indonesia-original-intelligence.js');
const data=JSON.parse(file('data/sli-indonesia-original-intelligence.json'));
class El{
 constructor(tag='div'){this.tag=tag;this.children=[];this.handlers={};this.attrs={};this.dataset={};this._text='';this.value='';this.style={};this.hidden=false;this.onclick=null;}
 get textContent(){return this._text+this.children.map(x=>x.textContent||'').join('');}
 set textContent(x){this._text=String(x);this.children=[];}
 append(...items){this.children.push(...items);}
 replaceChildren(...items){this._text='';this.children=[...items];}
 setAttribute(k,v){this.attrs[k]=String(v);}
 addEventListener(k,fn){(this.handlers[k]??=[]).push(fn);}
 fire(k){if(k==='click'&&this.onclick)this.onclick({preventDefault(){}});for(const fn of this.handlers[k]||[])fn({preventDefault(){}});}
 scrollIntoView(){}
}
async function mount(initialHash='',fail=false){
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 const els=Object.fromEntries(ids.map(id=>[id,new El()]));
 const tabs=['snapshot','global','sectors','dossiers'].map(view=>{const el=new El('button');el.dataset.view=view;return el;});
 const document={readyState:'complete',getElementById:id=>els[id],querySelectorAll:s=>s==='[data-view]'?tabs:[],createElement:tag=>new El(tag)};
 const location={hash:initialHash};
 const window={history:{pushState:(_a,_b,v)=>location.hash=v},addEventListener(){}};
 const fetch=async()=>fail?{ok:false,status:503}:{ok:true,json:async()=>data};
 runInNewContext(js,{document,window,location,fetch,Intl,Number,Math});
 for(let i=0;i<80;i++)await Promise.resolve();
 return {els,tabs,location};
}
test('SLI owns the intelligence model, has six distinct topics, and contains no reused external power indices',()=>{
 assert.equal(data.domains.length,7);
 assert.equal(data.domains.reduce((n,d)=>n+d.topics.length,0),21);
 assert.equal(data.metrics.length,18);
 assert.equal(data.partners.length,5);
 assert.equal(data.sectors.length,6);
 assert.ok(data.domains.every(d=>d.topics.every(t=>t.analysis&&t.watch&&Array.isArray(t.metric_ids))));
 assert.ok(data.metrics.every(m=>m.period&&m.publisher&&m.source_url?.startsWith('https://')));
 assert.ok(data.partners.every(p=>p.period==='2025 full year'&&p.source_url.includes('bps.go.id')));
 assert.doesNotMatch(html+js+file('data/sli-indonesia-original-intelligence.json'),/lowy|asia power index|power gap|comprehensive power|30 sub.measures/i);
 assert.doesNotMatch(html,/methodology/i);
});
test('independent research frontend has unique IDs and all script targets are real',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const m of js.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(m[1]),m[1]);
 assert.doesNotThrow(()=>new Function(js));
 assert.match(html,/sli-indonesia-original-intelligence\.js/);
});
test('overview indicators, global trade, sector cards and dossiers render',async()=>{
 const {els}=await mount();
 assert.equal(els.headlineKpis.children.length,4);
 assert.equal(els.highlights.children.length,4);
 assert.equal(els.partnerList.children.length,5);
 assert.equal(els.partnerName.textContent,'China');
 assert.equal(els.sectorGrid.children.length,6);
 assert.equal(els.dossierGrid.children.length,7);
 assert.match(els.leadText.textContent,/Q2 2026 growth/);
});
test('clicking domain then issue shows original analysis, sourced statistic and shareable route',async()=>{
 const {els,tabs,location}=await mount();
 tabs[3].fire('click');
 els.dossierGrid.children[0].fire('click');
 assert.equal(els.dossierGrid.children.length,3);
 assert.equal(location.hash,'#dossiers/economy');
 els.dossierGrid.children[0].fire('click');
 assert.equal(location.hash,'#dossiers/economy/growth');
 assert.equal(els.issueName.textContent,'Growth and demand');
 assert.match(els.issueAnalysis.textContent,/Q2 2026/);
 assert.equal(els.issueEvidence.children.length,1);
 els.dossierBack.fire('click');assert.equal(els.issueDetail.hidden,true);
});
test('no invented statistic is shown for a qualitative intelligence issue',async()=>{
 const {els}=await mount('#dossiers/technology/datacenters');
 assert.equal(els.issueName.textContent,'AI and cloud deployment');
 assert.match(els.issueAnalysis.textContent,/Cloud and AI/);
 // This analytical item has an explicitly cited investment context, not fictitious installed AI MW.
 assert.doesNotMatch(els.issueEvidence.textContent,/GPU count|100MW of compute/);
});
test('country and sector selectors update their observations and leave sources visible',async()=>{
 const {els}=await mount();
 els.partnerList.children[1].fire('click');
 assert.equal(els.partnerName.textContent,'United States');
 assert.match(els.partnerBalance.textContent,/18\.11/);
 assert.match(els.partnerSource.href,/bps\.go\.id/);
 els.sectorGrid.children[2].fire('click');
 assert.equal(els.sectorName.textContent,'Coal and thermal power');
 assert.ok(els.sectorEvidence.children.length===2);
 els.sectorExplore.fire('click');
 assert.equal(els.dossierGrid.children.length,3);
});
test('source fetch failure is clearly reported, not replaced by estimated measurements',async()=>{
 const {els}=await mount('',true);
 assert.match(els.leadTitle.textContent,/unavailable/);
 assert.match(els.asOf.textContent,/unavailable/);
});
test('qualitative trade and AI dossiers link directly to dated source documents',async()=>{
 const trade=await mount('#dossiers/trade/counterparty');
 assert.equal(trade.els.issueName.textContent,'Partner concentration');
 assert.equal(trade.els.issueEvidence.children.length,1);
 assert.equal(trade.els.issueRelatedSources.hidden,false);
 assert.match(trade.els.issueSourceLinks.textContent,/BPS bilateral/);
 const tech=await mount('#dossiers/technology/datacenters');
 assert.equal(tech.els.issueRelatedSources.hidden,false);
 assert.match(tech.els.issueSourceLinks.textContent,/announced, not realized/);
 assert.match(tech.els.issueSourceLinks.textContent,/operational launch/);
});
