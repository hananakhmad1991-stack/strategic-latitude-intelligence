/* KKP source atlas: quantitative 2024 provincial snapshots + screened source leads.
 * Source rows are citation-linked, not real-time. Never generate numbers from blank cells.
 */
const directory=new URL("../data/sli-kkp-screened-source-register.json",import.meta.url);
const observations=new URL("../data/sli-kkp-portal-screened-2024.json",import.meta.url);
const SOURCE=/^https:\/\/portaldata\.kkp\.go\.id\//i;
const $=id=>document.getElementById(id);
const en=()=>document.documentElement.lang?.startsWith("en");
const T=(id,english)=>en()?english:id;
const E=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
export function validateScreenedPortal(data,catalog){
 const issues=[];
 if(data?.schema!=="sli-kkp-sector-source-atlas-v1"||catalog?.schema!=="sli-kkp-screened-sources-v1")issues.push("schema");
 const indicators=data?.province_indicators||[],types=new Set(),sources=catalog?.sources||[];
 if(indicators.length!==2||sources.length<20||new Set(sources.map(x=>x.id)).size!==sources.length)issues.push("coverage");
 for(const x of indicators){
  if(!x?.id||types.has(x.id)||x.year!==2024||!SOURCE.test(x.source_url)||!Number.isFinite(x.national_total)||x.rows?.length!==x.province_count)issues.push("invalid_series");
  types.add(x.id);const provinces=new Set();
  for(const r of x.rows||[]){
   if(!r.province||provinces.has(r.province)||!Number.isFinite(r.value)||r.value<=0)issues.push("province_invalid");
   provinces.add(r.province);
  }
  const total=(x.rows||[]).reduce((acc,r)=>acc+r.value,0),tol=x.unit==="ton"?.05:0;
  if(Math.abs(total-x.national_total)>tol+1e-8)issues.push("total_mismatch_"+x.id);
  if(x.unit==="orang"&&x.rows.length!==37)issues.push("fisher_provinces_incomplete");
  if(x.unit==="ton"&&x.rows.length!==26)issues.push("seaweed_nonblank_provinces_incomplete");
 }
 const seed=data?.seed_species;
 if(seed?.year!==2024||seed.rows?.length!==12||seed.unit!=="ribu_ekor"||!SOURCE.test(seed.source_url)||
 seed.rows.some(x=>!x.species||!Number.isFinite(x.value)||x.value<=0)||
 seed.rows.reduce((a,r)=>a+r.value,0)>seed.national_total_displayed)issues.push("seed_inconsistent");
 const district=data?.seed_district_top_rows;
 if(!district||district.year!==2024||district.source_rows_displayed!==1387||district.selected_count!==10||
 district.status!=="source_visible_top_10_only_not_full_1387"||district.unit_volume!=="ribu_ekor"||
 district.unit_value!=="Rp juta"||district.unit_weighted_price!=="Rp/ribu ekor"||
 !SOURCE.test(district.source_url)||district.rows?.length!==10||
 new Set((district.rows||[]).map(r=>[r.province,r.district,r.species].join("|"))).size!==10||
 (district.rows||[]).some((r,i)=>r.rank_display!==i+1||!r.province||!r.district||!r.species||
 !Number.isFinite(r.volume_ribu_ekor)||r.volume_ribu_ekor<=0||
 !Number.isFinite(r.value_rp_million)||r.value_rp_million<=0||
 !Number.isFinite(r.weighted_price_rp_per_thousand)||r.weighted_price_rp_per_thousand<=0))issues.push("seed_district_top10_invalid");
 for(const s of sources){
  if(!SOURCE.test(s.source_url)||!["numeric_ingested_2024","partial_numeric_ingested","national_numeric_only","verified_source_table","map_layer_only","catalog_metadata_only"].includes(s.status)||
  !s.label_id||!s.label_en||!s.numeric_import_status||!Array.isArray(s.visual_types))issues.push("unqualified_catalog_entry");
 }
 return {pass:issues.length===0,issues:[...new Set(issues)],provinces:indicators.map(x=>({id:x.id,n:x.rows.length})),sources:sources.length};
}
export function rankedRegions(data,indicator,q="",all=false){
 const series=data.province_indicators.find(x=>x.id===indicator);
 if(!series)return [];
 const found=[...series.rows].filter(x=>x.province.toLowerCase().includes(q.toLowerCase().trim())).sort((a,b)=>b.value-a.value);
 return all?found:found.slice(0,12);
}
export function rankedSeeds(data){return [...data.seed_species.rows].sort((a,b)=>b.value-a.value)}
export function rankedDistrictSeed(data,q=""){
 const needle=q.toLocaleLowerCase("id-ID").trim();
 return (data.seed_district_top_rows?.rows||[]).filter(r=>[r.province,r.district,r.species].some(x=>x.toLocaleLowerCase("id-ID").includes(needle)));
}
function fmt(x,places=0){return Number(x).toLocaleString(en()?"en-US":"id-ID",{maximumFractionDigits:places})}
function formatUnit(id){return id==="marine_fishers_2024"?T("orang","people"):T("ton","tonnes")}
function link(url,label){const a=E("a","mf-atlas-source",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a}
function downloadCSV(name,headers,rows){
 const esc=v=>'"'+String(v).replace(/"/g,'""')+'"';
 const text="\uFEFF"+[headers,...rows].map(row=>row.map(esc).join(",")).join("\r\n");
 const blob=new Blob([text],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=E("a");
 a.href=url;a.download=name;a.style.display="none";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function mount(){
 if(!$("mfAtlasProvinceChart"))return;
 Promise.all([fetch(observations,{cache:"no-store",sliLocalOnly:true}),fetch(directory,{cache:"no-store",sliLocalOnly:true})]).then(async([a,b])=>{
  if(!a.ok||!b.ok)throw Error("KKP source snapshot unavailable "+a.status+"/"+b.status);
  const [data,cat]=await Promise.all([a.json(),b.json()]);
  const test=validateScreenedPortal(data,cat);if(!test.pass)throw Error(test.issues.join(","));
  const state={indicator:"marine_fishers_2024",query:"",all:false,districtQuery:"",catGroup:"all",catStatus:"all"};
  const host=$("mfAtlasProvinceChart"),table=$("mfAtlasProvinceRows"),stats=$("mfAtlasProvinceSummary");
  function renderProvince(){
   const series=data.province_indicators.find(x=>x.id===state.indicator),rows=rankedRegions(data,state.indicator,state.query,state.all);
   const high=Math.max(...series.rows.map(x=>x.value)),unit=formatUnit(series.id);
   host.replaceChildren();table.replaceChildren();
   if(!rows.length)host.append(E("p","mf-hint",T("Tidak ada provinsi yang cocok.","No matching province.")));
   rows.forEach((r,i)=>{
    const bar=E("div","mf-atlas-bar-row");
    const name=E("span","mf-atlas-bar-label",r.province),track=E("div","mf-atlas-bar-track"),fill=E("span","mf-atlas-bar-fill");
    fill.style.width=Math.max(0.8,r.value/high*100).toFixed(2)+"%";track.append(fill);
    bar.append(name,track,E("strong","mf-atlas-bar-value",fmt(r.value,series.unit==="ton"?2:0)));host.append(bar);
    const tr=E("tr");for(const [j,val]of [i+1,r.province,fmt(r.value,series.unit==="ton"?2:0),fmt(100*r.value/series.national_total,2)+"%"].entries()){
     const td=E(j===1?"th":"td",j>1?"numeric":"",val);tr.append(td);
    }table.append(tr);
   });
   stats.textContent=T("Observasi "+series.year+" · "+series.rows.length+" wilayah dengan angka · jumlah "+fmt(series.national_total,series.unit==="ton"?2:0)+" "+unit+" · "+(state.all?"seluruh baris":"12 peringkat teratas")+".",
     series.year+" observation · "+series.rows.length+" numeric regional rows · national total "+fmt(series.national_total,series.unit==="ton"?2:0)+" "+unit+" · "+(state.all?"all rows":"top 12")+".");
   const source=$("mfAtlasProvinceSource");source.href=series.source_url;
   $("mfAtlasAllButton").textContent=state.all?T("Tampilkan 12 teratas","Show top 12"):T("Tampilkan semua wilayah","Show all regions");
  }
  $("mfAtlasProvinceMetric").addEventListener("change",v=>{state.indicator=v.target.value;renderProvince()});
  $("mfAtlasProvinceQuery").addEventListener("input",v=>{state.query=v.target.value;renderProvince()});
  $("mfAtlasAllButton").addEventListener("click",()=>{state.all=!state.all;renderProvince()});
  $("mfAtlasCSV").addEventListener("click",()=>{
   const series=data.province_indicators.find(x=>x.id===state.indicator);
   downloadCSV("sli-kkp-"+state.indicator+".csv",["Province","2024 value",series.unit,"Publisher","Source"],series.rows.map(r=>[r.province,r.value,series.unit,"KKP",series.source_url]));
  });
  function renderSeed(){
   const list=$("mfAtlasSeedList");list.replaceChildren();
   const rows=rankedSeeds(data),top=rows[0].value;
   rows.forEach(x=>{
    const box=E("div","mf-atlas-seed-item");box.append(E("span","",x.species));
    const track=E("div","mf-atlas-bar-track"),fill=E("span","mf-atlas-bar-fill");
    fill.style.width=(100*x.value/top).toFixed(2)+"%";track.append(fill);
    box.append(track,E("strong","",fmt(x.value)));list.append(box);
   });
   $("mfAtlasSeedSummary").textContent=T("12 kelompok teratas ditampilkan; total nasional di sumber "+fmt(data.seed_species.national_total_displayed)+" ribu ekor. Baru 10 dari 1.387 baris kabupaten/komoditas sumber yang diimpor.",
    "12 leading categories shown; KKP national total "+fmt(data.seed_species.national_total_displayed)+" thousand fish. The 1,387 source district rows are NOT imported.");
   $("mfAtlasSeedSource").href=data.seed_species.source_url;
  }
  function renderDistrict(){
   const info=data.seed_district_top_rows,items=rankedDistrictSeed(data,state.districtQuery),root=$("mfAtlasDistrictRows");
   root.replaceChildren();
   items.forEach(r=>{
    const tr=E("tr");
    for(const [i,val] of [r.province,r.district,r.species,fmt(r.volume_ribu_ekor),fmt(r.value_rp_million),fmt(r.weighted_price_rp_per_thousand)].entries())
      tr.append(E(i===1?"th":"td",i>=3?"numeric":"",val));
    root.append(tr);
   });
   $("mfAtlasDistrictCount").textContent=T(
    items.length+" dari 10 baris sumber terlihat · dari 1.387 baris tabel sumber (observasi 2024), hanya 10 baris diimpor. Angka harga adalah rata-rata tertimbang tercetak, bukan hasil hitung ulang.",
    items.length+" of 10 visible source rows · only 10 of KKP's 1,387 displayed 2024 rows have been imported. Weighted prices are as printed, not recalculated.");
   $("mfAtlasDistrictSource").href=info.source_url;
  }
  $("mfAtlasDistrictQuery").addEventListener("input",e=>{state.districtQuery=e.target.value;renderDistrict()});
  $("mfAtlasDistrictCSV").addEventListener("click",()=>{
   const info=data.seed_district_top_rows;
   downloadCSV("sli-kkp-2024-pembenihan-top10-terfilter.csv",
    ["Observation year","Province","District","Species","Volume (ribu ekor)","Value (Rp juta)","Weighted avg price (Rp/ribu ekor)","Evidence scope","Official KKP source"],
    rankedDistrictSeed(data,state.districtQuery).map(r=>[2024,r.province,r.district,r.species,r.volume_ribu_ekor,r.value_rp_million,r.weighted_price_rp_per_thousand,info.status,info.source_url]));
  });
  const groups=$("mfAtlasSourceGroup");
  cat.groups.forEach(x=>{const opt=E("option","",T(x.label_id,x.label_en));opt.value=x.id;groups.append(opt)});
  function renderSources(){
   const items=cat.sources.filter(x=>(state.catGroup==="all"||x.group===state.catGroup)&&(state.catStatus==="all"||(state.catStatus==="numeric"&&x.numeric_import_status!=="not_imported")||(state.catStatus==="candidate"&&x.numeric_import_status==="not_imported")));
   $("mfAtlasSourceCount").textContent=T(items.length+" dari "+cat.sources.length+" sumber terpetakan",items.length+" of "+cat.sources.length+" screened official sources");
   const root=$("mfAtlasSourceCards");root.replaceChildren();
   for(const x of items){
    const item=E("article","mf-atlas-source-card");
    const title=E("h4","",T(x.label_id,x.label_en)),flag=E("span","mf-atlas-status"+(x.numeric_import_status!=="not_imported"?" has-data":""),
      x.numeric_import_status!=="not_imported"?T("Ada angka yang sudah diimpor","Partly imported"):T("Angka belum diimpor","Numeric ingestion pending"));
    item.append(title,flag,E("p","",T(x.opportunity_id,x.opportunity_en)));
    item.append(E("small","",T("Bentuk visual: ","Visual types: ")+x.visual_types.join(" · ")));
    item.append(link(x.source_url,T("Periksa tabel resmi ↗","Open official KKP source ↗")));root.append(item);
   }
  }
  groups.addEventListener("change",e=>{state.catGroup=e.target.value;renderSources()});
  $("mfAtlasSourceStatus").addEventListener("change",e=>{state.catStatus=e.target.value;renderSources()});
  const renderAll=()=>{
   for(const opt of groups.options){const g=cat.groups.find(x=>x.id===opt.value);if(g)opt.textContent=T(g.label_id,g.label_en)}
   renderProvince();renderSeed();renderDistrict();renderSources();
  };
  document.addEventListener("sli:languagechange",renderAll);
  new MutationObserver(x=>{if(x.some(y=>y.attributeName==="lang"))renderAll()}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  renderAll();
 }).catch(err=>{
  $("mfAtlasProvinceChart").textContent=T("Data atlas KKP belum tersedia atau tidak lolos validasi.","KKP source atlas unavailable or failed validation.");
  if($("mfAtlasSourceCards"))$("mfAtlasSourceCards").textContent=T("Tidak ada sumber pengganti yang direka.","No fabricated source fallback.");
  console.error("[SLI KKP source atlas]",err);
 });
}
if(typeof document!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount()}
