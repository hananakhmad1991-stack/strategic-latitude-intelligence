import test from "node:test";
import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {observeKKPDownload} from "../scripts/kkp-official-download-observer.mjs";

class BrowserPage extends EventEmitter{}
class BrowserContext extends EventEmitter{
 constructor(){super();this.openPages=[new BrowserPage()]}
 pages(){return this.openPages}
 spawn(){const p=new BrowserPage();this.openPages.push(p);this.emit("page",p);return p}
}

test("captures a real browser download from the main tab",async()=>{
 const context=new BrowserContext();
 const watcher=observeKKPDownload(context,{timeoutMs:500});
 const file={suggestedFilename:()=>"source.csv"};
 context.pages()[0].emit("download",file);
 assert.equal(await watcher.promise,file);
 assert.equal(watcher.diagnostics().download_events,1);
});

test("captures a popup-tab download and never logs request data",async()=>{
 const context=new BrowserContext();
 const watcher=observeKKPDownload(context,{timeoutMs:500});
 const file={suggestedFilename:()=>"source.csv"};
 const requestBody="name=PrivateName&email=never-log@example.com";
 context.emit("response",{
  url:()=>"https://portaldata.kkp.go.id/download?email=never-log@example.com",
  status:()=>200,
  request:()=>({method:()=>"POST",postData:()=>requestBody}),
  headers:()=>({"content-type":"text/csv","content-disposition":"attachment; filename=PrivateName.csv"})
 });
 const popup=context.spawn();
 popup.emit("download",file);
 assert.equal(await watcher.promise,file);
 const audit=watcher.diagnostics();
 assert.equal(audit.popup_tabs,1);
 assert.deepEqual(audit.first_party_post_responses,[200]);
 assert.equal(audit.possible_file_responses[0].mime_category,"csv");
 assert.ok(!JSON.stringify(audit).includes("PrivateName"));
 assert.ok(!JSON.stringify(audit).includes("never-log@example.com"));
});

test("returns null on timeout without claiming an accepted submission",async()=>{
 const context=new BrowserContext();
 const watcher=observeKKPDownload(context,{timeoutMs:5});
 assert.equal(await watcher.promise,null);
 assert.equal(watcher.diagnostics().download_events,0);
 context.pages()[0].emit("download",{});
 assert.equal(watcher.diagnostics().download_events,0);
});

test("ignores off-domain responses and records only HTTP error codes",async()=>{
 const context=new BrowserContext();
 const watcher=observeKKPDownload(context,{timeoutMs:500});
 context.emit("response",{
  url:()=>"https://example.com/?name=Secret",
  status:()=>403,
  request:()=>({method:()=>"POST"}),
  headers:()=>({"content-type":"application/json"})
 });
 context.emit("response",{
  url:()=>"https://portaldata.kkp.go.id/api/private?name=Secret",
  status:()=>503,
  request:()=>({method:()=>"POST"}),
  headers:()=>({"content-type":"application/json"})
 });
 watcher.cancel();await watcher.promise;
 assert.deepEqual(watcher.diagnostics().first_party_post_responses,[503]);
 assert.deepEqual(watcher.diagnostics().first_party_http_errors,[503]);
 assert.ok(!JSON.stringify(watcher.diagnostics()).includes("Secret"));
});
