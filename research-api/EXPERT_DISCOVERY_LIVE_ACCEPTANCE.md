# Expert Connect — live owner acceptance

The following tests use the **actual deployed** Cloudflare Owner Worker and external OpenAlex + Crossref services, not mocks. Do not confuse previous CI green results with authenticated external API success.

## Owner's Windows PowerShell

Run from the latest local SLI checkout. Keep `OWNER_TEST_TOKEN` private and do NOT paste it into ChatGPT, GitHub, an Issue, an Action log or a screenshot.

```powershell
git pull --ff-only
$secure = Read-Host "OWNER_TEST_TOKEN (hidden)" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $env:SLI_OWNER_TEST_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  node .\scripts\qa-expert-discovery-live.mjs
} finally {
  Remove-Item Env:SLI_OWNER_TEST_TOKEN -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
```

Expected: unauthenticated 401, authenticated OpenAlex `discovery_only` with a candidate count, and Crossref `metadata_found` for a known DOI. 2 authenticated calls use the Worker limit of **2 requests/minute**; avoid concurrent tests. An empty OpenAlex candidate list proves connectivity only if upstream status is `discovery_only`, not suitability of matches.

Troubleshooting:
- `expert_discovery_disabled`: Cloudflare text variable `SLI_EXPERT_DISCOVERY_ENABLED=true` must be deployed to `sli-research-owner-test`.
- `owner_authentication_required`: check locally stored owner token.
- `upstream_unavailable` for OpenAlex: check upstream provider and daily quota. OpenAlex now provides a free, verified-email API key and documents keyless calls as casual/demo only. For reliable usage, place `OPENALEX_API_KEY` as a Cloudflare **Secret**, not as a public variable; then deploy again. See https://help.openalex.org/api/authentication/.
- `owner_test_rate_limit`: rate window already used; avoid parallel tests.
- `metadata_found` from Crossref confirms **metadata retrieval**, not truth of a publication or independent validation of expertise.

Only after real smoke passes should a private Owner review queue be enabled. The public Expert Connect request form must retain **0 confirmed experts** until manual screening and consent. No client briefs or attachments are transmitted to external academic metadata APIs.
