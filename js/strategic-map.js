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
 "Electric Vehicles":"EV & Batteries","AI / Data Center":"Digital / AI","AI infrastructure":"Digital / AI",
 "Energy":"Energy (mixed)","Other":"Other"
};

/* Public-facing taxonomy is independent of raw registry layer names. No source records are deleted. */
const SECTORS=[
 ["Oil & Gas","Migas"],["Coal Mining","Pertambangan Batubara"],["Minerals & Metals","Mineral & Logam"],
 ["Power Generation","Pembangkit Listrik"],["Biofuels & Bioenergy","Biofuel & Bioenergi"],
 ["Digital & AI","Digital & AI"],["EV & Batteries","Kendaraan Listrik & Baterai"],
 ["Nuclear & New Energy","Nuklir & Energi Baru"],["Other / Cross-sector","Lainnya / Lintas Sektor"]
];
const ASSET_TRANSLATIONS={
 "WK / PSC & Upstream Fields":"WK / PSC & Lapangan Hulu",
 "Oil Refinery":"Kilang Minyak",
 "LNG / Gas Facilities":"Fasilitas LNG / Gas",
 "CCS / CCUS Project":"Proyek CCS / CCUS",
 "Other Oil & Gas":"Migas Lainnya",
 "Coal Mine & Logistics":"Tambang Batubara & Logistik",
 "Mineral Mine & Exploration":"Tambang & Eksplorasi Mineral",
 "Smelter & Metal Refining":"Smelter & Pemurnian Logam",
 "Mineral / Battery Materials Project":"Proyek Bahan Mineral / Baterai",
 "PLTU · Coal Steam":"PLTU · Uap Batubara",
 "PLTG / PLTGU / Gas IPP":"PLTG / PLTGU / IPP Gas",
 "PLTD / Diesel":"PLTD / Diesel",
 "PLTA · Hydropower":"PLTA · Hidro",
 "PLTM / PLTMH · Small Hydro":"PLTM / PLTMH · Hidro Kecil",
 "PLTP · Geothermal":"PLTP · Panas Bumi",
 "PLTS · Solar":"PLTS · Surya",
 "PLTB · Wind":"PLTB · Bayu",
 "Energy Storage":"Penyimpanan Energi",
 "Other Power Projects":"Proyek Pembangkit Lainnya",
 "Biodiesel / FAME Plant":"Pabrik Biodiesel / FAME",
 "Bioenergy / Feedstock":"Bioenergi / Bahan Baku",
 "Physical Data Centre":"Pusat Data Fisik",
 "Cloud Region / Services":"Region Cloud / Layanan",
 "AI Programme / Agreement":"Program / Kesepakatan AI",
 "EV Factory / Assembly":"Pabrik / Perakitan EV",
 "Battery Supply Chain":"Rantai Nilai Baterai",
 "Nuclear Proposal / Development":"Rencana / Pengembangan Nuklir",
 "Cross-sector Project":"Proyek Lintas Sektor"
};
const sectorLabel=s=>{const x=SECTORS.find(z=>z[0]===s);return x?label(x[0],x[1]):s};
const assetLabel=s=>label(s,ASSET_TRANSLATIONS[s]||s);
function classifyRecord(r){
 const rawSector=String(r.sector||"").toLowerCase(),rawGroup=String(r.group||"").toLowerCase();
 const name=String(r.name||"").toLowerCase(),id=String(r.id||"").toLowerCase();
 const words=rawSector+" "+rawGroup+" "+name;
 const result=(sector,type)=>({sector,type});
 let c;
 if(r.kind==="refineries"||rawSector==="oil refining"||(/\b(refinery|kilang minyak|rdmp)\b/.test(name)&&!/biodiesel|fame|smelter|nickel|copper/.test(words))){
  c=result("Oil & Gas","Oil Refinery");
 }else if(r.kind==="power"||r.kind==="pltu"||/^(coal power|gas-fired power|renewable power)$/.test(rawSector)||rawGroup==="fossil power"||rawGroup==="renewables"||["solar pv","geothermal","hydropower & storage","wind","renewable energy"].includes(rawSector)){
  let type="Other Power Projects",tech=String(r.group||"").toUpperCase();
  if(r.kind==="pltu"||/PLTU/.test(tech+" "+r.name)||rawSector==="coal power")type="PLTU · Coal Steam";
  else if(/PLTGU|PLTG|GAS IPP|PLTMG/.test(tech+" "+r.name)||rawSector==="gas-fired power")type="PLTG / PLTGU / Gas IPP";
  else if(/PLTD/.test(tech))type="PLTD / Diesel";
  else if(/PLTMH|PLTM\b/.test(tech+" "+r.name))type="PLTM / PLTMH · Small Hydro";
  else if(/PLTA/.test(tech+" "+r.name)||/hydropower/.test(words))type="PLTA · Hydropower";
  else if(/PLTP/.test(tech+" "+r.name)||/geothermal/.test(words))type="PLTP · Geothermal";
  else if(/PLTS/.test(tech+" "+r.name)||/solar|pv\b/.test(words))type="PLTS · Solar";
  else if(/PLTB\b/.test(tech+" "+r.name)||/wind/.test(words))type="PLTB · Wind";
  else if(/storage|bess|battery energy/.test(words))type="Energy Storage";
  c=result("Power Generation",type);
 }else if(r.kind==="digital"||/ai\s*(\/|&)\s*data center|ai infrastructure|digital\s*\/\s*ai/.test(words)||/cloud region|data cent(re|er)|hyperscale|cloud infrastructure|digital programme/.test(name)){
  c=result("Digital & AI",/cloud region|aws asia pacific|indonesia central/.test(name)?"Cloud Region / Services":/mou|cooperation|programme|program|proposal/.test(name)?"AI Programme / Agreement":"Physical Data Centre");
 }else if(r.kind==="industry"&&/biodiesel/.test(rawGroup)||/biofuels|bioenergy|biodiesel|fame/.test(rawSector+" "+rawGroup)||/\bbiodiesel\b|\bfame\b/.test(name)){
  c=result("Biofuels & Bioenergy",/biodiesel|\bfame\b/.test(name+rawGroup)?"Biodiesel / FAME Plant":"Bioenergy / Feedstock");
 }else if(r.kind==="smelters"||r.kind==="industry"&&/smelter|processing/.test(rawGroup)||r.kind==="sites"&&rawGroup==="processing"||/smelters|critical minerals|^minerals$/.test(rawSector)||/smelter|metal refin|ferronickel|alumina/.test(name)){
  c=result("Minerals & Metals",/smelt|processing|refin|matte|ferronickel|alumina|npi|hpal|rkef/.test(name+" "+rawGroup)?"Smelter & Metal Refining":/battery|ecosystem|downstream/.test(name)?"Mineral / Battery Materials Project":"Mineral Mine & Exploration");
 }else if(rawSector==="coal"||rawGroup==="coal"||/coal mining/.test(words)){
  c=result("Coal Mining","Coal Mine & Logistics");
 }else if(rawSector==="oil & gas"||r.kind==="wk"||/wk migas|gas fields\s*\/\s*lng|oil & gas/.test(words)){
  const type=/refiner|kilang minyak|rdmp/.test(name)?"Oil Refinery":
   /\bccs\b|\bccus\b|\bucc\b/.test(name)&&!/lng/.test(name)?"CCS / CCUS Project":
   /\blng\b|\bgas processing\b|\bgas treatment\b/.test(name)?"LNG / Gas Facilities":
   r.kind==="wk"||/(\bwk\b|\bpsc\b|offshore|upstream|block|field|lapangan)/.test(name+rawGroup)?"WK / PSC & Upstream Fields":"Other Oil & Gas";
  c=result("Oil & Gas",type);
 }else if(/electric vehicles|ev & batteries|battery/.test(words)){
  c=result("EV & Batteries",/battery|baterai|cathode|anode/.test(name)?"Battery Supply Chain":"EV Factory / Assembly");
 }else if(/nuclear|pltn/.test(words)){
  c=result("Nuclear & New Energy","Nuclear Proposal / Development");
 }else if(/\benergy\b/.test(words)&&!/mineral/.test(words)){
  c=result("Other / Cross-sector","Cross-sector Project");
 }else{
  c=result("Other / Cross-sector","Cross-sector Project");
 }
 r.sourceGroup=r.group;
 r.sectorKey=c.sector;r.assetType=c.type;
 const status=String(r.stage||"").toLowerCase();
 r.phase=/historical|revalidat|recheck|current status unknown|status unverified|earlier roster|historic/.test(status)?"Historical / Verify":
  /under construction|construction|commissioning|ramp.up|development ongoing|physical works|groundbreaking/.test(status)?"Construction / Testing":
  /explor|discovery|offered|tender|survey|preliminary|study/.test(status)?"Exploration / Study":
  /operat|in service|producing|production|existing|installed|commercial|commissioned|inaugurated|first gold pour/.test(status)?"Operational / Reported":
  /mou|agreement|planned|proposal|announced|fid|power purchase|contract award|pipeline|phased|development|signed|financ/.test(status)?"Planned / Agreed":
  "Status / Verify";
 return r;
}
const PHASE_LABELS={
 "Operational / Reported":"Beroperasi / Dilaporkan","Construction / Testing":"Konstruksi / Pengujian",
 "Planned / Agreed":"Direncanakan / Kesepakatan","Exploration / Study":"Eksplorasi / Kajian",
 "Historical / Verify":"Historis / Perlu Verifikasi","Status / Verify":"Status / Perlu Verifikasi"
};
const phaseLabel=s=>label(s,PHASE_LABELS[s]||s);

