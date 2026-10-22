import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

const chrome=process.env.CHROME_BIN;
assert.ok(chrome,'Chrome on runner required to validate visible ticker discovery');
const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const origin=process.env.SLI_BROWSER_ORIGIN||'http://127.0.0.1:8765/';
try{
 for(const width of [1366,390]){
  const page=await browser.newPage({viewport:{width,height:860},reducedMotion:'reduce'});
  page.setDefaultTimeout(12000);
  try{
   // SLI source bridge redirects the issuer JSON request to canonical raw GitHub/main.
   // During PR review, raw/main still has the OLD catalogue. Intercept that single URL
   // using the checked-out branch fixture to genuinely test the proposed 267 entries.
   const localRegister=await page.request.get(origin+'data/sli-idx-issuer-universe.json');
   assert.ok(localRegister.ok(),'Static fixture must load before installing route');
   const localRegisterBody=await localRegister.body();
   await page.route('**/data/sli-idx-issuer-universe.json*',async route=>{
     if(route.request().url().startsWith(origin))return route.continue();
     await route.fulfill({status:200,contentType:'application/json',body:localRegisterBody});
   });
   await page.goto(origin+'index.html#home',{waitUntil:'domcontentloaded',timeout:25000});
   const directResponse=await page.request.get(origin+'data/sli-idx-issuer-universe.json');
   const directRecords=(await directResponse.json()).records.length;
   const sourceDiagnostic=await page.evaluate(async()=>{
     const res=await fetch('./data/sli-idx-issuer-universe.json',{cache:'no-store'});
     const body=await res.json();
     return {href:location.href,baseURI:document.baseURI,requestedURL:res.url,
       records:body.records.length,controlled:!!navigator.serviceWorker?.controller};
   });
   console.log('IDX catalogue read '+width+'px',JSON.stringify({directRecords,...sourceDiagnostic}));
   assert.equal(directRecords,267,'Local checked-out IDX register must have 267 tickers');
   assert.equal(sourceDiagnostic.records,267,'Browser must read the same checked-out register, not stale production');
   const root=page.locator('#sliHomeIDXSectors');
   await root.locator('.sli-idx-global-input').waitFor({state:'visible'});
   const suggestions=root.locator('.sli-idx-global-ticker');
   assert.equal((await suggestions.first().locator('strong').innerText()).trim(),'BRMS',
     'BRMS must be the first prominently visible ticker before searching');
   assert.equal(await root.locator('.sli-idx-sectoral-tab').count(),13,
     'All candidates and twelve strategic sectors must be discoverable');
   const global=root.locator('.sli-idx-global-input');
   await global.fill('BRMS');
   assert.equal(await suggestions.count(),1,'Exact BRMS search should have one match');
   assert.equal((await suggestions.first().locator('strong').innerText()).trim(),'BRMS');
   assert.match(await suggestions.first().getAttribute('href'),/sli-issuer\.html\?ticker=BRMS/);
   await global.fill('DGWG');
   const inspection=await page.evaluate(()=>({
     input:document.querySelector('#sliHomeIDXSectors .sli-idx-global-input')?.value,
     visible:[...document.querySelectorAll('#sliHomeIDXSectors .sli-idx-global-ticker strong')].map(x=>x.textContent),
     count:document.querySelector('#sliHomeIDXSectors .sli-idx-global-count')?.textContent,
     shown:document.querySelector('#sliHomeIDXSectors .sli-idx-global-none')?.textContent,
     allCandidateAmount:document.querySelector('#sliHomeIDXSectors .sli-idx-sectoral-tab')?.textContent
   }));
   console.log('Ticker replacement diagnostic '+width+'px:',JSON.stringify(inspection));
   assert.equal((await suggestions.first().locator('strong').innerText()).trim(),'DGWG',
     'Cross-sector global ticker search must find new issuer');
   await global.fill('');
   const metals=root.locator('.sli-idx-sectoral-tab').filter({hasText:/Metals & minerals|Logam & mineral/});
   await metals.click();
   assert.ok(await root.locator('.sli-idx-sectoral-ticker').filter({hasText:'BRMS'}).count(),
      'BRMS must be among the mineral ticker preview cards');
   const fullList=root.locator('.sli-idx-sectoral-more');
   assert.ok(await fullList.evaluate(el=>el.open),'All sector issuers should be expanded by default');
   assert.equal(await root.locator('.sli-idx-sectoral-rest a').count(),18,'All 18 mineral tickers visible');
   const all=root.locator('.sli-idx-sectoral-tab').filter({hasText:/All issuer candidates|Semua kandidat emiten/});
   await all.click();
   assert.equal(await root.locator('.sli-idx-sectoral-rest a').count(),267,
     'All 267 registered tickers must be rendered without a hidden show-more click');
   await page.goto(origin+'sli-issuer.html?ticker=BRMS',{waitUntil:'domcontentloaded',timeout:25000});
   await page.locator('#sliIssuerDossier .sli-issuer-links a[href*="web.ksei.co.id"]').waitFor({state:'attached',timeout:14000});
   assert.equal(await page.locator('#sliIssuerDossier .sli-issuer-links a[href*="bumiresourcesminerals.com"]').count(),1,
      'BRMS official investor relations must be linked');
   console.log('PASS '+width+'px: BRMS visible, 267 ticker inventory, KSEI/IR sources, cross-sector search');
  }finally{await page.close()}
 }
}finally{await browser.close()}
