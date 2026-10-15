/* SLI sector research chapters: evidence-led editorial baselines, 2026-10-15 */
(function(){"use strict";
const chapters={
minerals:{name:"Critical Minerals",subtitle:"Indonesia's mineral endowment, industrial processing, global exposure and implementation risks.",sections:[["00","Stakeholder & Institution Mapping","Functional accountability map — regulators, investment facilitators, commercial operators and oversight actors are distinct.",[
["ESDM · Directorate General of Minerals and Coal","Policy formulation, mineral business oversight, technical and environmental supervision","Primary sector regulator; this is not a commercial mining or smelting operator.","https://esdm.go.id/id/profil/tugas-fungsi/direktorat-jenderal-mineral-dan-batubara"],
["Ministry of Industry (Kemenperin)","Industrial development and downstream manufacturing","Distinguish mining licensing from industrial processing policy and specific permits.","https://kemenperin.go.id/"],
["Ministry of Investment / BKPM","Investment facilitation and published realization statistics","Aggregate PMA/PMDN does not establish project-specific disbursement.","https://www.bkpm.go.id/"],
["Ministry of Environment / environmental authorities","Environmental permits and compliance oversight","Check the competent authority for each operating location; no automatic compliance inference.","https://www.menlh.go.id/"],
["MIND ID & state-owned subsidiaries","Commercial state ownership and operating portfolio","Shareholding and portfolio control are not the same as a government licensing mandate.","https://mind.id/"],
["Private & foreign operators / joint ventures","Mine, refinery and smelter project implementation","Disclose legal entity, ownership, industrial process, location, capacity basis and as-of date case by case.",null],
["Policy cross-reference → Policy & Risk","Mining law, downstream requirements, permits and environmental obligations","Canonical legal instruments and status live in Policy & Risk; no duplicate legal register here.","#policy"]]],
["01","National Mineral Baseline","Differentiate mine production (metal content), reserves, smelter capacity and finished exports. They are not equivalent measures.",[
["Nickel mine production","2.60 million tonnes Ni content","USGS estimate for 2025; not ore gross tonnage.","https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-nickel.pdf"],
["Nickel reserves","62 million tonnes Ni content","USGS 2026 estimate; geological reserves, not annual output.","https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-nickel.pdf"],
["Global position","Largest nickel mining producer","USGS country outlook: approximately 62% share in 2024; do not label this a 2026 share.","https://www.usgs.gov/centers/national-minerals-information-center/indonesia"]]],
["02","Mineral Value Chains","Track products at each transformation stage; avoid combining mining, primary processing and chemical refining.",[
["Nickel","Ore → NPI / ferronickel → matte / MHP → nickel chemicals / battery materials","NPI, ferronickel and battery-grade products follow different technical and commercial pathways.","https://www.usgs.gov/centers/national-minerals-information-center/indonesia"],
["Copper","Concentrate → smelting → cathodes / downstream fabrication","Smelter construction is not evidence of stable commercial throughput.","https://www.usgs.gov/centers/national-minerals-information-center/indonesia"],
["Bauxite & aluminium","Bauxite → alumina refinery → aluminium smelter → fabricators","Separate alumina refining from aluminium metal smelting.","https://www.usgs.gov/centers/national-minerals-information-center/indonesia"],
["Tin & cobalt","Mined material → refined metal / cobalt chemicals","Report tin metal content and cobalt by-product separately; definitions differ.","https://www.usgs.gov/centers/national-minerals-information-center/indonesia"]]],
["03","Operators, Projects & Geographic Footprint","Selected source-led reference cases, not an exhaustive ownership registry.",[
["PT Freeport Indonesia · Gresik","Copper smelter at Manyar, East Java","USGS documents 2024 completion and subsequent startup disruption; verify 2026 operating status separately.","https://www.usgs.gov/centers/national-minerals-information-center/indonesia"],
["PT Borneo Alumina Indonesia · West Kalimantan","Alumina refinery","USGS reports 1 Mt/year capacity and December 2024 operations; avoid classifying this as aluminium metal production.","https://www.usgs.gov/centers/national-minerals-information-center/indonesia"],
["MIND ID","State mining holding / ownership","Portfolio participation is distinct from licensing authority and operatorship.","https://www.usgs.gov/centers/national-minerals-information-center/indonesia"]]],
["04","Trade, Competitiveness & ESG","Use the standalone Trade Flows Sankey for country and HS-level values; this chapter interprets competitiveness and risk.",[
["Bilateral trade evidence → Trade Flows","Open the dedicated 2025 HS Sankey and compare exports, imports and matched partner balances.","Trade values and country matrices are maintained only in Trade Flows; do not duplicate figures here.","#trade"],
["Market exposure","Price cycles, import dependence for process inputs, destination concentration","Country concentration needs sourced bilateral customs matrices.","#trade"],
["Environmental exposure","Power source, tailings, water, land use and rehabilitation","These are risk lenses, not allegations about named companies.","https://www.usgs.gov/centers/national-minerals-information-center/indonesia"]]],
["05","SWOT & Strategic Assessment","Four disciplined lenses: nationally relevant hypotheses, not investment advice.",[
["Strength","Resource scale and existing multi-stage downstream ecosystem","Actual value capture depends on ownership, capability and domestic supplier participation.","https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-nickel.pdf"],
["Weakness","Energy intensity, processing concentration and commodity-cycle exposure","Measure by technology and project rather than broad national generalizations.","https://www.usgs.gov/centers/national-minerals-information-center/indonesia"],
["Opportunity","Refined metals, recycling, industrial services and materials R&D","Require commercial customer commitments and documented project milestones.","https://www.usgs.gov/centers/national-minerals-information-center/indonesia"],
["Threat","Commodity oversupply, market access standards and environmental constraints","Scenario exposure; not an observed probability score.","https://www.usgs.gov/centers/national-minerals-information-center/indonesia"]]]]},
ai:{name:"AI Infrastructure",subtitle:"From data-center announcements to energized, connected and commercially operational compute capacity.",sections:[["00","Stakeholder & Institution Mapping","Who sets national frameworks, facilitates investment, supplies infrastructure and operates data centers?",[
["Komdigi / Directorate General of Digital Ecosystem","Digital policy, AI ecosystem and coordination of proposed AI governance","A draft AI presidential regulation is not binding until enacted; check the legal register.","https://portal.komdigi.go.id/kanal-publik/berita-kini/10425"],
["Investment Ministry / BKPM","Licensing facilitation and published capital realization","Aggregate FDI does not equal verified AI-data-center project expenditure.","https://www.bkpm.go.id/"],
["ESDM / PLN","Power regulation, grid readiness and electricity supply agreements","Contracted MW is not the same as energized operating IT load.","https://www.esdm.go.id/"],
["BSSN","National cybersecurity institutional role","Keep cyber oversight distinct from telecom policy and commercial security providers.","https://bssn.go.id/"],
["Data protection governance","Personal Data Protection statutory obligations and responsible institutions","Regulator and implementing arrangements must be checked against enacted texts at the observation date.","https://peraturan.go.id/"],
["Telkom ecosystem / other state-linked participants","Potential infrastructure ownership and commercial operations","Attribute participation to a specified legal entity and facility, never automatically to all national projects.","https://www.telkom.co.id/"],
["Hyperscalers, colocation and compute operators","Commercial service and facility ownership / operation","Identify AWS, Microsoft, Digital Edge, PDG or others per verified facility; roles and capacity measures must not be conflated.",null],
["Policy cross-reference → Policy & Risk","AI roadmap, PDP, cybersecurity, data center and investment incentives","Canonical enacted/draft status and policy chronology are maintained in Policy & Risk.","#policy"]]],
["01","National Capacity & Investment Pipeline","Never combine installed data-center capacity, prospective projects and AI-specific spending as one realized total.",[
["Operating data-center capacity","Approximately 580 MW","July 2026 ministerial statement; all data centers, not audited AI-GPU capacity.","https://www.antaranews.com/berita/5644769/airlangga-ungkap-minat-investor-bangun-data-center-13-gw-di-ri"],
["Prospective additional capacity","Approximately 1.3 GW","Investor interest / pipeline, not commissioned capacity.","https://www.antaranews.com/berita/5644769/airlangga-ungkap-minat-investor-bangun-data-center-13-gw-di-ri"],
["Indicative investment pipeline","US$15–20 billion","Ministerial prospective estimate, not verified capital spending or BKPM realized AI data-center investment.","https://www.antaranews.com/berita/5644769/airlangga-ungkap-minat-investor-bangun-data-center-13-gw-di-ri"]]],
["02","Infrastructure Geography & Readiness","An AI-ready data center requires more than a land allocation or construction contract.",[
["Greater Jakarta / West Java","Major domestic enterprise and connectivity market","Check site-by-site grid allocation, commissioning and availability.","https://www.antaranews.com/berita/5644769/airlangga-ungkap-minat-investor-bangun-data-center-13-gw-di-ri"],
["Batam","Cross-border connectivity and Singapore proximity","Check power procurement, submarine routes and operational dates, not only announced investment.","https://www.antaranews.com/berita/5644769/airlangga-ungkap-minat-investor-bangun-data-center-13-gw-di-ri"],
["Energy & cooling","Redundant power, cooling and water constraints","MW IT load, total facility MW, PUE and grid connection have different meanings.","https://www.antaranews.com/berita/5644769/airlangga-ungkap-minat-investor-bangun-data-center-13-gw-di-ri"]]],
["03","Project Implementation Monitor","Standard project stage definitions for future operator-by-operator verification.",[
["Announced","Public concept / MoU / land agreement","No assumption of funded or operating compute capacity.",null],
["Financed / Contracted","Disclosed funding facility, customer or power agreement","A facility or power contract is not cumulative realized capex.",null],
["Under Construction","Documented building, power or cooling work","Record construction and grid milestone dates.",null],
["Commissioned / Operating","Energized, tested and offering commercial service","Distinguish GPU/AI capacity from general cloud and colocation.",null]]],
["04","Governance & Strategic Actors","Separate policy responsibility, investment facilitation, infrastructure provision and operator obligations.",[
["Komdigi","Digital ecosystem, communications infrastructure and relevant digital policy","Check exact prevailing rules and responsible directorates before regulatory claims.","https://komdigi.go.id/"],
["BKPM / Investment Ministry","Investment facilitation and aggregated realization releases","National investment aggregates cannot isolate AI-specific data-center capex.","https://www.bkpm.go.id/"],
["PLN / ESDM","Grid, electricity supply and energy policy","Power contracting is a prerequisite, not proof of full commissioning.","https://www.esdm.go.id/"],
["Danantara / Telkom ecosystem","Potential portfolio and infrastructure participants","Evaluate their roles by named project; do not imply all national projects are controlled by them.",null]]],
["05","SWOT & Korea Cooperation","Capabilities retained in Indonesia matter more than headline project size.",[
["Strength","Domestic digital demand, large market and regional connectivity opportunity","Verify workload utilization and service-market uptake.",null],
["Weakness","Power reliability, skilled operations, cooling, cybersecurity and governance","Impacts vary sharply between campuses.",null],
["Opportunity","South Korea cooperation: power equipment, cooling, storage, workforce certification, cyber and applied AI","Track executed programs and local engineering outcomes.",null],
["Threat","Financing conversion, technology restriction, security incidents and stranded capacity","Forward-looking qualitative scenario, not an independently validated forecast.",null]]]},
policy:{name:"Policy & Risk",subtitle:"A decision register linking legal status, implementation, cross-sector exposure and strategic watchpoints.",sections:[["00","Canonical Cross-Sector Policy Register","All legal instruments, proposed policies and regulatory implementation statuses live here. Sector chapters link to this page.",[
["Mineral & Coal Mining · Law 3/2020","Enacted mining-law amendment to Law 4/2009","Source: legal database; subsequent amendments and implementing rules require consolidated review.","https://peraturan.go.id/id/uu-no-3-tahun-2020"],
["National Energy Policy · Government Regulation 40/2025","Enacted national energy policy framework","Current KEN reference; do not conflate with historical RUEN 2025 targets.","https://peraturan.go.id/id/pp-no-40-tahun-2025"],
["Personal Data Protection · Law 27/2022","Enacted personal data protection law","Distinguish statutory obligations from the institutional formation of a supervisory authority.","https://peraturan.go.id/id/uu-no-27-tahun-2022"],
["Electronic Systems and Transactions · PP 71/2019","Enacted implementing framework for electronic systems","Check scope and sector-specific implementing requirements before asserting data localization.","https://peraturan.go.id/id/pp-no-71-tahun-2019"],
["National AI Roadmap / AI Ethics Presidential Regulations","Proposed / awaiting presidential determination as of July 2026 official statement","Komdigi reported completed drafting and pending issuance; do not mark enacted without an official legal document.","https://portal.komdigi.go.id/kanal-publik/berita-kini/10425"],
["Mineral processing & export requirements","Instrument-specific; verify commodity, effective date and exceptions","Do not apply one generic export-ban rule to every mineral. Track instrument-by-instrument with authenticated source.","https://jdih.esdm.go.id/"],
["Industrial, environmental & investment implementation","Sectoral subordinate instruments requiring project-specific scope checks","Regulatory applicability depends on the activity, location and entity; no blanket certification implied.","https://peraturan.go.id/"]]],
["01","Policy Status & Implementation Monitor","Operational reading guide for the canonical register above; legal instruments must never be reproduced as undated facts in sector dashboards.",[
["Enacted / in force","Official promulgation and commencement date required","Record responsible ministry, legal level, instrument number and amendments.",null],
["Draft / harmonization / awaiting signature","Pending is not enforceable","Evidence must identify the exact government statement date; re-check against peraturan.go.id before updating.",null],
["Implementation / compliance","Measure what is operationally applicable","A government policy objective is not proof of a permit, incentive award or business compliance.",null],
["Superseded / historic benchmark","Preserve as historical context only","Show successor, repeal or amendment before comparing targets.",null]]],
["02","Risk Taxonomy & Sector Exposure","Use qualitative classifications only when source and reasoning are attached.",[
["Political / Regulatory","Permit design, export controls, fiscal policy and changes in legal instruments","Record actual rule, effective date and responsible institution.",null],
["Economic / Financial","FX, cost of capital, commodity prices, capital-commitment conversion","Do not equate market volatility with realized project loss.",null],
["Social / Environmental","Workforce, land, water, emissions and local acceptance","Separate verified incident from possible exposure.",null],
["Technological / Security","Grid cyber resilience, data governance, AI compute restrictions","Monitor actual technical dependencies, not speculation alone.",null],
["Geopolitical","Market access, sanctions, maritime routes and supplier concentration","Connect external shock to Indonesia through a traceable transmission mechanism.",null]]],
["03","Sector-by-Sector Watchpoints","Editorial triage for deeper analysis in each specialist dashboard.",[
["Oil & Gas → Energy Security","Sector risk lens: import dependence and delivery exposure","Authoritative operational indicators, refineries and sector news are maintained in Energy Security.", "#energy"],
["Coal & Mining → Sector evidence","Sector risk lens: production controls, processing and buyer exposure","Coal policy and energy balances belong to Energy Security; mineral chains belong to Critical Minerals; bilateral exports belong to Trade Flows.", "#minerals"],
["Renewables & Electricity → Energy Security","Sector risk lens: grid investment, procurement and supply security","Power generation, tariffs and renewables are maintained in Energy Security; cross-border trade values are in Trade Flows.", "#energy"],
["AI Infrastructure → Implementation","Sector risk lens: project financing, power readiness and operations","Project status and capacity figures are maintained only in AI Infrastructure; this page documents cross-sector policy implications.", "#ai"]]],
["04","Evidence-Based Decision Matrix","A consistent record prevents legal, market and monitoring categories from blurring.",[
["Confirmed fact","Original law, official release, audited filing, or verified event","Include date, document, scope and source URL.",null],
["Attributed claim","Named speaker or publisher making a dated assertion","Represent as claim rather than independently established fact.",null],
["Analytical interpretation","Reasoned implication based on cited source baselines","State assumptions and transmission mechanism.",null],
["Unverified monitoring lead","News, market rumour or prospective corporate action","Do not assert as settled, operational or financially realized.",null]]],
["05","Strategic Scenarios & SWOT","Four cross-cutting perspectives with review triggers.",[
["Strength","Large market, diversified resources and downstream ambition","Trigger: confirmed production, service or investment milestone.",null],
["Weakness","Project data fragmentation and regional infrastructure gaps","Trigger: verified grid, logistics and implementation records.",null],
["Opportunity","Regional integration and higher domestic industrial value capture","Trigger: executed commercial agreements and capacity utilization.",null],
["Threat","Geopolitical shocks and execution delays","Trigger: official policy action, shipment interruption or financial disclosure.",null]]]}
};
const T=(en,id)=>window.SLIi18n?.language==="id"?id:en;
const E=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n};
const link=(url,label)=>{const a=E("a",null,label);a.href=url;a.rel=/^https?:/.test(url)?"noopener noreferrer":"";if(/^https?:/.test(url))a.target="_blank";if(/^#(policy|energy|trade|ai|minerals|investment|map|methodology)$/.test(url)){a.addEventListener("click",e=>{e.preventDefault();document.querySelector(`#nav button[data-page="${url.slice(1)}"]`)?.click()})}return a};
function draw(which){const root=document.getElementById("sliResearchRoot");if(!root)return;const c=chapters[which];if(!c)return;root.replaceChildren();let head=E("section","sli-research-hero");head.append(E("small",null,"STRATEGIC LATITUDE · RESEARCH CHAPTER"),E("h2",null,c.name),E("p",null,c.subtitle),E("p","sli-research-note","Evidence baseline: 15 October 2026 · published source periods vary · source-led qualitative assessments"));root.append(head);
const nav=E("nav","sli-research-nav");nav.setAttribute("aria-label","Chapter sections");
for(const [num,title] of c.sections){nav.append(link("#sli-chapter-"+num,num+" · "+title))}root.append(nav);
for(const [num,title,description,rows] of c.sections){const sec=E("section","sli-research-section");sec.id="sli-chapter-"+num;sec.append(E("small","sli-research-num","CHAPTER "+num),E("h3",null,title),E("p","sli-research-description",description));const grid=E("div","sli-research-grid");for(const [name,value,detail,url] of rows){const card=E("article","sli-research-card");card.append(E("h4",null,name),E("strong",null,value),E("p",null,detail));if(url)card.append(link(url,url.startsWith("#")?"Open canonical dashboard ↗":"Original source / reference ↗"));else card.append(E("small","sli-research-caveat","Editorial framework · project-level confirmation required"));grid.append(card)}sec.append(grid);root.append(sec)}
if(which==="ai"||which==="minerals"){
 const section=E("section","sli-research-section");section.append(E("small","sli-research-num","VERIFIED DATA CATALOG"),E("h3",null,which==="ai"?"Facility and Implementation Records":"Mineral Production and Processing Measures"),E("p","sli-research-description","Source-dated data with original units, explicit project stage and separate planned versus operational capacity."));
 const table=E("div","sli-research-grid"),status=E("p","sli-research-description","Loading source record catalog…");section.append(status,table);root.append(section);
 fetch("data/sector-evidence-catalog.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(d=>{
 if(!section.isConnected)return;
 const records=which==="ai"?d.ai_projects:d.mineral_indicators;status.textContent="Records: "+records.length+" · Dataset reviewed "+d.as_of+" · Source years differ. Not exhaustive.";
 table.replaceChildren();
 for(const x of records){const card=E("article","sli-research-card");card.append(E("h4",null,which==="ai"?x.project:x.commodity+" · "+x.measure));
 const val=which==="ai"?(x.it_capacity_mw_planned?"Planned IT capacity: "+x.it_capacity_mw_planned+" MW":x.it_capacity_mw_reported?"Reported facility: "+x.it_capacity_mw_reported+" MW":"MW undisclosed"):Number(x.value).toLocaleString("en-US")+" "+x.unit;
 card.append(E("strong",null,val),E("p",null,which==="ai"?x.operator+" · "+x.location:x.status+" · "+x.year),E("p",null,which==="ai"?x.status+" · "+x.note:"Measure date "+x.year+"; "+x.status));
 if(x.source_url)card.append(link(x.source_url,"Original source ↗"));table.append(card)}
 }).catch(()=>{status.textContent="Source catalog unavailable; no observations inferred.";});
}
if(which==="ai"){
 const panel=E("section","sli-research-section");panel.append(E("small","sli-research-num","CONTINUOUS MONITORING"),E("h3",null,"AI & Data Center · Dated News Signals"),E("p","sli-research-description","Automatically discovered publisher-attributed headlines. Not proof of project investment, construction or operational GPU capacity."));
 const status=E("p","sli-research-description","Loading dated RSS monitoring snapshot…"),list=E("div","sli-research-grid");panel.append(status,list);root.append(panel);
 fetch("data/ai-monitoring.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(d=>{
 if(!panel.isConnected)return;
 const items=Array.isArray(d.reports)?d.reports.slice(0,12):[];
 status.textContent=(d.checked_at_utc?"Last checked: "+d.checked_at_utc.slice(0,16)+" UTC":"Automated scan not yet completed")+" · "+items.length+" attributed headlines displayed. Do not treat as verified incidents.";
 list.replaceChildren();
 if(!items.length)list.append(E("p","sli-research-description","No published AI RSS observations yet. Existing project research remains available above."));
 for(const item of items){if(!/^https:\/\//.test(item.url||""))continue;const card=E("article","sli-research-card");card.append(E("h4",null,item.topic||"Technology"),link(item.url,item.title),E("p",null,(item.publisher||"Publisher unavailable")+" · "+(item.published_at_utc||"No observation date").slice(0,10)),E("small","sli-research-caveat","Monitoring lead only · verify original publication"));list.append(card)}
 }).catch(()=>{status.textContent="AI monitoring snapshot unavailable; no headlines inferred.";});
}
const note=E("p","sli-research-footer","Source ownership: this chapter contains its own primary evidence; referenced trade, project, energy or regulatory datasets remain in their specialist dashboards. Method: figures retain their original reference year and unit. Announcements ≠ commitments ≠ construction ≠ commissioned assets. Missing or unpublished data are not zero. Industry and policy scenarios are editorial analysis, not measured probabilities.");root.append(note);}
window.initSLIResearch=draw;
})();