/* Strategic Latitude Intelligence — dependency-free CSV, XLSX, PNG, PDF export formats. */
(()=>{"use strict";
const enc=new TextEncoder();
const escaped=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
const file=(blob,name)=>{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.style.display="none";document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},3000)};
const val=v=>v===null||v===undefined?"":v;
const csvSafe=v=>{let s=String(val(v));if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
const csv=({headers,rows,meta})=>{
 const lines=[];
 lines.push(...[
  ["# Data provenance",meta?.completeness||"documented source"],
  ["# Publisher","Strategic Latitude Intelligence (SLI)"],
  ["# Visual title",meta?.title||""],
  ["# Source",meta?.source||""],
  ["# Source URL",meta?.sourceUrl||""],
  ["# Observation period",meta?.period||""],
  ["# Export time",new Date().toISOString()]
 ].map(row=>row.map(csvSafe).join(",")));
 lines.push(headers.map(csvSafe).join(","));
 for(const row of rows)lines.push(row.map(csvSafe).join(","));
 return new Blob(["\ufeff"+lines.join("\r\n")+"\r\n"],{type:"text/csv;charset=utf-8"});
};
const crcTable=(()=>{let t=[];for(let n=0;n<256;n++){let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=a=>{let crc=0xffffffff;for(const x of a)crc=crcTable[(crc^x)&255]^(crc>>>8);return (crc^0xffffffff)>>>0};
const write16=(a,i,n)=>{a[i]=n&255;a[i+1]=(n>>>8)&255};
const write32=(a,i,n)=>{write16(a,i,n);write16(a,i+2,n>>>16)};
const concat=items=>{const out=new Uint8Array(items.reduce((n,a)=>n+a.length,0));let k=0;for(const a of items){out.set(a,k);k+=a.length}return out};
function zip(files){
 const locals=[],central=[];let offset=0;
 for(const [name,source] of files){
  const path=enc.encode(name),data=typeof source==="string"?enc.encode(source):source,crc=crc32(data);
  const local=new Uint8Array(30+path.length);write32(local,0,0x04034b50);write16(local,4,20);write16(local,6,0x800);
  write16(local,8,0);write16(local,10,0);write16(local,12,0);write32(local,14,crc);write32(local,18,data.length);
  write32(local,22,data.length);write16(local,26,path.length);local.set(path,30);
  locals.push(local,data);
  const cd=new Uint8Array(46+path.length);write32(cd,0,0x02014b50);write16(cd,4,20);write16(cd,6,20);
  write16(cd,8,0x800);write16(cd,10,0);write16(cd,12,0);write16(cd,14,0);
  write32(cd,16,crc);write32(cd,20,data.length);write32(cd,24,data.length);write16(cd,28,path.length);
  write32(cd,42,offset);cd.set(path,46);central.push(cd);
  offset+=local.length+data.length;
 }
 const combined=concat(central);const footer=new Uint8Array(22);write32(footer,0,0x06054b50);
 write16(footer,8,files.length);write16(footer,10,files.length);write32(footer,12,combined.length);write32(footer,16,offset);
 return new Blob([...locals,combined,footer],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
}
function column(n){let s="";for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s}
function spreadsheetCell(v,r,c){
 const at='r="'+column(c)+(r+1)+'"';
 if(typeof v==="number"&&Number.isFinite(v))return "<c "+at+' t="n"><v>'+v+"</v></c>";
 if(typeof v==="boolean")return "<c "+at+' t="b"><v>'+(v?"1":"0")+"</v></c>";
 return "<c "+at+' t="inlineStr"><is><t xml:space="preserve">'+escaped(val(v))+"</t></is></c>";
}
function worksheet(rows){
 const out=['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>','<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetData>'];
 for(let i=0;i<rows.length;i++){out.push('<row r="'+(i+1)+'">');for(let j=0;j<rows[i].length;j++)out.push(spreadsheetCell(rows[i][j],i,j));out.push("</row>")}
 out.push("</sheetData></worksheet>");return out.join("");
}
function xlsx({headers,rows,meta}){
 const dataRows=[headers,...rows];
 const sourceRows=[
 ["Property","Value"],["Publisher","Strategic Latitude Intelligence (SLI)"],
 ["Visual title",meta?.title||""],["Source",meta?.source||""],["Source URL",meta?.sourceUrl||""],
 ["Observation period",meta?.period||""],["Data scope",meta?.completeness||""],
 ["Exported at",new Date().toISOString()],["Notice","Original source rights and licensing remain with their respective owners."]
 ];
 return zip([
 ["[Content_Types].xml",'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
 ["_rels/.rels",'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
 ["xl/workbook.xml",'<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data" sheetId="1" r:id="rId1"/><sheet name="Sources &amp; Notes" sheetId="2" r:id="rId2"/></sheets></workbook>'],
 ["xl/_rels/workbook.xml.rels",'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
 ["xl/styles.xml",'<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Aptos"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>'],
 ["xl/worksheets/sheet1.xml",worksheet(dataRows)],
 ["xl/worksheets/sheet2.xml",worksheet(sourceRows)]
 ]);
}
const bitmap=(data)=>Uint8Array.from(atob(data),c=>c.charCodeAt(0));
function pdf(canvas){
 const jpeg=canvas.toDataURL("image/jpeg",.91).split(",")[1],image=bitmap(jpeg);
 const pageW=842,pageH=595,margin=35, maxW=pageW-margin*2,maxH=pageH-margin*2;
 const ratio=Math.min(maxW/canvas.width,maxH/canvas.height);
 const width=canvas.width*ratio,height=canvas.height*ratio,left=(pageW-width)/2,bottom=(pageH-height)/2;
 const stream="q\n"+width.toFixed(3)+" 0 0 "+height.toFixed(3)+" "+left.toFixed(3)+" "+bottom.toFixed(3)+" cm\n/Im0 Do\nQ\n";
 const objs=[
 "<< /Type /Catalog /Pages 2 0 R >>",
 "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
 "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>",
 "<< /Type /XObject /Subtype /Image /Width "+canvas.width+" /Height "+canvas.height+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+image.length+" >>\nstream\n",
 "<< /Length "+enc.encode(stream).length+" >>\nstream\n"+stream+"endstream"
 ];
 const segments=[enc.encode("%PDF-1.4\n%SLI\n")],offsets=[0];let offset=segments[0].length;
 for(let i=0;i<objs.length;i++){
  offsets.push(offset);
  let payload;
  if(i===3)payload=concat([enc.encode((i+1)+" 0 obj\n"+objs[i]),image,enc.encode("\nendstream\nendobj\n")]);
  else payload=enc.encode((i+1)+" 0 obj\n"+objs[i]+"\nendobj\n");
  segments.push(payload);offset+=payload.length;
 }
 const startXref=offset;
 let xref="xref\n0 6\n0000000000 65535 f \n";
 for(let i=1;i<=5;i++)xref+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";
 xref+="trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n"+startXref+"\n%%EOF";
 segments.push(enc.encode(xref));
 return new Blob(segments,{type:"application/pdf"});
}
window.SLIVisualFormats={csv,xlsx,pdf,save:file,zip,escaped};
})();