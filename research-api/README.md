# SLI Research AI · future Pro/Enterprise secure RAG backend

**Not deployed.** This is server-side staging code; public `sli-research-ai.html` runs a limited curated evidence preview with deterministic retrieval. It is NOT connected to an LLM today.

## Planned secure endpoint
`POST /v1/research` (private Cloudflare Worker). Requires configured allowed `WEB_ORIGIN`, verified Supabase Auth JWT through the existing `membership-api` verifier, D1 subscription entitlement (Pro or Enterprise with non-expired active status), and a Cloudflare rate-limit binding.

The private R2 key `pro/research-evidence.json` is reserved for a vetted `documents` array. Documents need `id, title, text, source_url, period, source_date, publisher, topic, geo, access`. Allowed access values are `pro` and `enterprise`; server filters Enterprise-only material for Enterprise subscribers. The R2 bucket must have **no public URL**.

The Worker enforces a 3,000-character JSON body limit, then ranks up to eight bounded internal excerpts and calls the configured model via the server's `OPENAI_API_KEY` and `RESEARCH_MODEL`. The Responses API request sets `store:false`; no key is exposed in browser code. Grounded answers must contain numbered source citations; answers without valid citations are withheld. This checking verifies citation *structure*, not every claim's factual accuracy; rigorous evaluation and human review remain necessary.

## Deployment prerequisites (do not skip)

1. Secure identity and session/device registry with one registered active device per individual Open/Pro account, account recovery, consent and privacy notice.
2. Subscription entitlements and payment/contract rights: paid Pro user gets Pro corpus; Enterprise seat rights are checked individually.
3. Written source licensing and explicit clearance for sharing selected data with the contracted model provider. No confidential client documents or redistributed premium files without rights.
4. Provision private R2 and D1, configure origin and Supabase issuer; create a Cloudflare rate-limit binding named `AI_LIMITER`.
5. Set server secrets `OPENAI_API_KEY`, config `RESEARCH_MODEL` and related bindings in the Cloudflare control plane. Never store credentials in repository or public JS.
6. Implement abuse quotas, model spend caps, audit metadata without saving raw questions by default, vulnerability assessment, red-team prompt-injection tests, source freshness/version checks, per-claim citation verification, and evaluation on representative Indonesia research queries.
7. Wire an authenticated Pro UI to the private endpoint *only after* all gates above pass. Do not enable until commercial/legal approval and a model billing account exist.

Never pretend the public preview is a working generative assistant; never use browser-side API keys, skip expired subscription checks or grant access from a user-supplied tier.
