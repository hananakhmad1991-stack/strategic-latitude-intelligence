# SLI account, entitlement and billing rollout (not deployed)

Plans: Open free/no export; Professional Rp249,000 per month, 1 concurrent session; Intelligence Pro Rp749,000 per month, 3 concurrent sessions for one user (not shared seats); Enterprise custom team contract (example limit 10 must be configured per contract). Server-side feature grants are in access.mjs.

**Identity:** Keep verified Supabase JWT (membership-api/src/index.js); never accept plan from browser/localStorage. **Sessions:** issue opaque random session tokens after verifying JWT; hash at rest; all privileged requests must verify JWT + session. Downgrade restricts current sessions; clients should list and revoke sessions, or end the oldest upon explicit customer confirmation. Never treat IP address as a device identity.

**Payment:** No checkout yet. Select licensed Indonesian payment provider, verify provider's actual callbacks in a private server-to-server adapter, map provider customer/order to verified internal user, confirm settled amount and currency and plan, handle refund/chargeback, then send HMAC(timestamp + '.' + raw JSON) internal event. Require replay defense and exact event idempotency. **Never** rely on browser return URLs to grant access.

**Webhooks:** billing.mjs is a guarded internal adapter primitive, NOT a provider-specific webhook endpoint. Keep billing secrets only in Workers secrets. Avoid event ordering regressions: a real integration must add a monotonic subscription version / provider effective timestamp and reject stale events before enabling.

**D1:** Review/execute migration 0002 in staging, test atomic batch and SQLite trigger concurrency. Existing schema.sql needs plan CHECK extended to intelligence_pro in a database rebuild migration before plan enrollment; do not attempt production migration as-is. Audit backup/restore first.

**Acceptance not yet met:** wire endpoints into Worker; configure authorized identity + provider merchant; implement provider-specific signatures and lifecycle; add cancellation/refund tests and concurrency integration tests; configure domain/rate limiting; production QA, legal/PDP/PSE, merchant agreement, rollback and signoff. No live billing or public checkout in this PR.
