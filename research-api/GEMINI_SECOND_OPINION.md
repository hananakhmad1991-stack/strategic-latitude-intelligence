# Gemini second opinion (Owner staging, opt-in)

The Owner Test Worker supports an **advisory** Google Gemini review after OpenAI generation and existing citation/statistical/legal validation. The review never edits, approves or substitutes primary evidence. It sends a bounded answer excerpt and up to eight bounded *public* source excerpts to Google, so only use it with explicit informed user consent. It is never invoked for file attachments or optional uploaded-analysis summaries. Sensitive/confidential questions must not opt in.

## Cloudflare settings for sli-research-owner-test

- Existing secret: `GEMINI_API_KEY` (Cloudflare Worker Secret, never in git or website)
- Variable: `SLI_GEMINI_REVIEW_ENABLED=true` (leave absent/false until ready)
- Optional variable: `GEMINI_REVIEW_MODEL=gemini-2.5-flash-lite` (verify exact model availability and quota in the Google project before switching on)
- Existing OpenAI keys and model remain unchanged.

## Invocation

Owner authenticated POST `/v1/owner-research` may include `"gemini_review":true` only after a user-facing consent choice has been implemented. **The current website does not yet present that consent control**, so normal traffic will not invoke Gemini. The response includes `quality_audit.gemini_second_opinion.status` and, on successful review, `assessment` and up to three `warnings`.

Failure and limit responses are bounded: `not_requested`, `skipped_private_inputs`, `disabled`, `not_configured`, `quota_exhausted`, `provider_unavailable`, `review_unavailable`. Do not auto-retry or silently fall back to a paid Gemini project. This only preserves the prior OpenAI answer; **OpenAI itself may incur charges**.

## Acceptance

`node --test tests/qa-gemini-second-opinion.mjs`

After CI, deploy the **feature branch** to a separately controlled staging Worker, not main production, and manually check an authenticated opt-in request, provider quota, no attachments, status output, and retention/privacy terms. Do not assume PR merge automatically publishes a Worker. Observe provider quotas and any Cloudflare Worker usage. Only expose a checkbox after independent acceptance.
