# SLI · User-Supplied Dataset Recovery Register (20 October 2026)

## Finding
Much of the problem was visibility, not deletion. Historic uploaded BPS *Statistik Kriminal 2024/2025* (Polri, Susenas, Podes), *Statistik Politik 2025* (IDI, press-freedom IKP, DPT), provincial expenditure GRDP 2021–2025, and IEA Critical Minerals Dataset July 2026 already had normalized SLI representations, but these were buried across separate dashboards or only partially exposed.

## Restored presentation
- **Domestic security:** read `data/sli-bps-public-safety.json` and display national figures, 38 Susenas/Podes province rows separately from the Polri Polda jurisdiction table. Polda Metro Jaya/Papua are not province-level metrics.
- **Democracy/governance:** read `data/sli-bps-regional-intelligence.json`; IDI 2021–2024, press freedom 2020–2024 and provincial 2024 voter rolls are distinct constructs, never a composite political score.
- **Socioeconomic:** use existing BPS GRDP 2021–2025 and Gini March 2026 datasets, with separate observation periods and correct unit IDR billion.
- **IEA:** the complete user-normalized July 2026 Critical Minerals Dataset is restored as `data/iea-critical-minerals-2026-full-scenarios.json` and shown with 9 demand tables, 16 baseline+scenario columns, 108 mining/refining country rows and 4 supply columns. Attribution: IEA 2026, CC BY 4.0. *Not* actual 2026 Indonesia output or an IEA-endorsed SLI product.
- **Environment:** display the actual 20-source-indicator registry and its missing numeric statuses, link to official BMKG/BNPB/environmental portals. The registry is not treated as a measurement dataset.
- **Power reliability:** read `data/pln-saidi-saifi-2023-2025.json`; national and Java/outside-Java aggregates are shown and PLN service units are not represented as identical to administrative provinces.

One discoverable user-facing entry: `sli-sector-data-library.html`, linked from the homepage, DERGUBA AI and related sector dashboards. Detailed source-by-source status lives in `data/sli-user-dataset-recovery-inventory.json`.

## Known incompleteness (do not conceal)
- Stanford HAI AI Index 2026 and World Bank AI Foundations 2025 now have **15 selected numeric indicators** traced to uploaded source PDF pages (`data/sli-ai-stanford-worldbank-foundations-2025-2026.json`), visible in both the source library and the AI hub. This does **not** mean the original figure catalog's 405 candidates have all been digitised or checked.
- RUPTL first-100-page user excerpt has 109 location-specific potential floating-solar reservoir rows and 24 planned AMI target years shown in `sli-sector-data-library.html#ruptl`. Generation, reservoir potential, and AMI rollouts are **plans**, not realized capacity or meter deployment. The full provincial project annexes remain unavailable.
- The official BNPB 2025 CKAN resource has now supplied 38 administrative-province rows and 9 hazard types. The province values are preserved in `data/sli-bnpb-provincial-2025.json` and visible in Climate & Environment plus Data Library. 8/9 hazard sums reconcile; **earthquake provincial sum 29 vs official Indonesia row 28** is explicitly flagged. This source-reconciliation warning must not be silently corrected. Other environmental registries still lack observed numeric feeds; `null` must never be rendered as 0.
- The existence of a public JSON file or a link does not prove a full uploaded book has been extracted, licensed for commercial resale, or independently rechecked against every PDF page.
- This PR adds or restores source discoverability and the full IEA normalized model only; it does **not** automatically add new claim-level evidence to DERGUBA AI's RAG index or update baseline facts.

## Long-term ingestion contract
Before considering an uploaded document integrated, log its exact title, provenance (publisher, year, URL and page/table), observation unit, methodology, normalized data file, rights, limitations, dashboard destination, schema checks, and a maintained status (`numeric`, `partial`, `source_registry`, or `pending`). Require a separate review for source changes and publish no unverified model scores.

## QA
Run `node --test tests/qa-sli-user-data-visibility.mjs` and `node --check js/sli-sector-data-library.js`. `SLI Restored Sector Data QA` verifies the public source attributes, numeric sample comparability, IEA array lengths, missing climate values and links across main sector dashboards. Live browser visual checks and commercial reproduction rights remain separate requirements.
## Follow-up validation (20 October 2026)

- The Data Library is now a prominent panel **immediately below the homepage hero**, plus a top navigation link, direct source-sector tile, and subject shortcuts, instead of only a small footer link.
- BNPB official read-only automated extraction is scheduled weekly and produces reviewer-only candidates in CI; it never rewrites observed production figures without a researcher comparing the source version, province keys and national totals.
- User-uploaded Stanford/World Bank statistics are transcribed on a source-page-specific basis and carefully distinguish Indonesia from global and income-group reference numbers. The publisher PDFs are not republished as files.
