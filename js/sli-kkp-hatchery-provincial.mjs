/* Provincial KKP 2024 hatchery summary cards (not 1,387 district/commodity rows). */
const URLDATA=new URL("../data/sli-kkp-hatchery-province-cards-2024.json",import.meta.url);
const id=x=>document.getElementById(x);
const fmt=n=>new Intl.NumberFormat(document.documentElement.lang==="en"?"en-US":"id-ID").format(n);
const en=()=>document.documentElement.lang==="en";
const T=(a,b)=>en()?b:a;
export function validateHatcheryProvinceSummary(data){
 const issues=[];
 if(data?.schema!=="sli-kkp-2024-hatchery-province-card-snapshot-v1"||data.observation_year!==2024||data.unit!=="ribu ekor"||data.rows?.length!==33)issues.push("schema");
 if(!String(data.source_url).startsWith("https://portaldata.kkp.go.id/"))issues.push("source");
 if(new Set(data.rows?.map(r=>r.province)).size!==33)issues.push("duplicate");
 if(data.rows?.some(r=>!r.province||!Number.isInteger(r.volume_ribu_ekor)||r.volume_ribu_ekor<=0))issues.push("value");
 const sum=data.rows?.reduce((a,r)=>a+r.volume_ribu_ekor,0);
 if(sum!==187483665||data.national_total_displayed!==188203415||data.unallocated_displayed_gap!==719750||sum+data.unallocated_displayed_gap!==data.national_total_displayed)issues.push("gap");
 if(!String(data.coverage_status).includes("not_complete"))issues.push("coverage");
 return {pass:issues.length===0,issues};
}
function create(tag,cls,text){const p=document.createElement(tag);if(cls)p.className=cls;if(text!==undefined)p.textContent=String(text);return p}
function makeCsv(records,source){
 const quote=x=>'"'+String(x??"").replace(/"/g,'""')+'"';
 const rows=[["Observation year","Province","Hatchery volume (ribu ekor)","Source publisher","Official source","Coverage status"],...records.map(r=>[2024,r.province,r.volume_ribu_ekor,"KKP",source,"Partial 33 printed regional cards; unallocated gap to published national total"])];
 const blob=new Blob(["\uFEFF"+rows.map(r=>r.map(quote).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=create("a");a.href=url;a.download="sli-kkp-2024-hatchery-partial-33-provinces.csv";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function mount(){
 if(!id("mfHatcheryProvinceRanking"))return;
 try{
  const r=await fetch(URLDATA,{cache:"no-store",sliLocalOnly:true});
  if(!r.ok)throw Error("HTTP "+r.status);
  const d=await r.json(),v=validateHatcheryProvinceSummary(d);
  if(!v.pass)throw Error("unverified_source_"+v.issues.join(","));
  let query="";
  function render(){
   const sorted=[...d.rows].filter(x=>x.province.toLocaleLowerCase("id-ID").includes(query)).sort((a,b)=>b.volume_ribu_ekor-a.volume_ribu_ekor);
   const host=id("mfHatcheryProvinceRanking");host.replaceChildren();
   const top=Math.max(...d.rows.map(x=>x.volume_ribu_ekor));
   for(const r of sorted){
    const tr=create("div","mf-atlas-prov-summary");
    tr.append(create("span","",r.province));
    const bar=create("span","mf-atlas-prov-summary-track"),fill=create("i","mf-atlas-prov-summary-fill");
    fill.style.width=(r.volume_ribu_ekor/top*100).toFixed(2)+"%";
    bar.append(fill);tr.append(bar,create("strong","",fmt(r.volume_ribu_ekor)));
    host.append(tr);
   }
   id("mfHatcheryProvinceStatus").textContent=T(
    sorted.length+" dari 33 angka provinsi yang tampak · jumlah subtotal "+fmt(d.visible_cards_sum)+" ribu ekor · total nasional KKP "+fmt(d.national_total_displayed)+" ribu ekor · selisih tidak teralokasi "+fmt(d.unallocated_displayed_gap)+" ribu ekor. Ini BUKAN data lengkap 1.387 baris.",
    sorted.length+" of 33 visible provincial figures · subtotal "+fmt(d.visible_cards_sum)+" thousand fish · KKP national "+fmt(d.national_total_displayed)+" thousand fish · unallocated difference "+fmt(d.unallocated_displayed_gap)+" thousand fish. NOT the complete 1,387 rows.");
  }
  id("mfHatcheryProvinceSearch").addEventListener("input",e=>{query=e.target.value.toLocaleLowerCase("id-ID").trim();render()});
  id("mfHatcheryProvinceCSV").addEventListener("click",()=>makeCsv(d.rows,d.source_url));
  id("mfHatcheryProvinceSource").href=d.source_url;
  document.addEventListener("sli:languagechange",render);
  render();
 }catch(e){id("mfHatcheryProvinceStatus").textContent=T("Data provinsi pembenihan belum tersedia atau tidak lolos validasi.","Hatchery provincial snapshot unavailable or invalid.")+" "+e.message}
}
if(typeof document!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount()}
