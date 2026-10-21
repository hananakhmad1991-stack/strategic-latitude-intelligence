# SLI sector-first navigation migration — 21 October 2026

## Product decision
- The separate **Full Overview** page is retired because its three dynamic blocks and wayfinding duplicated Home or specialist dashboards.
- **Home** is the sole landing portal: national preview metrics, provider-owned IHSG chart, equity heatmap, IDX sector watchlist, issuer-monitoring headlines, sector cards and search.
- **Explore Data** remains the single shared dropdown for seven coherent topic families.
- Historical `index.html#overview` links are a compatibility alias, canonicalized to `index.html#home` using `history.replaceState`. They must not resurrect the old overview renderer.
- Existing sector source registries, datasets and visualizations remain intact. Do **not** rebuild a central index of duplicated metrics, graphs or news.

## Original Overview content → canonical evidence destination
| Retired Overview component | Destination | Retention / duplication rule |
| --- | --- | --- |
| Executive abstract + chapter buttons | Home / Explore Data | Removed as a second route; Home already owns cross-sector wayfinding |
| USD/IDR and IHSG KPI excerpt in Strategic Pulse | Home IHSG provider chart and Home national indicators; full monetary series in `indonesia-macroeconomic-intelligence.html` | Do not copy TradingView prices into SLI research data; keep provider delays and observations visible |
| BKPM PMA/PMDN realized investment KPI | `index.html#investment`, `indonesia-investment-navigator.html` | Reuse investment-evidence data, distinguish commitments from realizations |
| EBT mix, biodiesel and supply metrics | `index.html#energy` and existing energy modules | Retain source dates and historical/forecast distinctions |
| Palm levy/duty information | Investment and biofuels evidence modules | Do not double count taxes, export levies or biodiesel volume |
| Strategic Pulse daily editorial assessment | `index.html#energy`, already rendered by `js/daily-energy-assessment.js`; geopolitics is in `index.html#geopolitics` | No second syndicated assessment widget |
| Strategic Pulse source-attributed news leads | Existing Energy, Investment, AI, Geopolitics and sector-news monitors | Headlines remain unverified secondary leads |
| Eight-metric macro preview and JISDOR chart | `indonesia-macroeconomic-intelligence.html` | Specialist macro module already contains dated observations, history and visualizations |
| Whole-dashboard automation/freshness excerpt | `sli-data-automation-center.html` under Reference & Quality | Automation status has one canonical detailed dashboard |
| Hazard headlines and official warning shortcut | `climate-environment.html` | Retired hidden Overview-only hazard panel and unnecessary fetches; retain climate source modules |
| Cross-source BKPM, ESDM & IEA exploratory signals | Investment source bridge, Energy source bridge, AI research and source library | Reuse the specialist source-data-bridge scopes; no second cross-source graph |
| References, methodology, and user guidance | `sli-glossary-methodology.html` and `sli-user-guide.html` | Source/disclosure definitions not replicated inside every dashboard |

## Code and routing
- `index.html`: dropped `overview()`, related initialization and redundant portal CTA; preserves `homePortal()`, energy, investment, map, trade, minerals, AI, policy and geopolitics pages.
- `js/sli-navigation.js`: no primary Full Overview button and no duplicate Overview entry in Explore Data. Historical `modules.overview` is an invisible alias pointing to Home.
- `data/site-search-index.json`: reclassified 44 old Overview records by genuine topic and removed obsolete `sliPulse` search target. Direct macro/Gini/AI research deep links remain intact.
- `js/site-search.js`: removed Overview search scope and introduced Macroeconomy.
- `sli-user-guide.html`: direct navigation to Home and canonical sector pages.
- Keep `js/strategic-pulse.js` available as unmounted legacy research logic for compatibility testing, not as an additional user-facing dashboard.

## Acceptance criteria
- No visible “Full Overview” or duplicate chapter navigation.
- Home and `#overview` alias converge on the same Home portal and single Explore Data menu.
- Macroeconomic, investment, energy, AI, climate and data-freshness destinations remain discoverable.
- No orphaned search record points to a retired `sliPulse` anchor or `overview` page classification.
- Sitewide functional QA, Indonesian language QA, research dashboard QA, and browser interaction QA pass.
- Quotes, news and datasets retain original source/vintage disclaimers; missing data is never turned into zero.
