/** Fetch the public BNPB 2025 province event matrix into a review-only candidate.
 * Never update production JSON automatically; verify coverage and rights before merge.
 * Node 22+; source: official BNPB CKAN resource df39e8c3....
 */
import {mkdir,writeFile} from "node:fs/promises";
const id="df39e8c3-117e-40fa-b518-ff1037743955";
const page="https://data.bnpb.go.id/dataset/kompilasi-data-kejadian-dan-dampak-bencana-2025/resource/"+id;
const source="https://data.bnpb.go.id/api/3/action/datastore_search?resource_id="+id+"&limit=150";
const TYPES={"BANJIR":"floods","CUACA EKSTREM":"extreme_weather","ERUPSI GUNUNG API":"volcanic_eruptions",
 "GELOMBANG PASANG DAN ABRASI":"coastal_events","GEMPABUMI":"earthquakes",
 "KEBAKARAN HUTAN DAN LAHAN":"wildfires","KEKERINGAN":"droughts","TANAH LONGSOR":"landslides","TSUNAMI":"tsunami"};
const key=v=>String(v).normalize("NFKD").toUpperCase().replace(/[^A-Z0-9 ]/g,"").replace(/\s+/g," ").trim();
const num=v=>{
 if(v===null||v===undefined||v===""||v==="-"||v==="…"||v==="...")return null;
 const x=typeof v==="number"?v:Number(String(v).replace(/\s/g,"").replace(/,/g,""));
 if(!Number.isInteger(x)||x<0)throw Error("BNPB invalid count: "+String(v));
 return x;
};
async function get(){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),14000);
 try{const response=await fetch(source,{signal:controller.signal,headers:{accept:"application/json", "user-agent":"SLI-open-data-review/1.0"}});
  if(!response.ok)throw Error("BNPB HTTP "+response.status);
  const j=await response.json();if(j.success!==true||!Array.isArray(j.result?.records))throw Error("BNPB CKAN unexpected API shape");
  if(j.result.records.length<30||j.result.records.length>45)throw Error("Unexpected provincial row count "+j.result.records.length);
  return j.result.records;
 }finally{clearTimeout(timer)}
}
try{
 const raw=await get(),names=new Set();
 const rows=raw.map(sourceRow=>{
  const cols=Object.fromEntries(Object.entries(sourceRow).map(([k,v])=>[key(k),v]));
  const province=String(cols.PROVINSI||"").trim();
  if(!province||names.has(key(province)))throw Error("Missing or duplicate province "+province);
  names.add(key(province));
  const row={province,admin_code:cols["KODE WILAYAH PROVINSI"]??null};
  for(const [rawLabel,out] of Object.entries(TYPES)){
   if(!(rawLabel in cols))throw Error("Missing column "+rawLabel);
   row[out]=num(cols[rawLabel]);
  }
  return row;
 });
 const national=rows.find(x=>key(x.province)==="INDONESIA");
 const provinces=rows.filter(x=>key(x.province)!=="INDONESIA");
 if(!national||provinces.length!==38||new Set(provinces.map(x=>x.admin_code)).size!==38)
  throw Error("Expected 38 unique admin provinces and one Indonesia aggregate; got "+provinces.length);
 if(!provinces.some(x=>Object.keys(TYPES).some(k=>Number(x[TYPES[k]])>0)))
  throw Error("All provincial 2025 counts empty");
 const metrics=Object.values(TYPES);
 const nationalPublished=Object.fromEntries(metrics.map(k=>[k,national[k]]));
 const nationalComputed=Object.fromEntries(metrics.map(k=>[k,provinces.reduce((sum,row)=>sum+row[k],0)]));
 const anomalies=metrics.filter(k=>nationalPublished[k]!==nationalComputed[k]).map(k=>({indicator:k,provincial_sum:nationalComputed[k],source_national:nationalPublished[k],difference:nationalComputed[k]-nationalPublished[k]}));
 const out={schema:"sli-bnpb-provincial-disasters-v1",year:2025,source_url:page,source_ckan_resource_id:id,
  checked_at:new Date().toISOString(),status:"candidate_requires_reviewer_validation",
  original_publisher:"Badan Nasional Penanggulangan Bencana",rights:"Open Data Commons Attribution License per BNPB portal",scope:"Annual recorded province-level events by hazard type; not rates, damage values or site exposure scores",
  disaster_types:metrics,records:provinces,source_national_aggregate:nationalPublished,
  recomputed_province_aggregate:nationalComputed,
  quality_checks:{provinces:provinces.length,metrics_checked:metrics.length,metrics_matched:metrics.length-anomalies.length,anomalies},
  warning:"Source national/within-province discrepancies are preserved, not corrected. Candidate does NOT update production until source and administrative boundary review."};
 await mkdir("artifacts",{recursive:true});
 await writeFile("artifacts/sli-bnpb-provincial-2025-review-candidate.json",JSON.stringify(out,null,2)+"\n");
 console.log("BNPB_SOURCE_OK provinces="+provinces.length+" reconciled="+(metrics.length-anomalies.length)+"/"+metrics.length+" source="+page);
 // Public official data only; emit portable text for reviewer extraction when artifact download is unavailable.
 console.log("BNPB_JSON_BASE64="+Buffer.from(JSON.stringify(out),"utf8").toString("base64"));
}catch(e){
 console.error("BNPB_SOURCE_UNAVAILABLE_OR_UNVERIFIED "+String(e.message||e));
 process.exitCode=2;
}
