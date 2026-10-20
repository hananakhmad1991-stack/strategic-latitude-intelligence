#!/usr/bin/env python3
"""Regenerate the fact-linked company relationship browser from SLI source registries.

Only published, cited direct shareholder entries and explicitly reviewed
project actor names are included. No automatic ownership from a project text.
"""
import argparse
import datetime as dt
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCES = ["data/investment-ownership.json", "data/sli-project-registry.json"]
TARGET = ROOT / "data/sli-corporate-evidence-relationships.json"
PARTIES = {
"001": ["PT Aneka Tambang Tbk (ANTAM)", "Indonesia Battery Corporation (IBC)", "Ningbo Contemporary Brunp Lygend (CBL)"],
"002": ["Microsoft"],
"004": ["PT Vale Indonesia Tbk (INCO)", "PT Kolaka Nickel Indonesia (KNI)", "Huayou", "Ford"],
"005": ["PT Vale Indonesia Tbk (INCO)", "PT Bahodopi Nickel Smelting Indonesia (BNSI)", "GEM", "EcoPro"],
"006": ["PT Freeport Indonesia"],
"007": ["INPEX Masela", "PHE Masela", "PETRONAS Masela"],
"008": ["bp"],
"009": ["PT Pertamina Geothermal Energy Tbk"],
"010": ["PT Pertamina Geothermal Energy Tbk"],
"011": ["Equinix", "PT Astra International Tbk"],
"012": ["PT Chandra Asri Alkali (CAA)", "Danantara Indonesia", "Indonesia Investment Authority (INA)"],
"014": ["PT Daya Energi Bersih Nusantara (Denera)"],
"015": ["Microsoft"],
"016": ["Amazon Web Services (AWS)"],
"017": ["PT Nusantara Sembcorp Solar Energi", "PLN Nusantara Power", "Sembcorp Utilities"],
"018": ["PT Poso Energy"],
"019": ["PT Energi Bayu Jeneponto", "Vena Energy"],
"020": ["PT North Sumatra Hydro Energy"],
"022": ["PT Thorcon Power Indonesia"],
"023": ["PT PLN (Persero)", "Korea Hydro & Nuclear Power"],
"024": ["PLN Nusantara Power", "Masdar"],
"025": ["PT Pertamina Geothermal Energy Tbk"],
}

def is_aggregate(name):
    return bool(re.search(
        r"^(public|treasury|all other|other holders|other shareholders|public shareholder|public\s*/|public \(|saham treasury)|arithmetic remainder",
        name, re.IGNORECASE
    ))

def holder_kind(name):
    if is_aggregate(name):
        return "aggregate_not_entity"
    if re.search(r"^(Dato'|Garibaldi|Elaine)", name, re.I):
        return "person"
    if re.search(r"(^PT\b|Pte\.?|limited|inc\.?|corporation|MIND ID|group|minerals|Danantara|materials|Mitsubishi|Vale|Sumber Suryadaya)", name, re.I):
        return "organization"
    return "unspecified"

def build(ownership, projects, as_of):
    profiles = []
    for item in ownership["entities"]:
        url_list = [s["url"] for s in item.get("sources", []) if s.get("url", "").startswith("https://")]
        if not url_list:
            raise ValueError("Ownership profile has no HTTPS evidence: " + item["id"])
        profiles.append({
            "id": item["id"], "name": item["entity"],
            "reference_date": item.get("ownership_as_of"),
            "control_note": item.get("control"), "ownership_chain_note": item.get("ownership_chain"),
            "source_urls": url_list,
            "shareholders": [{
                "name": sh["name"], "reported_pct": sh.get("pct"),
                "basis": "direct_shareholding_reported_not_ultimate_beneficial_ownership",
                "holder_kind": holder_kind(sh["name"])
            } for sh in item.get("direct_shareholders", [])],
            "has_reported_percentages": bool(item.get("direct_shareholders"))
        })
    project_actors = []
    for p in projects["records"]:
        names = PARTIES.get(p["id"].rsplit("-", 1)[-1], [])
        for name in names:
            if not p.get("source_url", "").startswith("https://"):
                raise ValueError("Missing project source " + p["id"])
            project_actors.append({
                "name": name,
                "project_id": p["id"],
                "project_name": p["name"],
                "project_sector": p.get("sector"),
                "project_region": p.get("region"),
                "project_role_note": p.get("investor"),
                "source_url": p["source_url"],
                "source_date": p.get("evidence_date"),
                "verification": p.get("verification_class"),
                "relationship": "reported_project_participant_not_equity_shareholder"
            })
    names = (
        {r["name"] for r in profiles} |
        {x["name"] for r in profiles for x in r["shareholders"] if x["holder_kind"] != "aggregate_not_entity"} |
        {p["name"] for p in project_actors}
    )
    return {
        "schema": "sli-corporate-evidence-relationships-v1",
        "generated_from": SOURCES,
        "as_of": as_of,
        "policy": "Cited reported direct equity percentages belong to their individual source period and do not imply ultimate beneficial control. Project actor mentions denote reported participation, NOT equity. Public-float and treasury aggregates must not become legal entities. Validate contemporary status against source.",
        "coverage": {
            "ownership_profiles": len(profiles),
            "direct_shareholders": sum(len(p["shareholders"]) for p in profiles),
            "non_aggregate_shareholders": sum(sum(x["holder_kind"] != "aggregate_not_entity" for x in p["shareholders"]) for p in profiles),
            "project_participation_links": len(project_actors),
            "distinct_observed_names": len(names),
        },
        "ownership_profiles": profiles,
        "project_participations": project_actors,
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    a, b = (json.loads((ROOT / x).read_text("utf-8")) for x in SOURCES)
    old = json.loads(TARGET.read_text("utf-8"))
    current = build(a, b, old["as_of"] if args.check else dt.datetime.now(dt.timezone.utc).date().isoformat())
    if args.check:
        if current != old:
            raise SystemExit("Corporate relationship evidence is out of sync with underlying SLI sources")
        print("Validated", current["coverage"])
        return
    # Date is changed only when the source-derived evidence actually changes.
    if {k:v for k,v in old.items() if k!="as_of"} == {k:v for k,v in current.items() if k!="as_of"}:
        print("No evidence change; keeping last cited snapshot");return
    text = json.dumps(current, ensure_ascii=False, indent=2) + "\n"
    temp = TARGET.with_suffix(".json.tmp")
    temp.write_text(text, encoding="utf-8")
    temp.replace(TARGET)
    print("Regenerated", current["coverage"])

if __name__ == "__main__":
    main()
