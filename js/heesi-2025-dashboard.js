/* ESDM HEESI 2025 · source-first national Sankey and provincial choropleth.
   All values are source-dated. PDF 34–37 energy balance; 134–135 installed
   capacity by 38 provinces; 136–137 geothermal resources for 32 provinces. */
(function(){"use strict";
const PDF="https://www.esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf";
const F="data/heesi-2025-integrated.json",G="data/indonesia-provinces.geojson",A="data/handbook-2025-pages.json",NS="http://www.w3.org/2000/svg";
const e=(t,c,v)=>{const n=document.createElement(t);if(c)n.className=c;if(v!==undefined)n.textContent=String(v);return n};
const svg=(t,p,o)=>{const n=document.createElementNS(NS,t);Object.entries(o||{}).forEach(([k,v])=>n.setAttribute(k,String(v)));if(p)p.append(n);return n};
const nf=(v,dp=1)=>Number(v).toLocaleString("en-US",{maximumFractionDigits:dp});
const src=(p)=>{const a=e("a",null,"ESDM Handbook · PDF p. "+p+" ↗");a.href=PDF+"#page="+p;a.target="_blank";a.rel="noopener noreferrer";return a};
function hdr(root,title,detail,pg){root.append(e("small","he25-eyebrow","ESDM · HEESI 2025 · JULY 2026"),e("h3",null,title),e("p","he25-note",detail),src(pg))}
function plotSankey(root,flows,mode){
 root.replaceChildren();
 const origins=[...new Set(flows.map(x=>x.source))].map(name=>({name,total:flows.filter(x=>x.source===name).reduce((s,x)=>s+x.value,0)})).sort((a,b)=>b.total-a.total);
 const ends=[...new Set(flows.map(x=>x.target))].map(name=>({name,total:flows.filter(x=>x.target===name).reduce((s,x)=>s+x.value,0)})).sort((a,b)=>b.total-a.total);
 const h=mode==="fuel"?620:420,W=1100;
 const scale=(h-48-Math.max(origins.length,ends.length)*12)/Math.max(origins.reduce((s,x)=>s+x.total,0),ends.reduce((s,x)=>s+x.total,0));
 function nodes(items){let pos=24;return new Map(items.map(x=>{const hh=x.total*scale;const n={...x,start:pos,end:pos+hh,offset:0};pos+=hh+12;return [x.name,n]}))}
 const left=nodes(origins),right=nodes(ends);
 const s=svg("svg",root,{viewBox:"0 0 1100 "+h,role:"img","aria-label":"ESDM 2025 official national energy balance Sankey"});
 const palette=["#e0b979","#75c2c4","#99afdb","#cfadca","#a5c889","#e4a287","#dacc85","#91c0a5"];
 const color=new Map(origins.map((x,i)=>[x.name,palette[i%palette.length]]));
 [...flows].sort((a,b)=>b.value-a.value).forEach(x=>{
  const l=left.get(x.source),r=right.get(x.target);if(!l||!r||!x.value)return;
  const wide=Math.max(.25,x.value*scale),y0=l.start+l.offset+wide/2,y1=r.start+r.offset+wide/2;
  l.offset+=wide;r.offset+=wide;
  const p=svg("path",s,{d:"M225,"+y0+" C440,"+y0+" 625,"+y1+" 830,"+y1,fill:"none",stroke:color.get(x.source),"stroke-width":wide,opacity:".55"});
  const tip=svg("title",p,{});tip.textContent=x.source+" → "+x.target+" · "+nf(x.value,0)+" thousand BOE";
 });
 for(const [kind,arr] of [["left",left],["right",right]]){
  for(const n of arr.values()){
   const x=kind==="left"?206:834;svg("rect",s,{x,y:n.start,width:13,height:Math.max(2,n.end-n.start),rx:2,fill:kind==="left"?color.get(n.name):"#dbe6ea"});
   const text=svg("text",s,{x:kind==="left"?195:855,y:(n.start+n.end)/2-2,fill:"#edf3f5","font-size":13,"text-anchor":kind==="left"?"end":"start"});
   text.textContent=n.name;
   const value=svg("text",s,{x:kind==="left"?195:855,y:(n.start+n.end)/2+13,fill:"#aec8d8","font-size":11,"text-anchor":kind==="left"?"end":"start"});
   value.textContent=nf(n.total,0);
  }
 }
}
function plotLine(root,series){
 root.replaceChildren();const w=900,h=270,lo=80,rt=20,max=Math.max(...series.values),min=Math.min(...series.values),diff=Math.max(1,max-min);
 const s=svg("svg",root,{viewBox:"0 0 900 270",role:"img","aria-label":series.name+" historical 2015–2025"});
 for(let i=0;i<=4;i++){const y=225-i*47;svg("line",s,{x1:lo,y1:y,x2:w-rt,y2:y,stroke:"#3d5870"});
  const label=svg("text",s,{x:lo-5,y:y+4,fill:"#b8d0dd","font-size":11,"text-anchor":"end"});label.textContent=nf(min+diff*i/4)}
 const points=series.values.map((v,i)=>[lo+(w-lo-rt)*i/10,225-188*(v-min)/diff]);
 svg("polyline",s,{points:points.map(x=>x.join(",")).join(" "),fill:"none",stroke:"#e6c37e","stroke-width":3});
 points.forEach((p,i)=>{const c=svg("circle",s,{cx:p[0],cy:p[1],r:4,fill:i===10?"#72ced0":"#d7b678"});
 const tt=svg("title",c,{});tt.textContent=(2015+i)+" · "+nf(series.values[i])+" "+series.unit;
 if(i%2===0||i===10){const label=svg("text",s,{x:p[0],y:251,fill:"#c8d7e1","font-size":11,"text-anchor":"middle"});label.textContent=String(2015+i)}});
}
function renderBalance(root,d){
 root.replaceChildren();root.className="he25-section";
 hdr(root,"Energy Balance 2025 · Sankey","Actual source cell flows, Thousand BOE. Toggle between final fuel-to-sector usage and national balance accounting.",34);
 const bar=e("div","he25-stats");for(const [title,v] of [["Primary energy supply (incl. biomass)",d.balance.primary_supply],["Final energy supply",d.balance.final_supply],["Final energy use",d.balance.final_energy_consumption],["Non-energy use",d.balance.non_energy_use]]){
 const tile=e("div","he25-stat");tile.append(e("small",null,title),e("strong",null,nf(v,0)),e("span",null,"thousand BOE"));bar.append(tile)}root.append(bar);
 const control=e("div","he25-controls"),a=e("button","he25-button","Final fuel → consuming sector"),b=e("button","he25-button","National balance accounting");
 a.type=b.type="button";control.append(a,b);root.append(control);
 const graphic=e("div","he25-sankey"),notes=e("p","he25-note");root.append(graphic,notes);
 function mode(k){a.setAttribute("aria-pressed",String(k==="fuel"));b.setAttribute("aria-pressed",String(k!=="fuel"));plotSankey(graphic,k==="fuel"?d.balance.fuel_to_sector:d.balance.stage_links,k);
 notes.textContent=k==="fuel"?"Every ribbon uses a printed fuel × sector cell on PDF pages 36–37. Aggregated row cells differ from reported total by ~1–2 thousand BOE due to source rounding. EV electricity is classified under transport.":
 "Signed accounting bridge based on PDF pages 34–37; net transformation adjustment is NOT equivalent to physical heat losses. Final supply and non-energy/statistical accounting stages retain original source boundaries."}
 a.addEventListener("click",()=>mode("fuel"));b.addEventListener("click",()=>mode("stage"));mode("fuel");
 const trend=e("div","he25-trend"),pick=e("select","he25-select"),plot=e("div","he25-plot"),caption=e("p","he25-note");
 trend.append(e("h4",null,"Energy indicators · revised 2015–2025 historical series"));
 d.series.forEach((v,i)=>{const o=e("option",null,v.name+" · "+v.unit);o.value=i;pick.append(o)});
 function line(){const s=d.series[Number(pick.value)];plotLine(plot,s);caption.textContent=s.unit+" · source printed pp. "+s.printed_pages+", PDF pp. "+s.pdf_pages+". "+(s.note||"Commercial energy series excludes traditional biomass; revised source figures.")}
 pick.addEventListener("change",line);trend.append(pick,plot,caption);root.append(trend);line();
}
function geomPath(g){
 const sets=g.type==="Polygon"?[g.coordinates]:g.type==="MultiPolygon"?g.coordinates:[];
 return sets.map(poly=>poly.map(ring=>ring.map((coord,i)=>(i?"L":"M")+((coord[0]-93)*19.2).toFixed(1)+","+((7.6-coord[1])*19.2).toFixed(1)).join(" ")+"Z").join(" ")).join(" ");
}
function renderMap(root,d,geo){
 root.replaceChildren();root.className="he25-section";hdr(root,"Provincial Energy Maps · 2025","38-province generating-capacity statistics and 32 reporting-province geothermal potential. No plant GPS is invented.",134);
 const select=e("select","he25-select");
 for(const [key,label] of [["power","Installed generation capacity · MW · 38 provinces"],["geo","Geothermal resources & reserves · MW · 32 provinces"]]){const o=e("option",null,label);o.value=key;select.append(o)}
 root.append(select);const layout=e("div","he25-map-layout"),map=e("div","he25-map"),side=e("aside","he25-map-sidebar");
 layout.append(map,side);root.append(layout);const disclaimer=e("p","he25-note");root.append(disclaimer);
 let chosen=null;
 function redraw(){
  const isGeo=select.value==="geo",set=isGeo?d.geothermal_provincial:d.provincial;
  const lookup=new Map(set.locations.map(x=>[x.province,x.value]));
  const max=Math.max(...set.locations.map(x=>x.value));
  map.replaceChildren();const s=svg("svg",map,{viewBox:"0 0 970 410",role:"img","aria-label":set.title+" provincial choropleth map"});
  for(const f of geo.features){const n=f.properties.name,val=lookup.get(n),known=val!==undefined;const factor=known?val/max:0;
   const fill=known?"hsl("+(45-26*factor)+",65%,"+(40+10*factor)+"%)":"#33495a";
   const p=svg("path",s,{d:geomPath(f.geometry),fill,stroke:n===chosen?"#fff":"#a1b7c6","stroke-width":n===chosen?2.5:.62,"fill-rule":"evenodd",cursor:known?"pointer":"default"});
   const tt=svg("title",p,{});tt.textContent=n+": "+(known?nf(val,2)+" MW":"not listed in this source table");p.addEventListener("click",()=>{chosen=n;redraw()});
  }
  side.replaceChildren();const found=set.locations.find(x=>x.province===chosen);
  side.append(e("h4",null,found?found.province:"Provinces · descending MW"),e("p","he25-selected",found?nf(found.value,2)+" MW":"Click a polygon or ranking"));
  const list=e("ol","he25-rank");for(const item of [...set.locations].sort((a,b)=>b.value-a.value).slice(0,12)){const li=e("li"),button=e("button","he25-rank-button");button.type="button";button.append(e("span",null,item.province),e("strong",null,nf(item.value,1)));button.addEventListener("click",()=>{chosen=item.province;redraw()});li.append(button);list.append(li)}side.append(list);
  const total=set.locations.reduce((s,r)=>s+r.value,0);side.append(e("p","he25-note","Published total "+nf(set.reported_total,2)+" MW · row sum "+nf(total,2)+" MW."));
  disclaimer.textContent=set.caution+" Source printed pp. "+set.printed_pages+" (PDF pp. "+set.pdf_pages+"). No-data provinces are not displayed as zero.";
 }
 select.addEventListener("change",()=>{chosen=null;redraw()});redraw();
}
function renderIndex(root,d){
 root.replaceChildren();root.className="he25-section";hdr(root,"172-page Handbook · Source & Table Index","Navigate all seven chapters, methodology, glossary and conversion tables. Full-text indexing runs independently of audited numerical charts.",7);
 const toc=e("div","he25-toc");for(const [name,info] of Object.entries(d.content_index)){
  const c=e("article","he25-toc-item");const p=Number(info.pdf_pages.split(/[-–]/)[0]);
  c.append(e("h4",null,name),e("p",null,info.focus.join("; ")),e("small",null,"Printed pp. "+info.print_pages),src(p));toc.append(c)}root.append(toc);
 const query=e("input","he25-search");query.type="search";query.placeholder="Search original PDF page text e.g. coal, EV, gas, LPG, 2025";
 const info=e("p","he25-note","Loading searchable archive when the official PDF source can be downloaded…"),results=e("div","he25-search-results");
 root.append(e("h4",null,"Search 172 PDF pages"),query,info,results);
 fetch(A,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("archive not published");return r.json()}).then(a=>{
  if(!root.isConnected)return;
  if(!Array.isArray(a.pages)||a.pages.length!==172)throw Error("incomplete archive");
  info.textContent="Full PDF text index active: "+a.pages.length+" pages. Source table column alignment should be checked against original PDF.";
  query.addEventListener("input",()=>{results.replaceChildren();const word=query.value.trim().toLowerCase();if(word.length<3)return;
   const found=a.pages.filter(x=>String(x.text).toLowerCase().includes(word)).slice(0,35);
   found.forEach(x=>{const v=String(x.text),i=v.toLowerCase().indexOf(word),c=e("div","he25-result");
    c.append(e("strong",null,"PDF page "+x.pdf_page),e("p",null,v.slice(Math.max(0,i-80),i+170)),src(x.pdf_page));results.append(c)});
   if(!found.length)results.append(e("p","he25-note","No matching page text."));
  });
 }).catch(()=>{info.textContent="Text extraction is awaiting source download; all original tables are accessible by chapter PDF links. The charts use individually verified rows; the entire book is not yet digitised into audited numerical time series.";});
}
window.initSLIHEESI2025=async function(){
 const ids=["he25BalanceRoot","he25ProvinceRoot","he25ArchiveRoot"];
 if(!ids.some(id=>document.getElementById(id)))return;
 try{
  const [d,geo]=await Promise.all([fetch(F,{cache:"no-store"}).then(x=>x.json()),fetch(G,{cache:"force-cache"}).then(x=>x.json())]);
  if(d.id!=="ESDM_HEESI_2025"||geo.features?.length!==38)throw Error("Invalid handbook input");
  const b=document.getElementById(ids[0]),m=document.getElementById(ids[1]),a=document.getElementById(ids[2]);
  if(b)renderBalance(b,d);if(m)renderMap(m,d,geo);if(a)renderIndex(a,d);
 }catch(err){console.error("[SLI ESDM handbook]",err);for(const id of ids){const n=document.getElementById(id);if(n){n.replaceChildren(e("p","he25-note","Handbook explorer is temporarily unavailable. "),src(1))}}}
};
})();