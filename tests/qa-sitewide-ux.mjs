import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
for(const name of ['index.html','intelligence-labs.html','climate-environment.html','sli-glossary-methodology.html']){
 test(name+' has accessible shared styling and structurally unique IDs',()=>{
  const s=source(name);assert.match(s,/css\/sli-site-ux\.css/);
  const ids=[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);
  const open=[];for(const match of s.matchAll(/<\/?(?:header|nav|details|summary|main)\b[^>]*>/g)){
   const v=match[0].match(/^<\/?([a-z]+)/)[1];if(match[0].startsWith('</'))assert.equal(open.pop(),v);else open.push(v);
  }assert.equal(open.length,0);
 });
}
test('sidebar hides detailed AI and investor links until requested',()=>{const s=source('index.html');assert.match(s,/AI &amp; Digital · Detailed dashboards/);assert.match(s,/Investor Labs · Screening &amp; Scenarios/);assert.match(s,/Skip to dashboard content/);assert.match(s,/Indonesia Power Profile/);});
test('climate and investor labs link to each other and glossary',()=>{for(const page of ['climate-environment.html','intelligence-labs.html']){const s=source(page);assert.match(s,/sli-page-links/);assert.match(s,/sli-glossary-methodology\.html/)}});

test('sitewide usability scripts are included in core and supporting dashboards',()=>{for(const page of ['index.html','intelligence-labs.html','climate-environment.html','sli-glossary-methodology.html','ai-intelligence-hub.html','ai-infrastructure.html','digital-economy-readiness.html','digital-governance-data-centers.html']){const s=source(page);assert.match(s,/sli-public-usability\.js/);assert.match(s,/sli-site-ux\.css/);}});
test('AI infrastructure CSV export uses balanced syntax',()=>{const s=source('ai-infrastructure.html');assert.ok(!s.includes('...data.indicators]]);provinceRender()'));for(const part of [...s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean))assert.doesNotThrow(()=>new Function(part));});
