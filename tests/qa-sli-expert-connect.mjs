import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const html=readFileSync(new URL('../sli-expert-connect.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../js/sli-expert-connect.js',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const research=readFileSync(new URL('../sli-research-ai.html',import.meta.url),'utf8');
const membership=readFileSync(new URL('../sli-membership.html',import.meta.url),'utf8');
function makeDom(query=''){
 const dom=new JSDOM(html,{url:'https://example.org/sli-expert-connect.html'+query,runScripts:'outside-only',pretendToBeVisual:true});
 dom.window.document.getElementById('sliExpertResultTitle').scrollIntoView=()=>{};
 dom.window.fetch=()=>{throw Error('Unexpected network request from client form')};
 dom.window.eval(js);
 return dom;
}
test('Research Desk is discoverable while evidence workflow stays available',()=>{
 for(const source of [index,research,membership])assert.match(source,/sli-expert-connect\.html/);
 assert.match(research,/Discover · Analyze · Connect/);
 assert.match(research,/id="raAssistantForm"/);
 assert.match(research,/sli-research-assistant\.js/);
 assert.match(index,/id="sliPortalMetrics"/);
 assert.match(index,/sliOrbitGlobe/);
});
test('Editable brief prepares without transmitting data or booking experts',()=>{
 const dom=makeDom('?service=custom_research');const d=dom.window.document;
 assert.equal(d.getElementById('expertService').value,'custom_research');
 const form=d.getElementById('sliExpertForm');
 d.getElementById('expertObjective').value='Map regulatory constraints and investment requirements of Indonesian AI data centers';
 d.getElementById('expertProfile').value='Energy and technology policy specialist with ten years of experience';
 d.getElementById('expertAcknowledgement').checked=true;
 assert.equal(form.reportValidity(),true);
 const event=new dom.window.Event('submit',{bubbles:true,cancelable:true});
 assert.equal(form.dispatchEvent(event),false,'Submit intercepted locally');
 assert.equal(d.getElementById('sliExpertResult').hidden,false);
 const draft=d.getElementById('sliExpertDraft').value;
 assert.match(draft,/Indonesian AI data centers/);
 assert.match(draft,/technology policy specialist/);
 assert.match(draft,/subject to consent, screening, availability and client approval/);
 assert.match(d.getElementById('sliExpertEmail').getAttribute('href'),/^mailto:/);
 assert.match(d.getElementById('sliExpertFeedback').textContent,/No request has been submitted/);
 assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon/.test(js));
 dom.window.close();
});
test('Bilingual form and approved query parameter do not leak prompts',()=>{
 const dom=makeDom('?service=consultation&objective=should-not-prefill');
 const d=dom.window.document;
 assert.equal(d.getElementById('expertService').value,'consultation');
 assert.equal(d.getElementById('expertObjective').value,'');
 d.querySelector('button[data-expert-lang="id"]').click();
 assert.equal(d.documentElement.lang,'id');
 assert.match(d.getElementById('expertTitle').textContent,/keahlian/);
 assert.match(d.getElementById('sliExpertForm').textContent,/Jenis layanan/);
 assert.equal(d.querySelector('button[data-expert-lang="id"]').getAttribute('aria-pressed'),'true');
 dom.window.close();
});
test('Client inputs bounded and no false availability or payment',()=>{
 for(const id of ['expertObjective','expertProfile','expertService','expertSector','expertAcknowledgement','sliExpertDraft'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/maxlength="1000"/);
 assert.match(html,/maxlength="700"/);
 assert.match(html,/aria-live="polite"/);
 assert.match(html,/Privacy-first pilot/);
 assert.match(html,/Prepare and email your research brief/);
 assert.doesNotMatch(html,/Submit a concise research brief/);
 assert.match(html,/No pre-registered expert panel/);
 assert.match(html,/Belum ada panel pakar terdaftar/);
 assert.match(index,/on demand after reviewing your brief/);
 assert.doesNotMatch(html,/<form[^>]*action=/i);
});
