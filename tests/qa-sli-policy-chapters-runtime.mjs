import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const script=read("js/sli-policy-chapter-insights.js");
const paths=[
 "data/sli-policy-regulatory-graph-2026.json",
 "data/sli-public-policy-evaluation-2026.json",
 "data/sli-sector-regulatory-ria-deepdives.json",
 "data/regulatory-monitor.json"
];
const fixtures=new Map(paths.map(p=>[p,JSON.parse(read(p))]));
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.parentNode=null;this._text="";this.className="";this.id="";this.style={};this.href="";}
 set textContent(value){this._text=String(value);for(const c of this.children)c.parentNode=null;this.children=[]}
 get textContent(){return this._text+this.children.map(x=>x.textContent).join(" ")}
 append(...nodes){for(const node of nodes){if(node.parentNode)node.parentNode.children=node.parentNode.children.filter(x=>x!==node);node.parentNode=this;this.children.push(node)}}
 insertBefore(node,reference){if(node.parentNode)node.parentNode.children=node.parentNode.children.filter(x=>x!==node);const at=this.children.indexOf(reference);node.parentNode=this;this.children.splice(at<0?this.children.length:at,0,node)}
 remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null}}
 querySelector(selector){
  const cls=selector.startsWith(".")?selector.slice(1):null;
  const find=x=>{
   for(const c of x.children){
    if(cls&&c.className.split(/\s+/).includes(cls))return c;
    const nested=find(c);if(nested)return nested;
   }
   return null;
  };return find(this);
 }
}
test("Policy 01-05 render live source-led analysis instead of empty or generic chapters",async()=>{
 const sections={};
 for(const id of ["01","02","03","04","05"]){
  const section=new Element("section");section.id="sli-chapter-"+id;
  const baseline=new Element("div");baseline.className="sli-research-grid";baseline.append(new Element("article"));section.append(baseline);sections[section.id]=section;
 }
 const document={createElement:tag=>new Element(tag),getElementById:id=>sections[id]||null};
 const fetch=async p=>({ok:fixtures.has(p),status:fixtures.has(p)?200:404,json:async()=>fixtures.get(p)});
 const window={};const errors=[];
 vm.runInNewContext(script,{window,document,fetch,console:{error:e=>errors.push(String(e))},Intl});
 await window.initSLIPolicyInsights();
 assert.deepEqual(errors,[]);
 const minimums={"01":1800,"02":1400,"03":2200,"04":900,"05":2200};
 for(const id of Object.keys(minimums)){
  const section=sections["sli-chapter-"+id],enhanced=section.querySelector(".sli-policy-insight");
  assert.ok(enhanced,"Missing actual content for chapter "+id);
  assert.ok(enhanced.textContent.length>minimums[id],"Generic or insufficient policy analysis in chapter "+id);
  const archived=section.querySelector(".sli-policy-baseline-details");
  assert.ok(archived?.children.some(x=>x.tagName==="summary"),"Old definitions should remain accessible in chapter "+id);
 }
 const text=Object.values(sections).map(s=>s.textContent).join(" ");
 for(const term of ["PP 28/2025","PP 40/2025","Risk transmission","69,512 MW","Conclusions & strategic recommendations","Not verified"]){
  assert.ok(text.includes(term),"Missing sourced output: "+term);
 }
 assert.ok(sections["sli-chapter-01"].querySelector(".sli-policy-status-chart"));
 assert.ok(sections["sli-chapter-04"].querySelector(".sli-policy-table-wrap"));
});
