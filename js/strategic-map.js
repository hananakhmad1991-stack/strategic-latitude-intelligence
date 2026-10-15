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
 head.append(node("p",null,label("Explore the geographic concentration of sourced industrial and infrastructure records, then inspect operator, implementation stage, investment classification and original evidence.","Jelajahi sebaran geografis aset industri dan infrastruktur yang bersumber, lalu periksa operator, tahap implementasi, klasifikasi investasi, dan bukti asli.")));
 const counters=node("div","map-stats");
 const assetCount=(data.assets?.records||[]).length,projectCount=(data.projects?.projects||[]).length;
 for(const [name,val] of [[label("Asset / operator dossiers","Dossier aset / operator"),assetCount],[label("Investment registry entries","Entri registri investasi"),projectCount],[label("Province boundaries","Batas provinsi"),geometry.length]]){
  const c=node("div","map-stat");c.append(node("span",null,name),node("strong",null,val));counters.append(c);
 }
 head.append(counters);root.append(head);
 root.append(node("div","map-alert",label("Important: shaded provinces indicate records with province-level location evidence. The numbered bubbles are provincial record counts, NOT exact facility locations. Asset and project registries overlap; never add their counts or investments together.","Penting: provinsi berwarna menunjukkan entri yang memiliki informasi lokasi tingkat provinsi. Angka merupakan jumlah catatan per provinsi, BUKAN koordinat fasilitas. Registri aset dan proyek dapat tumpang tindih; jangan menjumlahkan nilai atau jumlahnya.")));
 const controls=node("div","map-controls"),kind=node("select","map-select"),group=node("select","map-select"),stage=node("select","map-select"),search=node("input","map-search"),reset=node("button","map-btn",label("Reset filters","Reset filter"));
 kind.setAttribute("aria-label","Dataset layer");
 group.setAttribute("aria-label","Sector filter");
 stage.setAttribute("aria-label","Implementation stage filter");
 search.type="search";search.placeholder=label("Search asset, project, operator, province","Cari aset, proyek, operator, provinsi");search.setAttribute("aria-label","Search map records");
 reset.type="button";
 radioOptions(kind,[["assets",label("Asset & operator registry","Registri aset dan operator")],["projects",label("Investment project registry","Registri proyek investasi")]]);
 const ctrl=(caption,input,extra)=>{const l=node("label","map-control"+(extra||""));l.append(node("span",null,caption),input);return l};
 controls.append(ctrl(label("Dataset","Dataset"),kind),ctrl(label("Sector","Sektor"),group),ctrl(label("Implementation","Implementasi"),stage),ctrl(label("Search","Pencarian"),search," map-search-row"),reset);root.append(controls);
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
 resultsHead.append(heading,info);side.append(resultsHead,list);grid.append(side);root.append(grid);
 const outside=node("details","map-footer"),summary=node("summary",null,label("Map appendix · geography, status, classification, and limitations","Lampiran peta · geografi, status, klasifikasi, dan keterbatasan"));
 const appendix=node("div");
 appendix.append(node("p",null,label(
  "This is a geographic index of source-attributed project and asset records, not a geocoded site database. A record is placed at province level only if a unique province is independently indicated by its existing source-dated dossier. Missing, nationwide and multi-province cases remain unlocated. Do not interpret bubble centers as addresses or facility coordinates.",
  "Ini adalah indeks geografis catatan aset dan proyek bersumber, bukan basis data lokasi fasilitas presisi. Catatan ditempatkan pada tingkat provinsi hanya jika dossier menyebutkan satu provinsi secara jelas. Kasus tanpa lokasi, nasional, atau lintas provinsi tidak diberi titik. Pusat lingkaran bukan alamat atau koordinat fasilitas."
  )));
 appendix.append(node("p",null,label(
  "Separate layer accounting: operator assets include plants, permits, PSCs and programme entries; investment projects include announced, financed or delivered initiatives. They can refer to the same physical development. Monetary fields retain their original units and investment basis; never sum unlike portfolios, historical spend and commitments.",
  "Penghitungan per lapisan terpisah: aset operator meliputi pabrik, izin, PSC, dan program; proyek investasi meliputi inisiatif diumumkan, didanai, atau beroperasi. Dua registri bisa merujuk proyek fisik yang sama. Nilai uang menggunakan satuan dan definisi aslinya; jangan menjumlahkan portofolio, belanja historis, dan komitmen."
  )));
 const geoAttribution=node("p");
 geoAttribution.append(document.createTextNode(label("Boundary source: ","Sumber batas provinsi: ")),srcLink(data.geo.metadata?.source,"Indonesia GeoJSON (38 provinces)"),document.createTextNode(" · CC BY 4.0 · "+label("Coordinates rounded to 4 decimals; check upstream rights before commercial redistribution.","Koordinat dibulatkan 4 desimal; periksa lisensi sumber awal sebelum distribusi komersial.")));
 appendix.append(geoAttribution);
 const caveat=node("p","map-limited",label("A palm investment total does not establish the location of individual palm mills or estates. No palm facility is pinned without a source-dated site record.","Total investasi sawit tidak menentukan lokasi pabrik atau kebun tertentu. Tidak ada fasilitas sawit yang dipetakan tanpa catatan lokasi bersumber."));
 appendix.append(caveat);
 const countsText=node("p","map-muted");appendix.append(countsText);
 outside.append(summary,appendix);root.append(outside);
 const allAssets=records("assets",data),allProjects=records("projects",data);
 let currentKind="assets",currentProvince=null,lastQuery="",currentSector="all",currentStage="all";
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
 function active(){return currentKind==="assets"?allAssets:allProjects}
 function filtersRebuild(){
  const rows=active(),groups=[...new Set(rows.map(x=>x.group))].sort(),stages=[...new Set(rows.map(x=>x.stage))].sort();
  radioOptions(group,[["all",label("All sectors","Semua sektor")],...groups.map(x=>[x,x])]);
  radioOptions(stage,[["all",label("All statuses","Semua status")],...stages.map(x=>[x,x])]);
  if(!groups.includes(currentSector))currentSector="all";if(!stages.includes(currentStage))currentStage="all";
  group.value=currentSector;stage.value=currentStage;
 }
 const filtered=()=>active().filter(r=>(currentSector==="all"||r.group===currentSector)&&(currentStage==="all"||r.stage===currentStage)&&(!lastQuery||[r.name,r.operator,r.region,r.sector,r.stage].join(" ").toLowerCase().includes(lastQuery)));
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
  const chosen=base.filter(x=>!currentProvince||x.province===currentProvince);
  const maxRows=20,display=chosen.slice(0,maxRows);
  heading.textContent=currentProvince?currentProvince:label("Mapped evidence","Bukti terpetakan");
  info.textContent=label("Registry: ","Registri: ")+(currentKind==="assets"?label("operator assets","aset operator"):label("investment projects","proyek investasi"))+" · "+mapped.length+" "+label("province-mapped of","terpetakan dari")+" "+base.length+" · "+unmapped+" "+label("unlocated","lokasi belum terverifikasi");
  list.replaceChildren();
  if(!chosen.length)list.append(node("p","map-muted",label("No records match these filters or this province. Choose another province or reset filters.","Tidak ada catatan sesuai filter atau provinsi ini. Pilih provinsi lain atau reset filter.")));
  for(const r of display){
   const card=node("article","map-list-item");
   card.append(node("small",null,(r.province||label("UNLOCATED","TANPA LOKASI"))+" · "+(r.date||label("date not specified","tanggal tidak tersedia"))));
   card.append(node("h4",null,r.name));
   const tags=node("div");for(const txt of [r.group,r.stage])tags.append(node("span","map-tag",txt));card.append(tags);
   card.append(node("p",null,label("Operator / sponsor: ","Operator / investor: ")+(r.operator||label("Not identified","Tidak disebutkan"))));
   if(r.amount?.amount!=null)card.append(node("p",null,label("Reported amount: ","Nilai dilaporkan: ")+r.amount.unit+" "+fmt(r.amount.amount)+" · "+(r.amount.basis||label("basis not stated","basis tidak tercatat"))));
   if(r.region)card.append(node("p","map-muted",label("Source geography: ","Geografi bersumber: ")+r.region));
   card.append(srcLink(r.source,label("Original evidence","Bukti asli")));
   list.append(card);
  }
  if(chosen.length>maxRows)list.append(node("p","map-muted",label("Showing first ","Menampilkan ")+maxRows+label(" records. Narrow the sector, stage or province to inspect the rest."," catatan pertama. Persempit sektor, status atau provinsi untuk melihat yang lain.")));
  countsText.textContent=label("For this selection: ","Untuk pilihan ini: ")+base.length+label(" records, "," catatan, ")+mapped.length+label(" mapped, "," terpetakan, ")+unmapped+label(" unlocated. The map does not quantify realized investment value."," tanpa lokasi. Peta tidak menghitung total realisasi investasi.");
 }
 kind.addEventListener("change",()=>{currentKind=kind.value;currentSector="all";currentStage="all";currentProvince=null;filtersRebuild();draw()});
 group.addEventListener("change",()=>{currentSector=group.value;draw()});
 stage.addEventListener("change",()=>{currentStage=stage.value;draw()});
 search.addEventListener("input",()=>{lastQuery=search.value.toLowerCase().trim();draw()});
 reset.addEventListener("click",()=>{kind.value="assets";currentKind="assets";currentProvince=null;currentSector="all";currentStage="all";search.value="";lastQuery="";filtersRebuild();setView({x:0,y:0,w:W,h:H});draw()});
 filtersRebuild();draw();
}
window.SLIProvinceFor=provinceFor;
window.initSLIStrategicMap=async function(){
 const root=document.getElementById("sliMapRoot");if(!root||APP.active===root)return;
 APP.active=root;root.replaceChildren(node("p","map-muted",label("Loading provinces and source-attributed investment records…","Memuat provinsi dan catatan investasi bersumber…")));
 try{
  const settled=await Promise.allSettled([read("data/indonesia-provinces.geojson"),read("data/investment-operator-assets.json"),read("data/investment-evidence.json")]);
  if(root!==document.getElementById("sliMapRoot"))return;
  if(settled.some(x=>x.status!=="fulfilled"))throw Error("Required basemap/registry unavailable");
  const [geo,assets,projects]=settled.map(x=>x.value);
  APP.data={geo,assets,projects};mapPage(root,APP.data);
 }catch(e){root.replaceChildren(node("p","map-alert",label("Geographic registry unavailable; no inferred project positions are displayed.","Registri geografis tidak tersedia; lokasi proyek tidak direka.")));console.error("[SLI map]",e)}
};
document.addEventListener("sli:languagechange",()=>{const root=document.getElementById("sliMapRoot");if(!root||!APP.data)return;mapPage(root,APP.data)});
})();
