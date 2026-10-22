/* WPP-NRI polygons streamed on opt-in from BIG Kebijakan Satu Peta official ArcGIS service.
 * No approximated WPP shapes, no redistribution, no calculated stock/landing totals.
 */
export const BIG_LAYER="https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/SUMBER_DAYA_ALAM_DAN_LINGKUNGAN/MapServer/21";
export const WPP_CODES=["571","572","573","711","712","713","714","715","716","717","718"];
export const WPP_AREAS={
"571":"Selat Malaka dan Laut Andaman","572":"Samudera Hindia barat Sumatera dan Selat Sunda","573":"Samudera Hindia selatan Jawa–Nusa Tenggara, Laut Sawu, Laut Timor barat",
"711":"Selat Karimata dan Laut Natuna","712":"Laut Jawa","713":"Selat Makassar, Teluk Bone, Laut Flores, Laut Bali",
"714":"Teluk Tolo dan Laut Banda","715":"Teluk Tomini, Laut Maluku, Laut Halmahera, Laut Seram, Teluk Berau",
"716":"Laut Sulawesi dan utara Halmahera","717":"Teluk Cenderawasih dan Samudera Pasifik","718":"Laut Aru, Arafura, dan Laut Timor timur"};
const norm=x=>String(x??"").toUpperCase().replace(/[^0-9]/g,"");
export function wppCode(props){
 const a=norm(props?.kodwpp),b=norm(props?.namobj);
 return WPP_CODES.find(x=>a===x||b===x)||null;
}
export function validateOfficialWPP(data){
 const errors=[],unique=new Map();let vertices=0;
 if(data?.type!=="FeatureCollection"||!Array.isArray(data.features)||data.features.length<11||data.features.length>250)errors.push("feature_count");
 for(const feature of data?.features||[]){
  const code=wppCode(feature.properties),geom=feature.geometry;
  if(!code){errors.push("unrecognized_wpp");continue}
  if(!["Polygon","MultiPolygon"].includes(geom?.type)){errors.push("geometry_type");continue}
  unique.set(code,(unique.get(code)||0)+1);
  const polygons=geom.type==="Polygon"?[geom.coordinates]:geom.coordinates;
  if(!Array.isArray(polygons)||!polygons.length){errors.push("polygon_empty");continue}
  for(const poly of polygons)for(const ring of poly){
   if(!Array.isArray(ring)||ring.length<4||ring.length>120000){errors.push("ring_length");continue}
   const first=ring[0],last=ring[ring.length-1];
   if(first?.[0]!==last?.[0]||first?.[1]!==last?.[1])errors.push("ring_open");
   for(const p of ring){
    vertices++;
    if(!Array.isArray(p)||p.length<2||!Number.isFinite(p[0])||!Number.isFinite(p[1])||p[0]<90||p[0]>146||p[1]<-16||p[1]>13){errors.push("coordinate_outside_indonesia");break}
   }
  }
 }
 if(unique.size!==11||WPP_CODES.some(code=>!unique.has(code)))errors.push("not_all_11_wpp");
 if(vertices<44||vertices>2000000)errors.push("vertex_count");
 return {pass:errors.length===0,errors:[...new Set(errors)],codes:[...unique.keys()].sort(),features:data?.features?.length||0,vertices};
}
export function renderOfficialWPPPaths(data,width=920,height=430){
 const features=data.features,bounds={west:90,east:146,south:-16,north:13},pad=16;
 const scale=Math.min((width-2*pad)/(bounds.east-bounds.west),(height-2*pad)/(bounds.north-bounds.south));
 const X=lon=>pad+(lon-bounds.west)*scale,Y=lat=>pad+(bounds.north-lat)*scale;
 const polys=[];
 for(const feature of features){
  const code=wppCode(feature.properties),g=feature.geometry,groups=g.type==="Polygon"?[g.coordinates]:g.coordinates;
  const segments=[];
  for(const poly of groups)for(const ring of poly){
   const coords=ring.map(p=>X(p[0]).toFixed(2)+","+Y(p[1]).toFixed(2));
   segments.push("M"+coords.join("L")+"Z");
  }
  polys.push({code,d:segments.join(" "),label:feature.properties?.namobj||"WPP-RI "+code});
 }
 return polys;
}
const txt=(a,b)=>document.documentElement.lang?.startsWith("en")?b:a;
const el=id=>document.getElementById(id);
const svgNS="http://www.w3.org/2000/svg";
let loadPromise=null;
/* ArcGIS requests are split by provider-returned OBJECTIDs: no invented IDs,
 * coordinates, external shapefiles, or inference from the server-rendered raster.
 * KKP/BIG service may still be unavailable; rendering is always fail-closed.
 */
