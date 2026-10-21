import assert from "node:assert/strict";
import {mkdirSync,writeFileSync} from "node:fs";
import {chromium} from "playwright-core";
const BASE=(process.env.SLI_BROWSER_TEST_BASE||"http://127.0.0.1:8767").replace(/\/$/,"");
const out="artifacts/sli-ruptl-semantic-browser";mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
const results=[];
async function check(route,viewport){
 const context=await browser.newContext({viewport,locale:"id-ID",reducedMotion:"reduce"});
 const page=await context.newPage();
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 const name=route.replace(".html","")+"-"+viewport.width;
 try{
  await page.goto(BASE+"/"+route,{waitUntil:"domcontentloaded",timeout:30000});
  const root=page.locator("[data-sli-ruptl-semantic-network]");
  await root.locator(".sem-event").first().waitFor({timeout:20000});
  assert.equal(await root.locator(".sem-event").count(),5);
  assert.match(await root.innerText(),/Target rencana dibanding bukti bertanggal 2026/);
  assert.match(await root.innerText(),/2031/);
  const sections=root.locator(":scope > details");
  assert.equal(await sections.count(),2);
  await sections.nth(0).locator("summary").click();
  await sections.nth(0).locator("tbody tr").first().waitFor({timeout:25000});
  assert.equal(await sections.nth(0).locator("tbody tr").count(),30,"Semantic source rows use pagination");
  await sections.nth(0).getByLabel("Wilayah sumber RUPTL").selectOption("B.4");
  await page.waitForFunction(()=>document.querySelector("[data-sli-ruptl-semantic-network] details .sem-actions span")?.textContent.includes("/"),null,{timeout:8000});
  assert.match(await sections.nth(0).locator("tbody tr").first().innerText(),/B\.4/);
  await sections.nth(1).locator("summary").click();
  await sections.nth(1).locator("tbody tr").first().waitFor({timeout:25000});
  assert.match(await sections.nth(1).innerText(),/1.253/);
  assert.ok(await sections.nth(1).locator("tbody tr").count()>0);
  await sections.nth(1).getByLabel("Kelompok infrastruktur").selectOption("substations");
  assert.ok(await sections.nth(1).locator("tbody tr").count()>0);
  assert.ok(!errors.some(e=>/ruptl-semantic-network|TypeError|ReferenceError/.test(e)),errors.join(" | "));
  const rect=await root.evaluate(e=>({x:e.getBoundingClientRect().x,w:e.getBoundingClientRect().width,v:innerWidth}));
  assert.ok(rect.w<=rect.v+6,"Semantic explorer overflow on small device "+JSON.stringify(rect));
  await root.screenshot({path:out+"/"+name+".png",timeout:12000});
  results.push({name,status:"pass",errors});
 }catch(error){results.push({name,status:"fail",error:String(error.message),errors});await page.screenshot({path:out+"/"+name+"-FAILED.png"}).catch(()=>{})}
 finally{await context.close()}
}
await check("pln-ruptl-energy-investment.html",{width:1366,height:800});
await check("pln-ruptl-2025-2034-source-intelligence.html",{width:390,height:844});
await browser.close();
writeFileSync(out+"/results.json",JSON.stringify(results,null,2));
results.forEach(r=>console.log(r.status==="pass"?"PASS":"FAIL",r.name,r.error||""));
if(results.some(r=>r.status==="fail"))process.exitCode=1;
