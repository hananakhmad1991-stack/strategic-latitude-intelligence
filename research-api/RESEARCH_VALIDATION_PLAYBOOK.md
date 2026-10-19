# SLI Research AI — Quality Validation & Commercial Release Gates
*Prepared 18 October 2026. Operational checklist, not a certification.*

## Verified scope and limitations
- **20 October 2026 update:** SLI has a scheduled deterministic AI self-evaluation pipeline with human review and scorecard artifacts (`.github/workflows/sli-agent-self-evaluation.yml`). This does **not** verify live generative answers or retrain/upgrade AI models by itself.
- Owner Test is an owner-authenticated Cloudflare Worker at the configured staging endpoint. **It is not public, multi-tenant Pro/Enterprise authentication.**
- A complete AI response does not prove the facts are true. Automated report audit checks only structure, cited marker indices and suspiciously unfinished endings; it does not check whether sentences are supported by original documents.
- The SLI 49-method catalogue currently has **10 runnable browser calculations**, with **39 method designs not backed by executed estimators**. A method listed in the UI must never be marketed as an executed computation.
- Source-dated static corpus and automated monitoring leads are **not** universal live web retrieval. Media leads require verification before being promoted to confirmed project facts.
- Never copy owner tokens, API keys, subscriber details, confidential client documents or licensed data into public GitHub pages, example prompts, screenshots or CI logs.

## Release gates

| Gate | Pass condition | Required evidence | Status |
| --- | --- | --- | --- |
| R1. Response integrity | No silent cut-off, unfinished final heading or malformed ending in tested full reports | Automated structural audit; exported Markdown spot checks | Partial: owner confirmed one complete report; broad sample pending |
| R2. Factual provenance | Every high-impact quantitative claim has correct period, unit, territory and publication; source actually supports the claim | Human reviewer checks each claim in a sample of reports against original records | Not yet verified |
| R3. Geography and intent | Exact province, commodity, project status and requested period respected | Regression prompts + original outputs | Partial: code tests exist; live matrix pending |
| R4. Methodological honesty | No invented multipliers, regression coefficients, NPV/IRR, CR or AHP weights; 10 executable methods distinguished from other 39 | Known-answer datasets + method trace and unsupported-data negative cases | Partial: code tests; full live matrix pending |
| R5. Security and licensing | Verified subscriber identity, active entitlements, per-user isolation, source rights, consent, quota/spend limit and revocation | Threat-model tests, licensing register, customer privacy terms | **Release blocker** |
| R6. Service reliability | Tested timeout/failure handling, retry policy, clear errors, mobile reading, copy/export and stable quota | Repeated staging E2E tests with timestamps and measured cost | Not yet verified |
| R7. Commercial operations | Published plans, support channel, refund/billing/privacy policies, secure payment flow, domain, terms and entitlement provisioning | Approved launch checklist | **Release blocker** |

Do not mark any gate passed on the basis of code CI alone. A GitHub green check proves only its declared tests.

## Manual adversarial/live evaluation matrix

Use the owner-only test environment; **do not post owner secrets or confidential case files**. Save question, mode, timestamp, corpus date, copied/exported answer, cited source titles/links, review result and model usage/cost, if available. For each result verify whether the source really entails each important claim, not merely whether a numbered marker is syntactically valid.

