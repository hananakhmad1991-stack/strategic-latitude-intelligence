import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const html=read("sli-research-ai.html");
const client=read("js/sli-research-assistant.js");
const style=read("css/sli-research-brand.css");
test("SLI Research AI shares the minimal homepage monogram, navigation and Navy–Gold colors",()=>{
 assert.match(html,/<span class="sli-ra-brand-monogram" aria-hidden="true">SLI<\/span>/);
 assert.match(html,/<strong>STRATEGIC LATITUDE<\/strong><small>INTELLIGENCE<\/small>/);
 for(const target of ["./index.html#home","./index.html#sliPortalSectors","./provincial-intelligence.html"])
  assert.ok(html.includes('href="'+target+'"'),"Missing navigation "+target);
 assert.ok(!html.includes('href="./index.html#overview"'),"Legacy overview navigation must stay removed");
 assert.match(html,/<a href="\.\/sli-research-ai\.html" aria-current="page" title="DERGUBA AI · SLI Research Intelligence">DERGUBA AI<\/a>/);
 assert.match(html,/css\/sli-research-brand\.css/);
 assert.match(html,/class="sli-research-brand"/);
 assert.match(style,/\.sli-ra-primary-nav/);
 assert.match(style,/#d7b678/);
 assert.match(style,/#091625/);
 assert.match(style,/\.sli-ra-chart-bar\{background:#d7b678\}/);
 assert.match(style,/body\.sli-research-brand \.sli-universal-nav\{display:none!important\}/);
 assert.match(style,/@media\(max-width:650px\)/);
});
test("Language uses two explicit controls and Research AI core features remain protected",()=>{
 assert.match(html,/data-ra-lang="en"/);
 assert.match(html,/data-ra-lang="id"/);
 assert.match(client,/function setResearchLanguage\(language\)/);
 assert.match(client,/button\.setAttribute\("aria-pressed",String\(active\)\)/);
 assert.match(client,/x-sli-owner-test-token/);
 assert.match(client,/window\.SLIResearchVisuals\?\.renderCharts/);
 assert.match(client,/renderSources\(payload\.sources,payload\.answer,state\.lastResult\.charts\)/);
 assert.match(html,/id="raSourcesPanel"/);
 assert.match(html,/id="raExport"/);
 assert.match(html,/id="raOwnerToken"/);
 assert.match(html,/type="password"/);
 assert.ok(!html.includes("OPENAI_API_KEY"));
 assert.ok(!client.includes("localStorage.setItem")&&!client.includes("sessionStorage.setItem"));
});
test("Owner Test status is truthful; premium access remains gated and corpus preview is distinguished",()=>{
 assert.match(html,/Memeriksa status layanan Research AI/);
 assert.match(html,/Mode uji generatif terbatas/);
 assert.match(html,/Evidence Preview menyediakan analisis deterministik/);
 assert.match(html,/terpisah dari Research AI generatif/);
 const config=JSON.parse(read("data/sli-research-assistant-config.json"));
 assert.equal(config.api_enabled,false);
 assert.equal(config.login_enabled,false);
 assert.equal(config.owner_test.enabled,true);
});
