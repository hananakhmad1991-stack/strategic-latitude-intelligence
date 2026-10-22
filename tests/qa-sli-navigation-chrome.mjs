import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const css=read("css/sli-navigation.css"),js=read("js/sli-navigation.js");
const pages=readdirSync(new URL("../",import.meta.url)).filter(p=>p.endsWith(".html")&&p!=="sli-user-intelligence-qa.html").sort();

test("All SLI HTML pages have early anti-FOUC protection and supported versioned shared chrome",()=>{
 assert.ok(pages.length>=37);
 for(const p of pages){
  const source=read(p);
  assert.match(source,/SLI chrome prepaint/,"No head prepaint: "+p);
  const head=source.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  assert.ok(head&&head.includes("document.documentElement.classList.add('sli-chrome-pending')"),"Prepaint must be in HEAD: "+p);
  assert.match(head,/window\.addEventListener\('load'/,"No loading fallback: "+p);
  assert.match(head,/sli-navigation\.css\?v=20261023-expert-services1/,"Stale shared CSS: "+p);
  assert.match(head,/var pref=localStorage\.getItem\(\x27sli-ui-language\x27\)/,"Early locale preference missing: "+p);
  assert.match(source,/sli-navigation\.js\?v=20261023-expert-services1/,"Stale EN\/ID language runtime: "+p);
  assert.match(source,/sli-navigation\.js\?v=20261023-expert-services1/,"Stale shared JS: "+p);
 }
});

test("Explore Data popover is viewport-centered, scrollable and not anchored outside header",()=>{
 assert.match(css,/\.sli-platform-sector-menu\{position:fixed!important/);
 assert.match(css,/left:50%!important/);
 assert.match(css,/transform:translateX\(-50%\)!important/);
 assert.match(css,/width:min\(1020px,calc\(100vw - 36px\)\)!important/);
 assert.match(css,/max-height:min\(76dvh,calc\(100dvh - 104px\)\)!important/);
 assert.match(css,/scrollbar-width:thin/);
 assert.match(css,/@media\(max-width:1090px\)/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.doesNotMatch(css,/\.sli-platform-sector-menu\{position:absolute/);
 assert.doesNotMatch(css,/right:-80px/);
 assert.match(js,/document\.addEventListener\('pointerdown',closeSectorMenu\)/);
 assert.match(js,/if\(event\.key==='Escape'\)/);
 assert.match(js,/summary\.setAttribute\('aria-expanded',explorer\.open\?'true':'false'\)/);
});

test("The new mast mounts before pending chrome is released; the original portal remains available",()=>{
 assert.match(js,/try\{renderBar\(\);renderGuide\(\)\}/);
 assert.match(js,/finally\{document\.documentElement\.classList\.remove\('sli-chrome-pending'\)\}/);
 assert.match(css,/html\.sli-chrome-pending body > \.layout/);
 assert.match(css,/html\.sli-chrome-pending body::before/);
 assert.match(js,/function dashboardPage\(\)/);
 assert.match(js,/mast\.hidden=false;mast\.replaceChildren\(\)/);
 assert.match(read("index.html"),/selectDashboard\(pagesFromURL\(\)\|\|'home'\)/);
 assert.match(read("css/sli-home-portal.css"),/body\.sli-home-active \.layout>\.sidebar\{display:none!important\}/);
});


test("Sticky dashboard inspectors and anchored sections respect the measured masthead",()=>{
 assert.match(js,/function syncPlatformMastOffset\(\)/);
 assert.match(js,/new ResizeObserver\(syncPlatformMastOffset\)/);
 assert.match(js,/style\.setProperty\('--sli-mast-offset'/);
 assert.match(css,/scroll-padding-top:calc\(var\(--sli-mast-offset/);
});
