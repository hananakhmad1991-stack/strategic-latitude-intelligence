/* Consent-gated official KKP hatchery export. NEVER run in pull requests or
 * log the submitter's name/email, saved survey text or full source rows.
 * GitHub Actions is required to supply both genuine contact secrets.
 */
import {chromium} from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import {execFileSync} from "node:child_process";
import {selectKKPDropdown,selectKKPRating,KKP_FORM_KEYS} from "./kkp-questionnaire-controls.mjs";
import {observeKKPDownload} from "./kkp-official-download-observer.mjs";

const URL="https://portaldata.kkp.go.id/datainsight/produksi-ikan-pembenihan";
const out="artifacts/sli-kkp-authorized-hatchery-export-review.json";
const choices={
 category:["Pelajar / Mahasiswa","Lembaga Pemerintahan","Umum"],
 purpose:["Penelitian","Tugas Sekolah / Kuliah","Pemerintahan","Komersial"],
 format:["Excel","CSV"],
 type:["Pelaku Usaha Kelautan dan Perikanan (Kusuka)","Produksi Hasil Kelautan dan Perikanan",
       "Data Sarana dan Prasarana","PDB Perikanan","Angka Konsumsi Ikan (AKI)",
       "Ekspor impor hasil perikanan","Metadata","Data Proritas","Lainnya"]
};
function get(k){return String(process.env[k]||"").trim()}
export function validFormSelections(v){
 return ["category","purpose","format","type"].every(k=>choices[k].includes(v[k]))&&
 /^[1-5]$/.test(String(v.rating))&&
 (Number(v.rating)>3||typeof v.review==="string"&&v.review.trim().length>=15);
}
const review={schema:"sli-kkp-official-hatchery-authorized-export-v1",source_url:URL,
 expected_rows:1387,verified_rows:null,download_status:"not_submitted",
 consent_to_kkp_form:false,source_rights_clearance:false,public_sli_ingestion:false,
 checked_at_utc:new Date().toISOString(),personal_identifiers_recorded:false,submission_click_acknowledged:false};
