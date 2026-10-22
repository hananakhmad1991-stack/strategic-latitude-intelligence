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

function selectLegacyAcehWelfare(question,welfare){
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
function auditLegacyAcehAnswer(answer,focus){
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


/* Expanded multi-province precision retrieval. Fail closed when a metric/area
   has missing SE, RSE, CI or original source table metadata. */
const extraEscape=s=>String(s).replace(/[.*+?^{}$()|[\]\\]/g,"\\$&");
const extraNumber=n=>{
 const [a,b]=Number(n).toFixed(2).split(".");
 return new RegExp("(?<![\\d.,])"+a+"[,.]"+b+"(?![\\d])");
};
const extraPatterns=[
 ["piped_drinking_water",/(?:air\s+minum\s+leding|piped\s+(?:drinking\s+)?water|tap\s+water)/i],
 ["uninsured",/(?:tanpa\s+jaminan\s+kesehatan|tidak\s+memiliki\s+jaminan\s+kesehatan|\buninsured\b)/i],
 ["no_electricity_lighting",/(?:tanpa\s+listrik|penerangan\s+utama\s+bukan\s+listrik|no[\s-]+electricity\s+lighting)/i],
 ["lpg_citygas_biogas_cooking",/(?:elpiji\s*[/,+]\s*gas\s+kota|gabungan\s+elpiji|bahan\s+bakar\s+memasak\s+utama[^?.,]{0,35}(?:elpiji|gas\s+kota|biogas))/i],
 ["bpnt_sembako",/(?:\bBPNT\b|program\s+sembako)/i],
 ["e_money_households",/(?:uang\s+elektronik|\be[\s-]?money\b)/i]
];
const extraAliases={
 "Kep. Riau":["Kepulauan Riau"],"Kep. Bangka Belitung":["Kepulauan Bangka Belitung"],
 "DI Yogyakarta":["Daerah Istimewa Yogyakarta","DIY"],"DKI Jakarta":["Jakarta"]
};
const bpsLocale=n=>Number(n).toFixed(2).replace(".",",");
function extraRegions(q,welfare){
 const hits=[];
 for(let i=0;i<welfare.provinces.length;i++){
  const p=welfare.provinces[i];if(p.name==="Indonesia")continue;
  for(const term of [p.name,...(extraAliases[p.name]||[])]){
   const rg=new RegExp("(^|[^\\p{L}\\p{N}])"+extraEscape(term)+"(?=$|[^\\p{L}\\p{N}])","giu");let m;
   while((m=rg.exec(q))!==null){
    const start=m.index+m[1].length;
    hits.push({index:i,name:p.name,start,end:start+term.length,length:term.length});
   }
  }
 }
 const keep=[];
 for(const h of hits.sort((a,b)=>b.length-a.length||a.start-b.start)){
  if(!keep.some(x=>h.start<x.end&&h.end>x.start))keep.push(h);
 }
 const out=[];
 for(const h of keep.sort((a,b)=>a.start-b.start)){
  if(!out.some(x=>x.name===h.name))out.push(h);
 }
 return out;
}
export function selectFocusedBpsWelfare(question,welfare){
 const q=String(question||"").normalize("NFKC");
 // Preserve the already-proven live Aceh test exactly.
 const legacy=selectLegacyAcehWelfare(q,welfare);
 const requestedRegions=Array.isArray(welfare?.provinces)?extraRegions(q,welfare):[];
 const requestedIds=extraPatterns.filter(([,re])=>re.test(q)).map(([id])=>id);
 if(legacy&&requestedRegions.length===1&&requestedRegions[0].name==="Aceh"&&
    requestedIds.length===1&&requestedIds[0]==="piped_drinking_water")
  return {...legacy,legacy:true,records:[{...legacy.measure,province:"Aceh",metric:"piped_drinking_water",label:"Rumah tangga dengan sumber utama air minum leding"}]};
 if(/(?:tanpa|tidak\s+perlu|without|exclude)\s+(?:(?:data|rincian|angka)\s+)?(?:sampling\s+error|\bRSE\b|\bSE\b)/i.test(q)||
    !/(?:\bRSE\b|\bSE\b|sampling\s+error|standard\s+error|interval\s+kepercayaan|confidence\s+interval|CI\s*95)/i.test(q))return null;
 if(!Array.isArray(welfare?.provinces)||!Array.isArray(welfare?.provincial_metrics)||!welfare?.source?.source_url)return null;
 const regions=extraRegions(q,welfare);
 const ids=extraPatterns.filter(([,re])=>re.test(q)).map(([id])=>id);
 // Pilot scope: up to two provinces x two matched indicators per question.
 if(!regions.length||regions.length>2||!ids.length||ids.length>2)return null;
 const records=[];
 for(const p of regions)for(const id of ids){
  const metric=welfare.provincial_metrics.find(m=>m.id===id);
  const sampling=welfare.sampling_error_2026?.metrics?.[id];
  if(!metric||!sampling||!Number.isInteger(metric.pdf_page)||!Number.isInteger(sampling.pdf_page)||
     typeof sampling.sampling_table!=="string")return null;
  if(sampling.source_main_table&&sampling.source_main_table!==metric.table)return null;
  if(sampling.source_main_pdf_page&&sampling.source_main_pdf_page!==metric.pdf_page)return null;
  const r={province:p.name,metric:id,label:metric.label,
    estimate:welfare.provinces[p.index].values?.[metric.index],
    se:sampling.standard_error_pp?.[p.index],
    rse:sampling.relative_standard_error_pct?.[p.index],
    ci_low:sampling.confidence_interval_low_pct?.[p.index],
    ci_high:sampling.confidence_interval_high_pct?.[p.index],
    table:metric.table,appendix_table:sampling.sampling_table,
    main_page:metric.pdf_page,appendix_page:sampling.pdf_page,denominator:metric.denominator};
  if(![r.estimate,r.se,r.rse,r.ci_low,r.ci_high].every(Number.isFinite)||
     r.ci_low>r.ci_high||!r.denominator)return null;
  records.push(r);
 }
 const evidence=records.map((r,i)=>{
  const slug=r.province.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
  return {id:"bps_welfare_province_"+slug+"_"+r.metric,
   title:"BPS Susenas Maret 2026 · "+r.province+" · "+r.label,
   text:"Sumber: BPS Statistik Kesejahteraan Rakyat 2026, Susenas Maret 2026. Wilayah: "+r.province+
    ". Definisi: "+r.label+". Populasi/penyebut: "+r.denominator+
    ". Tabel "+r.table+", PDF halaman "+r.main_page+": estimasi "+bpsLocale(r.estimate)+"%."+
    " Tabel sampling error "+r.appendix_table+", PDF halaman "+r.appendix_page+
    ": SE "+bpsLocale(r.se)+" poin persentase; RSE "+bpsLocale(r.rse)+"%; interval kepercayaan 95% "+
    bpsLocale(r.ci_low)+"–"+bpsLocale(r.ci_high)+"%. Ini estimasi survei, bukan kepastian atau bukti kausalitas.",
   source_url:welfare.source.source_url,source_date:welfare.source.released,publisher:"BPS",
   period:"Susenas Maret 2026",geo:r.province,topic:"BPS sampling error "+r.metric+" "+r.province,access:"pro"};
 });
 return {evidence,measure:records[0],records,legacy:false};
}
function extraAuditRow(s,r,sourceNo){
 const issues=[];
 const token=v=>extraNumber(v).source;
 if(!s.includes("["+sourceNo+"]"))issues.push("source_citation_missing");
 if(!s.toLowerCase().includes(r.province.toLowerCase()))issues.push("target_region_missing");
 if(!s.toLowerCase().includes(r.label.toLowerCase()))issues.push("indicator_label_missing");
 if(!new RegExp("(?:estimasi|perkiraan|diperkirakan)\\s*[:=]?\\s*"+token(r.estimate),"i").test(s))issues.push("estimate_absent_or_numeric_mismatch");
 if(!new RegExp("(?:^|[^a-z])SE\\s*[:=]?\\s*"+token(r.se),"i").test(s))issues.push("SE_absent_or_numeric_mismatch");
 if(!new RegExp("(?:^|[^a-z])RSE\\s*[:=]?\\s*"+token(r.rse),"i").test(s))issues.push("RSE_absent_or_numeric_mismatch");
 const low=s.search(extraNumber(r.ci_low)),high=s.search(extraNumber(r.ci_high));
 if(low<0||high<0||high<low||high-low>100||!/95\s*%/.test(s)||!/(?:CI|IK|interval|confidence)/i.test(s))issues.push("CI95_incorrect_or_missing");
 if(!new RegExp("(?:tabel|table)\\s*"+extraEscape(r.table),"i").test(s)||
    !new RegExp("(?:tabel|table)\\s*"+extraEscape(r.appendix_table),"i").test(s))issues.push("source_table_numbers_missing");
 if(!new RegExp("PDF\\s+halaman\\s*"+r.main_page+"\\b","i").test(s)||
    !new RegExp("PDF\\s+halaman\\s*"+r.appendix_page+"\\b","i").test(s))issues.push("source_pdf_pages_missing");
 const kind=/rumah\s+tangga/i.test(r.denominator)?"rumah tangga":/penduduk/i.test(r.denominator)?"penduduk":null;
 if(kind&&!s.toLowerCase().includes(kind))issues.push("denominator_missing");
 return issues;
}
export function auditFocusedBpsAnswer(answer,focus){
 if(!focus)return {pass:true,issues:[]};
 if(focus.legacy||!focus.records)return auditLegacyAcehAnswer(answer,focus);
 if(typeof answer!=="string"||!answer.trim())return {pass:false,issues:["empty_answer"]};
 const issues=[];
 const lines=answer.split(/\r?\n/);
 for(let i=0;i<focus.records.length;i++){
  const r=focus.records[i],prefix=new RegExp("^\\s*(?:[-*]\\s*)?"+extraEscape(r.province)+"\\s*[—–-]\\s*"+extraEscape(r.label)+"\\s*:","i");
  const matches=lines.filter(x=>prefix.test(x));
  if(matches.length!==1){issues.push("source_row_missing_or_duplicate_"+(i+1));continue;}
  issues.push(...extraAuditRow(matches[0],r,i+1).map(x=>x+"_row_"+(i+1)));
 }
 return {pass:issues.length===0,issues};
}


/* Block explicitly requested BPS sampling figures that lack validated source cells.
   Never let an unsupported precision lookup silently fall into generic synthesis. */
export function classifyFocusedBpsPrecisionGap(question,welfare){
 const q=String(question||"").normalize("NFKC");
 if(!/(?:\bBPS\b|Susenas|Statistik\s+Kesejahteraan\s+Rakyat)/i.test(q)||
    !/(?:\bRSE\b|\bSE\b|sampling\s+error|standard\s+error|interval\s+kepercayaan|confidence\s+interval|CI\s*95)/i.test(q)||
    /(?:tanpa|tidak\s+perlu|without|exclude)\s+(?:(?:data|rincian|angka)\s+)?(?:sampling\s+error|\bRSE\b|\bSE\b)/i.test(q)||
    !Array.isArray(welfare?.provinces))return null;
 const regions=extraRegions(q,welfare);
 if(!regions.length)return null;
 const supported=extraPatterns.filter(([,regex])=>regex.test(q)).map(([id])=>id);
 const unavailable=/(?:\binternet\b|partisipasi\s+sekolah|akta\s+kelahiran)/i.test(q);
 if(!supported.length&&!unavailable)return null;
 if(unavailable)return "indicator_precision_not_in_verified_subset";
 if(regions.length>2||supported.length>2)return "precision_query_exceeds_pilot_scope";
 if(!selectFocusedBpsWelfare(q,welfare))return "requested_precision_cells_unavailable";
 return null;
}
