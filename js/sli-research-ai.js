/* SLI Research AI · honest Open preview: source retrieval, not an LLM.
 * User queries remain inside this browser. Only the curated public corpus is fetched.
 * No hidden Pro data, no API keys, no hallucinated statistics or automated forecasts.
 */
(()=>{"use strict";
const byId=id=>document.getElementById(id);
const state={corpus:null,language:"id",last:null};
const dict={
 id:{intro:"Pencarian bukti selesai",no:"Belum ada bukti yang cukup relevan dalam cuplikan publik yang terbatas ini. Coba sektor atau istilah lain. Tidak ada angka yang akan dibuat-buat.",evidence:"Temuan yang bersumber",source:"Periksa sumber asli",more:"Pertanyaan lanjutan",copy:"Salin jawaban",copied:"Disalin",ready:"23 sumber contoh tersedia",error:"Katalog riset tidak dapat dimuat. Periksa koneksi atau coba kembali.",period:"Periode data",last:"Tanggal sumber",open:"Buka sumber",brief:"Ringkasan berbasis pencarian bukti, bukan jawaban generatif AI. Untuk analisis menyeluruh, verifikasi seluruh sumber dan gunakan SLI Pro setelah peluncuran.",results:"Bukti relevan",none:"Tidak ada bukti yang cocok.",notmodel:"Preview terbatas · belum menggunakan model AI generatif"},
 en:{intro:"Evidence retrieval complete",no:"Insufficient matching evidence in this curated public preview. Try a different topic or wording. This tool does not fabricate numbers.",evidence:"Source-grounded findings",source:"Verify original source",more:"Related research",copy:"Copy findings",copied:"Copied",ready:"23 example sources available",error:"The research corpus could not load. Check the connection and retry.",period:"Observed period",last:"Source date",open:"Open source",brief:"Source-retrieval summary, not a generative AI answer. Verify the original evidence; full analyses are planned for Pro.",results:"Relevant evidence",none:"No matching evidence.",notmodel:"Limited preview · no generative AI model connected"}
};
const STOP=new Set("apa what how which when where why apakah bagaimana yang dengan dalam dari untuk pada ke dan atau and the a an of in to about terkait ini itu data menurut indonesia indonesian indonesia's terbaru latest hingga apakah analisis analysis berapa dan apa bisa apakah info menunjukkan tell me show me does the".split(" "));
const SYN=[["pertumbuhan","growth","gdp","pdb","pdrb","grdp","economy","ekonomi","economic"],["inflasi","inflation","cpi","harga","consumer prices"],["gini","ketimpangan","inequality","distribution","pengeluaran"],["data center","datacenter","pusat data","dc","ai","artificial intelligence","kecerdasan buatan","cloud","komputasi","compute"],["smelter","nikel","nickel","mineral","hp al","hpal","pertambangan","battery","baterai","ev"],["investasi","investment","investor","pmtb","modal","capex","project","proyek"],["suku bunga","interest","bank","bi rate","monetary","moneter"],["perdagangan","trade","export","exports","ekspor","imports","impor"],["rupiah","kurs","exchange","jisdor","usd"],["kemiskinan","poverty","miskin"],["pengangguran","unemployment","employment","tenaga kerja"],["jawa barat","west java"],["kalimantan timur","east kalimantan"],["sulawesi tenggara","southeast sulawesi"],["jawa tengah","central java"],["kepulauan riau","riau islands"],["jakarta","dki jakarta"]];
function norm(s){return String(s||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim()}
function tokens(s){return norm(s).split(" ").filter(t=>t.length>1&&!STOP.has(t))}
function expanded(s){
 const n=norm(s),terms=new Set(tokens(s));
 for(const group of SYN){if(group.some(x=>n.includes(norm(x))&&norm(x).length>=3)){group.forEach(x=>tokens(x).forEach(t=>terms.add(t)))}}
 return [...terms]
}
function docText(doc){return state.language==="en"?(doc.text_en||doc.text):doc.text}
function docTitle(doc){return state.language==="en"?(doc.title_en||doc.title):doc.title}
function topicMatch(doc,topic){return topic==="all"||doc.topic===topic}
function score(doc,query){
 const q=norm(query),title=norm(doc.title+" "+(doc.title_en||"")),body=norm(doc.text+" "+(doc.text_en||"")),geo=norm(doc.geo),whole=title+" "+body+" "+geo+" "+norm(doc.topic);
 let sum=0;
 for(const t of expanded(query)){if(title.split(" ").includes(t))sum+=7;else if(title.includes(t))sum+=4;if(geo.split(" ").includes(t))sum+=5;if(body.includes(t))sum+=1.25;if(norm(doc.topic).includes(t))sum+=2}
 for(const pair of SYN){if(pair.some(x=>q.includes(norm(x))&&norm(x).length>=4)&&pair.some(x=>whole.includes(norm(x))))sum+=3}
 if(geo!=="indonesia"&&q.includes(geo))sum+=15;
 if(title.includes(q)&&q.length>8)sum+=12;
 return sum
}
function retrieve(corpus,query,topic){
 return corpus.documents.filter(d=>topicMatch(d,topic)).map(d=>({...d,_score:score(d,query)})).filter(d=>d._score>=2.5).sort((a,b)=>b._score-a._score||a.id.localeCompare(b.id)).slice(0,6)
}
function el(tag,cls,txt){const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=String(txt);return x}
function url(src){try{const u=new URL(src);return u.protocol==="https:"?u.href:null}catch{return null}}
function sourceLink(doc,label){const a=el("a","sli-ra-link",label);const u=url(doc.source_url);if(!u){a.removeAttribute("href");return a}a.href=u;a.target="_blank";a.rel="noopener noreferrer";return a}
function resultCard(doc,i){
 const box=el("article","sli-ra-source"),head=el("div","sli-ra-source-heading");
 head.append(el("span","sli-ra-number","["+(i+1)+"]"),el("strong","",docTitle(doc)));
 const badge=el("small","",doc.kind==="official_statistic"?"OFFICIAL STATISTIC":doc.kind==="regional_sample"?"PROVINCE SAMPLE":doc.kind==="method_note"?"METHOD NOTE":"REPORTED MILESTONE");
 box.append(head,badge);
 const p=el("p","",docText(doc));box.append(p);
 const meta=el("div","sli-ra-meta",doc.publisher+" · "+dict[state.language].period+": "+(doc.period||"N/A")+" · "+dict[state.language].last+": "+doc.source_date);
 box.append(meta);
 const actions=el("div","sli-ra-source-links");
 actions.append(sourceLink(doc,dict[state.language].open+" ↗"));
 const dash=el("a","sli-ra-link",state.language==="id"?"Lihat modul SLI ↗":"View SLI module ↗");
 dash.href="./"+doc.sli_path;actions.append(dash);box.append(actions);
 return box;
}
function setStatus(t,warning=false){byId("raStatus").textContent=t;byId("raStatus").dataset.level=warning?"warning":"ok"}
function synthesize(docs,query){
 const lead=state.language==="id"?"Pertanyaan: ":"Question: ";
 const intro=state.language==="id"?"Cuplikan paling relevan yang tersedia dalam katalog Open:":"Most relevant matches in the Open preview catalog:";
 const rows=docs.map((d,i)=>"["+(i+1)+"] "+docTitle(d)+" — "+docText(d)+" ("+d.publisher+"; "+d.period+")");
 const sources=docs.map((d,i)=>"["+(i+1)+"] "+d.source_url);
 return lead+query+"\n\n"+intro+"\n\n"+rows.join("\n\n")+"\n\n"+(state.language==="id"?"Sumber:":"Sources:")+"\n"+sources.join("\n")+"\n\n"+dict[state.language].brief
}
function suggestions(query,docs){
 const map={energy:["Berapa harga Brent dan WTI menurut data bertanggal?","Apa dampak energi dari risiko geopolitik?","What do historical oil price observations show?"],news:["Apa status verifikasi headline energi terkini?","Apa jalur risiko geopolitik terhadap impor BBM?","Which energy news leads require primary-source confirmation?"],ai:["Apa status pusat data di Jawa Barat?","Bagaimana menilai kapasitas MW AI?","What is the difference between announced and operational capacity?"],regional:["Bagaimana membandingkan PDRB provinsi?","Apa perbedaan PMTB dan investasi terealisasi?","How should provincial growth and Gini be interpreted?"],inequality:["Apa arti Gini pengeluaran?","Bandingkan Gini dan pertumbuhan ekonomi","How should Gini be used in investment analysis?"],minerals:["Proyek nikel dan HPAL yang sudah diumumkan","Bagaimana membedakan smelter operasional dan konstruksi?","What is verified in the EV battery project?"],macroeconomy:["Bagaimana tren inflasi dan PDB Indonesia?","Berapa kurs JISDOR dan suku bunga BI?","What do the latest dated macro indicators show?"],trade:["Berapa ekspor dan impor barang Indonesia?","Apa keterbatasan neraca perdagangan?","What does the merchandise balance measure?"]};
 const main=docs[0]?.topic||"macroeconomy";
 return (map[main]||map.macroeconomy).filter(x=>norm(x)!==norm(query)).slice(0,3)
}
function answer(question){
 if(!state.corpus)return;
 const query=String(question||"").trim().slice(0,500);if(query.length<4){setStatus(state.language==="id"?"Masukkan pertanyaan setidaknya 4 karakter.":"Please enter at least 4 characters.",true);return}
 const topic=byId("raTopic").value,docs=retrieve(state.corpus,query,topic);
 state.last={query,docs,summary:synthesize(docs,query)};
 const out=byId("raAnswer"),list=byId("raSources"),follow=byId("raFollow");
 out.replaceChildren();list.replaceChildren();follow.replaceChildren();
 byId("raResults").hidden=false;
 out.append(el("h2","",dict[state.language].evidence));
 out.append(el("p","sli-ra-query",query));
 if(!docs.length){out.append(el("p","sli-ra-caution",dict[state.language].no));byId("raCopy").disabled=true;setStatus(dict[state.language].none,true);return}
 out.append(el("p","",dict[state.language].intro+" "+docs.length+" "+dict[state.language].results.toLowerCase()+"."));
 const ol=el("ol","sli-ra-summary");
 docs.slice(0,4).forEach((doc,i)=>{const li=el("li","",docTitle(doc)+": "+docText(doc));li.append(el("span","sli-ra-inline-ref"," ["+(i+1)+"]"));ol.append(li)});
 const numbers=docs.map((d,i)=>({d,i})).filter(x=>x.d.metric&&Number.isFinite(x.d.metric.value)).slice(0,3);
 if(numbers.length){
  const highlights=el("div","sli-ra-metrics");
  numbers.forEach(({d,i})=>{
   const tile=el("div","sli-ra-metric");
   const val=el("strong","",d.metric.value.toLocaleString(state.language==="id"?"id-ID":"en-US")+" "+d.metric.unit);
   tile.append(el("span","",d.metric.label),val,el("small","",d.metric.period+" · ["+(i+1)+"]"));
   highlights.append(tile)
  });
  out.insertBefore(highlights,ol);
 }
 out.append(ol,el("p","sli-ra-caution",dict[state.language].brief));
 byId("raSourceHeading").textContent=dict[state.language].source+" ("+docs.length+")";
 docs.forEach((doc,i)=>list.append(resultCard(doc,i)));
 byId("raFollowHeading").textContent=dict[state.language].more;
 suggestions(query,docs).forEach(s=>{const b=el("button","sli-ra-follow-chip",s);b.type="button";b.addEventListener("click",()=>{byId("raQuestion").value=s;answer(s)});follow.append(b)});
 byId("raCopy").disabled=false;setStatus(dict[state.language].intro+" · "+docs.length);
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
function init(corpus){
 if(corpus.schema!=="sli-research-preview-v1"||!Array.isArray(corpus.documents)||!corpus.documents.every(d=>d.id&&d.title&&d.text&&url(d.source_url)))throw Error("Malformed curated evidence");
 state.corpus=corpus;
 byId("raCount").textContent=corpus.documents.length;
 byId("raDate").textContent=corpus.as_of;
 setStatus((state.language==="id"?"Katalog terbatas siap: ":"Limited corpus ready: ")+corpus.documents.length+" "+(state.language==="id"?"sumber":"sources"));
 localize()
}
document.addEventListener("DOMContentLoaded",()=>{
 byId("raForm").addEventListener("submit",e=>{e.preventDefault();answer(byId("raQuestion").value)});
 byId("raLanguage").addEventListener("click",()=>{state.language=state.language==="id"?"en":"id";localize()});
 byId("raCopy").addEventListener("click",async()=>{if(!state.last?.docs?.length)return;try{await navigator.clipboard.writeText(state.last.summary);setStatus(dict[state.language].copied)}catch{setStatus(state.language==="id"?"Salin tidak tersedia di browser ini.":"Browser clipboard unavailable.",true)}});
 fetch("./data/sli-research-evidence-preview.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(init).catch(()=>setStatus(dict[state.language].error,true));
});
window.SLIResearchPreview=Object.freeze({mode:"source-retrieval-not-generative"});
})();