/* SLI | Universal Chart Export & Brand Mark
 * Finds published SVG/canvas/table visualizations across all SLI dashboards.
 * Native data must be explicitly registered; otherwise CSV/XLSX exports only visible content.
 * Exported images/PDFs include an on-image SLI wordmark and source trail.
 */
(()=>{"use strict";
const VERSION="2026.10.19-pointinspector2",NS="http://www.w3.org/2000/svg";
const BAR_SELECTOR='[id$="Bars"],.bar-chart,.sli-bar-chart,.reg-bars,[data-sli-visual-bars]';
const providers=new WeakMap(),known=new WeakSet(),visuals=new Map();let counter=0,scheduled=false,observing=false;
const $=(name,attrs={},text)=>{const e=document.createElement(name);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=String(text);return e};
const txt=s=>String(s==null?"":s);
const rootURL=new URL("../",document.currentScript?.src||document.querySelector('script[src*="sli-navigation.js"]')?.src||location.href);
const lang=()=>document.documentElement.lang?.toLowerCase().startsWith("id")||window.SLIi18n?.language==="id";
const tr=(a,b)=>lang()?b:a;
const slug=s=>txt(s).normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,52);
function title(host){
 const caption=host.querySelector("figcaption")||host.closest("figure")?.querySelector("figcaption");
 const heading=host.closest("section,article")?.querySelector("h2,h3,h4")||host.previousElementSibling;
 const h=caption?.textContent?.trim()||((/^H[2-5]$/.test(heading?.tagName||""))?heading.textContent.trim():"");
 return h||host.getAttribute("aria-label")||document.title||"SLI visual";
}
function metadata(host){
 const provider=providers.get(host);const meta=typeof provider?.getMeta==="function"?provider.getMeta():provider?.meta;
 const a=host.closest("section,article")?.querySelector("a[href^='https://']")||document.querySelector('a[href*="worldbank.org"]');
 return {title:meta?.title||title(host),source:meta?.source||"Source in the dashboard; inspect original references before reuse",
  sourceUrl:meta?.sourceUrl||a?.href||"",period:meta?.period||"",completeness:meta?.completeness||"Visible chart elements only; full numeric source not exposed by this visualization"};
}
function isChart(node){
 if(!node||!node.isConnected||node.closest(".sli-visual-export-toolbar,svg .sli-visual-export-toolbar"))return false;
 if(node.matches(BAR_SELECTOR))return node.querySelectorAll(".regbar,.bar-row,[class*=bar-item]").length>=2;
 if(node.matches("table")){
  return node.querySelectorAll("tr").length>=2&&!node.closest(".sli-visual-export-toolbar");
 }
 if(node.matches("svg")){
  if(node.closest("button,a,.sidebar,.sli-universal-nav,.sli-visual-export-toolbar"))return false;
  const box=node.viewBox?.baseVal;return box?.width>=260&&box?.height>=60||
   (Number(node.getAttribute("width"))>=260&&Number(node.getAttribute("height"))>=110)||
   (node.getBoundingClientRect().width>=260&&node.getBoundingClientRect().height>=110);
 }
 if(node.matches("canvas"))return node.width>=240&&node.height>=110;
 return false;
}
function findHost(node){
 if(node.matches(BAR_SELECTOR))return node;
 if(node.matches("table")){
  return node.closest(".scroll,.table-wrap,.table-scroll,.table-container,.sli-table-wrap,figure")||node.parentElement;
 }
 return node.closest(".sli-geo-timeline-plot,.sli-geo-timeline-scatter,figure,[data-sli-visual],[class*='chart-wrap'],[class*='chart-container'],[class*='visual-wrap'],[class*='visualization']")||node.parentElement;
}
function extractTable(table){
 const all=Array.from(table.querySelectorAll("tr")).filter(r=>r.querySelectorAll("td,th").length);
 const clean=c=>c.innerText?.trim()||c.textContent?.trim()||"";
 if(!all.length)return {headers:["Item","Value"],rows:[],kind:"table"};
 const first=all[0],header=first.querySelector("th")!==null,headers=header?Array.from(first.children).map(clean):
  Array.from(first.children).map((_,i)=>tr("Column ","Kolom ")+(i+1));
 const rows=(header?all.slice(1):all).map(r=>Array.from(r.children).map(clean));
 return {headers,rows,kind:"table"};
}
function extractSVG(sv){
 const data=[];
 // SVG labels, accessible SVG <title> tooltips, and axis labels are NOT a complete numerical dataset.
 for(const node of sv.querySelectorAll("text,title")){
  if(node.closest(".sli-export-watermark"))continue;
  const label=txt(node.textContent).trim();if(label&&label.length<350&&data.length<1000)data.push([node.localName||node.tagName.toLowerCase(),label]);
 }
 return {headers:["Visible element","Displayed text / tooltip"],rows:data,kind:"visible-labels"};
}
function extractBars(target){
 const rows=Array.from(target.querySelectorAll(".regbar,.bar-row,[class*=bar-item]"));
 return {headers:["Item","Visible value","Bar fill (%)"],rows:rows.map((r,i)=>{
  const name=r.querySelector(".regbar-top span,.bar-label,[class*=bar-name]")?.textContent?.trim()||r.querySelector("span")?.textContent?.trim()||"Item "+(i+1);
  const value=r.querySelector(".regbar-top strong,.bar-value,[class*=bar-value]")?.textContent?.trim()||r.textContent?.trim()||"";
  const fill=r.querySelector(".regbar-fill,.bar-fill,[class*=bar-fill]");
  return [name,value,fill?.style?.width||""];
 }),kind:"visible-bars"};
}
function extractCanvas(canvas){return {headers:["Scope","Details"],rows:[["Image-only visualization","Raw numeric observations not supplied by this chart"]],kind:"image-only"}}
function getData(host,visual){
 const provider=providers.get(host);
 if(provider){
  const result=typeof provider.getData==="function"?provider.getData():provider.data;
  if(result&&Array.isArray(result.headers)&&Array.isArray(result.rows))
   return {headers:result.headers,rows:result.rows,kind:result.kind||"verified-provider"};
 }
 return visual.matches("table")?extractTable(visual):visual.matches("svg")?extractSVG(visual):visual.matches("canvas")?extractCanvas(visual):extractBars(visual);
}
function filename(host,ext){return "SLI-"+slug(title(host)).slice(0,42)+"-"+new Date().toISOString().slice(0,10)+"."+ext}
function register(host,provider){
 if(typeof host==="string")host=document.getElementById(host);
 if(!host||!provider)return false;
 const h=host.classList?.contains("sli-visual-export-host")?host:findHost(host);
 if(!h)return false;providers.set(h,provider);
 if(h.dataset.sliVisualExportId)visuals.set(h.dataset.sliVisualExportId,h);
 queue();return true;
}
function ensure(host,visual){
 if(!host||known.has(host))return;
 if(host.closest(".sli-visual-export-toolbar"))return;
 known.add(host);host.classList.add("sli-visual-export-host");
 if(!host.dataset.sliVisualExportId){
  let id=host.id?slug(host.id):"";
  if(!id){const p=host.closest(".sli-geo-timeline-panel");if(p){
   const groups=Array.from(document.querySelectorAll(".sli-geo-timeline-panel"));id="geopolitics-"+(groups.indexOf(p)+1)+(host.classList.contains("sli-geo-timeline-scatter")?"-scatter":"-chart");
  }}
  if(!id){counter++;id="chart-"+counter}
  if(visuals.has(id))id+="-"+(++counter);
  host.dataset.sliVisualExportId=id;
 }
 const id=host.dataset.sliVisualExportId;
 visuals.set(id,host);
 const toolbar=$("div",{class:"sli-visual-export-toolbar",role:"group","aria-label":tr("Export this visualization","Ekspor visualisasi ini")});
 const announce=$("span",{class:"sli-visual-export-feedback","aria-live":"polite"},"");
 const buttons=[["csv","CSV"],["xlsx","Excel"],["png","PNG"],["jpg","JPG"],["pdf","PDF"],["embed",tr("Embed","Sematkan")]];
 for(const [format,label] of buttons){
  const b=$("button",{type:"button","data-sli-export-format":format,title:tr("Export ","Ekspor ")+label},label);
  b.addEventListener("click",()=>exportOne(host,format,b,announce));
  toolbar.append(b);
 }
 toolbar.append(announce);
 if(host.hasAttribute("data-sli-export-external-controls"))toolbar.hidden=true;
 host.insertBefore(toolbar,host.firstChild);
 if(new URLSearchParams(location.search).get("sli_embed")===id)showEmbed(host);
}
function scan(){
 scheduled=false;
 const nodes=document.querySelectorAll("svg,canvas,table,"+BAR_SELECTOR);
 for(const n of nodes){
  if(!isChart(n))continue;const h=findHost(n);
  if(h){ensure(h,n);
   // Mark supported observations as keyboard-focusable without changing existing
   // chart click handlers or inventing coordinates.
   if(n.matches("table")){
    for(const row of n.querySelectorAll("tr")){
     if(!row.querySelector("td"))continue;
     row.setAttribute("data-sli-inspectable","");
     if(!row.hasAttribute("tabindex"))row.tabIndex=0;
    }
   }
   if(n.matches("svg")){
    for(const mark of n.querySelectorAll("[data-sli-point]")){
     if(!mark.hasAttribute("tabindex"))mark.setAttribute("tabindex","0");
    }
   }
  }
 }
 const wanted=new URLSearchParams(location.search).get("sli_embed");
 if(wanted&&visuals.has(wanted))showEmbed(visuals.get(wanted));
}
function queue(){
 if(scheduled)return;scheduled=true;setTimeout(scan,130);
}
function showEmbed(host){
 if(document.body.classList.contains("sli-visual-embed-mode"))return;
 document.body.classList.add("sli-visual-embed-mode");
 host.classList.add("sli-visual-embed-focus");
 const name=$("div",{class:"sli-visual-embed-credit"},"SLI · STRATEGIC LATITUDE INTELLIGENCE");
 host.append(name);
 const stylesheet=$("style",{},"body.sli-visual-embed-mode{margin:0!important;background:#0c2337!important;overflow:hidden!important}body.sli-visual-embed-mode *{visibility:hidden!important}body.sli-visual-embed-mode .sli-visual-embed-focus,body.sli-visual-embed-mode .sli-visual-embed-focus *{visibility:visible!important}body.sli-visual-embed-mode .sli-visual-embed-focus{position:fixed!important;top:0!important;left:0!important;right:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:32px 15px 37px!important;box-sizing:border-box!important;overflow:auto!important;z-index:2147483600!important;background:#0c2337!important}body.sli-visual-embed-mode .sli-visual-export-toolbar{display:none!important}.sli-visual-embed-credit{position:absolute;bottom:9px;right:20px;color:#91a3b2;font-size:11px;font-weight:800}");
 document.head.append(stylesheet);
}
function heightWidth(visual){
 if(visual.matches("svg")){
  const vb=visual.viewBox?.baseVal;const w=vb?.width||Number(visual.getAttribute("width"))||visual.getBoundingClientRect().width||960;
  const h=vb?.height||Number(visual.getAttribute("height"))||visual.getBoundingClientRect().height||520;
  return {w,h};
 }
 if(visual.matches("canvas"))return {w:visual.width,h:visual.height};
 if(visual.matches(BAR_SELECTOR))return {w:1100,h:Math.min(1900,140+extractBars(visual).rows.length*33)};
 return {w:1150,h:Math.min(1500,140+visual.querySelectorAll("tr").length*30)};
}
function inlineSvgStyles(source,clone){
 const old=[source,...source.querySelectorAll("*")],copied=[clone,...clone.querySelectorAll("*")];
 const props=["font-family","font-size","font-weight","font-style","fill","stroke","stroke-width","opacity","text-anchor","letter-spacing","visibility"];
 for(let i=0;i<old.length&&i<copied.length;i++){
  let comp;try{comp=getComputedStyle(old[i])}catch{continue}
  const target=copied[i];if(!target?.style)continue;
  for(const p of props){const v=comp.getPropertyValue(p);if(v)target.style.setProperty(p,v)}
 }
}
async function drawSVG(ctx,source,left,top,width,height){
 const copy=source.cloneNode(true);inlineSvgStyles(source,copy);
 copy.setAttribute("xmlns",NS);copy.setAttribute("width",String(width));copy.setAttribute("height",String(height));
 if(!copy.getAttribute("viewBox"))copy.setAttribute("viewBox","0 0 "+width+" "+height);
 const payload=new XMLSerializer().serializeToString(copy);
 const blob=new Blob([payload],{type:"image/svg+xml;charset=utf-8"}),url=URL.createObjectURL(blob);
 try{
  const img=new Image();
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error("SVG contains unsupported content or external assets"));img.src=url});
  ctx.drawImage(img,left,top,width,height);
 }finally{URL.revokeObjectURL(url)}
}
function drawBars(ctx,bar,top,width,height){
 const entries=extractBars(bar).rows;
 ctx.fillStyle="#122d42";ctx.fillRect(0,top,width,height);
 ctx.textBaseline="middle";
 entries.slice(0,46).forEach((r,i)=>{
  const y=top+12+i*33;
  ctx.font="12px system-ui,sans-serif";ctx.fillStyle="#e3edf7";
  ctx.fillText(r[0].slice(0,42),12,y+10,240);
  ctx.fillStyle="#244359";ctx.fillRect(260,y+3,width-410,19);
  const fraction=Math.max(0,Math.min(100,Number.parseFloat(r[2])||0));
  ctx.fillStyle="#d9b46e";ctx.fillRect(260,y+3,(width-410)*fraction/100,19);
  ctx.fillStyle="#e9eff4";ctx.font="600 12px system-ui,sans-serif";
  ctx.fillText(r[1].slice(0,34),width-140,y+11,136);
 });
 if(entries.length>46){ctx.fillStyle="#f1c878";ctx.font="12px sans-serif";ctx.fillText(tr("Preview first 46 rows; CSV/Excel include all","Gambar 46 baris pertama; CSV/Excel mencakup semua"),12,top+height-15)}
}
function drawTable(ctx,table,top,width,height){
 const extract=extractTable(table),data=[extract.headers,...extract.rows.slice(0,36)];
 const columns=Math.min(8,Math.max(1,extract.headers.length)),cellWidth=width/columns,lineHeight=31;
 ctx.fillStyle="#122e43";ctx.fillRect(0,top,width,height);
 ctx.textBaseline="middle";ctx.font="14px system-ui,sans-serif";
 data.forEach((row,i)=>{
  const y=top+6+i*lineHeight;
  if(i===0){ctx.fillStyle="#294a61";ctx.fillRect(0,y,width,lineHeight)}
  else if(i%2===0){ctx.fillStyle="#18364d";ctx.fillRect(0,y,width,lineHeight)}
  for(let j=0;j<columns;j++){
   ctx.fillStyle=i===0?"#f1d69f":"#e1eaf1";
   const value=txt(row[j]||"").slice(0,Math.max(10,Math.floor(cellWidth/8)));
   ctx.fillText(value,j*cellWidth+10,y+lineHeight/2,Math.max(15,cellWidth-18));
  }
 });
 if(extract.rows.length>36){ctx.font="12px system-ui,sans-serif";ctx.fillStyle="#f5c988";ctx.fillText(tr("Image previews first 36 rows only · CSV/Excel contain all rows","Gambar hanya memuat 36 baris pertama · CSV/Excel memuat seluruh baris"),10,top+height-15)}
}
async function capture(host,visual,meta){
 const size=heightWidth(visual);const scale=Math.min(2,2400/Math.max(1,size.w),1800/Math.max(1,size.h+90));
 const width=Math.max(360,Math.round(size.w*scale)),height=Math.max(190,Math.round(size.h*scale)),footer=75;
 const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height+footer;
 const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas 2D unsupported");
 ctx.fillStyle="#0d2539";ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.save();ctx.scale(scale,scale);
 if(visual.matches("svg"))await drawSVG(ctx,visual,0,0,size.w,size.h);
 else if(visual.matches("canvas"))ctx.drawImage(visual,0,0,size.w,size.h);
 else if(visual.matches("table"))drawTable(ctx,visual,0,size.w,size.h);
 else drawBars(ctx,visual,0,size.w,size.h);
 ctx.restore();
 // Burn a subtle large SLI wordmark into the chart itself, plus full footer attribution.
 ctx.save();ctx.textAlign="right";ctx.fillStyle="rgba(169,180,192,0.18)";ctx.font="900 "+Math.max(36,Math.round(width*.092))+"px system-ui,sans-serif";ctx.fillText("SLI",width-20,height-28);ctx.restore();
 ctx.fillStyle="#0d2539";ctx.fillRect(0,height,width,footer);
 ctx.fillStyle="#e7c37f";ctx.font="800 18px system-ui,sans-serif";ctx.fillText("SLI",20,height+27);
 ctx.fillStyle="#e7edf4";ctx.font="600 12px system-ui,sans-serif";ctx.fillText("STRATEGIC LATITUDE INTELLIGENCE  ·  "+txt(meta.title).slice(0,70),77,height+27,width-93);
 ctx.fillStyle="#a9bccb";ctx.font="11px system-ui,sans-serif";ctx.fillText(txt(meta.source).slice(0,120)+"  ·  "+new Date().toISOString().slice(0,10),20,height+50,width-30);
 return canvas;
}
function activeVisual(host){
 const candidates=Array.from(host.querySelectorAll("svg,canvas,table,"+BAR_SELECTOR)).filter(isChart);
 return (isChart(host)?host:null)||candidates.find(n=>n.matches("svg,canvas"))||candidates[0]||null;
}
function copyString(s){
 if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(s);
 const t=$("textarea",{readonly:""});t.value=s;document.body.append(t);t.select();
 const ok=document.execCommand?.("copy");t.remove();if(!ok)throw Error("Clipboard unavailable");return Promise.resolve();
}
async function exportOne(host,format,button,feedback){
 button=button||{disabled:false};feedback=feedback||{textContent:""};
 button.disabled=true;feedback.textContent=tr("Preparing…","Menyiapkan…");
 try{
  const visual=activeVisual(host);if(!visual)throw Error("No supported chart/table currently rendered");
  const meta=metadata(host),raw=getData(host,visual);
  let blob,ext=format;
  if(format==="csv"||format==="xlsx"){
   if(!raw.rows.length)throw Error("No machine-readable data or visible labels for this figure");
   meta.completeness=raw.kind==="verified-provider"?"Full registered plotted observations":
    raw.kind==="table"?"Visible table rows":"VISIBLE ELEMENTS ONLY — NOT full underlying numeric dataset";
   blob=format==="csv"?window.SLIVisualFormats.csv({...raw,meta}):window.SLIVisualFormats.xlsx({...raw,meta});
  }else if(format==="png"||format==="jpg"||format==="pdf"){
   const canvas=await capture(host,visual,meta);
   if(format==="pdf")blob=window.SLIVisualFormats.pdf(canvas);
   else blob=await new Promise((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(Error(format.toUpperCase()+" encoding failed")),format==="jpg"?"image/jpeg":"image/png",.93));
  }else if(format==="embed"){
   const url=new URL(location.href);url.searchParams.set("sli_embed",host.dataset.sliVisualExportId);
   const iframe='<iframe src="'+url.toString().replace(/&/g,"&amp;").replace(/"/g,"&quot;")+'" title="SLI — '+meta.title.replace(/&/g,"&amp;").replace(/"/g,"&quot;")+'" width="100%" height="520" loading="lazy" style="border:1px solid #37536b;border-radius:8px"></iframe>';
   await copyString(iframe);feedback.textContent=tr("Embed code copied","Kode embed disalin");return;
  }
  window.SLIVisualFormats.save(blob,filename(host,ext));
  feedback.textContent=raw.kind==="visible-labels"&&(format==="csv"||format==="xlsx")?
   tr("Downloaded visible labels (not raw chart data)","Label visual terunduh (bukan data mentah)") :
   tr("File ready","File siap");
 }catch(err){
  console.error("[SLI export]",err);feedback.textContent=tr("Export failed: ","Ekspor gagal: ")+txt(err.message).slice(0,90);
 }finally{button.disabled=false}
}

