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
 const downloadEvents=[],eventRequests=[],eventResponses=[],popupSources=[],pageErrors=[],dialogs=[];
 page.on("pageerror",e=>pageErrors.push(String(e?.message||e).slice(0,180)));
 page.on("dialog",d=>{dialogs.push({type:d.type(),message:String(d.message()).slice(0,160)});d.dismiss().catch(()=>{})});
 // Diagnostics cover only public response metadata and pathnames, never source rows or cookies.
 page.on("download",d=>downloadEvents.push(d));
 context.on("page",popup=>{popupSources.push(popup.url().split("?")[0]);popup.on("download",d=>downloadEvents.push(d))});
 page.on("request",req=>{if(eventRequests.length<25){try{const u=new URL(req.url());if(u.hostname==="portaldata.kkp.go.id")eventRequests.push({method:req.method(),path:u.pathname})}catch{}}});
 page.on("response",response=>{if(eventResponses.length<25){try{const u=new URL(response.url());const type=response.headers()["content-type"]||"";const disp=response.headers()["content-disposition"]||"";if(u.hostname==="portaldata.kkp.go.id"&&(response.request().method()!=="GET"||/csv|excel|spreadsheet|octet-stream/i.test(type+disp)))eventResponses.push({status:response.status(),path:u.pathname,type:type.slice(0,80),disposition:!!disp})}catch{}}});
 const button=page.getByRole("button",{name:/Unduh Data/i}).first();
 await button.waitFor({state:"visible",timeout:45000});
 result.source_button_seen=true;
 result.button_html=String(await button.evaluate(el=>el.outerHTML)).slice(0,350);
 result.table_browser_diagnostics=await page.evaluate(()=>{
  const tables=[...document.querySelectorAll("table")].slice(0,8).map((t,i)=>({
   table:i,row_count:t.querySelectorAll("tbody tr").length,
   head:[...t.querySelectorAll("thead th")].slice(0,8).map(x=>(x.textContent||"").trim().slice(0,35))
  }));
  const selects=[...document.querySelectorAll("select")].slice(0,12).map((s,i)=>({
   index:i,value:s.value,options:[...s.options].map(o=>o.value).slice(0,15)
  }));
  const pagination=[...document.querySelectorAll("button,[role=button]")].filter(b=>(b.getAttribute("aria-label")||"").match(/next|page|halaman|prev/i)).slice(0,12).map(b=>({
   title:(b.getAttribute("aria-label")||"").slice(0,50),disabled:!!b.disabled
  }));
  return {tables,selects,pagination};
 });
 let download;
 try{
  await button.click({timeout:25000});
  // Site may require a second-stage download click in its own visible modal.
  await page.waitForTimeout(1800);
  const modal=page.locator('[role="dialog"],.modal.show').filter({visible:true});
  result.modal_visible=await modal.count().catch(()=>0);
  if(result.modal_visible){
   const m=modal.first();
   result.export_modal_text_before=(await m.innerText().catch(()=>"")).replace(/\s+/g," ").slice(0,650);
   result.export_modal_controls=await m.locator("input,select,[role=combobox],[role=radio],[role=checkbox],textarea").evaluateAll(nodes=>nodes.slice(0,18).map(x=>({
    tag:x.tagName,role:x.getAttribute("role"),type:x.getAttribute("type"),placeholder:(x.getAttribute("placeholder")||"").slice(0,60),
    aria:(x.getAttribute("aria-label")||"").slice(0,60),required:!!x.required,checked:!!x.checked,disabled:!!x.disabled,
    options:x.tagName==="SELECT"?[...x.options].map(o=>({label:(o.label||"").slice(0,35),value:o.value})).slice(0,10):undefined
   }))).catch(()=>[]);
  }
  // Discovery only: inspect public-choice text for each questionnaire field.
  // No personal details or questionnaire are submitted in public CI.
  result.export_dropdown_choice_labels=[];
  const choices=modal.first().locator('[role="combobox"]');
  for(let i=0;i<Math.min(await choices.count().catch(()=>0),4);i++){
   const control=choices.nth(i);
   await control.click({timeout:1800}).catch(()=>{});
   await page.waitForTimeout(300);
   const options=await page.locator('[role="option"],.ant-select-item-option,.MuiAutocomplete-option').filter({visible:true}).allInnerTexts().catch(()=>[]);
   result.export_dropdown_choice_labels.push({control_index:i,labels:options.slice(0,24).map(x=>x.trim().slice(0,80))});
   await control.press("Escape").catch(()=>{});
  }
  const dialogButtons=await page.locator('[role="dialog"] button,.modal.show button').filter({visible:true}).all().catch(()=>[]);
  result.export_modal_button_labels=await Promise.all(dialogButtons.slice(0,12).map(b=>b.innerText().then(t=>t.slice(0,50)).catch(()=>"")));
  if(!downloadEvents.length&&result.modal_visible){
   for(const b of dialogButtons){
    const label=await b.innerText().catch(()=>"");
    if(/^(unduh|download|csv|excel|xlsx|export|ekspor)(?:\s+(?:csv|excel|xlsx|data))?$/i.test(label.trim())){
     await b.click({timeout:5000}).catch(()=>{});
     result.export_modal_confirmation_clicked=true;await page.waitForTimeout(900);
     result.export_modal_text_after=(await modal.first().innerText().catch(()=>"")).replace(/\s+/g," ").slice(0,650);
     break;
    }
   }
  }
  result.browser_new_tab_count=context.pages().length;
  result.ui_download_links=await page.locator('a[download],a[href^="blob:"]').count().catch(()=>0);
  result.button_disabled_after_click=await button.isDisabled().catch(()=>null);
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
  result.page_errors=pageErrors.slice(-4);
  result.native_dialogs=dialogs.slice(-4);
  result.visible_post_click_buttons=(await page.locator("button:visible").allInnerTexts().catch(()=>[])).filter(t=>/unduh|export|excel|csv|xlsx/i.test(t)).slice(0,12).map(t=>t.slice(0,60));
  throw Error("Unduh_Data_click_failed_or_no_attachment");
 }
 result.request_metadata=eventRequests.slice(-20);
 result.response_metadata=eventResponses.slice(-20);
 result.popup_paths=popupSources.slice(0,5);
 result.page_errors=pageErrors.slice(-4);
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
