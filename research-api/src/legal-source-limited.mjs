import {structuralAbsence} from "./legal-article-existence.mjs";
/* Deterministic source-limited response for a single explicitly requested
 * legal article that has NO matching reviewed article-level evidence.
 * Never describe metadata as actual statutory text. Do not call the paid model.
 */
const clean=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const lawRef=/\b(UU|Undang[\s-]*Undang|PP|Peraturan\s+Pemerintah|Perpres|Peraturan\s+Presiden)\s*(?:(?:No\.?|Nomor)\s*)?(\d{1,3})\s*(?:\/|-|\s+Tahun\s+|\s+)(\d{4})\b/gi;
const articleRef=/\b(?:pasal|article)\s+(\d{1,3}[a-z]?)\b/gi;
function lawRefs(text){
 return [...String(text||"").matchAll(lawRef)].map(x=>{
  const type=clean(x[1]);
  const short=type==="undang undang"?"uu":type==="peraturan pemerintah"?"pp":
   type==="peraturan presiden"?"perpres":type;
  const number=String(Number(x[2])),year=x[3];
  return {key:short+" "+number+" "+year,short,number,year};
 });
}
function lawInfo(prompt){
 const laws=lawRefs(prompt);
 const articles=[...String(prompt||"").matchAll(articleRef)];
 const uniqueLaws=[...new Set(laws.map(x=>x.key))];
 const uniqueArticles=[...new Set(articles.map(x=>x[1].toLowerCase()))];
 if(uniqueLaws.length!==1||uniqueArticles.length!==1)return null;
 const law=laws[0];
 return {law_key:law.key,law_ref:law.short==="perpres"?"Perpres "+law.number+"/"+law.year:
  law.short.toUpperCase()+" "+law.number+"/"+law.year,article:"Pasal "+uniqueArticles[0]};
}
function matchingAnchor(item,law,article){
 const a=item?.provision_anchor;
 return !!(a?.instrument_ref&&a?.article&&lawRefs(a.instrument_ref).some(x=>x.key===law)&&
  clean(a.article)===clean(article)&&/^https:\/\//.test(item.source_url||""));
}
export function missingLegalArticleBrief({question,articleEvidence=[],policyEvidence=[],language="id"}={}){
 const request=lawInfo(question);
 if(!request)return null;
 const absent=structuralAbsence(request,language);
 if(absent)return absent;
 if(articleEvidence.some(x=>matchingAnchor(x,request.law_key,request.article)))return null;
 // No matching article is reviewed, even if the law itself is in the index.
 const match=(Array.isArray(policyEvidence)?policyEvidence:[]).find(x=>
  lawRefs(String(x.title||"").split("·")[0]).some(y=>y.key===request.law_key) &&
  /^https:\/\//.test(x.source_url||"") && String(x.id||"").startsWith("policy_law_"));
 const sources=match?[{index:1,id:match.id,title:match.title,source_url:match.source_url,
  source_date:match.source_date||null,publisher:match.publisher||"SLI legal index",
  period:match.period||null,geo:match.geo||"Indonesia",source_type:"legal_index_metadata"}]:[];
 const en=language==="en";
 const head="## "+(en?"Article evidence status: ":"Status bukti pasal: ")+request.article+" "+request.law_ref;
 const intro=en
  ?"SLI has no reviewed article-level text for the requested provision. Its meaning, obligations, exceptions and current legal effect cannot be determined from index metadata."
  :"SLI belum memiliki teks atau ringkasan tingkat pasal yang telah ditelaah untuk ketentuan yang diminta. Isi, kewajiban, pengecualian, dan akibat hukum yang berlaku tidak dapat disimpulkan dari metadata indeks.";
 const hasMeta=sources.length>0;
 const status=en
  ?hasMeta?"The SLI catalogue identifies "+request.law_ref+" as an instrument, but its index entry is NOT the original article text [1].":"There is no matching reviewed article-level source or applicable legal index evidence in this request."
  :hasMeta?"Indeks SLI mencatat "+request.law_ref+" sebagai instrumen hukum, tetapi entri tersebut BUKAN teks asli pasalnya [1].":"Belum ada sumber tingkat pasal terverifikasi maupun entri indeks hukum yang cocok untuk pertanyaan ini.";
 const gaps=en
  ?"The requested article text, any amendments or repeal, effective dates, transitional clauses and related court decisions remain unverified. A source link alone does not establish legal validity."
  :"Bunyi ketentuan yang diminta, perubahan atau pencabutannya, tanggal efektif, ketentuan peralihan, dan putusan pengadilan terkait belum diperiksa dalam korpus. Keberadaan tautan saja tidak membuktikan status hukum saat ini.";
 const steps=en
  ?"Read the official full-text law and its amendment history through an authorised government legal archive; locate the exact article and page before making any legal interpretation."
  :"Periksa naskah lengkap pada portal peraturan resmi, telusuri perubahan dan putusan terkait, lalu cocokkan nomor pasal dan halaman sebelum menyusun penafsiran hukum.";
 const answer=[head,intro,
  "## "+(en?"What the catalogue supports":"Apa yang dapat didukung indeks SLI"),status,
  "## "+(en?"What is not established":"Apa yang belum dapat dipastikan"),gaps,
  "## "+(en?"Verification steps":"Langkah verifikasi"),steps,
  "## "+(en?"Legal verification note":"Catatan Verifikasi Hukum"),
  en?"Source-limited deterministic response, NOT an AI interpretation or legal opinion. No article-level legal assertion has been inferred.":"Jawaban deterministik berbatas sumber; bukan penafsiran AI atas isi pasal atau opini hukum. Tidak ada substansi pasal yang direka."
 ].join("\n\n");
 return {request,answer,sources,source_limited:true,model_called:false,
  review_scope:"indexed_law_metadata_only_no_reviewed_article",
  article_text_verified:false};
}
