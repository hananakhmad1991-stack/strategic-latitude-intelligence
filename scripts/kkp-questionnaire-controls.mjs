/* KKP official questionnaire UI control adapter.
 * Supports visible source-labelled options only. No internal endpoints,
 * fabricated form inputs or automatic authorization.
 */
export const KKP_FORM_KEYS=["category","purpose","format","type"];
const escapeRx=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");

/* Inspect only the official visible widget. Names and contact info stay in the caller.
 * No click on the questionnaire submit button in this module.
 */
export async function selectKKPDropdown(page,modal,index,label){
 if(!Number.isInteger(index)||index<0||index>3||!label)throw Error("invalid_kkp_dropdown_request");
 const input=modal.locator('input[role="combobox"]').nth(index);
 await input.waitFor({state:"visible",timeout:9000});
 await input.click({timeout:7000});
 let options=page.locator('[role="option"]:visible');
 const exact=new RegExp("^\\s*"+escapeRx(label)+"\\s*$","u");
 let choice=options.filter({hasText:exact});
 // Some accessible autocomplete widgets only render options after typing.
 if((await choice.count())===0){
  await input.fill(String(label),{timeout:5000});
  choice=page.locator('[role="option"]:visible').filter({hasText:exact});
 }
 if((await choice.count())!==1)throw Error("kkp_dropdown_exact_option_unavailable");
 await choice.click({timeout:8000});
 // Do not trust only the click: verify that the exact chosen label is visible
 // in the questionnaire after the option popup has closed.
 const matches=modal.getByText(String(label),{exact:true});
 if((await matches.count())===0){
  // Common React-select variants render the selected value in a sibling text node.
  const selected=await input.evaluate(el=>{
   const root=el.closest('[class*="select"],[class*="Select"],[class*="autocomplete"],[class*="Autocomplete"]')||el.parentElement?.parentElement;
   return (root?.textContent||"").replace(/\\s+/g," ").trim();
  });
  if(!selected.includes(label))throw Error("kkp_dropdown_selection_not_confirmed");
 }
 return true;
}

export async function selectKKPRating(modal,rating){
 const value=Number(rating);
 if(!Number.isInteger(value)||value<1||value>5)throw Error("kkp_invalid_rating");
 // KKP uses Material UI Rating: visually hidden radio inputs have values 1..5
 // plus a sixth 'Empty' input. Playwright input.check() is not reliable for
 // these custom star widgets. Click the REAL associated star label instead.
 const radios=modal.locator('input[type="radio"]');
 if((await radios.count())<5)throw Error("kkp_rating_control_not_found");
 const input=modal.locator('input[type="radio"][value="'+value+'"]');
 if((await input.count())!==1)throw Error("kkp_rating_value_not_found");
 const label=input.locator("xpath=ancestor::label[1]");
 if((await label.count())!==1)throw Error("kkp_rating_label_not_found");
 await label.click({timeout:10000});
 if(await input.isChecked())return true;
 // Browser-native keyboard selection supports the same official MUI rating
 // control without injecting values or dispatching synthetic form events.
 await input.focus();
 await input.press("Space",{timeout:7000});
 if(await input.isChecked())return true;
 throw Error("kkp_rating_not_confirmed");
}
