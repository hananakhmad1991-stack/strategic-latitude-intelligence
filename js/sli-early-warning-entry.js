/* SLI GDELT Early Warning navigation — graceful enhancement only. */
(function(){
 function mount(){
  if(document.getElementById('sliEarlyWarningEntry'))return;
  const parent=document.getElementById('sliPortalSectors')||document.querySelector('.main')||document.querySelector('main');
  if(!parent)return;
  const a=document.createElement('a');
  a.id='sliEarlyWarningEntry';
  a.href='./sli-early-warning.html';
  a.textContent='Early Warning · 9 Sektor ↗';
  a.setAttribute('aria-label','Buka dashboard Early Warning GDELT sembilan sektor');
  a.style.cssText='display:inline-flex;align-items:center;max-width:100%;margin:10px 8px 10px 0;padding:10px 14px;border:1px solid #d7b678;border-radius:9px;background:#142c42;color:#ead5ab;font-weight:650;font-size:13px;text-decoration:none;white-space:normal';
  parent.prepend(a);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
