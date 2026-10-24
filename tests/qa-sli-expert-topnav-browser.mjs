import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage']
});
try{
 for(const width of [360,390,1440]){
  const page=await browser.newPage({viewport:{width,height:850}});
  await page.goto('http://127.0.0.1:8765/index.html#home',{waitUntil:'domcontentloaded'});
  const group=page.locator('#sliPlatformMast nav.sli-platform-quicklinks');
  await group.waitFor({state:'visible',timeout:20000});
  const ai=group.locator('a[href="./sli-research-ai.html"]');
  const expert=group.locator('a[href="./sli-expert-connect.html"]');
  const languageButtons=page.locator('#sliPlatformMast .sli-platform-language button');
  assert.ok(await ai.isVisible(),'DERGUBA must be visible on '+width+'px');
  assert.ok(await expert.isVisible(),'Expert Connect must be visible on '+width+'px');
  assert.equal(await languageButtons.count(),2,'Both language controls must remain available');
  if(width<=650){
   for(const button of await languageButtons.all()){
    const box=await button.boundingBox();
    assert.ok(box.width>=44&&box.height>=44,'Language controls must meet 44px mobile touch targets '+JSON.stringify(box));
   }
  }
  const rects=await page.evaluate(()=>{
   const mast=document.querySelector('#sliPlatformMast');
   const ai=mast.querySelector('.sli-platform-quicklinks a[href="./sli-research-ai.html"]').getBoundingClientRect();
   const expert=mast.querySelector('.sli-platform-quicklinks a[href="./sli-expert-connect.html"]').getBoundingClientRect();
   return {viewport:innerWidth,mastWidth:mast.scrollWidth,ai:{x:ai.x,y:ai.y,width:ai.width},expert:{x:expert.x,y:expert.y,width:expert.width}};
  });
  assert.ok(rects.ai.width>20&&rects.expert.width>20,'Both buttons must have visible widths');
  assert.ok(Math.abs(rects.expert.y-rects.ai.y)<=2,'Expert and DERGUBA must appear on the same row '+JSON.stringify(rects));
  assert.ok(rects.expert.x>=rects.ai.x+rects.ai.width-2,'Expert button must be immediately to the right of DERGUBA '+JSON.stringify(rects));
  assert.ok(rects.ai.x>=0&&rects.expert.x+rects.expert.width<=rects.viewport+2,'Research pair must not require horizontal scrolling '+JSON.stringify(rects));
  assert.ok(rects.mastWidth<=rects.viewport+2,'Header must not overflow '+JSON.stringify(rects));
  console.log('PASS visible, adjacent top navigation at '+width+'px '+JSON.stringify(rects));
  await page.close();
 }
}finally{await browser.close()}