const node=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined&&txt!==null)x.textContent=String(txt);return x};
const snode=(tag,attrs)=>{const x=document.createElementNS(SVG,tag);for(const [k,v] of Object.entries(attrs||{}))x.setAttribute(k,String(v));return x};
const label=(en,id)=>window.SLIi18n?.language==="id"?id:en;
const srcLink=(url,txt)=>{if(!/^https:\/\//.test(url||""))return node("span","map-muted",label("Source not verified","Sumber belum terverifikasi"));const a=node("a",null,txt+" ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
const fmt=(n)=>Number(n).toLocaleString(window.SLIi18n?.language==="id"?"id-ID":"en-US",{maximumFractionDigits:1});
const normalize=s=>" "+String(s||"").toLowerCase().replace(/[.,()·;:_—–-]/g," ").replace(/\s+/g," ").trim()+" ";
const provinceFor=(region)=>{
 const raw=String(region||"");
 const exact=LABELS.find(([name])=>normalize(name).trim()===normalize(raw).trim());
 if(exact)return exact[0];
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
// Batam and Natuna are distinct inhabited island groups within Kepulauan Riau.
// Geographic markers indicate CITY/ISLAND-GROUP reference points, NOT facility geocodes.
const KEPRI_REFERENCES={
 batam:{name:"Batam",coordinates:[104.05,1.05]},
 natuna:{name:"Natuna",coordinates:[108.18,3.94]}
};
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
 if(kind==="smelters"){
  const older=(data.industry?.records||[]).filter(r=>/smelter|processing/i.test(r.group||""));
  const enriched=data.smelters?.records||[];
  const upgrades=new Map(enriched.filter(r=>r.original_id).map(r=>[r.original_id,r]));
  const adapt=(r,base)=>({
   id:base?.id||r.id,name:r.name||base?.asset,operator:r.operator||base?.operator,
   region:r.region||base?.region,province:r.province||provinceFor(base?.region),
   sector:"Minerals & Metals",group:"Smelter / processing",stage:r.stage||base?.stage,
   date:r.evidence_date||base?.evidence_date||null,source:r.source||base?.source_url,
   note:r.scope_note||base?.notes||"",vintage:base?.source_vintage||"",
   capacity:r.capacity||null,production:r.production||null,ownership:r.ownership||null,
   investors:r.investors||null,technology:r.technology||null,product:r.product||null,
   progress:r.progress||null,locationScope:r.location_precision||"",kind,amount:null
  });
  return [...older.map(r=>adapt(upgrades.get(r.id)||{},r)),
    ...enriched.filter(r=>!r.original_id).map(r=>adapt(r,null))];
 }
 if(kind==="pltu")return (data.pltuAudit?.records||[]).map(r=>({
  id:r.id,name:r.asset,operator:r.operator,region:r.region,province:provinceFor(r.region),
  sector:r.sector,group:"PLTU",stage:r.stage,date:r.evidence_date||null,
  source:r.source_url,note:r.notes||"",vintage:r.source_vintage||"",
  capacity:r.capacity||null,amount:r.investment_amount?{
   amount:r.investment_amount.value,unit:r.investment_amount.currency,basis:r.investment_amount.basis
  }:null,relation:r.related_existing_record||null,kind
 }));
 if(kind==="digital")return (data.digital?.records||[]).map(r=>({
  id:r.id,name:r.asset,operator:r.operator,region:r.region,
  province:r.provinces?.length===1?r.provinces[0]:null,
  provinces:r.provinces||[],sector:r.sector,group:"Digital / AI",
  stage:r.stage,date:r.evidence_date||null,source:r.source_url,
  vintage:r.source_vintage||"",note:r.notes||"",locationScope:r.location_precision||"",
  capacity:r.capacity||null,relation:r.related_existing_record||null,amount:null,kind
 }));
 if(kind==="regional")return (data.regional?.records||[]).map(r=>({
  id:r.id,name:r.asset,operator:r.operator,region:r.region,
  province:r.provinces?.length===1?r.provinces[0]:null,provinces:r.provinces||[],
  sector:r.sector,group:r.group,stage:r.stage,date:r.evidence_date,
  source:r.source_url,note:r.notes||"",vintage:r.source_vintage||"",
  locationScope:r.location_scope||"",amount:r.investment_amount||null,
  capacity:r.capacity_or_power||null,kind
 }));
 if(["wk","power","industry"].includes(kind)){
  const store=kind==="wk"?data.upstream:kind==="power"?data.power:data.industry;
  return (store?.records||[]).map(r=>({
   id:r.id,name:r.asset,operator:r.operator,region:r.region,province:provinceFor(r.region),
   sector:r.sector,group:kind==="power"?(r.technology||r.group):r.group,stage:r.stage,
   date:r.evidence_date||null,source:r.source_url,note:r.notes||"",
   vintage:r.source_vintage||"",capacity:r.capacity||null,kind,amount:null
  }));
 }
 if(kind==="sites")return (data.sectorSites?.records||[]).map(r=>({
  id:r.id,name:r.asset,operator:r.operator,region:r.region,province:provinceFor(r.region),
  sector:r.sector,group:r.group||TYPE_GROUPS[r.sector]||"Other",stage:r.stage,
  date:r.evidence_date||null,source:r.source_url,note:r.notes,
  relation:r.related_existing_record||null,amount:null,kind
 }));
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
 head.append(node("p",null,label("Explore documented projects and facilities across Indonesia, including Jakarta–West Java digital/AI data-center clusters, Batam, oil/gas PSCs, power generation and smelters. Use the Digital / AI preset to focus on data-center campuses.","Jelajahi proyek dan fasilitas bersumber di Indonesia, termasuk klaster data center Digital/AI Jakarta–Jawa Barat, Batam, WK migas, pembangkit dan smelter. Pilih filter cepat Digital/AI untuk fokus pada pusat data.")));
 const allAssets=records("assets",data),allProjects=records("projects",data),allRefineries=records("refineries",data),allSites=records("sites",data);
 const allWk=records("wk",data),allPltu=records("pltu",data),allPower=[...records("power",data),...allPltu],allIndustry=records("industry",data),allRegional=records("regional",data),allDigital=records("digital",data),allSmelters=records("smelters",data);
 const newSmelters=allSmelters.filter(r=>!allIndustry.some(x=>x.id===r.id));
 const allRows=[...allAssets,...allProjects,...allRefineries,...allSites,...allWk,...allPower,...allIndustry,...allRegional,...allDigital,...newSmelters];
 allRows.forEach(classifyRecord);allSmelters.forEach(classifyRecord);
 const digitalRows=allRows.filter(r=>r.sectorKey==="Digital & AI");
 const counters=node("div","map-stats");
 const assetCount=allAssets.length,projectCount=allProjects.length,refineryCount=allRefineries.length,siteCount=allSites.length;
 const registryCounts=[

  [label("All source-dated records","Semua catatan bersumber"),allRows.length],
  [label("Investment project dossiers","Dossier proyek investasi"),projectCount],
  [label("Asset / operator dossiers","Dossier aset / operator"),assetCount],
  [label("Oil refining facility records","Catatan fasilitas kilang"),refineryCount],
  [label("Mine, pit & industrial-site dossiers","Dossier tambang, blok & fasilitas industri"),siteCount],
  [label("WK / PSC / upstream field references","Referensi WK / PSC / lapangan migas"),allWk.length],
  [label("Fossil & renewable power dossiers","Catatan pembangkit fosil & EBT"),allPower.length],
  [label("PLTU additions verified against PLN/ESDM","Tambahan PLTU dibandingkan PLN/ESDM"),allPltu.length],
  [label("Biodiesel & smelter dossiers","Catatan biodiesel & smelter"),allIndustry.length],
   [label("Smelter facility/project tracker · not national census","Pelacak smelter · bukan sensus nasional"),allSmelters.length],
  [label("Regional source cross-checks","Pemeriksaan sumber regional"),allRegional.length],
  [label("Jakarta / West Java digital facilities","Fasilitas digital Jakarta / Jawa Barat"),allDigital.length],
  [label("Province boundaries","Batas provinsi"),geometry.length]
 ];
 for(const [name,val] of [
  [label("Sourced catalogue records","Catatan katalog bersumber"),allRows.length],
  [label("Indonesian provinces","Provinsi Indonesia"),geometry.length],
  [label("Sector families","Kelompok sektor"),SECTORS.filter(x=>allRows.some(r=>r.sectorKey===x[0])).length],
  [label("Distinct source layers","Lapisan data sumber"),10]
 ]){
  const c=node("div","map-stat");c.append(node("span",null,name),node("strong",null,val));counters.append(c);
 }
 head.append(counters);root.append(head);
 const introduction=node("p","map-taxonomy-intro",label(
  "HOW TO USE · First choose the industry sector; then the asset or technology (for example Oil & Gas → Oil Refinery, or Minerals & Metals → Smelter & Metal Refining). The original company/source register is available only under Advanced.",
  "CARA MEMBACA · Pilih sektor industri, kemudian jenis aset atau teknologi (misalnya Migas → Kilang Minyak, atau Mineral & Logam → Smelter & Pemurnian Logam). Registri sumber asli tersedia di menu Lanjutan."
 ));root.append(introduction);
 const official=data.smelters?.official_baseline;
 const old2024=data.smelters?.official_2024;
 const academic=data.smelters?.academic_nickel_baseline;
 if(official){
  const panel=node("section","map-pln-baseline map-smelter-baseline");
  panel.append(node("div","map-pln-baseline-title",label("SMELTER INVENTORY RECONCILIATION · 2024–2026","REKONSILIASI DATA SMELTER · 2024–2026")));
  const cards=node("div","map-pln-baseline-grid");
  for(const [heading,value] of [
   [label("Named verified-source dossiers · incomplete","Dossier fasilitas/proyek bersumber · belum lengkap"),allSmelters.length],
   [label("Marves nickel snapshot 2024 · all stages","Inventaris nikel Marves 2024 · semua tahap"),academic?.reported??"-"],
   [label("ESDM integrated cohort · 2024","Kohort terintegrasi ESDM · 2024"),old2024?.reported??"-"],
   [label("ESDM integrated cohort · 2025","Kohort terintegrasi ESDM · 2025"),official.reported],
   [label("ESDM 2025 · operating","ESDM 2025 · beroperasi"),official.operating],
   [label("ESDM 2025 · process or planning","ESDM 2025 · proses atau rencana"),official.development]
  ]){const tile=node("div","map-pln-baseline-card");tile.append(node("span",null,heading),node("strong",null,value));cards.append(tile)}
  panel.append(cards);
  if(academic?.technology){
   const plot=node("div","map-nickel-baseline-plot");
   plot.append(node("h3",null,label("Nickel processing · 2024 historical snapshot by technology and project stage","Pengolahan nikel · inventaris historis 2024 per teknologi dan tahap proyek")));
   const statuses=[["operating",label("Operating","Beroperasi")],["construction",label("Construction","Konstruksi")],["planning",label("Planned","Rencana")]];
   for(const [key,caption] of statuses){
    const holder=node("div","map-nickel-baseline-row");
    const total=academic.technology.reduce((sum,x)=>sum+Number(x[key]||0),0);
    holder.append(node("span",null,caption),node("strong",null,total+" "+label("units","unit")));
    const track=node("div","map-nickel-baseline-track");
    for(const x of academic.technology){
     const val=Number(x[key]||0);
     const bar=node("span","map-nickel-baseline-bar "+(x.id==="pyrometallurgy"?"pyro":"hydro"));
     bar.style.width=(100*val/academic.reported)+"%";
     bar.title=x.name+": "+val+" "+label("units","unit");
     track.append(bar);
    }
    holder.append(track);plot.append(holder);
   }
   plot.append(node("p","map-muted",label("2024 inventory: pyrometallurgy 49 operating / 35 building / 36 planned = 120; hydrometallurgy 5 operating / 3 building / 19 planned = 27. Total 147, including 93 non-operational units in that historical snapshot.",
    "Inventaris 2024: pirometalurgi 49 operasi / 35 konstruksi / 36 rencana = 120; hidrometalurgi 5 operasi / 3 konstruksi / 19 rencana = 27. Total 147, termasuk 93 unit belum beroperasi dalam snapshot historis tersebut.")));
   const foot=node("div","map-smelter-baseline-sources");
   foot.append(srcLink(academic.source,label("IPB 2025 · cites Marves November 2024","IPB 2025 · mengutip Marves November 2024")));
   if(old2024?.source)foot.append(srcLink(old2024.source,"ESDM 2024"));
   foot.append(srcLink(official.source,"ESDM 2025"));
   plot.append(foot);panel.append(plot);
  }
  panel.append(node("p","map-muted",label(
   "NOT ADDITIVE · The 147 figure is a nickel project/unit inventory across statuses from November 2024, NOT 147 operating smelters in 2026. ESDM 2024 (15) and 2025 (28) are differently scoped integrated-smelter administrative monitoring cohorts across multiple commodities; 15 to 28 is NOT automatically a count of newly commissioned projects. Named records below are incomplete and can overlap these historical aggregate cohorts. Stand-alone industrial facilities may fall under Kemenperin. Map dots are approximate localities only, not surveyed facility GPS.",
   "TIDAK BOLEH DIJUMLAHKAN · Angka 147 adalah inventaris unit/proyek nikel berbagai tahap per November 2024, BUKAN 147 smelter beroperasi pada 2026. ESDM 2024 (15) dan 2025 (28) adalah kohort pengawasan administratif smelter terintegrasi dengan cakupan berbeda dan lintas komoditas; kenaikan 15 ke 28 BUKAN otomatis pabrik baru yang selesai. Dossier fasilitas di bawah belum lengkap dan bisa termasuk dalam kelompok agregat tersebut. Smelter industri mandiri dapat berada dalam kewenangan Kemenperin. Titik peta adalah referensi wilayah, bukan GPS fasilitas terukur."
  )));
  root.append(panel);
 }
 const stat=data.pltuAudit?.summary_stats;
 if(stat){
  const panel=node("section","map-pln-baseline");
  panel.append(node("div","map-pln-baseline-title",label("PLN STATISTICS 2025 · NATIONAL OWNERSHIP BASELINE","STATISTIK PLN 2025 · ACUAN KEPEMILIKAN NASIONAL")));
  const measures=node("div","map-pln-baseline-grid");
  for(const [title,val,unit] of [
   [label("PLN Group installed capacity","Kapasitas PLN Group"),fmt(stat.pln_group_capacity_mw),"MW"],
   [label("National incl. IPP and leased","Nasional termasuk IPP & sewa"),fmt(stat.national_capacity_including_ipp_and_rentals_mw),"MW"],
   [label("PLN Group generating units","Unit pembangkit PLN Group"),fmt(stat.pln_group_all_technology_units),label("units","unit")],
   [label("PLN-owned PLTU units","Unit PLTU milik PLN"),fmt(stat.pln_owned_pltu_generating_units),label("units","unit")]
  ]){const card=node("div","map-pln-baseline-card");card.append(node("span",null,title),node("strong",null,val+" "+unit));measures.append(card)}
  panel.append(measures);
  panel.append(node("p","map-muted",label(
   "2025 aggregate statistics cover different ownership populations; 138 PLN-owned coal GENERATING UNITS are not 138 named PLTU stations. IPPs such as Batang appear in national capacity but do not increase PLN-owned unit counts. A source-documented plant-site list is not an exhaustive census.",
   "Statistik agregat 2025 mencakup populasi kepemilikan yang berbeda; 138 UNIT PLTU milik PLN bukan berarti 138 lokasi PLTU. IPP seperti Batang masuk kapasitas nasional tetapi bukan unit milik PLN. Daftar fasilitas bersumber bukan sensus seluruh pembangkit."
  )));
  panel.append(srcLink(stat.source,label("Official PLN Statistics 2025","Statistik PLN 2025 resmi")));
  root.append(panel);
 }
 root.append(node("div","map-alert",label("ALL records contain different evidence vintages. PLTU Batang and newer IPP units are now indexed; a parent power plant and its units may both appear as dossiers. Kepulauan Riau displays SEPARATE approximate Batam and Natuna location markers; unverified Kepri localities are kept in province records only. Province/project counts are NOT unique power stations, capacity or expenditure.","SELURUH catatan berasal dari tahun bukti yang berbeda. PLTU Batang dan unit IPP yang lebih baru kini tercatat; satu kompleks dan unitnya bisa muncul sebagai beberapa dossier. Kepulauan Riau menampilkan penanda lokasi PERKIRAAN Batam dan Natuna secara terpisah; lokasi Kepri lain tanpa bukti kota tidak diberi penanda kota. Jumlah catatan bukan jumlah pembangkit unik, kapasitas, atau nilai investasi.")));
 const controls=node("div","map-controls"),kind=node("select","map-select"),group=node("select","map-select"),assetType=node("select","map-select"),stage=node("select","map-select"),location=node("select","map-select"),provinceSelect=node("select","map-select"),search=node("input","map-search"),reset=node("button","map-btn",label("Reset filters","Reset filter"));
 kind.setAttribute("aria-label","Registry source (advanced)");
 assetType.setAttribute("aria-label","Asset type filter");
 group.setAttribute("aria-label","Sector filter");
 stage.setAttribute("aria-label","Implementation stage filter");
 location.setAttribute("aria-label","Geographic coverage filter");
 provinceSelect.setAttribute("aria-label","Choose province");
 search.type="search";search.placeholder=label("Search asset, project, operator, province","Cari aset, proyek, operator, provinsi");search.setAttribute("aria-label","Search map records");
 reset.type="button";
 radioOptions(kind,[
  ["all",label("All verified-source registry records","Semua entri registri bersumber")],
  ["projects",label("Investment projects (all years)","Proyek investasi (semua tahun)")],
  ["assets",label("Asset & operator dossiers","Dossier aset dan operator")],
  ["refineries",label("Refinery facilities","Fasilitas kilang")],
  ["sites",label("Mine & industrial-site dossiers","Dossier tambang & fasilitas industri")],
  ["wk",label("Oil & gas WK / PSC references","Referensi WK / PSC migas")],
  ["power",label("Fossil / renewable power sites","Pembangkit fosil / EBT")],
  ["industry",label("Biodiesel & smelter facilities","Fasilitas biodiesel & smelter")],
  ["smelters",label("Smelter Intelligence · 2026 tracker","Intelijen Smelter · pelacak 2026")],
  ["regional",label("Batam, Jatim–Bali, Natuna, Tangguh, Masela","Batam, Jatim–Bali, Natuna, Tangguh, Masela")],
  ["digital",label("Digital / AI · all registries","Digital / AI · seluruh registri")]
 ]);
 kind.value="all";
 radioOptions(location,[["all",label("All: mapped & unlocated","Semua: terpetakan & tanpa lokasi")],["mapped",label("Province-mapped only","Hanya terpetakan")],["unlocated",label("Unlocated / multiple provinces","Tanpa lokasi / lintas provinsi")]]);
 radioOptions(provinceSelect,[["all",label("All provinces","Seluruh provinsi")],...geometry.map(f=>[f.properties.name,f.properties.name]).sort((a,b)=>a[1].localeCompare(b[1]))]);
 const ctrl=(caption,input,extra)=>{const l=node("label","map-control"+(extra||""));l.append(node("span",null,caption),input);return l};
 controls.append(ctrl(label("1 · Sector","1 · Sektor"),group),ctrl(label("2 · Asset type","2 · Jenis aset"),assetType),
 ctrl(label("3 · Project phase","3 · Tahapan proyek"),stage),ctrl(label("4 · Province","4 · Provinsi"),provinceSelect),
 ctrl(label("Geographic accuracy","Akurasi lokasi"),location),ctrl(label("Search operator, asset, WK…","Cari operator, aset, WK…"),search," map-search-row"),reset);
 root.append(controls);
 const glossaryShortcut=node("button","map-btn map-glossary-btn",label("ⓘ Open definitions & appendix","ⓘ Lihat istilah & lampiran"));glossaryShortcut.type="button";
 glossaryShortcut.addEventListener("click",()=>{outside.open=true;outside.scrollIntoView?.({behavior:"smooth",block:"start"})});
 root.append(glossaryShortcut);
 const advanced=node("details","map-advanced");const advSummary=node("summary",null,label("Advanced · original data registry (optional)","Lanjutan · registri sumber asli (opsional)"));
 advanced.append(advSummary,ctrl(label("Original registry · not an industry sector","Registri asal · bukan sektor industri"),kind));root.append(advanced);
 const shortcuts=node("div","map-digital-shortcuts"),shortLabel=node("span","map-short-label",label("DIGITAL / AI QUICK VIEW","TAMPILAN CEPAT DIGITAL / AI"));
 shortcuts.append(shortLabel);
 for(const [name,provinceName] of [
  [label("Jakarta data centers","Data center Jakarta"),"DKI Jakarta"],
  [label("West Java data centers","Data center Jawa Barat"),"Jawa Barat"],
  [label("All Digital / AI","Semua Digital / AI"),"all"]
 ]){
  const b=node("button","map-btn map-digital-btn",name);b.type="button";
  b.addEventListener("click",()=>{
   currentPoint=null;currentKind="digital";kind.value="digital";currentProvince=provinceName==="all"?null:provinceName;
   provinceSelect.value=provinceName;currentSector="all";currentType="all";currentStage="all";currentLocation="all";location.value="all";
   lastQuery="";search.value="";filtersRebuild();draw();
  });
  shortcuts.append(b);
 }
 root.append(shortcuts);
 const smelterShortcut=node("button","map-btn map-smelter-preset",label("SMELTER MAP · 2026 owners, capacity, products & status","PETA SMELTER · 2026 pemilik, kapasitas, produk & status"));
 smelterShortcut.type="button";smelterShortcut.addEventListener("click",()=>{
  currentKind="smelters";kind.value="smelters";currentProvince=null;currentKepriCluster=null;currentPoint=null;
  currentSector="Minerals & Metals";currentType="all";currentStage="all";currentLocation="all";currentAccuracy="all";
  provinceSelect.value="all";location.value="all";lastQuery="";search.value="";
  for(const b of geoButtons)b.setAttribute("aria-pressed",String(b.dataset.accuracy==="all"));
  filtersRebuild();draw();mapSection.scrollIntoView?.({behavior:"smooth",block:"start"});
 });root.append(smelterShortcut);
 const accuracyBar=node("div","map-accuracy-bar");
 accuracyBar.append(node("strong",null,label("COORDINATE ACCURACY","AKURASI KOORDINAT")));
 const geoCount=node("span","map-geocode-count");let currentAccuracy="all";
 const accuracies=[
  ["all",label("All records","Semua catatan")],
  ["locality",label("Locality pins","Titik wilayah")],
  ["province",label("Province only","Hanya provinsi")],
  ["unknown",label("No location","Tanpa lokasi")]
 ];
 const geoButtons=[];
 for(const [value,copy] of accuracies){
  const b=node("button","map-btn map-accuracy-btn",copy);b.type="button";b.dataset.accuracy=value;
  b.setAttribute("aria-pressed",String(value==="all"));
  b.addEventListener("click",()=>{
   currentAccuracy=value;currentPoint=null;currentProvince=null;currentKepriCluster=null;provinceSelect.value="all";
   for(const item of geoButtons)item.setAttribute("aria-pressed",String(item.dataset.accuracy===value));
   draw();
  });
  accuracyBar.append(b);geoButtons.push(b);
 }
 accuracyBar.append(geoCount);root.append(accuracyBar);
 const grid=node("div","map-mapgrid"),mapSection=node("section","map-canvas-wrap"),mapHead=node("div","map-canvas-head");
 const place=node("p",null,label("38 provinces · administrative boundaries","38 provinsi · batas administratif")),zoom=node("div","map-zoom");
 const minus=node("button","map-btn","−"),plus=node("button","map-btn","+"),home=node("button","map-btn",label("Reset view","Reset tampilan"));
 for(const [b,desc] of [[minus,"Zoom out"],[plus,"Zoom in"],[home,"Reset map view"]]){b.type="button";b.setAttribute("aria-label",desc);zoom.append(b)}
 mapHead.append(place,zoom);mapSection.append(mapHead);
 const svg=snode("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":label("Interactive province map of Indonesia","Peta provinsi interaktif Indonesia"),class:"map-viz"});
 const shapeLayer=snode("g"),adminLayer=snode("g",{class:"map-administrative-references"}),bubbleLayer=snode("g"),pinLayer=snode("g",{class:"map-coordinate-markers"}),gridlines=snode("g",{class:"map-gridlines"});
 for(let lat=-10;lat<=5;lat+=5){const line=snode("line",{x1:20,x2:W-15,y1:yFor(lat),y2:yFor(lat)});gridlines.append(line)}
 svg.append(gridlines,shapeLayer,adminLayer,pinLayer,bubbleLayer);
 mapSection.append(svg);
 const legend=node("div","map-legend");
 for(const [cls,txt] of [["map-swatch",label("Province has records","Provinsi memiliki catatan")],["map-swatch off",label("No mapped record","Tidak ada catatan terpetakan")],["map-swatch selected",label("Selected province","Provinsi dipilih")]]){
  const wrap=node("span");wrap.append(node("i",cls),document.createTextNode(" "+txt));legend.append(wrap)
 }
for(const [cls,txt] of [["map-legend-pin",label("Approximate locality pin","Titik wilayah perkiraan")],["map-legend-admin",label("Province only — NOT facility GPS","Hanya provinsi — BUKAN GPS fasilitas")]]){
  const wrap=node("span");wrap.append(node("i",cls),document.createTextNode(" "+txt));legend.append(wrap);
 }
 mapSection.append(legend);grid.append(mapSection);
 const side=node("section","map-results"),resultsHead=node("div","map-results-head"),heading=node("h3",null,label("Mapped evidence","Bukti terpetakan")),info=node("p","map-muted"),list=node("div","map-list");
 const insight=node("section","map-asset-insight");
 insight.setAttribute("aria-label",label("Selected asset insight and source details","Analisis aset terpilih dan sumber"));
 insight.setAttribute("aria-live","polite");
 const expand=node("button","map-btn map-expand",label("Browse matching assets","Lihat daftar aset terkait"));expand.type="button";
 let expanded=false;
 expand.addEventListener("click",()=>{
  expanded=!expanded;
  // The record list is secondary to the selected insight. Never expand the
  // entire right column past the map or force the user to scroll past a dossier.
  side.className="map-results"+(expanded?" show-list":"");
  expand.textContent=expanded?label("Hide asset list","Sembunyikan daftar aset"):label("Browse matching assets","Lihat daftar aset terkait");
  expand.setAttribute("aria-expanded",String(expanded));
 });
 expand.setAttribute("aria-expanded","false");
 resultsHead.append(heading,info,expand);side.append(resultsHead,insight,list);grid.append(side);root.append(grid);
 const outside=node("details","map-footer"),summary=node("summary",null,label("APPENDIX · All terms, abbreviations, units, classification and methodology","LAMPIRAN · Istilah, singkatan, satuan, klasifikasi dan metodologi"));
 const appendix=node("div");
 const guide=data.glossary;
 if(guide?.sections?.length){
  const head=node("section","map-glossary-head");
  head.append(node("h3",null,label("Asset and map terminology · one shared dictionary","Istilah aset dan peta · satu glosarium bersama")));
  head.append(node("p","map-muted",label(
   "The 84 original map terms, asset-type labels and overlaps with Energy Security are consolidated in one bilingual dictionary. Keep the map-specific geolocation, source-registry and double-counting methods below.",
   "Sebanyak 84 istilah peta asli, label jenis aset, dan istilah yang sama dengan Energy Security digabungkan dalam satu glosarium dwibahasa. Metode khusus koordinat, asal sumber dan potensi hitungan ganda tetap dijelaskan di bawah."
  )));
  const shared=document.createElement("a");
  shared.href="./sli-glossary-methodology.html?domain=maps";
  shared.textContent=label("Search every map term, technology, abbreviation and unit ↗","Cari istilah peta, teknologi, singkatan dan satuan ↗");
  head.append(shared);
  appendix.append(head);
  if(Array.isArray(guide.source_layers)&&guide.source_layers.length){
   const details=node("details","map-glossary-section map-glossary-source");
   details.append(node("summary",null,label("Map-source layer methodology · "+guide.source_layers.length+" types","Metodologi jenis sumber peta · "+guide.source_layers.length+" tipe")));
   const terms=node("dl","map-terms");
   for(const x of guide.source_layers)terms.append(node("dt",null,x.term),node("dd",null,label(x.definition_en,x.definition_id)));
   details.append(terms);appendix.append(details);
  }
 }
 const origin=node("details","map-registry-appendix"),originSummary=node("summary",null,label("Data layers and potential duplicate record counts","Lapisan sumber dan potensi duplikasi hitungan"));
 origin.append(originSummary,node("p","map-muted",label(
  "A raw data registry is NOT a sector. The rows below are source-register counts and may cover the same facility, its corporate operator or several sub-units.",
  "Registri asal BUKAN sektor industri. Jumlah berikut merupakan entri menurut sumber yang mungkin berulang antara fasilitas, perusahaan operator atau sejumlah unit."
  )));
 for(const [title,n] of registryCounts)origin.append(node("p","map-registry-line",title+": "+n));
 appendix.append(origin);
 appendix.append(node("p",null,label(
  "This is a geographic index of source-attributed project and asset records, not a geocoded site database. A record is placed at province level only if a unique province is independently indicated by its existing source-dated dossier. Missing, nationwide and multi-province cases remain unlocated. Do not interpret bubble centers as addresses or facility coordinates.",
  "Ini adalah indeks geografis catatan aset dan proyek bersumber, bukan basis data lokasi fasilitas presisi. Catatan ditempatkan pada tingkat provinsi hanya jika dossier menyebutkan satu provinsi secara jelas. Kasus tanpa lokasi, nasional, atau lintas provinsi tidak diberi titik. Pusat lingkaran bukan alamat atau koordinat fasilitas."
  )));
 appendix.append(node("p",null,label(
  "Coverage now also includes Pertamina 2022 upstream WK/field rosters, Medco 2024–2026 upstream/power disclosures, historical PLN/ESDM PLTU–PLTGU–PLTA–PLTP lists (some dating back to 2010), EBTKE 2024/25 biodiesel plant geography and 2025/26 government refinery/smelter directories. Historical source vintage is not current operating certification, owner verification, COD or executed CAPEX. RUPTL targets and regional energy totals are not allocated to individual sites. Double counts across company, WK, field, facility and investment dossiers are possible; never sum counts as unique projects or investment value.",
  "Cakupan kini juga menyertakan daftar WK/lapangan Pertamina 2022, pengungkapan portofolio Medco 2024–2026, daftar historis pembangkit ESDM/PLN (sebagian sejak 2010), data lokasi produsen biodiesel EBTKE 2024/25, serta dossier smelter resmi. Tahun publikasi lama bukan bukti operasi, operator, izin PSC, COD atau realisasi belanja modal tahun 2026. Target regional RUPTL tidak dialokasikan menjadi angka investasi setiap lokasi. Catatan perusahaan, WK, lapangan, fasilitas dan proyek bisa tumpang tindih sehingga tidak boleh dijumlahkan sebagai proyek unik ataupun modal investasi."
  )));
 appendix.append(node("p","map-limited",label(
  "NEW COORDINATE-LAYER METHODOLOGY: A marker is a WGS84 approximate named-city, locality, industrial zone or district reference ONLY when a source record identifies that locality. It is not a surveyed site/facility GPS coordinate. Co-located records form interactive clusters. Province-only, offshore and undisclosed locations cannot be assigned made-up project coordinates and remain searchable in the full registry. The user can filter by accuracy. Licensing and city labels: GeoNames, CC BY 4.0.",
  "METODOLOGI TITIK KOORDINAT BARU: penanda WGS84 adalah posisi PERKIRAAN kota, kecamatan, kawasan industri atau kabupaten jika lokasi tersebut disebut pada sumber. Ini BUKAN koordinat GPS fasilitas. Entri dengan lokasi serupa dikelompokkan dalam klaster interaktif. Catatan provinsi saja, offshore dan lokasi dirahasiakan tetap bisa dicari tanpa lokasi fiktif. Akurasi dapat difilter. Sumber nama wilayah: GeoNames, CC BY 4.0."
  )));
 const namesCredit=node("p");namesCredit.append(document.createTextNode(label("Locality reference: ","Referensi wilayah: ")),srcLink("https://www.geonames.org/","GeoNames · CC BY 4.0"));
 appendix.append(namesCredit);
 const geoAttribution=node("p");
 geoAttribution.append(document.createTextNode(label("Boundary source: ","Sumber batas provinsi: ")),srcLink(data.geo.metadata?.source,"Indonesia GeoJSON (38 provinces)"),document.createTextNode(" · CC BY 4.0 · "+label("Coordinates rounded to 4 decimals; check upstream rights before commercial redistribution.","Koordinat dibulatkan 4 desimal; periksa lisensi sumber awal sebelum distribusi komersial.")));
 appendix.append(geoAttribution);
 appendix.append(node("p","map-limited",label(
  "Batam / Natuna geo-method: Kepulauan Riau is an archipelagic province. Its original polygon centroid landed near Natuna, not Batam. We now plot only name-backed Batam records near 104.05°E 1.05°N and Natuna references near 108.18°E 3.94°N, both APPROXIMATE CITY/ISLAND REFERENCE ANCHORS (not coordinates of projects, data centers, oil platforms or drilling rigs). Province-only Kepri dossiers remain searchable from the province selection and do not receive fictitious site pins.",
  "Metode lokasi Batam / Natuna: centroid poligon Kepulauan Riau semula jatuh dekat Natuna, bukan Batam. Kini hanya entri yang menyebut Batam ditampilkan dekat 104,05°BT 1,05°LU dan yang menyebut Natuna dekat 108,18°BT 3,94°LU. Keduanya TITIK REFERENSI PERKIRAAN kota/gugus pulau, BUKAN koordinat proyek, pusat data, sumur atau anjungan. Entri yang hanya diketahui berada di Kepri tetap di daftar provinsi tanpa titik palsu."
  )));
 appendix.append(node("p","map-limited",label(
  "PLN Statistics 2025 is a nationwide INSTALLED-CAPACITY AND GENERATING-UNIT reference, not a name-by-name database of all PLN+IPP coal sites. 2024 ESDM vital-installation records, PLN operating releases, project operator disclosures and Kemenkeu Batang completion confirm the named PLTU additions. Where an existing complex and subunit are both reported, do not sum MW or number of records as distinct power plants.",
  "Statistik PLN 2025 merupakan REFERENSI KAPASITAS TERPASANG DAN UNIT PEMBANGKIT nasional, bukan registri lengkap nama semua PLTU PLN+IPP. Tambahan PLTU dilengkapi dengan keputusan Obvitnas ESDM 2024, rilis operasi PLN, sumber operator dan konfirmasi PLTU Batang oleh Kemenkeu. Dossier kompleks dan unitnya tidak boleh dijumlahkan menjadi aset fisik berbeda."
  )));
 appendix.append(node("p","map-limited",label(
  "Digital / AI maps individually source-confirmed physical data-center campuses in Jakarta, West Java and Batam. AI-ready means capable of supporting AI workloads, not verified deployed GPU fleets. Site capacities, planned MW and operator-level aggregated MW are not additive. Microsoft Indonesia Central and AWS Jakarta cloud region are retained as unlocated when their physical availability-zone addresses are not disclosed.",
  "Digital/AI memetakan kampus fisik data center bersumber di Jakarta, Jawa Barat, dan Batam. AI-ready bukan bukti jumlah GPU yang benar-benar terpasang. MW fasilitas, rencana kapasitas, dan portofolio operator tidak boleh dijumlahkan. Region Microsoft Indonesia Central dan AWS Jakarta tetap tidak dipetakan jika alamat fisik availability zone tidak diumumkan."
 )));
 appendix.append(node("p","map-limited",label(
  "Offshore and multi-province PSCs can appear under every EXPLICIT source-backed province (Agung I: Bali and East Java); each record still counts ONCE nationally. Bubble placement is a province association, NOT an offshore well coordinate. PPA, planned investment, FID, groundbreaking, operation and FEED are separate milestones.",
  "WK lepas pantai atau lintas provinsi dapat terasosiasi dengan beberapa provinsi berdasarkan sumber (Agung I: Bali dan Jawa Timur), tetapi satu entri tetap dihitung SEKALI secara nasional. Titik provinsi BUKAN lokasi sumur offshore. PJBTL, rencana investasi, FID, peletakan batu pertama, operasi dan FEED merupakan tahapan berbeda."
 )));
 const caveat=node("p","map-limited",label("A palm investment total does not establish the location of individual palm mills or estates. No palm facility is pinned without a source-dated site record.","Total investasi sawit tidak menentukan lokasi pabrik atau kebun tertentu. Tidak ada fasilitas sawit yang dipetakan tanpa catatan lokasi bersumber."));
 appendix.append(caveat);
 const countsText=node("p","map-muted");appendix.append(countsText);
 outside.append(summary,appendix);root.append(outside);
 let currentKind="all",currentProvince=null,currentKepriCluster=null,currentPoint=null,lastQuery="",currentSector="all",currentType="all",currentStage="all",currentLocation="all";
 let selectedRecordId=null,lastInspectorSelection=null;
 let viewport={x:0,y:0,w:W,h:H},drag=null,dragged=false;
 function setView(v){viewport=v;svg.setAttribute("viewBox",[v.x,v.y,v.w,v.h].join(" "))}
 function zoomAt(factor){const v=viewport,ratio=factor,uw=Math.max(250,Math.min(W*1.1,v.w*ratio)),uh=Math.max(110,Math.min(H*1.1,v.h*ratio));setView({x:v.x+(v.w-uw)/2,y:v.y+(v.h-uh)/2,w:uw,h:uh})}
 plus.addEventListener("click",()=>{zoomAt(.78);draw()});minus.addEventListener("click",()=>{zoomAt(1.28);draw()});home.addEventListener("click",()=>{setView({x:0,y:0,w:W,h:H});draw()});
 if(svg.addEventListener){
  svg.addEventListener("pointerdown",e=>{if(e.pointerType==="touch")return;drag={x:e.clientX,y:e.clientY,b:viewport};dragged=false;svg.setPointerCapture?.(e.pointerId)});
  svg.addEventListener("pointermove",e=>{if(!drag)return;const rect=svg.getBoundingClientRect?.();if(!rect?.width)return;const dx=(e.clientX-drag.x)*drag.b.w/rect.width,dy=(e.clientY-drag.y)*drag.b.h/rect.height;if(Math.abs(dx)+Math.abs(dy)>3)dragged=true;setView({...drag.b,x:drag.b.x-dx,y:drag.b.y-dy})});
  svg.addEventListener("pointerup",()=>{drag=null;setTimeout(()=>{dragged=false},80)});
  svg.addEventListener("pointercancel",()=>{drag=null;dragged=false});
 }
 const featureByName=new Map(geometry.map(f=>[f.properties.name,f]));
 function active(){return currentKind==="all"?allRows:currentKind==="digital"?digitalRows:currentKind==="assets"?allAssets:currentKind==="projects"?allProjects:currentKind==="sites"?allSites:currentKind==="wk"?allWk:currentKind==="power"?allPower:currentKind==="industry"?allIndustry:currentKind==="smelters"?allSmelters:currentKind==="regional"?allRegional:allRefineries}
 function filtersRebuild(){
  const rows=active(),groups=SECTORS.map(x=>x[0]).filter(x=>rows.some(r=>r.sectorKey===x));
  if(!groups.includes(currentSector))currentSector="all";
  const types=[...new Set(rows.filter(r=>currentSector==="all"||r.sectorKey===currentSector).map(r=>r.assetType))].sort();
  if(!types.includes(currentType))currentType="all";
  const phases=[...new Set(rows.filter(r=>(currentSector==="all"||r.sectorKey===currentSector)&&(currentType==="all"||r.assetType===currentType)).map(r=>r.phase))].sort();
  if(!phases.includes(currentStage))currentStage="all";
  radioOptions(group,[["all",label("All industries","Seluruh sektor")],...groups.map(x=>[x,sectorLabel(x)])]);
  radioOptions(assetType,[["all",label("All asset types","Seluruh jenis aset")],...types.map(x=>[x,assetLabel(x)])]);
  radioOptions(stage,[["all",label("All project phases","Seluruh tahapan proyek")],...phases.map(x=>[x,phaseLabel(x)])]);
  group.value=currentSector;assetType.value=currentType;stage.value=currentStage;
 }
 const provinceAssociations=r=>[...new Set((Array.isArray(r.provinces)&&r.provinces.length?r.provinces:r.province?[r.province]:[]).filter(p=>featureByName.has(p)))];
 const gazetteer=(data.localityAnchors?.entries||[]).filter(p=>Number.isFinite(p.longitude)&&Number.isFinite(p.latitude)&&p.longitude>=94&&p.longitude<=142&&p.latitude>=-12&&p.latitude<=7);
 const geoText=x=>String(x||"").toLowerCase().replace(/[.,;:/·()—–-]/g," ").replace(/\s+/g," ").trim();
 function pointFor(r){
  const provinces=provinceAssociations(r);
  if(provinces.length!==1)return null;
  const raw=geoText(r.region);
  if(!raw||/\b(offshore|lepas pantai|natuna sea|arafura sea|java sea|nationwide|national retail|multi site|multi location|multiple|cloud region|service region|site undisclosed|site addresses not disclosed|physical az|availability zones|countrywide|sites not disclosed)\b/.test(raw))return null;
  let selected=null,score=0;
  for(const a of gazetteer){
   if(a.province!==provinces[0])continue;
   for(const term of a.terms||[]){
    const t=geoText(term);
    if(t.length>2&&(" "+raw+" ").includes(" "+t+" ")&&t.length>score){selected=a;score=t.length}
   }
  }
  return selected?{id:selected.name+"|"+selected.province,label:selected.name,lon:selected.longitude,lat:selected.latitude,source:selected.source_url}:null;
 }
 const accuracyOf=r=>pointFor(r)?"locality":provinceAssociations(r).length?"province":"unknown";
 
 const filtered=()=>active().filter(r=>{
  const mapped=provinceAssociations(r).length>0;
  return (currentSector==="all"||r.sectorKey===currentSector)
   &&(currentType==="all"||r.assetType===currentType)
   &&(currentStage==="all"||r.phase===currentStage)
   &&(currentLocation==="all"||(currentLocation==="mapped"?mapped:!mapped))
   &&(currentAccuracy==="all"||accuracyOf(r)===currentAccuracy)
   &&(!lastQuery||[r.name,r.operator,r.region,r.province,...provinceAssociations(r),r.sector,r.stage,r.kind].join(" ").toLowerCase().includes(lastQuery));
 });

 function describeMarket(r){
  const sector=sectorLabel(r.sectorKey),type=assetLabel(r.assetType);
  if(r.kind==="smelters"){
   return label(
    "This facility belongs to the "+type+" value chain. Its announced/rated capacity must not be read as realized production; inspect commissioning, product and actual reported output separately.",
    "Fasilitas ini merupakan bagian dari rantai nilai "+type+". Kapasitas desain/rencana bukan produksi yang telah terealisasi; periksa commissioning, produk, dan output aktual secara terpisah."
   );
  }
  if(r.kind==="digital"){
   return label(
    "Digital infrastructure in "+(r.province||r.region||"Indonesia")+" depends on power availability, connectivity and implementation milestones. AI-ready status alone is not evidence of installed GPUs or operating compute.",
    "Infrastruktur digital di "+(r.province||r.region||"Indonesia")+" bergantung pada ketersediaan listrik, konektivitas dan tahap pelaksanaan. Status AI-ready bukan bukti GPU atau komputasi AI sudah beroperasi."
   );
  }
  if(r.sectorKey==="Power Generation"){
   return label("The listed "+type+" capacity is a source-reported rating, not verified annual electricity output. Grid connections, dispatch and offtake require separate evidence.",
    "Kapasitas "+type+" adalah rating menurut sumber, bukan bukti produksi listrik tahunan. Koneksi jaringan, dispatch dan penyerapan daya memerlukan data terpisah.");
  }
  if(r.sectorKey==="Oil & Gas")return label(
   "This oil-and-gas record concerns "+type+". Project announcements, investment decisions, commissioning and actual flows have different economic meanings and should not be combined.",
   "Catatan migas ini berkaitan dengan "+type+". Pengumuman proyek, keputusan investasi, commissioning dan aliran produksi aktual merupakan tahap berbeda dan tidak boleh disamakan.");
  return label("This is an attributed "+sector+" asset record. Any economic or supply-chain effects depend on operational status, physical capacity and realized investment evidence.",
   "Ini merupakan catatan aset "+sector+" yang teratribusi. Dampak ekonomi atau rantai pasoknya bergantung pada status operasi, kapasitas fisik dan bukti investasi terealisasi.");
 }
 function describeLesson(r){
  const hasActual=r.production?.value!=null;
  if(hasActual)return label(
   "Lesson: compare the "+r.production.year+" reported output with rated capacity only when the product, unit, utilization period and reporting boundary match. Avoid counting parent facilities and subunits twice.",
   "Pelajaran: bandingkan output aktual "+r.production.year+" dengan kapasitas hanya jika produk, satuan, periode operasi dan cakupan pelaporannya sama. Hindari penghitungan ganda fasilitas induk dan unit.");
  if(r.phase==="Construction / Testing")return label(
   "Lesson: construction or testing is not commercial operation. Check commissioning, completion percentage and first-output evidence before counting realized capacity.",
   "Pelajaran: konstruksi atau pengujian belum sama dengan operasi komersial. Periksa commissioning, progres penyelesaian dan bukti produksi pertama sebelum menghitung kapasitas terealisasi.");
  if(r.phase==="Planned / Agreed")return label(
   "Lesson: plans, MoUs and signed agreements are not proof of physical execution. Confirm financing, permits, site works and operator disclosures.",
   "Pelajaran: rencana, MoU, dan perjanjian belum membuktikan pembangunan fisik. Periksa pendanaan, perizinan, pekerjaan lapangan dan pengungkapan operator.");
  if(r.phase==="Historical / Verify"||r.phase==="Status / Verify")return label(
   "Lesson: the latest operating status is not independently established in this record. Retain its source date and seek a newer company or government confirmation.",
   "Pelajaran: status operasi terbaru belum dapat dipastikan secara independen dari catatan ini. Pertahankan tanggal sumber dan cari konfirmasi baru dari perusahaan atau pemerintah.");
  return label("Lesson: distinguish operator reporting from independently confirmed operations, and do not sum overlapping asset records as new investment.",
   "Pelajaran: bedakan pelaporan operator dari operasi terkonfirmasi secara independen, dan jangan menjumlahkan aset yang tumpang tindih sebagai investasi baru.");
 }
 function insightSection(title,value){
  const block=node("div","map-insight-section");
  block.append(node("h5",null,title),node("p",null,value));
  return block;
 }
 function showAllProvince(record){
  // A geographic selection must not be mistaken for a sector-specific no-data result.
  // Restore the full source catalogue for this province without inventing records.
  currentKind="all";kind.value="all";currentSector="all";currentType="all";currentStage="all";
  currentLocation="all";location.value="all";currentAccuracy="all";
  currentPoint=null;currentKepriCluster=null;lastQuery="";search.value="";
  provinceSelect.value=currentProvince||"all";
  for(const b of geoButtons)b.setAttribute("aria-pressed",String(b.dataset.accuracy==="all"));
  selectedRecordId=record?.id||null;
  filtersRebuild();draw();
 }
 function provinceEvidence(chosen){
  const province=currentProvince;
  const allProvince=allRows.filter(r=>provinceAssociations(r).includes(province));
  const counts=new Map();
  for(const r of allProvince)counts.set(r.sectorKey,(counts.get(r.sectorKey)||0)+1);
  const sectors=[...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  const card=node("section","map-province-insight");
  card.append(node("div","map-province-kicker",label("PROVINCE INTELLIGENCE","INTELIJEN PROVINSI")));
  card.append(node("h4",null,province));
  const summary=node("div","map-province-numbers");
  const a=node("div");a.append(node("strong",null,chosen.length),node("span",null,label("records under active filters","catatan sesuai filter aktif")));
  const b=node("div");b.append(node("strong",null,allProvince.length),node("span",null,label("records in full SLI catalogue","catatan pada katalog lengkap SLI")));
  summary.append(a,b);card.append(summary);
  if(sectors.length){
   card.append(insightSection(label("Source-backed sector coverage","Sektor yang memiliki catatan bersumber"),
    sectors.map(([name,total])=>sectorLabel(name)+" · "+total+" "+label("records","catatan")).join("\n")));
  }else{
   card.append(insightSection(label("Registry coverage","Cakupan registri"),
    label("No individually attributed source record is currently indexed to this province. This is a data coverage gap, not proof that no facilities or investment exist.",
     "Belum ada catatan sumber individual yang dipetakan ke provinsi ini. Ini keterbatasan cakupan data, bukan bukti bahwa tidak ada fasilitas atau investasi.")));
  }
  if(!chosen.length){
   const sector=currentSector==="all"?label("all industries","semua sektor"):sectorLabel(currentSector);
   const reasons=[sector,currentType==="all"?"":assetLabel(currentType),currentStage==="all"?"":phaseLabel(currentStage),lastQuery?label("search: ","pencarian: ")+lastQuery:""].filter(Boolean).join(" · ");
   card.append(node("p","map-province-no-match",label(
    "No records pass the current registry, sector, status or search filters for this province. The count of zero describes the filtered SLI catalogue—not the number of actual projects in this province.",
    "Tidak ada catatan yang lolos kombinasi filter registri, sektor, status, atau pencarian untuk provinsi ini. Angka nol merujuk pada katalog SLI yang tersaring, BUKAN jumlah proyek yang sebenarnya di provinsi ini.")));
   card.append(node("p","map-province-filter",label("Active sector / filters: ","Sektor / filter aktif: ")+reasons));
  }else{
   card.append(node("p","map-province-note",label(
    "Record counts are not the number of unique facilities or realized investments; different source layers and reporting years can overlap.",
    "Jumlah catatan bukan jumlah fasilitas unik atau investasi terealisasi; lapisan dan tahun sumber dapat saling tumpang tindih.")));
  }
  if(allProvince.length&&(!chosen.length||currentKind!=="all"||currentSector!=="all"||currentType!=="all")){
   const openAll=node("button","map-btn map-province-all",label("View every sector in this province","Lihat semua sektor di provinsi ini"));
   openAll.type="button";openAll.addEventListener("click",()=>showAllProvince());
   card.append(openAll);
  }
  if(!chosen.length&&allProvince.length){
   card.append(node("h5","map-province-related-heading",label("Explore existing SLI records","Jelajahi catatan SLI yang tersedia")));
   const suggested=node("div","map-province-related");
   for(const record of allProvince.slice(0,6)){
    const btn=node("button","map-province-related-link",record.name);
    btn.type="button";
    btn.setAttribute("aria-label",label("Open source-backed record: ","Buka catatan bersumber: ")+record.name);
    btn.append(node("small",null,sectorLabel(record.sectorKey)));
    btn.addEventListener("click",()=>showAllProvince(record));
    suggested.append(btn);
   }
   card.append(suggested);
   const link=allProvince.find(r=>/^https:\/\//.test(r.source||""));
   if(link){const sources=node("div","map-insight-sources");sources.append(srcLink(link.source,label("Example original source","Contoh sumber asli")));card.append(sources)}
  }
  return card;
 }
 function renderAssetInsight(chosen){
  insight.replaceChildren();
  const actionable=Boolean(currentPoint||currentProvince||currentKepriCluster);
  if(!actionable&&!selectedRecordId){
   insight.append(node("div","map-insight-empty",label(
    "SELECT A POINT · Click a teal location, a gold cluster, a province or a record below to inspect its evidence, implementation and research lesson.",
    "PILIH TITIK · Klik titik hijau, klaster emas, provinsi, atau catatan di bawah untuk melihat bukti, pelaksanaan dan pelajaran analitis."
   )));
   return;
  }
  if(currentProvince)insight.append(provinceEvidence(chosen));
  if(!chosen.length){
   if(!currentProvince)insight.append(node("div","map-insight-empty",label(
    "No matching records remain for this selected map point. Reset the sector or geographic filters to inspect source evidence.",
    "Tidak ada catatan yang cocok untuk titik terpilih. Reset filter sektor atau geografi untuk memeriksa buktinya."
   )));
   return;
  }
  // Opening a map pin, cluster or province must show evidence immediately.
  // Default to its first source record, retaining the chooser for multi-asset clusters.
  let selected=chosen.find(r=>r.id===selectedRecordId);
  if(!selected){selected=chosen[0];selectedRecordId=selected.id}
  const bar=node("div","map-insight-toolbar");
  const title=node("strong",null,label("SELECTED ASSET INSIGHT","ANALISIS ASET TERPILIH"));
  const clear=node("button","map-btn map-insight-reset",label("Clear selection","Hapus pilihan"));
  clear.type="button";
  clear.addEventListener("click",()=>{selectedRecordId=null;currentPoint=null;currentProvince=null;currentKepriCluster=null;provinceSelect.value="all";draw()});
  bar.append(title,clear);insight.append(bar);
  const scope=label("Matched source records: ","Catatan bersumber terkait: ")+chosen.length+" · "+
   (currentPoint?label("approximate locality cluster, not project GPS","klaster wilayah perkiraan, bukan GPS proyek"):
    currentProvince?currentProvince+" · "+label("province association","asosiasi provinsi"):label("record selected","catatan terpilih"));
  insight.append(node("p","map-insight-scope",scope));
  if(chosen.length>1){
   const picker=node("label","map-insight-picker");
   picker.append(node("span",null,label("Choose one of the records at this point","Pilih salah satu catatan pada titik ini")));
   const select=node("select","map-select");select.setAttribute("aria-label",label("Select source record","Pilih catatan bersumber"));
   const initial=node("option",null,label("Select a specific asset","Pilih aset tertentu"));initial.value="";select.append(initial);
   for(const r of chosen){const option=node("option",null,r.name+" · "+(r.operator||r.region||r.id));option.value=r.id;select.append(option)}
   select.value=selected?.id||"";
   select.addEventListener("change",()=>{selectedRecordId=select.value||null;draw()});
   picker.append(select);insight.append(picker);
   // The first record is immediately inspected; a user can switch records here.
  }
  if(!selected)return;
  const card=node("article","map-insight-detail");
  card.append(node("h4",null,selected.name));
  const tags=node("div","map-insight-tags");
  for(const item of [sectorLabel(selected.sectorKey),assetLabel(selected.assetType),phaseLabel(selected.phase)])tags.append(node("span","map-tag",item));
  card.append(tags);
  const provinces=provinceAssociations(selected);
  card.append(insightSection(label("01 · Identity & evidence","01 · Identitas & bukti"),
   label("Operator / sponsor: ","Operator / investor: ")+(selected.operator||label("Not published","Tidak tersedia"))+
   " · "+label("Source period: ","Periode sumber: ")+(selected.date||label("Not dated","Belum bertanggal"))));
  card.append(insightSection(label("02 · Geography & status","02 · Wilayah & status"),
   (selected.region||provinces.join(" + ")||label("Location undisclosed","Lokasi tidak diungkap"))+
   " · "+label("Reported status: ","Status yang dilaporkan: ")+(selected.stage||label("Unspecified","Tidak disebutkan"))));
  const loc=pointFor(selected);
  card.append(node("p","map-insight-precision",loc?label(
   "Approximate named-locality reference: ","Titik referensi wilayah perkiraan: ")+loc.label+
   " ("+loc.lat.toFixed(3)+"°, "+loc.lon.toFixed(3)+"°) · "+label("NOT facility GPS","BUKAN GPS fasilitas"):
   label("Province-only or undisclosed location; no precise project coordinates asserted.",
    "Lokasi hanya tingkat provinsi atau tidak diungkap; tidak mengklaim koordinat proyek yang presisi.")));
  const numbers=[];
  if(selected.capacity?.value!=null)numbers.push(label("Rated/reported capacity: ","Kapasitas yang dilaporkan: ")+fmt(selected.capacity.value)+" "+selected.capacity.unit+(selected.capacity.scope?" · "+selected.capacity.scope:""));
  if(selected.production?.value!=null)numbers.push(label("ACTUAL reported output: ","Output AKTUAL yang dilaporkan: ")+fmt(selected.production.value)+" "+selected.production.unit+" ("+selected.production.year+")");
  if(selected.amount?.amount!=null)numbers.push(label("Reported investment/amount: ","Investasi/nilai yang dilaporkan: ")+selected.amount.unit+" "+fmt(selected.amount.amount)+(selected.amount.basis?" · "+selected.amount.basis:""));
  if(selected.product)numbers.push(label("Product: ","Produk: ")+selected.product);
  if(selected.technology)numbers.push(label("Technology: ","Teknologi: ")+selected.technology);
  if(selected.ownership)numbers.push(label("Ownership: ","Kepemilikan: ")+selected.ownership);
  if(selected.investors)numbers.push(label("Investors: ","Investor: ")+selected.investors);
  if(selected.progress)numbers.push(label("Implementation milestone: ","Tahapan implementasi: ")+selected.progress);
  card.append(insightSection(label("03 · Available project metrics","03 · Angka & pelaksanaan"),numbers.length?numbers.join("\n"):
   label("No source-verified numerical capacity, investment or output for this record. Unknown is not zero.",
    "Belum ada angka kapasitas, investasi atau output terverifikasi dalam catatan ini. Tidak tersedia bukan berarti nol.")));
  if(selected.note)card.append(insightSection(label("Source context","Konteks sumber"),selected.note));
  card.append(insightSection(label("04 · Sector transmission · interpretive, not causal","04 · Implikasi sektoral · bukan bukti kausalitas"),describeMarket(selected)));
  card.append(insightSection(label("05 · Lesson learned & next verification","05 · Pelajaran & verifikasi berikutnya"),describeLesson(selected)));
  const foot=node("div","map-insight-sources");
  foot.append(srcLink(selected.source,label("Read original record source","Baca sumber asli")));
  if(loc?.source)foot.append(srcLink(loc.source,label("Locality reference · approximate","Sumber titik wilayah · perkiraan")));
  card.append(foot);
  if(chosen.length>1){
   const nav=node("div","map-insight-nav");
   const i=chosen.findIndex(r=>r.id===selected.id);
   for(const [direction,caption] of [[-1,label("◀ Previous record","◀ Catatan sebelumnya")],[1,label("Next record ▶","Catatan berikutnya ▶")]]){
    const button=node("button","map-btn",caption);button.type="button";button.disabled=i+direction<0||i+direction>=chosen.length;
    button.addEventListener("click",()=>{selectedRecordId=chosen[i+direction].id;draw()});
    nav.append(button);
   }
   card.append(nav);
  }
  insight.append(card);
 }

 function kepriCluster(r){
  if(!provinceAssociations(r).includes("Kepulauan Riau"))return null;
  const raw=String(r.region||"")+" "+String(r.name||"");
  if(/\bnatuna\b/i.test(raw))return "natuna";
  if(/\bbatam\b|\bnongsa\b|\bkabil\b/i.test(raw))return "batam";
  return "province-only";
 }
 function focusProvince(name){currentProvince=currentProvince===name?null:name;currentKepriCluster=null;currentPoint=null;selectedRecordId=null;provinceSelect.value=currentProvince||"all";draw()}
 function focusKepriCluster(cluster){
  currentProvince="Kepulauan Riau";currentKepriCluster=cluster;currentPoint=null;selectedRecordId=null;provinceSelect.value=currentProvince;draw();
 }
 function draw(){
  const base=filtered(),mapped=base.filter(r=>provinceAssociations(r).length>0),unmapped=base.length-mapped.length;
  const counts=new Map();for(const x of mapped)for(const p of provinceAssociations(x))counts.set(p,(counts.get(p)||0)+1);
  shapeLayer.replaceChildren();adminLayer.replaceChildren();bubbleLayer.replaceChildren();pinLayer.replaceChildren();
  for(const feature of geometry){
   const name=feature.properties.name,count=counts.get(name)||0;
   const p=snode("path",{d:projectPath(feature),class:"map-province"+(currentProvince===name?" active":""),fill:currentProvince===name?"#cb9f58":count?(count>=5?"#648fad":count>=3?"#4d7798":"#345773"):"#152f44",tabindex:"0",role:"button","aria-label":name+" — "+count+" "+label("records","catatan")});
   const title=snode("title");title.textContent=name+" · "+count+" "+label("mapped records","catatan terpetakan");p.append(title);
   p.addEventListener("click",()=>{if(!dragged){focusProvince(name);if(window.matchMedia?.("(max-width:1070px)")?.matches)side.scrollIntoView?.({behavior:"smooth",block:"start"})}});
   p.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();focusProvince(name)}});
   shapeLayer.append(p);
   if(count&&name==="Kepulauan Riau"){
    // Count documented Batam and offshore Natuna separately. The provincial total
    // remains on the province outline/selection (and includes province-only records).
    for(const [cluster,ref] of Object.entries(KEPRI_REFERENCES)){
     const number=mapped.filter(r=>kepriCluster(r)===cluster).length;
     if(!number)continue;
     const [x,y]=boundsOf(ref.coordinates);
     const marker=snode("g",{class:"map-site-cluster",role:"button",tabindex:"0",
      "aria-label":ref.name+" — "+number+" "+label("documented local records; approximate city/island anchor","catatan lokal bersumber; titik kota/gugus pulau perkiraan")});
     const circle=snode("circle",{cx:x,cy:y,r:number>=10?15:12,class:"map-bubble map-site-bubble"+(currentKepriCluster===cluster?" chosen":"")});
     const tip=snode("title");tip.textContent=ref.name+" · "+number+" "+label("named locations (not facility GPS). Click for records.","lokasi bernama (bukan GPS fasilitas). Klik untuk daftar.");
     circle.append(tip);
     const numberLabel=snode("text",{x,y,class:"map-bubble-text"});numberLabel.textContent=number;
     const placeName=snode("text",{x,y:y+26,class:"map-site-label"});placeName.textContent=ref.name.toUpperCase();
     marker.append(circle,numberLabel,placeName);
     marker.addEventListener("click",()=>{if(!dragged){focusKepriCluster(cluster);if(window.matchMedia?.("(max-width:1070px)")?.matches)side.scrollIntoView?.({behavior:"smooth",block:"start"})}});
     marker.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();focusKepriCluster(cluster)}});
     bubbleLayer.append(marker);
    }
   }
  }
  // Province-only dossiers receive a visually distinct administrative-reference
  // SQUARE at the polygon reference position. It is NOT a project geocode.
  // Kepri is positioned near Tanjung Pinang rather than the Natuna polygon centroid.
  for(const feature of geometry){
   const name=feature.properties.name;
   const refs=base.filter(r=>accuracyOf(r)==="province"&&provinceAssociations(r).includes(name));
   if(!refs.length)continue;
   const [x,y]=name==="Kepulauan Riau"?boundsOf([104.455,0.922]):polygonAnchor(feature);
   const marker=snode("g",{class:"map-admin-reference",role:"button",tabindex:"0",
    "aria-label":name+" — "+refs.length+" "+label("province-only references, NOT project locations","referensi provinsi saja, BUKAN lokasi proyek")});
   const box=snode("rect",{x:x-5,y:y-5,width:10,height:10,rx:2,class:"map-admin-square"});
   const title=snode("title");title.textContent=name+" · "+refs.length+" "+label("records only known at province scale","catatan hanya diketahui sampai provinsi");
   marker.append(box,title);
   function selectProvinceReference(){
    currentPoint=null;selectedRecordId=null;currentProvince=name;currentKepriCluster=null;provinceSelect.value=name;
    currentAccuracy="province";
    for(const button of geoButtons)button.setAttribute("aria-pressed",String(button.dataset.accuracy==="province"));
    draw();
   }
   marker.addEventListener("click",()=>{if(!dragged)selectProvinceReference()});
   marker.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectProvinceReference()}});
   adminLayer.append(marker);
  }
  // Named-locality coordinate references, grouped by close screen distance.
  // No random marker jitter and no invented GPS for province-only dossiers.
  const groups=new Map();
  for(const r of base){
   const a=pointFor(r);
   if(!a)continue;
   const key=a.id;
   if(!groups.has(key))groups.set(key,{...a,records:[]});
   groups.get(key).records.push(r);
  }
  const clusters=[];
  const threshold=16*viewport.w/W;
  for(const g of [...groups.values()].sort((a,b)=>a.lat-b.lat)){
   const [gx,gy]=boundsOf([g.lon,g.lat]);
   const nearby=clusters.find(c=>c.province===g.id.split("|")[1]&&Math.hypot(c.x-gx,c.y-gy)<=threshold);
   if(nearby){nearby.records.push(...g.records);nearby.names.add(g.label)}
   else clusters.push({x:gx,y:gy,province:g.id.split("|")[1],records:[...g.records],names:new Set([g.label])});
  }
  for(const c of clusters){
   const idSet=[...new Set(c.records.map(r=>r.id))];
   const count=idSet.length;
   const geoKey=idSet.sort().join("|");
   const x=c.x,y=c.y;
   const pin=snode("g",{class:"map-geopoint",role:"button",tabindex:"0",
    "aria-label":[...c.names].join(", ")+" — "+count+" "+label("locality coordinate references (not exact project GPS)","referensi koordinat wilayah (bukan GPS proyek)")});
   const dot=snode("circle",{cx:x,cy:y,r:count>8?11:count>2?9:6,class:"map-geopoint-dot"+(currentPoint===geoKey?" active":"")});
   const tooltip=snode("title");tooltip.textContent=[...c.names].join(", ")+" · "+count+" "+label("source records · approximate locality, click to inspect","catatan bersumber · perkiraan wilayah, klik untuk periksa");
   pin.append(dot,tooltip);
   if(count>1){const num=snode("text",{x,y,class:"map-geopoint-label"});num.textContent=count;pin.append(num)}
   function selectCluster(){
    if(dragged)return;
    currentPoint=currentPoint===geoKey?null:geoKey;currentProvince=null;currentKepriCluster=null;
    selectedRecordId=currentPoint&&count===1?c.records[0].id:null;
    provinceSelect.value="all";draw();
    side.scrollTop=0;
   }
   pin.addEventListener("click",()=>{selectCluster();if(window.matchMedia?.("(max-width:1070px)")?.matches)side.scrollIntoView?.({behavior:"smooth",block:"start"})});
   pin.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectCluster()}});
   pinLayer.append(pin);
  }
  const chosen=base.filter(x=>(!currentProvince||provinceAssociations(x).includes(currentProvince))&&(!currentKepriCluster||currentProvince!=="Kepulauan Riau"||kepriCluster(x)===currentKepriCluster)&&(!currentPoint||currentPoint.split("|").includes(x.id)))
   .sort((a,b)=>SECTORS.findIndex(s=>s[0]===a.sectorKey)-SECTORS.findIndex(s=>s[0]===b.sectorKey)||a.assetType.localeCompare(b.assetType)||a.name.localeCompare(b.name));
  const display=chosen; // Do not silently hide entries behind a 20-item list cap.
  const scopeName=currentKind==="all"?label("all saved source records","seluruh catatan bersumber"):currentKind==="assets"?label("operator assets","aset operator"):currentKind==="projects"?label("investment projects","proyek investasi"):currentKind==="sites"?label("mine and industrial sites","tambang dan fasilitas industri"):currentKind==="wk"?label("WK / upstream oil and gas","WK / hulu migas"):currentKind==="power"?label("fossil and renewable power plants","pembangkit fosil dan EBT"):currentKind==="industry"?label("biodiesel and smelter plants","pabrik biodiesel dan smelter"):currentKind==="smelters"?label("smelter facility / project tracker","pelacak fasilitas / proyek smelter"):currentKind==="regional"?label("regional cross-checks","pemeriksaan sumber regional"):currentKind==="digital"?label("Digital / AI (all registries)","Digital / AI (seluruh registri)"):label("refineries","kilang");
  heading.textContent=currentPoint?label("Selected coordinate cluster","Klaster koordinat terpilih"):currentProvince?(currentProvince+(currentKepriCluster?" · "+KEPRI_REFERENCES[currentKepriCluster].name:"")):label("Mapped evidence","Bukti terpetakan");
  place.textContent=currentPoint?label("Selected location cluster · view project insight on the right","Klaster lokasi terpilih · lihat analisis proyek di kanan"):
   currentProvince?currentProvince+" · "+label("Province evidence selected","Bukti provinsi terpilih"):
   label("38 provinces · administrative boundaries","38 provinsi · batas administratif");
  const localityCount=base.filter(r=>accuracyOf(r)==="locality").length;
  const provinceCount=base.filter(r=>accuracyOf(r)==="province").length;
  geoCount.textContent=localityCount+" "+label("locality-referenced","titik wilayah")+" · "+provinceCount+" "+label("province-only","hanya provinsi")+" · "+(base.length-localityCount-provinceCount)+" "+label("unlocated","tanpa lokasi");
  info.textContent=(currentProvince?currentProvince+" · "+display.length+" "+label("records in province / ","catatan di provinsi / "):label("Registry: ","Registri: ")+scopeName+" · "+display.length+" "+label("shown in list / ","ditampilkan / "))+base.length+" "+label("nationally matched · ","cocok secara nasional · ")+mapped.length+" "+label("province-mapped · ","terpetakan · ")+unmapped+" "+label("unlocated","tanpa lokasi");
  if(!chosen.length&&expanded){
   expanded=false;side.className="map-results";expand.textContent=label("Browse matching assets","Lihat daftar aset terkait");expand.setAttribute("aria-expanded","false");
  }
  expand.disabled=!chosen.length;
  renderAssetInsight(chosen);
  const selectionKey=[currentProvince||"",currentKepriCluster||"",currentPoint||"",selectedRecordId||"",currentSector,currentType,currentStage,currentKind,lastQuery].join("|");
  if(selectionKey!==lastInspectorSelection){insight.scrollTop=0;lastInspectorSelection=selectionKey}
  const oldScroll=list.scrollTop;
  list.replaceChildren();
  if(!chosen.length)list.append(node("p","map-muted",label("No records match these filters or this province. Choose another province or reset filters.","Tidak ada catatan sesuai filter atau provinsi ini. Pilih provinsi lain atau reset filter.")));
  let lastGroup="",lastType="";
  for(const r of display){
   if(r.sectorKey!==lastGroup){
    list.append(node("div","map-group-label",sectorLabel(r.sectorKey)));
    lastGroup=r.sectorKey;lastType="";
   }
   if(r.assetType!==lastType){
    list.append(node("div","map-type-label",assetLabel(r.assetType)));
    lastType=r.assetType;
   }
   const card=node("article","map-list-item");
   card.tabIndex=0;
   card.setAttribute("role","button");
   card.setAttribute("aria-label",label("Open asset insight: ","Buka analisis aset: ")+r.name);
   card.setAttribute("aria-pressed",String(selectedRecordId===r.id));
   const inspect=()=>{selectedRecordId=r.id;list.scrollTop=0;draw();side.scrollTop=0;};
   card.addEventListener("click",e=>{if(e.target?.closest?.("a,button,select"))return;inspect()});
   card.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();inspect()}});

   const layerName=assetLabel(r.assetType);
   const dateName=r.kind==="assets"?label("dataset reviewed","dataset ditinjau"):r.kind==="refineries"?label("facility verified","fasilitas diverifikasi"):r.kind==="sites"?label("dated corporate evidence","bukti korporasi bertanggal"):["wk","power","industry","regional","digital","pltu"].includes(r.kind)?label("source record","rekam sumber"):label("evidence date","tanggal bukti");
   const provinces=provinceAssociations(r);
   card.append(node("small",null,layerName+" · "+(provinces.length?provinces.join(" + ")+(provinces.length>1?" · MULTI-PROVINCE":""):label("UNLOCATED / MULTI-SITE","TANPA LOKASI / MULTILOKASI"))+" · "+dateName+": "+(r.date||label("not specified","tidak tersedia"))));
   card.append(node("h4",null,r.name));
   const tags=node("div");for(const txt of [sectorLabel(r.sectorKey),assetLabel(r.assetType),phaseLabel(r.phase)])tags.append(node("span","map-tag",txt));card.append(tags);
   card.append(node("p","map-muted",label("Original evidence status: ","Status detail dari sumber: ")+(r.stage||label("Unspecified","Tidak tersedia"))));
   card.append(node("p",null,label("Operator / sponsor: ","Operator / investor: ")+(r.operator||label("Not identified","Tidak disebutkan"))));
   if(r.amount?.amount!=null)card.append(node("p",null,label("Reported amount: ","Nilai dilaporkan: ")+r.amount.unit+" "+fmt(r.amount.amount)+" · "+(r.amount.basis||label("basis not stated","basis tidak tercatat"))));
   if(r.region)card.append(node("p","map-muted",label("Source geography: ","Geografi bersumber: ")+r.region));
   const loc=pointFor(r);
   if(loc)card.append(node("p","map-coordinate-pill",label("Approximate locality, NOT project GPS: ","Perkiraan wilayah, BUKAN GPS proyek: ")+loc.label+" · "+loc.lat.toFixed(3)+"°, "+loc.lon.toFixed(3)+"°"));
   else card.append(node("p","map-muted",provinceAssociations(r).length?label("Province-level only · facility coordinates not verified","Hanya tingkat provinsi · koordinat fasilitas belum diverifikasi"):label("Undisclosed / cross-province · no site location invented","Dirahasiakan / lintas provinsi · tidak dibuatkan titik palsu")));
   if(r.locationScope)card.append(node("p","map-limited",label("Mapping: ","Pemetaan: ")+r.locationScope+" · "+label("province association only, not site coordinates","asosiasi provinsi, bukan koordinat fasilitas")));
   if(r.vintage)card.append(node("p","map-muted",label("Source vintage (not operating confirmation): ","Tahun sumber (bukan konfirmasi operasi): ")+r.vintage));
   if(r.capacity?.value!=null)card.append(node("p","map-muted",(r.kind==="digital"?label("Operator-published IT capacity: ","Kapasitas TI menurut operator: "):r.kind==="smelters"?label("CAPACITY (see source basis, not actual output): ","KAPASITAS (lihat basis, bukan produksi aktual): "):label("Source-reported plant rating: ","Rating pembangkit dari sumber: "))+fmt(r.capacity.value)+" "+r.capacity.unit+" · "+r.capacity.scope));
   if(r.kind==="smelters"){
    if(r.ownership)card.append(node("p",null,label("Ownership / equity: ","Pemilik / saham: ")+r.ownership));
    if(r.investors)card.append(node("p",null,label("Investors / partners: ","Investor / mitra: ")+r.investors));
    if(r.technology)card.append(node("p","map-muted",label("Technology: ","Teknologi: ")+r.technology));
    if(r.product)card.append(node("p","map-muted",label("Products: ","Produk: ")+r.product));
    if(r.production?.value!=null)card.append(node("p","map-smelter-production",label("ACTUAL reported output: ","Output AKTUAL dilaporkan: ")+fmt(r.production.value)+" "+r.production.unit+" ("+r.production.year+")"));
    if(r.progress)card.append(node("p","map-muted",label("Implementation milestone: ","Tahap implementasi: ")+r.progress));
    if(!r.capacity&&!r.ownership)card.append(node("p","map-smelter-gap",label("Capacity and ownership not source-verified for this facility. Do not assume zero.","Kapasitas dan kepemilikan belum terverifikasi untuk fasilitas ini. Jangan dianggap nol.")));
   }
   if(["wk","power","industry","regional","digital","pltu","smelters"].includes(r.kind)&&r.note)card.append(node("p","map-muted",r.note));
   if(r.kind==="sites")card.append(node("p","map-muted",r.note||label("An attributed geographic site; not incremental new investment.","Catatan lokasi bersumber; bukan investasi baru tambahan.")));
   card.append(srcLink(r.source,label("Original evidence","Bukti asli")));
   list.append(card);
  }
  list.append(node("p","map-muted",label("All matching records shown: ","Semua catatan yang cocok ditampilkan: ")+chosen.length+" · "+label("scroll this list or filter to browse","gulir daftar atau gunakan filter untuk menjelajah")));
  list.scrollTop=oldScroll;
  countsText.textContent=label("For this selection: ","Untuk pilihan ini: ")+base.length+label(" records, "," catatan, ")+mapped.length+label(" mapped, "," terpetakan, ")+unmapped+label(" unlocated. The map does not quantify realized investment value."," tanpa lokasi. Peta tidak menghitung total realisasi investasi.");
 }
 kind.addEventListener("change",()=>{selectedRecordId=null;currentPoint=null;currentKind=kind.value;currentSector="all";currentType="all";currentStage="all";currentProvince=null;currentKepriCluster=null;provinceSelect.value="all";filtersRebuild();draw()});
 provinceSelect.addEventListener("change",()=>{selectedRecordId=null;currentPoint=null;currentProvince=provinceSelect.value==="all"?null:provinceSelect.value;currentKepriCluster=null;draw()});
 location.addEventListener("change",()=>{selectedRecordId=null;currentPoint=null;currentLocation=location.value;currentProvince=null;currentKepriCluster=null;provinceSelect.value="all";draw()});
 group.addEventListener("change",()=>{selectedRecordId=null;currentPoint=null;currentSector=group.value;currentType="all";currentStage="all";filtersRebuild();draw()});
 assetType.addEventListener("change",()=>{selectedRecordId=null;currentPoint=null;currentType=assetType.value;currentStage="all";filtersRebuild();draw()});
 stage.addEventListener("change",()=>{selectedRecordId=null;currentPoint=null;currentStage=stage.value;draw()});
 search.addEventListener("input",()=>{selectedRecordId=null;currentPoint=null;lastQuery=search.value.toLowerCase().trim();draw()});
 reset.addEventListener("click",()=>{selectedRecordId=null;currentPoint=null;currentType="all";currentAccuracy="all";for(const b of geoButtons)b.setAttribute("aria-pressed",String(b.dataset.accuracy==="all"));kind.value="all";currentKind="all";location.value="all";currentLocation="all";provinceSelect.value="all";currentProvince=null;currentKepriCluster=null;currentSector="all";currentStage="all";search.value="";lastQuery="";filtersRebuild();setView({x:0,y:0,w:W,h:H});draw()});
 filtersRebuild();draw();
}
window.SLIProvinceFor=provinceFor;
window.initSLIStrategicMap=async function(){
 const root=document.getElementById("sliMapRoot");if(!root||APP.active===root)return;
 APP.active=root;root.replaceChildren(node("p","map-muted",label("Loading provinces and source-attributed investment records…","Memuat provinsi dan catatan investasi bersumber…")));
 try{
  const settled=await Promise.allSettled([read("data/indonesia-provinces.geojson"),read("data/investment-operator-assets.json"),read("data/investment-evidence.json"),read("data/energy-infrastructure-security.json"),read("data/strategic-map-sector-dossiers.json"),read("data/strategic-map-upstream-wk.json"),read("data/strategic-map-power-fossil-renewable.json"),read("data/strategic-map-biofuel-smelters.json"),read("data/strategic-map-regional-crosschecks.json"),read("data/strategic-map-digital-ai.json"),read("data/strategic-map-pltu-pln-2025.json"),read("data/strategic-map-locality-anchors.json"),read("data/strategic-map-glossary.json"),read("data/strategic-map-smelter-2026.json")]);
  if(root!==document.getElementById("sliMapRoot"))return;
  if(settled.some(x=>x.status!=="fulfilled"))throw Error("Required basemap/registry unavailable");
  const [geo,assets,projects,infra,sectorSites,upstream,power,industry,regional,digital,pltuAudit,localityAnchors,glossary,smelters]=settled.map(x=>x.value);
  APP.data={geo,assets,projects,infra,sectorSites,upstream,power,industry,regional,digital,pltuAudit,localityAnchors,glossary,smelters};mapPage(root,APP.data);
 }catch(e){root.replaceChildren(node("p","map-alert",label("Geographic registry unavailable; no inferred project positions are displayed.","Registri geografis tidak tersedia; lokasi proyek tidak direka.")));console.error("[SLI map]",e)}
};
document.addEventListener("sli:languagechange",()=>{const root=document.getElementById("sliMapRoot");if(!root||!APP.data)return;mapPage(root,APP.data)});
})();
