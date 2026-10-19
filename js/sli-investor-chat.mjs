/* Optional chat settings and short-lived customer attachments.
 * Numeric modeling remains a separate validated engine; multimodal AI reading
 * alone NEVER constitutes a verified statistical or input-output calculation.
 */
import {METHODS} from "./sli-analytical-core.mjs";
export {METHODS};
export const LIMIT_BYTES=600000;
export const MAX_FILES=2;
export const UPLOAD_EXT=Object.freeze({
 pdf:{mime:"application/pdf",magic:"pdf",use:"document"},
 png:{mime:"image/png",magic:"png",use:"image"},
 jpg:{mime:"image/jpeg",magic:"jpeg",use:"image"},
 jpeg:{mime:"image/jpeg",magic:"jpeg",use:"image"},
 webp:{mime:"image/webp",magic:"webp",use:"image"},
 docx:{mime:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",magic:"zip",use:"document"},
 xlsx:{mime:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",magic:"zip",use:"document"},
 pptx:{mime:"application/vnd.openxmlformats-officedocument.presentationml.presentation",magic:"zip",use:"document"},
 csv:{mime:"text/csv",magic:"text",use:"text"},
 txt:{mime:"text/plain",magic:"text",use:"text"},
 json:{mime:"application/json",magic:"text",use:"text"}
});
const exactExt=name=>String(name||"").toLowerCase().match(/\.([a-z0-9]{2,5})$/)?.[1]||"";
export function fileDefinition(name){return UPLOAD_EXT[exactExt(name)]||null}
export function recognizedFiles(files){
 if(files.length>MAX_FILES)throw Error("Maximum two files per research request.");
 let total=0;
 for(const file of files){
  const spec=fileDefinition(file.name);
  if(!spec||!/^[\w .()\-]{1,90}$/.test(file.name))throw Error("Unsupported or unsafe attachment filename/type: "+file.name);
  if(!Number.isSafeInteger(file.size)||file.size===0||file.size>LIMIT_BYTES)throw Error("File size must be 1–600 KB: "+file.name);
  total+=file.size;
 }
 if(total>LIMIT_BYTES*MAX_FILES)throw Error("File upload is too large");
 return true;
}
function signatureOk(a,magic){
 if(magic==="pdf")return a[0]===37&&a[1]===80&&a[2]===68&&a[3]===70&&a[4]===45;
 if(magic==="png")return a.slice(0,8).join(",")==="137,80,78,71,13,10,26,10";
 if(magic==="jpeg")return a[0]===255&&a[1]===216&&a[a.length-2]===255&&a[a.length-1]===217;
 if(magic==="webp")return new TextDecoder().decode(a.slice(0,4))==="RIFF"&&new TextDecoder().decode(a.slice(8,12))==="WEBP";
 if(magic==="zip")return a[0]===80&&a[1]===75&&a[2]===3&&a[3]===4;
 if(magic==="text")return !a.includes(0);
 return false;
}
export async function encodeAttachments(files){
 const list=[...files];recognizedFiles(list);
 const out=[];
 for(const file of list){
  const spec=fileDefinition(file.name),a=new Uint8Array(await file.arrayBuffer());
  if(!signatureOk(a,spec.magic))throw Error("File header mismatch: "+file.name);
  // String is kept in volatile JS memory until the authenticated owner request ends.
  let binary="";for(let i=0;i<a.length;i+=8192)binary+=String.fromCharCode(...a.subarray(i,i+8192));
  out.push({name:file.name,mime:spec.mime,size:a.length,kind:spec.use,base64:btoa(binary)});
 }
 return out;
}
export function validateOwnerAttachments(items){
 if(items===undefined)return [];
 if(!Array.isArray(items)||items.length>MAX_FILES)throw Error("invalid_attachments");
 let total=0;
 return items.map(f=>{
  if(!f||typeof f!=="object"||Array.isArray(f)||!fileDefinition(f.name)||
   !/^[\w .()\-]{1,90}$/.test(f.name)||typeof f.base64!=="string"||
   !/^[A-Za-z0-9+/]+={0,2}$/.test(f.base64)||f.base64.length>Math.ceil(LIMIT_BYTES/3)*4+4||
   !Number.isInteger(f.size)||f.size<1||f.size>LIMIT_BYTES)throw Error("invalid_attachment");
  const d=fileDefinition(f.name);
  if(f.mime!==d.mime||f.kind!==d.use)throw Error("invalid_attachment_type");
  const raw=atob(f.base64);
  if(raw.length!==f.size)throw Error("attachment_size_mismatch");
  const lead=new Uint8Array(Math.min(raw.length,12));
  for(let i=0;i<lead.length;i++)lead[i]=raw.charCodeAt(i);
  // JPEG requires only opening magic server-side; closing magic is checked in browser.
  if(!signatureOk(d.magic==="jpeg"?new Uint8Array([...lead,255,217]):lead,d.magic))
   throw Error("attachment_invalid_header");
  total+=f.size;
  if(total>LIMIT_BYTES*MAX_FILES)throw Error("attachment_total_limit");
  return {name:f.name,mime:d.mime,size:f.size,kind:d.use,base64:f.base64};
 });
}
export function buildOwnerFileParts(items){
 return validateOwnerAttachments(items).map(f=>{
  if(f.kind==="image")return {type:"input_image",image_url:"data:"+f.mime+";base64,"+f.base64,detail:"auto"};
  if(f.kind==="text"){
   const raw=atob(f.base64);const bytes=new Uint8Array(raw.length);
   for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
   const txt=new TextDecoder("utf-8",{fatal:true}).decode(bytes);
   return {type:"input_text",text:"UNVERIFIED USER ATTACHMENT: "+f.name+"\n"+txt.slice(0,14000)+
    (txt.length>14000?"\n[TRUNCATED: NOT THE FULL DATASET. No valid aggregate or model estimate can be calculated from this excerpt.]":"")};
  }
  return {type:"input_file",filename:f.name,file_data:"data:"+f.mime+";base64,"+f.base64};
 });
}
export function fillChatMethods(select){
 select.replaceChildren();
 const first=document.createElement("option");first.value="auto";first.textContent="AI pilih metode terbaik · Otomatis";select.append(first);
 for(const m of METHODS){
  const o=document.createElement("option");o.value=m.id;
  o.textContent=m.name+(m.status==="local"?" · mesin lokal":" · rancangan metode, belum dieksekusi");
  select.append(o);
 }
 return METHODS.length;
}
export function recommendInvestorMethod(question){
 const q=String(question||"").toLowerCase();
 // Explicit scientific-method request wins over generic sector keywords.
 // An available engine is NOT an executed estimator until the required input is supplied.
 const methodCues=[
  [/\b(?:difference[- ]in[- ]differences|difference in differences|did)\b/i,"did"],
  [/\b(?:location quotient|lq)\b/i,"lq"],
  [/\b(?:topsis)\b/i,"topsis"],
  [/\b(?:ordinary least squares|regresi linear sederhana|regresi linier sederhana|\bols\b)\b/i,"ols"],
  [/\b(?:shift[- ]share|shift share)\b/i,"shift_share"],
  [/\b(?:monte[- ]carlo|monte carlo)\b/i,"monte_carlo"]
 ];
 for(const [cue,id] of methodCues){
  if(!cue.test(q))continue;
  const method=METHODS.find(m=>m.id===id);
  const implemented=method?.status==="local";
  return {id,can_execute:implemented,reason:implemented?
   "Mesin lokal tersedia; hasil numerik hanya setelah input, asumsi dan uji kelayakan valid disediakan.":
   "Metode ada dalam katalog desain, tetapi estimator lokal belum tersedia. Jangan mengarang hasil perhitungan."};
 }
 if(/multiplier|pengganda|dampak ekonomi sektor|input.output|leontief/.test(q))
  return {id:"input_output",can_execute:false,reason:"Butuh tabel input-output resmi yang selaras sektor, wilayah, tahun, dan pengeluaran investasi."};
 if(/kilang|refinery|migas|terminal minyak|petrokimia/.test(q))
  return {id:"scenario",can_execute:false,reason:"Saring kapasitas, feedstock, logistik, utilitas, izin dan kebutuhan data; multiplier perlu tabel IO."};
 if(/ahp|prioritaskan lokasi|pilih lokasi/.test(q))
  return {id:"ahp",can_execute:true,reason:"AHP dapat dihitung bila bobot/perbandingan kriteria valid tersedia; hasil prioritas tergantung preferensi."};
 if(/panel|ekonometri|fixed.effect/.test(q))
  return {id:"panel_fe",can_execute:true,reason:"Hanya untuk dataset entitas-tahun berulang dan terverifikasi; hasil tidak otomatis kausal."};
 return {id:"auto",can_execute:false,reason:"AI membantu merancang metode, tetapi perhitungan hanya dilakukan pada mesin yang tersedia dengan data memadai."};
}
