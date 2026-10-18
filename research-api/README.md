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
