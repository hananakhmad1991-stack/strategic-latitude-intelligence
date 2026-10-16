/* SKK Migas 2025 · structured atlas of remaining 202-page report exhibits.
 * Source: user-supplied official English PDF SHA256 48994ab291337f3089945e89f5ddbc6716b009e17defcb55b36628b83b21c301
 * All panels disclose time, units, status and source PDF page; no inferred GIS.
 */
(function(){"use strict";
const E=(t,c,v)=>{const x=document.createElement(t);if(c)x.className=c;if(v!==undefined)x.textContent=String(v);return x};
const T=(en,id)=>window.SLIi18n?.language==="id"?id:en;
const n=(v,p=2)=>v===null||v===undefined?"—":Number(v).toLocaleString("en-US",{maximumFractionDigits:p});
const div=(title,content,cl="sm25-evid-card")=>{const e=E("article",cl);e.append(E("h5",null,title),E("p",null,content));return e};
const flag=(container,page,msg)=>container.append(E("p","sm25-note","PDF p. "+page+" · "+msg));
const grid=(root)=>{const g=E("div","sm25-evid-grid");root.append(g);return g};
function bar(root,records,unit,{max,decimals=1}={}){
 root.replaceChildren();const cap=max||Math.max(1,...records.map(x=>x.value||0));
 for(const r of records){const row=E("div","sm25-bar-item"),title=E("div","sm25-bar-label"),track=E("div","sm25-bar-track"),fill=E("div","sm25-bar-filled");
 title.append(E("span",null,r.name),E("strong",null,n(r.value,decimals)+" "+unit));
 fill.style.width=Math.max(.1,100*(r.value||0)/cap)+"%";track.append(fill);row.append(title,track);root.append(row)}
}
function one(root,title,label,value,unit,detail){root.append(div(title,n(value)+" "+unit+" · "+detail,"sm25-evid-stat"));}
function projects(root,d){
 const block=d.strategic_projects;
 root.append(E("h4",null,T("Strategic upstream projects · stated 2025 pipeline","Proyek strategis hulu migas · pipeline pada laporan 2025")));
 const metrics=grid(root);
 one(metrics,"Investment", "Aggregate",block.aggregate.estimated_investment_usd_billion,"US$ billion","source investment commitments, not realized 2025 capex");
 one(metrics,"Peak gas","Aggregate",block.aggregate.reported_peak_gas_mmscfd,"MMSCFD","announced nameplate peaks, not 2025 output");
 one(metrics,"Liquids","Aggregate",block.aggregate.reported_peak_liquids_bopd,"BOPD","aggregated from source project estimates, includes condensate categories");
 const chart=E("div","sm25-chart");root.append(chart);
 bar(chart,block.projects.map(x=>({name:x.project,value:x.investment_usd_billion})),"US$ billion",{max:21});
 const dossier=grid(root);for(const x of block.projects){const c=div(x.project,x.operator+" · announced "+x.announced_first_delivery+" · "+n(x.gas_reserves_tscf,2)+" TSCF gas resources · "+n(x.peak_gas_mmscfd,0)+" MMSCFD peak gas");c.append(E("small",null,"Investment US$"+n(x.investment_usd_billion)+"bn · PDF "+x.pdf_page+" · "+x.note));dossier.append(c)}
 flag(root,61,block.caveat);
 root.append(E("h4",null,T("2025 approvals and project milestones","Persetujuan dan milestone proyek 2025")));
 const time=E("div","sm25-evid-timeline");root.append(time);
 for(const m of d.timeline_2025.milestones){const c=div(m.date+" · "+m.project,m.milestone);time.append(c)}
 flag(root,62,"Historical 2025 decisions: not evidence of 2026 construction progress or investment disbursement.");
}
function exploration(root,d){
 const x=d.exploration;
 root.append(E("h4",null,T("Survey fulfilment and exploration outcomes · 2025","Realisasi survei dan hasil eksplorasi 2025")));
 const g=grid(root);
 for(const [name,val,unit] of [["2D seismic",x.seismic.two_dimensional_km,"km"],["3D seismic",x.seismic.three_dimensional_km2,"km²"]]){
  const pct=100*val.actual/val.plan;g.append(div(name,n(val.actual,2)+" / "+n(val.plan,2)+" "+unit+" · "+n(pct,1)+"% of original plan"))
 }
 g.append(div("Exploration wells",x.drilling.spudded_wells+" drilled / "+x.drilling.planned_wells+" planned · "+x.drilling.completed_wells+" completed; "+x.drilling.successful_completed_wells+" discoveries"));
 g.append(div("P50 contingent resources",n(x.drilling.p50_preliminary_mmboe,0)+" MMBOE preliminary post-drill; not proved reserves"));
 root.append(E("h4",null,T("Firm commitment rankings · original assessment star matrix","Peringkat komitmen kerja pasti · matriks bintang sumber")));
 const wrap=E("div","sm25-table-scroll"),table=E("table","sm25-table"),thead=E("thead"),hr=E("tr");
 ["Rating","Not yet active","<3 years",">3 years","Row count"].forEach(k=>hr.append(E("th",null,k)));
 thead.append(hr);table.append(thead);const body=E("tbody");
 for(const row of x.firm_commitment_matrix.rows){const r=E("tr");[row.stars+" ★",row.not_yet_active,row.under_3_years,row.over_3_years,row.not_yet_active+row.under_3_years+row.over_3_years].forEach(v=>r.append(E("td",null,v)));body.append(r)}
 table.append(body);wrap.append(table);root.append(wrap);
 flag(root,46,x.firm_commitment_matrix.caveat);
 flag(root,41,x.seismic.disclaimer);
}
function strategy(root,d){
 const p=d.strategic_plan;
 root.append(E("h4",null,T("Upstream Strategic Plan 2025–2035","Rencana strategis hulu migas 2025–2035")));
 const top=grid(root);
 top.append(div("Baseline 2035 goal",n(p.target_2035_boepd_million,1)+" million BOEPD"));
 top.append(div("Conditional goal",n(p.conditional_target_2035_boepd_million,1)+" million BOEPD; macroeconomic/regulatory conditions apply"));
 top.append(div("National transition scenario",d.transition_context.estimated_national_ghg_peak_2030_million_tonnes_co2e+" million tCO₂e projected peak in 2030; "+d.transition_context.projected_2050_million_tonnes_co2e+" million tCO₂e in 2050"));
 flag(root,32,d.transition_context.caveat);
 const choice=E("select","sm25-select");[["all","All 12 charters"],["pillar","8 pillars"],["enabler","4 enablers"]].forEach(([v,t])=>{const o=E("option",null,t);o.value=v;choice.append(o)});
 const list=grid(root);root.append(choice);
 function draw(){list.replaceChildren();for(const c of p.charters.filter(x=>choice.value==="all"||x.type===choice.value)){const tile=div(String(c.number).padStart(2,"0")+" · "+c.name,c.type.toUpperCase());list.append(tile)}}
 choice.addEventListener("change",draw);draw();
 root.append(E("h4",null,T("Selected original charter achievements · source-labelled","Capaian program prioritas · angka pada laporan")));
 const cards=grid(root);
 for(const m of p.source_milestones){let detail=m.metric+" · "+m.note;if(m.outlook_bb_oe!==undefined)detail+=" · outlook "+n(m.outlook_bb_oe)+" vs target "+n(m.target_bb_oe)+" BBOE";
 if(m.outlook_percent!==undefined)detail+=" · outlook "+n(m.outlook_percent)+"% vs target "+m.target_percent+"%";
 if(m.patterns)detail+=" · "+m.patterns+" patterns";
 if(m.kton_co2)detail+=" · "+n(m.kton_co2)+" kton CO₂";
 cards.append(div("Charter "+m.charter,detail))}
 flag(root,126,"Charter achievements mix forecasts and implementation indicators. These are not 12 comparable percent-complete scores.");
}
function digital(root,d){
 root.append(E("h4",null,T("SPEKTRUM IOG 4.0 · March 2026 source snapshot","SPEKTRUM IOG 4.0 · snapshot sumber Maret 2026")));
 const sp=d.spektrum_iog;
 const top=grid(root);
 top.append(div("Target",sp.target_contract_areas+" contract areas · target "+sp.target_by));
 top.append(div("Mapping",sp.data_quality.ppdm_39_mapping_percent_tier2_tier3+"% PPDM 3.9 mapping across T2/T3 seismic & well domains"));
 top.append(div("GIS skills",sp.data_quality.psc_with_gis_specialist_constraints+" PSC contractors with specialist limitations"));
 top.append(div("Legacy data",sp.data_quality.psc_with_legacy_shapefile_excel_data+" PSC contractors with shapefile/Excel conversion needs"));
 const chart=E("div","sm25-chart");root.append(chart);
 bar(chart,sp.status.map(x=>({name:x.name,value:x.count})),"PSC contractors",{max:sp.target_contract_areas,decimals:0});
 root.append(E("p","sm25-pod-caveat",sp.source_figure_discrepancy));
 flag(root,148,"Source figure reports 7 initial registrations; p.150 narrative reports 18. The figure cannot be considered reconciled.");
 root.append(E("h4",null,T("Three-phase national geospatial standards roadmap","Roadmap tiga fase standar geospasial nasional")));
 const g=grid(root);for(const x of sp.roadmap)g.append(div(x.when+" · "+x.label,x.version+" · "+x.detail));
 flag(root,150,"Phase labels and deadlines are original commitments, not verified live completion at Oct 2026.");
 root.append(E("h4",null,T("Six source-documented digital applications","Enam aplikasi digital yang disebutkan laporan")));
 const apps=grid(root);for(const x of d.digital_applications.items)apps.append(div(x.number+". "+x.name,x.purpose+" · Source status: "+x.source_status));
 flag(root,146,"Digital application deployment status is quoted as of source reporting only; e-POD was planned for 2026.");
 root.append(E("h4",null,"Five SIGI data domains"));const domains=grid(root);
 sp.architecture.domains.forEach(x=>domains.append(div(x.split(" ")[0],x.substring(x.indexOf(" ")+1))));
 flag(root,149,sp.architecture.notes);
}
function cyber(root,d){
 const c=d.cybersecurity;
 root.append(E("h4",null,T("10 upstream oil & gas cyber threat categories","10 kategori risiko siber hulu migas")));
 const cards=grid(root);for(const r of c.risks)cards.append(div(String(r.number).padStart(2,"0")+" · "+r.risk,"Unranked 2025 report risk taxonomy"));
 flag(root,157,"Item order does not indicate ranked probability, assessed severity, measured incidents or published loss amounts.");
 root.append(E("p","sm25-pod-caveat",c.standard_discrepancy));
 root.append(E("h4",null,T("Geospatial and cyber governance source context","Konteks tata kelola geospasial dan siber")));
 const g=grid(root);g.append(div("CSIRT",c.csirt_psc_target+" PSC contractors: described sector setup effort; not confirmed completed units"));
 g.append(div("Technical protocol",d.spektrum_iog.data_quality.spark_ats_cases+" SPARK ATS tests, 5 SIGI domains; not a cyber compliance score"));
 flag(root,154,"ISO document versions and CSIRT organizational illustration are not numerical certification results.");
}
function market(root,d){
 const e=d.ecommerce;
 root.append(E("h4",null,T("IOG e-Commerce adoption · SKK Migas source 2025","Adopsi IOG e-Commerce · sumber SKK Migas 2025")));
 const g=grid(root);
 g.append(div("PSC contractors",n(e.registered_psc_contractors,0)+" registered by December 2025"));
 g.append(div("Goods & services suppliers",n(e.registered_vendors,0)+" registered by December 2025"));
 g.append(div("Transaction value",n(e.total_transactions_idr,0)+" IDR in calendar year 2025"));
 g.append(div("Launch","August 2024 · sector procurement marketplace"));
 flag(root,182,e.caveat);
}
window.initSLISKKRemainingAtlas=function(root,d){
 if(!root)return;root.replaceChildren();if(d?.id!=="sli-skkmigas-2025-remaining-evidence")return;
 root.append(E("h4",null,T("Remaining 2025 Source Exhibits · Investor Evidence Atlas","Sisa Exhibit 2025 · Atlas Bukti Investor")));
 const controls=E("div","sm25-toolbar"),sel=E("select","sm25-select"),options=[
 ["projects",T("Five strategic projects + six milestones","Lima proyek strategis + enam milestone")],
 ["exploration",T("Seismic + 5-star contracts","Seismik + KKKS lima bintang")],
 ["strategy",T("12 charters + targets","12 program + target")],
 ["digital",T("SPEKTRUM + digital applications","SPEKTRUM + aplikasi digital")],
 ["cyber",T("10 cyber risks","10 risiko siber")],
 ["market",T("IOG e-Commerce and procurement","IOG e-Commerce dan pengadaan")]
 ];
 for(const [id,label] of options){const o=E("option",null,label);o.value=id;sel.append(o)}
 controls.append(sel);const view=E("div","sm25-evidence-panel");root.append(E("p","sm25-note",T("Reconstructed from exact printed labels and report text. Dates are source forecasts or historical events, NOT independently updated current progress.","Berdasarkan label dan narasi laporan asli. Tanggal mencerminkan rencana atau peristiwa historis pada sumber, BUKAN perkembangan proyek terkini.")),controls,view);
 function draw(){view.replaceChildren();if(sel.value==="projects")projects(view,d);else if(sel.value==="exploration")exploration(view,d);else if(sel.value==="strategy")strategy(view,d);else if(sel.value==="digital")digital(view,d);else if(sel.value==="cyber")cyber(view,d);else market(view,d)}
 sel.addEventListener("change",draw);draw();
 root.append(E("p","sm25-method","Canonical source: SKK Migas English Annual Report 2025, 202 PDF pages, SHA256 48994ab291337f3089945e89f5ddbc6716b009e17defcb55b36628b83b21c301. Figures are cited by original PDF page. Printed maps/photos are evidence, not inferred coordinates. When report tables disagree, both are retained."));
};
})();