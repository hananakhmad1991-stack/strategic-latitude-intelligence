/* Real Chromium smoke test, intentionally separate from static source-code QA.
 * It checks rendered geometry/interactions only; it cannot verify publisher facts.
 * Runs against a local copy of public SLI with no user secrets or owner token.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {chromium} from "playwright-core";

const BASE=(process.env.SLI_BROWSER_TEST_BASE||"http://127.0.0.1:8765").replace(/\/$/,"");
// Derive the expected figure count from source-controlled, publisher-attributed registers.
const aiFigures=[
 ...JSON.parse(fs.readFileSync("data/sli-stanford-2026-digitized-figures.json","utf8")).figures,
 ...JSON.parse(fs.readFileSync("data/sli-worldbank-ai-2025-digitized-figure-panels.json","utf8")).figures
];
const figureCount=aiFigures.length;
const figureId=f=>(f.source_url?"worldbank:":"stanford:")+f.figure_number+(f.figure_panel||"");
assert.equal(new Set(aiFigures.map(figureId)).size,figureCount,"Source-qualified AI panel identifiers must be unique");
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
  page.on("console",msg=>{if(msg.type()==="error")errors.push("console: "+msg.text().slice(0,350))});
 try{
  await fn(page);
  report.tests.push({name,status:"pass",page_errors:errors.slice(0,3)});
  console.log("PASS",name,errors.length?"(runtime warnings observed)":"");
 }catch(error){
  const filename=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,65);
  try{await page.screenshot({path:path.join(outDir,filename+".png"),fullPage:false,timeout:5000})}catch{}
  report.tests.push({name,status:"fail",error:String(error.message||error),page_errors:errors.slice(0,5)});
  console.error("FAIL",name,String(error.message||error),errors.slice(0,5),await page.locator("#mfHierarchyDiagram").first().textContent().catch(()=>null));
    if(name.startsWith("Marine"))console.error("Marine source fetch probe",await page.evaluate(async()=>{try{const r=await fetch("./data/sli-marine-governance.json?v=20261021-officers-v2",{cache:"no-store"});const j=await r.json();return{url:r.url,status:r.status,schema:j.schema,n:j.hierarchy?.length}}catch(e){return{error:String(e)}}}).catch(e=>String(e)));
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

await check("Marine institutional desktop: maps render, drill down and show verified 2026 officers",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("marine-fisheries-intelligence.html#marine-governance"),{waitUntil:"domcontentloaded",timeout:30000});
 await waitMast(page);
 await page.locator("#mfHierarchyDiagram .mf-gov-node").first().waitFor({timeout:25000});
 const order=await page.evaluate(()=>document.getElementById("marine-governance").compareDocumentPosition(document.getElementById("marine-overview")) & Node.DOCUMENT_POSITION_FOLLOWING);
 assert.ok(order,"Governance must appear before statistical overview");
 assert.ok(await page.locator("#mfHierarchyDiagram .mf-gov-node").count()>=14,"KKP directorates unavailable");
 assert.match(await page.locator("#mfHierarchyProfile").innerText(),/Sakti Wahyu Trenggono/);
 await page.locator('#mfHierarchyDiagram [data-mf-entity="djprl"]').click();
 assert.match(await page.locator("#mfHierarchyProfile").innerText(),/Kartika Listriana/);
 await page.locator('#mfHierarchyDiagram .mf-gov-unit-block:has([data-mf-entity="djpt"]) .mf-gov-expand').click();
 assert.ok(await page.locator('#mfHierarchyDiagram [data-mf-entity="pt-pelabuhan"]').count()===1,"Internal units did not expand");
 assert.equal(await page.locator("#mfNetworkChips button").count(),7,"Six hubs and All filter missing");
 await page.locator("#mfNetworkChips button").nth(2).click();
 await page.locator('#mfNetworkDiagram [data-mf-entity="djpt"]').click();
 assert.match(await page.locator("#mfNetworkProfile").innerText(),/Lotharia Latif/);
 assert.equal(await page.locator('#mfNetworkDiagram .mf-gov-hub').count(),1,"Filtered hub should be independently selectable");
});
await check("Marine institutional mobile: stacked inspector and no overflow",{width:390,height:844},async page=>{
 await page.goto(pageUrl("marine-fisheries-intelligence.html"),{waitUntil:"domcontentloaded",timeout:30000});
 await page.locator("#mfNetworkDiagram .mf-gov-hub").first().waitFor({timeout:25000});
 const size=await page.evaluate(()=>({viewport:innerWidth,doc:document.documentElement.scrollWidth,inspector:getComputedStyle(document.querySelector("#marine-hierarchy .mf-governance-inspector")).position,hubs:document.querySelectorAll("#mfNetworkDiagram .mf-gov-hub").length}));
 assert.ok(size.doc<=size.viewport+16,"Marine organizational map horizontal overflow: "+JSON.stringify(size));
 assert.equal(size.inspector,"static","Marine profile must stack below mobile diagram");
 assert.equal(size.hubs,6,"Marine hub map should be visible on mobile");
});

await check("Food ministry hierarchy: October Wamentan and Itjen are selectable",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("food-agriculture-intelligence.html"),{waitUntil:"domcontentloaded",timeout:30000});
 const root=page.locator('.sli-ministry-mount[data-sli-sector="food"]');
 await root.locator(".sli-ministry-node").first().waitFor({timeout:24000});
 assert.match(await root.innerText(),/Muhammad Saleh Mustafa/);
 await root.locator(".sli-ministry-expand").first().click();
 assert.match(await root.innerText(),/Irham Waroihan/);
 assert.match(await root.locator(".sli-ministry-inspector").innerText(),/Andi Amran Sulaiman/);
});
await check("AI ministry hierarchy: dual deputies and directorates",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("ai-intelligence-hub.html"),{waitUntil:"domcontentloaded",timeout:30000});
 const root=page.locator('.sli-ministry-mount[data-sli-sector="ai"]');
 await root.locator(".sli-ministry-node").first().waitFor({timeout:24000});
 assert.match(await root.innerText(),/Angga Raka Prabowo/);
 assert.match(await root.innerText(),/Nezar Patria/);
 await root.locator(".sli-ministry-expand").first().click();
 assert.match(await root.innerText(),/Ismail/);
 assert.match(await root.innerText(),/Arief Tri Hardiyanto/);
});
await check("Energy ministerial hierarchy: Deputy SG IG and DG names mobile",{width:390,height:844},async page=>{
 await page.goto(pageUrl("index.html#energy"),{waitUntil:"domcontentloaded",timeout:30000});
 const root=page.locator('.sli-ministry-mount[data-sli-sector="energy"]');
 await root.locator(".sli-ministry-node").first().waitFor({timeout:27000});
 assert.match(await root.innerText(),/Yuliot/);
 await root.locator(".sli-ministry-expand").first().click();
 assert.match(await root.innerText(),/Ahmad Erani Yustika/);
 assert.match(await root.innerText(),/Yudhiawan/);
 const metrics=await page.evaluate(()=>{const el=document.querySelector('.sli-ministry-mount[data-sli-sector="energy"]');const r=el.getBoundingClientRect();return {pageDocument:document.documentElement.scrollWidth,viewport:innerWidth,componentRight:r.right,componentLeft:r.left,componentWidth:r.width,pos:getComputedStyle(el.querySelector('.sli-ministry-inspector')).position};});
 assert.ok(metrics.componentRight<=metrics.viewport+8&&metrics.componentLeft>=-8,"New ministry component itself overflows mobile viewport: "+JSON.stringify(metrics));
 if(metrics.pageDocument>metrics.viewport+16)console.warn("Known existing Energy page-wide SVG/table overflow remains outside ministry component:",JSON.stringify(metrics));
 assert.equal(metrics.pos,"static");
});

await check("Homepage: fewer topics, source links within sector cards",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("index.html#home"),{waitUntil:"domcontentloaded",timeout:30000});
 await page.locator(".sli-portal-topic-card").first().waitFor({timeout:22000});
 assert.equal(await page.locator(".sli-portal-topic-card").count(),7,"Expected 7 cards including dedicated marine");
 assert.equal(await page.locator(".sli-portal-sector-library,#sliPortalDataLibrary").count(),0,"Redundant Data Library category must be absent");
 const topics=page.locator(".sli-portal-topic-links a");
 assert.equal(await topics.count(),11,"Marine adds source and institutional deep links");
 const link=page.locator('.sli-portal-topic-card:has(a[href="#energy"]) .sli-portal-topic-links a[href*="#power"]');
 await link.click();
 await page.waitForURL(/sli-sector-data-library\.html#power/,{timeout:15000});
 await page.waitForFunction(()=>document.body.classList.contains("sli-library-topic-mode"),null,{timeout:12000});
 assert.ok(await page.locator("#power").isVisible(),"Selected power evidence must remain visible");
 assert.ok(!(await page.locator("#security").isVisible()),"Unrelated security section must not clutter power topic view");
 assert.ok(await page.locator("#sliLibraryTopicParent a").count()>=1,"Domain return navigation missing");
 await page.locator("#powerTable table").waitFor({timeout:20000});
 assert.ok((await page.locator("#powerTable tbody tr").count())>0,"PLN source data not rendered");
});
await check("Mobile homepage topics: responsive layout without extra library tile",{width:390,height:844},async page=>{
 await page.goto(pageUrl("index.html#home"),{waitUntil:"domcontentloaded",timeout:30000});
 await page.locator(".sli-portal-topic-card").first().waitFor({timeout:18000});
 const metrics=await page.evaluate(()=>({viewport:innerWidth,doc:document.documentElement.scrollWidth,topicCards:document.querySelectorAll(".sli-portal-topic-card").length,oldLibrary:document.querySelectorAll(".sli-portal-sector-library").length}));
 assert.ok(metrics.doc<=metrics.viewport+16,"Home page horizontal overflow after topic consolidation: "+JSON.stringify(metrics));
 assert.equal(metrics.topicCards,7);
 assert.equal(metrics.oldLibrary,0);
 await page.locator('.sli-portal-topic-card:has(a[href="#policy"]) .sli-portal-topic-links a[href$="#governance"]').click();
 await page.waitForURL(/sli-sector-data-library\.html#governance/,{timeout:15000});
 await page.waitForFunction(()=>document.body.classList.contains("sli-library-topic-mode"),null,{timeout:12000});
 assert.ok(await page.locator("#governance").isVisible());
 assert.ok(!(await page.locator("#power").isVisible()));
});
await check("Source integration: provincial search and IEA dataset filters",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("sli-sector-data-library.html#socio"),{waitUntil:"domcontentloaded",timeout:30000});
 await page.waitForFunction(()=>document.getElementById("libStatus")?.dataset.status==="ready",null,{timeout:25000});
 assert.ok(await page.locator("#socioTable tbody tr").count()>0,"Missing source-linked socioeconomic records");
 const before=await page.locator("#socioTable tbody tr").count();
 await page.locator("#socioQuery").fill("Aceh");
 await page.waitForTimeout(150);
 const after=await page.locator("#socioTable tbody tr").count();
 assert.ok(after>0&&after<before,"Provincial search must narrow real rows: "+before+" → "+after);
 await page.goto(pageUrl("sli-sector-data-library.html#minerals"),{waitUntil:"domcontentloaded",timeout:30000});
 await page.waitForFunction(()=>document.body.classList.contains("sli-library-topic-mode"),null,{timeout:12000});
 assert.ok(await page.locator("#minerals").isVisible(),"Mineral evidence topic not visible");
 await page.locator("#ieaGroup option").first().waitFor({state:"attached",timeout:12000});
 assert.ok((await page.locator("#ieaGroup option").count())>1,"IEA scenario options missing");
 await page.locator("#ieaGroup").selectOption({index:1});
 assert.ok(await page.locator("#ieaDemand table").count()>0,"IEA table not updated by group filter");
});
await check("IDX sector watchlist: selected tab changes tickers",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("index.html#home"),{waitUntil:"domcontentloaded",timeout:30000});
 const tabs=page.locator("#sliHomeIDXSectors .sli-idx-sectoral-tab");
 await tabs.first().waitFor({timeout:25000});
 assert.ok((await tabs.count())>=6,"Missing strategic sector selectors");
 const initial=await page.locator("#sliHomeIDXSectors .sli-idx-sectoral-tickers").innerText();
 await tabs.nth(1).click();
 assert.equal(await tabs.nth(1).getAttribute("aria-pressed"),"true","Sector selection not activated");
 const next=await page.locator("#sliHomeIDXSectors .sli-idx-sectoral-tickers").innerText();
 assert.ok(next!==initial,"Sector filter did not change listed companies");
 const href=await page.locator("#sliHomeIDXSectors .sli-idx-sectoral-ticker").first().getAttribute("href");
 assert.match(href,/sli-issuer\.html\?ticker=[A-Z0-9]{4}/,"Ticker must link to exact issuer dossier");
});
await check("Strategic Map: map province click opens contextual inspector",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("index.html#map"),{waitUntil:"domcontentloaded",timeout:30000});
 const provinces=page.locator("#sliMapRoot .map-viz .map-province");
 await provinces.first().waitFor({timeout:35000});
 assert.ok(await provinces.count()>=30,"Geographic province layer did not render");
 const withRecords=provinces.filter({hasNotText:"DO_NOT_MATCH"}).first();
 await withRecords.click({force:true});
 await page.waitForFunction(()=>document.querySelector("#sliMapRoot .map-results-head h3")?.textContent?.trim().length>0);
 assert.ok((await page.locator("#sliMapRoot .map-asset-insight").innerText()).length>20,"Right-side inspector missing after map selection");
 await page.locator("#sliMapRoot .map-expand").click();
 assert.equal(await page.locator("#sliMapRoot .map-expand").getAttribute("aria-expanded"),"true","Browse matching assets did not expand");
});
await check("Chart click and CSV/XLSX/PNG/JPG/PDF/embed exports produce real output",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("index.html#home"),{waitUntil:"domcontentloaded",timeout:30000});
 await page.waitForFunction(()=>!!window.SLIVisualExport&&!!window.SLIVisualFormats,null,{timeout:25000});
 await page.evaluate(()=>{
  const root=document.createElement("section");
  root.id="sliSmokeExports";root.innerHTML='<h3>SLI browser QA source illustration</h3><div class="table-wrap"><table><thead><tr><th>Year</th><th>Observed value</th></tr></thead><tbody><tr><td>2025</td><td>10</td></tr><tr><td>2026</td><td>11</td></tr></tbody></table></div>';
  document.body.append(root);
  window.SLIVisualExport.register(root.querySelector("table"),{
   meta:{title:"SLI browser QA source illustration",source:"Deterministic local QA fixture — not real statistics",sourceUrl:"https://www.bps.go.id",period:"QA only"},
   getData:()=>({headers:["Year","Observed value"],rows:[["2025","10"],["2026","11"]]})
  });
  window.SLIVisualExport.refresh();
 });
 const host=page.locator("#sliSmokeExports .sli-visual-export-host");
 await host.locator(".sli-visual-export-toolbar").waitFor({timeout:12000});
 await host.locator("tbody tr").first().click();
 await page.locator(".sli-visual-insight").waitFor({timeout:12000});
 assert.ok((await page.locator(".sli-visual-insight").innerText()).includes("2025"),"Click for chart/table insight did not show selected point");
 const signatures={csv:null,xlsx:"504b",png:"89504e47",jpg:"ffd8",pdf:"25504446"};
 for(const [format,magic] of Object.entries(signatures)){
  const [download]=await Promise.all([page.waitForEvent("download",{timeout:20000}),host.locator('[data-sli-export-format="'+format+'"]').click()]);
  assert.ok(download.suggestedFilename().endsWith("."+format),"Wrong export extension for "+format);
  const bytes=fs.readFileSync(await download.path());
  assert.ok(bytes.length>100,"Empty "+format+" export");
  if(magic)assert.equal(bytes.subarray(0,magic.length/2).toString("hex"),magic,"Invalid "+format+" file signature");
  if(format==="csv")assert.ok(bytes.toString("utf8").includes("Observed value"),"CSV missing column content");
  console.log("Verified",format,bytes.length,"bytes");
 }
 await page.context().grantPermissions(["clipboard-read","clipboard-write"]);
 await host.locator('[data-sli-export-format="embed"]').click();
 await page.waitForFunction(()=>document.querySelector("#sliSmokeExports .sli-visual-export-feedback")?.textContent?.includes("copied"),null,{timeout:8000});
 const copied=await page.evaluate(()=>navigator.clipboard.readText());
 assert.ok(copied.includes("<iframe")&&copied.includes("sli_embed="),"Embed does not contain an attributable frame");
});

await check("Home and legacy #overview alias share the single sector navigation",{width:1366,height:850},async page=>{
 for(const chapter of ["home","overview"]){
  await page.goto(pageUrl("index.html#"+chapter),{waitUntil:"domcontentloaded",timeout:30000});
  await waitMast(page);await checkMast(page);
  assert.equal(new URL(page.url()).hash,"#home","Retired overview URL must normalize to Home");
  assert.equal(await page.locator(".sli-portal-topnav").count(),0,"Duplicate standalone homepage navbar still present");
  const dropdown=page.locator("#sliPlatformMast .sli-platform-explorer");
  await dropdown.locator(":scope > summary").click();
  await page.waitForFunction(()=>document.querySelector("#sliPlatformMast .sli-platform-explorer")?.open===true,null,{timeout:6000});
  const menu=dropdown.locator(".sli-platform-sector-menu");
  assert.ok(await menu.isVisible(),"Explore Data dropdown not visible on "+chapter);
  assert.equal(await menu.locator(".sli-platform-sector-group").count(),8,"Explorer must have eight distinct topical groups");
  assert.ok(await menu.locator(".sli-platform-sector-group").nth(5).locator('a[href="./ai-investor-layer.html"]').count()===1,"AI specialist route must live inside AI group");
  assert.ok(await menu.locator(".sli-platform-sector-group").nth(2).locator('a[href="./pln-ruptl-2025-2034-source-intelligence.html"]').count()===1,"RUPTL detail must live inside Energy group");
  assert.ok(await menu.locator('a[href="./index.html#energy"]').count()===1,"Energy sector missing from unified menu");
  assert.ok(await menu.locator('a[href="./sli-sector-data-library.html#power"]').count()===1,"Power source evidence not nested beneath Energy");
  assert.equal(await menu.locator('a[href="./sli-sector-data-library.html"]').count(),0,"Data Library is not a top-level category");
  await page.keyboard.press("Escape");
  assert.equal(await dropdown.getAttribute("open"),null,"Escape must close accessible Explore Data dropdown");
 }
 await page.locator("#sliPlatformMast .sli-platform-explorer > summary").click();
 const energyFamily=page.locator("#sliPlatformMast .sli-platform-sector-group").nth(2);
 await energyFamily.locator(":scope > summary").click();
 await energyFamily.locator('a[href="./index.html#energy"]').click();
 await page.waitForURL(/#energy$/,{timeout:15000});
 assert.equal(await page.locator("body.sli-home-active").count(),0,"Choosing energy must open dashboard, not scroll homepage");
});
await check("Navigation mobile: dropdown remains visible and scrollable",{width:390,height:844},async page=>{
 await page.goto(pageUrl("index.html#home"),{waitUntil:"domcontentloaded",timeout:30000});
 await waitMast(page);
 await page.locator('#sliPlatformMast [data-sli-mast-language="id"]').click();
 const dropdown=page.locator("#sliPlatformMast .sli-platform-explorer");
 await dropdown.locator(":scope > summary").click();
 await page.waitForFunction(()=>document.querySelector("#sliPlatformMast .sli-platform-explorer")?.open===true,null,{timeout:6000});
 const geom=await page.evaluate(()=>{
  const m=document.querySelector("#sliPlatformMast .sli-platform-sector-menu"),r=m.getBoundingClientRect(),header=document.querySelector("#sliPlatformMast").getBoundingClientRect();
  return {top:r.top,bottom:r.bottom,headerBottom:header.bottom,width:r.width,viewport:innerWidth,scrollHeight:m.scrollHeight,clientHeight:m.clientHeight,overflow:getComputedStyle(m).overflowY};
 });
 assert.ok(geom.width<=geom.viewport+1,"Mobile dropdown wider than viewport: "+JSON.stringify(geom));
 assert.ok(geom.top>=geom.headerBottom-4,"Mobile menu hidden underneath navbar: "+JSON.stringify(geom));
 assert.ok(geom.bottom<=844+4,"Dropdown goes beyond the viewport: "+JSON.stringify(geom));
 assert.equal(geom.overflow,"auto","Long module menu must support internal scrolling");
 assert.ok(await dropdown.locator(":scope > summary").innerText().then(x=>x.includes("Jelajahi Data")),"Indonesian menu label not displayed");
});
await check("AI atlas desktop: World Bank panel selection preserves original source and CSV numeric values",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("ai-intelligence-hub.html"),{waitUntil:"domcontentloaded",timeout:30000});
 const root=page.locator("#sliAiDigitizedFigureAtlas");
 const select=root.locator("select").first();
 await page.waitForFunction(n=>document.querySelectorAll("#sliAiDigitizedFigureAtlas select option").length===n,figureCount,{timeout:20000});
 assert.equal(await select.locator("option").count(),figureCount,"AI Atlas must render every reviewed source panel");
 const worldbankFigure=select.locator('option[data-sli-figure-id="worldbank:4.2a"]');
 const figureValue=await worldbankFigure.getAttribute("value");
 assert.ok(figureValue!==null,"World Bank Figure 4.2a must have a stable option ID");
 await select.selectOption(figureValue);
 assert.match(await root.locator("p").first().innerText(),/World Bank/i);
 const source=await root.locator('a[href*="worldbank.org"]').first().getAttribute("href");
 assert.match(source,/documents1.worldbank.org/);
 const bars=root.locator(".sli-figure-plot svg rect[data-value]");
 assert.equal(await bars.count(),8,"World Bank figure 4.2a must show all eight labelled categories");
 await bars.first().click();
 assert.match(await root.locator(".sli-figure-detail").innerText(),/40 %/);
 await page.waitForFunction(()=>!!window.SLIVisualExport&&!!document.querySelector("#sliAiDigitizedFigureAtlas .sli-visual-export-toolbar"),null,{timeout:16000});
 const [download]=await Promise.all([page.waitForEvent("download",{timeout:20000}),root.locator('[data-sli-export-format="csv"]').first().click()]);
 const raw=fs.readFileSync(await download.path()).toString("utf8");
 assert.ok(raw.includes("United States")&&raw.includes("40"),"Source-aligned numeric CSV missing World Bank observation");
 assert.ok(raw.includes("documents1.worldbank.org"),"World Bank link missing from CSV provenance");
 const secondValue=await select.locator('option[data-sli-figure-id="worldbank:4.2b"]').getAttribute("value");
 assert.ok(secondValue!==null,"World Bank Figure 4.2b missing");
 await select.selectOption(secondValue);
 assert.match(await root.locator(".sli-figure-detail").innerText(),/%/);
 assert.equal(await root.locator(".sli-figure-plot svg rect[data-value]").count(),6);
});
await check("AI Atlas EN/ID switch preserves chart selection, source unit and exact values",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("ai-intelligence-hub.html"),{waitUntil:"domcontentloaded",timeout:30000});
 await waitMast(page);
 const atlas=page.locator("#sliAiDigitizedFigureAtlas");
 const select=atlas.locator("select").first();
 await page.waitForFunction(n=>document.querySelectorAll("#sliAiDigitizedFigureAtlas select option").length===n,figureCount,{timeout:20000});
 const initial=await select.locator('option[data-sli-figure-id="worldbank:4.2a"]').getAttribute("value");
 assert.ok(initial!==null,"Missing permanent World Bank source qualified figure key");
 await select.selectOption(initial);
 await atlas.locator("details > summary").click();
 const sample=await atlas.locator(".sli-figure-plot svg rect[data-value]").first().getAttribute("data-value");
 const source=await atlas.locator('a[href*="worldbank.org"]').first().getAttribute("href");
 await page.locator('#sliPlatformMast [data-sli-mast-language="id"]').click();
 await page.waitForFunction(()=>document.querySelector("#sliAiDigitizedFigureAtlas h3")?.textContent?.includes("Grafik laporan asli"),null,{timeout:8000});
 assert.match(await atlas.locator("table thead").innerText(),/Distribusi perusahaan rintisan penyedia data pelatihan AI/,"Indonesian evidence table must have Indonesian title");
 assert.match(await select.locator("option:checked").innerText(),/Gambar 4\.2a/,"Source figure number preserved, figure label localized");
 assert.equal(await select.inputValue(),initial,"Language switch must preserve selected source figure");
 assert.equal(await atlas.locator(".sli-figure-plot svg rect[data-value]").first().getAttribute("data-value"),sample,"Language switch changed actual source number");
 assert.equal(await atlas.locator('a[href*="worldbank.org"]').first().getAttribute("href"),source,"Source PDF URL should be language-independent");
 assert.match(await select.locator("option:checked").innerText(),/World Bank/);
 await page.locator('#sliPlatformMast [data-sli-mast-language="en"]').click();
 await page.waitForFunction(()=>document.querySelector("#sliAiDigitizedFigureAtlas h3")?.textContent?.includes("Digitized original-report figures"),null,{timeout:8000});
 assert.match(await atlas.locator("table thead").innerText(),/Training-data AI startups by location/,"English table title must be restored");
 assert.equal(await select.inputValue(),initial,"Switching back to English lost the active figure");
 assert.equal(await atlas.locator(".sli-figure-plot svg rect[data-value]").first().getAttribute("data-value"),sample);
});
await check("AI atlas mobile: full source-derived panel catalog and satellite series stay navigable",{width:390,height:844},async page=>{
 await page.goto(pageUrl("ai-intelligence-hub.html"),{waitUntil:"domcontentloaded",timeout:30000});
 const root=page.locator("#sliAiDigitizedFigureAtlas");
 const select=root.locator("select").first();
 await page.waitForFunction(n=>document.querySelectorAll("#sliAiDigitizedFigureAtlas select option").length===n,figureCount,{timeout:20000});
 const satValue=await select.locator('option[data-sli-figure-id="worldbank:2.2"]').getAttribute("value");
 assert.ok(satValue!==null,"World Bank Figure 2.2 satellite series is missing");
 await select.selectOption(satValue);
 assert.equal(await root.locator(".sli-figure-plot svg circle[data-value]").count(),36,"Four orbital series across nine years must be rendered");
 assert.match(await root.locator(".sli-figure-detail").innerText(),/satellites/i);
 const dims=await page.evaluate(()=>{
   const plot=document.querySelector("#sliAiDigitizedFigureAtlas .sli-figure-plot");
   return {viewport:innerWidth,doc:document.documentElement.scrollWidth,chartOverflow:getComputedStyle(plot).overflowX,chartScroll:plot.scrollWidth,chartClient:plot.clientWidth};
 });
 assert.ok(dims.doc<=dims.viewport+16,"Page overflowing horizontally: "+JSON.stringify(dims));
 assert.equal(dims.chartOverflow,"auto","Long figure labels must scroll INSIDE chart plot");
 assert.ok(dims.chartScroll>=dims.chartClient);
});
await check("AI Atlas data library: source table and satellite unit remain bilingual",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("sli-sector-data-library.html"),{waitUntil:"domcontentloaded",timeout:30000});
 await waitMast(page);
 const root=page.locator("#sliAiDigitizedLibraryFigures"), select=root.locator("select").first();
 await page.waitForFunction(n=>document.querySelectorAll("#sliAiDigitizedLibraryFigures select option").length===n,figureCount,{timeout:20000});
 const figureValue=await select.locator('option[data-sli-figure-id="worldbank:2.2"]').getAttribute("value");
 assert.ok(figureValue!==null,"World Bank satellite figure not available through Data Library");
 await select.selectOption(figureValue);
 await root.locator("details > summary").click();
 assert.equal(await root.locator("table thead th").first().innerText(),"Year");
 assert.match(await root.locator("table thead").innerText(),/Low Earth orbit \(LEO\) \(satellites\)/);
 const numericBefore=await root.locator(".sli-figure-plot svg circle[data-value]").first().getAttribute("data-value");
 await page.locator('#sliPlatformMast [data-sli-mast-language="id"]').click();
 await page.waitForFunction(()=>document.querySelector("#sliAiDigitizedLibraryFigures table thead th")?.textContent==="Tahun",null,{timeout:8000});
 assert.match(await root.locator("table thead").innerText(),/Orbit rendah \(LEO\) \(satelit\)/);
 assert.equal(await select.inputValue(),figureValue,"Switching language changed selected figure");
 assert.equal(await root.locator(".sli-figure-plot svg circle[data-value]").first().getAttribute("data-value"),numericBefore,"Source measurement changed when switching language");
});
await check("RUPTL source consistency: 1,253-page indexed annex is discoverable without invented project rows",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("pln-ruptl-2025-2034-source-intelligence.html#ruptl-full-annex-source-index"),{waitUntil:"domcontentloaded",timeout:30000});
 const sourceNote=page.locator("#ruptl-full-source-status");
 assert.match(await sourceNote.innerText(),/1,253-page/);
 assert.match(await sourceNote.innerText(),/heading-only index does not validate individual project records/);
 assert.equal(await page.locator("#ruplt-provincial-project-review").count(),1,"Separate sampled project evidence panel must remain available");
 assert.doesNotMatch(await sourceNote.innerText(),/truncated approximately 16 MB/);
 const atlas=page.locator('[data-sli-ruptl-annex-index]');
 await page.waitForFunction(()=>document.querySelectorAll('[data-sli-ruptl-annex-index] tbody tr').length===42,null,{timeout:20000});
 assert.equal(await atlas.locator("tbody tr").count(),42);
 assert.match(await atlas.innerText(),/belum mengonfirmasi nama proyek/);
 await page.goto(pageUrl("ai-regional-grid-opportunities.html"),{waitUntil:"domcontentloaded"});
 const back=page.locator('a[href*="#ruptl-full-annex-source-index"]').first();
 assert.equal(await back.count(),1,"AI grid dashboard must link directly to full annex source index");
 assert.match(await page.locator("body").innerText(),/not confirm project-level grid nodes/);
});
await check("Indonesian source cautions: RUPTL and provincial methodology remain navigable",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("ruplt-investor-digitization.html"),{waitUntil:"domcontentloaded",timeout:30000});
 await waitMast(page);
 await page.locator('#sliPlatformMast [data-sli-mast-language="id"]').click();
 await page.waitForFunction(()=>document.body.innerText.includes("akumulasi 71,67 juta meter pada 2037"),null,{timeout:10000});
 const annex=page.locator('a[href*="pln-ruptl-2025-2034-source-intelligence.html#ruptl-full-annex-source-index"]').first();
 assert.equal(await annex.count(),1,"Excerpt must link to independently audited full official annex source");
 await page.goto(pageUrl("provincial-opportunity-engine.html"),{waitUntil:"domcontentloaded",timeout:30000});
 await waitMast(page);
 await page.waitForFunction(()=>document.body.innerText.includes("Garis acuan vertikal merupakan median pertumbuhan riil"),null,{timeout:12000});
 assert.equal(await page.locator('a[href="./provincial-intelligence.html"]').first().count(),1,"Provincial dashboard must retain cross-sector dossier route");
});

await check("Cross-sector institutional hierarchy: six standalone dashboards render source-linked officials",{width:1366,height:850},async page=>{
 const pages=[
  ["indonesia-macroeconomic-intelligence.html","macro","Destry Damayanti"],
  ["policy-regulatory-intelligence.html","policy","Rachmat Pambudy"],
  ["geopolitical-impact-assessment.html","geo","Rachmat Pambudy"],
  ["climate-environment.html","environment","Teuku Faisal Fathani"],
  ["sli-entities.html","entities","Destry Damayanti"],
  ["provincial-intelligence.html","provincial","Rachmat Pambudy"]
 ];
 for(const [filename,sector,leader] of pages){
  await page.goto(pageUrl(filename),{waitUntil:"domcontentloaded",timeout:30000});
  const mount=page.locator('[data-sli-ministry-sector="'+sector+'"]');
  await mount.locator(".sli-ministry-node").first().waitFor({timeout:15000});
  const text=await mount.innerText();
  assert.ok(text.includes(leader),filename+" missing officially verified leader "+leader);
  assert.ok(await mount.locator(".sli-ministry-inspector a[href^='https://']").count()>=2,filename+" missing institutional source links");
 }
});
await check("Macro institution independent BI and responsive mobile roster",{width:390,height:844},async page=>{
 await page.goto(pageUrl("indonesia-macroeconomic-intelligence.html"),{waitUntil:"domcontentloaded",timeout:30000});
 const mount=page.locator('[data-sli-ministry-sector="macro"]');
 await mount.locator(".sli-ministry-node").first().waitFor({timeout:15000});
 const filter=mount.locator("select").first();await filter.selectOption("bi");
 await mount.locator(".sli-ministry-node").first().click();
 assert.match(await mount.locator(".sli-ministry-inspector").innerText(),/Destry Damayanti/);
 assert.match(await mount.innerText(),/independent|independen/i);
 const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(metrics.scroll<=metrics.width+16,"Cross-sector ministerial inspector overflows mobile viewport: "+JSON.stringify(metrics));
});
await check("KKP Marine atlas desktop: reconciled provinces, hatchery ranking, source status and CSV",{width:1366,height:850},async page=>{
 await page.goto(pageUrl("marine-fisheries-intelligence.html#marine-source-atlas"),{waitUntil:"domcontentloaded",timeout:30000});
 await page.locator("#mfAtlasProvinceChart .mf-atlas-bar-row").first().waitFor({timeout:25000});
 assert.match(await page.locator("#mfAtlasProvinceSummary").innerText(),/37/);
 assert.equal(await page.locator("#mfAtlasSourceCards .mf-atlas-source-card").count(),25);
 assert.equal(await page.locator("#mfAtlasSeedList .mf-atlas-seed-item").count(),12);
 await page.locator("#mfAtlasProvinceMetric").selectOption("seaweed_growout_2024");
 assert.match(await page.locator("#mfAtlasProvinceSummary").innerText(),/26/);
 assert.equal((await page.locator("#mfAtlasProvinceChart .mf-atlas-bar-row").first().innerText()).includes("Sulawesi Selatan"),true);
 await page.locator("#mfAtlasProvinceQuery").fill("Kalimantan Utara");
 assert.equal(await page.locator("#mfAtlasProvinceChart .mf-atlas-bar-row").count(),1);
 await page.locator("#mfAtlasProvinceQuery").fill("");
 await page.locator("#mfAtlasAllButton").click();
 assert.equal(await page.locator("#mfAtlasProvinceChart .mf-atlas-bar-row").count(),26);
 await page.locator("#mfAtlasSourceStatus").selectOption("candidate");
 assert.equal(await page.locator("#mfAtlasSourceCards .mf-atlas-source-card").count(),22);
 await page.locator("#mfAtlasSourceGroup").selectOption("trade");
 assert.ok(await page.locator("#mfAtlasSourceCards .mf-atlas-source-card").count()>=3);
 const links=await page.locator("#mfAtlasSourceCards .mf-atlas-source-card a").evaluateAll(items=>items.every(x=>new URL(x.href).hostname==="portaldata.kkp.go.id"));
 assert.ok(links,"Official source URLs must lead to portaldata.kkp.go.id");
});
await check("KKP Marine atlas mobile: usable controls without horizontal overflow",{width:390,height:844},async page=>{
 await page.goto(pageUrl("marine-fisheries-intelligence.html"),{waitUntil:"domcontentloaded",timeout:30000});
 await page.locator("#mfAtlasSourceCards .mf-atlas-source-card").first().waitFor({timeout:25000});
 const m=await page.evaluate(()=>({inner:innerWidth,document:document.documentElement.scrollWidth,rows:document.querySelectorAll("#mfAtlasSeedList .mf-atlas-seed-item").length}));
 assert.ok(m.document<=m.inner+16,"KKP atlas mobile overflow: "+JSON.stringify(m));
 assert.equal(m.rows,12);
});
await browser.close();
fs.writeFileSync(path.join(outDir,"result.json"),JSON.stringify(report,null,2)+"\n");
console.log("Browser smoke:",report.tests.filter(x=>x.status==="pass").length,"passed /",report.tests.length,"total");
if(report.tests.some(x=>x.status==="fail"))process.exitCode=1;
