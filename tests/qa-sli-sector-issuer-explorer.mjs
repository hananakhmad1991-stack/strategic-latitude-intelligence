import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const groups=JSON.parse(read("data/sli-corporate-group-registry.json"));
const universe=JSON.parse(read("data/sli-idx-issuer-universe.json"));
const expectedIndex=new Map(universe.records.map(n=>[n.ticker,n]));
for(const n of groups.records)if(n.exchange==='IDX'&&n.ticker&&!expectedIndex.has(n.ticker))expectedIndex.set(n.ticker,{ticker:n.ticker,sector:n.sector});
const expectedUniverse=[...expectedIndex.values()];
function mount(){
 class El{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.dataset={};this.listeners={};this.classList={add(){}};this.value='';this.textContent='';this.style={};this.hidden=false;this.id='';this.parentNode=null;}
  append(...nodes){for(const n of nodes){this.children.push(n);if(n&&typeof n==='object')n.parentNode=this;}}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  addEventListener(k,cb){this.listeners[k]=cb;}
  setAttribute(k,v){this.attrs[k]=String(v);}
  scrollIntoView(){}
  remove(){}
  click(){this.listeners.click?.();}
 }
 const ids=new Map();
 const get=id=>{if(!ids.has(id))ids.set(id,new El('div'));return ids.get(id)};
 const registered={};
 const document={
  documentElement:{lang:"id"},readyState:"loading",getElementById:get,
  createElement:tag=>new El(tag),querySelectorAll:()=>[],body:new El('body'),
  addEventListener:(k,cb)=>{registered[k]=cb}
 };
 const responses={"./data/sli-corporate-group-registry.json":groups,"./data/sli-idx-issuer-universe.json":universe};
 const fetch=async url=>({ok:true,json:async()=>responses[url]});
 const window={SLIEntityIdentity:{nameKey:s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),brand:()=>new El('i')}};
 const script=read("js/sli-corporate-groups.js");
 const context={document,window,fetch,location:{search:''},URL,URLSearchParams,Intl,console,Blob,setTimeout};
 vm.runInNewContext(script,context,{filename:"js/sli-corporate-groups.js"});
 const walk=n=>[n,...(n.children||[]).flatMap(walk)];
 return {ids,get,registered,walk,El};
}
async function ready(){
 const ui=mount();ui.registered.DOMContentLoaded();
 for(let i=0;i<14;i++)await Promise.resolve();
 return ui;
}
test("Sector group explorer surfaces all source-labelled ticker candidates, never just eight curated groups",async()=>{
 const {get,walk}=await ready();
 const energy=universe.records.filter(n=>n.sector==='energy');
 const tabs=walk(get('sliCgGroupTabs')).filter(n=>n.dataset?.sliCgIssuer);
 assert.equal(tabs.length,1,"Exactly one IDX sector tab");
 assert.match(tabs[0].textContent,new RegExp(String(energy.length)));
 assert.equal(tabs[0].attrs['aria-pressed'],'true',"Issuer list must be default, not eight groups");
 assert.match(get('sliCgCount').textContent,new RegExp(String(energy.length)));
 const issuerButtons=walk(get('sliCgTree')).filter(n=>n.dataset?.issuerTicker);
 assert.equal(issuerButtons.length,energy.length);
 assert.ok(issuerButtons.some(n=>n.dataset.issuerTicker==='BREN'),"New energy issuer must be accessible");
 assert.equal(get('sliCgIssuerRows').children.length,energy.length);
 assert.match(get('sliCgDossier').children.map(x=>x.textContent).join(' '),/katalog/i);
});
test("Coal, minerals, AI/tech and food select complete sector ticker set, and 12-sector All can load more",async()=>{
 const {get,walk}=await ready();
 const select=get('sliCgSector');
 for(const sector of ['coal','minerals','technology','food','finance']){
  select.value=sector;select.listeners.change();
  const expected=expectedUniverse.filter(x=>x.sector===sector).length;
  assert.ok(expected>10,sector);
  assert.equal(walk(get('sliCgTree')).filter(x=>x.dataset?.issuerTicker).length,expected,sector);
  assert.equal(get('sliCgIssuerRows').children.length,expected+groups.records.filter(n=>n.listing_status==='listed'&&n.exchange!=='IDX'&&n.sector===sector).length,sector);
 }
 select.value='all';select.listeners.change();
 assert.equal(walk(get('sliCgTree')).filter(x=>x.dataset?.issuerTicker).length,60);
 const more=walk(get('sliCgTree')).find(n=>n.tagName==='button'&&String(n.textContent).includes('60 ticker'));
 assert.ok(more,"Pagination control needed when catalogue has >60");
 more.click();
 assert.equal(walk(get('sliCgTree')).filter(x=>x.dataset?.issuerTicker).length,120);
 assert.equal(get('sliCgIssuerRows').children.length,expectedUniverse.length+groups.records.filter(n=>n.listing_status==='listed'&&n.exchange!=='IDX').length,"Disclosure table includes IDX catalogue plus overseas-listed group companies");
});
test("Ticker search and group-tree jump preserve evidence status and avoid fictitious children",async()=>{
 const {get,walk}=await ready();
 const search=get('sliCgSearch');search.value='BREN';search.listeners.input({target:search});
 const matches=walk(get('sliCgTree')).filter(n=>n.dataset?.issuerTicker);
 assert.equal(matches.length,1);
 assert.equal(matches[0].dataset.issuerTicker,'BREN');
 assert.ok(walk(get('sliCgDossier')).some(x=>String(x.textContent).includes('BREN')));
 const disclaimer=walk(get('sliCgDossier')).filter(n=>/direktori resmi|katalog kandidat/i.test(n.textContent||''));
 assert.ok(disclaimer.length>0,"Unverified catalogue must display provenance warning");
 search.value='';search.listeners.input({target:search});
 const antm=walk(get('sliCgTree')).find(n=>n.dataset?.issuerTicker==='ANTM');
 // "ANTM" belongs to another sector; select minerals then use same issuer panel.
 // Search must continue to find non-listed subsidiary names in the original tree.
 search.value='Pertagas';search.listeners.input({target:search});
 assert.match(get('sliCgCount').textContent,/catatan grup terpilih/,"Non-listed company lookup must reopen sourced group search");
 assert.ok(walk(get('sliCgTree')).some(n=>String(n.textContent).includes('Pertamina Gas')),"Search must not lose group-only subsidiaries");
 search.value='';search.listeners.input({target:search});
 const sectors=get('sliCgSector');sectors.value='minerals';sectors.listeners.change();
 const antm2=walk(get('sliCgTree')).find(n=>n.dataset?.issuerTicker==='ANTM');
 assert.ok(antm2);
 antm2.click();
 const grp=walk(get('sliCgDossier')).find(n=>String(n.textContent).includes('Buka pohon grup bersumber'));
 assert.ok(grp,"Only curated group members get an explicit group-tree link");
 grp.click();
 assert.match(get('sliCgCount').textContent,/catatan grup terpilih/);
 assert.ok(walk(get('sliCgTree')).some(n=>String(n.textContent).includes('PT Mineral Industri Indonesia')),"Curated MIND ID tree remains intact");
});
test("UI tells the user about incomplete verification and preserves source URL/NA",()=>{
 const html=read("sli-entities.html"),js=read("js/sli-corporate-groups.js");
 assert.match(html,/Pilih “Emiten BEI”|Pilih 'Emiten BEI'/);
 assert.match(html,/value="finance"/);
 assert.match(html,/value="healthcare"/);
 assert.match(js,/ISSUERS='\.\x2fdata\x2fsli-idx-issuer-universe\.json'/);
 assert.match(js,/idx_seed_awaiting_official_refresh|initial IDX ticker catalogue/i);
 assert.match(js,/N\/A/);
 assert.doesNotMatch(js,/\.innerHTML\s*=/);
 assert.ok(universe.records.length>=260);
 assert.equal(new Set(universe.records.map(x=>x.ticker)).size,universe.records.length);
});
