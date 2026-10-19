import {METHODS,METHOD_FORMULAS} from "./sli-analytical-core.mjs?v=20261020-methods1";
const $=id=>document.getElementById(id);
const make=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node};
function render(){
 const term=$("methodSearch").value.trim().toLowerCase(),status=$("methodFilter").value;
 const active=METHODS.filter(m=>(status==="all"||m.status===status)&&
   [m.name,m.group,m.id,m.requires].join(" ").toLowerCase().includes(term));
 const list=$("modelList");list.replaceChildren();
 $("modelCounts").textContent=METHODS.length+" metode terdaftar · "+METHODS.filter(m=>m.status==="local").length+" executable lokal · "+METHODS.filter(m=>m.status==="design").length+" desain riset · "+active.length+" ditampilkan";
 for(const m of active){
  const art=make("article",undefined,"method"),head=make("h2",m.name),tag=make("span",m.status==="local"?"MESIN LOKAL":"DESAIN / BELUM DIHITUNG","tag "+m.status);
  art.append(head,tag,make("p",m.group+" · "+m.id,"meta"));
  const details=document.createElement("details");details.append(make("summary","Rumus, data, rujukan dan keterbatasan"));
  details.append(make("p","Persyaratan data: "+m.requires));
  const formula=METHOD_FORMULAS[m.id];
  if(formula){
   details.append(make("div",formula.formula,"formula"));
   const a=make("a","Referensi teknis / Method source ↗");a.href=formula.source;a.target="_blank";a.rel="noopener noreferrer";details.append(a);
  }else details.append(make("p","Metode tercatat untuk desain riset, namun estimator numerik belum diimplementasikan. Tidak ada hasil perhitungan otomatis."));
  details.append(make("p",m.status==="local"?"Hasil bergantung pada input, satuan, asumsi dan validasi sumber. Tidak membuktikan hubungan kausal.":"SLI Research AI hanya boleh menjelaskan rancangan, kebutuhan bukti dan keterbatasan; tidak boleh mengarang koefisien."));
  art.append(details);list.append(art);
 }
}
$("methodSearch").addEventListener("input",render);
$("methodFilter").addEventListener("change",render);
render();
