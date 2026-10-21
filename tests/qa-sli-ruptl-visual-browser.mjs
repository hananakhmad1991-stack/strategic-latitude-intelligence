import assert from "node:assert/strict";
import {mkdirSync,writeFileSync} from "node:fs";
import {chromium} from "playwright-core";
const base=(process.env.SLI_BROWSER_TEST_BASE||"http://127.0.0.1:8766").replace(/\/$/,"");
const chrome=process.env.CHROME_BIN||"/usr/bin/google-chrome";
const output="artifacts/sli-ruptl-visual-browser";
mkdirSync(output,{recursive:true});
const browser=await chromium.launch({executablePath:chrome,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
const result=[];
async function scenario(route,width,height){
 const context=await browser.newContext({viewport:{width,height},locale:"id-ID",reducedMotion:"reduce"});
 const page=await context.newPage(),errors=[];
 page.on("pageerror",err=>errors.push(err.message));
 try{
  await page.goto(base+"/"+route,{waitUntil:"domcontentloaded",timeout:30000});
  const root=page.locator("[data-sli-ruptl-visual]");
  await root.locator(".rv-map svg path").first().waitFor({timeout:30000});
  assert.equal(await root.locator(".rv-map svg path").count(),38,"Exact province geometry feature count");
  assert.equal(await root.locator(".rv-donut-wrap svg circle").count(),4,"One donut background and three sectors");
  assert.equal(await root.locator(".rv-chart-wrap svg").count(),3,"Sankey, annual bars, technology rankings");
  assert.equal(await root.locator('.rv-chart-wrap svg[aria-label*="2025 hingga 2034"] rect').count(),10,"One planned MW bar for each year");
  assert.equal(await root.locator('button[aria-pressed="true"]').count(),1,"Map mode toggle");
  await root.locator('[role="button"][aria-label^="Jawa Barat:"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-sli-ruptl-provincial] .sli-ruptl-prov-filters select')?.value==="Jawa Barat",null,{timeout:10000});
  assert.match(await root.locator(".rv-map-info").innerText(),/B\.3/);
  await root.getByRole("button",{name:/970 kandidat/}).click();
  assert.match(await root.locator(".rv-legend").innerText(),/kandidat grid mentah/);
  assert.match(await root.locator(".rv-map-info").innerText(),/kandidat baris mesin/);
  await root.locator("select").selectOption("20");
  assert.equal(await root.locator(".rv-chart-wrap").last().locator("svg rect").count(),20);
  const raw=page.locator("[data-sli-ruptl-raw-grid]");
  await raw.locator("summary").waitFor({timeout:20000});
  await raw.locator("summary").click();
  await raw.locator("tbody tr").first().waitFor({timeout:10000});
  assert.equal(await raw.locator("tbody tr").count(),30,"All 970 catalog rows should be paginated at 30");
  await raw.locator("select").selectOption("B.3");
  assert.match(await raw.locator(".rv-raw-buttons").innerText(),/dari 75 kandidat/);
  assert.match(await raw.locator("tbody tr").first().innerText(),/B\.3/);

  assert.ok(!errors.some(e=>/visual RUPTL|Source PDF identity|source-map|sli-ruptl-visual-explorer/i.test(e)),errors.join("; "));
  if(width<500){
   const r=await root.evaluate(n=>({width:n.getBoundingClientRect().width,viewport:innerWidth,outerScroll:n.scrollWidth}));
   assert.ok(r.width<=r.viewport+3,"Mobile RUPTL visual panel overflows viewport: "+JSON.stringify(r));
  }
  await root.screenshot({path:output+"/"+route.replace(/\.html.*/,"")+"-"+width+".png",timeout:10000});
  result.push({route,width,status:"pass",runtime_errors:errors});
 }catch(e){
  result.push({route,width,status:"fail",error:String(e.message),runtime_errors:errors});
  await page.screenshot({path:output+"/failure-"+width+".png"}).catch(()=>{});
 }finally{await context.close()}
}
await scenario("pln-ruptl-energy-investment.html",1366,800);
await scenario("pln-ruptl-2025-2034-source-intelligence.html",390,844);
await browser.close();
writeFileSync(output+"/results.json",JSON.stringify(result,null,2));
result.forEach(x=>console.log(x.status==="pass"?"PASS":"FAIL",x.route,x.width,x.error||""));
if(result.some(x=>x.status==="fail"))process.exitCode=1;
