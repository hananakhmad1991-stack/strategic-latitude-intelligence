/* Safe read/selection-only browser probe of the PUBLIC official questionnaire.
 * NO contact information, survey rating, review, or submit button is used.
 */
import fs from "node:fs";
import {chromium} from "playwright-core";
import {KKP_FORM_KEYS,selectKKPDropdown,selectKKPRating} from "./kkp-questionnaire-controls.mjs";
const URL="https://portaldata.kkp.go.id/datainsight/produksi-ikan-pembenihan";
const values={category:"Umum",purpose:"Penelitian",format:"CSV",type:"Produksi Hasil Kelautan dan Perikanan"};
const out="artifacts/sli-kkp-questionnaire-public-control-probe.json";
const report={schema:"sli-kkp-questionnaire-readonly-controls-v1",checked_at_utc:new Date().toISOString(),form_submitted:false,contact_filled:false,selected_fields:[],status:"unavailable"};
let browser,modal,stage="open_page";
try{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",headless:true,
  args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]});
 const context=await browser.newContext({locale:"id-ID",viewport:{width:1380,height:900}});
 const page=await context.newPage();
 await page.goto(URL,{waitUntil:"domcontentloaded",timeout:40000});
 stage="open_questionnaire";
 await page.getByRole("button",{name:"Unduh Data"}).click({timeout:20000});
 modal=page.locator('[role="dialog"],.modal.show').filter({visible:true}).first();
 await modal.waitFor({state:"visible",timeout:14000});
 const inputs=await modal.locator('input[role="combobox"]').count();
 if(inputs!==4)throw Error("unexpected_combobox_count");
 for(const [i,key] of KKP_FORM_KEYS.entries()){
  stage="select_"+key;
  await selectKKPDropdown(page,modal,i,values[key]);
  report.selected_fields.push(key);
 }
 // Select and verify the visible rating widget without filling contact fields,
 // writing a review or submitting the KKP questionnaire.
 stage="select_rating_control";
 await selectKKPRating(modal,"4");
 report.rating_widget_checked=true;
 report.status="all_four_dropdowns_and_rating_selected_no_submission";
 await context.close();
}catch{
 report.status="control_selection_failed";
 report.failure_stage=stage;
 if(stage==="select_rating_control"&&modal){
  report.radio_controls=await modal.locator('input[type="radio"]').evaluateAll(nodes=>nodes.slice(0,9).map(el=>({
   name:el.getAttribute("name"),value:el.value,html_id:el.id,
   label:(el.closest("label")?.textContent||el.getAttribute("aria-label")||"").trim().slice(0,55),
   checked:el.checked,disabled:el.disabled,html:el.outerHTML.slice(0,350),
   parent_html:(el.closest("label")?.outerHTML||"").slice(0,1100),
   ancestor_classes:[el.parentElement?.className||"",el.parentElement?.parentElement?.className||""].map(String),
   parent_rect:(()=>{const r=el.closest("label")?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null})()

  }))).catch(()=>[]);
  report.role_radio_count=await modal.getByRole("radio").count().catch(()=>null);
  report.rating_root_html=await modal.locator(".MuiRating-root").first().evaluate(el=>el.outerHTML.slice(0,7500)).catch(()=>"");
 }
}finally{
 await browser?.close().catch(()=>{});
 fs.mkdirSync("artifacts",{recursive:true});
 fs.writeFileSync(out,JSON.stringify(report,null,2)+"\n");
 console.log("KKP QUESTIONNAIRE CONTROLS SAFE PROBE",JSON.stringify(report));
}
if(report.status!=="all_four_dropdowns_and_rating_selected_no_submission")process.exitCode=1;
