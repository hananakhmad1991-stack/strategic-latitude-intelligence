import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
const rd=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const nav=rd("js/sli-navigation.js"),css=rd("css/sli-navigation.css"),home=rd("index.html");
test("Shared SLI header preserves original monogram, live pages and grouped module discovery",()=>{
 assert.match(nav,/function renderPlatformMast\(\)/);
 assert.match(nav,/sli-platform-monogram','SLI'/);
 for(const url of ["./index.html#home","./index.html#overview","./provincial-intelligence.html","./sli-research-ai.html"])assert.ok(nav.includes(url),url);
 assert.match(nav,/sli-platform-sector-menu/);
 assert.match(nav,/for\(const group of groups\)/);
 assert.match(nav,/renderPlatformMast\(\);/);
});
test("Home and Research AI retain specialized headers, detailed SPA hides only legacy sidebar",()=>{
 assert.match(nav,/path!=='sli-research-ai\.html'/);
 assert.match(nav,/sli-home-active/);
 assert.match(css,/\.layout>\.sidebar\{display:none!important\}/);
 assert.match(css,/\.sli-dashboard-unified \.layout>\.main/);
 assert.match(css,/\.sli-platform-mast\[hidden\]\{display:none!important\}/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(home,/function overview\(\)/);
 assert.match(home,/function homePortal\(\)/);
});
test("All public dashboards load one shared navigation and source features stay in place",()=>{
 const pages=readdirSync(new URL("../",import.meta.url)).filter(n=>n.endsWith(".html"));
 assert.ok(pages.length>=35);
 for(const page of pages){
  const s=rd(page);
  assert.equal(s.split("js/sli-navigation.js").length-1,1,page+" shared router");
  assert.equal(s.split("css/sli-navigation.css").length-1,1,page+" shared stylesheet");
 }
 const evidence=rd("sli-research-ai.html");
 assert.match(evidence,/sli-research-brand\.css/);
 assert.match(evidence,/id="raAssistantForm"/);
 assert.match(evidence,/id="raSourcesPanel"/);
 assert.match(evidence,/id="raExport"/);
});
