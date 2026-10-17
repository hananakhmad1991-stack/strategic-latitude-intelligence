/* SLI source-aligned provincial evidence nexus. Missing is not zero. */
(function(root,make){
 const api=make();if(root)root.SLIProvincialNexus=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const ALIASES={
'Aceh':'Aceh','Sumatra Utara':'Sumatra Utara|Sumatera Utara|North Sumatra','Sumatra Barat':'Sumatra Barat|Sumatera Barat|West Sumatra','Riau':'Riau','Jambi':'Jambi','Sumatra Selatan':'Sumatra Selatan|Sumatera Selatan|South Sumatra','Bengkulu':'Bengkulu','Lampung':'Lampung','Kepulauan Bangka Belitung':'Kepulauan Bangka Belitung|Bangka Belitung Islands|Bangka Belitung','Kepulauan Riau':'Kepulauan Riau|Riau Islands',
'DKI Jakarta':'DKI Jakarta|Jakarta','Jawa Barat':'Jawa Barat|West Java','Jawa Tengah':'Jawa Tengah|Central Java','DI Yogyakarta':'DI Yogyakarta|Yogyakarta','Jawa Timur':'Jawa Timur|East Java','Banten':'Banten','Bali':'Bali','Nusa Tenggara Barat':'Nusa Tenggara Barat|West Nusa Tenggara','Nusa Tenggara Timur':'Nusa Tenggara Timur|East Nusa Tenggara',
'Kalimantan Barat':'Kalimantan Barat|West Kalimantan','Kalimantan Tengah':'Kalimantan Tengah|Central Kalimantan','Kalimantan Selatan':'Kalimantan Selatan|South Kalimantan','Kalimantan Timur':'Kalimantan Timur|East Kalimantan','Kalimantan Utara':'Kalimantan Utara|North Kalimantan',
'Sulawesi Utara':'Sulawesi Utara|North Sulawesi','Sulawesi Tengah':'Sulawesi Tengah|Central Sulawesi','Sulawesi Selatan':'Sulawesi Selatan|South Sulawesi','Sulawesi Tenggara':'Sulawesi Tenggara|Southeast Sulawesi','Gorontalo':'Gorontalo','Sulawesi Barat':'Sulawesi Barat|West Sulawesi',
'Maluku':'Maluku','Maluku Utara':'Maluku Utara|North Maluku','Papua Barat':'Papua Barat|West Papua','Papua Barat Daya':'Papua Barat Daya|Southwest Papua','Papua':'Papua','Papua Selatan':'Papua Selatan|South Papua','Papua Tengah':'Papua Tengah|Central Papua','Papua Pegunungan':'Papua Pegunungan|Highland Papua'};
const TERMS=Object.entries(ALIASES).flatMap(([province,names])=>names.split('|').map(alias=>({province,alias}))).sort((a,b)=>b.alias.length-a.alias.length);
const valid=v=>typeof v==='number'&&Number.isFinite(v);
function extract(text){
 if(typeof text!=='string'||!text.trim())return [];
 const hits=[];const lower=text.toLowerCase();
 for(const {province,alias} of TERMS){
  const match=alias.toLowerCase();let from=0;
  while(true){
   const i=lower.indexOf(match,from);if(i<0)break;from=i+match.length;
   const preceding=i?lower[i-1]:' ',following=lower[i+match.length]||' ';
   if(/[a-z]/.test(preceding)||/[a-z]/.test(following))continue;
   if(hits.some(h=>i>=h.start&&i+match.length<=h.end))continue;
   hits.push({province,start:i,end:i+match.length});
  }
 }
 return [...new Set(hits.map(x=>x.province))];
}
function resolve(text){
 if(!text||/\b(nationwide|national|all indonesia|multiple provinces|multi[- ]?province|various regions)\b/i.test(text))return {province:null,quality:'unlocated'};
 if(/\b(east|west|north|south|central|southeast)\s*\/\s*(east|west|north|south|central|southeast)\b/i.test(text))return {province:null,quality:'ambiguous'};
 const matches=extract(text);
 return matches.length===1?{province:matches[0],quality:'source-named'}:{province:null,quality:matches.length?'ambiguous':'unlocated'};
}
function locate(r){
 if(typeof r.province==='string')return resolve(r.province);
 if(Array.isArray(r.provinces)){
  const named=[...new Set(r.provinces.map(x=>resolve(x).province).filter(Boolean))];
  return named.length===1?{province:named[0],quality:'source-listed'}:{province:null,quality:named.length?'multi-site':'unlocated',listed:named};
 }
 return resolve(r.region);
}
const SOURCES=[
{id:'operators',path:'data/investment-operator-assets.json',label:'Oil/gas operators and assets'},
{id:'sectors',path:'data/strategic-map-sector-dossiers.json',label:'Coal and industrial dossiers'},
{id:'power',path:'data/strategic-map-power-fossil-renewable.json',label:'Electricity generation'},
{id:'smelters',path:'data/strategic-map-smelter-2026.json',label:'Mineral smelters'},
{id:'biofuels',path:'data/strategic-map-biofuel-smelters.json',label:'Biofuels'},
{id:'digital',path:'data/strategic-map-digital-ai.json',label:'Digital and AI infrastructure'},
{id:'crosschecks',path:'data/strategic-map-regional-crosschecks.json',label:'Regional project crosschecks'},
{id:'upstream',path:'data/strategic-map-upstream-wk.json',label:'Historical upstream WK dossiers'}
];
function assets(datasets){
 const assigned=[],excluded=[];let total=0;
 for(const src of SOURCES){
  for(const r of datasets?.[src.id]?.records||[]){
   total++;const loc=locate(r);
   const asset={id:src.id+'/'+(r.id||r.asset||r.name),asset:r.asset||r.name||'Unnamed',sector:r.sector||r.group||r.technology||'Other',stage:r.stage||'Not established',
     operator:r.operator||r.investor||null,source:r.source_url||r.source||null,year:r.evidence_date||r.source_vintage||null,
     provenance:src.label,sourceId:src.id,province:loc.province,quality:loc.quality,product:r.product||null,
     capacity:r.capacity?.value!=null?{value:r.capacity.value,unit:r.capacity.unit||null}:null,
     note:r.notes||r.scope_note||null};
   (loc.province?assigned:excluded).push(asset);
  }
 }
 return {assigned,excluded,total};
}
function projects(registry,name){
 return (registry?.records||[]).filter(r=>(r.provinces||[]).some(x=>resolve(x).province===name))
 .map(r=>({name:r.name,sector:r.sector,stage:r.stage,operator:r.investor,source:r.source_url,date:r.evidence_date,scope:r.provinces.length>1?'multi-site; nonadditive':'attributed province',basis:r.amount_basis}));
}
function power(energy,name){
 const e=energy?.electrification||{},p=e.regional_gaps?.find(x=>x.province===name),v=e.village_electrification?.lowest_pln_village_service?.find(x=>x.province===name);
 return {household:p?.ratio_total_pct??null,plnHousehold:p?.ratio_pln_pct??null,householdSource:p?.source||null,quality:p?.source_quality||null,householdDate:p?.vintage||null,
 villagePln:v?.pct??null,villageSource:v?e.village_electrification.source:null,villageDate:v?e.village_electrification.period:null,
 nationalHousehold:e.national?.ratio_total_pct??null,nationalHouseholdDate:e.national?.as_of||null,
 sourceNational:e.national?.source||null};
}
function annual(bps,name){
 const p=bps?.provinces?.find(x=>x.name===name);if(!p)return [];
 return (bps.grdp_years||[]).map((year,i)=>{
  const nom=p.grdp_current?.[i],real=p.grdp_constant?.[i],prior=i?p.grdp_constant?.[i-1]:null,invest=p.pmtb_current?.[i],consumer=p.household_current?.[i];
  return {year,nominal:valid(nom)?nom:null,real:valid(real)?real:null,
   growth:valid(real)&&valid(prior)&&prior>0?100*(real/prior-1):null,
   pmtb:valid(nom)&&nom>0&&valid(invest)?100*invest/nom:null,
   household:valid(nom)&&nom>0&&valid(consumer)?100*consumer/nom:null};
 });
}
function province(d,name){
 const y=annual(d.bps,name),g=d.gini?.provinces?.find(x=>x.name===name),a=assets(d.assets),
 items=a.assigned.filter(x=>x.province===name),sectors={};
 for(const item of items)(sectors[item.sector]??=[]).push(item);
 return {name,annual:y,latest:y.at(-1)||{},gini:g||null,nationalGini:d.gini?.national?.combined??null,
 electricity:power(d.energy,name),projects:projects(d.projects,name),assets:items,
 sectors:Object.entries(sectors).map(([sector,entries])=>({sector,count:entries.length})).sort((a,b)=>b.count-a.count),
 omitted:a.excluded.length,scanned:a.total,availableSources:Object.keys(d.assets||{}).length};
}
function pearson(values){
 const rows=values.filter(r=>valid(r[0])&&valid(r[1]));const n=rows.length;
 if(n<4)return {n,r:null,warning:'Too few comparable observations (minimum 4).'};
 const mx=rows.reduce((v,r)=>v+r[0],0)/n,my=rows.reduce((v,r)=>v+r[1],0)/n;
 let xx=0,yy=0,xy=0;for(const [x,y] of rows){xx+=(x-mx)**2;yy+=(y-my)**2;xy+=(x-mx)*(y-my);}
 return {n,r:xx&&yy?xy/Math.sqrt(xx*yy):null,warning:'Cross-sectional Pearson correlation. It does not identify causation or an investment multiplier.'};
}
function correlations(d){
 const rows=d.bps?.provinces?.map(p=>{const z=provinceLite(d,p.name);
 return z;})||[];
 return {growthPmtb:pearson(rows.map(r=>[r.pmtb,r.growth])),
 growthGini:pearson(rows.map(r=>[r.gini,r.growth])),
 pmtbGini:pearson(rows.map(r=>[r.pmtb,r.gini])),
 growthElectricity:pearson(rows.map(r=>[r.electrification,r.growth])),rows};
}
function provinceLite(d,name){
 const last=annual(d.bps,name).at(-1)||{},g=d.gini?.provinces?.find(x=>x.name===name);
 const e=power(d.energy,name);
 return {name,growth:last.growth,pmtb:last.pmtb,gini:g?.combined??null,electrification:e.household};
}
// Within-province demeaned descriptive FE association: one-year lagged PMTB share -> next year's real GRDP growth.
// Deliberately no significance stars, confidence intervals or causal claim.
function laggedPanel(bps){
 const grouped=[];
 for(const p of bps?.provinces||[]){
  const series=annual(bps,p.name),pairs=[];
  for(let i=0;i<series.length-1;i++)if(valid(series[i].pmtb)&&valid(series[i+1].growth))pairs.push({x:series[i].pmtb,y:series[i+1].growth,year:series[i+1].year});
  if(pairs.length>=2)grouped.push(pairs);
 }
 let xx=0,xy=0,yy=0,n=0;
 for(const a of grouped){
  const mx=a.reduce((v,r)=>v+r.x,0)/a.length,my=a.reduce((v,r)=>v+r.y,0)/a.length;
  for(const r of a){const x=r.x-mx,y=r.y-my;xx+=x*x;xy+=x*y;yy+=y*y;n++;}
 }
 return {beta:xx>0?xy/xx:null,withinR2:xx>0&&yy>0?(xy*xy)/(xx*yy):null,n,provinces:grouped.length,period:'2022–2025 growth; lagged 2021–2024 PMTB/GRDP share',
 disclaimer:'One-way province fixed-effects descriptive association, without time FE, robust SE or identification. Reverse causality, confounders and temporal shocks remain. Not a causal estimate or multiplier.'};
}
function scenario({investmentBillion,grdpBillion,multiplier,source}){
 const invest=Number(investmentBillion),base=Number(grdpBillion);
 if(!valid(invest)||invest<=0||!valid(base)||base<=0)return {status:'invalid',reason:'Positive scenario amount and known nominal provincial GRDP required.'};
 const m=multiplier==null||multiplier===''?null:Number(multiplier);
 const sourceURL=typeof source==='string'&&/^https:\/\//i.test(source.trim())?source.trim():null;
 const directSize=100*invest/base;
 if(!valid(m)||m<0||!sourceURL)return {status:'unestimated',directSize,multiplier:null,output:null,reason:'No sourced province/industry-specific input-output coefficient: multiplier unavailable; the investment-to-GRDP ratio is a scale comparison, not a GRDP contribution.'};
 return {status:'conditional',directSize,multiplier:m,output:invest*m,source:sourceURL,reason:'Conditional gross-output sensitivity only (NOT GRDP value-added, employment, net output or incremental realized spending). Requires coefficient matching sector, geography and reporting basis.'};
}
return {ALIASES,SOURCES,extract,resolve,locate,assets,projects,power,annual,province,pearson,correlations,laggedPanel,scenario};
});
