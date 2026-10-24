# SLI User Intelligence — Private Backend (Deployment Gated)

## Domain-free private pilot (supported; no custom domain purchase required)

Cloudflare supports securing a production `workers.dev` URL with an Access self-hosted application. The pilot may use **only** this exact form:

```text
sli-user-intelligence.<your-actual-cloudflare-account-subdomain>.workers.dev
```

For Worker-level Access applications (`destinations.type = worker`), the preflight also checks the immutable `worker_id` against the exact named Worker through the Cloudflare Workers Scripts Search API. A preview-only or unrelated Worker ID cannot pass the production check. The API token must have Worker scripts metadata read access.\n\nThe account subdomain is retrieved from Cloudflare at `GET /accounts/{account_id}/workers/subdomain`; **do not guess it** and do not substitute the hostname from an unrelated Worker. The deployment preflight verifies the suffix belongs to this Cloudflare account, checks the **exact** Access app audience and hostname (no wildcard or public bypass), credentialed CORS, Allow policies, and the D1 database. The generated deployment config enables the one production `workers.dev` route but disables Worker **preview URLs**. A custom domain is still preferred for a public paid SLI launch.

### Owner steps for domain-free pilot

1. In Cloudflare Workers, confirm your account's `workers.dev` subdomain. Enable Zero Trust in the Cloudflare account.
**Cloudflare Access CORS preflight choices (pick ONE):** On the SLI Access application open **Additional settings → Cross-Origin Resource Sharing (CORS)**. Easiest for the private Worker: enable **Bypass OPTIONS requests to origin** (Cloudflare application property `options_preflight_bypass=true`). This bypasses Access **only for OPTIONS**, not GET/PUT/POST/DELETE. SLI's Worker checks the exact GitHub Pages Origin itself and replies to OPTIONS; all actual user API requests remain Access + JWT protected. Alternatively, configure Access to answer preflights with **only** `https://hananakhmad1991-stack.github.io`, **Allow credentials**, methods **GET, PUT, POST, DELETE, OPTIONS** and **Content-Type** header. Do not set wildcard origins, add an Access Bypass policy, or combine the two OPTIONS modes. The preflight checks both modes against Cloudflare's API and continues to fail closed on misconfiguration. [Cloudflare official CORS guidance](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/cors/).

2. In Zero Trust → Access → Applications, configure a self-hosted application protecting the **exact anticipated** `sli-user-intelligence.<account-subdomain>.workers.dev` hostname. Create an Access group for the authorized pilot identities and make every Allow policy include only that group. Set credentialed CORS restricted to `https://hananakhmad1991-stack.github.io`, including the `Content-Type` preflight header and OPTIONS handling. Do **not** configure an Access Bypass policy for this API. Protect the production hostname before deployment.
3. Create a private D1 database `sli-user-intelligence`. Configure the **GitHub Actions environment** and credentials described below; for `SLI_API_HOSTNAME` use the exact `workers.dev` pilot host above, not a custom domain.
4. Run the manual Actions workflow with `mode=verify`. It performs read-only Cloudflare Access/D1 checks plus security tests. If it fails, do not deploy. Only after success, run `mode=deploy` with the explicit confirmation and any required environment-review approval.
5. Verify that unauthenticated requests cannot read user data. Test **Access login first on the target workers.dev site** and then try watchlist sync from GitHub Pages in a normal browser. Because this is cross-site, some browsers block the required `CF_Authorization` cookie. If that happens, keep the frontend account-sync flag disabled; **do not weaken authentication or make CORS permissive**.
6. Keep `config/sli-user-intelligence.json` disabled until two-account and cross-browser tests prove private inbox and sync really work. The scheduled backend may be tested independently of GitHub Pages login.

The pilot does not send email or Web Push and is not an official multi-user paid launch. For the final launch, buy or bring a brand domain and move the dashboard/API to same-site HTTPS hostnames as appropriate.

Official Cloudflare documentation:
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/cors/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/

**Status:** Source code and security tests only. This does **not** mean Cloudflare resources, Access policies, live inbox delivery, push, or email have been deployed.

## Worker-level Access runtime identity (October 2026)

