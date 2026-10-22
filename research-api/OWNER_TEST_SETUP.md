# SLI Research AI — Owner Test activation (no membership required)

This is the shortest way to test **real generative AI** in the SLI website without first implementing subscriber login. The production Pro/Enterprise backend remains closed. Owner Test uses **only pre-existing public, short SLI-authored evidence excerpts** and selected 38-province indicator mini-profiles, not any private report or third-party licensed dataset.

**Deployment status (2026-10-18): Owner Test Worker deployed, and its public endpoint configured in the SLI research page.** Owner-only generative model output is still being validated. Pro/Enterprise production access is NOT active. The UI must never pretend a failed model request produced a report.

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/) that can deploy Workers.
- An [OpenAI API project and its billing](https://platform.openai.com/settings/organization/billing/overview). This is separate from a ChatGPT subscription. Create a **project API key** at [OpenAI API Keys](https://platform.openai.com/api-keys).
- Node.js and Git available in a local terminal. Use the project folder already cloned locally if possible. Do **not** paste your OpenAI API key or owner token into ChatGPT, GitHub source, or any publicly visible screenshot.

## Deploy Cloudflare Worker (one-time)

From the local SLI repository (run in Terminal, PowerShell, or VS Code Terminal):

```sh
cd research-api
npx wrangler login
```

Copy `wrangler.owner-test.toml.example` to `wrangler.toml` within `research-api`. Use `cp` on Linux/macOS or `Copy-Item` on Windows PowerShell. The example already selects `gpt-5.4-mini` for initial API testing; change `RESEARCH_MODEL` if your API account has a different approved model.

```sh
npx wrangler deploy
npx wrangler secret put OPENAI_API_KEY
```

**Important:** the second command interactively asks for the secret. Paste it **only into that trusted Wrangler prompt**. Cloudflare stores it as an encrypted Worker secret.

Generate a unique owner test token (requires Node.js):

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (64 hex characters) to a secure password manager, then:

```sh
npx wrangler secret put OWNER_TEST_TOKEN
```

Paste the 64-character value when prompted. This is **not** your OpenAI API key.

Deployment prints a Worker address resembling `https://sli-research-owner-test.<YOUR_SUBDOMAIN>.workers.dev`. The research API endpoint is that address with `/v1/owner-research` appended.

A configured Worker deliberately responds with status 403 if opened directly in a browser without the SLI origin and token; that does **not** mean deployment failed. The research form must be used from the SLI website.

## Enable owner test on the public SLI research page

Only after a successful secure Worker deployment, edit `data/sli-research-assistant-config.json` in your GitHub repository, changing just these keys:

```json
"owner_test": {
  "enabled": true,
  "endpoint": "https://sli-research-owner-test.YOUR_SUBDOMAIN.workers.dev/v1/owner-research",
  "scope": "owner_only_staging_with_public_curated_SLI_evidence",
  "auth": "private_server_side_random_token_48_or_more_characters",
  "status": "configured_owner_test_no_paid_subscriber_access"
}
```

**Never paste tokens into the JSON file.** Once deployed, you may instead share **only the public Worker endpoint URL** with ChatGPT to have the repository configuration adjusted. The public Worker address is not a credential.

Open [SLI Research AI](https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/sli-research-ai.html), refresh (Ctrl+F5), and look for `Ready for owner-token test`. Enter your **64-character owner test token** in the dedicated masked field, select a research format, type a substantive research instruction and press **Riset dengan AI**.

This calls a real OpenAI model through Cloudflare, uses past conversation context for follow-ups, and returns an analytical answer with numbered evidence citations and a side panel of sources. Copy and Markdown export will activate when a real answer returns. Evidence is only as broad as the limited public snapshot; full SLI proprietary RAG is not deployed.

## Security and limits

- API key and owner test token are stored **only as Cloudflare Worker secrets**. The website never stores the token in `localStorage`; it is kept only in the current password input and is sent to the HTTPS Worker in a custom header.
- Only requests with the configured SLI HTTPS origin and the correct long random token are considered; a Cloudflare limiter allows two requests per minute per token. Rate limits are not a substitute for a spending cap: configure spending limits in the OpenAI API project, and do not share the owner token.
- Do not upload confidential client reports to the public SLI site or staging corpus.
- This is **owner-only testing**. It does not confer true subscriber authentication, multiuser isolation, device locks, or production data licensing.
- To suspend immediately: update `owner_test.enabled=false` on GitHub, delete or rotate `OWNER_TEST_TOKEN` in Cloudflare, and/or disable the Worker. The server token revocation is what stops API usage even before GitHub Pages updates.
- If an OpenAI model gives answers with missing or invalid citation numbers, the Worker returns an error instead of a fake success. Citations still require fact checking.

## Troubleshooting

- Page displays **Belum terhubung**: backend URL not added/committed to config or GitHub Pages has not published the change. Refresh with Ctrl+F5.
- Page asks for token: paste `OWNER_TEST_TOKEN` from your password manager, **never OPENAI_API_KEY**.
- HTTP 401: test token wrong or missing.
- HTTP 429: too many research requests in the last minute.
- HTTP 502 `model_response_incomplete`: the model did not complete its response, commonly due to the total output budget (which includes reasoning tokens). This Owner Test uses low reasoning effort, a concise answer target and a 4800-token budget; verify `incomplete_details.reason` using the returned `reason` field and inspect Cloudflare Worker logs if needed. Do not auto-retry paid model requests.
- Other HTTP 502 errors: model request failed or lacked valid source citations; verify provider billing, model access and Cloudflare Worker logs.
- HTTP 503: missing `STAGING_ONLY` configuration or Worker secrets/binding.
- Cross-origin error: set `WEB_ORIGIN` to the actual published SLI **origin** (not the site path) and ensure `workers.dev` Worker address is configured correctly.

After owner testing passes, the next stage is genuine subscriber authentication, entitlements, private R2 corpus and licensed dataset ingestion—see [Research API README](README.md).

## Source relevance and visual insights (2026-10-18)

- Owner Test now classifies research sector intent before ranking evidence. Sector/commodity and exact province matching exclude unrelated investment, crude price, and waste-to-energy evidence from specific minerals questions; unverified news discoveries are not admissible factual evidence.
- The Worker calculates `charts[]` deterministically from **selected** public, dated and source-cited numeric evidence. Chart series never mix incompatible units or observation periods; project stage counts refer only to distinct retrieved project records, not all Indonesian projects, completed facilities or operational capacity.
- The frontend safely renders simple bar charts, source citations and limited Markdown emphasis/tables with DOM text nodes, never as trusted model HTML.
- The model instruction closes with **Kesimpulan dan Rekomendasi Strategis** / **Conclusions and Strategic Recommendations**, giving 3–5 actionable pointers. It remains generative, so users must verify output and source attribution.
- Graphs appear only when there are at least two comparable sourced observations or two meaningful project stage groups. Gaps are intentional; do not fabricate chart values to fill them. The full proprietary sector data platform is still not linked to this public staging corpus.


## GitHub staging deployment acceptance (22 October 2026)

The controlled Owner Worker deployment run [#39735505875](https://github.com/hananakhmad1991-stack/strategic-latitude-intelligence/actions/runs/39735505875) is **confirmed successful**. Wrangler uploaded and deployed the `sli-research-owner-test` Worker, and the unauthenticated request was rejected with HTTP 401. This is **not** proof of authenticated model completion, current legal validity, PDF rendering, or commercial release authorization.

The owner may run a local acceptance test WITHOUT disclosing tokens to GitHub or ChatGPT. Use Node.js 22+ and the checked-out repository. The CLI uses the fixed allowlisted staging Worker endpoint from `data/sli-research-assistant-config.json`; it does **not** accept arbitrary upload URLs.

### Windows PowerShell (read token without showing it)

```powershell
$secure = Read-Host "Paste existing OWNER_TEST_TOKEN locally (hidden)" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $env:SLI_OWNER_TEST_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  node scripts/qa-owner-staging-live.mjs
  # To also test the REAL paid model once (uses your OpenAI API budget):
  # node scripts/qa-owner-staging-live.mjs --include-paid-model
} finally {
  Remove-Item Env:SLI_OWNER_TEST_TOKEN -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
```

The default run verifies 403 for wrong origin, 401 without token, the **nonexistent** Pasal 99 UU 7/2021, the **unreviewed** Pasal 11 UU 7/2021, and basic Word/A4 HTML draft output, with zero paid model calls. Add `--include-paid-model` only with explicit authorization for one live reviewed Pasal 1 UU 16/2016 response; the CLI respects the 2-per-minute rate limiter by waiting before the third authenticated request. It prints pass/fail and error codes, never the owner token or complete answer. If another test is running concurrently, wait for the limiter window before restarting.

**Do not publish or share the terminal's secret, and never paste the token into GitHub Issues or screenshots.** Store any acceptance output privately. A successful live completion still needs human source-claim review, browser PDF rendering QA, BPS rights clearance, privacy/security review, customer access controls, and separate commercial launch approval. A bounded original-Pasal structural citation must never be interpreted as current consolidated legal text.

## Private evidence from the ACTUAL authenticated Owner answer (October 22, 2026)

The 8/8 live legal smoke checks prove the live Worker route, but previously the script intentionally printed only PASS/FAIL. To review **the exact generated answer** and a browser-rendered PDF, the Owner can now explicitly enable local private evidence export. This command makes one NEW paid model call; it does NOT recover the earlier 8/8 answer retroactively.

Run the same masked-token PowerShell setup above, but inside the `try` block use:

```powershell
cd "$HOME\SLI-Owner-QA"
git pull --ff-only
node .\scripts\qa-owner-staging-live.mjs --include-paid-model --save-private-report
```

The script prints only the private folder location, claim count, PDF render status and abbreviated QA statuses. It writes an untracked local directory under `$HOME\SLI-Owner-Private-Reports\derguba-owner-*`, **never into GitHub**:

- `answer.txt` — unabridged real Owner model answer (not a fixture)
- `report.docx` — genuine editable Word draft generated from that answer
- `report.html` — actual A4 printable draft, escaped model content
- `report.pdf` — generated locally **only if** headless Microsoft Edge or Chrome succeeded; otherwise open `report.html` in Edge, press Ctrl+P and Save as PDF
- `claim-review.md` and `claim-review.json` — every candidate substantive sentence, numbered evidence references and warnings, initially `HUMAN_PRIMARY_SOURCE_REVIEW_REQUIRED`
- `manifest.json` — answer SHA-256 and limits; it excludes the secret Owner token and API key

In PowerShell, locate the newest private export without exposing the token:

```powershell
$latest = Get-ChildItem "$HOME\SLI-Owner-Private-Reports" -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Start-Process (Join-Path $latest.FullName "report.html")
Start-Process (Join-Path $latest.FullName "report.docx")
notepad (Join-Path $latest.FullName "claim-review.md")
```

Read the **first and last PDF page** and any page with long tables or references; confirm no clipping, citation displacement, unexpected blank pages, or missing last sentence. For every `C001`, `C002`, etc., compare the precise assertion with the original Pasal 1 of UU 16/2016 at [peraturan.go.id (original promulgated law)](https://peraturan.go.id/files/uu16-2016bt.pdf), record the original page and an exact supporting quote or mark **unsupported/needs context**. **Also independently check amendments and operative/current validity**, which the original-law anchor cannot certify. The automated checklist does not semantically certify any sentence.

**Privacy:** These files include the actual model response. Keep them on your own device; do not upload the unredacted directory as a GitHub Action artifact, commit it, or include credentials in screenshots. If sharing for peer review, redact private material manually first. The browser subprocess is launched with secret/token-related environment variables removed. On Windows, filesystem permissions may inherit from your Windows account; use appropriate local disk protection.

There is **no change to the Cloudflare Worker or subscriber access**. Commercial production remains blocked until its separate license/rights, customer auth, data privacy, billing and compliance acceptance checklist is signed off.
