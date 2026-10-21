import assert from "node:assert/strict";
import {chromium} from "playwright-core";
const base="http://127.0.0.1:8765/";
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",headless:true,args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]});
const pages=[
 ["indonesia-macroeconomic-intelligence.html","macro","Destry Damayanti"],
 ["policy-regulatory-intelligence.html","policy","Rachmat Pambudy"],
 ["geopolitical-impact-assessment.html","geo","Arrmanatha Christiawan Nasir"],
 ["climate-environment.html","environment","Teuku Faisal Fathani"],
 ["sli-entities.html","entities","Destry Damayanti"],
 ["provincial-intelligence.html","provincial","Rachmat Pambudy"]
];
let passed=0;
try{
 for(const [pathname,sector,person]of pages){
  const page=await browser.newPage({viewport:{width:1366,height:850},locale:"id-ID"});
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto(base+pathname,{waitUntil:"domcontentloaded",timeout:30000});
  const mount=page.locator('[data-sli-ministry-sector="'+sector+'"]');
  await mount.locator(".sli-ministry-node").first().waitFor({timeout:20000});
  assert.match(await mount.innerText(),new RegExp(person.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")),pathname+" official profile missing");
  assert.ok(await mount.locator('.sli-ministry-inspector a[href^="https://"]').count()>=2,pathname+" lacks official evidence links");
  assert.equal(errors.length,0,pathname+" browser errors: "+errors.join("; "));
  console.log("PASS",pathname,sector,person);passed++;await page.close();
 }
 {
  const page=await browser.newPage({viewport:{width:1366,height:850},locale:"id-ID"});
  await page.goto(base+"climate-environment.html",{waitUntil:"domcontentloaded",timeout:30000});
  const root=page.locator('[data-sli-ministry-sector="environment"]');
  await root.locator(".sli-ministry-node").first().waitFor({timeout:20000});
  await root.locator("select").first().selectOption("klh");
  await root.locator(".sli-ministry-node").filter({hasText:"Diaz Faisal Malik Hendropriyono"}).first().click();
  assert.match(await root.locator(".sli-ministry-inspector").innerText(),/Diaz Faisal Malik Hendropriyono/);
  assert.ok(await root.locator(".sli-ministry-site-icon").count()>=1,"Institutional agency site icon should render as img");
  assert.match(await root.innerText(),/bukan logo|favicon|site icon/i);
  console.log("PASS environment Diaz deputy and non-deceptive web-site icon identity");
  passed++;await page.close();
 }
 const page=await browser.newPage({viewport:{width:390,height:844},locale:"id-ID"});
 await page.goto(base+"indonesia-macroeconomic-intelligence.html",{waitUntil:"domcontentloaded",timeout:30000});
 const root=page.locator('[data-sli-ministry-sector="macro"]');
 await root.locator(".sli-ministry-node").first().waitFor({timeout:20000});
 await root.locator("select").first().selectOption("bi");
 await root.locator(".sli-ministry-node").first().click();
 assert.match(await root.locator(".sli-ministry-inspector").innerText(),/Destry Damayanti/);
 assert.match(await root.innerText(),/independent|independen/i);
 const bounds=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(bounds.scroll<=bounds.width+16,"Institutional mobile overflow: "+JSON.stringify(bounds));
 console.log("PASS macro BI 2026 independent governor + mobile");
 passed++;
 await page.close();
}finally{await browser.close()}
console.log("SLI cross-sector browser checks passed",passed);
