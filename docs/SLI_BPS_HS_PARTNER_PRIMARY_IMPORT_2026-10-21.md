# SLI — Primary BPS HS × country × period import gate (2026-10-21)

## Status / honest limitation

**BPS primary bilateral matrix not imported yet:** `data/bps-hs-partner-matrix.json` is deliberately `awaiting_primary_extract` with **zero** approved numeric observations. This is source-registration and validation infrastructure, not a claim that the full BPS bilateral matrix has been downloaded. The national 2026 trade KPIs remain BPS totals, while the separate 2025 HS-partner minerals/migas basket still uses World Bank WITS/CorpLox presentations of UN Comtrade until independently reconciled.

BPS website exposes filters for **direction, HS, year, month, port and partner country**. Its accessible public rendering did **not** yield an exportable cross-tab as of this review. Do not treat separately displayed HS marginal totals and partner marginal totals as pairs, and do not imitate private website API endpoints.

### Primary source catalog
- Official BPS interactive customs query: https://www.bps.go.id/id/exim
- Official BPS 2025 export yearbook, HS2022, FOB US$, published 10 Aug and revised 13 Aug 2026: https://www.bps.go.id/id/publication/2026/08/10/556d446e35c86054cb33739f/statistik-perdagangan-luar-negeri-indonesia-ekspor-2025.html
- Official BPS 2025 import yearbook, released 4 Aug 2026: https://www.bps.go.id/id/publication/2026/08/04/29900d4157c9ba7ad7fc72ea/statistik-perdagangan-luar-negeri-indonesia-impor-2025

## Acquisition steps — do not substitute an artificial joint distribution

1. Open the BPS query page. Select exports or imports, reporting year/month, and the exact HS code(s), with partner-country breakdown when that grouping is available. The site cautions that queries with more than five HS codes may be slow; use small batches when necessary. Do not assume every pairing of dimensions is available from the public interface.
2. Click **Buat Tabel / Create Table**, inspect whether each *row explicitly reports the same HS, named country, period and value* (not separate national or per-partner totals), then use **Unduh / Download** to save original official output if supported. Preserve the unmodified original plus source URL, query selections, download date, table/sheet/page and any footnotes.
3. Alternatively verify cells directly from original BPS 2025 annual export/import publications; distinguish actual table cross-cells from adjacent separate marginal tables.
4. Standardize verified observations into a review CSV using `inputs/BPS_HS_PARTNER_TEMPLATE.csv`. A mapping step from the real BPS column names may be needed, but never fill a missing dimension by inference.
5. For each selected 2025 or monthly 2026 observation use these exact canonical columns:

| Column | Meaning |
| --- | --- |
| `direction` | `exports` or `imports` — NEVER mix these |
| `period` | `YYYY` (annual) or `YYYY-MM` (single calendar month) |
| `hs_code` | exactly 2, 4, 6, 8, or 10 digits, **leading zeros retained** |
| `partner_country` | actual named individual country, NOT ASEAN/EU/World/Other |
| `value_usd` | positive *USD*, **un-grouped dot decimal** (e.g. `1234.56`; do not enter `1.234,56`) |
| `net_weight_kg` | non-negative KG with dot decimal if officially published; otherwise blank, NOT zero |
| `source_url` | original `https://*.bps.go.id/...` page/download |
| `source_locator` | specific query/table/page/row reference allowing an independent recheck |

### Strict reviewer-and-checksum gate

Stage-only command (creates candidate, **no chart values published**):

```bash
python3 scripts/import_bps_hs_partner.py --csv inputs/bps_hs_partner.csv --output data/bps-hs-partner-matrix.json
```

For promotion, a human reviewer checks **every cell** against the actual BPS query or original publication, then prepares JSON:

```json
{
  "reviewed_by": "independent reviewer name",
  "source_csv_sha256": "64-character lowercase SHA-256 of the exact CSV file",
  "approved_cell_count": 1,
  "independent_cell_checks": 1,
  "review_note": "Description of the actual source tables/queries and how every row was independently checked"
}
```

Use the **actual** cell count and digest. Example `1` above illustrates the *approval format*, **not** an observed trade value or an assertion that any BPS cell has been checked. Promotion command:

```bash
python3 scripts/import_bps_hs_partner.py --csv inputs/bps_hs_partner.csv --approval inputs/bps_review.json --output data/bps-hs-partner-matrix.json
python3 tests/test_import_bps_hs_partner.py
node tests/qa-sli-bps-primary-trade.cjs
```

The generated file is then reviewed in GitHub, tested with the Commodity Trade Sankey QA and published through normal release controls. Reviewer attestation is a documented manual review, **not** a digital signature issued by BPS. The source CSV checksum is used for detecting later changes, not for proving provenance.

## Dashboard rendering and anti-double-count protection

The `index.html#trade` source-status strip remains visible while awaiting source verification. The **BPS verified HS × country** tab appears **only** when `status=verified`, `review_status=primary_cell_review_attested` and at least one verified observation passes the UI validator. It shows up to 20 highest-value approved cells at **one HS level**, **one period**, and **one direction** per chart; exported rows retain original observation fields. This is a *selected-cells visual*, never a national total.

A year-long series (`2025`) must not be combined with a month (`2025-12`) unless official month totals have been exhaustively reconciled. Nested HS2 and HS4/HS6/HS8/HS10 cannot be summed together. FOB exports and CIF imports cannot be combined as one homogeneous flow. A named country must have a direct recorded value; no proportional allocation from national totals and no simulated “other” country edges. Where denominators/world total are not published for the exact same cut, completeness is **unknown**.

Potential sector lenses **only after primary HS mapping is reviewed**:
- **Food & Agriculture:** grain, coffee, palm products, meat and food preparations per individual HS chapters/headings. Avoid counting fish twice.
- **Marine & Fisheries:** HS03 and properly confirmed fisheries HS1604/1605, not all HS16 food; no KKP product-by-partner synthesis from two different marginals.
- **Minerals & Energy trade:** coal HS2701, nickel ores/matte/ferronickel and other officially mapped ores/metals; HS chapters including downstream manufactures must be labeled honestly, not relabeled as ore production.

HEESI physical BOE flows and RUPTL planned GW capacity remain in Energy; neither can be appended to a customs USD Sankey.

## QA and blockers
- `tests/test_import_bps_hs_partner.py`: invalid country group, malformed HS, duplicate key, invalid source URL, number-format ambiguity, zero placeholders and checksum/review failures must all fail closed.
- `tests/qa-sli-bps-primary-trade.cjs`: status, source provenance, approved-cell Sankey, no fake partner allocation, isolation by HS level and period.
- `.github/workflows/commodity-trade-qa.yml`: runs both gates along with existing Kementan, KKP and commodity trade QA.
- **Open blocker:** the complete, direct BPS partner × HS 2025 numeric export/download is not yet available as a verified file. Until that is acquired, this phase is **not** a completed full primary BPS import.
