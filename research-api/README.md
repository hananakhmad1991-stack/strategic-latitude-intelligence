# SLI Research AI · conversational generative research integration

**Not deployed or connected.** The main page `sli-research-ai.html` now provides a genuine conversation-oriented UI: 5,000-character prompts, four report formats (Executive Summary, Deep Research, Comparative Analysis, Risk & Opportunity), follow-up turns, sources sidebar, copy and Markdown export. It explicitly reports that generative AI is unavailable until secure infrastructure is activated. No fake AI-generated results appear.

`sli-research-evidence-preview.html` preserves the former *non-generative* source-based analytics.

## Server design

`POST /v1/research` on private Cloudflare Worker `src/index.js` accepts the JSON keys `question`, `mode`, `language` (id/en) and `history` (up to eight bounded user/assistant turns). The server does not trust client-provided membership, sources, role overrides or API keys. It verifies Supabase Auth signature and expiry, D1 Pro/Enterprise entitlement, permitted Origin and MIME, request size, and per-user Cloudflare rate limiting. Open members have no access.

Only server-curated `pro/research-evidence.json` in a **private R2 bucket** is retrieved. Its `documents` are objects with `id,title,text,source_url,publisher,period,source_date,geo,topic,access`, with `access` restricted to `pro` or `enterprise`. Source licensing must permit such model processing. Documents are geographically filtered for exact provinces; Central Java does not silently become West Java. Enterprise-specific records are excluded from Pro results.

The Worker calls the Responses API with server-held `OPENAI_API_KEY`, configured `RESEARCH_MODEL`, `store:false`, up to ten numbered evidence excerpts, and strict analytical/citation instructions. It produces a structured report with numbered citations, research limitations and a source list. Invalid citation numbers fail closed; citation presence **does not prove factual entailment** and all reports must be reviewed before high-stakes decisions.

## Owner-controlled activation steps

1. Verify SLI legal/privacy/subscription terms, source rights and consent for model processing; do not place licensed or private materials in public GitHub Pages.
2. Configure Supabase Auth staging and real verified login/logout. Implement the still-missing authenticated frontend adapter `window.SLIResearchAuth.getAccessToken()`; device/session policy for one active device remains a separate unimplemented requirement.
3. Provision Cloudflare D1 subscription store (see `../membership-api/schema.sql`), a private R2 bucket without public access, Workers rate limiter and model spending limits.
4. Copy `wrangler.toml.example` to a secure local configuration, replace placeholder identifiers, select a valid model, bind a verified HTTPS route/domain and set `OPENAI_API_KEY` using `wrangler secret put OPENAI_API_KEY`. NEVER commit a key or subscriber records.
5. Populate `pro/research-evidence.json` with dated, verified, licensed-to-process evidence and exact geographic metadata. The public preview corpus is NOT the private production corpus.
6. Run CI and staging E2E tests: source provenance, wrong-province questions, revoked/expired tokens, Enterprise separation, follow-up turns, fabricated citations, leakage, prompt injection, cost and latency.
7. **Only after verified login and API successfully work**, set `data/sli-research-assistant-config.json` to `api_enabled:true`, `login_enabled:true`, `generation_status:"enabled"`, and `api_endpoint:"https://VERIFIED_WORKER_DOMAIN/v1/research"`. Never change these just to make buttons look enabled.

GitHub QA: `.github/workflows/sli-research-ai-qa.yml`. This tests code/contracts, not real deployed generation, paid billing, or model answer accuracy.

## Local checks

```bash
node --check js/sli-research-assistant.js
node --check research-api/src/assistant-core.mjs
node --check research-api/src/index.js
node --test tests/qa-sli-research-conversation.mjs tests/qa-sli-research-ai.mjs tests/qa-sli-research-analysis.mjs
```

## Analytical Workbench · first stage (October 18, 2026)

The public Research AI interface now includes a curated, explicit **49-method registry**, of which **seven** have deterministic local estimators (descriptives, Pearson, simple OLS, multivariable QR OLS with HC1 standard errors and Student-t intervals, annual province/entity panel fixed effects with CR1 clustered errors, AHP, and illustrative stock-flow). The other 42 are **design-only**, NOT executed estimators. Users can import local CSV or JSON (<=1 MiB, <=3,000 rows, <=30 columns); Excel requires CSV export for now. Results include transparent caveats and simple tables/trajectory visualization. The private AI request includes only the calculated summary, not raw rows, and **only when the owner/user selects the upload-consent checkbox and submits**. Uploaded data are explicitly marked user-supplied/unverified, separate from SLI-owned curated citations. No commercial multi-tenant upload storage or public paid login is implied.

