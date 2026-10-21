/* SLI report content: strict source provenance triage, APA 7 presentation.
 * Metadata presence is NOT fact-checking; never synthesize missing references.
 */
const badTypes=new Set(["live_web_discovery","public_dashboard_source_record_not_claim_verified","legal_index_metadata","official_original_statute_structure_only"]);
const trim=x=>String(x??"").trim();
export const plain=x=>trim(x).replace(/\*\*([^*]+)\*\*/g,"$1").replace(/\*([^*\n]+)\*/g,"$1")
 .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,"$1 ($2)")
 .replace(/\x60([^\x60]+)\x60/g,"$1");
export const escapeMarkup=x=>String(x??"").replace(/&/g,"&amp;").replace(/</g,"&lt;")
 .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
const validUrl=x=>{try{const u=new URL(trim(x));return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&u.hostname.includes(".")?u.href:null}catch{return null}};
const legalTypes=new Set(["reviewed_primary_article_paraphrase","legal_index_metadata","official_original_statute_structure_only"]);
const legalInstrumentYear=s=>{
 // Review date (2026) is NOT the promulgation date of an older statute.
 const text=trim(s?.provision_anchor?.instrument_ref)+" "+trim(s?.title);
 return text.match(/\b(?:UU|PP|Perpres|Perda|Permen|Pergub|Perbup|Perwali)\s*(?:(?:No\.?|Nomor)\s*)?\d+\s*(?:\/|-|Tahun\s+)((?:19|20)\d{2})\b/i)?.[1]||null;
};
const pubYear=s=>legalTypes.has(trim(s?.source_type))?legalInstrumentYear(s):
 trim(s?.publication_date||s?.published_at||s?.source_date).match(/(?:19|20)\d{2}/)?.[0]||null;