export function wppIdBatches(ids,chunk=3){
 if(!Array.isArray(ids)||ids.length!==11||ids.some(x=>!Number.isSafeInteger(x)||x<0)||new Set(ids).size!==ids.length)throw Error("BIG_invalid_objectIds");
 if(!Number.isInteger(chunk)||chunk<1||chunk>4)throw Error("BIG_invalid_batch_size");
 const ordered=[...ids].sort((a,b)=>a-b),batches=[];
 for(let i=0;i<ordered.length;i+=chunk)batches.push(ordered.slice(i,i+chunk));
 return batches;
}
async function bigGet(fetcher,params,timeoutMs=15000){
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeoutMs);
 const url=BIG_LAYER+"/query?"+new URLSearchParams(params).toString();
 try{
  const resp=await fetcher(url,{signal:ctl.signal,mode:"cors",cache:"no-store"});
  if(!resp.ok)throw Error("BIG_HTTP_"+resp.status);
  const size=Number(resp.headers?.get?.("content-length")||0);
  if(size>16000000)throw Error("BIG_response_too_large");
  const body=await resp.text();
  if(body.length>16000000)throw Error("BIG_response_too_large");
  const obj=JSON.parse(body);
  if(obj?.error)throw Error("BIG_ARCGIS_"+String(obj.error.code||"failure"));
  return obj;
 }finally{clearTimeout(timer)}
}
export async function fetchOfficialWPP(fetcher=fetch){
 let strategy="objectIds_batched";
 try{
  const index=await bigGet(fetcher,{where:"1=1",returnIdsOnly:"true",f:"json"},12000);
  const batches=wppIdBatches(index.objectIds);
  let collection={type:"FeatureCollection",features:[]};
  // Limit concurrency: ArcGIS servers can time out on huge all-feature GeoJSON.
  for(const batch of batches){
   const geo=await bigGet(fetcher,{objectIds:batch.join(","),outFields:"objectid,namobj,kodwpp,metadata",returnGeometry:"true",outSR:"4326",f:"geoJSON"},15000);
   if(geo.type!=="FeatureCollection"||!Array.isArray(geo.features))throw Error("BIG_batch_not_feature_collection");
   collection.features.push(...geo.features);
  }
  const geo=collection,audit=validateOfficialWPP(geo);
  if(!audit.pass)throw Error("geometry_validation_"+audit.errors.join(","));
  return {geo,audit,service_url:BIG_LAYER,query_url:BIG_LAYER+"/query",strategy,batches:batches.length};
 }catch(error){
  // A legacy one-shot fallback is retained for servers that do not support
  // returnIdsOnly. Both paths remain strict: all 11 WPP source features or none.
  strategy="single_request_fallback";
  const geo=await bigGet(fetcher,{where:"1=1",outFields:"objectid,namobj,kodwpp,metadata",returnGeometry:"true",outSR:"4326",f:"geoJSON"},13000)
   .catch(e=>{throw Error("BIG_batched_or_full_unavailable: "+String(error?.message||error)+"; "+String(e?.message||e))});
  const audit=validateOfficialWPP(geo);
  if(!audit.pass)throw Error("geometry_validation_"+audit.errors.join(","));
  return {geo,audit,service_url:BIG_LAYER,query_url:BIG_LAYER+"/query",strategy,batches:1};
 }
}

function create(name,attrs){
 const n=document.createElementNS(svgNS,name);for(const [k,v] of Object.entries(attrs||{}))n.setAttribute(k,String(v));return n;
}
function renderMap(host,data,audit){
 const W=920,H=430,svg=create("svg",{viewBox:"0 0 "+W+" "+H,role:"group","aria-label":"Poligon WPP yang diterima langsung dari layanan BIG"});
 let selected=null;
 const panel=el("mfWPPSelected");
 const shapes=renderOfficialWPPPaths(data,W,H);
 for(const shape of shapes){
  const index=WPP_CODES.indexOf(shape.code);
  const colors=["#70b8a8","#90a8c3","#dfaa77","#a8b79a","#cc8cac","#b49bd6","#b7c57f","#65a0c2","#a4bd9c","#e8b8a1","#bd9dc6"];
  const p=create("path",{d:shape.d,fill:colors[index],stroke:"#1b3347","stroke-width":"0.6","fill-opacity":"0.58","fill-rule":"evenodd",tabindex:0,role:"button","aria-label":"WPP-RI "+shape.code,"aria-pressed":"false"});
  p.classList.add("mf-wpp-shape");
  const tip=create("title");tip.textContent="WPP-RI "+shape.code+" — "+WPP_AREAS[shape.code];p.append(tip);
  const activate=()=>{
   if(selected)selected.setAttribute("aria-pressed","false");
   selected=p;p.setAttribute("aria-pressed","true");
   panel.textContent="WPP-RI "+shape.code+" · "+WPP_AREAS[shape.code]+". "+txt("Geometri langsung dari BIG; versi aturan dan izin penggunaan perlu diverifikasi.","Live BIG geometry; regulation vintage and reuse rights require review.");
  };
  p.addEventListener("click",activate);
  p.addEventListener("keydown",e=>{if(["Enter"," "].includes(e.key)){e.preventDefault();activate()}});
  svg.append(p);
 }
 host.replaceChildren(svg);
 el("mfWPPStatus").textContent=txt("Berhasil mengambil ","Retrieved ")+audit.features+txt(" fitur geometri BIG · 11 zona WPP, "," BIG geometry features · 11 WPP zones, ")+audit.vertices+txt(" simpul. Tidak disimpan di server SLI."," vertices. Not stored by SLI.");
}
/* Provider-side ArcGIS map export is a visual SOURCE SERVICE fallback only.
 * The image is never stored, geometries are not reproduced, and screen pixels
 * are never promoted to official licensed GeoJSON or numerically measured area.
 */
