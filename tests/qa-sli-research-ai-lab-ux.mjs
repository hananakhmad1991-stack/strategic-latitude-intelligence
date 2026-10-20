import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const root=new URL("../",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");
const page=read("sli-research-ai.html");
const lab=read("js/sli-analytical-workbench-ui.mjs");
const css=read("css/sli-analytical-workbench.css");

test("Research AI main composer, owner auth, 49-method catalog and private lab integration remain intact",()=>{
 assert.match(page,/id="raPrompt"/);
 assert.match(page,/id="raAssistantForm"/);
 assert.match(page,/id="raOwnerPanel"/);
 assert.match(page,/id="raChatMethod"/);
 assert.match(page,/id="raOpenDataLab"/);
 assert.match(lab,/import \{METHODS,getMethod,parseCsv/);
 for(const id of ["raAdvancedLab","raMethod","raDataFile","raRunMethod","raLoadOfficialBps","raModelResult","raDataConsent"]){
  assert.ok(lab.includes(id),id);
 }
 assert.match(lab,/window\.SLIAnalyticalWorkbench=Object\.freeze/);
 assert.match(lab,/user_analysis=summary/);
});

test("advanced lab inserted after conversation, never above prompt, templates or private owner auth",()=>{
 assert.match(lab,/const anchor=document\.querySelector\("\.sli-ra-next"\)/);
 assert.doesNotMatch(lab,/const anchor=\$\("raOwnerPanel"\)/);
 assert.match(lab,/lab\.open=false/);
 assert.match(lab,/anchor\.parentNode\.insertBefore\(lab,anchor\)/);
 const nav=page.indexOf('id="raOpenDataLab"');
 const compose=page.indexOf('id="raPrompt"');
 const conversation=page.indexOf('id="raConversation"');
 const next=page.indexOf('class="sli-ra-next"');
 assert.ok(nav>=0&&compose>=0&&conversation>compose&&next>conversation);
 assert.match(lab,/labShortcut\?\.addEventListener\("click"/);
 assert.match(lab,/lab\.open=true/);
});

test("BPS sample moved inside nested collapsed disclosure and never presented as 38-province homogeneous panel",()=>{
 assert.match(lab,/const evidenceOptions=document\.createElement\("details"\)/);
 assert.match(lab,/evidenceOptions\.insertAdjacentHTML\("afterbegin"/);
 assert.match(lab,/2022–2025/);
 assert.match(lab,/32 provinsi × 4 tahun \(128 observasi\)/);
 assert.match(lab,/bukan seluruh 38 provinsi/);
 assert.match(lab,/box\.querySelector\("\.ra-wb-grid"\)\?\.insertAdjacentElement\("beforebegin",evidenceOptions\)/);
 assert.match(lab,/pmtb_share_lag1_pct/);
 assert.match(css,/#raAnalyticalWorkbench \.ra-wb-bps-disclosure>summary/);
});

test("English and Indonesian disclosure labels are both provided",()=>{
 assert.match(lab,/Methods & Data Lab/);
 assert.match(lab,/Metode & Data Lab/);
 assert.match(lab,/BPS sample dataset/);
 assert.match(lab,/Dataset contoh BPS/);
 assert.match(page,/data-en="Methods & Data Lab \(advanced\)/);
 assert.match(css,/#raAdvancedLab:not\(\[open\]\) #raAnalyticalWorkbench/);
});
