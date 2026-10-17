/* BPS 2024/2025 crime statistical monitor — no synthetic safety scores. */
(function(){
'use strict';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const node=(tag,t)=>{const n=document.createElement(tag);if(t!==undefined)n.textContent=String(t);return n;};
const svg=(tag,a={})=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(a))n.setAttribute(k,String(v));return n;};
const form=(n,d=2)=>Number(n).toLocaleString('en-US',{maximumFractionDigits:d});
const definitions={police:'Police-registered crimes: includes reported and police-detected incidents, by Polda jurisdiction (not 38 provinces).',susenas:'Susenas: sampled people reporting victimization or perceptions, by administrative province; sample uncertainty applies.',podes:'Podes: villages/kelurahan where mass conflict occurred, not number of incidents, by administrative province.'};
let dataset=null,family='susenas',indicator='victim_prevalence_pct',year=2024,area='Jawa Barat';
const matching=()=>dataset.metrics.filter(m=>m.family===family);
const active=()=>dataset.metrics.find(m=>m.id===indicator);
const areas=()=>family==='police'?dataset.police_districts:dataset.provinces;
const getName=a=>a.jurisdiction||a.name;
const byName=name=>areas().find(x=>getName(x)===name);
const numbers=a=>{const m=active();return a?a[m.field]:null;};
const val=(a,yr=year)=>{const m=active();if(!a||!m)return null;const arr=numbers(a);const at=m.years.indexOf(+yr);if(at<0)return null;const raw=Array.isArray(arr)?arr[at]:arr;return raw==null||!Number.isFinite(raw)?null:raw};
const pretty=v=>v==null?'N/A':indicator.endsWith('_pct')||indicator==='worried_night_pct'||indicator==='not_worried_night_pct'?form(v,2)+'%':form(v,indicator==='recorded_rate_100k'?0:0);
function chart(root,years,values,name){
 root.replaceChildren();root.setAttribute('aria-label','BPS '+active().label+' for '+name+'; historical '+years.join(', '));
 const found=values.map((v,i)=>({v,y:years[i]})).filter(x=>x.v!=null&&Number.isFinite(x.v)),left=75,right=28,top=23,bottom=40,width=620,height=230;
 if(!found.length){const t=svg('text',{x:21,y:120});t.textContent='Source value unavailable';root.append(t);return}
 const min=Math.min(...found.map(x=>x.v)),max=Math.max(...found.map(x=>x.v)),pad=(max-min)*.18||Math.max(.05,Math.abs(min)*.08);
 const lo=min-pad,hi=max+pad,xAt=x=>left+(x-years[0])/Math.max(1,years.at(-1)-years[0])*(width-left-right),yAt=v=>top+(hi-v)/(hi-lo)*(height-top-bottom);
 root.append(svg('line',{x1:left,y1:height-bottom,x2:width-right,y2:height-bottom,stroke:'#4d7180'}));
 let run=[];const flush=()=>{if(run.length>1)root.append(svg('polyline',{points:run.map(x=>xAt(x.y)+','+yAt(x.v)).join(' '),class:'line'}));run=[]};
 for(const [i,yr] of years.entries()){
  const v=values[i],tx=svg('text',{x:xAt(yr),y:height-13,'text-anchor':'middle'});tx.textContent=String(yr);root.append(tx);
  if(v==null){flush();continue}run.push({y:yr,v});
 }flush();
 for(const item of found){const dot=svg('circle',{cx:xAt(item.y),cy:yAt(item.v),r:5,class:'dot'});const title=svg('title');title.textContent=item.y+': '+form(item.v,2);dot.append(title);root.append(dot)}
 for(const v of [lo,hi]){const t=svg('text',{x:left-9,y:yAt(v)+4,'text-anchor':'end'});t.textContent=form(v,Math.abs(v)<100?1:0);root.append(t)}
}
function refreshControls(){
 const m=$('safMetric');m.replaceChildren();for(const a of matching()){const o=node('option',a.label);o.value=a.id;m.append(o)}if(!matching().some(x=>x.id===indicator))indicator=matching()[0].id;m.value=indicator;
 const all=active().years;if(!all.includes(year))year=all.at(-1);
 const y=$('safYear');y.replaceChildren();for(const j of all){const o=node('option',j);o.value=String(j);y.append(o)}y.value=String(year);
 const areaOptions=$('safArea');areaOptions.replaceChildren();
 for(const a of areas()){const o=node('option',getName(a));o.value=getName(a);areaOptions.append(o)}
 if(!byName(area))area='Jawa Barat';if(!byName(area))area=getName(areas()[0]);
 areaOptions.value=area;$('safAreaScope').textContent=family==='police'?'34 Polda':'38 provinces';
}
function filtered(){
 const q=$('safSearch').value.trim().toLowerCase();let list=areas().filter(a=>getName(a).toLowerCase().includes(q));
 if($('safSort').value==='value')list.sort((a,b)=>(val(b)??-Infinity)-(val(a)??-Infinity)||getName(a).localeCompare(getName(b)));
 else list.sort((a,b)=>getName(a).localeCompare(getName(b)));
 return list;
}
function drawList(){
 const root=$('safAreaBars');root.replaceChildren();
 const rows=filtered(),cap=Math.max(1,...rows.map(x=>Math.abs(val(x)??0)));
 for(const a of rows){
  const v=val(a),button=node('button');button.type='button';button.className='saf-row';button.setAttribute('aria-pressed',String(getName(a)===area));
  const head=node('div');head.className='head';head.append(node('span',getName(a)),node('strong',pretty(v)));button.append(head);
  const track=node('div');track.className='track';const fill=node('div');fill.className='fill';fill.style.width=(v==null?0:Math.abs(v)/cap*100).toFixed(2)+'%';track.append(fill);button.append(track);
  button.addEventListener('click',()=>{area=getName(a);$('safArea').value=area;render()});
  root.append(button);
 }
 if(!rows.length)root.append(node('p','No areas match that search.'));
 $('safCount').textContent=rows.length+' of '+areas().length+' areas · '+year+' · '+active().unit+'. Numerical sorting shows observed values, not an SLI safety ranking.';
}
function national(){
 const n=dataset.national;
 const stats=[
 ["Police-recorded incidents · 2024",form(n.police_cases[1],0),"Recorded events · Polri"],
 ["Recorded crime rate · 2024",form(n.police_rate_100k[1],0),"Per 100,000 population · Polri"],
 ["Victim prevalence · 2024",form(n.victim_prevalence_pct[1],2)+'%',"% of population · Susenas"],
 ["Victims who reported · 2024",form(n.victim_reporting_pct[1],2)+'%',"% of victims · Susenas"]
 ];
 const root=$('safSummary');root.replaceChildren();
 for(const [title,value,footer] of stats){const card=node('div');card.className='saf-kpi';card.append(node('small',title));const big=node('div',value);big.className='num';card.append(big,node('span',footer));root.append(card)}
}
function render(){
 if(!dataset)return;const a=byName(area),m=active(),arr=numbers(a),index=m.years.indexOf(year),v=val(a),past=index>0?arr[index-1]:null;
 $('safSelectedArea').textContent=area+(family==='police'?' · Polda jurisdiction':' · Province');
 $('safMetricTitle').textContent=m.label;$('safValue').textContent=pretty(v);$('safUnitYear').textContent=m.unit+' · '+year;
 $('safStatus').textContent='Observed '+year+' · BPS '+m.appendix;
 const change=v==null||past==null?null:v-past;
 $('safChange').textContent=change==null?'N/A':(change>0?'+':'')+form(change,indicator.includes('_pct')?2:0)+(indicator.includes('_pct')?' pp':'');
 $('safChangeContext').textContent=index===0?'Only one or first period / N/A':m.years[index-1]+' to '+year+(change==null?' · source gap':' · absolute difference'+(indicator.includes('_pct')?' in percentage points':''));
 $('safSourceLink').href=dataset.source_url;
 $('safSourceLabel').textContent='BPS, '+dataset.publication+' · Appendix '+m.appendix+' · PDF page '+m.pdf_page+' · underlying source: '+dataset.source_groups[family];
 $('safCaveat').textContent=definitions[family]+' '+(family==='police'?'Polda Metro Jaya and Papua jurisdictions cannot be treated as individual administrative provinces.':family==='susenas'?'Reported police totals and sampled victim experience are not directly comparable.':'Podes 2021 does not include all newly created Papua provinces; N/A is not zero.');
 chart($('safTrend'),m.years,Array.isArray(arr)?arr:[arr],area);
 drawList();
}
function csvEscape(v){const text=String(v??'');return '"'+(text.startsWith('=')||text.startsWith('+')||text.startsWith('-')||text.startsWith('@')?"'":'')+text.replaceAll('"','""')+'"'}
function exportCSV(){
 const m=active(),head=['area','geography','source','indicator','year','value','unit','status','appendix','pdf_page','source_url'],rows=[head];
 for(const a of filtered()){const v=val(a);rows.push([getName(a),family==='police'?'Polda jurisdiction':'administrative province',family,m.id,year,v==null?'':v,m.unit,v==null?'not_available':'observed_historical',m.appendix,m.pdf_page,dataset.source_url])}
 const csv='\uFEFF'+rows.map(r=>r.map(csvEscape).join(',')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob);
 const link=node('a');link.href=url;link.download='sli-bps-safety-'+m.id+'-'+year+'.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function changeSource(){family=$('safFamily').value;indicator=family==='police'?'recorded_cases':family==='podes'?'village_mass_conflict_pct':'victim_prevalence_pct';year=2024;$('safSearch').value='';refreshControls();render()}
async function init(){
 try{const r=await fetch('./data/sli-bps-public-safety.json',{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();if(data.schema!=='sli-bps-public-safety-v1'||data.police_districts?.length!==34||data.provinces?.length!==38||data.metrics?.length<8)throw Error('Data integrity failed');
 dataset=data;
 $('safFamily').addEventListener('change',changeSource);
 $('safMetric').addEventListener('change',()=>{indicator=$('safMetric').value;year=active().years.at(-1);refreshControls();render()});
 $('safYear').addEventListener('change',()=>{year=Number($('safYear').value);render()});
 $('safArea').addEventListener('change',()=>{area=$('safArea').value;render()});
 $('safSearch').addEventListener('input',drawList);
 $('safSort').addEventListener('change',drawList);
 $('safDownload').addEventListener('click',exportCSV);
 national();refreshControls();render();
 }catch(e){$('safAreaBars').textContent='Published dataset could not be loaded; no estimates displayed.';$('safStatus').textContent='Data unavailable';$('safValue').textContent='N/A';$('safChange').textContent='N/A';$('safSummary').textContent='Safety statistics unavailable. Try reloading and consult BPS publication.'}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();