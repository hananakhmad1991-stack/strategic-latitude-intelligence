/* Official BPS regional selected-data explorer. No artificial risk scores. */
(function(){
'use strict';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const el=(name,txt)=>{const e=document.createElement(name);if(txt!==undefined)e.textContent=String(txt);return e;};
const sv=(tag,attributes)=>{const x=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attributes||{}))x.setAttribute(key,String(value));return x;};
const nf=(value,digits=2)=>Number(value).toLocaleString('en-US',{maximumFractionDigits:digits});
const ECON={grdp_current:'GRDP · current prices',grdp_constant:'GRDP · constant 2010 prices',household_current:'Household consumption',pmtb_current:'Gross fixed capital formation (PMTB)',real_growth:'Real GRDP growth (derived)',pmtb_share:'PMTB / nominal GRDP (derived)'};
const CIVIC={press_freedom:'Press Freedom Index (Dewan Pers)',dpt_2024:'Pilkada registered voters (DPT)',dpt_female:'Female share of registered voters (derived)'};
let DATA=null;
const opts={family:'economy',metric:'grdp_current',year:2025,province:12};
const listing=()=>Object.entries(opts.family==='economy'?ECON:CIVIC);
const years=()=>opts.metric==='press_freedom'?DATA.press_years:opts.family==='civic'?[2024]:opts.metric==='real_growth'?[2022,2023,2024,2025]:DATA.grdp_years;
const source=()=>DATA.sources[opts.family==='economy'?'pdrb':'politics'];
const values=(province,metric=opts.metric)=> {
 if(!province)return [];
 const yrs=metric==='press_freedom'?DATA.press_years:metric==='dpt_2024'||metric==='dpt_female'?[2024]:DATA.grdp_years;
 const result=yrs.map((year,i)=>{
  if(metric==='dpt_2024')return province.dpt_2024?.[2]??null;
  if(metric==='dpt_female'){const n=province.dpt_2024?.[2];return n&&province.dpt_2024?.[1]!=null?100*province.dpt_2024[1]/n:null}
  if(metric==='real_growth'){
   const arr=province.grdp_constant||[];if(i===0||arr[i]==null||arr[i-1]==null||!arr[i-1])return null;
   return 100*(arr[i]/arr[i-1]-1);
  }
  if(metric==='pmtb_share'){
   const a=province.pmtb_current?.[i],b=province.grdp_current?.[i];
   return a!=null&&b>0?100*a/b:null;
  }
  return province[metric]?.[i]??null;
 });
 return metric==='real_growth'?result.slice(1):result;
};
const selected=()=>DATA?.provinces.find(p=>p.id===Number(opts.province));
const unit=()=>opts.metric==='press_freedom'?'index points':opts.metric==='dpt_2024'?'registered persons':['real_growth','pmtb_share','dpt_female'].includes(opts.metric)?'%':'IDR billion';
function format(v){if(v==null||!Number.isFinite(v))return 'N/A';if(opts.metric==='dpt_2024')return nf(v,0)+' people';if(opts.metric==='press_freedom')return nf(v,2);if(['real_growth','pmtb_share','dpt_female'].includes(opts.metric))return nf(v,2)+'%';return 'Rp'+nf(v,2)+' bn';}
function plot(node,yearList,series,alt){
 node.replaceChildren();node.setAttribute('aria-label',alt);
 const w=620,h=250,left=61,right=24,top=26,bottom=39;
 const clean=yearList.map((year,i)=>({year,value:series[i]})).filter(x=>x.value!=null&&Number.isFinite(x.value));
 if(!clean.length){const t=sv('text',{x:24,y:120});t.textContent='No comparable observation';node.append(t);return}
 const minV=Math.min(...clean.map(x=>x.value)),maxV=Math.max(...clean.map(x=>x.value));
 const pad=(maxV-minV)*.15||Math.max(1,Math.abs(maxV)*.02);
 const low=minV-pad,high=maxV+pad;
 const xFor=year=>left+(year-yearList[0])/Math.max(1,yearList.at(-1)-yearList[0])*(w-left-right);
 const yFor=value=>top+(high-value)/(high-low)*(h-top-bottom);
 node.append(sv('line',{x1:left,y1:h-bottom,x2:w-right,y2:h-bottom,class:'axis'}));
 for(const year of yearList){const tx=sv('text',{x:xFor(year),y:h-13,'text-anchor':'middle'});tx.textContent=year;node.append(tx)}
 for(const amount of [minV,maxV]){const y=yFor(amount),t=sv('text',{x:left-8,y:y+4,'text-anchor':'end'});t.textContent=nf(amount,amount<100?1:0);node.append(t)}
 // Only connect observations with consecutive years. Missing data leave real gaps, not imputed values.
 let segment=[];
 const draw=()=>{if(segment.length>1)node.append(sv('polyline',{points:segment.map(o=>xFor(o.year)+','+yFor(o.value)).join(' ')}));segment=[]};
 for(const [i,year] of yearList.entries()){
  const value=series[i];
  if(value==null||!Number.isFinite(value)){draw();continue}
  segment.push({year,value});
 }
 draw();
 for(const item of clean){const c=sv('circle',{cx:xFor(item.year),cy:yFor(item.value),r:5});const title=sv('title');title.textContent=item.year+': '+nf(item.value,2);c.append(title);node.append(c)}
}
function changeFamily(){
 opts.family=$('regFamily').value;
 opts.metric=opts.family==='economy'?'grdp_current':'press_freedom';
 $('regOrder').value='alpha';
 drawOptions();render();
}
function drawOptions(){
 const metrics=$('regMetric');metrics.replaceChildren();
 for(const [id,label] of listing()){const o=el('option',label);o.value=id;metrics.append(o)}
 metrics.value=opts.metric;
 const allowed=years();if(!allowed.includes(opts.year))opts.year=allowed.at(-1);
 const yrs=$('regYear');yrs.replaceChildren();for(const year of allowed){const o=el('option',year);o.value=String(year);yrs.append(o)}yrs.value=String(opts.year);
}
function compareRows(){
 const q=$('regSearch').value.trim().toLowerCase();
 const rows=DATA.provinces.filter(p=>p.name.toLowerCase().includes(q))
  .map(p=>({p,value:values(p)[years().indexOf(opts.year)]??null}));
 if($('regOrder').value==='value')rows.sort((a,b)=>(b.value??-Infinity)-(a.value??-Infinity)||a.p.name.localeCompare(b.p.name));
 else rows.sort((a,b)=>a.p.name.localeCompare(b.p.name));
 return rows;
}
function drawCompare(){
 const root=$('regProvinceBars');root.replaceChildren();
 const all=compareRows(),max=Math.max(1,...all.filter(x=>x.value!=null).map(x=>Math.abs(x.value)));
 for(const {p,value} of all){
  const b=el('button');b.type='button';b.className='regbar';b.setAttribute('aria-pressed',String(opts.province===p.id));
  const top=el('div');top.className='regbar-top';top.append(el('span',p.name),el('strong',format(value)));b.append(top);
  const track=el('div');track.className='regbar-track';const fill=el('div');fill.className='regbar-fill';fill.style.width=(value==null?0:100*Math.abs(value)/max).toFixed(2)+'%';track.append(fill);b.append(track);
  b.addEventListener('click',()=>{opts.province=p.id;$('regProvince').value=String(p.id);render()});root.append(b);
 }
 if(!all.length){const msg=el('p','No matching province. Try a different search.');msg.className='empty';root.append(msg)}
 $('regResultCount').textContent=all.length+' of '+DATA.provinces.length+' provinces · '+opts.year+' · '+(source()?.title||'BPS');
}
function render(){
 if(!DATA)return;
 const p=selected()||DATA.provinces[0];const series=values(p);const yr=years(),idx=yr.indexOf(opts.year),v=series[idx]??null;
 const previous=idx>0?series[idx-1]:null;
 $('regSelectedTitle').textContent=p.name+' · '+listing().find(([k])=>k===opts.metric)?.[1];
 $('regCurrentLabel').textContent=listing().find(([k])=>k===opts.metric)?.[1]||'Value';
 $('regCurrentValue').textContent=format(v);
 $('regCurrentPeriod').textContent=String(opts.year)+' · '+unit()+' · '+(opts.family==='economy'?'BPS accounts':'BPS Politik');
 $('regChangeLabel').textContent=opts.metric==='dpt_2024'||opts.metric==='dpt_female'?'Observation':'Year-on-year change';
 let change=previous!=null&&v!=null?(['press_freedom','real_growth','pmtb_share'].includes(opts.metric)?(v-previous):previous!==0?(100*(v/previous-1)):null):null;
 $('regChangeValue').textContent=change==null?'N/A':(change>0?'+':'')+nf(change,2)+(['press_freedom','real_growth','pmtb_share'].includes(opts.metric)?' pts':'%');
 $('regChangePeriod').textContent=previous==null?'No directly comparable prior observation':(yr[idx-1]+' → '+opts.year);
 $('regDataStatus').textContent=opts.family==='economy'?(opts.year===2025?'Preliminary **':opts.year===2024?'Revised *':'Published actual'):'Published historical';
 $('regPrimarySource').href=source().url;
 $('regPrimarySource').textContent='BPS publication · '+source().released+' ↗';
 $('regSummary').textContent=opts.family==='economy'?
 'Provincial expenditure accounts, '+(DATA.metrics[opts.metric]?.appendix?'BPS appendix '+DATA.metrics[opts.metric].appendix:'derived using BPS published province data')+'. PMTB / GRDP is a derived account ratio, not realized investment from BKPM. Provincial boundary changes in Papua affect some historical comparisons.':
 'Historical civic and institutional observations. Index figures are sourced, not SLI political risk assessments. DPT records eligible registered voters for provincial elections, not votes cast.';
 if(['real_growth','pmtb_share','dpt_female'].includes(opts.metric))$('regSummary').textContent+=' This selected percentage is calculated from BPS source values.';
 $('regSeriesNote').textContent='BPS source observation years: '+yr.join(', ')+'. Values with missing source entries are not imputed.';
 plot($('regTrend'),yr,series,p.name+' '+opts.metric+' by source year');
 drawCompare();
}
function showIDI(){
 const years=DATA.idi.map(x=>x.year),values=DATA.idi.map(x=>x.national);
 plot($('regIDITrend'),years,values,'BPS national Indonesia Democracy Index (IDI) 2021–2024');
}
function csvEscape(value){const s=String(value??'');return '"'+(s.startsWith('=')||s.startsWith('+')||s.startsWith('-')||s.startsWith('@')?"'":"")+s.replaceAll('"','""')+'"'}
function exportCsv(){
 if(!DATA)return;
 const head=['province','year','indicator','value','unit','status','publisher','source_url'];
 const rows=[head];
 for(const {p,value} of compareRows()){rows.push([p.name,opts.year,opts.metric,value??'',unit(),opts.family==='economy'?(opts.year===2025?'provisional':opts.year===2024?'revised':'observed'):'observed',source().publisher,source().url])}
 const csv='\uFEFF'+rows.map(row=>row.map(csvEscape).join(',')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob);
 const a=el('a');a.href=url;a.download='sli-bps-'+opts.metric+'-'+opts.year+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function start(){
 try{
  const r=await fetch('./data/sli-bps-regional-intelligence.json',{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);
  const d=await r.json();
  if(d.schema!=='sli-bps-regional-intelligence-v1'||d.provinces?.length!==38||d.idi?.length!==4)throw Error('Invalid regional dataset');
  DATA=d;
  const sel=$('regProvince');sel.replaceChildren();for(const p of DATA.provinces){const o=el('option',p.name);o.value=String(p.id);sel.append(o)}
  opts.province=12;sel.value=String(opts.province);
  $('regFamily').addEventListener('change',changeFamily);
  $('regMetric').addEventListener('change',()=>{opts.metric=$('regMetric').value;opts.year=years().at(-1);drawOptions();render()});
  $('regYear').addEventListener('change',()=>{opts.year=Number($('regYear').value);render()});
  sel.addEventListener('change',()=>{opts.province=Number(sel.value);render()});
  $('regSearch').addEventListener('input',drawCompare);
  $('regOrder').addEventListener('change',drawCompare);
  $('regExport').addEventListener('click',exportCsv);
  drawOptions();showIDI();render();
 }catch(e){$('regSummary').textContent='Regional dataset unavailable: '+e.message;$('regProvinceBars').textContent='Data could not be loaded. Please refresh the page.';$('regDataStatus').textContent='Unavailable'}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();