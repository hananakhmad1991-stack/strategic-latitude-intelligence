import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const html=read("index.html"),style=read("css/sli-home-portal.css");
test("SLI portal is the sole entry point and legacy overview routes migrate safely",()=>{
 assert.match(html,/const pages=\{home:\[/);
 assert.match(html,/selectDashboard\(pagesFromURL\(\)\|\|'home'\)/);
 assert.match(html,/page==='home'\?homePortal\(\):page==='about'\?/);
 assert.doesNotMatch(html,/function overview\(\)\{return/);
 assert.match(html,/function homePortal\(\)\{return/);
 assert.match(html,/data-page="home"/);
 assert.doesNotMatch(html,/data-page="overview"/);
 assert.doesNotMatch(html,/href="#overview"/);
 assert.match(html,/if\(hash===\x27overview\x27\)return \x27home\x27/);
});
test("Portfolio homepage links to research and six functioning sector portals, with dedicated geopolitical chapter",()=>{
 for(const ref of ["#energy","#investment","#minerals","#policy","#geopolitics","indonesia-macroeconomic-intelligence.html","ai-intelligence-hub.html","sli-research-ai.html","provincial-intelligence.html"])
  assert.ok(html.includes('href="'+ref+'"')||html.includes('href="./'+ref+'"'),ref);
 assert.match(html,/data-sli-home-search/);
 assert.match(html,/sliGlobalSearchInput/);
 assert.match(html,/getPage:\(\)=>selectedPage\|\|'home'/);
 assert.match(html,/LIMITED TEST|Owner Test remains restricted/);
});
test("Policy and Geopolitics have separate homepage cards, distinct destinations, and independent dashboard content",()=>{
 assert.ok(html.includes('<a href="#policy" class="sli-portal-topic-main"'));
 assert.ok(html.includes('<strong>Policy &amp; Regulation</strong>'));
 assert.ok(html.includes('<a href="#geopolitics" class="sli-portal-topic-main"'));
 assert.ok(html.includes('<strong>Geopolitical Intelligence</strong>'));
 assert.ok(!html.includes('<strong>Policy &amp; Geopolitics</strong>'));
 assert.ok(html.includes('data-page="policy"'));
 assert.ok(html.includes('data-page="geopolitics"'));
 assert.ok(html.includes("page==='geopolitics'?'<div id=\"sliGeoChapterRoot\""));
 assert.ok(html.includes("['minerals','ai','policy'].includes(page)"));
 assert.ok(html.includes('window.initSLIResearch(page)'));
 assert.ok(html.includes("if(page==='policy')return"));
 assert.ok(style.includes('grid-template-columns:repeat(4,minmax(0,1fr))'));
 assert.ok(style.includes('@media(max-width:1220px)'));
});

test("Homepage shares SLI original navy/gold identity, stays mobile responsive, and Research AI retains separate visual system",()=>{
 assert.match(html,/css\/sli-home-portal\.css/);
 assert.ok(existsSync(new URL("../css/sli-home-portal.css",import.meta.url)));
 assert.match(style,/\.sli-portal-hero/);
 assert.match(style,/#d7b678/);
 assert.match(html,/id="sli-home-portal-embedded-css"/);
 assert.ok(html.includes(style),"Embedded fallback CSS matches standalone portal CSS");
 assert.match(style,/body\.sli-home-active \.sli-universal-nav\{display:none!important\}/);
 assert.match(style,/@media\(max-width:460px\)/);
 const assistant=read("sli-research-ai.html");
 assert.ok(!assistant.includes("sli-home-portal.css"));
 const assistantCSS=read("css/sli-research-assistant.css");
 assert.match(assistantCSS,/--rai-ink/);
});

test("National KPI cards read observed values, source URLs and reporting periods from approved macro register",()=>{
 const source=read("js/sli-home-portal.js");
 const macro=JSON.parse(read("data/sli-macro-indonesia-2026.json"));
 assert.match(html,/id="sliPortalMetrics"/);
 assert.match(html,/initSLIPortalMetrics/);
 assert.match(source,/fetch\("\.\/data\/sli-macro-indonesia-2026\.json"/);
 assert.match(source,/source\.publisher/);
 assert.match(source,/m\.period/);
 assert.match(source,/source\?\.url/);
 for(const id of ["real_gdp_growth","inflation_yoy","bi_policy_rate","usd_idr_jisdor"]){
  const row=macro.metrics.find(x=>x.id===id);
  assert.ok(row&&Number.isFinite(row.value)&&row.period&&macro.sources[row.source_id]?.url,"Missing curated "+id);
 }
});

test("Home mode reuses the unified Explore Data masthead without duplicate homepage links",()=>{
 const nav=read("js/sli-navigation.js");
 assert.doesNotMatch(html,/<header class="sli-portal-mast"/);
 assert.doesNotMatch(html,/class="sli-portal-topnav"/);
 assert.match(nav,/function renderPlatformMast\(\)/);
 assert.match(nav,/const explorer=node\('details','sli-platform-explorer'\)/);
 assert.match(nav,/classList.toggle\('sli-dashboard-unified',use&&!homepage\)/);
 assert.match(html,/data-sli-locale="en"/);
 assert.match(html,/data-sli-locale="id"/);
 assert.match(html,/id="sliPortalSectors"/);
 assert.match(style,/body\.sli-home-active \.layout>\.sidebar\{display:none!important\}/);
 assert.match(style,/body\.sli-home-active \.main>\.sli-data-guide\{display:none!important\}/);
 assert.match(style,/body\.sli-home-active \.main>\.top \.sli-top-actions/);
 assert.match(style,/@media\(max-width:650px\)/);
 // Reader disclosures and navigation remain accessible on Home and each sector dashboard.
 assert.match(html,/id="sliDataGuide"/);
 assert.match(html,/id="nav"/);
 assert.match(html,/class="sidebar"/);
});

test("Unified primary SLI masthead retains original navy/gold typographic identity",()=>{
 const nav=read("js/sli-navigation.js"),css=read("css/sli-navigation.css");
 assert.match(nav,/node\('span','sli-platform-monogram','SLI'\)/);
 assert.match(nav,/node\('strong','', 'STRATEGIC LATITUDE'\)/);
 assert.match(nav,/node\('small','', 'INTELLIGENCE'\)/);
 assert.match(css,/\.sli-platform-monogram\{/);
 assert.match(css,/border-right:1px solid #5b6470/);
 assert.ok(html.includes(style),"Home page embedded styles must match the latest standalone CSS");
});

test("Public SLI release is task-first, bilingual and avoids implying an expert panel or public Research AI access",()=>{
 assert.match(html,/Understand Indonesia/);
 assert.match(html,/Find the expertise to act/);
 assert.match(html,/Pahami Indonesia/);
 assert.match(html,/Temukan pakar untuk bertindak/);
 for(const label of ['01 · INTELLIGENCE','02 · DERGUBA AI','03 · EXPERT CONNECT'])assert.ok(html.includes(label),label);
 assert.match(html,/no pre-enrolled expert panel/);
 assert.match(html,/owner-only pilot/);
 assert.match(html,/editable inquiry/);
 assert.ok(html.includes('href="./sli-expert-connect.html"'));
 assert.equal((html.match(/class="sli-service-card(?: sli-service-expert)?"/g)||[]).length,3);
 assert.match(style,/@media\(max-width:850px\)/);
 assert.ok(html.includes(style),"Embedded fallback must exactly match current CSS");
});
