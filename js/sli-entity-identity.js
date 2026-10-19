/* SLI entity identity layer: public registry keys, source-safe links and restrained iconography.
 * Icons are UI aids. Favicons are retrieved for allowlisted official/entity websites only;
 * a favicon is NOT a certified organizational logo. Do not fetch portraits by name.
 */
(function(){'use strict';
const wiki=Object.freeze({
 'Prabowo Subianto':'https://en.wikipedia.org/wiki/Prabowo_Subianto',
 'Bahlil Lahadalia':'https://en.wikipedia.org/wiki/Bahlil_Lahadalia',
 'Airlangga Hartarto':'https://en.wikipedia.org/wiki/Airlangga_Hartarto',
 'Rachmat Pambudy':'https://en.wikipedia.org/wiki/Rachmat_Pambudy',
 'Meutya Hafid':'https://en.wikipedia.org/wiki/Meutya_Hafid',
 'Rosan Perkasa Roeslani':'https://en.wikipedia.org/wiki/Rosan_Roeslani',
 'Brian Yuliarto':'https://en.wikipedia.org/wiki/Brian_Yuliarto'
});
const sites=[
 [/\b(esdm|ditjen minerba|bad[a]?n geologi|gatrik)\b/i,'esdm.go.id'],
 [/\b(pln|perusahaan listrik negara)\b/i,'pln.co.id'],
 [/\b(komdigi|komunikasi dan digital|digital ecosystem|digital infrastructure|ai & new technology)\b/i,'komdigi.go.id'],
 [/\b(bappenas|national development planning)\b/i,'bappenas.go.id'],
 [/\b(bkpm|investment ministry)\b/i,'bkpm.go.id'],
 [/\b(kemenperin|ministry of industry)\b/i,'kemenperin.go.id'],
 [/\b(kemendagri|home affairs|provincial government)\b/i,'kemendagri.go.id'],
 [/\b(brin|research & innovation agency)\b/i,'brin.go.id'],
 [/\b(danantara|asset management)\b/i,'danantaraindonesia.co.id'],
 [/\b(mind id|mineral industri indonesia)\b/i,'mind.id'],
 [/\b(antam)\b/i,'antam.com'],
 [/\b(bukit asam|ptba)\b/i,'ptba.co.id'],
 [/\b(inalum)\b/i,'inalum.id'],
 [/\b(timah)\b/i,'timah.com'],
 [/\b(freeport)\b/i,'ptfi.co.id'],
 [/\b(vale indonesia)\b/i,'valeindonesia.com'],
 [/\b(telkom|telin|neutradc)\b/i,'telkom.co.id'],
 [/\b(pindad)\b/i,'pindad.com'],
 [/\b(bp batam)\b/i,'bpbatam.go.id'],
 [/\b(bssn)\b/i,'bssn.go.id'],
 [/\b(kemenko perekonomian|economic affairs)\b/i,'ekon.go.id'],
 [/\b(presidency|kepresidenan)\b/i,'setneg.go.id']
];
const paths={
 building:'M4 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M2 22h20M8 6h2m2 0h2M8 10h2m2 0h2M8 14h2m2 0h2M8 18h2m2 0h2M16 8h4a2 2 0 0 1 2 2v12',
 person:'M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10',
 government:'M3 10h18M4 10V7l8-4 8 4v3M5 21V10m5 11V10m4 11V10m5 11V10M2 21h20',
 project:'M3 3v18h18M7 16l4-5 4 3 5-7M18 7h2v2',
 technology:'M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10',
 energy:'M13 2 3 14h8l-1 8 11-12h-8l0-8Z',
 mineral:'m6 3-4 6 10 12 10-12-4-6H6Zm-4 6h20M12 21 8 9l2-6m2 18 4-12-2-6',
 link:'M10 13a5 5 0 0 0 7 .4l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7-.4l-3 3a5 5 0 0 0 7 7l1.7-1.7',
 globe:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM2 12h20M12 2a15.5 15.5 0 0 1 0 20M12 2a15.5 15.5 0 0 0 0 20',
 search:'m21 21-4.5-4.5M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16'
};
const svgNS='http://www.w3.org/2000/svg';
const icon=(name='building')=>{const svg=document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.75');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');svg.classList.add('sli-entity-icon');
 const p=document.createElementNS(svgNS,'path');p.setAttribute('d',paths[name]||paths.building);svg.append(p);return svg};
const isHttps=url=>{try{const u=new URL(url);return u.protocol==='https:'?u.href:null}catch{return null}};
const nameKey=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100);
const website=name=>{const entry=sites.find(([rule])=>rule.test(String(name||'')));return entry?'https://'+entry[1]+'/':null};
const safeProfile=(person,officialSource)=>({name:person||'',url:wiki[person]||isHttps(officialSource),kind:wiki[person]?'wikipedia':isHttps(officialSource)?'official-source':'unavailable'});
const typeFor=a=>a?.type||(a?.person?'government':a?.lane==='state'||a?.lane==='private'?'building':'government');
function brand(title,type='building',className=''){
 const wrap=document.createElement('span');wrap.className='sli-entity-brand '+className;wrap.setAttribute('aria-hidden','true');
 const official=website(title);
 if(official){const img=document.createElement('img');img.className='sli-entity-favicon';img.width=30;img.height=30;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';
  const domain=new URL(official).hostname;img.src='https://www.google.com/s2/favicons?domain='+encodeURIComponent(domain)+'&sz=64';
  img.addEventListener('error',()=>{img.remove();wrap.append(icon(type))},{once:true});wrap.append(img);
 }else wrap.append(icon(type));
 return wrap;
}
function siteBrand(domain,type='building'){
 const wrap=document.createElement('span');wrap.className='sli-entity-brand';wrap.setAttribute('aria-hidden','true');
 const normalized=String(domain||'').toLowerCase().trim();
 if(!/^(?:[a-z0-9-]+\\.)+[a-z]{2,20}$/.test(normalized)){wrap.append(icon(type));return wrap}
 const img=document.createElement('img');img.className='sli-entity-favicon';img.width=30;img.height=30;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';
 img.src='https://www.google.com/s2/favicons?domain='+encodeURIComponent(normalized)+'&sz=64';
 img.addEventListener('error',()=>{img.remove();wrap.append(icon(type))},{once:true});
 wrap.append(img);return wrap;
}
function personLink(person,officialSource){const meta=safeProfile(person,officialSource),a=document.createElement(meta.url?'a':'span');a.className='sli-person-link';a.textContent=person||'';if(meta.url){a.href=meta.url;a.target='_blank';a.rel='noopener noreferrer';a.title=meta.kind==='wikipedia'?'Wikipedia · profil publik; jabatan terbaru harus dicek dari sumber resmi':'Dokumen organisasi / sumber tentang tokoh (bukan biografi terverifikasi)';a.append(' ↗')}return a}
function decoratePortal(){
 const icons={'#energy':'energy','#minerals':'mineral','#investment':'project','#policy':'government','#geopolitics':'globe','sli-entities.html':'building','ai-intelligence-hub.html':'technology','indonesia-macroeconomic-intelligence.html':'project'};
 for(const a of document.querySelectorAll('.sli-portal-sector')){
  const mark=a.querySelector('.sli-portal-glyph');if(!mark)continue;
  const href=a.getAttribute('href')||'';
  const key=Object.keys(icons).find(x=>href.endsWith(x));if(key)mark.replaceChildren(icon(icons[key]));
 }
}
window.SLIEntityIdentity=Object.freeze({icon,brand,siteBrand,personLink,safeProfile,website,isHttps,nameKey,typeFor});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decoratePortal,{once:true});else decoratePortal();
document.addEventListener('sli:pagechange',decoratePortal);
})();