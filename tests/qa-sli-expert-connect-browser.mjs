import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const width of [360,390,1440]){
  const page=await browser.newPage({viewport:{width,height:850}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',req=>{if(req.method()==='POST')errors.push('Unexpected POST: '+req.url())});
  await page.goto('http://127.0.0.1:8765/sli-expert-connect.html?service=consultation',{waitUntil:'domcontentloaded'});
  // This is a focused service request, not an intelligence dashboard.
  // Its custom header and hero must remain visible without the injected universal panel or OSINT.
  assert.equal(await page.locator('#sliUniversalNavigation').count(),0,'No generic breadcrumb/toolbar on Expert Connect');
  assert.equal(await page.locator('#sliSecondaryEvidenceLoader').count(),0,'No sitewide news loader on Expert Connect');
  assert.equal(await page.getByText('News & OSINT',{exact:false}).count(),0,'No off-topic news card above expert request');
  const header=await page.locator('.sli-expert-header').boundingBox();
  const hero=await page.locator('#expertTitle').boundingBox();
  assert.ok(header&&hero,'The header and hero must render');
  assert.ok(hero.y<470,'Client-facing heading should appear above the fold '+JSON.stringify({width,header,hero}));
  if(width<=390){
   const nav=await page.locator('.sli-expert-header nav').boundingBox();
   const languages=await page.locator('.sli-expert-languages').boundingBox();
   assert.ok(nav&&languages&&Math.abs(nav.y-languages.y)<5,'Navigation and language switch share one compact row '+JSON.stringify({width,nav,languages}));
  }
  assert.equal(await page.locator('#expertService').inputValue(),'consultation');
  await page.locator('#expertObjective').fill('I need a qualified assessment of Indonesia data center policy implementation.');
  await page.locator('#expertProfile').fill('Independent specialist on digital policy, energy infrastructure and investment.');
  await page.locator('#expertAcknowledgement').check();
  await page.locator('button[type=submit].sli-expert-submit').click();
  assert.equal(await page.locator('#sliExpertResult').isVisible(),true);
  assert.match(await page.locator('#sliExpertDraft').inputValue(),/Indonesia data center policy/);
  assert.match(await page.locator('#sliExpertEmail').getAttribute('href'),/^mailto:/);
  assert.match(await page.locator('#sliExpertFeedback').innerText(),/No request has been submitted/);
  await page.locator('[data-expert-lang=id]').click();
  assert.match(await page.locator('#expertRequestTitle').innerText(),/SLI yang mencarikan pakarnya/);
  const size=await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth}));
  assert.ok(size.doc<=size.width+2,'Expert Desk horizontal overflow '+JSON.stringify({width,size}));
  assert.deepEqual(errors,[],'No page errors or mutation requests');
  console.log('PASS Expert Connect form and viewport '+width);
  await page.close();
 }
}finally{await browser.close()}