/* Universal click-for-context fallback for published tables, source-labelled SVGs and
 * CSS bar charts. Specialty modules (strategic map, geopolitical events) have their
 * own richer, record-specific inspectors and are deliberately not intercepted.
 * No numeric data or causal interpretation is inferred from pixel positions. */
const pointInsights=new WeakMap();
let activeInspectorHost=null;
function registerInsight(visual,provider){
 if(typeof visual==="string")visual=document.getElementById(visual);
 if(!visual||!provider)return false;
 pointInsights.set(visual,provider);return true;
}
function insightName(meta){return meta?.title||tr("Selected visual evidence","Bukti visual terpilih")}
function detailValue(node){return txt(node?.innerText||node?.textContent).trim()}
function genericLesson(){
 return tr("Compare like-for-like units, dates, definitions and reporting statuses. This visual observation alone cannot establish cause and effect.",
 "Bandingkan satuan, waktu, definisi, dan status pelaporan yang sepadan. Satu observasi visual tidak membuktikan sebab-akibat.");
}
function clearChartInsight(host){
 if(!host)return;
 const split=host.parentElement?.classList?.contains("sli-visual-insight-split")?host.parentElement:null;
 if(!split)return;
 split.querySelector(":scope > .sli-visual-insight")?.remove();
 host.querySelectorAll(".sli-visual-insight-selected").forEach(x=>x.classList.remove("sli-visual-insight-selected"));
 if(split.isConnected&&host.parentNode===split){split.parentNode.insertBefore(host,split);split.remove()}
 if(activeInspectorHost===host)activeInspectorHost=null;
}
function openVisualInsight(event){
 const target=event.target;
 if(!(target instanceof Element)||target.closest(".sli-visual-export-toolbar,.sli-visual-insight,[role=menu],a,button,select,input,textarea"))return;
 const svg=target.closest("svg"),table=target.closest("table"),canvas=target.closest("canvas");
 const bar=target.closest(".regbar,.bar-row,[class*=bar-item]");
 const visual=svg||table||canvas||bar;if(!visual)return;
 // Rich local inspectors retain control: asset maps and geopolitical event chronologies.
 if(visual.closest("#sliMapRoot,#geo-commodity-timeline,.sli-geo-timeline-panel,.sli-geo-timeline-plot,.sli-geo-timeline-scatter"))return;
 const host=visual.closest(".sli-visual-export-host")||findHost(visual);if(!host||!host.isConnected)return;
 const meta=metadata(host),provider=pointInsights.get(visual)||pointInsights.get(host);
 let heading="",details=[],selection=null,scope="";
 if(table){
  const row=target.closest("tr");
  if(!row||!row.querySelector("td"))return;
  const bodyRows=Array.from(table.querySelectorAll("tr")).filter(r=>r.querySelector("td"));
  const index=bodyRows.indexOf(row);if(index<0)return;
  const heads=Array.from(table.querySelectorAll("thead tr:last-child th"));
  const fallback=extractTable(table),cells=Array.from(row.querySelectorAll(":scope > th,:scope > td"));
  const readable=c=>c?.innerText?.trim()||c?.textContent?.trim()||"";
  details=cells.map((cell,i)=>[(heads[i]?readable(heads[i]):fallback.headers[i])||tr("Column ","Kolom ")+(i+1),readable(cell)])
   .filter(x=>x[1]).slice(0,16);
  if(!details.length)return;
  heading=details[0][1];selection=row;
  scope=tr("One selected table row, not the full dataset","Satu baris tabel terpilih, bukan seluruh dataset");
 }else if(svg){
  const shape=target.closest("[data-sli-point],circle,rect,path,polyline,polygon,g");
  if(!shape||shape===svg)return;
  const ownTitle=shape.querySelector(":scope > title")||shape.parentElement?.querySelector(":scope > title");
  const caption=detailValue(ownTitle)||shape.getAttribute("aria-label")||shape.dataset.sliPointLabel||"";
  heading=caption.slice(0,280);
  details=heading?[[tr("Displayed observation","Observasi pada grafik"),heading]]:[];
  selection=shape;scope=tr("One chart point, not the whole series","Satu titik grafik, bukan seluruh deret");
 }else if(bar){
  const name=detailValue(bar.querySelector(".regbar-top span,.bar-label,[class*=bar-name]"))||detailValue(bar.querySelector("span"))||detailValue(bar).slice(0,160);
  const value=detailValue(bar.querySelector(".regbar-top strong,.bar-value,[class*=bar-value]"));
  if(!name)return;
  heading=name;details=[[tr("Selected category","Kategori terpilih"),name]];
  if(value)details.push([tr("Displayed figure","Angka pada grafik"),value]);
  selection=bar;scope=tr("One selected bar","Satu batang grafik terpilih");
 }else if(canvas){
  const observation=provider?.getInsight?.({event,visual});
  if(!observation)return; // A pixel alone never establishes a numeric reading.
  heading=observation.title||meta.title;
  details=observation.details||[];
  selection=canvas;
  scope=tr("Registered source observation","Observasi dari sumber yang terdaftar");
 }
 let extra;
 if(provider?.getInsight && !canvas){
  try{extra=provider.getInsight({event,visual,heading,details})}catch(e){console.warn("[SLI insight] provider",e)}
 }else if(canvas)extra=provider.getInsight({event,visual,heading,details});
 if(extra===false)return; // Domain-specific chart declined a generic fallback.
 if(extra){heading=extra.title||heading;details=extra.details||details}
 if(!heading&&!details.length)return; // Do not create fictional values for unlabeled marks.
 if(activeInspectorHost&&activeInspectorHost!==host)clearChartInsight(activeInspectorHost);
 // The active observation owns the right panel. Keep an already-open panel and
 // replace its content on every subsequent bar/point/row click.
 let split=host.parentElement?.classList?.contains("sli-visual-insight-split")?host.parentElement:null;
 if(!split){
  split=$("div",{class:"sli-visual-insight-split"});
  host.parentNode.insertBefore(split,host);
  split.append(host);
 }
 let inspector=split.querySelector(":scope > .sli-visual-insight");
 if(!inspector){inspector=$("section",{class:"sli-visual-insight",role:"region","aria-live":"polite","aria-label":tr("SLI visual evidence inspector","Inspektor bukti visual SLI")});split.append(inspector)}
 inspector.replaceChildren();
 const head=$("div",{class:"sli-visual-insight-head"});
 const name=$("strong",{},tr("SELECTED DATA INSIGHT","ANALISIS DATA TERPILIH"));
 const close=$("button",{type:"button"},tr("Clear selection","Hapus pilihan"));
 close.addEventListener("click",()=>clearChartInsight(host));
 head.append(name,close);
 inspector.append(head,$("h4",{},heading),$("p",{class:"sli-visual-insight-kind"},scope));
 const fields=$("dl",{class:"sli-visual-insight-fields"});
 for(const item of details.slice(0,18)){
  if(!Array.isArray(item)||item.length<2||item[1]==null||!txt(item[1]).trim())continue;
  fields.append($("dt",{},txt(item[0])),$("dd",{},txt(item[1])));
 }
 inspector.append(fields);
 const period=extra?.period||meta.period;
 if(period)inspector.append($("p",{class:"sli-visual-insight-period"},tr("Observation/reporting period: ","Periode observasi/pelaporan: ")+period));
 const note=extra?.lesson||genericLesson();
 inspector.append($("p",{class:"sli-visual-insight-lesson"},note));
 const source=extra?.source||meta.source;
 const rowSource=table?selection?.querySelector('a[href^="https://"]')?.href:"";
 const sourceUrl=extra?.sourceUrl||rowSource||meta.sourceUrl;
 const credit=$("p",{class:"sli-visual-insight-credit"},tr("Source / provenance: ","Sumber / asal data: ")+source);
 if(/^https:\/\/[^/\s]+/i.test(sourceUrl||"")){
  const a=$("a",{href:sourceUrl,target:"_blank",rel:"noopener noreferrer"},tr("Read original source ↗","Buka sumber asli ↗"));credit.append(" · ",a)
 }
 inspector.append(credit);
 host.querySelectorAll(".sli-visual-insight-selected").forEach(x=>x.classList.remove("sli-visual-insight-selected"));
 if(selection?.classList)selection.classList.add("sli-visual-insight-selected");
 activeInspectorHost=host;
}

