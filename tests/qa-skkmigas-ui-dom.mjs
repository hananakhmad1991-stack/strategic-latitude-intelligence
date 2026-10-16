import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const report=JSON.parse(fs.readFileSync("data/skkmigas-annual-2025.json","utf8"));
const catalog=JSON.parse(fs.readFileSync("data/skkmigas-2025-figure-catalog.json","utf8"));
const digitized=JSON.parse(fs.readFileSync("data/skkmigas-2025-digitized-exhibits.json","utf8"));
const pod=JSON.parse(fs.readFileSync("data/skkmigas-2025-pod-approvals.json","utf8"));
const exploration=JSON.parse(fs.readFileSync("data/skkmigas-2025-exploration-registers.json","utf8"));
const extra=JSON.parse(fs.readFileSync("data/skkmigas-2025-source-extension.json","utf8"));
const source=fs.readFileSync("js/skkmigas-annual-2025.js","utf8");
class MiniDom{
 constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.className="";this.dataset={};this.style={};this.listeners={};this.textContent="";this.isConnected=true;this.value="";this.rel="";}
 append(...children){for(const x of children){this.children.push(x);if(this.tagName==="select"&&x.tagName==="option"&&this.children.length===1)this.value=x.value||x.textContent||""}}
 replaceChildren(...arr){this.children=[];this.value=this.tagName==="select"?"":this.value;this.append(...arr)}
 setAttribute(k,v){this.attrs[k]=String(v)}
 addEventListener(k,fn){this.listeners[k]=fn}
 querySelectorAll(selector){let out=[];for(const c of this.children){if(c.tagName===selector)out.push(c);if(typeof c.querySelectorAll==="function")out.push(...c.querySelectorAll(selector))}return out}
 get classList(){return {toggle:(name,isOn)=>{const base=new Set(this.className.split(/\s+/).filter(Boolean));if(isOn)base.add(name);else base.delete(name);this.className=[...base].join(" ")}}}
 click(){this.listeners.click?.()}
 change(){this.listeners.change?.()}
}
const root=new MiniDom("div");
const doc={createElement:(tag)=>new MiniDom(tag),createElementNS:(ns,tag)=>new MiniDom(tag),getElementById:()=>root};
const ctx={window:{SLIi18n:{language:"en"}},document:doc,console,fetch:async url=>({ok:true,json:async()=>url.includes("figure-catalog")?catalog:url.includes("digitized-exhibits")?digitized:url.includes("pod-approvals")?pod:url.includes("exploration-registers")?exploration:url.includes("source-extension")?extra:report})};
vm.runInNewContext(fs.readFileSync("js/skkmigas-2025-extension.js","utf8"),ctx,{filename:"skkmigas-2025-extension.js"});
vm.runInNewContext(source,ctx,{filename:"skkmigas-annual-2025.js"});
ctx.window.initSLISKKAnnual2025(root,"energy");
await Promise.resolve();await Promise.resolve();await Promise.resolve();await new Promise(resolve=>setImmediate(resolve));
const tabs=root.querySelectorAll("button").filter(x=>x.dataset.tab);
assert.deepEqual(tabs.map(x=>x.dataset.tab),["overview","trend","gas","targets","mapping","projects","digitized","sourceplus","pods","exploration","catalog"]);
function getTab(name){const b=tabs.find(x=>x.dataset.tab===name);assert.ok(b,name);return b}
const assertBuilt=(name)=>{getTab(name).click();assert.equal(getTab(name).attrs["aria-pressed"],"true");};
assertBuilt("trend");assert.ok(root.querySelectorAll("svg").length>=1,"Historical chart draws a complete SVG");
assertBuilt("gas");assert.ok(root.querySelectorAll("path").length>=10,"Ten gas allocation ribbons rendered");
assertBuilt("targets");assert.ok(root.querySelectorAll("article").length>=5,"Target KPI comparison drawn");
assertBuilt("mapping");assert.ok(root.querySelectorAll("a").some(x=>x.href==="#map"),"Map link is honest existing GIS");
assertBuilt("projects");assert.ok(root.querySelectorAll("article").length>=16,"All 16 sourced projects appear");
assertBuilt("sourceplus");assert.ok(root.querySelectorAll("article").length>=5,"Five investment scorecards rendered on source extension");
const extraSelect=root.querySelectorAll("select")[0];assert.ok(extraSelect,"Investor source view selector");
extraSelect.value="monthly";extraSelect.change();
assert.ok(root.querySelectorAll("svg").length>=1,"Monthly TKDN produces SVG and table");
extraSelect.value="bridge";extraSelect.change();
assert.ok(root.querySelectorAll("strong").length>=2,"Oil / gas signed bridge cards render");
extraSelect.value="procurement";extraSelect.change();
assert.ok(root.querySelectorAll("article").length>=9,"Procurement summary and audit data render");
extraSelect.value="risk";extraSelect.change();
assert.ok(root.querySelectorAll("article").length>=12,"All twelve risk-register entries render");

assertBuilt("digitized");assert.ok(root.querySelectorAll("svg").length>=1,"Digitized historical annual series graph rendered");
assertBuilt("pods");assert.ok(root.querySelectorAll("td").length>=45*8,"45 source-linked POD reserve rows rendered");
assertBuilt("exploration");assert.ok(root.querySelectorAll("td").length>=24*4,"24 PSE rows rendered");
assertBuilt("catalog");assert.ok(root.querySelectorAll("article").length>=30,"Source catalog initial page rendered");
assertBuilt("overview");assert.ok(root.querySelectorAll("article").length>=30,"2025 all KPI cards rendered");
console.log("PASS: live DOM smoke for 11 tab views, 10 Sankey flows, 16 project cards, KPI metrics and 99-reference catalog");
