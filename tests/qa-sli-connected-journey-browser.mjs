import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const base='http://127.0.0.1:8765/';
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:850}});
  await page.goto(base+'index.html#home',{waitUntil:'domcontentloaded'});
  await page.locator('.sli-home-journeys a').first().waitFor();
  assert.equal(await page.locator('.sli-home-journeys a').count(),4);
  assert.match(await page.locator('.sli-portal-hero h2').innerText(),/Indonesia Intelligence/i);
  const panel=page.locator('.sli-portal .sli-market-home');
  const collapse=page.locator('.sli-panel-collapse[aria-controls="sli-panel-sli-market-home"]');
  await collapse.waitFor({timeout:15000});
  assert.equal(await collapse.getAttribute('aria-expanded'),'true','market widget must render expanded first');
  await collapse.click();
  assert.equal(await collapse.getAttribute('aria-expanded'),'false');
  assert.ok(await panel.evaluate(el=>el.classList.contains('sli-panel-collapsed')));
  await collapse.click();
  assert.equal(await collapse.getAttribute('aria-expanded'),'true');
  assert.ok(await panel.evaluate(el=>!el.classList.contains('sli-panel-collapsed')));
  await page.locator('.sli-home-journeys a[href="./sli-entities.html"]').click();
  await page.waitForURL(/sli-entities\.html/);
  await page.locator('.sli-research-path').waitFor();
  assert.equal(await page.locator('.sli-research-step').count(),5);
  const sources=page.locator('.sli-research-step[href="./sli-sector-data-library.html"]');
  assert.ok(await sources.count()>0);
  await sources.click();await page.waitForURL(/sli-sector-data-library\.html/);
  assert.ok(await page.locator('.sli-research-step[href="./sli-research-ai.html"]').count()>0);
  const size=await page.evaluate(()=>({viewport:innerWidth,body:document.documentElement.scrollWidth}));
  assert.ok(size.body<=size.viewport+20,'horizontal page overflow '+JSON.stringify(size));
  console.log('PASS connected entity → source → analysis links width',width);
  await page.close();
 }
}finally{await browser.close()}
