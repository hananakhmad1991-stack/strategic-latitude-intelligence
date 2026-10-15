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
          "Mixed implementation", "Commissioning", "Operational", "Suspended", "Site evaluation", "MoU only"}
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

    assets = read("investment-operator-assets.json")
    sector_names = {"Oil & Gas", "Coal", "Minerals", "Smelters & Processing", "Biofuels & Bioenergy", "Renewable Energy", "Electric Vehicles", "AI / Data Center", "Solar PV", "Hydropower & Storage", "Wind", "Nuclear (New Energy)"}
    allowed_asset_stages = {"Operational", "Under construction", "Announced / development",
                            "MoU / power expansion", "Agreement / proposal", "MoU only",
                            "Programme / mandate", "Historical operating evidence", "Retail / commercial sales", "Site evaluation approval"}
    asset_ids = set()
    for asset in assets.get("records", []):
        key = asset.get("id", "?")
        if key in asset_ids:
            fail(f"{key}: duplicate cross-sector asset ID")
        asset_ids.add(key)
        if asset.get("sector") not in sector_names or asset.get("stage") not in allowed_asset_stages:
            fail(f"{key}: unknown sector or implementation stage")
        if not https(asset.get("source_url")):
            fail(f"{key}: missing source for operator / concession")
        if not asset.get("operator") or not asset.get("affiliation"):
            fail(f"{key}: operator and country affiliation required")
        if asset.get("ownership_ref") and asset["ownership_ref"] not in owner_ids:
            fail(f"{key}: bad ownership dossier connection")
        for field in ("production", "capacity", "investment"):
            value = asset.get(field)
            if value is not None and value.get("value", value.get("amount")) is not None:
                if not https(value.get("source_url")):
                    fail(f"{key}: {field} numerical claim missing source")
                if field == "production" and not value.get("scope"):
                    fail(f"{key}: production does not identify asset/company scope")
                if field == "production" and not value.get("period"):
                    fail(f"{key}: production does not identify reporting period")
                if field == "investment" and not value.get("basis"):
                    fail(f"{key}: investment is missing classification of capital basis")
        if asset.get("stage") in {"MoU only", "MoU / power expansion"} and asset.get("production"):
            fail(f"{key}: MoU-only row must not claim operating production")
        if asset.get("sector") == "AI / Data Center" and asset.get("legal", "").startswith("PSC"):
            fail(f"{key}: digital asset incorrectly presented as upstream PSC")
        if asset.get("contract_end") and not asset.get("contract_end_status"):
            fail(f"{key}: disclosed expiry missing legal qualification")

    plan = assets.get("ruptl_2025_2034", {})
    if plan:
        if not plan.get("planning_not_operational") or not https(plan.get("source_url")):
            fail("RUPTL source/planning classification invalid")
        for item in plan.get("capacity_GW", []):
            if not item.get("technology") or item.get("value", -1) < 0:
                fail("RUPTL technology plan missing scope or capacity")
    nuclear_projects = [item for item in assets.get("records", [])
                        if item.get("sector") == "Nuclear (New Energy)"]
    for item in nuclear_projects:
        if item.get("stage") == "Operational":
            fail(f"{item.get('id')}: nuclear operational claim needs independent reactor operation licence verification")
        if item.get("production"):
            fail(f"{item.get('id')}: nuclear non-operating record cannot report delivered generation")
    for item in assets.get("records", []):
        if item.get("id") == "storage-cisokan-1040" and item.get("production"):
            fail("Pumped storage planning must not be reported as source of net renewable electricity")

    actor_data = read("investment-actors-ev-events.json")
    asset_ids = {item.get("id") for item in assets.get("records", [])}
    names = set()
    for actor in actor_data.get("actors", []):
        name = actor.get("name")
        if not name or name in names:
            fail(f"Actor duplicate or missing name: {name}")
        names.add(name)
        if not https(actor.get("source_url")) or not actor.get("evidence_date"):
            fail(f"{name}: no source or as-of evidence")
        for asset in actor.get("asset_ids", []):
            if asset not in asset_ids:
                fail(f"{name}: linked asset not in asset registry: {asset}")
        if "beneficial owner" in actor.get("role_type", "").lower() and not actor.get("bo_verified_filing"):
            fail(f"{name}: unsupported BO role")
    for brand in actor_data.get("brands", []):
        if not brand.get("origin") or not brand.get("models") or not https(brand.get("source_url")):
            fail(f"{brand.get('brand')}: missing origin, model proof or source")
        if brand.get("asset_ref") not in asset_ids:
            fail(f"{brand.get('brand')}: no linked facility/dossier")
    for event in actor_data.get("corporate_events", []):
        if not https(event.get("source_url")) or not event.get("event_status"):
            fail(f"Corporate action lacks dated evidence: {event.get('headline')}")
        if event.get("verified_price_reaction") and not https(event.get("price_data_source")):
            fail(f"Market event has unverified share-price sentiment: {event.get('headline')}")

    for benchmark in assets.get("macro_sector_benchmarks", []):
        if not benchmark.get("period") or not benchmark.get("classification") or not https(benchmark.get("source_url")):
            fail(f"National bioenergy / EBT benchmark missing time or original source: {benchmark.get('indicator')}")

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
          f"{len(evidence.get('corporate_capex', []))} group capex records, "
          f"{len(assets.get('records', []))} cross-sector operator assets. "
          "Sources and financial-scope labels structurally consistent.")
    print("NOTE: Source URLs and publication facts are not reverified by this offline QA.")

if __name__ == "__main__":
    main()
