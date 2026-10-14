/* Strategic Latitude Intelligence: dated, evidence-led daily assessment renderer. */
(function(){
"use strict";
const rootId="energyOverallAssessment";
const num=s=>Number(s).toLocaleString("en-US");
function element(tag,text,className){
 const el=document.createElement(tag);if(text!==undefined&&text!==null)el.textContent=String(text);
 if(className)el.className=className;return el;
}
function rowLink(s){
 if(!s||typeof s.url!=="string"||!/^https:\/\//i.test(s.url))return null;
 const a=element("a",s.label||"Source");
 a.href=s.url;a.rel="noopener noreferrer";a.target="_blank";return a;
}
function localTime(iso){
 const date=new Date(iso);if(Number.isNaN(date.getTime()))return "Date unavailable";
 return date.toLocaleString("en-GB",{timeZone:"Asia/Jakarta",dateStyle:"medium",timeStyle:"short"})+" WIB";
}
function sourceLinks(parent,sources){
 if(!Array.isArray(sources)||!sources.length)return;
 const refs=element("p",null,"oa-daily-sources");refs.append(element("strong","Sources: "));
 sources.slice(0,4).forEach((item,i)=>{
  const a=rowLink(item);if(!a)return;
  if(i)refs.append(document.createTextNode(" · "));
  refs.append(a);
 });
 parent.append(refs);
}
function dailyPoint(p){
 const li=element("li",null,"oa-daily-point");
 li.append(element("strong",p.heading||"Energy finding"));
 li.append(element("p",p.finding||"No assessment available.","oa-daily-finding"));
 if(p.daily_signal){const signal=element("p",null,"oa-daily-signal");signal.append(element("b","Daily intelligence signal: "),document.createTextNode(p.daily_signal));li.append(signal);}
 const why=element("p",null,"oa-daily-impact");
 why.append(element("b","Strategic implication: "),document.createTextNode(p.implication||"Insufficient evidence."));li.append(why);
 const verify=element("p",null,"oa-daily-check");
 verify.append(element("b","Verify next: "),document.createTextNode(p.verification_priority||"Original source."));li.append(verify);
 const reports=Array.isArray(p.recent_news_leads)?p.recent_news_leads:[];
 if(reports.length){
  const block=element("div",null,"oa-daily-leads");
  block.append(element("div","Recently monitored headlines · not independently verified","oa-daily-lead-label"));
  reports.slice(0,2).forEach(report=>{
   if(!/^https:\/\//i.test(report.url||""))return;
   const r=element("div",null,"oa-daily-headline"),a=element("a",report.title||"News lead");
   a.href=report.url;a.target="_blank";a.rel="noopener noreferrer";
   r.append(a,element("div",((report.publisher||"Source")+" · "+localTime(report.published_at_utc))+(report.new_since_previous?" · New to assessment":""),"oa-daily-meta"));block.append(r);
  });
  li.append(block);
 }
 sourceLinks(li,p.baseline_sources);return li;
}
window.initDailyEnergyAssessment=async function(){
 const root=document.getElementById(rootId);if(!root)return;
 // Original editorial content stays intact if the first run fails or fetch is blocked.
 try{
  const response=await fetch("data/daily-energy-assessment.json?cache="+Date.now(),{cache:"no-store"});
  if(!response.ok)throw Error("Daily data missing");
  const d=await response.json();if(!Array.isArray(d.points)||d.points.length!==7||!d.generated_at_utc)throw Error("Invalid assessment shape");
  const age=(Date.now()-new Date(d.generated_at_utc).getTime())/36e5;
  const wrapper=document.createDocumentFragment();
  const heading=element("div",null,"section");
  heading.append(element("h2","Daily Overall Assessment: Indonesia Energy Security"));
  heading.append(element("span","7 strategic findings · "+localTime(d.generated_at_utc)));
  wrapper.append(heading);
  const intro=element("p",null,"oa-intro");intro.append(document.createTextNode(d.news_note||"Source-led daily review."));
  if(age>36)intro.append(element("span"," · Assessment older than 36 hours: review input freshness.","oa-daily-stale"));
  wrapper.append(intro);
  const metadata=element("div",null,"oa-daily-meta-panel");
  metadata.append(element("strong","Update transparency"));
  const domestic=d.news_freshness?.domestic,geo=d.news_freshness?.geopolitical;
  const freshnessText=x=>x?.usable?"Current at generation ("+num(x.age_hours_at_generation)+"h old)": "Stale or unavailable";
  metadata.append(element("div","Official baseline: "+(d.baseline_changed_since_previous?"Updated since prior run":"Latest published reference years; unchanged unless source dataset revised")));
  metadata.append(element("div","Domestic monitoring: "+freshnessText(domestic)));
  metadata.append(element("div","Geopolitical monitoring: "+freshnessText(geo)));
  metadata.append(element("div","News count: "+num(d.news_new_since_previous||0)+" newly selected headline leads compared with the previous assessment."));
  wrapper.append(metadata);
  const list=element("ol",null,"oa-list");
  d.points.forEach(p=>list.append(dailyPoint(p)));wrapper.append(list);
  const footer=element("div",null,"oa-footer");
  footer.append(element("strong","Monitoring priorities"));
  footer.append(element("p",d.watch_next||"Review official releases and verified disruptions."));
  footer.append(element("p","Method: "+(d.method||"Dated public sources, rule-based synthesis.")+" News headlines are not confirmed incidents or measured losses."));
  footer.append(element("p","Limitations: "+(d.limitations||"Assessment is not real-time verified reporting.")));
  wrapper.append(footer);
  root.replaceChildren(wrapper);
 }catch(e){
  const note=element("div","Daily automation has not published a validated assessment yet. The dated editorial assessment below remains visible.","oa-daily-fallback");
  root.prepend(note);
 }
};
})();