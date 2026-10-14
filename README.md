# Strategic Latitude Intelligence (SLI)

Independent, open-source-based analysis of Indonesia's strategic investment, energy security, critical minerals, AI infrastructure, and public policy.

## Status
**Public research prototype.** Energy Security now contains sourced historical statistics, institutional actor mapping, a curated legal and policy register, and a **selected** CCS/CCUS project stage tracker. Automated public-source news discovery, market observations and rule-based daily assessments are experimental and do **not** amount to independently verified real-time incidents, commercially injected CO₂, or audited project expenditure. Do not market SLI as a real-time intelligence service or investment advisory product.

## Website
Once GitHub Pages is enabled: https://hananakhmad1991-stack.github.io/strategic-latitude-intelligence/

## Publishing on GitHub Pages
1. Repository **Settings** → **Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Set branch to **main**, folder **/(root)**, and save.
4. Wait for deployment and check the Pages URL.

## Content standards
- Lawfully obtained, publicly attributable information.
- Check reuse rights, licenses and site terms for each source.
- Distinguish announcements, financing, construction, and operations.
- Include source URLs and reference dates when publishing data.
- Do not publish confidential client material or personal information without proper authorization.
- Do not give individualized investment or securities trading recommendations.

## Energy governance and CCS/CCUS scope
- `data/energy-governance-ccs.json`: functional energy governance / actor roles, updated policy register and evidence-labeled CCS/CCUS pipeline (potential, status, participants, reported investment, verified realization).
- `js/energy-governance-ccs.js` and `css/energy-governance-ccs.css`: accessible interactive front-end panels at the **top** of Energy Security.
- `.github/workflows/energy-policy-watch.yml`: scans for possible policy release **candidates** every six hours. Google RSS headlines are not proof of enacted regulations. The curated policy register requires research review; scans do not automatically change it.
- A geological screening estimate is not proven injectable storage, an MoU is not FID, FID is not spend, a water injectivity test is not measured CO₂ injection, and full LNG project funding is not CCS-only capex.
- Corporate and ministerial leaders are dated as-of cited sources; refresh them when appointments change. Example: PLN President Director change announced 14 October 2026.

## Maintenance
The site is served from GitHub Pages using `index.html`, separate JavaScript / CSS modules and dated JSON datasets. Source-watch workflows may run periodically; verify data freshness and GitHub Actions results rather than treating a green build as proof of analytical accuracy.