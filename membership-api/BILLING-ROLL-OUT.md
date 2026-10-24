# SLI Membership / Subscription / Billing deployment gate

## Implemented in PR #236
- Verified Supabase asymmetric JWT identity (pre-existing).
- Membership Worker session routes: `POST /v1/sessions`, `POST /v1/sessions/replace` (explicit opt-in), `DELETE /v1/sessions/current`, `GET /v1/me`.
- Protected R2 downloads require BOTH signed account JWT and a valid server-issued revocable session.
- Server-side entitlement hierarchy: Open, Professional (`pro`), Intelligence Pro, Enterprise. Professional = 1 session. Intelligence Pro = 3 concurrent sessions (same identity). Enterprise = one concurrent session **per named seat** until contract rules are built; multiple people must have separate accounts.
- Cloudflare D1 0001/0002 migrations retain existing subscriptions, add Intelligence Pro, session-registry SQL trigger and billing event audit.
- An internal signed billing event adapter accepts activation, renewal, cancellation, expiration, refund and chargeback **only** if staging explicitly enables it. No public checkout.
- Signed callback freshness, HMAC verification, transactional replay handling, monotonic last-event timestamp, no browser-chosen plan or session.
- Offline Node JWT/session/billing tests and Python SQLite migrations. See SLI Membership & Secure Access QA.

## Operational boundaries
- **Not commercial production**: Repository public HTML/JS remains public regardless of plan. Truly premium assets must move to private R2 and pass license audits.
- **Preview staging**: `.github/workflows/sli-membership-staging.yml` deploys `sli-membership-staging` only as intentionally fail-closed (NO D1, Supabase, R2, billing). It checks health 200, customer endpoints 503 and billing 503. If Cloudflare credentials are absent it skips.
- **Integrated staging**: `.github/workflows/sli-membership-integration-staging.yml` requires distinct staging Supabase Auth, D1, R2 and the trusted website origin as protected secrets. CI first tests auth/SQL and validates JWKS, then applies D1 migrations remotely, deploys a separate `sli-membership-integration-stage` Worker and checks unauthorized 401 and billing 503.
- **Billing webhook live**: Disabled by design. `/v1/billing/internal-event` is an adapter-internal contract, **NOT** a Midtrans, Xendit or other payment-provider signed webhook. Its staging signature can be used for synthetic tests only after a trusted provider adapter is implemented; do not expose it without a validated merchant mapping, settlement reconciliation, user consent and secret storage.
- Plan prices agreed for future onboarding: Professional IDR 249,000/month, Intelligence Pro IDR 749,000/month, Open free, Enterprise custom. The catalog and checkout remain prelaunch until compliant merchant approval.

## GitHub Actions secrets needed for integrated staging
1. `CLOUDFLARE_API_TOKEN` (scoped to Workers, isolated staging D1 and R2, no account-global unnecessary permissions)
2. `CLOUDFLARE_ACCOUNT_ID`
3. `SLI_MEMBERSHIP_STAGING_D1_ID` — UUID of isolated staging D1. Do not reuse production.
4. `SLI_MEMBERSHIP_STAGING_BUCKET` — existing PRIVATE staging R2 bucket name with public endpoint disabled
5. `SLI_SUPABASE_STAGING_URL` — actual staging Supabase URL with RS256/ES256 JWKS and verified email/auth configuration
6. `SLI_MEMBERSHIP_STAGING_ORIGIN` — controlled HTTPS site origin exactly matching the browser's Origin

All secrets go into protected GitHub Actions secrets/environment, **never commit tokens, merchant credentials, customer identities or callback payloads**. Verify rate-limiting quotas and D1 snapshots before deployment.

## Definition of real ready-to-accept-payments
- Login from the real customer UI via real Supabase email authentication and recovery, safe token lifecycle, per-account session replace/revoke + cross-device reauthentication; real remote 1- and 3-session tests.
- PSE/PDP, privacy notices, data deletion/export, paid terms/refunds/invoice policies, private R2 rights and strict web origins approved.
- Pick and onboard licensed payment provider; build provider-specific signature verification, **server-side** order/customer/amount mapping, subscriptions, taxes/fees, webhook signature/replay/version tests, accepted payment/refund/chargeback/failed payment scenarios.
- Perform live **sandbox** provider checkout events, payment settlement reconciliation, both successful and abusive cases, and error monitoring.
- Confirm migration and rollback from a staging backup, DNS/TLS, customer support/contact and explicit production go/no-go.

Until every gate is met, keep customer registration and payment routes disabled. Green CI and a fail-closed staging Worker are not commercial authorization.
