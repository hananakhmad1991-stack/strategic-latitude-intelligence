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
          "Commissioning", "Operational", "Suspended"}
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
