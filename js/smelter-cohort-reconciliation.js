/* Critical Minerals — dated nickel vs ESDM smelter inventory reconciliation.
   These are NON-ADDITIVE source populations, NOT a claimed national 2026 census. */
(function(){
"use strict";
function element(tag,cls,value){const v=document.createElement(tag);if(cls)v.className=cls;if(value!==undefined&&value!==null)v.textContent=String(value);return v}
const mkLink=(url,title)=>{const a=element("a",null,title);a.href=url;a.rel=/^https:/.test(url)?"noopener noreferrer":"";if(/^https:/.test(url))a.target="_blank";return a};
const period=["Operating","Construction","Planned"];
function table(headers,rows){
 const t=element("table","sli-smelter-breakdown"),h=element("thead"),r=element("tr");
 headers.forEach(x=>r.append(element("th",null,x)));h.append(r);t.append(h);
 const b=element("tbody");
 rows.forEach(cells=>{const tr=element("tr");cells.forEach(x=>tr.append(element("td",null,x)));b.append(tr)});t.append(b);return t;
}
function build(root,data){
 const n=data.academic_nickel_baseline,old=data.official_2024,esdm=data.official_baseline;
 if(!n||!old||!esdm||n.reported!==147)throw Error("Source reconciliation is missing");
 const summary=element("div","sli-smelter-summary");
 const original=(data.records||[]).filter(x=>x.original_id).length;
 const legacyCount=19; // source-dated linked legacy facility registry (not a total of national smelters)
 for(const [k,v,desc] of [
  ["MARVES · NICKEL 2024",n.reported,"54 operating, 38 building, 55 planned"],
  ["ESDM · INTEGRATED 2024",old.reported,"6 operating / 9 in progress"],
  ["ESDM · INTEGRATED 2025",esdm.reported,"13 operating / 15 in process or planning"],
  ["NAMED FACILITY DOSSIERS",legacyCount+data.records.length-original,"Incomplete named-source registry, not national census"]
 ]){const card=element("article","sli-smelter-kpi");card.append(element("small",null,k),element("strong",null,v),element("p",null,desc));summary.append(card)}
 root.append(summary);
 const breakdown=element("div","sli-smelter-tables");
 const nickel=element("section","sli-smelter-table");
 nickel.append(element("h4",null,"Nickel projects · 2024 Marves snapshot (cited by IPB, 2025)"));
 nickel.append(table(["Process",...period,"Total"],[
  ...n.technology.map(x=>[x.name,x.operating,x.construction,x.planning,x.total]),
  ["Total",n.operation,n.construction,n.planning,n.reported]
 ]));breakdown.append(nickel);
 const smelt=element("section","sli-smelter-table");
 smelt.append(element("h4",null,"ESDM end-2025 integrated programme · multi-commodity"));
 smelt.append(table(["Commodity","Operating","Process/plan","Total"],(esdm.by_commodity||[]).map(x=>[x.commodity,x.operating,x.process_or_plan,x.total])));
 breakdown.append(smelt);root.append(breakdown);
 const methodology=element("p","sli-smelter-caveat","Interpretation: 147 is NOT the number operating in 2026. It is a late-2024 nickel-unit/project pipeline, including planned projects. ESDM 2024 (15) and ESDM 2025 (28) track specific integrated licence-related facilities across several metals; they are distinct administrative cohorts and cannot be added to 147 or directly compared as new plant completions. About 80% of nickel stand-alone smelters fell under industrial licensing per ESDM 2024. A named company, site or line is not automatically identical to one unit in the historical Marves count. Unverified plant GPS points remain unlocated or locality-only.");
 root.append(methodology);
 const refs=element("p","sli-smelter-source-links");
 refs.append(mkLink(n.source,"IPB journal / Marves 2024 ↗"),document.createTextNode(" · "),mkLink(old.source,"ESDM 2024 ↗"),document.createTextNode(" · "),mkLink(esdm.source,"ESDM 2025 ↗"),document.createTextNode(" · "),mkLink("#map","Open facility map ↗"));
 root.append(refs);
}
function mount(stage){
 if(!stage)return;
 const root=element("section","sli-research-section sli-smelter-inventory");
 root.id="sli-smelter-inventory";
 root.append(element("small","sli-research-num","SOURCE-RECONCILED INVENTORY"),
  element("h3",null,"Smelter Census vs Project Pipeline · 2024–2026"),
  element("p","sli-research-description","A dated national nickel pipeline and a much narrower ESDM regulated cohort must not be conflated."));
 const loading=element("p","sli-smelter-loading","Loading ESDM and IPB statistical inventory…");root.append(loading);stage.append(root);
 fetch("data/strategic-map-smelter-2026.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Smelter registry unavailable");return r.json()})
  .then(d=>{if(!root.isConnected)return;loading.remove();build(root,d)})
  .catch(()=>{loading.textContent="Verified smelter registry temporarily unavailable. Do not infer a 2026 operating total."});
}
window.initSLISmelterCohort=mount;
})();
