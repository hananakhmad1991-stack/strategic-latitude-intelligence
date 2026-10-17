import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';import test from 'node:test';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const get=p=>readFileSync(path.join(root,p),'utf8');
test('labs page retains investor and scenario labs, and links to rebuilt GIA',()=>{const html=get('intelligence-labs.html');for(const id of ['investor','scenario'])assert.match(html,new RegExp('id="'+id+'"'));assert.match(html,/geopolitical-impact-assessment\.html/);for(const id of ['q','sector','province','stage','owner','amount','viewType','officialContext','modelBars'])assert.match(html,new RegExp('id="'+id+'"'));});
test('normalized records trace to upstream investment evidence',()=>{const raw=JSON.parse(get('data/investment-evidence.json'));const reg=JSON.parse(get('data/sli-project-registry.json'));assert.equal(reg.records.length,raw.projects.length);assert.equal(new Set(reg.records.map(r=>r.id)).size,reg.records.length);reg.records.forEach((r,i)=>{const p=raw.projects[i];for(const key of ['name','sector','stage','source_url','evidence_date'])assert.equal(r[key],p[key]??null);assert.equal(r.reported_amount,p.reported_amount??null);assert.ok(r.source_url?.startsWith('https://'));assert.ok(!r.ownership||r.ownership.startsWith('Undetermined'))});});
test('baseline preserves publisher metadata and warns on incompatible DC units',()=>{const ctx=JSON.parse(get('data/sli-labs-official-context.json'));assert.ok(ctx.macro.length>0);for(const m of ctx.macro)assert.ok(m.period&&m.unit&&m.source_url);assert.match(ctx.data_center.warning,/IT\/facility|IT power|scope|measurement/i);});
test('dashboard main page links to intelligence labs',()=>{const main=get('index.html');for(const id of ['investor','scenario','geo'])assert.ok(main.includes('intelligence-labs.html#'+id));});

test('old GIA simulation removed and new GIA entry remains available',()=>{const old=get('intelligence-labs.html');const page=get('geopolitical-impact-assessment.html');assert.doesNotMatch(old,/id="impactEvent"/);for(const key of ['id="riskScore"','id="heatMap"','id="expectedLoss"','id="var95"','id="alertState"','id="newsItems"'])assert.ok(page.includes(key));});

test('scoring refuses unvalidated values and aggregates only eligible evidence',async()=>{
 const {indicatorScore,assessDomain}=await import('../js/sli-geopolitical-scoring.mjs');
 const raw=JSON.parse(get('data/sli-geopolitical-indicator-library.json'));
 assert.equal(raw.indicators.length,80);
 for(const i of raw.indicators)assert.equal(indicatorScore(i).status,'N/A');
 for(const d of raw.domains)assert.equal(assessDomain(raw.indicators.filter(i=>i.domain===d)).status,'N/A');
 const valid={measurement:{value:50,period:'2026-Q2',source_url:'https://example.org',validation_status:'verified_primary'},risk_direction:'increasing',risk_thresholds:{safe:0,critical:100},weight:1,core:true};
 assert.equal(indicatorScore(valid).score,50);
 assert.equal(assessDomain([valid]).score,50);
 assert.equal(assessDomain([valid,{...valid,measurement:null}]).status,'N/A');
 assert.equal(indicatorScore({...valid,risk_thresholds:null}).status,'N/A');
 assert.equal(indicatorScore({...valid,measurement:{...valid.measurement,validation_status:'source_snapshot_unverified_in_current_turn'}}).status,'N/A');
 const down={...valid,risk_direction:'decreasing',risk_thresholds:{safe:100,critical:0}};
 assert.equal(indicatorScore(down).score,50);
});

test('three stress labs display base/stress and explicit breaking-point explanation',()=>{const html=get('intelligence-labs.html');for(const part of ['Base vs Stress','Break-even electricity tariff','Break-even cost pass-through','Cost-neutral oil price','stressInterpretation','Methodology, formulas &amp; definitions','sli-glossary-methodology.html'])assert.ok(html.includes(part));const glossary=JSON.parse(get('data/sli-unified-glossary.json'));for(const term of ['Breaking point','Stress testing','Inventory survival runway','Oil–FX double shock'])assert.ok(glossary.items.some(x=>x.term===term&&x.en&&x.id));});
