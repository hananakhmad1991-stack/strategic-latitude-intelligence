/* No-network editable Word .docx exporter. OOXML ZIP uses stored entries + CRC32. */
import {plain,escapeMarkup} from "./sli-report-content.mjs";
const enc=new TextEncoder(),crcTable=Array.from({length:256},(_,i)=>{
 let c=i;for(let j=0;j<8;j++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);return c>>>0});
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function put16(view,pos,v){view.setUint16(pos,v,true)}
function put32(view,pos,v){view.setUint32(pos,v>>>0,true)}
export function zipStored(entries){
 if(entries.length>100)throw Error("Too many OOXML files");
 const records=[],central=[];let offset=0;
 for(const [name,value] of entries){
  const file=enc.encode(String(value)),label=enc.encode(name);
  if(file.length>5000000)throw Error("Report exceeds local export limit");
  const check=crc32(file),local=new Uint8Array(30+label.length+file.length),d=new DataView(local.buffer);
  put32(d,0,0x04034b50);put16(d,4,20);put16(d,6,0);put16(d,8,0);put32(d,14,check);
  put32(d,18,file.length);put32(d,22,file.length);put16(d,26,label.length);
  local.set(label,30);local.set(file,30+label.length);records.push(local);
  const header=new Uint8Array(46+label.length),h=new DataView(header.buffer);
  put32(h,0,0x02014b50);put16(h,4,20);put16(h,6,20);put32(h,16,check);
  put32(h,20,file.length);put32(h,24,file.length);put16(h,28,label.length);put32(h,42,offset);
  header.set(label,46);central.push(header);offset+=local.length;
 }
 const centralSize=central.reduce((x,y)=>x+y.length,0),tail=new Uint8Array(22),e=new DataView(tail.buffer);
 put32(e,0,0x06054b50);put16(e,8,entries.length);put16(e,10,entries.length);
 put32(e,12,centralSize);put32(e,16,offset);
 const bytes=new Uint8Array(offset+centralSize+22);let at=0;
 for(const r of [...records,...central,tail]){bytes.set(r,at);at+=r.length}
 return bytes;
}
const tag=t=>'<w:r><w:t xml:space="preserve">'+escapeMarkup(plain(t))+'</w:t></w:r>';
const para=(text,style="Normal",extra="")=>'<w:p><w:pPr><w:pStyle w:val="'+style+'"/>'+extra+
 '</w:pPr>'+tag(text)+'</w:p>';
