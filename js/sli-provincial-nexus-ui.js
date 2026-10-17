/* SLI Provincial Investment Intelligence · source-dependent interactive research UI. */
(function(){
'use strict';
const N=window.SLIProvincialNexus,$=id=>document.getElementById(id);
const e=(t,txt)=>{const n=document.createElement(t);if(txt!==undefined)n.textContent=String(txt);return n;};
const num=(x,d=2)=>typeof x==='number'&&Number.isFinite(x)?x.toLocaleString('en-US',{maximumFractionDigits:d}):'N/A';
const fixed=(x,d=3)=>typeof x==='number'&&Number.isFinite(x)?x.toFixed(d):'N/A';
const link=(url,label)=>{const a=e('a',label);if(typeof url==='string'&&url.startsWith('https://')){a.href=url;a.target='_blank';a.rel='noopener noreferrer';}return a;};
const SOURCE_LIST=[
{id:'bps',path:'data/sli-bps-regional-intelligence.json',required:true,label:'BPS provincial expenditure GRDP (2021–2025)'},
{id:'gini',path:'data/sli-bps-gini-2026.json',label:'BPS March 2026 provincial Gini'},
{id:'energy',path:'data/energy-infrastructure-security.json',label:'ESDM household/village electrification'},
{id:'projects',path:'data/sli-project-registry.json',label:'Curated investment project registry'},
...N.SOURCES.map(z=>({id:z.id,path:z.path,label:z.label,asset:true}))
];
let datasets={},failures=[],sel='',filter='',briefText='';
function option(value,text){const a=e('option',text);a.value=value;return a;}
function showSourceStatus(){
 const host=$('sources');host.replaceChildren();
 for(const src of SOURCE_LIST){
  const d=datasets[src.id],item=e('p');
  item.className='small';
  item.append(e('strong',(d?'✓ ':'— ')+src.label+': '));
  const period=d?.as_of||d?.measurement_period||d?.extracted_at||d?.sources?.pdrb?.released||'Source vintage in individual record';
  item.append(e('span',d?'loaded · '+period:'not available; no substituted data'));host.append(item);
 }
 const a=N.assets(datasets);
 $('coverage').textContent='38 provinces · '+a.total+' asset-layer records scanned · '+a.assigned.length+' conservatively matched to a single province · '+a.excluded.length+' excluded as ambiguous, multi-site or unlocated. Source lists overlap: matched records cannot be added as project totals. '+failures.length+' source feeds unavailable. No full 38-province household electrification coverage is asserted.';
}
function renderTrend(series){
 const root=$('timeline');root.replaceChildren();
 const available=series.filter(x=>x.growth!==null||x.pmtb!==null);
 if(!available.length){root.append(e('p','Historical GRDP series unavailable for this province.'));return;}
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 630 295');svg.setAttribute('role','img');svg.setAttribute('aria-label','Year-by-year BPS growth and PMTB share with independent scales');
 const make=(tag,attrs)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs||{}))n.setAttribute(k,String(v));return n;};
 const text=(x,y,txt,color='#c7d7e1')=>{const t=make('text',{x,y,fill:color,'font-size':11,'text-anchor':'middle'});t.textContent=txt;svg.append(t);};
 const xs=(i)=>50+i*132;
 const gp=series.map(z=>z.growth).filter(x=>x!==null),ip=series.map(z=>z.pmtb).filter(x=>x!==null);
 const minG=Math.min(-1,...gp)-.4,maxG=Math.max(1,...gp)+.4,minI=Math.max(0,Math.min(...ip)-3),maxI=Math.max(...ip)+3;
 const gy=v=>240-(v-minG)/(maxG-minG)*190,iy=v=>240-(v-minI)/(maxI-minI)*190;
 for(let i=0;i<=4;i++){const y=49+i*191/4;svg.append(make('line',{x1:48,x2:580,y1:y,y2:y,stroke:'#38566d','stroke-dasharray':'3 5'}));}
 let previousGrowth=null,previousPmtb=null;
 series.forEach((z,i)=>{
  text(xs(i),267,z.year);
  for(const [v,fy,color,old] of [[z.growth,gy,'#e1ba77',previousGrowth],[z.pmtb,iy,'#85c2c3',previousPmtb]]){
   if(v===null)continue;
   const point=[xs(i),fy(v)];
   if(old)svg.append(make('line',{x1:old[0],y1:old[1],x2:point[0],y2:point[1],stroke:color,'stroke-width':3}));
   const dot=make('circle',{cx:point[0],cy:point[1],r:4.6,fill:color});
   const title=make('title');title.textContent=z.year+' · '+(color==='#e1ba77'?'real GRDP growth':'PMTB share')+' '+fixed(v,2)+'%';dot.append(title);svg.append(dot);
  }
  previousGrowth=z.growth===null?null:[xs(i),gy(z.growth)];
  previousPmtb=z.pmtb===null?null:[xs(i),iy(z.pmtb)];
 });
 root.append(svg);
 const legend=e('p','Gold: annual real GRDP growth (%) · Aqua: annual PMTB share of nominal GRDP (%). Different y-axis ranges; compare changes within each line, not line heights.');legend.className='tiny';root.append(legend);
}
function metric(label,value,source,notes){
 const node=e('article');node.className='evidence';
 node.append(e('strong',label+' · '+(value===null?'N/A':num(value,3))));
 if(notes)node.append(e('p',notes));
 if(source)node.append(link(source,'Official / published evidence ↗'));
 return node;
}
function renderPower(p){
 const x=p.electricity,host=$('electricityDetails');host.replaceChildren();
 $('electricity').textContent=x.household!==null?num(x.household,3)+'%':'N/A';
 $('electricityBasis').textContent=x.household!==null?(x.householdDate||'source-vintaged')+' · '+(x.quality||'check source'):'38-province comparable household access not digitized';
 host.append(metric('Province household electrification (all sources) (%)',x.household,x.householdSource,'Observed ratio for a subset of provinces only; not proof of supply reliability, daily hours or grid capacity.'));
 host.append(metric('Province PLN household electrification (%)',x.plnHousehold,x.householdSource,'Distinct PLN-service measure, not identical to total household electrification.'));
 host.append(metric('Province village coverage by PLN (%)',x.villagePln,x.villageSource,'Village-level denominator and PLN connection scope; NOT household electricity access. '+(x.villageDate||'')));
 host.append(metric('National household electrification (%)',x.nationalHousehold,x.sourceNational,'National comparison context ('+(x.nationalHouseholdDate||'period not verified')+'), not a province observation.'));
 if(x.household===null)host.append(e('p','Provincial household RE is unknown in the current integrated source—not zero and not inferred from the national value.'));
}
function renderIndustry(p){
 const select=$('sectorFilter'),old=select.value;select.replaceChildren(option('','All sectors'));
 for(const a of p.sectors)select.append(option(a.sector,a.sector+' · '+a.count+' records'));
 if(p.sectors.some(z=>z.sector===old))select.value=old;else{select.value='';filter='';}
 const chips=$('sectorMix');chips.replaceChildren();
 for(const s of p.sectors){const chip=e('button',s.sector+' · '+s.count);chip.className='chip';chip.type='button';chip.addEventListener('click',()=>{select.value=s.sector;filter=s.sector;renderAssets(p);});chips.append(chip);}
 if(!p.sectors.length)chips.append(e('p','No single-province named industry asset in the selected registry. This is not evidence of no industry or natural resources.'));
 renderAssets(p);
}
function renderAssets(p){
 const box=$('assets');box.replaceChildren();
 const items=p.assets.filter(x=>!filter||x.sector===filter);
 for(const z of items.slice(0,18)){
  const card=e('article');card.className='evidence';
  card.append(e('span',z.sector),e('strong',z.asset));
  card.append(e('p',z.operator?z.operator+' · '+z.stage:z.stage));
  if(z.product)card.append(e('p','Documented product: '+z.product));
  if(z.capacity)card.append(e('p','Reported equipment/production figure: '+z.capacity.value+' '+z.capacity.unit+' · not automatically realized output.'));
  card.append(e('small','Layer: '+z.provenance+' · '+(z.year||'evidence date not set')+' · province assignment: '+z.quality));
  if(z.source?.startsWith('https://'))card.append(e('p').appendChild(link(z.source,'Original published source ↗')));
  box.append(card);
 }
 if(items.length>18)box.append(e('p','Showing 18 of '+items.length+' evidence records. Filter sectors or use the SLI Strategic Map for the full list.'));
 if(!items.length)box.append(e('p','No records for selected filter. This does not imply the sector or resource is absent.'));
}
function renderProjects(p){
 const host=$('projects');host.replaceChildren();
 for(const x of p.projects.slice(0,12)){
  const card=e('article');card.className='evidence';
  card.append(e('span',x.stage||'Undetermined status'),e('strong',x.name));
  card.append(e('p',(x.sector||'Sector unspecified')+' · '+(x.operator||'Investor undisclosed')));
  card.append(e('p','Evidence vintage '+(x.date||'not specified')+' · '+x.scope+'. '+(x.basis||'No monetary basis provided')));
  if(x.source?.startsWith('https://'))card.append(link(x.source,'Read project milestone ↗'));
  host.append(card);
 }
 if(!p.projects.length)host.append(e('p','No provincially attributed entries in the 25-project curated investment register. Not evidence that the province has no investments.'));
 const challenges=[];
 if(p.electricity.household===null)challenges.push('Verify household electrification, actual grid availability, power cost and reliability; a missing RE observation is not an access deficit.');
 else if(p.electricity.household<98)challenges.push('The available provincial household-access observation is below 98%, from a nonuniform source vintage; verify PLN capacity and infrastructure independently.');
 if(p.gini?.combined!==undefined&&p.nationalGini!==null&&p.gini.combined>p.nationalGini)challenges.push('BPS expenditure Gini exceeds the national coefficient: segment household demand carefully; Gini alone cannot quantify local purchasing power.');
 if(p.projects.some(x=>/Announced|MoU|Site evaluation|Early works|Under construction/i.test(x.stage||'')))challenges.push('Some source-linked project records remain announced or under development. Confirm permitting, financial close, power connections and construction milestones.');
 if(p.assets.some(x=>/historical|pending|revalidat/i.test(x.stage||'')))challenges.push('Some asset records are historical or explicitly pending operator/status reconfirmation. Avoid treating them as live 2026 operations.');
 challenges.push('For resources, obtain independently verified reserves, concession boundaries, extraction costs, environmental permits and logistics; asset counts are not resource quantities.');
 $('challenges').textContent='Due-diligence questions (not verified province risk scores): '+challenges.join(' ');
}
function renderBrief(p){
 const paragraphs=[];
 const y=p.latest,g=p.gini,electric=p.electricity;
 paragraphs.push(p.name+' · SLI provincial evidence brief. BPS preliminary 2025 provincial GRDP was '+(y.nominal===null?'unavailable':'IDR '+num(y.nominal/1000,1)+' trillion')+', with real GRDP growth '+num(y.growth,2)+'%, PMTB share '+num(y.pmtb,1)+'% and household consumption share '+num(y.household,1)+'%. PMTB is national-accounts capital formation, not BKPM realized investment.');
 if(g)paragraphs.push('Distributional context: March 2026 BPS expenditure Gini '+fixed(g.combined)+' (official national '+fixed(p.nationalGini)+'), with urban '+fixed(g.urban)+' and rural '+fixed(g.rural)+'. Inequality is not proof of broad-based growth, spending power or the distribution of economic returns. Cross-period relationships are not causal.');
 else paragraphs.push('BPS Gini unavailable for this province; inequality is not inferred.');
 if(electric.household!==null)paragraphs.push('Household electricity access source reports '+num(electric.household,3)+'% ('+(electric.householdDate||'dated series')+', '+(electric.quality||'scope not specified')+'). This is not evidence of reliable MW supply, availability or industrial tariffs.');
 else paragraphs.push('Comparable provincial household electrification is absent from the current SLI coverage. National and PLN-village measures cannot substitute for it.');
 if(electric.villagePln!==null)paragraphs.push('Separately, PLN village coverage is '+num(electric.villagePln,3)+'% ('+electric.villageDate+'); this is a different unit of observation from households.');
 const sectors=p.sectors.slice(0,5).map(x=>x.sector+' ('+x.count+' records)');
 paragraphs.push('Recorded sector footprint: '+(sectors.length?sectors.join('; '):'none geographically resolved in the selected registers')+'. '+p.assets.length+' registry records and '+p.projects.length+' linked projects have been matched to the province; these can overlap and are not an exhaustive inventory. They show documented activities, not proven underground reserves or sector GRDP shares.');
 paragraphs.push('Investment-relevant opportunities require a project-by-project assessment of feedstock, grid and reliable energy, infrastructure, logistics, permits, offtake, technology and human capital. Screening gaps are not negative risk ratings. Do not infer realized capital from announcements.');
 paragraphs.push('Statistical caveat: any displayed national cross-sectional correlation and within-province fixed-effects slope describe historical associations only; no investment causation, multiplier, jobs or value-added effect is identified. An input-output model requires a matched sector/region matrix and sourced coefficients.');
 paragraphs.push('Source vintage: BPS expenditure GRDP 2021–2025 (2025 preliminary), Gini March 2026, ESDM national RE 2026-Q1, and original dated project/asset registries. Strategic Latitude Intelligence · analyst synthesis, not investment advice.');
 const host=$('brief');host.replaceChildren();for(const sentence of paragraphs)host.append(e('p',sentence));
 briefText=paragraphs.join('\n\n');
}
function plotCorrelation(rows,xKey,yKey,national){
 const box=$('correlationChart');box.replaceChildren();
 const vals=rows.filter(r=>typeof r[xKey]==='number'&&Number.isFinite(r[xKey])&&typeof r[yKey]==='number'&&Number.isFinite(r[yKey]));
 if(vals.length<4){box.append(e('p','Not enough comparable provincial observations to support a correlation plot. No value imputed.'));return;}
 let xmin=Math.min(...vals.map(r=>r[xKey])),xmax=Math.max(...vals.map(r=>r[xKey]));
 let ymin=Math.min(...vals.map(r=>r[yKey])),ymax=Math.max(...vals.map(r=>r[yKey]));
 const dx=(xmax-xmin)*.06||1,dy=(ymax-ymin)*.08||.1;xmin-=dx;xmax+=dx;ymin-=dy;ymax+=dy;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 800 355');
 const make=(tag,attrs)=>{const o=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs||{}))o.setAttribute(k,String(v));return o;};
 const x=v=>63+(v-xmin)/(xmax-xmin)*700,y=v=>300-(v-ymin)/(ymax-ymin)*259;
 const txt=(x,y,t)=>{const o=make('text',{x,y,fill:'#c4d5dc','font-size':11,'text-anchor':'middle'});o.textContent=t;svg.append(o);};
 for(let i=0;i<=4;i++){const xx=63+i*175,yy=40+i*65;svg.append(make('line',{x1:63,x2:763,y1:yy,y2:yy,stroke:'#2e4c62','stroke-dasharray':'3 6'}));txt(xx,325,num(xmin+(xmax-xmin)*i/4,2));txt(30,yy,num(ymax-(ymax-ymin)*i/4,2));}
 const centerX=vals.reduce((a,r)=>a+r[xKey],0)/vals.length,centerY=vals.reduce((a,r)=>a+r[yKey],0)/vals.length;
 let vx=0,cxy=0;for(const r of vals){vx+=(r[xKey]-centerX)**2;cxy+=(r[xKey]-centerX)*(r[yKey]-centerY);}
 if(vx>0){const slope=cxy/vx;svg.append(make('line',{x1:x(xmin),x2:x(xmax),y1:y(centerY+slope*(xmin-centerX)),y2:y(centerY+slope*(xmax-centerX)),stroke:'#e0bc7d','stroke-width':2,'stroke-dasharray':'8 5'}));}
 for(const r of vals){const active=r.name===sel,c=make('circle',{cx:x(r[xKey]),cy:y(r[yKey]),r:active?8:5,fill:active?'#ecc582':'#8fc7c1',stroke:active?'#fff':'#1a4a59','stroke-width':active?2:1});
 const title=make('title');title.textContent=r.name+': '+xKey+'='+num(r[xKey],3)+', '+yKey+'='+num(r[yKey],3);c.append(title);c.setAttribute('tabindex','0');c.setAttribute('role','button');c.setAttribute('aria-label','Inspect '+r.name);
 c.addEventListener('click',()=>{$('province').value=r.name;sel=r.name;render();});c.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();$('province').value=r.name;sel=r.name;render();}});
 svg.append(c);}
 txt(390,347,xKey+' · 2025 unless otherwise marked');box.append(svg);
}
function renderStatistics(){
 const x=$('xVar').value,y=$('yVar').value,c=N.correlations(datasets),p=N.pearson(c.rows.map(r=>[r[x],r[y]]));
 $('pearson').textContent=p.r===null?'N/A':fixed(p.r,3);
 $('pairN').textContent=p.n+' / 38';
 const panel=N.laggedPanel(datasets.bps);
 $('beta').textContent=panel.beta===null?'N/A':fixed(panel.beta,3);
 $('panelN').textContent=panel.n+' · '+panel.provinces+' provinces';
 plotCorrelation(c.rows,x,y);
 $('correlationCommentary').textContent='Observed Pearson r='+fixed(p.r,3)+' (n='+p.n+') for '+x+' and '+y+'. '+(p.n<10?'Small / non-representative sample: do not generalize. ':'')+'All values are raw, cross-sectional observations; this statistic does not control for province size, structural heterogeneity or confounders. 2025 and March 2026 variables are not same-period measurements. '+p.warning;
 $('panelCommentary').textContent='One-way province fixed-effects, prior-year PMTB/GRDP share against next-year GRDP growth: slope '+fixed(panel.beta,3)+' percentage points of growth per percentage point of lagged PMTB share (not an investment multiplier). Matched n='+panel.n+' province-years in '+panel.provinces+' provinces. Within R²='+fixed(panel.withinR2,3)+'. '+panel.disclaimer;
}
function simulate(){
 const p=N.province(datasets,sel),url=$('coefficientSource').value.trim();
 const source=url.startsWith('https://')?url:null;
 const impact=N.scenario({investmentBillion:$('investment').value,grdpBillion:p.latest.nominal,multiplier:$('multiplier').value,source});
 $('scaleComparison').textContent=impact.directSize==null?'N/A':num(impact.directSize,3)+'%';
 $('multiplierOutput').textContent=impact.output===null||impact.output===undefined?'N/A':num(impact.output,2);
 $('impactNote').textContent=impact.reason+' '+(impact.status==='conditional'?'USER-SUPPLIED coefficient '+impact.multiplier+'; source URL supplied, NOT independently verified by SLI. Assess domestic final-demand share and avoid interpreting gross output as GRDP.':'');
}
function render(){
 if(!sel||!datasets.bps)return;
 const p=N.province(datasets,sel),v=p.latest;
 $('grdp').textContent=v.nominal===null?'N/A':num(v.nominal/1000,1);
 $('growth').textContent=v.growth===null?'N/A':num(v.growth,2)+'%';
 $('pmtb').textContent=v.pmtb===null?'N/A':num(v.pmtb,1)+'%';
 $('gini').textContent=p.gini?fixed(p.gini.combined):'N/A';
 $('giniBasis').textContent=p.gini?'BPS '+datasets.gini.measurement_period+' · Gini national '+fixed(p.nationalGini):'No source observation';
 $('assetCount').textContent=num(p.assets.length,0);
 renderTrend(p.annual);renderPower(p);renderIndustry(p);renderProjects(p);renderBrief(p);
 simulate();renderStatistics();
 $('macroNote').textContent='BPS expenditure GRDP vintage '+(datasets.bps?.sources?.pdrb?.released||'not specified')+'. 2025 values preliminary; new Papua provinces have missing early-year observations. The plot has separate y-axis scales and does not constitute a growth forecast.';
}
function attach(){
 $('province').addEventListener('change',event=>{sel=event.target.value;filter='';render();});
 $('sectorFilter').addEventListener('change',event=>{filter=event.target.value;renderAssets(N.province(datasets,sel));});
 $('xVar').addEventListener('change',renderStatistics);$('yVar').addEventListener('change',renderStatistics);
 $('simulate').addEventListener('click',simulate);
 $('copyBrief').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(briefText);$('copyBrief').textContent='Copied';}catch(e){$('copyBrief').textContent='Select text to copy';}});
}
async function init(){
 if(!N){$('state').textContent='Provincial analysis engine not available.';return;}
 attach();
 const settled=await Promise.all(SOURCE_LIST.map(async src=>{
  try{const response=await fetch('./'+src.path,{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();if(src.id==='bps'&&data.provinces?.length!==38)throw Error('Incomplete BPS 38-province dataset');
   return {src,data};
  }catch(err){return {src,error:err.message};}
 }));
 for(const x of settled){if(x.data)datasets[x.src.id]=x.data;else failures.push(x.src.id+': '+x.error);}
 if(!datasets.bps){$('state').textContent='Essential BPS GRDP dataset missing. No provincial metrics or statistics can be computed.';showSourceStatus();return;}
 datasets.assets=Object.fromEntries(N.SOURCES.filter(s=>datasets[s.id]).map(s=>[s.id,datasets[s.id]]));
 const prov=datasets.bps.provinces.map(p=>p.name),selector=$('province');
 selector.replaceChildren();for(const name of prov)selector.append(option(name,name));
 const requested=new URLSearchParams(window.location.search).get('province');
 sel=requested&&prov.includes(requested)?requested:(prov.includes('Jawa Barat')?'Jawa Barat':prov[0]);selector.value=sel;
 $('state').textContent='38-province economy loaded · '+(N.SOURCES.filter(s=>datasets[s.id]).length)+' of '+N.SOURCES.length+' asset layers loaded · '+failures.length+' missing feeds. Charts, correlations and scenarios are source-dependent. This is independent research, not an audited investment recommendation.';
 render();showSourceStatus();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();