# SLI Expert CRM — staged, NOT DEPLOYED
The UI is publicly served by GitHub Pages and cannot securely write D1 by itself.
The schema in `research-api/migrations/0001_expert_crm.sql` is preparatory only.
Do not attach this database to a public unauthenticated Worker.

## Production acceptance gates
1. Create a *private* Cloudflare D1 staging database and apply the migration using trusted Wrangler/Cloudflare dashboard credentials.
2. Protect the CRM API with Cloudflare Access or a verified owner identity JWT, checked **server-side on every request**. Never embed credentials in frontend JavaScript.
3. Add authenticated routes for list/upsert/stage transition. Validate the exact OpenAlex ID format, cap request size, rate limit, log actor identity, and allowlist the SLI origin.
4. Only server-side owner-reviewed identity and affirmative consent can transition a candidate to `Confirmed`. Enforce database CHECK constraint, not just the UI.
5. Test no-auth 401/403, invalid stage rejection, duplicate upserts, author profile errors, CSRF defenses, and rollback before production access.
6. Keep client briefs, email addresses, contract notes and private contact data **out** of public Github Pages and public data JSON.
7. Rotate the previously exposed `OWNER_TEST_TOKEN` before expanding access; do not paste the replacement in chat.

## Author enrichment
The owner discovery UI v8 includes a public OpenAlex Author ID lookup showing indexed works/citations; these are not reliable competence scores or proof of consent. No private data is transmitted. Public API limits or CORS restrictions may affect browser access.

## Current capability
- Public scholarly search: evidenced functional by owner-submitted output.
- Author detail button: committed, awaiting browser acceptance test.
- Private D1 schema: committed, not applied or connected.
- CRM API/login/audit enforcement: NOT DEPLOYED.
