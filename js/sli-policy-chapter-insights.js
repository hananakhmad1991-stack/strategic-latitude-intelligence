/* Source-led five-chapter Policy & Risk analysis, SLI, 2026. */
(()=>{"use strict";
const datasets=["data/sli-policy-regulatory-graph-2026.json","data/sli-public-policy-evaluation-2026.json","data/sli-sector-regulatory-ria-deepdives.json","data/regulatory-monitor.json"];
const tracked=["uu2minerba","pp40","pp28","uu27pdp","pres112","pres110carbon","kepmen188","pp5old","pp79old"];
const sectors=["minerba","oilgas","power_dc","electricity_grid","renewables","carbon"];
const E=(tag,text,cls)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
function addLink(host,title,href){
 if(typeof href!=="string")return;
 if(!/^https:\/\//.test(href)&&!/^\.\/[a-z0-9/_-]+\.(?:html|json)$/i.test(href))return;
 const a=E("a",title);a.href=href;
 if(href.startsWith("https://")){a.rel="noopener noreferrer";a.target="_blank"}
 host.append(a);
}
function card(heading,description){
 const c=E("article",undefined,"sli-policy-insight-card");
 c.append(E("h4",heading),E("p",description||""));
 return c;
}
function area(num,title,about){
 const section=document.getElementById("sli-chapter-"+num);
 if(!section)return null;
 const previous=section.querySelector(".sli-policy-insight");if(previous)previous.remove();
 const wrapper=E("div",undefined,"sli-policy-insight");
 wrapper.append(E("p","EVIDENCE-BASED POLICY RESEARCH · CHAPTER "+num,"sli-policy-kicker"),E("h4",title),E("p",about,"sli-policy-caveat"));
 const before=section.querySelector(".sli-research-grid");
 if(before)section.insertBefore(wrapper,before);else section.append(wrapper);
 return wrapper;
}
function grid(host){const g=E("div",undefined,"sli-policy-insight-grid");host.append(g);return g}
function status(value){
 return ({enacted:"Enacted in register",amending_instrument:"Amending instrument",repealed:"Superseded / repealed",check_current:"Current text needs checking",issued_plan_not_commissioned:"Approved plan · not commissioned"})[value]||String(value||"Unclassified").replaceAll("_"," ");
}
function show01(legal,monitor){
 const root=area("01","Regulation status and implementation","A dated, selective legal watchlist. Issued laws, repeals and policy plans are not evidence of individual permit issuance or project compliance.");
 if(!root)return;
 const list=grid(root);
 const nodes=tracked.map(id=>legal.nodes.find(n=>n.id===id)).filter(Boolean);
 for(const n of nodes){
  const c=card(n.ref,n.label);
  c.append(E("small",status(n.status),"sli-policy-status"));
  if(n.note)c.append(E("p",n.note));
  addLink(c,"Official legal source ↗",n.source);list.append(c);
 }
 const counts=new Map();
 for(const n of nodes)counts.set(status(n.status),(counts.get(status(n.status))||0)+1);
 const chart=E("div",undefined,"sli-policy-status-chart");
 chart.append(E("h5","Status of "+nodes.length+" selected watched instruments"));
 for(const [name,count] of counts){
  const row=E("div",undefined,"sli-policy-chart-row"),track=E("div",undefined,"sli-policy-chart-track"),bar=E("span",undefined,"sli-policy-chart-bar");
  bar.style.width=Math.round(count/Math.max(nodes.length,1)*100)+"%";
  track.append(bar);row.append(E("span",name),track,E("strong",count));chart.append(row);
 }
 root.append(chart,E("p","Only the selected watchlist is counted; not the Indonesian legal corpus. Policy changes must be checked against official consolidated texts before being treated as in force.","sli-policy-caveat"));
 const watched=Object.values(monitor.watched_law_records||{}),ready=watched.filter(d=>d.last_success_utc).length;
 const finding=card("Investor implication","PP 28/2025 replaced the former PP 5/2021 licensing baseline, and PP 40/2025 changed the national energy policy reference. Review the instrument governing each project's filing date and operating activity before assessing regulatory exposure.");
 finding.append(E("p","Monitoring snapshot "+(monitor.checked_at_utc||"unknown")+" · "+ready+"/"+watched.length+" watched documents had an available successful endpoint record. Unavailable portals do not imply unchanged law."));
 addLink(finding,"Open legal hierarchy ↗","./policy-regulatory-intelligence.html");root.append(finding);
}
function table(headers){
 const shell=E("div",undefined,"sli-policy-table-wrap"),tab=E("table"),head=E("thead"),tr=E("tr");
 for(const h of headers)tr.append(E("th",h));
 head.append(tr);tab.append(head);const body=E("tbody");tab.append(body);shell.append(tab);
 return {shell,body};
}
function show02(legal){
 const root=area("02","Risk transmission across industries","Actual law or project dependency → potential exposure → diligence requirement. Qualitative screening does not estimate probability of loss or expected return.");
 if(!root)return;
 const t=table(["Project / sector","Documented analytical exposure","Investor verification","Source"]);
 for(const id of sectors){
  const c=legal.cases.find(x=>x.id===id);if(!c)continue;
  const lead=(c.issues||[]).filter(x=>x.reason&&x.mitigation).sort((a,b)=>(b.exposure||0)-(a.exposure||0))[0];
  if(!lead)continue;
  const tr=E("tr");tr.append(E("td",c.name),E("td",lead.title+" — "+lead.reason),E("td",lead.mitigation));
  const source=E("td");const law=(c.basis||[]).map(k=>legal.nodes.find(n=>n.id===k)).find(n=>n?.source?.startsWith("https://"));
  if(law)addLink(source,law.ref+" ↗",law.source);tr.append(source);t.body.append(tr);
 }
 root.append(t.shell);
 root.append(card("Analysis","Power readiness, licenses, grid capacity, finance and market access often interact: one bottleneck can prevent announced investment from becoming functioning production. Sectoral legal and technical obligations must be checked independently; exposure ratings in the underlying dataset are scenario screens, not incident counts."));
 addLink(root,"Explore risk pathways and legal hierarchy ↗","./policy-regulatory-intelligence.html");
}
function show03(legal,evaluation){
 const root=area("03","Policy effectiveness: selected sector assessments","Nine document-based dossiers examine policy mechanisms, implementation stage and the evidence still required to establish outcomes.");
 if(!root)return;
 const cards=grid(root);
 for(const p of evaluation.profiles){
  const c=card(p.title,p.finding);c.append(E("small","Stage: "+p.stage,"sli-policy-status"));
  if(p.priority_actions?.[0])c.append(E("p","Priority action: "+p.priority_actions[0]));
  const law=(p.refs||[]).map(id=>legal.nodes.find(n=>n.id===id)).find(n=>n?.source?.startsWith("https://"));
  if(law)addLink(c,law.ref+" · official record ↗",law.source);
  cards.append(c);
 }
 root.append(E("p","These are SLI's preliminary desk-based analyses, NOT completed field evaluations, interviews, regression, causal impact studies or observed success scores.","sli-policy-caveat"));
 addLink(root,"Read complete Public Policy Evaluation ↗","./policy-impact-evaluation.html");
}
function show04(evaluation){
 const root=area("04","Target-to-outcome evidence matrix","Comparable official targets are shown separately from confirmed actuals. Missing observations remain unknown, not zero.");
 if(!root)return;
 const t=table(["Policy / programme","Measure","Planned target","Actual","Supporting dataset"]);
 const catalog=evaluation.methodology.source_catalog||[];
 let rows=0;
 for(const p of evaluation.profiles){
  for(const m of p.indicators||[]){
   if(!Number.isFinite(m.target)||!m.unit)continue;
   const source=catalog.find(s=>s.id===m.source_id),tr=E("tr");
   tr.append(E("td",p.title),E("td",m.name),E("td",new Intl.NumberFormat("en-US").format(m.target)+" "+m.unit+" ("+(m.year||p.period||"target date unknown")+")"),E("td",Number.isFinite(m.actual)?m.actual+" "+m.unit:"Not verified"));
   const cell=E("td");if(source)addLink(cell,source.label+" ↗",source.url);tr.append(cell);t.body.append(tr);rows++;
  }
 }
 if(rows)root.append(t.shell);
 else root.append(E("p","Comparable target and actual records are unavailable.","sli-policy-caveat"));
 root.append(card("Evaluation standard","A published target does not demonstrate achievement. Valid ex-post impact assessment requires matched geography, units, periods and an attributable causal design. For now, verify commissioning, administrative delivery, effectiveness evidence and beneficiaries."));
 addLink(root,"Policy indicators and evaluation methods ↗","./policy-impact-evaluation.html");
}
function show05(legal,evaluation,ria){
 const root=area("05","Policy alternatives, scenarios and strategic recommendations","RIA-lite comparisons describe possible policy choices; they are not official impact assessments, market forecasts or litigation predictions.");
 if(!root)return;
 const cards=grid(root);
 for(const id of ["electricity_grid","power_dc","minerba","oilgas","carbon","wto_trade"]){
  const item=ria.cases[id];if(!item)continue;
  const c=card(item.short,item.thesis),ol=E("ol",undefined,"sli-policy-options");
  for(const option of (item.policy_options||[]).slice(0,3))ol.append(E("li",(option[0]||"Option")+": "+(option[2]||option[1]||"")));
  c.append(ol);cards.append(c);
 }
 const conclusions=[
  ["Legal due diligence","Reconcile PP 28/2025, PP 40/2025 and the consolidated mineral laws with each project's current permits and applicable dates."],
  ["Project realization","Verify financing close, grid energization, construction, commissioning and operating output instead of announced commitments."],
  ["Regional infrastructure","Obtain local firm power headroom and utility readiness by project location before estimating investment multipliers."],
  ["Trade, ESG and supply chains","Join source-dated bilateral commodity data with production stages, permits, energy use and market-access exposure."],
  ["Policy impact evaluation","Collect matching baseline, target, annual actual, beneficiaries and counterfactual observations before claiming causal effects."]
 ];
 const block=E("section",undefined,"sli-policy-recommendations"),ol=E("ol");
 block.append(E("h4","Conclusions & strategic recommendations"));
 for(const [title,detail] of conclusions){const li=E("li");li.append(E("strong",title),E("p",detail));ol.append(li)}block.append(ol);root.append(block);
 root.append(E("p","Evidence: legal register "+(legal.updated_at||"unknown")+", policy evaluation "+(evaluation.as_of||"unknown")+", sector scenarios "+(ria.version||"unknown")+". These interpretations are not legal advice.","sli-policy-caveat"));
 addLink(root,"Open sector-by-sector RIA-lite ↗","./policy-sector-ria.html");
}
let pending;
async function initPolicyInsights(){
 const section=document.getElementById("sli-chapter-01");if(!section)return;
 const loading=E("p","Loading source-dated analysis…","sli-policy-loading");loading.id="sliPolicyLoading";section.append(loading);
 try{
  if(!pending)pending=Promise.all(datasets.map(async path=>{const r=await fetch(path,{cache:"no-store"});if(!r.ok)throw Error(path+" "+r.status);return r.json()}));
  const [legal,evaluation,ria,monitor]=await pending;
  if(!document.getElementById("sli-chapter-01"))return;
  if(!Array.isArray(legal.nodes)||!Array.isArray(legal.cases)||!Array.isArray(evaluation.profiles)||!ria.cases)throw Error("Policy schema invalid");
  show01(legal,monitor);show02(legal);show03(legal,evaluation);show04(evaluation);show05(legal,evaluation,ria);
  loading.remove();
 }catch(error){
  pending=null;loading.textContent="The enhanced policy evidence could not load. Existing source-linked chapter baselines remain available. Open the Policy & Regulatory and Evaluation dashboards for full records.";
  loading.className="sli-policy-loading-error";console.error("[SLI policy insights]",error);
 }
}
window.initSLIPolicyInsights=initPolicyInsights;
})();