On a direct Worker invocation protected by the `worker` destination, Cloudflare provides a trusted `ctx.access` object after the visitor authenticates. SLI now validates `ctx.access.aud` against its exact configured Access AUD and reads `ctx.access.getIdentity().user_uuid` to derive the same pseudonymous user key namespace; no untrusted client-provided identity headers, email, or unsigned JWT claims are accepted. A missing Access context, incorrect AUD, service token login, or missing stable UUID **fails closed**. This avoids the `Access key validation unavailable` runtime failure caused by fetching `/cdn-cgi/access/certs` from inside a Worker. See [Cloudflare Workers Access identity documentation](https://developers.cloudflare.com/workers/configuration/cloudflare-access/#read-authenticated-user-identity-with-ctxaccess).

**Boundary:** `ctx.access` is not passed through service bindings or static-asset router Workers. This service has no static asset router and its preflight confirms a Worker-level Access destination. If that architecture changes, revisit identity verification. The old remote JWT verifier remains as a helper for separately tested/explicitly controlled environments, but the deployed Worker uses only Cloudflare-attested `ctx.access`.

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

## Guided activation through GitHub Actions (added 20 Oct 2026)

The exact workflow is [SLI Private User Backend — Manual Cloudflare Activation](../../.github/workflows/sli-user-intelligence-activate.yml). It has **no push/schedule trigger**. It never deploys automatically on merge.

### Prerequisites that require the account owner

Configure the GitHub Actions **environment** `sli-user-intelligence-production` and preferably add required reviewers. In that environment supply two encrypted secrets: `SLI_CF_ACCOUNT_ID` and a restricted `SLI_CF_API_TOKEN` (Cloudflare Workers deploy, D1 read/write, Access Apps and Policies read for the same account). Add five environment variables: `SLI_ACCESS_ISSUER` (https://TEAM.cloudflareaccess.com), `SLI_ACCESS_AUD` (Access app audience), `SLI_API_HOSTNAME` (dedicated private hostname in a Cloudflare-managed zone), `SLI_D1_DATABASE_ID` (existing private D1 UUID), and `SLI_ACCESS_ALLOWED_GROUP_ID` (the exact Access group ID for authorized pilot identities). The preflight rejects broad or mismatched Allow policies. **Never paste these secrets into this repository, public issues, chat, or browser localStorage.**

1. In Cloudflare Zero Trust, create a separate **self-hosted Access application** for the exact API hostname with an Allow policy that includes only the configured authorized group. Set its ID as `SLI_ACCESS_ALLOWED_GROUP_ID` in the protected GitHub environment. Do not create a broad Everyone/domain Allow policy, Bypass policy, or public `/api` exception. Keep all `workers.dev` and preview URLs disabled. The runner verifies this via Cloudflare's Access API before any deployment.
2. Configure Access **CORS** for only `https://hananakhmad1991-stack.github.io`, allow credentialed requests, methods GET/PUT/POST/DELETE/OPTIONS, and header Content-Type. Configure either *Bypass OPTIONS requests to origin* or an equivalent Access-managed preflight response; the Worker itself already validates the allowed origin. See [Cloudflare Access CORS instructions](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/cors/). A preflight 403 will block cross-origin `PUT /api/preferences` regardless of a successful login.
3. Create the D1 database if not yet created. Use the real UUID in GitHub environment variables. GitHub runner will apply migrations only after the owner selects deploy; it will not automatically create accounts or production databases.
4. Open GitHub → **Actions** → **SLI Private User Backend — Manual Cloudflare Activation** → **Run workflow** with `mode=verify`. This makes read-only Cloudflare API calls and runs automated tests. It will fail closed if apps, CORS, bypass policies, or D1 IDs cannot be verified.
5. Only when verify is green, select `mode=deploy` and enter the exact confirmation `DEPLOY_PRIVATE_SLI`. With approval from the protected GitHub environment (if configured), this performs remote D1 migration, deploys the Worker on the configured **exact custom domain**, then checks that anonymous users are blocked and that Access CORS permits the GitHub Pages origin. No real API token is committed to code.
6. Keep `config/sli-user-intelligence.json` **disabled** after deployment until you complete live tests: sign in through Access, `GET /api/me`, save and retrieve watchlist from two devices, verify two distinct users' inbox isolation, mark notifications read, test logout/relogin, and verify Account DELETE. Confirm Chrome/Firefox/Safari cross-site cookie behavior. **A cross-origin Access cookie may be blocked by browser third-party-cookie policy**. Prefer a same-site SLI custom domain when needed rather than disabling auth or widening CORS.
7. Once all end-to-end tests pass, enable the static client with the approved protected hostname, with a new reviewed PR. Do not set `enabled=true` automatically from the deployment workflow. Recheck at least two scheduled deliveries and their error logs; the first cron pass only initializes the activation baseline.

### Operational boundaries

The *verify* mode only inspects Cloudflare account configuration and runs tests. *Deploy* changes the private Worker and D1, but never activates email/push or paid memberships, never publishes user data, and does not change the static client flag. A test green in GitHub Actions is **not** evidence that a customer's browser session, CORS cookie, or GitHub Pages deployment has been validated. The account owner controls Cloudflare tokens, DNS/Access policies, D1, and production approval.
