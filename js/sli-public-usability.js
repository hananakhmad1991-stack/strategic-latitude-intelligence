/* SLI public usability: dynamically-rendered tables stay usable on phones.
   No modifications to statistical content, chart data or source provenance. */
(()=>{'use strict';
 const ROOTS=['#content','main','.main'];let queued=false;
 function apply(){
  queued=false;const visited=new Set();
  for(const selector of ROOTS){const root=document.querySelector(selector);if(!root)continue;
   for(const table of root.querySelectorAll('table')){
    if(visited.has(table)||table.closest('.sli-table-scroll'))continue;visited.add(table);
    if(table.closest('.leaflet-container,[role="grid"],.dataTables_wrapper'))continue;
    if(table.parentElement?.classList.contains('tablewrap'))continue;
    const holder=document.createElement('div');holder.className='sli-table-scroll';holder.tabIndex=0;holder.setAttribute('role','region');
    const heading=table.closest('section,.panel')?.querySelector('h2,h3')?.textContent?.trim();
    holder.setAttribute('aria-label',(heading||table.getAttribute('aria-label')||'Data table')+' — scroll horizontally on small screens');
    table.parentNode.insertBefore(holder,table);holder.appendChild(table);
   }
  }
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
 const start=()=>{const root=document.querySelector('#content')||document.querySelector('main');if(root&&typeof MutationObserver!=='undefined'){const observer=new MutationObserver(records=>{if(records.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1&&(n.matches?.('table,section,div')||n.querySelector?.('table')))))schedule()});observer.observe(root,{childList:true,subtree:true})}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.addEventListener('orientationchange',schedule);
})();
