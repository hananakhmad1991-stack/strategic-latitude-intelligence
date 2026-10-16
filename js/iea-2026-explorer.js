/* SLI / IEA 2026 Critical Minerals Dataset Explorer.
 * IEA (2026), Critical Minerals Dataset, Paris. CC BY 4.0.
 * Source: user-supplied July 2026 XLSX; selected workbook series, NOT live prices.
 */
(function(){
"use strict";
const FILE="data/iea-2026-workbook-dashboard.json";
const T=(en,id)=>window.SLIi18n?.language==="id"?id:en;
function E(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined&&txt!==null)e.textContent=String(txt);return e}
function anchor(url,txt){const a=E("a",null,txt);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a}
const nfmt=x=>Number(x).toLocaleString(window.SLIi18n?.language==="id"?"id-ID":"en-US",{maximumFractionDigits:4});
const finite=x=>typeof x==="number"&&Number.isFinite(x);
function dropdown(label,options,value){
 const wrap=E("label","iea26-selector"),caption=E("small",null,label),s=E("select","iea26-select");
 for(const [v,t] of options){const o=E("option",null,t);o.value=v;s.append(o)}
 if(value!=null)s.value=value;
 wrap.append(caption,s);return {wrap,select:s};
}
function stat(title,value,note){const v=E("article","iea26-kpi");v.append(E("small",null,title),E("strong",null,value),E("p",null,note));return v}
function spark(root,points,unit){
 root.replaceChildren();const vals=points.filter(x=>finite(x[1]));if(!vals.length){root.append(E("p","iea26-muted","No source data"));return}
 const w=760,h=250,ml=62,mr=16,mt=15,mb=55,max=Math.max(...vals.map(x=>x[1]),1);
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 760 250");svg.setAttribute("role","img");svg.setAttribute("aria-label","IEA source-dated scenario comparison, unit "+unit);svg.classList.add("iea26-svg");
 for(let i=0;i<=4;i++){
  const level=max*i/4,y=h-mb-(h-mt-mb)*i/4;
  const rule=document.createElementNS(svg.namespaceURI,"line");for(const [k,val] of Object.entries({x1:ml,y1:y,x2:w-mr,y2:y,stroke:"#34536d"}))rule.setAttribute(k,val);svg.append(rule);
  const text=document.createElementNS(svg.namespaceURI,"text");text.setAttribute("x",ml-7);text.setAttribute("y",y+4);text.setAttribute("fill","#b1cadb");text.setAttribute("text-anchor","end");text.setAttribute("font-size","10");text.textContent=nfmt(level);svg.append(text);
 }
 const gap=(w-ml-mr)/vals.length,bw=Math.min(80,gap*.66);
 vals.forEach(([label,value],i)=>{
  const x=ml+gap*(i+.5),y=h-mb-(h-mt-mb)*value/max,bar=document.createElementNS(svg.namespaceURI,"rect");
  for(const [k,v] of Object.entries({x:x-bw/2,y,width:bw,height:(h-mb-y),rx:3,fill:i===0?"#6eb9ce":"#d7b678"}))bar.setAttribute(k,v);svg.append(bar);
  const mark=document.createElementNS(svg.namespaceURI,"text");for(const [k,v] of Object.entries({x,y:Math.max(mt+11,y-6),fill:"#e9dbc1","font-size":"11","text-anchor":"middle"}))mark.setAttribute(k,v);mark.textContent=nfmt(value);svg.append(mark);
  const foot=document.createElementNS(svg.namespaceURI,"text");for(const [k,v] of Object.entries({x,y:h-27,fill:"#c9d8e1","font-size":"10","text-anchor":"middle"}))foot.setAttribute(k,v);foot.textContent=label;svg.append(foot);
 });
 root.append(svg);
}
function reference(root,data){
 const foot=E("p","iea26-foot");
 foot.append(E("strong",null,"IEA (2026), Critical Minerals Dataset · July 2026 · CC BY 4.0. "));
 foot.append(E("span",null,T("Dashboard selects relevant workbook series. 2025 baseline is source-modelled; 2030–2050 values are conditional scenarios and project-based supply assumptions. kt = thousand metric tonnes. Not LME or realtime market prices. ", "Modul memakai pilihan seri dalam Excel. Baseline 2025 berasal dari estimasi IEA; angka 2030–2050 adalah skenario bersyarat. kt = ribu ton metrik; bukan harga bursa real-time. ")));
 foot.append(anchor(data.source,T("Open original data ↗","Buka dataset resmi ↗")));
 foot.append(E("span",null," · "));
 foot.append(anchor(data.report,T("IEA 2026 Outlook ↗","Kajian IEA 2026 ↗")));
 root.append(foot);
}
function mount(scope,where){
 const parent=typeof where==="string"?document.getElementById(where):where;
 if(!parent)return;
 const box=E("section","sli-iea26");
 box.id="sli-iea26-"+scope;
 box.append(E("small","iea26-kicker","INTERNATIONAL ENERGY AGENCY · 2026 OPEN DATA"),
   E("h3",null,T("Critical Minerals · Supply, Demand & Scenario Explorer","Mineral Kritis · Eksplorasi Pasokan, Permintaan & Skenario")),
   E("p","iea26-muted",T("World IEA projections and Indonesia's estimated role, drawn directly from the 2026 source workbook. Explore different minerals, scenarios and technologies.","Proyeksi dunia dan peran Indonesia menurut IEA, diolah dari file Excel sumber 2026. Pilih mineral, skenario, dan teknologi.")));
 const status=E("p","iea26-status",T("Loading source-dated IEA workbook extract…","Memuat hasil olahan Excel IEA…"));box.append(status);parent.append(box);
 fetch(FILE,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("IEA dataset not found");return r.json()}).then(data=>{
  if(!box.isConnected)return;
  if(!data.minerals||!data.supply||!data.technologies||data.license!=="CC BY 4.0")throw Error("IEA workbook schema mismatch");
  status.textContent=T("Dataset: July 2026 · 37 transition minerals · 6 mining/refining country series · six technology applications.",
                       "Dataset Juli 2026 · 37 mineral transisi · 6 seri negara tambang/pemurnian · enam penerapan teknologi.");
  const nickel=data.supply.Nickel,niMine=nickel.mining.leaders.find(x=>x[0]==="Indonesia"),niRef=nickel.refining.leaders.find(x=>x[0]==="Indonesia");
  const cobalt=data.supply.Cobalt.mining,coMine=cobalt.leaders.find(x=>x[0]==="Indonesia");
  const kpi=E("div","iea26-kpis");
  for(const [title,num,note] of [
    ["Indonesia nickel · mining share (2025)",(100*niMine[1]/nickel.mining.world[0]).toFixed(1)+"%",nfmt(niMine[1])+" of "+nfmt(nickel.mining.world[0])+" kt · IEA 2025 base"],
    ["Indonesia nickel · refining share (2025)",(100*niRef[1]/nickel.refining.world[0]).toFixed(1)+"%",nfmt(niRef[1])+" of "+nfmt(nickel.refining.world[0])+" kt · different boundary"],
    ["Indonesia cobalt · mining share (2025)",(100*coMine[1]/cobalt.world[0]).toFixed(1)+"%",nfmt(coMine[1])+" of "+nfmt(cobalt.world[0])+" kt · IEA 2025 base"],
    ["Nickel demand · energy technologies STEPS 2040",nfmt(data.minerals.Nickel[2])+" kt","Global energy-sector demand; conditional scenario"]
  ])kpi.append(stat(title,num,note));
  box.append(kpi);
  const controls=E("div","iea26-controls");
  const tabs=dropdown(T("View","Tampilan"),[["mineral",T("37-mineral global demand","Permintaan global 37 mineral")],["supply",T("Country mining & refining","Pertambangan & pemurnian per negara")],["tech",T("Energy technology demand","Kebutuhan mineral teknologi energi")]],scope==="energy"?"tech":"supply");
  const mineral=dropdown(T("Mineral","Mineral"),Object.keys(data.minerals).map(x=>[x,x]),"Nickel");
  const supply=dropdown(T("Key mineral","Mineral utama"),Object.keys(data.supply).map(x=>[x,x]),"Nickel");
  const process=dropdown(T("Processing stage","Tahap produksi"),[["mining",T("Mining","Tambang")],["refining",T("Refining","Pemurnian")]],"mining");
  const year=dropdown(T("Supply reference","Periode pasokan"),[["0","2025"],["1","2030 projection"],["2","2040 projection"]],"0");
  const technology=dropdown(T("Technology","Teknologi"),Object.keys(data.technologies).map(x=>[x,x]),scope==="energy"?"Battery storage":"Electric vehicles");
  const techMineral=dropdown(T("Mineral used","Mineral yang dipakai"),[],"Nickel");
  [tabs,mineral,supply,process,year,technology,techMineral].forEach(x=>controls.append(x.wrap));
  box.append(controls);
  const chart=E("div","iea26-chart"),detail=E("p","iea26-detail"),table=E("div","iea26-table");box.append(chart,detail,table);
  function drawTable(rows,heads){
   table.replaceChildren();const tbl=E("table","iea26-matrix"),th=E("thead"),tr=E("tr");heads.forEach(x=>tr.append(E("th",null,x)));th.append(tr);tbl.append(th);
   const tbody=E("tbody");rows.forEach(c=>{const row=E("tr");c.forEach(v=>row.append(E("td",null,v)));tbody.append(row)});tbl.append(tbody);table.append(tbl);
  }
  function syncTech(){
   const minerals=data.technologies[technology.select.value].map(x=>x[0]);
   const old=techMineral.select.value;techMineral.select.replaceChildren();
   for(const m of minerals){const op=E("option",null,m);op.value=m;techMineral.select.append(op)}
   techMineral.select.value=minerals.includes(old)?old:(minerals.includes("Nickel")?"Nickel":minerals[0]);
  }
  function update(){
   const mode=tabs.select.value;
   for(const x of [mineral,supply,process,year,technology,techMineral])x.wrap.hidden=false;
   const cols=data.demand_columns,years=["2025","2030","2040"];
   if(mode==="mineral"){
    for(const x of [supply,process,year,technology,techMineral])x.wrap.hidden=true;
    const name=mineral.select.value,nums=data.minerals[name]||[];
    spark(chart,cols.map((c,i)=>[c,nums[i]]),"kt");
    detail.textContent=name+" · global demand specifically attributable to energy technologies (kt), not aggregate world use. STEPS and HDS are independent future scenarios.";
    drawTable([[name,...nums.map(nfmt)]],["Mineral",...cols]);
   }else if(mode==="supply"){
    for(const x of [mineral,technology,techMineral])x.wrap.hidden=true;
    const name=supply.select.value,phase=process.select.value,idx=Number(year.select.value);
    const p=data.supply[name][phase];const rows=p.leaders.map(r=>[r[0],r[idx+1]]).sort((a,b)=>b[1]-a[1]);
    spark(chart,rows.map(x=>[x[0],x[1]]),"kt");
    const indonesia=rows.find(x=>x[0]==="Indonesia");
    detail.textContent=name+" · "+phase+" · "+years[idx]+" IEA "+(idx?"projected base-case supply":"model baseline")+". Listed countries only; global total "+nfmt(p.world[idx])+" kt. "+(indonesia?"Indonesia "+nfmt(indonesia[1])+" kt ("+(100*indonesia[1]/p.world[idx]).toFixed(1)+"% of model global supply).":"Indonesia is not listed separately in this source's leading-country rows; this is not evidence of zero supply.");
    drawTable([...rows.map(x=>[x[0],nfmt(x[1])]),["World total",nfmt(p.world[idx])]],["Country / scope","kt · "+years[idx]]);
   }else{
    for(const x of [mineral,supply,process,year])x.wrap.hidden=true;
    const name=technology.select.value,m=techMineral.select.value,record=data.technologies[name].find(x=>x[0]===m);
    if(!record){chart.replaceChildren();table.replaceChildren();return}
    const vals=record.slice(1);spark(chart,cols.map((c,i)=>[c,vals[i]]),"kt");
    detail.textContent=name+" · "+m+" energy technology demand, kt. The 2025 baseline and future model outputs are not a forecast of Indonesian refinery sales.";
    drawTable([[m,...vals.map(nfmt)]],["Technology mineral",...cols]);
   }
  }
  [tabs,mineral,supply,process,year,technology,techMineral].forEach(x=>x.select.addEventListener("change",()=>{
   if(x===technology)syncTech();update();
  }));
  syncTech();update();reference(box,data);
 }).catch(err=>{status.textContent=T("IEA model data unavailable. Original sources remain accessible.","Data model IEA tidak dapat dimuat; sumber asli tetap tersedia.");box.append(anchor("https://www.iea.org/data-and-statistics/data-product/critical-minerals-dataset","IEA original source ↗"));console.warn("[SLI IEA workbook]",err)});
}
window.initSLIIEA2026Explorer=mount;
})();
