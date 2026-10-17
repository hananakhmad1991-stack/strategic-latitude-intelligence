/* SLI Research AI conversational client.
   Does not claim AI is active without an explicit, controlled backend configuration.
   Never embeds credentials, handles sources as untrusted text, never stores chat locally.
*/
(()=>{"use strict";
const $=id=>document.getElementById(id);
const MESSAGES={id:{
 inactive:"Layanan Research AI generatif belum diaktifkan. Ini adalah antarmuka penelitian, bukan model yang sudah terhubung. Untuk saat ini, gunakan Evidence Preview; Research AI penuh membutuhkan akun Pro/Enterprise dan backend privat.",
 missing:"Login Pro/Enterprise yang terverifikasi belum tersedia. Tidak ada permintaan yang dikirim ke layanan AI.",
 invalid:"Koneksi AI belum dikonfigurasi dengan aman. Hubungi pengelola SLI.",
 busy:"Sedang menyiapkan analisis berdasarkan dokumen terkurasi...",
 requestFail:"Permintaan AI belum berhasil. Jawaban tidak dibuat. Silakan coba lagi saat layanan tersedia.",
 ready:"Backend Research AI dikonfigurasi; akses membutuhkan login Pro/Enterprise.",
 prelaunch:"Layanan generatif belum aktif · Research AI Prototype",
 copied:"Hasil analisis disalin.", copyFail:"Salin teks tidak diizinkan browser.",
 user:"Instruksi riset", assistant:"SLI Research AI · Analisis bersumber", system:"Status layanan", source:"Sumber",
 example:"Gunakan sebagai instruksi", noSources:"Tidak ada sumber yang diberikan oleh layanan.", caution:"Periksa fakta dan publikasi asli sebelum menggunakan hasil ini."
},en:{
 inactive:"The generative Research AI service is not active. This is a research assistant interface, not a connected AI model. The separate Evidence Preview is available; full Research AI needs Pro/Enterprise access and a private backend.",
 missing:"Verified Pro/Enterprise login is not yet available. No request was sent to an AI provider.",
 invalid:"The AI service has not been securely configured. Contact the SLI administrator.",
 busy:"Preparing source-grounded research...",
 requestFail:"The research request failed. No answer was generated. Please try again once service is available.",
 ready:"Research AI backend configured; verified Pro/Enterprise login required.",
 prelaunch:"Generative service inactive · Research AI Prototype",
 copied:"Research answer copied.", copyFail:"Browser clipboard not available.",
 user:"Research instruction",assistant:"SLI Research AI · Sourced assessment",system:"Service status",source:"Source",
 example:"Use as research prompt",noSources:"No sources were returned by the service.",caution:"Verify important facts and primary publications."
}};
const PROMPTS={
 energy:{mode:"executive_summary",id:"Buat executive summary komprehensif tentang ketahanan energi Indonesia berdasarkan data terbaru yang tersedia di SLI. Bahas produksi migas, kebutuhan impor, subsidi BBM dan listrik, transisi energi, risiko geopolitik jalur perdagangan, ketahanan pasokan, serta rekomendasi kebijakan dan implikasi investasi. Pisahkan data terverifikasi, analisis dan ketidakpastian. Sertakan sitasi dan tanggal data.",en:"Create a source-grounded executive summary of Indonesia's energy security. Assess oil and gas production, import dependence, fuel and electricity subsidies, energy transition, geopolitical shipping risks, supply resilience and strategic investment implications. Distinguish verified observations from inference and uncertainty, with dated citations."},
 ai:{mode:"deep_research",id:"Lakukan riset mendalam mengenai prospek pembangunan AI data center Indonesia hingga 2030. Analisis proyek investor utama, kapasitas rencana versus kapasitas beroperasi, kebutuhan listrik dan pendinginan, Batam versus Jawa Barat, insentif, tantangan regulasi, kelayakan investasi dan peluang kerja sama Korea Selatan. Buat analisis menyeluruh dengan sumber, bukan daftar berita.",en:"Conduct an in-depth research assessment of Indonesia's AI data center prospects through 2030. Analyse investor project pipeline, planned versus operational capacity, power and cooling constraints, Batam versus West Java, investment incentives, regulation and Korean cooperation. Provide an evidence-backed report, not a list of links."},
 province:{mode:"comparative_analysis",id:"Bandingkan Jawa Tengah dan Jawa Barat untuk investasi industri dan data center. Gunakan pertumbuhan PDRB, PMTB, konsumsi rumah tangga, ketimpangan pengeluaran, infrastruktur energi, bukti proyek, risiko izin dan tenaga kerja. Jelaskan perbedaan periode statistik, peluang sektoral, keterbatasan data, dan pertanyaan due diligence yang harus dijawab investor. Hindari mencampur data kedua provinsi.",en:"Compare Central Java and West Java for industrial and data center investment using GRDP growth, capital formation, household spending, expenditure inequality, energy infrastructure, project milestones and due diligence risks. Keep the regions and reporting periods strictly separate, and explain what the evidence cannot establish."},
 mineral:{mode:"risk_opportunity",id:"Susun Risk & Opportunity Assessment mengenai mineral kritis dan hilirisasi Indonesia, khususnya nikel, tembaga dan rantai nilai baterai. Evaluasi cadangan dan kapasitas, pelaksanaan smelter, pengaruh investor asing, energi, ESG, geopolitik rantai pasok, insentif, risiko regulasi, dan skenario hingga 2030. Cantumkan sumber data dan rekomendasi strategis yang bisa diuji.",en:"Prepare a risk and opportunity assessment of Indonesia's critical minerals downstreaming, focusing on nickel, copper and batteries. Evaluate project implementation, foreign investors, energy, ESG exposure, geopolitical supply chains, incentives, legal uncertainties and scenario assumptions to 2030, with evidence and verifiable recommendations."}
};
const state={language:"id",config:null,history:[],lastResult:null,busy:false,sequence:0};
function tr(key){return MESSAGES[state.language][key]||key}
function node(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x}
function safeUrl(url){try{const u=new URL(url);return u.protocol==="https:"?u.href:null}catch{return null}}
function status(text,level="warning"){$("raNotice").textContent=text;$("raNotice").dataset.level=level}
function enableControls(){const hasResult=!!state.lastResult;$("raCopy").disabled=!hasResult;$("raExport").disabled=!hasResult;$("raSend").disabled=state.busy}
function isConfigured(){
 const c=state.config;
 return c?.schema==="sli-research-assistant-config-v1"&&c.api_enabled===true&&c.login_enabled===true&&c.generation_status==="enabled"&&!!safeUrl(c.api_endpoint||"");
}
function selectPrompt(key){
 const prompt=PROMPTS[key];if(!prompt)return;
 $("raPrompt").value=prompt[state.language];$("raMode").value=prompt.mode;
 $("raPrompt").focus();$("raPrompt").scrollIntoView({behavior:"smooth",block:"center"});
}
function append(role,text){
 $("raConversation").hidden=false;
 const box=node("article","sli-ra-message");box.dataset.role=role;
 box.append(node("div","sli-ra-msg-meta",role==="user"?tr("user"):role==="assistant"?tr("assistant"):tr("system")));
 const body=node("div","sli-ra-msg-text");
 box.append(body);$("raMessages").append(box);
 if(role==="assistant")renderMarkdown(text,body);else body.textContent=text;
 return body;
}
function renderParagraph(text,where){
 // Only numbered citations become links to the separately rendered, validated source references.
 const p=node("p");const parts=String(text).split(/(\[\d+\])/g);
 for(const piece of parts){
  const m=/^\[(\d+)\]$/.exec(piece);
  if(m&&state.lastResult?.sources?.[Number(m[1])-1]){
   const evidence=state.lastResult.sources[Number(m[1])-1];
   const a=node("a",null,piece);a.href=safeUrl(evidence.source_url)||"#raSourcesPanel";a.target="_blank";a.rel="noopener noreferrer";a.title=evidence.title||tr("source");p.append(a);
  } else p.append(document.createTextNode(piece));
 }
 where.append(p);
}
function renderMarkdown(text,where){
 where.replaceChildren();
 let bullets=null;
 for(const line of String(text||"").slice(0,24000).split("\n")){
  const clean=line.trim();
  if(!clean){bullets=null;continue}
  const h=/^(#{1,4})\s+(.+)$/.exec(clean);
  if(h){bullets=null;where.append(node("h3",null,h[2]));continue}
  const bullet=/^(?:[-*]|\d+\.)\s+(.+)$/.exec(clean);
  if(bullet){if(!bullets){bullets=node("ul");where.append(bullets)}const li=node("li");renderParagraph(bullet[1],li);bullets.append(li);continue}
  bullets=null;renderParagraph(clean,where);
 }
}
function renderSources(sources){
 const list=$("raSourcesList");list.replaceChildren();
 const valid=Array.isArray(sources)?sources.slice(0,12):[];
 if(!valid.length){list.append(node("p",null,tr("noSources")));return}
 valid.forEach((s,i)=>{
  const card=node("div","sli-ra-source-card");
  card.append(node("strong",null,"["+(i+1)+"] "+String(s.title||tr("source"))));
  card.append(node("p",null,[s.publisher,s.period,s.source_date].filter(Boolean).join(" · ")));
  const url=safeUrl(s.source_url||"");
  if(url){const a=node("a",null,state.language==="id"?"Buka sumber asli ↗":"Open original source ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";card.append(a)}
  list.append(card);
 });
}
function reset(){
 state.sequence++;state.history=[];state.lastResult=null;state.busy=false;
 $("raMessages").replaceChildren();$("raSourcesList").replaceChildren();$("raConversation").hidden=true;$("raPrompt").value="";
 enableControls();$("raPrompt").focus();
}
function makeExport(){
 if(!state.lastResult)return "";
 const last=state.lastResult,heading=state.language==="id"?"Laporan SLI Research AI":"SLI Research AI Report";
 const citations=last.sources.map((s,i)=>"["+(i+1)+"] "+String(s.title||"Source")+" — "+String(s.period||"n.d.")+" — "+String(s.source_url||"")).join("\n");
 return "# "+heading+"\n\n"+last.answer+"\n\n## "+(state.language==="id"?"Sumber":"Sources")+"\n"+citations+
 "\n\n"+(state.language==="id"?"Dihasilkan oleh layanan AI; sumber tetap harus diverifikasi.":"AI-assisted draft; verify all original sources.")+"\n";
}
async function submit(){
 const question=$("raPrompt").value.trim(),mode=$("raMode").value;
 if(question.length<6||question.length>5000){status(state.language==="id"?"Tuliskan instruksi 6–5000 karakter.":"Enter an instruction with 6–5000 characters.");return}
 if(state.busy)return;
 const id=++state.sequence;
 append("user",question);$("raPrompt").value="";
 if(!isConfigured()){append("system",tr("inactive"));status(tr("prelaunch"));return}
 let bearer;
 try{bearer=await window.SLIResearchAuth?.getAccessToken?.()}catch{bearer=null}
 if(!bearer||typeof bearer!=="string"){append("system",tr("missing"));status(tr("missing"));return}
 state.busy=true;enableControls();
 const loading=append("system",tr("busy"));
 const requestBody={question,mode,language:state.language,history:state.history.slice(-8)};
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),60000);
 try{
  const response=await fetch(state.config.api_endpoint,{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer "+bearer},body:JSON.stringify(requestBody),cache:"no-store",signal:controller.signal});
  const payload=await response.json().catch(()=>null);
  if(id!==state.sequence)return;
  if(!response.ok)throw Error(payload?.error||"HTTP "+response.status);
  if(!payload||typeof payload.answer!=="string"||payload.mode!=="generative_rag"||!Array.isArray(payload.sources))throw Error("invalid_response");
  loading.parentNode?.remove();
  state.lastResult={answer:payload.answer,sources:payload.sources,question,mode};
  append("assistant",payload.answer);
  renderSources(payload.sources);
  state.history.push({role:"user",content:question},{role:"assistant",content:payload.answer.slice(0,5000)});
  state.history=state.history.slice(-8);
  status(tr("ready"),"ready");
 }catch(err){
  if(id===state.sequence){loading.parentNode?.remove();append("system",tr("requestFail")+" ("+String(err?.message||"unavailable").slice(0,75)+")");status(tr("requestFail"))}
 }finally{
  clearTimeout(timeout);if(id===state.sequence){state.busy=false;enableControls();}
 }
}
function switchLang(){
 state.language=state.language==="id"?"en":"id";document.documentElement.lang=state.language;
 document.querySelectorAll("[data-id][data-en]").forEach(el=>el.textContent=el.getAttribute("data-"+state.language));
 $("raLang").textContent=state.language==="id"?"EN / ID":"ID / EN";
 $("raPrompt").placeholder=state.language==="id"?"Contoh: Buat executive summary ketahanan energi Indonesia dengan sitasi dan implikasi investasi.":"Example: Write an executive summary of Indonesia's energy security with citations and investment implications.";
 if(!isConfigured())status(state.language==="id"?(state.config?.published_notice_id||tr("prelaunch")):(state.config?.published_notice_en||tr("prelaunch")));
}
async function init(){
 $("raAssistantForm").addEventListener("submit",e=>{e.preventDefault();submit()});
 $("raLang").addEventListener("click",switchLang);
 $("raNew").addEventListener("click",reset);
 $("raCopy").addEventListener("click",async()=>{if(!state.lastResult)return;try{await navigator.clipboard.writeText(makeExport());status(tr("copied"),"ready")}catch{status(tr("copyFail"))}});
 $("raExport").addEventListener("click",()=>{if(!state.lastResult)return;const file=new Blob([makeExport()],{type:"text/markdown;charset=utf-8"});const url=URL.createObjectURL(file);const a=node("a");a.href=url;a.download="SLI-research-brief.md";document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url)});
 document.querySelectorAll("[data-template]").forEach(b=>b.addEventListener("click",()=>selectPrompt(b.dataset.template)));
 enableControls();
 try{
  const r=await fetch("./data/sli-research-assistant-config.json",{cache:"no-store"});
  if(!r.ok)throw Error("config_http");
  state.config=await r.json();
  if(isConfigured()){$("raAccessLabel").textContent="Research AI · Pro / Enterprise";status(tr("ready"),"ready")}
  else {$("raAccessLabel").textContent="Research AI · Pre-launch";status(state.language==="id"?(state.config.published_notice_id||tr("prelaunch")):(state.config.published_notice_en||tr("prelaunch")))}
 }catch{status(tr("invalid"))}
}
document.addEventListener("DOMContentLoaded",init);
window.SLIResearchAssistant=Object.freeze({version:"2026-10-17",generation_requires_backend:true});
})();