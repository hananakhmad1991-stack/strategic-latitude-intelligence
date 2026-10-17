# SLI Membership · Stage 1 (17 October 2026)

**Status: UI catalog deployed; membership API code prepared but NOT deployed, connected, or accepting payments.**

## Released publicly

- \`sli-membership.html\`: bilingual plan comparison for **Open (free)**, **Pro (price TBA)** and **Enterprise (custom quote)**. Open links to the existing public dashboard. Pro/Enterprise inquiries open the SLI professional profile; there is no fake signup or payment link.
- \`data/sli-membership-plans.json\`: the canonical tier, price-state and feature policy. \`checkout_enabled=false\`, \`registration_enabled=false\`.
- The main navigation links to Membership from all research pages.
- Official-source links, attribution, general methodology and glossary remain publicly available. SLI Open is now designed as a limited curated Overview/Strategic Map/news preview, NOT full national statistical explorers.

## Prepared, not launched

- \`membership-api/src/index.js\`: Cloudflare Worker that validates a **Supabase Auth signed access token** using public asymmetric JWKS (ES256/RS256), validates issuer/audience/user/expiry, reads a server-owned D1 entitlement and serves explicitly allowlisted private R2 resources.
- \`membership-api/schema.sql\`: D1 subscription store with explicit access expiry and status, and event idempotency receipts reserved for future verified payment webhooks.
- \`membership-api/wrangler.toml.example\`: infrastructure binding example, not usable as production config without replacing placeholders.
- \`membership-api/tests/auth.test.mjs\`: forged JWT, expiry, user-provided plan claims, paid resource denial, CORS, method restrictions, and missing backend tests.

**No premium files have been moved to private storage. Existing GitHub Pages HTML/JS/JSON is public and must be treated as public.** A browser-side plan menu is NOT a paywall. Never reclassify already exposed data as secure simply by hiding navigation, using query strings or marking JSON as Pro.

## Technical architecture

\`GitHub Pages/Open\` → \`membership marketing page\` → **future** \`Supabase Auth\` (actual login, email verification, password recovery) → \`private API on Cloudflare Workers\` → \`D1 server-owned subscription entitlements\` → \`R2 private analytical content\`.

R2 objects used by the Worker are illustrative allowlisted keys:
- \`pro/province-research.json\`
- \`pro/scenario-workbook.csv\`
- \`enterprise/institutional-brief.json\`

None exists until SLI publishes and licenses original private research. Nothing in public \`data/\` is protected by this API.

## Steps for production activation (explicit human/admin operations)

1. Confirm the NIB/KBLI and PSE status, domain and legal terms, privacy policy, account/data retention policy, consumer refund and cancellation flow, payment processor eligibility, source licensing, and records for enterprise data rights.
2. Pick production domain (e.g. \`https://strategiclatitude.example\`; replace with an actually controlled domain), cloud/identity provider, and payment gateway. Set prices/currencies/billing cycles and approve them before checkout is enabled.
3. Create separate **staging** Supabase Auth project, use supported **asymmetric JWT signing keys** (ES256 or RS256) so the JWKS endpoint exposes verifiable public keys. Configure email sender, Site URL and only trusted allowed redirect URLs; enable rate limits and anti-abuse controls.
4. Create private Cloudflare D1 and R2 resources in a Cloudflare account; **disable R2 public URL access**. Run \`membership-api/schema.sql\` migrations against the intended environment; review backups and incident response.
5. Copy \`membership-api/wrangler.toml.example\` to \`membership-api/wrangler.toml\` locally, replace placeholders with actual D1 ID, R2 name, WEB_ORIGIN and project URL; test staging with \`npx wrangler dev\` before production. Do not commit any secrets or subscriber records.
6. Configure Cloudflare DNS/domain, TLS, CORS and production rate limits. Do not use a public bucket URL for premium assets. Require expiry, signature, issuer, audience and status validation for **every protected request**. Rotate/revoke keys and maintain audit logs.
7. Choose a compliant payment provider and implement **its signed server-to-server webhook** with idempotency, event replay handling, payment-to-entitlement mapping, subscription termination/refunds and reconciliation. Customer-controlled browser claims or success-page redirects must NEVER grant Pro access.
8. Build/login and account management UI only after server services are actually configured and tested. Provide user-facing privacy/terms, account deletion, invoice and subscription cancellation controls. Test production-to-staging isolation, expired tokens, revoked access, payment reversal, and team-seat authorization.
9. Migrate **only legally reusable, SLI-owned or licensed exclusive analyses** into the private bucket and remove any public copies; confirm protected URLs deny unauthenticated reads. Do not migrate primary-source citations or generic statistical definitions behind a paywall.
10. Enable checkout only after end-to-end security/compliance QA and a payment provider integration have passed; then change the catalog state in \`data/sli-membership-plans.json\`.

## Running prototype tests

From repo root with Node.js 22+:
\`\`\`bash
node --test membership-api/tests/auth.test.mjs tests/qa-sli-membership.mjs
\`\`\`

This checks implementation invariants **offline**; it does not simulate a real Supabase/Cloudflare deployment or prove billing compliance. Any future change to plan status must include backend entitlement tests, not just the public pricing page.

## Updated tier and delivery policy (17 October 2026)

- **Open:** selected Overview indicator cards; selected sector snapshots; limited Strategic Map layers/sample assets; news headline samples (maximum five); no complete in-app national history, asset intelligence, sector archives, premium analysis or bulk export. Public-source original websites still retain their own access terms.
- **Pro:** full permitted SLI national and sector explorers; detailed Strategic Map; full curated sector monitoring and archives; 38-province comparisons, validated scenario/econometric modules as released, advanced export, original SLI analytical briefs. Single personal account/active registered device once login launches.
- **Enterprise:** all Pro capabilities, planned named-seat team workspaces, special contracted research and consulting, weekly sector-specific monitoring reports with bespoke analysis, risk/opportunity assessment, scenarios and action recommendations. Weekly delivery must be specifically stated in the signed contract; no automated weekly task or email delivery is presently running. Any datasets follow reuse/licence rights, seat count and redistribution terms.
- **Advice scope:** tailored energy/technology/industrial/policy and strategic investment intelligence within the agreed scope is distinct from regulated personalised securities/financial investment advice requiring proper authorisation.
- **Privacy-first access design:** future server-side session/device registry with a revocable opaque registered-device identity, one active registration for Open and Pro; revoke prior session upon approved replacement, rate-limit switching, allow account recovery and appeals. A per-browser UI toggle or IP match does not enforce this.
- **Current limitation:** GitHub Pages files already published in the public repo remain accessible even if a future Open menu visually truncates them. Do not describe any full national data/map/news archive as protected until rights-compliant private migration, authorisation checks and anonymous access tests pass.

## Controls and principles

- Anonymous visitors = landing page and publicly published preview material. **After authentication rollout**, Open = free verified personal account limited to one active registered device; Pro = paid personal account limited to one active registered device. These device limits are planned only and are **not enforced today**. No covert fingerprinting; provide a secure revoke/replace-device mechanism. Enterprise seats/workspaces are per signed contract.
- Pro/Enterprise = never infer access from a localStorage flag, \`data-plan\` attribute, JWT self-reported \`plan\` claim, or unverified payment callback.
- Prices/discounts/checkout = **disabled until business owner approves figures and provider**.
- Enterprise agreements specify named legal contracting entity, number of seats, permitted redistribution and dataset rights.
- User credentials/payment card data never stored in this repo; processor and identity provider own sensitive flows.
