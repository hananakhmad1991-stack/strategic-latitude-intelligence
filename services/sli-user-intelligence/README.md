# SLI User Intelligence — Private Backend (Deployment Gated)

**Status:** Source code and security tests only. This does **not** mean Cloudflare resources, Access policies, live inbox delivery, push, or email have been deployed.

## Architecture

- **Frontend:** SLI GitHub Pages, opt-in account panel. Public client configuration at `config/sli-user-intelligence.json` remains `enabled: false`.
- **Authentication:** separate Cloudflare Access-protected Worker custom hostname; each JWT's RS256 signature, issuer, audience and expiry are verified at the Worker. Never trust an unsigned email/user header or page membership labels.
- **Personal storage:** private Cloudflare D1, keyed by a SHA-256 pseudonymous Access identity. No passwords, emails or tokens are written to the public GitHub repository.
- **Delivery:** Worker cron checks public, source-attributed Catalyst v2 ledger every 15 minutes and fans out new records to enrolled private inboxes only. The **first successful cron establishes a baseline** and sends **no historical alert flood**.
- **Evidence:** matching a documented issuer in a signal is direct; sector-only matching requires separate explicit opt-in to the particular sector. No equity inference, market forecast or investment recommendations.
- **Channels:** authenticated in-app inbox only. No email or true push is configured.
- **Capacity policy:** maximum 200 enrolled profiles processed by one cron iteration and up to 24 new events; beyond this, cron emits a detectable error rather than marking incompletely delivered events as processed. Implement D1 pagination/Queues before scaling.

## Owner-controlled activation — not automated by a GitHub merge

1. Create a **separate** Cloudflare Access application for a Worker custom domain (do not reuse an owner-only Research AI test policy as a production subscription identity). Deny public access, require the intended authenticated users, and collect its AUD and team domain.
2. Create a private D1 database with `npx wrangler d1 create sli-user-intelligence`. Update `wrangler.toml` with the returned database ID. Apply schema by running `npx wrangler d1 migrations apply sli-user-intelligence --remote` from this service directory.
3. Set `CF_ACCESS_ISSUER` to `https://YOUR-TEAM.cloudflareaccess.com` and `CF_ACCESS_AUD` to the specific Access application AUD using Wrangler environment configuration/secrets. Keep the exact `CF_ALLOWED_ORIGIN` equal to `https://hananakhmad1991-stack.github.io`.
4. Configure the Worker custom hostname/route and protect **that exact hostname/path** by the Access application. Keep `workers_dev = false`; do not leave a bypass route or an unprotected development subdomain.
5. Deploy with `npx wrangler deploy` **only after** confirming the Access gate and D1 migration, then check from an authenticated user session: `GET /api/me`, `PUT /api/preferences`, `GET /api/inbox`, cross-user isolation, invalid-origin/unauthenticated rejection, and cron first-baseline behavior.
6. Update `config/sli-user-intelligence.json` only once tests pass: `{"enabled":true,"api_base":"https://THE-PROTECTED-API-DOMAIN","login_url":"https://THE-PROTECTED-API-DOMAIN/api/me"}`. This is public routing metadata only; **never** put secrets or Access tokens into that JSON.
7. Verify cross-origin cookie/session behavior from the actual GitHub Pages domain using two browsers/accounts. Some browsers restrict cross-site Access cookies; if so, use a same-site custom SLI domain or adjust the deployment architecture, not insecure CORS.
8. Watch the first 2 scheduled executions and confirm D1 rows increase only for new source-dated Catalyst events. Keep feature disabled if anything cannot be verified.

## API

| Route | Operation |
| --- | --- |
| `GET /api/me` | Verify Access identity and inspect enrollment |
| `GET /api/preferences` | Read current user's watchlist and preferences |
| `PUT /api/preferences` | Explicitly enroll and replace current user's preferences |
| `GET /api/inbox?limit=20&offset=0` | Page through **own** inbox |
| `POST /api/inbox/read` | Mark **own** notification IDs read |
| `DELETE /api/me` | Remove this user's preferences and private inbox |

All endpoints other than CORS preflight require a cryptographically verified Access JWT and a D1 binding. Mutation requests require an exact allowlisted Origin. JSON bodies are size-limited and validated. No email/push endpoint exists. Identity `sub` is never accepted from request body.

## QA

```sh
node --test tests/*.test.mjs
python tests/test_migration.py
```

CI checks authentication, D1 schema, cross-user access, no-old-events activation, idempotent delivery, strict source-issuer matching, and the disabled production feature flag.

## Next operational phases

Cloudflare D1 Queues/batched fanout for larger audiences; real authenticated member plans/entitlements; email opt-in with verified address and unsubscribe; Web Push subscriptions/service-worker infrastructure; rate limiting and audit logging; retention and data-export tools. Do not claim these are enabled because of this commit.
