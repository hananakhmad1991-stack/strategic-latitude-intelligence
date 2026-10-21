# BPS Agricultural Indicators 2025 + Horticulture Establishments 2026 — source digitization and Research AI handoff

**Date of work:** 21 October 2026  
**Status:** 82 registered statistical tables; selected statistical pages extracted *privately*; six useful establishment tables available in operator review export; **0 new full-table numeric observations cleared for publication** from these two PDFs. BPS commercial reproduction permission is **not on file**.

## Source identity, checksums and reported periods
| Source | PDF pages | SHA-256 | Source caution |
| --- | ---: | --- | --- |
| *Indikator Pertanian 2025*; BPS catalogue 5102001, ISSN 0854-9427 | 154 | `66ffd41a856db7aba8edce8b5475ec09e5a2ad905af50c889ae953ecb8294479` | Front cover and compiler page: **Vol. 39, 2026**; PDF p.4 says **Vol. 38, 2025**. This is a publisher-internal inconsistency requiring original edition verification, not a SLI typo fix. |
| *Statistik Perusahaan Hortikultura dan Usaha Hortikultura Lainnya 2026*; BPS catalogue 5204013, ISSN 2714-8513 | 668 | `af5dcf57f3510e2d390885035f4a0aeef5a52851e9a69fa6e9028b3bf8e5a355` | Establishment/other-business counts: 2022–2026. Many commodity, land, and labor measures: 2025, sometimes inconsistently labeled in contents vs table title. Not all observations are for 2026. |

**Copyright/rights:** Both uploaded BPS publications explicitly say commercial copying or reproduction of part or all requires **written permission**. General website terms do not override a specific PDF rights statement. SLI must not publicly mirror their raw PDFs, long tables, or whole directories; do not assume paid SLI distribution is licensed. An operator can maintain a private candidate extraction for review. BPS attribution is still required after a permitted publication route is established.

**Directory and privacy:** The 2026 horticulture PDF spends hundreds of pages on named establishments/other businesses, detailed addresses and phone numbers. **These are excluded from the public source register, Research AI index and private statistical-page extraction.** Do not automatically enrich Entities with addresses or phone numbers. Directory ingestion requires a separate BPS reuse-permission and privacy/accuracy review.

## Validated scope and canonical SLI ownership
- 47 agricultural indicator tables: 5.1 General (5), 5.2 Food Crops (7), 5.3 Horticulture (5), 5.4 Plantations (14), 5.5 Livestock (6), 5.6 Fisheries (9), 5.7 Forestry (1).
- 35 enterprise/other-business statistical tables: 3.1–3.20 and 6.1–6.15. The directory text itself is not treated as statistical tables.
- **Food & Agriculture Intelligence:** searchable single catalog; source-to-page pointers, sector classifications, proposed future line/bar/province maps; **no new public numeric series** until licensed and QA-cleared.
- **Marine & Fisheries:** links to table 5.6.1–5.6.9, without changing existing KKP time series or inferring 2025 KKP realization.
- **Climate & Environment:** forestry index 5.7.1 source locator; no duplicate dashboard.
- **Trade Flow:** 2024/2025 agriculture/fishery export/import tables are *commodity marginals*, not HS × individual-country joint matrices. They **do not close BPS Issue #127** and cannot generate bilateral Sankey without partner-level evidence.
- **Entities:** no automatic company/entity-level publishing from the directories.
- **DERGUBA Research AI:** 16 BPS table source **metadata** records in `data/sli-research-unified-index.json` on sync. Their actual index text must state `metadata_only_rights_pending_no_numeric_claim`; the generic publisher search URL is not an original PDF or verified cell-level citation. No evidence retrieval should treat this as a new value or causal claim.

## Offline work completed on the uploaded copies
- A private raw text extraction of **134 statistical-section PDF pages** was produced separately: 80 statistical pages of *Indikator Pertanian* and 54 pages of the 2026 horticulture statistical sections. It deliberately omits PDF address/phone directories.
- Candidate geometry CSVs for horticultural tables **3.1 (PDF 53), 3.3 (PDF 56), 3.6 (PDF 59), 6.1 (PDF 133), 6.2 (PDF 134), 6.3 (PDF 135)** include original cells and source page. These are **not exhaustive numeric cell reviews**.
- Informational national total crosschecks from those cells (review only, not public table import): establishments 2022–2026 = 217 / 335 / 274 / 244 / 235; other businesses = 3,321 / 5,155 / 4,251 / 3,605 / 3,011. PMDN/PMA 225+10=235; horticultural company group 62+71+5+39+58=235; other-business status 1,065+1,737+209=3,011; other-business plant group 1,552+419+52+27+961=3,011.
- Audit the 2026 enterprise 3.10 women's employment year: contents says 2025 but corresponding table header can show 2024; do not silently change observed period.
- First publication PyMuPDF table geometry is complex and sometimes yields 14–20 pseudo-columns for five logical years. The text was preserved as source candidate and **not automatically normalized into vetted time series**. Figure/chart labels also need page-image checks before numerical extraction.

