/* SLI Marine & Fisheries · institutional hierarchy and functional accountability.
 * Source model: Perpres 112/2025 (amending 193/2024), Permen KP 2/2025.
 * Functional proximity NEVER implies statutory reporting lines.
 */
const DATA_URL=new URL("../data/sli-marine-governance.json",import.meta.url);
const isHttps=s=>typeof s==="string"&&/^https:\/\//.test(s);
export function validateMarineGovernance(data){
 const issues=[];
 if(data?.schema!=="sli-marine-governance-v1")issues.push("schema");
 const hierarchy=Array.isArray(data?.hierarchy)?data.hierarchy:[];
 const actors=Array.isArray(data?.actors)?data.actors:[];
 const groups=Array.isArray(data?.groups)?data.groups:[];
 const names=new Set();
 for(const x of [...hierarchy,...actors]){
  if(!x.id||names.has(x.id)||!x.label_id||!x.label_en||!x.role_id||!x.role_en||!isHttps(x.source))issues.push("invalid_or_duplicate_actor");
  names.add(x.id);
 }
 if(hierarchy.length<10||hierarchy.filter(x=>x.parent===null).length!==1)issues.push("hierarchy_incomplete");
 if(!hierarchy.some(x=>x.id==="djprl")||!hierarchy.some(x=>x.id==="djpkel"))issues.push("marine_structure_outdated");
 for(const h of hierarchy)if(h.parent!==null&&!names.has(h.parent))issues.push("unknown_hierarchy_parent");
 if(groups.length!==6||new Set(groups.map(x=>x.id)).size!==6)issues.push("functional_clusters");
 for(const g of groups){
  if(!g.label_id||!g.label_en||!g.issue_id||!g.issue_en||!Array.isArray(g.actor_ids)||g.actor_ids.length<2)issues.push("invalid_hub");
  for(const id of g.actor_ids||[])if(!names.has(id))issues.push("unknown_actor");
 }
 if(!Array.isArray(data?.legal_sources)||data.legal_sources.length<2||data.legal_sources.some(x=>!isHttps(x.url)))issues.push("legal_provenance");
 return {pass:issues.length===0,issues};
}
function el(id){return document.getElementById(id)}
function word(id,en){return document.documentElement.lang.toLowerCase().startsWith("en")?en:id}
function element(tag,cls,content){
 const node=document.createElement(tag);if(cls)node.className=cls;
 if(content!==undefined)node.textContent=content;return node;
}
function linkTo(url,title){
 const a=element("a","mf-governance-citation",title);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;
}
function actorLookup(data,id){return [...data.hierarchy,...data.actors].find(x=>x.id===id)}
function roleMeta(data,id){return data.hierarchy.some(x=>x.id===id)?"KKP / official hierarchy":"Cross-institution / analytical link"}
function profile(data,id,host,network=false,hub=null){
 const item=actorLookup(data,id);if(!host)return;host.replaceChildren();
 if(!item){host.append(element("p","mf-hint",word("Pilih satu lembaga.","Select an institution.")));return}
 host.append(element("h4","",word(item.label_id,item.label_en)));
 host.append(element("p","mf-governance-meta",word(network?"Koneksi fungsional · bukan hierarki":"Unit dalam bagan organisasi",(network?"Functional relationship · not a reporting line":"Organizational chart")+" · "+roleMeta(data,id))));
 host.append(element("p","",word(item.role_id,item.role_en)));
 if(hub){
  host.append(element("h4","",word("Ranah keterkaitan","Issue connection")));
  host.append(element("p","",word(hub.issue_id,hub.issue_en)));
  const ul=element("ul");
  for(const partner of hub.actor_ids.filter(x=>x!==id)){
   const row=element("li","",word(actorLookup(data,partner)?.label_id||partner,actorLookup(data,partner)?.label_en||partner));
   ul.append(row);
  }
  host.append(ul);
 }
 host.append(element("p","mf-hint",word("Profil sumber:", "Source profile:")));
 host.append(linkTo(item.source,word("Buka sumber resmi ↗","Open primary/official source ↗")));
 if(network)host.append(element("p","mf-hint",word("Tautan analitis tidak membuktikan hubungan hukum, kontrak, atau garis komando.","Analytical grouping is not evidence of legal authority, a contract or a command chain.")));
}
function makeActorButton(data,item,chosen,onClick,network=false){
 const b=element("button",network?"mf-network-actor":"mf-governance-node",word(item.label_id,item.label_en));
 b.type="button";b.dataset.mfEntity=item.id;b.setAttribute("aria-pressed",String(item.id===chosen()));
 if(!network)b.append(element("small","",item.id==="president"?"STATE":item.id==="kkp"?"MINISTRY":"KKP"));
 b.addEventListener("click",()=>onClick(item.id));
 return b;
}
function syncSelected(host,id){host?.querySelectorAll("[data-mf-entity]").forEach(n=>n.setAttribute("aria-pressed",String(n.dataset.mfEntity===id)))}
function renderHierarchy(data,selected,setSelected){
 const chart=el("mfHierarchyDiagram");if(!chart)return;chart.replaceChildren();
 const root=data.hierarchy.find(x=>x.parent===null),ministry=data.hierarchy.find(x=>x.id==="kkp");
 const stage1=element("div","mf-hierarchy-stage");stage1.append(makeActorButton(data,root,()=>selected(),setSelected));
 const stage2=element("div","mf-hierarchy-stage");stage2.append(makeActorButton(data,ministry,()=>selected(),setSelected));
 const stage3=element("div","mf-hierarchy-stage mf-hierarchy-stage--units");
 for(const unit of data.hierarchy.filter(x=>x.parent==="kkp"))stage3.append(makeActorButton(data,unit,()=>selected(),setSelected));
 chart.append(stage1,element("div","mf-hierarchy-connector"),stage2,element("div","mf-hierarchy-connector"),stage3);
 syncSelected(chart,selected());
 profile(data,selected(),el("mfHierarchyProfile"));
}
function renderNetwork(data,selected,setSelected){
 const chart=el("mfNetworkDiagram"),select=el("mfNetworkFilter"),input=el("mfNetworkQuery"),counter=el("mfNetworkCount");
 if(!chart||!select||!input)return;
 const query=input.value.trim().toLocaleLowerCase("id"),filter=select.value;
 chart.replaceChildren();let visible=0;
 for(const group of data.groups){
  if(filter!=="all"&&filter!==group.id)continue;
  const matches=group.actor_ids.map(id=>actorLookup(data,id)).filter(Boolean).filter(x=>
   !query||[x.label_id,x.label_en,x.role_id,x.role_en,group.label_id,group.label_en].some(v=>v.toLocaleLowerCase("id").includes(query)));
  if(!matches.length)continue;
  const hub=element("section","mf-network-hub"),h=element("h4","",word(group.label_id,group.label_en));
  hub.append(h,element("p","",word(group.issue_id,group.issue_en)));
  const list=element("div","mf-network-hub-list");
  for(const item of matches)list.append(makeActorButton(data,item,()=>selected(),id=>setSelected(id,group),true));
  visible+=matches.length;hub.append(list);chart.append(hub);
 }
 if(!visible)chart.append(element("p","mf-hint",word("Belum ada lembaga yang cocok dengan filter.","No matching institutions for this filter.")));
 if(counter)counter.textContent=word(visible+" kemunculan aktor · "+chart.querySelectorAll(".mf-network-hub").length+" klaster",visible+" actor entries · "+chart.querySelectorAll(".mf-network-hub").length+" clusters");
 syncSelected(chart,selected());
}
async function init(){
 if(!el("mfHierarchyDiagram"))return;
 try{
  const response=await fetch(DATA_URL,{cache:"no-store"});
  if(!response.ok)throw new Error("Governance source HTTP "+response.status);
  const data=await response.json(),checked=validateMarineGovernance(data);
  if(!checked.pass)throw new Error("Invalid institutional data: "+checked.issues.join(","));
  let selectedHierarchy="kkp",selectedNetwork="kkp",selectedHub=data.groups[0];
  const chooseHierarchy=id=>{selectedHierarchy=id;syncSelected(el("mfHierarchyDiagram"),id);profile(data,id,el("mfHierarchyProfile"))};
  const chooseNetwork=(id,hub)=>{selectedNetwork=id;selectedHub=hub;syncSelected(el("mfNetworkDiagram"),id);profile(data,id,el("mfNetworkProfile"),true,hub)};
  const select=el("mfNetworkFilter");
  for(const group of data.groups){const opt=element("option","",word(group.label_id,group.label_en));opt.value=group.id;select.append(opt)}
  const render=()=>{
   for(const opt of select.options){if(opt.value!=="all"){const g=data.groups.find(x=>x.id===opt.value);if(g)opt.textContent=word(g.label_id,g.label_en)}}
   renderHierarchy(data,()=>selectedHierarchy,chooseHierarchy);
   renderNetwork(data,()=>selectedNetwork,chooseNetwork);
   profile(data,selectedNetwork,el("mfNetworkProfile"),true,selectedHub);
  };
  select.addEventListener("change",()=>renderNetwork(data,()=>selectedNetwork,chooseNetwork));
  el("mfNetworkQuery").addEventListener("input",()=>renderNetwork(data,()=>selectedNetwork,chooseNetwork));
  document.addEventListener("sli:languagechange",render);
  new MutationObserver(changes=>{if(changes.some(x=>x.attributeName==="lang"))render()}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  render();
 }catch(e){
  const msg=word("Peta kelembagaan belum tersedia; struktur tidak direka.","Institutional map unavailable; no fabricated fallback.");
  for(const id of ["mfHierarchyDiagram","mfNetworkDiagram"])if(el(id))el(id).textContent=msg;
  console.error("[SLI Marine governance]",e);
 }
}
if(typeof document!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init()}
