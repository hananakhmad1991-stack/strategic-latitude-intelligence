# SLI Expert Connect — Research & Expert Desk MVP

**Decision (22 October 2026):** SLI is an Indonesia intelligence workspace combining a data-backed dashboard, focused DERGUBA Research AI and **human-managed expert sourcing + bespoke research**. DERGUBA is not positioned as a replacement for primary interviews or professional judgement.

## Starting state: zero enrolled experts (owner decision)
- SLI starts with **zero pre-enrolled experts**. Do **not** claim an existing roster, pre-vetted membership, standby pool, expert count, published expert directory, confirmed availability or guaranteed introductions.
- The client describes the question and desired expert experience **first**. Only after SLI manually evaluates a real request does SLI seek and screen candidate experts, verify conflicts, obtain the candidate's permission and check actual availability.
- No speculative recruitment campaign, empty public directory or preloading people from past interviews, Google Contacts, LinkedIn, email or publications into a registry without documented consent.
- A private registry is optional **later** for experts who actually opt in after legitimate engagement. It is not a dependency for launching the simple public request page.
- If no appropriate willing expert can be found, SLI should decline or discuss alternatives, never invent a shortlist or imply a booking.

## Implemented in this draft branch — NOT deployed to customers
- New bilingual English/Indonesian **Research & Expert Desk** public page: Find an Expert, Expert Consultation, Custom Research & Advisory.
- Local-only, editable client brief: type of service, sector, objective, expert qualifications, deliverable, timeline, organization and budget guidance.
- Explicit acknowledgment, preview, clipboard and mailto compose. **No API POST, database, form-data analytics, invisible chat-to-lead conversion or automatic server persistence.**
- Linking from SLI global navigation, homepage, DERGUBA and Enterprise offering without disabling original dashboards, source protections, export paths, or numeric validation.
- Mobile / desktop tests planned for 360px, 390px and 1440px and a new CI check.

## Critical distinction: preparing versus actually submitting
The form generates an **editable email draft**. The visitor must review it and **send it from their own email account**. Clicking the link, copying the draft, or leaving the page does NOT record a lead, submit a request, reserve a specialist, form a contract or produce a tracking reference. SLI cannot promise delivery or response from this pilot front-end.

The public inbox is the existing contact address already listed in index.html footer. The full brief should be manually pasted into the email if the short mailto URL is truncated for compatibility.

## Client journey
1. Client describes the need and expected experience in a short brief; a formal proposal is NOT required from the client.
2. Client sends the reviewed brief by email.
3. SLI owner manually screens the scope, follow-up requirements, prohibited confidential material and feasibility.
4. SLI searches for expert candidates according to the client's criteria on that engagement. **No claim of pre-enrolled experts**.
5. Obtain consent, verify expertise, check restrictions/conflicts and availability, then prepare shortlist and quotation.
6. Client approves the candidates, terms and fees before any paid interview or bespoke research.
7. Contracts, NDA, invoicing, report reviews and retention remain manually managed for MVP.

## DERGUBA: Discover / Analyze / Connect
- Discover source-qualified data, sectors, indicators, organizations and relevant documents.
- Analyze bounded questions with date/source/caveat, numeric and legal safeguards.
- Connect with a *separate* user-initiated link to a fresh form. No hidden forwarding of conversations, files or user-supplied source documents to Expert Connect.

## Exclusions, risks and next phase
- **Not shipped:** backend lead intake, database, owner CRM/inbox, authenticated client status tracker, expert registry, availability API, automated outreach, scheduling, payments or guaranteed SLAs.
- Never represent a contact as an SLI expert without explicit consent; verify expert compensation and any institutional restrictions.
- Do not solicit confidential, material non-public, privileged or third-party personal information via open form.
- Cloudflare D1 / Workers request intake requires privacy, retention/deletion, controller access, rate limits, bot protection, input checks, authentication, notifications and audit controls before activation.
- Data source reuse is governed by applicable rights and licences. Existing BPS/KKP/IDX validation and PSE/paid service gates remain separately open.
- The parent UX PR #197 is still draft, and DERGUBA commercial gate issue #206 is unresolved. Do NOT merge or deploy around those gates.

## Planned acceptance
- node --check js/sli-expert-connect.js
- node --test tests/qa-sli-expert-connect.mjs tests/qa-sli-navigation-ui.mjs (needs jsdom)
- node tests/qa-sli-connected-journey-browser.mjs
- node tests/qa-sli-expert-connect-browser.mjs (needs playwright-core + Chrome + localhost:8765)
- Visual inspection for mobile overflow, accurate EN/ID, form validity, honest "not submitted" states, and zero network POST from pilot form.

Rollback: remove Expert Connect page/assets and referring CTAs only. Preserve original source-linked dashboard and DERGUBA checks.

Related: #207 product pivot; #206 commercial gate; #197 integrated workspace.
