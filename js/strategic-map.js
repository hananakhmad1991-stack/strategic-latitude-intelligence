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
 }else if(r.kind==="industry"&&/smelter|processing/.test(rawGroup)||r.kind==="sites"&&rawGroup==="processing"||/smelters|critical minerals|^minerals$/.test(rawSector)||/smelter|metal refin|ferronickel|alumina/.test(name)){
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
 r.phase=/historical|revalidat|current status unknown|status unverified|earlier roster|historic/.test(status)?"Historical / Verify":
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
 const allWk=records("wk",data),allPltu=records("pltu",data),allPower=[...records("power",data),...allPltu],allIndustry=records("industry",data),allRegional=records("regional",data),allDigital=records("digital",data);
 const allRows=[...allAssets,...allProjects,...allRefineries,...allSites,...allWk,...allPower,...allIndustry,...allRegional,...allDigital];
 allRows.forEach(classifyRecord);
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
  [label("Regional source cross-checks","Pemeriksaan sumber regional"),allRegional.length],
  [label("Jakarta / West Java digital facilities","Fasilitas digital Jakarta / Jawa Barat"),allDigital.length],
  [label("Province boundaries","Batas provinsi"),geometry.length]
 ];
 for(const [name,val] of [
  [label("Sourced catalogue records","Catatan katalog bersumber"),allRows.length],
  [label("Indonesian provinces","Provinsi Indonesia"),geometry.length],
  [label("Sector families","Kelompok sektor"),SECTORS.filter(x=>allRows.some(r=>r.sectorKey===x[0])).length],
  [label("Distinct source layers","Lapisan data sumber"),9]
 ]){
  const c=node("div","map-stat");c.append(node("span",null,name),node("strong",null,val));counters.append(c);
 }
 head.append(counters);root.append(head);
 const introduction=node("p","map-taxonomy-intro",label(
  "HOW TO USE · First choose the industry sector; then the asset or technology (for example Oil & Gas → Oil Refinery, or Minerals & Metals → Smelter & Metal Refining). The original company/source register is available only under Advanced.",
  "CARA MEMBACA · Pilih sektor industri, kemudian jenis aset atau teknologi (misalnya Migas → Kilang Minyak, atau Mineral & Logam → Smelter & Pemurnian Logam). Registri sumber asli tersedia di menu Lanjutan."
 ));root.append(introduction);
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
 const outside=node("details","map-footer"),summary=node("summary",null,label("APPENDIX · All terms, abbreviations, units, classification and methodology","LAMPIRAN · Istilah, singkatan, satuan, klasifikasi dan metodologi"));
 const appendix=node("div");
 const guide=data.glossary;
 if(guide?.sections?.length){
  const glossaryHead=node("section","map-glossary-head");
  glossaryHead.append(node("h3",null,label("Glossary of every map term","Glosarium istilah peta")));
  glossaryHead.append(node("p","map-muted",label(guide.intro_en||"Terminology follows underlying sources.",guide.intro_id||"Istilah mengikuti dokumen sumber.")));
  const count=guide.sections.reduce((n,x)=>n+(x.items?.length||0),0);
  glossaryHead.append(node("p","map-glossary-count",count+" "+label("bilingual definitions in ","definisi dwibahasa dalam ")+guide.sections.length+" "+label("topics","kelompok")));
  appendix.append(glossaryHead);
  if(Array.isArray(guide.categories)&&guide.categories.length){
   const details=node("details","map-glossary-section map-glossary-category");
   details.append(node("summary",null,label("Asset-type dictionary · "+guide.categories.length+" definitions","Kamus jenis aset · "+guide.categories.length+" definisi")));
   details.append(node("p","map-muted",label(guide.categories_intro_en,guide.categories_intro_id)));
   const terms=node("dl","map-terms");
   for(const x of guide.categories)terms.append(node("dt",null,assetLabel(x.term)),node("dd",null,label(x.definition_en,x.definition_id)));
   details.append(terms);appendix.append(details);
  }
  if(Array.isArray(guide.source_layers)&&guide.source_layers.length){
   const details=node("details","map-glossary-section map-glossary-source");
   details.append(node("summary",null,label("Source-registry labels · "+guide.source_layers.length+" definitions","Istilah registri sumber · "+guide.source_layers.length+" definisi")));
   const terms=node("dl","map-terms");
   for(const x of guide.source_layers)terms.append(node("dt",null,x.term),node("dd",null,label(x.definition_en,x.definition_id)));
   details.append(terms);appendix.append(details);
  }
  for(const group of guide.sections){
   const det=node("details","map-glossary-section"),summary=node("summary",null,label(group.title_en,group.title_id));
   det.append(summary);
   const terms=node("dl","map-terms");
   for(const item of group.items||[]){
    terms.append(node("dt",null,item.term),node("dd",null,label(item.definition_en,item.definition_id)));
   }
   det.append(terms);appendix.append(det);
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
 function active(){return currentKind==="all"?allRows:currentKind==="digital"?digitalRows:currentKind==="assets"?allAssets:currentKind==="projects"?allProjects:currentKind==="sites"?allSites:currentKind==="wk"?allWk:currentKind==="power"?allPower:currentKind==="industry"?allIndustry:currentKind==="regional"?allRegional:allRefineries}
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
 function kepriCluster(r){
  if(!provinceAssociations(r).includes("Kepulauan Riau"))return null;
  const raw=String(r.region||"")+" "+String(r.name||"");
  if(/\bnatuna\b/i.test(raw))return "natuna";
  if(/\bbatam\b|\bnongsa\b|\bkabil\b/i.test(raw))return "batam";
  return "province-only";
 }
 function focusProvince(name){currentProvince=currentProvince===name?null:name;currentKepriCluster=null;currentPoint=null;provinceSelect.value=currentProvince||"all";draw()}
 function focusKepriCluster(cluster){
  currentProvince="Kepulauan Riau";currentKepriCluster=cluster;currentPoint=null;provinceSelect.value=currentProvince;draw();
 }
 function draw(){
  const base=filtered(),mapped=base.filter(r=>provinceAssociations(r).length>0),unmapped=base.length-mapped.length;
  const counts=new Map();for(const x of mapped)for(const p of provinceAssociations(x))counts.set(p,(counts.get(p)||0)+1);
  shapeLayer.replaceChildren();adminLayer.replaceChildren();bubbleLayer.replaceChildren();pinLayer.replaceChildren();
  for(const feature of geometry){
   const name=feature.properties.name,count=counts.get(name)||0;
   const p=snode("path",{d:projectPath(feature),class:"map-province"+(currentProvince===name?" active":""),fill:currentProvince===name?"#cb9f58":count?(count>=5?"#648fad":count>=3?"#4d7798":"#345773"):"#152f44",tabindex:"0",role:"button","aria-label":name+" — "+count+" "+label("records","catatan")});
   const title=snode("title");title.textContent=name+" · "+count+" "+label("mapped records","catatan terpetakan");p.append(title);
   p.addEventListener("click",()=>{if(!dragged)focusProvince(name)});
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
     marker.addEventListener("click",()=>{if(!dragged)focusKepriCluster(cluster)});
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
    currentPoint=null;currentProvince=name;currentKepriCluster=null;provinceSelect.value=name;
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
   pin.addEventListener("click",()=>{if(dragged)return;currentPoint=currentPoint===geoKey?null:geoKey;currentProvince=null;currentKepriCluster=null;provinceSelect.value="all";draw()});
   pin.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();currentPoint=currentPoint===geoKey?null:geoKey;currentProvince=null;currentKepriCluster=null;provinceSelect.value="all";draw()}});
   pinLayer.append(pin);
  }
  const chosen=base.filter(x=>(!currentProvince||provinceAssociations(x).includes(currentProvince))&&(!currentKepriCluster||currentProvince!=="Kepulauan Riau"||kepriCluster(x)===currentKepriCluster)&&(!currentPoint||currentPoint.split("|").includes(x.id)))
   .sort((a,b)=>SECTORS.findIndex(s=>s[0]===a.sectorKey)-SECTORS.findIndex(s=>s[0]===b.sectorKey)||a.assetType.localeCompare(b.assetType)||a.name.localeCompare(b.name));
  const display=chosen; // Do not silently hide entries behind a 20-item list cap.
  const scopeName=currentKind==="all"?label("all saved source records","seluruh catatan bersumber"):currentKind==="assets"?label("operator assets","aset operator"):currentKind==="projects"?label("investment projects","proyek investasi"):currentKind==="sites"?label("mine and industrial sites","tambang dan fasilitas industri"):currentKind==="wk"?label("WK / upstream oil and gas","WK / hulu migas"):currentKind==="power"?label("fossil and renewable power plants","pembangkit fosil dan EBT"):currentKind==="industry"?label("biodiesel and smelter plants","pabrik biodiesel dan smelter"):currentKind==="regional"?label("regional cross-checks","pemeriksaan sumber regional"):currentKind==="digital"?label("Digital / AI (all registries)","Digital / AI (seluruh registri)"):label("refineries","kilang");
  heading.textContent=currentPoint?label("Selected coordinate cluster","Klaster koordinat terpilih"):currentProvince?(currentProvince+(currentKepriCluster?" · "+KEPRI_REFERENCES[currentKepriCluster].name:"")):label("Mapped evidence","Bukti terpetakan");
  const localityCount=base.filter(r=>accuracyOf(r)==="locality").length;
  const provinceCount=base.filter(r=>accuracyOf(r)==="province").length;
  geoCount.textContent=localityCount+" "+label("locality-referenced","titik wilayah")+" · "+provinceCount+" "+label("province-only","hanya provinsi")+" · "+(base.length-localityCount-provinceCount)+" "+label("unlocated","tanpa lokasi");
  info.textContent=label("Registry: ","Registri: ")+scopeName+" · "+display.length+" "+label("shown in list / ","ditampilkan / ")+base.length+" "+label("matching records · ","catatan cocok · ")+mapped.length+" "+label("province-mapped · ","terpetakan · ")+unmapped+" "+label("unlocated","tanpa lokasi");
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
   const layerName=r.kind==="projects"?label("Investment project","Proyek investasi"):r.kind==="refineries"?label("Refinery","Kilang"):r.kind==="sites"?label("Source-documented site (possibly overlapping)","Fasilitas bersumber (mungkin tumpang tindih)"):r.kind==="wk"?label("Upstream WK / field reference","Referensi WK / lapangan hulu"):r.kind==="power"?label("Power station / development record","Pembangkit / catatan pengembangan"):r.kind==="industry"?label("Industrial facility / supply point","Fasilitas industri / titik pasokan"):r.kind==="regional"?label("Verified regional project / PSC","Proyek / PSC sumber regional"):r.kind==="digital"?label("Physical Digital / AI data-center dossier","Dossier fasilitas fisik Digital / AI"):r.kind==="pltu"?label("PLN/ESDM-checked coal power dossier","Dossier PLTU pembanding PLN/ESDM"):label("Asset / operator","Aset / operator");
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
   if(r.capacity?.value!=null)card.append(node("p","map-muted",(r.kind==="digital"?label("Operator-published IT capacity: ","Kapasitas TI menurut operator: "):label("Source-reported plant rating: ","Rating pembangkit dari sumber: "))+fmt(r.capacity.value)+" "+r.capacity.unit+" · "+r.capacity.scope));
   if(["wk","power","industry","regional","digital","pltu"].includes(r.kind))card.append(node("p","map-muted",r.note));
   if(r.kind==="sites")card.append(node("p","map-muted",r.note||label("An attributed geographic site; not incremental new investment.","Catatan lokasi bersumber; bukan investasi baru tambahan.")));
   card.append(srcLink(r.source,label("Original evidence","Bukti asli")));
   list.append(card);
  }
  list.append(node("p","map-muted",label("All matching records shown: ","Semua catatan yang cocok ditampilkan: ")+chosen.length+" · "+label("scroll this list or filter to browse","gulir daftar atau gunakan filter untuk menjelajah")));
  countsText.textContent=label("For this selection: ","Untuk pilihan ini: ")+base.length+label(" records, "," catatan, ")+mapped.length+label(" mapped, "," terpetakan, ")+unmapped+label(" unlocated. The map does not quantify realized investment value."," tanpa lokasi. Peta tidak menghitung total realisasi investasi.");
 }
 kind.addEventListener("change",()=>{currentPoint=null;currentKind=kind.value;currentSector="all";currentType="all";currentStage="all";currentProvince=null;currentKepriCluster=null;provinceSelect.value="all";filtersRebuild();draw()});
 provinceSelect.addEventListener("change",()=>{currentPoint=null;currentProvince=provinceSelect.value==="all"?null:provinceSelect.value;currentKepriCluster=null;draw()});
 location.addEventListener("change",()=>{currentPoint=null;currentLocation=location.value;currentProvince=null;currentKepriCluster=null;provinceSelect.value="all";draw()});
 group.addEventListener("change",()=>{currentPoint=null;currentSector=group.value;currentType="all";currentStage="all";filtersRebuild();draw()});
 assetType.addEventListener("change",()=>{currentPoint=null;currentType=assetType.value;currentStage="all";filtersRebuild();draw()});
 stage.addEventListener("change",()=>{currentPoint=null;currentStage=stage.value;draw()});
 search.addEventListener("input",()=>{currentPoint=null;lastQuery=search.value.toLowerCase().trim();draw()});
 reset.addEventListener("click",()=>{currentPoint=null;currentType="all";currentAccuracy="all";for(const b of geoButtons)b.setAttribute("aria-pressed",String(b.dataset.accuracy==="all"));kind.value="all";currentKind="all";location.value="all";currentLocation="all";provinceSelect.value="all";currentProvince=null;currentKepriCluster=null;currentSector="all";currentStage="all";search.value="";lastQuery="";filtersRebuild();setView({x:0,y:0,w:W,h:H});draw()});
 filtersRebuild();draw();
}
window.SLIProvinceFor=provinceFor;
window.initSLIStrategicMap=async function(){
 const root=document.getElementById("sliMapRoot");if(!root||APP.active===root)return;
 APP.active=root;root.replaceChildren(node("p","map-muted",label("Loading provinces and source-attributed investment records…","Memuat provinsi dan catatan investasi bersumber…")));
 try{
  const settled=await Promise.allSettled([read("data/indonesia-provinces.geojson"),read("data/investment-operator-assets.json"),read("data/investment-evidence.json"),read("data/energy-infrastructure-security.json"),read("data/strategic-map-sector-dossiers.json"),read("data/strategic-map-upstream-wk.json"),read("data/strategic-map-power-fossil-renewable.json"),read("data/strategic-map-biofuel-smelters.json"),read("data/strategic-map-regional-crosschecks.json"),read("data/strategic-map-digital-ai.json"),read("data/strategic-map-pltu-pln-2025.json"),read("data/strategic-map-locality-anchors.json"),read("data/strategic-map-glossary.json")]);
  if(root!==document.getElementById("sliMapRoot"))return;
  if(settled.some(x=>x.status!=="fulfilled"))throw Error("Required basemap/registry unavailable");
  const [geo,assets,projects,infra,sectorSites,upstream,power,industry,regional,digital,pltuAudit,localityAnchors,glossary]=settled.map(x=>x.value);
  APP.data={geo,assets,projects,infra,sectorSites,upstream,power,industry,regional,digital,pltuAudit,localityAnchors,glossary};mapPage(root,APP.data);
 }catch(e){root.replaceChildren(node("p","map-alert",label("Geographic registry unavailable; no inferred project positions are displayed.","Registri geografis tidak tersedia; lokasi proyek tidak direka.")));console.error("[SLI map]",e)}
};
document.addEventListener("sli:languagechange",()=>{const root=document.getElementById("sliMapRoot");if(!root||!APP.data)return;mapPage(root,APP.data)});
})();
