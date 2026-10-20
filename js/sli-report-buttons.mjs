/* Report export UI, on-device only. No source text or API credentials uploaded. */
import {makeResearchReport} from "./sli-report-content.mjs";
import {docxBytes} from "./sli-report-docx.mjs";
import {openPdfPrintDialog} from "./sli-report-pdf.mjs";
const el=id=>document.getElementById(id);
function current(){
 const payload=window.SLIResearchAssistant?.getExportData?.();
 return payload?makeResearchReport(payload):null;
}
function status(text,level="ready"){
 const panel=el("raNotice");if(!panel)return;
 panel.textContent=text;panel.dataset.level=level;
}
function save(bytes,name){
 const blob=new Blob([bytes],{type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function updateApaGate(){
 const gate=el("raExportApaGate");if(!gate)return;
 const report=current();if(!report){gate.hidden=true;gate.textContent="";return}
 gate.hidden=false;
 const count=report.refs.metadata_complete_candidates;
 gate.textContent=report.language==="en"
  ?("Source review · "+count+"/"+report.refs.required_minimum+" metadata-complete citations"+(report.refs.legal_focus?
    " · Focused statutory article · AI draft, not legally certified":
    " · Broad research · primary verification required"))
  :("Audit sumber · "+count+"/"+report.refs.required_minimum+" sitasi dengan metadata awal"+(report.refs.legal_focus?
    " · Telaah satu pasal · masih DRAF, status hukum belum disertifikasi":
    " · Riset luas · verifikasi sumber primer tetap diperlukan"));
 gate.dataset.complete=String(report.refs.meets_preliminary_minimum);
}
window.addEventListener("sli:research-export-state",updateApaGate);
export function attachResearchExportButtons(){
 const word=el("raWord"),pdf=el("raPdf");
 if(!word||!pdf)return false;
 updateApaGate();
 word.addEventListener("click",()=>{
  try{
   const report=current();if(!report)return status("Belum ada hasil riset untuk diekspor.","warning");
   save(docxBytes(report),"SLI-Research-AI-"+report.date+".docx");
   status(report.refs.meets_preliminary_minimum
    ?"Dokumen Word DRAF tersimpan. Verifikasi isi dan sitasi sebelum publikasi."
    :"Dokumen Word DRAF tersimpan. "+report.refs.warning,
    report.refs.meets_preliminary_minimum?"ready":"warning");
  }catch(e){status("Ekspor Word gagal: "+String(e.message||e).slice(0,130),"warning")}
 });
 pdf.addEventListener("click",()=>{
  try{
   const report=current();if(!report)return status("Belum ada hasil riset untuk diekspor.","warning");
   if(!openPdfPrintDialog(report,(...args)=>window.open(...args)))return status(
    "Pop-up diblokir browser. Izinkan pop-up untuk SLI lalu klik PDF lagi.","warning");
   status("Di dialog cetak pilih Destination/Tujuan: Save as PDF, ukuran A4. Dokumen ini masih DRAF dan sitasinya harus diverifikasi.",
    report.refs.meets_preliminary_minimum?"ready":"warning");
  }catch(e){status("Ekspor PDF gagal: "+String(e.message||e).slice(0,130),"warning")}
 });
 return true;
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attachResearchExportButtons,{once:true});
else attachResearchExportButtons();
