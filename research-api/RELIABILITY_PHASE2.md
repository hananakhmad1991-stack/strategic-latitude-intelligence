# SLI Research Agent Reliability · Phase 2

**Scope:** Owner-only Research AI. No customer account release, self-training of model weights, unsupervised code modification or certification of research facts.

## Coverage

- The original source-linked dashboard index measured **689 records / 53 datasets** out of 134 JSON files. The Phase 2 adapter pilot passed its isolated generator QA with **841 records / 64 datasets**, covering additional BPS national/provincial observations, 2025 SKK Migas metrics, HEESI national power categories, PLN SAIDI/SAIFI service-unit figures, the PLN historical asset report, RUPTL plan context, IEA dataset vintage and selected trade/economic indicators.
- This is **additional item-level indexing**, not full ingestion of every field of the 64 datasets. The remaining 70 files include unstructured analytical scenarios, source registers without item-level URL mappings and deliberately excluded news, metadata, legal indices or sensitive/unsupported extract types. Not all can or should be promoted to AI factual evidence. New crosswalks are reviewed before being added.
- `scripts/sli_research_source_adapters.py` binds a **known original report URL only for explicitly mapped child observations**. Units, observation year, publication date, provenance, methodological caveats and PDF-page locations are differentiated wherever recorded in the dataset. E.g. SAIDI/SAIFI by PLN reporting unit is **not** a 38-province independent series; HEESI installed capacity is not grid availability; IEA scenario is not measured output.

## Two layers of claim examination

1. `auditResearchClaims` finds potentially material numerical, status, policy, operational or investment claims, checks their numbered local source references and whether claimed numbers appear within the **selected indexed excerpts**. Missing attribution, missing quantities and unreviewed Tavily/dashboard evidence are flagged. Passing a lexical comparison is NOT source entailment or a verified fact.
2. `probeCitedPrimaryPages` makes at most **two bounded, concurrent, redirect-free HTTPS GET** requests to strict original public official-publisher allowlist domains (ESDM, BPS, BI, PLN, Kemenkeu, IEA, World Bank). Only HTML of max 180 KB is eligible, with 2.7 s per request timeout. It reports **presence or absence of cited number strings in the publisher page text**, not factual certainty or a proven article-to-claim relationship. PDFs, paywalled pages, timeouts, redirects and non-allowlisted URLs stay pending review.

The Research AI interface shows an expandable **Audit Klaim** list, numbers absent from indexed excerpts, and original-page review signals. **No claim is automatically approved.** Customers must not be told "verified by SLI" solely because citation index, numeric match or HTTP 200 succeeds. Operator document/PDF parsing, revision matching, and independent adjudication remain further work.

**Operational toggle:** set Worker variable `SLI_PRIMARY_CLAIM_PROBE_ENABLED="false"` if necessary to disable bounded publisher HTML GETs. No secrets or user question text are transmitted; only the fixed referenced public publisher URL is requested. This is an owner staging feature.

## Continuous improvement, not unsupervised self-editing

- `.github/workflows/sli-agent-quality-eval.yml` runs **weekly on Monday UTC** and manually via workflow_dispatch; its action also runs on relevant changes. It rebuilds the local public source index, runs claim-audit and domain-limited publisher-probe tests with mocked fetch, and scores evidence retrieval and method router scenarios using only **public/synthetic test cases**. **No OpenAI, Tavily or Cloudflare API key or paid model inference is invoked.**
- On failure the job uploads `artifacts/sli-research-agent-eval.json` and opens **one reviewer issue** rather than mutating production. Benchmark fixtures may only be updated via human-reviewed pull requests; never train directly on customer uploads, private prompts, or unverified prior answers.
- An initial dry run found **11/18** passing benchmark cases, particularly unrecognised explicit methods (DiD, LQ, TOPSIS, OLS, shift-share, Monte Carlo). The method router was corrected to respect explicit names and flag design-only methods as not executable. Updated dry run reached **18/18**; this is a static functional score, not research truthfulness or model knowledge quality.

## Run and rollout

1. Confirm `SLI Unified Research Evidence Sync & Review`, `SLI Research Agent Weekly Quality Evaluation`, `SLI Multi-API Evidence Security QA`, Research AI and Sitewide QA on the **merge SHA**.
2. The scheduled index sync on `main` publishes only the public index JSON, leaving the pinned project status baseline and credentials untouched.
3. Deploy the Owner Worker manually through `SLI owner Worker · controlled deployment` using `main → deploy-owner-staging` after QA passes. GitHub Pages does not deploy the Worker.
4. Verify 3 live owner-only questions: CCS status Tangguh/Masela, PLN SAIDI by reporting unit (not province fraud), and AI data center project milestone comparison. Expected: external API status, more source-linked dashboard evidence, expandable claim review and bounded primary HTML probe diagnostic.
5. Compare original regulator/operator PDF and primary page manually before trusting major figures or project classifications.

## Phase 3 owner-only pilot: sampled Claim–Evidence Ledger (pending review)

- A deterministic schema (sli-claim-evidence-ledger-v1) is returned as quality_audit.claim_ledger. Each risk-ranked sampled claim maps to numbered citations, original source IDs and public URLs, dates, evidence type, issue codes, and claim-scoped bounded HTML page diagnostics. Nothing is automatically fact-certified.
- Candidate totals and uncaptured candidate counts are explicit. The heuristic cannot promise that it detected all factual claims; even matched numbers or original-page HTTP success do not establish claim entailment.
- SHA-256 fingerprints cover the answer, evidence metadata/excerpts and sampled claim review. These hashes detect changed inputs; they are NOT a signature, immutable archival snapshot, or source authenticity guarantee. Underlying source documents require independent retention.
- The owner-browser CSV export lists source and claim references with outstanding reviews; export does not change facts or production records.
- Every claim is marked requires_human_source_and_editorial_review, and the ledger marks ready_for_external_use false. Material project, legal, budget and operational assertions need independent editorial review before publication.

**Acceptance checks:** node --test tests/qa-sli-claim-evidence-ledger.mjs tests/qa-sli-claim-audit.mjs tests/qa-sli-primary-claim-probe.mjs; Worker integration test; Research Agent Weekly Quality Evaluation CI on the PR SHA. No offline fixture pass implies an LLM truthfulness score.

**Still missing:** official-PDF paragraph/page text with direct entailment review, signed reviewer decisions, archived source snapshots, complete sourced dataset coverage, blinded real-world LLM-answer tests. Leave the feature on Owner Test until these controls are complete.

Next hardening: same-source PDF text extraction with exact paragraph/page provenance; evidence version history; low-risk primary page source capture; reviewer approval workflow for changing legal status or capex; evaluation of actual model outputs on licensed, nonconfidential prompts after spend/consent controls. These remain **unimplemented**.
