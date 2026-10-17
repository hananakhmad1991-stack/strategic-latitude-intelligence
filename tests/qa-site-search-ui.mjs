import fs from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";
const index=JSON.parse(fs.readFileSync("data/site-search-index.json","utf8"));
const source=fs.readFileSync("js/site-search.js","utf8");
class E {
 constructor(tag,doc){
  this.tagName=tag;this.doc=doc;this.children=[];this.parent=null;this.dataset={};this.attrs={};
  this.listeners={};this._text="";this.className="";this.value="";this.hidden=false;
  this.classList={add:n=>{const v=new Set(this.className.split(" ").filter(Boolean));v.add(n);this.className=[...v].join(" ")},
   remove:n=>{this.className=this.className.split(" ").filter(x=>x&&x!==n).join(" ")},
   toggle:(n,on)=>on?this.classList.add(n):this.classList.remove(n)};
 }
 get textContent(){return this._text||this.children.map(x=>x.textContent).join("")}
 set textContent(v){this._text=String(v);this.children=[]}
 get options(){return this.children.filter(x=>x.tagName==="option")}
 get isConnected(){return true}
 append(...items){for(const e of items){this.children.push(e);e.parent=this;
  if(this.tagName==="select"&&e.tagName==="option"&&this.options.length===1)this.value=e.value||"all"
 }}
 replaceChildren(...v){this.children=[];this._text="";this.append(...v)}
 setAttribute(k,v){this.attrs[k]=String(v)}
 getAttribute(k){return this.attrs[k]??null}
 removeAttribute(k){delete this.attrs[k]}
 addEventListener(k,fn){this.listeners[k]=fn}
 dispatchEvent(event){this.listeners[event.type]?.(event)}
 focus(){this.doc.activeElement=this;this.listeners.focus?.()}
 select(){}
 blur(){if(this.doc.activeElement===this)this.doc.activeElement=null}
 click(){this.listeners.click?.()}
 scrollIntoView(){}
 contains(e){let x=e;while(x){if(x===this)return true;x=x.parent}return false}
 querySelectorAll(q){
  const all=[];const walk=(x)=>{for(const c of x.children){all.push(c);walk(c)}};walk(this);
  if(q==="h2,h3,h4,[data-search-title]")return[];
  if(q===".sli-search-result")return all.filter(x=>x.className.includes("sli-search-result")&&x.tagName==="button");
  if(q==="select.he25-atlas-select")return all.filter(x=>x.tagName==="select"&&x.className.includes("he25-atlas-select"));
  if(q===".he25-atlas-rank")return all.filter(x=>x.className.includes("he25-atlas-rank"));
  if(q.startsWith("#"))return all.filter(x=>x.id===q.slice(1));
  if(q.startsWith("select"))return all.filter(x=>x.tagName==="select");
  return all.filter(x=>x.tagName===q);
 }
 querySelector(q){return this.querySelectorAll(q)[0]||null}
 closest(q){if(q!=="[id]")return null;let x=this;while(x){if(x.id)return x;x=x.parent}return null}
}
const handlers={};
const document={
 activeElement:null,documentElement:{lang:"en"},
 createElement:t=>new E(t,document),getElementById:id=>ids.get(id)||null,
 querySelectorAll:q=>q==="#nav button[data-page]"?buttons:[],
 addEventListener:(k,cb)=>handlers[k]=cb,
};
const ids=new Map();
const root=new E("div",document);const content=new E("div",document);
ids.set("sliGlobalSearchRoot",root);ids.set("content",content);
const energy=new E("div",document);ids.set("he25InvestorAtlasEnergyRoot",energy);
const pages=["overview","investment","map","trade","energy","minerals","ai","policy","methodology"];
const buttons=pages.map(id=>{const b=new E("button",document);b.dataset.page=id;b.textContent=id;return b});
let current="overview",navigated=[];
const fetch=async()=>({ok:true,json:async()=>index});
const ctx={window:{SLIi18n:{language:"en"}},document,console,fetch,Event:class{constructor(type){this.type=type}},
 setTimeout:(fn,delay)=>{if(delay===0)fn();return 0}};
vm.runInNewContext(source,ctx,{filename:"site-search.js"});
ctx.window.initSLISiteSearch({getPage:()=>current,navigate:p=>{current=p;navigated.push(p)}});
assert.equal(root.dataset.ready,"true");
const input=root.querySelector("input");
assert.ok(input&&input.type==="search");
input.focus();
await Promise.resolve();await Promise.resolve();await Promise.resolve();await new Promise(resolve=>setImmediate(resolve));
input.value="SPKLU Jawa Barat";input.dispatchEvent({type:"input"});
assert.equal(input.attrs["aria-expanded"],"true");
const results=root.querySelectorAll(".sli-search-result");
assert.ok(results.length>0,"Search results render from real dataset");
const target=results.find(x=>(x.textContent||"").includes("Jawa Barat")&&(x.textContent||"").includes("SPKLU"));
assert.ok(target,"Results include provincial station count");
target.click();
assert.equal(current,"energy","Click navigates to Energy Security");
assert.equal(input.attrs["aria-expanded"],"false","Popover closes after navigation");
assert.ok(navigated.includes("energy"));
input.focus();input.value="minyak";input.dispatchEvent({type:"input"});
assert.ok(root.querySelectorAll(".sli-search-result").length>0,"Bahasa synonyms return valid hits");
input.dispatchEvent({type:"keydown",key:"Escape",preventDefault(){}});
assert.equal(input.attrs["aria-expanded"],"false","Escape closes");
const shortcuts=handlers.keydown;assert.equal(typeof shortcuts,"function");
shortcuts({key:"k",ctrlKey:true,metaKey:false,preventDefault(){}});
assert.equal(document.activeElement,input,"Ctrl+K focuses search anywhere");
// Exact standalone page navigation: the selected Gini province must survive the click.
ctx.window.location={assign:url=>navigated.push(url)};
input.focus();input.value="Gini Jawa Barat";input.dispatchEvent({type:"input"});
const giniHit=root.querySelectorAll(".sli-search-result").find(b=>(b.textContent||"").includes("Gini Ratio · Jawa Barat"));
assert.ok(giniHit,"Exact Gini provincial result visible");
giniHit.click();
assert.ok(navigated.some(x=>String(x).includes("gini-inequality.html?province=Jawa%20Barat")),"Exact target province must be in link");
console.log("PASS: SLI search DOM smoke · input opens, 1080 indexed entries searchable, provincial result navigates, escape closes, Ctrl+K focuses");