let browser,tempDir,stage="consent_preflight";
try{
 if(get("KKP_EXPORT_CONSENT")!=="true")throw Error("operator_consent_missing");
 const name=get("KKP_CONTACT_NAME"),email=get("KKP_CONTACT_EMAIL");
 if(name.length<4||name.length>120||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error("genuine_contact_secrets_required");
 const fields={category:get("KKP_EXPORT_CATEGORY"),purpose:get("KKP_EXPORT_PURPOSE"),
  format:get("KKP_EXPORT_FORMAT"),type:get("KKP_EXPORT_DATA_TYPE"),
  rating:get("KKP_EXPORT_RATING"),review:get("KKP_EXPORT_REVIEW")};
 if(!/^[1-5]$/.test(fields.rating))throw Error("kkp_rating_selection_required");
 if(Number(fields.rating)<=3&&fields.review.trim().length<15)throw Error("kkp_review_required_for_low_rating");
 if(!validFormSelections(fields))throw Error("invalid_or_unapproved_survey_choices");
 stage="launch_browser";
 browser=await chromium.launch({executablePath:get("CHROME_BIN")||"/usr/bin/google-chrome",headless:true,
  args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]});
 const context=await browser.newContext({acceptDownloads:true,locale:"id-ID",viewport:{width:1365,height:920}});
 const page=await context.newPage();
 stage="open_kkp_page";
 const start=await page.goto(URL,{waitUntil:"domcontentloaded",timeout:45000});
 if(!start?.ok())throw Error("kkp_form_http_unavailable");
 stage="open_official_questionnaire";
 await page.getByRole("button",{name:"Unduh Data"}).click({timeout:20000});
 const modal=page.locator('[role="dialog"],.modal.show').filter({visible:true}).first();
 await modal.waitFor({state:"visible",timeout:15000});
 stage="fill_contact_name";
 await modal.getByPlaceholder("Masukkan Nama Lengkap").fill(name);
 stage="fill_contact_email";
 await modal.getByPlaceholder("Masukkan Email").fill(email);
 for(const [i,key] of KKP_FORM_KEYS.entries()){
  stage="select_"+key;
  await selectKKPDropdown(page,modal,i,fields[key]);
 }
 stage="select_rating";
 await selectKKPRating(modal,fields.rating);
 if(fields.review){
  stage="fill_review";
  await modal.getByPlaceholder("Masukkan Ulasan").fill(fields.review);
 }
 review.consent_to_kkp_form=true;
 stage="submit_official_questionnaire";
 // Install listeners on ALL tabs BEFORE the single user-authorized click.
 // The public KKP app may issue a download from a popup rather than this page.
 const observer=observeKKPDownload(context,{timeoutMs:90000});
 try{
  await modal.getByRole("button",{name:"Unduh",exact:true}).click({timeout:20000});
  review.submission_click_acknowledged=true;
 }catch(e){observer.cancel();throw e;}
 stage="wait_for_official_export";
 const dl=await observer.promise;
 review.browser_export_diagnostics=observer.diagnostics();
 if(!dl){
  // Only booleans/counts; never log the rendered modal contents or PII.
  review.ui_after_click={
   questionnaire_still_visible:await modal.isVisible().catch(()=>false),
   validation_indicator_count:await modal.locator('[aria-invalid="true"],.invalid-feedback,.MuiFormHelperText-error,[role="alert"]').count().catch(()=>0),
   popup_tab_count:Math.max(0,context.pages().length-1)
  };
  throw Error("kkp_no_browser_download_event");
 }
 stage="validate_official_export";
 tempDir=fs.mkdtempSync(path.join(os.tmpdir(),"sli-kkp-approved-export-"));
 const filename=String(dl.suggestedFilename()).replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,80);
 const temp=path.join(tempDir,filename);
 await dl.saveAs(temp);
 const data=fs.readFileSync(temp);
 review.received_bytes=data.length;
 review.sha256=crypto.createHash("sha256").update(data).digest("hex");
 review.file_ext=path.extname(filename).toLowerCase();
 if(data.length<200||data.length>30_000_000)throw Error("suspicious_export_file_size");
 let sourceForValidator=temp;
 if(review.file_ext===".xlsx"){
  sourceForValidator=path.join(tempDir,"kkp-official-excel-validated-conversion.csv");
  try{
   execFileSync("python3",["scripts/convert_kkp_hatchery_xlsx_to_csv.py",temp,sourceForValidator],{timeout:60000,stdio:["ignore","pipe","pipe"]});
   review.xlsx_conversion="exact_1387_rows_candidate_for_full_primary_crosscheck";
  }catch(e){
   review.download_status="official_xlsx_received_but_conversion_needs_source_review";
   throw Error("xlsx_schema_or_1387_row_count_failed");
  }
 }else if(![".csv",".txt"].includes(review.file_ext)){
  review.download_status="file_received_unrecognized_format";
  throw Error("unsupported_source_download_format");
 }
 const audit="artifacts/kkp-hatchery-export-review.json";
 try{
  execFileSync("python3",["scripts/import_kkp_hatchery_export.py","--csv",sourceForValidator,"--audit",audit],{timeout:60000,stdio:["ignore","pipe","pipe"]});
  const a=JSON.parse(fs.readFileSync(audit,"utf8"));
  review.verified_rows=a.rows;
  review.preview_top10_reconciled=a.preview_top10_reconciled;
  review.download_status="official_full_1387_csv_validated_pending_rights";
 }catch(e){
  review.download_status="official_csv_received_needs_schema_or_count_review";
  review.validator_exit_code=Number(e.status)||1;
  // Never dump stdout/stderr: content may contain source data or form inputs.
 }
 await context.close();
}catch(e){
 // Stage-only diagnostics keep form contents, email and Playwright page fragments
 // out of the publicly visible audit and the runner console.
 const recognized=new Set(["operator_consent_missing","genuine_contact_secrets_required","invalid_or_unapproved_survey_choices","kkp_rating_selection_required","kkp_review_required_for_low_rating","kkp_form_http_unavailable","kkp_no_browser_download_event","kkp_rating_control_not_found","suspicious_export_file_size","xlsx_schema_or_1387_row_count_failed","unsupported_source_download_format"]);
 const raw=String(e?.message||"");
 review.error_code=recognized.has(raw)?raw:"failure_at_"+stage;
 review.failure_stage=stage;
 if(review.download_status==="not_submitted"&&review.consent_to_kkp_form){
  review.download_status=review.submission_click_acknowledged?
   "download_button_clicked_no_file_observed":"questionnaire_not_confirmed_submitted";
 }
}finally{
 await browser?.close().catch(()=>{});
 if(tempDir)fs.rmSync(tempDir,{recursive:true,force:true});
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify(review,null,2)+"\n");
 console.log("KKP AUTHORIZED EXPORT STATUS",JSON.stringify(review));
}
if(review.download_status!=="official_full_1387_csv_validated_pending_rights")process.exitCode=1;
