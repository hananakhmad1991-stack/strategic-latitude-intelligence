/* Expert Connect scholarly discovery. Public metadata only.
 * No inference that a person has consented, joined SLI or is contactable.
 */
const clean=(v,n=160)=>String(v||"").replace(/[\u0000-\u001f]/g," ").trim().slice(0,n);
const req=async(url,fetcher)=>{const response=await fetcher(url,{headers:{"accept":"application/json"},signal:AbortSignal.timeout(5500)});if(!response.ok)throw Error("provider_"+response.status);return response.json()};
export async function discoverScholarlyExperts(topic,{fetcher=fetch,openalexKey="",enabled=false}={}){
 if(!enabled)return {status:"disabled",candidates:[]};
 const q=clean(topic,120);
 if(q.length<4)return {status:"invalid_topic",candidates:[]};
 const url=new URL("https://api.openalex.org/works");
 url.searchParams.set("search.title_abstract_keywords",q);
 url.searchParams.set("per_page","10");
 url.searchParams.set("select","id,title,doi,publication_year,authorships,primary_location");
 if(openalexKey)url.searchParams.set("api_key",openalexKey);
 try{
  const data=await req(url,fetcher),people=new Map();
  for(const work of Array.isArray(data.results)?data.results:[]){
   for(const byline of (work.authorships||[]).slice(0,8)){
    const id=byline.author?.id;
    if(typeof id!=="string"||!/^https:\/\/openalex\.org\/A\d+$/.test(id))continue;
    if(!people.has(id))people.set(id,{id,name:clean(byline.author.display_name),institution:clean(byline.institutions?.[0]?.display_name),country:clean(byline.institutions?.[0]?.country_code,2),works:[],status:"uncontacted_public_candidate"});
    const p=people.get(id);
    if(p.works.length<3)p.works.push({title:clean(work.title,220),doi:typeof work.doi==="string"&&/^https:\/\/doi\.org\/10\./.test(work.doi)?work.doi:null,year:Number.isInteger(work.publication_year)?work.publication_year:null});
   }
  }
  return {status:"discovery_only",candidates:[...people.values()].slice(0,20),provenance:"OpenAlex public scholarly metadata; not verified expertise, identity or availability"};
 }catch{return {status:"upstream_unavailable",candidates:[]}}
}
export async function lookupDoiMetadata(doi,{fetcher=fetch,enabled=false}={}){
 if(!enabled)return {status:"disabled"};
 const d=clean(doi,180).replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,"");
 if(!/^10\.\d{4,9}\/[A-Za-z0-9._;():/+\-]+$/.test(d))return {status:"invalid_doi"};
 try{
  const data=await req("https://api.crossref.org/works/"+encodeURIComponent(d),fetcher);
  const w=data?.message;
  if(!w||typeof w!=="object")return {status:"not_found"};
  return {status:"metadata_found",doi:clean(w.DOI,180),title:clean(w.title?.[0],250),publisher:clean(w.publisher),year:w.published?.["date-parts"]?.[0]?.[0]||null,url:typeof w.URL==="string"&&w.URL.startsWith("https://")?w.URL:null,provenance:"Crossref publisher-supplied metadata, not independent content or peer-review verification"};
 }catch{return {status:"upstream_unavailable"}}
}
