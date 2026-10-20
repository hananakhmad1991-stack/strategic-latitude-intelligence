import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const d=JSON.parse(read("data/iea-critical-minerals-2026-full-scenarios.json"));
const module=read("js/sli-iea-2026-full-explorer.js");
const research=read("js/research-chapters.js"),html=read("index.html"),css=read("css/sli-iea-2026-full-explorer.css");

test("IEA 2026 full upload contains nine demand groups with aligned 2025/CPS/STEPS/HDS 16 columns",()=>{
 assert.equal(d.edition,"IEA Critical Minerals Dataset, July 2026");
 assert.equal(d.license,"CC BY 4.0");
 assert.equal(d.columns.demand.length,16);
 assert.equal(d.columns.demand[0],"2025 baseline");
 for(const scenario of ["CPS","STEPS","HDS"])for(const year of [2030,2035,2040,2045,2050])
  assert.ok(d.columns.demand.includes(scenario+" "+year));
 assert.equal(Object.keys(d.demand).length,9);
 const rows=Object.values(d.demand).flat();
 assert.ok(rows.length>200);
 for(const r of rows){
  assert.equal(r.v.length,16,r.h+" "+r.n);
  assert.ok(r.v.every(v=>typeof v==="number"&&Number.isFinite(v)),"IEA row has nonnumeric/model gap: "+r.h+" "+r.n);
 }
 assert.equal(d.supply.length,108);
});
test("Scenario selector compares only source columns of a single source row, no synthetic totals",()=>{
 assert.match(module,/const names=\["2025 baseline",\.\.\.\["2030","2035","2040","2045","2050"\]\.map/);
 assert.match(module,/row\.v\[cols\.indexOf\(name\)\]/);
 assert.match(module,/demand\[group\.field\.value\]/);
 assert.match(module,/Number\.isFinite/);
 assert.match(module,/IEA \(2026\), Critical Minerals Dataset, CC BY 4\.0/);
 assert.match(module,/conditional modelled outputs/);
 assert.match(module,/Not Indonesian demand unless separately specified/);
 assert.doesNotMatch(module,/\.reduce\(/);
 const sandbox={window:{},document:{},console};
 vm.runInNewContext(module,sandbox,{timeout:2000,filename:"sli-iea-2026-full-explorer.js"});
 assert.equal(typeof sandbox.window.initSLIIEA2026FullExplorer,"function");
});
test("Full IEA module loads before research-chapters.js and mounts after existing selected workbook without replacing",()=>{
 assert.ok(html.indexOf('js/sli-iea-2026-full-explorer.js')>0);
 assert.ok(html.indexOf('js/sli-iea-2026-full-explorer.js')<html.indexOf('js/research-chapters.js'));
 assert.match(html,/css\/sli-iea-2026-full-explorer\.css/);
 assert.match(research,/initSLIIEA2026Explorer\("minerals",rawIEA\)/);
 assert.match(research,/initSLIIEA2026FullExplorer\(fullIEA\)/);
 assert.match(research,/sections\[3\]\.append\(fullIEA\)/);
 assert.match(research,/id="sliIEA2026FullMineralsRoot"/);
 assert.match(css,/\.sli-iea-full-controls/);
 assert.match(css,/@media\(max-width:800px\)/);
});
