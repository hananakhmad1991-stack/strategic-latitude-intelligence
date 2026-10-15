/* SLI Trade Flow — native SVG Sankey, source-dated customs observations */
(function(){
"use strict";
const NS="http://www.w3.org/2000/svg";
const el=(tag,cl,txt)=>{const e=document.createElement(tag);if(cl)e.className=cl;if(txt!==undefined)e.textContent=String(txt);return e};
const sv=(tag,attrs,parent)=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,String(v));if(parent)parent.append(e);return e};
const t=(en,id)=>window.SLIi18n?.language==="id"?id:en;
const fmt=n=>new Intl.NumberFormat(window.SLIi18n?.language==="id"?"id-ID":"en-US",{maximumFractionDigits:2}).format(n);
const usd=n=>n==null?t("Unavailable","Belum tersedia"):"US$"+fmt(n>=1000?n/1000:n)+" "+(n>=1000?t("bn","miliar"):t("mn","juta"));
const signed=n=>(n>=0?"+":"−")+usd(Math.abs(n));
const safeUrl=s=>/^https:\/\//.test(s||"");
const source=(url,caption)=>{const a=el("a",null,caption+" ↗");if(safeUrl(url)){a.href=url;a.target="_blank";a.rel="noopener noreferrer"}return a};
const state={data:null,sector:"minerba",commodity:"coal",direction:"exports",limit:9,query:""};
const selected=()=>state.data.bilateral.products.filter(p=>p.sector===state.sector&&(state.commodity==="all"||p.id===state.commodity));
const total=(ps,d)=>ps.reduce((n,p)=>n+(p[d].world_musd||0),0);
const alias=c=>c==="Korea, Rep."?"South Korea":c;
const partnerName=c=>c==="OTHER"?t("Other / remainder","Mitra lain / residu"):c==="UNKNOWN"?t("Partner data not verified","Mitra belum terverifikasi"):c;
function dataFlows(ps,dir){
 const out=[];
 for(const p of ps){const block=p[dir];if(block.world_musd==null)continue;
 let sum=0;for(const r of block.partners){sum+=r.musd;out.push({p,c:alias(r.country),v:r.musd})}
 const gap=Math.max(0,block.world_musd-sum);
 if(!block.partners.length)out.push({p,c:"UNKNOWN",v:block.world_musd});
 else if(gap>.01)out.push({p,c:"OTHER",v:gap});
 }
 return out;
}
function view(){
 const root=document.getElementById("sliTradeRoot");if(!root||!state.data)return;
 root.replaceChildren();
 const latest=state.data.latest_bps;
 const hero=el("section","tf-hero");hero.append(el("small",null,"STRATEGIC LATITUDE · TRADE FLOW INTELLIGENCE"),el("h2",null,t("Indonesia Commodity Trade Sankey","Sankey Perdagangan Komoditas Indonesia")),el("p",null,t("Country origins, export destinations, product groups and trade balances from source-dated customs records.","Negara pemasok, tujuan ekspor, kelompok komoditas, dan neraca perdagangan berbasis catatan kepabeanan bersumber.")));root.append(hero);
 const macro=el("section","tf-macro");macro.append(el("div","tf-wide-title",t("LATEST BPS NATIONAL TRADE · JAN–AUG 2026 (DIFFERENT PERIOD FROM SANKEY)","PERDAGANGAN NASIONAL BPS · JAN–AGU 2026 (BERBEDA DENGAN PERIODE SANKEY)")));
 for(const [title,value,balance] of [[t("National exports","Ekspor nasional"),latest.exports_total_musd,false],[t("National imports","Impor nasional"),latest.imports_total_musd,false],[t("National goods balance","Neraca barang nasional"),latest.exports_total_musd-latest.imports_total_musd,true],[t("Oil & gas balance","Neraca migas"),latest.exports_oil_gas_musd-latest.imports_oil_gas_musd,true]]){
 const cell=el("div","tf-kpi");cell.append(el("small",null,title),el("strong",null,balance?signed(value):usd(value)));macro.append(cell)}
 const macroNote=el("p","tf-macro-note",t("National non-oil/gas is NOT equal to minerba. Exports FOB; imports CIF. ","Nonmigas nasional BUKAN sama dengan minerba. Ekspor FOB; impor CIF. "));
 macroNote.append(source(latest.source_url,t("BPS release, 1 Oct 2026","Rilis BPS, 1 Okt 2026")));macro.append(macroNote);root.append(macro);
 const panel=el("section","tf-panel");panel.append(el("h3",null,t("Bilateral commodity flows · Full year 2025","Arus bilateral komoditas · Tahun penuh 2025")));
 const controls=el("div","tf-controls"),sector=el("select","tf-input"),commodity=el("select","tf-input"),direction=el("select","tf-input"),limit=el("select","tf-input"),query=el("input","tf-input");
 function options(s,rows,v){s.replaceChildren();for(const [id,title] of rows){const a=el("option",null,title);a.value=String(id);s.append(a)}s.value=String(v)}
 const group=state.data.bilateral.products.filter(p=>p.sector===state.sector);
 if(state.commodity!=="all"&&!group.some(p=>p.id===state.commodity))state.commodity=group[0].id;
 options(sector,[["minerba",t("Mining & metals","Minerba & logam")],["migas",t("Oil & gas","Migas")],["electricity",t("Electricity trade","Perdagangan listrik")]],state.sector);
 options(commodity,[["all",t("All selected HS groups","Semua kelompok HS")],...group.map(p=>[p.id,t(p.name_en,p.name_id)+" · HS "+p.hs])],state.commodity);
 options(direction,[["exports",t("Exports → partner countries","Ekspor → negara mitra")],["imports",t("Imports ← partner countries","Impor ← negara mitra")]],state.direction);
 options(limit,[[6,"Top 6"],[9,"Top 9"],[12,"Top 12"],[20,"Top 20"]],state.limit);
 query.type="search";query.placeholder=t("Highlight country","Sorot negara");query.value=state.query;query.setAttribute("aria-label","Highlight country");
 const field=(title,control)=>{const w=el("label","tf-field");w.append(el("span",null,title),control);return w};
 controls.append(field(t("Sector","Sektor"),sector),field(t("Commodity / HS","Komoditas / HS"),commodity),field(t("Direction","Arah"),direction),field(t("Partner count","Jumlah mitra"),limit),field(t("Search country","Cari negara"),query));panel.append(controls);
 sector.addEventListener("change",()=>{state.sector=sector.value;state.commodity="all";state.query="";view()});
 commodity.addEventListener("change",()=>{state.commodity=commodity.value;view()});
 direction.addEventListener("change",()=>{state.direction=direction.value;view()});
 limit.addEventListener("change",()=>{state.limit=Number(limit.value);view()});
 query.addEventListener("input",()=>{state.query=query.value.toLowerCase();draw()});
 panel.append(el("p","tf-warning",t("Country Sankey: year 2025. Top destinations/origins plus transparent remainder. A missing country observation or unavailable reverse flow is NOT zero. Data shown are selected HS commodities, not the entire sector.","Sankey negara: tahun 2025. Negara teratas beserta sisa yang dihitung transparan. Data mitra yang hilang atau arus sebaliknya yang belum tersedia BUKAN nol. Pos HS yang ditampilkan bukan seluruh sektor.")));
 const summary=el("div","tf-summary"),area=el("div","tf-sankey-scroll"),meta=el("div","tf-meta"),table=el("div","tf-table-scroll"),sources=el("div","tf-sources");panel.append(summary,area,meta,table,sources);root.append(panel);
 function draw(){
 const ps=selected(),dir=state.direction,world=total(ps,dir),xp=total(ps,"exports"),imp=total(ps,"imports"),complete=ps.every(p=>p.exports.world_musd!=null&&p.imports.world_musd!=null);
 summary.replaceChildren();area.replaceChildren();meta.replaceChildren();table.replaceChildren();sources.replaceChildren();
 for(const [key,value] of [[t("Exports 2025 · HS basket","Ekspor 2025 · kelompok HS"),usd(xp)],[t("Imports 2025 · HS basket","Impor 2025 · kelompok HS"),ps.some(p=>p.imports.world_musd!=null)?usd(imp)+(complete?"":" *"):t("Not verified","Belum diverifikasi")],[t("Trade balance · same HS / year","Neraca · HS / tahun sama"),complete?signed(xp-imp):t("Not computable · incomplete","Belum dapat dihitung · data parsial")]]){
 const c=el("div","tf-mini-kpi");c.append(el("small",null,key),el("b",null,value));summary.append(c)}
 const flows=dataFlows(ps,dir),partnerTotals=new Map();
 for(const f of flows)if(f.c!=="OTHER"&&f.c!=="UNKNOWN")partnerTotals.set(f.c,(partnerTotals.get(f.c)||0)+f.v);
 const visible=new Set([...partnerTotals].sort((a,b)=>b[1]-a[1]).slice(0,state.limit).map(x=>x[0]));
 const aggregate=new Map();
 for(const f of flows){const country=f.c==="UNKNOWN"?"UNKNOWN":visible.has(f.c)?f.c:"OTHER",key=f.p.id+"|"+country;
 if(!aggregate.has(key))aggregate.set(key,{p:f.p,c:country,v:0});aggregate.get(key).v+=f.v}
 const edges=[...aggregate.values()].filter(f=>f.v>.00001);
 if(!edges.length){area.append(el("p","tf-empty",t("No source-verified figures in this direction. Unknown is not zero.","Belum ada angka terverifikasi pada arah ini. Data tak tersedia bukan nol.")))}
 else{
 const W=1300,H=670,xL=175,xM=625,xR=1045,bar=16;
 const countries=[...new Set(edges.map(e=>e.c))].sort((a,b)=>sumCountry(b)-sumCountry(a));
 const commodities=ps.filter(p=>edges.some(e=>e.p.id===p.id)).sort((a,b)=>sumProduct(b.id)-sumProduct(a.id));
 function sumCountry(k){return edges.filter(e=>e.c===k).reduce((n,e)=>n+e.v,0)}
 function sumProduct(k){return edges.filter(e=>e.p.id===k).reduce((n,e)=>n+e.v,0)}
 const scale=(540-Math.max(countries.length,commodities.length)*8)/world;
 function positions(keys,measure){const out=new Map();let y=55;for(const k of keys){const h=measure(k)*scale;out.set(k,{y,h,used:0});y+=h+8}return out}
 const C=positions(countries,sumCountry),P=positions(commodities.map(c=>c.id),sumProduct),all={y:55,h:world*scale,used:0};
 const paper=sv("svg",{viewBox:"0 0 "+W+" "+H,class:"tf-sankey",role:"img","aria-label":t("Interactive Sankey of Indonesian trade by country and HS commodity","Diagram Sankey perdagangan Indonesia menurut negara dan komoditas HS")},area);
 const lines=sv("g",{},paper),boxes=sv("g",{},paper);
 function path(x1,x2,y1,y2,w){const d=(x2-x1)*.45;return "M"+x1+","+y1+" C"+(x1+d)+","+y1+" "+(x2-d)+","+y2+" "+x2+","+y2+" L"+x2+","+(y2+w)+" C"+(x2-d)+","+(y2+w)+" "+(x1+d)+","+(y1+w)+" "+x1+","+(y1+w)+" Z"}
 const ordered=edges.sort((a,b)=>sumProduct(b.p.id)-sumProduct(a.p.id)||sumCountry(b.c)-sumCountry(a.c));
 for(const e of ordered){const p=P.get(e.p.id),c=C.get(e.c),w=e.v*scale,sy=dir==="exports"?all.y+all.used:c.y+c.used,ty=p.y+p.used;
 const r=sv("path",{d:path(xL+bar,xM,sy,ty,w),fill:"#60acbc",opacity:".25"},lines);sv("title",{},r).textContent=e.p.name_en+" / "+partnerName(e.c)+" · "+usd(e.v);
 if(dir==="exports")all.used+=w;else c.used+=w;p.used+=w}
 for(const p of P.values())p.used=0;
 for(const e of ordered){const p=P.get(e.p.id),c=C.get(e.c),w=e.v*scale,sy=p.y+p.used,ty=dir==="exports"?c.y+c.used:all.y+all.used;
 const active=!state.query||partnerName(e.c).toLowerCase().includes(state.query);
 const r=sv("path",{d:path(xM+bar,xR,sy,ty,w),fill:dir==="exports"?"#d2b079":"#64bdc0",opacity:active?".62":".07"},lines);sv("title",{},r).textContent=e.p.name_en+" / "+partnerName(e.c)+" · "+usd(e.v);
 p.used+=w;if(dir==="exports")c.used+=w;else all.used+=w}
 function node(x,y,h,caption,color,align){sv("rect",{x,y,width:bar,height:Math.max(1,h),rx:2,fill:color},boxes);
 const txt=sv("text",{x:align==="left"?x-9:x+bar+9,y:y+Math.max(10,Math.min(h/2+4,25)),fill:"#f2f8fc","font-size":12,"text-anchor":align==="left"?"end":"start"},boxes);txt.textContent=caption.length>25?caption.slice(0,24)+"…":caption;sv("title",{},txt).textContent=caption}
 node(dir==="exports"?xL:xR,55,all.h,"INDONESIA","#e1bd79",dir==="exports"?"left":"right");
 for(const p of commodities){const z=P.get(p.id);node(xM,z.y,z.h,t(p.name_en,p.name_id),"#69bab4","left")}
 for(const c of countries){const z=C.get(c);node(dir==="exports"?xR:xL,z.y,z.h,partnerName(c),"#8cbdcc",dir==="exports"?"right":"left")}
 for(const [x,copy] of [[xL,dir==="exports"?t("INDONESIA · EXPORTS","INDONESIA · EKSPOR"):t("COUNTRY OF ORIGIN","NEGARA ASAL")],[xM,t("HS PRODUCT","PRODUK HS")],[xR,dir==="exports"?t("DESTINATION","TUJUAN"):t("INDONESIA · IMPORTS","INDONESIA · IMPOR")]]){
 const a=sv("text",{x,y:24,fill:"#e3c68d","font-size":12,"font-weight":700},paper);a.textContent=copy}
 }
 meta.append(el("p",null,(dir==="exports"?t("Exports","Ekspor"):t("Imports","Impor"))+" · "+usd(world)+" · "+t("full year 2025","tahun penuh 2025")));
 const residual=edges.filter(e=>e.c==="OTHER").reduce((n,e)=>n+e.v,0),unknown=edges.filter(e=>e.c==="UNKNOWN").reduce((n,e)=>n+e.v,0);
 if(residual>.01)meta.append(el("p","tf-warning",t("Other countries / unlisted balance (reconciled to reported world total): ","Negara lainnya / residu (direkonsiliasi ke total dunia): ")+usd(residual)));
 if(unknown>.01)meta.append(el("p","tf-warning",t("Country distribution not independently verified for ","Distribusi negara belum terverifikasi untuk ")+usd(unknown)+t("; unattributed, NOT a partner country.","; belum teratribusi, BUKAN negara mitra.")));
 const tab=el("table","tf-table"),thead=el("thead"),hr=el("tr");
 for(const s of [t("Country","Negara"),t("Value · US$ mn","Nilai · US$ juta"),t("Share","Pangsa"),t("Bilateral balance*","Neraca bilateral*")])hr.append(el("th",null,s));thead.append(hr);tab.append(thead);
 const body=el("tbody");
 for(const [country,value] of [...partnerTotals].sort((a,b)=>b[1]-a[1]).slice(0,20)){
 if(state.query&&!country.toLowerCase().includes(state.query))continue;
 const p=ps.length===1?ps[0]:null;
 const x=p?.exports.partners.find(z=>alias(z.country)===country),i=p?.imports.partners.find(z=>alias(z.country)===country);
 const net=x&&i?x.musd-i.musd:null,row=el("tr");
 for(const v of [country,fmt(value),fmt(100*value/world)+"%",net==null?"—":(net>=0?"+":"−")+fmt(Math.abs(net))])row.append(el("td",null,v));body.append(row)}
 tab.append(body);table.append(tab,el("p","tf-warning",t("*Partner balance only shown when both same-year, same-HS partner flows are explicitly recorded. Dash never implies zero.","*Neraca mitra hanya ditampilkan apabila dua arus untuk tahun dan HS yang sama tercatat eksplisit. Tanda pisah bukan nol.")));
 const unique=new Set();sources.append(el("b",null,t("2025 original commodity sources","Sumber asli komoditas 2025")));
 for(const p of ps)for(const d of ["exports","imports"]){const a=p[d];if(safeUrl(a.source_url)&&!unique.has(a.source_url)){unique.add(a.source_url);sources.append(source(a.source_url,"HS "+p.hs+" · "+d))}}
 sources.append(el("p","tf-warning",t("HS = Harmonized System. Electricity uses HS271600 (cross-border power, NOT electrical equipment). Singapore CBET is planned, NOT a realized electricity export. Commodity basket is selected products, NOT the whole oil/gas or mining sector. Coal HS2701 is mining (not oil/gas); copper HS74 includes manufactured articles, not only ore. Imports CIF vs exports FOB. These are trade VALUES, not volumes.","HS = Harmonized System. Listrik menggunakan HS271600 (energi listrik lintas negara, BUKAN peralatan listrik). Perdagangan listrik ke Singapura masih rencana, BUKAN ekspor terealisasi. Kelompok ini hanya komoditas terpilih, BUKAN total seluruh migas atau minerba. Batubara HS2701 termasuk minerba, bukan migas; HS74 mencakup produk tembaga, bukan hanya bijih. Impor CIF versus ekspor FOB. Ini NILAI perdagangan, bukan volume.")));
 }
 draw();
}
window.initSLITradeFlow=async function(){const root=document.getElementById("sliTradeRoot");if(!root)return;if(state.data){view();return}
 root.replaceChildren(el("p","tf-warning",t("Loading published customs data…","Memuat data kepabeanan…")));
 try{const r=await fetch("data/commodity-trade-flows.json",{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);state.data=await r.json();view()}
 catch(e){root.replaceChildren(el("p","tf-warning",t("Source data unavailable; no values inferred.","Data sumber tidak tersedia; angka tidak direka.")));console.error("[SLI Trade]",e)}};
document.addEventListener("sli:languagechange",()=>{if(state.data&&document.getElementById("sliTradeRoot"))view()});
})();