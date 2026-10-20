/* SLI Provincial Evidence Map — no inferred geography or Power BI-style inspector.
 * One validated GeoJSON province outline, reusable for source-attributed provincial series.
 * Never converts regional electricity service units or multi-province projects into provinces. */
(function(){
"use strict";
const NS="http://www.w3.org/2000/svg",GEO="./data/indonesia-provinces.geojson";
let geoPromise=null;
const id=x=>String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("id").replace(/[^a-z0-9]+/g," ").trim().replace(/^daerah istimewa yogyakarta$/,"di yogyakarta").replace(/^sumatera /,"sumatra ");
function load(){
 if(!geoPromise)geoPromise=fetch(GEO,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("GeoJSON HTTP "+r.status);return r.json()}).then(g=>{
  if(g?.type!=="FeatureCollection"||g.features?.length!==38||new Set(g.features.map(f=>id(f.properties?.name))).size!==38)throw Error("Provincial boundaries incomplete");
  return g;
 }).catch(error=>{geoPromise=null;throw error});
 return geoPromise;
}
function svg(tag,attrs){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs||{}))n.setAttribute(k,String(v));return n;}
function extent(features){
 let west=180,east=-180,south=90,north=-90;
 function visit(coords){
  if(!Array.isArray(coords))return;
  if(coords.length>=2&&typeof coords[0]==="number"&&typeof coords[1]==="number"){
   const [lon,lat]=coords;if(Number.isFinite(lon)&&Number.isFinite(lat)){west=Math.min(west,lon);east=Math.max(east,lon);south=Math.min(south,lat);north=Math.max(north,lat)}
  }else for(const c of coords)visit(c);
 }
 for(const f of features)visit(f.geometry?.coordinates);
 if(west>=east||south>=north)throw Error("Invalid provincial boundaries");
 return {west,east,south,north};
}
function pathFor(geom,project){
 if(!geom||!["Polygon","MultiPolygon"].includes(geom.type))return "";
 const polygons=geom.type==="Polygon"?[geom.coordinates]:geom.coordinates;
 const chunks=[];
 for(const polygon of polygons||[])for(const ring of polygon||[]){
  if(!ring?.length)continue;
  const points=ring.filter(c=>Array.isArray(c)&&Number.isFinite(c[0])&&Number.isFinite(c[1])).map(c=>project(c));
  if(points.length<3)continue;
  chunks.push("M"+points.map(([x,y])=>x.toFixed(1)+" "+y.toFixed(1)).join("L")+"Z");
 }
 return chunks.join(" ");
}
function fill(value,min,max){
 if(!Number.isFinite(value))return "#566779";
 const ratio=max>min?(value-min)/(max-min):.55;
 return ["#b9d6d6","#87bdbf","#57999f","#31747f","#175360"][Math.min(4,Math.max(0,Math.floor(ratio*5)))];
}
function format(value,opts){
 if(!Number.isFinite(value))return opts.missing||"N/A";
 const lang=document.documentElement.lang==="id"?"id-ID":"en-US";
 return new Intl.NumberFormat(lang,{maximumFractionDigits:opts.digits??2}).format(value)+(opts.unit?" "+opts.unit:"");
}
function normalizeRecords(records){
 const result=new Map();
 for(const x of records||[]){
  const key=id(x.name);
  if(key&&!result.has(key))result.set(key,{name:x.name,value:Number.isFinite(x.value)?x.value:null,period:x.period||null,source:x.source||null});
 }
 return result;
}
async function render(host,options={}){
 if(typeof host==="string")host=document.getElementById(host);
 if(!host)return false;
 const seq=(Number(host.dataset.sliProvinceMapSequence)||0)+1;
 host.dataset.sliProvinceMapSequence=String(seq);
 const active=()=>host.isConnected&&host.dataset.sliProvinceMapSequence===String(seq);
 const rows=normalizeRecords(options.records),selected=id(options.selected),empty=options.missing||"Tidak tersedia";
 try{
  const geo=await load();if(!active())return false;
  const scope=new Set(geo.features.map(f=>id(f.properties.name)));
  const valid=[...rows].filter(([name,x])=>scope.has(name)&&Number.isFinite(x.value));
  const values=valid.map(([,x])=>x.value),low=values.length?Math.min(...values):0,high=values.length?Math.max(...values):1;
  const bounds=extent(geo.features),W=960,H=370,pad=12;
  const width=bounds.east-bounds.west,height=bounds.north-bounds.south;
  const scale=Math.min((W-pad*2)/width,(H-pad*2)/height);
  const ox=(W-width*scale)/2,oy=(H-height*scale)/2;
  const project=([lon,lat])=>[ox+(lon-bounds.west)*scale,oy+(bounds.north-lat)*scale];
  const frame=document.createElement("div");frame.className="sli-province-map-frame";
  const view=svg("svg",{viewBox:"0 0 "+W+" "+H,role:"group","aria-label":options.label||"Peta indikator provinsi Indonesia"});
  for(const feature of geo.features){
   const name=feature.properties.name,key=id(name),record=rows.get(key),available=Number.isFinite(record?.value),chosen=key===selected;
   const path=svg("path",{d:pathFor(feature.geometry,project),"fill-rule":"evenodd",fill:chosen?"#efbd72":fill(record?.value,low,high),stroke:chosen?"#fff0c5":"#162f42","stroke-width":chosen?2.2:.8,"vector-effect":"non-scaling-stroke",class:"sli-province-shape"+(chosen?" selected":"")+(available?"":" unavailable"),tabindex:0,role:"button","aria-pressed":String(chosen),"aria-label":name+": "+format(record?.value,{...options,missing:empty})});
   const tooltip=svg("title");tooltip.textContent=name+" · "+format(record?.value,{...options,missing:empty})+" · "+(record?.period||options.period||"Periode tidak ditetapkan");path.append(tooltip);
   const select=()=>{if(typeof options.onSelect==="function")options.onSelect(name,record||null);};
   path.addEventListener("click",select);
   path.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();select()}});
   view.append(path);
  }
  frame.append(view);
  const legend=document.createElement("div");legend.className="sli-province-map-legend";
  for(const [color,label] of [["#b9d6d6","Rendah"],["#87bdbf",""],["#57999f",""],["#31747f",""],["#175360","Tinggi"],["#566779","N/A"],["#efbd72","Dipilih"]]){
   const span=document.createElement("span"),swatch=document.createElement("i");swatch.style.background=color;span.append(swatch,document.createTextNode(label));legend.append(span);
  }
  const info=document.createElement("p");info.className="sli-province-map-note";
  info.textContent=valid.length+" / 38 provinsi memiliki nilai • "+(options.period||"Periode dari dataset")+" • "+(options.source||"Sumber per dataset")+". Warna menunjukkan rentang data yang tersedia, bukan penilaian risiko atau proyeksi. Batas provinsi ilustratif.";
  host.replaceChildren(frame,legend,info);
  return true;
 }catch(error){
  if(active()){host.replaceChildren();const message=document.createElement("p");message.className="sli-province-map-error";message.textContent="Peta belum tersedia: "+error.message+". Tabel dan rincian sumber tetap dapat digunakan.";host.append(message)}
  return false;
 }
}
window.SLIProvinceMap={render,load,normalize:id,normalizeRecords,format};
})();
