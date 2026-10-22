# SLI — Sitewide UX, Data Completeness & Release Audit
Date: 2026-10-22
Status: IN PROGRESS — repository structure reviewed; runtime/browser and every source row NOT verified.

## Evidence seen
- Git tree of main: 989 blob entries; 45 HTML pages. This is an inventory, not a content completeness certification.
- Shared `js/sli-navigation.js` already defines sector groups, related modules and bilingual titles.
- `sli-user-guide.html`, `sli-glossary-methodology.html` and `data/sli-unified-glossary.json` exist.
- `tests/qa-sitewide-ux.mjs` tests a subset of pages for duplicate HTML ids and structural markup, NOT all pages or interaction behavior.
- `SLI_PRELAUNCH_QUALITY_STANDARD.md` documents outstanding launch blockers.
Do not mark work complete on file existence or passing GitHub Actions alone.

## Target navigation information architecture
1. Overview: executive highlights, freshness/status, alerts, sector entry points.
2. Sectors: Economy & Investment; Energy & Minerals; Food & Agriculture; Marine & Fisheries; AI & Digital; Policy & Geopolitics; Environment & Disaster.
3. Explore: Indonesia map, provinces, companies/issuers, persons, concessions and projects; explicitly separated roles.
4. Research tools: DERGUBA AI Owner Test, cross-source Decision Terminal, scenario labs.
5. Sources & Help: source inventory, freshness/QA, methods, unified glossary, user guide, limitations.
Avoid making links to specialist pages look like additional top-level sectors.

## Definition of done per dashboard
- Reachable from global navigation and sector landing; breadcrumbs/back/related views.
- Clear title, scope, observation period, last source release, last SLI check, unit, provenance and evidence status.
- All KPI tiles, filters, sort, pagination, export, map pan/zoom, charts and links tested at 360px / 390px mobile and 768px / 1366px desktop.
- Header, menus, language toggle, modal and footer usable by touch and keyboard; no unintended horizontal page overflow.
- EN/ID button strings, headings, captions, alt text, empty/error/loading states consistent; preserve original source vocabulary.
- N/A and missing data distinguish unknown from zero; stale values never presented as current.
- No duplicate datasets/KPIs presented with inconsistent periods or definitions; canonical reference documented.
- Accessible focus indicators, headings, labels, table scrollers and reduction of motion for 3D globe.
- No uncontrolled automatic API usage; secure Owner Test separation and no leaked sensitive reports.

## User-provided dataset reconciliation ledger — DO NOT ASSUME INGESTED
| Area | User requirements and source sets to trace | Required check |
|---|---|---|
| IDX/Finance | all listed issuers including BRMS, ANTM, PGEO, BBRI, TLKM; official filings; N/A fundamentals | authoritative issuer coverage, dates, filings, number validation, screen tests |
| Actor intelligence | officers, commissioners, ultimate/beneficial owners, nationality, concessions, projects and links | separate legal, beneficial, claimed and unknown relations with source, date, confidence |
| Energy security | 25-country SPR, 90-day IEA obligation interpretation, Indonesia operational/strategic/buffer reserves | same product basis and comparable reference dates; do not fabricate inventory-days |
| Energy prices and public finance | subsidy, BBM quota, investment EBT versus migas, fuel prices, PLN tariffs | authoritative effective dates, customer category, unit and data owner |
| Energy transition | NZE 2050/2060 targets, RUED attainment, historical emissions, energy resilience index | consistent target/actual years, sector and definitions |
| Energy monitoring | geopolitics plus domestic karhutla, outages, fuel shortage and commissioning | event date versus publication, reliable official corroboration |
| Marine/KKP | KKP portal datasets, hatchery remaining 1,377 rows, WPP geometry BIG | per-table row reconciliation, vector provenance, map viewport QA |
| BPS agriculture | 82 tables, 85 watermark-affected cells plus 1 exception, table 6.1/6.2 discrepancies | publish only reviewed cells; retain unresolved subtotals and licensing caveat |
| Pusdatin food | September publication, 41 table audit, price/NTP/trade | official row/column coverage, source dates and change tracking |
| Welfare/BPS | 2026 Susenas, province/indicator statistical uncertainty, numerical DERGUBA source tests | explicit SE/RSE/CI only where available; precise question/citation QA |
| Institutions | ministers, deputy ministers, DGs/inspectors, institutional maps and official logos | latest official rosters, appointing acts, logo permission and source dates |
| AI/data centres | investment projects, legal status, grid/compute, Korean linkages | do not mix announced and operating MW; identify investor, partner and source |
| Maps | interactive globe with Indonesia highlight and global context | touch/pinch, drag, zoom, fallback, map legend, measured boundaries |
| Research AI | owner-only test, legal article validation, BPS citations | auth, abuse controls, safe cost limits, source-grounded numerical checks |
These are requested coverage targets from the project brief and past project work, **not confirmation the files and UI contain them**.

## Execution priorities
P0: Broken links, JavaScript errors, mobile cutoffs or inaccessible navigation; security, privacy, wrong/stale factual assertions.
P1: Missing requested datasets with sources; issuer/ownership gaps; incomplete official map/institution sources; inconsistent language and glossary.
P2: Redundant presentation, overloaded landing view, onboarding improvements and polish.

## Evidence ledger schema
Record one row per source dataset: `sector | user_request | source_url | original_filename | license_or_permission | observed_period | release_date | ingested_path | displayed_page | reconciliation_status | missing_records | validator | test_run_url | owner | blockers`.
Statuses: `not_found`, `located_not_ingested`, `ingested_unvalidated`, `validated_not_displayed`, `displayed_unverified`, `verified`, `blocked_rights`.
Never convert lack of evidence to `verified`.

## Proposed acceptance gate
Run existing CI navigation, glossary, i18n, sitewide-UX, cross-sector QA and Research AI smoke tests; add Playwright responsive journey assertions across ALL HTML pages; manually validate rendered charts and long tables; compare dataset manifests to actual original files; only then issue release sign-off.

## Audit boundary
This document records the initial inventory and workplan. No browser session, full regression, original-source digitization check, deployment or data change is claimed here.
