#!/usr/bin/env python3
"""Validate policy evaluation scope and evidence gates, not assert causal policy success."""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/"data/sli-public-policy-evaluation-2026.json").read_text(encoding="utf-8"))
graph=json.loads((ROOT/"data/sli-policy-regulatory-graph-2026.json").read_text(encoding="utf-8"))
methods={m["id"] for m in data["methodology"]["methods"]}
criteria={c["id"] for c in data["methodology"]["dunn_criteria"]}
source_ids={s["id"] for s in data["methodology"]["source_catalog"]}
refs={n["id"] for n in graph["nodes"]}
cases=data["profiles"]
assert len(cases)>=8 and len({p["id"] for p in cases})==len(cases)
assert {"electricity_grid","renewables","minerba","wto_trade","oss_licensing","energy_policy"}.issubset({p["id"] for p in cases})
assert data["notice"].lower().find("not completed field evaluations")>=0
for p in cases:
    assert p["stage"] in {"ex_ante","during","ex_post"},(p["id"],"invalid phase")
    assert p["refs"] and set(p["refs"]).issubset(refs),(p["id"],"legal source missing")
    assert set(p["source_data_refs"]).issubset(source_ids),(p["id"],"evidence source missing")
    assert 2<=len(p["methods"])<=8 and len({m["id"] for m in p["methods"]})==len(p["methods"])
    assert set(m["id"] for m in p["methods"]).issubset(methods)
    assert all(m["usage"] in {"priority","conditional","deferred"} and m["why"] for m in p["methods"])
    assert len(p["criteria"])>=2 and len({c["criterion"] for c in p["criteria"]})==len(p["criteria"])
    assert set(c["criterion"] for c in p["criteria"]).issubset(criteria)
    assert all(c["assessment"] and c["missing_evidence"] for c in p["criteria"])
    assert all(c["evidence_level"] in {"not_yet_due","insufficient","design_inference","not_applicable"} for c in p["criteria"])
    assert all(p["pathway"][key] for key in ("input","activities","output","outcome","impact","causal_warning"))
    assert p["finding"] and p["evidence_gate"] and len(p["priority_actions"])>=3
    assert len(p["indicators"])>=2
    for i in p["indicators"]:
        assert i["source_id"] in source_ids
        assert i["name"] and i["unit"] and i["notes"]
        assert "actual" in i and "target" in i and "baseline" in i
        # Every actual result is explicitly null in this preliminary assessment.
        # Future values must be accompanied by verifiable target-equivalent sources,
        # year, unit, geography and provenance before this guard is relaxed.
        assert i["actual"] is None,(p["id"],i["name"],"unverified actual introduced")
    if p["id"]=="wto_trade":
        assert p["policy_type"]=="external_dispute_watch"
        assert all(c["evidence_level"]=="not_applicable" for c in p["criteria"])
        assert "ds592" in p["refs"]
    if p["id"]=="electricity_grid":
        assert any(i["target"]==69512 and i["unit"]=="MW" for i in p["indicators"])
        assert any(i["baseline"]==72655.85 and i["unit"]=="circuit-km" for i in p["indicators"])
page=(ROOT/"policy-impact-evaluation.html").read_text(encoding="utf-8")
assert "data/sli-public-policy-evaluation-2026.json" in page
assert "data/sli-policy-regulatory-graph-2026.json" in page
assert "belum dapat dinilai" in page.lower()
assert "i.actual===null" in page
for path in ("index.html","js/research-chapters.js","policy-regulatory-intelligence.html","policy-sector-ria.html"):
    assert "policy-impact-evaluation.html" in (ROOT/path).read_text(encoding="utf-8"),path
print("PASS:",len(cases),"assessment profiles,",sum(len(p["indicators"]) for p in cases),
      "indicators,",sum(len(p["criteria"]) for p in cases),"Dunn selections;",
      "all outcome actuals intentionally unverified")