function table(rows){
 if(!rows?.length)return "";
 const columns=Math.max(1,Math.min(6,Math.max(...rows.map(row=>row.length)))),width=Math.floor(9000/columns);
 const grid='<w:tblGrid>'+Array.from({length:columns},()=>'<w:gridCol w:w="'+width+'"/>').join("")+'</w:tblGrid>';
 return '<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders>'+
  '<w:bottom w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/>'+
  '</w:tblBorders></w:tblPr>'+grid+rows.map((row,i)=>'<w:tr>'+
   Array.from({length:columns},(_,j)=>'<w:tc><w:tcPr><w:tcW w:w="'+width+
   '" w:type="dxa"/></w:tcPr>'+para(row[j]||"",i===0?"TableHeader":"TableText")+'</w:tc>').join("")+'</w:tr>').join("")+'</w:tbl>';
}
function blocks(items){
 return items.map(b=>b.type==="table"?table(b.rows):para(
  (b.type==="ul"?"• ":"")+String(b.text||""),
  {h1:"Heading1",h2:"Heading2",h3:"Heading3",ol:"ListParagraph",ul:"ListParagraph",
   code:"Code",quote:"Quote"}[b.type]||"Normal")).join("");
}
function stylesheet(){
 const styles=[["Normal",22,false,"both",145],["Title",40,true,"left",220],
  ["Heading1",32,true,"left",230],["Heading2",28,true,"left",190],
  ["Heading3",25,true,"left",145],["ListParagraph",22,false,"both",95],
  ["TableText",18,false,"left",55],["TableHeader",18,true,"left",55],
  ["Bibliography",22,false,"left",120],["Caution",19,false,"left",100],
  ["Quote",22,false,"both",100],["Code",18,false,"left",80]];
 return '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'+
  styles.map(([id,size,bold,align,after])=>'<w:style w:type="paragraph" w:styleId="'+id+'">'+
   '<w:name w:val="'+id+'"/><w:pPr><w:jc w:val="'+align+'"/>'+
   '<w:spacing w:after="'+after+'" w:line="340" w:lineRule="auto"/>'+
   (id==="Bibliography"?'<w:ind w:left="720" w:hanging="720"/>':"")+
   (id.startsWith("Heading")?'<w:keepNext/>':"")+
   '</w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/>'+
   (bold?'<w:b/>':"")+'<w:sz w:val="'+size+'"/></w:rPr></w:style>').join("")+'</w:styles>';
}
export function docxBytes(report){
 const sect='<w:sectPr><w:headerReference w:type="default" r:id="rId2"/>'+
  '<w:footerReference w:type="default" r:id="rId3"/><w:pgSz w:w="11906" w:h="16838"/>'+
  '<w:pgMar w:top="1440" w:right="1250" w:bottom="1350" w:left="1450" w:header="550" w:footer="600"/></w:sectPr>';
 const cited=report.refs.references.map(x=>{
  const left=(x.author?x.author+". ":"")+"("+(x.year||"n.d.")+"). ";
  const emphasized='<w:r><w:rPr><w:i/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t xml:space="preserve">'+escapeMarkup(x.title||"[Judul tidak tercatat]")+'</w:t></w:r>';
  return '<w:p><w:pPr><w:pStyle w:val="Bibliography"/></w:pPr>'+
   tag(left)+emphasized+tag(". "+(x.url||"[URL dokumen asli belum tersedia]"))+'</w:p>';
 }).join("");
 const draft=report.refs.meets_preliminary_minimum?"":para("DRAF — REFERENSI BELUM MEMENUHI MINIMUM 10","Caution");
 const warnings=para(report.refs.warning,"Caution")+para(report.disclaimer,"Caution");
 const document='<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '+
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>'+
  para(report.title,"Title")+para("SLI Research AI · "+report.date,"Caution")+draft+
  blocks(report.body)+(report.charts.length?para("Data Pendukung","Heading1")+blocks(report.charts):"")+
  para(report.language==="id"?"Daftar Pustaka (APA Edisi 7)":"References (APA 7th edition)","Heading1")+
  warnings+cited+sect+'</w:body></w:document>';
 const header='<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p>'+
  '<w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>'+
  '<w:b/><w:color w:val="B0BAC4"/><w:sz w:val="25"/></w:rPr>'+
  '<w:t>SLI  ·  STRATEGIC LATITUDE INTELLIGENCE</w:t></w:r></w:p></w:hdr>';
 const footer='<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p>'+
  '<w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial"/>'+
  '<w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">Halaman </w:t></w:r>'+
  '<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r>'+
  '<w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>'+
  '<w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r>'+
  '<w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>';
 const types='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
  '<Default Extension="xml" ContentType="application/xml"/>'+
  ["document","styles","header","footer"].map((x,i)=>
   '<Override PartName="/word/'+(i>1?x+"1":x)+'.xml" ContentType="'+
   'application/vnd.openxmlformats-officedocument.wordprocessingml.'+x+'+xml"/>').join("")+'</Types>';
 const rootRels='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
 const wordRels='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
  [["styles","styles.xml"],["header","header1.xml"],["footer","footer1.xml"]].map(([t,p],i)=>
   '<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/'+t+'" Target="'+p+'"/>').join("")+'</Relationships>';
 return zipStored([["[Content_Types].xml",types],["_rels/.rels",rootRels],
  ["word/document.xml",document],["word/styles.xml",stylesheet()],
  ["word/_rels/document.xml.rels",wordRels],["word/header1.xml",header],["word/footer1.xml",footer]]);
}
