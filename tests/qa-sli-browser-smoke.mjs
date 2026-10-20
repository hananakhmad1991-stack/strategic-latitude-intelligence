/* Real Chromium smoke test, intentionally separate from static source-code QA.
 * It checks rendered geometry/interactions only; it cannot verify publisher facts.
 * Runs against a local copy of public SLI with no user secrets or owner token.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {chromium} from "playwright-core";

const BASE=(process.env.SLI_BROWSER_TEST_BASE||"http://127.0.0.1:8765").replace(/\/$/,"");
const outDir="artifacts/sli-browser-smoke";
fs.mkdirSync(outDir,{recursive:true});
const report={schema:"sli-browser-smoke-v1",checked_at_utc:new Date().toISOString(),tests:[],limitations:["Local served static public files only","Browser rendering does not verify externally sourced facts or live market feeds","Mobile emulation is not a physical-device test"]};
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",
 headless:true,
 args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]
});
async function check(name,viewport,fn){
 const context=await browser.newContext({viewport,locale:"id-ID",serviceWorkers:"block",reducedMotion:"reduce"});
 const page=await context.newPage();
 const errors=[];
 page.on("pageerror",err=>errors.push(err.message.slice(0,350)));
 try{
  await fn(page);
  report.tests.push({name,status:"pass",page_errors:errors.slice(0,3)});
  console.log("PASS",name,errors.length?"(runtime warnings observed)":"");
 }catch(error){
  const filename=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,65);
  try{await page.screenshot({path:path.join(outDir,filename+".png"),fullPage:false,timeout:5000})}catch{}
  report.tests.push({name,status:"fail",error:String(error.message||error),page_errors:errors.slice(0,5)});
  console.error("FAIL",name,String(error.message||error));
 }finally{await context.close()}
}
function pageUrl(route){return BASE+"/"+route}
async function waitMast(page){
 await page.waitForFunction(()=>{
  const m=document.getElementById("sliPlatformMast");
  return m&&!m.hidden&&parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sli-mast-offset"))>0;
 },null,{timeout:20000});
}
async function checkMast(page){
 const metrics=await page.evaluate(()=>{
  const m=document.getElementById("sliPlatformMast"),r=m.getBoundingClientRect();
  const offset=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sli-mast-offset"));
  return {height:r.height,offset,position:getComputedStyle(m).position,hidden:m.hidden};
 });
 assert.equal(metrics.hidden,false,"Dashboard masthead unexpectedly hidden");
 assert.equal(metrics.position,"sticky","Dashboard masthead must remain sticky");
 assert.ok(Math.abs(metrics.height-metrics.offset)<=4,"CSS panel offset differs from the measured navbar height: "+JSON.stringify(metrics));
}
await check("Entities desktop: selectable detail and visible masthead",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("sli-entities.html"),{waitUntil:"domcontentloaded",timeout:30000});
 await waitMast(page);await checkMast(page);
 await page.locator("#sliEntityCards .sli-entity-card").first().waitFor({timeout:25000});
 await page.locator("#sliEntityCards .sli-entity-card").first().click();
 await page.locator("#sliEntityDetail h2").first().waitFor({timeout:12000});
 assert.ok((await page.locator("#sliEntityDetail").innerText()).length>30,"Entity detail not populated");
 await page.locator("#sliEntityDetail").scrollIntoViewIfNeeded();
 const g=await page.evaluate(()=>{
  const head=document.querySelector("#sliPlatformMast").getBoundingClientRect();
  const d=document.querySelector("#sliEntityDetail"),r=d.getBoundingClientRect();
  return {top:r.top,bottom:r.bottom,headBottom:head.bottom,scroll:getComputedStyle(d).overflowY,maxHeight:getComputedStyle(d).maxHeight};
 });
 assert.ok(g.top>=g.headBottom-4||g.bottom<=g.headBottom,"Selected entity dossier is obscured behind navbar: "+JSON.stringify(g));
 assert.equal(g.scroll,"auto","Long entity profile must be scrollable");
});
await check("Entities mobile: responsive cards and accessible controls",{width:390,height:844},async page=>{
 await page.goto(pageUrl("sli-entities.html"),{waitUntil:"domcontentloaded",timeout:30000});
 await waitMast(page);await checkMast(page);
 await page.locator("#sliEntityCards .sli-entity-card").first().waitFor({timeout:25000});
 const metrics=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth,search:!!document.querySelector("#sliEntitySearch"),position:getComputedStyle(document.querySelector("#sliEntityDetail")).position}));
 assert.ok(metrics.doc<=metrics.viewport+16,"Entity page has uncontrolled horizontal overflow: "+JSON.stringify(metrics));
 assert.ok(metrics.search,"Search field missing");
 assert.equal(metrics.position,"static","Entity detail should stack below the cards on mobile");
});
await check("Migas dashboard: right-side evidence panel not under navbar",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("index.html#energy"),{waitUntil:"domcontentloaded",timeout:30000});
 await waitMast(page);await checkMast(page);
 await page.locator("#energyOilGasStakeholdersRoot .ogas-profile").first().waitFor({timeout:30000});
 const cards=page.locator("#energyOilGasStakeholdersRoot button");
 assert.ok(await cards.count()>0,"Oil and gas explorer is not interactive");
 const box=page.locator("#energyOilGasStakeholdersRoot .ogas-profile").first();
 await box.scrollIntoViewIfNeeded();
 const geom=await page.evaluate(()=>{
  const mast=document.querySelector("#sliPlatformMast").getBoundingClientRect(),panel=document.querySelector("#energyOilGasStakeholdersRoot .ogas-profile"),r=panel.getBoundingClientRect();
  return {top:r.top,bottom:r.bottom,mastBottom:mast.bottom,scroll:getComputedStyle(panel).overflowY};
 });
 assert.ok(geom.top>=geom.mastBottom-5||geom.bottom<=geom.mastBottom,"Migas evidence panel overlaps navbar: "+JSON.stringify(geom));
 assert.equal(geom.scroll,"auto","Long migas profile must be independently scrollable");
});
await check("DERGUBA AI: optional methods lab expands on demand",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("sli-research-ai.html"),{waitUntil:"domcontentloaded",timeout:30000});
 await page.locator("#raAdvancedLab").waitFor({timeout:25000});
 assert.equal(await page.locator("#raAdvancedLab").getAttribute("open"),null,"Advanced lab should be optional by default");
 await page.locator("#raOpenDataLab").click();
 await page.waitForFunction(()=>document.getElementById("raAdvancedLab")?.open===true,null,{timeout:7000});
 assert.ok(await page.locator("#raMethod").count()===1,"Research methodology control missing");
});
await browser.close();
fs.writeFileSync(path.join(outDir,"result.json"),JSON.stringify(report,null,2)+"\n");
console.log("Browser smoke:",report.tests.filter(x=>x.status==="pass").length,"passed /",report.tests.length,"total");
if(report.tests.some(x=>x.status==="fail"))process.exitCode=1;
