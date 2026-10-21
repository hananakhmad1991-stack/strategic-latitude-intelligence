/* Verified food (Kementan 2026) and fisheries (KKP 2025) Sankeys.
 * KKP partners and commodities are two independent marginals; NEVER combine
 * them into a fabricated commodity-by-country matrix.
 */
(()=>{"use strict";
const NS="http://www.w3.org/2000/svg",T=(en,id)=>window.SLIi18n?.language==="id"?id:en;
const E=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n};
const SVG=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs||{}))n.setAttribute(k,String(v));if(parent)parent.append(n);return n};
const fmt=n=>Number(n).toLocaleString(window.SLIi18n?.language==="id"?"id-ID":"en-US",{maximumFractionDigits:2});
const usd=n=>"US$"+fmt(n>=1000?n/1000:n)+(n>=1000?T(" bn"," miliar"):T(" mn"," juta"));
const mkLink=(href,label)=>{const a=E("a",null,label+" ↗");if(/^https:\/\/\S+$/.test(href||"")){a.href=href;a.target="_blank";a.rel="noopener noreferrer"}return a};
const GROUPS=[["Tanaman Pangan","Food crops","Tanaman pangan"],["Hortikultura","Horticulture","Hortikultura"],["Perkebunan","Plantations","Perkebunan"],["Peternakan","Livestock","Peternakan"]];
const COLORS=["#e1be7d","#70c4cb","#91c7a1","#b99bdd","#d69a86","#9daccf"];
const cache={};let generation=0;
async function load(path){const r=await fetch(path,{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);return r.json()}
function validateFood(data){
 const rows=(data?.trade||[]).filter(r=>GROUPS.some(x=>x[0]===r.sector)&&["Segar","Olahan"].includes(r.scope)&&r.unit==="ribu USD"&&r.period==="2026-01/2026-04");
 if(data?.schema!=="sli-food-2026-launch-v1"||rows.length!==8||new Set(rows.map(x=>x.sector+"|"+x.scope)).size!==8||rows.some(r=>!Number.isFinite(r.export)||!Number.isFinite(r.import)||r.export<0||r.import<0))throw Error("Food source rows incomplete");
 return rows;
}
function foodFlows(data,direction){
 const rows=validateFood(data),field=direction==="imports"?"import":"export";
 return GROUPS.flatMap(([name,en,id])=>["Segar","Olahan"].map(form=>{
  const record=rows.find(x=>x.sector===name&&x.scope===form);
  return {from:"ALL",middle:name,to:form,value:record[field]/1000,tag:name+"|"+form,label:T(en,id)+" → "+T(form==="Segar"?"Fresh":"Processed",form)};
 }));
}
function validateMarine(data){
 if(data?.schema!=="sli-marine-fisheries-trade-2025-v1"||data.views?.length!==2||!Number.isFinite(data.total_exports_reported_musd))throw Error("Bad KKP dataset");
 const seen=new Set();
 for(const v of data.views){
  if(!["destinations","commodities"].includes(v.id)||seen.has(v.id)||v.items?.length!==5)throw Error("KKP marginal structure invalid");seen.add(v.id);
  if(v.items.some(x=>!Number.isFinite(x.value_musd)||x.value_musd<=0||!x.label_en||!x.label_id))throw Error("KKP item invalid");
  if(v.items.reduce((n,x)=>n+x.value_musd,0)>data.total_exports_reported_musd+1)throw Error("KKP selected sum exceeds rounded national total");
 }
 return data;
}
function node(name,en,id){return {name,en,id}}
function sankey(host,stages,edges,opts){
 const total=edges.reduce((n,x)=>n+x.value,0);if(total<=0)return;
 const H=Math.max(440,Math.max(...stages.map(s=>s.length))*44+170),W=1230;
 const paper=SVG("svg",{viewBox:"0 0 "+W+" "+H,class:"tf-sankey tf-sector-sankey",role:"img","aria-label":opts.title},host);
 const x=stages.length===3?[160,595,1025]:[270,905];
 const yPositions=stages.map((rows,i)=>{
  const sums=rows.map(r=>({...r,sum:edges.filter(e=>i===0?e.from===r.name:i===1&&stages.length===3?e.middle===r.name:e.to===r.name).reduce((n,e)=>n+e.value,0)}));
  let yy=55;const scale=(H-95-rows.length*11)/total;
  return new Map(sums.map(r=>{const h=r.sum*scale,z={...r,y:yy,h,used:0};yy+=h+11;return [r.name,z]}));
 });
 for(let hop=0;hop<stages.length-1;hop++){
  const left=yPositions[hop],right=yPositions[hop+1];
  for(const item of edges){
   const first=left.get(hop===0?item.from:item.middle),last=right.get(hop===0&&stages.length===3?item.middle:item.to);
   if(!first||!last||!item.value)continue;
   const width=Math.max(.25,item.value*Math.min(first.h/first.sum,last.h/last.sum));
   const sy=first.y+first.used+width/2,ey=last.y+last.used+width/2;
   first.used+=width;last.used+=width;
   const d="M"+(x[hop]+13)+","+sy+" C"+(x[hop]+200)+","+sy+" "+(x[hop+1]-200)+","+ey+" "+x[hop+1]+","+ey;
   const p=SVG("path",{d,fill:"none","stroke-width":width,stroke:COLORS[hop+1],opacity:".57"},paper);
   p.setAttribute("data-sli-point","");p.setAttribute("data-sli-sector-key",item.tag);p.setAttribute("tabindex","0");
   SVG("title",{},p).textContent=item.label+" · "+usd(item.value);
  }
  if(hop===0&&stages.length===3)for(const n of right.values())n.used=0;
 }
 yPositions.forEach((list,i)=>{for(const n of list.values()){
  SVG("rect",{x:x[i],y:n.y,width:13,height:Math.max(1,n.h),rx:2,fill:COLORS[i]},paper);
  const t=SVG("text",{x:i===0?x[i]-10:x[i]+20,y:n.y+Math.max(12,Math.min(22,n.h/2)),fill:"#edf4f8","font-size":13,"text-anchor":i===0?"end":"start"},paper);
  const label=T(n.en,n.id);t.textContent=label.length>27?label.slice(0,26)+"…":label;
  SVG("title",{},t).textContent=label+" · "+usd(n.sum);
 }});
 function register(){
  if(!paper.isConnected||!window.SLIVisualExport)return;
  window.SLIVisualExport.register(paper,{
   getData:()=>({kind:"verified-provider",headers:opts.headers,rows:edges.map(opts.row)}),
   getMeta:()=>({title:opts.title,source:opts.publisher,sourceUrl:opts.url,period:opts.period,completeness:opts.note})
  });
  window.SLIVisualExport.registerInsight?.(paper,{getInsight:({event})=>{
   const mark=event?.target?.closest?.("[data-sli-sector-key]"),e=edges.find(x=>x.tag===mark?.getAttribute("data-sli-sector-key"));
   return e?{title:e.label,details:[[T("Value","Nilai"),usd(e.value)],[T("Period","Periode"),opts.period]],source:opts.publisher,sourceUrl:opts.url,period:opts.period,lesson:opts.note}:null;
  }});
 }
 if(window.SLIVisualExport)register();else document.addEventListener("sli:exportready",register,{once:true});
}
function dataTable(host,headers,rows){
 const scroll=E("div","tf-table-scroll"),table=E("table","tf-table"),head=E("thead"),tr=E("tr");
 for(const h of headers)tr.append(E("th",null,h));head.append(tr);table.append(head);
 const body=E("tbody");for(const item of rows){const row=E("tr");for(const cell of item)row.append(E("td",null,cell));body.append(row)}
 table.append(body);scroll.append(table);host.append(scroll);
}
function foodView(host,data,direction){
 host.replaceChildren();const edges=foodFlows(data,direction),total=edges.reduce((n,x)=>n+x.value,0),url=data.publication.pdf||data.publication.publisher_page;
 host.append(E("h3",null,T("Food & Agriculture · Sector → product form","Pangan & Pertanian · Subsektor → bentuk produk")),
 E("p","tf-warning",T("Recorded Kementan Jan–Apr 2026 trade value. Sector × fresh/processed is published; trading countries and routes are NOT supplied in this table.",
 "Nilai perdagangan Kementan Jan–Apr 2026. Subsektor × segar/olahan tercatat; negara mitra dan rute TIDAK tersedia dalam tabel.")),mkLink(url,T("Original Kementan PDF","PDF resmi Kementan")));
 const controls=E("div","tf-controls"),label=E("label","tf-field",T("Flow direction","Arah arus")),select=E("select","tf-input");
 for(const [key,en,id]of [["exports","Exports · FOB","Ekspor · FOB"],["imports","Imports · CIF","Impor · CIF"]]){const opt=E("option",null,T(en,id));opt.value=key;select.append(opt)}
 select.value=direction;select.addEventListener("change",()=>foodView(host,data,select.value));label.append(select);controls.append(label);host.append(controls);
 host.append(E("p","tf-macro-note",T("Observed eight sector/form cells: ","Delapan sel subsektor/bentuk: ")+usd(total)+T(" · January–April 2026. Aggregate differences up to US$0.001 mn reflect source rounding."," · Januari–April 2026. Selisih agregat hingga US$0,001 juta mencerminkan pembulatan sumber.")));
 const area=E("div","tf-sankey-scroll");host.append(area);
 sankey(area,[[node("ALL",direction==="exports"?"Indonesia exports":"Indonesia imports",direction==="exports"?"Ekspor Indonesia":"Impor Indonesia")],
 GROUPS.map(g=>node(g[0],g[1],g[2])),
 [node("Segar","Fresh","Segar"),node("Olahan","Processed","Olahan")]],edges,{title:"Agriculture 2026 · "+direction,
 url,publisher:"Kementan · Statistik Terkini Ekonomi Pertanian",period:"2026-01/2026-04",
 note:"Kementan official subsector by product-form cells. No inferred origin or destination country.",
 headers:["Subsector","Product form","Direction","USD million","Period"],row:e=>[e.middle,e.to,direction,e.value,"2026-01/2026-04"]});
 dataTable(host,[T("Subsector","Subsektor"),T("Form","Bentuk"),T("USD million","USD juta")],
 edges.map(e=>[T(GROUPS.find(g=>g[0]===e.middle)[1],e.middle),T(e.to==="Segar"?"Fresh":"Processed",e.to),fmt(e.value)]));
}
function marineView(host,data,viewID){
 validateMarine(data);const v=data.views.find(x=>x.id===viewID)||data.views[0],total=v.items.reduce((n,x)=>n+x.value_musd,0);
 host.replaceChildren(E("h3",null,T("Marine & Fisheries · Official 2025 trade","Kelautan & Perikanan · Perdagangan resmi 2025")),
 E("p","tf-warning",T("The KKP release provides two separate totals by export market and by commodity group, NOT a cross-tab linking a fish product to a destination. The diagram never joins them.",
 "Rilis KKP menyediakan dua rincian terpisah menurut pasar tujuan dan kelompok komoditas, BUKAN matriks komoditas menurut negara. Diagram tidak menyatukan keduanya.")),
 mkLink(data.source_url,T("KKP original publication, 16 Feb 2026","Publikasi asli KKP, 16 Februari 2026")));
 const controls=E("div","tf-controls"),label=E("label","tf-field",T("Breakdown","Kelompok")),select=E("select","tf-input");
 for(const option of data.views){const el=E("option",null,T(option.title_en,option.title_id));el.value=option.id;select.append(el)}
 select.value=v.id;select.addEventListener("change",()=>marineView(host,data,select.value));label.append(select);controls.append(label);host.append(controls);
 host.append(E("p","tf-macro-note",T("Five published categories: ","Lima kategori yang diterbitkan: ")+usd(total)+T(" · full national total approximately "," · total nasional sekitar ")+usd(data.total_exports_reported_musd)+T(". No artificial exact 'other' balance because KKP's total was rounded.",
 ". Tidak membuat angka residu 'lainnya' yang terkesan persis karena total KKP dibulatkan.")));
 if(Number.isFinite(data.trade_surplus_reported_musd)){
  const surplus=E("p","tf-macro-note",T("2025 fisheries trade surplus reported separately by KKP/BPS: ","Surplus perdagangan perikanan 2025 yang dilaporkan terpisah oleh KKP/BPS: ")+usd(data.trade_surplus_reported_musd)+T(" (rounded; not a diagram edge or inferred imports)."," (dibulatkan; bukan sisi diagram atau dasar untuk menebak nilai impor)."));
  host.append(surplus);
 }
 const edges=v.items.map(a=>({from:"ALL",to:a.id,value:a.value_musd,tag:v.id+"|"+a.id,label:T(a.label_en,a.label_id)}));
 const area=E("div","tf-sankey-scroll");host.append(area);
 sankey(area,[[node("ALL","Indonesia fisheries exports","Ekspor perikanan Indonesia")],v.items.map(x=>node(x.id,x.label_en,x.label_id))],edges,{
 title:"KKP 2025 · "+v.title_en,url:data.source_url,publisher:data.publisher,period:data.period,
 note:"Separate 2025 marginal group only. Not a product × country pair or full-country matrix.",
 headers:[v.dimension,"USD million","Period"],row:e=>[e.to,e.value,data.period]});
 dataTable(host,[T(v.dimension==="partner_group"?"Destination group":"Commodity group",v.dimension==="partner_group"?"Kelompok tujuan":"Kelompok komoditas"),T("USD million","USD juta")],v.items.map(x=>[T(x.label_en,x.label_id),fmt(x.value_musd)]));
 host.append(E("p","tf-warning",T("KKP Bursa Ikan CSV was not accessible; the source is KKP’s dated original publication, not an inferred bilateral product allocation.",
 "CSV Bursa Ikan KKP belum dapat diakses; sumber yang digunakan adalah publikasi resmi KKP bertanggal, bukan alokasi bilateral produk hasil dugaan.")));
}
async function render(host,sector){
 const token=++generation;host.replaceChildren(E("p","tf-warning",T("Loading verified sector flows…","Memuat arus sektoral terverifikasi…")));
 try{
  if(sector==="food"){const data=cache.food||(cache.food=await load("./data/food-agriculture-2026.json"));if(token===generation&&host.isConnected)foodView(host,data,"exports")}
  else if(sector==="marine"){const data=cache.marine||(cache.marine=await load("./data/sli-marine-fisheries-trade-2025.json"));if(token===generation&&host.isConnected)marineView(host,data,"destinations")}
 }catch(err){console.error("[SLI sector Sankey]",err);if(token===generation&&host.isConnected)host.replaceChildren(E("p","tf-warning",T("Source unavailable or failed validation; no values fabricated.","Sumber tidak tersedia atau gagal diverifikasi; angka tidak direka.")))}
}
window.SLISectorTradeSankey={render,validateFood,foodFlows,validateMarine};
})();
