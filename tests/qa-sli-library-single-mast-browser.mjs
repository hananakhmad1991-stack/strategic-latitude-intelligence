/* Browser-level regression for overlapping mastheads in the public SLI Data Library.
   Run against http.server on :8765 using playwright-core and Chrome. */
import assert from "node:assert/strict";
import {chromium} from "playwright-core";
const base="http://127.0.0.1:8765/sli-sector-data-library.html";
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",
 headless:true,args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]
});
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:844},locale:"id-ID"});
  await page.goto(base,{waitUntil:"domcontentloaded",timeout:30000});
  await page.locator("#sliPlatformMast").waitFor({timeout:15000});
  const result=await page.evaluate(()=>{
   const show=e=>!!e&&getComputedStyle(e).display!=="none"&&e.getBoundingClientRect().height>0;
   const shared=document.querySelector("#sliPlatformMast");
   const legacy=document.querySelector("body > header.top");
   const main=document.querySelector("#libraryMain");
   const crumb=document.querySelector("#sliUniversalNavigation");
   return {
    sharedVisible:show(shared),legacyVisible:show(legacy),mainVisible:show(main),crumbVisible:show(crumb),
    unified:document.body.classList.contains("sli-dashboard-unified"),
    navigationLabel:shared?.textContent?.includes("STRATEGIC LATITUDE")||false,
    dataStatusPresent:!!document.querySelector("#libStatus"),
    datasetLinks:document.querySelectorAll("main nav.tabs a[href^='#']").length,
    mastHeight:shared?.getBoundingClientRect().height||0,
    mainStart:main?.getBoundingClientRect().top
   };
  });
  assert.ok(result.unified,"Shared navigation wasn't activated");
  assert.ok(result.sharedVisible,"Shared masthead missing");
  assert.equal(result.legacyVisible,false,"Duplicate legacy brand/menu remains visible");
  assert.ok(result.crumbVisible,"Cross-dashboard breadcrumb missing");
  assert.ok(result.mainVisible,"Data library content missing");
  assert.ok(result.navigationLabel,"Wrong shared brand");
  assert.ok(result.dataStatusPresent&&result.datasetLinks>=10,"Dataset controls missing");
  console.log("PASS single SLI masthead, library intact at",width,"px",result);
  await page.close();
 }
 // Degraded-network / no-JavaScript behavior: preserve the legacy header.
 const noJs=await browser.newPage({viewport:{width:1440,height:844},javaScriptEnabled:false});
 await noJs.goto(base,{waitUntil:"domcontentloaded",timeout:30000});
 const fallback=await noJs.evaluate(()=>{
  const legacy=document.querySelector("body > header.top");
  return !!legacy&&getComputedStyle(legacy).display!=="none"&&legacy.getBoundingClientRect().height>0;
 });
 assert.ok(fallback,"Legacy no-JS navigation fallback unexpectedly hidden");
 console.log("PASS legacy header remains available when JS is disabled");
 await noJs.close();
}finally{await browser.close()}
