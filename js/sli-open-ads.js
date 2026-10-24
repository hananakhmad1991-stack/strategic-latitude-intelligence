/* SLI Open AdSense rollout: OFF until Google approval and entitlement validation.
 * Never infer paid vs free from URL parameters or localStorage.
 * A trusted server must explicitly render the Open entitlement before enabling.
 */
(function(){
 'use strict';
 const CONFIG=Object.freeze({
  publisher:'ca-pub-3092642555794646',
  approved:false,
  enabled:false,
  slotId:null
 });
 const allowedPaths=new Set(['/','/index.html']);
 function eligible(){
  const p=location.pathname.replace(/\/+/g,'/');
  if(!allowedPaths.has(p))return false;
  if(location.hash && !['#home','#overview',''].includes(location.hash))return false;
  const root=document.documentElement;
  // Default deny: a server-verified attribute, not browser-writable account state.
  // Not yet integrated with SLI's paid session API; hence no ad requests currently.
  return CONFIG.approved && CONFIG.enabled && !!CONFIG.slotId &&
    root.getAttribute('data-sli-entitlement-verified')==='true' &&
    root.getAttribute('data-sli-plan')==='open';
 }
 function mount(){
  const old=document.getElementById('sliOpenAdPlacement');
  if(old && !eligible()){old.remove();return;}
  if(!eligible()||old)return;
  const content=document.getElementById('content');
  if(!content || !content.textContent.trim())return;
  const section=document.createElement('aside');
  section.id='sliOpenAdPlacement';
  section.className='sli-open-ad-placement';
  section.setAttribute('aria-label','Advertisement');
  const label=document.createElement('span');
  label.className='sli-open-ad-label';label.textContent='Advertisement · Iklan';
  const unit=document.createElement('ins');
  unit.className='adsbygoogle';unit.style.display='block';
  unit.dataset.adClient=CONFIG.publisher;
  unit.dataset.adSlot=CONFIG.slotId;
  unit.dataset.adFormat='auto';unit.dataset.fullWidthResponsive='true';
  section.append(label,unit);
  content.append(section);
  try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}
  catch(e){section.remove();console.warn('SLI ad mount failed',e);}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 document.addEventListener('sli:pagechange',mount);
 window.addEventListener('hashchange',mount);
})();
