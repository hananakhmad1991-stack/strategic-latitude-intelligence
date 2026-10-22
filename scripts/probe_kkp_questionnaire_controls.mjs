/* Safe read/selection-only browser probe of the PUBLIC official questionnaire.
 * NO contact information, survey rating, review, or submit button is used.
 */
import fs from "node:fs";
import {chromium} from "playwright-core";
import {KKP_FORM_KEYS,selectKKPDropdown} from "./kkp-questionnaire-controls.mjs";
const URL="https://portaldata.kkp.go.id/datainsight/produksi-ikan-pembenihan";
const values={category:"Umum",purpose:"Penelitian",format:"CSV",type:"Produksi Hasil Kelautan dan Perikanan"};
const out="artifacts/sli-kkp-questionnaire-public-control-probe.json";
const report={schema:"sli-kkp-questionnaire-readonly-controls-v1",checked_at_utc:new Date().toISOString(),form_submitted:false,contact_filled:false,selected_fields:[],status:"unavailable"};
let browser,stage="open_page";
try{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",headless:true,
  args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]});
 const context=await browser.newContext({locale:"id-ID",viewport:{width:1380,height:900}});
 const page=await context.newPage();
 await page.goto(URL,{waitUntil:"domcontentloaded",timeout:40000});
 stage="open_questionnaire";
 await page.getByRole("button",{name:"Unduh Data"}).click({timeout:20000});
 const modal=page.locator('[role="dialog"],.modal.show').filter({visible:true}).first();
 await modal.waitFor({state:"visible",timeout:14000});
 const inputs=await modal.locator('input[role="combobox"]').count();
 if(inputs!==4)throw Error("unexpected_combobox_count");
 for(const [i,key] of KKP_FORM_KEYS.entries()){
  stage="select_"+key;
  await selectKKPDropdown(page,modal,i,values[key]);
  report.selected_fields.push(key);
 }
 report.status="all_four_official_dropdowns_selected_no_submission";
 await context.close();
}catch{
 report.status="control_selection_failed";
 report.failure_stage=stage;
}finally{
 await browser?.close().catch(()=>{});
 fs.mkdirSync("artifacts",{recursive:true});
 fs.writeFileSync(out,JSON.stringify(report,null,2)+"\n");
 console.log("KKP QUESTIONNAIRE CONTROLS SAFE PROBE",JSON.stringify(report));
}
if(report.status!=="all_four_official_dropdowns_selected_no_submission")process.exitCode=1;
