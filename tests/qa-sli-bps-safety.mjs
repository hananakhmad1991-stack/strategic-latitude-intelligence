import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=file('geopolitical-impact-assessment.html');
const script=file('js/sli-bps-safety-visual.js');
const data=JSON.parse(file('data/sli-bps-public-safety.json'));
class Element{
 constructor(tag='div'){this.tag=tag;this._text='';this.children=[];this.events={};this.attrs={};this.value='';this.style={};this.href='';this.download='';}
 get textContent(){return this._text+this.children.map(x=>x.textContent||'').join('')}
 set textContent(x){this._text=String(x);this.children=[]}
 append(...args){this.children.push(...args)}
 replaceChildren(...args){this.children=[...args];this._text=''}
 setAttribute(k,v){this.attrs[k]=String(v)}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn)}
 fire(k){for(const fn of this.events[k]||[])fn()}
 click(){this.fire('click')}
 remove(){}
}
async function mount(failed=false){
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 const els=Object.fromEntries(ids.map(id=>[id,new Element()]));
 els.safFamily.value='susenas';els.safSort.value='alpha';
 const downloaded=[],blobs=[];
 const document={readyState:'complete',getElementById:id=>els[id],createElement:tag=>{const x=new Element(tag);if(tag==='a')x.click=()=>downloaded.push(x.download);return x},createElementNS:(_ns,tag)=>new Element(tag),body:new Element('body')};
 const fetch=async()=>failed?{ok:false,status:503}:{ok:true,json:async()=>data};
 const URL={createObjectURL(blob){blobs.push(blob);return 'blob:test'},revokeObjectURL(){}};
 runInNewContext(script,{document,fetch,Intl,Blob,URL,setTimeout:fn=>fn()});
 for(let i=0;i<75;i++)await Promise.resolve();
 return {els,blobs,downloaded};
}
test('34 distinct Polda jurisdictions reconcile exactly to Polri 2023–24 national records',()=>{
 assert.equal(data.police_districts.length,34);
 assert.equal(new Set(data.police_districts.map(x=>x.jurisdiction)).size,34);
 assert.deepEqual(data.police_districts.reduce((acc,p)=>{acc[0]+=p.recorded_cases[0];acc[1]+=p.recorded_cases[1];return acc},[0,0]),[584991,561993]);
 assert.equal(data.police_districts.find(x=>x.jurisdiction==='Metro Jaya').recorded_cases[1],77261);
 assert.equal(data.police_districts.find(x=>x.jurisdiction==='Jawa Timur').recorded_rate_100k[1],142);
 assert.ok(data.warnings.some(x=>x.includes('Polda Papua')));
});
test('38 provinces have truthful missing data and correctly separated source denominators',()=>{
 assert.equal(data.provinces.length,38);
 assert.equal(data.metrics.length,8);
 assert.ok(data.provinces.every(x=>x.victim_prevalence_pct.length===2&&x.victim_reported_to_police_pct.length===2&&x.village_mass_conflict_pct.length===2));
 const d=data.provinces.find(x=>x.name==='Jawa Barat');
 assert.deepEqual(d.victim_prevalence_pct,[0.63,1.3]);
 assert.deepEqual(d.village_mass_conflict_count,[158,218]);
 assert.equal(data.provinces.find(x=>x.name==='Kepulauan Riau').village_mass_conflict_count[1],0);
 assert.equal(data.provinces.find(x=>x.name==='Papua Barat Daya').village_mass_conflict_pct[0],null);
 assert.equal(data.provinces.find(x=>x.name==='Papua Tengah').victim_reported_to_police_pct[1],null);
 assert.equal(data.provinces.find(x=>x.name==='Papua Pegunungan').victim_reported_to_police_pct[0],null);
});
test('BPS national Police, Susenas and Podes snapshots remain separate and dated',()=>{
 assert.deepEqual(data.national.police_cases,[584991,561993]);
 assert.deepEqual(data.national.victim_prevalence_pct,[.45,.73]);
 assert.deepEqual(data.national.victim_reporting_pct,[23.36,20.28]);
 assert.deepEqual(data.national.village_mass_conflict_pct,[1.85,2.41]);
 assert.match(data.source_url,/bps\.go\.id/);
 assert.equal(data.publication_date,'2025-12-12');
 assert.ok(data.warnings.some(x=>x.includes('not identical')));
});
test('Public Safety tab is navigable, source linked and has no missing DOM elements',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const id of [...script.matchAll(/\$\('([^']+)'\)/g)].map(x=>x[1]))assert.ok(ids.includes(id),'missing '+id);
 assert.match(html,/data-view="safety"/);
 assert.match(file('js/sli-indonesia-original-intelligence.js'),/'safety'/);
 assert.doesNotThrow(()=>new Function(script));
});
test('Susenas province dropdown, charts, year change and data source are functional',async()=>{
 const {els:e}=await mount();
 assert.equal(e.safArea.children.length,38);
 assert.equal(e.safAreaBars.children.length,38);
 assert.equal(e.safMetric.children.length,4);
 assert.match(e.safValue.textContent,/1.3%/);
 assert.match(e.safSourceLabel.textContent,/Appendix 45/);
 assert.ok(e.safTrend.children.length>0);
 e.safYear.value='2023';e.safYear.fire('change');assert.equal(e.safValue.textContent,'0.63%');
});
test('switching to police changes geography to 34 Polda jurisdictions, not province proxy',async()=>{
 const {els:e}=await mount();
 e.safFamily.value='police';e.safFamily.fire('change');
 assert.equal(e.safArea.children.length,34);
 assert.equal(e.safAreaBars.children.length,34);
 assert.equal(e.safMetric.children.length,2);
 assert.match(e.safCaveat.textContent,/Metro Jaya/);
 e.safArea.value='Metro Jaya';e.safArea.fire('change');
 assert.equal(e.safValue.textContent,'77,261');
 assert.match(e.safSelectedArea.textContent,/Polda jurisdiction/);
});
test('Podes years are 2021 and 2024, and N/A is not converted to zero',async()=>{
 const {els:e}=await mount();
 e.safFamily.value='podes';e.safFamily.fire('change');
 assert.equal(e.safYear.children.length,2);
 e.safArea.value='Papua Barat Daya';e.safArea.fire('change');
 e.safYear.value='2021';e.safYear.fire('change');
 assert.equal(e.safValue.textContent,'N/A');
 e.safArea.value='Kepulauan Riau';e.safArea.fire('change');
 e.safYear.value='2024';e.safYear.fire('change');
 assert.equal(e.safValue.textContent,'0%');
});
test('search and CSV exports use displayed source, period, and observation status',async()=>{
 const {els:e,blobs,downloaded}=await mount();
 e.safSearch.value='Jawa Barat';e.safSearch.fire('input');
 assert.equal(e.safAreaBars.children.length,1);
 e.safDownload.fire('click');
 assert.equal(downloaded[0],'sli-bps-safety-victim_prevalence_pct-2024.csv');
 const csv=await blobs[0].text();assert.match(csv,/Jawa Barat/);assert.doesNotMatch(csv,/Jawa Tengah/);assert.match(csv,/bps\.go\.id/);assert.match(csv,/observed_historical/);
});
test('source failure does not silently render synthetic or stale incident values',async()=>{
 const {els:e}=await mount(true);
 assert.equal(e.safValue.textContent,'N/A');
 assert.match(e.safStatus.textContent,/unavailable/);
});
