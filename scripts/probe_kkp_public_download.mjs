/* Use the KKP portal's OWN 'Unduh Data' UI only; no guessed or undocumented APIs.
 * The source file stays ephemeral on the CI runner; write only a provenance audit artifact.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {execFileSync} from "node:child_process";
import {chromium} from "playwright-core";
const url="https://portaldata.kkp.go.id/datainsight/produksi-ikan-pembenihan";
const out="artifacts/sli-kkp-hatchery-download-probe.json";
const result={schema:"sli-kkp-2024-hatchery-official-download-gate-v1",checked_at_utc:new Date().toISOString(),
 official_source_url:url,download_status:"not_attempted",expected_source_rows:1387,existing_transcribed_rows:10,
 rights_reviewed:false,public_repo_rows_added:0,source_export_uploaded:false,notes:["Official KKP UI only; no guessed private API endpoints.","Downloaded source removed on runner cleanup; artifact stores only validation/audit metadata."]};
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",headless:true,args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]});
 const context=await browser.newContext({acceptDownloads:true,locale:"id-ID",viewport:{width:1380,height:900}});
 const page=await context.newPage();
 const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
 result.page_http=response?.status()??null;
 if(!response?.ok())throw Error("KKP_official_page_unavailable");
 const downloadEvents=[],eventRequests=[],eventResponses=[],popupSources=[];
 // Diagnostics cover only public response metadata and pathnames, never source rows or cookies.
 page.on("download",d=>downloadEvents.push(d));
 context.on("page",popup=>{popupSources.push(popup.url().split("?")[0]);popup.on("download",d=>downloadEvents.push(d))});
 page.on("request",req=>{if(eventRequests.length<25){try{const u=new URL(req.url());if(u.hostname==="portaldata.kkp.go.id")eventRequests.push({method:req.method(),path:u.pathname})}catch{}}});
 page.on("response",response=>{if(eventResponses.length<25){try{const u=new URL(response.url());const type=response.headers()["content-type"]||"";const disp=response.headers()["content-disposition"]||"";if(u.hostname==="portaldata.kkp.go.id"&&(response.request().method()!=="GET"||/csv|excel|spreadsheet|octet-stream/i.test(type+disp)))eventResponses.push({status:response.status(),path:u.pathname,type:type.slice(0,80),disposition:!!disp})}catch{}}});
 const button=page.getByRole("button",{name:/Unduh Data/i}).first();
 await button.waitFor({state:"visible",timeout:45000});
 result.source_button_seen=true;
 result.button_html=String(await button.evaluate(el=>el.outerHTML)).slice(0,350);
 let download;
 try{
  await button.click({timeout:25000});
  if(downloadEvents.length)download=downloadEvents[0];
  else download=await Promise.race([
    page.waitForEvent("download",{timeout:35000}).catch(()=>null),
    new Promise(resolve=>setTimeout(()=>resolve(downloadEvents[0]||null),36000))
  ]);
  if(!download)throw Error("No_file_event");
 }catch(err){
  result.download_status="download_ui_not_returning_file";
  result.request_metadata=eventRequests.slice(-20);
  result.response_metadata=eventResponses.slice(-20);
  result.popup_paths=popupSources.slice(0,5);
  throw Error("Unduh_Data_click_failed_or_no_attachment");
 }
 result.request_metadata=eventRequests.slice(-20);
 result.response_metadata=eventResponses.slice(-20);
 result.popup_paths=popupSources.slice(0,5);
 const name=path.basename(download.suggestedFilename()).replace(/[^a-zA-Z0-9._-]/g,"_");
 const temp=path.join("/tmp","sli-kkp-source-"+name);
 await download.saveAs(temp);
 const bytes=fs.readFileSync(temp);
 result.download_status="file_received_unreviewed";
 result.filename_extension=path.extname(name).toLowerCase();
 result.size_bytes=bytes.length;
 result.sha256=crypto.createHash("sha256").update(bytes).digest("hex");
 if(bytes.length<1000||bytes.length>30e6)throw Error("suspicious_file_size");
 if([".csv",".txt"].includes(result.filename_extension)){
  const snippet=bytes.toString("utf8",0,200);
  if(!snippet.includes("Tahun")&&!snippet.includes("tahun"))throw Error("CSV_missing_expected_KKP_headers");
  try{
   execFileSync("python3",["scripts/import_kkp_hatchery_export.py","--csv",temp,"--audit","artifacts/kkp-hatchery-export-review.json"],{timeout:60000,stdio:["ignore","pipe","pipe"]});
   result.download_status="complete_1387_csv_validated_pending_rights";
   result.preview_10_crosscheck="pass";
  }catch(e){
   result.download_status="file_received_but_1387_import_validation_failed";
   result.validation_error=String(e.stderr||e.message).slice(-500);
  }
 }else if(bytes[0]===0x50&&bytes[1]===0x4b){
  result.download_status="xlsx_received_needs_review_conversion_and_1387_validation";
 }else result.download_status="unknown_download_format_pending_review";
 fs.unlinkSync(temp);
 await context.close();
}catch(e){
 result.error=String(e.message||e).slice(0,200);
}finally{if(browser)await browser.close().catch(()=>{});}
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(result,null,2)+"\n");
console.log("KKP HATCHERY DOWNLOAD GATE",JSON.stringify(result));
if(process.env.SLI_REQUIRE_KKP_EXPORT==="true"&&result.download_status!=="complete_1387_csv_validated_pending_rights")process.exitCode=1;