export function officialWPPRasterURL(){
 const root=BIG_LAYER.replace(/\/21$/,"");
 const p=new URLSearchParams({bbox:"90,-16,146,13",bboxSR:"4326",imageSR:"4326",size:"1280,650",format:"png32",transparent:"true",layers:"show:21",f:"image"});
 return root+"/export?"+p.toString();
}
async function renderRasterFallback(host,why,accept=()=>true){
 const img=document.createElement("img");
 img.alt=txt("Pratinjau peta WPP dari renderer BIG langsung, bukan unduhan geometri tervalidasi.","WPP live image directly from BIG MapServer, NOT a validated reusable geometry file.");
 img.referrerPolicy="no-referrer";img.decoding="async";img.src=officialWPPRasterURL();
 const loaded=await new Promise(resolve=>{
  const timer=setTimeout(()=>resolve(false),15000);
  img.onload=()=>{clearTimeout(timer);resolve(true)};
  img.onerror=()=>{clearTimeout(timer);resolve(false)};
 });
 if(loaded&&accept()){
  img.className="mf-wpp-official-raster";
  host.replaceChildren(img);
  el("mfWPPStatus").textContent=txt(
   "Layer WPP langsung dari layanan render BIG tersedia sebagai gambar resmi (bukan poligon GeoJSON terverifikasi). Pengambilan vektor gagal: ",
   "BIG-rendered WPP image available (NOT audited vector polygons). Vector request failed: ")+why+". "+txt("Batas regulasi dan izin penggunaan tetap belum diverifikasi.","Regulatory version and commercial reuse rights remain unverified.");
  return true;
 }
 return false;
}
function renderWPPSourceLegend(){
 const host=el("mfWPPLegend");if(!host)return;
 host.replaceChildren();
 for(const code of WPP_CODES){
  const a=document.createElement("a");a.textContent="WPP-RI "+code+" · "+WPP_AREAS[code];a.href=BIG_LAYER;a.target="_blank";a.rel="noopener noreferrer";a.className="mf-wpp-code-source";
  host.append(a);
 }
}
async function mount(){
 const button=el("mfWPPLoad");if(!button)return;
 renderWPPSourceLegend();
 button.addEventListener("click",async()=>{
  button.disabled=true;el("mfWPPStatus").textContent=txt("Mengakses layanan BIG resmi...","Contacting official BIG service...");
  let vectorReady=false;
  // Parallel source-rendered image is available immediately when BIG supports
  // export, avoiding the 25-second vector timeout before any map appears.
  const rasterTask=renderRasterFallback(el("mfWPPMap"),txt("masih diproses","pending"),()=>!vectorReady);
  try{
   if(!loadPromise)loadPromise=fetchOfficialWPP().catch(err=>{loadPromise=null;throw err});
   const r=await loadPromise;
   vectorReady=true;
   renderMap(el("mfWPPMap"),r.geo,r.audit);
  }catch(err){
   const reason=String(err?.message||err).slice(0,160);
   const raster=await rasterTask;
   if(raster){
    el("mfWPPStatus").textContent=txt("Layer raster BIG tersedia langsung dari sumber resmi, bukan geometri vektor tervalidasi. GeoJSON gagal: ","BIG official server-rendered raster available, NOT validated vector geometry. GeoJSON failed: ")+reason+". "+txt("Perizinan dan versi peraturan masih terbuka.","Legal vintage and reuse rights remain open.");
   }else el("mfWPPStatus").textContent=txt("Layanan geometri dan renderer peta BIG belum merespons (","BIG geometry and rendered map sources unavailable (")+reason+"). "+txt("Tidak mengganti dengan poligon rekaan.","No guessed polygon fallback.");
  }finally{button.disabled=false}
 });
}
if(typeof document!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount()}
