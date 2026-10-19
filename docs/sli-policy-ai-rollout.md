# SLI Policy AI · rollout and legal-evidence safeguards (19 October 2026)

## Implemented in the GitHub repository
- `policy-regulatory-intelligence.html` now contains an **Ask SLI Policy** input over the **existing** legal graph, not a duplicate catalogue.
- `js/sli-policy-assistant.js` performs deterministic, jurisdiction-aware source matching and displays document titles, status caveats, graph relationships and original references. **This is an evidence preview, not a generative legal answer.**
- `js/sli-research-assistant.js` consumes a same-origin, one-time, 10-minute session handoff from the policy page. It never submits a legal prompt automatically; the user must review it and authenticate in Research AI.
- `research-api/src/policy-corpus.mjs` converts existing dated index metadata to up to 91 owner-test-only legal evidence records, preserving original URLs, location, version uncertainty and legal graph links. It neither downloads nor pretends to possess complete current consolidated legal text.
- `research-api/src/owner-test-worker.mjs` selects up to four relevant policy metadata records only for legal/regulatory questions, adds source-usage rules to the generative model, and retains all existing server-held secrets and owner-only rate limits.
- `tests/qa-sli-policy-ai.mjs` and `.github/workflows/sli-policy-ai-qa.yml` guard the legal index, source caveats and main integration.

## DEPLOYMENT BOUNDARY — IMPORTANT
**Updating GitHub Pages does NOT deploy Cloudflare Workers.** The web evidence explorer needs only GitHub Pages publication. The enhanced **generative** policy retrieval becomes available only after the owner-test Cloudflare Worker is separately redeployed and live-tested using the existing Cloudflare account. Never paste an API key or owner token into GitHub, ChatGPT, or a client-side config. The subscription Research API remains switched off (`api_enabled=false`).

Local owner-only redevelopment using the *already-authorized* Wrangler setup:
```sh
cd research-api
npx wrangler deploy
```
Use the existing authenticated local Cloudflare session and existing private `wrangler.toml`, not a new secret or exposed credential. Verify the returned Worker build/route and then use the owner-token masked field in SLI Research AI to test a Paris Agreement query and a cross-ministry data-center/OSS query. Do **not** claim it works from this document alone.

## Regulatory truth and change management
- Current legal graph is a **partial** 100-node/131-edge curated snapshot as of 19 October 2026, not an exhaustive Indonesian law database.
- Metadata may contain outdated base acts, successor acts, regional regulations and international/foreign law. `enacted` denotes an enactment record, **not conclusive present legal validity**.
- **Priority future ingestion:** metadata/complete text from DJPP `peraturan.go.id`, JDIHN and original JDIH institutions, regional JDIH across provinces/kabupaten/kota, BPK legal references, regulations with transitional provisions, decisions, and accurate amending instruments.
- For a publication or change, build an instrument identity (jurisdiction/issuer/type/number/year), ingest source-document URL and official PDF, detect a new version, queue legal status verification, then publish a verified relation (amends, partially amends, repeals, implements). A news alert or changed HTML is only a review candidate.
- For **article-level answers**, the verified article or clause text must be in the server-owned source excerpts; a page URL or editorial note is not sufficient. Retain the retrieved document ID, source version, verified date, exact cited article and status. Fail closed for legally decisive claims lacking evidence.

## Acceptance criteria for the next milestones
1. **Comprehensive registry:** verified coverage report by regulator, legal tier, sector and 38 provinces; dated gaps; deduplicated amendment chains and status changes.
2. **Real legal RAG:** article-level retrieval, semantic plus keyword search, grounded citations, follow-up conversation, uncertainty and quote checks; source rights and commercial licensing assessed.
3. **Regulatory change engine:** official publication ingestion, automated daily change candidates, review queue, comparison of old/new legal wording, update timestamps and watcher tests.
4. **Impact & compliance:** map laws to investment stage, licensing authority, sector and geographic scope; opt-in document review only with signed user access, isolated storage, retention and data-protection controls.
5. **Export & production:** verified legal memo, policy brief, Word/PDF, source list and access-control entitlements; independently tested and approved for production.

Do not copy Hukumonline's content, private API or proprietary database. Build on official and appropriately licensed references.
