/* SLI welfare: automated real-Chrome desktop/mobile smoke, no external npm packages. */
import {createServer} from "node:http";
import {readFile,writeFile,mkdir,mkdtemp} from "node:fs/promises";
import {readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve,sep,extname} from "node:path";
import {spawn} from "node:child_process";
import assert from "node:assert/strict";
const ROOT=resolve(import.meta.dirname,"..");
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json",".geojson":"application/geo+json"};
const sleep=n=>new Promise(r=>setTimeout(r,n));
async function until(fn,max=16000){
 const start=Date.now();while(Date.now()-start<max){try{const x=await fn();if(x)return x}catch{}await sleep(250)}
 throw Error("Browser ready check timed out");
}
function makeServer(){return createServer(async(req,res)=>{
 try{const rel=decodeURIComponent(new URL(req.url,"http://localhost").pathname).replace(/^\/+/,"")||"index.html";
  const path=resolve(ROOT,rel);
  if(!path.startsWith(ROOT+sep)){res.writeHead(403).end();return}
  const data=await readFile(path);
  res.writeHead(200,{"content-type":types[extname(path)]||"application/octet-stream","cache-control":"no-store"}).end(data);
 }catch{res.writeHead(404).end("not found")}
})}
async function remote(uri){
 const socket=new WebSocket(uri);
 await new Promise((ok,fail)=>{socket.addEventListener("open",ok,{once:true});socket.addEventListener("error",fail,{once:true})});
 let seq=0;const pending=new Map();
 socket.addEventListener("message",event=>{
  const message=JSON.parse(event.data);const p=pending.get(message.id);if(!p)return;
  pending.delete(message.id);if(message.error)p.fail(Error(JSON.stringify(message.error)));else p.ok(message.result||{});
 });
 return {send(method,params={}){const id=++seq;return new Promise((ok,fail)=>{pending.set(id,{ok,fail});socket.send(JSON.stringify({id,method,params}))})},close(){socket.close()}};
}
async function main(){
 const server=makeServer();await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
 const origin="http://127.0.0.1:"+server.address().port;
 const profile=await mkdtemp(join(tmpdir(),"sli-chrome-"));
 const chrome=spawn(process.env.CHROME_PATH||"chrome",["--headless=new","--no-sandbox","--disable-dev-shm-usage","--no-first-run","--remote-debugging-port=0","--user-data-dir="+profile,"--window-size=1440,950","about:blank"],{stdio:"ignore"});
 let cdp;
 try{
  const port=await until(()=>{const x=readFileSync(join(profile,"DevToolsActivePort"),"utf8").split("\n")[0];return Number(x)||false},24000);
  const tab=await fetch("http://127.0.0.1:"+port+"/json/new?"+encodeURIComponent(origin+"/sli-welfare-2026.html"),{method:"PUT"});
  assert.equal(tab.status,200);
  cdp=await remote((await tab.json()).webSocketDebuggerUrl);
  await cdp.send("Page.enable");await cdp.send("Runtime.enable");
  async function evaluate(expression){
   const r=await cdp.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
   if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));
   return r.result?.value;
  }
  const ready=()=>until(async()=>evaluate('document.querySelectorAll("#welfareMap path").length===38&&document.querySelectorAll("#provinceRows tr").length===38&&document.querySelectorAll("#trendSvg circle").length>0&&!document.querySelector("#status").textContent.includes("Memuat")'));
  await ready();
  const desktop=await evaluate('(()=>({map:document.querySelectorAll("#welfareMap path").length,rows:document.querySelectorAll("#provinceRows tr").length,metrics:document.querySelectorAll("#indicatorSelect option").length,trend:document.querySelectorAll("#trendSvg circle").length,source:document.querySelector("#sourceBps").href}))()');
  assert.equal(desktop.map,38);assert.equal(desktop.rows,38);assert.equal(desktop.metrics,9);assert.equal(desktop.trend,5);assert.match(desktop.source,/bps\.go\.id/);
  const energy=await evaluate('(()=>{const e=document.querySelector("#sectorSelect");e.value="Energi";e.dispatchEvent(new Event("change",{bubbles:true}));return document.querySelectorAll("#indicatorSelect option").length})()');
  assert.equal(energy,2);
  const quality=await evaluate('(()=>{const e=document.querySelector("#indicatorSelect");e.value="no_electricity_lighting";e.dispatchEvent(new Event("change",{bubbles:true}));return {grey:[...document.querySelectorAll("#welfareMap path")].filter(x=>x.getAttribute("fill")==="#7f7286").length,description:document.querySelector("#selection").textContent}})()');
  assert.ok(quality.grey>0);assert.match(quality.description,/RSE/);
  const search=await evaluate('(()=>{const e=document.querySelector("#provinceSearch");e.value="Aceh";e.dispatchEvent(new Event("input",{bubbles:true}));return {rows:document.querySelectorAll("#provinceRows tr").length,text:document.querySelector("#provinceRows").textContent}})()');
  assert.equal(search.rows,1);assert.match(search.text,/Aceh/);
  await evaluate('(()=>{const e=document.querySelector("#provinceSearch");e.value="";e.dispatchEvent(new Event("input",{bubbles:true}))})()');
  await mkdir("artifacts",{recursive:true});
  const dshot=await cdp.send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile("artifacts/sli-bps-welfare-desktop.png",Buffer.from(dshot.data,"base64"));
  await cdp.send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:2.5,mobile:true,screenWidth:390,screenHeight:844});
  await cdp.send("Emulation.setTouchEmulationEnabled",{enabled:true,maxTouchPoints:5});
  await cdp.send("Page.reload",{ignoreCache:true});await ready();
  const phone=await evaluate('(()=>({screen:innerWidth,pageWidth:document.documentElement.scrollWidth,map:document.querySelectorAll("#welfareMap path").length,rows:document.querySelectorAll("#provinceRows tr").length,scrollTable:document.querySelector(".table-wrap").scrollWidth>document.querySelector(".table-wrap").clientWidth}))()');
  assert.equal(phone.map,38);assert.equal(phone.rows,38);
  assert.ok(phone.pageWidth<=phone.screen+2,"Mobile page overflow: "+JSON.stringify(phone));
  assert.ok(phone.scrollTable,"Wide table must scroll within container");
  const pshot=await cdp.send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile("artifacts/sli-bps-welfare-phone-390px.png",Buffer.from(pshot.data,"base64"));
  console.log(JSON.stringify({status:"PASS",desktop,phone,checks:["map","sector filter","RSE","province search","national trend","desktop","390px mobile scroll"]},null,2));
 }finally{
  cdp?.close();chrome.kill("SIGTERM");await new Promise(r=>server.close(r));
 }
}
main().catch(err=>{console.error(err);process.exitCode=1});
