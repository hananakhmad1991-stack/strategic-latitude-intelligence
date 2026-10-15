/* No-dependency smoke test for the EN/ID UI layer and official terminology. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const dict=fs.readFileSync("js/i18n-dictionary.js","utf8");
const runtime=fs.readFileSync("js/i18n.js","utf8");
const html=fs.readFileSync("index.html","utf8");
const css=fs.readFileSync("css/i18n.css","utf8");
new Function(dict);
new Function(runtime);
assert(html.includes('data-sli-locale="en"'));
assert(html.includes('data-sli-locale="id"'));
assert(html.indexOf('js/i18n-dictionary.js')<html.indexOf('js/i18n.js'));
assert(html.indexOf('js/i18n.js')<html.indexOf('js/energy-biofuels.js'));
assert(css.includes(".sli-lang-switch"));

let stored="id",saved=null,dispatched=[];
const button=(code)=>({dataset:{sliLocale:code},classList:{toggle(){}},setAttribute(){}});
const buttons=[button("en"),button("id")];
const doc={
 readyState:"loading",
 addEventListener(){},
 documentElement:{lang:"en"},
 querySelectorAll(){return buttons},
 getElementById(){return {textContent:""}},
 createTreeWalker(){return {nextNode(){return null}}},
 dispatchEvent(event){dispatched.push(event.type)},
 body:{nodeType:1,closest(){return null},hasAttribute(){return false},tagName:"BODY"}
};
const storage={getItem(){return stored},setItem(k,v){saved={k,v}}};
const make=new Function("window","document","localStorage","CustomEvent","NodeFilter",
 dict+"\n"+runtime+"\nreturn window.SLIi18n;");
const api=make({},doc,storage,class Event{constructor(type){this.type=type}},{SHOW_ELEMENT:1,SHOW_TEXT:4});
assert(api.dictionarySize>=430,"Translation coverage unexpectedly shrank");
assert.equal(api.language,"id","Persisted ID selection is respected");
assert.equal(api.translate("◈ Overview","id"),"◈ Ringkasan");
assert.equal(api.translate("Energy Security","id"),"Ketahanan Energi");
assert.equal(api.translate("Editorial & data standards","id"),"Standar Editorial & Data");
assert.equal(api.translate("Biofuel news & regulatory watch","id"),"Pantauan berita & regulasi biofuel");
assert.equal(api.translate("New & Renewable Energy (EBT/NRE)","en"),"New and Renewable Energy (NRE)");
assert.equal(api.translate("Ditjen EBTKE","en"),"Directorate General of New, Renewable Energy and Energy Conservation (NREEC)");
assert.equal(api.translate("ESDM EBTKE 2025 performance report","en"),"MEMR / NREEC 2025 performance report");
assert.equal(api.translate("EBTKE — 2025 realized","en"),"NRE/EC — 2025 realized");
assert.equal(api.translate("Jargas","en"),"household gas networks");
api.setLanguage("en");
assert.equal(api.language,"en");
assert.equal(doc.documentElement.lang,"en");
assert.deepEqual(saved,{k:"sli-ui-language",v:"en"});
assert(dispatched.includes("sli:languagechange"));
console.log("SLI i18n checks passed: "+api.dictionarySize+" curated entries; persistent bilingual navigation and NRE glossary.");
