/* SKK Migas Annual Report 2025 — numeric exhibit extensions.
  Source: user supplied 202-page English Annual Report (PDF pages 35,45,46,91,145,176,177,183-184).
  Originals remain authoritative. No unlabelled line-chart point estimates.
*/
(function(){
"use strict";
const NS="http://www.w3.org/2000/svg";
const E=(tag,cls,t)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(t!==undefined)x.textContent=String(t);return x};
const S=(tag,p,a={})=>{const x=document.createElementNS(NS,tag);Object.entries(a).forEach(([k,v])=>x.setAttribute(k,String(v)));if(p)p.append(x);return x};
const F=(v,d=2)=>Number(v).toLocaleString("en-US",{maximumFractionDigits:d});
const L=(en,id)=>window.SLIi18n?.language==="id"?id:en;
const money=v=>"US$"+F(v,2);
function select(options){const s=E("select","sm25-select");for(const [id,title] of options){const o=E("option",null,title);o.value=id;s.append(o)}return s}
function note(box,p,text){
 box.append(E("p","sm25-note",L("PDF source page","Halaman PDF sumber")+" "+p+" · "+text));
}
function card(label,value,unit,detail){const a=E("article","sm25-kpi");
 a.append(E("small",null,label),E("strong",null,value),E("span",null,unit));
 if(detail)a.append(E("p",null,detail));return a}
function ratings(root,data){
 root.append(E("h4",null,L("Indonesia investor attractiveness · reported 2025 rating","Daya tarik investasi hulu migas Indonesia · penilaian 2025")));
 const r=data.categories.find(x=>x.id==="rating_dimensions"),grid=E("div","sm25-extend-stats");
 for(const item of r.records)grid.append(card(item.name,F(item.value,2),"rating points","S&P Global rating, as reproduced by SKK Migas"));
 root.append(grid);note(root,35,r.note);
}
function monthly(root,data){
 root.append(E("h4",null,L("TKDN · 12 months 2025, PSN vs non-PSN","TKDN · 12 bulan 2025, PSN vs non-PSN")));
 const a=data.categories.find(x=>x.id==="tkdn_psn_monthly"),b=data.categories.find(x=>x.id==="tkdn_nonpsn_monthly");
 const controls=E("div","sm25-toolbar"),which=select([["both","PSN + non-PSN"],["psn","PSN"],["non","non-PSN"]]);controls.append(which);root.append(controls);
 const chart=E("div","sm25-chart"),table=E("div","sm25-table-scroll");root.append(chart,table);
 function redraw(){
  const selected=which.value==="both"?[a,b]:[which.value==="psn"?a:b];
  const draw=S("svg",null,{viewBox:"0 0 920 310",role:"img","aria-label":"SKK Migas monthly 2025 TKDN PSN and non-PSN source-labelled percent"});
  const x0=63,x1=900,y0=250,y1=20,months=a.records.map(x=>x.name);
  for(let k=0;k<=4;k++){const y=y0-(y0-y1)*k/4;S("line",draw,{x1:x0,y1:y,x2:x1,y2:y,stroke:"#39546a"});
   const txt=S("text",draw,{x:x0-8,y:y+3,"text-anchor":"end",fill:"#bed0db","font-size":10});txt.textContent=(k*25)+"%"}
  selected.forEach((s,j)=>{
   const line=s.id==="tkdn_psn_monthly"?"#e1b87e":"#73bbcc";
   const points=s.records.map((x,i)=>[x0+(x1-x0)*i/11,y0-(y0-y1)*x.value/100]);
   S("polyline",draw,{points:points.map(x=>x.join(",")).join(" "),stroke:line,"stroke-width":3.5,fill:"none"});
   points.forEach(([x,y],i)=>{const c=S("circle",draw,{cx:x,cy:y,r:4,fill:line});S("title",c).textContent=s.title+" "+months[i]+" "+F(s.records[i].value)+"%";});
  });
  months.forEach((m,i)=>{const t=S("text",draw,{x:x0+(x1-x0)*i/11,y:273,"text-anchor":"middle","font-size":11,fill:"#c4d4df"});t.textContent=m});
  const lbl=S("text",draw,{x:74,y:299,fill:"#e3cfaa","font-size":11});lbl.textContent="PSN — target 57% in printed chart · Non-PSN — target 18% · 2025 cumulative PSN 37.94%, non-PSN 59.12%";
  chart.replaceChildren(draw);
  table.replaceChildren();const t=E("table","sm25-table"),h=E("thead"),tr=E("tr");["Month",...selected.map(x=>x.title+" (%)")].forEach(v=>tr.append(E("th",null,v)));h.append(tr);t.append(h);
  const body=E("tbody");months.forEach((m,i)=>{const r=E("tr");r.append(E("th",null,m));selected.forEach(s=>r.append(E("td",null,F(s.records[i].value))));body.append(r)});t.append(body);table.append(t);
 }
 which.addEventListener("change",redraw);redraw();
 root.append(E("p","sm25-note",L("Monthly labeled chart points are cumulative percentages and must not be averaged into the reported year-end cost-weighted TKDN. PSN and non-PSN are distinct project populations.","Nilai bulanan di grafik merupakan persentase kumulatif dan tidak boleh dirata-ratakan menjadi TKDN akhir tahun berbobot biaya. PSN dan non-PSN adalah kelompok proyek berbeda.")));
 note(root,177,a.note+" "+b.note);
}
function bridges(root,data){
 root.append(E("h4",null,L("2025 lifting bridges · separate signed source contributions","Selisih target-lifting 2025 · komponen bertanda dari sumber")));
 const control=select(data.bridges.map(x=>[x.id,x.title])),chart=E("div","sm25-extend-bars"),caution=E("p","sm25-pod-caveat");root.append(control,chart,caution);
 function draw(){
  const d=data.bridges.find(x=>x.id===control.value);
  chart.replaceChildren();
  const max=Math.max(...d.points.map(x=>Math.abs(x.value)));
  d.points.forEach(x=>{
   const row=E("div","sm25-bridge-row"),label=E("span",null,x.name),n=E("strong",null,(x.value>0&&x.role==="change"?"+":"")+F(x.value,2)+" "+d.unit);
   const track=E("div","sm25-bridge-track"),fill=E("div","sm25-bridge-fill");
   fill.style.width=Math.max(.5,100*Math.abs(x.value)/max)+"%";
   fill.className+=" "+(x.role==="change"?(x.value<0?"negative":"positive"):"checkpoint");
   track.append(fill);row.append(label,n,track);chart.append(row);
  });
  caution.textContent="PDF "+d.source_pdf_page+" · "+d.warning;
 }
 control.addEventListener("change",draw);draw();
}
function procurement(root,data){
 const p=data.procurement,c=data.commitment,s=data.scm;
 root.append(E("h4",null,L("Upstream procurement, exploration commitments and vendor oversight","Pengadaan hulu migas, komitmen eksplorasi dan pengawasan vendor")));
 const cards=E("div","sm25-extend-stats");
 const fields=[
 ["2025 estimated tender value",money(p.auction_estimated_usd/1e9),"USD billion","Not an audited realized investment"],
 ["Savings on large tenders",money(p.large_tender_savings_usd/1e6),"USD million","> US$5m tender subset only"],
 ["Tender plan approval",F(p.approval_plan_workdays),"working days","Target 15 days"],
 ["Tender result approval",F(p.approval_results_workdays),"working days","Target 15 days"],
 ["Extended exploitation CAs",F(c.extended_contract_areas),"work areas","8 not yet effective"],
 ["Exploration implementation",F(c.cumulative_implementation_percent,0)+"%","activities","43 extension areas"],
 ["Cumulative budget completion",F(c.cumulative_budget_percent_of_plan,0)+"%","budget","US$1.1bn realized"],
 ["2025 exploration spending",money(c.reported_2025_activities_estimated_investment_usd_million),"USD million","Estimated, not audited CAPEX"],
 ["PSC supply chain audits",F(s.psc_contractors_evaluated,0),"PSC contractors","2024 performance evaluated 2025"]
 ];
 for(const [title,num,unit,detail] of fields)cards.append(card(title,num,unit,detail));root.append(cards);
 root.append(E("p","sm25-note",p.description),E("p","sm25-note",c.warning));
 const leaders=E("div","sm25-spatial");for(const x of s.award_leaders){const b=E("div","sm25-spatial-item");b.append(E("small",null,x.class+" · WP&B "+x.wpb_usd_range),E("strong",null,x.company));leaders.append(b)}
 root.append(E("h4",null,"SCM awards by PSC work-program class"),leaders);
 const vendors=E("div","sm25-spatial");
 for(const v of s.vendor_assessed_rows){const c=E("div","sm25-spatial-item");c.append(E("small",null,"SME capacity assessment · "+v.commodity),E("strong",null,v.company));vendors.append(c)}
 root.append(E("h4",null,L("Five vendors assessed in 2025","Lima vendor dinilai pada 2025")),vendors);
 const contractors=E("div","sm25-spatial");
 for(const v of s.compliance_inspected){const c=E("div","sm25-spatial-item");c.append(E("small",null,"PSC inspection · "+v.contract_area),E("strong",null,v.operator));contractors.append(c)}
 root.append(E("h4",null,L("Five PSC compliance inspections · 2024 performance","Lima pemeriksaan kepatuhan KKKS · kinerja 2024")),contractors);
 root.append(E("p","sm25-note",L("Source tables 6.4 and 6.5 identify assessed companies and inspected contractors, not vendor quality ratings, regulatory breaches or procurement contracts.","Tabel sumber 6.4 dan 6.5 mencantumkan perusahaan yang dinilai dan KKKS yang diperiksa, bukan skor kualitas, pelanggaran, atau kontrak pengadaan.")));

 note(root,176,"Procurement figures and approval speed · see also PDF pp. 45–46, 183–184 for exploration commitments and supplier KPI assessment.");
}
function risks(root,data){
 root.append(E("h4",null,L("12 upstream institutional risks · 2025 source classification","12 risiko hulu migas · klasifikasi sumber 2025")));
 const filter=select([["all",L("All","Semua")],["HIGH","High"],["MODERATE TO HIGH","Moderate–high"],["MODERATE","Moderate"]]),search=E("input","sm25-query"),grid=E("div","sm25-risk-grid"),meta=E("p","sm25-note");
 search.type="search";search.placeholder=L("Search risks, CCS, legal, exploration, climate…","Cari risiko, CCS, regulasi, eksplorasi, iklim…");
 const row=E("div","sm25-toolbar");row.append(filter,search);root.append(row,meta,grid);
 function draw(){
  const q=search.value.toLowerCase().trim();const rs=data.risk_register.filter(x=>(filter.value==="all"||x.risk_level===filter.value)&&[x.description,x.risk_aspect,x.risk_type,x.risk_source].join(" ").toLowerCase().includes(q));
  meta.textContent=rs.length+" / 12 "+L("original Table 6.1 risk assessments; ratings are SKK Migas's, not SLI predictions.","penilaian risiko Tabel 6.1; tingkat risiko dari SKK Migas, bukan prediksi SLI.");
  grid.replaceChildren();
  for(const r of rs){const tile=E("article","sm25-risk");tile.append(E("small",null,"#"+r.no+" · "+r.risk_level+" · "+r.risk_type+" / "+r.risk_source),E("strong",null,r.description),E("span",null,r.risk_aspect));grid.append(tile)}
 }
 search.addEventListener("input",draw);filter.addEventListener("change",draw);draw();
 note(root,145,"Structured transcription and concise English paraphrases of all twelve original classified risk entries. Future risk outcomes are not given by the report.");
}
function mount(root,data){
 root.replaceChildren();
 if(!data||data.id!=="skkmigas-2025-numeric-source-extension")return;
 const nav=E("div","sm25-toolbar"),choice=select([
 ["rating",L("Investor ratings","Peringkat investasi")],
 ["monthly",L("Monthly TKDN","TKDN bulanan")],
 ["bridge",L("Lifting gap","Selisih lifting")],
 ["procurement",L("Procurement & PSC","Pengadaan & KKKS")],
 ["risk",L("Risk register","Daftar risiko")]
 ]);
 nav.append(choice);root.append(E("p","sm25-note",L("Additional verified investor-focused exhibits: original 2025 source labels, not generic or synthetic forecasts.","Exhibit investor tambahan dari angka berlabel pada laporan 2025, bukan proyeksi buatan.")),nav);
 const body=E("div","sm25-extra-view");root.append(body);
 function draw(){body.replaceChildren();if(choice.value==="monthly")monthly(body,data);
 else if(choice.value==="rating")ratings(body,data);
 else if(choice.value==="bridge")bridges(body,data);
 else if(choice.value==="procurement")procurement(body,data);
 else risks(body,data);
 }
 choice.addEventListener("change",draw);draw();
 root.append(E("p","sm25-note","SKK Migas Annual Report 2025 (English original, 202 pages). Publisher: https://www.skkmigas.go.id/publication?tab=laporan+tahunan · Each panel includes exact PDF page numbers. The uploaded PDF is the canonical numerical evidence."));
}
window.initSLISKKExtra2025=mount;
})();
