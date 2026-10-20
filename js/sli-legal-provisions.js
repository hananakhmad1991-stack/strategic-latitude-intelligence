/* Curated, source-anchored SLI legal provisions reader; NEVER current-law certification. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const ids={};
const official=new Set(["peraturan.go.id","www.peraturan.go.id","peraturan.bpk.go.id","jdih.tanjungpinangkota.go.id"]);
const normalize=s=>String(s||"").toLowerCase().normalize("NFKD").replace(/\s+/g," ").trim();
function valid(r){
 try{const u=new URL(r.source_url);return u.protocol==="https:"&&official.has(u.hostname)&&
  r.source_type==="official_promulgated_pdf"&&r.current_status_certified===false&&
  r.excerpt_kind==="reviewed_paraphrase_not_verbatim"&&/^Pasal\s+\d+[a-z]?$/i.test(r.article);}
 catch{return false}
}
function element(tag,cls,text){
 const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;
}
function render(items,lawFilter,keyword){
 const shown=items.filter(x=>(lawFilter==="all"||x.law_node_id===lawFilter)&&
   (!keyword||normalize([x.citation_label,x.excerpt_id,x.legal_effect_limit,x.research_topic].join(" ")).includes(normalize(keyword))));
 const host=$("policyProvisionList");host.replaceChildren();
 $("policyProvisionResult").textContent=shown.length+" ringkasan pasal · "+new Set(shown.map(x=>x.law_node_id)).size+
   " peraturan · hanya naskah asli saat pengundangan, bukan versi hukum terkonsolidasi.";
 if(!shown.length){host.append(element("p","policy-provision-empty","Belum ada pasal yang ditelaah untuk filter ini. Gunakan daftar regulasi dan buka JDIH resmi."));return}
 for(const x of shown){
  const card=element("article","policy-provision-card");
  card.append(element("strong","policy-provision-ref",x.citation_label));
  card.append(element("p","policy-provision-paraphrase",x.excerpt_id));
  const caution=element("p","policy-provision-caution","Batas tafsir: "+x.legal_effect_limit);
  card.append(caution);
  card.append(element("small","policy-provision-reviewed","Ringkasan editorial · diperiksa "+x.as_of+" · halaman: "+x.page_reference+" · status terbaru belum disertifikasi"));
  const links=element("div","policy-provision-actions");
  const source=element("a",null,"Buka PDF hukum resmi ↗");source.href=x.source_url;source.target="_blank";source.rel="noopener noreferrer";
  const dossier=element("a",null,"Lihat hubungan regulasi ↗");dossier.href="./policy-regulatory-intelligence.html?law="+encodeURIComponent(x.law_node_id);
  links.append(source,dossier);card.append(links);host.append(card);
 }
}
async function start(){
 const root=$("policyVerifiedProvisions");if(!root)return;
 const list=$("policyProvisionList"),status=$("policyProvisionResult");
 try{
  const r=await fetch("./data/sli-verified-legal-provisions.json",{cache:"no-store"});
  if(!r.ok)throw Error("HTTP "+r.status);
  const doc=await r.json();
  if(doc.schema!=="sli-legal-provisions-v1"||!Array.isArray(doc.items))throw Error("Format indeks pasal tidak cocok");
  const items=doc.items.filter(valid);
  if(items.length!==doc.items.length)throw Error("Salah satu rujukan pasal belum lulus pemeriksaan sumber");
  const ids=new Set(items.map(x=>x.id));if(ids.size!==items.length)throw Error("ID ringkasan pasal ganda");
  const lawKeys=[...new Set(items.map(x=>x.law_node_id))];
  const select=$("policyProvisionLaw");
  lawKeys.sort((a,b)=>a.localeCompare(b,"id"));
  for(const key of lawKeys){
   const option=element("option",null,items.find(x=>x.law_node_id===key).instrument_ref);
   option.value=key;select.append(option);
  }
  $("policyProvisionCount").textContent=items.length;
  select.addEventListener("change",()=>render(items,select.value,$("policyProvisionQuery").value));
  $("policyProvisionQuery").addEventListener("input",()=>render(items,select.value,$("policyProvisionQuery").value));
  render(items,"all","");
 }catch(error){
  status.textContent="Belum bisa memuat indeks pasal yang ditelaah: "+error.message;
  list.replaceChildren(element("p","policy-provision-empty","Tidak ada klaim hukum yang disajikan sebelum sumber dapat diperiksa."));
 }
}
document.addEventListener("DOMContentLoaded",start);
})();
