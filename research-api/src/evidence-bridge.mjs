/* Deterministic cross-sector evidence bridging. Not an embedding model or live web search. */
const norm=s=>String(s??"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const groups={
 investment:["investasi","investment","pmtb","capital formation","bkpm"],
 electricity:["listrik","electricity","power","pln","grid","electrification","kelistrikan"],
 inequality:["gini","inequality","ketimpangan"],
 economic_growth:["pdrb","grdp","gdp","pertumbuhan ekonomi","economic growth"],
 ai:["data center","data centre","gpu","ai infrastructure","pusat data"],
 mineral:["nikel","nickel","smelter","mineral","hilirisasi"],
 water:["air bersih","water availability","water supply","industrial water"]
};
function themes(s){const n=" "+norm(s)+" ";return Object.entries(groups).filter(([,terms])=>terms.some(t=>n.includes(" "+norm(t)+" "))).map(([k])=>k)}
const edges={investment:["electricity","economic_growth","inequality","mineral","ai"],ai:["electricity","water","investment"],mineral:["electricity","investment","water"],economic_growth:["investment","inequality"],electricity:["ai","mineral","investment"],inequality:["economic_growth","investment"]};
export function bridgeEvidence(question,docs,limit=6){
 const qThemes=themes(question);
 const cited=(Array.isArray(docs)?docs:[]).filter(d=>d&&typeof d.id==="string"&&typeof d.source_url==="string"&&/^https:\/\//.test(d.source_url));
 const chosen=[];const used=new Set();
 for(const d of cited){
  const dThemes=themes(d.topic+" "+d.title+" "+String(d.text||"").slice(0,300));
  const shared=dThemes.filter(t=>qThemes.includes(t));
  const linked=dThemes.filter(t=>qThemes.some(q=>(edges[q]||[]).includes(t)));
  if(!shared.length&&!linked.length)continue;
  const k=d.id;if(used.has(k))continue;used.add(k);
  chosen.push({id:k,source_url:d.source_url,matched:shared,bridges:linked,score:shared.length*3+linked.length});
 }
 return chosen.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,limit);
}
export function vetOsintRecord(item){
 if(!item||typeof item!=="object"||typeof item.title!=="string"||typeof item.publisher!=="string"||typeof item.published_at!=="string")return null;
 let url;try{url=new URL(item.url)}catch{return null}
 if(url.protocol!=="https:"||url.username||url.password||/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(url.hostname))return null;
 const date=new Date(item.published_at);if(!Number.isFinite(date.getTime())||date.getTime()>Date.now()+86400000)return null;
 return {title:item.title.slice(0,240),publisher:item.publisher.slice(0,100),url:url.href,published_at:date.toISOString(),verification:"external_claim_unverified_pending_primary_source"};
}