## Repeatable controlled extraction
Use `scripts/extract_bps_agri_horti_offline.py` locally (with `pip install pymupdf`), providing **exact same SHA-256** PDF originals:

```bash
python scripts/extract_bps_agri_horti_offline.py \
  --agriculture /secure/indikator-pertanian-2025.pdf \
  --horticulture /secure/statistik-perusahaan-hortikultura-dan-usaha-hortikultura-lainnya-2026.pdf \
  --output /secure/SLI_BPS_review_only
```

The script enforces output **outside the GitHub repository**, and emits only registered statistical source pages. Never commit its extracted numeric/raw text output into `data/`, Research AI public corpus, or GitHub Pages without BPS written permission and cell-level QA.

## Page-by-page locator and draft numeric QA findings (22 October 2026)

The two supplied original PDF hashes were checked against the registered 154-page and 668-page editions. Source table **start IDs matched 82/82 original PDF pages**, with **21 multipage tables containing 32 additional continuation pages**, now indexed as a total of **114 table-bearing PDF pages**. The initial 134 extracted statistical-section pages included separators and other narrative pages; the new 114-page count is a *targeted per-table span* and not a denial of those 134 internal extraction pages.

**Publisher heading inconsistencies requiring editorial review** (never rewrite dates to make them uniform):
- Horticulture table **3.2**, printed p.38 / PDF 54–55: table title states **2025**, but contents list says **2026**.
- Horticulture **3.10**, printed p.50 / PDF 66: table title states **2024**, while contents say **2025**.
- Horticulture **3.11**, printed p.51 / PDF 67: table title states **2024**, while contents say **2025**.
- Horticulture **6.14**, printed pp.140–141 / PDF 156–157: table title says *perusahaan hortikultura* despite being in the *usaha hortikultura lainnya* chapter. The unit universe requires source clarification.

**Private six-table pilot** (3.1, 3.3, 3.6, 6.1, 6.2, 6.3; 38 listed provinces each): draft PDF geometry CSV data contain **85 cells affected by the diagonal BPS watermark** and one additional ambiguous numeric glyph, requiring visual cell confirmation. Cleanly reading the numeric suffix of a watermark-overlaid text string is merely a *candidate*, not certified reconstruction. Source national-vs-province subtotal checks flag:
- **6.1, 2023**, printed p.117 / PDF 133: province candidate subtotal **one unit below** printed national total; investigate source-versus-extraction discrepancy, do not silently adjust.
- **6.2**, printed p.118 / PDF 134: DKI Jakarta category counts printed **65, 163, dash** against reported total **242**. Difference is **14 units**; the national category subtotal also differs from visible province candidates by **14 units**. A dash is not automatically 14 or zero; this *cannot be imputed* from arithmetic.
- The other draft table column sums reconcile arithmetically, but individual watermarked digits and period meaning still need page-image review. Arithmetic alone **does not validate** them.

**Controls now applied:** quarantine 3.2, 3.10, 3.11, 6.14 by year/scope metadata flags; quarantine 6.1 and 6.2 by arithmetic flags. The Food dashboard catalog labels flagged tables and prints complete multi-page source spans; DERGUBA continues to receive **only source metadata**, not speculative values. `scripts/extract_bps_agri_horti_offline.py` was amended to include multi-page continuations while still excluding directories and all public output.

## Next audit gate (not complete)
1. Contact BPS to clarify commercial reproduction rights for derived chart values vs table mirrors; retain written response and any publication-specific license.
2. Visually verify 82 table headers, printed/PDF pages, source year, units, missing-value glyphs, and cross-table totals. Log each verified numeric cell and any edits; classify source estimates and revisions explicitly.
3. Map annual/commodity/province/capital/employment rows to original sector dashboards. Prefer **line charts** for index series, **maps** for province counts, **bars** for commodity mix and **histograms** only when actual distributions are provided.
4. Exclude Sankey unless a genuine flow matrix (not marginals or organizational categories) is verified; no arbitrary province → commodity → market guesses.
5. After permission and QA, publish minimal transformed numeric data with table/page/licence provenance, run browser QA, and allow Research AI to query numeric cells with explicit citations and constraints.
