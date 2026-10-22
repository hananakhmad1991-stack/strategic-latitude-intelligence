# DERGUBA — Pro/Enterprise Commercial Release Gates

**Status at 22 October 2026: NOT APPROVED.** This checklist is independent of the successful Owner-only Cloudflare live acceptance (8/8) and synthetic browser-rendered PDF/Word QA. **Do not turn on** `api_enabled` or `login_enabled`, deploy a customer Worker, advertise paying plans, or start taking subscriptions merely because these staging checks passed.

The machine-readable register is `data/derguba-commercial-launch-gates.json`; `node scripts/check-derguba-commercial-launch.mjs` reports outstanding items. A green *safety gate* CI means forbidden public activation is blocked, **not** commercial approval.

## 1. Data-rights register — per publisher AND acquisition method

Maintain a spreadsheet or equivalent audit ledger for each SLI dataset: source title/publisher, original URL, document version/date, method (manual data, PDF extraction, downloaded CSV, API, logged-in SSO), contractual restrictions, applicable terms URL + retrieval date, actual attribution strings visible on a customer-facing page, permitted redistribution/derivation, numeric QA, human reviewer and decision. **No blanket whitelist by publisher.**

Important correction: [BPS's own website terms](https://www.bps.go.id/id/term-of-use) section 13 expressly cover **commercial as well as non-commercial** use of website content, copying/redistribution, subject to their stated conditions. They require credit with the content's title, access date, author (if available), and **direct original link**, plus no false implication of endorsement. It is therefore inaccurate to claim that *all* BPS website content automatically needs a separate written commercial license. However:
- The **BPS SSO PST** has its own [terms](https://sso-pst.bps.go.id/terms-of-use), including tighter restrictions on access credentials, tokens and commercial redistribution/access. A license to content on the main BPS site is **not** a license to resell a logged-in SSO session, tokens, SSO API access, protected data, or third-party material.
- BPS terms may change; datasets containing embedded third-party content and other publishers may have exceptions. Record which terms governed the exact *source and acquisition channel* at the time.
- An allowed license does not make automatically extracted PDF cells statistically correct. Keep the pending BPS per-cell numerical verification and attribution issues independent.

**Acceptance:** A dataset-specific ledger, stored consent/contract where necessary, source credits in actual UI and exports, and a documented decision by a person authorized to review reuse rights. Confirm the BPS terms relevant to each acquisition mechanism before sign-off.

## 2. Operational registration and legal presence

Owner reports that NIB already exists. **Do not ask for another NIB**. Check the relevant KBLI/activities, commercial domain, actual hosting/data locations, legal entity/merchant profile and **TDPSE** status. The [Komdigi official PSE criteria](https://pse.komdigi.go.id/panduan/kriteria-pendaftaran-pse-lingkup-privat) explicitly list paid digital contents and several online services; the [official PSE FAQ](https://pse.komdigi.go.id/pertanyaan-umum) describes OSS registration and supporting system information. Assess exactly how SLI's services fit and record registration evidence. Keep website Terms of Service, Privacy Policy, consumer support and contact ready.

**Acceptance:** Registration record/confirmation where required, correct domain, merchant identity, personal-data processing description, legal/privacy notices and owner approval. This checklist is not legal advice.

## 3. Subscriber identity and data privacy

Implement customer identities separate from the Owner Test token, with least-privilege entitlements and tenant separation. Demonstrate expired/revoked session behavior, 401/403 denial, object-level authorization, scoped data access, rate and spending quotas per subscriber, request logs **without credentials or unnecessary uploaded documents**, incident response, deletion requests, user-facing privacy notices and retention periods. Run test accounts from two different tenants and prove no cross-tenant report/chart or file leakage.

**Acceptance:** Recorded test cases, production secret manager review, backup/restore/rollback and independent security review. Existing Owner 401/403 alone is insufficient.

## 4. Reliability and cost containment

Audit per-account token and API spend, paid-provider retries, abnormal usage alerts, source outage fallbacks, safe model behavior under untrusted documents, publication and source locks, evidence provenance, export integrity, production rollback, and real browser checks for mobile/desktop. Confirm that law-article structural absence isn't mistaken for operative 2026 consolidated law.

**Acceptance:** Evidence-backed controlled tests with defined spend and abuse thresholds, incident runbook and named maintainers.

## 5. Payments through an authorized provider

Do not implement a self-operated wallet/acquiring/PJP. Use a suitable payment service provider whose relevant activity is licensed/authorized by Bank Indonesia and confirm merchant onboarding. BI describes PJP activities in [PBI 23/6/PBI/2021](https://www.bi.go.id/id/publikasi/peraturan/Pages/PBI_230621.aspx) and [payments licensing](https://www.bi.go.id/id/fungsi-utama/sistem-pembayaran/perizinan/default.aspx).

In a provider sandbox test: verified payment callback signature, webhook replay/idempotency, spoofed webhook rejection, asynchronous settlement, invoice generation, VAT/tax handling, failed payment, duplicate/cancel/refund events, chargebacks, ledger reconciliation and subscriber entitlement revocation. **Never unlock PRO from an unauthenticated browser callback or a payment “success” URL alone.** Do not store customers' full payment card details or bank credentials within SLI.

**Acceptance:** Provider identity/status evidence, merchant agreement, end-to-end signed sandbox payment with receipts and reversal tests, owner-approved prices/tax/refund policy and secured production credentials.

## 6. Source-supported live answer and exports

The actual 8/8 live response that passed the Owner test was not previously captured. Use the **explicit private local** `node scripts/qa-owner-staging-live.mjs --include-paid-model --save-private-report` once with an owner-only token in an environment variable, then verify every `C###` sentence against the original Pasal 1 source and operative amendments; inspect the actual PDF/Word output. This uses a new paid model call and is opt-in, never CI.

**Acceptance:** Redacted human review record with each factual/legal claim supported, contradicted or qualified, specific original PDF page, export screenshots, and independent current-law caveats.

## 7. Manual go/no-go decision

When **all** seven gates in `data/derguba-commercial-launch-gates.json` have named reviewers, dated source-linked evidence and documented approval, conduct a separate release review. The registry records evidence but does **not** itself authorize deployment; no script may activate customer API or login. Owner signs off separately on the exact production SHA, domain, rates, release date, rollback contact, and legal/customer policy.

**Current decision:** BLOCKED for paid customers. Owner Research AI can continue private staging safely.
