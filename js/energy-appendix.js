/* SLI Energy Security Appendix: searchable bilingual acronym and unit reference.
   Excludes this subtree from global glossary substitutions to preserve official acronyms and unit notation. */
(function(){
"use strict";
const ROOT_ID="energyAppendixRoot";
let cache=null,category="all",search="",expanded=new Set(["unit"]);
const lang=()=>window.SLIi18n?.language==="id"?"id":"en";
const T=(en,id)=>lang()==="id"?id:en;
function E(name,cls,text){
 const n=document.createElement(name);
 if(cls)n.className=cls;
 if(text!==undefined&&text!==null)n.textContent=String(text);
 return n;
}
function normalized(value){return String(value||"").toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").trim()}
function matches(row,term){
 if(!term)return true;
 return normalized([row.term,row.en,row.id,row.note_en,row.note_id].join(" ")).includes(normalized(term));
}
function resultCard(x){
 const item=E("div","esa-entry");
 const dt=E("dt","esa-term",x.term);
 const dd=E("dd","esa-meaning");
 dd.append(E("strong",null,lang()==="id"?x.id:x.en));
 const explanation=lang()==="id"?x.note_id:x.note_en;
 if(explanation)dd.append(E("p",null,explanation));
 item.append(dt,dd);return item;
}
function refresh(root,data){
 const oldFocus=root.querySelector(".esa-search")===document.activeElement;
 const from=oldFocus&&typeof document.activeElement.selectionStart==="number"?document.activeElement.selectionStart:null;
 root.replaceChildren();
 const intro=E("p","esa-intro",T(
 "A reader’s reference for agency abbreviations, regulatory instruments, technologies and units used across this dashboard. The meaning of each statistic still follows the cited original source.",
 "Panduan pembaca untuk singkatan lembaga, instrumen kebijakan, teknologi, dan satuan yang digunakan pada dashboard. Definisi setiap statistik tetap mengikuti sumber aslinya."));
 root.append(intro);
 const toolbar=E("div","esa-toolbar");
 const searchWrap=E("label","esa-search-label");
 searchWrap.append(E("span",null,T("Find an acronym, term or unit","Cari singkatan, istilah, atau satuan")));
 const input=E("input","esa-search");
 input.type="search";input.autocomplete="off";input.value=search;
 input.placeholder=T("e.g. EBTKE, B50, GWh, SPKLU","misalnya EBTKE, B50, GWh, SPKLU");
 input.setAttribute("aria-label",T("Search glossary entries","Cari entri glosarium"));
 input.addEventListener("input",()=>{search=input.value;category="all";updateResults(root,data)});
 searchWrap.append(input);
 const filters=E("div","esa-filters");filters.setAttribute("aria-label",T("Glossary categories","Kategori glosarium"));
 const all=[{id:"all",label_en:"All entries",label_id:"Semua"},...data.categories];
 all.forEach(group=>{
  const b=E("button","esa-filter",lang()==="id"?group.label_id:group.label_en);
  b.type="button";b.dataset.group=group.id;b.setAttribute("aria-pressed",String(category===group.id));
  b.classList.toggle("active",category===group.id);
  b.addEventListener("click",()=>{category=group.id;search="";refresh(root,data)});
  filters.append(b);
 });
 toolbar.append(searchWrap,filters);
 root.append(toolbar);
 const body=E("div","esa-results");body.id="esa-results";body.setAttribute("aria-live","polite");
 root.append(body);
 const note=E("p","esa-footnote",T(
 "Units indicate a quantity, not its reporting period or statistical scope. Capacity ≠ actual output; commitments ≠ realized investment; planned additions ≠ commissioned assets; +S is an SLI analytical lens, not an official fifth IKE dimension.",
 "Satuan menunjukkan besaran, bukan periode ataupun cakupan statistiknya. Kapasitas ≠ produksi aktual; komitmen ≠ investasi terealisasi; rencana ≠ aset beroperasi; +S adalah lensa analitis SLI, bukan dimensi kelima IKE yang resmi."));
 root.append(note);
 updateResults(root,data);
 if(oldFocus){input.focus();if(from!==null)try{input.setSelectionRange(from,from)}catch(_e){}}
}
function updateResults(root,data){
 const buttons=root.querySelectorAll(".esa-filter");
 buttons.forEach(b=>{const active=b.dataset.group===category;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
 const body=root.querySelector(".esa-results");
 if(!body)return;
 body.replaceChildren();
 let total=0;
 for(const group of data.categories){
  if(category!=="all"&&category!==group.id)continue;
  const rows=data.items.filter(item=>item.category===group.id&&matches(item,search))
   .sort((a,b)=>a.term.localeCompare(b.term,"en",{numeric:true,sensitivity:"base"}));
  if(!rows.length)continue;
  total+=rows.length;
  const details=E("details","esa-group");
  details.dataset.group=group.id;
  details.open=Boolean(search)||category!=="all"||expanded.has(group.id);
  const summary=E("summary","esa-group-title");
  summary.append(E("strong",null,lang()==="id"?group.label_id:group.label_en),
    E("span","esa-count",rows.length+" "+T("terms","istilah")));
  details.append(summary);
  const dl=E("dl","esa-list");
  rows.forEach(item=>dl.append(resultCard(item)));
  details.append(dl);
  details.addEventListener("toggle",()=>{
   if(search||category!=="all")return;
   if(details.open)expanded.add(group.id);else expanded.delete(group.id);
  });
  body.append(details);
 }
 const count=E("p","esa-result-count",total+" "+T("matching entries","entri sesuai"));
 body.prepend(count);
 if(!total)body.append(E("p","esa-empty",T(
  "No matching entry. Try the Indonesian name, English abbreviation or measurement symbol.",
  "Istilah tidak ditemukan. Coba nama dalam bahasa Indonesia, singkatan bahasa Inggris, atau simbol satuan.")));
}
window.initSLIEnergyAppendix=async function(){
 const root=document.getElementById(ROOT_ID);
 if(!root)return;
 root.setAttribute("data-sli-no-translate","");
 if(cache){refresh(root,cache);return}
 root.replaceChildren(E("p","esa-intro",T("Loading the Energy Security glossary…","Memuat glosarium ketahanan energi…")));
 try{
  const res=await fetch("data/energy-appendix.json",{cache:"no-store"});
  if(!res.ok)throw Error("Appendix dataset unavailable");
  const data=await res.json();
  if(!Array.isArray(data.items)||data.items.length<30||!Array.isArray(data.categories))throw Error("Glossary incomplete");
  cache=data;refresh(root,data);
 }catch(_err){
  root.replaceChildren(E("p","esa-empty",T(
    "Glossary data temporarily unavailable; all research sections remain accessible.",
    "Data glosarium sementara tidak tersedia; semua bagian riset tetap dapat diakses.")));
 }
};
document.addEventListener("sli:languagechange",()=>{
 const root=document.getElementById(ROOT_ID);
 if(root&&cache)refresh(root,cache);
});
})();
