# Expert Connect: scholarly discovery adapter (staging)

Uses OpenAlex scholarly work metadata to discover author *candidates* by topic and Crossref to retrieve DOI metadata. Neither provider validates professional identity, current employment, consent to contact, willingness to consult, or membership in SLI. Display candidates as **publicly discovered / not contacted**, separate from SLI's initial zero confirmed experts.

Module: `research-api/src/expert-scholar-discovery.mjs`. Both calls are disabled by default (`enabled:false`). Integrate behind authenticated owner-only server routes with per-user rate limits and a safe bounded search query. Never call directly from a public static dashboard without gating. Do not disclose private client questions to these services. Public scholarly metadata can still require attribution and verification. Do not add automatically discovered experts to a bookable directory.

OpenAlex key is optional for exploratory use; its free budget is limited and query-search usage can consume credits. If a key is added, use only a Cloudflare server-side secret (`OPENALEX_API_KEY`). Crossref bibliographic DOI lookup does not require a secret. No APIs are activated by merging this PR. Add a source-linked review queue, duplicate resolution (ORCID and institution), manual approval, and consent before expert contact.

Tests: `node --test tests/qa-expert-scholar-discovery.mjs`.

## Owner Test endpoint (feature branch)

New POST `/v1/owner-expert-discovery` requires original SLI Origin, the existing private `x-sli-owner-test-token` header, rate limiting, `SLI_EXPERT_DISCOVERY_ENABLED=true` as a Cloudflare Worker variable, and JSON consent `true`. Choose `type:"topic"` with a public `topic`, or `type:"doi"` with a DOI. Attachments, chat history, user-analysis and client briefs are rejected. The response contains only public candidate metadata. Leave the flag disabled until branch-specific acceptance and explicit deployment; this is **not** a public user feature.
