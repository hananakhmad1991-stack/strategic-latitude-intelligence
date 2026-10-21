/* KKP source-linked Marine & Fisheries dashboard.
 * Historic observations are static published source snapshots. Never treat KKP
 * DCAT metadata timestamps as numeric observations or silently infer missing zeros.
 * Pure validation/calculation helpers are shared with Node regression QA.
 */
const DATA_URL=new URL("../data/sli-marine-fisheries-kkp.json",import.meta.url);
const IDS=["seaweed_aquaculture","aquaculture_total","marine_fishers"];
const SOURCE=/^https:\/\/portaldata\.kkp\.go\.id\//i;
export function validateMarineData(data){
 const errors=[],records=Array.isArray(data?.records)?data.records:[],
       estimates=Array.isArray(data?.estimated_not_actual)?data.estimated_not_actual:[],
       regions=Array.isArray(data?.province_seaweed_2024)?data.province_seaweed_2024:[],
       topics=Array.isArray(data?.thematic_register)?data.thematic_register:[];
 if(data?.schema!=="sli-marine-fisheries-kkp-v1")errors.push("invalid_schema");
 if(!SOURCE.test(data?.catalog_api||""))errors.push("invalid_catalog_source");
 if(records.length!==18)errors.push("historical_series_incomplete");
 const unique=new Set();
 for(const record of records){
  if(!IDS.includes(record?.indicator)||!Number.isInteger(record.year)||record.year<2019||record.year>2024||
    record.period!==String(record.year)||!Number.isFinite(record.value)||record.value<=0||
    !["ton","persons"].includes(record.unit)||!SOURCE.test(record.source_url))errors.push("invalid_observation");
  if(record?.verification_status!=="source_table_transcribed_official_historical")errors.push("unqualified_observation");
  const key=record.indicator+"-"+record.year;
  if(unique.has(key))errors.push("duplicated_observation");
  unique.add(key);
 }
 for(const id of IDS)for(let year=2019;year<=2024;year++)if(!unique.has(id+"-"+year))errors.push("missing_year:"+id+":"+year);
 if(estimates.length!==2||estimates.some(x=>x.year!==2025||x.status!=="estimate"||!Number.isFinite(x.value)||x.value<=0||
   !["seaweed_aquaculture","aquaculture_total"].includes(x.indicator)||!SOURCE.test(x.source_url)))errors.push("mixed_or_invalid_estimates");
 if(regions.length!==10||regions.some(x=>x.year!==2024||!Number.isFinite(x.value)||x.value<=0||!SOURCE.test(x.source_url)||x.is_partial_ranking!==true)||
   new Set(regions.map(x=>x.province)).size!==regions.length)errors.push("invalid_partial_province_ranking");
 const seaweed=records.find(x=>x.indicator==="seaweed_aquaculture"&&x.year===2024)?.value;
 if(!Number.isFinite(seaweed)||regions.some(x=>x.value>seaweed))errors.push("province_exceeds_national");
 if(topics.length<10||topics.some(x=>!["catalog_only","observed_historical"].includes(x.status)||
   !SOURCE.test(x.source_url)||!x.label_id||!x.label_en))errors.push("invalid_topic_register");
 if(new Set(topics.map(x=>x.id)).size!==topics.length)errors.push("duplicate_topic");
 return {pass:errors.length===0,errors:[...new Set(errors)],records:records.length,topics:topics.length};
}
export function marineSeries(data,indicator){
 if(!IDS.includes(indicator))return [];
 return (data?.records||[]).filter(x=>x.indicator===indicator).sort((a,b)=>a.year-b.year);
}
export function marineLatest(data,indicator){
 const rows=marineSeries(data,indicator);return rows[rows.length-1]||null;
}
export function marineShares(data){
 const national=marineLatest(data,"seaweed_aquaculture")?.value;
 return (data.province_seaweed_2024||[]).map(x=>({...x,share_pct:national?100*x.value/national:null})).sort((a,b)=>b.value-a.value);
}
export function marineGrowth(series){
 if(!Array.isArray(series)||series.length<2)return null;
 const old=series[series.length-2]?.value,latest=series[series.length-1]?.value;
 return Number.isFinite(old)&&old>0&&Number.isFinite(latest)?100*(latest/old-1):null;
}
const el=id=>document.getElementById(id);
const lang=()=>document.documentElement.lang?.startsWith("en")?"en":"id";
const t=(id,en)=>lang()==="en"?en:id;
const fmt=(n,d=0)=>Number.isFinite(n)?n.toLocaleString(lang()==="en"?"en-US":"id-ID",{maximumFractionDigits:d,minimumFractionDigits:d}):"—";
const labels={
 seaweed_aquaculture:["Produksi rumput laut pembesaran","Seaweed grow-out production"],
 aquaculture_total:["Produksi budidaya pembesaran total","Total grow-out aquaculture production"],
 marine_fishers:["Nelayan perikanan tangkap laut","Marine capture fishers"]
};
const unit=x=>x==="persons"?t("orang","people"):t("ton","tonnes");
const status=x=>x==="observed_historical"?t("Seri historis tersedia","Historical series available"):t("Katalog tersedia · angka belum diimpor","Catalogued · numeric values not imported");
const append=(tag,parent,value,cls)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(value!=null)node.textContent=String(value);parent.appendChild(node);return node};
const link=(parent,url,label)=>{if(!SOURCE.test(url))return;const a=append("a",parent,label);a.href=url;a.target="_blank";a.rel="noopener noreferrer"};
function renderKPIs(data){
 const host=el("mfKpis");host.replaceChildren();
 for(const id of IDS){
  const x=marineLatest(data,id),card=append("article",host,null,"mf-kpi");
  append("small",card,labels[id][lang()==="en"?1:0]+" · "+x.year);
  append("strong",card,fmt(x.value,0));
  append("p",card,unit(x.unit)+" · "+t("KKP, observasi historis","KKP, historical observation"));
  link(card,x.source_url,t("Tabel resmi ↗","Official table ↗"));
 }
}
function drawChart(host,series,metric){
 host.replaceChildren();if(!series.length)return;
 const xmlns="http://www.w3.org/2000/svg",svg=document.createElementNS(xmlns,"svg");
 svg.setAttribute("viewBox","0 0 840 300");svg.setAttribute("role","img");
 svg.setAttribute("aria-label",labels[metric][lang()==="en"?1:0]+" 2019–2024");
 const node=(tag,attr={},text)=>{const v=document.createElementNS(xmlns,tag);for(const [k,val] of Object.entries(attr))v.setAttribute(k,String(val));if(text!==undefined)v.textContent=text;svg.append(v);return v};
 const max=Math.max(...series.map(x=>x.value)),padded=max*1.1,top=28,bottom=254,left=80,right=820;
 const y=value=>bottom-(value/padded)*(bottom-top);
 for(const ratio of [0,.25,.5,.75,1]){
  const value=ratio*padded,pos=y(value);
  node("line",{x1:left,y1:pos,x2:right,y2:pos,class:"grid"});
  node("text",{x:8,y:pos+4},(value>=1000000?(value/1e6).toFixed(1)+"M":fmt(value,0)));
 }
 const points=series.map((x,i)=>{const pos=left+(right-left)*i/(series.length-1);return [pos,y(x.value),x]});
 node("polyline",{points:points.map(v=>v[0]+","+v[1]).join(" "),class:"plot"});
 for(const [x,yv,v] of points){
  const dot=node("circle",{cx:x,cy:yv,r:6,class:"dot"});const title=document.createElementNS(xmlns,"title");title.textContent=v.year+": "+fmt(v.value,2)+" "+unit(v.unit);dot.append(title);
  node("text",{x,y:278,"text-anchor":"middle"},String(v.year));
 }
 node("line",{x1:left,y1:bottom,x2:right,y2:bottom,class:"axis"});
 host.append(svg);
}
function renderTrends(data){
 const selection=el("mfIndicator").value,series=marineSeries(data,selection),latest=series.at(-1);
 const metricTitle=labels[selection][lang()==="en"?1:0];
 el("mfChartTitle").textContent=metricTitle+" · 2019–2024";
 el("mfChartContext").textContent=t("Sumbu vertikal mulai nol. Satuan: ","Vertical axis starts at zero. Unit: ")+unit(latest?.unit);
 drawChart(el("mfChart"),series,selection);
 const growth=marineGrowth(series),host=el("mfTrendDetail");
 host.textContent=t("Perubahan 2023–2024: ","Change 2023–2024: ")+(growth===null?"—":(growth>=0?"+":"")+fmt(growth,2)+"%")+
 ". "+t("Perbedaan dua tahun tidak membuktikan sebab-akibat.","Year-to-year change does not establish causality.");
 const tbody=el("mfHistoryRows");tbody.replaceChildren();
 const estimate=data.estimated_not_actual.find(x=>x.indicator===selection);
 for(const r of series){
  const row=append("tr",tbody);
  append("td",row,r.year);
  append("td",row,fmt(r.value,2)+" "+unit(r.unit),"numeric");
  append("td",row,t("Observasi historis","Historical observation"));
 }
 const box=el("mfEstimateBox");box.replaceChildren();
 if(estimate){
  append("strong",box,fmt(estimate.value,0)+" "+unit(estimate.unit)+" · 2025");
  append("p",box,t("KKP memberi tanda ** (estimasi); bukan realisasi. Nilai ini tidak digabung ke grafik.","KKP marks 2025 with ** (estimate), not actual. It is excluded from the trend."));
 }else append("p",box,t("Tidak ada estimasi dalam tabel ini; jangan menyimpulkan nilainya nol.","No estimate shown in this table; absence does not mean zero."));
 el("mfTrendSource").href=latest.source_url;
}
function renderProvinces(data){
 const host=el("mfProvinceRows");host.replaceChildren();
 for(const x of marineShares(data)){
  const row=append("tr",host);
  append("th",row,x.province);
  append("td",row,fmt(x.value,2),"numeric");
  append("td",row,fmt(x.share_pct,2)+"%","numeric");
 }
}
function renderTopics(data){
 const host=el("mfTopicGrid"),selected=el("mfTopicFilter").value;host.replaceChildren();
 const topics=data.thematic_register.filter(x=>selected==="all"||x.group===selected);
 for(const item of topics){
  const card=append("article",host,null,"mf-topic");
  append("h3",card,lang()==="en"?item.label_en:item.label_id);
  append("span",card,status(item.status),"topic-status"+(item.status==="observed_historical"?" available":""));
  append("p",card,lang()==="en"?item.description_en:item.description_id);
  link(card,item.source_url,t("Periksa sumber KKP ↗","Inspect KKP source ↗"));
 }
 el("mfTopicCount").textContent=topics.length+" / "+data.thematic_register.length+" "+t("topik","topics");
}
function renderInsights(data){
 const host=el("mfInsights");host.replaceChildren();
 const seaweed=marineSeries(data,"seaweed_aquaculture"),aquaculture=marineLatest(data,"aquaculture_total"),
  fishers=marineSeries(data,"marine_fishers"),leading=marineShares(data)[0];
 const share=seaweed.at(-1).value/aquaculture.value*100;
 const lines=[
  [t("Rumput laut", "Seaweed"),t("Produksi berubah ","Production changed ")+(marineGrowth(seaweed)>=0?"+":"")+fmt(marineGrowth(seaweed),2)+"% "+t("pada 2023–2024; tren jangka pendek belum menjelaskan produktivitas, harga jual, atau permintaan ekspor.","from 2023 to 2024; a short-term change does not establish productivity, prices or export demand.")],
  [t("Hindari perhitungan ganda","Avoid double-counting"),t("Produksi rumput laut sekitar ","Seaweed represents around ")+fmt(share,1)+"% "+t("dari total volume budidaya pembesaran 2024. Rumput laut termasuk dalam total budidaya; kedua angka tidak boleh dijumlahkan.","of 2024 total grow-out volume. Seaweed is included in that aquaculture total; do not add the two.")],
  [t("Konsentrasi wilayah","Regional concentration"),leading.province+" "+t("mewakili sekitar ","accounts for around ")+fmt(leading.share_pct,1)+"% "+t("dari produksi nasional rumput laut 2024 menurut tabel ini. Daftar 10 provinsi hanya potongan tabel sumber.","of national 2024 seaweed production. The ten-province display is a partial source table.")],
  [t("Nelayan ≠ kesejahteraan","Fisher count ≠ welfare"),t("Jumlah nelayan tangkap laut berubah ","Marine fisher headcount changed ")+(marineGrowth(fishers)>=0?"+":"")+fmt(marineGrowth(fishers),2)+"% "+t("pada 2023–2024. Tanpa data pendapatan, tangkapan dan biaya, perubahan ini bukan bukti kesejahteraan meningkat.","from 2023 to 2024. Without earnings, catch and cost data, this does not establish improved livelihoods.")]
 ];
 for(const [title,detail] of lines){
  const card=append("div",host,null,"mf-insight");
  append("strong",card,title);append("p",card,detail);
 }
}
function renderSources(data){
 const host=el("mfSourceLinks");host.replaceChildren();
 for(const s of data.references)link(host,s.url,s.label+" ↗");
 const limit=el("mfLimitations");limit.replaceChildren();
 const rules=lang()==="en"?[
  "Figures are 2019–2024 historical observations, not live measurements.",
  "The KKP 2025 ** values are estimates, excluded from annual historical growth.",
  "Aquaculture grow-out totals already include seaweed; avoid double-counting.",
  "Ten listed provinces are not a full provincial universe; blanks are not zero.",
  "KKP fisher table has unspecified source and release-date fields; no publisher date is inferred.",
  "DCAT modified dates are catalog metadata, not statistical observation years.",
  "Original data redistribution and commercial-use terms require separate review."
 ]:[
  "Angka 2019–2024 merupakan observasi historis, bukan data real-time.",
  "Nilai 2025 bertanda ** adalah estimasi KKP, tidak dihitung sebagai pertumbuhan realisasi.",
  "Total budidaya pembesaran telah mencakup rumput laut; jangan dihitung dua kali.",
  "10 provinsi bukan keseluruhan populasi wilayah; sel kosong bukan nol.",
  "Tabel nelayan menampilkan tanggal rilis dan sumber sebagai tidak tersedia; tanggal tidak direka.",
  "Tanggal modifikasi DCAT adalah metadata katalog, bukan tahun observasi statistik.",
  "Izin penggunaan ulang dan redistribusi komersial perlu diverifikasi tersendiri."
 ];
 rules.forEach(x=>append("li",limit,x));
}
async function init(){
 try{
  const response=await fetch(DATA_URL,{cache:"no-store"});
  if(!response.ok)throw Error("KKP local source unavailable: "+response.status);
  const data=await response.json(),check=validateMarineData(data);
  if(!check.pass)throw Error("KKP dataset validation failed: "+check.errors.join(","));
  const render=()=>{renderKPIs(data);renderTrends(data);renderProvinces(data);renderTopics(data);renderInsights(data);renderSources(data)};
  el("mfIndicator").addEventListener("change",()=>renderTrends(data));
  el("mfTopicFilter").addEventListener("change",()=>renderTopics(data));
  document.addEventListener("sli:languagechange",render);
  render();
 }catch(error){
  const host=el("mfKpis");if(host)host.textContent=t("Data KKP belum dapat dimuat atau gagal validasi. Tidak ada nilai cadangan yang direka.","KKP data unavailable or failed validation. No values have been invented.");
  console.error("[SLI Marine]",error);
 }
}
if(typeof document!=="undefined"){
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
}
