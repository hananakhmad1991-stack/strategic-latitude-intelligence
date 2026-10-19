# SLI Research AI — Multi-API Phase 1 (19 October 2026)

**Scope:** Add optional external evidence to the **owner-only staging Worker**; public Pro/Enterprise is unchanged. GitHub Pages cannot invoke a paid model without the owner Worker. GitHub Pages deployment does not deploy Cloudflare Workers.

## Enabled components / status

| Integration | Purpose | Default | Extra secret | Verification boundary |
|---|---|---|---|---|
| OpenAI Responses API | Core generative assistant | Existing service | Existing `OPENAI_API_KEY` | Evidence citation indices ≠ per-claim proof |
| World Bank V2 Indicators API | National Indonesian published numeric observations | ON in *example config*, after Worker redeploy | None | Dated annual country data; not BPS province indicators or real-time series |
| Tavily Search | Source discovery for owner-authorized public questions | OFF | `TAVILY_API_KEY` | Snippets **unverified**; not automatically admissible as independently verified events or statutory facts |
| Cloudflare AI Gateway (OpenAI provider-native) | API visibility, routing, gateway limits | OFF | Account/gateway identifiers; optional `CF_AI_GATEWAY_TOKEN` | Optional transparent proxy, NOT model grounding or automatic factual verification |

### Owner-controlled activation

1. Validate the GitHub Actions test `SLI Multi-API Evidence Security QA` and existing Research QA. Confirm your OpenAI budget and existing Worker token.
2. Deploy the new Worker revision through the existing controlled `.github/workflows/sli-owner-worker-deploy.yml` workflow, choosing `deploy-owner-staging` (or deploy locally using Wrangler). Its example TOML enables World Bank indicators only. **Avoid copying keys into source code or chat.**
3. World Bank V2 needs no key. In the owner test, ask: `Bandingkan inflasi Indonesia dan pertumbuhan ekonomi tahun terbaru yang tersedia. Sebut tahun observasi, unit, dan perbedaan dengan data BPS.` Verify that response `external_evidence.world_bank` is `retrieved` and API sources are labeled `official_numeric_api`. An API response can have **older** observations even though it was just retrieved.
4. This repository now pins the SLI Gateway ID `sli-research` and Cloudflare Account ID `df48c020a08ce74cf7158baf9cc9443b` as non-secret Worker variables. It adds `keep_vars = true` to the owner-only Wrangler template and leaves `TAVILY_ENABLED` and `CF_AI_GATEWAY_ENABLED` controlled by the Dashboard (missing or `false` means disabled). First deploy the new owner Worker code with both feature flags `false`. A previous deployed Worker does not gain the multi-API implementation just because its dashboard variables change. When ready, turn on flags in the Cloudflare Dashboard: Workers & Pages → sli-research-owner-test → Settings → Variables and Secrets. Do not add API keys as plaintext variables or commit them to GitHub.
5. To turn on Tavily, make an account at [Tavily](https://app.tavily.com/), set a provider spend/usage cap, run `cd research-api && npx wrangler secret put TAVILY_API_KEY` in your trusted terminal or configure it through Cloudflare's Worker secret UI, set `TAVILY_ENABLED = "true"` in the private Worker configuration, and redeploy. The **Owner Test UI checkbox** must be ticked **separately for each question**. Do not tick it for private documents, unpublished client information or personal data. We send **question text only**, never uploads or chat history. Source snippets are marked unverified.
6. For Gateway: this owner-only Worker has its Gateway Account ID and Gateway ID already pinned in the Wrangler template. For authenticated Gateway, add `CF_AI_GATEWAY_TOKEN` as a secret, then set Dashboard variable `CF_AI_GATEWAY_ENABLED = "true"` **after deploying the compatible Worker code**. Set gateway logs/retention/caching according to the confidentiality of client prompts; do not enable unsafe caching. **No automatic gateway route if its IDs fail strict validation.** Gateway costs and provider usage remain separately subject to their account settings.
7. Test independently: expired/wrong owner token must return 401; missing external consent must make **no Tavily API request**; when Tavily unavailable Research AI must continue with existing SLI evidence; invalid gateway config must return controlled failure, not leak the OpenAI key to a user-supplied host.

### Quality guardrails

- World Bank connector chooses a maximum of **two hard-coded national IND indicators** from the question: GDP growth, nominal GDP, CPI inflation, population, and FDI net inflows as percent of GDP. It sends *only indicator codes* to the API and refuses provincial/foreign-only substitutions.
- Tavily performs at most **one basic search request per opted-in owner research run**, with at most four result snippets and no provider-generated answer, page scraping or image retrieval. The query is capped at 380 characters; failed/disabled searches degrade gracefully.
- Search leads are modeled as attributed third-party snippets; source cards show `live_web_discovery` and warnings. They do not claim Reuters/other media reporting proves an event. The backend does **not** silently promote content from search into legal primary text, verified citations, official investment data or a source-certified fact.
- Existing Owner Test token, CORS origin restriction, request limiting, and OpenAI access checks remain. For paid multiuser releases, per-user budgets, privacy controls, source licences and tenant isolation need a separate production implementation.

## Source API references

- [World Bank Indicator V2](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api), [V2 JSON responses](https://datahelpdesk.worldbank.org/knowledgebase/articles/1886674-new-features-and-enhancements-in-the-v2-api)
- [Tavily Search API](https://docs.tavily.com/documentation/api-reference/endpoint/search)
- [Cloudflare AI Gateway OpenAI provider-native /responses](https://developers.cloudflare.com/ai-gateway/usage/providers/openai/)

## Next phases (NOT delivered by Phase 1)

- BPS publication sync with curated variable/province/year mapping and transparent version checks.
- Content-retrieval/claim-entailment auditing with reviewed article text and protected R2/D1 store.
- Gateway spend alarms, multi-tenant authenticated entitlements, background fetch/scheduling and extraction deduplication.
- Live production smoke test of owner Worker (requires authorized deployed environment and secrets), followed by review before commercial availability.
