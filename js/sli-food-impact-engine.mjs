/* Pusdatin September 2026 impact signals: descriptive, source dated, NO causal inference.
 * The strongest 22 source-row-audited tables are approved for this lens.
 * PDF source can show where/what changed but not issuer revenue, climate causes,
 * investment impact, or regulatory attribution.
 */
const APPROVED=new Set([36,37,38,39,40,41,42,43,49,50,51,52,53,54,55,56,57,58,59,60,61,62]);
const COMMODITIES=Object.freeze([
 {table:49,label:"Beras medium II",exposure:"Penggilingan, distribusi beras, ritel pangan",driver:"produksi, stok, logistik dan kebijakan beras"},
 {table:50,label:"Bawang merah",exposure:"Hortikultura, distribusi segar, perdagangan pangan",driver:"panen, distribusi antardaerah dan susut pascapanen"},
 {table:51,label:"Bawang putih",exposure:"Importir dan distributor pangan, ritel",driver:"perdagangan impor, kurs dan logistik"},
 {table:52,label:"Cabai merah besar",exposure:"Hortikultura, logistik dingin, ritel",driver:"musim panen, distribusi dan kerusakan"},
 {table:53,label:"Cabai merah keriting",exposure:"Hortikultura, distribusi segar, ritel",driver:"produksi, musim panen dan perdagangan antardaerah"},
 {table:54,label:"Cabai rawit merah",exposure:"Hortikultura, pengolahan pangan, ritel",driver:"produksi, pasokan dan logistik antardaerah"},
 {table:55,label:"Daging sapi kualitas I",exposure:"Peternakan, rumah potong, distribusi protein",driver:"pasokan ternak, pakan dan distribusi"},
 {table:56,label:"Daging ayam",exposure:"Peternakan unggas, pakan, pengolahan protein",driver:"harga pakan, produksi dan permintaan"},
 {table:57,label:"Telur ayam",exposure:"Peternakan unggas, pakan, ritel protein",driver:"pasokan pakan, produksi dan permintaan"},
 {table:58,label:"Gula pasir lokal",exposure:"Tebu, pabrik gula, ritel pangan",driver:"hasil giling, stok dan distribusi"},
 {table:59,label:"Minyak goreng curah",exposure:"Sawit, pengolahan CPO, distributor minyak goreng",driver:"harga CPO, pasokan domestik dan kebijakan perdagangan"}
]);
const flatten=s=>String(s||"").replace(/^\d+\s+/,"").replace(/[^a-z0-9]/gi,"").toLowerCase();
function number(v){return Number.isFinite(v)?v:null}
function pct(newv,oldv){return Number.isFinite(newv)&&Number.isFinite(oldv)&&oldv!==0?100*(newv/oldv-1):null}
function fixed(v,k=1){return v===null||!Number.isFinite(v)?null:Math.round(v*10**k)/10**k}
function sourceUrl(src,n){const t=src.tables.find(t=>t.number===n);return src.publication.pdf+"#page="+t.pdfPage}
export function buildFoodEvidence(semantic,source,previousAudit,{commodity=49,province="Jawa Barat"}={}){
 if(semantic?.table_series?.length!==63||source?.tables?.length!==63||previousAudit?.verified_table_count!==22)throw Error("Expected reviewed September 2026 source lineage");
 const table=n=>semantic.table_series.find(t=>t.table===n),config=COMMODITIES.find(c=>c.table===Number(commodity));
 if(!config||!APPROVED.has(config.table))throw Error("Commodity source is not in verified set");
 const market=table(config.table),national=market.rows.find(r=>/rata\s*2\s*nasional/i.test(r.label));
 if(!national)throw Error("No official national market average in source table "+config.table);
 const provinces=table(38).rows.map(r=>r.label.replace(/^\d+\s+/,""));
 const exact=market.rows.find(r=>flatten(r.label)===flatten(province));
 const ntp=table(38).rows.find(r=>flatten(r.label)===flatten(province));
 const m=(r,key)=>number(r?.values?.[key]);
 const nvalue=m(national,"2026-08"),jvalue=m(national,"2026-07"),prov=m(exact,"2026-08"),provPrev=m(exact,"2026-07"),ntpv=m(ntp,"2026-08"),ntpPrev=m(ntp,"2026-07");
 const pm=pct(nvalue,jvalue),lm=pct(prov,provPrev),nm=pct(ntpv,ntpPrev);
 const direction=x=>x==null?"belum dapat dinilai":x>0?"naik":x<0?"turun":"tidak berubah";
 const risk=pm==null?"data_gap":Math.abs(pm)>=10?"large_monthly_change":Math.abs(pm)>=5?"notable_monthly_change":"moderate_or_small_change";
 return {
  schema:"sli-food-source-backed-impact-v1",edition:"2026-09",observation_period:"2026-08",previous_period:"2026-07",
  publication_status:"historical_snapshot_not_live",commodity:config.label,commodity_table:config.table,
  national:{value:nvalue,previous:jvalue,monthly_change_pct:fixed(pm,2),direction:direction(pm),unit:"Rp/kg",source_url:sourceUrl(source,config.table)},
  region:{name:province,price:prov,previous_price:provPrev,monthly_change_pct:fixed(lm,2),
   ntp:ntpv,previous_ntp:ntpPrev,ntp_monthly_change_pct:fixed(nm,2),ntp_unit:"index 2018=100",
   price_observed:prov!==null,ntp_observed:ntpv!==null,
   price_source_url:sourceUrl(source,config.table),ntp_source_url:sourceUrl(source,38)},
  available_provinces:provinces,verified_numeric_tables:[38,config.table],
  sector_exposure:{sectors:config.exposure,connection:"thematic_exposure_hypothesis_not_verified_corporate_impact",
   listed_companies:[],reason:"This Pusdatin publication contains no firm-level sales, sourcing contracts or issuer-specific financial sensitivity."},
  potential_drivers:{to_verify:config.driver,confidence:"not_assessed",causal_confirmation:false,
   minimum_evidence:["Independent dated supply/production measurements","Relevant market logistics or inventory measurements","Official policy or weather observations for the same location and period"],
   note:"The Pusdatin price/NTP series does not identify which cause explains a change."},
  food_security:{signal:risk,meaning:"Price movement is a descriptive affordability/access signal, not standalone evidence of food insecurity; compare purchasing power, supply and social vulnerability."},
  controls:{missing_not_zero:true,no_cross_market_price_supply_causality:true,no_issuer_attribution_without_records:true,
   price_province_coverage:34,ntp_province_coverage:38},
  audit_note:"Tabel 38 and 49–59 belong to the 22 independent PDF row-audited tables. Later 11 numeric-matrix-only matches are NOT used to claim firm-level or causal implications."
 };
}
export const FOOD_COMMODITIES=COMMODITIES;
