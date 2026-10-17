import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const critical=['index.html','intelligence-labs.html','climate-environment.html','ai-infrastructure.html','ai-intelligence-hub.html','digital-economy-readiness.html','digital-governance-data-centers.html'];
for(const path of critical){
 test(path+' does not ship broken inline JavaScript',()=>{const html=read(path);for(const part of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(x=>x.trim())){const withoutModuleImports=part.replace(/^\s*import\s+\{[^\n]+\}\s+from\s+['"][^'"]+['"];?\s*$/gm,'');assert.doesNotThrow(()=>new Function(withoutModuleImports))}});
 test(path+' has unique DOM identifiers',()=>{const ids=[...read(path).matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size)});
}
test('main SLI has an investor-friendly but conservative data provenance key',()=>{const s=read('index.html');for(const text of ['Actual / Observed','Forecast / Projection','Announced / Planned','Estimated / Modeled','Unverified / Media lead','N/A / Missing'])assert.ok(s.includes(text));});
test('AI infrastructure filter controls and export function are wired',()=>{const s=read('ai-infrastructure.html');for(const id of ['provinceSearch','provinceSort','gatewaySearch','search','category','provinceCsv','gatewayCsv','metricCsv'])assert.ok(s.includes("getElementById('"+id+"')"));for(const handler of ['provinceRender','gatewayRender','metricRender'])assert.match(s,new RegExp('function '+handler+'\\('));assert.match(s,/function dl\(/)});
test('scenario models and standalone original Indonesia intelligence navigation remain present',()=>{const s=read('intelligence-labs.html');for(const key of ['data-model="power"','data-model="commodity"','data-model="subsidy"','id="exportScenario"','geopolitical-impact-assessment.html'])assert.ok(s.includes(key));const gia=read('geopolitical-impact-assessment.html');assert.match(gia,/id="dossierGrid"/)});
test('map, investment, trade feature scripts remain referenced by SLI main page',()=>{const s=read('index.html');for(const path of ['js/strategic-map.js','js/investment-tracker.js','js/commodity-trade-flow.js'])assert.ok(s.includes(path))});