const author=s=>trim(s?.author||s?.publisher);
const title=s=>trim(s?.title);
function apaCitation(s){
 const a=author(s),y=pubYear(s);return a&&y?"("+a+", "+y+")":null;
}
export function formatApa7(s){
 const a=author(s),y=pubYear(s)||"n.d.",t=title(s)||"[Judul tidak tercatat]";
 return (a?a+". ":"")+"("+y+"). "+t.replace(/[. ]+$/,"")+". "+(validUrl(s?.source_url)||"[URL dokumen asli belum tersedia]");
}
export function bibliographyReport(answer,sources,min=10){
 const docs=Array.isArray(sources)?sources:[],cited=[...new Set([...trim(answer).matchAll(/\[(\d{1,3})\]/g)].map(m=>Number(m[1]))
  .filter(i=>i>0&&i<=docs.length))],seen=new Set(),references=[];
 for(const i of cited){
  const s=docs[i-1],url=validUrl(s?.source_url);
  const key=url?.replace(/[#?].*/,"").replace(/\/$/,"").toLowerCase()||"notlinked:"+i;
  if(seen.has(key)){const original=references.find(r=>r.key===key);if(original)original.aliases.push(i);continue}seen.add(key);
  const type=trim(s?.source_type),eligible=!!(url&&title(s)&&author(s)&&pubYear(s)&&!badTypes.has(type));
  references.push({index:i,key,aliases:[i],title:title(s),author:author(s),year:pubYear(s),url,
   type,eligible,cite:apaCitation(s),apa:formatApa7(s),
   missing:[!url?"original URL":null,!title(s)?"title":null,!author(s)?"author/publisher":null,
    !pubYear(s)?"publication date":null,badTypes.has(type)?"unreviewed source":null].filter(Boolean)});
 }
 references.sort((a,b)=>(a.author||a.title).localeCompare(b.author||b.title,"id"));
 const n=references.filter(x=>x.eligible).length;
 const indexOnly=references.filter(x=>x.type==="legal_index_metadata").length;
 const structureOnly=references.filter(x=>x.type==="official_original_statute_structure_only").length;
 return {schema:"sli-report-apa7-review-v1",references,cited_unique:references.length,
  metadata_complete_candidates:n,metadata_only_legal_index:indexOnly,structure_only_legal_source:structureOnly,required_minimum:min,meets_preliminary_minimum:n>=min,
  verified_sources:0,ready_for_publication:false,
  warning:structureOnly>0&&n===0
   ?"DRAF BERBATAS SUMBER: struktur naskah UU yang diundangkan telah diperiksa, namun bukan teks pasal yang diminta atau pembuktian status hukum terkonsolidasi.":min===1&&n===0&&indexOnly>0
   ?"DRAF BERBATAS SUMBER: "+indexOnly+" catatan indeks regulasi ditampilkan, tetapi tidak ada teks pasal primer yang telah ditelaah untuk mendukung isi ketentuan. Metadata tidak boleh dihitung sebagai bukti pasal."
   :n>=min
   ?"Ada "+n+" kandidat referensi dengan metadata awal; semua isi, keterkaitan sitasi dan dokumen asli tetap perlu diverifikasi."
   :"DRAF: baru "+n+" kandidat referensi memenuhi kelengkapan metadata awal; target minimum "+min+". Referensi tidak ditambahkan atau dikarang.",
  note:"Kecukupan metadata dan tautan tidak berarti suatu sumber telah terbukti akurat."};
}
export function substituteCitations(input,references){
 // In a source-numbered report, NEVER convert some [N] markers into
 // (Publisher, year) while leaving metadata-incomplete markers numeric.
 // Use numeric citations consistently and list their matching labels in
 // the bibliography; adjacent markers need visible separation.
 const known=new Set(references.flatMap(x=>x.aliases));
 return trim(input).replace(/\]\s*\[/g,"] [")
  .replace(/\[(\d{1,3})\]/g,(match,n)=>known.has(Number(n))?match:match);
}
export function markdownBlocks(md){
 const lines=trim(md).replace(/\r/g,"").split("\n"),blocks=[];let batch=[];
 const flush=()=>{if(batch.length){blocks.push({type:"p",text:batch.join(" ").trim()});batch=[]}};
 for(let i=0;i<lines.length;i++){
  const s=lines[i].trim();
  if(!s){flush();continue}
  if(s.startsWith("\x60\x60\x60")){flush();const code=[];while(++i<lines.length&&!lines[i].trim().startsWith("\x60\x60\x60"))code.push(lines[i]);if(code.length)blocks.push({type:"code",text:code.join("\n")});continue}
  const h=s.match(/^(#{1,6})\s+(.+)/);
  if(h){flush();blocks.push({type:"h"+Math.min(3,h[1].length),text:h[2]});continue}
  if(/^---+$/.test(s)){flush();continue}
  if(s.startsWith("|")&&s.endsWith("|")){
   flush();const rows=[];let j=i;
   for(;j<lines.length;j++){
    const line=lines[j].trim();if(!line.startsWith("|")||!line.endsWith("|"))break;
    const parts=line.slice(1,-1).split("|").map(plain).slice(0,6);
    if(parts.every(x=>/^:?-{2,}:?$/.test(x)))continue;
    rows.push(parts);
   }
   if(rows.length)blocks.push({type:"table",rows});i=j-1;continue;
  }
  const bullet=s.match(/^[-*]\s+(.+)$/),num=s.match(/^\d+[.)]\s+(.+)$/);
  if(bullet||num){flush();blocks.push({type:num?"ol":"ul",text:(num||bullet)[1]});continue}
  if(s.startsWith(">")){flush();blocks.push({type:"quote",text:s.slice(1).trim()});continue}
  batch.push(s);
 }flush();return blocks;
}
export function makeResearchReport({answer,sources=[],language="id",title=null,charts=[],generatedAt=null,question="",mode=""}={}){
 const lang=language==="en"?"en":"id";
 const q=trim(question);
 // One precisely requested statutory article is a focused legal note,
 // not a ten-reference literature review. One independently linked
 // original law source is an initial metadata threshold ONLY, never
 // publication-ready verification.
 const legalFocus=/\b(?:pasal|article)\s+\d+[a-z]?\b/i.test(q)&&
  /\b(?:uu|undang[\s-]*undang|pp|peraturan\s+pemerintah|perpres|peraturan\s+presiden|perda|permen|pergub|perbup|perwali)\s*(?:(?:no\.?|nomor)\s*)?\d+/i.test(q);
 const requiredMinimum=legalFocus?1:10;
 const refs=bibliographyReport(answer,sources,requiredMinimum);
 refs.reference_policy=legalFocus?"focused_legal_article":"broad_research";
 refs.legal_focus=legalFocus;
 const body=markdownBlocks(substituteCitations(answer,refs.references)),chartBlocks=[];
 if(title&&body[0]?.type==="h1"&&plain(body[0].text).toLowerCase()===plain(title).toLowerCase())body.shift();
 for(const ch of (Array.isArray(charts)?charts:[]).slice(0,12)){
  const points=Array.isArray(ch?.points)?ch.points:[];if(!points.length)continue;
  chartBlocks.push({type:"h3",text:trim(ch.title)||"Data"});
  chartBlocks.push({type:"table",rows:[["Indikator","Nilai","Sumber"],...points.slice(0,60)
   .map(p=>[trim(p.label),trim(p.value)+" "+trim(ch.unit),trim(p.source)])]});
  if(ch.note)chartBlocks.push({type:"p",text:"Catatan: "+trim(ch.note)});
 }
 const d=generatedAt?new Date(generatedAt):new Date();
 return {language:lang,title:title||(lang==="id"?"Laporan Riset Strategic Latitude Intelligence":
   "Strategic Latitude Intelligence Research Report"),
  date:Number.isFinite(d.getTime())?d.toISOString().slice(0,10):"",
  body,charts:chartBlocks,refs,report_scope:refs.reference_policy,
  disclaimer:lang==="id"?"Draf berbantuan AI. Periksa dokumen primer, angka, metodologi dan semua sitasi sebelum publikasi.":
   "AI-assisted draft. Review original documents, measurements, methods and all citations before publication."};
}
