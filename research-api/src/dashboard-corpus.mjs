/* Source-dated dashboard evidence bridge.
 * Fetches a PUBLIC fixed-origin generated index, never a user URL or private dataset.
 * Updates over time as approved dashboard source records change; no model fine-tuning.
 * Strict source attribution and zero implicit promotion of legal/project claims.
 */
const PUBLIC_INDEX="https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/data/sli-research-unified-index.json";
const STOP=new Set("apa yang dan dengan untuk pada dari dalam agar apakah indonesia sepanjang tahun analisis perkembangan terbaru sumber serta data berdasarkan bagian atau atas the and for from this that show 2026 2025 2024 saja tentang hasil report proyek project latest investasi investment per serta tahun".split(" "));
function tokens(q){
 return [...new Set(String(q||"").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g," ").split(" ").filter(x=>x.length>2&&!STOP.has(x)))].slice(0,22);
}
export function selectDashboardEvidence(payload,question,limit=7){
 const docs=Array.isArray(payload?.records)?payload.records:[];
 const q=tokens(question);if(!q.length)return [];
 const target=/\bccs\b|\bccus\b|carbon captur|penyimpanan karbon/i.test(question)?"ccs":
  /data center|\bai\b|artificial intelligence|pusat data/i.test(question)?"ai":
  /nikel|nickel|tembaga|copper|mineral|smelter|bauksit|kobalt|timah/i.test(question)?"minerals":
  /perikanan|fisheries|fishery|nelayan|aquacult|rumput laut|seaweed|udang|shrimp|marine/i.test(question)?"marine":
  /pangan|pertanian|agricultur|food security|beras|gabah|padi|rice|gandum|wheat|bulog|bapanas|pupuk|fertilizer|swasembada|petani|hortikultur|horticultur|perkebunan|plantation|peternakan|livestock|pmdn|pma/i.test(question)?"food":
  /pln|listrik|kelistrikan|pembangkit|grid/i.test(question)?"power":
  /iklim|climate|banjir|flood|bencana|kehutanan|forestry/i.test(question)?"climate":null;
 const results=[];
 for(const d of docs.slice(0,1500)){
  if(!d||typeof d.title!=="string"||typeof d.text!=="string"||typeof d.source_url!=="string")continue;
  if(!/^https:\/\//.test(d.source_url)||!/^[a-z0-9_-]+$/i.test(String(d.id||"")))continue;
  const title=d.title.toLowerCase(),snippet=d.text.toLowerCase(),dataset=String(d.dataset||"").toLowerCase();
  let hits=0,primary=0;
  for(const w of q){
   if(title.includes(w)){hits+=9;primary++}
   if(dataset.includes(w)){hits+=6;primary++}
   if(snippet.includes(w))hits+=1;
  }
  if(target==="ccs"&&!(/ccs|ccus|carbon|sukowati|masela|tangguh|gundih|storage/.test(title+" "+dataset)))continue;
  if(target==="ai"&&!(/digital|ai-|ai_|data.center|cloud|compute|invest|power/.test(title+" "+dataset)))continue;
  if(target==="minerals"&&!(/mineral|nickel|nikel|copper|tembaga|smelter|tin|bauxite|bauksit/.test(title+" "+dataset)))continue;
  if(target==="power"&&!(/energy|pln|electric|listrik|power|ruptl|renewable/.test(title+" "+dataset)))continue;
  if(target==="food"&&!(/food|pangan|pertanian|agricultur|petani|beras|rice|bulog|bapanas|farmer|pupuk|ntp|fertili|hortikultur|horticultur|perkebunan|plantation|peternakan|livestock/.test(title+" "+dataset)))continue;
  if(target==="marine"&&!(/marine|fisher|perikanan|udang|shrimp|aquacult|rumput.laut|seaweed|kkp/.test(title+" "+dataset)))continue;
  if(hits<8||primary===0)continue;
  results.push({d,score:hits});
 }
 results.sort((a,b)=>b.score-a.score||a.d.id.localeCompare(b.d.id));
 const selected=[],files=new Set();
 for(const {d} of results){
  if(selected.length>=Math.max(1,Math.min(10,limit)))break;
  if(files.has(d.dataset)&&results.length>=limit*2)continue; // diversify dashboards
  const bpsLocator=d.dataset==="sli-bps-agri-horti-2026-source-register.json";
  selected.push({id:d.id,title:d.title,text:(bpsLocator?
   "BPS 2025/2026 SOURCE TABLE LOCATOR ONLY. No individual numeric cells are verified or commercially cleared for public reproduction; do not extract, quote, compute, aggregate or infer numeric figures from this catalog. Publisher search link is not an original PDF citation. "+
   d.text.slice(0,580):d.text.slice(0,900)),
   source_url:d.source_url,source_date:d.period,publisher:d.publisher||"Public dashboard",
   period:d.period,geo:"Indonesia",access:"pro",
   topic:bpsLocator?"source catalog reference only; numerical evidence unavailable":"public dashboard contextual evidence dated",
   source_type:"public_dashboard_source_record_not_claim_verified",
   verification_status:d.verification_status,
   numeric_claim_permitted:!bpsLocator,
   publication_rights_status:bpsLocator?"BPS_written_commercial_reproduction_permission_missing":"source_specific_rights_unchanged",
   dataset:d.dataset});
  files.add(d.dataset);
 }
 return selected;
}
export async function fetchDashboardEvidence(question,{enabled=true,fetcher=fetch,timeoutMs=2600}={}){
 if(!enabled)return {status:"disabled",documents:[],total_records:0,indexed_datasets:0};
 try{
  const result=await fetcher(PUBLIC_INDEX,{method:"GET",headers:{"accept":"application/json"},
    signal:AbortSignal.timeout(timeoutMs),cf:{cacheEverything:true,cacheTtl:900}});
  if(!result.ok)return {status:"http_"+result.status,documents:[],total_records:0,indexed_datasets:0};
  if(Number(result.headers?.get?.("content-length")||0)>1350000)return {status:"too_large",documents:[],total_records:0,indexed_datasets:0};
  const raw=await result.json();
  if(raw?.schema!=="sli-unified-research-index-v1"||!Array.isArray(raw.records)||raw.records.length>1400)
   return {status:"invalid_schema",documents:[],total_records:0,indexed_datasets:0};
  const documents=selectDashboardEvidence(raw,question);
  return {status:documents.length?"matched":"no_topic_match",documents,total_records:raw.coverage?.rows||raw.records.length,
    indexed_datasets:raw.coverage?.datasets_indexed||0};
 }catch(e){return {status:e?.name==="AbortError"?"timeout":"unavailable",documents:[],total_records:0,indexed_datasets:0}}
}
