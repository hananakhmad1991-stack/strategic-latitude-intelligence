# SLI Open · manual AdSense controls (24 October 2026)

## Approved business rule
AdSense is limited to substantive public editorial SLI Open pages such as articles and public weekly briefs. No advertisements on DERGUBA Research AI, Expert Connect, authentication pages, client proposals, Professional, Intelligence Pro or Enterprise. Avoid homepage ads in the initial rollout.

## Current state
- Publisher ID: `ca-pub-3092642555794646` (public publisher identifier, not a credential).
- Existing root `ads.txt` publisher record is retained.
- Homepage retains the `google-adsense-account` verification meta tag but its global AdSense script is removed.
- `data/sli-adsense-config.json` defaults to `enabled:false` and no allowlisted paths: NO manual ads are live from this integration.
- This is an implementation scaffold. Google account-side verification/approval and a real unit ID remain prerequisites.

## Enable only after approval
1. Verify the public domain and Google AdSense site status. Keep `ads.txt` at the actual site's root.
2. In the AdSense account, turn off **Auto ads** for SLI, especially anchor and vignette formats; website code alone cannot enforce account-side Auto ads settings.
3. Create a **Display ad unit** in AdSense, copy its numeric slot ID; do not confuse it with the publisher ID.
4. Add up to two placements to an eligible public article, well separated from nav, filters and charts:
   `<div class="sli-manual-ad" data-sli-ad-slot="ACTUAL_NUMERIC_SLOT_ID"></div>`
   Load `<script defer src="./js/sli-adsense-manual.js"></script>` only on that article page.
5. Add the exact deployed pathname (including any GitHub Pages project prefix, if used) to `allowed_page_paths`, and set `enabled:true` after checking that page has substantive original content and appropriate privacy/consent disclosures.
6. QA desktop + mobile and inspect network requests on premium/AI/expert pages (should show none). Verify ad disclosure, spacing and no accidental click encouragement.

## Privacy and independence
Check applicable consent and privacy requirements, including Google consent rules for visitors in relevant regions. Disclose advertising clearly, avoid placing ads next to interactive controls, and maintain editorial separation from sponsors. For account-side sensitive-category/advertiser blocking, use AdSense Blocking controls. Exclusions do not guarantee any particular advertiser will/will not display.

## Launch gate
DO NOT enable ads until Google approves the domain and real slot IDs are available. The existence of the AdSense script, tag or ads.txt alone does not establish approval or revenue.
