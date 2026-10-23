// Staging contract smoke: external GDELT outage is a degraded signal, never verified data.
const root=process.env.STAGING_URL;
if(!root?.startsWith('https://'))throw Error('Missing HTTPS staging URL');
let degraded=0;
for(const sector of ['energy','mining','industry','finance','food','climate','technology','defense','infrastructure']){
 const response=await fetch(root+'/signals?sector='+sector,{signal:AbortSignal.timeout(25000)});
 const body=await response.json().catch(()=>null);
 if(response.status===503 && body?.sector===sector && body?.verified===false && body?.classification==='upstream_failure' && Array.isArray(body.articles) && body.articles.length===0){
  degraded++;
  console.log('::warning::'+sector+': upstream GDELT unavailable (503), safely degraded');
  continue;
 }
 if(!response.ok || body?.sector!==sector || body?.verified!==false || body?.classification!=='unverified_news_signal' || !Array.isArray(body.articles) || body.articles.length>20)throw Error(sector+': invalid contract or unexpected HTTP '+response.status);
 console.log(sector,body.articles.length,'unverified news signals');
}
console.log('Staging contract PASS; upstream degraded:',degraded);
if(degraded)console.log('::warning::External coverage remains degraded; live news coverage not certified.');
