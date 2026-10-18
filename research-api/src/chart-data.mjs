/* Deterministic chart construction from selected, source-linked public evidence.
   Charts never trust model-produced chart numbers and never fill missing values.
   Period and unit are held constant within each series.
*/
const validText=x=>typeof x==="string"&&x.length>0&&x.length<180;
function normalizedStage(input){
 const s=String(input||"").toLowerCase();
 if(/operational|operating|commissioned/.test(s))return "Operational";
 if(/under construction|construction/.test(s))return "Under construction";
 if(/mixed implementation/.test(s))return "Mixed implementation";
 if(/planning|early works|announced|feasibility|design/.test(s))return "Announced / planning";
 return null;
}
export function buildResearchCharts(evidence,language="id"){
 if(!Array.isArray(evidence)||!evidence.length)return [];
 const groups=new Map(),project=new Map();
 evidence.slice(0,12).forEach((src,i)=>{
  const cite=i+1;
  for(const m of Array.isArray(src.chart_measures)?src.chart_measures:[]){
   if(!m||!validText(m.series)||!validText(m.category)||!validText(m.unit)||!validText(m.period)||
    typeof m.value!=="number"||!Number.isFinite(m.value))continue;
   const key=[m.series,m.unit,m.period].join("|");
   if(!groups.has(key))groups.set(key,{title:m.label||m.series,unit:m.unit,period:m.period,values:new Map(),order:i});
   const g=groups.get(key);
   if(!g.values.has(m.category))g.values.set(m.category,{label:m.category,value:m.value,source:cite});
  }
  const p=src.chart_project,stage=normalizedStage(p?.stage);
  if(p&&stage&&validText(p.id)&&!project.has(p.id))project.set(p.id,{stage,source:cite});
 });
 const charts=[];
 for(const g of [...groups.values()].sort((a,b)=>a.order-b.order)){
  const data=[...g.values.values()];
  if(data.length<2||data.length>38)continue;
  charts.push({
   type:"bar",title:g.title,unit:g.unit,period:g.period,points:data.slice(0,12),
   source_refs:[...new Set(data.map(d=>d.source))],
   note:language==="en"?"Observed values from selected cited evidence; identical measure, unit and period. No causal inference.":
    "Nilai observasi dari sumber terpilih; indikator, satuan dan periode sama. Bukan hubungan kausal."
  });
  if(charts.length>=2)break;
 }
 const counts=new Map(),refs=new Map();
 for(const entry of project.values()){
  counts.set(entry.stage,(counts.get(entry.stage)||0)+1);
  if(!refs.has(entry.stage))refs.set(entry.stage,[]);
  refs.get(entry.stage).push(entry.source);
 }
 if(project.size>=2&&counts.size>=2){
  const stages=["Operational","Under construction","Mixed implementation","Announced / planning"].filter(stage=>counts.has(stage));
  const data=stages.map(stage=>({label:stage,value:counts.get(stage),source:refs.get(stage)[0]}));
  charts.unshift({
   type:"bar",title:language==="en"?"Curated project stages (unique projects)":"Tahapan proyek terkurasi (proyek unik)",
   unit:language==="en"?"projects":"proyek",period:"various source dates",points:data,
   source_refs:[...new Set([...project.values()].map(p=>p.source))],
   note:language==="en"?"Counts cover only distinct projects in retrieved evidence, not the national universe, asset count, or verified operational capacity.":
    "Jumlah hanya mencakup proyek unik dalam bukti terpilih, bukan total nasional, jumlah fasilitas atau kapasitas beroperasi."
  });
 }
 return charts.slice(0,3);
}
