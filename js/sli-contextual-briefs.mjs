/* SLI contextual research briefs: three-sentence editorial summaries from dated baselines
 * and publisher-attributed headline discovery. A headline is NOT a verified event. */
const outer=document.querySelector(".sli-ra-next");
if(outer){
 const section=document.createElement("section");section.id="raContextBriefs";section.className="sli-ra-context-briefs";
 const heading=document.createElement("h2");heading.textContent="SLI Sector Intelligence · Contextual Assessment";
 const intro=document.createElement("p");intro.textContent="Ringkasan tiga kalimat per sektor: baseline bertanggal, sinyal berita yang belum diverifikasi, dan konsekuensi yang perlu diuji investor. Bukan sekadar data preview.";
 const cards=document.createElement("div");cards.className="sli-ra-context-grid";
 section.append(heading,intro,cards);outer.parentNode.insertBefore(section,outer);
 const e=(tag,cls,t)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(t!==undefined)n.textContent=String(t);return n};
 const safe=u=>{try{const v=new URL(u);return v.protocol==="https:"?v.href:null}catch{return null}};
 const sentence=s=>String(s||"").trim().split(/(?<=[.!?])\s+(?=[A-Z])/u)[0]||"";
 const get=async file=>{const r=await fetch("./data/"+file,{cache:"no-store"});if(!r.ok)throw Error("feed unavailable");return r.json()};
 const dated=s=>String(s||"").slice(0,16).replace("T"," ");
 const link=(url,label)=>{const u=safe(url);if(!u)return null;const a=e("a",null,label);a.href=u;a.target="_blank";a.rel="noopener noreferrer";return a};
 const add=(title,stamp,lines,links,kind)=>{
  const article=e("article","sli-ra-context-card");
  const eyebrow=e("small",null,kind+" · "+stamp);
  article.append(eyebrow,e("h3",null,title));
  const body=e("p",null,lines.filter(Boolean).join(" "));article.append(body);
  const sources=e("div","sli-ra-context-links");
  links.filter(x=>x?.url).slice(0,3).forEach(x=>{const a=link(x.url,x.label);if(a)sources.append(a)});
  article.append(sources);cards.append(article);
 };
 try{
  const [energy,radar]=await Promise.all([get("daily-energy-assessment.json"),get("research-signal-radar.json")]);
  const eid=new Map((energy?.points||[]).map(p=>[p.id,p]));
  for(const [id,label] of [["oil-gas","Oil & Gas · Supply"],["coal","Coal & Domestic Market"]]){
   const row=eid.get(id);if(!row)continue;
   const lead=row.recent_news_leads?.[0];
   add(label,energy.assessment_date_wib,
   [sentence(row.finding),
    lead?"Monitored headline (unverified; "+lead.publisher+"): “"+lead.title+"”.":"No qualified headline selected for this theme; monitoring absence does not mean no event occurred.",
    sentence(row.implication)+" Investor verification: "+sentence(row.verification_priority)],
   [...(row.baseline_sources||[]).slice(0,2).map(z=>({url:z.url,label:z.label})),...(lead?[{url:lead.url,label:"News lead ↗"}]:[])],"Official baseline + monitored lead");
  }
  for(const [key,title] of [["minerals","Critical Minerals · Downstreaming"],["ai","AI Infrastructure · Investment"]]){
   const pool=[...(radar?.groups?.[key]?.domestic||[]),...(radar?.groups?.[key]?.geopolitical||[])];
   const lead=pool.find(x=>safe(x.url))||null;
   if(!lead)continue;
   const pathway=sentence(lead.impact_pathway).replace(/^Changes may/i,"Changes may");
   const sectorCheck=key==="minerals"?
    "For investors, distinguish announced export targets and smelter plans from commissioned output, actual capital spending and permits.":
    "For investors, distinguish announced data-centre MW from energised grid capacity, commissioning and verified customer compute demand.";
   add(title,dated(radar.generated_at_utc),[
    "A publisher-attributed monitored headline reports: “"+lead.title+"”; this has not been independently verified by SLI.",
    pathway,
    sectorCheck
   ],[{url:lead.url,label:lead.publisher+" · monitored headline ↗"}],"Unverified lead · conditional assessment");
  }
  const date=new Date(radar.generated_at_utc||"");if(Number.isFinite(date.getTime())&&Date.now()-date.getTime()>7*86400000)intro.textContent+=" Snapshot berita sudah lebih dari tujuh hari; periksa ulang.";
 }catch(err){cards.append(e("p","sli-ra-context-error","Context feed unavailable: use the dated Research Evidence Preview and original publishers. No unverified substitute was generated."))}
}
