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
# 2026 expansion safeguards — each must exist, provenance must be HTTPS, and amendment links must remain explicit.
for k in ("uu11ite","uu19ite","uu1ite2024","pp71pste","pp80pmse","permendag31pmse","permendag19pmse2026","perpres39onedata","perpres95spbe","perpres132spbe","pp12daerah","permendagri77daerah","permendagri90daerah","perpres10invest","perpres49invest","perpres66bapanas","perpres83bgn","perpres125cpp","uu22budidaya","perpres55minerba","uu7hpp","uu4p2sk","uu4p2sk2026"):
    assert k in lookup and lookup[k]["source"].startswith("https://peraturan.bpk.go.id/Details/"), k
assert lookup["permendag31pmse"]["status"]=="repealed"
for parent, successor, rel in (("uu4p2sk","uu4p2sk2026","amended_by"),("perpres10invest","perpres49invest","amended_by"),("perpres66bapanas","perpres83bgn","partially_repealed_by"),("permendag19pmse2026","permendag31pmse","repeals"),("uu11ite","uu1ite2024","amended_by")):
    assert any(e["from"]==parent and e["to"]==successor and e["type"]==rel for e in data["edges"]), (parent, successor, rel)
assert lookup["perdirjen2007"]["status"]=="archival_not_verified"
assert lookup["kepmen188"]["status"]=="issued_plan_not_commissioned"
assert lookup["keppres41batam"]["status"]=="archival_not_verified"
assert lookup["perda_kepri"]["source"].startswith("https://jdih.kepriprov.go.id/")
# Baseline national climate/otonomi/fiscal laws and selected current provincial law must stay discoverable.
for k in ("uu16paris","uu23local","uu1hkpd2022","uu1penyesuaian2026","pres110carbon","pres98repealed","perda_dki_rtrw2024","perda_jabar_rtrw2022","perda_dki_pdrd2024"):
    assert k in lookup and lookup[k].get("source","").startswith("https://"), k
assert lookup["pres98repealed"]["status"]=="repealed"
assert lookup["pp39minerba"]["source"]=="https://peraturan.bpk.go.id/Details/331105/pp-no-39-tahun-2025"
assert any(e["from"]=="pp96min" and e["to"]=="pp39minerba" and e["type"]=="amended_by" for e in data["edges"])
assert any(e["from"]=="uu23local" and e["to"]=="uu1hkpd2022" and e["type"]=="partially_repealed_by" for e in data["edges"])
assert any(e["from"]=="pres110carbon" and e["to"]=="pres98repealed" and e["type"]=="repeals" for e in data["edges"])
assert all(lookup[k]["region"]!="Indonesia" for k in ("perda_dki_rtrw2024","perda_jabar_rtrw2022","perda_bekasi"))

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
assert "js/sli-regulatory-explorer.js" in html and "css/sli-regulatory-explorer.css" in html, "Missing reader-first canonical explorer"
assert "new Function(" not in html, "Avoid dynamic script evaluation in dashboard"
for element in ('id="query"','id="topic"','id="region"','id="tier"','id="status"','id="lawResults"','id="details"','data-tab="changes"','data-tab="regional"','data-tab="alerts"'):
    assert element in html, element
explorer=(ROOT/"js/sli-regulatory-explorer.js").read_text(encoding="utf-8")
assert "sli-policy-regulatory-graph-2026.json" in explorer
assert "regulatory-monitor.json" in explorer
assert "partially_repealed_by" in explorer
assert "history.replaceState" in explorer, "Selected legal instrument must be deep-linkable"
assert "sli-regulatory-monitor-root" not in html, "Redundant monitoring panel must be removed"
assert all(k in lookup for k in ("inpres1_2025","inpres14_2025","inpres16_2025","uu7wto","ds592","icsid","newyork","eu_cbam","eu_crma","eu_batteries","us_bis_ear"))
assert all(lookup[k]["tier"]=="inpres" for k in ("inpres1_2025","inpres14_2025","inpres16_2025"))
assert all(lookup[k]["tier"] in ("international","foreignlaw") for k in ("gattxi","icsid","eu_cbam","us_bis_ear"))
assert lookup["ds592"]["status"]=="dispute_appealed_not_final"
deep=json.loads((ROOT/"data/sli-sector-regulatory-ria-deepdives.json").read_text(encoding="utf-8"))
case_ids={c["id"] for c in data["cases"]}
assert case_ids==set(deep["cases"])
for cid,sector in deep["cases"].items():
    assert sector["policy_options"] and len(sector["policy_options"])>=3
    assert len(sector["indicators"])>=5 and len(sector["chain"])>=5
    assert sector["stakeholders"] and sector["sector_note"]
sector_html=(ROOT/"policy-sector-ria.html").read_text(encoding="utf-8")
assert "sli-sector-regulatory-ria-deepdives.json" in sector_html
assert "sli-policy-regulatory-graph-2026.json" in sector_html
monitor_html=(ROOT/"js/regulatory-monitor-dashboard.js").read_text(encoding="utf-8")
assert "raw.githubusercontent.com" in monitor_html and "policy-monitor-group" in monitor_html
for path in ("index.html","js/research-chapters.js","ai-intelligence-hub.html"):
    assert "policy-regulatory-intelligence.html" in (ROOT/path).read_text(encoding="utf-8"),path
print(f"PASS {len(nodes)} regulations, {len(data['edges'])} typed edges, {len(data['cases'])} cases")
