/* Strategic Latitude Intelligence — Lowy 2025 Indonesia country profile.
   Values are attributed published snapshots, not new SLI risk ratings. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const el=(tag,txt)=>{const node=document.createElement(tag);if(txt!==undefined)node.textContent=String(txt);return node;};
const fmt=(n,d=1)=>new Intl.NumberFormat('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
const signed=(n,unit='')=>n>0?'+'+fmt(n)+(unit?' '+unit:''):n<0?'−'+fmt(Math.abs(n))+(unit?' '+unit:''):'No change';
const rankMove=n=>n>0?'↑ '+n+' places':n<0?'↓ '+Math.abs(n)+' places':'No change';
let data=null,tab='overview',direction='into_indonesia',activeCountry=null,selectedMetric=null;
const sourceUrl='https://power.lowyinstitute.org/countries/indonesia/';
function tabChange(t,write=true){
 if(!['overview','changes','influence','scores'].includes(t))t='overview';
 tab=t;
 for(const button of document.querySelectorAll('[data-tab]')){
  const active=button.dataset.tab===t;button.setAttribute('aria-selected',String(active));
 }
 for(const section of ['overview','changes','influence','scores'])$(section).hidden=section!==t;
 if(write && window.history?.replaceState)window.history.replaceState(null,'','#'+t);
}
function renderOverview(){
 const value=data.overview.comprehensive_power;
 $('edition').textContent=data.publication;
 $('overallRank').textContent='#'+value.rank;
 $('rankContext').textContent='of '+value.universe+' economies';
 $('overallScore').textContent=fmt(value.score);
 $('overallChange').textContent=signed(value.annual_score_change,'points');
 $('powerClass').textContent=data.overview.classification;
 $('powerSummary').textContent='Lowy ranks Indonesia '+value.rank+' of '+value.universe+' on comprehensive power. This is a regional power measure, not a country-investment safety score.';
 const highest=[...data.metrics].sort((a,b)=>b.score-a.score)[0];
 const best=[...data.metrics].sort((a,b)=>a.rank-b.rank);
 const worst=[...data.metrics].sort((a,b)=>b.rank-a.rank)[0];
 $('strongest').textContent=highest.name+' · '+fmt(highest.score);
 $('bestRank').textContent='#'+best[0].rank+' · '+best.filter(x=>x.rank===best[0].rank).map(x=>x.name).join(' / ');
 $('lowestRank').textContent='#'+worst.rank+' · '+worst.name;
 const root=$('keyInsights');root.replaceChildren();
 for(const [i,statement] of data.overview.analysis_points.entries()){
  const card=el('article');card.className='block';card.append(el('div',String(i+1).padStart(2,'0')),el('h3',['Regional standing','Strong dimensions','Direction of change','Power gap'][i]||'Observation'),el('p',statement));root.append(card);
 }
}
function renderChanges(){
 const root=$('annualRows');root.replaceChildren();
 const records=[...data.annual_change.records].sort((a,b)=>Math.abs(b.score_change)-Math.abs(a.score_change));
 const ceiling=Math.max(1,...records.map(x=>Math.abs(x.score_change)));
 for(const m of records){
  const row=el('div');row.className='annual-row';
  const title=el('div');title.append(el('strong',m.name),el('div','2025 rank #'+m.rank_2025+' · score '+fmt(m.score_2025)));
  const signedChange=el('div',signed(m.score_change,'pts'));signedChange.className='chg '+(m.score_change>0?'positive':m.score_change<0?'negative':'zero');
  const track=el('div');track.className='annual-mid';track.setAttribute('role','img');track.setAttribute('aria-label',m.name+' score change '+signed(m.score_change)+' points');
  if(m.score_change!==0){
   const segment=el('div');segment.className='annual-segment'+(m.score_change<0?' negative':'');
   const fraction=Math.abs(m.score_change)/ceiling*50;
   segment.style.width=fraction.toFixed(2)+'%';
   segment.style.left=(m.score_change>=0?50:50-fraction).toFixed(2)+'%';track.append(segment);
  }
  const move=el('div',rankMove(m.rank_change));move.className='rank-move';
  row.append(title,track,signedChange,move);
  root.append(row);
 }
}
function metricOrder(){
 const order=$('scoreSort').value;
 return [...data.metrics].sort((a,b)=>order==='score'?b.score-a.score:order==='name'?a.name.localeCompare(b.name):a.rank-b.rank||b.score-a.score);
}
function selectMetric(id){
 selectedMetric=id;
 for(const card of $('measureCards').children)card.setAttribute('aria-pressed',String(card.dataset.id===id));
 const m=data.metrics.find(x=>x.id===id);if(!m)return;
 $('selectedMeasure').textContent=m.name+' · #'+m.rank+' · '+fmt(m.score)+'/100';
 $('selectedMeasureDefinition').textContent=m.description;
 $('selectedMeasureInterpretation').textContent=m.interpretation+' 2025 score change: '+signed(m.score_change,'points')+'; rank movement: '+rankMove(m.rank_change)+'.';
 $('measureSource').href=m.source_url||sourceUrl;
}
function renderScores(){
 const root=$('measureCards');root.replaceChildren();
 for(const m of metricOrder()){
  const card=el('button');card.type='button';card.className='measure';card.dataset.id=m.id;
  const top=el('div');top.className='measure-top';
  const name=el('div');name.append(el('h3',m.name),el('div','Rank #'+m.rank+' of '+data.overview.comprehensive_power.universe));name.lastChild.className='rank';
  const score=el('div',fmt(m.score));score.className='score';
  top.append(name,score);card.append(top);
  const bar=el('div');bar.className='bar';const fill=el('span');fill.style.width=Math.max(0,Math.min(100,m.score))+'%';bar.append(fill);card.append(bar);
  const desc=el('p',m.description);desc.className='description';card.append(desc);
  card.addEventListener('click',()=>selectMetric(m.id));
  root.append(card);
 }
 selectMetric(data.metrics.some(x=>x.id===selectedMetric)?selectedMetric:metricOrder()[0].id);
}
function view(){return data.influence.views[direction];}
function selectCountry(name){
 activeCountry=name;
 const v=view(),item=v.records.find(x=>x.name===name);if(!item)return;
 $('selectedCountry').textContent=name;
 $('selectedPercent').textContent=fmt(item.percent)+'%';
 $('influenceDenominator').textContent=v.denominator;
 $('selectedMeaning').textContent=direction==='into_indonesia'?
  name+' represented '+fmt(item.percent)+'% of Indonesia’s bilateral trade in 2024.':
  'Indonesia accounted for '+fmt(item.percent)+'% of '+name+'’s bilateral trade in 2024.';
 for(const row of $('countryList').children)row.setAttribute('aria-pressed',String(row.dataset.country===name));
}
function renderInfluence(){
 const v=view();
 $('intoCountry').setAttribute('aria-pressed',String(direction==='into_indonesia'));
 $('fromCountry').setAttribute('aria-pressed',String(direction==='indonesia_influence'));
 $('influenceTitle').textContent=v.title;$('influenceSubtitle').textContent=v.subtitle;
 const root=$('countryList');root.replaceChildren();
 const max=Math.max(...v.records.map(x=>x.percent));
 for(const [i,item] of v.records.entries()){
  const button=el('button');button.type='button';button.className='country';button.dataset.country=item.name;
  const top=el('div');top.className='country-top';top.append(el('span',(i+1)+'. '+item.name),el('strong',fmt(item.percent)+'%'));button.append(top);
  const bar=el('div');bar.className='bar';const fill=el('span');fill.style.width=(item.percent/max*100).toFixed(1)+'%';bar.append(fill);button.append(bar);
  button.addEventListener('click',()=>selectCountry(item.name));root.append(button);
 }
 const selected=v.records.some(x=>x.name===activeCountry)?activeCountry:v.records[0].name;
 selectCountry(selected);
}
async function start(){
 document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>tabChange(button.dataset.tab)));
 window.addEventListener('hashchange',()=>tabChange(location.hash.slice(1),false));
 $('goScores').addEventListener('click',e=>{e.preventDefault();tabChange('scores');$('scores').scrollIntoView?.({block:'start'})});
 $('scoreSort').addEventListener('change',renderScores);
 $('intoCountry').addEventListener('click',()=>{direction='into_indonesia';activeCountry=null;renderInfluence()});
 $('fromCountry').addEventListener('click',()=>{direction='indonesia_influence';activeCountry=null;renderInfluence()});
 tabChange(location.hash.slice(1),false);
 try{
  const res=await fetch('./data/sli-indonesia-power-profile.json',{cache:'no-store'});if(!res.ok)throw Error('HTTP '+res.status);
  const incoming=await res.json();
  if(!Array.isArray(incoming.metrics)||incoming.metrics.length!==8||!incoming.influence?.views?.into_indonesia?.records?.length||!incoming.influence?.views?.indonesia_influence?.records?.length)throw Error('Incomplete profile source');
  data=incoming;renderOverview();renderChanges();renderScores();renderInfluence();
 }catch(err){
  $('powerSummary').textContent='The source-attributed country profile could not be loaded. Please refresh the page or read the original Lowy Institute source.';
  $('annualRows').textContent='Data temporarily unavailable.';$('measureCards').textContent='Data temporarily unavailable.';$('countryList').textContent='Data temporarily unavailable.';
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();