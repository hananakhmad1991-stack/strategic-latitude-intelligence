/* Render actual SLI draft report exports using real headless Chromium.
 * No credentials, model calls or public data publication. Fixtures are synthetic
 * presentation tests and must never be treated as a verified live AI response.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {chromium} from "playwright-core";
import {makeResearchReport} from "../js/sli-report-content.mjs";
import {printableResearchHtml} from "../js/sli-report-pdf.mjs";
import {docxBytes} from "../js/sli-report-docx.mjs";
import {missingLegalArticleBrief} from "../research-api/src/legal-source-limited.mjs";

const out="artifacts/sli-owner-rendered-reports";
fs.mkdirSync(out,{recursive:true});
const legal=JSON.parse(fs.readFileSync("data/sli-verified-legal-provisions.json","utf8"));
const pasal1=legal.items.find(x=>x.instrument_ref==="UU 16/2016"&&x.article==="Pasal 1");
assert.ok(pasal1,"Reviewed Pasal 1 missing from legal registry");
assert.match(pasal1.source_url,/^https:\/\/.*\.pdf$/i);
assert.match(pasal1.excerpt_id,/Persetujuan Paris/i);
const reviewSource={id:"primary_"+pasal1.id,title:pasal1.citation_label+" — ringkasan tingkat pasal",
 source_url:pasal1.source_url,publisher:pasal1.publisher,source_date:pasal1.as_of,
 provision_anchor:{instrument_ref:pasal1.instrument_ref,article:pasal1.article},
 source_type:"reviewed_primary_article_paraphrase"};
const absentQ="Jelaskan Pasal 99 UU 7/2021";
const absent=missingLegalArticleBrief({question:absentQ,articleEvidence:[],policyEvidence:[],language:"id"});
assert.ok(absent?.source_limited&&absent.model_called===false);
const focusedQ="Jelaskan Pasal 1 UU 16/2016 mengenai pengesahan Persetujuan Paris";
const focusedAnswer="## Ringkasan Pasal 1\n\nPasal 1 UU 16/2016 mengesahkan Persetujuan Paris atas Konvensi Kerangka Kerja PBB mengenai Perubahan Iklim [1].\n\n## Implikasi dan Batasan\n\nNaskah ratifikasi memuat lampiran perjanjian sebagai bagian tidak terpisahkan dari undang-undang. Ketentuan ini tidak dengan sendirinya menjadi perizinan untuk proyek energi tertentu [1].\n\n## Catatan Verifikasi Hukum\n\nNaskah asli telah menjadi dasar ringkasan; status hukum terkonsolidasi dan peraturan sektoral tetap perlu diperiksa terpisah [1].";
const longQ="Uji tata letak laporan berhalaman banyak — BUKAN riset faktual";
const paragraphs=Array.from({length:48},(_,i)=>
 "Paragraf uji tata letak "+String(i+1).padStart(2,"0")+
 ". Ini hanya pengujian pemenggalan teks, margin A4, dan panjang paragraf. "+
 "Tulisan tidak dimaksudkan sebagai klaim statistik, verifikasi hukum, atau rekomendasi komersial. "+
 "Setiap klaim faktual pada dokumen yang sesungguhnya tetap memerlukan sumber primer [1]."
).join("\n\n");
const tableRows=["| Bagian | Keterangan | Status |","| --- | --- | --- |",
 ...Array.from({length:25},(_,i)=>"| Row-"+String(i+1).padStart(2,"0")+
 " | Contoh teks panjang untuk menguji pembungkusan tabel tanpa kehilangan huruf | Draf [1] |")].join("\n");
const longAnswer="# UJI TATA LETAK — BUKAN HASIL MODEL LIVE\n\n## Ringkasan Uji\n\n"+
 paragraphs+"\n\n## Tabel Uji\n\n"+tableRows+
 "\n\n## Catatan Akhir\n\nBATAS_AKHIR_LAPORAN_TERLIHAT_20261022 [1].";

const fixtures=[
 {id:"pasal99",question:absentQ,answer:absent.answer,sources:absent.sources},
 {id:"pasal1",question:focusedQ,answer:focusedAnswer,sources:[reviewSource]},
 {id:"long",question:longQ,answer:longAnswer,sources:[reviewSource]}
];
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",
 headless:true,args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]});
const results=[];
try{
 for(const item of fixtures){
  const report=makeResearchReport({answer:item.answer,sources:item.sources,question:item.question,
   mode:"deep_research",language:"id",title:"SLI Research AI — "+item.id,
   generatedAt:"2026-10-22T00:00:00Z"});
  assert.equal(report.refs.ready_for_publication,false);
  const html=printableResearchHtml(report),word=docxBytes(report);
  assert.match(html,/DRAF BERBANTUAN AI/);
  assert.ok(word.byteLength>3000);
  fs.writeFileSync(out+"/"+item.id+".html",html,"utf8");
  fs.writeFileSync(out+"/"+item.id+".docx",word);
  const ctx=await browser.newContext({viewport:{width:1280,height:900},locale:"id-ID"});
  const page=await ctx.newPage();
  await page.setContent(html,{waitUntil:"load"});
  await page.emulateMedia({media:"print"});
  const dimensions=await page.evaluate(()=>({
    scrollWidth:document.documentElement.scrollWidth,
    clientWidth:document.documentElement.clientWidth,
    tables:[...document.querySelectorAll("table")].map(t=>({
      width:t.getBoundingClientRect().width,
      parentWidth:t.parentElement.getBoundingClientRect().width
    }))
  }));
  assert.ok(dimensions.scrollWidth<=dimensions.clientWidth+8,"Print HTML has horizontal overflow: "+JSON.stringify(dimensions));
  for(const t of dimensions.tables)assert.ok(t.width<=t.parentWidth+3,"Report table overflows printable document");
  const pdf=await page.pdf({format:"A4",preferCSSPageSize:true,printBackground:true,
    displayHeaderFooter:false,margin:{top:"0",bottom:"0",left:"0",right:"0"}});
  assert.ok(pdf.byteLength>1200);
  fs.writeFileSync(out+"/"+item.id+".pdf",pdf);
  results.push({id:item.id,pdf_bytes:pdf.byteLength,docx_bytes:word.byteLength,
    print_horizontal_overflow:false,source_count:report.refs.references.length,
    ready_for_publication:report.refs.ready_for_publication});
  await ctx.close();
  console.log("CHROMIUM RENDERED PASS",item.id,"PDF bytes",pdf.byteLength);
 }
}finally{await browser.close()}
fs.writeFileSync(out+"/browser-report.json",JSON.stringify({
 schema:"sli-owner-rendered-exports-qa-v1",generated_at_utc:new Date().toISOString(),
 limitations:["Synthetic bounded fixtures, NOT authenticated Owner answers",
  "Human visual inspection is separate from automated rendering",
  "A reviewed primary citation does NOT prove current consolidated law"],
 results},null,2));
