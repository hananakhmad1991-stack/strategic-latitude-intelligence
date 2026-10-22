import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const width of [360,390,1440]){
  const page=await browser.newPage({viewport:{width,height:850}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,150)));
  page.on('request',req=>{if(req.method()==='POST')errors.push('Unrequested POST '+req.url())});
  await page.goto('http://127.0.0.1:8765/sli-research-ai.html',{waitUntil:'domcontentloaded'});
  await page.locator('#raPrompt').waitFor({state:'visible',timeout:15000});
  const question=page.locator('#raPrompt');
  assert.equal(await page.locator('#raAdvancedInputs').getAttribute('open'),null,'Advanced controls remain collapsed initially');
  assert.equal(await page.locator('#raOwnerPanel').getAttribute('open'),null,'Owner test must not auto-expand');
  assert.equal(await page.locator('#raResourcesAndStory').getAttribute('open'),null,'Sources/brand info remain optional');
  assert.ok(await page.locator('.sli-ra-task-links a[href="./sli-expert-connect.html"]').isVisible());
  const rect=await question.boundingBox();
  const dims=await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,ownerTokenType:document.querySelector('#raOwnerToken')?.type}));
  assert.ok(rect&&rect.y<720,'Question composer must be on initial screen '+JSON.stringify({width,rect}));
  assert.ok(dims.documentWidth<=dims.viewport+5,'No horizontal page overflow '+JSON.stringify({width,dims}));
  assert.equal(dims.ownerTokenType,'password');
  await question.fill('Bandingkan ketahanan energi Indonesia dengan Vietnam beserta sumber resmi.');
  assert.equal(await question.inputValue(),'Bandingkan ketahanan energi Indonesia dengan Vietnam beserta sumber resmi.');
  await page.locator('#raAdvancedInputs > summary').click();
  assert.ok(await page.locator('#raChatFiles').isVisible(),'Attachment accessible after expanding options');
  assert.ok(await page.locator('#raExternalSearchConsent').isVisible(),'External search explicit consent accessible');
  assert.ok(await page.locator('#raChatMethod').count()===1,'Existing research methods retained');
  await page.locator('#raAdvancedInputs > summary').click();
  assert.equal(await page.locator('#raAdvancedInputs').getAttribute('open'),null);
  await page.locator('[data-ra-lang="en"]').click();
  assert.match(await question.getAttribute('placeholder'),/Ask about Indonesia/);
  assert.ok((await page.locator('#raAccessLabel').innerText()).includes('DERGUBA AI'));
  assert.ok((await page.locator('.sli-ra-public-boundary').innerText()).includes('Owner Test'));
  assert.deepEqual(errors,[],'No automatic submission or runtime crashes');
  console.log('PASS chat-first public shell at '+width+'px');
  await page.close();
 }
}finally{await browser.close()}
