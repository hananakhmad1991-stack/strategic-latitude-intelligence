#!/usr/bin/env python3
"""Investment data integrity QA — no external dependencies, no network access.
Tests source provenance, entity links, stage taxonomy and financial-scope boundaries.
Not a substitute for checking original documents or live deployment.
"""
import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STAGES = {"Announced", "Permitted", "Early works", "Financed", "Under construction",
          "Mixed implementation", "Commissioning", "Operational", "Suspended"}
today = dt.date.today()
issues = []

def read(name):
    return json.loads((ROOT / "data" / name).read_text(encoding="utf-8"))

def fail(message):
    issues.append(message)

def https(url):
    return isinstance(url, str) and url.startswith("https://")

def main():
    evidence = read("investment-evidence.json")
    ownership = read("investment-ownership.json")
    projects = evidence.get("projects", [])
    entities = ownership.get("entities", [])
    owner_ids = {e.get("id") for e in entities}
    if len(owner_ids) != len(entities):
        fail("Duplicate ownership entity IDs")
    if len({p.get("name") for p in projects}) != len(projects):
        fail("Duplicate project names")

    for p in projects:
        key = p.get("name", "?")
        if p.get("stage") not in STAGES:
            fail(f"{key}: invalid implementation stage")
        if not https(p.get("source_url")):
            fail(f"{key}: no primary source URL")
        if p.get("ownership_ref") and p["ownership_ref"] not in owner_ids:
            fail(f"{key}: ownership dossier link missing")
        if p.get("reported_amount") is not None and p["reported_amount"] < 0:
            fail(f"{key}: negative investment reported")
        if p.get("capex_realized") is not None and not https(p.get("capex_realized_source")):
            fail(f"{key}: confirmed project realization without source evidence")
        if p.get("amount_type", "").startswith("Realized") and p.get("capex_realized") is None:
            fail(f"{key}: incorrectly classified announced figure as realized capex")
        if not p.get("next_step"):
            fail(f"{key}: missing verification milestone")

    for commitment in evidence.get("capital_commitment_ledger", []):
        key = commitment.get("project", "unknown")
        if not https(commitment.get("source")):
            fail(f"{key}: conditional funding commitment has no primary source")
        if commitment.get("total_usd_million", 0) > commitment.get("total_project_usd_million", 0):
            fail(f"{key}: financing component exceeds project total")
        if commitment.get("paid_in_capital_verified") is not None and not https(
                commitment.get("paid_in_capital_source")):
            fail(f"{key}: claimed paid-in capital lacks verified document")

    for entity in entities:
        key = entity.get("id", "?")
        direct = entity.get("direct_shareholders", [])
        psc = entity.get("contract_interests", [])
        if direct and psc:
            fail(f"{key}: cannot display PSC interests as company shares simultaneously")
        holders = psc if psc else direct
        if holders and abs(sum(float(h.get("pct", 0)) for h in holders) - 100) > 0.21:
            fail(f"{key}: shareholder or PSC shares do not sum to approximately 100")
        if holders and not entity.get("sources"):
            fail(f"{key}: unreferenced equity cap table")
        if any(not https(s.get("url")) for s in entity.get("sources", [])):
            fail(f"{key}: invalid source link")
        bo = entity.get("beneficial_owner", {})
        if bo.get("natural_person") and not bo.get("verified_primary_evidence"):
            fail(f"{key}: natural person asserted as BO without document-specific evidence")
        if psc and not any("PSC" in str(s.get("label", "")) or "Tangguh" in str(s.get("label", ""))
                           or "INPEX" in str(s.get("label", "")) for s in entity.get("sources", [])):
            fail(f"{key}: contract interest requires explicit operator/PSC source")

    sector = read("investment-sector-evidence.json")
    years = sector.get("sector_history", [])
    if not years or sorted(r["year"] for r in years) != list(range(2019, 2026)):
        fail("ESDM series should contain the dated 2019–2025 full years")
    if years and abs(years[-1].get("total", 0)-31.96) > 0.001:
        fail("ESDM 2025 headline investment total changed without review")
    for record in years:
        for key in ("migas", "minerba", "ebt", "power", "total"):
            if record.get(key, -1) < 0:
                fail(f"ESDM {record.get('year')}: invalid {key} amount")
    if not https(sector.get("sector_source", {}).get("url")):
        fail("ESDM history is missing official-source URL")
    mineral = sector.get("minerba_2025", {})
    if not https(mineral.get("source", {}).get("url")):
        fail("Minerba 2025 licence table is missing official-source URL")
    for deal in sector.get("deal_register", []):
        if not https(deal.get("source")):
            fail("Deal register lacks official-source evidence")
        if deal.get("type") == "Managed assets / AUM stock" and deal.get("actual_paid") is not None:
            fail("AUM stock cannot itself be coded as actual investment cash paid")
        if deal.get("type", "").startswith("Outbound") and deal.get("country_of_asset") == "Indonesia":
            fail("Outbound investment misclassified as Indonesian asset investment")

    for observation in evidence.get("corporate_capex", []):
        key = observation.get("entity", "?")
        if not https(observation.get("source")) or not observation.get("geographic_scope"):
            fail(f"{key}: corporate capex lacks document source or geographic scope")
        items = observation.get("components", [])
        if items and abs(sum(v.get("usd_million", 0) for v in items) -
                         observation.get("actual_usd_million", 0)) > .1:
            fail(f"{key}: components differ from company disclosed total")

    if issues:
        print("\n".join("ERROR: " + x for x in issues))
        raise SystemExit(1)
    print(f"PASS: {len(projects)} projects, {len(entities)} ownership / PSC entities, "
          f"{len(evidence.get('corporate_capex', []))} group capex records. "
          "Sources and financial-scope labels structurally consistent.")
    print("NOTE: Source URLs and publication facts are not reverified by this offline QA.")

if __name__ == "__main__":
    main()
