import {createServer} from 'node:http';
import {readFile,mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep,extname} from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const wait=ms=>new Promise(ok=>setTimeout(ok,ms));
async function until(fn){for(let i=0;i<80;i++){try{const v=await fn();if(v)return v}catch{}await wait(250)}throw Error('Chrome startup or dashboard timed out')}
const server=createServer(async(req,res)=>{try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\\/+/, '')||'index.html';const p=resolve(root,rel);if(!p.startsWith(root+sep))return res.writeHead(403).end();const b=await readFile(p);res.writeHead(200,{'content-type':types[extname(p)]||'application/octet-stream'}).end(b)}catch{res.writeHead(404).end()}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const profile=await mkdtemp(join(tmpdir(),'sli-green-chrome-'));
const chrome=spawn(process.env.CHROME_PATH||'chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let socket;
try{
 const port=await until(()=>Number(readFileSync(join(profile,'DevToolsActivePort'),'utf8').split('\\n')[0]));
 const tab=await fetch('http://127.0.0.1:'+port+'/json/new?'+encodeURIComponent(origin+'/green-workforce-intelligence.html'),{method:'PUT'});assert.equal(tab.status,200);
 socket=new WebSocket((await tab.json()).webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',fail,{once:true})});
 let seq=0;const pending=new Map();socket.addEventListener('message',e=>{const msg=JSON.parse(e.data),p=pending.get(msg.id);if(!p)return;pending.delete(msg.id);msg.error?p.fail(Error(JSON.stringify(msg.error))):p.ok(msg.result||{})});
 const send=(method,params={})=>new Promise((ok,fail)=>{const id=++seq;pending.set(id,{ok,fail});socket.send(JSON.stringify({id,method,params}))});
 const evalJs=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result?.value};
 await send('Page.enable');await send('Runtime.enable');
 await until(()=>evalJs('document.querySelectorAll("#bars .barhead").length===17&&document.querySelector("#total").textContent.includes(".")'));
 await mkdir('artifacts',{recursive:true});
 for(const width of [1440,390,360]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
  await wait(400);
  const state=await evalJs('(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth,rows:document.querySelectorAll("#bars .barhead").length,total:document.querySelector("#total").textContent,links:document.querySelectorAll("a[href*=green-workforce]").length}))()');
  assert.equal(state.rows,17);assert.ok(state.scroll<=width+2,'Horizontal overflow at '+width+': '+JSON.stringify(state));
  const png=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile('artifacts/sli-green-workforce-'+width+'.png',Buffer.from(png.data,'base64'));
  console.log('PASS viewport',width,state);
 }
 const scenario=await evalJs('(()=>{const s=document.querySelector("#scenario");s.value="high";s.dispatchEvent(new Event("change"));return document.querySelector("#total").textContent})()');
 assert.equal(scenario,'5.320.238');
 const year=await evalJs('(()=>{const y=document.querySelector("#year");y.value="2025";y.dispatchEvent(new Event("change"));return document.querySelector("#total").textContent})()');
 assert.equal(year,'4.062.940');
 console.log('PASS scenario and year controls');
}finally{socket?.close();chrome.kill('SIGTERM');server.close()}
