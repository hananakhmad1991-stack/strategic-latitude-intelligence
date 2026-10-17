import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const data=JSON.parse(read('data/sli-bps-regional-intelligence.json'));
const html=read('geopolitical-impact-assessment.html');
const js=read('js/sli-bps-regional-visual.js');
test('selected expenditure and civic sources have 38 distinct provinces and source provenance',()=>{
 assert.equal(data.provinces.length,38);
 assert.equal(new Set(data.provinces.map(p=>p.name)).size,38);
 assert.deepEqual(data.grdp_years,[2021,2022,2023,2024,2025]);
 assert.deepEqual(data.press_years,[2020,2021,2022,2023,2024]);
 for(const p of data.provinces){
  for(const name of ['grdp_current','grdp_constant','household_current','pmtb_current','press_freedom'])assert.equal(p[name].length,5,p.name+' / '+name);
  assert.equal(p.dpt_2024.length,3);
  if(p.dpt_2024[2]!=null)assert.equal(p.dpt_2024[0]+p.dpt_2024[1],p.dpt_2024[2]);
 }
 assert.match(data.sources.pdrb.url,/bps\.go\.id/);
 assert.match(data.sources.politics.url,/bps\.go\.id/);
 assert.equal(data.idi.at(-1).national,79.81);
 assert.equal(data.national_press_freedom.at(-1).value,69.36);
});
test('account numbers preserve BPS precision, revisions, noncomparability and missing provinces',()=>{
 const find=name=>data.provinces.find(p=>p.name===name);
 assert.equal(find('DKI Jakarta').grdp_current[4],3926153.30);
 assert.equal(find('Jawa Barat').pmtb_current[4],743275.41);
 assert.equal(find('Banten').grdp_current[4],936203.98);
 assert.equal(find('Papua Barat Daya').grdp_current[0],null);
 assert.equal(find('Papua Tengah').grdp_constant[1],null);
 assert.equal(find('DI Yogyakarta').dpt_2024[2],null);
 assert.equal(find('Jawa Barat').press_freedom[4],73.41);
 assert.match(data.caveats.join(' '),/2025 figures preliminary/);
 assert.match(data.caveats.join(' '),/not BKPM realized/);
});
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.handlers={};this.attrs={};this._text='';this.value='';this.style={};this.hidden=false;this.download='';}
 get textContent(){return this._text+this.children.map(x=>x.textContent||'').join('');}
 set textContent(x){this._text=String(x);this.children=[];}
 append(...a){this.children.push(...a);}
 replaceChildren(...a){this.children=[...a];this._text='';}
 setAttribute(k,v){this.attrs[k]=String(v);}
 addEventListener(k,cb){(this.handlers[k]??=[]).push(cb);}
 fire(k){for(const cb of this.handlers[k]||[])cb();}
 click(){this.fire('click');}
 remove(){}
}
async function mount(failed=false){
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 const els=Object.fromEntries(ids.map(x=>[x,new Element]));
 els.regFamily.value='economy';els.regOrder.value='alpha';
 const clicked=[],blobs=[];
 const document={readyState:'complete',getElementById:id=>els[id],createElement:t=>{const a=new Element(t);if(t==='a')a.click=()=>clicked.push(a.download);return a},createElementNS:(_ns,t)=>new Element(t),body:new Element('body')};
 const fetch=async()=>failed?{ok:false,status:404}:{ok:true,json:async()=>data};
 const URL={createObjectURL(blob){blobs.push(blob);return 'blob:test'},revokeObjectURL(){}};
 runInNewContext(js,{document,fetch,Intl,Blob,URL,setTimeout:fn=>fn()});
 for(let i=0;i<60;i++)await Promise.resolve();
 return {els,clicked,blobs};
}
test('Regional Data tab actually renders BPS chart, 38 province comparisons and source references',async()=>{
 const x=await mount(),e=x.els;
 assert.equal(e.regProvince.children.length,38);
 assert.equal(e.regProvinceBars.children.length,38);
 assert.equal(e.regMetric.children.length,6);
 assert.equal(e.regYear.children.length,5);
 assert.match(e.regCurrentValue.textContent,/3,038,667\.95/);
 assert.match(e.regPrimarySource.href,/bps\.go\.id/);
 assert.ok(e.regTrend.children.length>5);
 assert.ok(e.regIDITrend.children.length>5);
});
test('real growth derivation is year-aligned and PMTB share is not treated as PMA',async()=>{
 const {els:e}=await mount();
 e.regMetric.value='real_growth';e.regMetric.fire('change');
 assert.equal(e.regYear.value,'2025');
 const p=data.provinces.find(x=>x.name==='Jawa Barat');
 const expected=100*(p.grdp_constant[4]/p.grdp_constant[3]-1);
 assert.equal(e.regCurrentValue.textContent,Number(expected).toLocaleString('en-US',{maximumFractionDigits:2})+'%');
 e.regMetric.value='pmtb_share';e.regMetric.fire('change');
 const share=100*p.pmtb_current[4]/p.grdp_current[4];
 assert.equal(e.regCurrentValue.textContent,Number(share).toLocaleString('en-US',{maximumFractionDigits:2})+'%');
 assert.match(e.regSummary.textContent,/not realized investment from BKPM/);
});
test('civic filters, provenance, province changes and null 2024 election DPT stay legible',async()=>{
 const {els:e}=await mount();
 e.regFamily.value='civic';e.regFamily.fire('change');
 assert.equal(e.regMetric.value,'press_freedom');assert.equal(e.regYear.value,'2024');
 assert.equal(e.regCurrentValue.textContent,'73.41');
 e.regMetric.value='dpt_2024';e.regMetric.fire('change');
 assert.match(e.regCurrentValue.textContent,/35,925,960 people/);
 e.regProvince.value='14';e.regProvince.fire('change');
 assert.equal(e.regCurrentValue.textContent,'N/A');
 e.regMetric.value='press_freedom';e.regMetric.fire('change');
 assert.match(e.regPrimarySource.href,/statistik-politik-2025/);
});
test('filtered CSV can be downloaded without unlicensed price estimates or added ratings',async()=>{
 const {els:e,clicked,blobs}=await mount();
 e.regSearch.value='Jawa Barat';e.regSearch.fire('input');
 assert.equal(e.regProvinceBars.children.length,1);
 e.regExport.fire('click');
 assert.equal(clicked[0],'sli-bps-grdp_current-2025.csv');
 assert.equal(blobs.length,1);
 const csv=await blobs[0].text();
 assert.match(csv,/Jawa Barat/);
 assert.doesNotMatch(csv,/Jawa Tengah/);
 assert.match(csv,/provisional/);
 assert.match(csv,/bps.go.id/);
});
test('missing source fails visibly rather than inventing economic or civic values',async()=>{
 const {els:e}=await mount(true);
 assert.match(e.regSummary.textContent,/unavailable/i);
 assert.match(e.regDataStatus.textContent,/Unavailable/);
});
test('source IDs, navigation and HTML remain internally consistent',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const id of [...js.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]))assert.ok(ids.includes(id),'missing '+id);
 assert.match(html,/data-view="regional"/);
 assert.doesNotThrow(()=>new Function(js));
});
