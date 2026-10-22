/* Private/browser-only A4 print view; PDF is saved by the user's browser.
 * HTML is escaped, including untrusted source titles and model answers.
 */
import {plain,escapeMarkup} from "./sli-report-content.mjs";
function blocks(items){
 return items.map(b=>{
  const s=escapeMarkup(plain(b.text||""));
  if(/^h[123]$/.test(b.type))return "<"+b.type+">"+s+"</"+b.type+">";
  if(b.type==="table")return "<table>"+b.rows.map((row,i)=>"<tr>"+row.map(x=>
   i===0?"<th>"+escapeMarkup(plain(x))+"</th>":"<td>"+escapeMarkup(plain(x))+"</td>").join("")+"</tr>").join("")+"</table>";
  if(b.type==="ul"||b.type==="ol")return '<p class="listitem">'+(b.type==="ul"?"• ":"")+s+"</p>";
  return "<p>"+s+"</p>";
 }).join("\n");
}
export function printableResearchHtml(report){
 const lang=report.language==="en"?"en":"id",bib=report.refs.references.map(r=>
  '<p class="apa-ref"><strong class="ref-number">['+escapeMarkup(r.aliases.join(", "))+']</strong> '+(r.author?escapeMarkup(r.author)+". ":"")+
  "("+escapeMarkup(r.year||"n.d.")+"). <i>"+escapeMarkup(r.title||"[Judul tidak tercatat]")+
  "</i>. "+escapeMarkup(r.url||"[URL dokumen asli belum tersedia]")+"</p>").join("\n");
 const minimal='<p class="draft">'+(lang==="id"?
  "DRAF BERBANTUAN AI · SITASI DAN KEABSAHAN HUKUM PERLU DIPERIKSA":
  "AI-ASSISTED DRAFT · VERIFY CITATIONS AND CURRENT LEGAL STATUS")+'</p>';
 const styles=[
 '@page {size:A4;margin:26mm 22mm 23mm 25mm;',
 '@top-right{content:"SLI  ·  STRATEGIC LATITUDE INTELLIGENCE";font:700 9pt Arial,sans-serif;color:#a7b1ba}',
 '@bottom-center{content:"Halaman " counter(page) " / " counter(pages);font:9pt Arial,sans-serif;color:#667684}}',
 '*{box-sizing:border-box}html,body{padding:0;margin:0;background:#fff;color:#172735}',
 'body{font:11pt/1.58 Arial,sans-serif}',
 'h1{font:700 20pt/1.27 Arial,sans-serif;margin:14pt 0 7pt}',
 'h2{font:700 15pt/1.32 Arial,sans-serif;margin:21pt 0 9pt;break-after:avoid}',
 'h3{font:700 12.5pt/1.35 Arial,sans-serif;margin:16pt 0 8pt;break-after:avoid}',
 'p{text-align:justify;margin:0 0 10pt;orphans:3;widows:3}',
 '.subtitle{font-size:9pt;text-align:left;color:#647380;margin-bottom:16pt}',
 '.draft{font-weight:700;text-align:left;color:#86521c}',
 '.source-warning{font:9pt/1.5 Arial,sans-serif;text-align:left;color:#465463}',
 '.apa-ref{padding-left:12.7mm;text-indent:-12.7mm;text-align:left;overflow-wrap:anywhere;margin:0 0 9pt;break-inside:avoid}',
 '.report-sources{break-inside:avoid-page;page-break-inside:avoid}',
 '.ref-number{color:#314d60}',
 '.listitem{padding-left:9mm;text-indent:-5mm}',
 'table{border-collapse:collapse;width:100%;table-layout:fixed;margin:11pt 0;font:9pt/1.45 Arial,sans-serif;page-break-inside:auto}',
 'tr{break-inside:avoid;page-break-inside:avoid}',
 'th,td{border:.5pt solid #bcc6cf;padding:4.5pt;text-align:left;vertical-align:top;overflow-wrap:anywhere}',
 'th{background:#eaf0f4}',
 '.note{font-size:9pt;color:#465463;text-align:left;margin-top:18pt}',
 '@media screen{body{max-width:210mm;padding:25mm;margin:24px auto;box-shadow:0 0 14px #becad5}}'
 ].join("\n");
 return '<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8"><title>'+
  escapeMarkup(report.title)+' - SLI</title><style>'+styles+'</style></head><body>'+
  '<h1>'+escapeMarkup(report.title)+'</h1>'+
  '<p class="subtitle">SLI Research AI · '+escapeMarkup(report.date)+'</p>'+minimal+
  blocks(report.body)+(report.charts.length?'<h2>'+ (lang==="id"?"Data Pendukung":"Supporting Data")+
   '</h2>'+blocks(report.charts):"")+
  '<section class="report-sources"><h2>'+(lang==="id"?"Sumber dan Referensi (sitasi bernomor)":"Sources and References (numbered citations)")+'</h2>'+
  '<p class="source-warning">'+escapeMarkup(report.refs.warning)+'</p>'+
  (bib||'<p>Belum ada referensi yang dapat didaftarkan.</p>')+
  '<p class="note">'+escapeMarkup(report.disclaimer)+'</p></section></body></html>';
}
export function openPdfPrintDialog(report,windowOpen){
 // Must be invoked directly on user click so pop-up blockers do not suppress it.
 const win=windowOpen("", "_blank");
 if(!win)return false;
 const content=printableResearchHtml(report);
 win.opener=null;win.document.open();win.document.write(content);win.document.close();
 const print=()=>{win.focus();win.print()};
 if(win.document.readyState==="complete")setTimeout(print,300);
 else win.addEventListener("load",()=>setTimeout(print,150),{once:true});
 return true;
}
