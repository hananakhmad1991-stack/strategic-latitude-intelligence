/* PRIVATE Owner evidence: make locally reviewable artifacts from the ACTUAL Worker answer.
 * Nothing in this module uploads, publishes, signs off, or logs complete report text.
 * The response is whitelisted. Token/headers/raw request/env are never serialized.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {pathToFileURL,fileURLToPath} from "node:url";
import {makeResearchReport} from "../js/sli-report-content.mjs";
import {printableResearchHtml} from "../js/sli-report-pdf.mjs";
import {docxBytes} from "../js/sli-report-docx.mjs";

const reviewedType="reviewed_primary_article_paraphrase";
const boundedArticle=/\b(?:pasal|article)\s+(\d+[a-z]?)\b/gi;
const scriptRoot=path.resolve(fileURLToPath(new URL("../",import.meta.url)));
const words=s=>String(s??"").trim();
const safeFile=(directory,file,content)=>{
 const target=path.join(directory,file);
 fs.writeFileSync(target,content,{flag:"wx",mode:0o600});
 return target;
};
function segments(answer){
 return String(answer||"").replace(/\r/g,"").split(/\n+/)
  .map(s=>s.trim()).filter(s=>s&&!/^#{1,6}\s/.test(s)&&!/^\|[\s|:-]+\|$/.test(s))
  .flatMap(line=>line.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ÿ])/u))
  .map(s=>s.replace(/^[-*]\s+/,"").trim()).filter(s=>s.length>=18);
}
const citationNumbers=s=>[...s.matchAll(/\[(\d{1,3})\]/g)].map(m=>Number(m[1]));

export function draftOwnerClaimAudit({question,answer,sources,referenceArticle="Pasal 1",referenceInstrument="UU 16/2016"}){
 const docs=Array.isArray(sources)?sources:[];
 const claims=segments(answer).map((sentence,i)=>{
   const refs=citationNumbers(sentence);
   const linked=refs.map(n=>({index:n,document:docs[n-1]}));
   const flags=[];
   if(!refs.length)flags.push("citation_missing_in_sentence");
   if(refs.some(n=>!Number.isInteger(n)||n<1||n>docs.length))flags.push("citation_index_out_of_range");
   const primary=linked.filter(x=>x.document?.source_type===reviewedType&&
     x.document?.provision_anchor?.instrument_ref===referenceInstrument&&
     x.document?.provision_anchor?.article===referenceArticle&&
     /^https:\/\/[^?#]+\.pdf(?:[?#].*)?$/i.test(x.document?.source_url||""));
   if(!primary.length)flags.push("matching_primary_article_anchor_missing");
   const requested=referenceArticle.match(/\d+[a-z]?/i)?.[0]?.toLowerCase();
   for(const m of sentence.matchAll(boundedArticle)){
     if(m[1].toLowerCase()!==requested){flags.push("mentions_different_unreviewed_article");break}
   }
   if(/\b(?:terbaru|saat ini|masih berlaku|konsolidasi|telah diubah|terakhir diubah|currently in force|in effect|consolidated)\b/i.test(sentence))
      flags.push("current_operative_law_requires_separate_check");
   if(/\b(?:otomatis berizin|izin otomatis|pasti sah|telah disetujui proyek|automatic permission|project approved)\b/i.test(sentence))
      flags.push("specific_project_approval_requires_evidence");
   return {claim_id:"C"+String(i+1).padStart(3,"0"),sentence,
      cited_source_numbers:refs,primary_match_numbers:primary.map(x=>x.index),
      risk_flags:[...new Set(flags)],
      original_pdf_review:"PENDING_HUMAN_CHECK",
      primary_text_quote:null,reviewer_finding:null,
      status:"HUMAN_PRIMARY_SOURCE_REVIEW_REQUIRED"};
 });
 const sourceRegister=docs.map((s,i)=>({
   number:i+1,title:words(s?.title),publisher:words(s?.publisher),
   source_type:words(s?.source_type),source_url:words(s?.source_url),
   article:words(s?.provision_anchor?.article),instrument:words(s?.provision_anchor?.instrument_ref),
   source_review_scope:"Primary anchor metadata, not current consolidated legal certification"
 }));
 return {schema:"sli-owner-private-claim-audit-v1",question:String(question||""),reference_instrument:referenceInstrument,
   reference_article:referenceArticle,
   source_register:sourceRegister,claim_count:claims.length,
   automated_flags:claims.filter(c=>c.risk_flags.length).length,
   full_sentence_semantic_verification:false,
   source_verification_status:"HUMAN_REVIEW_REQUIRED",
   verdict:"DRAFT_NOT_CERTIFIED",
   original_law_scope_only:true,claims,
   instructions:"For EACH C-numbered sentence compare its exact assertion with the original official PDF page, quote that page, record exceptions, and separately check amendments/current law. Do not treat a [1] citation as proof of entailment."};
}
export function ownerReviewMarkdown(audit){
 const lines=[
 "# DERGUBA OWNER — PRIVATE CLAIM-BY-CLAIM REVIEW",
 "",
 "**PRIVATE DRAFT — NOT VERIFIED LEGAL ADVICE OR PUBLICATION APPROVAL**",
 "",
 "Source instrument: "+audit.reference_instrument+" "+audit.reference_article,
 "Total claim segments: "+audit.claim_count,
 "Automatic warning segments: "+audit.automated_flags,
 "**Every segment still requires human page-level verification.**",
 "",
 "## Original source register",...audit.source_register.map(s=>
   "- ["+s.number+"] "+s.instrument+" "+s.article+" | "+s.title+" | "+s.source_type+" | "+s.source_url),
 "",
 "## Review checklist"];
 for(const c of audit.claims){
   lines.push("", "### "+c.claim_id+" — HUMAN REVIEW REQUIRED", "> "+c.sentence.replace(/\n/g," "),
     "- Source number(s): "+(c.cited_source_numbers.join(", ")||"missing"),
     "- Primary matching source(s): "+(c.primary_match_numbers.join(", ")||"none"),
     "- Flags: "+(c.risk_flags.join(", ")||"none detected (NOT certified)"),
     "- [ ] Open original official PDF; verify page and exact statement",
     "- [ ] Check legal instrument, article, amendments and current effect",
     "- [ ] Record verbatim primary quote and page number",
     "- [ ] Mark **supported / contradicted / needs context** with reviewer name and date");
 }
 return lines.join("\n")+"\n";
}
const browserCandidates=()=>{
 const dirs=[process.env.PROGRAMFILES,process.env["PROGRAMFILES(X86)"],process.env.LOCALAPPDATA].filter(Boolean);
 return dirs.flatMap(d=>[
   path.join(d,"Google","Chrome","Application","chrome.exe"),
   path.join(d,"Microsoft","Edge","Application","msedge.exe")
 ]).filter(p=>fs.existsSync(p));
};
export function renderPrivatePdf({htmlPath,pdfPath,browserExecutable}){
 const exe=browserExecutable||browserCandidates()[0];
 if(!exe)return {created:false,status:"no_local_browser_found_open_html_and_print_to_pdf"};
 // Browser child must NEVER inherit Owner tokens or API credentials.
 const childEnv={...process.env};
 for(const name of Object.keys(childEnv)){
   if(/TOKEN|SECRET|API_KEY|AUTHORIZATION|PASSWORD/i.test(name))delete childEnv[name];
 }
 const r=spawnSync(exe,["--headless=new","--disable-extensions","--disable-gpu",
   "--no-first-run","--no-default-browser-check","--no-pdf-header-footer",
   "--print-to-pdf="+pdfPath,pathToFileURL(htmlPath).href],
   {encoding:"utf8",timeout:40000,windowsHide:true,env:childEnv});
 const exists=fs.existsSync(pdfPath);
 const valid=exists&&fs.statSync(pdfPath).size>1200&&fs.readFileSync(pdfPath).subarray(0,4).toString("ascii")==="%PDF";
 if(!valid&&exists)fs.rmSync(pdfPath,{force:true});
 return {created:!!valid,status:valid?"local_pdf_rendered":"local_pdf_render_unavailable_use_browser_print"};
}
export function saveOwnerPrivateEvidence({question,response,outputBase,renderPdf=true}){
 if(!response||typeof response.answer!=="string"||response.answer.length<40)throw Error("owner_answer_missing");
 const q=words(question),answer=response.answer,sources=Array.isArray(response.sources)?response.sources:[];
 // Guardrail: never save raw response (or token) and never allow artifacts inside repository.
 const base=path.resolve(outputBase||path.join(os.homedir(),"SLI-Owner-Private-Reports"));
 const relative=path.relative(scriptRoot,base);
 if(relative===""||(!relative.startsWith(".."+path.sep)&&relative!==".."))
   throw Error("private_evidence_must_be_outside_repo");
 fs.mkdirSync(base,{recursive:true,mode:0o700});
 const folder=fs.mkdtempSync(path.join(base,"derguba-owner-"));
 const report=makeResearchReport({question:q,answer,sources,charts:Array.isArray(response.charts)?response.charts:[],
   language:"id",mode:"executive_summary",title:"DERGUBA Owner — Live Legal Report",generatedAt:new Date().toISOString()});
 const audit=draftOwnerClaimAudit({question:q,answer,sources});
 const html=safeFile(folder,"report.html",printableResearchHtml(report));
 safeFile(folder,"report.docx",docxBytes(report));
 safeFile(folder,"answer.txt",answer+"\n");
 safeFile(folder,"claim-review.json",JSON.stringify(audit,null,2)+"\n");
 safeFile(folder,"claim-review.md",ownerReviewMarkdown(audit));
 const sha256=createHash("sha256").update(answer).digest("hex");
 const info={schema:"sli-owner-private-live-export-v1",created_at_utc:new Date().toISOString(),
    answer_sha256:sha256,owner_token_saved:false,paid_credential_saved:false,
    sources_count:sources.length,claims:audit.claim_count,claim_warnings:audit.automated_flags,
    content_verified:false,report_ready_for_publication:false,
    note:"This is the ACTUAL local live Owner response, NOT source/semantic certification. Never commit or upload this directory without deliberate redaction."};
 safeFile(folder,"manifest.json",JSON.stringify(info,null,2)+"\n");
 let pdf={created:false,status:"not_requested"};
 if(renderPdf)pdf=renderPrivatePdf({htmlPath:html,pdfPath:path.join(folder,"report.pdf")});
 return {directory:folder,claims:audit.claim_count,flags:audit.automated_flags,pdf,
   files:["report.html","report.docx","answer.txt","claim-review.json","claim-review.md","manifest.json",...(pdf.created?["report.pdf"]:[])]};
}
