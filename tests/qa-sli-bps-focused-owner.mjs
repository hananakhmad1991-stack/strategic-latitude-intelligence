import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {selectFocusedBpsWelfare,auditFocusedBpsAnswer} from "../research-api/src/bps-welfare-focused.mjs";

const welfare=JSON.parse(readFileSync(new URL("../data/sli-bps-welfare-2026.json",import.meta.url),"utf8"));
const QUESTION="Menurut BPS Statistik Kesejahteraan Rakyat 2026 (Susenas Maret), berapa persentase rumah tangga Aceh dengan sumber utama air minum leding (Tabel 6.23), dan bagaimana SE, RSE, interval kepercayaan 95% dari tabel sampling error 9.88?";
const get=()=>selectFocusedBpsWelfare(QUESTION,welfare);
const good="Menurut BPS Susenas Maret 2026, estimasi rumah tangga Aceh yang menggunakan sumber utama air minum leding tercatat 7,49% (Tabel 6.23, PDF halaman 215) [1]. SE 0,33 poin persentase, RSE 4,38%, dan interval kepercayaan 95% sebesar 6,84–8,13% (Tabel 9.88, PDF halaman 434) [1]. Ini tidak otomatis menyatakan air minum aman.";

test("narrow BPS source selector pins exact Aceh value and 95pct sampling error",()=>{
 const f=get();
 assert.ok(f);
 assert.equal(f.evidence.length,1);
 assert.equal(f.evidence[0].id,"bps_welfare_province_aceh");
 assert.equal(f.evidence[0].source_url,welfare.source.source_url);
 assert.deepEqual([f.measure.estimate,f.measure.se,f.measure.rse,f.measure.ci_low,f.measure.ci_high],[7.49,0.33,4.38,6.84,8.13]);
 assert.equal(f.measure.table,"6.23");
 assert.equal(f.measure.appendix_table,"9.88");
 assert.match(f.evidence[0].text,/Rumah|rumah/);
 assert.match(f.evidence[0].text,/RSE 4,38%/);
 assert.match(f.evidence[0].text,/CI|interval kepercayaan 95%/);
});

test("narrow selector must not hijack general welfare, other province, energy or broad sources",()=>{
 for(const query of ["Apa pengaruh subsidi energi nasional?","Jelaskan air minum di Aceh tanpa sampling error","RSE internet Jawa Barat dan dampaknya pada pendidikan","Angka nasional tahun 2026","Apa yang terjadi di NTB?"]){
  assert.equal(selectFocusedBpsWelfare(query,welfare),null,query);
 }
});

test("numeric guard accepts exact official source transcription with proper citation",()=>{
 const f=get();assert.deepEqual(auditFocusedBpsAnswer(good,f),{pass:true,issues:[]});
 const english=good.replace("7,49","7.49").replace("0,33","0.33").replace("4,38","4.38").replace("6,84–8,13","6.84–8.13");
 assert.equal(auditFocusedBpsAnswer(english,f).pass,true);
});

test("focused answers with omitted or changed key figures fail closed",()=>{
 for(const [from,to] of [["7,49","7,39"],["SE 0,33","SE 0,53"],["RSE 4,38","RSE 8,34"],["6,84–8,13","6,84–8,31"],["95%","90%"],["PDF halaman 434","PDF halaman 443"],["Tabel 6.23","Tabel 6.24"],["[1]","[3]"],["rumah tangga","populasi"]]){
  const result=auditFocusedBpsAnswer(from==="[1]"?good.replaceAll(from,to):good.replace(from,to),get());
  assert.equal(result.pass,false,from+" changed to "+to+" must fail; got "+JSON.stringify(result));
 }
});
test("empty focused response fails, unfocused response leaves other research pathways unchanged",()=>{
 assert.equal(auditFocusedBpsAnswer("",get()).pass,false);
 assert.equal(auditFocusedBpsAnswer("Ordinary research answer",null).pass,true);
});
