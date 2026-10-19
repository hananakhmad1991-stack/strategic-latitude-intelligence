/* SLI owner-stage article citation gate + deterministic safe recovery.
 * Only a numbered source containing the SAME law and article can ground a legal article claim.
 * This is a reference check, NOT an assessment of legal validity or factual entailment.
 */
const norm=s=>String(s||"").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const articleReg=/\b(?:pasal|article)\s+(\d+[A-Za-z]?)(?:\s+(?:ayat\s*\(\s*(\d+)\s*\)|huruf\s+([a-z])))?/gi;
const lawReg=/\b(UU|Undang[\s-]*Undang|PP|Peraturan Pemerintah|Perpres|Peraturan Presiden|Perda)\s*(?:(?:No\.?|Nomor)\s*)?(\d+)\s*(?:\/|-|\s+Tahun\s+)(\d{4})\b/gi;
const citationReg=/\[(\d+)\]/g;
function lawKey(type,number,year){
 const t=norm(type);
 const canonical=t==="undang undang"?"uu":t==="peraturan pemerintah"?"pp":t==="peraturan presiden"?"perpres":t;
 return canonical+" "+Number(number)+" "+year;
}
function canonicalLaw(input){
 const s=String(input||"");
 const m=[...s.matchAll(lawReg)][0];
 return m?lawKey(m[1],m[2],m[3]):norm(s);
}
function anchorsFrom(evidence){
 return (Array.isArray(evidence)?evidence:[]).flatMap((x,index)=>{
  const p=x?.provision_anchor;
  if(!p?.article||!p?.instrument_ref||!/^https:\/\//i.test(x?.source_url||""))return [];
  return [{citation:index+1,article:norm(p.article),law:canonicalLaw(p.instrument_ref)}];
 });
}
function splitParagraphs(answer){
 return String(answer||"").split(/\n\s*\n/);
}
function references(text){return [...text.matchAll(citationReg)].map(m=>Number(m[1]));}
function explicitLawsNear(paragraph,offset){
 // Keep common legal abbreviations such as "UU No. 23 Tahun 2014" intact.
 // A bounded surrounding window is intentionally conservative when multiple
 // instruments are mixed into one sentence or the author omitted the statute.
 const context=paragraph.slice(Math.max(0,offset-95),Math.min(paragraph.length,offset+150));
 return [...context.matchAll(lawReg)].map(m=>lawKey(m[1],m[2],m[3]));
}
export function auditLegalArticleCitations(answer,evidence){
 const anchors=anchorsFrom(evidence),violations=[];
 const paragraphs=splitParagraphs(answer);
 paragraphs.forEach((paragraph,paragraphIndex)=>{
  // Markdown section headings (including "Isi Pasal 1") are navigational labels,
  // not statutory content claims. Do not delete a heading solely because it
  // lacks a citation; its substantive paragraphs remain strictly audited.
  if(/^#{1,6}\s+[^\n]+$/.test(paragraph.trim()))return;
  const refs=references(paragraph);
  for(const m of paragraph.matchAll(articleReg)){
   const article="pasal "+m[1].toLowerCase();
   const describedSubclause=!!(m[2]||m[3]);
   const explicitLaws=explicitLawsNear(paragraph,m.index);
   const matched=anchors.some(a=>
    a.article===article&&!describedSubclause&&refs.includes(a.citation)&&
    (!explicitLaws.length||explicitLaws.every(law=>law===a.law))
   );
   if(!matched)violations.push({
    article,
    paragraph_index:paragraphIndex,
    reason:describedSubclause?"subclause_not_reviewed":"missing_matching_primary_provision_citation",
   });
  }
 });
 return {
  pass:violations.length===0,
  unsupported_articles:[...new Set(violations.map(v=>v.article))],
  violations,
  reviewed_article_anchors:anchors.map(a=>a.law+" "+a.article+" ["+a.citation+"]"),
  scope:"law-and-article plus numbered-source validation only; NOT a semantic legal opinion, verified current statute or complete legal corpus"
 };
}
/* Remove any whole paragraph containing a disallowed numbered article.
 * Never transform the unsupported claim into a plausible paraphrase.
 * If the remaining text is not substantial, give a transparent, cited
 * source-limited research response rather than a fabricated AI report or HTTP 502.
 */
export function recoverUnsupportedLegalAnswer(answer,evidence){
 const first=auditLegalArticleCitations(answer,evidence);
 if(first.pass)return {answer:String(answer||""),recovered:false,omitted:0,source_limited:false,audit:first};
 const excluded=new Set(first.violations.map(v=>v.paragraph_index));
 const paragraphs=splitParagraphs(answer);
 // Avoid orphaned legal headings when the only substantive paragraph under
 // a heading was withheld. Never hide valid neighboring paragraphs.
 for(let i=0;i<paragraphs.length;i++){
  if(!/^#{1,6}\s+[^\n]+$/.test(paragraphs[i].trim()))continue;
  let next=i+1;
  while(next<paragraphs.length&&!/^#{1,6}\s+[^\n]+$/.test(paragraphs[next].trim()))next++;
  const substantive=paragraphs.slice(i+1,next).some((p,j)=>!excluded.has(i+1+j)&&p.trim().length>0);
  if(!substantive)excluded.add(i);
 }
 const kept=paragraphs.filter((_,i)=>!excluded.has(i)).join("\n\n").trim();
 const excludedCount=excluded.size;
 const warning="Catatan verifikasi SLI: "+excludedCount+" bagian jawaban AI tidak ditampilkan karena mengandung rujukan pasal yang belum cocok dengan dokumen hukum primer dalam corpus. Jangan gunakan hasil ini sebagai opini hukum atau konfirmasi status peraturan.";
 const citations=(Array.isArray(evidence)?evidence:[]).map((d,i)=>({...d,source_index:i+1}))
  .filter(d=>d.provision_anchor?.article&&d.provision_anchor?.instrument_ref).slice(0,4);
 const minCitations=(Array.isArray(evidence)?evidence:[]).slice(0,1).map((x,i)=>({title:"Dokumen rujukan dalam indeks SLI (bukan naskah hukum terkonsolidasi)",index:i+1}));
 if(kept.length>=80&&/\[\d+\]/.test(kept)&&auditLegalArticleCitations(kept,evidence).pass){
  const restored=kept+"\n\n## Batas verifikasi hukum\n\n"+warning;
  return {answer:restored,recovered:true,omitted:excludedCount,source_limited:false,audit:auditLegalArticleCitations(restored,evidence)};
 }
 const links=(citations.length?citations.map(d=>"- Dokumen primer tentang "+d.provision_anchor.instrument_ref+", "+d.provision_anchor.article+" ["+d.source_index+"]"):minCitations.map(d=>"- "+d.title+" ["+d.index+"]")).join("\n");
 const fallback=[
  "## Hasil pemeriksaan sumber hukum",
  "Permintaan telah diproses, tetapi analisis pasal yang dihasilkan AI tidak dapat diverifikasi terhadap sumber primer yang tersedia. Karena itu, SLI menahan interpretasi tersebut, bukan menyajikannya sebagai fakta.",
  "## Sumber yang tersedia untuk penelaahan",
  links||"Belum ada dokumen primer yang memenuhi kriteria rujukan pasal dalam corpus terbatas ini.",
  "## Langkah analisis selanjutnya",
  "Periksa teks pasal asli, riwayat perubahan, ketentuan peralihan, dan penerapan sektoral melalui JDIH penerbit. Kemudian ulangi riset setelah dokumen primer dan versi konsolidasi telah diverifikasi.",
  warning
 ].join("\n\n");
 return {answer:fallback,recovered:true,omitted:excludedCount,source_limited:true,audit:auditLegalArticleCitations(fallback,evidence)};
}
