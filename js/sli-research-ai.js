import {buildResearchReport,reportToText,detectIntents} from "./sli-research-analysis.mjs";
/* SLI Research AI · honest Open preview: source retrieval, not an LLM.
 * User queries remain inside this browser. Only the curated public corpus is fetched.
 * No hidden Pro data, no API keys, no hallucinated statistics or automated forecasts.
 */
(()=>{"use strict";
const byId=id=>document.getElementById(id);
const state={corpus:null,profiles:null,language:"id",last:null};
const dict={
 id:{intro:"Pencarian bukti selesai",no:"Belum ada bukti yang cukup relevan dalam cuplikan publik yang terbatas ini. Coba sektor atau istilah lain. Tidak ada angka yang akan dibuat-buat.",evidence:"Temuan yang bersumber",source:"Periksa sumber asli",more:"Pertanyaan lanjutan",copy:"Salin jawaban",copied:"Disalin",ready:"23 sumber contoh tersedia",error:"Katalog riset tidak dapat dimuat. Periksa koneksi atau coba kembali.",period:"Periode data",last:"Tanggal sumber",open:"Buka sumber",brief:"Ringkasan berbasis pencarian bukti, bukan jawaban generatif AI. Untuk analisis menyeluruh, verifikasi seluruh sumber dan gunakan SLI Pro setelah peluncuran.",results:"Bukti relevan",none:"Tidak ada bukti yang cocok.",notmodel:"Preview terbatas · belum menggunakan model AI generatif"},
 en:{intro:"Evidence retrieval complete",no:"Insufficient matching evidence in this curated public preview. Try a different topic or wording. This tool does not fabricate numbers.",evidence:"Source-grounded findings",source:"Verify original source",more:"Related research",copy:"Copy findings",copied:"Copied",ready:"23 example sources available",error:"The research corpus could not load. Check the connection and retry.",period:"Observed period",last:"Source date",open:"Open source",brief:"Source-retrieval summary, not a generative AI answer. Verify the original evidence; full analyses are planned for Pro.",results:"Relevant evidence",none:"No matching evidence.",notmodel:"Limited preview · no generative AI model connected"}
};
function el(tag,cls,txt){const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=String(txt);return x}
function url(src){try{const u=new URL(src);return u.protocol==="https:"?u.href:null}catch{return null}}
function sourceLink(doc,label){const a=el("a","sli-ra-link",label);const u=url(doc.source_url);if(!u){a.removeAttribute("href");return a}a.href=u;a.target="_blank";a.rel="noopener noreferrer";return a}
function setStatus(t,warning=false){byId("raStatus").textContent=t;byId("raStatus").dataset.level=warning?"warning":"ok"}
function answer(question){
 if(!state.corpus||!state.profiles)return;
 const query=String(question||"").trim().slice(0,500);
 if(query.length<4){setStatus(state.language==="id"?"Masukkan pertanyaan minimal 4 karakter.":"Enter a question with at least four characters.",true);return}
 const topic=byId("raTopic").value;
 const extra={regional:"investasi",inequality:"gini",macroeconomy:"pertumbuhan",trade:"ekspor",minerals:"nikel",ai:"data center",energy:"energi",news:"berita",methodology:"metodologi"}[topic];
 const allIntents=detectIntents(query);
 const contextualQuery=extra&&!allIntents.length?query+" "+extra:query;
 let report;
 try{report=buildResearchReport(contextualQuery,state.profiles,state.corpus,state.language,topic)}
 catch(e){setStatus(state.language==="id"?"Analisis tidak tersedia; periksa konfigurasi data.":"Analysis unavailable; check the data configuration.",true);return}
 if(!report)return;
 state.last={query,topic,report,summary:reportToText(report,query,state.language)};
 const out=byId("raAnswer"),list=byId("raSources"),follow=byId("raFollow");
 out.replaceChildren();list.replaceChildren();follow.replaceChildren();
 byId("raResults").hidden=false;
 out.append(el("h2","",report.title));
 const q=el("p","sli-ra-query",query);out.append(q);
 out.append(el("p","sli-ra-analysis-lead",report.lead));
 if(report.metrics?.length){
  const highlights=el("div","sli-ra-metrics");
  for(const m of report.metrics){
   const tile=el("div","sli-ra-metric");
   tile.append(el("span","",m.label),el("strong","",m.value),el("small","",m.period+" · ["+m.citation+"]"));
   highlights.append(tile);
  }
  out.append(highlights);
 }
 for(const section of report.sections){
  const block=el("section","sli-ra-analysis-section");
  block.append(el("h3","",section.title),el("p","",section.body));out.append(block);
 }
 if(report.limit)out.append(el("p","sli-ra-caution",report.limit));
 const transparency=el("p","sli-ra-transparency",state.language==="id"?"Analisis ini disusun dengan aturan interpretasi dari data bertanggal, bukan respons model AI generatif. Angka bukan proyeksi dan tidak membuktikan sebab-akibat.":"This analytical narrative is rule-based over dated evidence, not produced by a live generative model. Numbers are neither forecasts nor causal proof.");
 out.append(transparency);
 byId("raSourceHeading").textContent=(state.language==="id"?"Sumber dan periode observasi":"Evidence and observation periods")+" ("+report.sources.length+")";
 report.sources.forEach((s,i)=>{
  const card=el("article","sli-ra-source");
  card.append(el("div","sli-ra-source-heading","["+(i+1)+"] "+s.title));
  card.append(el("p","sli-ra-meta",s.publisher+" · "+s.period+" · "+(s.source_date||"")));
  const a=sourceLink(s,state.language==="id"?"Periksa publikasi asli ↗":"Verify original publication ↗");
  card.append(a);list.append(card);
 });
 const chips=report.suggestions||[];
 byId("raFollowHeading").textContent=dict[state.language].more;
 chips.forEach(s=>{const b=el("button","sli-ra-follow-chip",s);b.type="button";b.addEventListener("click",()=>{byId("raQuestion").value=s;answer(s)});follow.append(b)});
 byId("raCopy").disabled=!(report.sections?.length);
 setStatus((state.language==="id"?"Analisis dibuat dari ":"Report assembled from ")+report.sources.length+(state.language==="id"?" sumber bertanggal":" dated sources"),report.kind==="insufficient"||report.kind==="limit");
 byId("raResults").scrollIntoView({behavior:"smooth",block:"start"});
}
function localize(){
 document.documentElement.lang=state.language;
 document.querySelectorAll("[data-id][data-en]").forEach(node=>{node.textContent=node.dataset[state.language]});
 byId("raLanguage").textContent=state.language==="id"?"English":"Bahasa Indonesia";
 const list=byId("raExamples");list.replaceChildren();
 for(const ex of state.corpus?.["examples_"+state.language]||[]){const b=el("button","sli-ra-example",ex);b.type="button";b.addEventListener("click",()=>{byId("raQuestion").value=ex;answer(ex)});list.append(b)}
 byId("raCopy").textContent=dict[state.language].copy;
 if(state.last)answer(state.last.query);
}
function init(corpus,profiles){
 if(corpus.schema!=="sli-research-preview-v1"||!Array.isArray(corpus.documents)||!corpus.documents.every(d=>d.id&&d.title&&d.text&&url(d.source_url)))throw Error("Malformed evidence");
 if(!profiles||profiles.schema!=="sli-research-province-preview-v1"||profiles.provinces?.length!==38)throw Error("Malformed regional preview");
 state.corpus=corpus;state.profiles=profiles;
 byId("raCount").textContent=corpus.documents.length;
 byId("raDate").textContent=corpus.as_of;
 setStatus((state.language==="id"?"Analisis siap: 38 provinsi dan ":"Research ready: 38 provinces and ")+corpus.documents.length+(state.language==="id"?" rujukan publik":" public references"));
 localize();
 if(byId("raQuestion").value.trim())answer(byId("raQuestion").value);
}
document.addEventListener("DOMContentLoaded",()=>{
 byId("raForm").addEventListener("submit",e=>{e.preventDefault();answer(byId("raQuestion").value)});
 byId("raLanguage").addEventListener("click",()=>{state.language=state.language==="id"?"en":"id";localize()});
 byId("raCopy").addEventListener("click",async()=>{if(!state.last?.docs?.length)return;try{await navigator.clipboard.writeText(state.last.summary);setStatus(dict[state.language].copied)}catch{setStatus(state.language==="id"?"Salin tidak tersedia di browser ini.":"Browser clipboard unavailable.",true)}});
 Promise.all(["./data/sli-research-evidence-preview.json","./data/sli-research-province-preview.json"].map(path=>fetch(path,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error(path+" HTTP "+r.status);return r.json()}))).then(([corpus,profiles])=>init(corpus,profiles)).catch(()=>setStatus(dict[state.language].error,true));
});
window.SLIResearchPreview=Object.freeze({mode:"rule-based-analytical-evidence-not-generative"});
})();