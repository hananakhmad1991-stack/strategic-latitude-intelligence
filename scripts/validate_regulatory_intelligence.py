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
assert len(nodes) >= 153, "Regulatory source graph unexpectedly shrank"
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
for k in ("perda_sulsel_cpp2025","perda_sulsel_rpplh2024","perda_sulsel_rtrw2022","perda_sulsel_pdrd2024"):
    assert k in lookup and lookup[k]["region"]=="Sulawesi Selatan" and lookup[k]["source"].startswith("https://jdih.sulselprov.go.id/dokumen/"), k
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

# Fiscal replacement and Bengkulu amendment must remain distinguishable.
assert lookup["pp10pdrdold2021"]["status"]=="repealed"
assert lookup["pp35hkpd2023"]["status"]=="check_current"
assert lookup["perda_bengkulu_pdrd2023"]["status"]=="amended"
assert lookup["perda_bengkulu_pdrd2026"]["status"]=="amending_instrument"
for parent,successor,kind in (("pp35hkpd2023","pp10pdrdold2021","repeals"),("perda_bengkulu_pdrd2023","perda_bengkulu_pdrd2026","amended_by")):
    assert any(e["from"]==parent and e["to"]==successor and e["type"]==kind for e in data["edges"])
# Provincial directory coverage must distinguish source discovery from verified law text.
coverage = json.loads((ROOT/"data/sli-policy-source-coverage.json").read_text(encoding="utf-8"))
assert len(coverage["provinces"]) == 38
with_portal = [p for p in coverage["provinces"] if p.get("source_url")]
assert len(with_portal) >= 29, "Verified province portal discovery unexpectedly regressed"
assert all(p["source_url"].startswith("https://") for p in with_portal)
assert all(p["discovery_status"] != "not_yet_confirmed" for p in with_portal)
assert any(p["name"]=="Sulawesi Selatan" and p.get("source_url","").startswith("https://jdih.sulselprov.go.id/") for p in with_portal)
# Additive regional/cyber wave (October 2026): preserve official provenance and older law lifecycle.
for k in ("pres82iiv2022","pres47cyber2023","bssn5iiv2025","pojk51sustain2017","pp42psn2021","perda_jateng_rtrw2024","perda_magelang_rtrw2024","perda_magelang_rtrwold2011","perda_banten_rtrw2023","perda_diy_rtrw2023","perda_diy_pangan2026","perda_bali_rtrw2023","perda_kaltim_rtrw2023","perda_lampung_rtrw2023","perda_ntb_rtrw2024","perda_ntb_invest2024","perda_karawang_rtrw2013","kepmen88papuabaratdaya2026"):
    assert k in lookup and lookup[k]["source"].startswith("https://") and lookup[k].get("source_checked_at"), k
assert lookup["perda_magelang_rtrwold2011"]["status"]=="repealed"
assert lookup["perda_magelang_rtrw2024"]["region"]=="Kabupaten Magelang, Jawa Tengah"
assert lookup["pojk51sustain2017"]["status"]=="check_current", "OJK 2026 draft proposal is not an enacted POJK amendment"
assert any(e["from"]=="perda_magelang_rtrw2024" and e["to"]=="perda_magelang_rtrwold2011" and e["type"]=="supersedes_noncurrent_record" for e in data["edges"])
local_sources = coverage.get("local_government_sources", [])
assert len(local_sources)>=4, "Municipal JDIH sources missing"
assert all(s.get("region") and s.get("province") and s.get("source_url","").startswith("https://") for s in local_sources)
assert {s["region"] for s in local_sources}.issuperset({"Kabupaten Magelang","Kabupaten Karawang","Kabupaten Bekasi","Kota Batam"})
watch_config = json.loads((ROOT/"data/regulatory-monitor-sources.json").read_text(encoding="utf-8"))
assert len(watch_config["watched_laws"]) == len(set(watch_config["watched_laws"])), "Duplicate watched legal instrument"
assert set(("uu4p2sk2026","permendag19pmse2026","perpres83bgn","perda_dki_rtrw2024")).issubset(watch_config["watched_laws"])
assert all(w in node_ids for w in watch_config["watched_laws"]), "Watched law not in legal graph"
assert len(watch_config["watched_laws"])>=95
assert len(watch_config["listing_sources"])>=36
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
