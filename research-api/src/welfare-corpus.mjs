/* BPS Susenas 2026: deterministic, public small-subset evidence.
 * Exact source page + survey time, nulls remain missing. Not a claim of causal impact.
 * Do not publish/replicate the full 165-table PDF before commercial-use permission review.
 */
import welfare from "../../data/sli-bps-welfare-2026.json";
const source=welfare.source.source_url;
const date=welfare.source.released;
const pairs=(values,years)=>years.map((y,i)=>values[i]===null?null:y+": "+values[i]+"%").filter(Boolean).join("; ");
function national(){
 return welfare.national_series.map(s=>({
  id:"bps_welfare_national_"+s.id,
  title:"BPS Statistik Kesejahteraan Rakyat 2026 · "+s.label,
  text:s.label+". Serie Susenas Maret: "+pairs(s.values,welfare.years)+
   ". Unit: persentase; Indonesia. Tabel statistik kunci PDF halaman "+s.pdf_page+
   ". Missing periods are NOT zero. Trend is descriptive; no causal attribution.",
  source_url:source,source_date:date,period:"Susenas March 2022–2026",
  publisher:"BPS",topic:"kesejahteraan welfare "+s.sector+" "+s.label,
  geo:"Indonesia",access:"pro"
 }));
}
function precisionFor(metric,province){
 const s=welfare.sampling_error_2026?.metrics?.[metric.id];
 if(!s)return "RSE: belum tersedia untuk kategori identik";
 const idx=welfare.provinces.findIndex(p=>p.name===province);
 if(idx<0)return "RSE: tidak terhubung";
 const rse=s.relative_standard_error_pct[idx],lo=s.confidence_interval_low_pct[idx],hi=s.confidence_interval_high_pct[idx];
 const flag=rse===null?"tidak dilaporkan":rse>50?"TIDAK ANDAL":rse>25?"HATI-HATI":"presisi memadai";
 return "RSE "+(rse===null?"NA":rse+"%")+" ("+flag+"), CI 95% "+(lo===null||hi===null?"NA":lo+"–"+hi+"%")+", RSE tabel "+s.sampling_table+" PDF halaman "+s.pdf_page;
}

function provincial(){
 return welfare.provinces.filter(p=>p.name!=="Indonesia").map(p=>({
  id:"bps_welfare_province_"+p.name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,""),
  title:"Susenas Maret 2026 · Kesejahteraan Provinsi "+p.name,
  text:welfare.provincial_metrics.map((m,i)=>m.label+" ("+m.table+
    ", PDF halaman "+m.pdf_page+"): "+(p.values[i]===null?"tidak tersedia / NA":p.values[i]+"%")+
    " [basis: "+m.denominator+"; "+precisionFor(m,p.name)+"]").join("; ")+
    ". Angka nasional tidak dapat dihitung sebagai rata-rata provinsi. Estimasi dengan RSE tinggi harus diberi batasan. Korelasi tidak berarti sebab-akibat.",
  source_url:source,source_date:date,period:"Susenas March 2026",
  publisher:"BPS",topic:"welfare kesejahteraan daerah pendidikan kesehatan bpjs internet digital uang elektronik energi listrik elpiji perlindungan sosial bansos BPNT",
  geo:p.name,access:"pro"
 }));
}
export function nationalWelfareEvidence(){return national()}
export function provincialWelfareEvidence(){return provincial()}
export function welfareCorpusAudit(){
 const keys=new Set(welfare.provincial_metrics.map(m=>m.id));
 const provinces=welfare.provinces;
 return {schema:welfare.schema,national_indicators:welfare.national_series.length,province_count:provinces.filter(p=>p.name!=="Indonesia").length,
  metrics:keys.size,consistent_columns:provinces.every(p=>p.values.length===keys.size),
  nulls_handled:provinces.some(p=>p.values.some(v=>v===null))};
}
