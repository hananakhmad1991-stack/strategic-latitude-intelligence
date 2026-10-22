/* Narrow, source-constrained statistics-only evidence for BPS Susenas 2026.
 * Pure helper. Does not read private PDF tables, call an AI model or change other prompts.
 * Not a substitute for original page-image cell verification or BPS reuse permission.
 */
const normal=x=>String(x||"").normalize("NFKC");
const locale=n=>Number(n).toFixed(2).replace(".",",");
const numericPattern=n=>{
 const [whole,decimal]=Number(n).toFixed(2).split(".");
 return new RegExp("(?<![\\d.,])"+whole+"[,.]"+decimal+"(?![\\d])");
};
const hasNumber=(answer,n)=>numericPattern(n).test(answer);

export function selectFocusedBpsWelfare(question,welfare){
 const q=normal(question);
 // A user who explicitly excludes sampling uncertainty must not be routed to
 // a compulsory SE/RSE/CI analysis.
 if(/(?:tanpa|tidak\s+perlu|without|exclude)\s+(?:(?:data|rincian|angka)\s+)?(?:sampling\s+error|\bRSE\b|\bSE\b)/i.test(q))return null;
 if(!/\baceh\b/i.test(q)||
    !/(?:air\s+minum|leding|piped|tap\s+water)/i.test(q)||
    !/(?:\brse\b|sampling\s+error|standard\s+error|interval\s+kepercayaan|confidence\s+interval)/i.test(q))return null;
 const metric=welfare?.provincial_metrics?.find(m=>m.id==="piped_drinking_water");
 const index=welfare?.provinces?.findIndex(p=>p.name==="Aceh");
 const sampling=welfare?.sampling_error_2026?.metrics?.piped_drinking_water;
 if(!metric||index<0||!sampling||sampling.source_main_table!=="6.23"||
    sampling.sampling_table!=="9.88"||!welfare?.source?.source_url)return null;
 const province=welfare.provinces[index];
 const measure={
  estimate:province.values[metric.index],
  se:sampling.standard_error_pp[index],
  rse:sampling.relative_standard_error_pct[index],
  ci_low:sampling.confidence_interval_low_pct[index],
  ci_high:sampling.confidence_interval_high_pct[index],
  table:metric.table,
  appendix_table:sampling.sampling_table,
  main_page:metric.pdf_page,
  appendix_page:sampling.pdf_page,
  denominator:metric.denominator
 };
 if(Object.values(measure).some((x)=>x===null||x===undefined))return null;
 if(![measure.estimate,measure.se,measure.rse,measure.ci_low,measure.ci_high].every(Number.isFinite))return null;
 const text=[
  "Sumber: BPS Statistik Kesejahteraan Rakyat 2026; Susenas Maret 2026.",
  "Provinsi: Aceh; satuan persentase rumah tangga.",
  "Definisi: "+metric.label+". Populasi/penyebut: "+measure.denominator+".",
  "Tabel "+measure.table+", PDF halaman "+measure.main_page+": estimasi "+locale(measure.estimate)+"%.",
  "Sampling-error Tabel "+measure.appendix_table+", PDF halaman "+measure.appendix_page+": SE "+locale(measure.se)+
     " poin persentase; RSE "+locale(measure.rse)+"%; interval kepercayaan 95% "+locale(measure.ci_low)+"–"+locale(measure.ci_high)+"%.",
  "RSE mengukur ketelitian relatif estimasi survei, bukan persentase populasi; interval kepercayaan bukan kepastian.",
  "Air minum leding sebagai sumber utama bukan indikator air minum aman. Sumber ini tidak mendukung kesimpulan kausal atau angka wilayah lain."
 ].join(" ");
 return {evidence:[{
  id:"bps_welfare_province_aceh",title:"BPS Susenas Maret 2026 · Provinsi Aceh · sumber utama air minum leding",
  text,source_url:welfare.source.source_url,source_date:welfare.source.released,
  publisher:"BPS",period:"Susenas Maret 2026",geo:"Aceh",
  topic:"BPS Aceh air minum leding Tabel 6.23 RSE SE sampling error 9.88",
  access:"pro"}],measure};
}
export function auditFocusedBpsAnswer(answer,focus){
 if(!focus)return {pass:true,issues:[]};
 const issues=[];
 if(typeof answer!=="string"||!answer.trim())return {pass:false,issues:["empty_answer"]};
 const m=focus.measure;
 if(!hasNumber(answer,m.estimate))issues.push("estimate_absent_or_numeric_mismatch");
 if(!hasNumber(answer,m.se)||!/\bSE\b|standard\s+error|kesalahan\s+baku/i.test(answer))issues.push("SE_absent_or_numeric_mismatch");
 if(!hasNumber(answer,m.rse)||!/\bRSE\b|relative\s+standard\s+error/i.test(answer))issues.push("RSE_absent_or_numeric_mismatch");
 const low=answer.search(numericPattern(m.ci_low)),hi=answer.search(numericPattern(m.ci_high));
 if(low<0||hi<0||low>hi||hi-low>90||!/95\s*%/.test(answer)||
    !/(?:interval|CI|IK|confidence)/i.test(answer))issues.push("CI95_incorrect_or_missing");
 if(!new RegExp("(?:tabel|table)\\s*"+m.table.replace(".","[.,]"),"i").test(answer)||
    !new RegExp("(?:tabel|table)\\s*"+m.appendix_table.replace(".","[.,]"),"i").test(answer))
  issues.push("source_table_numbers_missing");
 if(!answer.includes(String(m.main_page))||!answer.includes(String(m.appendix_page)))
  issues.push("source_pdf_pages_missing");
 if(!/\brumah\s+tangga\b/i.test(answer))issues.push("household_denominator_missing");
 if(!/\bAceh\b/i.test(answer))issues.push("target_region_missing");
 if(!/\[1\]/.test(answer))issues.push("focused_source_citation_missing");
 return {pass:issues.length===0,issues};
}
