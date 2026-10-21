# SLI Kelautan & Perikanan — KKP data integration

## State (21 October 2026)
- Dedicated canonical topic dashboard: `marine-fisheries-intelligence.html` under the existing food/marine navigation family (seven top-level families retained).
- User entry points: SLI home Food sector, shared Explore Data, Food dashboard link and the source-linked data library `#marine`.
- Primary source: Kementerian Kelautan dan Perikanan Portal Satu Data, <https://portaldata.kkp.go.id/portals/data-statistik/layer1>.
- Machine-readable catalog: <https://portaldata.kkp.go.id/api/portal/data_dcat>. **DCAT is metadata**: a dataset entry, modified timestamp or distribution link never certifies that its numerical data have been extracted or updated.
- Curated, table-cited baseline: `data/sli-marine-fisheries-kkp.json`.
- Audit/report/rendering: `tests/qa-sli-marine-fisheries.mjs`, `js/sli-marine-fisheries.mjs`.
- Metadata-only publication-change watch: `scripts/watch_kkp_dcat.py`, `docs/sli-kkp-dcat-baseline.json`, `.github/workflows/sli-kkp-marine-qa.yml`.

## Currently numeric — three separate historical national series

All values below are KKP official **TOTAL** rows, with observation years 2019–2024, and are not described as current-year observations.

| Indicator | 2024 observation | Unit | Official table |
|---|---:|---|---|
| Grow-out seaweed production | 9,853,604.06 | ton (wet harvest) | <https://portaldata.kkp.go.id/portals/data-statistik/prod-ikan/tbl-statis/d/1> |
| Total grow-out aquaculture production | 15,754,611.52 | ton | <https://portaldata.kkp.go.id/portals/data-statistik/prod-ikan/tbl-statis/d/35> |
| Marine capture fishers | 2,819,994 | persons | <https://portaldata.kkp.go.id/Portals/Data-Statistik/Nelayan/Tbl-Statis/d/65> |

Separate 2025 values for seaweed and aquaculture are marked `**` estimates by KKP. They are available in `estimated_not_actual` but **excluded** from historic actual trend, rate of change, source-evaluated KPIs and regional rankings. Captured 2024 seaweed figures are included for ten named provinces only; this **does not constitute exhaustive 38-province data**.

## Coverage and next ingestion priorities

The topic register has 11 entries, explicitly marked either `observed_historical` or `catalog_only`. Unimported topics are capture volume, fish consumption, salt, fishing-vessel registration, WPPNRI potential/JTB, marine conservation, mangrove rehabilitation/blue carbon, and small-business finance. No raw figures are invented or silently substituted with zero.

For next data recovery: identify stable download endpoints in the DCAT or official publication, inspect source structure and licensing, verify source row totals/units/periods, normalize geography and 2025 provisional classifications, add reviewed source-linked facts and tests, then merge through a PR. Data distribution endpoints may be missing or intermittent, so there is **no automatic numeric ingestion** claimed yet.

### Research AI path

The unified public evidence index builder (`scripts/build_research_unified_index.py`) scans `data/*.json`; the KKP `records` contain individual year-qualified titles, source URLs, timestamps, units, publishers and source-qualified values, so future index rebuilds can include the observations. This does not guarantee that the currently deployed Cloudflare Worker has refreshed its corpus. A real owner-only end-to-end staging query and attached citation check are still required.

### Automatic monitoring boundary

The scheduled KKP workflow checks DCAT weekly, around **09:29 WIB Monday** (GitHub schedule is best-effort). It checks ten known dataset identifiers against version dates. It saves a source-health artifact and opens at most one open review Issue when a relevant entry changes/disappears. It **never** writes new numeric observations, changes statutory status, alters Project stage, overwrites a verified snapshot, or silently redistributes licensed content. Upstream outage reports `upstream_unavailable`, not `0` or a fake update.

### Scientific and licensing caution

- Aquaculture volume includes seaweed and must not be added to seaweed volume.
- Tonnes harvested wet ≠ tonnes dried ≠ export value.
- Headcount of fishers cannot establish fisher income, productivity or food security.
- Source publication date and DCAT `modified` timestamp are not observation dates.
- WPPNRI allowable catch is a management reference estimate and not actual landings.
- No claim of validated carbon sequestration follows solely from mangrove restoration acreage.
- KKP public access is not automatic confirmation of unrestricted commercial redistribution rights.

## Quality check

```bash
node --test tests/qa-sli-marine-fisheries.mjs tests/qa-sli-information-architecture.mjs
python -m unittest discover -s tests -p 'test_sli_kkp_catalog.py' -v
python scripts/watch_kkp_dcat.py --out=artifacts/sli-kkp-dcat-review.json
```
