/* Regression screening for cross-dashboard chrome, readable inspectors and ID homepage copy. */
import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Shared platform masthead provides live height for anchored sections and menus",()=>{
 const js=read("js/sli-navigation.js"),css=read("css/sli-navigation.css");
 assert.match(js,/function syncPlatformMastOffset\(\)/);
 assert.match(js,/ResizeObserver\(syncPlatformMastOffset\)/);
 assert.match(js,/--sli-mast-offset/);
 assert.match(css,/scroll-padding-top:calc\(var\(--sli-mast-offset/);
 assert.match(css,/body\.sli-dashboard-unified \.sli-platform-sector-menu\{/);
 assert.match(css,/top:calc\(var\(--sli-mast-offset/);
 assert.match(css,/max-height:max\(140px,calc\(100dvh - var\(--sli-mast-offset/);
});
test("Entity and corporate detail inspectors remain visible and independently scrollable",()=>{
 for(const [path,name] of [
  ["css/sli-entities.css",".sli-entity-dossier"],
  ["css/sli-corporate-groups.css",".sli-cg-dossier"],
  ["css/energy-oil-gas-stakeholders.css",".ogas-profile"]
 ]){
  const css=read(path),selector=name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  assert.match(css,new RegExp(selector+"\\{[^}]*top:calc\\(var\\(--sli-mast-offset"),path+": dynamic offset missing");
  assert.match(css,new RegExp(selector+"\\{[^}]*max-height:calc\\(100dvh"),path+": viewport limit missing");
  assert.match(css,new RegExp(selector+"\\{[^}]*overflow-y:auto"),path+": scroll missing");
 }
});
test("Homepage KPI translations update after changing locale without inventing metrics",()=>{
 const code=read("js/sli-home-portal.js");
 const html=read("index.html");
 const dictionary=read("js/i18n-dictionary.js");
 assert.match(code,/Pertumbuhan PDB riil/);
 assert.match(code,/Inflasi IHK tahunan/);
 assert.match(code,/Sumber & tanggal/);
 assert.match(code,/sli:languagechange/);
 assert.match(code,/fetch\("\.\/data\/sli-macro-indonesia-2026\.json"/);
 assert.match(html,/sli-home-portal\.js\?v=20261020-i18n-kpi1/);
 assert.ok(dictionary.includes("Data Library · BPS / IEA / PLN ↗"));
 assert.ok(dictionary.includes("Perpustakaan Data · BPS / IEA / PLN ↗"));
});
