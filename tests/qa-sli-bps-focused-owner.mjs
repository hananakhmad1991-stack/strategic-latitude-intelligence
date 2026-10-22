import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {selectFocusedBpsWelfare,auditFocusedBpsAnswer,classifyFocusedBpsPrecisionGap} from "../research-api/src/bps-welfare-focused.mjs";

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


const CASES={
 piped_drinking_water:"air minum leding",
 uninsured:"tanpa jaminan kesehatan",
 no_electricity_lighting:"tanpa listrik sebagai penerangan utama",
 lpg_citygas_biogas_cooking:"bahan bakar memasak utama elpiji/gas kota/biogas",
 bpnt_sembako:"BPNT/Program Sembako",
 e_money_households:"uang elektronik"
};
const q=(name,key)=>"Menurut BPS, "+name+", berapa estimasi "+CASES[key]+
 " berikut SE, RSE, dan interval kepercayaan 95%, disertai Tabel dan halaman PDF?";
const fmt=v=>Number(v).toFixed(2).replace(".",",");
const formatRow=(r,i)=>r.province+" — "+r.label+": estimasi "+fmt(r.estimate)+"%; SE "+fmt(r.se)+
 " poin persentase; RSE "+fmt(r.rse)+"%; interval kepercayaan 95% "+fmt(r.ci_low)+"–"+fmt(r.ci_high)+
 "%; Tabel "+r.table+", PDF halaman "+r.main_page+"; Tabel "+r.appendix_table+
 ", PDF halaman "+r.appendix_page+" ["+(i+1)+"].";
const simulated=f=>f.records.map(formatRow).join("\n");

test("precision matching covers every complete provincial cell without using suppressed / unavailable values",()=>{
 let covered=0,blocked=0;
 for(const province of welfare.provinces.filter(p=>p.name!=="Indonesia")){
  for(const [key] of Object.entries(CASES)){
   const metric=welfare.provincial_metrics.find(m=>m.id===key);
   const sampling=welfare.sampling_error_2026.metrics[key];
   const index=welfare.provinces.indexOf(province);
   const vals=[province.values[metric.index],sampling.standard_error_pp[index],
    sampling.relative_standard_error_pct[index],sampling.confidence_interval_low_pct[index],
    sampling.confidence_interval_high_pct[index]];
   const got=selectFocusedBpsWelfare(q(province.name,key),welfare);
   if(vals.every(Number.isFinite)){
    assert.ok(got,province.name+" / "+key+" must route to a valid exact record");
    assert.equal(got.records.length,1);
    assert.equal(got.records[0].province,province.name);
    assert.equal(got.records[0].metric,key);
    assert.deepEqual([got.measure.estimate,got.measure.se,got.measure.rse,got.measure.ci_low,got.measure.ci_high],vals);
    assert.equal(got.evidence[0].source_url,welfare.source.source_url);
    assert.equal(auditFocusedBpsAnswer(simulated(got),got).pass,true,province.name+" / "+key);
    covered++;
   }else{
    assert.equal(got,null,province.name+" / "+key+" suppressed sampling cell must not be fabricated");
    blocked++;
   }
  }
 }
 assert.ok(covered>160,"Expect many verified numeric cells");
 assert.ok(blocked>0,"Suppressed cells must remain inaccessible");
});

test("two-province, two-indicator selection preserves each local denominator, table, PDF page and reference",()=>{
 const question="Bandingkan Aceh dan Jawa Barat: air minum leding dan BPNT, berapa estimasi SE, RSE, dan interval kepercayaan 95% masing-masing menurut BPS?";
 const f=selectFocusedBpsWelfare(question,welfare);
 assert.ok(f);assert.equal(f.legacy,false);assert.equal(f.records.length,4);
 assert.deepEqual(f.records.map(r=>[r.province,r.metric]),[
  ["Aceh","piped_drinking_water"],["Aceh","bpnt_sembako"],
  ["Jawa Barat","piped_drinking_water"],["Jawa Barat","bpnt_sembako"]
 ]);
 assert.equal(new Set(f.evidence.map(e=>e.id)).size,4);
 assert.equal(auditFocusedBpsAnswer(simulated(f),f).pass,true);
 const lines=simulated(f).split("\n");
 for(let i=0;i<lines.length;i++){
  const broken=[...lines];broken[i]=broken[i].replace(fmt(f.records[i].estimate),"99,99");
  assert.equal(auditFocusedBpsAnswer(broken.join("\n"),f).pass,false,"estimate wrong in cell "+i);
 }
 const wrongSource=simulated(f).replace("[3]","[1]");
 assert.equal(auditFocusedBpsAnswer(wrongSource,f).pass,false,"wrong citation must be rejected");
 const wrongPage=simulated(f).replace("PDF halaman "+f.records[2].appendix_page,"PDF halaman 9999");
 assert.equal(auditFocusedBpsAnswer(wrongPage,f).pass,false,"wrong appendix page must fail");
 assert.equal(auditFocusedBpsAnswer(lines.slice(0,3).join("\n"),f).pass,false,"missing record must fail");
 assert.equal(auditFocusedBpsAnswer(simulated(f)+"\n"+lines[0],f).pass,false,"duplicate record must fail");
});

test("cross-sector routes include health, electricity, social assistance and e-money, with safe null handling",()=>{
 const wanted=[
  ["Jawa Timur","uninsured"],
  ["Bali","e_money_households"],
  ["Papua","no_electricity_lighting"],
  ["DKI Jakarta","bpnt_sembako"],
  ["Aceh","lpg_citygas_biogas_cooking"]
 ];
 for(const [name,key] of wanted){
  const f=selectFocusedBpsWelfare(q(name,key),welfare);
  assert.ok(f,name+" / "+key);
  assert.equal(f.records[0].metric,key);
  assert.equal(auditFocusedBpsAnswer(simulated(f),f).pass,true);
  const bad=simulated(f).replace("RSE "+fmt(f.measure.rse),"RSE 999,99");
  assert.equal(auditFocusedBpsAnswer(bad,f).pass,false);
 }
 assert.equal(selectFocusedBpsWelfare(q("Jawa Barat","no_electricity_lighting"),welfare),null);
 assert.equal(selectFocusedBpsWelfare("Berapa RSE internet Jawa Barat?",welfare),null);
 assert.equal(selectFocusedBpsWelfare("Bandingkan Aceh, Bali dan Jawa Timur untuk RSE BPNT",welfare),null);
 assert.equal(selectFocusedBpsWelfare("RSE bantuan sosial di Aceh dan Indonesia secara nasional",welfare),null);
});


test("BPS gaps fail closed without inventing unavailable sampling precision",()=>{
 const checks=[
  ["Menurut BPS, berapa SE RSE internet Jawa Barat?","indicator_precision_not_in_verified_subset"],
  ["Menurut BPS, berapa SE RSE listrik sebagai penerangan tanpa listrik di Jawa Barat?","requested_precision_cells_unavailable"],
  ["Menurut BPS, berapa SE RSE BPNT Aceh, Bali dan Jawa Timur?","precision_query_exceeds_pilot_scope"]
 ];
 for(const [question,expected] of checks){
  assert.equal(classifyFocusedBpsPrecisionGap(question,welfare),expected,question);
 }
 assert.equal(classifyFocusedBpsPrecisionGap("Berapa RSE BPNT Aceh menurut BPS?",welfare),null);
 assert.equal(classifyFocusedBpsPrecisionGap("Dampak subsidi listrik secara umum di Jawa Barat",welfare),null);
});
