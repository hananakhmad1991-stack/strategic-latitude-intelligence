import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {chromium} from "playwright-core";
const BASE=(process.env.SLI_BROWSER_TEST_BASE||"http://127.0.0.1:8765").replace(/\/$/,"");
const ROOT="artifacts/sli-food-impact-chromium";fs.mkdirSync(ROOT,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
const cases=[];
async function check(name,route,viewport,callback){
 const context=await browser.newContext({viewport,locale:"id-ID",reducedMotion:"reduce",serviceWorkers:"block"});
 const page=await context.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 try{
  await page.goto(BASE+"/"+route,{waitUntil:"domcontentloaded",timeout:30000});
  await page.locator("#sliFoodImpactLens .sli-fi-metric").first().waitFor({timeout:27000});
  assert.equal(await page.locator("#sliFoodImpactLens .sli-fi-metric").count(),4);
  await callback(page);
  assert.equal(errors.length,0,"Uncaught page exceptions: "+errors.join("; "));
  cases.push({name,status:"pass"});
  await page.locator("#sliFoodImpactLens").screenshot({path:path.join(ROOT,name.replace(/[^a-z0-9]+/gi,"-")+".png"),timeout:12000});
  console.log("PASS",name);
 }catch(err){
  cases.push({name,status:"fail",error:String(err.message||err),pageerrors:errors});
  console.error("FAIL",name,String(err.message||err),errors);
  try{await page.screenshot({path:path.join(ROOT,name.replace(/[^a-z0-9]+/gi,"-")+"-failure.png",fullPage:false})}catch{}
 }finally{await context.close()}
}
try{
 await check("Food dashboard price and province interaction","food-agriculture-intelligence.html",{width:1440,height:900},async page=>{
  const item=page.locator("#sliFiCommodity"),region=page.locator("#sliFiProvince");
  assert.equal(await item.locator("option").count(),11);
  assert.equal(await region.locator("option").count(),38);
  await item.selectOption("54");await region.selectOption({label:"Aceh"});
  const lens=await page.locator("#sliFoodImpactLens").innerText();
  assert.match(lens,/66\.393/);assert.match(lens,/14,29%/);
  assert.match(lens,/Tidak dilaporkan/);assert.match(lens,/128,06/);
  assert.match(lens,/tidak menyediakan identifikasi kausal/i);
  assert.match(lens,/Belum ada nama emiten/i);
  assert.ok(await page.locator('#sliFoodImpactLens a[href*=".pdf#page=77"]').count()>=1);
  await item.selectOption("50");await region.selectOption({label:"Jawa Barat"});
  const next=await page.locator("#sliFoodImpactLens").innerText();
  assert.match(next,/39\.198/);assert.match(next,/Bawang merah/i);
  assert.ok(await page.locator('#sliFoodImpactLens a[href="./index.html#sliHomeIDXSectors"]').count()===1);
 });
 await check("Research AI page receives exact same source-backed impact engine","sli-research-ai.html",{width:1366,height:900},async page=>{
  assert.equal(await page.locator("#sliFoodImpactLens").count(),1);
  assert.ok(await page.locator("#raIntro").count()===1);
  await page.locator("#sliFiCommodity").selectOption("49");
  assert.match(await page.locator("#sliFoodImpactLens").innerText(),/16\.262 Rp\/kg/);
  assert.match(await page.locator("#sliFoodImpactLens").innerText(),/historis|Agustus 2026/i);
  assert.ok(await page.locator('#sliFoodImpactLens a[href*=".pdf#page=72"]').count()>=1);
 });
 await check("Research Evidence Preview shares audited dynamic lens","sli-research-evidence-preview.html",{width:1366,height:900},async page=>{
  assert.ok(await page.locator("#raForm").count()===1);
  assert.ok(await page.locator('#sliFoodImpactLens select').count()===2);
  await page.locator("#sliFiCommodity").selectOption("56");
  assert.match(await page.locator("#sliFoodImpactLens").innerText(),/41\.352 Rp\/kg/);
 });
 await check("Mobile lens controls remain accessible without layout overflow","food-agriculture-intelligence.html",{width:390,height:844},async page=>{
  const before=await page.locator("#sliFoodImpactLens").boundingBox();
  assert.ok(before&&before.width<410,"Impact lens too wide on mobile");
  const control=page.locator("#sliFiProvince");
  await control.selectOption({label:"DKI Jakarta"});
  await page.locator("#sliFiCommodity").selectOption("54");
  assert.equal(await page.locator("#sliFoodImpactLens .sli-fi-metric").count(),4);
  const dims=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(dims.scroll<=dims.width+32,"Unexpected mobile overflow: "+JSON.stringify(dims));
 });
}finally{
 await browser.close();
 fs.writeFileSync(path.join(ROOT,"report.json"),JSON.stringify({schema:"sli-food-impact-chromium-v1",checked_at_utc:new Date().toISOString(),cases,limitations:["Local public snapshot only","Rendered UI is not evidence of source factual completeness or verified causal effects"]},null,2));
}
assert.ok(cases.every(x=>x.status==="pass"),"Impact browser failures: "+JSON.stringify(cases.filter(x=>x.status!=="pass")));
console.log("Food impact Chromium checks passed",cases.length);
