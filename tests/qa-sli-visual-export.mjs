import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const nav=read("js/sli-navigation.js"),core=read("js/sli-visual-export.js"),formats=read("js/sli-visual-export-formats.js"),css=read("css/sli-visual-export.css");

async function loadFormats(){
 const window={};
 runInNewContext(formats,{window,TextEncoder,Blob,Uint8Array,Date,URL,atob,console},{filename:"sli-visual-export-formats.js"});
 return window.SLIVisualFormats;
}
test("Every SLI page inherits shared visual-export bootstrap without external chart libraries",()=>{
 assert.match(nav,/initSLIUniversalExport/);
 for(const path of ["sli-visual-export.js","sli-visual-export-formats.js","sli-visual-export.css"])assert.ok(nav.includes(path));
 assert.match(core,/MutationObserver/);
 assert.match(core,/register,registerInsight,export:exportVisual,refresh:queue/);
 assert.match(core,/sli_embed/);
 assert.match(core,/SLIVisualFormats\.save/);
 assert.match(core,/getData\(host,visual\)/);
 assert.match(core,/VISIBLE ELEMENTS ONLY — NOT full underlying numeric dataset/);
 assert.match(css,/content:"SLI"/);
 assert.match(css,/rgba\(151,162,177,.19\)/);
 assert.match(css,/sli-visual-export-toolbar/);
 assert.match(core,/function openVisualInsight\(event\)/);
 assert.match(core,/pointInsights\.set\(visual,provider\)/);
 assert.match(core,/document\.addEventListener\('click',openVisualInsight\)/);
 assert.match(core,/#sliMapRoot,#geo-commodity-timeline/);
 assert.match(core,/This visual observation alone cannot establish cause and effect/);
 assert.match(css,/\.sli-visual-insight-fields/);
 assert.match(css,/\.sli-visual-insight-selected/);
 assert.match(css,/\.sli-visual-insight-split/,"Selected visual observations have a shared two-column layout");
 assert.match(core,/split\.append\(inspector\)/,"Insight panel belongs beside its chart");
 assert.match(core,/host\.parentNode\.insertBefore\(split,host\)/,"Chart and inspector are wrapped together");
 assert.match(core,/split\.parentNode\.insertBefore\(host,split\)/,"Closing restores the original DOM");

 assert.match(core,/\["jpg","JPG"\]/);
 assert.match(core,/host\.insertBefore\(toolbar,host\.firstChild\)/);
 assert.match(core,/data-sli-export-external-controls/);
 assert.match(core,/sli:exportready/);
 const energy=read("js/energy-fundamentals.js");
 assert.match(energy,/data-sli-export-format/);
 assert.match(energy,/SLIVisualExport\.export\(svg,format,feedback\)/);
 assert.match(energy,/SLIVisualExport\?\.register\(svg,provider\)/);
 assert.match(energy,/sli:exportready/);
 assert.match(energy,/energy-fundamentals-historical-chart/);
 assert.ok(!energy.includes("Download CSV"),"Remove legacy CSV-only button");
 for(const format of ["csv","xlsx","png","jpg","pdf","embed"])assert.ok(energy.includes('["'+format+'",'),format+" action missing");

 const pages=["index.html","sli-research-ai.html","geopolitical-impact-assessment.html","pln-electricity-statistics.html","indonesia-macroeconomic-intelligence.html","sli-interactive-analytics.html","provincial-opportunity-engine.html","policy-regulatory-intelligence.html"];
 for(const page of pages)assert.match(read(page),/sli-navigation\.js/,page+" needs sitewide export bootstrap");
 assert.match(read("js/sli-geopolitical-timeline.js"),/SLIVisualExport\.register\(chart/);
 assert.equal((read("js/sli-geopolitical-timeline.js").match(/SLIVisualExport\.register\(sc/g)||[]).length,2);
});
test("CSV protects spreadsheet formula injection and discloses data provenance",async()=>{
 const format=await loadFormats();
 const blob=format.csv({headers:["Month","Value","Comment"],rows:[["2026-09",123.4,"=HYPERLINK(\"https://evil.example\")"],["2026-10",88,"+1+2"]],meta:{title:"SLI market risk",source:"World Bank",period:"2026-09"}});
 const text=await blob.text();
 const bytes=new Uint8Array(await blob.arrayBuffer());
 assert.deepEqual(Array.from(bytes.slice(0,3)),[0xef,0xbb,0xbf]);
 assert.match(text,/World Bank/);
 assert.match(text,/SLI market risk/);
 assert.match(text,/'=HYPERLINK/);
 assert.match(text,/'\+1\+2/);
 assert.match(text,/2026-09/);
});
test("XLSX is an actual zipped Office Open XML workbook, with Data and Sources sheets",async()=>{
 const format=await loadFormats();
 const blob=format.xlsx({headers:["Month","Price"],rows:[["2026-09",123.5],["2026-10","=2+2"]],meta:{title:"SLI Energy",source:"World Bank Pink Sheet",sourceUrl:"https://worldbank.org",completeness:"full observations"}});
 const bytes=new Uint8Array(await blob.arrayBuffer());
 const str=new TextDecoder().decode(bytes);
 assert.equal(String.fromCharCode(bytes[0],bytes[1]),"PK");
 assert.ok(str.includes("xl/workbook.xml"));
 assert.ok(str.includes("xl/worksheets/sheet1.xml"));
 assert.ok(str.includes("xl/worksheets/sheet2.xml"));
 assert.ok(str.includes("World Bank Pink Sheet"));
 assert.ok(str.includes("Sources &amp; Notes"));
 assert.ok(str.includes("<v>123.5</v>"));
 assert.ok(str.includes("<t xml:space=\"preserve\">=2+2</t>"),"Untrusted content must remain a string, never an Excel formula");
 assert.ok(str.includes("PK\u0005\u0006"),"ZIP central directory end must exist");
});
test("PDF emits binary PDF with embedded JPEG page, cross-ref table and EOF",async()=>{
 const format=await loadFormats();
 const bytes=Uint8Array.from([255,216,255,217]);
 const atob=x=>String.fromCharCode(...bytes);
 // Include a minimally structured JPEG byte stream; PDF test focuses on object framing and offsets.
 const pdf=format.pdf({width:500,height:300,toDataURL:()=>"data:image/jpeg;base64,/9j/2Q=="});
 const text=new TextDecoder("latin1").decode(new Uint8Array(await pdf.arrayBuffer()));
 assert.ok(text.startsWith("%PDF-1.4"));
 assert.ok(text.includes("/Subtype /Image"));
 assert.ok(text.includes("/DCTDecode"));
 assert.ok(text.includes("xref\n0 6"));
 assert.ok(text.trimEnd().endsWith("%%EOF"));
});


test("Energy Fundamentals chart actually renders six working export controls with verified oil lifting values",async()=>{
 class FakeNode{
  constructor(tag){this.tag=tag;this.children=[];this.id="";this.className="";this.textContent="";this.style={};this.attrs={};this.listeners=new Map();this.value="";this.isConnected=true}
  append(...children){this.children.push(...children)}
  appendChild(child){this.children.push(child);return child}
  replaceChildren(...children){this.children=children}
  setAttribute(k,v){this.attrs[k]=String(v)}
  addEventListener(k,fn){this.listeners.set(k,fn)}
 }
 const walk=(x)=>x&&typeof x==="object"?[x,...(x.children||[]).flatMap(walk)]:[];
 const root=new FakeNode("div");root.id="energyFundamentalsRoot";
 const handlers=new Map(),registrations=[],exports=[];
 const document={
  getElementById:id=>id==="energyFundamentalsRoot"?root:null,
  createElement:tag=>new FakeNode(tag),
  createElementNS:(_ns,tag)=>new FakeNode(tag),
  createTextNode:text=>({textContent:String(text)}),
  addEventListener:(name,callback)=>handlers.set(name,callback)
 };
 const window={SLIVisualExport:{
  register:(svg,provider)=>{registrations.push({svg,provider});return true},
  export:async(svg,fmt,feedback)=>{exports.push({svg,fmt});feedback.textContent="File ready"}
 }};
 const data=JSON.parse(read("data/energy-fundamentals.json"));
 const fetch=async()=>({ok:true,json:async()=>data});
 runInNewContext(read("js/energy-fundamentals.js"),{document,window,fetch,URL,Intl,Date,Math,Number,console},{filename:"energy-fundamentals.js"});
 await window.initEnergyFundamentals();
 const nodes=walk(root);
 const controls=nodes.filter(x=>x.tag==="button"&&x.attrs?.["data-sli-export-format"]);
 assert.deepEqual(controls.map(x=>x.attrs["data-sli-export-format"]),["csv","xlsx","png","jpg","pdf","embed"]);
 assert.ok(nodes.some(x=>x.id==="energy-fundamentals-historical-chart"));
 assert.ok(registrations.length>0,"Chart registered numerical data on first render");
 const provider=registrations[0].provider;
 const csvData=provider.getData();
 assert.deepEqual(Array.from(csvData.headers),["Year","Value","Unit","Indicator","Source"]);
 assert.equal(csvData.rows.length,5);
 assert.equal(csvData.rows.at(-1)[0],2025);
 assert.equal(csvData.rows.at(-1)[1],605.3);
 assert.ok(provider.getMeta().sourceUrl.startsWith("https://www.esdm.go.id"));
 for(const item of controls)await item.listeners.get("click")();
 assert.deepEqual(exports.map(x=>x.fmt),["csv","xlsx","png","jpg","pdf","embed"]);
 assert.ok(handlers.has("sli:exportready"),"Should register even if universal export loads after the chart");
});
