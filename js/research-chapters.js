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
["Threat","Financing conversion, technology restriction, security incidents and stranded capacity","Forward-looking qualitative scenario, not an independently validated forecast.",null]]]]},
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
["Threat","Geopolitical shocks and execution delays","Trigger: official policy action, shipment interruption or financial disclosure.",null]]]]}
};
const T=(en,id)=>window.SLIi18n?.language==="id"?id:en;
const E=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n};
const link=(url,label)=>{const a=E("a",null,label);a.href=url;a.rel=/^https?:/.test(url)?"noopener noreferrer":"";if(/^https?:/.test(url))a.target="_blank";if(/^#(policy|energy|trade|ai|minerals|investment|map|methodology)$/.test(url)){a.addEventListener("click",e=>{e.preventDefault();document.querySelector(`#nav button[data-page="${url.slice(1)}"]`)?.click()})}return a};
const intelligence={
 minerals:{
 headline:"Mineral resource dominance needs to be measured against operating downstream output, domestic capability and international market access.",
 institutions:[
 ["MINERAL POLICY & LICENSING","ESDM · Directorate General of Minerals and Coal","Ministerial portfolio → Ditjen Minerba → permitting, RKAB, mine supervision, PNBP and HSE compliance.","Regulator; not project owner.","https://esdm.go.id/en/media-center/news-archives/dari-perizinan-hingga-rkab-esdm-perkuat-tata-kelola-kegiatan-pertambangan"],
 ["INDUSTRIAL DOWNSTREAMING","Ministry of Industry · Kemenperin","Industrial facilities, processing-chain development and technical industrial policy; distinct from mineral extraction authority.","Industrial policy, not mining-license issuer.","https://kemenperin.go.id/"],
 ["INVESTMENT FACILITATION","Investment Ministry / BKPM","Licensing and aggregated PMA / PMDN realization; link permitting claims to identifiable project entities.","Investment facilitator and statistics publisher.","https://www.bkpm.go.id/"],
 ["STATE EQUITY & OPERATORS","MIND ID → ANTAM / other state-linked companies","Commercial shareholding, mine operations and processing JVs; actual legal SPVs determine site-level control.","State portfolio; not mining regulator.","https://mind.id/"],
 ["PRIVATE / INTERNATIONAL OPERATORS","Nickel, copper, alumina and battery JVs","Check operator, foreign shareholder, offtake, license, plant nameplate and construction stage separately.","Project-specific commercial role.","https://www.usgs.gov/centers/national-minerals-information-center/indonesia"],
 ["POLICY REGISTER","Policy & Risk","Mining law, risk-based permits, mineral exports and environmental rules indexed centrally.","Sector analysis here; enacted text lives in Policy & Risk.","#policy"]],
 measures:[["MINERAL GEOLOGY","Production & reserves","Contained metal vs ore mass; reserves are stock, not annual flow."],["INDUSTRIAL CAPACITY","Refining & smelting","Nameplate vs commissioned and utilized plant capacity."],["MARKET ACCESS","Exports & imports","HS bilateral Sankey belongs to Trade Flows."],["IMPLEMENTATION","Projects & control","Operator, legal JV, works stage and verified output."]],
 watch:["Nickel price and Indonesian supply growth","Government RKAB approvals and permitted output","Manyar restart / verified copper throughput","Battery-grade nickel chemical conversion","Energy source and environmental compliance","Mine-to-refinery ownership and foreign participation"],
 assessment:["Resource abundance improves bargaining leverage only if output is commercially competitive and locally integrated.","Smelter capacity should not be equated with production: power availability, commissioning and feedstock constrain realized throughput.","Battery supply chains require evidence of precursor, cathode and cell manufacturing—not just nickel extraction.","Foreign investors, Indonesian shareholders and project operators should be mapped individually, not aggregated by nationality.","The strategic risk is concentration of processing technology, power and export destinations; quantify when matched data are available."]
 },
 ai:{
 headline:"The decision variable is how much announced computing capacity becomes powered, connected and commercially usable in Indonesia.",
 institutions:[
 ["NATIONAL DIGITAL POLICY","Komdigi · Digital Ecosystem / Digital Infrastructure","AI ecosystem policy and digital-infrastructure coordination. National AI roadmap involves more than 30 ministries and institutions.","Policy coordination; no automatic control over private cloud sites.","https://www.komdigi.go.id/berita/siaran-pers/detail/kemkomdigi-targetkan-indonesia-jadi-basis-produksi-dan-investasi-digital-asia-tenggara"],
 ["GRID & ENERGY","ESDM → PLN / grid operators","Electricity regulation, utility allocation and delivery to campuses. Contracted MVA differs from commissioned facility or IT MW.","Power supply prerequisite.","https://www.komdigi.go.id/berita/siaran-pers/detail/wamen-nezar-infrastruktur-ai-harus-hemat-energi-dan-berdampak-bagi-masyarakat"],
 ["CAPITAL & INCENTIVES","Investment Ministry / BKPM","Investment licensing and recorded capital realization; independent project-level capital spending may not be disclosed.","National PMA aggregate ≠ AI realized capex.","https://www.bkpm.go.id/"],
 ["SECURITY & DATA","BSSN / digital-system and PDP stakeholders","Cybersecurity coordination and personal-data obligations; legal register establishes precise applicable duties.","Do not conflate the regulator with SOC operations.","https://bssn.go.id/"],
 ["STATE-LINKED ECOSYSTEM","Telkom subsidiaries / state-capital participants","Commercial data-center ownership or hosting where evidenced by named entity and facility.","Subsidiary/operator ≠ ministry.","https://www.telkom.co.id/"],
 ["PRIVATE OPERATORS","Colocation, hyperscalers and AI-compute firms","Digital Edge, Microsoft, AWS and other site-specific operators: distinguish cloud region, data hall and GPU compute.","Site-level service and capacity disclosures.","https://www.digitaledgedc.com/products-services/data-centers/indonesia/"],
 ["REGULATION","Policy & Risk","AI governance, PDP, electronic systems, incentives and draft/enacted status.","Legal source of truth is Policy & Risk.","#policy"]],
 measures:[["SITE DELIVERY","IT MW vs facility power","Grid MVA and total facility load are not sellable compute MW."],["AI READINESS","GPU and liquid cooling","AI-ready claims require hardware and cooling evidence."],["NETWORK","Subsea / terrestrial diversity","Latency and route diversity affect commercial resilience."],["LOCAL CAPABILITY","Skills and research access","Training, operational staff and academic compute availability."]],
 watch:["AI roadmap and draft regulation legal status","Batam and West Java grid readiness","Campus commissioning vs targeted MW","Cloud-region service milestones","Liquid cooling and water sourcing","Data security and GPU/AI workload availability"],
 assessment:["Investor announcements are credible signals of intent but should never be summed as realized AI-specific capital expenditure.","Power grid availability is the primary gate for conversion of pipeline capacity into operating compute.","Cloud availability is not proof of the location, volume or utilization of AI GPU clusters.","Domestic benefit requires engineering skills, local supplier participation and access to compute by researchers and companies.","Cooperation with South Korea is most valuable where it transfers power, cooling, memory, operations and security capability."]
 }};
function renderIntelligence(which,root){const d=intelligence[which];if(!d)return;
 const intro=E("section","sli-research-section");intro.append(E("small","sli-research-num","DEEP-DIVE INTELLIGENCE"),E("h3",null,"Institutional Accountability & Decision Pathways"),E("p","sli-research-description",d.headline));
 const mapMount=E("div","sli-sector-power-map");
 mapMount.id=which==="minerals"?"sliMineralsOrganigram":"sliAIOrganigram";
 intro.querySelector("h3").textContent="Institutions, Governance & Policy";
 const explorer=E("details","sli-extra-network");
 const summary=E("summary",null,"Explore institution network, named officials and 9 issue pathways");
 const switcher=E("div","sli-sector-explorer-switcher");
 switcher.setAttribute("role","tablist");
 switcher.setAttribute("aria-label","Institutional intelligence views");
 const networkTab=E("button","sli-sector-explorer-tab","Institution network & 9 issues");
 const hierarchyTab=E("button","sli-sector-explorer-tab active","Government / Danantara & BUMN / Private");
 const networkMount=E("div","sli-sector-explorer-pane");
 const hierarchyMount=E("div","sli-sector-explorer-pane sli-sector-hierarchy-pane");
 for(const button of [networkTab,hierarchyTab]){button.type="button";button.setAttribute("role","tab")}
 networkMount.id=which+"-power-network";
 hierarchyMount.id=which+"-command-hierarchy";
 networkTab.setAttribute("aria-controls",networkMount.id);
 hierarchyTab.setAttribute("aria-controls",hierarchyMount.id);
 networkMount.setAttribute("role","tabpanel");
 hierarchyMount.setAttribute("role","tabpanel");
 networkMount.hidden=true;
 switcher.append(networkTab,hierarchyTab);
 explorer.append(summary,switcher,networkMount,hierarchyMount);
 mapMount.append(explorer);intro.append(mapMount);root.append(intro);
 let networkLoaded=false;
 let hierarchyLoaded=false;
 let activeView="hierarchy";
 const loadNetwork=()=>{
  if(networkLoaded)return;networkLoaded=true;
  if(typeof window.renderSLISectorStakeholderMap!=="function"){networkMount.append(E("p","gov-note","Institutional network script unavailable."));return}
  networkMount.replaceChildren(E("p","gov-note","Loading source-dated institution network…"));
  fetch("data/sector-governance-explorer.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Sector governance dataset not published");return r.json()}).then(payload=>{
   if(!networkMount.isConnected)return;
   const record=payload.sectors?.[which];if(!record?.layers)throw Error("Institution dataset incomplete");
   networkMount.replaceChildren();
   window.renderSLISectorStakeholderMap(networkMount,record);
  }).catch(err=>{console.error("[SLI sector network]",err);networkMount.replaceChildren(E("p","gov-note","Institution network unavailable; other dashboard sections remain accessible."))});
 };
 const loadHierarchy=()=>{
  if(hierarchyLoaded)return;hierarchyLoaded=true;
  if(typeof window.initSLICommandHierarchy==="function")window.initSLICommandHierarchy(which,hierarchyMount);
  else hierarchyMount.append(E("p","gov-note","Top-down presidential and corporate hierarchy module unavailable."));
 };
 const showView=(view)=>{
  activeView=view;
  const isNetwork=view==="network";
  networkMount.hidden=!isNetwork;
  hierarchyMount.hidden=isNetwork;
  networkTab.className="sli-sector-explorer-tab"+(isNetwork?" active":"");
  hierarchyTab.className="sli-sector-explorer-tab"+(!isNetwork?" active":"");
  networkTab.setAttribute("aria-selected",String(isNetwork));
  hierarchyTab.setAttribute("aria-selected",String(!isNetwork));
  if(explorer.open){if(isNetwork)loadNetwork();else loadHierarchy()}
 };
 networkTab.addEventListener("click",()=>showView("network"));
 hierarchyTab.addEventListener("click",()=>showView("hierarchy"));
 explorer.addEventListener("toggle",()=>{if(explorer.open)showView(activeView)});
 showView("hierarchy");
 const taxonomy=E("section","sli-research-section");taxonomy.append(E("h3",null,"Measurement Framework · Do not mix units"));const measure=E("div","sli-intel-metrics");for(const [type,title,desc] of d.measures){const c=E("article","sli-intel-metric");c.append(E("small","sli-research-num",type),E("strong",null,title),E("p",null,desc));measure.append(c)}taxonomy.append(measure);root.append(taxonomy);
 const watch=E("section","sli-research-section");watch.append(E("h3",null,"Monitoring Priorities & Verification Triggers"),E("p","sli-research-description","Editorial watchlist only, not a claim that every event occurred."));const ul=E("ul","sli-intel-watch");for(const item of d.watch)ul.append(E("li",null,item));watch.append(ul);root.append(watch);
 const assess=E("section","sli-research-section");assess.append(E("h3",null,"Overall Strategic Assessment"),E("p","sli-research-description","Qualitative, source-informed interpretation. Reassess as primary observations change."));const ol=E("ol","sli-intel-watch");for(const x of d.assessment)ol.append(E("li",null,x));assess.append(ol);root.append(assess);
 const operations=E("section","sli-research-section");operations.append(E("small","sli-research-num","CANONICAL INVESTMENT DATA"),E("h3",null,"Named Projects · Realization & Implementation Tracker"),E("p","sli-research-description","Sourced project records are owned by Investment Tracker. This filtered view links projects to the sector without duplicating the dataset. Announced spending is not audited expenditure."));
 const status=E("p","sli-research-description","Loading project-level source records…"),wrap=E("div","sli-intel-table-wrap");operations.append(status,wrap);root.append(operations);
 fetch("data/investment-evidence.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(d=>{
  if(!operations.isConnected)return;
  const rows=(d.projects||[]).filter(x=>x.sector===(which==="minerals"?"Critical minerals":"AI infrastructure"));
  status.textContent=rows.length+" tracked project records · "+(d.as_of||"Undated dataset")+" · values preserve original currencies and reported scope.";
  const table=E("table","tf-table"),head=E("thead"),tr=E("tr");for(const h of ["Project / owner","Geography","Implementation stage / date","Reported value (not realized CAPEX)","Original evidence"]){tr.append(E("th",null,h))}head.append(tr);table.append(head);
  const body=E("tbody");for(const x of rows){const tr=E("tr");for(const value of [x.name+" · "+x.investor,x.region,(x.stage||"Unverified")+" · "+(x.evidence_date||"No date"),x.reported_amount!=null?String(x.reported_amount)+" "+x.currency+" · "+x.amount_basis:"Not disclosed"]){tr.append(E("td",null,value))}const source=E("td");if(x.source_url)source.append(link(x.source_url,"View original ↗"));else source.textContent="Source not available";tr.append(source);body.append(tr)}table.append(body);
  const stageCounts=new Map();for(const x of rows){const name=x.stage||"Undisclosed";stageCounts.set(name,(stageCounts.get(name)||0)+1)}
  const chart=E("div","sli-project-stage-chart");chart.append(E("h4",null,"Tracked project stages · count of source records"),E("p","sli-research-description","Record counts, not MW, not project value and not realized expenditure. Project stages use the latest saved source observations."));
  for(const [label,count] of [...stageCounts].sort((a,b)=>b[1]-a[1])){const line=E("div","sli-stage-count-row"),head=E("div","sli-stage-count-label");head.append(E("span",null,label),E("strong",null,String(count)));const track=E("div","sli-stage-count-track"),bar=E("div","sli-stage-count-bar");bar.style.width=String(100*count/Math.max(rows.length,1))+"%";track.append(bar);line.append(head,track);chart.append(line)}
  wrap.replaceChildren(chart,table);
 }).catch(e=>{status.textContent="Project source unavailable; no guessed values are shown.";});
}

