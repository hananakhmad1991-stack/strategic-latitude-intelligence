/** Verified-point-only climate exposure; fail closed on ambiguous ArcGIS geometry/classes. */
export function eligibleSite(site){
 return !!(site&&Number.isFinite(site.latitude)&&Number.isFinite(site.longitude)&&site.latitude>=-12&&site.latitude<=7&&site.longitude>=94&&site.longitude<=142&&/^https:\/\//.test(site.coordinate_source_url||'')&&['primary_document_confirmed','official_geospatial_verified'].includes(site.verification_status));
}
export function classFromFeature(attributes){
 const a=attributes||{};
 const keys=['KELAS_R','KELAS','kelas_r','kelas','risk_class','CLASS','KELAS_RISIKO'];
 let raw=null;for(const key of keys){if(a[key]!==undefined&&a[key]!==null){raw=String(a[key]).trim();break}}
 if(!raw)return null;
 const text=raw.toLowerCase();if(['1','rendah','low'].includes(text))return 'Low';
 if(['2','sedang','moderate','medium'].includes(text))return 'Moderate';
 if(['3','tinggi','high'].includes(text))return 'High';
 return null;
}
export async function assessPoint(site,{hazard,endpoint,signal}={}){
 const base={status:'N/A',hazard:hazard||null,reason:'Evidence or service not sufficient'};
 if(!eligibleSite(site))return {...base,reason:'Verified exact facility coordinate required'};
 if(!['flood','wildfire','drought'].includes(hazard))return {...base,reason:'Unsupported hazard layer'};
 if(typeof endpoint!=='string'||!endpoint.startsWith('https://gis.bnpb.go.id/server/rest/services/inarisk/'))return {...base,reason:'Unapproved source service'};
 const layer={flood:0,wildfire:3,drought:4}[hazard];
 const params=new URLSearchParams({f:'json',geometry:JSON.stringify({x:site.longitude,y:site.latitude,spatialReference:{wkid:4326}}),geometryType:'esriGeometryPoint',sr:'4326',layers:'all:'+layer,tolerance:'1',mapExtent:(site.longitude-.02)+','+(site.latitude-.02)+','+(site.longitude+.02)+','+(site.latitude+.02),imageDisplay:'600,600,96',returnGeometry:'true'});
 try{
  const res=await fetch(endpoint+'/identify?'+params.toString(),{signal});if(!res.ok)throw Error('HTTP '+res.status);
  const response=await res.json();const matches=(response.results||[]).filter(x=>Number(x.layerId)===layer&&x.geometry&&x.geometryType==='esriGeometryPolygon');
  if(matches.length!==1)return {...base,reason:'No unique polygon classification at site point'};
  const classification=classFromFeature(matches[0].attributes);
  if(!classification)return {...base,reason:'Unmapped or absent official risk class'};
  return {status:classification,hazard,source:endpoint+'/'+layer,site_source:site.coordinate_source_url,basis:'Exact point ArcGIS identify; historical risk-class layer; not live hazard',attributes:matches[0].attributes};
 }catch(error){return {...base,reason:'Official hazard query unavailable: '+error.message}}
}
