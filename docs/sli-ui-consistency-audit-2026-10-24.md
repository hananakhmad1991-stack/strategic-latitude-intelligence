# SLI UI, localization and product release audit — 24 October 2026

## Scope and evidence
Code inspection of main-branch `index.html`, shared `js/sli-navigation.js`, Products, Privacy, Business Info, three Solutions pages, Membership, Company, Data Inventory and User Guide (12 files). Exact live browser access to https://strategiclatitude.co.id/ and the Products and Privacy URLs could not be established via available web verification. This is a **code audit**, not a completed visual or production acceptance test.

## Results
| Control | Finding | Status |
|---|---|---|
| Shared header referenced | All 11 sampled HTML entrypoints load shared navigation | PASS (source only) |
| Duplicate legacy header | Several pages still contain an old header, hidden by CSS; structurally duplicated | PARTIAL |
| EN/ID header control | Shared navigation renders language switch | PASS (source only) |
| EN/ID entire page content | Products and Privacy have explicit bilingual blocks; Business Info, Solutions, Company, Guide and Inventory do not have fully verified equivalent blocks | FAIL / incomplete |
| Products navigation | Dashboard links to `sli-products.html#dashboard`; Weekly Brief and Monitoring have separate catalog sections | PASS (source only) |
| Products anchor handling | Fixed repeated anchor jump on language toggle | FIXED in commit e499224 |
| Solutions distinction | Three separate service pages and links exist | PASS (source only) |
| Professional / Intelligence Pro brief and monitoring | Catalog describes planned entitlements and cadence; does not demonstrate live scheduler, subscriber delivery, notification or access enforcement | NOT RELEASE READY |
| Merchant terms, cancellation, refund | Present as public content in Business Info; final policy and checkout consistency need owner/legal review | PARTIAL |
| Production URL and mobile QA | HTTP access and 360/390px/desktop interaction unverified | BLOCKED |

## Release criteria
1. Translate complete substantive body content (not just header) in Business Info, Solutions, Company, Guide, Data Inventory and Membership with review against source-language meaning.
2. Replace hidden legacy headers with the one shared template; verify mobile overflow, dropdown focus/keyboard behavior and persistent EN/ID.
3. Test product-card anchors, return to dashboard, and the privacy rights contact route.
4. Test GitHub Pages latest deployment against commit SHA and verify the public domain without authentication.
5. Do not advertise brief/monitoring delivery or a paid access entitlement as active until subscriber authentication, scheduler, email delivery, source validation, authorization and webhook tests pass.
6. Review refund and privacy terms with actual operational practice before payment activation.

No merchant secret or customer information is included.
