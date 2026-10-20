# SLI Research AI — Phase 4: Scientific Quality (Owner-only pilot)

**Status: automated infrastructure + synthetic tests, not a published model-accuracy assessment.** This workflow never certifies source facts, ingests paid customers' PDFs, silently changes project statuses, or claims independently reviewed answers.

## A. Original primary PDF, page-specific extraction

Run locally on a **public, official PDF that an operator has lawfully downloaded**. The extraction script does **not** make network calls:

```bash
python -m pip install "pypdf>=5,<7"
python scripts/sli_extract_official_pdf_pages.py \
  --input "/private/docs/original.pdf" \
  --source-url "https://www.esdm.go.id/path/to/original.pdf" \
  --pages "2,5-7" \
  --publisher "ESDM" \
  --source-date "2026-10-20" \
  --output "/private/reviews/original-pages.json"
```

The PDF must be an operator-selected local file, no more than 12 MiB and 120 pages; select at most 12 physical PDF pages per run. Source URL must use an **exact approved HTTPS publisher hostname** and `.pdf` path, with no URL query. The script records byte-level SHA-256 and full extracted-page text SHA-256 plus the original one-based physical PDF page number; it stores at most 6,000 characters per selected page. Publisher page labels (Roman numerals, cover pages, etc.) may differ; inspect the rendered PDF. If text is absent, truncated or from a table/figure, the reviewer must inspect page images rather than inferring facts. No OCR, no PDF fetching, no external transfer, no automatic public-corpus promotion.

The produced JSON is marked `human_page_and_claim_review_required`; keep unreviewed extracts in a private location. Do not commit automatically generated primary PDFs or their text to the public repository.

## B. Claim-to-page *screening*, not automatic entailment

`research-api/src/pdf-page-screen.mjs` exports `screenClaimAgainstPdfPages(claim, manifest)`. It ranks page candidates using co-occurring quantities/terms, returns original PDF URL, document and page hashes, physical page numbers, and missing quantities. **Matching the same number does not prove that the source states the project's commercial status or amount claimed.**

A reviewer should verify each sampled material claim from the *original rendered source page*, paying attention to negation, modality ("planned" vs "operational"), scope (integrated project vs CCS-only), unit, reporting period, amendment/expiry, and who published the claim. Mark the finding as supported, contradicted, or insufficient; record exact cited PDF bytes/hash and physical page. Do not accept numeric co-occurrence or LLM judgment as final adjudication.

## C. Human-adjudicated saved GPT answer evaluation

Prepare a **local-only** review JSON matching `sli-human-adjudicated-research-eval-v1`. Every case contains a saved model answer and its actual SHA-256, `model_origin` (`saved_real_model_output` or `synthetic_fixture`), reviewer identity/date with `human_read_original` declaration, and **manually annotated** claims. Each claim must have a verdict:

- `supported_by_primary_source`
- `contradicted_by_primary_source`
- `insufficient_primary_evidence`

And citation assessment: `correct_direct_citation`, `incorrect_or_unrelated_citation`, `missing_citation`, or `needs_reviewer_review`. Each adjudicated claim has at least one original primary PDF URL, PDF file SHA-256 and one-based physical page number.

Minimal *schema illustration* (use real hashes and actual reviewer notes; do not submit this literal example as evidence):

```json
{
  "schema": "sli-human-adjudicated-research-eval-v1",
  "cases": [{
    "case_id": "real-ccs-001",
    "model_origin": "saved_real_model_output",
    "model_answer": "...full saved answer...",
    "answer_sha256": "...SHA256_OF_EXACT_ANSWER_BYTES...",
    "reviewer": {"id": "independent-reviewer", "date": "2026-10-20", "status": "human_read_original"},
    "claims": [{
      "claim_id": "C001",
      "claim_text": "...verbatim specific claim...",
      "verdict": "insufficient_primary_evidence",
      "citation_assessment": "needs_reviewer_review",
      "primary_evidence": [{
        "source_url": "https://www.esdm.go.id/path/to/original.pdf",
        "document_sha256": "...SHA256_OF_DOWNLOADED_PDF_BYTES...",
        "page": 5
      }]
    }]
  }]
}
```

Execute without API keys or outside model calls:

```bash
node scripts/score_sli_human_scientific_eval.mjs \
  --input "/private/reviews/ccs-reviewed-answers.json" \
  --output "/private/reviews/ccs-quality-summary.json"
```

This scorer validates the *consistency* of reviewer-entered judgments, separates synthetic cases from real model outputs, counts supported/contradicted/insufficient claims and citation failures, and produces a non-public summary. It **does not check whether human reviewers were truly independent or correct**, nor extrapolate a selected claim sample to population accuracy. A saved model answer is **not** independently assessed merely because its summary JSON says `human_read_original`.

## D. Recommended real evaluation protocol, before commercial release

1. Select at least 30 *independently designed* prompts spanning CCS, energy security/PLN SAIDI-SAIFI, AI data centers, food policy, provincial investment, geopolitics and law, including adversarial outdated-information queries. Use a stable frozen model, source-index version and date.
2. Build a blinded, independently checked **reference set** *before* reviewing each GPT answer: authoritative primary pages (PDF render plus exact page), factual assertions, status-date scopes, competing credible sources and uncertain/unanswerable cases.
3. Save raw GPT answer and exact citations with SHA-256; then have an independent reviewer label *every material claim*, not only the risk-ranked sample, from primary sources. Double-review disputes and resolve transparently.
4. Report separate denominators and non-synthetic metrics for supported, contradicted, insufficient, citation mismatch and claim coverage. Flag unreviewed claims and source changes. Do not manufacture one broad "accuracy percentage".
5. Commercial gate stays closed until reviewer-approved cases, reproducible provenance, methods QA, policy/legal/version coverage, and staging security/smoke tests have passed. Expensive LLM tests require an explicitly authorized budget and access.

## CI coverage and gaps

Weekly Research Agent QA and relevant PRs now run synthetic PDF page extraction tests, page candidate screening tests, human adjudication scorer tests, alongside the original offline evidence/method benchmarks. CI invokes **no paid LLM**. It is a coding regression signal, not scientific truth evaluation.

**Still pending:** actual real GPT answers evaluated by a second independent reviewer, OCR/scanned originals, table-aware and multi-column PDF extraction, point-in-time archive and source authenticity, reviewer sign-off workflow, legal validity adjudication, and deploy of any owner UI/backend changes. Page extracts are not yet imported into the production Research AI evidence retrieval index.
