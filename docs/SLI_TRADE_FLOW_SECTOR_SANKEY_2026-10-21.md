# SLI Trade Flow · validated sector Sankey integration (21 October 2026)

## Ownership / anti-duplication
The canonical main entry is `index.html#trade` with sector lenses; Food and Marine dashboards link into it through `?trade=food#trade` and `?trade=marine#trade`. The 2025 minerals, LNG, oil/gas and electricity HS trade Sankey remains in `js/commodity-trade-flow.js`. Do not copy the existing whole-sector HEESI energy Sankey or planning visualizations here; link to them from the Energy lens.

## What has actually been published
| Lens | Dataset used | Source | Reference time | Sankey meaning | Not inferred |
| --- | --- | --- | --- | --- | --- |
| Minerals, oil/gas, cross-border electricity | `data/commodity-trade-flows.json` | Reported 2025 HS-by-partner commodity flows | 2025, FOB/CIF; selected products only | Indonesia → verified HS products → verified partner countries (with explicit other/unknown buckets) | Complete mining production; missing HS partners or 2026 physical flow |
| Food & Agriculture | `data/food-agriculture-2026.json`, `trade` only | Pusdatin Kementan, Statistik Terkini Ekonomi Pertanian, June 2026 publication | Jan–Apr 2026; source amounts **thousand USD** converted to million USD | Aggregate imports OR exports → published four agriculture subsectors → published fresh/processed forms | Country of origin/destination; HS, port, province; converting export dollar values to tonnage |
| Marine & Fisheries | `data/sli-marine-fisheries-trade-2025.json` | KKP Ditjen PDSPKP, official 16 Feb 2026 release: https://www.kkp.go.id/news/news-detail/produk-perikanan-indonesia-makin-bernilai-di-pasar-internasional-LvAA.html | Jan–Dec 2025; USD millions | Two **separate** national marginals: fisheries exports → top five partner groups **OR** fisheries exports → top five product groups | Products linked to destination partners; exact other-category balances; exact full-year total beyond rounded USD 6.27bn |
| Energy balance | `data/heesi-2025-integrated.json` | Kementerian ESDM, HEESI 2025, PDF printed pp 18–21, PDF pp 34–37 | Full-year 2025, **thousand BOE** | Existing source-owned Sankey `js/heesi-2025-dashboard.js` within `index.html#energy`: national balance stages and observed fuel-to-sector categories | Physical generation dispatch, transmission-level energy flows, inferred fuel transformation matrix |
| RUPTL | `data/sli-ruptl-esdm-2025-2034-period-plan.json` | ESDM PLN source presentation | Planned additional capacity 2025–2030 vs 2031–2034 in **GW** | Linked to `pln-ruptl-2025-2034-source-intelligence.html`; planning charts only | Current commissioning, individual project COD, actual energy or monetary trade flows |

## Marine KKP rows (national, USD million, published rounded)
- Destination groups (independent marginal): United States 1,990; China 1,220; ASEAN 1,000; Japan 613.65; European Union 451.72. Their **selected-category sum** is 5,275.37. Official national total is quoted **about** 6,270; difference should not be shown as exact official residual.
- Commodity groups (another marginal): shrimp 1,870; tuna/skipjack 1,040; squid/cuttlefish/octopus 889.73; crab/swimming crab 507.74; seaweed 315.62. Selected-category sum is 4,623.09. Commodity/partner values cannot be multiplied or allocated to manufacture a commodity-to-country network.
- The KKP Bursa Ikan table displayed links to CSV endpoints `/statistik-perikanan/export/7` and `/export/8`, returning 404 during review. This dataset therefore uses the separately accessible original KKP report, not those CSV links.
- KKP's official 16 Feb 2026 release separately cites a 2025 fishery trade surplus of **about US$5.60bn** (BPS-based). This is context only and must never be subtracted from the rounded US$6.27bn export figure to back-solve an exact import observation.

## Agricultural Kementan records
Published `trade` matrix has exactly eight leaves: four agriculture subsectors × fresh/processed. Imported/exported values are distinct and drawn independently with a direction selector; the `Segar + olahan` aggregate rows and `Pertanian Total` rollups are never drawn again. Export leaf sum 14,463.544 USD million and import leaf sum 8,192.336 USD million in Jan–Apr 2026. Some published category subtotals differ by 1 thousand USD due to source rounding. The diagram is **not** a physical goods transport, bilateral origin or HS trade map.

## Mineral HS source transparency
The 2025 mineral, coal, oil/gas and cross-border electricity HS-partner sample uses **UN Comtrade-derived figures served by intermediary presentations (World Bank WITS or CorpLox)**. This is not a direct BPS HS×partner extract. The SLI national 2026 trade header is a separately sourced official BPS release. The chart now links to the [BPS customs query portal](https://www.bps.go.id/assets/exim) and labels detailed BPS reconciliation as **pending**. Partial partner lists, computed residuals, unavailable reverse directions and uneven HS product coverage must remain visibly qualified.

## Strict presentation rules
1. Never plot observed FOB/CIF USD, planned GW, and observed thousand BOE on one chart.
2. Never mix full-year 2025 with Jan–Apr 2026 in a combined flow or total.
3. A missing supplier, partner or product code is **unknown**, not 0; never fabricate a paired edge.
4. Top-five KKP groups are distinct marginals, not a product-by-destination matrix.
5. Each Sankey links to an original publication, source period, table and CSV output when available; pending sources remain visibly pending.
6. Keep actual HEESI and planned RUPTL in Energy and its primary-source intelligence, linked but not duplicated as new Trade charts.

## Quality controls
`tests/qa-sli-sector-trade-sankeys.cjs` tests producer input consistency, eight observed Kementan matrix edges, two distinct KKP marginals (five edges each), sources and navigation. `tests/check-commodity-trade.cjs` retains existing mineral/oil/gas bilateral validation. Both are run by `.github/workflows/commodity-trade-qa.yml`. 
