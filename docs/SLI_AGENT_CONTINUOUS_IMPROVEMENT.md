# SLI Continuous AI Improvement — Operasional Awal

Status: **automated offline regression evaluation wired to GitHub Actions; production LLM self-training and autonomous code deployment NOT enabled.**

## Goal
Turn three coordinated SLI capabilities (generative research with source retrieval, data/source monitoring, and analytic/dashboard methods) into a measurable human-guided improvement loop. OpenAI provides generation, Tavily source discovery when explicitly enabled, and Cloudflare AI Gateway routes model traffic. These are **not three independently self-training foundation models**.

## Daily loop
1. **Observe**: read only public, nonconfidential, already published SLI evidence and a curated synthetic regression dataset.
2. **Evaluate**: run deterministic checks for method routing, numeric reference values, province disambiguation, source tier, project stages, report structural gating, account safety and disclosure.
3. **Explain**: save `sli-agent-self-eval-scorecard.json` as a GitHub Actions artifact; write a readable Actions run summary with score per domain, warnings and improvement proposals.
4. **Escalate**: if a critical regression fails, GitHub Actions becomes red and opens a **single nonduplicative review Issue**. Existing upstream failures are disclosed but are not rewritten as official data and do not cause autonomous remediation.
5. **Human review**: researcher/owner assesses the case, source, methodology, requested target, legal/licence status and risk. File feedback via the GitHub **SLI Agent — Masukan kualitas AI** issue template. Remove credentials, personal records, client-confidential files and proprietary text.
6. **Improve safely**: write or adjust a source-verified regression case in `tests/fixtures/sli-agent-eval-cases.json`, implement a scoped code/prompt/data fix in a separate branch/PR, run full targeted QA, secure an explicit human review, then merge/deploy. Regression cases remain as cumulative institutional memory.
7. **Compare again**: subsequent scheduled runs check retained acceptance criteria to detect regressions.

Workflow: `.github/workflows/sli-agent-self-evaluation.yml`.
Schedule: daily around **09:13 WIB** (02:13 UTC; GitHub scheduled jobs are best-effort and may be delayed).
Manual run: Actions → **SLI Agent Continuous Evaluation & Human Review** → Run workflow.
Local run: `node --test tests/qa-sli-agent-self-eval.mjs && node scripts/sli-agent-self-eval.mjs --out=artifacts/sli-agent-self-eval-scorecard.json`.

**API/cost:** The daily test sends **zero OpenAI, Tavily or other paid AI calls**. It is deterministic code and metadata evaluation; GitHub-hosted runner resource use still applies. Do not reuse the owner's private Research AI token in CI.

## Autonomous tested-change proposer (Phase 2 active)

The GitHub Action `.github/workflows/sli-agent-autonomous-proposals.yml` runs daily around **10:41 WIB** (best-effort) or on manually requested execution and relevant main-branch source updates. Unlike the offline scorecard, this job may **edit code and regression fixtures in an isolated proposed branch**, provided a corresponding candidate is already reviewed and committed to `tests/fixtures/sli-reviewed-autonomous-candidates.json`.

- **Detect:** find the first failing, nonconflicting method-intent candidate from a small nonconfidential approved backlog, without overriding another explicit method.
- **Prepare:** edit only `js/sli-method-aliases.mjs` (one finite new synonym) and `tests/fixtures/sli-agent-eval-cases.json` (one permanent regression check). These rules affect AI *method-routing behavior*, not OpenAI weights.
- **Verify:** run existing scientific, geographic, source, security and agent regression checks before the patch, and the same relevant checks plus the new regression case after the patch. Disallow changes outside two exact allowlisted files.
- **Propose:** push `sli-agent/method-<candidate-id>` branch and open a **draft PR**, never merging automatically. CI in `.github/workflows/sli-agent-proposed-change-qa.yml` additionally rejects any out-of-scope files in agent PRs.
- **Approve:** the owner reviews code, methodology, tests, cost and security. Only merging an explicitly approved PR to `main` applies the change; GitHub Pages may deploy afterward.
- **Permission fallback:** some repositories disable GitHub Actions bot-created PRs even with `pull-requests: write`. If creation is blocked, the workflow **keeps its tested proposal branch** and opens an Issue with branch/run details; humans must open the PR. To permit automatic draft-PR creation, configure GitHub repository **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests** (if available and the owner accepts the risk). That setting does not itself cause this workflow to approve or merge changes. Protect `main` with required PR reviews and status checks; the linked GitHub integration may be unable to inspect or manage administrative protection settings.

**Demonstrated on 20 October 2026:** the agent generated a reviewed Indonesian routing correction for "regresi linear berganda" in a separate branch; tests succeeded; GitHub denied creation of a draft PR by Actions, so Issue #15 was opened. Draft PR #16 was subsequently created via the authorized GitHub connector for the human to review. Production code was not changed by the agent branch.

**Scope:** This is a narrowly bounded automatic **code proposal** engine. It is not general-purpose autonomous software engineering or unsupervised model retraining. Expansion to prompt experiments/model selection must include approved benchmark suites, real model-output quality scoring, cost caps, private staging, rollback and explicit code-owner review; do not automatically claim model improvement from offline checks alone.

## What does not happen automatically
- No change to AI model weights, fine-tuning, private prompt secrets, or automatic GPT model replacement.
- No self-modification on **main**, auto-merge, cloud Worker redeployment, live customer account creation or payment. Reviewed finite code proposals may be generated on isolated branches.
- No silent elevation of unreviewed RSS/news headlines to primary facts, current law, realized project capex or operating status.
- No auto-selection of a new source licence, external service, paid evaluation budget or model API account.
- No claim that a passing structural citation audit verifies the citation actually supports an argument.

