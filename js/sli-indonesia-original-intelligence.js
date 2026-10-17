/* Original Strategic Latitude Intelligence. No external composite-power ratings.
   Primary-source data + explicitly attributed SLI editorial interpretation. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const make=(tag,value)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=String(value);return n};
const fmt=(n)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n);
const officialLink=(url,label)=>{const a=make('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a};
const views=['snapshot','global','sectors','dossiers','regional','safety'];
let DATA=null,activeView='snapshot',activePartner=null,activeSector=null,domain=null,issue=null,search='';
const domainById=id=>DATA?.domains.find(d=>d.id===id);
const issueById=()=>domainById(domain)?.topics.find(t=>t.id===issue);
const metricById=id=>DATA?.metrics.find(x=>x.id===id);
const out=v=>v==null?'N/A':v;
function evidence(ids){
 const root=make('div');root.className='evidence';
 for(const id of ids||[]){
  const x=metricById(id);
  if(!x)continue;
  const card=make('article');card.append(make('div',x.label));
  const value=make('div',out(x.display));value.className='value';card.append(value);
  const date=make('div',(x.period||'Undated')+' · '+(x.publisher||'Publisher unknown'));date.className='meta';card.append(date);
  if(x.source_url?.startsWith('https://'))card.append(officialLink(x.source_url,'Official publication ↗'));
  root.append(card);
 }
 return root;
}
function navigate(view,opts={}){
 const next=views.includes(view)?view:'snapshot';activeView=next;
 for(const button of document.querySelectorAll('[data-view]'))button.setAttribute('aria-selected',String(button.dataset.view===next));
 for(const v of views)$(v).hidden=v!==next;
 if(opts.write!==false){const suffix=next==='dossiers'?[domain,issue].filter(Boolean).join('/'):'';const value='#'+next+(suffix?'/'+suffix:'');window.history?.pushState?.(null,'',value)}
 if(opts.scroll)document.getElementById(next)?.scrollIntoView?.({block:'start'});
}
function readHash(){
 const [t,d,i]=location.hash.slice(1).split('/');
 navigate(t,{write:false});
 if(t==='dossiers'&&DATA){
  domain=domainById(d)?d:null;issue=domainById(domain)?.topics.some(x=>x.id===i)?i:null;
  renderDossiers();
 }
}
function snapshot(){
 $('asOf').textContent='Data checked: '+DATA.updated_at;
 $('intro').textContent=DATA.overview.narrative;
 $('leadTitle').textContent=DATA.overview.headline;
 $('leadText').textContent=DATA.overview.narrative;
 const headline=['gdp','reserves','investment','surplus'];
 const k=$('headlineKpis');k.replaceChildren();
 for(const id of headline){
  const m=metricById(id);if(!m)continue;
  const card=make('article');card.className='kpi';
  card.append(make('div',m.label));
  const val=make('div',m.display);val.className='value';card.append(val);
  const period=make('div',m.period+' · '+m.publisher);period.className='meta';card.append(period);
  card.append(officialLink(m.source_url,'View official source ↗'));k.append(card);
 }
 const root=$('highlights');root.replaceChildren();
 for(const x of DATA.overview.highlights){
  const b=make('button');b.type='button';b.className='action-card';
  b.append(make('h3',x.title),make('p',x.text));
  const arrow=make('span','Read SLI assessment →');arrow.className='arrow';b.append(arrow);
  b.addEventListener('click',()=>{domain=x.domain;issue=null;navigate('dossiers',{scroll:true});renderDossiers()});root.append(b);
 }
}
const partnerValue=p=>Math.abs(p.exports)+Math.abs(p.imports);
function partnerSelect(name){
 activePartner=name;
 const x=DATA.partners.find(p=>p.country===name);if(!x)return;
 $('partnerName').textContent=x.country;
 $('partnerBalance').textContent=(x.balance<0?'−':'')+'US$'+fmt(Math.abs(x.balance))+'bn';
 $('partnerInsight').textContent=x.analysis;
 $('partnerSource').href=x.source_url;
 const root=$('partnerMetrics');root.replaceChildren();
 for(const [caption,value] of [['Exports to partner',x.exports],['Imports from partner',x.imports]]){
  const b=make('article');b.append(make('div',caption));
  const v=make('div','US$'+fmt(value)+'bn');v.className='value';b.append(v);
  const p=make('div',x.period+' · BPS');p.className='meta';b.append(p);root.append(b);
 }
 for(const b of $('partnerList').children)b.setAttribute('aria-pressed',String(b.dataset.country===name));
}
function globalLinks(){
 const root=$('partnerList');root.replaceChildren();
 const max=Math.max(...DATA.partners.map(partnerValue));
 for(const p of DATA.partners){
  const b=make('button');b.type='button';b.className='partner';b.dataset.country=p.country;
  const head=make('div');head.className='partner-head';
  head.append(make('span',p.country),make('strong','US$'+fmt(partnerValue(p))+'bn two-way'));b.append(head);
  const bar=make('div');bar.className='bar';const fill=make('span');fill.className='fill';fill.style.width=(partnerValue(p)/max*100).toFixed(1)+'%';bar.append(fill);b.append(bar);
  b.addEventListener('click',()=>partnerSelect(p.country));root.append(b);
 }
 partnerSelect(DATA.partners.some(x=>x.country===activePartner)?activePartner:DATA.partners[0].country);
}
function sectorSelect(id){
 const sec=DATA.sectors.find(x=>x.id===id);if(!sec)return;activeSector=id;
 for(const b of $('sectorGrid').children)b.setAttribute('aria-pressed',String(b.dataset.sector===id));
 $('sectorName').textContent=sec.name;
 $('sectorOpportunity').textContent='Opportunity: '+sec.opportunity;
 $('sectorExposure').textContent='Exposure: '+sec.exposure;
 $('sectorEvidence').replaceChildren(...evidence(sec.metric_ids).children);
 $('sectorExplore').onclick=()=>{domain=sec.domain;issue=null;navigate('dossiers',{scroll:true});renderDossiers()};
}
function sectors(){
 const root=$('sectorGrid');root.replaceChildren();
 for(const sec of DATA.sectors){
  const b=make('button');b.type='button';b.className='action-card';b.dataset.sector=sec.id;
  b.append(make('h3',sec.name),make('p',sec.exposure));
  const arrow=make('span','Explore sector →');arrow.className='arrow';b.append(arrow);
  b.addEventListener('click',()=>sectorSelect(sec.id));root.append(b);
 }
 sectorSelect(DATA.sectors.some(x=>x.id===activeSector)?activeSector:DATA.sectors[0].id);
}
function crumb(text,cb){
 const b=make('button',text);b.type='button';b.addEventListener('click',cb);return b;
}
function setDossier(d,i,write=true){
 domain=domainById(d)?d:null;issue=domainById(domain)?.topics.some(x=>x.id===i)?i:null;
 renderDossiers();if(write)navigate('dossiers',{scroll:true});
}
function renderDossiers(){
 const root=$('dossierGrid'),trail=$('dossierBreadcrumb'),heading=$('dossierHeading'),details=$('issueDetail'),back=$('dossierBack');
 root.replaceChildren();trail.replaceChildren();heading.replaceChildren();details.hidden=true;
 const q=$('researchSearch').value.trim().toLowerCase();
 if(!DATA){heading.textContent='Research data unavailable.';return}
 trail.append(crumb('All research areas',()=>setDossier(null,null)));
 const selected=domainById(domain);
 back.hidden=!selected;back.onclick=()=>selected&&issue?setDossier(domain,null):setDossier(null,null);
 if(!selected){
  heading.append(make('p','Explore SLI interpretations alongside their official evidence.'));
  for(const d of DATA.domains){
   if(q&&!((d.title+' '+d.strap+' '+d.summary+' '+d.topics.map(x=>x.title).join(' ')).toLowerCase().includes(q)))continue;
   const b=make('button');b.type='button';b.className='action-card';
   b.append(make('h3',d.title),make('p',d.summary));
   const a=make('span',d.topics.length+' issues · Open →');a.className='arrow';b.append(a);
   b.addEventListener('click',()=>setDossier(d.id,null));root.append(b);
  }
  if(!root.children.length)root.append(make('p','No matching research areas.'));
  return;
 }
 trail.append(make('span','›'),crumb(selected.title,()=>setDossier(selected.id,null)));
 const h=make('h2',selected.title);heading.append(h,make('p',selected.strap+' · '+selected.summary));
 if(!issue){
  for(const t of selected.topics){
   if(q&&!((t.title+' '+t.analysis+' '+t.watch).toLowerCase().includes(q)))continue;
   const b=make('button');b.type='button';b.className='topic';
   b.append(make('h3',t.title),make('small',t.analysis));
   b.addEventListener('click',()=>setDossier(selected.id,t.id));root.append(b);
  }
  if(!root.children.length)root.append(make('p','No matching issues.'));
  return;
 }
 const topic=issueById();if(!topic)return;
 trail.append(make('span','›'),make('span',topic.title));
 root.replaceChildren();details.hidden=false;
 $('issueName').textContent=topic.title;
 $('issueAnalysis').textContent=topic.analysis;
 $('issueWatch').textContent=topic.watch;
 $('issueEvidence').replaceChildren(...evidence(topic.metric_ids).children);
 $('issueSourceLinks').replaceChildren();$('issueRelatedSources').hidden=!(topic.related_sources?.length);
 for(const src of topic.related_sources||[]){if(!src.url?.startsWith('https://'))continue;const line=make('p');line.append(officialLink(src.url,src.title+' ↗'),make('span',' · '+src.period));$('issueSourceLinks').append(line)}
 if(!topic.metric_ids.length){
  const empty=make('div','This SLI assessment is qualitative. No numeric statistic is asserted for this issue.');empty.className='empty';$('issueEvidence').append(empty);
 }
}
async function load(){
 try{
  const r=await fetch('./data/sli-indonesia-original-intelligence.json',{cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const x=await r.json();
  if(x.schema!=='sli-indonesia-original-intelligence-v1'||x.metrics.length<10||x.domains.length!==8||!x.partners?.length)throw Error('Incomplete editorial dataset');
  DATA=x;snapshot();globalLinks();sectors();renderDossiers();readHash();
 }catch(e){
  $('leadTitle').textContent='Source data unavailable';$('leadText').textContent='Could not load the verified SLI research snapshot. Refresh this page and check the official data portals.';
  $('partnerList').textContent='Trade records unavailable.';$('sectorGrid').textContent='Sector analysis unavailable.';$('dossierGrid').textContent='Research dossiers unavailable.';$('asOf').textContent='Data status: unavailable';
 }
}
function init(){
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{navigate(b.dataset.view);if(b.dataset.view==='dossiers')renderDossiers()}));
 $('seeDossiers').addEventListener('click',e=>{e.preventDefault();domain=null;issue=null;navigate('dossiers',{scroll:true});renderDossiers()});
 $('researchSearch').addEventListener('input',renderDossiers);
 window.addEventListener('hashchange',readHash);window.addEventListener('popstate',readHash);
 navigate(location.hash.slice(1).split('/')[0],{write:false});
 load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();