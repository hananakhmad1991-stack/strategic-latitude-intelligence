import{test}from"node:test";import assert from"node:assert/strict";import{readFileSync,readdirSync}from"node:fs";
const load=x=>readFileSync(new URL("../"+x,import.meta.url),"utf8");
const nav=load("js/sli-navigation.js"),page=load("sli-source-viewer.html"),policy=JSON.parse(load("data/sli-public-policy-evaluation-2026.json"));
test("No raw JSON from source anchors; real original PDFs stay distinguishable",()=>{
 assert.match(nav,/function sliSourceViewerHref/);assert.match(nav,/sli-source-viewer\.html\?dataset=/);
 assert.match(nav,/a\.hasAttribute\("download"\)/);assert.match(nav,/MutationObserver/);
 assert.match(nav,/Buka rujukan dokumen/);assert.match(page,/PDF asli dari penerbit/);
 assert.match(page,/\.json/);assert.match(page,/source notes|hasil digitalisasi|hasil digital/i);
});
test("Policy visible references use official publication links",()=>{
 for(const id of ["pln_ruptl_excerpt","pln_statistics_2024","law_graph"]){
 const item=policy.methodology.source_catalog.find(x=>x.id===id);assert.ok(item);
 assert.ok(!item.url.endsWith(".json"),"Raw JSON in source UI: "+id)
 }
 assert.ok(policy.methodology.source_catalog.find(x=>x.id==="pln_statistics_2024").url.endsWith(".pdf"));
});
test("Every dashboard loads shared source routing and source viewer is listed as a normal page",()=>{
 const pages=readdirSync(new URL("../",import.meta.url)).filter(x=>x.endsWith(".html"));
 assert.ok(pages.length>=36);
 for(const p of pages){
 const source=load(p);
 for(const t of ["js/sli-navigation.js","css/sli-navigation.css","js/sli-shared-appendix.js","js/sli-live-data.js"])assert.ok(source.includes(t),p+" missing "+t);
 }
});
