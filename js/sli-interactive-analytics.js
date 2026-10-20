(()=>{"use strict";
const $=id=>document.getElementById(id),years=[2021,2022,2023,2024,2025],percent=new Set(["real_growth","pmtb_share"]);
let db=null,selected=13;
const fmt=n=>n==null?"N/A":new Intl.NumberFormat("id-ID",{maximumFractionDigits:2}).format(n);
function value(p,metric,year){const i=years.indexOf(year);if(i<0)return null;
 if(metric==="real_growth"){if(i===0)return null;const a=p.grdp_constant?.[i],b=p.grdp_constant?.[i-1];return Number.isFinite(a)&&b>0?100*(a/b-1):null}
 if(metric==="pmtb_share"){const a=p.pmtb_current?.[i],b=p.grdp_current?.[i];return Number.isFinite(a)&&b>0?100*a/b:null}
 return p[metric]?.[i]??null;
}
function current(){return {metric:$("metric").value,year:Number($("year").value),province:Number($("province").value),search:$("search").value.toLowerCase().trim()}}
function unit(m){return percent.has(m)?"%":"Rp miliar"}
function render(){if(!db)return;const q=current(),data=db.provinces.map(p=>({p,v:value(p,q.metric,q.year)})).filter(x=>x.v!==null&&Number.isFinite(x.v)&&x.p.name.toLowerCase().includes(q.search)).sort((a,b)=>b.v-a.v);
 const median=data.length?data.map(x=>x.v).sort((a,b)=>a-b)[Math.floor(data.length/2)]:null;
 $("headline").textContent=data.length+" provinsi dengan data tersedia · Median "+fmt(median)+" "+unit(q.metric)+" · "+q.year;
 // Source-backed provincial map replaces the former Power BI-like province bar comparison.
 // The generic exporter remains available for eligible tables and source-linked charts.
 if(window.SLIProvinceMap){
  const all=db.provinces.map(p=>({name:p.name,value:p.name.toLowerCase().includes(q.search)?value(p,q.metric,q.year):null,period:String(q.year)}));
  window.SLIProvinceMap.render("provinceMap",{records:all,selected:db.provinces.find(p=>p.id===q.province)?.name||"",
   period:String(q.year),source:"BPS · PDRB Provinsi menurut Pengeluaran",unit:unit(q.metric),digits:percent.has(q.metric)?2:1,
   onSelect:name=>{const target=db.provinces.find(p=>p.name===name);if(target){$("province").value=String(target.id);$("search").value="";render();}}
  });
 }
 const p=db.provinces.find(x=>x.id===q.province),trend=$("trend");trend.replaceChildren();if(p){const h=document.createElement("h3");h.textContent=p.name+" · "+$("metric").selectedOptions[0].text;trend.append(h);
 const vals=years.map(y=>({year:y,v:value(p,q.metric,y)})).filter(x=>x.v!==null);const upper=Math.max(...vals.map(x=>x.v),1),lower=Math.min(0,...vals.map(x=>x.v));
 for(const item of vals){const row=document.createElement("div");row.className="trendRow";const l=document.createElement("span");l.textContent=item.year;const meter=document.createElement("span");meter.className="track";const f=document.createElement("span");f.className="fill";f.style.width=(100*(item.v-lower)/Math.max(1,upper-lower))+"%";meter.append(f);const num=document.createElement("b");num.textContent=fmt(item.v);row.append(l,meter,num);trend.append(row)}}
 const tbody=$("rows");tbody.replaceChildren();for(const item of data){const tr=document.createElement("tr");for(const content of [item.p.name,String(q.year),fmt(item.v)+" "+unit(q.metric)]){const td=document.createElement("td");td.textContent=content;tr.append(td)}tbody.append(tr)}
 const source=db.sources?.pdrb;$("sources").textContent="Sumber: BPS · "+db.source_time+" · Ekstraksi SLI: "+db.extracted_at+" · "+(source?.url||"");window.sliAnalyticsRows=data.map(x=>[x.p.name,q.year,x.v]);}
for(const id of ["metric","year","province","search"])$(id).addEventListener(id==="search"?"input":"change",render);
$("export").onclick=()=>{const q=current(),lines=[["Province","Year",q.metric],...(window.sliAnalyticsRows||[])].map(row=>row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(",")).join("\r\n");const blob=new Blob([lines],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="sli-regional-"+q.year+".csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
fetch("./data/sli-bps-regional-intelligence.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Data source unavailable");return r.json()}).then(v=>{if(!Array.isArray(v.provinces))throw Error("Invalid source");db=v;for(const y of years){const o=document.createElement("option");o.value=y;o.textContent=y;$("year").append(o)}$("year").value="2025";for(const p of db.provinces){const o=document.createElement("option");o.value=p.id;o.textContent=p.name;$("province").append(o)}$("province").value=selected;render()}).catch(e=>{$("headline").textContent="Data tidak dapat dimuat: "+e.message});
})();