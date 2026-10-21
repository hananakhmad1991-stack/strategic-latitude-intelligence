# Research AI Owner Test: evidence, live QA and automation gate

**Scope (21 October 2026):** owner-only staging acceptance. No Pro/Enterprise activation, customer uploads, credential changes, production Worker deployment, model fine-tuning, or autonomous fact promotion.

## Offline preflight now enforced for controlled Worker deploy

The workflow .github/workflows/sli-owner-worker-deploy.yml runs on relevant PRs or manual dispatch and requires:

- Legal source-limited and policy tests.
- Owner Test isolation, original-source link review, claim triage and Claim–Evidence Ledger regression tests.
- Source verification, primary publisher HTML probe, hybrid retrieval, multi-API fail-closed behaviour, and report structural tests.
- Run: node scripts/sli-research-owner-readiness.mjs --out=artifacts/sli-owner-research-readiness.json
- An ephemeral seven-day Actions artifact with only metadata counts and enumerated failure/warning codes (no owner token, model prompts, source excerpts or private information).

A PASS proves only that the **offline code and metadata gate** passed. It does **not** deploy a Worker, invoke an LLM, independently validate facts, or certify response quality.

### Code-gate hard blockers

- Public subscriber Research AI accidentally enabled in the owner-only configuration.
- Owner endpoint changed to an invalid/non-HTTPS URL or one containing query credentials.
- Owner staging scope/auth policy absent.
- Unified research index missing, internally inconsistent, duplicate IDs or evidence incorrectly tagged as source-verified.
- Missing link/provenance fields in an indexed dashboard record.

### Degraded but reviewable operational conditions

A recent automation audit can legitimately contain failures, notably:
- data/sli-bnpb-provincial-2025.json refresh workflow failures (Issue #2).
- Pusdatin external feed HTTP 403 (Issue #130); this may be outside the generic automation health summary and remains a separate source-ingestion blocker.
- Incomplete source-index coverage (73/169 datasets as of the referenced index; excluded datasets are *not* automatically erroneous).
- Stale automation audit, source failures, GitHub workflow API errors or inconsistent status counters.

These produce warnings and **never** silently mean healthy. An unrelated upstream publisher failure does not prevent an owner-only test of safe code, but must be disclosed to reviewers. No publisher access-control bypass is authorized.

## Owner live acceptance after an offline pass (NOT automated)

1. From main and the reviewed commit, manually dispatch **SLI owner Worker · controlled deployment → validate-only**. Confirm gate tests and artifact.
2. Use **deploy-owner-staging** only after separate owner approval. Confirm deployed commit and hostname sli-research-owner-test; never deploy the Pro/customer endpoint.
3. Run authenticated owner-only queries and record model version, source-index hash/version, timestamp (WIB and UTC), request/response status, evidence links, latency, token/cost estimate and exact output. Exclude tokens and client confidentiality from GitHub.
4. For each high-risk claim (capex, project COD, legal status, sector output, energy supply), compare the **original primary document and correct physical PDF page**, including unit, date, geography, announced vs realised, amended vs current legal provision. Mark supported / contradicted / insufficient. Numbered local citations and matched figures alone are NOT entailment.
5. Repeat adverse cases, save failures privately, create minimal nonconfidential synthetic regressions, review PRs and rerun the test.
6. Open actual DOCX/PDF exports in Word/Chrome and inspect source references, chart/table alignment, headings, typography and page breaks.

Suggested owner prompt set:
- Tangguh CCS vs Masela project status, distinguish plan, FID and commissioning.
- PLN SAIDI/SAIFI by reporting unit vs administrative province.
- AI data-centre construction and announced MW vs energised capacity.
- 2025 IDX company facts and stale pricing safeguards.
- SLI RUPTL 2025–2034 planned grid additions vs current realisation.
- KKP marine fisheries province/year production without filling absent data.
- BPS trade HS × partner flows; return pending if primary cells are not approved.
- PP 28/2025 reviewed Pasal and absent Pasal 99 UU 7/2021 no-hallucination cases.
- A prompt attempting to override evidence/source hierarchy and inject an unverified legal rule.
- An official link with a matching figure but contradictory project milestone.

A meaningful model quality assessment needs **at least 30 real, independently designed cases**, including held-out negatives and blinded human source checks, as prescribed in research-api/SCIENTIFIC_QUALITY_PHASE4.md. These cannot be replaced with offline unit-test percentages.

## Commercial gate remains closed

Before paid launch: independently reviewed live model answer accuracy, privacy/licensing approval, verified entitlements and revocation, tenant segregation, prompt-injection tests, spending quotas, privacy/retention controls, fallback, production monitoring and customer support. The offline readiness artifact hardcodes commercial_release_ready=false, owner_staging_live_smoke_pass=false, independent_real_model_evaluation_pass=false.

Linked work: #75 (authenticated owner deployment), #92 (resolved-fix learning queue), #2 (automation refresh failure), #130 (authorized Pusdatin ingestion), #44 (legal corpus completeness).
