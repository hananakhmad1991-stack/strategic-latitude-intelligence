/* SLI Policy question-to-evidence workspace.
 * This is deterministic retrieval from the dated SLI legal graph, NOT a legal LLM.
 * Only Research AI's separately authenticated backend can generate model answers.
 */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const encode=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=s=>String(s??"").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const stop=new Set("apa saja yang untuk dengan dari pada atau dalam apakah bagaimana adalah oleh saya ingin akan bisa perlu tentang serta terkait jika dan di ke ini itu suatu ada menurut tolong jelaskan peraturan regulasi kebijakan hukum indonesia berlaku terbaru tahun undang nomor no pp uu permen perpres peraturan minta".split(" "));
const aliases=[
 {terms:["pusat data","data center","komputasi","cloud","ai","kecerdasan buatan","digital","pdp","siber"], add:["digital","data","privacy","information","ai"]},
 {terms:["listrik","pln","power","energi","ebt","nze","tenaga surya"],add:["energy","electricity","power","esdm","grid"]},
 {terms:["investasi","investor","penanaman modal","pma","perizinan","oss","insentif"],add:["investment","investasi","oss","bkpm","permit"]},
 {terms:["iklim","paris","emisi","karbon","lingkungan","ndc","amdal"],add:["climate","carbon","environment","paris","amdal"]},
 {terms:["daerah","otonomi","perda","rtrw","rdtr","tata ruang"],add:["region","spatial","daerah","rtrw","otonomi"]},
 {terms:["tambang","batubara","nikel","minerba","smelter","mineral"],add:["minerba","mineral","mining","industry"]},
 {terms:["pangan","beras","irigasi","pertanian"],add:["food","pangan","water","agriculture"]}
];
const regularStatuses=new Set(["enacted","amended","amending_instrument","repealed","check_current","transition_review","listed_active_review_alignment"]);
const statusLabel={enacted:"Tercatat diundangkan; cek perubahan lanjutan",amended:"Aturan dasar sudah mengalami perubahan",amending_instrument:"Instrumen pengubah",repealed:"Tercatat dicabut dalam indeks",check_current:"Status terkini perlu diverifikasi",transition_review:"Ketentuan transisi perlu diverifikasi",listed_active_review_alignment:"Terdaftar; kesesuaian perlu ditinjau"};
let corpus=null, lastQuestion="", conversation=[];
function keywords(q){
 const n=norm(q), items=new Set(n.split(" ").filter(w=>w.length>2&&!stop.has(w)));
 for(const a of aliases)if(a.terms.some(t=>n.includes(norm(t))))a.add.forEach(t=>items.add(t));
 return [...items];
}
function places(q){
 const n=norm(q);
 if(n.includes("batam"))return ["kepulauan riau","batam"];
 if(n.includes("bekasi"))return ["jawa barat","bekasi"];
 if(n.includes("semarang"))return ["jawa tengah","semarang"];
 const candidates=[...new Set((corpus?.nodes||[]).map(n=>norm(n.region)).filter(x=>x&&x!=="indonesia"&&x!=="internasional"))].sort((a,b)=>b.length-a.length);
 return candidates.filter(x=>n.includes(x));
}
function rank(q){
 const words=keywords(q), area=places(q), full=norm(q);
 const legalId=(q.match(/\b(UU|PP|Perpres|Permen(?:\s+[A-Za-z]+)?|Perda)\s*(?:No\.?|Nomor)?\s*(\d+)\s*[/\-]\s*((?:19|20)\d{2})/i)||[]);
 const refKey=legalId.length?norm(legalId[1]+" "+legalId[2]+" "+legalId[3]):"";
 const nodes=corpus.nodes.filter(n=>n.kind!=="tier_marker"&&n.status!=="not_applicable"&&n.source&&/^https:\/\//i.test(n.source));
 return nodes.map(n=>{
  const region=norm(n.region||"indonesia");
  const domestic=region==="indonesia"||!region;
  const compatible=!area.length||domestic||area.some(p=>region.includes(p)||p.includes(region));
  if(!compatible)return null;
  const ref=norm(n.ref), title=norm(n.label), description=norm([n.note,n.sector,n.owner,...(n.topics||[])].join(" "));
  let score=0,matches=[];
  for(const w of words){
   if(ref.split(" ").includes(w)){score+=9;matches.push(w);}
   else if(title.split(" ").includes(w)){score+=6;matches.push(w);}
   else if(title.includes(w)){score+=3;matches.push(w);}
   else if(description.includes(w)){score+=2;matches.push(w);}
  }
  const flattened=(s)=>s.replace(/\s+/g,"");
  if(refKey&&flattened(ref).includes(flattened(refKey))){score+=95;matches.push("nomor peraturan");}
  if(words.length===0&&n.tier==="uu")score+=1;
  if(area.length&&area.some(p=>region.includes(p))&&!domestic)score+=11;
  if(n.tier==="technical"||n.kind==="requirement")score-=5;
  if(n.status==="archival_not_verified")score-=7;
  if(full.includes("paris")&&n.id==="uu16paris")score+=36;
  if(full.includes("otonomi")&&n.id==="uu23local")score+=30;
  return {n,score,matches};
 }).filter(x=>x&&x.score>0).sort((a,b)=>b.score-a.score||String(b.n.verified_at||"").localeCompare(String(a.n.verified_at||""))||a.n.ref.localeCompare(b.n.ref)).slice(0,8);
}
function relations(n){
 const links=corpus.edges.filter(e=>e.from===n.id||e.to===n.id).slice(0,8);
 const map=new Map(corpus.nodes.map(x=>[x.id,x]));
 return links.map(e=>({e,other:map.get(e.from===n.id?e.to:e.from)})).filter(x=>x.other);
}
function buildPrompt(q,selected){
 const refs=selected.slice(0,6).map((x,i)=>(i+1)+". "+x.n.ref+" — "+x.n.label+" ("+x.n.source+"); status pada indeks SLI: "+x.n.status+"; pemeriksaan: "+(x.n.verified_at||"belum dicatat")).join("\n");
 return [
  "Analisis pertanyaan kebijakan dan regulasi berikut secara kritis dalam bahasa Indonesia: "+q,
  "Gunakan hanya bukti yang benar-benar tersedia di corpus model yang telah diverifikasi. Daftar berikut hanyalah petunjuk penelusuran SLI (bukan dokumen hukum yang telah diperiksa model):",
  refs||"Belum ada dokumen terkait dalam indeks; jangan menyimpulkan tidak ada hukum yang mengaturnya.",
  "Jangan mengutip nomor pasal, menegaskan status berlaku, menentukan perizinan/insentif, atau menyatakan patuh/tidak patuh tanpa membaca sumber primer. Pisahkan temuan yang didukung sitasi dari hipotesis dan pertanyaan terbuka. Jelaskan perubahan aturan dan kewenangan lembaga hanya jika rujukan mendukung. Sebutkan kekosongan bukti dan rekomendasikan verifikasi JDIH resmi."
 ].join("\n\n").slice(0,4800);
}
function render(q,selected){
 const list=$("paEvidence"), summary=$("paSummary"), open=$("paOpenResearch");
 if(!selected.length){
 summary.textContent="Belum ada kecocokan kuat di indeks terkurasi. Ini bukan bukti ketiadaan aturan. Periksa JDIH dan sumber resmi.";list.innerHTML="";
 }else{
  summary.textContent=selected.length+" rujukan paling relevan dari "+corpus.nodes.length+" entri indeks. Ini penelusuran berbasis kata kunci dan relasi, bukan analisis hukum generatif atau pemeriksaan pasal secara otomatis.";
  list.innerHTML=selected.map((item,i)=>{
   const n=item.n,linked=relations(n).filter(x=>["amended_by","amends","repeals","partially_repealed_by","specific_provision_amended_by"].includes(x.e.type));
   const s=statusLabel[n.status]||"Status kategori khusus: "+n.status;
   return '<article class="pa-result"><div class="pa-result-top"><span>Rujukan '+(i+1)+'</span><span>'+encode(n.region||"Indonesia")+'</span></div>'+
    '<h3>'+encode(n.ref)+'</h3><p class="pa-doc-title">'+encode(n.label)+'</p>'+
    '<p class="pa-legal-status">'+encode(s)+'</p>'+
    '<p>'+encode(n.note||"Lihat sumber resmi untuk ruang lingkup hukum.")+'</p>'+
    (linked.length?'<p class="pa-relations">Relasi perubahan terindeks: '+linked.map(x=>encode(x.other.ref)).join("; ")+'</p>':'<p class="pa-relations">Belum tercatat relasi perubahan; status harus dicek pada sumber resmi.</p>')+
    '<div class="pa-result-links"><a href="./policy-regulatory-intelligence.html?law='+encodeURIComponent(n.id)+'">Lihat hubungan aturan →</a><a target="_blank" rel="noopener noreferrer" href="'+encode(n.source)+'">Sumber resmi ↗</a></div></article>';
  }).join("");
 }
 open.disabled=false;open.dataset.prompt=buildPrompt(q,selected);
}
function ask(q){
 const question=String(q||"").trim().slice(0,1200);
 if(question.length<8){$("paSummary").textContent="Masukkan pertanyaan minimal delapan karakter.";return}
 if(!corpus){$("paSummary").textContent="Indeks belum selesai dimuat. Coba lagi.";return}
 lastQuestion=question;
 conversation.push({role:"user",text:question});conversation=conversation.slice(-6);
 const found=rank(question);
 render(question,found);
 $("paConversation").textContent="Pertanyaan "+conversation.filter(x=>x.role==="user").length+" dalam sesi ini · Hasil selalu dihitung ulang dari registri SLI.";
 $("paAsk").value="";
 $("paEvidenceSection").hidden=false;
 $("paEvidenceSection").scrollIntoView?.({behavior:"smooth",block:"nearest"});
}
function init(){
 const form=$("paForm");if(!form)return;
 const go=$("paOpenResearch");go.disabled=true;
 form.addEventListener("submit",e=>{e.preventDefault();ask($("paAsk").value);});
 document.querySelectorAll("[data-pa-question]").forEach(b=>b.addEventListener("click",()=>{$("paAsk").value=b.dataset.paQuestion;ask(b.dataset.paQuestion)}));
 go.addEventListener("click",()=>{
  if(!lastQuestion)return;
  try{sessionStorage.setItem("sli-policy-research-handoff",JSON.stringify({version:1,created:Date.now(),prompt:go.dataset.prompt.slice(0,4800)}));}
  catch{navigator.clipboard?.writeText(go.dataset.prompt).catch(()=>{});}
  window.location.assign("./sli-research-ai.html");
 });
 fetch("./data/sli-policy-regulatory-graph-2026.json",{cache:"no-store"})
  .then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()})
  .then(j=>{
   if(!Array.isArray(j.nodes)||!Array.isArray(j.edges))throw Error("Format registri tidak lengkap");
   const ids=new Set(j.nodes.map(n=>n.id));
   if(ids.size!==j.nodes.length||j.edges.some(e=>!ids.has(e.from)||!ids.has(e.to)))throw Error("Relasi peraturan tidak konsisten");
   corpus=j;
   $("paReady").textContent="Indeks aktif · "+j.nodes.length+" entri · diperbarui "+(j.updated_at||"tanggal tidak tersedia");
   $("paAskButton").disabled=false;
   $("paAsk").disabled=false;
  }).catch(err=>{
   $("paReady").textContent="Indeks gagal dimuat: "+err.message;
   $("paSummary").textContent="Tidak dapat menyimpulkan status hukum dari data yang gagal dimuat.";
  });
}
document.addEventListener("DOMContentLoaded",init);
window.SLIPolicyEvidence=Object.freeze({version:"2026-10-19.1",type:"deterministic_legal_evidence_preview",generation_requires_authenticated_backend:true});
})();