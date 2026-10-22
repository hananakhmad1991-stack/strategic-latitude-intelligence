# SLI Expert Desk — Owner-Private Request Queue (not deployed)

This is the optional **next phase** after the public Expert Connect draft form in PR #209. Its purpose is to let the **owner manually register an inquiry received through email**, evaluate expert-sourcing requirements and track the agreed engagement. It is NOT a customer submission API, contact directory or booking system.

## Deployment status / failsafe
- Source code and CI only. There is **no active Worker route**, no D1 database ID, no web-to-API submission from GitHub Pages and no public invitation to enter confidential data.
- The Worker is **disabled by default** unless the explicit environment switch \`CF_EXPERT_DESK_ENABLED=true\` is configured *after* legal, security, privacy and owner review.
- \`workers_dev=false\`, no \`routes\` setting and **no automated deployment workflow**. Never activate through a normal repository push.
- Do not reuse the existing \`sli-research-owner-test\` Cloudflare Worker, its Access application or D1 database. Owner queue is a separate, least-privileged service.
- Even after server-side deployment, the public Expert Connect pilot remains a copyable, editable email draft. A request is not received until a person actually sends it. Owner manually records it **with appropriate handling and consent**, not by silently copying chat text or hidden form fields.

## Security architecture
Authentication is mandatory Cloudflare Worker-level Access using the verified \`ctx.access\` identity helper from the private SLI User Intelligence service. The app audience and issuer must match; service tokens and forged email/JWT headers are not accepted. Identity is a hashed Access UUID. Additionally \`CF_OWNER_USER_HASH\` must be the exact known 64-character hash for the authorized owner.

All mutations demand the exact \`Origin\` specified by \`CF_ALLOWED_ORIGIN\`. A reflected/wildcard origin is forbidden. OPTIONS must be protected or explicitly narrowed in the Access app. Private D1 statements are prepared with bound values, JSON size is limited, list endpoints exclude full briefs and contact emails, and responses have no-store and anti-sniff headers. Each transition records a D1 audit event in an atomic batch. Conflicting versions return 409. DELETE erases the request and related history; production retention and backup deletion policy require separate review.

## Owner API (Access + owner hash required on ALL routes)

| Route | Purpose |
| --- | --- |
| \`GET /api/health\` | Protected readiness indicator only |
| \`GET /api/requests?status=&limit=&offset=\` | Metadata list without contact details |
| \`POST /api/requests\` | **Owner-only manual entry**; response includes recorded_by_owner:true and received:false |
| \`GET /api/requests/:uuid\` | Details + transition history |
| \`POST /api/requests/:uuid/status\` | Conditional audited state transition, version-checked |
| \`DELETE /api/requests/:uuid\` | Hard-delete owner-controlled record and history |

Transitions: New → Scoping → Sourcing → Shortlisted → Proposal Sent → Approved → In Progress → Delivered, plus allowed declined/cancelled branches. Sourcing → Shortlisted requires the owner to confirm **consent and screening**; Proposal Sent → Approved requires the owner to confirm **client approval**. Checkbox flags alone are not replacements for real records or contracts; retain supporting evidence in an appropriately protected workflow.

## Consent-based expert registry (private, no pre-enrolled claims)

A second D1 migration adds consenting expert profiles and request shortlists:
- POST /api/experts (Owner only): require explicit documented opt-in, date, consent reference, sector, expertise and experience; optional HTTPS public-profile URL and contact email. Does not publish or message the expert.
- GET /api/experts?sector=... (Owner only): minimal metadata list **without contact email**.
- GET /api/experts/:uuid (Owner only): inspect a protected private profile.
- DELETE /api/experts/:uuid (Owner only): delete candidate and related shortlist entries.
- GET /api/requests/:uuid/candidates (Owner only): see a request's screened candidate shortlist.
- POST /api/requests/:uuid/candidates (Owner only): require separate affirmative share permission, conflict check and availability confirmation plus a factual fit rationale; no automatic status update or client disclosure.

The schema and owner assertions cannot prove consent documents exist: the owner must obtain and retain proof privately outside this code before entering an expert. No contact is automatically stored or shown to clients, and sourcing may involve finding a new qualified expert for each client request.

## Future activation — manually gated
1. Conduct privacy/PDP review: lawful basis, retention, deletion/backup requests, contact and company privacy notice, consent records, third-party interviews and data location. Confirm PSE and organizational obligations.
2. Create an independent Cloudflare Access Worker application with **only the authorized owner**, exact audience/issuer, no bypass policy. Make sure the Worker context exposes \`ctx.access\`.
3. Create a **private** D1 database, apply \`migrations/0001_requests.sql\` in staging, verify foreign-key behavior and backups; replace placeholder ID only in a separately approved deployment config. Do not commit credentials.
4. Configure environment variables: \`CF_ACCESS_ISSUER\`, \`CF_ACCESS_AUD\`, \`CF_OWNER_USER_HASH\`, \`CF_ALLOWED_ORIGIN\`; keep \`CF_EXPERT_DESK_ENABLED\` absent until test evidence and deployment approval.
5. Manually verify authenticated owner, unauthenticated user, wrong owner, CORS rejection, ID version conflicts, D1 atomic audit, deletion and browser cookie behavior **on protected staging**.
6. Develop an authenticated owner console behind the same Access app. Do not allow public form submissions until spam/rate-limit protection, explicit privacy consent, acknowledgment only after durable storage, and user-facing retention/deletion controls have been separately implemented and approved.
7. No automatic client email, expert outreach, quotation, booking, billing or payment is provided. Human confirmation required for each.

## QA

Use Node 22+ and Python 3:

- \`node --check services/sli-expert-desk/src/index.mjs\`
- \`node --test services/sli-expert-desk/tests/owner-queue.test.mjs\`
- \`python3 services/sli-expert-desk/tests/test_schema.py\`

Run the dedicated \`SLI Expert Desk Private Owner Queue QA\` workflow. Checks run on pull requests and can be triggered manually, but no deployments are involved.

Related: issue #207, Expert Connect draft #209, parent UX draft #197, DERGUBA commercial readiness issue #206.
