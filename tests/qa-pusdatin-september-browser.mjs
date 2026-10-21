import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {chromium} from "playwright-core";
const server=(process.env.SLI_BROWSER_TEST_BASE||"http://127.0.0.1:8765").replace(/\/$/,"");
const reportDir="artifacts/pusdatin-september-browser";
fs.mkdirSync(reportDir,{recursive:true});
const report={edition:"2026-09",browser:"Chromium",checked_at:new Date().toISOString(),cases:[],limitations:["Local static server, not remote production access","No live PDF download or publisher data revision validation","Browser interaction QA distinct from PDF numeric audit"]};
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
async function run(name,viewport,fn){
 const context=await browser.newContext({viewport,locale:"id-ID",acceptDownloads:true,reducedMotion:"reduce"});
 const page=await context.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(String(e.message)));
 try{
  await page.goto(server+"/food-agriculture-intelligence.html",{waitUntil:"domcontentloaded",timeout:30000});
  await page.locator("#fa-september #sepKpi .fa-kpi").first().waitFor({timeout:22000});
  await page.locator("#sepsemModule #sepsemNumbers table tbody tr").first().waitFor({timeout:22000});
  await fn(page);
  assert.deepEqual(errors,[],"Unexpected browser JavaScript exception");
  report.cases.push({name,status:"pass",viewport});
  console.log("PASS",name);
 }catch(e){
  report.cases.push({name,status:"fail",viewport,error:String(e.message),pageerrors:errors.slice(0,6)});
  console.error("FAIL",name,e.message,errors.slice(0,5));
  try{await page.screenshot({path:path.join(reportDir,name.replace(/[^a-z0-9]/gi,"_")+".png"),fullPage:true,timeout:6000})}catch{}
 }finally{await context.close()}
}
try{
 await run("Desktop trade filters and source links",{width:1440,height:900},async page=>{
  const p=page.locator("#fa-september");
  assert.equal(await p.locator("#sepKpi .fa-kpi").count(),4);
  assert.equal(await p.locator("#sepBars .sep-bar").count(),4);
  const ctl=p.locator("#sepTradeControls select");
  assert.equal(await ctl.count(),2);
  await ctl.nth(0).selectOption("fresh");await ctl.nth(1).selectOption("2026-07");
  await p.locator("#sepBars .sep-bar").first().click();
  assert.match(await page.locator("#sepTradeSource").innerText(),/Jul 2026|2026/);
  const href=await page.locator("#sepTradeSource a").first().getAttribute("href");assert.match(href,/\.pdf#page=18$/);
  await ctl.nth(0).selectOption("processed");await ctl.nth(1).selectOption("2026-01\/07");
  assert.equal(await p.locator("#sepBars .sep-bar").count(),4);
  assert.equal(await p.locator("#sepTimeline .sep-trend").count(),7);
  await p.screenshot({path:path.join(reportDir,"desktop-trade.png")});
 });
 await run("Desktop interactive 38 province map",{width:1440,height:900},async page=>{
  const control=page.locator("#sepGeoControls select");assert.equal(await control.count(),3);
  await page.locator("#sepMap svg path").first().waitFor({timeout:16000});
  assert.equal(await page.locator("#sepMap svg path").count(),38,"Expect 38 province shapes");
  await control.nth(0).selectOption("38");
  await control.nth(1).selectOption("2026-08");
  await control.nth(2).selectOption({label:"Aceh"});
  assert.match(await page.locator("#sepDetail").innerText(),/Aceh/);
  assert.match(await page.locator("#sepDetail").innerText(),/128,06/);
  await control.nth(0).selectOption("49");
  assert.equal(await page.locator("#sepGeoRanking .sep-region").count(),34);
  assert.match(await page.locator("#sepDetail").innerText(),/Rp\/kg/);
  assert.ok(await page.locator('#sepMap svg path[fill="#71818b"]').count()>=1,"Non-reporting provinces must be grey");
  await page.locator("#sepMap").screenshot({path:path.join(reportDir,"provincial-choropleth.png")});
 });
 await run("All 63 source tables and semantic CSV download",{width:1440,height:900},async page=>{
  const sep=page.locator("#fa-september");
  assert.equal(await sep.locator("#sepTableList .sep-source").count(),63);
  const search=sep.locator('#sepTableControls input[type="search"]');
  await search.fill("Tabel 63"); // publisher table 63 is exchange rates
  assert.match(await page.locator("#sepCount").innerText(),/1 dari 63/);
  await search.fill("");
  await sep.locator('#sepTableList .sep-source').last().click();
  assert.match(await page.locator("#sepTableInspect").innerText(),/Kurs Transaksi/);
  const select=page.locator("#sepsemTableChoice");await select.selectOption("63");
  assert.equal(await page.locator("#sepsemNumbers table tbody tr").count(),3);
  const downloadEvent=page.waitForEvent("download",{timeout:10000});
  await page.getByRole("button",{name:"Ekspor seluruh tabel ke CSV"}).click();
  const file=await downloadEvent;assert.match(file.suggestedFilename(),/Tabel-63\.csv$/);
  const save=path.join(reportDir,file.suggestedFilename());await file.saveAs(save);
  const csv=fs.readFileSync(save,"utf8");assert.match(csv,/Kurs Tengah/);assert.match(csv,/2026-08/);
  assert.match(await page.locator("#sepsemNumbers").innerText(),/Kurs/);
 });
 await run("Kramat Jati and national farmer chart controls",{width:1440,height:900},async page=>{
  assert.equal(await page.locator("#sepsemMarketCharts .sepsem-graph svg").count(),2);
  const options=page.locator("#sepsemMarketSelect option");assert.ok(await options.count()>=10);
  await page.locator("#sepsemMarketSelect").selectOption({index:2});
  assert.equal(await page.locator("#sepsemMarketCharts .sepsem-graph svg").count(),2);
  await page.locator("#sepsemFarmerTable").selectOption("32");
  assert.ok(await page.locator("#sepsemFarmerGraph svg path").count()>=1);
  await page.locator("#sepsemWorldTable").selectOption("63");
  await page.locator("#sepsemWorldSelect").selectOption({label:"Kurs Tengah"});
  assert.equal(await page.locator("#sepsemWorldGraph svg path").count(),1);
 });
 await run("Mobile responsive source search, charts and map",{width:390,height:844},async page=>{
  const mobile=await page.evaluate(()=>({width:window.innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(mobile.scroll<=mobile.width+30,"Unexpected whole-site horizontal overflow "+JSON.stringify(mobile));
  await page.locator("#sepTradeControls select").first().selectOption("fresh");
  await page.locator("#sepGeoControls select").first().selectOption("39");
  await page.locator("#sepMap svg path").first().waitFor({timeout:16000});
  assert.ok(await page.locator("#sepMap svg path").count()===38);
  const source=page.locator("#sepsemTableChoice");await source.selectOption("60");
  assert.ok(await page.locator("#sepsemNumbers tbody tr").count()>10);
  await page.locator("#sepsemModule").screenshot({path:path.join(reportDir,"mobile-semantic-explorer.png"),timeout:10000});
 });
}finally{
 await browser.close();
 fs.writeFileSync(path.join(reportDir,"report.json"),JSON.stringify(report,null,2));
}
assert.ok(report.cases.every(x=>x.status==="pass"),"Pusdatin September browser tests failed: "+JSON.stringify(report.cases.filter(x=>x.status==="fail")));
console.log("September rendered browser QA successful",report.cases.length);