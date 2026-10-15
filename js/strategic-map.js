/* Strategic Latitude Intelligence — 38-province geographic exploration.
   ADMINISTRATIVE aggregation only; province bubbles are NOT facility coordinates.
   Two registries stay independent to prevent double counting. */
(function() {
"use strict";
const SVG="http://www.w3.org/2000/svg";
const W=1200,H=530,MIN_LON=94,MAX_LAT=7,SCALE=24.2;
const LABELS=[
 ["Kepulauan Bangka Belitung",["bangka belitung","east belitung","central bangka","pulau kelasa","kelasa island"]],
 ["Kepulauan Riau",["riau islands","kepulauan riau"]],
 ["Papua Barat Daya",["southwest papua","papua barat daya"]],
 ["Papua Pegunungan",["highland papua","papua pegunungan"]],
 ["Papua Tengah",["central papua","papua tengah"]],
 ["Papua Selatan",["south papua","papua selatan"]],
 ["Papua Barat",["west papua","papua barat"]],
 ["Maluku Utara",["north maluku","maluku utara"]],
 ["Kalimantan Timur",["east kalimantan","kalimantan timur"]],
 ["Kalimantan Selatan",["south kalimantan","kalimantan selatan"]],
 ["Kalimantan Tengah",["central kalimantan","kalimantan tengah"]],
 ["Kalimantan Barat",["west kalimantan","kalimantan barat"]],
 ["Kalimantan Utara",["north kalimantan","kalimantan utara"]],
 ["Sulawesi Tenggara",["southeast sulawesi","sulawesi tenggara"]],
 ["Sulawesi Selatan",["south sulawesi","sulawesi selatan"]],
 ["Sulawesi Tengah",["central sulawesi","sulawesi tengah"]],
 ["Sulawesi Barat",["west sulawesi","sulawesi barat"]],
 ["Sulawesi Utara",["north sulawesi","sulawesi utara"]],
 ["Sumatera Selatan",["south sumatra","south sumatera","sumatera selatan"]],
 ["Sumatera Utara",["north sumatra","north sumatera","sumatera utara"]],
 ["Sumatera Barat",["west sumatra","west sumatera","sumatera barat"]],
 ["Jawa Barat",["west java","jawa barat"]],
 ["Jawa Tengah",["central java","jawa tengah"]],
 ["Jawa Timur",["east java","jawa timur"]],
 ["Nusa Tenggara Barat",["west nusa tenggara","nusa tenggara barat"]],
 ["Nusa Tenggara Timur",["east nusa tenggara","nusa tenggara timur"]],
 ["DKI Jakarta",["dki jakarta","jakarta cbd","jakarta capital"]],
 ["Daerah Istimewa Yogyakarta",["special region of yogyakarta","di yogyakarta"]],
 ["Aceh",["aceh"]],
 ["Bali",["bali"]],
 ["Banten",["banten"]],
 ["Bengkulu",["bengkulu"]],
 ["Gorontalo",["gorontalo"]],
 ["Jambi",["jambi"]],
 ["Lampung",["lampung"]],
 ["Maluku",["maluku"]],
 ["Papua",["papua"]],
 ["Riau",["riau"]]
];
const TYPE_GROUPS={
 "Oil refining":"Oil & Gas",
 "Oil & Gas":"Oil & Gas","Coal":"Coal","Minerals":"Minerals","Critical minerals":"Minerals",
 "Smelters & Processing":"Processing","Biofuels & Bioenergy":"Bioenergy",
 "Solar PV":"Renewables","Geothermal":"Renewables","Hydropower & Storage":"Renewables",
 "Wind":"Renewables","Nuclear (New Energy)":"New Energy","Renewable Energy":"Renewables",
 "Electric Vehicles":"EV & Batteries","AI / Data Center":"Digital","AI infrastructure":"Digital",
 "Energy":"Energy (mixed)","Other":"Other"
};
const node=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined&&txt!==null)x.textContent=String(txt);return x};
const snode=(tag,attrs)=>{const x=document.createElementNS(SVG,tag);for(const [k,v] of Object.entries(attrs||{}))x.setAttribute(k,String(v));return x};
const label=(en,id)=>window.SLIi18n?.language==="id"?id:en;
const srcLink=(url,txt)=>{if(!/^https:\/\//.test(url||""))return node("span","map-muted",label("Source not verified","Sumber belum terverifikasi"));const a=node("a",null,txt+" ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
const fmt=(n)=>Number(n).toLocaleString(window.SLIi18n?.language==="id"?"id-ID":"en-US",{maximumFractionDigits:1});
const normalize=s=>" "+String(s||"").toLowerCase().replace(/[.,()·;:_—–-]/g," ").replace(/\s+/g," ").trim()+" ";
const provinceFor=(region)=>{
 const raw=String(region||"");
 if(/\b(multi[- ]site|multi[- ]location|multiple|nationwide|national retail|site unspecified|sites not disclosed|site addresses not disclosed|physical az locations undisclosed|three availability zones|countrywide)\b/i.test(raw)||/[;/]/.test(raw))return null;
 let text=normalize(raw);
 const found=[];
 for(const [name,terms] of LABELS)if(terms.some(term=>text.includes(" "+term+" ")))found.push(name);
 // The generic words Papua, Maluku and Riau must not match more-specific provinces.
 const special=[["Papua","Papua"],["Maluku","Maluku"],["Riau","Riau"]];
 const f=new Set(found);
 for(const [generic,prefix] of special)if(found.some(name=>name!==generic&&name.includes(prefix)))f.delete(generic);
 if(f.size!==1)return null;
 return [...f][0];
};
const xFor=lon=>(lon-MIN_LON)*SCALE+15,yFor=lat=>(MAX_LAT-lat)*SCALE+19;
const boundsOf=(coordinate)=>[xFor(coordinate[0]),yFor(coordinate[1])];
const polygonsOf=(feature)=>feature.geometry.type==="Polygon"?[feature.geometry.coordinates]:feature.geometry.coordinates;
function projectPath(feature){
 const coords=polygonsOf(feature),out=[];
 for(const p of coords)for(const ring of p){
  if(!Array.isArray(ring)||!ring.length)continue;
  out.push(ring.map((c,i)=>(i?"L":"M")+xFor(c[0]).toFixed(1)+","+yFor(c[1]).toFixed(1)).join(" ")+" Z");
 }
 return out.join(" ");
}
function polygonAnchor(feature){
 const rings=polygonsOf(feature).map(p=>p[0]).filter(p=>p?.length>=3);
 let largest=null,area=0;
 for(const ring of rings){
  let s=0,cx=0,cy=0;
  for(let i=0;i<ring.length;i++){const a=boundsOf(ring[i]),b=boundsOf(ring[(i+1)%ring.length]);const cross=a[0]*b[1]-b[0]*a[1];s+=cross;cx+=(a[0]+b[0])*cross;cy+=(a[1]+b[1])*cross;}
  if(Math.abs(s)>area){area=Math.abs(s);const xs=ring.map(x=>boundsOf(x)[0]),ys=ring.map(x=>boundsOf(x)[1]);largest=(Math.abs(s)>1e-6?[cx/(3*s),cy/(3*s)]:[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2]);}
 }
 return largest||[0,0];
}
const read=async file=>{const r=await fetch(file,{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status+": "+file);return r.json()};
const APP={data:null,active:null};
function records(kind,data){
 if(kind==="refineries")return (data.infra?.refinery?.units||[]).filter(r=>/^https:\/\//.test(r.source||"")&&r.province).map(r=>({
  id:"refinery-"+r.id,name:"Refinery · "+r.name,operator:"Pertamina refining system",
  region:r.city+", "+r.province,province:r.province,sector:"Oil refining",group:"Oil & Gas",
  stage:/commissioning/i.test(r.status||"")?"Commissioning":"Operational",
  date:r.verified,source:r.source,note:r.status||"",amount:null,kind
 }));
 if(kind==="assets")return (data.assets?.records||[]).map(r=>({
  id:r.id,name:r.asset,operator:r.operator,region:r.region,province:provinceFor(r.region),
  sector:r.sector,group:TYPE_GROUPS[r.sector]||"Other",stage:r.stage,
  date:data.assets?.as_of,source:r.source_url,note:r.notes||"",amount:r.investment,
  kind
 }));
 return (data.projects?.projects||[]).map((r,index)=>({
  id:"p-"+index,name:r.name,operator:r.investor,region:r.region,province:provinceFor(r.region),
  sector:r.sector,group:TYPE_GROUPS[r.sector]||"Other",stage:r.stage,
  date:r.evidence_date,source:r.source_url,note:r.status_note||r.amount_basis||"",
  amount:r.reported_amount==null?null:{amount:r.reported_amount,unit:r.currency,basis:r.amount_basis},
  kind
 }));
}
function radioOptions(select,arr){
 select.replaceChildren();
 for(const [value,name] of arr){const o=node("option",null,name);o.value=value;select.append(o)}
}
function mapPage(root,data){
 root.replaceChildren();
 const geometry=data.geo?.features||[];
 if(geometry.length!==38)throw Error("Expected verified 38 province basemap");
 const head=node("header","map-hero");
 head.append(node("div","map-eyebrow","STRATEGIC LATITUDE · GEOGRAPHIC INTELLIGENCE"));
 head.append(node("h2",null,label("Indonesia Investment & Energy Map","Peta Investasi dan Energi Indonesia")));
 head.append(node("p",null,label("Explore ALL available source-dated investment projects, operating assets, and refinery facilities, including older records; choose a sector, project status, or location to narrow the map.","Jelajahi SEMUA proyek investasi, aset operasional, dan kilang dengan sumber bertanggal yang tersedia, termasuk catatan lama; saring menurut sektor, status, atau lokasi.")));
 const allAssets=records("assets",data),allProjects=records("projects",data),allRefineries=records("refineries",data);
 const allRows=[...allAssets,...allProjects,...allRefineries];
 const counters=node("div","map-stats");
 const assetCount=allAssets.length,projectCount=allProjects.length,refineryCount=allRefineries.length;
 for(const [name,val] of [
  [label("All source-dated records","Semua catatan bersumber"),allRows.length],
  [label("Investment project dossiers","Dossier proyek investasi"),projectCount],
  [label("Asset / operator dossiers","Dossier aset / operator"),assetCount],
  [label("Oil refining facility records","Catatan fasilitas kilang"),refineryCount],
  [label("Province boundaries","Batas provinsi"),geometry.length]
 ]){
  const c=node("div","map-stat");c.append(node("span",null,name),node("strong",null,val));counters.append(c);
 }
 head.append(counters);root.append(head);
 root.append(node("div","map-alert",label("Default view includes all existing records without a recent-only cutoff. Shaded provinces represent province-level evidence; numbered bubbles count registry entries, NOT unique projects or exact facility coordinates. Multi-province, nationwide or unverified locations remain in the list under Unlocated. Asset, project, and refinery records can overlap—never add their investment values.","Tampilan awal mencakup semua catatan yang tersedia tanpa batasan hanya proyek terbaru. Provinsi berwarna menunjukkan bukti lokasi provinsi; lingkaran menunjukkan jumlah entri registri, BUKAN proyek unik atau koordinat tepat. Catatan lintas provinsi, nasional, atau tanpa lokasi terverifikasi tetap muncul di daftar Tanpa lokasi. Aset, proyek, dan kilang dapat tumpang tindih—jangan jumlahkan nilai investasinya.")));
 const controls=node("div","map-controls"),kind=node("select","map-select"),group=node("select","map-select"),stage=node("select","map-select"),location=node("select","map-select"),search=node("input","map-search"),reset=node("button","map-btn",label("Reset filters","Reset filter"));
 kind.setAttribute("aria-label","Dataset layer");
 group.setAttribute("aria-label","Sector filter");
 stage.setAttribute("aria-label","Implementation stage filter");
 location.setAttribute("aria-label","Geographic coverage filter");
 search.type="search";search.placeholder=label("Search asset, project, operator, province","Cari aset, proyek, operator, provinsi");search.setAttribute("aria-label","Search map records");
 reset.type="button";
 radioOptions(kind,[
  ["all",label("All projects, assets & refineries","Semua proyek, aset & kilang")],
  ["projects",label("Investment projects (all years)","Proyek investasi (semua tahun)")],
  ["assets",label("Asset & operator dossiers","Dossier aset dan operator")],
  ["refineries",label("Refinery facilities","Fasilitas kilang")]
 ]);
 kind.value="all";
 radioOptions(location,[["all",label("All: mapped & unlocated","Semua: terpetakan & tanpa lokasi")],["mapped",label("Province-mapped only","Hanya terpetakan")],["unlocated",label("Unlocated / multiple provinces","Tanpa lokasi / lintas provinsi")]]);
 const ctrl=(caption,input,extra)=>{const l=node("label","map-control"+(extra||""));l.append(node("span",null,caption),input);return l};
 controls.append(ctrl(label("Dataset","Dataset"),kind),ctrl(label("Sector","Sektor"),group),ctrl(label("Implementation","Implementasi"),stage),ctrl(label("Geographic coverage","Cakupan geografis"),location),ctrl(label("Search","Pencarian"),search," map-search-row"),reset);root.append(controls);
 const grid=node("div","map-mapgrid"),mapSection=node("section","map-canvas-wrap"),mapHead=node("div","map-canvas-head");
 const place=node("p",null,label("38 provinces · administrative boundaries","38 provinsi · batas administratif")),zoom=node("div","map-zoom");
 const minus=node("button","map-btn","−"),plus=node("button","map-btn","+"),home=node("button","map-btn",label("Reset view","Reset tampilan"));
 for(const [b,desc] of [[minus,"Zoom out"],[plus,"Zoom in"],[home,"Reset map view"]]){b.type="button";b.setAttribute("aria-label",desc);zoom.append(b)}
 mapHead.append(place,zoom);mapSection.append(mapHead);
 const svg=snode("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":label("Interactive province map of Indonesia","Peta provinsi interaktif Indonesia"),class:"map-viz"});
 const shapeLayer=snode("g"),bubbleLayer=snode("g"),gridlines=snode("g",{class:"map-gridlines"});
 for(let lat=-10;lat<=5;lat+=5){const line=snode("line",{x1:20,x2:W-15,y1:yFor(lat),y2:yFor(lat)});gridlines.append(line)}
 svg.append(gridlines,shapeLayer,bubbleLayer);
 mapSection.append(svg);
 const legend=node("div","map-legend");
 for(const [cls,txt] of [["map-swatch",label("Registered records","Catatan terdaftar")],["map-swatch off",label("No mapped record","Tidak ada data terpetakan")],["map-swatch selected",label("Selected province","Provinsi dipilih")]]){
  const wrap=node("span");wrap.append(node("i",cls),document.createTextNode(" "+txt));legend.append(wrap)
 }
 mapSection.append(legend);grid.append(mapSection);
 const side=node("section","map-results"),resultsHead=node("div","map-results-head"),heading=node("h3",null,label("Mapped evidence","Bukti terpetakan")),info=node("p","map-muted"),list=node("div","map-list");
 const expand=node("button","map-btn map-expand",label("Expand full list","Bentangkan seluruh daftar"));expand.type="button";
 let expanded=false;
 expand.addEventListener("click",()=>{
  expanded=!expanded;
  side.className="map-results"+(expanded?" expanded":"");
  expand.textContent=expanded?label("Collapse list","Ringkas daftar"):label("Expand full list","Bentangkan seluruh daftar");
  expand.setAttribute("aria-expanded",String(expanded));
 });
 expand.setAttribute("aria-expanded","false");
 resultsHead.append(heading,info,expand);side.append(resultsHead,list);grid.append(side);root.append(grid);
 const outside=node("details","map-footer"),summary=node("summary",null,label("Map appendix · geography, status, classification, and limitations","Lampiran peta · geografi, status, klasifikasi, dan keterbatasan"));
 const appendix=node("div");
 appendix.append(node("p",null,label(
  "This is a geographic index of source-attributed project and asset records, not a geocoded site database. A record is placed at province level only if a unique province is independently indicated by its existing source-dated dossier. Missing, nationwide and multi-province cases remain unlocated. Do not interpret bubble centers as addresses or facility coordinates.",
  "Ini adalah indeks geografis catatan aset dan proyek bersumber, bukan basis data lokasi fasilitas presisi. Catatan ditempatkan pada tingkat provinsi hanya jika dossier menyebutkan satu provinsi secara jelas. Kasus tanpa lokasi, nasional, atau lintas provinsi tidak diberi titik. Pusat lingkaran bukan alamat atau koordinat fasilitas."
  )));
 appendix.append(node("p",null,label(
  "Coverage includes all saved 2026 source-dated operator dossiers, projects from any evidence year and the six refinery facilities recorded in the energy infrastructure module; there is no recency exclusion or 20-record cap. This is not a census of every Indonesian investment ever made. Registers may refer to the same project; capital values retain their original currency and category and are not added.",
  "Cakupan meliputi seluruh dossier operator bertanggal pada snapshot 2026, proyek dari berbagai tahun bukti, dan enam kilang yang tercatat di modul infrastruktur energi; tidak ada penyaringan proyek terbaru atau batas 20 entri. Ini bukan sensus seluruh investasi Indonesia. Registri bisa mencatat proyek yang sama; nominal tetap mengikuti mata uang dan kategori aslinya tanpa dijumlahkan."
  )));
 const geoAttribution=node("p");
 geoAttribution.append(document.createTextNode(label("Boundary source: ","Sumber batas provinsi: ")),srcLink(data.geo.metadata?.source,"Indonesia GeoJSON (38 provinces)"),document.createTextNode(" · CC BY 4.0 · "+label("Coordinates rounded to 4 decimals; check upstream rights before commercial redistribution.","Koordinat dibulatkan 4 desimal; periksa lisensi sumber awal sebelum distribusi komersial.")));
 appendix.append(geoAttribution);
 const caveat=node("p","map-limited",label("A palm investment total does not establish the location of individual palm mills or estates. No palm facility is pinned without a source-dated site record.","Total investasi sawit tidak menentukan lokasi pabrik atau kebun tertentu. Tidak ada fasilitas sawit yang dipetakan tanpa catatan lokasi bersumber."));
 appendix.append(caveat);
 const countsText=node("p","map-muted");appendix.append(countsText);
 outside.append(summary,appendix);root.append(outside);
 let currentKind="all",currentProvince=null,lastQuery="",currentSector="all",currentStage="all",currentLocation="all";
 let viewport={x:0,y:0,w:W,h:H},drag=null,dragged=false;
 function setView(v){viewport=v;svg.setAttribute("viewBox",[v.x,v.y,v.w,v.h].join(" "))}
 function zoomAt(factor){const v=viewport,ratio=factor,uw=Math.max(250,Math.min(W*1.1,v.w*ratio)),uh=Math.max(110,Math.min(H*1.1,v.h*ratio));setView({x:v.x+(v.w-uw)/2,y:v.y+(v.h-uh)/2,w:uw,h:uh})}
 plus.addEventListener("click",()=>zoomAt(.78));minus.addEventListener("click",()=>zoomAt(1.28));home.addEventListener("click",()=>setView({x:0,y:0,w:W,h:H}));
 if(svg.addEventListener){
  svg.addEventListener("pointerdown",e=>{if(e.pointerType==="touch")return;drag={x:e.clientX,y:e.clientY,b:viewport};dragged=false;svg.setPointerCapture?.(e.pointerId)});
  svg.addEventListener("pointermove",e=>{if(!drag)return;const rect=svg.getBoundingClientRect?.();if(!rect?.width)return;const dx=(e.clientX-drag.x)*drag.b.w/rect.width,dy=(e.clientY-drag.y)*drag.b.h/rect.height;if(Math.abs(dx)+Math.abs(dy)>3)dragged=true;setView({...drag.b,x:drag.b.x-dx,y:drag.b.y-dy})});
  svg.addEventListener("pointerup",()=>{drag=null;setTimeout(()=>{dragged=false},80)});
  svg.addEventListener("pointercancel",()=>{drag=null;dragged=false});
 }
 const featureByName=new Map(geometry.map(f=>[f.properties.name,f]));
 function active(){return currentKind==="all"?allRows:currentKind==="assets"?allAssets:currentKind==="projects"?allProjects:allRefineries}
 function filtersRebuild(){
  const rows=active(),groups=[...new Set(rows.map(x=>x.group))].sort(),stages=[...new Set(rows.map(x=>x.stage))].sort();
  radioOptions(group,[["all",label("All sectors","Semua sektor")],...groups.map(x=>[x,x])]);
  radioOptions(stage,[["all",label("All statuses","Semua status")],...stages.map(x=>[x,x])]);
  if(!groups.includes(currentSector))currentSector="all";if(!stages.includes(currentStage))currentStage="all";
  group.value=currentSector;stage.value=currentStage;
 }
 const filtered=()=>active().filter(r=>{
  const mapped=Boolean(r.province&&featureByName.has(r.province));
  return (currentSector==="all"||r.group===currentSector)
   &&(currentStage==="all"||r.stage===currentStage)
   &&(currentLocation==="all"||(currentLocation==="mapped"?mapped:!mapped))
   &&(!lastQuery||[r.name,r.operator,r.region,r.province,r.sector,r.stage,r.kind].join(" ").toLowerCase().includes(lastQuery));
 });
 function focusProvince(name){currentProvince=currentProvince===name?null:name;draw()}
 function draw(){
  const base=filtered(),mapped=base.filter(r=>r.province&&featureByName.has(r.province)),unmapped=base.length-mapped.length;
  const counts=new Map();for(const x of mapped)counts.set(x.province,(counts.get(x.province)||0)+1);
  shapeLayer.replaceChildren();bubbleLayer.replaceChildren();
  for(const feature of geometry){
   const name=feature.properties.name,count=counts.get(name)||0;
   const p=snode("path",{d:projectPath(feature),class:"map-province"+(currentProvince===name?" active":""),fill:currentProvince===name?"#cb9f58":count?(count>=5?"#648fad":count>=3?"#4d7798":"#345773"):"#152f44",tabindex:"0",role:"button","aria-label":name+" — "+count+" "+label("records","catatan")});
   const title=snode("title");title.textContent=name+" · "+count+" "+label("mapped records","catatan terpetakan");p.append(title);
   p.addEventListener("click",()=>{if(!dragged)focusProvince(name)});
   p.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();focusProvince(name)}});
   shapeLayer.append(p);
   if(count){
    const [x,y]=polygonAnchor(feature);
    const radius=count<10?11:14;
    bubbleLayer.append(snode("circle",{cx:x,cy:y,r:radius,class:"map-bubble"}));
    const n=snode("text",{x,y,class:"map-bubble-text"});n.textContent=count;bubbleLayer.append(n);
   }
  }
  const chosen=base.filter(x=>!currentProvince||x.province===currentProvince)
   .sort((a,b)=>a.group.localeCompare(b.group)||a.name.localeCompare(b.name));
  const display=chosen; // Do not silently hide entries behind a 20-item list cap.
  const scopeName=currentKind==="all"?label("all projects and assets","semua proyek dan aset"):currentKind==="assets"?label("operator assets","aset operator"):currentKind==="projects"?label("investment projects","proyek investasi"):label("refineries","kilang");
  heading.textContent=currentProvince?currentProvince:label("Mapped evidence","Bukti terpetakan");
  info.textContent=label("Registry: ","Registri: ")+scopeName+" · "+display.length+" "+label("shown in list / ","ditampilkan / ")+base.length+" "+label("matching records · ","catatan cocok · ")+mapped.length+" "+label("province-mapped · ","terpetakan · ")+unmapped+" "+label("unlocated","tanpa lokasi");
  list.replaceChildren();
  if(!chosen.length)list.append(node("p","map-muted",label("No records match these filters or this province. Choose another province or reset filters.","Tidak ada catatan sesuai filter atau provinsi ini. Pilih provinsi lain atau reset filter.")));
  let lastGroup="";
  for(const r of display){
   if(r.group!==lastGroup){
    list.append(node("div","map-group-label",r.group));
    lastGroup=r.group;
   }
   const card=node("article","map-list-item");
   const layerName=r.kind==="projects"?label("Investment project","Proyek investasi"):r.kind==="refineries"?label("Refinery","Kilang"):label("Asset / operator","Aset / operator");
   const dateName=r.kind==="assets"?label("dataset reviewed","dataset ditinjau"):r.kind==="refineries"?label("facility verified","fasilitas diverifikasi"):label("evidence date","tanggal bukti");
   card.append(node("small",null,layerName+" · "+(r.province||label("UNLOCATED / MULTI-SITE","TANPA LOKASI / MULTILOKASI"))+" · "+dateName+": "+(r.date||label("not specified","tidak tersedia"))));
   card.append(node("h4",null,r.name));
   const tags=node("div");for(const txt of [r.group,r.stage])tags.append(node("span","map-tag",txt));card.append(tags);
   card.append(node("p",null,label("Operator / sponsor: ","Operator / investor: ")+(r.operator||label("Not identified","Tidak disebutkan"))));
   if(r.amount?.amount!=null)card.append(node("p",null,label("Reported amount: ","Nilai dilaporkan: ")+r.amount.unit+" "+fmt(r.amount.amount)+" · "+(r.amount.basis||label("basis not stated","basis tidak tercatat"))));
   if(r.region)card.append(node("p","map-muted",label("Source geography: ","Geografi bersumber: ")+r.region));
   card.append(srcLink(r.source,label("Original evidence","Bukti asli")));
   list.append(card);
  }
  list.append(node("p","map-muted",label("All matching records shown: ","Semua catatan yang cocok ditampilkan: ")+chosen.length+" · "+label("scroll this list or filter to browse","gulir daftar atau gunakan filter untuk menjelajah")));
  countsText.textContent=label("For this selection: ","Untuk pilihan ini: ")+base.length+label(" records, "," catatan, ")+mapped.length+label(" mapped, "," terpetakan, ")+unmapped+label(" unlocated. The map does not quantify realized investment value."," tanpa lokasi. Peta tidak menghitung total realisasi investasi.");
 }
 kind.addEventListener("change",()=>{currentKind=kind.value;currentSector="all";currentStage="all";currentProvince=null;filtersRebuild();draw()});
 location.addEventListener("change",()=>{currentLocation=location.value;currentProvince=null;draw()});
 group.addEventListener("change",()=>{currentSector=group.value;draw()});
 stage.addEventListener("change",()=>{currentStage=stage.value;draw()});
 search.addEventListener("input",()=>{lastQuery=search.value.toLowerCase().trim();draw()});
 reset.addEventListener("click",()=>{kind.value="all";currentKind="all";location.value="all";currentLocation="all";currentProvince=null;currentSector="all";currentStage="all";search.value="";lastQuery="";filtersRebuild();setView({x:0,y:0,w:W,h:H});draw()});
 filtersRebuild();draw();
}
window.SLIProvinceFor=provinceFor;
window.initSLIStrategicMap=async function(){
 const root=document.getElementById("sliMapRoot");if(!root||APP.active===root)return;
 APP.active=root;root.replaceChildren(node("p","map-muted",label("Loading provinces and source-attributed investment records…","Memuat provinsi dan catatan investasi bersumber…")));
 try{
  const settled=await Promise.allSettled([read("data/indonesia-provinces.geojson"),read("data/investment-operator-assets.json"),read("data/investment-evidence.json"),read("data/energy-infrastructure-security.json")]);
  if(root!==document.getElementById("sliMapRoot"))return;
  if(settled.some(x=>x.status!=="fulfilled"))throw Error("Required basemap/registry unavailable");
  const [geo,assets,projects,infra]=settled.map(x=>x.value);
  APP.data={geo,assets,projects,infra};mapPage(root,APP.data);
 }catch(e){root.replaceChildren(node("p","map-alert",label("Geographic registry unavailable; no inferred project positions are displayed.","Registri geografis tidak tersedia; lokasi proyek tidak direka.")));console.error("[SLI map]",e)}
};
document.addEventListener("sli:languagechange",()=>{const root=document.getElementById("sliMapRoot");if(!root||!APP.data)return;mapPage(root,APP.data)});
})();
