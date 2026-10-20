# SLI information architecture and editorial ownership — 20 October 2026

## Purpose
Maintain one discoverable location for each SLI public function without erasing original datasets, removing deep links, or claiming that visually similar measurements are interchangeable. The **shared masthead Explore Data** is the only sitewide module chooser. Home is the short executive entry point; Full Overview is the expanded analytic view; the individual modules are evidence owners. Source-library URLs remain stable **evidence details/archives**, never a competing top-level sector.

### Seven visible topic families
| Canonical category (EN / ID) | Owns the following user tasks and canonical pages |
|---|---|
| Start & research tools / Mulai & perangkat riset | Full Overview (`index.html#overview`), cross-source Decision Terminal, limited owner-test DERGUBA AI, user guide, membership. Specialist: research evidence preview, attributed food/minerals monitoring |
| Economy, investment & regions / Ekonomi, investasi & daerah | Macroeconomy, Investment Tracker (`index.html#investment`), Entity Intelligence, provincial dossiers, provincial comparison/stress, Gini, investor/scenario labs. Specialist: investment navigator |
| Energy, minerals & trade / Energi, mineral & perdagangan | Energy Security overview (`index.html#energy`), official PLN statistics, RUPTL planned power investment, Critical Minerals overview (`index.html#minerals`), Trade Flows, Strategic Map. Specialist: regional PLN baseline, original RUPTL source inventory, investor digitization |
| Food & agriculture / Pangan & pertanian | Food & Agriculture Intelligence; cross-sector attributed monitoring is linked from Start & tools but this food dashboard remains the sector's substantive home |
| AI & digital transformation / AI & transformasi digital | AI Infrastructure overview (`index.html#ai`), detailed AI Intelligence Hub, Komdigi connectivity, digital-economy readiness and public digital governance. Eight power/investor/compute/source specialist pages belong here, not a new top-level category |
| Policy, geopolitics & environment / Kebijakan, geopolitik & lingkungan | Policy & Regulation overview (`index.html#policy`), Regulatory Instruments & Institutions (`policy-regulatory-intelligence.html`), Geopolitical Intelligence (`index.html#geopolitics`), Indonesia domestic/regional intelligence, Climate & Environment. Specialist: policy impact evaluation and sector RIA |
| Reference & quality / Referensi & kualitas | Canonical glossary/methodology, data freshness/QA. Specialist: Atlas of 49 research methods |

### Rules for ambiguous names and apparent duplicates
1. **Home vs Full Overview:** two depths of the same story, but *one* Explore Data control in the shared masthead. No additional homepage/secondary "Explore" dropdown.
2. **AI Infrastructure vs AI Intelligence Hub:** first is the executive sector overview; second owns sourced projects, GPU/compute, grid readiness and specialist material. Do not delete either or repeat its original numeric evidence as an independent total.
3. **Policy overview vs Regulatory Instruments:** policy implications/interpretation vs instrument-specific legal records and institutional execution. Citation and legal force must be established from primary JDIH/peraturan.go.id records; one title does not validate the other's content.
4. **Provincial dossiers vs provincial opportunity model vs Gini:** evidence at provincial unit vs conditional scenario vs a specific expenditure-inequality metric; do not substitute one for the other.
5. **Energy overview vs PLN statistics vs RUPTL:** policy/security synthesis vs measured electricity statistics vs planned investment pipeline. Proposed MW is not generation or a commissioned plant.
6. **Entity Intelligence vs an issuer detail:** browse people/organisations and links vs ticker-specific listed-company detail. The ticker detail URL (`sli-issuer.html?ticker=...`) is dynamic, so it is reached from an exact issuer, not a generic top-level module. Remove redundant breadcrumb links that point to the same Home URL.
7. **Data Library:** data is linked directly under Macro (`#socio`), Policy (`#governance`), Domestic Intelligence (`#security`), Minerals (`#minerals`), Energy (`#power` and `#ruptl`), AI Hub (`#ai-reports`) and Environment (`#environment`, `#disasters`). Historical bare `sli-sector-data-library.html` continues to serve the source archive. A source may be relevant to more than one analysis, but must not be counted twice.
8. **News and Catalyst leads:** attributable reporting/monitoring, never promoted to a verified project, actual investment, legal force, or incident without independent primary confirmation.

### Route ownership coverage
- The public root currently has **44 HTML files** (20 October 2026 review). **42** are referenced by the canonical shared architecture; the other **two** have intentional special roles:
  - `sli-issuer.html`: dynamic, ticker-parameterized detail reachable through Entity Intelligence, IDX Watchlist and Decision Terminal.
  - `sli-user-intelligence-qa.html`: `noindex,nofollow` private-account connection test; **not** a public research category or access gate.
- `sli-methodology-models.html` (Atlas of 49 methods) and `sli-sector-news.html` (food/minerals media monitoring) were assigned to topic families after the route inventory.
- Root file lists are **routes, not validated publications**. Internal source completeness, operational readiness, live legal status, all citations and all client/device render states require their own acceptance checks.

### UX and QA acceptance rules
- A reader can use **Explore Data → topical category → dashboard** in approximately three click actions. Specialist URLs are in that same topic's expanded list, not in a separate set of peer categories.
- A topic can be expanded/collapsed using keyboard and touch; the menu scrolls within the measured masthead offset on desktop/mobile; Escape closes the entire menu.
- Navigation labels have reviewed Indonesian and English alternatives; the homepage's card names should match its destination and distinguish overview from detail.
- Every primary module destination must exist, every core group membership be unique, and all 42 public static routes remain discoverable. No unapproved deletion, merged numeric series, silent redirect, category duplication, or hallucinated missing value.
- Run Node/JS integrity, sitewide functional QA, Indonesian QA and real Chromium interaction QA. Passing a code test is **not** proof that all browser states, markets, claims, PDF graphics or user exports have been manually validated.

### Follow-up editorial work (not represented as complete)
- Remaining translation and editorial consistency: GitHub issue #46.
- Source-level numerical completion and RUPTL annex/environment gaps: issue #66.
- Province-wide regulatory lifecycle / Perda primary-document coverage: issues #37 and #44.
- Official IDX issuer census and corporate hierarchy reconciliation: issue #36.
- Sensitive/private owner-test access, legally bounded AI research and external-source reliability are governed by their dedicated security/acceptance workflows.

**Change rule:** Add features to their existing topic when possible. Add a new top-level category only when its substantive research task, canonical source register and distinct audience navigation justify it. Never duplicate datasets, monitoring conclusions or project stages merely to fill a dashboard card.
