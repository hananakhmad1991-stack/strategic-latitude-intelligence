/* SLI evidence-plus-monitoring analytical paragraphs in existing mineral/AI dashboards.
 * Do not present news RSS leads as verified events or promote announced projects to operating assets. */
const host=document.getElementById("content");
if(host){
 let evidence=null,radar=null,busy=false;
 const E=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e};
 const validUrl=u=>{try{const v=new URL(u);return v.protocol==="https:"?v.href:null}catch{return null}};
 const first=s=>String(s||"").trim().split(/(?<=[.!?])\s+(?=[A-Z])/u)[0];
 const data=async()=>{
  if(evidence&&radar)return true;
  const [a,b]=await Promise.all([fetch("./data/sli-research-evidence-preview.json",{cache:"no-store"}),fetch("./data/research-signal-radar.json",{cache:"no-store"})]);
  if(!a.ok||!b.ok)return false;
  [evidence,radar]=await Promise.all([a.json(),b.json()]);return true;
 };
 async function paint(){
  if(busy)return;
  const sector=location.hash.toLowerCase().startsWith("#minerals")?"minerals":location.hash.toLowerCase().startsWith("#ai")?"ai":null;
  const root=document.getElementById("sliResearchRoot");
  if(!sector||!root||root.querySelector("#sliResearchContextNote"))return;
  busy=true;
  try{
   if(!(await data()))return;
   const documents=(evidence.documents||[]).filter(d=>d.topic===sector&&validUrl(d.source_url)).sort((a,b)=>String(b.source_date).localeCompare(String(a.source_date)));
   const source=documents[0],items=[...(radar.groups?.[sector]?.domestic||[]),...(radar.groups?.[sector]?.geopolitical||[])];
   const news=items.find(d=>validUrl(d.url));
   if(!source&&!news)return;
   const note=E("aside","sli-sector-intel");note.id="sliResearchContextNote";
   const title=E("h3",null,"Current Context · Evidence & Strategic Implications");note.append(title);
   note.append(E("small",null,"Evidence publication: "+(source?.source_date||"not available")+" · Monitoring snapshot: "+String(radar.generated_at_utc||"unknown").slice(0,10)+" · evidence and headlines are not equivalent"));
   const p=E("p",null,[
    source?"Recorded sector evidence: "+first(source.text)+" (measurement/publication periods must be checked).":"",
    news?"Monitoring lead attributed to "+news.publisher+": “"+news.title+"”. This is not SLI confirmation of execution or market impact; "+first(news.impact_pathway):"",
    sector==="minerals"?"Investor assessment: cross-check permits, commissioned tonnage, power contracts, pricing and offtake before counting announced smelting investments as realised value added.":"Investor assessment: verify operational IT load, grid connection, power purchase, water/cooling, contracts and commissioning before treating announced MW as usable AI compute."
   ].filter(Boolean).join(" "));note.append(p);
   const links=E("div","sli-sector-intel-links");
   for(const record of [{url:source?.source_url,label:"Underlying sector evidence ↗"},{url:news?.url,label:"Attributed monitoring headline ↗"}]){
    if(!validUrl(record.url))continue;const a=E("a",null,record.label);a.href=record.url;a.target="_blank";a.rel="noopener noreferrer";links.append(a);
   }note.append(links);root.prepend(note);
  }catch(e){/* leave dashboard intact; never generate an unsupported fallback */}finally{busy=false}
 }
 const observer=new MutationObserver(()=>{void paint()});observer.observe(host,{childList:true});
 window.addEventListener("hashchange",()=>requestAnimationFrame(()=>{void paint()}));
 void paint();
}
