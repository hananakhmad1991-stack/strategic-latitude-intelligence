import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const customer=['sli-custom-research.html','sli-expert-sourcing.html','sli-institutional-intelligence.html','sli-business-info.html','sli-about-us.html','sli-privacy.html','sli-products.html'];
const errors=[];
for(const file of customer){
 const html=read(file);
 if(!html.includes('sli-navigation.js'))errors.push(file+': missing shared header');
 if(/<body>\s*<header\b/i.test(html))errors.push(file+': legacy header');
 if(!html.includes('sli:languagechange') && !html.includes('data-lang='))errors.push(file+': no content language sync');
 if(!html.includes('viewport'))errors.push(file+': missing viewport');
}
const nav=read('js/sli-navigation.js');
for(const target of ['sli-products.html#dashboard','sli-products.html#brief','sli-products.html#monitoring','sli-custom-research.html','sli-expert-sourcing.html','sli-institutional-intelligence.html'])if(!nav.includes(target))errors.push('Missing product / solution link: '+target);
const business=read('sli-business-info.html');
if(!business.includes('id="sliBusinessEnglish"'))errors.push('English policy is missing');
if(business.includes('const dict='))errors.push('Conflicting policy translation still exists');
const privacy=read('sli-privacy.html');
if(!privacy.includes('data-sli-privacy-id')||!privacy.includes('data-sli-privacy-en'))errors.push('Privacy bilingual views missing');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('PASS: Shared headers, EN/ID hooks, policy views and product routes (source checks).');
