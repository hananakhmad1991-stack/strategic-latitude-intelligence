# SLI Research AI — Unified public dashboard evidence, v1

## Purpose and honest limits

The SLI Owner Test's OpenAI + Tavily + AI Gateway path is distinct from its public dashboard evidence.
This release provides a deterministic **source-linked PUBLIC dashboard index** and a dated, typed, fixed-origin fetch path to the existing protected Owner Worker.

- **Automatic:** GitHub Actions checks published public dataset JSON every 6 hours (best-effort Actions scheduling), rebuilds the source-linked index and publishes it **only when the content actually changes**. The Worker fetches the fixed SLI public index, normally cached for 15 minutes, so the index is refreshed without a Worker deployment for data-only updates.
- **Evidence coverage:** Every \`data/*.json\` file is inventoried. Documents are extracted only from records with an item-level HTTPS source AND a meaningful title/data field; special corpora (unreviewed news, legal text, glossary, raw maps, account/config/metadata) are intentionally not relabeled as verified primary records. The generated \`coverage\` section contains exact dataset counts and exclusions; "indexed" is not the same as full field-by-field integration.
- **Stage-gating:** A pinned baseline in \`data/sli-research-project-stage-baseline.json\` records the *existing publicly published stage labels*, not independently certified facts. A later change in a curated project stage creates a review record and sets status \`PROJECT_STATUS_CHANGE_PENDING_PRIMARY_REVIEW\` rather than silently promoting the changed label as true. GitHub Actions opens one non-duplicative review issue. The baseline must NEVER be changed by automatic ingestion.
- **Research responses:** SLI AI receives up to seven locally selected, topic-relevant dashboard records with links, source dates and explicit unverified status. The plain question is **not transmitted** to the public index host; only a constant URL is fetched by the Worker. Missing, stale, malformed or slow index is a non-fatal fallback: the existing curated/CCS/World Bank/Tavily evidence paths continue.
- **Not auto-trained:** This is recurring data retrieval and deterministic quality regression testing, not retraining GPT's weights or automatic agent software upgrades. New extraction rules, methods, claims, source permissions, code or deployments require a reviewed PR, tests and controlled release. Do not enable automated external model re-training or direct production code mutation.
- **Not a fact-check:** An HTTPS publisher link and published status text do not prove a project commissioned, carbon was injected, a regulation is in force or a projected investment was spent. Preserve record/source dates and make original operator/regulator corroboration an explicit separate audit.

## Pipeline

\`data/*.json\` → \`scripts/build_research_unified_index.py\` → \`scripts/audit_sli_research_index.py\` → \`data/sli-research-unified-index.json\` → GitHub Pages → \`research-api/src/dashboard-corpus.mjs\` (fixed HTTPS GET, 2.6s timeout, 15m edge cache) → local topic retrieval in Worker → numbered sources in SLI Research AI.

\`scripts/build_research_unified_index.py\` also emits \`artifacts/sli-research-stage-review.json\`. New projects and project lifecycle transitions still require primary-source verification and human review; changes to the baseline are not scheduled.

## Operations

- Workflow: \`.github/workflows/sli-unified-research-sync.yml\`; cron \`23 2,8,14,20 * * *\` (UTC; GitHub schedule can be delayed).
- Manual GitHub **Run workflow** for an immediate index rebuild, no API key needed.
- Manual command: \`python scripts/build_research_unified_index.py && python scripts/audit_sli_research_index.py && node --test tests/qa-sli-dashboard-corpus.mjs\`.
- The job publishes only \`data/sli-research-unified-index.json\`, **never** an edited project-stage baseline, API secret, original law text or model prompt.
- The Owner Worker must be redeployed **once** via controlled \`deploy-owner-staging\` to install the dynamic retrieval code. Thereafter approved dashboard data changes propagate to the public index on the schedule without a Worker redeploy; other Worker logic changes still require a controlled deployment.
- Set server-only \`SLI_UNIFIED_RESEARCH_ENABLED="false"\` to disable unified-index fetching without affecting Tavily or OpenAI. It defaults enabled for this owner staging bridge. Do not expose a customer-tier endpoint based solely on the Owner Test token.
- GitHub worker or CI green tests are NOT proof of live public URL freshness, citation correctness or real-time cross-source fact verification. Test production with real user questions before customer-facing claims.

## Future improvement queue

1. Sector-specific adapters for remaining unindexed dashboards, with exact source documents/rights and safe year/unit transformations.
2. Primary-publisher paragraph or PDF-document fetch and claim-to-source entailment audit under domain allowlists, with legal version control and capex/status review.
3. Cost-budgeted weekly report evaluations using scored benchmark prompts (when a protected owner-only automated evaluator has safe credentials and budget), publishing review recommendations, **not self-mutating software**.
4. Multi-tenant retrieval privileges, rate limits and confidential private data isolation before commercial release.
