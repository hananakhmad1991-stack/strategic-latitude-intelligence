import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const api=fs.readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../../sli-early-warning.html',import.meta.url),'utf8');
const nine=['energy','mining','industry','finance','food','climate','technology','defense','infrastructure'];
test('all 9 sectors present in API and user interface',()=>{
 for(const sector of nine){
  assert.match(api,new RegExp('\\b'+sector+':'));
  assert.match(ui,new RegExp('value="'+sector+'"'));
 }
});
test('do not treat media signal as verified intelligence',()=>{
 assert.match(api,/verified:false/);
 assert.match(api,/unverified_news_signal/);
 assert.match(ui,/UNVERIFIED SIGNALS/);
});
test('bounded upstream and no AI usage enabled',()=>{
 assert.match(api,/maxrecords.*20/);
 assert.match(api,/max-age=900/);
 assert.match(api,/ai_enabled:false/);
 assert.doesNotMatch(api,/AI\.run\(|env\.AI\.run\(/);
});
test('no raw innerHTML injection and external links protected',()=>{
 assert.doesNotMatch(ui,/\.innerHTML\s*=/);
 assert.match(ui,/noopener noreferrer/);
});