function draw(which){const root=document.getElementById("sliResearchRoot");if(!root)return;const c=chapters[which];if(!c)return;root.replaceChildren();let head=E("section","sli-research-hero");head.append(E("small",null,"STRATEGIC LATITUDE · RESEARCH CHAPTER"),E("h2",null,c.name),E("p",null,c.subtitle),E("p","sli-research-note","Evidence baseline: 15 October 2026 · published source periods vary · source-led qualitative assessments"));root.append(head);
const nav=E("nav","sli-research-nav");nav.setAttribute("aria-label","Chapter sections");
for(const [num,title] of c.sections){const a=link("#sli-chapter-"+num,num+" · "+title);a.addEventListener("click",e=>{e.preventDefault();document.getElementById("sli-chapter-"+num)?.scrollIntoView({behavior:"smooth",block:"start"});});nav.append(a)}root.append(nav);
if(which==="minerals"||which==="ai")renderIntelligence(which,root);
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
const note=E("p","sli-research-footer","Source ownership: this chapter contains its own primary evidence; referenced trade, project, energy or regulatory datasets remain in their specialist dashboards. Method: figures retain their original reference year and unit. Announcements ≠ commitments ≠ construction ≠ commissioned assets. Missing or unpublished data are not zero. Industry and policy scenarios are editorial analysis, not measured probabilities.");root.append(note);makeEnergyStructure(which,root);
 if(which==="policy"&&typeof window.initSLISourceBridge==="function"){
  const policyEvidence=E("div","sli-policy-source-brief");root.append(policyEvidence);
  window.initSLISourceBridge("policy",policyEvidence);
 }
}

