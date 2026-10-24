/* Manual AdSense opt-in for eligible public editorial SLI Open articles only.
   Never add this script to premium tools, DERGUBA, Expert Connect or member workspaces.
   Configure approved pages in data/sli-adsense-config.json, then add:
   <div class="sli-manual-ad" data-sli-ad-slot="REAL_GOOGLE_AD_UNIT_SLOT_ID"></div>
   No ads are requested while enabled=false or without an actual ad unit ID.
*/
(async function () {
  'use strict';
  const nodes = [...document.querySelectorAll('.sli-manual-ad[data-sli-ad-slot]')];
  if (!nodes.length) return;
  let config;
  try {
    const response = await fetch('./data/sli-adsense-config.json', {cache:'no-store'});
    if (!response.ok) return;
    config = await response.json();
  } catch (_) { return; }
  if (!config.enabled || config.mode !== 'manual') return;
  const path = location.pathname.replace(/\/+$/, '') || '/';
  if (!Array.isArray(config.allowed_page_paths) || !config.allowed_page_paths.includes(path)) return;
  if ((config.blocked_page_path_patterns || []).some(x => path.toLowerCase().includes(String(x).toLowerCase()))) return;
  const slots = nodes.filter(node => /^\d+$/.test(node.dataset.sliAdSlot || '')).slice(0, Math.min(2, config.max_slots_per_page || 0));
  if (!slots.length) return;
  const publisher = 'ca-pub-3092642555794646';
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + publisher;
  document.head.appendChild(script);
  for (const node of slots) {
    const label = document.createElement('span');
    label.textContent = 'Advertisement';
    label.className = 'sli-ad-label';
    const ad = document.createElement('ins');
    ad.className = 'adsbygoogle';
    ad.style.display = 'block';
    ad.setAttribute('data-ad-client', publisher);
    ad.setAttribute('data-ad-slot', node.dataset.sliAdSlot);
    ad.setAttribute('data-ad-format', 'auto');
    ad.setAttribute('data-full-width-responsive', 'true');
    node.append(label, ad);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) { /* fail closed */ }
  }
})();
