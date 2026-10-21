/* SLI KKP historical province atlas: 2019–2024 actual table cells, no backcasting.
 * Map coordinates: existing community-licensed 38-province illustrative geometry,
 * NEVER describe boundaries as authoritative BIG/KKP or use this for legal WPP zoning.
 */
const DATA=new URL("../data/sli-kkp-regional-historical-2019-2024.json",import.meta.url);
const ORIGINAL=/^https:\/\/portaldata\.kkp\.go\.id\//i;
const el=id=>document.getElementById(id);
const english=()=>document.documentElement.lang?.startsWith("en");
const t=(id,en)=>english()?en:id;
const fmt=(n,places=0)=>new Intl.NumberFormat(english()?"en-US":"id-ID",{maximumFractionDigits:places}).format(n);
const nameOf=(series)=>series.id==="marine_fishers"?t("Nelayan tangkap laut","Marine capture fishers"):t("Produksi rumput laut","Seaweed grow-out");
function node(tag,cls,value){const r=document.createElement(tag);if(cls)r.className=cls;if(value!==undefined)r.textContent=String(value);return r}
export function validateKKPHistory(data,reference){
 const issues=[];
 if(data?.schema!=="sli-kkp-regional-historical-2019-2024-v1"||data.series?.length!==2)issues.push("schema");
 for(const s of data?.series||[]){
  if(!ORIGINAL.test(s.source_url)||s.years?.join(",")!=="2019,2020,2021,2022,2023,2024"||!["orang","ton"].includes(s.unit))issues.push("series_metadata");
  if(s.rows?.some(r=>!r.province||r.values?.length!==6||r.values.some(v=>v!==null&&(!Number.isFinite(v)||v<0))))issues.push("invalid_rows");
  if(new Set(s.rows?.map(r=>r.province)).size!==s.rows?.length)issues.push("duplicate_province");
  s.years?.forEach((y,i)=>{
   const sum=s.rows.reduce((z,r)=>z+(r.values[i]??0),0);
   const count=s.rows.filter(r=>r.values[i]!==null).length;
   const report=s.year_coverage[i];
   if(report.year!==y||report.reported_provinces!==count||report.national_total!==s.national_totals[i]||
    Math.abs(sum-report.national_total)>(s.unit==="orang"?0.001:0.06)||
    Math.abs(sum-report.sum)>.005)issues.push("annual_reconciliation_"+s.id+"_"+y);
  });
 }
 if(reference){
  for(const [oldId,newId] of [["marine_fishers_2024","marine_fishers"],["seaweed_growout_2024","seaweed"]]){
   const old=reference.province_indicators.find(x=>x.id===oldId),s=data.series.find(x=>x.id===newId);
   if(!old||!s)issues.push("missing_2024_crosscheck");
   else {
    for(const x of old.rows)if(s.rows.find(r=>r.province===x.province)?.values[5]!==x.value)issues.push("2024_crosscheck_"+x.province);
    if(s.rows.filter(x=>x.values[5]!==null).length!==old.rows.length)issues.push("2024_coverage_mismatch");
   }
  }
 }
 return {pass:issues.length===0,issues:[...new Set(issues)],observations:(data?.series||[]).reduce((a,s)=>a+s.rows.reduce((sum,x)=>sum+x.values.filter(v=>v!==null).length,0),0)};
}
export function rowsForYear(series,year){
 const index=series.years.indexOf(Number(year));if(index<0)return [];
 return series.rows.map(x=>({province:x.province,value:x.values[index],year:Number(year)})).filter(x=>x.value!==null).sort((a,b)=>b.value-a.value);
}
export function provinceHistory(series,province){
 const row=series.rows.find(x=>x.province===province);
 return series.years.map((y,i)=>({year:y,value:row?.values[i]??null}));
}
function csv(filename,columns,rows){
 const esc=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
 const csv="\uFEFF"+[columns,...rows].map(row=>row.map(esc).join(",")).join("\r\n");
 const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function line(series,province,host){
 const vals=province?provinceHistory(series,province):series.years.map((year,i)=>({year,value:series.national_totals[i]}));
 const valid=vals.filter(x=>x.value!==null),hi=Math.max(1,...valid.map(x=>x.value)),lo=0;
 const W=660,H=235,padL=18,padR=16,padT=18,padB=29,x=i=>padL+i*(W-padL-padR)/5,y=v=>H-padB-(v-lo)/(hi-lo)*(H-padT-padB);
 host.replaceChildren();
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox",`0 0 ${W} ${H}`);svg.setAttribute("role","img");
 svg.setAttribute("aria-label",t("Tren tahunan terukur","Observed annual trend")+", "+(province||t("Nasional","National"))+", "+series.unit);
 const make=(tag,attrs)=>{const v=document.createElementNS(svg.namespaceURI,tag);for(const [k,val]of Object.entries(attrs))v.setAttribute(k,String(val));svg.append(v);return v};
 for(let i=0;i<3;i++){const Y=y(hi*i/2);make("line",{x1:padL,y1:Y,x2:W-padR,y2:Y,stroke:"#405f72","stroke-width":1,"stroke-dasharray":"3 6"});}
 let segment=[];
 function flush(){if(segment.length>=2)make("polyline",{points:segment.join(" "),fill:"none",stroke:"#e3be7a","stroke-width":3,"stroke-linejoin":"round"});segment=[];}
 vals.forEach((v,i)=>{if(v.value===null){flush();return;}segment.push(x(i)+","+y(v.value));});flush();
 vals.forEach((v,i)=>{
  const X=x(i);let yy=v.value===null?H-padB:y(v.value);
  if(v.value!==null){let circle=make("circle",{cx:X,cy:yy,r:4.8,fill:"#8fdae1",stroke:"#f2dfb5","stroke-width":1.5});const ttl=document.createElementNS(svg.namespaceURI,"title");ttl.textContent=v.year+": "+fmt(v.value,series.unit==="ton"?2:0)+" "+series.unit;circle.append(ttl);}
  let tx=make("text",{x:X,y:H-7,"text-anchor":"middle",fill:"#d8e8ed","font-size":12});tx.textContent=v.year;
 });
 host.append(svg);
 const msg=node("p","mf-hint",t("Data observasi 2019–2024. Titik kosong tidak dihubungkan. Pemekaran Papua mengganggu perbandingan administratif antartahun.","Observed 2019–2024. Missing points are disconnected. Papua boundary splits interrupt direct administrative comparisons."));
 host.append(msg);
}
async function renderMap(series,year,selected,onChoose){
 const map=el("mfHistoryMap");
 if(!window.SLIProvinceMap){map.textContent=t("Komponen peta tidak tersedia; grafik dan tabel tetap berfungsi.","Map module unavailable; table remains available.");return}
 const rows=rowsForYear(series,year);
 await window.SLIProvinceMap.render(map,{records:rows.map(r=>({name:r.province,value:r.value,period:String(year),source:series.source_url})),selected,period:String(year),digits:series.unit==="ton"?2:0,unit:series.unit,missing:t("Tidak dilaporkan","Not reported"),label:t("Peta indikator KKP ilustratif","Illustrative KKP province data map"),source:"KKP · "+t("geometri ilustratif, bukan BIG resmi","illustrative geometry, not official BIG"),onSelect:onChoose});
}
async function mount(){
 if(!el("mfHistoryMap"))return;
 try{
  const [r,old]=await Promise.all([fetch(DATA,{cache:"no-store",sliLocalOnly:true}),fetch(new URL("../data/sli-kkp-portal-screened-2024.json",import.meta.url),{cache:"no-store",sliLocalOnly:true})]);
  if(!r.ok||!old.ok)throw Error("KKP history data HTTP "+r.status+"/"+old.status);
  const [data,reference]=await Promise.all([r.json(),old.json()]),validation=validateKKPHistory(data,reference);
  if(!validation.pass)throw Error(validation.issues.join(","));
  const state={year:2024,series:"seaweed",selected:null};
  const selected=()=>data.series.find(s=>s.id===state.series);
  const year=el("mfHistoryYear"),indicator=el("mfHistoryMetric"),sel=el("mfHistorySelected");
  function draw(){
   const s=selected(),rows=rowsForYear(s,state.year);
   const table=el("mfHistoryRows");table.replaceChildren();
   rows.forEach((r,i)=>{const tr=node("tr");for(const [j,v]of [i+1,r.province,fmt(r.value,s.unit==="ton"?2:0),fmt(r.value/s.national_totals[state.year-2019]*100,2)+"%"].entries())tr.append(node(j===1?"th":"td",j>1?"numeric":"",v));tr.addEventListener("click",()=>{state.selected=r.province;draw();});table.append(tr);});
   el("mfHistorySummary").textContent=t("Tahun ","Year ")+state.year+" · "+nameOf(s)+" · "+rows.length+" "+t("provinsi dengan angka","provinces reporting")+" · "+fmt(s.national_totals[state.year-2019],s.unit==="ton"?2:0)+" "+s.unit+". "+t("Sel kosong bukan nol.","Blanks are not zeros.");
   sel.textContent=state.selected?t("Provinsi dipilih: ","Selected province: ")+state.selected:t("Tren total nasional","National total trend");
   line(s,state.selected,el("mfHistoryTrend"));
   el("mfHistorySource").href=s.source_url;
   renderMap(s,state.year,state.selected,(name,record)=>{state.selected=record?.value===null?null:name;draw()});
  }
  year.addEventListener("change",e=>{state.year=Number(e.target.value);state.selected=null;draw()});
  indicator.addEventListener("change",e=>{state.series=e.target.value;state.selected=null;draw()});
  el("mfHistoryReset").addEventListener("click",()=>{state.selected=null;draw()});
  el("mfHistoryCSV").addEventListener("click",()=>{const s=selected();csv("sli-kkp-history-"+s.id+"-"+state.year+".csv",["Year","Province","Reported value","Unit","KKP primary source","Geometry status"],rowsForYear(s,state.year).map(r=>[state.year,r.province,r.value,s.unit,s.source_url,"No official BIG polygon asserted"]));});
  const redraw=()=>draw();document.addEventListener("sli:languagechange",redraw);
  const listen=new MutationObserver(items=>{if(items.some(x=>x.attributeName==="lang"))draw()});listen.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  draw();
 }catch(e){el("mfHistoryMap").textContent=t("Riwayat provinsi KKP tidak tersedia: ","KKP history unavailable: ")+e.message;console.error("[KKP historical atlas]",e);}
}
if(typeof document!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount()}
