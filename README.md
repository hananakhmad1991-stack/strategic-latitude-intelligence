# Strategic Latitude Intelligence (SLI)

Independent, open-source-based analysis of Indonesia's strategic investment, energy security, critical minerals, AI infrastructure, and public policy.

## Status
**Public research prototype.** Energy Security now contains sourced historical statistics, institutional actor mapping, a curated legal and policy register, and a **selected** CCS/CCUS project stage tracker. Automated public-source news discovery, market observations and rule-based daily assessments are experimental and do **not** amount to independently verified real-time incidents, commercially injected CO₂, or audited project expenditure. Do not market SLI as a real-time intelligence service or investment advisory product.

## Website
Once GitHub Pages is enabled: https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/

## Publishing on GitHub Pages
1. Repository **Settings** → **Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Set branch to **main**, folder **/(root)**, and save.
4. Wait for deployment and check the Pages URL.

## Content standards
- Lawfully obtained, publicly attributable information.
- Check reuse rights, licenses and site terms for each source.
- Distinguish announcements, financing, construction, and operations.
- Include source URLs and reference dates when publishing data.
- Do not publish confidential client material or personal information without proper authorization.
- Do not give individualized investment or securities trading recommendations.

## Interactive Stakeholder Explorer
Six clickable institutional hubs replace the initial full-page actor cards. Select a hub to view actors, choose an actor to inspect leadership, role, evidence and connected stakeholders, or select an energy issue to trace policy, regulator, operator, legislative oversight and region. A text search and mobile buttons provide alternate navigation. The explorer uses native SVG and reads the same date-stamped JSON as the institutional monitoring workflow; no Power BI subscription or external JavaScript library is required. Its lines express analytical association, not legal reporting hierarchy.

## Indonesia Energy Institutional Power Map — October 2026
- The top of Energy Security now includes a **six-layer institutional and actor map** with **54 distinct actors and roles**, covering:
  1. Presidency, DEN, Purnomo Yusgiantoro as presidential energy adviser, coordinating ministries and fiscal/planning agencies.
  2. ESDM subsector directorates (Migas, Minerba, EBTKE, Gatrik), regulators (BPH, SKK, BPMA, BAPETEN), and technical bodies.
  3. Pertamina Persero and key subsidiaries (Patra Niaga, PHE, PGE, gas), PLN and generation/fuel units, Danantara and infrastructure finance.
  4. DPR commissions XII (energy), VI (state-owned companies), VII (industry), XI (finance), plus Banggar, Baleg and BPK.
  5. DPD chair, Komite II (energy/resources and region), Komite IV (regional finance), legislation.
  6. RUED and local authorities, BP Batam/SEZ, emergency response, BMKG and local utilities.
- Leadership highlights sourced as of 15 October 2026: Purnomo Yusgiantoro (special presidential energy adviser), Simon Aloysius Mantiri (Pertamina parent), Sunaryanto (PHE), Mars Ega Legowo Putra (Patra Niaga consolidated downstream), Melchias Markus Mekeng (DPR Komisi XII since August 2026), Badikenita Br. Sitepu (DPD Komite II). Recheck source date on individual cards.
- The actor explorer has text/role/branch filters, expandable branches and **seven issue-specific accountability matrices** (fuel shortages, outages, CCS/CCUS, coal DMO, renewables, fiscal subsidies and downstreaming investment).
- **Governance mapping is analytical, not legal hierarchy:** advisers have no presumed permitting authority; the DPR and DPD are oversight/representation branches, *not* executive subordinates; Danantara does not automatically finance each company project.
- `energy_actor_watch.py` scans cabinet/agency sources and attributed appointment headlines at six-hour intervals, now covering Pertamina, the special adviser, DPR and DPD. Only corroborated cabinet and role-linked ESDM officials can be auto-renamed. For other officeholders, a candidate headline or source inconsistency is **flagged for review**, never silently promoted.
- Official institutional source access may fail or lag (HTTP 403, stale biographies). A failed check never means a person is still in office.
- CI asserts at least 50 unique roles, the presence of the presidential adviser, Pertamina parent, DPR XII and DPD II, and all seven accountability routes.

