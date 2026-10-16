/* SLI HEESI Investor Energy Atlas · official ESDM 2025.
 * Province maps are exact source-row aggregates; no hidden estimated geolocation.
 * 22 source-dated annual series cover SPKLU, coal, consumption, trade, biofuels.
 * 2015–2025 / 2020–2025. Latest publication: July 2026, NOT live figures.
 */
(function(){"use strict";
const D="data/heesi-2025-investor-atlas.json", H="data/heesi-2025-integrated.json", GEO="data/indonesia-provinces.geojson",NS="http://www.w3.org/2000/svg";
const E=(tag,cls,txt)=>{const a=document.createElement(tag);if(cls)a.className=cls;if(txt!==undefined)a.textContent=String(txt);return a};
const S=(tag,up,attributes={})=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attributes))n.setAttribute(k,String(v));if(up)up.append(n);return n};
const f=(value,dp=2)=>Number(value).toLocaleString("en-US",{maximumFractionDigits:dp});
const original=(pdf,page)=>{const a=E("a",null,"ESDM original PDF · page "+page+" ↗");a.href=pdf+"#page="+page;a.target="_blank";a.rel="noopener noreferrer";return a};
const graphPath=(g)=>{
 const polys=g.type==="Polygon"?[g.coordinates]:g.type==="MultiPolygon"?g.coordinates:[];
 return polys.map(poly=>poly.map(ring=>ring.map((c,i)=>(i?"L":"M")+((c[0]-93)*19.2).toFixed(2)+","+((7.6-c[1])*19.2).toFixed(2)).join(" ")+"Z").join(" ")).join(" ");
};
function chartHistory(box,entries,unit){
 box.replaceChildren();const series=entries.filter(x=>x&&x.values.every(Number.isFinite));
 if(!series.length)return;
 const all=series.flatMap(x=>x.values),max=Math.max(...all),lo=Math.min(0,...all),dif=max-lo||1;
 const W=930,H=320,top=22,bottom=265,x0=80,x1=910;
 const canvas=S("svg",box,{viewBox:"0 0 930 320",role:"img","aria-label":series.map(x=>x.title).join(" vs ")+" original HEESI annual series"});
 for(let k=0;k<=4;k++){
  const y=bottom-(bottom-top)*k/4;S("line",canvas,{x1:x0,y1:y,x2:x1,y2:y,stroke:"#31536d"});
  const tx=S("text",canvas,{x:x0-8,y:y+4,"text-anchor":"end",fill:"#b9cedc","font-size":11});tx.textContent=f(lo+dif*k/4,1);
 }
 const years=series[0].years;
 for(let k=0;k<years.length;k++){const tx=S("text",canvas,{x:x0+(x1-x0)*k/(years.length-1),y:289,"text-anchor":"middle",fill:"#b7cbd9","font-size":11});tx.textContent=years[k]}
 const colors=["#edc87e","#66bfd2","#d8a2c9","#a5d290","#e2a180"];
 series.forEach((s,i)=>{const vals=s.values;const points=vals.map((v,k)=>[x0+(x1-x0)*k/(vals.length-1),bottom-(bottom-top)*(v-lo)/dif]);
  S("polyline",canvas,{points:points.map(x=>x.join(",")).join(" "),fill:"none",stroke:colors[i], "stroke-width":3});
  points.forEach(([x,y],k)=>{const c=S("circle",canvas,{cx:x,cy:y,r:3.5,fill:colors[i]});const tip=S("title",c);tip.textContent=s.years[k]+": "+f(s.values[k])+" "+unit;});
  const leg=S("text",canvas,{x:80+(i%3)*260,y:309,fill:colors[i],"font-size":11});leg.textContent=s.title.slice(0,36);
 });
}
function viewMap(parent,atlas,geo,baselines,defaultId){
 parent.replaceChildren();parent.className="he25-atlas-view";
 const all=[...atlas.maps,
  {id:"installed_total",name:"Total installed power capacity",unit:"MW",pdf_page:134,printed_page:118,national_total:baselines.provincial.reported_total,coverage:"38 province electricity capacity including captive generation",values:baselines.provincial.locations},
  {id:"geothermal_potential",name:"Geothermal geological resources & reserves",unit:"MW",pdf_page:136,printed_page:120,national_total:baselines.geothermal_provincial.reported_total,coverage:"32 province geothermal resource rows, not commissioned plants",values:baselines.geothermal_provincial.locations}
 ];
 const picker=E("select","he25-atlas-select");for(const m of all){const opt=E("option",null,m.name+" · "+m.unit);opt.value=m.id;picker.append(opt)}
 picker.value=all.some(x=>x.id===defaultId)?defaultId:"spklu";
 const subtitle=E("p","he25-atlas-subtitle");const layout=E("div","he25-atlas-layout"),map=E("div","he25-atlas-map"),side=E("aside","he25-atlas-side");
 layout.append(map,side);const source=E("div","he25-atlas-foot");parent.append(E("h4",null,"Provincial Investor Heatmap · switch between 9 indicators"),picker,subtitle,layout,source);
 let chosen=null;
 function update(){
  const layer=all.find(x=>x.id===picker.value);
  const lookup=new Map(layer.values.map(x=>[x.province,x.value]));
  const max=Math.max(...layer.values.map(x=>x.value),1);const sum=layer.values.reduce((s,x)=>s+x.value,0);
  subtitle.textContent="2025 · "+layer.coverage+" · unit "+layer.unit+" · publication July 2026.";
  map.replaceChildren();const draw=S("svg",map,{viewBox:"0 0 970 425",role:"img","aria-label":"38-province choropleth for "+layer.name});
  const text=S("text",draw,{x:19,y:23,fill:"#d9e7ed","font-size":15});text.textContent=layer.name;
  for(const feature of geo.features){
   const name=feature.properties.name,value=lookup.get(name),known=value!==undefined;
   const intensity=known?Math.sqrt(Math.max(0,value)/max):0;
   const color=known?value===0?"#344e60":"hsl("+(42-26*intensity)+",62%,"+(28+24*intensity)+"%)":"#21384b";
   const path=S("path",draw,{d:graphPath(feature.geometry),fill:color,stroke:name===chosen?"#fff":"#a0b8c5","stroke-width":name===chosen?2.4:.68,"fill-rule":"evenodd"});
   const title=S("title",path);title.textContent=name+": "+(known?f(value,2)+" "+layer.unit:"not individually reported");
   path.addEventListener("click",()=>{chosen=name;update()});
  }
  side.replaceChildren();
  const one=layer.values.find(x=>x.province===chosen);
  side.append(E("h4",null,one?one.province:"Top 15 Provinces"),E("p","he25-atlas-value",one?f(one.value,2)+" "+layer.unit:"Select a province for its official statistic"));
  const list=E("ol","he25-atlas-ranking");
  [...layer.values].sort((a,b)=>b.value-a.value).slice(0,15).forEach(item=>{const li=E("li");const b=E("button","he25-atlas-rank");b.type="button";b.append(E("span",null,item.province),E("strong",null,f(item.value,2)));b.addEventListener("click",()=>{chosen=item.province;update()});li.append(b);list.append(li)});
  side.append(list);
  source.replaceChildren();
  const delta=sum-layer.national_total;
  source.append(E("p",null,"Reported national total: "+f(layer.national_total,2)+" "+layer.unit+" · sum of disclosed province rows: "+f(sum,2)+" · difference "+f(delta,2)+" ("+(Math.abs(delta)<.021?"rounding":"review coverage")+") · "+layer.values.length+" province rows."));
  source.append(E("p",null,"Source vintage: 2025, issued 2026. Regional geological reserves ≠ annual coal production; SPKLU count ≠ connector utilization; installed refinery capacity ≠ fuel sales. Absence of a province from partial ESDM table means NO DATA, not zero."));
  source.append(original(atlas.source_url,layer.pdf_page));
 }
 picker.addEventListener("change",()=>{chosen=null;update()});update();
}
function viewSeries(parent,atlas,defaultTopic){
 parent.replaceChildren();parent.className="he25-atlas-series";
 parent.append(E("h4",null,"Energy Consumption, Coal, EV Charging & Bioenergy · 2015–2025"));
 const group=E("div","he25-atlas-controls"),topic=E("select","he25-atlas-select"),metric=E("select","he25-atlas-select");
 for(const [k,v] of [["consumption","Final energy consumption by sector"],["coal","Coal production / domestic use"],["ev","EV public charging consumption"],["bioenergy","Bioenergy / biodiesel / biomass"],["trade","Bilateral coal export volumes"]]){const o=E("option",null,v);o.value=k;topic.append(o)}
 topic.value=defaultTopic||"consumption";
 const plot=E("div","he25-atlas-plot"),foot=E("p","he25-atlas-foot");
 group.append(topic,metric);parent.append(group,plot,foot);
 function reload(){
  const choices=atlas.series.filter(x=>x.topic===topic.value),old=metric.value;metric.replaceChildren();
  for(const s of choices){const o=E("option",null,s.title+" · "+s.unit);o.value=s.id;metric.append(o)}
  metric.value=choices.some(x=>x.id===old)?old:(choices[0]?.id||"");
  draw();
 }
 function draw(){
  const s=atlas.series.find(x=>x.id===metric.value);if(!s)return;
  const same=atlas.series.filter(x=>x.topic===topic.value&&x.unit===s.unit&&x.years.length===s.years.length&&x.id!==s.id).slice(0,3);
  let group=[s];
  if(topic.value==="consumption"||topic.value==="coal"||topic.value==="trade")group=[s,...same.slice(0,topic.value==="consumption"?4:2)];
  chartHistory(plot,group,s.unit);
  foot.replaceChildren();foot.append(E("p",null,"Source: ESDM Handbook printed page "+s.printed_page+" (PDF "+s.pdf_page+"). Units: "+s.unit+". "+(s.note||"")+". Source rows are national by year, NOT verified provincial annual energy demand."));
  foot.append(original(atlas.source_url,s.pdf_page));
 }
 topic.addEventListener("change",reload);metric.addEventListener("change",draw);reload();
}
async function init(where,options={}){
 const root=typeof where==="string"?document.getElementById(where):where;if(!root)return;
 root.replaceChildren();const block=E("section","he25-investor-atlas");root.append(block);
 block.append(E("small","he25-atlas-kicker","ESDM · 2025 PROVINCIAL & HISTORICAL STATISTICS"),
  E("h3",null,"Investor Energy Atlas · Indonesia"),
  E("p","he25-atlas-lead","Interactive sourced provincial indicators (SPKLU/SPBKLU, verified coal resources and reserves, biodiesel & bioethanol capacities, power and geothermal) plus national historical energy consumption, coal and trade volumes. Published 2026; not realtime."));
 const waiting=E("p","he25-atlas-foot","Loading independently reconciled 2025 handbook tables…");block.append(waiting);
 try{
  const [a,base,geo]=await Promise.all([fetch(D,{cache:"no-store"}).then(r=>r.json()),fetch(H,{cache:"no-store"}).then(r=>r.json()),fetch(GEO,{cache:"force-cache"}).then(r=>r.json())]);
  if(a.id!=="HEESI-2025-INVESTOR-ATLAS"||geo.features?.length!==38)throw Error("Source schema not found");
  if(!block.isConnected)return;
  waiting.textContent="9 provincial map datasets · "+a.series.length+" source-dated longitudinal series · map boundaries: 38 provinces · source ESDM HEESI 2025.";
  const map=E("div","he25-atlas-mount"),chart=E("div","he25-atlas-mount");
  block.append(map,chart);
  viewMap(map,a,geo,base,options.map||"spklu");
  viewSeries(chart,a,options.topic||"consumption");
  const method=E("p","he25-atlas-method","Investor interpretation: source values represent sector conditions and geological/resource potential, not guarantees of investment returns. SPKLU consumption data is national-only in this handbook; provincial charging revenue is not inferred. Coal consumption by province is not provided by the source tables and is not fabricated. 'No data' is distinct from a reported zero. Always cite year, original units and source-page status.");
  block.append(method,original(a.source_url,131));
 }catch(error){waiting.textContent="ESDM Investor Atlas data not yet accessible; existing source-verified energy panels remain available.";console.warn("[SLI HEESI Investor Atlas]",error)}
}
window.initSLIHEESIInvestorAtlas=init;
})();