# SLI release gate — unified workspace (22 October 2026)

**Scope:** Draft PR #197. This document is a gate checklist, not a publication claim.

## 1. Cloudflare failure isolation
- Cloudflare automatic **Workers Builds** for `sli-research-owner-test` is failing.
- Independent GitHub offline `esbuild` on `research-api/src/owner-test-worker.mjs` passed (run 39784598650). Therefore the error is **not established as a Worker source syntax/bundling error**.
- The real Cloudflare log, root-directory/build command, Wrangler config path, install command, and inherited build environment need inspection inside Cloudflare. The GitHub check exposes a private Cloudflare build URL but not its diagnostic log.
- The owner staging code lives in `research-api/src/owner-test-worker.mjs`; the dedicated GitHub deployment workflow uses `research-api/wrangler.owner-test.toml.example`, deliberately deploys only when `deploy-owner-staging` is explicitly selected, and validates a 401 response. Avoid using this command as a workaround for failed Cloudflare builds.
- Verify that Cloudflare repository automatic deployment is not pointed at the full static-site root without the intended Worker config. Compare base directory, Wrangler path, install dependencies and supported Node version with the controlled staging workflow.
- Do not copy the owner token, provider secrets, or Cloudflare API key into public files, logs or dashboard frontend. Do not mark the owner pilot commercial-ready based on a successful bundle.

## 2. Task-first UX and staged panel simplification
- First-screen priorities: bilingual identity; four research entry paths; dated national indicators; maps and sector entry. Specialist IDX and issuer functionality remains intact.
- Shared navigation offers sector → region → company/actor → source evidence → DERGUBA.
- DO NOT hide embedded provider widgets inside closed `<details>` by default without an explicit lazy-init/resizing contract. Widgets embedded into a hidden container may initialize at zero width.
- Existing detailed chart panels should be collapsed only through a dedicated controlled component with an accessible expanded state, deferred mounting, and independent mobile screenshots. A text-only `<details>` does not count.

## 3. Source ledger and missing-data discipline
- `node scripts/audit-sli-source-visibility.mjs` generates `artifacts/sli-data-visibility-ledger.json`. Categories distinguish file presence from partial dataset coverage and from full source verification.
- The existing 13-family inventory is **not an exhaustive archive of user-provided datasets**.
- Each proposed numerical public chart must record publisher, primary URL, observation period, unit, geography, extraction/validation status, license and caveat. A file existing is not sufficient proof of accurate content.
- Existing risk cases requiring specific follow-up: partially digitized PLN RUPTL project annexes, incomplete ESDM report digitization, partial environmental source series, and BNPB national/provincial discrepancy. Separate IDX owner/concession claims from verified public facts and never auto-fill N/A values.
- Preserve source discrepancies in the public QA notes; never adjust original numbers to force a match.

## 4. Merge rules
- Draft PR remains blocked while required CI or Cloudflare build fails, or mobile/desktop evidence is incomplete.
- Run a browser walkthrough covering Home → Sector → Province → Entity → Original source → DERGUBA navigation, test 360 px/390 px and desktop, check keyboard navigation and third-party widgets.
- Treat DERGUBA live authenticated answer/source validation, customer payments, PSE and licensing as independent release gates; merging a UI PR is not commercial launch authorization.