## Biofuels, B50, ethanol and SAF / green refineries — October 2026
- A dedicated **Biofuels & Biodiesel Security** drill-down within Energy Security includes installed **FAME nameplate capacity** (22m kL/year, attributed to EBTKE in Feb 2026), 2025 actual FAME production 15.65m kL and 2025 domestic distribution 14.94m kL (EBTKE); cumulative 2026 distribution 10.69m kL through 7 Sep (ministerial hearing reported publicly). Never confuse installed capacity, actual physical production, consumption/distribution, initial company allocation and projected B50 programme demand.
- **B50 entered into effect from 1 July 2026** (Kepmen ESDM 257.K/EK.01/MEM.E/2026). The 15.646m kL amount under original 2026 Kepmen 439 was issued on the initial B40 basis; government's June B50 programme volume forecast was ~17.6m kL. A verified signed amended operator allocation remains a research gap. News candidates are not revised allocations.
- **Separate production assets:** the 26 nominated BBN companies are not 26 identical plants, and are not the total number of biodiesel factories. Plant-level nameplates require a verified active unit register. Cilacap SAF co-processing capacity is **reported 27 kL/day**, whereas the Phase 2 target **887 kL/day by 2029** remains proposed; SAF, FAME and oil refinery bpd must never be added.
- **Bioethanol:** E10 is a 2027 policy target, E20 an ambition for 2028–29; no verified enacted nationwide mandate or installed fuel-ethanol site rollup is asserted. An October 2026 official E20 feedstock estimate (~8m kL) supersedes June's quoted 4m kL, both dated; do not conflate estimates with actual production. E50 remains further discussion.
- **Monthly HIP:** biodiesel October 2026 EBTKE reference **Rp15,072/L plus freight**. Bioethanol June 2026 HIP Rp8,062/L is a stale separate reference. These are not retail pump prices.
- `data/energy-biofuels.json` is manually curated, with original links, evidence dates and warnings. `js/energy-biofuels.js` and `css/energy-biofuels.css` render five tabs and a date-stamped public news feed. `scripts/energy_biofuels_watch.py` and `.github/workflows/energy-biofuels-watch.yml` discover *source leads* **hourly** (subject to GitHub Actions scheduling delays), including blending, capacity, production, feedstock, bioethanol, SAF, prices and policies. The watcher **never silently rewrites enacted law, HIP prices or actual production figures**. The three-hour Domestic Radar also has a biofuel topic.
- **Research quality:** the dashboard is NOT real-time production telemetry. Each metric carries a source vintage, candidate headlines are flagged unverified, and stale scans/failed sources are visible. GitHub Actions syntax/data validation runs on relevant code changes.

## Refinery, electrification, power fleet, Jargas and Energy Security 4A
- The Energy Security page has an interactive five-tab infrastructure explorer: refinery/RDMP capacity by each of the six KPI units; nationwide household electrification (national and PLN scope) and verified provincial access gaps; nationally installed power-generating MW by 17 technologies; household gas-network historical/project/target distinction; and full official 2025 four-aspect, 16-subelement IKE breakdown.
- **Refineries:** operator KPI's six-site figures total **1,158 thousand bpd** when counting **Balikpapan's 360 kbpd CDU design** rather than legacy 260. ESDM/DEN rounded 2025 national refinery capacity to **1.18 million bpd** and reported **56.7% refinery utilization**. These are different scopes and should not be mechanically reconciled. RFCC commissioning in Aug 2026 is not proof of full commercial conversion output.
- **Electrification:** ESDM/Ditjen Gatrik map Q1 2026 reports national household RE **99.832%**, PLN RE **98.561%**. The separate Gatrik village electrification map records **93.674% RD PLN nationwide** and **100% RD NAS**, with lowest PLN-covered village ratios including Papua Pegunungan (21.165%), Papua Tengah (26.821%), Papua Selatan (56.957%), Papua Barat Daya (66.338%), and Papua Barat (70.510%). These are **village coverage**, not household RE or shares with zero electricity. Regional examples from 2025 including Papua Pegunungan and Papua Tengah are transparently secondary reproductions and must not be sold as a full comparable province league table. Household RE is not village RE or 24-hour reliable power supply.
- **Power fleet:** nationwide installed generating capacity 2025 **107.50 GW** across 17 category types (all operators including non-PLN/captive); compare MW and physical generating units in separate interactive modes. Official PLN Statistics 2025 Table 54 counts **5,985 PLN-owned generating units**, by technology including **4,857 PLTD, 138 PLTU, 361 PLTS** and **637 units in renewable-type technologies** (PLTA, PLTM, PLTMH, PLTP, PLTS, PLTB, PLTBM). These are generating *units*, not numbers of stations, and only PLN-owned (NOT the nationwide all-operator unit total). EBTKE's programme total 15.630 GW incorporates a different scope, including 468 MW coal gasification/WHB in the published EBT tabulation.
- **Jargas:** Ditjen Migas 2025 annual report: **954,307 cumulative built connections** (**703,308 APBN** + **250,999 non-APBN**). The 2025–2026 EPC **115,264 planned connections**, 2026 **160,000 target connections**, and actual delivered 2026 connections must not be added without verifying overlap or implementation.
- **Official energy-security index:** provisional 2025 DEN/ESDM **7.04 / 10**, with Availability 7.03, Accessibility 7.26, Affordability 7.19 and Acceptability 6.58. Official index uses **4A and weighted methodology**; Strategic Latitude's **Sustainability** is an unscored separate analytical lens, NOT a fifth national index input.
- `data/energy-infrastructure-security.json` holds year- and source-tagged baseline values and reservations. `js/energy-infrastructure-security.js` / `css/energy-infrastructure-security.css` provide clickable visual comparisons. The existing IKE summary links to the official 4A breakdown.
- `scripts/domestic_energy_watch.py` adds refineries, turnarounds and RDMP milestones to the existing **three-hour domestic monitoring**; refinery candidates may cover a rolling 30-day window, with their actual publication dates preserved.
- `scripts/energy_infrastructure_watch.py` / `.github/workflows/energy-infrastructure-watch.yml` identify newly released official-source changes twice daily and publish a dated candidate review feed. Candidate headlines **do not automatically overwrite** official MW, throughput, electrification or DEN scores; updated primary statistical publications must be independently checked for vintage and comparability.
- Data completeness: national all-operator **unit counts by technology** remain unverified, while official PLN-owned 2025 by-type counts are available. A verified comparable 38-province RE ranking and realized 2026 Jargas completions are still pending credible releases. These are known data gaps, not zeros.

