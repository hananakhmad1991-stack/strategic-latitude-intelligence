/* Pure SLI Research AI retrieval functions; no network or privileged data. */
export function normalize(input){
 return String(input??"").normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
}
const STOP=new Set("yang dengan dalam pada untuk dari dan atau apa how what why which when where does are about the and of for who indonesia data analysis analisis".split(" "));
export function queryTokens(input){return [...new Set(normalize(input).split(" ").filter(x=>x.length>1&&!STOP.has(x)))].slice(0,80)}
export function validateResearchQuestion(input){
 if(typeof input!=="string"||input.trim().length<6||input.length>500||/[\u0000-\u001F]/.test(input))return null;
 return input.trim()
}
export function rankEvidence(items,query,maxResults=8){
 if(!Array.isArray(items))return [];
 const terms=queryTokens(query);if(!terms.length)return [];
 const results=[];
 for(const d of items.slice(0,10000)){
  if(!d||typeof d.id!=="string"||!/^[-_a-zA-Z0-9]{2,90}$/.test(d.id)||typeof d.title!=="string"||typeof d.text!=="string"||typeof d.source_url!=="string"||!/^https:\/\//.test(d.source_url)||d.text.length>8000||d.access!=="pro"&&d.access!=="enterprise")continue;
  const title=normalize(d.title),content=normalize(d.text),sector=normalize(d.topic),region=normalize(d.geo),q=normalize(query);
  let score=0;
  for(const term of terms){if(title.includes(term))score+=5;if(content.includes(term))score+=1;if(sector.includes(term))score+=3;if(region.includes(term))score+=4}
  if(title.includes(q)&&q.length>5)score+=10;
  if(score>0)results.push({id:d.id,title:d.title,text:d.text.slice(0,1800),source_url:d.source_url,period:String(d.period||"not specified"),source_date:String(d.source_date||"not specified"),publisher:String(d.publisher||"source unspecified"),topic:String(d.topic||"") ,score});
 }
 return results.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,maxResults);
}
export function extractModelText(raw){
 if(!raw||!Array.isArray(raw.output))return "";
 return raw.output.filter(x=>x.type==="message"&&Array.isArray(x.content)).flatMap(x=>x.content.filter(p=>p.type==="output_text"&&typeof p.text==="string").map(p=>p.text)).join("\n").trim().slice(0,9000)
}
export function citationsValid(answer,evidence){
 if(!answer||!evidence?.length)return false;
 const found=[...answer.matchAll(/\[(\d+)\]/g)].map(m=>Number(m[1]));
 return found.length>0&&found.every(i=>Number.isInteger(i)&&i>=1&&i<=evidence.length);
}
