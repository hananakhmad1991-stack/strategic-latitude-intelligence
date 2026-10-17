/* Strategic Latitude Intelligence — Lowy 2025 Indonesia country profile.
   Values are attributed published snapshots, not new SLI risk ratings. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const el=(tag,txt)=>{const node=document.createElement(tag);if(txt!==undefined)node.textContent=String(txt);return node;};
const fmt=(n,d=1)=>new Intl.NumberFormat('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
const signed=(n,unit='')=>n>0?'+'+fmt(n)+(unit?' '+unit:''):n<0?'−'+fmt(Math.abs(n))+(unit?' '+unit:''):'No change';
const rankMove=n=>n>0?'↑ '+n+' places':n<0?'↓ '+Math.abs(n)+' places':'No change';
let data=null,tab='overview',direction='into_indonesia',activeCountry=null,selectedMetric=null,detailIndex=null,drillStage='submeasures',selectedSub=null,selectedIndicator=null;
const sourceUrl='https://power.lowyinstitute.org/countries/indonesia/';
function tabChange(t,write=true){
 t=String(t).split('/')[0];
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
function selectMetric(id,changeUrl=false){
 selectedMetric=id;
 for(const card of $('measureCards').children)card.setAttribute('aria-pressed',String(card.dataset.id===id));
 const m=data.metrics.find(x=>x.id===id);if(!m)return;
 $('selectedMeasure').textContent=m.name+' · #'+m.rank+' · '+fmt(m.score)+'/100';
 $('selectedMeasureDefinition').textContent=m.description;
 $('selectedMeasureInterpretation').textContent=m.interpretation+' 2025 score change: '+signed(m.score_change,'points')+'; rank movement: '+rankMove(m.rank_change)+'.';
 $('measureSource').href=m.source_url||sourceUrl;
 drillStage='submeasures';selectedSub=null;selectedIndicator=null;renderDrill();if(changeUrl){writeDrillUrl();$('drillExplorer').scrollIntoView?.({block:'start'})}
}

const currentDetail=()=>detailIndex?.measures?.find(x=>x.id===selectedMetric);
const currentSub=()=>currentDetail()?.parts.find(x=>x.id===selectedSub);
function writeDrillUrl(){
 const suffix=[selectedMetric,selectedSub,selectedIndicator===null?null:String(selectedIndicator)].filter(x=>x!==null&&x!==undefined).join('/');
 const hash='#scores'+(suffix?'/'+suffix:'');
 if(window.history?.pushState)window.history.pushState(null,'',hash);
 else window.history?.replaceState?.(null,'',hash);
}
function selectSub(id,changeUrl=false){
 const part=currentDetail()?.parts.find(x=>x.id===id);if(!part)return;
 selectedSub=id;selectedIndicator=null;drillStage='indicators';renderDrill();
 if(changeUrl){writeDrillUrl();$('drillExplorer').scrollIntoView?.({block:'start'})}
}
function selectIndicator(index,changeUrl=false){
 const part=currentSub();if(!part||!part.indicators[index])return;
 selectedIndicator=index;drillStage='indicator';renderDrill();
 if(changeUrl){writeDrillUrl();$('drillIndicator').scrollIntoView?.({block:'nearest'})}
}
function restoreDrill(){
 if(!data||!detailIndex)return;
 const [view,metric,sub,indicator]=location.hash.slice(1).split('/');
 if(view!=='scores'||!metric)return;
 if(!detailIndex.measures.some(x=>x.id===metric))return;
 selectMetric(metric,false);
 if(sub)selectSub(sub,false);
 if(sub&&indicator!==undefined&&/^\d+$/.test(indicator))selectIndicator(Number(indicator),false);
}
function crumb(label,onClick){
 const b=el('button',label);b.type='button';b.addEventListener('click',onClick);return b;
}
function renderDrill(){
 const status=$('drillStatus'),list=$('drillList'),detailBox=$('drillIndicator'),bread=$('drillBreadcrumb'),back=$('drillBack');
 list.replaceChildren();bread.replaceChildren();detailBox.hidden=true;
 if(!detailIndex){
  $('drillTitle').textContent='Explore underlying indicators';
  $('drillIntro').textContent='Awaiting the published Lowy hierarchy. Scores already displayed above remain available.';
  status.textContent='Detailed indicator catalogue not loaded yet. Open the original Lowy measure page if this remains unavailable.';
  back.hidden=true;return;
 }
 const measure=currentDetail();
 if(!measure){status.textContent='Choose one of the eight measures above.';return}
 const m=data?.metrics.find(x=>x.id===measure.id);
 bread.append(crumb('Eight measures',()=>{tabChange('scores');$('scores').scrollIntoView?.({block:'start'})}));
 bread.append(el('span','›'));
 bread.append(crumb(measure.name,()=>{selectedSub=null;selectedIndicator=null;drillStage='submeasures';renderDrill();writeDrillUrl()}));
 back.hidden=drillStage==='submeasures';
 back.onclick=null;
 // Attach once via onClick property; no duplicate event registrations on re-render.
 if(drillStage==='submeasures'){
  $('drillTitle').textContent=measure.name+' · '+measure.total_submeasures+' sub-measures';
  $('drillIntro').textContent='Lowy’s published 2025 measure: score '+fmt(m?.score??0)+'/100, rank #'+(m?.rank??'N/A')+'. Select a sub-measure to open its indicators.';
  status.textContent='Sub-measure scores are shown only where verified. Unreported values display N/A; this is not zero.';
  for(const part of measure.parts){
   const b=el('button');b.type='button';b.className='drill-option';const wrap=el('div');
   wrap.append(el('strong',part.name),el('small',part.description));
   const aside=el('span',part.verified_indonesia_2025?'#'+part.verified_indonesia_2025.rank+' · '+fmt(part.verified_indonesia_2025.score):part.indicators.length+' indicators');aside.className='micro';
   b.append(wrap,aside,el('span','›'));
   b.addEventListener('click',()=>selectSub(part.id,true));list.append(b);
  }
  return;
 }
 const part=currentSub();if(!part){status.textContent='Choose a valid sub-measure.';return}
 back.hidden=false;
 back.textContent=drillStage==='indicator'?'← All indicators':'← Sub-measures';
 back.onclick=()=>{if(drillStage==='indicator'){selectedIndicator=null;drillStage='indicators'}else{selectedSub=null;drillStage='submeasures'}renderDrill();writeDrillUrl()};
 bread.append(el('span','›'));bread.append(crumb(part.name,()=>{selectedIndicator=null;drillStage='indicators';renderDrill();writeDrillUrl()}));
 $('drillTitle').textContent=part.name+' · '+part.indicators.length+' indicators';
 $('drillIntro').textContent=part.description+'. Click an indicator for its evidence and publication status.';
 const verified=part.verified_indonesia_2025;
 status.textContent=verified?'Indonesia 2025 sub-measure: #'+verified.rank+', '+fmt(verified.score)+'/100. Source: Lowy Institute.':'Indonesia 2025 sub-measure score: N/A (not imported/verified for SLI). Indicator names and structure follow the original Lowy methodology.';
 for(const [i,ind] of part.indicators.entries()){
  const b=el('button');b.type='button';b.className='drill-option';b.setAttribute('aria-pressed',String(i===selectedIndicator));
  const box=el('div');box.append(el('strong',ind.name),el('small',ind.indonesia?'Verified Indonesia 2025 observation':'Official indicator details available from Lowy; SLI value N/A'));
  const side=el('span',ind.indonesia?'#'+ind.indonesia.rank+' · '+fmt(ind.indonesia.score):'N/A');side.className='micro';
  b.append(box,side,el('span','›'));b.addEventListener('click',()=>selectIndicator(i,true));list.append(b);
 }
 if(drillStage!=='indicator'||selectedIndicator===null)return;
 const ind=part.indicators[selectedIndicator];if(!ind)return;
 bread.append(el('span','›'));bread.append(el('span',ind.name));
 detailBox.hidden=false;$('indicatorTitle').textContent=ind.name;
 $('indicatorNumber').textContent=ind.indonesia?ind.indonesia.value:'N/A';
 $('indicatorExplanation').textContent=ind.indonesia?
  'Lowy Indonesia index indicator: normalized score '+fmt(ind.indonesia.score)+'/100, regional rank #'+ind.indonesia.rank+'.':
  'The indicator is part of Lowy’s published methodology. SLI has not imported a source-verified Indonesia value; N/A is not zero and is not an assessment of performance.';
 $('indicatorPeriod').textContent='Lowy Institute Asia Power Index, '+(ind.indonesia?.year||detailIndex.edition)+' edition · '+measure.name+' / '+part.name;
 $('indicatorSource').href=ind.source_url||part.source_url||measure.source_url||sourceUrl;
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
  const desc=el('p',m.description);desc.className='description';card.append(desc);const cta=el('span','Explore sub-measures & indicators →');cta.className='drill-source';card.append(cta);card.setAttribute('aria-label','Explore '+m.name+' sub-measures and indicators');
  card.addEventListener('click',()=>selectMetric(m.id,true));
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
 const onLocation=()=>{tabChange(location.hash.slice(1),false);restoreDrill()};
 window.addEventListener('hashchange',onLocation);
 window.addEventListener('popstate',onLocation);
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
  try{const response=await fetch('./data/sli-indonesia-power-detail.json',{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);const result=await response.json();if(result.measures?.length!==8||result.measures.reduce((n,m)=>n+(m.parts?.length||0),0)!==30)throw Error('Incomplete Lowy hierarchy');detailIndex=result;renderDrill();restoreDrill()}catch(error){$('drillStatus').textContent='Detail catalogue unavailable: '+error.message+'. Use official Lowy source above for the full hierarchy.';}
 }catch(err){
  $('powerSummary').textContent='The source-attributed country profile could not be loaded. Please refresh the page or read the original Lowy Institute source.';
  $('annualRows').textContent='Data temporarily unavailable.';$('measureCards').textContent='Data temporarily unavailable.';$('countryList').textContent='Data temporarily unavailable.';
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();