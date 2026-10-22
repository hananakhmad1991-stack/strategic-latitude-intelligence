/* Optional panels: do not hide embedded widgets until the user explicitly collapses them. */
(()=>{'use strict';
const targets=[['sli-market-home','IHSG chart','Grafik IHSG'],['sli-portal-market','IDX market heatmap','Heatmap pasar IDX'],['sli-portal-sectoral-market','Sector issuer watchlist','Daftar emiten per sektor'],['sli-market-news-home','Issuer news','Berita emiten']];
const locale=()=>document.documentElement.lang==='id';
function setup(){
 if(!document.body.classList.contains('sli-home-active'))return;
 for(const [cls,en,id] of targets){
  const section=document.querySelector('.sli-portal .'+cls);
  if(!section||section.dataset.sliToggleReady==='1')continue;
  section.dataset.sliToggleReady='1';
  const control=document.createElement('button');control.type='button';control.className='sli-panel-collapse';
  const panelId='sli-panel-'+cls;section.id||=panelId;control.setAttribute('aria-controls',section.id);
  const label=()=>{control.textContent=(section.classList.contains('sli-panel-collapsed')?(locale()?'Tampilkan: ':'Show: '):(locale()?'Sembunyikan: ':'Hide: '))+(locale()?id:en);control.setAttribute('aria-expanded',String(!section.classList.contains('sli-panel-collapsed')))};
  label();
  control.addEventListener('click',()=>{
   section.classList.toggle('sli-panel-collapsed');label();
   if(!section.classList.contains('sli-panel-collapsed'))requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  });
  section.parentNode.insertBefore(control,section);
  document.addEventListener('sli:languagechange',label);
 }
}
document.addEventListener('DOMContentLoaded',setup);
document.addEventListener('sli:pagechange',()=>requestAnimationFrame(setup));
new MutationObserver(()=>setup()).observe(document.documentElement,{childList:true,subtree:false});
})();