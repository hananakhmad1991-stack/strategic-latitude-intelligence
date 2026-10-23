# SLI GDELT Early Warning — staging-only integration

GDELT DOC 2.0 monitoring for nine Indonesian strategic sectors. Metadata is **unverified media signal**, not confirmed incident or sourced policy analysis.

## Endpoints

- GET /health — readiness and AI disabled status
- GET /signals?sector=energy — JSON, latest 24 hours, up to 20 items
- Allowed sectors: energy, mining, industry, finance, food, climate, technology, defense, infrastructure

Public fetch endpoints only. No owner token, no API key. The Worker allows browser CORS only for the SLI GitHub Pages origin and local development; other clients can still access public news signals. Do **not** mistake CORS for authentication.

## Deploy and verify

1. From early-warning-api, run `npx wrangler deploy` using a Cloudflare account with permission.
2. Inspect `/health`, then `/signals?sector=energy` and `/signals?sector=food`.
3. Open `sli-early-warning.html`, provide the staging Workers URL, and test on desktop/mobile.
4. Review at least ten links manually for relevance, duplicates, publication time, and article/source accuracy.
5. Keep public production disabled until the upstream fetch, limits, CORS, and caching pass staging validation.

GDELT can rate-limit, return missing/misleading metadata, and produce noisy search results. Query keywords are intentionally broad for first-stage signal discovery. Do not infer geographic location of an incident from a mention of Indonesia.

## Resource controls

- Cache TTL 900 s per sector per Cloudflare edge.
- Max 20 upstream articles/request; response timeout 12 seconds.
- No artificial "confirmed" score, no AI inference, no auto-publishing findings.
- Cache is not a hard daily rate limit. Before public scale add durable per-client controls (e.g. WAF/rate limiting or D1 counters) and an outbound request budget; avoid unauthenticated expensive endpoints.
- Cloudflare Workers AI and Tavily are **not enabled** here. Future AI inference should be opt-in with an allowlisted model, quota tracker and budget cutoff.

## Verification scope

Code committed to feature branch. Live Cloudflare staging/deployment, browser acceptance and quota metrics need separate evidence before merge.