Method selection and optional user-derived summaries are validated in `research-api/src/assistant-core.mjs`; the model must not pretend that a design-only estimator ran or invent coefficients. The Owner Test Worker is still authenticated with a single owner-only token, **not** customer-safe multi-user authentication. Enterprise files, direct Excel ingestion, authenticated user-specific linked-panel data joins, advanced cross-sectional spatial inference, methods such as Monte Carlo/CGE/DiD, and tenant-specific encrypted storage need separate implementation and security reviews.

The contextual sector briefs compare dated SLI baselines with **publisher-attributed monitoring leads** and explain plausible impact pathways in 2–3 sentences while expressly NOT treating RSS headlines as verified project status or realised investment. The AI/critical mineral sector dashboards also display the context notes. Neither source-linked brief is live model-generated text.

Smoke tests: `node --check js/sli-analytical-core.mjs && node --check js/sli-analytical-workbench-ui.mjs && node --test tests/qa-sli-methodology-workbench.mjs`.

## October 18 extension: regression diagnostics and report export

`js/sli-econometrics.mjs` implements reproducible QR estimators, HC1 heteroskedasticity-robust standard errors, approximate t-based 95% confidence intervals, Cook's-distance and standardized-residual screens, and one-way unit or unit-plus-year fixed-effects for **actual annual repeated entity-year panels** with >=8 entities and >=3 years. The FE variance uses exploratory small-sample-adjusted cluster-robust (CR1) covariance clustered by unit and t reference df=entities-1. There is no claim of causal identification or validity under all error processes. The FE model explicitly rejects a cross-section of 38 unique provinces in 2025 as not being panel data.

`js/sli-econometrics-report.mjs` generates an interactive scatter with outliers, fitted lines and optional +/-15 percent growth sensitivity curve (illustrative exclusion only), plus Markdown investor research report with uncertainty, diagnostics, scenario caveats and investor due diligence. Uploaded data do not leave the browser without opt-in, and the report download is local. No user-uploaded data is published in GitHub Pages.

CI smoke: `node --test tests/qa-sli-econometrics.mjs`; browser-like UI e2e via `tests/qa-sli-econometrics-ui.mjs` with jsdom, covering 38-province dataset, multivariable model, invalid cross-section for panel, valid synthetic entity-year panel and chart/report presentation. The public website deploy does **not** automatically redeploy the distinct private Cloudflare Owner Test Worker. Its backend must be redeployed and independently tested before relying on the new optional derived-data context in generative AI.


## October 18 BPS official province–year provenance

The Research AI workbench includes a **client-side "Gunakan panel BPS tersaring · 32 provinsi"** action, using existing SLI-curated BPS arrays from `data/sli-bps-regional-intelligence.json` and `js/sli-bps-official-panel.mjs`. The official source was checked at the BPS publisher's [2021–2025 provincial expenditure GRDP volume 12](https://www.bps.go.id/id/publication/2026/04/30/f01b7d753185ea2e879d321f/produk-domestik-regional-bruto-provinsi-provinsi-di-indonesia-menurut-pengeluaran-2021-2025.html), released 2026-04-30.

* Data arrays cover 38 named provinces × 5 annual slots = 190 **potential cells** per metric. Eight slots are absent for four new Papua provinces in 2021–2022; 182 full annual provincial GRDP/PMTB slots have observations.
* Raw numeric growth ratios from consecutive 2010-price GRDP arrays yield 144 apparent province-years during **2022–2025** (34 in 2022, 34 in 2023, 38 in 2024, 38 in 2025). **Two 2023 observations are geographically invalid due to a 2022/2023 province-boundary break and must not be interpreted as growth**, and excluding both predecessor provinces throughout leaves 136 screened observations in the optional unbalanced panel (32/32/36/36). **Geographically screened balanced default**: 32 provinces × 4 years = 128 complete rows. Four new Papua provinces are not backfilled/imputed; the two pre-split provinces Papua and Papua Barat are also excluded due to the 2023 administrative boundary change.
* **Outcome**: `real_grdp_growth_pct = 100*(constant_price_grdp_t / constant_price_grdp_{t-1} - 1)`. **Predictor**: `pmtb_share_lag1_pct = 100 * current_price_pmtb_{t-1} / current_price_grdp_{t-1}`. Both are client-side calculated from *BPS official annual published aggregates*; **the regression estimate is an SLI calculation, NOT a BPS result**. 2024 revised; 2025 preliminary.
* The first default model is exploratory panel fixed effects with annual year controls, not causal proof, PMTB investment returns, multiplier effects or realised BKPM PMA/PMDN. Lagging contemporaneous investment share modestly clarifies temporal order but does not resolve endogeneity, regional spillovers or selection.
* One-year provincial Gini March 2026 and PLN 2024 grid data are not automatically repeated across years or merged into the panel. Province/year joins must have validated identifiers, definitions and vintages.
* Data licence risk: publication carries restrictions on commercial reproduction of extensive tables; secure appropriate permission before releasing a paid dataset export or redistribution workflow. The research UI does not export the raw BPS source table; it offers calculated local regression and attributed reporting. Third-party owner/user uploads remain unverified and separate.
* CI: `node --test tests/qa-sli-official-bps-panel.mjs` tests balanced/unbalanced coverage, missing Papua history, correct source URL, growth parity to 2025 province preview, and actual numerical 32×4 fixed effects with clustered errors plus sensitivity diagnostics. `tests/qa-sli-econometrics-ui.mjs` tests clicking the official BPS button without needing a backend.

