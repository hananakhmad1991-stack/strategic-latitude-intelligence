/* SLI USGS MCS 2026 + 2024 Indonesia Minerals Yearbook integration.
   Interactive, source-dated, zero external dependencies. */
(function(){"use strict";
const PATH="data/usgs-indonesia-minerals-2026.json",SVGNS="http://www.w3.org/2000/svg";
const C=["#e3be80","#79bfd1","#91c7a8","#bba7de","#ecac9b"];
function E(tag,cls,t){const el=document.createElement(tag);if(cls)el.className=cls;if(t!==undefined&&t!==null)el.textContent=String(t);return el}
function S(tag,attrs,parent,t){const el=document.createElementNS(SVGNS,tag);for(const [k,v] of Object.entries(attrs||{}))el.setAttribute(k,String(v));if(t!==undefined)el.textContent=String(t);if(parent)parent.append(el);return el}
function fmt(v,unit=""){if(!Number.isFinite(v))return"—";const abs=Math.abs(v);return (abs>=1e6?(v/1e6).toFixed(abs%1e6===0?0:2)+"m":abs>=1e3?(v/1e3).toFixed(abs%1e3===0?0:1)+"k":Number.isInteger(v)?String(v):v.toFixed(1))+(unit?" "+unit:"")}
function exact(v){return Number(v).toLocaleString("en-US",{maximumFractionDigits:2})}
function link(url,text){const a=E("a","sli-usgs-link",text);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a}
function title(block,eyebrow,heading,desc){block.append(E("div","sli-usgs-overline",eyebrow),E("h3",null,heading),E("p","sli-usgs-desc",desc))}
function panel(){return E("section","sli-usgs-panel")}
function note(body,text){body.append(E("p","sli-usgs-note",text))}
function sourceLink(container,source){container.append(link(source.url,"USGS · "+source.title+" ↗"))}
function makeSourceLookup(d){return new Map(d.sources.map(s=>[s.id,s]))}
function renderNational(stage,d,refs){
 const p=panel();title(p,"USGS · MINERAL COMMODITY SUMMARIES 2026","Indonesia Mineral Position","USGS 2024 global production rankings and MCS 2026 nickel estimates use different reference years. Select a source year before comparing.");
 const strip=E("div","sli-usgs-snapshot");
 for(const m of d.headline.filter(x=>["nickel_2025","nickel_reserves_2026","nickel_global_share_2025","cobalt_share_2025"].includes(x.id))){
  const card=E("article","sli-usgs-metric");
  card.append(E("small",null,m.label),E("strong",null,m.unit==="%"?m.value.toFixed(1)+"%":fmt(m.value,m.unit)),E("span",null,m.year),E("p",null,m.note));
  strip.append(card);
 }
 p.append(strip);
 const sub=E("h4",null,"Indonesia's world mine-production shares · 2024");
 p.append(sub);
 const bars=E("div","sli-usgs-share-bars");
 for(const m of [...d.rank2024].sort((a,b)=>b.global_share-a.global_share)){
  const line=E("div","sli-usgs-share-row");
  line.append(E("div","sli-usgs-share-name",m.commodity),E("div","sli-usgs-share-track"),E("strong",null,m.global_share+"%"),E("span","sli-usgs-rank","#"+m.rank));
  const track=line.children[1],fill=E("div","sli-usgs-share-fill");fill.style.width=m.global_share+"%";track.append(fill);bars.append(line);
 }
 p.append(bars);
 note(p,"2024 reported by USGS Indonesia country profile. MCS 2026: 2.6 Mt Indonesian mined nickel vs 3.9 Mt world 2025 estimates → 66.7% is an SLI division of rounded values, NOT a USGS published share. Reserves (62 Mt Ni) are a mineral stock, not annual production.");
 const foot=E("div","sli-usgs-citation-row");sourceLink(foot,refs.get("mcs2026"));sourceLink(foot,refs.get("country2024"));p.append(foot);stage.append(p);
}
function drawLine(svg,points,color,width=2.5,dashed=false){S("polyline",{points:points.map(p=>p.join(",")).join(" "),stroke:color,"stroke-width":width,fill:"none","stroke-linecap":"round","stroke-linejoin":"round",...(dashed?{"stroke-dasharray":"5 4"}:{})},svg)}
function renderProduction(stage,d,refs){
 const p=panel();title(p,"USGS · MINERALS YEARBOOK 2024","Production & Processing Trends · 2020–2024","Choose a value chain. Each series is independently normalized to its own 2020–2024 maximum for comparison of direction; absolute tonnes appear in the table.");
 const controls=E("div","sli-usgs-controls");
 const select=E("select","sli-usgs-select");select.setAttribute("aria-label","Select mineral production family");
 d.trend_groups.forEach((g,i)=>{const o=E("option",null,g.label);o.value=g.key;if(i===0)o.selected=true;select.append(o)});
 const year=E("select","sli-usgs-select");year.setAttribute("aria-label","Select production detail year");
 [2020,2021,2022,2023,2024].forEach(y=>{const o=E("option",null,String(y));o.value=String(y);if(y===2024)o.selected=true;year.append(o)});
 controls.append(E("label",null,"Value chain"),select,E("label",null,"Data table year"),year);p.append(controls);
 const legend=E("div","sli-usgs-legend"),plot=E("div","sli-usgs-svg-wrap"),detail=E("div","sli-usgs-table-wrap"),explain=E("p","sli-usgs-note");
 p.append(legend,plot,explain,detail);
 const idx=new Map(d.series.map(x=>[x.id,x]));
 function render(){
  const g=d.trend_groups.find(x=>x.key===select.value)||d.trend_groups[0];
  const lines=g.ids.map(i=>idx.get(i)).filter(Boolean),yearValue=Number(year.value)||2024;
  legend.replaceChildren();plot.replaceChildren();detail.replaceChildren();
  const svg=S("svg",{viewBox:"0 0 780 300",role:"img","aria-label":"Five-year indexed normalized production trends, 2020–2024; absolute values shown in table",class:"sli-usgs-line-svg"},plot);
  const X=i=>72+i*160,Y=v=>246-v*190;
  for(let i=0;i<=4;i++){const y=Y(i/4);S("line",{x1:72,y1:y,x2:718,y2:y,stroke:"#3c596e","stroke-dasharray":"3 5"},svg);S("text",{x:56,y:y+4,"text-anchor":"end",fill:"#a9c0cd","font-size":11},svg,i*25+"%")}
  for(let i=0;i<5;i++)S("text",{x:X(i),y:273,"text-anchor":"middle",fill:"#afc8d8","font-size":12},svg,String(2020+i));
  const table=E("table","sli-usgs-table"),head=E("thead"),tr=E("tr");
  for(const h of ["Production metric","Unit",String(yearValue),"Status"])tr.append(E("th",null,h));head.append(tr);table.append(head);
  const tbody=E("tbody");const yearI=yearValue-2020;
  lines.forEach((line,i)=>{
   const color=C[i%C.length],max=Math.max(...line.values,1);
   const pts=line.values.map((v,j)=>[X(j),Y(v/max)]);
   drawLine(svg,pts,color,2.9);
   pts.forEach((point,j)=>{const dot=S("circle",{cx:point[0],cy:point[1],r:4.1,fill:color,stroke:"#112b40","stroke-width":2},svg);S("title",{},dot,line.label+" · "+(2020+j)+": "+exact(line.values[j])+" "+line.unit+(line.estimated[j]?" (estimated)":""))});
   const key=E("span","sli-usgs-legend-item");const swatch=E("span","sli-usgs-swatch");swatch.style.background=color;key.append(swatch,E("span",null,line.label));legend.append(key);
   const row=E("tr");row.append(E("td",null,line.label),E("td",null,line.unit),E("td",null,exact(line.values[yearI])),E("td",null,line.estimated[yearI]?"e · estimated":"Reported"));tbody.append(row);
  });
  table.append(tbody);detail.append(table);
  explain.textContent=g.why+" · Each line's 100% is its own maximum (NOT percentage of world production). Select another chain/year to inspect absolute tonnes.";
 }
 select.value=d.trend_groups[0].key;year.value="2024";select.addEventListener("change",render);year.addEventListener("change",render);render();
 const foot=E("div","sli-usgs-citation-row");sourceLink(foot,refs.get("country2024"));sourceLink(foot,refs.get("data2024"));p.append(foot);stage.append(p);
}
function renderChain(stage,d,refs){
 const p=panel();title(p,"USGS · PHYSICAL VALUE CHAINS","Mine → Intermediate → Refined Products","Interactive processing diagram with source-recorded 2024 outputs. Path arrows are qualitative links, NOT calibrated mass-balance Sankey flows.");
 const select=E("select","sli-usgs-select");select.setAttribute("aria-label","Choose mineral processing chain");
 for(const item of d.chain){const op=E("option",null,item.label);op.value=item.id;select.append(op)}p.append(select);
 const canvas=E("div","sli-usgs-process"),disclaimer=E("p","sli-usgs-note");
 p.append(canvas,disclaimer);
 const idx=new Map(d.series.map(x=>[x.id,x]));
 function draw(){const item=d.chain.find(x=>x.id===select.value)||d.chain[0];canvas.replaceChildren();
  const nodes=E("div","sli-usgs-process-nodes");
  item.nodes.forEach((node,i)=>{
   const series=idx.get(node.series_id),card=E("div","sli-usgs-process-node "+node.color),val=series?series.values[4]:null;
   card.append(E("small",null,"STAGE "+(i+1)),E("strong",null,node.name),E("span",null,fmt(val,series?.unit)),E("small",null,series?.estimated[4]?"2024e · estimated":"2024 · reported"));
   nodes.append(card);if(i<item.nodes.length-1)nodes.append(E("div","sli-usgs-process-arrow","→"));
  });canvas.append(nodes);disclaimer.textContent=item.note;
 }
 select.value=d.chain[0].id;select.addEventListener("change",draw);draw();
 p.append(link(refs.get("country2024").url,"USGS Indonesia material processing source ↗"));stage.append(p);
}
function renderGeo(stage,d,refs){
 const p=panel();title(p,"USGS · FACILITIES & REGIONAL FOOTPRINT","Mineral Industry Location Explorer","Approximate regional coordinate locator (not site GPS, licensed mine boundaries or an authoritative geographic basemap). Click a marker to inspect USGS evidence.");
 const wrap=E("div","sli-usgs-geo-layout"),map=E("div","sli-usgs-map"),details=E("div","sli-usgs-site-info");
 const svg=S("svg",{viewBox:"0 0 760 370",role:"img","aria-label":"Approximate longitude latitude regional location of six Indonesian mineral clusters and sites"},map);
 function x(lon){return 45+(lon-95)/47*665}
 function y(lat){return 335-(lat+10)/17*295}
 // Grid and position markers (avoid false geographic silhouette precision)
 for(let lon=100;lon<=140;lon+=10){const px=x(lon);S("line",{x1:px,y1:25,x2:px,y2:335,stroke:"#36546a","stroke-dasharray":"4 6"},svg);S("text",{x:px,y:351,"text-anchor":"middle",fill:"#96afbf","font-size":11},svg,lon+"°E")}
 for(let lat=-5;lat<=5;lat+=5){const py=y(lat);S("line",{x1:45,y1:py,x2:710,y2:py,stroke:"#36546a","stroke-dasharray":"4 6"},svg);S("text",{x:34,y:py+4,"text-anchor":"end",fill:"#96afbf","font-size":11},svg,Math.abs(lat)+"°"+(lat<0?"S":"N"))}
 S("text",{x:380,y:20,"text-anchor":"middle",fill:"#e6c68d","font-size":15,"font-weight":700},svg,"INDONESIA · REGIONAL LOCATION GRID");
 const points=[];
 const show=(site)=>{details.replaceChildren(E("small",null,site.location),E("h4",null,site.name),E("p",null,site.operator),E("p",null,"Commodity: "+site.commodity),E("p",null,"Status at source date: "+site.status));
  if(site.capacity!==null)details.append(E("strong",null,exact(site.capacity)+" "+site.capacity_unit));
  details.append(E("p","sli-usgs-note",site.note),link(refs.get(site.source_id).url,"USGS underlying evidence ↗"));
  for(const p of points)p.circle.setAttribute("stroke",p.id===site.id?"#ffdf8b":"#15374a");
 };
 d.sites.forEach((site,i)=>{const px=x(site.lon),py=y(site.lat),g=S("g",{tabindex:0,role:"button","aria-label":"Inspect "+site.name},svg);
  S("circle",{cx:px,cy:py,r:15,fill:C[i%C.length],opacity:.2},g);
  const dot=S("circle",{cx:px,cy:py,r:7,fill:C[i%C.length],stroke:"#15374a","stroke-width":3},g);
  const textX=px+(px>570?-12:12),anchor=px>570?"end":"start";
  S("text",{x:textX,y:py-14,"text-anchor":anchor,fill:"#d3e2ea","font-size":11},g,site.location.split(",")[0]);
  points.push({id:site.id,circle:dot});
  g.addEventListener("click",()=>show(site));g.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();show(site)}});
 });
 wrap.append(map,details);p.append(wrap);show(d.sites[0]);stage.append(p);
}
function renderTrade(stage,d,refs){
 const p=panel();title(p,"USGS · INDONESIA MINERAL TRADE 2024","Export / Import Partner Exposure","Bilateral flow bands derived from USGS 2024 aggregate HS-category totals × partner shares; widths are proportional within each category only. No fabricated trade balance.");
 const gdp=E("div","sli-usgs-economy-grid");
 for(const item of d.economic2024||[]){
  const card=E("article","sli-usgs-economy-card");
  card.append(E("small",null,item.label),E("strong",null,"~"+item.share_gdp+"% of GDP"),E("span",null,String(item.year)),E("p",null,item.note));
  gdp.append(card);
 }
 if(gdp.children.length)p.append(E("h4",null,"Indonesia · 2024 non-fuel minerals economic footprint"),gdp);
 const flowGrid=E("div","sli-usgs-trade-grid");
 d.trade.flows.forEach(f=>{
  const card=E("div","sli-usgs-trade-card"),partner=f.calc_value,other=f.total-partner;
  card.append(E("small",null,f.direction.toUpperCase()+" · "+f.group),E("strong",null,"US$"+exact(f.total)+"bn"),
   E("p",null,(f.direction==="export"?"Indonesia → ":"Indonesia ← ")+f.partner+" · "+f.share+"%"));
  const band=E("div","sli-usgs-trade-band");band.setAttribute("role","img");band.setAttribute("aria-label",f.partner+" "+exact(partner)+" billion USD; all other partners "+exact(other)+" billion USD");
  const share=E("div","sli-usgs-trade-known");share.style.width=f.share+"%";const rest=E("div","sli-usgs-trade-other");rest.style.width=(100-f.share)+"%";
  band.append(share,rest);card.append(band,E("p","sli-usgs-trade-legend",f.partner+" ≈ US$"+partner.toFixed(2)+"bn · Others ≈ US$"+other.toFixed(2)+"bn (derived)"));
  flowGrid.append(card);
 });p.append(flowGrid);
 const prod=E("div","sli-usgs-product-grid");for(const x of d.trade.products){const card=E("div","sli-usgs-product-card");card.append(E("small",null,x.direction.toUpperCase()),E("strong",null,"US$"+x.value+"bn"),E("p",null,x.label));prod.append(card)}p.append(E("h4",null,"Selected commodity flows (already included in broad categories)"),prod);
 note(p,d.trade.note);p.append(link(refs.get("country2024").url,"USGS 2024 mineral trade source ↗"));stage.append(p);
}
function renderSources(stage,d,refs){
 const p=panel();title(p,"USGS · REPORT & TABLE PROVENANCE","Production, Trade & Methodology Sources","Original source vintage, production perimeter and license; no independent claim of 2026 real-time market values.");
 const grid=E("div","sli-usgs-sources");for(const source of d.sources){const card=E("div","sli-usgs-source");card.append(E("strong",null,source.title),E("small",null,source.date),E("p",null,source.scope),link(source.url,"Open USGS original ↗"));grid.append(card)}p.append(grid);
 const context=E("details","sli-usgs-policy-history");
 context.append(E("summary",null,"USGS historical policy developments · refer to current Policy & Risk"));
 const list=E("div","sli-usgs-policy-list");
 for(const item of d.policy_context||[]){
  const card=E("div","sli-usgs-policy-card");
  card.append(E("small",null,String(item.year)),E("strong",null,item.label),E("p",null,item.detail));
  list.append(card);
 }
 context.append(list,E("p","sli-usgs-note","Historical reporting, not evidence of current legal status. SLI Policy & Risk remains the canonical legal register."));
 p.append(context);stage.append(p);
}
function renderMethods(stage,d){const p=panel();title(p,"USGS · MEASUREMENT DISCIPLINE","Definitions and Dataset Caveats","Read this before comparing tonnes of ore, metal content, installed capacity, annual output, reserves or export values.");
 const ul=E("ul","sli-usgs-bullets");for(const x of d.methodology)ul.append(E("li",null,x));p.append(ul);stage.append(p)}
window.initSLIUSGSMinerals=async function(sections){
 if(!Array.isArray(sections)||sections.length<9)return;
 const response=await fetch(PATH,{cache:"no-store"});if(!response.ok)throw Error("USGS data HTTP "+response.status);
 const d=await response.json();if(!d.series?.length||!d.sources?.length)throw Error("Malformed USGS source data");
 const refs=makeSourceLookup(d);
 renderNational(sections[1],d,refs);
 renderProduction(sections[2],d,refs);
 renderChain(sections[2],d,refs);
 renderGeo(sections[2],d,refs);
 renderTrade(sections[3],d,refs);
 renderSources(sections[6],d,refs);
 renderMethods(sections[8],d);
};
})();