/* Source-dated, public SLI mineral evidence for Research AI; preserve distinct reporting bases. */
import usgs from "../../data/usgs-indonesia-minerals-2026.json" with {type:"json"};
import esdm from "../../data/esdm-2025-mineral-performance.json" with {type:"json"};
const docs=[];
const safe=s=>typeof s==="string"&&s.startsWith("https://");
function add(id,title,text,url,period,publisher){
 if(!safe(url)||!text)return;
 docs.push({id:"sli_mineral_"+id,title,text,source_url:url,source_date:String(period),period:String(period),publisher,geo:"Indonesia",topic:"minerals critical nickel cobalt tin reserves resources smelter processing mineral supply",access:"pro"});
}
for(const h of usgs.headline||[]){
 const source=usgs.sources.find(s=>s.id===h.source_id);
 if(!source)continue;
 add(h.id,h.label+" · "+String(h.year),h.label+": "+h.value+" "+h.unit+"; reference "+h.year+"; class "+h.kind+". "+h.note+" Source scope: "+source.scope,source.url,h.year,"U.S. Geological Survey");
}
add("esdm_supply_index","ESDM 2025 domestic mineral supply index","Official 2025 domestic mineral supply index: "+esdm.index.realized_2025+" versus target "+esdm.index.target_2025+". This ministry index is NOT an internationally comparable mineral reserve index. "+esdm.index.scope+" "+esdm.index.methodology_warning,esdm.source.url,esdm.reference_year,"Kementerian ESDM");
for(const p of esdm.processing||[]){
 add("processing_"+p.mineral.toLowerCase().replace(/[^a-z0-9]+/g,"_"),"ESDM mineral processing · "+p.mineral,"ESDM 2025 processing "+p.mineral+": actual processing ratio "+p.ratio_actual+"%; reported raw material "+p.material_tonnes+" "+p.unit+". "+(p.material_note||"")+" Reporting basis differs from USGS contained-metal reserves.",esdm.source.url,esdm.reference_year,"Kementerian ESDM");
}
export function nationalMineralEvidence(){return docs.map(x=>({...x}))}