function makeEnergyStructure(which,root){
 if(!["minerals","ai"].includes(which))return;
 const labels=which==="minerals"?["Institutions & Policy","National Mineral Picture","Supply, Processing & Projects","Markets & Economics","Value Chains & Technology","Monitoring","Sources","Overall Assessment","Appendix · Glossary"]:["Institutions & Policy","National Infrastructure Picture","Sites & Project Delivery","Investment & Economics","Compute & Technology","Monitoring","Sources","Overall Assessment","Appendix · Glossary"];
 const sections=labels.map((label,i)=>{let sec=E("section","es-stage sli-research-stage");sec.id=(which==="minerals"?"cm-":"ai-")+(i+1);let h=E("header","es-stage-head"),wrap=E("div");wrap.append(E("h2",null,label),E("p",null,["Institutional accountability and rules, with the legal register centralized in Policy & Risk.","Official baseline measures with units and dates.","Named assets, operators, sites and implementation stage.","Financial and market exposure without double counting.","Technical systems, local capability and industrial dependencies.","What is being monitored and what would verify it.","Original evidence and reporting scope.","Five source-informed strategic findings.","Definitions and limitations."][i]));h.append(E("span","es-stage-number",String(i+1).padStart(2,"0")),wrap);sec.append(h);return sec});
 const children=[...root.children],foot=children.find(x=>x.classList.contains("sli-research-footer"));
 for(const node of children){if(!node.classList.contains("sli-research-section"))continue;
 const title=node.querySelector("h3")?.textContent||"";
 if(title==="Stakeholder & Institution Mapping"||title==="Governance & Strategic Actors"||title==="SWOT & Strategic Assessment"||title==="SWOT & Korea Cooperation"){node.remove();continue}
 let index=4;
 if(/Institutions, Governance & Policy|Institutional Accountability/.test(title))index=0;
 else if(/National Mineral Baseline|National Capacity|Production and Processing Measures|Facility and Implementation Records|Measurement Framework/.test(title))index=1;
 else if(/Named Projects|Operators, Projects|Project Implementation|Infrastructure Geography/.test(title))index=2;
 else if(/Trade, Competitiveness|Market|Economics/.test(title))index=3;
 else if(/Monitoring Priorities|Dated News Signals/.test(title))index=5;
 else if(/Overall Strategic Assessment|SWOT/.test(title))index=7;
 sections[index].append(node);
 }

 // Canonical specialist sections: avoid blank financial or technical stages.
 const insightRows=which==="ai"?{
  finance:[
   ["Microsoft cloud & AI programme","US$1.7bn announced programme","2024 multi-year cloud/AI and skilling commitment; neither site-specific realized capex nor a dedicated GPU investment amount.","https://news.microsoft.com/source/asia/2024/04/30/microsoft-announces-us1-7-billion-investment-to-advance-indonesias-cloud-and-ai-ambitions/"],
   ["Digital Edge CGK campus","US$4.5bn announced multiphase campus","Operator-announced forward investment plan. Count phases separately; do not interpret the amount as spent or as present operating capacity.","https://id.digitaledgedc.com/news/digital-edge-tops-out-cgk1-secures-largest-indonesia-power-deal"],
   ["CGK development financing","US$665m announced green loan","A financing facility is not itself capital expenditure realized; assess drawdowns and commissioning independently.","https://www.digitaledgedc.com/resources/newsroom/digital-edge-secures-indonesias-largest-data-center-green-loan/"],
   ["BKPM comparison","Project-level AI realized capex not isolated","National PMA and PMDN headline figures cannot be assigned to AI data centers without a separate official industry breakdown.","#investment"]],
  technology:[
   ["Electricity and IT load","CGK utility agreement 1.45 GW apparent-power equivalent reported as 2 × 725 MVA","MVA, total campus MW and IT MW have different definitions; signed power is not energized AI compute.","https://id.digitaledgedc.com/news/digital-edge-tops-out-cgk1-secures-largest-indonesia-power-deal"],
   ["Cooling and water","High-density heat removal; facility-specific data required","Liquid-cooling, PUE and water-source claims need published engineering specifications and permit evidence.",null],
   ["Network resilience","Independent terrestrial and submarine routes","Redundant fiber routes, latency, carrier diversity and outage history should be checked per campus.",null],
   ["GPU and AI workload","No reliable national installed GPU count in this dataset","Cloud-service launch and AI-ready space do not establish GPU inventory, tenancy or utilization.",null],
   ["Cybersecurity, governance and talent","Operational policies require evidence","Map security controls, incident response, skilled operators and data-protection requirements; legal instruments live in Policy & Risk.","#policy"]]
 }:{
  finance:[
   ["Royalty, taxes and PNBP","Scope needs project- and year-specific accounting","Production value, mineral export value, government receipts and corporate capex are different measurements.",null],
   ["Trade destinations","Partner-specific HS customs data","Detailed bilateral values, years, reverse flows and trade balances are owned by Trade Flows.","#trade"],
   ["Investment and capital conversion","Financial commitment ≠ construction ≠ commissioning","The Investment Tracker is the canonical source for company-specific ownership, project milestones and reported budgets.","#investment"]],
  technology:[
   ["Nickel routes","Ore → ferronickel/NPI or matte/MHP → refined inputs","Different flows create different downstream products; a smelter is not automatically battery-grade chemical capacity.",null],
   ["Copper smelting","Concentrate → anode → cathode","Separate nameplate production, commissioning, operating availability and actual cathode throughput.",null],
   ["Bauxite processing","Bauxite → alumina → aluminium metal","Alumina refinery nameplate is not equivalent to aluminium metal smelter capacity.",null],
   ["Energy and environmental inputs","Process energy, water and waste","Site-specific source, environmental approvals and operational disclosure needed for measured ESG comparisons.",null]]
 };
 for(const [index,key,title] of [[3,"finance",which==="ai"?"Capital evidence and commercial conversion":"Commodity economics and value capture"],[4,"technology",which==="ai"?"AI compute-readiness verification matrix":"Processing technology and domestic industrial capability"]]){
  const node=E("div","sli-research-section");
  node.append(E("h3",null,title),E("p","sli-research-description","Source-led sector context. Where evidence is missing, this chapter identifies the exact observation required rather than inferring a value."));
  const grid=E("div","sli-research-grid");
  for(const [heading,value,explanation,url] of insightRows[key]){const card=E("article","sli-research-card");card.append(E("h4",null,heading),E("strong",null,value),E("p",null,explanation));if(url)card.append(link(url,url.startsWith("#")?"Go to canonical dashboard ↗":"Original evidence ↗"));grid.append(card)}
  node.append(grid);sections[index].append(node);
 }
 const seen=new Set(),sources=E("div","sli-research-grid");
 for(const node of sections){for(const a of node.querySelectorAll('a[href^="https://"]')){if(seen.has(a.href)||seen.size>=35)continue;seen.add(a.href);let c=E("article","sli-research-card");c.append(E("h4",null,new URL(a.href).hostname),link(a.href,"Primary or attributed source ↗"));sources.append(c)}}
 sections[6].append(sources);
 const words=which==="minerals"?[["RKAB","Mining annual work and budget approval"],["MHP","Mixed hydroxide precipitate"],["NPI","Nickel pig iron"],["Contained metal","Element mass, not raw ore mass"],["Nameplate capacity","Rated plant capacity, not actual output"]]:[["IT MW","Computing equipment power load"],["MVA","Electrical apparent power, not IT MW"],["PUE","Total facility power divided by IT power"],["GPU","Graphics processing unit"],["Commissioning","Testing before commercial operations"]];
 const glossary=E("div","sli-research-grid");for(const [term,desc] of words){let card=E("article","sli-research-card");card.append(E("h4",null,term),E("p",null,desc));glossary.append(card)}sections[8].append(glossary);if(foot)sections[8].append(foot);
 const intro=E("div","es-intro");intro.append(E("div","eyebrow","STRATEGIC LATITUDE INTELLIGENCE · INDONESIA"),E("h2",null,which==="minerals"?"Critical Minerals Intelligence":"AI Infrastructure Intelligence"),E("p",null,"Institutional mapping, verified indicators, implementation, market exposure, technology, monitoring and strategic assessment."),E("p","es-discipline","Official source dates and measurement periods vary; announced assets are not operating capacity."));
 const nav=E("nav","es-toc");nav.setAttribute("aria-label","Research topics");labels.forEach((label,i)=>{let a=link("#"+sections[i].id,"");a.append(E("span",null,String(i+1).padStart(2,"0")),document.createTextNode(label));a.addEventListener("click",e=>{e.preventDefault();sections[i].scrollIntoView({behavior:"smooth",block:"start"})});nav.append(a)});
 root.replaceChildren(intro,nav,...sections);
 if(which==="ai"&&typeof window.initSLIKomdigi2025==="function"){
  const komdigiRoot=E("div","kd25-root");
  komdigiRoot.id="sliKomdigiAI2025Root";
  sections[1].append(komdigiRoot);
  Promise.resolve(window.initSLIKomdigi2025(komdigiRoot)).catch(err=>{
   console.error("[SLI Komdigi 2025]",err);
   if(komdigiRoot.isConnected)komdigiRoot.append(E("p","sli-research-note","Komdigi report data temporarily unavailable · source: ePPID Komdigi Report 2025."));
  });
 }
 if(which==="minerals"&&typeof window.initSLIIEA2026Explorer==="function"){
  const rawIEA=E("div","sli-iea-2026-model-mount");
  sections[3].append(rawIEA);
  window.initSLIIEA2026Explorer("minerals",rawIEA);
 }
 // An independent source-vintage layer cross-links BKPM, ESDM and IEA without
 // overwriting the existing USGS/IEA mineral registry or named investment cases.
 if(typeof window.initSLISourceBridge==="function"){
  const sourceMount=E("div","sli-source-report-mount");
  sections[3].append(sourceMount);
  window.initSLISourceBridge(which,sourceMount);
 }
 if(which==="minerals"&&typeof window.initSLISmelterCohort==="function")window.initSLISmelterCohort(sections[2]);
 // Mount four automatically refreshed, source-dated geopolitical and domestic signal lanes
 // inside the dedicated Monitoring chapter; preserve canonical statistics elsewhere.
 if(typeof window.initSLIResearchRadar==="function")window.initSLIResearchRadar(which,sections[5]);
 if(which==="minerals"&&typeof window.initSLICommodityPrices==="function"){
  const priceMount=E("div","sli-price-chapter-mount");
  sections[3].append(priceMount);
  window.initSLICommodityPrices(priceMount,"minerals");
 }
 if(which==="minerals"&&typeof window.initSLIESDMMinerals==="function"){
  window.initSLIESDMMinerals(sections).catch(error=>{
   console.error("[SLI ESDM LAKIN 2025]",error);
   if(!sections[1].isConnected)return;
   const note=E("p","sli-research-note","ESDM 2025 mineral performance unavailable. ");
   note.append(link("https://www.esdm.go.id/assets/media/content/content-laporan-kinerja-kementerian-esdm-tahun-2025.pdf","Original ESDM report ↗"));
   sections[1].append(note);
  });
 }
 if(which==="minerals"&&typeof window.initSLIUSGSMinerals==="function"){
  window.initSLIUSGSMinerals(sections).catch(error=>{
   console.error("[SLI USGS Mineral Statistics]",error);
   if(!sections[1].isConnected)return;
   const fallback=E("p","sli-research-note","USGS mineral statistics unavailable. ");
   fallback.append(link("https://www.usgs.gov/centers/national-minerals-information-center/indonesia","Open USGS Indonesia ↗"));
   sections[1].append(fallback);
  });
 }
 if(which==="minerals"&&typeof window.initSLIIEAMinerals==="function"){
  // IEA data stays within canonical national, economics, technology, sources, assessment and appendix sections.
  // This enrichment never replaces USGS baseline, the Investment Tracker, Trade Flows or the Policy & Risk register.
  window.initSLIIEAMinerals(sections).catch(error=>{
   console.error("[SLI IEA Critical Minerals]",error);
   if(!sections[1].isConnected)return;
   const fallback=E("p","sli-research-note","IEA evidence module is temporarily unavailable. Original IEA Critical Minerals Data Explorer: ");
   fallback.append(link("https://www.iea.org/data-and-statistics/data-tools/critical-minerals-data-explorer","IEA source ↗"));
   sections[1].append(fallback);
  });
 }
}

window.initSLIResearch=draw;
})();