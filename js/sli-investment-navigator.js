/* SLI Indonesia Investment Navigator — source-dated monitoring, never trade instructions. */
const $ = id => document.getElementById(id);
const node = (tag, value) => {const el=document.createElement(tag);if(value!==undefined)el.textContent=String(value);return el;};
const plain = x => String(x??'').trim();
const https = x => typeof x==='string' && /^https:\/\//.test(x);
const formatted = x => new Intl.NumberFormat('en-US',{maximumFractionDigits:3}).format(x);
const setStatus=(id,msg)=>{const el=$(id);if(el)el.textContent=msg;};
const link = (href,label) => {const a=node('a',label);a.href=href;a.target='_blank';a.rel='noopener noreferrer';return a;};
const dateOk=x=>typeof x==='string'&&/^20\d{2}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x));
const fetchJSON=async path=>{const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error(path+' HTTP '+r.status);return r.json();};
let catalog=null, official=null, licensed=null, articles=[],projects=[];
const tickerPattern=/^[A-Z]{4}$/;

function observedOfficial(id){
 const m=official?.metrics?.find(x=>x.id===id);
 const src=m&&official.sources?.[m.source_id];
 return m&&Number.isFinite(m.value)&&plain(m.period)&&m.status?.startsWith('official')&&https(src?.url)?{...m,source:src}:null;
}
const macroCodes={fx:'USDIDR',idx:'IHSG',flow:'FOREIGN_NET_FLOW',bond:'INDOGB10Y',coal:'COAL',nickel:'NICKEL',cpo:'CPO'};
const licensedByCode=code=>licensed?.get(code)||null;
function verifyMarket(doc){
 if(doc?.permission_to_redistribute!==true || !plain(doc.licence_id) || !plain(doc.publisher))return null;
 const units={USDIDR:'IDR/USD',IHSG:'index points',FOREIGN_NET_FLOW:'IDR billion',INDOGB10Y:'%',COAL:'USD/tonne',NICKEL:'USD/tonne',CPO:'USD/tonne'};
 const result=new Map();
 for(const x of doc.observations||[]){
  const symbol=plain(x.symbol);
  if(!Object.prototype.hasOwnProperty.call(units,symbol)&&!tickerPattern.test(symbol))continue;
  if(!Number.isFinite(x.value)||!dateOk(x.observation_date)||!https(x.source_url)||!plain(x.provider)||!plain(x.published_at)||!plain(x.rights_basis)||!['historical','delayed','end_of_day'].includes(x.delay_class))continue;
  if(x.unit!==(units[symbol]||'IDR/share'))continue;
  if(!result.has(symbol)||x.observation_date>result.get(symbol).observation_date)result.set(symbol,x);
 }
 return result;
}
function metricCard(label,value,unit,period,sourceUrl,basis){
 const card=node('article');card.className='card';
 card.append(node('strong',label));
 const number=node('div',value);number.className='number';card.append(number);
 card.append(node('div',unit),node('p',basis+' · '+period));
 if(https(sourceUrl))card.append(link(sourceUrl,'Original source ↗'));
 return card;
}
function renderMacro(){
 const root=$('macroCards');root.replaceChildren();
 if(!catalog?.macro?.length){root.append(node('p','The market indicator catalog is unavailable.'));return;}
 for(const m of catalog.macro){
  const quote=licensedByCode(macroCodes[m.id]);
  const bi=m.id==='fx'?observedOfficial('usd_idr_jisdor'):null;
  let value='N/A', period='not connected',unit=m.unit,basis='Licensed market data unavailable',src=m.url;
  if(quote){value=formatted(quote.value);unit=quote.unit;period='Observed '+quote.observation_date+' ('+quote.delay_class+')';basis='Licensed observation · '+quote.provider;src=quote.source_url;}
  else if(bi){value=formatted(bi.value);unit=bi.unit;period='Observed '+bi.period;basis='Official BI JISDOR reference (historical)';src=bi.source.url;}
  root.append(metricCard(m.name,value,unit,period,src,basis));
 }
}
const officialIds=['real_gdp_growth','inflation_yoy','bi_policy_rate','trade_balance_ytd','forex_reserves','exports_month','imports_month','fiscal_balance'];
function renderOfficial(){
 const root=$('macroContext');root.replaceChildren();
 if(!official){setStatus('macroSourceStatus','Official macroeconomic snapshot unavailable.');return;}
 let count=0;
 for(const id of officialIds){
  const m=observedOfficial(id);if(!m)continue;
  const card=metricCard(m.label,formatted(m.value),m.unit,m.period,m.source.url,'Published observation · '+m.source.publisher);
  root.append(card);count++;
 }
 setStatus('macroSourceStatus',count+' published statistical indicators · periods differ · checked snapshot '+(official.last_source_audit||'undated')+'. Not real-time trading quotes.');
 if(!count)root.append(node('p','Official observations could not be validated.'));
 const growth=observedOfficial('real_gdp_growth'),inflation=observedOfficial('inflation_yoy'),rate=observedOfficial('bi_policy_rate');
 const assessment=$('macroAssessment');assessment.replaceChildren();
 assessment.append(node('strong','Source-based context — no entry/buy/sell signal'));
 const descriptions=[];
 if(growth)descriptions.push('Real GDP: '+formatted(growth.value)+' '+growth.unit+' ('+growth.period+')');
 if(inflation)descriptions.push('Inflation: '+formatted(inflation.value)+' '+inflation.unit+' ('+inflation.period+')');
 if(rate)descriptions.push('BI policy rate: '+formatted(rate.value)+'% ('+rate.period+')');
 assessment.append(node('p',descriptions.length?descriptions.join(' · '):'Insufficient official observations for even a contextual summary.'));
 assessment.append(node('p','These observations describe different periods. Combine them with verified FX, flows, yields, company fundamentals and scenario assumptions; a composite investment signal is not issued.'));
}
function renderFXTrend(){
 const root=$('fxTrend');root.replaceChildren();
 const series=official?.manual_series?.find(s=>s.id==='usd_idr_jisdor');
 const pts=(series?.points||[]).filter(x=>Number.isFinite(x.value)&&plain(x.period)).slice(-30);
 if(pts.length<2){root.textContent='Historical daily FX series unavailable.';return;}
 const w=540,h=140,pad=22,values=pts.map(x=>x.value),lo=Math.min(...values),hi=Math.max(...values);
 const x=i=>pad+i*(w-2*pad)/Math.max(1,pts.length-1),y=v=>h-pad-(v-lo)/Math.max(1,hi-lo)*(h-2*pad);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 '+w+' '+h);svg.setAttribute('class','fx-spark');svg.setAttribute('role','img');
 svg.setAttribute('aria-label','Source-dated BI JISDOR reference series; '+pts.length+' observations.');
 const poly=document.createElementNS('http://www.w3.org/2000/svg','polyline');
 poly.setAttribute('points',pts.map((v,i)=>x(i)+','+y(v.value)).join(' '));poly.setAttribute('stroke','#e0bd7b');poly.setAttribute('stroke-width','3');poly.setAttribute('fill','none');svg.append(poly);
 root.append(node('p','Historical JISDOR observations: '+pts[0].period+' to '+pts[pts.length-1].period+' ('+series.unit+')'),svg,node('p','Start: '+formatted(pts[0].value)+' · Last: '+formatted(pts[pts.length-1].value)+' · Source: Bank Indonesia.'));
 if(https(official.sources?.[series.source_id]?.url))root.append(link(official.sources[series.source_id].url,'BI publication ↗'));
}
function selectedStocks(){
 if(!catalog)return [];
 const q=$('stockSearch').value.toLowerCase().trim(),sector=$('stockSector').value,scenario=catalog.scenarios.find(x=>x.id===$('stockScenario').value);
 const arr=catalog.watchlist.filter(x=>(!sector||x.sector===sector)&&(!scenario||scenario.tickers.includes(x.ticker))&&(!q||(x.ticker+' '+x.sector+' '+x.exposures).toLowerCase().includes(q)));
 return arr.sort((a,b)=>$('stockSort').value==='sector'?a.sector.localeCompare(b.sector)||a.ticker.localeCompare(b.ticker):a.ticker.localeCompare(b.ticker));
}
function renderWatchlist(){
 if(!catalog)return;
 const root=$('stocks');root.replaceChildren();const subset=selectedStocks();
 for(const stock of subset){
  const tr=node('tr'),quote=licensedByCode(stock.ticker);
  for(const cell of [stock.ticker,stock.sector,stock.exposures,quote?formatted(quote.value)+' IDR · '+quote.observation_date:'N/A · unlicensed'])tr.append(node('td',cell));
  const evidence=node('td');if(https(stock.source_url))evidence.append(link(stock.source_url,'IDX issuer directory ↗'));else evidence.textContent='Source pending';tr.append(evidence);root.append(tr);
 }
 if(!subset.length){const tr=node('tr'),td=node('td','No issuers match these filters. Clear the search or change scenario.');td.colSpan=5;tr.append(td);root.append(tr);}
 setStatus('stockCount','Showing '+subset.length+' of '+catalog.watchlist.length+' monitored issuers · no recommendations.');
 const scenario=catalog.scenarios.find(x=>x.id===$('stockScenario').value);
 setStatus('scenarioInsight',scenario?scenario.title+' — '+scenario.channels+' '+scenario.sector_effects:'Filter by a geopolitical scenario to see exposure-related issuers. No price-direction forecast.');
 $('watchlistCsv').disabled=false;
}
function downloadWatchlist(){
 const rows=[['ticker','sector','geopolitical_channel','price','price_observation_date','basis'],...selectedStocks().map(s=>{const q=licensedByCode(s.ticker);return [s.ticker,s.sector,s.exposures,q?.value??'',q?.observation_date??'','monitoring only; not advice'];})];
 const csv=rows.map(row=>row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\r\n');
 const objectUrl=URL.createObjectURL(new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8'})),a=node('a');a.href=objectUrl;a.download='sli_idx_sector_watchlist.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),1500);
}
function renderScenarioCards(){
 $('scenarioCards').replaceChildren();$('stockScenario').replaceChildren();
 const base=node('option','All geopolitical scenarios');base.value='';$('stockScenario').append(base);
 for(const sc of catalog.scenarios){
  const card=node('article');card.className='card detail';card.append(node('strong',sc.title),node('p',sc.channels),node('p',sc.sector_effects),node('p','Exposure examples: '+sc.tickers.join(', ')));$('scenarioCards').append(card);
  const opt=node('option',sc.title);opt.value=sc.id;$('stockScenario').append(opt);
 }
}
function filteredNews(){
 const sector=$('newsTopic').value,scope=$('newsScope').value,q=$('newsSearch').value.toLowerCase().trim();
 return articles.filter(a=>(!sector||a._sector===sector)&&(!scope||a._scope===scope)&&(!q||(a.title+' '+a.publisher).toLowerCase().includes(q)));
}
function renderNews(){
 const root=$('newsCards');root.replaceChildren();const matches=filteredNews();
 setStatus('newsCount','Showing '+Math.min(12,matches.length)+' of '+matches.length+' matching headlines ('+articles.length+' available across monitored sectors).');
 for(const item of matches.slice(0,12)){
  const card=node('article');card.className='card';
  card.append(node('strong',item.title),node('p',(item.publisher||'Publisher not stated')+' · '+(item.published_at_utc||'Undated')+' · '+item._sector+' / '+item._scope+' · media lead'));
  if(https(item.url))card.append(link(item.url,'Open source ↗'));root.append(card);
 }
 if(!matches.length){const e=node('p','No matching headlines in the current feed. Adjust the sector, scope or search.');e.className='empty';root.append(e);}
}
function renderFDICategories(){
 $('fdiCards').replaceChildren();
 for(const area of catalog?.fdi||[]){
  const card=node('article');card.className='card';card.append(node('strong',area.sector),node('p',area.policy),node('p','Required evidence: '+area.needs));$('fdiCards').append(card);
 }
}
function renderProjects(){
 const root=$('fdiProjects');root.replaceChildren();
 const q=$('fdiSearch').value.toLowerCase().trim(),sector=$('fdiSector').value;
 const visible=projects.filter(p=>(!sector||p.sector===sector)&&(!q||(p.name+' '+p.investor+' '+p.region+' '+p.sector).toLowerCase().includes(q)));
 for(const p of visible.slice(0,15)){
  const card=node('article');card.className='card';
  card.append(node('strong',p.name),node('p',p.sector+' · '+p.region),node('p','Stage: '+(p.stage||'Unverified')),node('p','Investor: '+(p.investor||'Not verified')),node('p','Capital reported ≠ realized spending.'));
  if(https(p.source_url))card.append(link(p.source_url,'Project evidence ↗'));root.append(card);
 }
 if(!visible.length){const no=node('p','No projects match. Try a broader keyword or all sectors.');no.className='empty';root.append(no);}
 setStatus('fdiCount','Showing '+Math.min(15,visible.length)+' of '+visible.length+' matching projects · '+projects.length+' source-dated registry records.');
}
function showTab(name,write=false){
 const chosen=['macro','equity','fdi'].includes(name)?name:'macro';
 for(const button of document.querySelectorAll('[data-section]'))button.setAttribute('aria-selected',String(button.dataset.section===chosen));
 for(const tab of ['macro','equity','fdi'])$(tab).hidden=tab!==chosen;
 if(write)history.replaceState(null,'','#'+chosen);
}
function init(){
 document.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.section,true)));
 window.addEventListener('hashchange',()=>showTab(location.hash.slice(1)));
 showTab(location.hash.slice(1));
 for(const id of ['stockSearch','stockSector','stockScenario','stockSort'])$(id).addEventListener(['stockSearch'].includes(id)?'input':'change',renderWatchlist);
 for(const id of ['newsSearch','newsTopic','newsScope'])$(id).addEventListener(id==='newsSearch'?'input':'change',renderNews);
 $('watchlistCsv').addEventListener('click',downloadWatchlist);
 $('fdiSearch').addEventListener('input',renderProjects);$('fdiSector').addEventListener('change',renderProjects);
 load();
}
async function load(){
 const jobs=[
  fetchJSON('./data/sli-indonesia-investment-navigator.json').then(j=>{
   if(!Array.isArray(j.macro)||!Array.isArray(j.watchlist)||!Array.isArray(j.scenarios)||!Array.isArray(j.fdi))throw Error('Invalid catalog');
   catalog=j;renderScenarioCards();renderFDICategories();
   const sectors=[...new Set(j.watchlist.map(x=>x.sector))].sort();for(const sector of sectors){const o=node('option',sector);o.value=sector;$('stockSector').append(o);}
   renderMacro();renderWatchlist();setStatus('equityLoadStatus',j.watchlist.length+' issuers loaded');setStatus('fdiLoadStatus','FDI screening ready');
  }).catch(e=>{setStatus('equityLoadStatus','Watchlist unavailable');setStatus('fdiLoadStatus','FDI categories unavailable');$('stocks').replaceChildren(node('tr'));$('stocks').firstChild.append(node('td','Unable to load watchlist. Refresh the page.'));setStatus('scenarioInsight',e.message);}),
  fetchJSON('./data/sli-macro-indonesia-2026.json').then(j=>{
   if(!Array.isArray(j.metrics)||!j.sources)throw Error('Invalid official snapshot');
   official=j;renderMacro();renderOfficial();renderFXTrend();setStatus('macroLoadStatus','Official macro data loaded · dated');
  }).catch(e=>{setStatus('macroLoadStatus','Official macro data unavailable');setStatus('macroSourceStatus','Could not load official macro data: '+e.message);$('fxTrend').textContent='Reference trend unavailable.';}),
  fetchJSON('./data/sli-market-observations.json').then(j=>{
   licensed=verifyMarket(j);
   setStatus('marketRightsStatus',licensed?'Permitted historical/delayed market data: '+licensed.size+' instruments. Verify each timestamp.':'Market quote data not licensed/connected; unverified quotes remain N/A. Source links are provided.');
   if(catalog){renderMacro();renderWatchlist();}
  }).catch(()=>setStatus('marketRightsStatus','Market feed unavailable. No price data published.')),
  fetchJSON('./data/research-signal-radar.json').then(j=>{
   const rows=Object.entries(j.groups||{}).flatMap(([sector,group])=>['domestic','geopolitical'].flatMap(scope=>(group[scope]||[]).map(x=>({...x,_sector:sector,_scope:scope}))));
   articles=[...new Map(rows.filter(x=>plain(x.title)&&https(x.url)).map(x=>[x.url,x])).values()].sort((a,b)=>plain(b.published_at_utc).localeCompare(plain(a.published_at_utc)));
   setStatus('newsStatus','Research feed snapshot '+(j.generated_at_utc||'undated')+' · includes '+Object.keys(j.groups||{}).join(', ')+' only. Headlines are unverified media leads.');
   setStatus('feedLoadStatus',articles.length+' news leads loaded');renderNews();
  }).catch(()=>{setStatus('feedLoadStatus','News feed unavailable');setStatus('newsStatus','Monitoring feed could not be loaded. Use the original publisher websites.');renderNews();}),
  fetchJSON('./data/sli-project-registry.json').then(j=>{
   if(!Array.isArray(j.records))throw Error('Invalid project registry');
   projects=j.records;for(const sector of [...new Set(projects.map(x=>x.sector))].sort()){const o=node('option',sector);o.value=sector;$('fdiSector').append(o);}
   renderProjects();setStatus('fdiLoadStatus',projects.length+' investment records loaded');
  }).catch(()=>{setStatus('fdiLoadStatus','Project registry unavailable');$('fdiCount').textContent='Investment project evidence could not be loaded.';})
 ];
 await Promise.allSettled(jobs);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
