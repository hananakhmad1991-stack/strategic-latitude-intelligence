import{test}from"node:test";import assert from"node:assert/strict";import{readFileSync,readdirSync}from"node:fs";
const load=x=>readFileSync(new URL("../"+x,import.meta.url),"utf8");
const nav=load("js/sli-navigation.js"),page=load("sli-source-viewer.html"),policy=JSON.parse(load("data/sli-public-policy-evaluation-2026.json"));
test("No raw JSON from source anchors; real original PDFs stay distinguishable",()=>{
 assert.match(nav,/function sliSourceViewerHref/);assert.match(nav,/sli-source-viewer\.html\?dataset=/);
 assert.match(nav,/a\.removeAttribute\("download"\)/);assert.match(nav,/MutationObserver/);
 assert.match(nav,/Sumber & metodologi SLI/);assert.match(page,/PDF asli dari penerbit/);
 assert.match(page,/Sumber &amp; Metodologi SLI/);
 assert.ok(!page.includes('id="raw"')&&!page.includes('raw.download'),"Source viewer should never offer a raw JSON download");
 assert.match(load("js/site-search.js"),/sli-source-viewer\.html\?dataset=/);
 assert.ok(!load("js/site-search.js").includes("Lihat data sumber JSON"),"Search card should cite sources, not raw JSON");
 assert.match(load("js/sli-secondary-evidence.js"),/Sumber berita & metodologi/);
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

test("All internal static HTML anchor targets exist and PDF-labeled links never point to JSON",()=>{
 const known=new Set(readdirSync(new URL("../",import.meta.url)).filter(x=>x.endsWith(".html")));
 const data=new Set(readdirSync(new URL("../data/",import.meta.url)));
 const pages=[...known].sort();
 for(const filename of pages){
  const html=load(filename);
  const anchors=[...html.matchAll(/<a\b[^>]{0,850}href=["']([^"']+)["'][^>]*>([\s\S]{0,450}?)<\/a>/gi)];
  for(const [,href,body] of anchors){
   const title=body.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
   assert.ok(!(/\.json(?:[?#]|$)/i.test(href)&&/\bPDF\b/i.test(title)),filename+" claims a PDF but links to JSON: "+href);
   assert.ok(!/^\.?\/?data\/[a-z0-9._-]+\.json(?:[?#]|$)/i.test(href),filename+" still exposes raw JSON anchor: "+href);
   if(!href.startsWith("./"))continue;
   const local=href.slice(2).split(/[?#]/)[0];
   if(local.endsWith(".html"))assert.ok(known.has(local),filename+" broken HTML route: "+href);
   else if(local.startsWith("data/")&&local.endsWith(".json"))assert.ok(data.has(local.slice(5)),filename+" missing dataset: "+href);
  }
 }
});

test("All SLI user-facing source routes keep machine-data links internal",()=>{
 const lab=load("intelligence-labs.html");
 assert.ok(!/\.download\s*=\s*['"][^'"]+\.json['"]/.test(lab),"Investor Labs must export CSV instead of JSON");
 assert.ok(lab.includes("Export scenario & assumptions CSV"));
 const regulatory=load("js/regulatory-monitor-dashboard.js");
 assert.ok(!regulatory.includes("Unduh snapshot audit JSON"),"Regulatory monitoring should link to sources");
 assert.ok(regulatory.includes("Sumber monitoring &amp; metodologi SLI"));
 for(const f of ["js/sli-navigation.js","js/site-search.js","js/regulatory-monitor-dashboard.js"]){
  const text=load(f);
  assert.ok(!/Lihat keterangan sumber & unduh JSON|Lihat data sumber JSON|Open indexed source JSON/i.test(text),f+" has legacy JSON UI label");
 }
});
