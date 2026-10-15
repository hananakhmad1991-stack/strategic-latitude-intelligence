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