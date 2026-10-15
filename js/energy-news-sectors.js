/* Unified sector tabs for saved domestic and geopolitical energy OSINT leads.
   Historical feeds without sector_tags receive CONSERVATIVE topic/title fallback;
   absence of a saved headline is not evidence of absence of an event. */
(function(){
"use strict";
const SECTORS=[
 {id:"all",en:"All sectors",idn:"Semua sektor"},
 {id:"oil_gas",en:"Oil & Gas",idn:"Migas"},
 {id:"coal",en:"Coal",idn:"Batubara"},
 {id:"nre",en:"NRE / Renewables",idn:"EBT / Terbarukan"},
 {id:"electricity",en:"Electricity",idn:"Ketenagalistrikan"},
 {id:"cross_cutting",en:"Cross-sector",idn:"Lintas sektor"}
];
const domestic={
 oil_gas_upstream:["oil_gas"],oil_gas_downstream:["oil_gas"],oil_gas_gas:["oil_gas"],fuel:["oil_gas"],refinery:["oil_gas"],
 coal_production:["coal"],coal_dmo:["coal","electricity"],
 nre_solar_wind:["nre"],nre_geothermal_hydro:["nre"],nre_policy:["nre"],biofuels:["nre","oil_gas"],
 power:["electricity"],forest_fire:["cross_cutting"],supply_disaster:["cross_cutting"]
};
const geopolitical={
 "Hormuz and Gulf energy":["oil_gas"],"Red Sea and Bab el-Mandeb":["oil_gas"],
 "Middle East energy infrastructure":["oil_gas"],"Asian LNG and gas":["oil_gas"],
 "Global coal and energy policy":["coal"],
 oil_shipping:["oil_gas"],oil_supply:["oil_gas"],oil_sanctions:["oil_gas"],lng_asia:["oil_gas"],
 coal_markets:["coal"],coal_indonesia_trade:["coal"],nre_solar_wind:["nre"],
 nre_grid_storage:["nre"],nre_geothermal:["nre"],nre_biofuels:["nre"]
};
const patterns={
 oil_gas:/\b(?:migas|minyak\s+(?:mentah|bumi)|crude|petroleum|refinery|kilang|solar\s+subsidi|bbm|lpg|lng|natural\s+gas|gas\s+bumi|hgbt|jargas|skk\s*migas|opec|pertalite|pertamax|oil\s+(?:prices?|exports?|imports?|supply|production|tanker|field)|gas\s+(?:prices?|supply|pipeline))\b/i,
 coal:/\b(?:batubara|batu\s+bara|coal|lignite|hba|rkab|iupk|pkp2b|pltu|minerba|ptba|kpc|kideco)\b/i,
 nre:/\b(?:renewables?|clean\s+energy|energi\s+terbarukan|ebtke|biofuels?|biodiesel|bioetanol|bioethanol|b40|b50|plts|plta|pltp|pltb|geothermal|hydropower|solar\s+(?:pv|panel|power|farm)|wind\s+(?:power|farm|turbine)|battery\s+storage|green\s+hydrogen|energy\s+storage|bess)\b/i,
 electricity:/\b(?:pln|listrik|electricity|power\s+(?:grid|outage|plant)|blackout|pemadaman|transmission|pltu)\b/i
};
function sectorsOf(item,scope){
 const explicit=Array.isArray(item?.sector_tags)?item.sector_tags.filter(k=>SECTORS.some(s=>s.id===k&&k!=="all")):[];
 if(explicit.length)return [...new Set(explicit)];
 if(item?.sector&&SECTORS.some(s=>s.id===item.sector))return [item.sector];
 const preset=scope==="domestic"?domestic:geopolitical;
 const key=scope==="domestic"?(item?.topic_id||""):(item?.topic_id||item?.topic||"");
 const predefined=preset[key];
 if(predefined&&key!=="projects"&&key!=="policy")return predefined;
 const title=String(item?.title||"");
 const detected=["oil_gas","coal","nre","electricity"].filter(key=>patterns[key].test(title));
 return detected.length?detected:["cross_cutting"];
}
function matches(item,sector,scope){return sector==="all"||sectorsOf(item,scope).includes(sector)}
function label(id){const x=SECTORS.find(z=>z.id===id);return (window.SLIi18n?.language==="id"?x?.idn:x?.en)||id}
function counts(items,scope){return Object.fromEntries(SECTORS.map(s=>[s.id,s.id==="all"?items.length:items.filter(x=>matches(x,s.id,scope)).length]))}
function makeControls(root,items,scope,change){
 root.replaceChildren();
 root.setAttribute("role","group");
 root.setAttribute("aria-label",window.SLIi18n?.language==="id"?"Filter sektor pemantauan energi":"Energy news sector filters");
 const bar=document.createElement("div");bar.className="sli-sector-bar";
 const count=counts(items,scope);let value="all";
 for(const sector of SECTORS){
  const b=document.createElement("button");b.type="button";b.className="sli-sector-tab"+(sector.id==="all"?" active":"");
  b.setAttribute("aria-pressed",String(sector.id==="all"));b.dataset.sector=sector.id;
  const name=document.createElement("span");name.textContent=label(sector.id);
  const number=document.createElement("strong");number.textContent=String(count[sector.id]);
  b.append(name,number);
  b.addEventListener("click",()=>{
   value=sector.id;
   for(const el of bar.children){const active=el.dataset.sector===value;el.classList.toggle("active",active);el.setAttribute("aria-pressed",String(active))}
   change(value);
  });bar.append(b);
 }
 root.append(bar);
 const info=document.createElement("p");info.className="sli-sector-note";
 info.textContent=window.SLIi18n?.language==="id"
  ?"Angka menunjukkan headline tersimpan per sektor (sebagian multi-sektor), bukan total peristiwa terverifikasi. Angka nol bukan bukti tidak ada perkembangan."
  :"Counts reflect saved attributed headlines (some cross-tagged), not verified incidents. Zero means no qualifying saved leads, not zero sector developments.";
 root.append(info);
 return {get value(){return value},set value(v){const b=Array.from(bar.children).find(x=>x.dataset.sector===v);if(b)b.click()}};
}
function badges(item,scope){
 const result=document.createElement("span");result.className="sli-sector-badges";
 for(const id of sectorsOf(item,scope).slice(0,3)){
  const badge=document.createElement("span");badge.className="sli-sector-badge";
  badge.textContent=label(id);result.append(badge);
 }
 return result;
}
window.SLIEnergyNews={SECTORS,sectorsOf,matches,label,counts,makeControls,badges};
})();