1. **Hilirisasi mineral hingga 2030** — nickel vs copper, USGS/ESDM vintages, reserves versus production, operational smelter versus announced projects, supply-chain power needs; conditional base/positive/downside scenarios and actual conclusion. No fabrication of missing figures.
2. **Jawa Tengah alone** — growth, investment, inequality, infrastructure: no substitution of Jawa Barat. Repeat comparison *Jawa Tengah vs Jawa Barat* and ensure both appear correctly with matched time periods.
3. **NTB oil refinery, IDR 5 trillion** — nontechnical investor gets feedstock, refinery type, permitting, location, ports, power, environmental screen; budget is ceiling, **no invented NPV/IRR/jobs/multiplier**. Missing IO/IRIO matrix clearly disclosed.
4. **Indonesia energy security** — official energy index, oil/gas/lifting, fuel quotas, fiscal subsidies/compensation, coal DMO, renewables, electricity constraints and source dates; zero conflation of policy targets and accomplishments.
5. **AI data centers to 2030** — Batam and Java, announced versus operating MW, electricity/cooling demand, data protection and Korea cooperation; avoid fabricated individual construction dates.
6. **AHP questionnaire with known reference answers** — validated input, reciprocal matrix, numerical weights, CR, missing values and rank; compare against independent manual calculation. Do not send respondent personal information without explicit consent.
7. **Econometrics guardrail** — a single 2025 row per province is not a valid multi-year panel FE sample. Withhold calculated FE coefficients when data are inadequate; show precise missing time-series requirements.
8. **Follow-up correction** — ask to correct a specific source/number and retain the previous subject, territory and caveats, distinguishing changed from unchanged evidence.
9. **No relevant curated evidence** — unrelated specialist question must produce an explicitly labelled research-design-only plan, **not** invented current statistics or bogus citations.
10. **Monitoring-news freshness** — test a recent headline and a deliberately stale signal; label discovery/unverified, never upgrade it to validated policy implementation or investment.
11. **Long-form output, charts, mobile and export** — check complete final recommendation, all citations readable and linked, footnotes/source panel distinct, no truncated last heading, Markdown export matches visible answer.
12. **Security negative tests (staging only)** — missing/invalid owner token or origin rejected; rate limit enforced; no provider key in page or logs; no public access to owner-only uploaded documents.

## Reviewer worksheet for each report
- [ ] User question, target region, period and sector match throughout the answer
- [ ] Main conclusion actually addresses the question; report does not stop mid-thought
- [ ] For each high-impact claim, source URL loads and its text supports the cited claim
- [ ] Numbers, currencies, units, revisions and base years are reconciled and not silently converted
- [ ] Forecasts, hypotheticals, announcements, executed projects and measured outcomes are distinct
- [ ] Method choice, input data and **execution status** are correct; no estimated results invented
- [ ] Contradictory evidence and material data gaps are disclosed
- [ ] No customer or confidential material appears in citations or public dashboards
- [ ] Copy/export and reading layout work on desktop and phone
- [ ] Result marked *editorially reviewed* only after a human checks it; otherwise *AI draft*

## Repeatable automated checks
From the repository root:

```bash
node --check research-api/src/report-audit.mjs
node --check research-api/src/owner-test-worker.mjs
node --check research-api/src/index.js
node --check js/sli-research-assistant.js
node --test tests/qa-sli-report-audit.mjs tests/qa-sli-research-conversation.mjs tests/qa-sli-research-quality.mjs tests/qa-sli-owner-test.mjs
```

GitHub workflow: `.github/workflows/sli-research-ai-qa.yml`. A passing test proves *implementation checks*, not the facts inside a newly generated report.

## Immediately next
1. **Research editorial validation:** obtain one exported, non-confidential Markdown answer from the owner and fact-check a sample of its consequential claims against dated primary sources. Fix corpus or instructions when sources disagree.
2. **Live regression:** run the 12-case matrix above with recorded outcomes and explicit evidence dates and model costs. Keep it owner-only.
3. **Operational stabilization:** observe failure/latency and budget; keep paid retry disabled until consent/spend bounds are designed.
4. **Customer readiness:** implement secure Pro/Enterprise authentication, entitlement checks, tenant-safe content handling and privacy/licensing review before opening the service.
5. **Commercial launch:** pricing, payment integration, policies and staged beta users only after R1–R7 are signed off.

**Important deployment separation:** GitHub Pages updates by its workflow; Owner Test Worker updates require a separate authenticated `wrangler deploy` from the local `research-api` folder. A pushed backend change alone is not yet live.
