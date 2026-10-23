import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../sli-expert-discovery-owner.html',import.meta.url),'utf8');
const checks=[
 ['No Worker URL field',!html.includes('id="endpoint"')],
 ['No Owner token input',!html.includes('id="ownerToken"')],
 ['No public token persistence',!html.includes('localStorage')],
 ['Has OpenAlex discovery',html.includes('https://api.openalex.org/works')],
 ['Has fallback on provider failure',html.includes('Cari langsung di OpenAlex')],
 ['Has all screening states',['Discovered','Screening','Contacted','Confirmed'].every(s=>html.includes(s))],
 ['Has candidate disclaimer',html.includes('Kandidat ≠ anggota jaringan SLI')],
 ['Uses safe text rendering',html.includes('n.textContent=String(value||')],
 ['Does not enable private CRM',html.includes('Belum menjadi CRM privat')]
];
for(const [label,ok] of checks){assert.ok(ok,label);console.log('PASS '+label)}
console.log('PASS '+checks.length+'/'+checks.length+' static Expert Discovery assertions (not a live API/browser test)');
