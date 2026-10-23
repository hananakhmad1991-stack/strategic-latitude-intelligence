// SLI Early Warning API — GDELT signals only, never verified facts.
// Deploy as a separate staging Worker. No secret is needed for GDELT DOC 2.0.
const SECTORS = {
 energy:'(Indonesia OR Indonesian) (oil OR gas OR electricity OR PLN OR energy)',
 mining:'(Indonesia OR Indonesian) (nickel OR copper OR tin OR mining)',
 industry:'(Indonesia OR Indonesian) (manufacturing OR factory OR industrial)',
 finance:'(Indonesia OR Indonesian) (banking OR rupiah OR stockmarket)',
 food:'(Indonesia OR Indonesian) (rice OR foodsecurity OR agriculture)',
 climate:'(Indonesia OR Indonesian) (flood OR wildfire OR drought)',
 technology:'(Indonesia OR Indonesian) (datacenter OR cybersecurity OR artificialintelligence)',
 defense:'(Indonesia OR Indonesian) (defense OR navy OR maritime)',
 infrastructure:'(Indonesia OR Indonesian) (infrastructure OR port OR railway)'
};
const ALLOW_ORIGIN = /^(https:\/\/hananakhmad1991-stack\.github\.io|http:\/\/localhost(?::\d+)?)$/;
export default {
 async fetch(request, env, ctx) {
  const origin=request.headers.get('Origin')||'';
  const cors={'Access-Control-Allow-Origin':ALLOW_ORIGIN.test(origin)?origin:'https://hananakhmad1991-stack.github.io',
   'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(request.method!=='GET')return json({error:'method_not_allowed'},405,cors);
  const u=new URL(request.url);
  if(u.pathname==='/health')return json({ok:true,service:'sli-gdelt-early-warning',ai_enabled:false},200,cors);
  if(u.pathname!=='/signals')return json({error:'not_found'},404,cors);
  const sector=u.searchParams.get('sector')||'energy';
  if(!Object.hasOwn(SECTORS,sector))return json({error:'unknown_sector'},400,cors);
  const cacheKey=new Request('https://sli-internal.invalid/signals?sector='+sector);
  const cache=caches.default;
  const hit=await cache.match(cacheKey);
  if(hit)return withCors(hit,cors);
  const endpoint=new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  endpoint.searchParams.set('query',SECTORS[sector]);
  endpoint.searchParams.set('mode','artlist');
  endpoint.searchParams.set('format','json');
  endpoint.searchParams.set('timespan','24h');
  endpoint.searchParams.set('maxrecords','20');
  endpoint.searchParams.set('sort','datedesc');
  let upstream;
  try {upstream=await fetch(endpoint.toString(),{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});}
  catch(_){return json({sector,status:'upstream_unavailable',articles:[],verified:false},503,cors);}
  if(!upstream.ok)return json({sector,status:'upstream_error',articles:[],verified:false},502,cors);
  let payload;
  try{payload=await upstream.json()}catch(_){return json({sector,status:'invalid_upstream',articles:[],verified:false},502,cors)}
  const articles=(Array.isArray(payload.articles)?payload.articles:[]).slice(0,20).filter(x=>{
   try{return new URL(x.url).protocol==='https:'}catch(_){return false}
  }).map(x=>({title:String(x.title||'').slice(0,260),url:x.url,source:String(x.domain||'').slice(0,120),
   published:String(x.seendate||''),language:String(x.language||''),sourcecountry:String(x.sourcecountry||'')}));
  const result=json({sector,status:'ok',source:'GDELT DOC 2.0',verified:false,classification:'unverified_news_signal',
   updated_at:new Date().toISOString(),articles,methodology:'Automated keyword monitoring. Not incident confirmation, fact checking or legal attribution.'},200,
   {...cors,'Cache-Control':'public, max-age=900'});
  ctx.waitUntil(cache.put(cacheKey,result.clone()));
  return result;
 }
};
function json(o,status,headers){return new Response(JSON.stringify(o),{status,headers:{'Content-Type':'application/json; charset=utf-8',...headers}})}
function withCors(resp,cors){const h=new Headers(resp.headers);Object.entries(cors).forEach(([k,v])=>h.set(k,v));return new Response(resp.body,{status:resp.status,headers:h})}
