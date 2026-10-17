/* SLI GIA v2 — scenario analysis. Source data is not financial advice or measured country risk. */
(function(){
"use strict";
const $=id=>document.getElementById(id),newEl=(tag,val)=>{const e=document.createElement(tag);if(val!==undefined)e.textContent=String(val);return e};
const link=(url,label)=>{const a=newEl('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a};
const safeUrl=x=>typeof x==='string'&&/^https:\/\//.test(x);
const number=(id)=>Number($(id).value), f=(x,d=1)=>Number(x).toLocaleString('en-US',{maximumFractionDigits:d});
let config=null,feed=[],snapshot=null,lastResults=null,worldLoaded=false;const engine=window.SLIGIA;
if(!engine){$('alertState').textContent='Risk engine could not be loaded. Refresh the dashboard.';return}
async function getJSON(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
function selectedScenario(){return config?.scenarios.find(x=>x.id===$('scenario').value)||config?.scenarios[0]}
function selectedCountry(){return config?.countries.find(x=>x.code===$('country').value)||config?.countries[0]}
function selectedSector(){return config?.sector_matrix.find(x=>x.sector===$('sector').value)||config?.sector_matrix[0]}
const classification=x=>x<33?['Low','low','#3fa284']:x<66?['Moderate','moderate','#dfb767']:['High','high','#c96b62'];
const projection=(lon,lat)=>[(lon+180)*960/360,(90-lat)*470/180];
function geoPath(rings){
 const parts=[];
 for(const ring of rings){let p='',prior=null;for(const xy of ring){if(!Array.isArray(xy)||xy.length<2)continue;const [lon,lat]=xy;if(prior&&Math.abs(lon-prior)>175){if(p)parts.push(p+'Z');p=''}const [x,y]=projection(lon,lat);p+=(p?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)+' ';prior=lon}if(p)parts.push(p+'Z')}
 return parts.join(' ');
}
function refreshMap(){
 const score=lastResults?.score,select=selectedCountry();if(!select)return;
 const chosenColor=score==null?'#a5bac7':classification(score)[2];
 document.querySelectorAll('#mapShapes path').forEach(p=>{const matched=p.dataset.code===select.code||p.dataset.name===select.name.toLowerCase();p.setAttribute('fill',matched?chosenColor:'#2b4659');p.style.fill=matched?chosenColor:'#2b4659';p.setAttribute('opacity',matched?'1':'.85')});
 const pins=$('mapPins');pins.replaceChildren();
 for(const country of config.countries){
  const [x,y]=projection(country.lon,country.lat),chosen=country.code===select.code;
  const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('cx',String(x));c.setAttribute('cy',String(y));c.setAttribute('r',chosen?'7':'3.9');c.setAttribute('fill',chosen?chosenColor:'#718d9a');c.setAttribute('class','country-pin');c.setAttribute('tabindex','0');c.setAttribute('role','button');c.setAttribute('aria-label','Select '+country.name);
  const choose=()=>{$('country').value=country.code;updateAll()};
  c.addEventListener('click',choose);c.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();choose()}});
  const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=country.name+(chosen?' · selected scenario proxy '+(score??'N/A'):' · N/A');c.append(title);pins.append(c);
  if(chosen){const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',String(Math.min(875,x+9)));t.setAttribute('y',String(y-10));t.textContent=country.name; pins.append(t)}
 }
 $('mapStatus').textContent=(worldLoaded?'Natural Earth boundary map loaded. ':'Map reference points ready; boundary geometry unavailable. ')+select.name+' is the sole scored country in this hypothetical scenario; all others N/A.';
}
async function initWorld(){
 const status=$('mapStatus');status.textContent='Loading Natural Earth country outlines…';
 try{
  const url='./data/sli-gia-world-110m.geojson';
  const data=await getJSON(url);
  if(!Array.isArray(data.features))throw Error('Geometry absent');
  const root=$('mapShapes');root.replaceChildren();const countryByCode=new Map(config.countries.map(x=>[x.code,x]));
  for(const feature of data.features){
   const geom=feature.geometry;if(!geom||!['Polygon','MultiPolygon'].includes(geom.type))continue;
   const props=feature.properties||{},code=String(props.ISO_A3||props.ADM0_A3||props.iso_a3||props['ISO3166-1-Alpha-3']||'').toUpperCase();
   const name=String(props.ADMIN||props.name||'').toLowerCase(),polygons=geom.type==='Polygon'?[geom.coordinates]:geom.coordinates;
   const shape=document.createElementNS('http://www.w3.org/2000/svg','path');
   shape.setAttribute('d',polygons.map(geoPath).join(' '));shape.setAttribute('fill','#2b4659');shape.dataset.code=code;shape.dataset.name=name;shape.setAttribute('tabindex','0');
   const found=countryByCode.get(code)||config.countries.find(x=>x.name.toLowerCase()===name);
   if(found){const select=()=>{$('country').value=found.code;updateAll()};shape.addEventListener('click',select);shape.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();select()}})}
   const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=props.ADMIN||props.name||'Country';shape.append(title);root.append(shape);
  }
  if(root.children.length<150)throw Error('Country geometry incomplete');worldLoaded=true;
 }catch(_e){status.textContent='World geometry unavailable. Country selector and interactive reference points remain functional.';}
 refreshMap();
}
function updateSourceWatch(){
 const dest=$('sourceWatchStatus');if(!dest||!config)return;
 const sc=selectedScenario(),tags=sc?.tags||[],match=engine.keywordMatches(feed,tags);
 const threshold=number('signalThreshold'),valid=Number.isInteger(threshold)&&threshold>=1&&threshold<=50;
 if(!valid){dest.textContent='Set an integer headline-match threshold from 1 to 50.';return}
 dest.textContent=tags.length?(match.length>=threshold?'SOURCE WATCH · keyword count reached threshold: ':'SOURCE WATCH · below keyword count threshold: ')+match.length+' / '+threshold+' matches across '+feed.length+' sourced headlines. Last feed: '+(snapshot?.generated_at_utc||'undated')+'. This is monitoring volume, NOT verified escalation.':'Custom scenario has no keyword dictionary; source watch N/A.';
}
function scenarioText(){
 const sc=selectedScenario(),sector=selectedSector();if(!sc)return;
 $('riskPath').textContent=sc.pathway;
 $('watchIndicators').replaceChildren();for(const x of sc.watch){$('watchIndicators').append(newEl('p','• '+x))}
 $('mitigations').replaceChildren();for(const x of sc.mitigation){$('mitigations').append(newEl('p','• '+x))}
 $('sectorAssessment').textContent=sector?(sector[sc.id]||'Review this sector’s exposure with independent documents.'):'No sector selected.';
}
function updateAll(){
 if(!config)return;
 scenarioText();updateSourceWatch();
 for(const id of ['macroRisk','mesoRisk','microRisk'])$(id.replace('Risk','Val')).textContent=$(id).value;
 const input={macro:number('macroRisk'),meso:number('mesoRisk'),micro:number('microRisk')};
 try{
  const score=engine.score(input,config.methodology?{macro:config.methodology.macro_weight,meso:config.methodology.meso_weight,micro:config.methodology.micro_weight}:undefined);
  const risk=classification(score);
  $('riskScore').textContent=f(score)+' / 100';$('riskClass').textContent=risk[0]+' · analyst-assumed proxy, not empirical country risk';
  const warning=engine.actionState(score,number('threshold'));
  const state=$('alertState');state.replaceChildren();
  state.append(newEl('strong',warning.alert?'SCENARIO WARNING · assumed threshold exceeded':'SCENARIO MONITOR · within selected threshold'));
  state.append(newEl('p',selectedCountry().name+': '+f(score)+' / 100 vs configured alert '+number('threshold')+'. This is NOT an observed real-time change or push alert.'));
  state.append(newEl('p','Confirm current events through primary reporting before acting. Potential responses are research options, not trade orders.'));
  lastResults={...lastResults,score,country:selectedCountry().code,scenario:selectedScenario().id,sector:$('sector').value,drivers:input,threshold:number('threshold'),alert:warning.alert,generated_at:new Date().toISOString()};
 }catch(e){$('riskScore').textContent='N/A';$('riskClass').textContent=e.message;lastResults=null}
 try{
  const response=engine.scenario({value:number('portfolioValue'),exposure:number('exposure'),prob:[number('bullProbability'),number('baseProbability'),number('bearProbability')],shocks:[number('bullShock'),number('baseShock'),number('bearShock')]});
  $('modelError').textContent='';
  for(const [id,impact] of [['bullImpact',response.losses[0]],['baseImpact',response.losses[1]],['bearImpact',response.losses[2]]])$(id).textContent=(impact<0?'Potential gain ':'Potential loss ')+f(Math.abs(impact),2)+' M';
  $('expectedLoss').textContent=(response.expected<0?'–':'')+'$'+f(Math.abs(response.expected),2)+' M';
  $('var95').textContent='$'+f(response.p95,2)+' M';$('downside').textContent='$'+f(response.downside,2)+' M';
  lastResults={...lastResults,financial:response};
 }catch(e){$('modelError').textContent=e.message;for(const id of ['bullImpact','baseImpact','bearImpact','expectedLoss','var95','downside'])$(id).textContent='N/A';if(lastResults)delete lastResults.financial}
 refreshMap();
}
function renderFeed(){
 const q=$('newsSearch').value.toLowerCase().trim(),group=$('newsFilter').value;
 const visible=feed.filter(x=>(!group||x.group===group)&&(!q||(x.title+' '+x.publisher).toLowerCase().includes(q)));
 $('newsItems').replaceChildren();
 for(const x of visible.slice(0,12)){
  const c=newEl('article');c.className='card';
  c.append(newEl('strong',x.title),newEl('p',(x.publisher||'Publisher')+' · '+(x.published_at_utc||'Undated')+' · '+x.group+' · '+x.scope+' · media lead'));
  if(safeUrl(x.url))c.append(link(x.url,'Read original report ↗'));
  const btn=newEl('button','Use headline as scenario context');
  btn.addEventListener('click',()=>{$('newsSearch').value=x.title;$('newsStatus').textContent='Headline selected as context only; scenario scores remain analyst assumptions: '+x.title;const hay=x.title.toLowerCase(),match=config.scenarios.filter(s=>s.id!=='custom').map(s=>({s,n:s.tags.filter(t=>hay.includes(t)).length})).sort((a,b)=>b.n-a.n)[0];if(match?.n){$('scenario').value=match.s.id;$('country').value=match.s.country;updateAll()}document.getElementById('risk').scrollIntoView({behavior:'smooth',block:'start'})});c.append(btn);$('newsItems').append(c);
 }
 if(!visible.length)$('newsItems').append(newEl('p','No matching headlines in this snapshot; try different keywords.'));
 $('newsStatus').textContent=visible.length+' matching headlines · showing up to 12 · media sources not independently confirmed; no NLP validation.';
}
async function loadFeed(){
 $('newsStatus').textContent='Updating feed from stored SLI research snapshot…';
 try{
  snapshot=await getJSON('./data/research-signal-radar.json');
  feed=Object.entries(snapshot.groups||{}).flatMap(([group,groups])=>['geopolitical','domestic'].flatMap(scope=>(groups[scope]||[]).map(item=>({...item,group,scope})))).filter(x=>x.title&&safeUrl(x.url));
  feed=[...new Map(feed.map(x=>[x.url,x])).values()].sort((a,b)=>String(b.published_at_utc||'').localeCompare(String(a.published_at_utc||'')));
  $('feedDate').textContent=snapshot.generated_at_utc?new Date(snapshot.generated_at_utc).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'})+' UTC':'Undated';
  $('feedCount').textContent=String(feed.length);
  $('feedCoverage').textContent=Object.keys(snapshot.groups||{}).join(' / ')||'None';
 }catch(e){feed=[];$('feedDate').textContent='Unavailable';$('feedCount').textContent='N/A';$('feedCoverage').textContent='Source unavailable';}
 renderFeed();updateSourceWatch();
}
function download(){
 if(!lastResults)return;const summary={schema:'sli-gia-scenario-export-v2',status:'assumptions_not_verified_risk',context:{scenario:selectedScenario()?.name,country:selectedCountry()?.name,sector:$('sector').value},risk:lastResults,feed:{source:'SLI research-signal-radar',generated_at_utc:snapshot?.generated_at_utc||null,count:feed.length},methodology:config.methodology,not_advice:true};
 const blob=new Blob([JSON.stringify(summary,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=newEl('a');a.href=url;a.download='sli-gia-scenario-impact.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),300);
}
function reset(){
 const values={macroRisk:40,mesoRisk:55,microRisk:30,threshold:65,portfolioValue:100,exposure:60,bullProbability:20,baseProbability:50,bearProbability:30,bullShock:-5,baseShock:8,bearShock:25};
 for(const [id,v] of Object.entries(values))$(id).value=v;updateAll();
}
function initialize(){
 $('scenario').replaceChildren();$('country').replaceChildren();$('sector').replaceChildren();
 for(const sc of config.scenarios){const opt=newEl('option',sc.name);opt.value=sc.id;$('scenario').append(opt)}
 for(const c of config.countries){const opt=newEl('option',c.name);opt.value=c.code;$('country').append(opt)}
 for(const sec of config.sector_matrix){const opt=newEl('option',sec.sector);opt.value=sec.sector;$('sector').append(opt)}
 $('scenario').value=config.scenarios[0].id;$('country').value=config.scenarios[0].country;
 $('scenario').addEventListener('change',()=>{const c=selectedScenario();if(c)$('country').value=c.country;updateAll()});
 for(const id of ['country','sector','macroRisk','mesoRisk','microRisk','threshold','portfolioValue','exposure','bullProbability','baseProbability','bearProbability','bullShock','baseShock','bearShock'])$(id).addEventListener('input',updateAll);
 for(const id of ['newsSearch','newsFilter'])$(id).addEventListener('input',renderFeed);
 $('signalThreshold').addEventListener('input',updateSourceWatch);
 $('recalculate').addEventListener('click',updateAll);$('resetScenario').addEventListener('click',reset);$('exportGia').addEventListener('click',download);$('refreshFeed').addEventListener('click',loadFeed);
 reset();initWorld();loadFeed();
}
getJSON('./data/sli-gia-v2-config.json').then(c=>{if(!Array.isArray(c.countries)||!Array.isArray(c.scenarios))throw Error('Invalid GIA configuration');config=c;initialize()}).catch(e=>{$('riskScore').textContent='N/A';$('mapStatus').textContent='GIA config unavailable: '+e.message;$('newsStatus').textContent='Please reload after deployment.'});
})();