function start(){
 if(!document.body)return;
 document.addEventListener('click',openVisualInsight);
 document.addEventListener('keydown',event=>{
  if(event.key!=="Enter"&&event.key!==" ")return;
  const t=event.target;if(!(t instanceof Element))return;
  if(!t.matches('tr[data-sli-inspectable],svg [data-sli-point],.regbar[tabindex],.bar-row[tabindex]'))return;
  event.preventDefault();openVisualInsight(event);
 });
 queue();
 if(!observing&&typeof MutationObserver!=="undefined"){
  observing=true;new MutationObserver(queue).observe(document.body,{subtree:true,childList:true});
 }
 document.addEventListener("sli:pagechange",queue);
 document.addEventListener("sli:languagechange",queue);
}
async function exportVisual(target,format,feedback){
 if(typeof target==="string")target=document.getElementById(target)||visuals.get(target);
 if(!target)throw Error("Export visualization not found");
 const host=target.classList?.contains("sli-visual-export-host")?target:(isChart(target)?findHost(target):target);
 if(!host)throw Error("Export host not found");
 const visual=isChart(target)?target:activeVisual(host);
 if(!visual)throw Error("Chart data not rendered");
 ensure(host,visual);
 return exportOne(host,format,null,feedback);
}
window.SLIVisualExport={version:VERSION,register,registerInsight,export:exportVisual,refresh:queue,inspect:(id)=>{const h=visuals.get(id);const visual=h&&activeVisual(h);return visual?{...metadata(h),rows:getData(h,visual).rows.length}:null}};
document.dispatchEvent(new Event("sli:exportready"));
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();