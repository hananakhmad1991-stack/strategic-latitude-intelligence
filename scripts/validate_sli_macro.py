#!/usr/bin/env python3
"""Validate sourced Indonesia macro indicators, frequency, units, WDI provenance."""
import json
from pathlib import Path
from datetime import datetime
ROOT=Path(__file__).resolve().parents[1]
snap=json.loads((ROOT/"data/sli-macro-indonesia-2026.json").read_text(encoding="utf-8"))
wdi=json.loads((ROOT/"data/sli-macro-worldbank-history.json").read_text(encoding="utf-8"))
cfg=json.loads((ROOT/"data/sli-macro-worldbank-config.json").read_text(encoding="utf-8"))
assert snap["country"]=="Indonesia" and snap["last_source_audit"]
assert len(snap["metrics"])>=15
assert len({m["id"] for m in snap["metrics"]})==len(snap["metrics"])
sources=snap["sources"]
assert all(s["url"].startswith("https://") and s["publisher"] for s in sources.values())
for m in snap["metrics"]:
 assert m["source_id"] in sources and m["unit"] and m["frequency"] and m["period"]
 assert "value" in m and isinstance(m["caveat"],str) and m["caveat"]
 assert (m["value"] is None)==(m["status"]=="awaiting_historical_dataset"),m["id"]
 assert m["value"] is None or (isinstance(m["value"],(int,float)) and not isinstance(m["value"],bool))
 assert m["status"] in {"official_current_release","awaiting_historical_dataset"}
assert snap["metrics"][0]["id"]=="real_gdp_growth"
assert next(m for m in snap["metrics"] if m["id"]=="fiscal_balance")["value"]<0
assert next(m for m in snap["metrics"] if m["id"]=="debt_gdp")["value"] is None
for s in snap["manual_series"]:
 assert s["source_id"] in sources
 assert s["frequency"] and s["unit"]
 dates=[p["period"] for p in s["points"]]
 assert dates==sorted(set(dates))
 assert all(isinstance(p["value"],(int,float)) for p in s["points"])
assert wdi["country"]=="IDN"
assert wdi["status"] in {"awaiting_initial_api_sync","updated","partial_update","all_sources_failed"}
defs={m["id"]:m for m in cfg["indicators"]}
assert len(defs)>=15
for key,series in wdi["series"].items():
 assert key in defs and series["indicator"]==defs[key]["code"]
 assert series["frequency"]=="annual" and series["unit"]==defs[key]["unit"]
 years=[p["year"] for p in series["points"]]
 assert len(years)>0 and years==sorted(set(years))
 assert min(years)>=1990 and max(years)<=2026
 assert all(isinstance(p["value"],(int,float)) for p in series["points"])
 for url in (series["source_url"],):
  assert url.startswith("https://api.worldbank.org/")
macro=(ROOT/"indonesia-macroeconomic-intelligence.html").read_text(encoding="utf-8")
overview_js=(ROOT/"js/sli-macro-overview.js").read_text(encoding="utf-8")
index=(ROOT/"index.html").read_text(encoding="utf-8")
assert "sli-macro-indonesia-2026.json" in macro and "sli-macro-worldbank-history.json" in macro
assert "initSLIMacroOverview" in overview_js and "sliMacroOverviewRoot" in index
assert "indonesia-macroeconomic-intelligence.html" in overview_js
assert "js/sli-macro-overview.js" in index
print(f"PASS {len(snap['metrics'])} dated indicators; {len(snap['manual_series'])} source-verified compact series; {len(wdi['series'])} annual WDI series")
