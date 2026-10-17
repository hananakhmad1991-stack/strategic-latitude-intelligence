/* SLI official BPS expenditure inequality explorer: March 2026. 
   Region summaries are province-distribution descriptions, never regional Gini. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const el=(t,s)=>{const node=document.createElement(t);if(s!==undefined)node.textContent=String(s);return node;};
const f=x=>typeof x==='number'&&Number.isFinite(x)?x.toFixed(3):'N/A';
const AREA={combined:'Urban + rural',urban:'Urban',rural:'Rural'};
let DATA=null,metric='combined',region='',query='',order='desc',selected='DKI Jakarta';
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const med=xs=>{const arr=xs.filter(finite).sort((a,b)=>a-b);return arr.length?(arr[Math.floor((arr.length-1)/2)]+arr[Math.floor(arr.length/2)])/2:null;};
function link(url,text){const a=el('a',text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function groups(){
 const map=new Map();
 for(const p of DATA.provinces){if(!map.has(p.region))map.set(p.region,[]);map.get(p.region).push(p);}
 return [...map].map(([name,ps])=>{const vals=ps.map(p=>p[metric]).filter(finite);return {name,count:ps.length,available:vals.length,median:med(vals),minimum:vals.length?Math.min(...vals):null,maximum:vals.length?Math.max(...vals):null,provinces:ps};});
}
function header(){
 $('giniNational').textContent=f(DATA.national.combined);
 $('giniUrban').textContent=f(DATA.national.urban);
 $('giniRural').textContent=f(DATA.national.rural);
 $('giniPeriod').textContent='Observed '+DATA.measurement_period+' · released '+DATA.published_at;
 const h=DATA.national.history;
 $('giniChange').textContent='National change: '+(h[2].combined-h[1].combined>=0?'+':'')+(h[2].combined-h[1].combined).toFixed(3)+' points since Sep 2025 · '+(h[2].combined-h[0].combined).toFixed(3)+' since Mar 2025';
 const host=$('nationalHistory');host.replaceChildren();
 for(const type of ['combined','urban','rural']){
  const item=el('div');item.className='time-row';
  item.append(el('strong',AREA[type]));
  const bars=el('div');bars.className='time-bars';
  for(const point of h){
   const wrap=el('div');wrap.className='time-col';
   const bar=el('div');bar.className='time-bar';bar.style.height=(point[type]/0.55*100).toFixed(2)+'%';bar.title=point.period+' · '+f(point[type]);
   wrap.append(el('span',f(point[type])),bar,el('small',point.period));bars.append(wrap);
  }
  item.append(bars);host.append(item);
 }
}
function renderRegion(){
 const host=$('regionOverview');host.replaceChildren();
 for(const g of groups()){
  const b=el('button');b.type='button';b.className='region-item';b.setAttribute('aria-pressed',String(region===g.name));b.addEventListener('click',()=>{region=region===g.name?'':g.name;$('region').value=region;render();});
  const r=el('div');r.className='rhead';r.append(el('strong',g.name),el('span',g.available+' / '+g.count+' provinces'));
  const v=el('div');v.className='rval';v.append(el('strong',f(g.median)),el('span','Provincial median · range '+f(g.minimum)+'–'+f(g.maximum)));
  const track=el('div');track.className='rtrack';
  const band=el('span');band.className='rband';
  band.style.left=((g.minimum??0)/.55*100)+'%';band.style.width=Math.max(0,((g.maximum??0)-(g.minimum??0))/.55*100)+'%';
  const mark=el('span');mark.className='rmark';mark.style.left=((g.median??0)/.55*100)+'%';
  track.append(band,mark);b.append(r,v,track);host.append(b);
 }
 $('regionDescription').textContent='Seven island-area groupings · source values are provincial BPS '+AREA[metric].toLowerCase()+' Gini · median/range summarize the observed provinces, NOT the Gini of a regional population.';
}
function provinces(){
 return DATA.provinces.filter(p=>(!region||p.region===region)&&(!query||p.name.toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>{
  const x=a[metric],y=b[metric];
  if(!finite(x))return 1;if(!finite(y))return -1;
  return (order==='desc'?y-x:x-y)||a.name.localeCompare(b.name);
 });
}
function renderProvinces(){
 const host=$('provinceRows');host.replaceChildren();const list=provinces();
 $('resultCount').textContent=list.length+' province(s) shown';
 for(const p of list){
  const tr=el('tr');tr.tabIndex=0;tr.setAttribute('aria-selected',String(selected===p.name));
  const label=el('td');const choose=el('button',p.name);choose.className='textbutton';choose.addEventListener('click',()=>{selected=p.name;renderProvinces();renderSelected();});
  label.append(choose);tr.append(label);
  for(const field of ['region','combined','urban','rural']){
   const td=el('td',field==='region'?p.region:f(p[field]));if(field===metric)td.className='focus-value';tr.append(td);
  }
  const bar=el('td');const track=el('div');track.className='tinytrack';
  if(finite(p[metric])){const mark=el('span');mark.style.width=(p[metric]/.55*100).toFixed(2)+'%';track.append(mark);}bar.append(track);tr.append(bar);host.append(tr);
 }
 if(!list.length){const tr=el('tr'),td=el('td','No matching provinces.');td.colSpan=6;tr.append(td);host.append(tr);}
}
function renderSelected(){
 const panel=$('provinceDetail');panel.replaceChildren();
 const p=DATA.provinces.find(x=>x.name===selected);
 if(!p){panel.append(el('p','Choose a province from the table.'));return;}
 const title=el('div');title.className='detail-title';title.append(el('h3',p.name),el('span',p.region+' · BPS Susenas March 2026'));panel.append(title);
 const grid=el('div');grid.className='detailgrid';
 for(const key of ['combined','urban','rural']){
   const item=el('div');item.className='detailmetric';item.append(el('small',AREA[key]),el('strong',f(p[key])));
   const caption=el('span',finite(p[key])?(p[key]>=DATA.national[key]?'At or above':'Below')+' national '+AREA[key].toLowerCase()+' Gini':'Not reported');item.append(caption);grid.append(item);
 }
 panel.append(grid);
 const status=el('p','Difference from national combined Gini: '+(p.combined-DATA.national.combined>=0?'+':'')+(p.combined-DATA.national.combined).toFixed(3)+' points. Comparisons reflect different underlying populations; higher or lower inequality is not automatically better purchasing power or a causal investment signal.');
 status.className='small';panel.append(status);
}
function render(){
 if(!DATA)return;
 renderRegion();renderProvinces();renderSelected();
 $('viewName').textContent=AREA[metric];
}
function download(){
 const cols=['province','region_sli_group','gini_combined','gini_urban','gini_rural','observation','bps_source'];
 const rows=[cols.join(',')];
 for(const p of provinces())rows.push([p.name,p.region,p.combined,p.urban??'',p.rural??'',DATA.measurement_period,DATA.sources[0].url].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(','));
 const blob=new Blob([rows.join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='sli-bps-gini-march-2026-provinces.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function start(){
 $('area').addEventListener('change',e=>{metric=e.target.value;render();});
 $('region').addEventListener('change',e=>{region=e.target.value;render();});
 $('search').addEventListener('input',e=>{query=e.target.value;renderProvinces();});
 $('sort').addEventListener('change',e=>{order=e.target.value;renderProvinces();});
 $('export').addEventListener('click',download);
 fetch('./data/sli-bps-gini-2026.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(d=>{
  if(d.schema!=='sli-bps-gini-ratio-v1'||d.provinces?.length!==38||new Set(d.provinces.map(p=>p.name)).size!==38||!d.national?.history?.length)throw Error('Incomplete Gini dataset');
  if(d.provinces.some(p=>!finite(p.combined)||p.combined<0||p.combined>1))throw Error('Invalid provincial Gini values');
  // Deep links from the global site search select the exact published province.
  const requested=new URLSearchParams(window.location.search).get('province');
  if(requested&&d.provinces.some(p=>p.name===requested)){
   selected=requested;query=requested;$('search').value=requested;
  }
  DATA=d;header();
  const sel=$('region');for(const g of groups()){const o=el('option',g.name);o.value=g.name;sel.append(o);}
  const source=$('sourceLinks');for(const src of d.sources)source.append(link(src.url,src.title+' ↗'));
  $('giniStatus').textContent='BPS source dated '+d.published_at+' · 38 provincial records · March 2026 · earlier historical periods shown only for national values. New BPS releases must be verified and digitized before the displayed observation changes.';
  render();
 }).catch(err=>{$('giniStatus').textContent='BPS Gini source data unavailable: '+err.message+'. Values and charts were not imputed.';$('provinceDetail').textContent='Dataset unavailable.';});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();