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
