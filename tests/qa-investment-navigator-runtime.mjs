import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const page=read('indonesia-investment-navigator.html'),code=read('js/sli-investment-navigator.js');
const filenames=['data/sli-indonesia-investment-navigator.json','data/sli-macro-indonesia-2026.json','data/sli-market-observations.json','data/research-signal-radar.json','data/sli-project-registry.json'];
class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.attrs={};this.handlers={};this.dataset={};this.value='';this._text='';this.disabled=false;this.hidden=false;}
 get textContent(){return this._text+this.children.map(x=>x.textContent||'').join('');}
 set textContent(x){this._text=String(x);this.children=[];}
 append(...items){this.children.push(...items);}
 replaceChildren(...items){this.children=[...items];this._text='';}
 get firstChild(){return this.children[0];}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,cb){(this.handlers[k]??=[]).push(cb);}
 fire(k){for(const h of this.handlers[k]||[])h();}
 click(){this.fire('click');}
 remove(){}
}
async function mount(overrides={}){
 const map=new Map(filenames.map(x=>[x,JSON.parse(read(x))]));
 for(const [path,v] of Object.entries(overrides))map.set(path,v);
 const ids=[...page.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]),els=Object.fromEntries(ids.map(x=>[x,new Element()]));
 els.stockSort.value='ticker';
 const tabs=['macro','equity','fdi'].map(name=>{const e=new Element('button');e.dataset.section=name;return e;});
 const body=new Element('body');const blobs=[],downloads=[];
 const document={readyState:'complete',body,getElementById:id=>els[id]||null,createElement:tag=>{const x=new Element(tag);if(tag==='a')x.click=()=>{downloads.push(x.download)};return x;},createElementNS:(_,tag)=>new Element(tag),querySelectorAll:sel=>sel==='[data-section]'?tabs:[]};
 const location={hash:''},history={replaceState:(_a,_b,url)=>location.hash=url};
 const fetch=async uri=>{const key=uri.replace(/^\.\//,'');return {ok:map.has(key),status:map.has(key)?200:404,json:async()=>map.get(key)}};
 const URLMock={createObjectURL(blob){blobs.push(blob);return 'blob:unit-test'},revokeObjectURL(){}};
 runInNewContext(code,{document,window:{addEventListener(){}},fetch,location,history,URL:URLMock,Blob,setTimeout:fn=>fn()});
 for(let i=0;i<60;i++)await Promise.resolve();
 return {els,tabs,blobs,downloads};
}
test('real DOM workflow loads official data, filters each dataset and switches tabs',async()=>{
 const {els,tabs}=await mount();
 assert.equal(els.macroCards.children.length,7);
 assert.match(els.macroCards.children[0].textContent,/JISDOR/);
 assert.equal(els.macroContext.children.length,8);
 assert.equal(els.stocks.children.length,15);
 assert.equal(els.fdiProjects.children.length,15);
 assert.match(els.fdiCount.textContent,/25 source-dated registry/);
 assert.equal(els.newsCards.children.length,12);
 els.newsTopic.value='ai';els.newsTopic.fire('change');
 assert.match(els.newsCount.textContent,/18 matching/);
 assert.equal(els.newsCards.children.length,12);
 els.stockSearch.value='BBCA';els.stockSearch.fire('input');
 assert.equal(els.stocks.children.length,1);
 assert.match(els.stocks.children[0].textContent,/BBCA/);
 tabs[2].click();assert.equal(els.fdi.hidden,false);assert.equal(els.macro.hidden,true);
 els.fdiSearch.value='nickel';els.fdiSearch.fire('input');
 assert.ok(els.fdiProjects.children.length>0&&els.fdiProjects.children.length<15);
});
test('watchlist CSV exports only filtered and source-labelled rows',async()=>{
 const {els,blobs,downloads}=await mount();
 els.stockSearch.value='BBCA';els.stockSearch.fire('input');
 els.watchlistCsv.click();
 assert.equal(downloads[0],'sli_idx_sector_watchlist.csv');
 assert.equal(blobs.length,1);
 const csv=await blobs[0].text();
 assert.match(csv,/BBCA/);assert.doesNotMatch(csv,/BBRI/);
 assert.match(csv,/monitoring only; not advice/);
});
test('an unlicensed market quote never becomes a displayed stock price',async()=>{
 const mocked=JSON.parse(read('data/sli-market-observations.json'));
 mocked.observations=[{symbol:'BBCA',value:999999,unit:'IDR/share',source_url:'https://example.com',observation_date:'2026-10-17'}];
 const {els}=await mount({'data/sli-market-observations.json':mocked});
 assert.match(els.stocks.children.find(row=>row.textContent.includes('BBCA')).textContent,/N\/A · unlicensed/);
 assert.match(els.marketRightsStatus.textContent,/not licensed/);
});
test('missing project registry reports an error while equity and macro continue',async()=>{
 const {els}=await mount({'data/sli-project-registry.json':null});
 assert.equal(els.macroCards.children.length,7);
 assert.equal(els.stocks.children.length,15);
 assert.match(els.fdiLoadStatus.textContent,/unavailable/);
});