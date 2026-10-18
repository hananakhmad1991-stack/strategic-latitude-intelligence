import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const html=read("index.html"),style=read("css/sli-home-portal.css");
test("SLI portal is the default view and the original comprehensive overview is preserved",()=>{
 assert.match(html,/const pages=\{home:\[/);
 assert.match(html,/selectDashboard\(pagesFromURL\(\)\|\|'home'\)/);
 assert.match(html,/page==='home'\?homePortal\(\):page==='overview'\?/);
 assert.match(html,/function overview\(\)\{return/);
 assert.match(html,/function homePortal\(\)\{return/);
 assert.match(html,/data-page="home"/);
 assert.match(html,/data-page="overview"/);
 assert.match(html,/href="#overview"/);
});
test("Portfolio homepage links to research and six functioning sector portals",()=>{
 for(const ref of ["#energy","#investment","#minerals","#policy","indonesia-macroeconomic-intelligence.html","ai-intelligence-hub.html","sli-research-ai.html","provincial-intelligence.html"])
  assert.ok(html.includes('href="'+ref+'"')||html.includes('href="./'+ref+'"'),ref);
 assert.match(html,/data-sli-home-search/);
 assert.match(html,/sliGlobalSearchInput/);
 assert.match(html,/selectedPage==='home'\?'overview'/);
 assert.match(html,/LIMITED TEST|Owner Test remains restricted/);
});
test("Homepage shares SLI original navy/gold identity, stays mobile responsive, and Research AI retains separate visual system",()=>{
 assert.match(html,/css\/sli-home-portal\.css/);
 assert.ok(existsSync(new URL("../css/sli-home-portal.css",import.meta.url)));
 assert.match(style,/\.sli-portal-hero/);
 assert.match(style,/#d7b678/);
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
 assert.match(source,/source\.url/);
 for(const id of ["real_gdp_growth","inflation_yoy","bi_policy_rate","usd_idr_jisdor"]){
  const row=macro.metrics.find(x=>x.id===id);
  assert.ok(row&&Number.isFinite(row.value)&&row.period&&macro.sources[row.source_id]?.url,"Missing curated "+id);
 }
});
