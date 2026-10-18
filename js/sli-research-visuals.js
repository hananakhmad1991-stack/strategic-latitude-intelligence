/* SLI research report visual renderer.
   All model prose is treated as text; chart numbers come from server-supplied
   cited observations, never from Markdown or a model chart instruction.
*/
(()=>{"use strict";
const create=(tag,cls,txt)=>{
 const el=document.createElement(tag);if(cls)el.className=cls;
 if(txt!==undefined)el.textContent=String(txt);return el;
};
function safeUrl(input){try{const u=new URL(input);return u.protocol==="https:"?u.href:null}catch{return null}}
function inline(input,container,sources){
 const tokens=String(input||"").split(/(\[\d+\]|\*\*[^*\n]+\*\*|__[^_\n]+__|\x60[^\x60\n]+\x60|\*[^*\n]+\*|_[^_\n]+_)/g);
 for(const piece of tokens){
  if(!piece)continue;
  const citation=/^\[(\d+)\]$/.exec(piece),source=citation&&sources[Number(citation[1])-1];
  if(source){
   const a=create("a",null,piece);a.href=safeUrl(source.source_url)||"#raSourcesPanel";
   a.target="_blank";a.rel="noopener noreferrer";a.title=source.title||"Source";container.append(a);
  }else if((piece.startsWith("**")&&piece.endsWith("**"))||(piece.startsWith("__")&&piece.endsWith("__"))){
   const strong=create("strong");inline(piece.slice(2,-2),strong,sources);container.append(strong);
  }else if((piece.startsWith("*")&&piece.endsWith("*"))||(piece.startsWith("_")&&piece.endsWith("_"))){
   const em=create("em");inline(piece.slice(1,-1),em,sources);container.append(em);
  }else if(piece.charCodeAt(0)===96&&piece.charCodeAt(piece.length-1)===96){
   container.append(create("code",null,piece.slice(1,-1)));
  }else container.append(document.createTextNode(piece));
 }
}
const columns=line=>line.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(s=>s.trim()).slice(0,8);
function renderMarkdown(answer,where,sources=[]){
 where.replaceChildren();
 let list=null,listType="";
 const lines=String(answer||"").slice(0,24000).split("\n");
 for(let i=0;i<lines.length;i++){
  const line=lines[i].trim();
  if(!line){list=null;listType="";continue}
  const divider=lines[i+1]&&/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i+1]);
  if(line.includes("|")&&divider){
   const headings=columns(line),wrap=create("div","sli-ra-table-wrap"),table=create("table","sli-ra-report-table"),thead=create("thead"),head=create("tr");
   for(const h of headings){const th=create("th");inline(h,th,sources);head.append(th)}
   thead.append(head);table.append(thead);const body=create("tbody");i++;
   while(i+1<lines.length&&lines[i+1].includes("|")){
    const values=columns(lines[++i]),tr=create("tr");
    headings.forEach((_,j)=>{const td=create("td");inline(values[j]||"",td,sources);tr.append(td)});
    body.append(tr);
   }
   table.append(body);wrap.append(table);where.append(wrap);list=null;listType="";continue;
  }
  const heading=/^(#{1,4})\s+(.+)$/.exec(line);
  if(heading){const h=create(heading[1].length<=2?"h3":"h4");inline(heading[2],h,sources);where.append(h);list=null;listType="";continue}
  const numbered=/^\d+[\.)]\s+(.+)$/.exec(line),bullet=/^[-*]\s+(.+)$/.exec(line);
  if(numbered||bullet){
   const kind=numbered?"ol":"ul";
   if(!list||listType!==kind){list=create(kind);where.append(list);listType=kind}
   const li=create("li");inline((numbered||bullet)[1],li,sources);list.append(li);continue;
  }
  list=null;listType="";const p=create("p");inline(line,p,sources);where.append(p);
 }
}
function renderCharts(charts,where,sources=[],lang="id"){
 if(!Array.isArray(charts)||!charts.length)return;
 const section=create("section","sli-ra-visuals");
 section.append(create("h3",null,lang==="id"?"Visual Insights · Data terverifikasi":"Visual Insights · Source-linked data"));
 for(const chart of charts.slice(0,4)){
  if(chart?.type!=="bar"||!Array.isArray(chart.points)||chart.points.length<2||chart.points.length>12)continue;
  if(!chart.points.every(p=>typeof p.label==="string"&&p.label.length<100&&typeof p.value==="number"&&Number.isFinite(p.value)&&p.value>=0&&Number.isInteger(p.source)&&p.source>0&&p.source<=sources.length))continue;
  const max=Math.max(...chart.points.map(p=>p.value));if(max<=0)continue;
  const fig=create("figure","sli-ra-chart"),caption=create("figcaption","sli-ra-chart-heading");
  caption.append(create("strong",null,String(chart.title||"").slice(0,130)),create("span",null,[chart.period,chart.unit].filter(Boolean).join(" · ")));
  fig.append(caption);
  for(const point of chart.points){
   const row=create("div","sli-ra-chart-row"),label=create("div","sli-ra-chart-label",point.label);
   const track=create("div","sli-ra-chart-track"),bar=create("div","sli-ra-chart-bar");
   bar.style.width=Math.max(0,Math.min(100,point.value/max*100)).toFixed(2)+"%";track.append(bar);
   const value=create("div","sli-ra-chart-value",new Intl.NumberFormat(lang==="id"?"id-ID":"en-US",{maximumFractionDigits:3}).format(point.value));
   const source=create("span","sli-ra-chart-source");inline("["+point.source+"]",source,sources);
   value.append(" ",source);row.append(label,track,value);fig.append(row);
  }
  fig.append(create("p","sli-ra-chart-note",String(chart.note||"").slice(0,450)));
  const provenance=create("p","sli-ra-chart-note");
  provenance.append(document.createTextNode(lang==="id"?"Bukti grafik: ":"Chart evidence: "));
  const refs=Array.isArray(chart.source_refs)?chart.source_refs.filter(n=>Number.isInteger(n)&&n>0&&n<=sources.length).slice(0,12):[];
  inline([...new Set(refs)].map(n=>"["+n+"]").join(", "),provenance,sources);
  fig.append(provenance);
  section.append(fig);
 }
 if(section.children.length>1)where.prepend(section);
}
window.SLIResearchVisuals=Object.freeze({renderMarkdown,renderCharts});
})();