## Energy governance and CCS/CCUS scope
- `data/energy-governance-ccs.json`: functional energy governance / actor roles, updated policy register and evidence-labeled CCS/CCUS pipeline (potential, status, participants, reported investment, verified realization).
- `js/energy-governance-ccs.js` and `css/energy-governance-ccs.css`: accessible interactive front-end panels at the **top** of Energy Security.
- `.github/workflows/energy-policy-watch.yml`: scans for possible policy release **candidates** every six hours. Google RSS headlines are not proof of enacted regulations. The curated policy register requires research review; scans do not automatically change it.
- A geological screening estimate is not proven injectable storage, an MoU is not FID, FID is not spend, a water injectivity test is not measured CO₂ injection, and full LNG project funding is not CCS-only capex.
- `scripts/energy_actor_watch.py` / `.github/workflows/energy-actor-watch.yml`: official cabinet & line-ministry profiles checked **every six hours**; ministers auto-change only when cabinet roster and ministry leadership page concur, ESDM director generals may be updated from the explicitly role-linked official ESDM leadership profile. Other offices use source checks and appointment-candidate monitoring; unverified headlines never overwrite names.
- `data/energy-actors-status.json`: last scan, verified automatic changes, uncertain appointments, source availability and errors. A network failure does **not** confirm the incumbent's continued tenure.
- `scripts/energy_ccs_watch.py` / `.github/workflows/energy-ccs-watch.yml`: six-hour attributed CCS/CCUS headline discovery and project-change signals; publishes `data/energy-ccs-updates.json`. A headline is not FID, captured tonnage or realized capital expenditure.
- Policy discovery operates every six hours; dated official-regulation baselines remain curated to prevent false claims of enactment from search snippets.
- Official roster corrections made on 15 October 2026: Mohammad Jumhur Hidayat (KLH/BPLH), Suahasil Nazara (Finance), Tri Winarno (acting Gatrik DG), Wahyudi Anas (BPH Migas), and Suroso Isnandar (PLN).

## Upcoming Indonesia Energy Events
- Energy Security now begins with **Upcoming Energy Events**: five dated organizer-attributed Indonesian energy and transition events, with source links, date/location, organiser and local WIB countdown.
- `data/energy-events-catalog.json` is a curator-reviewed backup pool spanning 2026–2027. `data/energy-events.json` publishes at most five nearest active/future entries. Expired events are dropped automatically based on **Asia/Jakarta** dates.
- `.github/workflows/energy-events-watch.yml` scans every six hours, refreshes event dates/source health and rolls the top-five list. `scripts/energy_events_watch.py` can also discover newly dated events from original IESR event-detail pages.
- The system **does not automatically accept unverified press mentions or hallucinated conferences**. Broader discoveries outside supported official organizer calendars require adding a source-dated entry to the curated pool. Access failures and possible reschedules are flagged rather than mistaken for cancellations; dates are subject to organizer changes.
- Petromindo-source event metadata was manually curated from publicly announced date facts; their terms exclude automated scraping, so the automated watcher does not scrape their pages.

## Maintenance
The site is served from GitHub Pages using `index.html`, separate JavaScript / CSS modules and dated JSON datasets. Source-watch workflows may run periodically; verify data freshness and GitHub Actions results rather than treating a green build as proof of analytical accuracy.