## Human review rubric (manual first)
For each public/consented owner-staging answer, record a 0–2 score for: **question and geography fit; factual and numeric provenance; citation entailment; method executed honestly; useful conclusion and completeness; security/consent; localization and UX**. Record the actual date, source vintage, permitted data and whether any model call incurred spend. Aggregate only after 2 independent checks or a clearly identified reviewer; disagreement becomes a new review task, not a silent overwrite.

Run a balanced 12-case staging matrix from `research-api/RESEARCH_VALIDATION_PLAYBOOK.md`; keep those outputs PRIVATE. Use held-out scenarios to avoid tuning only to the visible fixtures. A future paid live model evaluator should be opt-in, server-side, spend-capped and human-calibrated.

## Release and promotion gates
**Green deterministic tests do not certify Pro readiness.** Before user-visible promotion, compare baseline score, source corroboration, factual human review, per-request spend, latency and privacy. Block any release that worsens high-severity geography, money, legal/project status or unsupported numeric results. Require owner signoff for prompt/tool routing changes and privileged backend actions.

The scorecard includes source-health warnings when upstream data ingestion fails; do not suppress these by replacing missing data with zero or invented values.

## End-user feedback loop
Use **Issues → New issue → SLI Agent — Masukan kualitas AI**, specifying a nonconfidential reproduction, expected vs observed output, affected sector/province, primary URL and impact. The feedback is NOT automatically learned as fact; reviewers promote approved anonymous synthetic cases to the regression suite.

## Current operational limits
Phase 1 automated self-testing is active, and Phase 2 bounded source-code proposal generation is active on separate branches. Neither is automatic weight retraining, unlimited general code rewriting, or autonomous production deployment. Real production accuracy, live Owner Worker behaviour, factual entailment and 49 estimator development still need separate validation. Real production accuracy, live Owner Worker behaviour, full source entailment and all 49 estimators require separate evaluation and development.

## 20 Oktober 2026 · Belajar dari setiap bug yang sudah terselesaikan (cumulative regression memory)

Setiap perbaikan yang telah di-*merge* dapat menjadi pelajaran permanen, **tetapi bukan pembaruan otomatis bobot GPT dan bukan izin untuk mengubah fakta**. Penerimaan pelajaran membutuhkan *root cause*, pencegahan, PR yang telah digabungkan, dan satu **tes bernama yang benar-benar dapat dieksekusi**.

1. **Intake otomatis:** workflow evaluasi harian 09:13 WIB mengambil metadata hingga 100 PR yang sudah digabung. Judul yang tampak sebagai perbaikan/bug dalam tujuh hari terakhir, tetapi belum masuk daftar pelajaran, dilaporkan sebagai **kandidat review**. Ini deteksi calon masalah, bukan penentuan bahwa suatu model sudah lebih cerdas.
2. **Review manusia:** Issue tunggal menautkan PR yang perlu diperiksa. Peninjau membaca diff dan akar masalah, membuat kasus sintetis aman, lalu menautkan tes yang membuktikan masalah lama tidak berulang. Jangan memasukkan raw prompt, isi issue privat, tangkapan layar rahasia atau sumber yang belum terverifikasi.
3. **Retained learning ledger:** `tests/fixtures/sli-agent-resolved-lessons.json` menyimpan rekam perbaikan. Pemeriksa `scripts/sli-agent-resolved-learning.mjs` memastikan PR/SHA dan tes bernama tetap ada. Catatan yang sudah diterbitkan tidak boleh dibuang atau diubah diam-diam pada PR berikutnya.
4. **Daily regressions:** `sli-agent-self-evaluation.yml` mengevaluasi ledger dan mengulang tes kasus yang sudah dipelajari. Skor menampilkan jumlah pelajaran dan PR asalnya; **skor adalah cakupan uji, bukan akurasi jawaban AI**. `sli-agent-learning-qa.yml` menguji penambahan dan sifat append-only sebelum masuk `main`.
5. **Promosi terkontrol:** lesson baru dan kode/prompt perbaikan tetap melalui PR, CI dan persetujuan owner. Test hijau tidak mengaktifkan Cloudflare Worker; uji live dan keamanan produksi tetap terpisah.

**Pelajaran awal:** PR #70 (`abc865f7`) memperbaiki pengaman Pasal yang tidak tersedia dan perbedaan indeks regulasi vs. teks pasal. PR #73 (`421c3df`) memperbaiki normalisasi penyebutan undang-undang serta menguji laporan bebas judul tanpa isi. Empat pelajaran ini kini ditautkan ke `tests/qa-sli-legal-source-limited.mjs` dan dijaga dalam scorecard.

**Batasan operasional:** otomatisasi tidak melakukan fine-tuning model, tidak mempelajari informasi pengguna yang bersifat privat, tidak menyimpulkan status hukum, tidak menyatakan setiap merged PR sebagai peningkatan kualitas, dan tidak membiarkan AI melakukan *self-merge*. Pengujian lapangan diperlukan untuk mengukur penurunan kesalahan nyata.

Untuk pemeriksaan manual: `node --test tests/qa-sli-agent-resolved-lessons.mjs tests/qa-sli-legal-source-limited.mjs && node scripts/sli-agent-resolved-learning.mjs`.
