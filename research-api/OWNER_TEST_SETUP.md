# SLI Research AI — Owner Test activation (no membership required)

This is the shortest way to test **real generative AI** in the SLI website without first implementing subscriber login. The production Pro/Enterprise backend remains closed. Owner Test uses **only pre-existing public, short SLI-authored evidence excerpts** and selected 38-province indicator mini-profiles, not any private report or third-party licensed dataset.

**Current deployment status: NOT DEPLOYED.** The main research page shows "Belum terhubung" until steps below are completed. It must never pretend the model is live.

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
- HTTP 502: model returned an error, incomplete output or missing source citations; verify provider billing, model access and Cloudflare Worker logs.
- HTTP 503: missing `STAGING_ONLY` configuration or Worker secrets/binding.
- Cross-origin error: set `WEB_ORIGIN` to the actual published SLI **origin** (not the site path) and ensure `workers.dev` Worker address is configured correctly.

After owner testing passes, the next stage is genuine subscriber authentication, entitlements, private R2 corpus and licensed dataset ingestion—see [Research API README](README.md).
