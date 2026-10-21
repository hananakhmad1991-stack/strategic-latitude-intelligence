# DERGUBA Research AI — 30-case live owner acceptance

**Status:** test protocol and offline scorer only. No model transcript has been captured or independently reviewed by this change. No Worker deployment or public customer activation.

## Preflight and execution

1. Review owner-only staging policy gate and current main branch index version. Deploy the Worker through protected manual GitHub Actions only after approval. GitHub Pages does not deploy Workers.
2. Use the authenticated owner-only Research AI page. Never expose owner tokens, API keys, private logs or client documents in GitHub.
3. Freeze model identifier, index SHA-256, execution date and an explicitly authorized API spending cap.
4. Submit exactly the 30 prompts in tests/fixtures/sli-research-live-30-prompts.json and preserve each real answer and request receipt. A blocked request must remain blocked, not replaced by a fabricated successful answer.
5. Have two distinct independent human reviewers check each material claim, cited original PDF page and its actual meaning, unit, period, geography, announced/realized status and legal amendments. Resolve disagreements before considering external publication.

## Private 30-case input manifest

Keep the full JSON OUTSIDE the public repository under private encrypted owner control; do not upload it to GitHub Actions, public dashboard datasets, issue comments or an external search provider. The scorer requires schema sli-research-live-adjudicated-batch-v1, mode saved_real_model_output, and exactly 30 result receipts (RA-01 ... RA-30).

Each completed case must contain: case_id, prompt_sha256 (SHA-256 of exact test question), at_utc (ISO 8601), status completed, latency_ms, model name, source_index_sha256, model_origin saved_real_model_output, complete answer, exact UTF-8 answer_sha256, and cost_usd when measured (null if unavailable). Include all material claims with claim_id, claim_text, and two human reviews with distinct reviewer_id values, verdict, citation_assessment, plus original primary_evidence for supported claims.

Allowed verdicts are supported_by_primary_source, contradicted_by_primary_source and insufficient_primary_evidence. Allowed citation assessments are correct_direct_citation, incorrect_or_unrelated_citation, missing_citation and needs_reviewer_review.

For original PDF evidence include source_url, actual downloaded document_sha256 and physical page >= 1. For official non-PDF evidence include source_url, source_date, checked_at_utc. Reviewer-entered data is not independently authenticated by the script.

Failed or blocked requests must have case_id, prompt_sha256, status blocked/failed, at_utc, latency_ms, and cost_usd when known; they still count as attempted research and may incur provider charges.

## Run scorer privately (no API calls)

    node scripts/score_sli_research_live30.mjs --input=/private/sli-eval/real-batch.json --out=/private/sli-eval/score-summary.json

The input and output must both be outside the repository. The summary reports completed/blocked/failed; supported/contradicted/insufficient claims; missing/wrong citations; unresolved or conflicting reviews; source traces; model and corpus versions; reported costs, unknown costs, and p95 latency. Cost is not fabricated for missing receipts.

A full 30-case, double-reviewed batch can pass the completeness gate ready_for_analyst_acceptance_review. The script ALWAYS leaves scientifically_certified=false and commercial_launch_approved=false. Authenticity and factual correctness of human adjudications need independent sign-off.

## Special adversarial cases

Assess plans vs operations, source-only data, geographic disambiguation, fake investment realization, ambiguous legal text, misused indices, attempted prompt injection, misleading numeric co-occurrence, stale sources and unanswerable requests. For the full science protocol see research-api/SCIENTIFIC_QUALITY_PHASE4.md.

## External source reliability

BNPB 2025 XLSX download failed with HTTP 403 on GitHub Actions. A new read-only checker uses BNPB's published CKAN DataStore route to the same official resource, without proxies or WAF circumvention. It compares 38 administrative provinces x nine hazards and preserves the 28 (national) vs 29 (province sum) earthquake discrepancy as published. A blocked or mismatched official source is REVIEW REQUIRED and does not overwrite current SLI data. Pusdatin source HTTP 403 also remains unresolved separately in Issue #130.
