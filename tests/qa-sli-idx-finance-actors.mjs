import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext, Script} from 'node:vm';

const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const issuers=JSON.parse(get('data/sli-idx-issuer-universe.json'));
const groups=JSON.parse(get('data/sli-corporate-group-registry.json'));
const relations=JSON.parse(get('data/sli-corporate-evidence-relationships.json'));
const assets=JSON.parse(get('data/sli-issuer-actor-assets.json'));

test('260-ticker catalog exposes 12 sectors while retaining explicit not-a-census warning',()=>{
 assert.equal(issuers.records.length,260);
 const sectors=new Set(issuers.records.map(x=>x.sector));
 assert.equal(sectors.size,12);
 const s=get('js/sli-idx-sector-watchlist.js');
 new Script(s);
 for(const sector of sectors)assert.ok(s.includes('"'+sector+'"'),sector+' must have a visible sector tab');
 assert.match(s,/issuerQuery=/);
 assert.match(s,/NOT the full IDX issuer universe/);
 assert.match(s,/candidates.length/);
 assert.match(get('index.html'),/js\/sli-idx-sector-watchlist\.js\?v=20261022-actorsfinance2/);
});

test('dated fundamentals have explicit primary-source provenance and do not invent N/A',()=>{
 const finance=issuers.records.filter(x=>x.revenue!==null||x.net_income!==null||x.total_assets!==null);
 assert.equal(finance.length,3,'This tranche validates three issuer reports, not every ticker');
 const by=Object.fromEntries(finance.map(x=>[x.ticker,x]));
 assert.deepEqual(finance.map(x=>x.ticker).sort(),['MEDC','PTBA','TLKM']);
 assert.equal(by.MEDC.revenue,2395);
 assert.equal(by.MEDC.net_income,101);
 assert.equal(by.MEDC.financial_currency,'USD million');
 assert.equal(by.MEDC.total_assets,null,'Unverified 2025 assets remain unavailable');
 assert.equal(by.TLKM.total_assets,287759);
 assert.equal(by.PTBA.revenue,42651.724);
 for(const x of finance){
  assert.match(x.financial_source_url,/^https:\/\//);
  assert.match(x.financial_period,/2025/);
  assert.ok(x.financial_basis);
 }
 assert.ok(issuers.records.every(x=>x.market_cap===null),'No copied TradingView market caps');
 assert.equal(groups.records.find(x=>x.ticker==='MEDC').revenue,2395);
 assert.match(get('scripts/sync_sli_idx_issuers.py'),/has_financial_evidence/,'Official IDX sync must not wipe source-backed finance');
});

test('direct owner, beneficial owner, PSC and country links are rigorously separated',()=>{
 assert.equal(assets.schema,'sli-issuer-actor-assets-v1');
 const medc=assets.records.find(x=>x.ticker==='MEDC');
 const vale=assets.records.find(x=>x.ticker==='INCO');
 assert.ok(medc.rights.length>=3);
 assert.ok(medc.rights.every(x=>x.type==='oil_gas_psc'&&x.source_period==='FY2024'));
 assert.equal(vale.rights[0].type,'mining_iupk');
 assert.equal(vale.rights[0].area_ha,118017);
 assert.equal(vale.cross_border_links.length,3);
 assert.ok(vale.cross_border_links.some(x=>x.country==='Canada'));
 assert.ok(vale.cross_border_links.some(x=>x.country==='Japan'));
 for(const record of assets.records){
  assert.equal(record.beneficial_owner_status,'not_independently_verified');
  for(const right of record.rights||[]){
    assert.ok(right.source_url.startsWith('https://'));
    assert.ok(right.source_period);
    assert.ok(right.relation);
  }
 }
 assert.ok(relations.ownership_profiles.find(x=>x.id==='medc')?.shareholders.length>=2);
 assert.ok(relations.ownership_profiles.find(x=>x.id==='byan')?.shareholders.some(x=>x.holder_kind==='person'));
 const js=get('js/sli-issuer.js');
 assert.match(js,/Ultimate beneficial owner: NOT VERIFIED/);
 assert.match(js,/reported_pct/);
 assert.match(js,/participating_interest_pct/);
 assert.match(js,/source_period/);
 assert.match(get('js/sli-entities.js'),/assetProfiles\.get\(n\.ticker\)/);
 assert.match(get('sli-issuer.html'),/20261022-actorsfinance3/);
});

test('IDX dossier renders verified revenue plus source-dated shareholder and concession actors', async ()=>{
 const elements=new Map();
 class Node {
  constructor(tag){this.tagName=tag;this.children=[];this.textContent='';this.className='';this.attrs={};this.style={};}
  append(...items){this.children.push(...items)}
  replaceChildren(...items){this.children=items}
  setAttribute(k,v){this.attrs[k]=String(v)}
  addEventListener(){}
 }
 const doc={documentElement:{lang:'id'},createElement:x=>new Node(x),getElementById:id=>{
  if(!elements.has(id))elements.set(id,new Node('div'));
  return elements.get(id)
 },addEventListener(type,cb){if(type==='DOMContentLoaded')this.boot=cb}};
 const response=new Map([
  ['./data/sli-idx-issuer-universe.json',issuers],
  ['./data/sli-corporate-group-registry.json',groups],
  ['./data/sli-corporate-evidence-relationships.json',relations],
  ['./data/sli-issuer-actor-assets.json',assets]
 ]);
 const win={},context={document:doc,window:win,location:{search:'?ticker=MEDC'},fetch:async url=>({ok:response.has(url),json:async()=>response.get(url)}),URL,URLSearchParams,encodeURIComponent,Map,Intl,console};
 runInNewContext(get('js/sli-issuer.js'),context);
 doc.boot();
 for(let i=0;i<18;i++)await Promise.resolve();
 const walk=n=>[n,...(n.children||[]).filter(x=>x&&typeof x==='object').flatMap(walk)];
 const visible=walk(elements.get('sliIssuerDossier')).map(x=>x.textContent).join(' ');
 assert.match(visible,/2.395/);
 assert.match(visible,/South Natuna Sea Block B/);
 assert.match(visible,/Madura Offshore/);
 assert.match(visible,/PT Medco Daya Abadi Lestari/);
 assert.match(visible,/BELUM TERVERIFIKASI/);
 assert.match(visible,/2025/);
});

test('asset rights and cross-border actors preserve source-backed relation types',()=>{
 const allowedRights=new Set(['oil_gas_psc','mining_iupk','mining_iup','other_verified_right']);
 const allowedRelations=new Set(['reported_operator_and_participating_interest','permit_holder','reported_participating_interest','reported_operator']);
 for(const record of assets.records){
  assert.match(record.ticker,/^[A-Z0-9]{4}$/);
  assert.ok(issuers.records.some(x=>x.ticker===record.ticker),'Asset dossier must reference an indexed issuer');
  assert.equal(record.beneficial_owner_status,'not_independently_verified');
  for(const right of record.rights||[]){
   assert.ok(allowedRights.has(right.type),'Unclassified concession type: '+right.type);
   assert.ok(allowedRelations.has(right.relation),'Unknown legal right relationship: '+right.relation);
   assert.ok(right.source_period&&/^https:\/\//.test(right.source_url));
   assert.ok(right.region,'Geographic region must be named before mapping the right');
   assert.ok(right.participating_interest_pct==null||(right.participating_interest_pct>=0&&right.participating_interest_pct<=100));
   assert.ok(right.area_ha==null||right.area_ha>0);
  }
  for(const link of record.cross_border_links||[]){
   assert.ok(link.actor&&link.country&&link.relationship);
   assert.match(link.source_url,/^https:\/\//);
   assert.notEqual(link.relationship,'verified_ultimate_beneficial_owner','Corporate jurisdiction cannot establish a natural-person UBO');
  }
 }
});

test('BRI 2025 audited-period financial highlights retain measurement semantics', () => {
 const bri=issuers.records.find(r=>r.ticker==='BBRI');
 assert.equal(bri.total_assets, 2135371105);
 assert.equal(bri.net_income, 57132365);
 assert.equal(bri.financial_currency, 'IDR million');
 assert.match(bri.financial_period, /FY2025/);
 assert.equal(bri.revenue, null, 'Bank interest must not become generic industrial revenue');
 assert.match(bri.financial_source_url, /^https:\/\/www\.ir-bri\.com\/financial_highlights\.html$/);
});
