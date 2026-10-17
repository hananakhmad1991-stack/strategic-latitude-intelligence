/* Indonesia investment-network explorer: publisher-attributed, source-dated, no synthetic geopolitical scores. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const NS='http://www.w3.org/2000/svg';
 const make=(tag,value)=>{const el=document.createElement(tag);if(value!==undefined)el.textContent=String(value);return el;};
 const svg=(tag,attrs={})=>{const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));return el;};
 const formatter=new Intl.NumberFormat('en-US',{maximumFractionDigits:1});
 const money=v=>v>=1?'$'+formatter.format(v)+' bn':'$'+formatter.format(v*1000)+' m';
 const fmtPct=v=>v===null?'Not published':formatter.format(v)+'%';
 const idn=[118.2,-2.4],view={west:59,east:161,north:56,south:-27},W=1000,H=530;
 const point=(lon,lat)=>({x:(lon-view.west)/(view.east-view.west)*W,y:(view.north-lat)/(view.north-view.south)*H});
 let catalog=null,geometry=null,mode='inbound',activeCode=null;
 async function json(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status+' loading '+path);return r.json();}
 function activeView(){return catalog?.views?.[mode];}
 function chosen(){const v=activeView();return v?.records.find(p=>p.code===activeCode)||v?.records[0];}
 const barValue=(v,item)=>v===catalog.views.outbound?item.share_percent:item.value;
 function mapOutline(){
  const root=$('mapShapes');root.replaceChildren();
  if(!geometry?.features?.length){$('mapStatus').textContent='Geographical outlines unavailable; partner list remains accessible.';return;}
  let count=0;
  for(const feature of geometry.features){
   const g=feature.geometry;if(!g||!['Polygon','MultiPolygon'].includes(g.type))continue;
   const polygons=g.type==='Polygon'?[g.coordinates]:g.coordinates;
   let d='';
   for(const poly of polygons){for(const ring of poly){
    let shape='',lastLon=null,shown=0;
    for(const p of ring){if(!Array.isArray(p)||p.length<2)continue;const lon=p[0],lat=p[1];if(!Number.isFinite(lon)||!Number.isFinite(lat))continue;
     if(lastLon!==null&&Math.abs(lon-lastLon)>70){if(shown>2)d+=shape+'Z';shape='';shown=0}
     const q=point(lon,lat);shape+=(shown?'L':'M')+q.x.toFixed(1)+' '+q.y.toFixed(1)+' ';shown++;lastLon=lon;
    }if(shown>2)d+=shape+'Z';
   }}
   if(!d)continue;root.append(svg('path',{d}));count++;
  }
  $('mapStatus').textContent='Regional map ready · '+count+' reference boundaries · not project sites.';
 }
 function drawConnections(){
  const v=activeView();if(!v)return;
  const lines=$('mapLines'),dots=$('mapDots');lines.replaceChildren();dots.replaceChildren();
  const {x:ox,y:oy}=point(idn[0],idn[1]);
  // Draw selected connection last to keep it visually clear.
  const list=[...v.records].sort((a,b)=>(a.code===activeCode?1:0)-(b.code===activeCode?1:0));
  const max=Math.max(...v.records.map(row=>barValue(v,row)));
  for(const row of list){
   const p=point(row.lon,row.lat),selected=row.code===activeCode;
   const from=mode==='inbound'?p:{x:ox,y:oy},to=mode==='inbound'?{x:ox,y:oy}:p;
   const bow=Math.min(45,Math.max(12,Math.abs(from.x-to.x)*.14));
   const d='M '+from.x.toFixed(1)+' '+from.y.toFixed(1)+' Q '+((from.x+to.x)/2).toFixed(1)+' '+((from.y+to.y)/2-bow).toFixed(1)+' '+to.x.toFixed(1)+' '+to.y.toFixed(1);
   const arc=svg('path',{d,'stroke-width':selected?4:Math.max(1.3,2.1*Math.sqrt(barValue(v,row)/max)),class:selected?'selected':''});
   const title=svg('title');title.textContent=row.name+' · '+money(row.value);arc.append(title);lines.append(arc);
   const dot=svg('circle',{cx:p.x.toFixed(1),cy:p.y.toFixed(1),r:selected?8:6,fill:selected?'#efcf90':'#6bbdb5',class:'partner',tabindex:'0',role:'button','aria-label':row.name+' '+money(row.value)});
   dot.addEventListener('click',()=>select(row.code));
   dot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(row.code)}});
   const label=svg('title');label.textContent=row.name+' — '+money(row.value)+(row.share_percent===null?'':', '+fmtPct(row.share_percent));dot.append(label);dots.append(dot);
   if(selected){const t=svg('text',{x:(p.x+12).toFixed(1),y:(p.y-12).toFixed(1)});t.textContent=row.name;dots.append(t)}
  }
  const home=svg('circle',{cx:ox.toFixed(1),cy:oy.toFixed(1),r:'9',class:'origin'});
  const title=svg('title');title.textContent='Indonesia · focal economy';home.append(title);dots.append(home);
  const country=svg('text',{x:(ox+13).toFixed(1),y:(oy+5).toFixed(1),class:'id-text'});country.textContent='Indonesia';dots.append(country);
 }
 function select(code){activeCode=code;renderRankings();renderDetail();drawConnections();}
 function renderRankings(){
  const v=activeView(),root=$('rankings');root.replaceChildren();if(!v)return;
  const max=Math.max(...v.records.map(x=>barValue(v,x)));
  for(const [i,row] of v.records.entries()){
   const b=make('button');b.type='button';b.className='rank';b.setAttribute('aria-pressed',String(row.code===activeCode));
   const top=make('div');top.className='rank-top';const name=make('span',(i+1)+'. '+row.name);name.className='rank-name';const amount=make('span',money(row.value));amount.className='rank-value';top.append(name,amount);b.append(top);
   const sub=make('div');sub.className='rank-sub';
   const share=mode==='inbound'?(row.share_percent===null?'Share of FDI: N/A':'Share of Indonesia FDI: '+fmtPct(row.share_percent)):'Share of '+row.name+' inward capital: '+fmtPct(row.share_percent);
   sub.append(make('span',share),make('span',v.period));b.append(sub);
   const tr=make('div');tr.className='track';const fill=make('div');fill.className='fill';fill.style.width=(100*barValue(v,row)/max).toFixed(1)+'%';tr.append(fill);b.append(tr);
   b.addEventListener('click',()=>select(row.code));root.append(b);
  }
 }
 function renderDetail(){
  const v=activeView(),row=chosen();if(!v||!row)return;
  $('selectedName').textContent=row.name;
  $('selectedAmount').textContent=money(row.value);
  $('selectedShare').textContent=mode==='inbound'?(row.share_percent===null?'Share not published in source summary':fmtPct(row.share_percent)+' of 2025 Indonesian inward FDI'):fmtPct(row.share_percent)+' of '+row.name+' cumulative inward investment';
  $('selectedDescription').textContent=mode==='inbound'?('Realized foreign investment into Indonesia attributed to '+row.name+' during 2025. Source economy does not necessarily identify the ultimate owner.'):('Ten-year cumulative investment from Indonesia into '+row.name+' (2015–2024). Percentage uses '+row.name+"'s investment-inflow denominator.");
  $('selectedSource').href=v.source.url;
 }
 function render(){
  const v=activeView();if(!v)return;
  for(const [name,id] of [['inbound','modeInbound'],['outbound','modeOutbound']])$(id).setAttribute('aria-pressed',String(mode===name));
  $('question').textContent=v.question;$('subtitle').textContent=v.subtitle;$('period').textContent=v.period;
  $('measure').textContent=v.measure;$('sourceName').textContent=v.source.publisher;
  $('rankTitle').textContent=mode==='inbound'?'Largest FDI source economies':'Indonesia’s regional investment links';
  $('rankCaption').textContent=mode==='inbound'?'Bars compare reported USD flows for 2025; missing percentages remain N/A.':'Bars compare recipient-specific influence percentages; each country has a different denominator.';
  $('scopeNote').textContent=v.caveat;$('denominatorNote').textContent='Percentage denominator: '+v.percent_denominator;
  $('primarySource').href=v.source.url;
  if(!v.records.some(x=>x.code===activeCode))activeCode=v.records[0].code;
  renderRankings();renderDetail();drawConnections();
 }
 function setMode(next){if(!catalog||!catalog.views[next])return;mode=next;activeCode=catalog.views[next].records[0]?.code;render();}
 function init(){
  $('modeInbound').addEventListener('click',()=>setMode('inbound'));
  $('modeOutbound').addEventListener('click',()=>setMode('outbound'));
  Promise.allSettled([json('./data/sli-investment-network.json'),json('./data/sli-investment-network-map.geojson')]).then(results=>{
   if(results[0].status==='rejected'){ $('question').textContent='Investment data unavailable';$('rankings').textContent='Unable to load source data. Please try again later.';$('mapStatus').textContent='No investment relationships can be displayed until data is available.';return;}
   catalog=results[0].value;
   if(!catalog?.views?.inbound?.records?.length||!catalog?.views?.outbound?.records?.length)throw Error('Missing investment records');
   if(results[1].status==='fulfilled')geometry=results[1].value;
   mapOutline();setMode('inbound');
  }).catch(err=>{$('question').textContent='Data validation failed';$('rankings').textContent=String(err.message)});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();