# SLI Continuous AI Improvement — Operasional Awal

Status: **automated offline regression evaluation wired to GitHub Actions; production LLM self-training and autonomous code deployment NOT enabled.**

## Goal
Turn three coordinated SLI capabilities (generative research with source retrieval, data/source monitoring, and analytic/dashboard methods) into a measurable human-guided improvement loop. OpenAI provides generation, Tavily source discovery when explicitly enabled, and Cloudflare AI Gateway routes model traffic. These are **not three independently self-training foundation models**.

## Daily loop
1. **Observe**: read only public, nonconfidential, already published SLI evidence and a curated synthetic regression dataset.
2. **Evaluate**: run deterministic checks for method routing, numeric reference values, province disambiguation, source tier, project stages, report structural gating, account safety and disclosure.
3. **Explain**: save `sli-agent-self-eval-scorecard.json` as a GitHub Actions artifact; write a readable Actions run summary with score per domain, warnings and improvement proposals.
4. **Escalate**: if a critical regression fails, GitHub Actions becomes red and opens a **single nonduplicative review Issue**. Existing upstream failures are disclosed but are not rewritten as official data and do not cause autonomous remediation.
5. **Human review**: researcher/owner assesses the case, source, methodology, requested target, legal/licence status and risk. File feedback via the GitHub **SLI Agent — Masukan kualitas AI** issue template. Remove credentials, personal records, client-confidential files and proprietary text.
6. **Improve safely**: write or adjust a source-verified regression case in `tests/fixtures/sli-agent-eval-cases.json`, implement a scoped code/prompt/data fix in a separate branch/PR, run full targeted QA, secure an explicit human review, then merge/deploy. Regression cases remain as cumulative institutional memory.
7. **Compare again**: subsequent scheduled runs check retained acceptance criteria to detect regressions.

Workflow: `.github/workflows/sli-agent-self-evaluation.yml`.
Schedule: daily around **09:13 WIB** (02:13 UTC; GitHub scheduled jobs are best-effort and may be delayed).
Manual run: Actions → **SLI Agent Continuous Evaluation & Human Review** → Run workflow.
Local run: `node --test tests/qa-sli-agent-self-eval.mjs && node scripts/sli-agent-self-eval.mjs --out=artifacts/sli-agent-self-eval-scorecard.json`.

**API/cost:** The daily test sends **zero OpenAI, Tavily or other paid AI calls**. It is deterministic code and metadata evaluation; GitHub-hosted runner resource use still applies. Do not reuse the owner's private Research AI token in CI.

## What does not happen automatically
- No change to AI model weights, fine-tuning, private prompt secrets, or automatic GPT model replacement.
- No self-modifying code, auto-merge, cloud Worker redeployment, live customer account creation or payment.
- No silent elevation of unreviewed RSS/news headlines to primary facts, current law, realized project capex or operating status.
- No auto-selection of a new source licence, external service, paid evaluation budget or model API account.
- No claim that a passing structural citation audit verifies the citation actually supports an argument.

## Human review rubric (manual first)
For each public/consented owner-staging answer, record a 0–2 score for: **question and geography fit; factual and numeric provenance; citation entailment; method executed honestly; useful conclusion and completeness; security/consent; localization and UX**. Record the actual date, source vintage, permitted data and whether any model call incurred spend. Aggregate only after 2 independent checks or a clearly identified reviewer; disagreement becomes a new review task, not a silent overwrite.

Run a balanced 12-case staging matrix from `research-api/RESEARCH_VALIDATION_PLAYBOOK.md`; keep those outputs PRIVATE. Use held-out scenarios to avoid tuning only to the visible fixtures. A future paid live model evaluator should be opt-in, server-side, spend-capped and human-calibrated.

## Release and promotion gates
**Green deterministic tests do not certify Pro readiness.** Before user-visible promotion, compare baseline score, source corroboration, factual human review, per-request spend, latency and privacy. Block any release that worsens high-severity geography, money, legal/project status or unsupported numeric results. Require owner signoff for prompt/tool routing changes and privileged backend actions.

The scorecard includes source-health warnings when upstream data ingestion fails; do not suppress these by replacing missing data with zero or invented values.

## End-user feedback loop
Use **Issues → New issue → SLI Agent — Masukan kualitas AI**, specifying a nonconfidential reproduction, expected vs observed output, affected sector/province, primary URL and impact. The feedback is NOT automatically learned as fact; reviewers promote approved anonymous synthetic cases to the regression suite.

## Current operational limits
This is **Phase 1: automated self-testing, degradation identification and proposal generation with human approval**. It is a working CI foundation for improvement, not a fully autonomous learning agent or continuously operating production AI. Real production accuracy, live Owner Worker behaviour, full source entailment and all 49 estimators require separate evaluation and development.
