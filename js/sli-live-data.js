/* SLI live data transport, v1. Repo-owned JSON only; source freshness comes from publishers/workflows.
 * Dataset refreshes committed using GITHUB_TOKEN do not always trigger GitHub Pages deployments.
 * Read latest public main-branch data with a safe same-origin fallback; do not treat cached
 * fallback as proof of freshness, and do not modify external requests or mutating methods.
 */
(function(){
'use strict';
if(window.__sliLiveDataInstalled)return;
const original=window.fetch.bind(window);
const folder=new URL('./data/',document.baseURI).pathname;
const repoRoot='https://raw.githubusercontent.com/hananakhmad1991-stack/strategic-latitude-intelligence/main/data/';
const state={transport:'github_main_with_pages_fallback',latest_origin:null,live_success:0,fallback_count:0,failures:0,last_event_utc:null};
window.sliLiveDataTransport=state;
function mark(origin){state.latest_origin=origin;state.last_event_utc=new Date().toISOString();if(origin==='github_main')state.live_success++;else state.fallback_count++;}
window.fetch=function(input,options){
  let url,method;
  try{
    url=new URL(typeof input==='string'||input instanceof URL?String(input):input.url,document.baseURI);
    method=String(options?.method||(typeof input==='object'&&input?.method)||'GET').toUpperCase();
  }catch(error){return original(input,options);}
  // No interception of mutation, cross-domain, html, PDF, untrusted path or app traffic.
  if(method!=='GET'||url.origin!==location.origin||!url.pathname.startsWith(folder)||!url.pathname.endsWith('.json'))
    return original(input,options);
  const path=url.pathname.slice(folder.length);
  if(!path||!/^[-\w./]+\.json$/.test(path)||path.includes('..'))return original(input,options);
  const raw=repoRoot+path;
  // cache no-store prevents deliberate stale local browser caches.
  // Remote CDN may still have short-lived caching, not second-by-second updates.
  const sourceOptions={...options,method:'GET',credentials:'omit',cache:'no-store'};
  delete sourceOptions.integrity;
  return original(raw,sourceOptions).then(response=>{
    if(!response.ok)throw new Error('GitHub raw HTTP '+response.status);
    mark('github_main');
    return response;
  }).catch(()=>{
    state.failures++;
    return original(input,options).then(response=>{if(response.ok)mark('pages_fallback');return response;});
  });
};
window.__sliLiveDataInstalled=true;
})();