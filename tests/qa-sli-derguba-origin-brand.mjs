import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(name)=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const page=read("sli-research-ai.html");
const nav=read("js/sli-navigation.js");
const client=read("js/sli-research-assistant.js");
const style=read("css/sli-research-brand.css");
const map="https://maps.app.goo.gl/fXdQNEfTd9XYc38f6";

test("DERGUBA AI product branding retains the SLI parent company and Research AI entry point",()=>{
 assert.match(page,/<title>DERGUBA AI \| Research Intelligence by Strategic Latitude Intelligence<\/title>/);
 assert.match(page,/<h1>DERGUBA <em>AI<\/em>/);
 assert.match(page,/STRATEGIC LATITUDE/);
 assert.match(page,/sli-research-ai\.html" aria-current="page"[^>]*>DERGUBA AI<\/a>/);
 assert.ok(nav.includes("mastLink('./sli-research-ai.html','DERGUBA AI',path==='sli-research-ai.html')"),'DERGUBA must remain in the top-level quick links');
 assert.match(nav,/sli-platform-quicklinks/,'The research pair is pinned in the top masthead');
 assert.match(client,/DERGUBA AI · Owner Test/);
});
test("brand-origin Derepan link points to the user's exact Google Maps URL",()=>{
 assert.ok(page.includes('href="'+map+'"'));
 assert.equal(page.split('href="'+map+'"').length-1,1);
 assert.match(page,/class="sli-ra-derepan-map"[^>]+target="_blank" rel="noopener noreferrer"/);
 assert.match(page,/Dusun Derepan/);
 assert.match(page,/Desa Menoreh, Kecamatan Salaman, Kabupaten Magelang, Provinsi Jawa Tengah, Indonesia/);
 assert.match(page,/Menoreh Village, Salaman District, Magelang Regency, Central Java Province, Indonesia/);
});
test("DERGUBA research acronym, bilingual narrative and accessibility remain intact",()=>{
 for(const part of ["Data","Evidence","Research","Governance","Uncertainty","Business","Analytics"])
  assert.ok(page.includes(part),part);
 assert.match(page,/data-id="DARI DEREPAN · UNTUK DUNIA"/);
 assert.match(page,/data-en="BORN IN DEREPAN · BUILT FOR THE WORLD"/);
 assert.match(page,/data-id="Nama DERGUBA berakar dari komunitas dan keindahan pegunungan dengan banyak angkrem di"/);
 assert.match(page,/data-en="The name DERGUBA is rooted in its community and the beauty of mountains dotted with locally known angkrem in"/);
 assert.match(page,/aria-label="Buka lokasi Dusun Derepan/);
 assert.match(client,/document\.querySelectorAll\("\[data-id\]\[data-en\]"\)/);
 assert.match(style,/sli-ra-derepan-map:focus-visible/);
});
test("the core research request, owner access, Word and PDF and advanced lab are untouched",()=>{
 for(const name of ['id="raAssistantForm"','id="raPrompt"','id="raOwnerPanel"',
  'id="raWord"','id="raPdf"','id="raOpenDataLab"'])
  assert.ok(page.includes(name),name);
 assert.match(page,/src="\.\/js\/sli-research-assistant\.js/);
 assert.match(page,/src="\.\/js\/sli-analytical-workbench-ui\.mjs/);
 assert.match(page,/src="\.\/js\/sli-report-buttons\.mjs/);
 assert.match(client,/getExportData/);
});
