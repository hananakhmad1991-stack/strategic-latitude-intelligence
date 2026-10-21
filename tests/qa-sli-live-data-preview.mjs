import {test} from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const transport=readFileSync(new URL("../js/sli-live-data.js",import.meta.url),"utf8");
function makeHost(baseURI){
 const calls=[],origin=new URL(baseURI);
 const window={fetch:async function(path){calls.push(String(path));return {ok:true,json:async()=>({})}}};
 const document={baseURI};
 const location={origin:origin.origin,hostname:origin.hostname};
 vm.runInNewContext(transport,{window,document,location,URL,Date}, {filename:"sli-live-data.js"});
 return {window,calls};
}
test("Local loopback browser QA reads checked-out PR evidence, never stale GitHub main",async()=>{
 const t=makeHost("http://127.0.0.1:8765/index.html");
 await t.window.fetch("./data/sli-idx-issuer-universe.json");
 assert.deepEqual(t.calls,["./data/sli-idx-issuer-universe.json"]);
 assert.equal(t.window.__sliLiveDataInstalled,true);
 const localhost=makeHost("http://localhost:8765/index.html");
 await localhost.window.fetch("./data/research-signal-radar.json");
 assert.deepEqual(localhost.calls,["./data/research-signal-radar.json"]);
});
test("Public GitHub Pages still checks latest main data with guarded local fallback",async()=>{
 const t=makeHost("https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/index.html");
 await t.window.fetch("./data/sli-idx-issuer-universe.json");
 assert.equal(t.calls.length,1);
 assert.match(t.calls[0],/^https:\/\/raw\.githubusercontent\.com\/hananakhmad1991-stack\/strategic-latitude-intelligence\/main\/data\/sli-idx-issuer-universe\.json$/);
 assert.equal(t.window.sliLiveDataTransport.latest_origin,"github_main");
});
