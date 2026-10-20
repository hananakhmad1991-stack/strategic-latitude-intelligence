import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>readFileSync(path.join(root,p),'utf8');
const db=JSON.parse(read('data/sli-corporate-group-registry.json'));
const byId=new Map(db.records.map(n=>[n.id,n]));
test('Corporate register has 31 multisector sourced company groups and acyclic paths',()=>{
 assert.equal(db.schema,'sli-corporate-group-registry-v2');
 assert.ok(db.groups.length>=30);
 for(const group of ['pertamina','pln','telkom','mindid','alamtri','dci','indosat','amazon','indofood','wilmar','cargill'])assert.ok(db.groups.some(g=>g.id===group),group);
 assert.equal(byId.size,db.records.length,'duplicate entity IDs');
 assert.ok(db.records.length>=120);
 for(const g of db.groups){
  const root=byId.get(g.root_id);assert.ok(root&&root.group===g.id&&!root.parent_id,g.id);
  assert.ok(db.records.filter(x=>x.group===g.id).length>=1);
 }
 for(const n of db.records){
  assert.match(n.id,/^[a-z][a-z0-9-]*$/);
  assert.ok(n.name.trim()&&n.business_id?.trim()&&n.source_date,'Unattributed business field '+n.id);
  assert.match(n.source_url,/^https:\/\//,'Missing original source '+n.id);
  assert.ok(!n.website_domain||/^(?:[a-z0-9-]+\.)+[a-z]{2,20}$/.test(n.website_domain),'Untrusted favicon domain '+n.id);
  assert.ok(['energy','minerals','coal','technology','food'].includes(n.sector),n.id);
  if(n.listing_status==='listed'){assert.ok(n.ticker&&['IDX','NASDAQ','SGX'].includes(n.exchange));assert.ok(n.source_url.startsWith('https://'))}
  assert.equal(n.market_cap??null,null,'Never invent unsourced market capitalization '+n.id);
  const seen=new Set([n.id]);let top=n,depth=0;
  while(top.parent_id){
   assert.ok(byId.has(top.parent_id),'Unknown immediate parent '+top.parent_id);
   assert.ok(!seen.has(top.parent_id),'Cyclic ownership '+n.id);
   seen.add(top.parent_id);top=byId.get(top.parent_id);depth++;
   assert.equal(top.group,n.group,'Parent outside group '+n.id);
  }
  assert.equal(depth,n.tier,'Depth must be derived from ancestry '+n.id);
  assert.ok(depth<=3,'Unreviewed tier outside four-generation scope');
  assert.equal(n.tier_label,['induk','anak','cucu','cicit'][depth]);
  for(const d of n.directors||[]){assert.ok(d.name&&d.title_id);assert.match(d.source_url,/^https:\/\//);assert.match(d.source_date,/^20\d\d-/)}
 }
 assert.ok(db.records.filter(x=>x.tier===3).length>=10,'Great-grandchildren must be actual dated relationships');
});
test('Avoid misleading ownership assumptions and false same-name parent mapping',()=>{
 const v=id=>byId.get(id);
 assert.equal(v('pertagas').parent_id,'pgn');
 assert.equal(v('ptgn').parent_id,'pertagas');
 assert.equal(v('pba').parent_id,'epi');
 assert.equal(v('nps').parent_id,'np');
 assert.equal(v('mkp').parent_id,'nps');
 assert.equal(v('pst').parent_id,'mit');
 assert.equal(v('umt').parent_id,'mit');
 assert.equal(v('tif').name,'PT Telkom Infrastruktur Indonesia (InfraNexia)');
 assert.notEqual(v('infra').id,v('tif').id,'Telkom Infra and InfraNexia are separate entities');
 assert.equal(v('telin').parent_id,'tel');
 assert.equal(v('telsg').parent_id,'telin');
 assert.equal(v('sel').ownership_pct,70);
 assert.equal(v('pertagas').ownership_pct,51);
 assert.equal(v('phm').tier,3);
 assert.equal(v('prpp').relationship,'joint-venture');
 assert.equal(v('tif').directors[0].name,'Lukman Hakim Abd. Rauf');
 assert.equal(v('tel').directors[0].name,'Nanang Hendarno');
 assert.equal(v('phe').directors[0].name,'Sunaryanto','Do not silently keep superseded 2025 CEO');
 assert.equal(v('phi').directors[0].name,'Muharram Jaya Panguriseng');
});
test('All public interactions and limits are expressed explicitly',()=>{
 const html=read('sli-entities.html'),script=read('js/sli-corporate-groups.js'),dir=read('js/sli-entities.js'),icon=read('js/sli-entity-identity.js');
 for(const x of ['id="sliCorporateGroups"','id="sliCgTree"','id="sliCgDossier"','id="sliCgSearch"','id="sliCgExpand"','id="sliCgCollapse"','id="sliCgCsv"','id="sliCgSector"','id="sliCgGroupTabs"','id="sliCgCoverage"'])assert.ok(html.includes(x),'Absent group UI '+x);
 assert.match(html,/sli-corporate-groups\.css/);assert.match(html,/sli-corporate-groups\.js/);
 assert.match(script,/source_date/);assert.match(script,/ownership_pct/);assert.match(script,/parent_id/);assert.match(script,/renderTabs/);assert.match(script,/market_cap/);assert.match(script,/financial_period/);assert.match(script,/www\.idx\.co\.id/);
 assert.match(script,/personLink\?\.\(d\.name,d\.source_url\)/);
 assert.match(script,/original ownership/);
 assert.doesNotMatch(script,/\.innerHTML\s*=/,'Do not permit source HTML injection');
 assert.match(dir,/fromCorporateGroups\(results\[2\]\)/);
 assert.match(dir,/sli-corporate-group-registry\.json/);
 assert.match(icon,/siteBrand/);
 assert.match(html,/Kapitalisasi pasar/);
});


test('Public capital-market classification does not conflate private companies or units with issuers',()=>{
 const nodes=db.records;
 const find=t=>nodes.find(n=>n.ticker===t);
 for(const t of ['ANTM','PTBA','TINS','MDKA','AMMN','NCKL','ADRO','AADI','BYAN','ITMG','DCII','EDGE','ISAT','EXCL','INDF','ICBP','CPIN','JPFA','MYOR']){
  const row=find(t);assert.ok(row,'Missing public issuer '+t);
  assert.equal(row.listing_status,'listed');
  assert.equal(row.exchange,'IDX');
  assert.match(row.source_url,/^https:\/\//);
 }
 assert.equal(nodes.find(n=>n.id==='amzn-root').exchange,'NASDAQ');
 assert.equal(nodes.find(n=>n.id==='aws-business').listing_status,'unlisted');
 assert.equal(nodes.find(n=>n.id==='gcloud-business').relationship,'business-unit');
 assert.equal(nodes.find(n=>n.id==='mbma-merdeka').relationship,'associated-investment');
 assert.equal(nodes.find(n=>n.id==='aadi-root').parent_id,null,'No inferred ADRO -> AADI ownership');
 assert.equal(nodes.find(n=>n.id==='vale-root').parent_id,null,'No invented full MIND ID control of Vale');
 for(const n of nodes){
  assert.ok(n.source_date,'Dated reference is required '+n.id);
  if(n.market_cap!=null)assert.ok(n.market_cap_as_of&&n.market_cap_source_url&&n.closing_price!=null&&n.shares_outstanding!=null);
 }
 assert.match(read('js/sli-corporate-groups.js'),/sector==='all'/);
 assert.match(read('js/sli-entities.js'),/a\.corporate\?\.ticker/);
});
