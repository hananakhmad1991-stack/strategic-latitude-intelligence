#!/usr/bin/env python3
"""Source/status/linkage and methodological integrity gates for SLI Policy & Risk."""
import json
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT/"data/sli-policy-regulatory-graph-2026.json").read_text(encoding="utf-8"))
nodes = data["nodes"]
node_ids = {n["id"] for n in nodes}
assert len(nodes) == len(node_ids), "Duplicate legal instrument ids"
assert len(nodes) >= 35, "Register unexpectedly shrank"
required_sectors = {"energy","electricity","oilgas","minerba","environment","digital","carbon","cross"}
assert required_sectors.issubset({n["sector"] for n in nodes})
required_tiers = {"constitutional","tap","uu","pp","perpres","perda","permen","decision","dirjen","technical"}
assert required_tiers.issubset({n["tier"] for n in nodes})
assert all(n.get("status") and n.get("ref") and n.get("label") for n in nodes)
assert all(n["source"].startswith("https://") for n in nodes)
assert all(n.get("note") for n in nodes)
for edge in data["edges"]:
    assert edge["from"] in node_ids and edge["to"] in node_ids, edge
    assert edge["from"] != edge["to"], edge
types = Counter(e["type"] for e in data["edges"])
assert "repeals" in types and "compliance_check" in types and "implements" in types
lookup = {n["id"]:n for n in nodes}
assert lookup["pp5old"]["status"]=="repealed"
assert lookup["pp79old"]["status"]=="repealed"
assert lookup["perdirjen2007"]["status"]=="archival_not_verified"
assert lookup["kepmen188"]["status"]=="issued_plan_not_commissioned"
assert lookup["keppres41batam"]["status"]=="archival_not_verified"
assert lookup["perda_kepri"]["source"].startswith("https://jdih.kepriprov.go.id/")
assert data["methodology"]["ria_lite"]["purpose"]
dimensions = data["methodology"]["ria_lite"]["dimensions"]
weights = {x["id"]:x["weight"] for x in dimensions}
assert abs(sum(weights.values())-1.0)<1e-8
assert all(0 < w < 1 for w in weights.values())
for case in data["cases"]:
    assert all(k in node_ids for k in case["basis"]),case["id"]
    assert set(x["id"] for x in case["issues"])==set(weights)
    assert all(1<=x["exposure"]<=5 and x["mitigation"] and x["reason"] for x in case["issues"])
    score=sum(weights[x["id"]]*(x["exposure"]-1)/4*100 for x in case["issues"])
    assert 0<=score<=100
    print(f"RIA-lite {case['id']}: {score:.1f}/100 (unvalidated scenario)")
html=(ROOT/"policy-regulatory-intelligence.html").read_text(encoding="utf-8")
assert "data/sli-policy-regulatory-graph-2026.json" in html
assert "new Function(" not in html, "Avoid dynamic script evaluation in dashboard"
for path in ("index.html","js/research-chapters.js","ai-intelligence-hub.html"):
    assert "policy-regulatory-intelligence.html" in (ROOT/path).read_text(encoding="utf-8"),path
print(f"PASS {len(nodes)} regulations, {len(data['edges'])} typed edges, {len(data['cases'])} cases")
