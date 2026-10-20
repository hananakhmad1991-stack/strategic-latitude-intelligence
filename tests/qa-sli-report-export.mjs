import {test} from "node:test";
import assert from "node:assert/strict";
import {bibliographyReport,makeResearchReport} from "../js/sli-report-content.mjs";
import {docxBytes} from "../js/sli-report-docx.mjs";
import {printableResearchHtml} from "../js/sli-report-pdf.mjs";
const source=i=>({title:"Official report "+i,publisher:"Research Institute "+i,
 source_date:"2026-10-19",source_url:"https://www.esdm.go.id/reports/example-"+i+".pdf",
 source_type:"reviewed_primary_article_paraphrase"});
const fullSources=Array.from({length:12},(_,i)=>source(i+1));
const answer="# Analysis of Indonesian strategic investment\n\n## Executive Summary\n\n"+
 "Research reports provide a cautious trend analysis "+Array.from({length:10},(_,i)=>"["+(i+1)+"]").join(" ")+
 ".\n\n### Project status\n\nPlanned is not the same as operational [1].\n\n"+
 "| Project | Evidence |\n| --- | --- |\n| Tangguh UCC | Source [2] |\n\n"+
 "Future work requires source verification.";
const r=()=>makeResearchReport({answer,sources:fullSources,language:"id",generatedAt:"2026-10-20T00:00:00Z",
 title:"SLI Indonesia Research"});

function entries(bytes){
 const d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),out=new Map();
 let offset=0;
 while(offset+30<=bytes.length&&d.getUint32(offset,true)===0x04034b50){
  const labelLen=d.getUint16(offset+26,true),extra=d.getUint16(offset+28,true);
  const length=d.getUint32(offset+18,true),label=bytes.slice(offset+30,offset+30+labelLen);
  const contentStart=offset+30+labelLen+extra;
  const name=new TextDecoder().decode(label);
  out.set(name,new TextDecoder().decode(bytes.slice(contentStart,contentStart+length)));
  offset=contentStart+length;
 }
 return out;
}
test("APA 7 bibliography only includes cited sources, properly ordered, never invents 10",()=>{
 const report=bibliographyReport(answer,fullSources);
 assert.equal(report.cited_unique,10);
 assert.equal(report.metadata_complete_candidates,10);
 assert.equal(report.meets_preliminary_minimum,true);
 assert.equal(report.verified_sources,0);
 assert.equal(report.ready_for_publication,false);
 assert.match(report.references[0].apa,/\(2026\)\./);
 assert.ok(!report.references.some(x=>x.index>10));
 const short=bibliographyReport("Just a claim [1] [2].",fullSources);
 assert.equal(short.references.length,2);
 assert.equal(short.meets_preliminary_minimum,false);
 assert.match(short.warning,/DRAF/);
});
test("discovery snippets, incomplete metadata and duplicates never inflate minimum APA reference count",()=>{
 const src=[{...source(1),source_type:"live_web_discovery"},source(2),
  {...source(2)}, {...source(4),source_date:""}];
 const result=bibliographyReport("Claims [1] [2] [3] [4].",src);
 assert.equal(result.cited_unique,3);
 assert.equal(result.metadata_complete_candidates,1);
 assert.equal(result.meets_preliminary_minimum,false);
 assert.ok(result.references.some(x=>x.aliases.length===2));
});
test("A4 printable HTML is escaped, justified, Arial, page-numbered and contains APA bibliography",()=>{
 const report=r();
 const result=printableResearchHtml(report);
 assert.match(result,/@page \{size:A4/);
 assert.match(result,/text-align:justify/);
 assert.match(result,/Arial/);
 assert.match(result,/@top-right/);
 assert.match(result,/counter\(page\)/);
 assert.match(result,/apa-ref/);
 assert.match(result,/Research Institute 1/);
 assert.ok(result.includes("<i>Official report 1</i>"));
 assert.ok(result.includes("<table>"));
 const unsafe=makeResearchReport({answer:"## <img src=x onerror=alert(1)> [1]",sources:[{...source(1),title:"<script>alert(1)</script>"}]});
 assert.ok(!printableResearchHtml(unsafe).includes("<script>"));
 assert.ok(printableResearchHtml(unsafe).includes("&lt;script&gt;"));
});
test("Word export builds a real WordprocessingML package: Arial 11pt, justified, SLI header and PAGE field",()=>{
 const bytes=docxBytes(r());
 const files=entries(bytes);
 assert.ok(bytes instanceof Uint8Array&&bytes.length>2000);
 for(const name of ["[Content_Types].xml","_rels/.rels","word/document.xml",
  "word/styles.xml","word/header1.xml","word/footer1.xml","word/_rels/document.xml.rels"])
  assert.ok(files.has(name),name);
 assert.match(files.get("[Content_Types].xml"),/wordprocessingml\.document\.main\+xml/);
 assert.match(files.get("word/styles.xml"),/Arial/);
 assert.match(files.get("word/styles.xml"),/w:jc w:val="both"/);
 assert.match(files.get("word/styles.xml"),/w:ind w:left="720" w:hanging="720"/);
 assert.match(files.get("word/header1.xml"),/STRATEGIC LATITUDE INTELLIGENCE/);
 assert.match(files.get("word/footer1.xml"),/PAGE/);
 assert.match(files.get("word/document.xml"),/Daftar Pustaka/);
 assert.match(files.get("word/document.xml"),/w:tbl/);
 assert.match(files.get("word/document.xml"),/w:i\/>/);
});
