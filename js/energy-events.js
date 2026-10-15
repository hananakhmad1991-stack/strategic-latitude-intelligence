/* SLI Upcoming Indonesia Energy Events — dated organizer sources, five maximum. */
(function(){
"use strict";
const rootId="energyEventsRoot";
const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined&&text!==null)e.textContent=String(text);return e};
function jakartaToday(){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Jakarta",day:"2-digit",month:"2-digit",year:"numeric"}).formatToParts(new Date());
 const map={};parts.forEach(p=>map[p.type]=p.value);
 return [map.year,map.month,map.day].join("-");
}
function formatDate(d){
 return new Date(d+"T12:00:00+07:00").toLocaleDateString("id-ID",{timeZone:"Asia/Jakarta",day:"numeric",month:"short",year:"numeric"});
}
function deltaDays(start,today){
 return Math.round((Date.parse(start+"T00:00:00Z")-Date.parse(today+"T00:00:00Z"))/86400000);
}
function link(url,text){
 const a=node("a","events-link",text);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;
}
function render(root,data,fallback){
 const today=jakartaToday();
 const records=(data.events||[]).filter(e=>e && e.end_date>=today && e.title && /^https:\/\//i.test(e.source_url))
  .sort((a,b)=>a.start_date.localeCompare(b.start_date)||a.title.localeCompare(b.title)).slice(0,5);
 root.replaceChildren();
 const top=node("div","events-top"),heading=node("div");
 heading.append(node("div","eyebrow","Indonesia · Energy Intelligence Calendar"),node("h2",null,"Upcoming Energy Events"));
 const flag=node("span","events-count",records.length+" events · closest upcoming dates");
 top.append(heading,flag);root.append(top);
 const intro=node("p","events-intro","Five selected energy-sector events, sorted by date and backed by organiser announcements. Completed events disappear automatically; newly eligible events replace them when source-dated records are available.");
 root.append(intro);
 const list=node("div","events-grid");
 for(const e of records){
  const card=node("article","events-card");
  const start=deltaDays(e.start_date,today),ongoing=start<=0&&e.end_date>=today;
  const head=node("div","events-card-top"),date=node("div","events-date"),tag=node("span","events-type",e.category||"Energy");
  const icon=node("div","events-day",new Date(e.start_date+"T12:00:00+07:00").toLocaleDateString("id-ID",{timeZone:"Asia/Jakarta",day:"2-digit"}));
  const month=node("div","events-month",new Date(e.start_date+"T12:00:00+07:00").toLocaleDateString("id-ID",{timeZone:"Asia/Jakarta",month:"short",year:"numeric"}));
  date.append(icon,month);head.append(date,tag);card.append(head);
  card.append(node("h3",null,e.title));
  const dateLine=e.start_date===e.end_date?formatDate(e.start_date):formatDate(e.start_date)+" – "+formatDate(e.end_date);
  card.append(node("p","events-when",dateLine+(e.time_wib?" · "+e.time_wib:"")));
  const point=node("p","events-location",e.venue+(e.city && !e.venue.toLowerCase().includes(e.city.toLowerCase())?" · "+e.city:""));
  card.append(point);
  card.append(node("p","events-summary",e.summary||"Energy sector dialogue and business engagement."));
  const org=node("p","events-organizer");
  org.append(node("strong",null,"Organiser: "),document.createTextNode(e.organizer));card.append(org);
  const foot=node("div","events-card-foot"),timeline=node("span","events-timeline",ongoing?"Ongoing":start===1?"Tomorrow":"In "+start+" days");
  foot.append(timeline,link(e.source_url,"Event details ↗"));card.append(foot);
  list.append(card);
 }
 if(!records.length){
  const note=node("div","events-empty","No source-confirmed upcoming Indonesian energy events are currently available. The next scheduled refresh will check for new listings.");
  list.append(note);
 }
 root.append(list);
 const timestamp=data.generated_at_utc?new Date(data.generated_at_utc):null;
 const meta=node("div","events-meta");
 let text="Source: organizer announcements · dates in Indonesia (WIB).";
 if(timestamp && !Number.isNaN(timestamp.getTime())){
  const checked=timestamp.toLocaleString("id-ID",{timeZone:"Asia/Jakarta",dateStyle:"medium",timeStyle:"short"});
  text+=" Last source scan: "+checked+" WIB.";
  if(Date.now()-timestamp.getTime()>36*3600000)text+=" Dataset older than 36 hours; recheck event links.";
 }else text+=" Curated source catalog; automatic feed temporarily unavailable.";
 if((data.source_errors||[]).length)text+=" "+data.source_errors.length+" source checks were unavailable; organizer dates should be reconfirmed.";
 if(fallback)text+=" Fallback from dated original organizer catalog.";
 meta.append(node("p",null,text));
 root.append(meta);
}
window.initEnergyEvents=async function(){
 const root=document.getElementById(rootId);if(!root)return;
 root.replaceChildren(node("p","events-loading","Loading dated Indonesia energy events…"));
 try{
  const r=await fetch("data/energy-events.json",{cache:"no-store"});
  if(!r.ok)throw Error("Events feed not yet published");
  const j=await r.json();
  if(!Array.isArray(j.events)||j.events.length>5)throw Error("Malformed event feed");
  render(root,j,false);
 }catch(e){
  try{
   const r=await fetch("data/energy-events-catalog.json",{cache:"no-store"});
   if(!r.ok)throw Error("No source catalog");
   const j=await r.json();
   render(root,{events:(j.events||[]).filter(e=>e.end_date>=jakartaToday())},true);
  }catch(err){
   root.replaceChildren(node("div","events-empty","No verified event calendar data has been published. Check GitHub Actions source status."));
  }
 }
};
})();