### Critical October 18 boundary audit and correction

BPS Papua Barat's *PDRB menurut Pengeluaran 2019–2023* documents a 2023 change from 13 to 7 kabupaten/kota after the split of Papua Barat Daya; BPS regional releases separately document Papua's new provinces. The prior 34×4 experiment had 2023 raw provincial 2010-price GRDP ratio of roughly -71.34% for Papua and -34.49% for Papua Barat, which is **NOT** an economically comparable change in the same province geography. The prior panel estimate (+0.122396, SE 0.612682, p 0.842886) is **withdrawn from evidence-based interpretation**: it was a calculation on boundary-inconsistent inputs. New official BPS workbench estimates use 32 continuously comparable provinces × 2022–2025 (128 rows). The user-facing module and evidence footnotes name all six omissions, with the other four new provinces missing 2021–2022. Source official BPS Papua Barat publication: https://papuabarat.bps.go.id/id/publication/2024/04/04/038627aa90c2a310aaf907c6/gross-regional-domestic-product-of-papua-barat-province-by-industry-20192023.html . Any later fixed-boundary reconstructed panel must be separately sourced and versioned, never silently substituted.

## October 18 source-quality and independent model-validation release (stage 1–2)

**Audit gate:** `js/sli-provincial-data-integrity.mjs` verifies the existing BPS 2021–2025 provincial source-vintage, validates four numeric input series' completeness, enforces exclusion of six Papua territories without geographic backcasts, detects growth outliers without deleting them, and independently reconciles 32 provincial 2025 growth values to `data/sli-research-province-preview.json` within 0.005 percentage points. Its `status='blocked'` prevents the UI from loading a BPS model if critical source reconciliation fails. Nonessential institutional context errors do not block otherwise valid GRDP data.

**Added *verified* annual indicator:** `household_share_lag1_pct = 100 × household_current(t−1) / grdp_current(t−1)`. This uses the same BPS 2021–2025 expenditure tables and is available at province-year frequency for 128 balanced observations. The Research AI UI has a one-click X2 comparison alongside lagged PMTB. Household and PMTB expenditure components are not independent external shocks; check the compositional structure, collinearity and endogeneity. It is NOT a causal interpretation or realisation of BKPM investment.

**Second genuine multi-year institutional dataset:** The BPS *Statistik Politik 2025* corpus includes Dewan Pers provincial press-freedom index (IKP) observations through 2024. `buildBpsPressFreedomContext` validates 32 × 3 observations (2022–2024). This is labelled **context only**, not automatically joined to the 2025 GRDP panel; no invented 2025 value or ungrounded claim that IKP drives GDP growth.

**Readiness registry:** Ten sector indicators have explicit coverage, geographic grain, units, attribution and model readiness. Existing BPS Gini 2026 and ESDM SPKLU 2025 are single snapshots, not a historical 2022–2025 series; PLN 2024 distribution UID/UIT capacity units are not equivalent to province-year electricity availability. Provincial TPT/TPAK, education/IPM, and BKPM realised investments remain **not yet ingested/validated for model use** even though official publishers may provide series. This registry represents SLI inventory, not total official-source availability.

**Independent econometric comparator:** `scripts/verify_bps_panel_statsmodels.py` rebuilds the geographically screened 32 × 4 BPS sample directly from raw source arrays in Python, then estimates single- and multiple-predictor two-way FE using `statsmodels` clustered by province, comparing to the independent SLI QR/within estimator. It checks exact residual degrees of freedom, beta coefficients, robust SEs and t(31) confidence intervals. The residual df calculation in the browser estimator was corrected to count all 32 absorbed entity effects. GitHub Actions automatically installs a pinned statsmodels version to enforce this test on every relevant change. QA path: `tests/qa-sli-provincial-data-integrity.mjs` and `tests/qa-sli-econometrics-ui.mjs` cover source integrity and UI flows.

**Important limits:** Matching statsmodels verifies numerical implementation, not source redistribution rights, exogeneity, spatial dependence, no measurement error, or external policy effectiveness. Source tables still need permission review before paid bulk redistribution, and any proposed customer Excel + SLI data fusion must validate geographic IDs, years, sector definitions and file isolation.
